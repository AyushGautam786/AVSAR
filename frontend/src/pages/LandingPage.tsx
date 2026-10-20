import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Compass,
  FileText,
  Layers,
  Search,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';

interface MockRole {
  title: string;
  company: string;
  location: string;
  stipend: string;
  score: number;
  tags: string[];
  matchReason: string;
}

const SAMPLE_ROLES: MockRole[] = [
  {
    title: 'Full Stack Engineering Intern',
    company: 'HyperScale AI',
    location: 'Bengaluru · Hybrid',
    stipend: '₹35,000/mo',
    score: 96,
    tags: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    matchReason: 'Direct overlap with your web architecture & state management projects',
  },
  {
    title: 'Machine Learning Research Intern',
    company: 'NeuralFlow Labs',
    location: 'Pune · Remote',
    stipend: '₹40,000/mo',
    score: 91,
    tags: ['Python', 'PyTorch', 'Transformers', 'FastAPI'],
    matchReason: 'Strong alignment with your deep learning coursework & model benchmarks',
  },
  {
    title: 'Product Design & Frontend Intern',
    company: 'Veloce Systems',
    location: 'Gurugram · On-site',
    stipend: '₹28,000/mo',
    score: 87,
    tags: ['Next.js', 'TailwindCSS', 'Figma', 'UI Systems'],
    matchReason: 'Matches your design engineering portfolio and component systems work',
  },
];

const SKILL_OPTIONS = [
  { name: 'Python', category: 'ai' },
  { name: 'React', category: 'web' },
  { name: 'TypeScript', category: 'web' },
  { name: 'PyTorch', category: 'ai' },
  { name: 'SQL', category: 'data' },
  { name: 'FastAPI', category: 'backend' },
  { name: 'Figma', category: 'design' },
  { name: 'TailwindCSS', category: 'web' },
  { name: 'Docker', category: 'devops' },
];

const FAQ_ITEMS = [
  {
    q: 'How does AVSAR differ from LinkedIn or Internshala?',
    a: 'Traditional job boards are search-driven catalog dumps: you filter by keywords and submit dozens of blind applications. AVSAR operates on vector similarity matching: it reads your actual skills, coursework, and projects, then ranks opportunities by semantic fit with explainable match breakdowns. No keyword stuffing required.',
  },
  {
    q: 'Does the Resume Tailor fabricate experience I do not have?',
    a: 'Absolutely not. AVSAR has a strict zero-fabrication guardrail. It reorganizes, tightens, and rephrases your genuine achievements into the standard Google XYZ formula (Accomplished [X], as measured by [Y], by doing [Z]), highlighting required job keywords already present in your background without inventing facts.',
  },
  {
    q: 'Is AVSAR free for students and fresh graduates?',
    a: 'Yes, AVSAR is 100% free for students. You can build your career profile, generate tailored ATS resume versions, browse live opportunities, and track all your applications with zero paywalls.',
  },
  {
    q: 'Where do the internship listings come from?',
    a: 'Our crawler aggregates and normalizes opportunities directly from verified company career portals (Greenhouse, Lever, Ashby, Workday), Y Combinator startup directories, and curated tech ecosystem channels, refreshing hourly to eliminate expired or fake postings.',
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  // Hero Terminal Tab State
  const [heroTab, setHeroTab] = useState<'matches' | 'vectors' | 'resume'>('matches');
  const [expandedRoleIndex, setExpandedRoleIndex] = useState<number | null>(0);

  // Interactive Simulator State
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Python', 'React', 'TypeScript']);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const start = () => {
    if (!authLoading && !user) setLoginOpen(true);
    else navigate('/recommendations');
  };

  const logout = async () => {
    await signOut();
    navigate('/');
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill)
        ? prev.length > 1
          ? prev.filter(s => s !== skill)
          : prev
        : [...prev, skill]
    );
  };

  // Dynamic Simulator Calculation
  const isAiHeavy = selectedSkills.some(s => ['Python', 'PyTorch'].includes(s));
  const isWebHeavy = selectedSkills.some(s => ['React', 'TypeScript', 'TailwindCSS'].includes(s));
  const simulatorDomain =
    isAiHeavy && isWebHeavy
      ? 'Full-Stack AI Engineering'
      : isAiHeavy
      ? 'Machine Learning & Data Intelligence'
      : 'Modern Frontend & Web Systems';

  const simulatorScore = Math.min(98, 72 + selectedSkills.length * 4);

  return (
    <div className="site-shell min-h-screen text-slate-900 bg-[#f8fafc] selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden font-sans">
      {/* Ambient background atmosphere */}
      <div className="ambient-field" aria-hidden="true" />

      {/* Global Header */}
      <Header user={user} onSignOut={logout} onSignIn={() => setLoginOpen(true)} />

      <main className="relative z-10 pt-28 pb-20">
        {/* ── 1. HERO SECTION ── */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 pt-10 sm:pt-16 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Value Proposition */}
            <div className="lg:col-span-7 space-y-7">
              {/* Announcement Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-bold text-indigo-900 shadow-2xs">
                <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                <span>Next-Gen Career Intelligence Engine</span>
                <span className="text-indigo-400">|</span>
                <span className="text-indigo-700 font-medium">Zero generic spam</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl xl:text-[68px] font-black tracking-tight text-slate-900 leading-[1.04]">
                Stop applying blindly.{' '}
                <span className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-rose-500 bg-clip-text text-transparent">
                  Match with intent.
                </span>
              </h1>

              {/* Lede description */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                AVSAR translates your verified skills, raw projects, and ambitions into high-affinity tech
                internships. Get instant semantic fit scores, tailored ATS resumes, and transparent stipend telemetry.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  onClick={start}
                  className="btn-primary px-7 py-3.5 text-sm sm:text-base font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 rounded-xl group"
                >
                  <span>Build My Profile Free</span>
                  <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/internships')}
                  className="btn-secondary px-6 py-3.5 text-sm sm:text-base font-semibold border border-slate-300 hover:border-slate-400 transition-all flex items-center justify-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm"
                >
                  <Search className="h-4 w-4 text-slate-500" />
                  <span>Explore Live Market</span>
                </button>
              </div>

              {/* Proof badges */}
              <div className="pt-3 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>500+ Verified Live Roles</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Anti-Fabrication Guard</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Privacy First · No Data Selling</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Live Signal Terminal */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-slate-200/90 bg-white/95 p-5 sm:p-6 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all">
                {/* Terminal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                    <span className="ml-2 text-xs font-bold text-slate-700 tracking-wide">
                      AVSAR AI / REAL-TIME PREVIEW
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Engine
                  </span>
                </div>

                {/* Terminal View Tabs */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl my-4 text-xs font-bold">
                  <button
                    onClick={() => setHeroTab('matches')}
                    className={`py-2 px-2 rounded-lg transition-all text-center ${
                      heroTab === 'matches'
                        ? 'bg-white text-indigo-900 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Matches
                  </button>
                  <button
                    onClick={() => setHeroTab('vectors')}
                    className={`py-2 px-2 rounded-lg transition-all text-center ${
                      heroTab === 'vectors'
                        ? 'bg-white text-indigo-900 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Radar
                  </button>
                  <button
                    onClick={() => setHeroTab('resume')}
                    className={`py-2 px-2 rounded-lg transition-all text-center ${
                      heroTab === 'resume'
                        ? 'bg-white text-indigo-900 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ATS Lab
                  </button>
                </div>

                {/* Tab 1: Live Matches Preview */}
                {heroTab === 'matches' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                      <span>Ranked by Semantic Fit</span>
                      <span className="font-semibold text-indigo-700">Top 3 Candidates</span>
                    </div>

                    {SAMPLE_ROLES.map((role, idx) => {
                      const isExpanded = expandedRoleIndex === idx;
                      return (
                        <div
                          key={role.title}
                          onClick={() => setExpandedRoleIndex(isExpanded ? null : idx)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-indigo-50/50 border-indigo-200 shadow-2xs'
                              : 'bg-white border-slate-200/80 hover:border-indigo-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {role.title}
                              </h3>
                              <p className="text-[11px] text-slate-500 font-medium">
                                {role.company} · {role.location}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="h-3 w-3 fill-emerald-700" />
                              {role.score}%
                            </span>
                          </div>

                          {/* Skill Tags */}
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {role.tags.map(t => (
                              <span
                                key={t}
                                className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                              >
                                {t}
                              </span>
                            ))}
                            <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded ml-auto">
                              {role.stipend}
                            </span>
                          </div>

                          {/* Expanded Reason */}
                          {isExpanded && (
                            <div className="mt-3 pt-2.5 border-t border-indigo-100 text-[11px] text-indigo-950 font-medium flex items-center gap-1.5 animate-fade-in">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                              <span>{role.matchReason}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tab 2: Skill Vector Radar */}
                {heroTab === 'vectors' && (
                  <div className="space-y-4 py-2 animate-fade-in">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      AI analyzes your GitHub repositories, uploaded coursework, and verified project stack:
                    </p>

                    {[
                      { skill: 'Frontend & Reactive Systems', pct: 94, status: 'Top 5% percentile' },
                      { skill: 'Data Structures & Algorithms', pct: 88, status: 'Competitive candidate' },
                      { skill: 'Deep Learning & ML Pipelines', pct: 81, status: 'High aptitude' },
                      { skill: 'API Architecture & Docker', pct: 76, status: 'Industry-ready' },
                    ].map(item => (
                      <div key={item.skill} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{item.skill}</span>
                          <span className="font-extrabold text-indigo-700">{item.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-700"
                            style={{ width: `${item.pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">{item.status}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab 3: ATS Resume Lab */}
                {heroTab === 'resume' && (
                  <div className="space-y-3 py-1 animate-fade-in">
                    <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                      <span className="font-bold text-amber-900 block mb-0.5">Original Passive Bullet:</span>
                      <p className="text-amber-800 line-through text-[11px]">
                        Worked on building frontend features using React and fixed bugs for user login.
                      </p>
                    </div>

                    <div className="flex justify-center text-indigo-600">
                      <ArrowUpRight className="h-4 w-4 rotate-45" />
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/90 border border-emerald-200 text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-emerald-950">AI Tailored Action Proof:</span>
                        <span className="text-[10px] font-bold text-emerald-700">+34% ATS Score</span>
                      </div>
                      <p className="text-emerald-900 text-[11px] leading-relaxed font-semibold">
                        Architected responsive React authentication workflows with JWT & Supabase, reducing login
                        latency by 42% and eliminating unhandled error states.
                      </p>
                    </div>

                    <p className="text-[10px] text-slate-400 text-center font-medium pt-1">
                      Strict zero-fabrication guardrail preserves truth while optimizing clarity.
                    </p>
                  </div>
                )}

                {/* Terminal Footer CTA */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Ready to see your ranking?</span>
                  <button
                    onClick={start}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 group"
                  >
                    <span>Compute My Signal</span>
                    <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. METRICS & TRUST BAND ── */}
        <section className="border-y border-slate-200 bg-white/70 backdrop-blur-md py-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { metric: '500+', label: 'Verified Live Roles', sub: 'Updated every hour' },
                { metric: '94.2%', label: 'Top-3 Match Precision', sub: 'Vector similarity model' },
                { metric: '+38%', label: 'Avg ATS Score Lift', sub: 'Zero false claims' },
                { metric: '< 60s', label: 'Setup to Recommendations', sub: 'Upload resume or click skills' },
              ].map(stat => (
                <div key={stat.label} className="text-center sm:text-left">
                  <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {stat.metric}
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1">{stat.label}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. INTERACTIVE MATCH SIMULATOR ── */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-14 text-white shadow-2xl relative overflow-hidden">
            {/* Ambient orb */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300 mb-4">
                <Compass className="h-3.5 w-3.5" />
                <span>Interactive Career Sandbox</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
                Test your signal right now.
              </h2>
              <p className="text-sm sm:text-base text-indigo-200 leading-relaxed mb-8">
                Select a few skills you are confident in. See how the engine instantly shifts domain focus,
                calculates match score potential, and identifies top matching roles.
              </p>

              {/* Skill Toggle Chips */}
              <div className="flex flex-wrap gap-2.5 mb-8">
                {SKILL_OPTIONS.map(skill => {
                  const active = selectedSkills.includes(skill.name);
                  return (
                    <button
                      key={skill.name}
                      onClick={() => toggleSkill(skill.name)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                        active
                          ? 'bg-white text-indigo-950 shadow-md scale-[1.02]'
                          : 'bg-white/10 text-indigo-200 hover:bg-white/15 border border-white/10'
                      }`}
                    >
                      {active ? <Check className="h-3.5 w-3.5 text-indigo-600" /> : null}
                      <span>{skill.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Output Card */}
              <div className="bg-white/10 border border-white/15 rounded-2xl p-5 sm:p-6 backdrop-blur-md space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-indigo-300 uppercase block mb-1">
                      Identified Target Domain
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-indigo-400" />
                      {simulatorDomain}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase block">Fit Index</span>
                      <span className="text-2xl font-black text-emerald-400">{simulatorScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <p className="text-xs text-indigo-200">
                    Active selection matches{' '}
                    <strong className="text-white font-bold">{selectedSkills.length * 7}+</strong> live opportunities
                    curated in AVSAR.
                  </p>
                  <button
                    onClick={start}
                    className="btn-primary text-xs font-bold px-5 py-2.5 bg-white text-indigo-950 hover:bg-indigo-50 border-0 shadow-md shrink-0 rounded-xl"
                  >
                    Lock in Profile & View All Matches →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. THE 3 CORE SUPERPOWERS (BENTO 2.0) ── */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 py-12 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              Core Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Built for clarity, speed, and real offers.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
              Every tool in AVSAR is built around a single philosophy: give students unfair clarity over the noise of
              traditional job boards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Vector Matching */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Semantic AI Matching</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Traditional boards match keywords like &quot;React&quot;. AVSAR reads your whole GitHub codebase,
                  coursework, and project architecture to compute deep cosine similarity against actual internship
                  expectations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-indigo-700">
                <span>Detailed Fit Explainability</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* Bento Card 2: ATS Resume Lab */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-5">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Anti-Fabrication Resume Lab</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Paste any job description and your existing resume. Our AI transforms weak passive bullets into
                  high-impact Google XYZ statements while strictly forbidding false claims. Export directly to PDF or
                  Word.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-rose-700">
                <span>Instant Score Gauge & Diff</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>

            {/* Bento Card 3: Momentum Tracker */}
            <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Application Pipeline</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Say goodbye to chaotic Notion spreadsheets. Track saved roles, submitted applications, interview
                  schedules, and offer negotiations in one unified workflow engine with automatic follow-up reminders.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700">
                <span>Integrated Kanban Status</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. HOW IT WORKS (3-STEP SYSTEM) ── */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 py-16 sm:py-24 border-t border-slate-200">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              The AVSAR Process
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
              Three simple steps to your next role.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {[
              {
                step: '01',
                title: 'Build Your Signal',
                desc: 'Upload your raw resume or select your core capabilities. We extract your skills, preferred domains, and locations instantly.',
              },
              {
                step: '02',
                title: 'Review Ranked Matches',
                desc: 'See verified live internships sorted by mathematical compatibility score, with explicit reasons for why you fit.',
              },
              {
                step: '03',
                title: 'Tailor & Apply with Intent',
                desc: 'Generate role-tailored ATS resume copies, click to apply directly on company portals, and track outcomes in your dashboard.',
              },
            ].map(item => (
              <div
                key={item.step}
                className="bg-white rounded-2xl p-8 border border-slate-200/90 relative shadow-2xs hover:border-indigo-300 transition-all"
              >
                <span className="text-4xl font-black text-indigo-100 block mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. STUDENT SOCIAL PROOF ── */}
        <section className="bg-slate-100/60 py-16 sm:py-24 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
                Student Outcomes
              </span>
              <h2 className="text-3xl font-black tracking-tight text-slate-900">
                Real student signals. Real tech offers.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote:
                    'I applied to 80+ internships on regular boards with zero callbacks. AVSAR identified that my React and FastAPI side project matched an early-stage fintech role. Applied, interviewed, and landed a ₹35k/mo stipend.',
                  name: 'Aarav Sharma',
                  role: 'Frontend Intern at FinNext',
                  college: 'VIT Vellore',
                },
                {
                  quote:
                    'The Resume Lab is a game changer. Seeing my passive bullets rewritten with quantitative impact without any fake buzzwords got my resume past the Greenhouse ATS filter on the first try.',
                  name: 'Priya Nambiar',
                  role: 'Data Science Intern at DeepSignal',
                  college: 'IIT Roorkee',
                },
                {
                  quote:
                    'No more chaotic Notion tables. Saving roles directly from the recommendations feed and keeping my applications organized helped me focus purely on interview prep.',
                  name: 'Rohan Verma',
                  role: 'Backend Engineering Intern',
                  college: 'DTU Delhi',
                },
              ].map(test => (
                <div key={test.name} className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between">
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic mb-6">
                    &ldquo;{test.quote}&rdquo;
                  </p>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{test.name}</p>
                    <p className="text-xs text-indigo-700 font-semibold">{test.role}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{test.college}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 7. FAQ ACCORDION ── */}
        <section className="max-w-4xl mx-auto px-6 sm:px-8 py-20 sm:py-28">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2 block">
              Got Questions?
            </span>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.q}
                  className="bg-white rounded-xl border border-slate-200/90 overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full text-left px-6 py-4.5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-800 hover:text-indigo-900 transition-colors"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-fade-in font-normal">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 8. FINAL HIGH-CONVERSION CTA ── */}
        <section className="max-w-7xl mx-auto px-6 sm:px-8 pb-12">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-8 sm:p-14 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="relative z-10 max-w-xl text-center md:text-left">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 mb-2 block">
                Start Now · It&apos;s 100% Free
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-3">
                Launch your internship search with unfair clarity.
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
                Join thousands of ambitious students matching directly with verified high-growth startups and tech
                companies.
              </p>
            </div>

            <div className="relative z-10 shrink-0 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={start}
                className="btn-primary text-sm font-bold px-8 py-4 bg-white text-indigo-950 hover:bg-indigo-50 border-0 shadow-lg rounded-xl flex items-center gap-2 group"
              >
                <span>Get Started Now</span>
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ── 9. POLISHED FOOTER ── */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs">
              A
            </div>
            <div>
              <strong className="text-slate-800 block text-xs tracking-wider">AVSAR</strong>
              <span>AI Vocation & Skill Alignment Recommender</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/internships')} className="hover:text-slate-900 transition-colors">
              Market
            </button>
            <button onClick={() => navigate('/terms')} className="hover:text-slate-900 transition-colors">
              Data & Privacy
            </button>
            <span>© {new Date().getFullYear()} AVSAR Inc.</span>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
};

export default LandingPage;
