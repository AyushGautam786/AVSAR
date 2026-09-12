import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, BarChart3, BrainCircuit, Check, ChevronRight, FileText, LockKeyhole, Target } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';
import AuthModal from '../components/AuthModal';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const start = () => { if (!authLoading && !user) setLoginOpen(true); else navigate('/recommendations'); };
  const logout = async () => { await signOut(); navigate('/'); };

  return <div className="v0-landing site-shell">
    <div className="ambient-field" aria-hidden="true" />
    <Header user={user} onSignOut={logout} onSignIn={() => setLoginOpen(true)} />
    <main>
      <section className="v0-hero">
        <div className="v0-hero-copy">
          <div className="eyebrow"><span className="eyebrow-rule" /> AVSAR / CAREER INTELLIGENCE</div>
          <h1>Make your<br /><span>next move</span><br />count.</h1>
          <p>AVSAR turns a scattered internship search into a focused system for discovering, preparing, and applying to roles that fit your signal.</p>
          <div className="v0-hero-actions"><button onClick={start} className="btn-primary btn-large">Build my profile <ArrowUpRight size={17} /></button><button onClick={() => navigate('/internships')} className="btn-link">Explore the market <ChevronRight size={16} /></button></div>
          <div className="v0-proof"><span><Check size={13} /> Built for ambitious students</span><span><LockKeyhole size={13} /> Your data stays private</span></div>
        </div>
        <div className="signal-dashboard" aria-label="AVSAR product preview">
          <div className="signal-dashboard-top"><span>CAREER SIGNAL / 01</span><span className="live-dot">● LIVE</span></div>
          <div className="signal-dashboard-title"><div><small>PROFILE STRENGTH</small><h2>Software & data</h2></div><div className="signal-score">84<span>/100</span></div></div>
          <div className="signal-progress"><span /></div>
          <div className="signal-grid-mini"><div><small>SKILLS</small><strong>12</strong><em>verified</em></div><div><small>ROLES</small><strong>48</strong><em>shortlisted</em></div><div><small>FIT</small><strong>91%</strong><em>top match</em></div></div>
          <div className="signal-match"><div className="signal-match-head"><span>Recommended next</span><span>VIEW ALL <ArrowUpRight size={13} /></span></div>{[['Product engineer intern','Bengaluru · Hybrid','95%'],['Data science intern','Pune · Remote','88%'],['ML research intern','Bengaluru · On-site','81%']].map(([role, place, score], index) => <div className="signal-match-row" key={role}><span className="row-index">0{index + 1}</span><div><strong>{role}</strong><small>{place}</small></div><b>{score}</b></div>)}</div>
          <div className="signal-dashboard-footer"><span><span className="status-dot" /> Updated moments ago</span><span>AI RANKING ENGINE</span></div>
        </div>
      </section>

      <section className="v0-intro"><div className="section-label">THE AVSAR METHOD</div><div><h2>Clarity is a competitive advantage.</h2><p>Most job boards give you more tabs. AVSAR gives you a better point of view—using your skills, preferences, and feedback to surface the opportunities worth the work.</p></div></section>

      <section className="v0-bento"><article className="bento-card bento-primary"><div className="bento-icon"><BrainCircuit size={21} /></div><small>01 / MATCHING</small><h3>Know where you have an edge.</h3><p>Recommendations are ranked around your actual capabilities—not just keywords in a job title.</p><span className="bento-line" /></article><article className="bento-card bento-secondary"><div className="bento-icon"><FileText size={21} /></div><small>02 / RESUME LAB</small><h3>Make your proof clearer.</h3><p>Shape your resume around the role while keeping every claim honest and yours.</p><span className="bento-line" /></article><article className="bento-card bento-tertiary"><div className="bento-icon"><BarChart3 size={21} /></div><small>03 / MOMENTUM</small><h3>See the next best move.</h3><p>Track saved roles and applications so your search becomes a process, not a pile.</p><span className="bento-line" /></article><article className="bento-card bento-wide"><div><small>DESIGNED FOR THE FIRST SERIOUS STEP</small><h3>Less noise.<br /><em>More signal.</em></h3></div><div className="bento-metric"><strong>4×</strong><span>focused workflow<br />over job-board sprawl</span></div></article></section>

      <section className="v0-process"><div className="section-label">A SIMPLE LOOP</div><div className="process-steps">{[['01','Build your signal','Tell us what you know and where you want to go.'],['02','Review your matches','Understand why a role fits before you spend time applying.'],['03','Apply with intent','Tailor, save, track, and move forward with confidence.']].map(([n,title,body]) => <div className="process-step" key={n}><span>{n}</span><div><h3>{title}</h3><p>{body}</p></div><ArrowUpRight size={17} /></div>)}</div></section>

      <section className="v0-cta"><div className="cta-symbol"><Target size={24} /></div><div><small>READY WHEN YOU ARE</small><h2>Start with a clearer signal.</h2><p>Build a profile that helps the right opportunity find you.</p></div><button onClick={start} className="btn-primary btn-large">Get started <ArrowUpRight size={17} /></button></section>
    </main>
    <footer className="site-footer"><div><strong>AVSAR</strong><span>AI Vocation & Skill Alignment Recommender</span></div><span>© {new Date().getFullYear()} AVSAR</span><button onClick={() => navigate('/terms')}>Data & terms</button></footer>
    <AuthModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
  </div>;
};
export default LandingPage;
