import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ErrorAlert from '../components/Error_Alert';
import RecommendationsTab from '../components/RecommendationsTab';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import type { Student, Recommendation, CustomFormData } from '../types';

const RecommendationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Custom recommendation form state
    const [customForm, setCustomForm] = useState<CustomFormData>({
        name: '',
        preferred_domains: [],
        preferred_locations: [],
        skills: [],
        interests: []
    });
    const [showCustomForm, setShowCustomForm] = useState<boolean>(false);

    // Auth hook
    const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

    const {
        students,
        availableDomains,
        availableLocations,
        availableSkills,
        currentStudent,
        fetchStudents,
        fetchAvailableOptions,
        fetchRecommendations,
        fetchCustomRecommendations,
        fetchStudentProfile,
    } = useApi();

    // Redirect to landing page if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    // Fetch student profile when user is authenticated
    useEffect(() => {
        if (user && !currentStudent) {
            fetchStudentProfile(user);
        }
    }, [user, currentStudent, fetchStudentProfile]);

    // Fetch initial data when authenticated
    useEffect(() => {
        if (user) {
            const initializeData = async () => {
                const studentsResult = await fetchStudents();
                await fetchAvailableOptions();

                // If we have a current student profile, use it as selected
                if (currentStudent) {
                    setSelectedStudent(currentStudent);
                    handleFetchRecommendations(currentStudent.id);
                } else if (studentsResult.data && studentsResult.data.length > 0) {
                    setSelectedStudent(studentsResult.data[0]);
                    handleFetchRecommendations(studentsResult.data[0].id);
                }
            };

            initializeData();
        }
    }, [user, currentStudent]);

    const handleFetchRecommendations = async (studentId: number) => {
        setLoading(true);
        setError(null);

        const result = await fetchRecommendations(studentId);

        if (result.data) {
            setRecommendations(result.data);
        } else if (result.error) {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleFetchCustomRecommendations = async () => {
        if (!customForm.preferred_domains.length || !customForm.preferred_locations.length || !customForm.skills.length) {
            setError('Please fill in all required fields (domains, locations, skills)');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await fetchCustomRecommendations(customForm);

        if (result.data) {
            setRecommendations(result.data);
            setShowCustomForm(false);
            setSelectedStudent(null); // Clear selected student for custom recommendations
        } else if (result.error) {
            setError(result.error);
        }

        setLoading(false);
    };

    const handleStudentSelect = (student: Student) => {
        setSelectedStudent(student);
        handleFetchRecommendations(student.id);
    };

    const resetCustomForm = () => {
        setCustomForm({
            name: '',
            preferred_domains: [],
            preferred_locations: [],
            skills: [],
            interests: []
        });
    };

    const handleShowCustomForm = () => {
        setShowCustomForm(true);
    };

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
                {error && (
                    <ErrorAlert error={error} onClose={() => setError(null)} />
                )}

                <RecommendationsTab
                    students={students}
                    selectedStudent={selectedStudent}
                    recommendations={recommendations}
                    loading={loading}
                    currentStudent={currentStudent}
                    onStudentSelect={handleStudentSelect}
                    onShowCustomForm={handleShowCustomForm}
                    customForm={customForm}
                    setCustomForm={setCustomForm}
                    showCustomForm={showCustomForm}
                    setShowCustomForm={setShowCustomForm}
                    availableDomains={availableDomains}
                    availableLocations={availableLocations}
                    availableSkills={availableSkills}
                    onCustomFormSubmit={handleFetchCustomRecommendations}
                    onCustomFormReset={resetCustomForm}
                    customFormError={error}
                />
            </main>
        </div>
    );
};

export default RecommendationsPage;