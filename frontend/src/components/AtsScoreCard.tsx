import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AtsScoreCardProps {
  label: string;
  score: number;
  compareScore?: number; // the other score for delta display
  isAfter?: boolean;
}

const AtsScoreCard: React.FC<AtsScoreCardProps> = ({ label, score, compareScore, isAfter = false }) => {
  const delta = compareScore !== undefined ? score - compareScore : null;
  const color =
    score >= 70 ? '#059669' :
    score >= 40 ? '#d97706' :
    '#e11d48';

  const bgColor =
    score >= 70 ? 'rgba(5, 150, 105, 0.05)' :
    score >= 40 ? 'rgba(217, 119, 6, 0.05)' :
    'rgba(225, 29, 72, 0.05)';

  const borderColor =
    score >= 70 ? 'rgba(5, 150, 105, 0.25)' :
    score >= 40 ? 'rgba(217, 119, 6, 0.25)' :
    'rgba(225, 29, 72, 0.25)';

  return (
    <div
      className="rounded-2xl p-6 flex flex-col items-center gap-3 border shadow-sm transition-all duration-300 min-w-[210px] bg-white"
      style={{ backgroundColor: bgColor, borderColor }}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">{label}</p>

      {/* Circular gauge */}
      <div className="relative w-28 h-28 my-1">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 42}`}
            strokeDashoffset={`${2 * Math.PI * 42 * (1 - score / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-black text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>{score}%</span>
        </div>
      </div>

      {/* Delta badge */}
      {delta !== null && isAfter && (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          delta > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs' :
          delta < 0 ? 'bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs' :
          'bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
        }`}>
          {delta > 0 ? <TrendingUp className="h-3.5 w-3.5 text-emerald-600" /> :
           delta < 0 ? <TrendingDown className="h-3.5 w-3.5 text-rose-600" /> :
           <Minus className="h-3.5 w-3.5 text-slate-500" />}
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs. original
        </div>
      )}
    </div>
  );
};

export default AtsScoreCard;
