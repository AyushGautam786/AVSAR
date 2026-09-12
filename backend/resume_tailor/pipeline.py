"""
AVSAR — Resume Tailoring Pipeline
===================================
Phases:
  1. Extract text from .pdf or .docx
  2. Parse JD keywords via LLM
  3. Score resume against JD (ATS keyword coverage)
  4. Rewrite resume bullets via LLM (hard no-fabrication constraint)
  5. Fabrication guard — flag new named entities introduced by the LLM
  6. Render ATS-safe .docx output

CRITICAL RULE (hardcoded into the rewrite prompt):
  The rewrite may ONLY rephrase/re-emphasis experience the user ALREADY has.
  It must NEVER invent skills, employers, dates, metrics, or achievements.
"""

import json
import logging
import os
import re
import tempfile
from pathlib import Path

log = logging.getLogger(__name__)


# ── 1. Text extraction ────────────────────────────────────────────────────────

def extract_text(file_path: str) -> str:
    """Extract raw text from a .pdf, .docx, or .txt file."""
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".docx":
        try:
            import docx
            doc = docx.Document(str(path))
            return "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        except Exception as exc:
            log.warning("docx extraction failed: %s", exc)
            return ""

    elif suffix == ".pdf":
        text = ""
        # 1. Try pdfplumber first
        try:
            import pdfplumber
            with pdfplumber.open(str(path)) as pdf:
                pages = [page.extract_text() or "" for page in pdf.pages]
                text = "\n".join(pages).strip()
        except Exception as exc:
            log.warning("pdfplumber failed: %s", exc)

        # 2. Fallback to pypdf if pdfplumber failed or produced empty text
        if not text:
            try:
                import pypdf
                reader = pypdf.PdfReader(str(path))
                pages = [page.extract_text() or "" for page in reader.pages]
                text = "\n".join(pages).strip()
            except Exception as exc:
                log.warning("pypdf extraction failed: %s", exc)

        return text

    elif suffix in (".txt", ".md"):
        try:
            with open(str(path), "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        except Exception as exc:
            log.warning("txt extraction failed: %s", exc)
            return ""

    else:
        raise ValueError(f"Unsupported file type: {suffix}. Accepted: .docx, .pdf, .txt")


def parse_resume_sections(resume_text: str) -> dict:
    """
    Roughly segment resume into sections using common heading patterns.
    Returns a dict like {experience: [...], education: [...], skills: [...], ...}
    """
    section_patterns = [
        r"\b(experience|work experience|employment|professional experience)\b",
        r"\b(education|academic background|qualifications)\b",
        r"\b(skills|technical skills|core competencies|technologies)\b",
        r"\b(projects|personal projects|key projects)\b",
        r"\b(certifications|certificates|awards|achievements)\b",
        r"\b(summary|objective|profile|about me)\b",
    ]
    combined = "|".join(section_patterns)
    lines = resume_text.split("\n")
    sections: dict[str, list[str]] = {}
    current_section = "header"
    sections[current_section] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if re.search(combined, stripped, re.IGNORECASE) and len(stripped) < 60:
            current_section = stripped.lower()
            sections[current_section] = []
        else:
            sections.setdefault(current_section, []).append(stripped)

    return sections


# ── 2. JD keyword extraction via LLM ─────────────────────────────────────────

def parse_jd_keywords(jd_text: str) -> list[str]:
    """
    Use the LLM to extract a structured list of skills/keywords from a JD.
    Returns a list of lowercase keyword strings.
    """
    from resume_tailor.llm_client import chat

    system = (
        "You are a technical recruiter. Extract all skills, tools, technologies, "
        "and domain keywords from the job description below. "
        "Return ONLY a JSON array of strings — no explanation, no markdown. "
        'Example: ["Python", "SQL", "Machine Learning", "REST APIs"]'
    )
    try:
        response = chat(system, jd_text, max_tokens=500)
        # Parse JSON from the response
        match = re.search(r"\[.*?\]", response, re.DOTALL)
        if match:
            keywords = json.loads(match.group())
            return [kw.strip() for kw in keywords if isinstance(kw, str) and kw.strip()]
    except Exception as exc:
        log.warning("LLM JD keyword parsing failed: %s — falling back to regex.", exc)

    # Regex fallback: extract capitalized tokens as a rough proxy
    tokens = re.findall(r"\b[A-Z][a-zA-Z0-9#+.]{1,}\b", jd_text)
    common_words = {"The", "This", "That", "With", "For", "And", "Or", "To", "In", "Of", "At", "We", "You"}
    return sorted(set(t for t in tokens if t not in common_words))[:40]


# ── 3. ATS score ──────────────────────────────────────────────────────────────

def ats_score(resume_text: str, jd_keywords: list[str]) -> float:
    """
    Keyword coverage score: what percentage of JD keywords appear in the resume.
    Returns 0.0–100.0.
    """
    if not jd_keywords:
        return 0.0
    text_lower = resume_text.lower()
    hits = sum(1 for kw in jd_keywords if kw.lower() in text_lower)
    return round(100 * hits / len(jd_keywords), 1)


# ── 4. Resume bullet rewrite ──────────────────────────────────────────────────

_REWRITE_SYSTEM_PROMPT = """
You are an expert resume writer helping students tailor their resume for a specific internship.

HARD RULES — violating these makes the output harmful, not helpful:
1. You may ONLY rephrase or reframe experience the student ALREADY has.
2. You must NEVER add a skill, tool, company name, metric, date, or achievement
   that is not already present in the original resume text.
3. Use action verbs and the JD's terminology where it truthfully applies.
4. Each rewritten bullet must be grounded in something present in the original.
5. Return the SAME number of bullets — do not add or remove points.
6. Return ONLY valid JSON — no markdown, no explanation.

Output format:
{
  "rewritten_sections": {
    "<section_name>": ["bullet 1", "bullet 2", ...]
  }
}
""".strip()


def rewrite_bullets(
    resume_sections: dict,
    jd_keywords: list[str],
    jd_text: str,
) -> dict:
    """
    Calls the LLM to rephrase resume bullets to surface JD-relevant experience.
    Returns rewritten sections in the same dict structure.

    IMPORTANT: This function does NOT fabricate — see the system prompt.
    The fabrication guard in check_no_fabrication() provides a second layer of defense.
    """
    from resume_tailor.llm_client import chat

    # Limit context size to avoid token limit issues
    sections_str = json.dumps(resume_sections, indent=2)[:6000]
    keywords_str = ", ".join(jd_keywords[:50])

    user_msg = f"""
TARGET JD KEYWORDS: {keywords_str}

JD SUMMARY (first 500 chars):
{jd_text[:500]}

ORIGINAL RESUME SECTIONS (JSON):
{sections_str}

Rewrite the resume bullets to emphasize experience that matches the JD keywords.
Remember: only rephrase what is already there. Return valid JSON only.
""".strip()

    try:
        response = chat(_REWRITE_SYSTEM_PROMPT, user_msg, max_tokens=3000)
        # Extract JSON from response
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            data = json.loads(match.group())
            return data.get("rewritten_sections", resume_sections)
    except Exception as exc:
        log.error("LLM bullet rewrite failed: %s — returning original.", exc)

    return resume_sections  # safe fallback


# ── 5. Fabrication guard ──────────────────────────────────────────────────────

def check_no_fabrication(original_text: str, rewritten_text: str) -> list[str]:
    """
    Flags capitalized multi-word tokens (likely tool/company/skill names)
    that appear in the rewrite but NOT in the original resume.

    Returns a list of suspicious new entities for human review.
    If empty, no fabrication was detected.
    """
    # Capture capitalized tokens ≥3 chars (likely proper nouns / tool names)
    pattern = r"\b[A-Z][a-zA-Z0-9+.]{2,}\b"
    orig_entities = set(re.findall(pattern, original_text))
    new_entities = set(re.findall(pattern, rewritten_text))

    # Common words that aren't actually named entities
    common = {
        "The", "This", "That", "With", "For", "And", "Or", "To",
        "In", "Of", "At", "We", "You", "Our", "Your", "My",
        "Have", "Has", "Had", "Was", "Were", "Are", "Is",
        "Team", "Company", "Work", "Project", "Role", "Job",
        "Skills", "Experience", "Education", "Summary",
    }
    suspicious = sorted((new_entities - orig_entities) - common)
    if suspicious:
        log.warning("Fabrication guard: %d new entities detected: %s", len(suspicious), suspicious)
    return suspicious


# ── 6. Render ATS-safe .docx & .pdf ─────────────────────────────────────────

def render_docx(rewritten_sections: dict, output_path: str) -> str:
    """
    Render the tailored resume as an ATS-safe .docx.
    ATS-safe rules:
    - Single column, no tables or text boxes
    - No headers/footers for content
    - No images or special characters
    - Standard fonts (Calibri)
    Returns the output path.
    """
    try:
        import docx
        from docx.shared import Pt, RGBColor
        from docx.enum.text import WD_ALIGN_PARAGRAPH
    except ImportError:
        raise RuntimeError("python-docx not installed. Run: pip install python-docx")

    doc = docx.Document()

    # Set margins to standard 1 inch
    from docx.shared import Inches
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    for section_name, bullets in rewritten_sections.items():
        if not bullets:
            continue

        # Section heading
        heading = doc.add_heading(section_name.replace("_", " ").title(), level=2)
        heading.style.font.size = Pt(12)
        heading.style.font.bold = True
        heading.style.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)  # dark blue

        # Bullets as plain paragraphs (ATS parses these better than List Bullet style)
        for bullet in bullets:
            if not bullet.strip():
                continue
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.2)
            run = p.add_run(f"• {bullet.strip()}")
            run.font.size = Pt(11)
            run.font.name = "Calibri"

        doc.add_paragraph()  # spacing between sections

    doc.save(output_path)
    log.info("Tailored resume docx saved to %s", output_path)
    return output_path


def render_pdf(rewritten_sections: dict, output_path: str) -> str:
    """
    Render the tailored resume as an ATS-safe, beautifully formatted PDF using reportlab.
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from xml.sax.saxutils import escape
    except ImportError:
        log.warning("reportlab not installed. Skipping PDF rendering.")
        return ""

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'ResumeTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0d4f4b'),
        alignment=1,
        spaceAfter=4,
    )

    subtitle_style = ParagraphStyle(
        'ResumeSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#475569'),
        alignment=1,
        spaceAfter=12,
    )

    heading_style = ParagraphStyle(
        'ResumeSectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0d4f4b'),
        spaceBefore=8,
        spaceAfter=4,
    )

    bullet_style = ParagraphStyle(
        'ResumeBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1e293b'),
        leftIndent=14,
        firstLineIndent=-14,
        spaceAfter=3,
    )

    story = []

    # Handle Header section specially if present
    header_lines = rewritten_sections.get("header", [])
    if header_lines:
        name_line = header_lines[0] if header_lines else "Resume"
        contact_line = " | ".join(header_lines[1:]) if len(header_lines) > 1 else ""
        story.append(Paragraph(escape(name_line), title_style))
        if contact_line:
            story.append(Paragraph(escape(contact_line), subtitle_style))
        else:
            story.append(Spacer(1, 8))

    for section_name, bullets in rewritten_sections.items():
        if section_name.lower() == "header":
            continue
        if not bullets:
            continue

        clean_heading = section_name.replace("_", " ").upper()
        story.append(Paragraph(f"<b>{escape(clean_heading)}</b>", heading_style))

        # Divider line
        divider = Table([[""]], colWidths=[540], rowHeights=[1.5])
        divider.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ]))
        story.append(divider)
        story.append(Spacer(1, 5))

        for bullet in bullets:
            b_text = bullet.strip()
            if not b_text:
                continue
            if b_text.startswith("•") or b_text.startswith("-") or b_text.startswith("*"):
                b_text = b_text.lstrip("•-* ").strip()
            story.append(Paragraph(f"&bull; {escape(b_text)}", bullet_style))

        story.append(Spacer(1, 6))

    doc.build(story)
    log.info("Tailored PDF resume saved to %s", output_path)
    return output_path


# ── Full pipeline ─────────────────────────────────────────────────────────────

def run_tailoring_pipeline(
    resume_file_path: str,
    jd_text: str,
    output_dir: str | None = None,
) -> dict:
    """
    End-to-end pipeline: extract → score → rewrite → guard → render docx & pdf.
    Returns a dict with all results needed by the API endpoint.
    """
    if output_dir is None:
        output_dir = tempfile.mkdtemp()

    # Step 1: Extract resume text
    resume_text = extract_text(resume_file_path)
    resume_sections = parse_resume_sections(resume_text)

    # Step 2: Parse JD keywords
    jd_keywords = parse_jd_keywords(jd_text)

    # Step 3: ATS score before
    score_before = ats_score(resume_text, jd_keywords)
    log.info("ATS score before: %.1f%%", score_before)

    # Step 4: Rewrite bullets
    rewritten_sections = rewrite_bullets(resume_sections, jd_keywords, jd_text)
    rewritten_text = "\n".join(
        bullet
        for bullets in rewritten_sections.values()
        for bullet in (bullets if isinstance(bullets, list) else [str(bullets)])
    )

    # Step 5: Fabrication guard
    fabrication_flags = check_no_fabrication(resume_text, rewritten_text)

    # Step 6: ATS score after
    score_after = ats_score(rewritten_text, jd_keywords)
    log.info("ATS score after: %.1f%% (delta: %+.1f)", score_after, score_after - score_before)

    # Step 7: Build per-section diff
    diff: list[dict] = []
    for section_name in set(list(resume_sections.keys()) + list(rewritten_sections.keys())):
        orig_bullets = resume_sections.get(section_name, [])
        new_bullets = rewritten_sections.get(section_name, orig_bullets)
        for i, (orig, new) in enumerate(zip(orig_bullets, new_bullets)):
            if orig != new:
                diff.append({
                    "section": section_name,
                    "bullet_index": i,
                    "original": orig,
                    "rewritten": new,
                })

    # Step 8: Render .docx and .pdf
    base_name = os.path.basename(resume_file_path).rsplit(".", 1)[0]
    docx_filename = f"tailored_{base_name}.docx"
    pdf_filename = f"tailored_{base_name}.pdf"

    docx_path = os.path.join(output_dir, docx_filename)
    pdf_path = os.path.join(output_dir, pdf_filename)

    render_docx(rewritten_sections, docx_path)
    try:
        render_pdf(rewritten_sections, pdf_path)
    except Exception as exc:
        log.warning("PDF rendering error: %s", exc)
        pdf_path = None

    return {
        "ats_score_before": score_before,
        "ats_score_after": score_after,
        "jd_keywords": jd_keywords,
        "diff": diff,
        "fabrication_flags": fabrication_flags,
        "tailored_file_path": docx_path,
        "tailored_pdf_path": pdf_path if pdf_path and os.path.exists(pdf_path) else None,
        "rewritten_sections": rewritten_sections,
        "original_sections": resume_sections,
    }
