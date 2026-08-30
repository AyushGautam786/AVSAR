import React from 'react';
import { Plus, Award, TrendingUp, MapPin, Calendar, ExternalLink } from 'lucide-react';
import type { Student, Recommendation } from '../types';
import RecommendationCard from '../components/RecommendationCard';
import CustomFormModal from '../components/CustomFormModal';

interface RecommendationsTabProps {
  students: Student[];
  selectedStudent: Student | null;
  recommendations: Recommendation[];
  loading: boolean;
  currentStudent: Student | null;
  onStudentSelect: (student: Student) => void;
  onShowCustomForm: () => void;
  // Add these props for the custom form modal
  customForm: any;
  setCustomForm: any;
  showCustomForm: boolean;
  setShowCustomForm: (show: boolean) => void;
  availableDomains: string[];
  availableLocations: string[];
  availableSkills: string[];
  onCustomFormSubmit: () => void;
  onCustomFormReset: () => void;
  customFormError: string | null;
}

// Hardcoded trending internships data
const trendingInternships = [
  {
    id: 1,
    title: "AI/ML Engineering Intern",
    company: "TechCorp AI",
    location: "San Francisco, CA",
    domain: "Artificial Intelligence",
    duration: "12 weeks",
    description: "Work on cutting-edge machine learning models and AI applications",
    tags: ["Python", "TensorFlow", "PyTorch", "Neural Networks"],
    trending_score: 95
  },
  {
    id: 2,
    title: "Data Science Intern",
    company: "DataInsights Inc",
    location: "Remote",
    domain: "Data Science",
    duration: "10 weeks",
    description: "Analyze large datasets and create predictive models for business insights",
    tags: ["Python", "SQL", "Tableau", "Statistics"],
    trending_score: 88
  },
  {
    id: 3,
    title: "Full-Stack Web Developer",
    company: "WebSolutions Pro",
    location: "Austin, TX",
    domain: "Web Development",
    duration: "16 weeks",
    description: "Build modern web applications using latest technologies",
    tags: ["React", "Node.js", "MongoDB", "TypeScript"],
    trending_score: 82
  },
  {
    id: 4,
    title: "Cybersecurity Analyst Intern",
    company: "SecureNet Systems",
    location: "Washington, DC",
    domain: "Cybersecurity",
    duration: "14 weeks",
    description: "Help protect digital infrastructure and analyze security threats",
    tags: ["Network Security", "Penetration Testing", "SIEM", "Risk Assessment"],
    trending_score: 79
  }
];

const TrendingInternshipCard: React.FC<{ internship: typeof trendingInternships[0] }> = ({ internship }) => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
    <div className="flex items-start justify-between mb-3">
      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
        {internship.domain}
      </span>
    </div>
    
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{internship.title}</h3>
    <p className="text-gray-700 font-medium mb-2">{internship.company}</p>
    
    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
      <div className="flex items-center space-x-1">
        <MapPin className="h-4 w-4" />
        <span>{internship.location}</span>
      </div>
      <div className="flex items-center space-x-1">
        <Calendar className="h-4 w-4" />
        <span>{internship.duration}</span>
      </div>
    </div>
    
    <p className="text-gray-600 text-sm mb-4">{internship.description}</p>
    
    <div className="flex flex-wrap gap-2 mb-4">
      {internship.tags.map((tag, index) => (
        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
          {tag}
        </span>
      ))}
    </div>
    
    <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
      <span>View Details</span>
      <ExternalLink className="h-4 w-4" />
    </button>
  </div>
);

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  students,
  selectedStudent,
  recommendations,
  loading,
  onStudentSelect,
  onShowCustomForm,
  customForm,
  setCustomForm,
  showCustomForm,
  setShowCustomForm,
  availableDomains,
  availableLocations,
  availableSkills,
  onCustomFormSubmit,
  onCustomFormReset,
  customFormError
}) => {
  return (
    <div>
      {/* Trending Internships Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Trending Internships</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <TrendingUp className="h-4 w-4" />
            <span>Most popular domains this month</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingInternships.map((internship) => (
            <TrendingInternshipCard key={internship.id} internship={internship} />
          ))}
        </div>
      </div>

      {/* Custom Profile Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Personalized Recommendations</h3>
              <p className="text-gray-600">Create your custom profile to receive tailored internship recommendations based on your skills, interests, and preferences.</p>
            </div>
            <button
              onClick={onShowCustomForm}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap ml-4"
            >
              <Plus className="h-4 w-4" />
              <span>Create Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Getting personalized recommendations...</p>
        </div>
      ) : recommendations.length > 0 ? (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6">
            Personalized Recommendations {selectedStudent ? `for ${selectedStudent.name}` : ''}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={rec.internship_id} rec={rec} index={index} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Award className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No personalized recommendations yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a custom profile to see personalized recommendations tailored to your preferences.
          </p>
        </div>
      )}

      {/* Custom Form Modal */}
      <CustomFormModal
        customForm={customForm}
        setCustomForm={setCustomForm}
        showCustomForm={showCustomForm}
        setShowCustomForm={setShowCustomForm}
        availableDomains={availableDomains}
        availableLocations={availableLocations}
        availableSkills={availableSkills}
        loading={loading}
        onSubmit={onCustomFormSubmit}
        onReset={onCustomFormReset}
        error={customFormError}
      />
    </div>
  );
};

export default RecommendationsTab;