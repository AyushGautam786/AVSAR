import React, { useState } from 'react';
import {
  Briefcase, MapPin, Clock, IndianRupee, Star, ExternalLink,
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Zap
} from 'lucide-react';
import type { Recommendation } from '../types';

interface RecommendationCardProps {
  rec: Recommendation;
  index: number;
  onApply?: (internshipId: string, applyUrl?: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ rec, index, onApply }) => {
  const [showExplain, setShowExplain] = useState(false);

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { cls: 'badge-green',  label: `${score}%` };
    if (score >= 60) return { cls: 'badge-amber',  label: `${score}%` };
    return               { cls: 'badge-red',    label: `${score}%` };
  };

  const scoreBadge = getScoreBadge(rec.match_score);

  // Rank glow: top 3 get extra glow
  const rankGlow = index === 0
    ? 'shadow-[0_0_0_1px_rgba(99,102,241,0.5),0_8px_30px_rgba(99,102,241,0.2)]'
    : index === 1
    ? 'shadow-[0_0_0_1px_rgba(139,92,246,0.3)]'
    : '';

  const handleApply = () => {
    if (rec.apply_url) window.open(rec.apply_url, '_blank', 'noopener,noreferrer');
    onApply?.(rec.internship_id, rec.apply_url);
  };

  const hasReasons = (rec.match_reasons?.length ?? 0) > 0;
  const hasMatched = (rec.matched_skills?.length ?? 0) > 0;
  const hasMissing = (rec.missing_skills?.length ?? 0) > 0;
  const hasExplainability = hasReasons || hasMatched || hasMissing;

  return (
    <div className={`glass-card p-5 flex flex-col gap-4 ${rankGlow} animate-fade-in-up`} style={{ animationDelay: `${index * 60}ms` }}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Company avatar */}
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 font-bold text-white text-sm">
            {rec.company_name?.[0] ?? '?'}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white leading-snug line-clamp-1">{rec.role_title}</h3>
            <p className="text-sm text-gray-400 truncate">{rec.company_name}</p>
          </div>
        </div>

        {/* Rank + match score */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-black text-gray-600">#{index + 1}</span>
          <span className={`badge ${scoreBadge.cls} font-bold`}>
            <Zap className="h-2.5 w-2.5" />
            {scoreBadge.label} match
          </span>
        </div>
      </div>

      {/* Match score bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Match strength</span>
          <span className="font-semibold text-white">{rec.match_score}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${rec.match_score}%`,
              background: rec.match_score >= 80
                ? 'linear-gradient(90deg, #10b981, #34d399)'
                : rec.match_score >= 60
                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                : 'linear-gradient(90deg, #ef4444, #f87171)',
            }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        {rec.domain && (
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-gray-600 shrink-0" />
            <span className="truncate">{rec.domain}</span>
          </div>
        )}
        {rec.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-gray-600 shrink-0" />
            <span className="truncate">{rec.location}{rec.is_remote ? ' · Remote' : ''}</span>
          </div>
        )}
        {rec.duration_weeks && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-600 shrink-0" />
            <span>{rec.duration_weeks} weeks</span>
          </div>
        )}
        {rec.stipend && (
          <div className="flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5 text-gray-600 shrink-0" />
            <span>₹{Number(rec.stipend).toLocaleString('en-IN')}/mo</span>
          </div>
        )}
        {rec.predicted_rating && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>{rec.predicted_rating}/5.0 predicted</span>
          </div>
        )}
      </div>

      {/* Explainability toggle */}
      {hasExplainability && (
        <div className="rounded-xl bg-white/3 border border-white/8 overflow-hidden">
          <button
            onClick={() => setShowExplain(v => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>Why this match?</span>
            {showExplain ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showExplain && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/8 pt-3">
              {/* Reasons */}
              {hasReasons && rec.match_reasons && (
                <ul className="space-y-1.5">
                  {rec.match_reasons.map((reason, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      {reason}
                    </li>
                  ))}
                </ul>
              )}

              {/* Matched skills */}
              {hasMatched && rec.matched_skills && (
                <div>
                  <p className="text-xs text-gray-600 mb-1.5 font-semibold">Skills you have ✓</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.matched_skills.map(skill => (
                      <span key={skill} className="badge badge-green text-xs">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {hasMissing && rec.missing_skills && (
                <div>
                  <p className="text-xs text-gray-600 mb-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-amber-500" /> Skills to develop
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {rec.missing_skills.map(skill => (
                      <span key={skill} className="badge badge-amber text-xs">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Apply */}
      <button
        onClick={handleApply}
        disabled={!rec.apply_url}
        className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all
          bg-gradient-to-r from-indigo-600 to-violet-600 text-white
          hover:from-indigo-500 hover:to-violet-500 hover:shadow-[0_4px_15px_rgba(99,102,241,0.4)]
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
      >
        <ExternalLink className="h-4 w-4" />
        {rec.apply_url ? 'Apply Now' : 'No Apply Link'}
      </button>
    </div>
  );
};

export default RecommendationCard;