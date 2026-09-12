import React from 'react';
import { Plus, TrendingUp, Sparkles, Brain, Zap } from 'lucide-react';
import type { Student, Recommendation } from '../types';
import RecommendationCard from '../components/RecommendationCard';
import CustomFormModal from '../components/CustomFormModal';

interface RecommendationsTabProps {
  students?: Student[];
  selectedStudent: Student | null;
  recommendations: Recommendation[];
  loading: boolean;
  currentStudent: Student | null;
  onStudentSelect?: (student: Student) => void;
  onShowCustomForm: () => void;
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
  onApply?: (internshipId: string, applyUrl?: string) => void;
}

const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  selectedStudent,
  recommendations,
  loading,
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
  customFormError,
  onApply,
}) => {
  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>
              AI Recommendations
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {selectedStudent
                ? `Showing matches for ${selectedStudent.name}`
                : 'Create your profile to get personalized matches'}
            </p>
          </div>
        </div>

        {/* ── CREATE PROFILE BUTTON — prominent & always visible ── */}
        <button
          onClick={onShowCustomForm}
          className="btn-primary flex-shrink-0 text-sm px-5 py-2.5"
          style={{ fontSize: '0.9rem' }}
        >
          <Plus className="h-4 w-4" />
          {selectedStudent ? 'Update My Profile' : 'Create My Profile'}
          <Sparkles className="h-4 w-4" />
        </button>
      </div>

      {/* Create Profile Call-to-Action card (shown when no recommendations yet) */}
      {!loading && recommendations.length === 0 && (
        <div className="glass-card p-8 animate-fade-in-up">
          {/* Glowing orb background */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-indigo-600/10 blur-[80px]" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shrink-0 animate-pulse-glow">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-black text-white mb-2">Get Personalized Internship Matches</h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                Tell us your <span className="text-indigo-300 font-semibold">skills</span>,{' '}
                <span className="text-violet-300 font-semibold">preferred domains</span>, and{' '}
                <span className="text-cyan-300 font-semibold">locations</span> — our ML engine will rank
                hundreds of live internships specifically for you.
              </p>
            </div>
            <button
              onClick={onShowCustomForm}
              className="btn-primary text-base px-6 py-3 shrink-0 animate-pulse-glow"
            >
              <Plus className="h-5 w-5" />
              Create My Profile
            </button>
          </div>

          {/* Feature hints */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/8">
            {[
              { icon: Brain,    color: 'text-indigo-400', label: 'ML-Powered Ranking', desc: 'Random Forest + semantic embeddings' },
              { icon: TrendingUp, color: 'text-violet-400', label: 'Live Internships',  desc: '890+ jobs updated regularly' },
              { icon: Sparkles, color: 'text-cyan-400',    label: 'Feedback Loop',      desc: 'Gets smarter as you use it' },
            ].map(({ icon: Icon, color, label, desc }, i) => (
              <div key={i} className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color} shrink-0`} />
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="glass-card p-16 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <p className="text-white font-semibold mb-1">Analyzing your profile…</p>
          <p className="text-gray-500 text-sm">Our ML engine is ranking internships just for you</p>
          <div className="flex justify-center gap-1 mt-6">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full gradient-primary animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Grid */}
      {!loading && recommendations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-white">
              <span className="gradient-text">{recommendations.length}</span> matches found
              {selectedStudent && <span className="text-gray-500 text-base font-normal ml-2">for {selectedStudent.name}</span>}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={rec.internship_id} rec={rec} index={index} onApply={onApply} />
            ))}
          </div>
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