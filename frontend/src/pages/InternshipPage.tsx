import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import InternshipsTab from '../components/InternshipsTab';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import type { Internship } from '../types';

const InternshipsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
    const {
        internships,
        internshipsMeta,
        fetchInternships,
        fetchAvailableOptions,
        availableDomains,
        saveApplication,
        fetchMyApplications,
        myApplications,
        logEvent,
    } = useApi();

    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeSearch, setActiveSearch] = useState('');
    const [activeDomain, setActiveDomain] = useState('');
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !user) navigate('/');
    }, [user, authLoading, navigate]);

    // Build saved IDs set from applications
    useEffect(() => {
        if (myApplications.length > 0) {
            setSavedIds(new Set(myApplications.map((a: any) => a.internship_id)));
        }
    }, [myApplications]);

    // Load internships + options when authenticated
    const loadData = useCallback(async (page = 1, q = '', domain = '') => {
        setIsLoading(true);
        await fetchInternships({ page, page_size: 15, q: q || undefined, domain: domain || undefined });
        setIsLoading(false);
    }, [fetchInternships]);

    useEffect(() => {
        if (user) {
            loadData();
            fetchAvailableOptions();
            fetchMyApplications();
        }
    }, [user, loadData, fetchAvailableOptions, fetchMyApplications]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        loadData(page, activeSearch, activeDomain);
    };

    const handleSearch = (q: string) => {
        setActiveSearch(q);
        setCurrentPage(1);
        loadData(1, q, activeDomain);
    };

    const handleFilterDomain = (domain: string) => {
        setActiveDomain(domain);
        setCurrentPage(1);
        loadData(1, activeSearch, domain);
    };

    const handleSave = async (internship: Internship) => {
        await saveApplication(internship.id, 'saved');
        await logEvent(internship.id, 'save');
        setSavedIds(prev => new Set(prev).add(internship.id));
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto" />
                    <p className="mt-4 text-gray-500 text-sm">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="page-container">
            <Header user={user} onSignOut={handleSignOut} onSignIn={signInWithGoogle} />
            <main className="page-main">
                <InternshipsTab
                    internships={internships}
                    totalPages={internshipsMeta?.total_pages ?? 1}
                    currentPage={currentPage}
                    isLoading={isLoading}
                    onPageChange={handlePageChange}
                    onSearch={handleSearch}
                    onFilterDomain={handleFilterDomain}
                    onSave={handleSave}
                    savedIds={savedIds}
                    availableDomains={availableDomains}
                    activeDomain={activeDomain}
                />
            </main>
        </div>
    );
};

export default InternshipsPage;
