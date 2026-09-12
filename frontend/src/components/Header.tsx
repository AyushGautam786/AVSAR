import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Zap, Home, Sparkles, Briefcase, LayoutDashboard,
  FileText, Shield, LogIn, LogOut, ChevronDown, Trash2, Menu, X
} from 'lucide-react';
import AuthModal from './AuthModal';

interface UserType {
  id: string;
  email?: string;
  user_metadata: {
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

interface HeaderProps {
  user: UserType | null;
  onSignIn?: () => void;
  onSignOut: () => void;
}

const NAV_LINKS = [
  { to: '/',               label: 'Home',            icon: Home },
  { to: '/recommendations',label: 'Recommendations', icon: Sparkles },
  { to: '/internships',    label: 'Internships',     icon: Briefcase },
  { to: '/applications',   label: 'Applications',    icon: LayoutDashboard },
  { to: '/analytics',      label: 'Analytics',       icon: LayoutDashboard },
  { to: '/resume-tailor',  label: 'Resume Tailor',   icon: FileText },
  { to: '/terms',          label: 'Data & Terms',    icon: Shield },
];

const Header: React.FC<HeaderProps> = ({ user, onSignIn, onSignOut }) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const getUserAvatar = () =>
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.user_metadata?.name || user?.email || 'U')}&background=6366f1&color=fff&bold=true`;

  const getUserName = () =>
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  const isActive = (path: string) => location.pathname === path;

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account? This permanently removes your profile, applications, resumes, and data.')) return;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_KEY);
      const { data } = await sb.auth.getSession();
      const token = data?.session?.access_token;
      if (token) {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) { alert('Account deleted.'); onSignOut(); }
        else { const err = await res.json(); alert(`Error: ${err.error || 'Unknown'}`); }
      }
    } catch (err: any) { alert(`Error: ${err.message}`); }
    setUserMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#0a0b14]/95 backdrop-blur-xl border-b border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
            : 'bg-[#0a0b14]/80 backdrop-blur-md border-b border-white/5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 mr-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center animate-pulse-glow">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text" style={{ fontFamily: 'var(--font-display)' }}>
                AVSAR
              </span>
            </Link>

            {/* Desktop Nav — only when logged in */}
            {user && (
              <nav className="hidden lg:flex items-center gap-1 flex-1 overflow-hidden">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      isActive(to)
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </Link>
                ))}
              </nav>
            )}

            {/* Spacer when not logged in */}
            {!user && <div className="flex-1" />}

            {/* Right Side */}
            <div className="flex items-center gap-3 ml-auto shrink-0">
              {user ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(v => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                  >
                    <img
                      src={getUserAvatar()}
                      alt={getUserName()}
                      className="h-7 w-7 rounded-full ring-2 ring-indigo-500/40"
                    />
                    <span className="hidden sm:block text-sm text-gray-300 font-medium max-w-[120px] truncate">
                      {getUserName()}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-52 glass-card rounded-xl shadow-2xl py-1 animate-scale-in z-50">
                      <div className="px-4 py-3 border-b border-white/8">
                        <p className="text-sm font-semibold text-white truncate">{getUserName()}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <button
                          onClick={() => { onSignOut(); setUserMenuOpen(false); }}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (onSignIn) onSignIn();
                    else setAuthModalOpen(true);
                  }}
                  className="btn-primary"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In / Sign Up
                </button>
              )}

              {/* Mobile hamburger — only when logged in */}
              {user && (
                <button
                  onClick={() => setMobileOpen(v => !v)}
                  className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Mobile nav panel */}
      {mobileOpen && user && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-16 left-0 right-0 glass border-b border-white/10 shadow-2xl animate-fade-in">
            <nav className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive(to)
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;