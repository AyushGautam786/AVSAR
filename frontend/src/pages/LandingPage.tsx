import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Brain, Target, Star, ArrowRight, CheckCircle,
  Sparkles, BarChart3, Briefcase,
  Globe, Shield, Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';

const FEATURES = [
  {
    icon: Brain,
    title: 'ML-Powered Matching',
    desc: 'Random Forest + sentence-transformers semantic embeddings analyze 50+ factors to surface the most relevant opportunities for you.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10 border-indigo-500/20',
  },
  {
    icon: Sparkles,
    title: 'AI Resume Tailoring',
    desc: 'Claude AI rewrites your resume bullets to match JD keywords — with an anti-fabrication guard to keep everything truthful.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
  },
  {
    icon: Target,
    title: 'ATS Score Optimizer',
    desc: 'See your keyword coverage score before and after tailoring. Know exactly how well your resume matches each role.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10 border-cyan-500/20',
  },
  {
    icon: BarChart3,
    title: 'Feedback Loop',
    desc: 'Every view, save, and apply event retrains the model. Your recommendations improve the more you use AVSAR.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
  },
  {
    icon: Globe,
    title: 'Multi-Source Aggregation',
    desc: 'Greenhouse, Lever, Adzuna, and Internshala — all deduplicated into one unified feed updated regularly.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
  },
  {
    icon: Shield,
    title: 'Privacy-First',
    desc: 'Google OAuth via Supabase. Resume files are stored in private encrypted buckets. Your data is never sold.',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10 border-rose-500/20',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign in with Google', desc: 'One click — no password, no forms.' },
  { step: '02', title: 'Tell us your skills', desc: 'Fill in your domains, skills, and location preferences.' },
  { step: '03', title: 'Get matched', desc: 'Our ML engine ranks hundreds of live internships for you.' },
  { step: '04', title: 'Tailor & Apply', desc: 'AI rewrites your resume bullets, then apply directly to the company.' },
];

const STATS = [
  { value: '890+', label: 'Live Internships', icon: Briefcase },
  { value: '95%', label: 'Match Accuracy', icon: Target },
  { value: '50+', label: 'Match Factors', icon: Brain },
  { value: '4', label: 'Job Sources', icon: Globe },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const handleGetRecommendations = () => {
    if (!authLoading && !user) { setShowLoginModal(true); return; }
    if (user) navigate('/recommendations');
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <Header user={user} onSignOut={handleSignOut} onSignIn={() => setShowLoginModal(true)} />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Background glow orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-600/15 blur-[100px]" />
          <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-cyan-600/10 blur-[80px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(99,102,241,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div className={`space-y-8 ${visible ? 'animate-fade-in-up' : 'opacity-0'}`}>
              <div className="inline-flex items-center gap-2 badge badge-indigo">
                <Zap className="h-3 w-3" />
                AI-Powered Internship Platform
              </div>

              <h1 className="text-5xl lg:text-6xl font-black leading-[1.05]" style={{ fontFamily: 'var(--font-display)' }}>
                Find Internships
                <br />
                <span className="gradient-text">Matched to You</span>
                <br />
                by AI
              </h1>

              <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                AVSAR uses machine learning and semantic embeddings to rank 890+ live internships
                against your unique skill profile — then tailors your resume to fit each role.
              </p>

              <div className="flex flex-wrap gap-4">
                <button onClick={handleGetRecommendations} className="btn-primary text-base px-6 py-3">
                  <Sparkles className="h-5 w-5" />
                  Get My Recommendations
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => navigate('/internships')} className="btn-secondary text-base px-6 py-3">
                  <Briefcase className="h-5 w-5" />
                  Browse All Internships
                </button>
              </div>

              {!authLoading && !user && (
                <p className="text-sm text-gray-500">
                  <CheckCircle className="inline h-4 w-4 text-emerald-500 mr-1" />
                  Sign in with Google — no password required
                </p>
              )}
            </div>

            {/* Right — floating cards */}
            <div className={`relative hidden lg:block ${visible ? 'animate-fade-in delay-300' : 'opacity-0'}`}>
              {/* Main card */}
              <div className="glass-card p-6 animate-float">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Smart Matching Engine</p>
                    <p className="text-xs text-gray-500">Analyzing your profile…</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {['Frontend Engineer @ Vercel', 'ML Intern @ Notion', 'Product Intern @ Stripe'].map((role, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/8 delay-${(i+1)*100} animate-slide-in`}>
                      <span className="text-sm text-gray-300">{role}</span>
                      <span className="badge badge-green text-xs">
                        {95 - i * 3}% match
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating stat card */}
              <div className="glass-card p-4 absolute -bottom-6 -left-8 w-44" style={{ animationDelay: '2s' }}>
                <p className="text-2xl font-black gradient-text">95%</p>
                <p className="text-xs text-gray-500 mt-0.5">Match Accuracy</p>
              </div>

              {/* Floating badge */}
              <div className="glass-card p-3 absolute -top-4 -right-4 flex items-center gap-2" style={{ animationDelay: '1s' }}>
                <Star className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold text-white">890+ Live Jobs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map(({ value, label, icon: Icon }, i) => (
              <div key={i} className={`text-center animate-fade-in-up delay-${i * 100 + 100}`}>
                <div className="flex justify-center mb-3">
                  <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-black gradient-text">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge badge-violet inline-flex mb-4">
              <Sparkles className="h-3 w-3" /> Features
            </div>
            <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Everything you need to{' '}
              <span className="gradient-text">land your internship</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              From ML-powered matching to AI resume tailoring — AVSAR handles every step of the internship hunt.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }, i) => (
              <div
                key={i}
                className={`glass-card p-6 animate-fade-in-up delay-${Math.min(i * 100, 500)}`}
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-5 ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-600/8 blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="badge badge-cyan inline-flex mb-4">
              <Clock className="h-3 w-3" /> How it works
            </div>
            <h2 className="text-4xl font-black" style={{ fontFamily: 'var(--font-display)' }}>
              From sign-in to{' '}
              <span className="gradient-text">application in minutes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <div key={i} className={`relative animate-fade-in-up delay-${i * 150}`}>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-indigo-500/40 to-transparent z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center mb-5 font-black text-white text-sm">
                    {step}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card p-12 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent" />
            </div>
            <div className="relative z-10">
              <div className="badge badge-indigo inline-flex mb-6">
                <Zap className="h-3 w-3" /> Ready to get started?
              </div>
              <h2 className="text-4xl font-black mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Your dream internship{' '}
                <span className="gradient-text">is one click away</span>
              </h2>
              <p className="text-gray-400 mb-8 text-lg max-w-xl mx-auto">
                Join thousands of students who found their perfect internship match using AVSAR's AI engine.
              </p>
              <button onClick={handleGetRecommendations} className="btn-primary text-base px-8 py-4">
                <Sparkles className="h-5 w-5" />
                Get My AI Recommendations
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
              <Zap className="h-3 w-3 text-white" />
            </div>
            <span className="font-bold gradient-text text-sm">AVSAR</span>
          </div>
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} AVSAR — AI Vocation & Skill Alignment Recommender
          </p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/terms')} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
              Data & Terms
            </button>
          </div>
        </div>
      </footer>

      {/* ── Auth Modal ── */}
      <AuthModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default LandingPage;