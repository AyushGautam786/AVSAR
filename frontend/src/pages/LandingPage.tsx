import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Briefcase, CheckCircle, Component, GraduationCap, IndianRupee, LayoutTemplate, Users, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Header from '../components/Header';

/*interface Company {
    id: string;
    name: string;
    logo: string;
    industry: string;
    description: string;
    roles: string[];
    eligibility: string[];
}

const mockCompanies: Company[] = [
    {
        id: "1",
        name: "TechCorp",
        logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
        industry: "Technology",
        description: "Leading software development company focused on AI and machine learning solutions.",
        roles: ["Software Engineering Intern", "Data Science Intern", "Product Management Intern"],
        eligibility: ["Computer Science or related field", "GPA 3.0+", "Programming experience"]
    },
    {
        id: "2",
        name: "FinanceFirst",
        logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=200&fit=crop",
        industry: "Finance",
        description: "Investment banking and financial services with global reach and innovative solutions.",
        roles: ["Investment Banking Intern", "Financial Analyst Intern", "Risk Management Intern"],
        eligibility: ["Finance, Economics, or Business major", "Strong analytical skills", "Excel proficiency"]
    },
    {
        id: "3",
        name: "HealthTech Solutions",
        logo: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=200&h=200&fit=crop",
        industry: "Healthcare",
        description: "Digital health platform improving patient outcomes through technology innovation.",
        roles: ["Healthcare IT Intern", "Clinical Research Intern", "UX Design Intern"],
        eligibility: ["Healthcare, IT, or Design background", "Interest in digital health", "Team collaboration skills"]
    },
    {
        id: "4",
        name: "GreenEnergy Co",
        logo: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=200&h=200&fit=crop",
        industry: "Energy",
        description: "Renewable energy solutions and sustainable technology development company.",
        roles: ["Environmental Engineering Intern", "Sustainability Analyst Intern", "Project Management Intern"],
        eligibility: ["Engineering or Environmental Science", "Sustainability focus", "Project experience prefergray"]
    },
    {
        id: "5",
        name: "MediaMakers",
        logo: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=200&fit=crop",
        industry: "Media",
        description: "Creative content production and digital marketing agency with award-winning campaigns.",
        roles: ["Marketing Intern", "Content Creation Intern", "Social Media Intern"],
        eligibility: ["Marketing, Communications, or Design", "Creative portfolio", "Social media savvy"]
    },
    {
        id: "6",
        name: "RetailRevolution",
        logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop",
        industry: "Retail",
        description: "E-commerce platform revolutionizing online shopping experiences worldwide.",
        roles: ["E-commerce Analyst Intern", "Supply Chain Intern", "Customer Experience Intern"],
        eligibility: ["Business, Supply Chain, or related field", "Analytical mindset", "Customer service experience"]
    },
    {
        id: "7",
        name: "EduTech Innovations",
        logo: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&h=200&fit=crop",
        industry: "Education",
        description: "Educational technology platform making learning accessible and engaging for all students.",
        roles: ["EdTech Product Intern", "Learning Design Intern", "Data Analytics Intern"],
        eligibility: ["Education, Psychology, or Technology", "Passion for learning", "User research interest"]
    },
    {
        id: "8",
        name: "AutoFuture",
        logo: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=200&fit=crop",
        industry: "Automotive",
        description: "Electric vehicle manufacturer pioneering autonomous driving technology.",
        roles: ["Automotive Engineering Intern", "AI Research Intern", "Manufacturing Intern"],
        eligibility: ["Engineering or Computer Science", "Interest in autonomous systems", "Problem-solving skills"]
    }
];*/

const faqs = [
    {
        question: "What is the minimum age requirement?",
        answer: "You must be at least 16 years old to apply for internships through our platform."
    },
    {
        question: "Do I need to be enrolled in college?",
        answer: "Most internships require current enrollment in a college or university program, though some accept high school students."
    },
    {
        question: "Can international students apply?",
        answer: "Yes, many companies welcome international students. Visa requirements vary by company and location."
    },
    {
        question: "What if I don't meet all eligibility requirements?",
        answer: "Requirements are often flexible. We recommend applying if you meet most criteria and can demonstrate relevant skills or passion."
    }
];

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

    const [eligibilityAge, setEligibilityAge] = useState("");
    const [eligibilityEducation, setEligibilityEducation] = useState("");
    const [eligibilityResult, setEligibilityResult] = useState<{ eligible: boolean; reason: string } | null>(null);
    const [openFaq, setOpenFaq] = useState<string | null>(null);
    const [employmentStatus, setEmploymentStatus] = useState("");
    const [familyIncome, setFamilyIncome] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [showLoginDialog, setShowLoginDialog] = useState(false);
    const [previousExperience, setPreviousExperience] = useState("");

    const handleScrollTo = useCallback((elementId: string) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    const handleGetRecommendations = () => {
        if (!authLoading && !user) {
            setShowLoginDialog(true);
            return;
        }

        if (user) {
            navigate('/recommendations');
        }
    };

    /*const filtegrayCompanies = mockCompanies.filter(company => {
        const matchesName = company.name.toLowerCase().includes(companyFilter.toLowerCase());
        const matchesIndustry = industryFilter === "all" || company.industry === industryFilter;
        return matchesName && matchesIndustry;
    });

    const industries = Array.from(new Set(mockCompanies.map(c => c.industry)));*/

    const checkEligibility = () => {
        if (!eligibilityAge || !eligibilityEducation) return;

        const age = parseInt(eligibilityAge);
        let eligible = true;
        let reason = "";

        if (age < 16) {
            eligible = false;
            reason = "Minimum age requirement is 16 years old.";
        } else if (age > 25) {
            eligible = false;
            reason = "Most internships target students under 25.";
        } else if (eligibilityEducation === "high-school" && age < 18) {
            eligible = false;
            reason = "High school students must be at least 18 years old.";
        } else {
            reason = "You meet the basic eligibility requirements!";
        }

        setEligibilityResult({ eligible, reason });
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <Header
                user={user}
                onSignOut={handleSignOut}
                onSignIn={signInWithGoogle}
            />

            <main className="space-y-16">
                {/* Hero Section */}
                <section id="home" className="pb-36 pt-48 max-w-11/12 mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight text-gray-900">
                                AI-Based Internship Recommendation Engine
                            </h1>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                Find the perfect internship match with our intelligent recommendation system.
                                We analyze your skills, interests, and career goals to connect you with
                                opportunities that align with your professional development journey.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={handleGetRecommendations}
                                    className="px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-black/80 transition-colors"
                                >
                                    Get Recommended Internships
                                </button>
                                <button
                                    onClick={() => handleScrollTo("companies")}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Browse Companies
                                </button>
                            </div>
                            {!authLoading && !user && (
                                <p className="text-sm text-gray-500">
                                    Please log in to get personalized internship recommendations
                                </p>
                            )}
                        </div>
                        <div className="relative">
                            <div className="p-6 bg-white shadow-lg rounded-lg">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Component className="h-8 w-8 text-black" />
                                        <h3 className="font-semibold">Smart Matching</h3>
                                    </div>
                                    <p className="text-sm text-gray-600">
                                        Our AI analyzes 50+ factors including your academic background,
                                        skills, location preferences, and career interests to find the
                                        most relevant internship opportunities.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-black">95%</div>
                                            <div className="text-xs text-gray-500">Match Rate</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-black">2.5k+</div>
                                            <div className="text-xs text-gray-500">Companies</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Companies Section 
                <section id="companies" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold text-gray-900">Browse Companies</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                Explore leading companies offering internship opportunities across various industries
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search companies..."
                                    value={companyFilter}
                                    onChange={(e) => setCompanyFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/80"
                                />
                            </div>
                            <select
                                value={industryFilter}
                                onChange={(e) => setIndustryFilter(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black/80"
                            >
                                <option value="all">All Industries</option>
                                {industries.map(industry => (
                                    <option key={industry} value={industry}>{industry}</option>
                                ))}
                            </select>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="p-6 bg-white rounded-lg shadow">
                                        <div className="space-y-4">
                                            <LoadingSkeleton className="w-16 h-16 rounded-lg" />
                                            <div className="space-y-2">
                                                <LoadingSkeleton className="h-5 w-32" />
                                                <LoadingSkeleton className="h-4 w-24" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filtegrayCompanies.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filtegrayCompanies.map(company => (
                                    <div
                                        key={company.id}
                                        className="p-6 bg-white rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow"
                                        onClick={() => setSelectedCompany(company)}
                                    >
                                        <div className="space-y-4">
                                            <img
                                                src={company.logo}
                                                alt={`${company.name} logo`}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <div>
                                                <h3 className="font-semibold">{company.name}</h3>
                                                <p className="text-sm text-gray-500">{company.industry}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                                                    {company.roles.length} positions
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center bg-white rounded-lg shadow">
                                <p className="text-gray-500">No companies match your search criteria.</p>
                            </div>
                        )}
                    </div>
                    
                    {selectedCompany && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={selectedCompany.logo}
                                                alt={`${selectedCompany.name} logo`}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                            <div>
                                                <h3 className="text-xl font-bold">{selectedCompany.name}</h3>
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                                                    {selectedCompany.industry}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCompany(null)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <p className="text-gray-600">{selectedCompany.description}</p>

                                        <div>
                                            <h4 className="font-semibold mb-3">Available Internship Roles</h4>
                                            <div className="grid gap-2">
                                                {selectedCompany.roles.map((role, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <PanelRight className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm">{role}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold mb-3">Eligibility Requirements</h4>
                                            <div className="grid gap-2">
                                                {selectedCompany.eligibility.map((req, index) => (
                                                    <div key={index} className="flex items-center gap-2">
                                                        <TableOfContents className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm">{req}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {user && (
                                            <div className="pt-4 border-t border-gray-200">
                                                <button className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors">
                                                    Apply to {selectedCompany.name}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
                */}

                {/* Eligibility Section */}
                <section id="eligibility" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-8">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl font-bold text-gray-900">Eligibility Requirements</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                Check if you meet the requirements for Indian internship opportunities
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Requirements Card */}
                            <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-100">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-4">
                                        <LayoutTemplate className="h-5 w-5" />
                                        <h3 className="text-xl font-bold text-gray-900">Eligibility Criteria</h3>
                                    </div>

                                    {/* Age Requirements */}
                                    <div className="bg-gray-100 p-4 rounded-lg border-l-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-4 w-4" />
                                            <h4 className="font-semibold">Age Requirements</h4>
                                        </div>
                                        <p className="text-sm">Must be between 21-24 years old</p>
                                    </div>

                                    {/* Family Income */}
                                    <div className="bg-gray-100 p-4 rounded-lg border-l-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IndianRupee className="h-4 w-4" />
                                            <h4 className="font-semibold">Family Income</h4>
                                        </div>
                                        <p className="text-sm">Annual family income must be less than ₹8 lakhs</p>
                                    </div>

                                    {/* Employment Status */}
                                    <div className="bg-gray-100 p-4 rounded-lg border-l-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Briefcase className="h-4 w-4" />
                                            <h4 className="font-semibold">Employment Status</h4>
                                        </div>
                                        <p className="text-sm">Must not be fully employed or in full-time education</p>
                                    </div>

                                    {/* Education Requirements */}
                                    <div className="bg-gray-100 p-4 rounded-lg border-l-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <GraduationCap className="h-4 w-4" />
                                            <h4 className="font-semibold">Education Requirements</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-800 font-medium">Must have completed any one of:</p>
                                            <ul className="text-sm text-gray-700 space-y-1 ml-4">
                                                <li>• Higher Secondary Education (High School)</li>
                                                <li>• ITI Certificate</li>
                                                <li>• Diploma from a Polytechnic Institute</li>
                                                <li>• Graduate degree (B.A., B.Sc., B.Com., B.C.A., B.B.A., B.Pharma)</li>
                                            </ul>
                                            <div className="mt-3 p-3 bg-gray-100 rounded border">
                                                <p className="text-sm text-gray-800 font-medium">Not eligible if you have:</p>
                                                <ul className="text-xs text-gray-700 mt-1 space-y-1">
                                                    <li>• CA, CMA, CS, MBBS, BDS, MBA or higher degrees</li>
                                                    <li>• Studied from IITs, IIMs, National Law Universities, IISERs, NIDs, IIITs</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Previous Experience */}
                                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertCircle className="h-4 w-4 text-gray-600" />
                                            <h4 className="font-semibold text-gray-900">Previous Experience</h4>
                                        </div>
                                        <p className="text-sm text-gray-700">Must not have completed any skill development, apprenticeship, or internship program under Central or State Government schemes</p>
                                    </div>
                                </div>
                            </div>

                            {/* Eligibility Checker */}
                            <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-100">
                                <div className="space-y-4">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-gray-900">Check Your Eligibility</h3>
                                        <p className="text-gray-600">Enter your information to get an instant eligibility assessment</p>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-gray-700">Age</label>
                                        <input
                                            type="number"
                                            placeholder="Enter your age"
                                            value={eligibilityAge}
                                            onChange={(e) => setEligibilityAge(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-gray-700">Education Level</label>
                                        <select
                                            value={eligibilityEducation}
                                            onChange={(e) => setEligibilityEducation(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        >
                                            <option value="">Select education level</option>
                                            <option value="high-school">Higher Secondary Education (High School)</option>
                                            <option value="iti">ITI Certificate</option>
                                            <option value="diploma">Polytechnic Diploma</option>
                                            <option value="graduate">Graduate Degree (B.A/B.Sc/B.Com/etc.)</option>
                                            <option value="excluded">CA/CMA/CS/MBBS/MBA/Premium Institute</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-gray-700">Annual Family Income</label>
                                        <select
                                            value={familyIncome}
                                            onChange={(e) => setFamilyIncome(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        >
                                            <option value="">Select income range</option>
                                            <option value="below-8lakhs">Below ₹8 lakhs</option>
                                            <option value="above-8lakhs">Above ₹8 lakhs</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-gray-700">Current Status</label>
                                        <select
                                            value={employmentStatus}
                                            onChange={(e) => setEmploymentStatus(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        >
                                            <option value="">Select current status</option>
                                            <option value="unemployed">Unemployed/Job Seeking</option>
                                            <option value="part-time">Part-time Work/Study</option>
                                            <option value="fully-employed">Fully Employed</option>
                                            <option value="full-time-education">Full-time Student</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium mb-2 block text-gray-700">Previous Government Programs</label>
                                        <select
                                            value={previousExperience}
                                            onChange={(e) => setPreviousExperience(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                                        >
                                            <option value="">Select option</option>
                                            <option value="no">No previous government programs</option>
                                            <option value="yes">Completed government skill/internship program</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={checkEligibility}
                                        className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                                    >
                                        Check Eligibility
                                    </button>

                                    {eligibilityResult && (
                                        <div className={`p-4 rounded-lg border-l-4 ${eligibilityResult.eligible
                                                ? 'bg-green-50 border-green-400 text-green-800'
                                                : 'bg-gray-50 border-gray-400 text-gray-800'
                                            }`}>
                                            <div className="flex items-center gap-2">
                                                {eligibilityResult.eligible ? (
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <XCircle className="h-5 w-5 text-gray-600" />
                                                )}
                                                <p className="text-sm font-medium">
                                                    {eligibilityResult.eligible ? 'Eligible for Program' : 'Not Eligible'}
                                                </p>
                                            </div>
                                            <p className="text-sm mt-1">{eligibilityResult.reason}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* FAQs */}
                        <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-100">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h3>
                            </div>
                            <div className="space-y-4">
                                {[
                                    {
                                        question: "What if I'm 20 years old but will turn 21 soon?",
                                        answer: "You must be 21 years old at the time of application. You can apply once you turn 21."
                                    },
                                    {
                                        question: "I have a diploma and am currently working part-time. Am I eligible?",
                                        answer: "Yes, part-time work is allowed. You're only ineligible if you're fully employed or in full-time education."
                                    },
                                    {
                                        question: "What counts as family income?",
                                        answer: "Family income includes the total annual income of all earning members in your household, including parents, siblings, and spouse if married."
                                    },
                                    {
                                        question: "I completed a free online government course. Does this disqualify me?",
                                        answer: "Only formal skill development, apprenticeship, or internship programs under Central or State Government schemes are disqualifying. Online courses typically don't count."
                                    },
                                    {
                                        question: "Can I apply with a B.Tech degree from a regular college?",
                                        answer: "Yes, B.Tech from regular colleges is acceptable. Only degrees from premium institutes like IITs, IIMs, etc. are excluded."
                                    }
                                ].map((faq, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg">
                                        <button
                                            onClick={() => setOpenFaq(openFaq === faq.question ? null : faq.question)}
                                            className="flex w-full items-center justify-between p-4 text-left font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black rounded-lg"
                                        >
                                            {faq.question}
                                            <span className={`ml-2 text-gray-500 transform transition-transform duration-200 ${openFaq === faq.question ? 'rotate-45' : ''
                                                }`}>
                                                +
                                            </span>
                                        </button>
                                        {openFaq === faq.question && (
                                            <div className="px-4 py-4">
                                                <p className="text-gray-600">{faq.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Login Dialog */}
                {showLoginDialog && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <div className="text-center space-y-4">
                                <h3 className="text-xl font-bold text-gray-900">Welcome to PMIS SIH</h3>
                                <p className="text-gray-600">Sign in to get personalized internship recommendations</p>
                                <button
                                    onClick={() => {
                                        signInWithGoogle();
                                        setShowLoginDialog(false);
                                    }}
                                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black/80"
                                >
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign In with Google
                                </button>
                                <button
                                    onClick={() => setShowLoginDialog(false)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="px-8 py-6 bg-white shadow text-center text-gray-600 border-t">
                © {new Date().getFullYear()} PMIS SIH. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;