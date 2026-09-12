import React from 'react';
import { MapPin, IndianRupee, Clock, Bookmark, ExternalLink, CheckCircle, Building2 } from 'lucide-react';
import type { Internship } from '../types';

interface InternshipCardProps {
  internship: Internship;
  onSave?: (internship: Internship) => Promise<void>;
  isSaving?: boolean;
  isSaved?: boolean;
}

const InternshipCard: React.FC<InternshipCardProps> = ({
  internship,
  onSave,
  isSaving = false,
  isSaved = false,
}) => {
  const handleApply = () => {
    if (internship.apply_url) {
      window.open(internship.apply_url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave && !isSaved) await onSave(internship);
  };

  const domainColors: Record<string, string> = {
    'Software Engineering': 'badge-indigo',
    'Data Science': 'badge-violet',
    'Machine Learning': 'badge-cyan',
    'Design': 'badge-amber',
    'Marketing': 'badge-green',
    'Finance': 'badge-amber',
    'Product': 'badge-violet',
  };
  const domainBadge = domainColors[internship.domain || ''] || 'badge-gray';

  return (
    <div className="glass-card p-5 flex flex-col h-full group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
            {internship.role_title || (internship as any).title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Building2 className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <p className="text-sm text-gray-400 truncate">{internship.company_name || 'Unknown Company'}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {internship.domain && (
            <span className={`badge ${domainBadge} text-xs`}>{internship.domain}</span>
          )}
          {internship.is_remote && (
            <span className="badge badge-green text-xs">Remote</span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          <span className="truncate">{internship.location || 'Location not specified'}</span>
        </div>
        <div className="flex items-center gap-2">
          <IndianRupee className="h-3.5 w-3.5 shrink-0 text-gray-600" />
          <span>
            {internship.stipend
              ? `₹${Number(internship.stipend).toLocaleString('en-IN')}/month`
              : 'Stipend not disclosed'}
          </span>
        </div>
        {internship.duration_weeks && (
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-gray-600" />
            <span>{internship.duration_weeks} weeks</span>
          </div>
        )}
      </div>

      {/* Description */}
      {internship.description && (
        <p className="text-gray-500 text-xs mb-4 line-clamp-2 flex-1 leading-relaxed">
          {internship.description}
        </p>
      )}

      {/* Skills */}
      {internship.required_skills && internship.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {internship.required_skills.slice(0, 4).map((skill, index) => (
            <span key={index} className="badge badge-gray text-xs">{skill}</span>
          ))}
          {internship.required_skills.length > 4 && (
            <span className="badge badge-gray text-xs opacity-60">+{internship.required_skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/8">
        <button
          onClick={handleApply}
          disabled={!internship.apply_url}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all
            bg-gradient-to-r from-indigo-600 to-violet-600 text-white
            hover:from-indigo-500 hover:to-violet-500 hover:shadow-[0_4px_15px_rgba(99,102,241,0.4)]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Apply Now
        </button>

        {onSave && (
          <button
            onClick={handleSave}
            disabled={isSaving || isSaved}
            title={isSaved ? 'Already saved' : 'Save for later'}
            className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              isSaved
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 cursor-default'
                : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white hover:border-white/20'
            } disabled:opacity-60`}
          >
            {isSaved ? (
              <CheckCircle className="h-4 w-4" />
            ) : isSaving ? (
              <div className="h-4 w-4 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default InternshipCard;