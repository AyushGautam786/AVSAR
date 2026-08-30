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
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Don't render if not authenticated (will redirect)
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Header
                user={user}
                onSignOut={handleSignOut}
                onSignIn={signInWithGoogle}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
                {stats && <AnalyticsTab stats={stats} />}
            </main>
        </div>
    );
};

export default AnalyticsPage;