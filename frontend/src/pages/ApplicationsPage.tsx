import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ExternalLink, Clock, LayoutDashboard, ArrowRight } from 'lucide-react';
import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import DarkSelect from '../components/DarkSelect';

const STATUS_STYLES: Record<string, string> = {
  saved:       'badge-gray',
  applied:     'badge-indigo',
  interviewing:'badge-amber',
  offered:     'badge-green',
  rejected:    'badge-red',
};

const ApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { myApplications, fetchMyApplications, saveApplication } = useApi();
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => { if (!authLoading && !user) navigate('/'); }, [user, authLoading, navigate]);
  useEffect(() => {
    if (user) { setIsLoading(true); fetchMyApplications().finally(() => setIsLoading(false)); }
  }, [user, fetchMyApplications]);

  const handleStatusChange = async (applicationId: string, internshipId: string, newStatus: string) => {
    setUpdatingId(applicationId);
    await saveApplication(internshipId, newStatus as any);
    await fetchMyApplications();
    setUpdatingId(null);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="page-container">
      <Header user={user} onSignOut={handleSignOut} onSignIn={signInWithGoogle} />

      <main className="page-main">
        {/* Page header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>My Applications</h1>
            <p className="text-gray-500 text-sm mt-0.5">Track and manage your internship applications</p>
          </div>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass-card p-5 flex gap-4">
                <div className="shimmer h-12 w-12 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="shimmer h-4 rounded-lg w-1/2" />
                  <div className="shimmer h-3 rounded-lg w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && myApplications.length === 0 && (
          <div className="glass-card p-16 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="h-10 w-10 text-indigo-500/50" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No applications yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Browse internships and save the ones you like — they'll appear here.
            </p>
            <button
              onClick={() => navigate('/internships')}
              className="btn-primary mx-auto"
            >
              Browse Internships
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Applications list */}
        {!isLoading && myApplications.length > 0 && (
          <div className="space-y-3">
            {myApplications.map((app: any, i: number) => {
              const internship = app.internship ?? {};
              return (
                <div
                  key={app.id}
                  className={`glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in-up delay-${Math.min(i * 50, 400)}`}
                >
                  {/* Company logo/icon */}
                  {internship.company_logo ? (
                    <img
                      src={internship.company_logo}
                      alt={internship.company_name}
                      className="h-12 w-12 rounded-xl object-contain border border-white/10 shrink-0 bg-white/5 p-1"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-indigo-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{internship.role_title || 'Internship'}</p>
                    <p className="text-sm text-gray-500 truncate">{internship.company_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {internship.domain && <span className="badge badge-indigo text-xs">{internship.domain}</span>}
                      {internship.location && <span className="text-xs text-gray-600">{internship.location}</span>}
                      <span className="text-gray-700">·</span>
                      <span className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        {new Date(app.created_at).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <DarkSelect
                      value={app.status}
                      onChange={val => handleStatusChange(app.id, app.internship_id, val)}
                      disabled={updatingId === app.id}
                      options={Object.keys(STATUS_STYLES).map(s => ({
                        value: s,
                        label: s.charAt(0).toUpperCase() + s.slice(1),
                      }))}
                      className="w-36"
                    />

                    {internship.apply_url && (
                      <a
                        href={internship.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Apply
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default ApplicationsPage;
