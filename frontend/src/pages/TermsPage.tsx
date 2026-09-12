import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { Shield, Database, Trash2, FileText, Lock, CheckCircle, Zap } from 'lucide-react';

const TermsPage: React.FC = () => {
  const { user, signInWithGoogle, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const sections = [
    {
      icon: Database,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      title: 'Internship Data Sources',
      content: (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            AVSAR aggregates internship listings from multiple platforms to provide a unified discovery experience.
            We use both official APIs and public data sources.
          </p>
          <div className="space-y-3">
            {[
              { label: 'Greenhouse API', desc: 'Official partner API — explicitly allows third-party aggregation.' },
              { label: 'Lever API', desc: 'Official partner API — explicitly allows third-party aggregation.' },
              { label: 'Adzuna API', desc: 'Official registered API with free developer tier.' },
              { label: 'Internshala (Apify)', desc: 'Public listings. All links redirect to the original source for direct application.' },
            ].map(({ label, desc }, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl bg-white/3 border border-white/8">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: Shield,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
      title: 'Your Data & Privacy',
      content: (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            Your privacy is a priority. We comply with modern data protection principles including DPDP guidelines.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              {
                icon: Lock,
                title: 'Secure Storage',
                desc: 'Your profile, resumes, and applications are stored in encrypted Supabase infrastructure and never sold to third parties.',
              },
              {
                icon: FileText,
                title: 'AI Resume Processing',
                desc: 'Resumes uploaded for tailoring are stored in a private bucket, accessible only by you via time-limited signed URLs.',
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/3 border border-white/8">
                <Icon className="h-5 w-5 text-violet-400 mb-2" />
                <p className="text-sm font-semibold text-white mb-1">{title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-white/3 border border-white/8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">What we store</p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" /> Google account name and email (from OAuth)</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" /> Skill preferences and domain interests you set</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" /> Saved internship applications and their statuses</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" /> Anonymized interaction events (view/save/apply) to retrain the ML model</li>
              <li className="flex items-center gap-2"><CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" /> Uploaded resumes (in a private storage bucket)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      icon: Trash2,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      title: 'Right to Deletion',
      content: (
        <div className="space-y-4">
          <p className="text-gray-400 text-sm leading-relaxed">
            You have the right to request complete deletion of your account and all associated data at any time. This is irreversible.
          </p>
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <p className="text-sm font-semibold text-red-300 mb-2">How to delete your account</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Sign in → Click your avatar in the top-right navigation → Select{' '}
              <span className="text-red-400 font-semibold">Delete Account</span>.
              This immediately and permanently removes your profile, saved internships, interaction history, and all uploaded resumes.
            </p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="page-container">
      <Header user={user} onSignIn={signInWithGoogle} onSignOut={handleSignOut} />

      <main className="page-main max-w-3xl mx-auto">
        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>Data Sources & Terms</h1>
              <p className="text-gray-500 text-sm mt-0.5">How AVSAR collects, uses, and protects your information</p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map(({ icon: Icon, color, bg, title, content }, i) => (
            <div key={i} className={`glass-card p-6 animate-fade-in-up delay-${i * 150}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h2 className="text-lg font-bold text-white">{title}</h2>
              </div>
              {content}
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {' · '}
            MIT © {new Date().getFullYear()} AVSAR — Ayush Gautam
          </p>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
