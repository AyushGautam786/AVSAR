import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import AnalyticsTab from '../components/AnalyticsTab';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';

const AnalyticsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
    const { stats, fetchStats } = useApi();

    // Redirect to landing page if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    // Fetch stats data when authenticated
    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user, fetchStats]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    // Show loading spinner while checking auth state
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!user) {
        return null;
    }

    return (
        <div className="page-container">
            <Header
                user={user}
                onSignOut={handleSignOut}
                onSignIn={signInWithGoogle}
            />

            <main className="page-main">
                {stats && <AnalyticsTab stats={stats} />}
            </main>
        </div>
    );
};

export default AnalyticsPage;