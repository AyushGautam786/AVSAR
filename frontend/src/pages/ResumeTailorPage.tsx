import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Zap, Download, AlertTriangle, CheckCircle,
  ChevronRight, Loader2, X, Sparkles, RefreshCw, FileCheck
} from 'lucide-react';
import Header from '../components/Header';
import AtsScoreCard from '../components/AtsScoreCard';
import DiffViewer from '../components/DiffViewer';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/['"]/g, '').replace(/\/$/, '');

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type Step = 'upload' | 'jd' | 'tailoring' | 'results';

interface TailorResult {
  ats_score_before: number;
  ats_score_after: number;
  jd_keywords: string[];
  diff: any[];
  fabrication_flags: string[];
  download_url: string | null;
}

const ResumeTailorPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();

  const [step, setStep] = useState<Step>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jdText, setJdText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TailorResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [user, authLoading, navigate]);

  // ── File handling ─────────────────────────────────────────────────────────

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc' && ext !== 'txt') {
      setError('Please upload a .pdf, .docx, or .txt file.');
      return;
    }
    setError(null);
    setResumeFile(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!resumeFile) return;
    setIsUploading(true);
    setError(null);
    try {
      const authHeaders = await getAuthHeader();
      const formData = new FormData();
      formData.append('file', resumeFile);
      const resp = await fetch(`${API_BASE_URL}/api/resume/upload`, {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Upload failed');
      setResumeId(data.resume_id);
      setStep('jd');
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please check your file and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Tailor ────────────────────────────────────────────────────────────────

  const handleTailor = async () => {
    if (!resumeId || !jdText.trim()) return;
    setIsTailoring(true);
    setError(null);
    setStep('tailoring');
    try {
      const authHeaders = await getAuthHeader();
      const resp = await fetch(`${API_BASE_URL}/api/resume/tailor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ resume_id: resumeId, job_description_text: jdText }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Tailoring failed');
      setResult(data);
      setStep('results');
    } catch (err: any) {
      setError(err.message || 'Tailoring failed. Please try again.');
      setStep('jd');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="page-container">
      <Header user={user} onSignOut={handleSignOut} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              AI Resume Tailor
            </h1>
          </div>
          <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
            Upload your resume and a target job description. Our AI analyzes missing ATS keywords,
            re-aligns your existing bullet points to match the role requirements, and ensures zero fabrication.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 text-xs sm:text-sm overflow-x-auto pb-2">
          {(['upload', 'jd', 'tailoring', 'results'] as Step[]).map((s, i) => {
            const stepOrder = ['upload', 'jd', 'tailoring', 'results'];
            const currentIndex = stepOrder.indexOf(step);
            const isCurrent = step === s;
            const isCompleted = currentIndex > i;

            return (
              <React.Fragment key={s}>
                <div
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-semibold transition-all whitespace-nowrap ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/40'
                      : isCompleted
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/8'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <span className="w-4 h-4 rounded-full bg-white/10 text-[10px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                  )}
                  {s === 'upload' ? 'Upload Resume' : s === 'jd' ? 'Job Description' : s === 'tailoring' ? 'AI Tailoring' : 'Coverage Results'}
                </div>
                {i < 3 && <ChevronRight className="h-4 w-4 text-gray-600 shrink-0" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 animate-fade-in text-rose-300">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{error}</div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/10 rounded-lg text-rose-400 hover:text-rose-200 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ── Step 1: Upload ── */}
        {step === 'upload' && (
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 animate-scale-in">
            <div>
              <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Step 1 — Upload your Resume
              </h2>
              <p className="text-sm text-gray-400">
                Upload your existing resume in PDF, DOCX, or TXT format. We will parse your experience sections and extract your existing skills.
              </p>
            </div>

            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/15 scale-[1.01]'
                  : resumeFile
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-white/15 hover:border-indigo-400/50 bg-white/[0.02] hover:bg-white/[0.04]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />

              {resumeFile ? (
                <div className="flex flex-col items-center gap-3 animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <FileCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">{resumeFile.name}</p>
                    <p className="text-xs text-emerald-400 mt-0.5 font-medium">
                      {(resumeFile.size / 1024).toFixed(1)} KB · Ready to upload (Click to change)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-gray-400">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-base">Drag & drop or click to choose file</p>
                    <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, DOC, and TXT files (up to 10MB)</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!resumeFile || isUploading}
              className="w-full btn-primary flex items-center justify-center gap-2.5 py-3.5 text-base font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              {isUploading ? 'Uploading & Parsing Resume…' : 'Continue to Job Description'}
            </button>
          </div>
        )}

        {/* ── Step 2: Job Description ── */}
        {step === 'jd' && (
          <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 animate-scale-in">
            <div>
              <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                Step 2 — Paste Job Description
              </h2>
              <p className="text-sm text-gray-400">
                Paste the full job or internship description below. Include the required qualifications, technologies, and responsibilities for maximum ATS alignment.
              </p>
            </div>

            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              rows={12}
              placeholder="Paste the job description, required skills, and responsibilities here…"
              className="input-dark w-full p-4 text-sm font-normal resize-none leading-relaxed min-h-[260px]"
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => setStep('upload')}
                className="btn-secondary flex-1 py-3 text-sm font-semibold"
              >
                ← Back to Upload
              </button>
              <button
                onClick={handleTailor}
                disabled={!jdText.trim() || isTailoring}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                Tailor Resume with AI
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Tailoring in progress ── */}
        {step === 'tailoring' && (
          <div className="glass-card rounded-2xl p-12 sm:p-16 text-center space-y-5 animate-scale-in">
            <div className="relative w-16 h-16 mx-auto">
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center animate-pulse-glow">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Tailoring your Resume with AI…
              </h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                Extracting high-priority ATS keywords from the job description, rewording bullet points with truthful phrasing, and calculating score uplift.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-indigo-300/80 font-medium pt-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              <span>Checking fabrication guard & generating ATS-safe output</span>
            </div>
          </div>
        )}

        {/* ── Step 4: Results ── */}
        {step === 'results' && result && (
          <div className="space-y-6 animate-scale-in">
            {/* ATS Scores */}
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  ATS Keyword Coverage Analysis
                </h2>
                <p className="text-xs text-gray-400">
                  Comparison of keyword match density against the target job requirements before and after tailoring.
                </p>
              </div>

              <div className="flex gap-6 justify-center flex-wrap mb-6">
                <AtsScoreCard label="Original Resume Match" score={result.ats_score_before} />
                <AtsScoreCard
                  label="Tailored Resume Match"
                  score={result.ats_score_after}
                  compareScore={result.ats_score_before}
                  isAfter
                />
              </div>

              {result.jd_keywords.length > 0 && (
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    Extracted Keywords ({result.jd_keywords.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.jd_keywords.slice(0, 25).map(kw => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/20"
                      >
                        {kw}
                      </span>
                    ))}
                    {result.jd_keywords.length > 25 && (
                      <span className="px-2.5 py-1 text-gray-400 text-xs bg-white/5 rounded-lg border border-white/10">
                        +{result.jd_keywords.length - 25} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Diff viewer */}
            <div className="glass-card rounded-2xl p-6 sm:p-8">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
                  Bullet Points & Section Refinements
                </h2>
                <p className="text-xs text-gray-400">
                  See exact line-by-line enhancements made to emphasize your existing skills.
                </p>
              </div>
              <DiffViewer diff={result.diff} fabricationFlags={result.fabrication_flags} />
            </div>

            {/* Download */}
            <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-500/20 bg-emerald-500/[0.03]">
              <div>
                <h3 className="font-bold text-white text-base">Download Tailored Resume</h3>
                <p className="text-xs text-gray-400 mt-1">
                  ATS-compliant single-column layout · Standard typography · Instant download
                </p>
              </div>
              {result.download_url ? (
                <a
                  href={result.download_url}
                  download
                  className="btn-primary flex items-center gap-2 px-6 py-3.5 text-sm font-semibold shrink-0 shadow-lg shadow-indigo-500/25"
                >
                  <Download className="h-4 w-4" />
                  Download .docx File
                </a>
              ) : (
                <div className="text-xs text-amber-300 bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-500/25">
                  Download link generating or storage ready
                </div>
              )}
            </div>

            {/* Start over */}
            <button
              onClick={() => {
                setStep('upload');
                setResumeFile(null);
                setResumeId(null);
                setJdText('');
                setResult(null);
                setError(null);
              }}
              className="btn-secondary w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tailor Another Resume
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResumeTailorPage;
