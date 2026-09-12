import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, BriefcaseBusiness, ChevronDown, FileText, LayoutDashboard, LogIn, LogOut, Menu, ShieldCheck, Sparkles, Trash2, UserRound, X, Zap } from 'lucide-react';
import AuthModal from './AuthModal';

interface UserType { id: string; email?: string; user_metadata: { name?: string; avatar_url?: string; picture?: string } }
interface HeaderProps { user: UserType | null; onSignIn?: () => void; onSignOut: () => void }

const NAV_LINKS = [
  { to: '/recommendations', label: 'Matches', icon: Sparkles },
  { to: '/internships', label: 'Explore roles', icon: BriefcaseBusiness },
  { to: '/applications', label: 'Applications', icon: LayoutDashboard },
  { to: '/analytics', label: 'Insights', icon: Activity },
  { to: '/resume-tailor', label: 'Resume lab', icon: FileText },
];

const Header: React.FC<HeaderProps> = ({ user, onSignIn, onSignOut }) => {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Student';
  const avatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=5146d8&color=fff&bold=true`;

  useEffect(() => { const close = (event: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, []);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const deleteAccount = async () => {
    if (!window.confirm('Delete your account? This permanently removes your profile, applications, resumes, and data.')) return;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);
      const { data } = await client.auth.getSession(); const token = data?.session?.access_token;
      if (!token) return;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) { alert('Account deleted.'); onSignOut(); } else { const error = await response.json(); alert(`Error: ${error.error || 'Unknown error'}`); }
    } catch (error) { alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`); }
    setMenuOpen(false);
  };

  return <>
    <header className="app-header">
      <div className="app-header-inner">
        <Link to="/" className="brand-lockup" aria-label="AVSAR home"><span className="brand-symbol"><Zap size={16} /></span><span className="brand-name">AVS<span>AR</span></span></Link>
        {user ? <nav className="main-nav" aria-label="Main navigation">{NAV_LINKS.map(({ to, label, icon: Icon }) => <Link key={to} to={to} aria-current={location.pathname === to ? 'page' : undefined}><Icon size={14} />{label}</Link>)}</nav> : <div style={{ flex: 1 }} />}
        <div className="header-actions">
          {user ? <div ref={menuRef} className="header-user"><button className="user-trigger" onClick={() => setMenuOpen(value => !value)} aria-expanded={menuOpen}><img src={avatar} alt="" /><span>{userName}</span><ChevronDown size={14} /></button>{menuOpen && <div className="user-menu glass-card animate-fade-in"><div className="user-menu-head"><UserRound size={15} /><div><strong>{userName}</strong><small>{user.email}</small></div></div><button onClick={() => { onSignOut(); setMenuOpen(false); }}><LogOut size={15} /> Sign out</button><button className="danger-action" onClick={deleteAccount}><Trash2 size={15} /> Delete account</button></div>}</div> : <button className="btn-primary header-auth" onClick={() => onSignIn ? onSignIn() : setAuthOpen(true)}><LogIn size={15} /> Sign in</button>}
          {user && <button className="mobile-menu-button" onClick={() => setMobileOpen(value => !value)} aria-label="Toggle navigation">{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>}
        </div>
      </div>
    </header>
    <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    {mobileOpen && user && <div className="mobile-nav-panel animate-fade-in"><nav>{NAV_LINKS.map(({ to, label, icon: Icon }) => <Link key={to} to={to} aria-current={location.pathname === to ? 'page' : undefined}><Icon size={17} />{label}</Link>)}<Link to="/terms"><ShieldCheck size={17} />Data & terms</Link></nav></div>}
  </>;
};
export default Header;
