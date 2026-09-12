import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpRight, Brain, Check, ChevronRight,
  CircleDot, FileSearch, LineChart, Target,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';

const SIGNALS = [
  { icon: Brain, title: 'Skill-aware matching', body: 'A recommendation layer that reads beyond job titles and connects your actual capabilities to relevant work.' },
  { icon: FileSearch, title: 'Resume intelligence', body: 'See where your resume is strong, where it is vague, and what a hiring system is likely to miss.' },
  { icon: LineChart, title: 'A clearer next move', body: 'Turn a noisy internship search into a shortlist you can evaluate, save, tailor, and apply to.' },
];

const STEPS = [
  ['01', 'Build your signal', 'Tell AVSAR what you know, what you want to learn, and where you want to work.'],
  ['02', 'Review your matches', 'Explore opportunities ranked around your profile—not just the latest listing.'],
  ['03', 'Apply with intent', 'Tailor your resume, track your applications, and move forward with evidence.'],
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleStart = () => {
    if (!authLoading && !user) setShowLoginModal(true);
    else if (user) navigate('/recommendations');
  };
  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <div className="site-shell">
      <Header user={user} onSignOut={handleSignOut} onSignIn={() => setShowLoginModal(true)} />

      <main>
        <section className="hero-section">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-inner">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-rule" /> AVSAR / CAREER INTELLIGENCE</div>
              <h1>Find the work<br /><em>that moves you forward.</em></h1>
              <p className="hero-lede">A more considered way to find internships. AVSAR connects your skills, ambitions, and working preferences to opportunities worth your attention.</p>
              <div className="hero-actions">
                <button onClick={handleStart} className="btn-primary btn-large">Build my profile <ArrowUpRight size={17} /></button>
                <button onClick={() => navigate('/internships')} className="btn-link">Explore live internships <ChevronRight size={16} /></button>
              </div>
              <div className="hero-proof"><span className="proof-dot" /> Built for students who are serious about their first move <span className="proof-separator">·</span> Private by design</div>
            </div>

            <div className="hero-board" aria-label="AVSAR matching preview">
              <div className="board-topline"><span>PROFILE / 001</span><span>LIVE MATCHING</span></div>
              <div className="board-title-row"><div><span className="board-kicker">YOUR SIGNAL</span><h2>Software & data</h2></div><div className="board-index">03<br /><span>matches</span></div></div>
              <div className="signal-bars"><span style={{ width: '88%' }} /><span style={{ width: '72%' }} /><span style={{ width: '54%' }} /></div>
              <div className="board-list">
                {['Product engineering intern', 'Data science intern', 'ML research intern'].map((role, i) => (
                  <div className="board-list-item" key={role}><div className="board-item-number">0{i + 1}</div><div className="board-item-copy"><strong>{role}</strong><small>{['Bengaluru · Hybrid', 'Pune · Remote', 'Bengaluru · On-site'][i]}</small></div><span className={`match-pill ${i === 0 ? 'match-strong' : ''}`}>{95 - i * 7}%</span></div>
                ))}
              </div>
              <div className="board-footer"><span><CircleDot size={12} /> Updated just now</span><span>VIEW ALL <ArrowUpRight size={12} /></span></div>
            </div>
          </div>
          <div className="hero-caption">01 — A calm, structured workspace for a high-stakes search.</div>
        </section>

        <section className="statement-section"><div className="section-label">THE PROBLEM</div><div className="statement-copy"><h2>The right opportunity is rarely the loudest one.</h2><p>Job boards optimize for volume. Your time deserves better. AVSAR helps you decide where your profile has a credible advantage—and what to improve before you apply.</p></div></section>

        <section className="signal-section"><div className="section-heading"><div><div className="section-label">THE AVSAR APPROACH</div><h2>Less scrolling.<br /><em>More signal.</em></h2></div><p>Every part of the product is designed to make the next decision easier, from the first profile input to the final application.</p></div><div className="signal-grid">{SIGNALS.map(({ icon: Icon, title, body }, i) => <article className="signal-card" key={title}><span className="card-number">0{i + 1}</span><Icon size={22} strokeWidth={1.7} /><h3>{title}</h3><p>{body}</p><span className="card-arrow"><ArrowUpRight size={16} /></span></article>)}</div></section>

        <section className="process-section"><div className="section-label">A BETTER STARTING POINT</div><div className="process-layout"><h2>Your search,<br /><em>made intentional.</em></h2><div className="process-list">{STEPS.map(([number, title, body]) => <div className="process-item" key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div><Check size={16} /></div>)}</div></div></section>

        <section className="final-cta"><div className="cta-mark"><Target size={24} /></div><div><div className="section-label">READY WHEN YOU ARE</div><h2>Make your next application count.</h2><p>Start with a profile that reflects where you are—and where you are going.</p></div><button onClick={handleStart} className="btn-primary btn-large">Get started <ArrowUpRight size={17} /></button></section>
      </main>

      <footer className="site-footer"><div><strong>AVSAR</strong><span>AI Vocation & Skill Alignment Recommender</span></div><span>© {new Date().getFullYear()} AVSAR</span><button onClick={() => navigate('/terms')}>Data & terms</button></footer>
      <AuthModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default LandingPage;
