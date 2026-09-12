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
    score >= 70 ? '#10b981' :
    score >= 40 ? '#f59e0b' :
    '#f43f5e';

  const bgColor =
    score >= 70 ? 'rgba(16, 185, 129, 0.08)' :
    score >= 40 ? 'rgba(245, 158, 11, 0.08)' :
    'rgba(244, 63, 94, 0.08)';

  const borderColor =
    score >= 70 ? 'rgba(16, 185, 129, 0.25)' :
    score >= 40 ? 'rgba(245, 158, 11, 0.25)' :
    'rgba(244, 63, 94, 0.25)';

  return (
    <div
      className="glass-card rounded-2xl p-6 flex flex-col items-center gap-3 border transition-all duration-300 min-w-[200px]"
      style={{ background: bgColor, borderColor }}
    >
      <p className="text-sm font-semibold text-gray-300">{label}</p>

      {/* Circular gauge */}
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="8" />
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
          <span className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>{score}%</span>
        </div>
      </div>

      {/* Delta badge */}
      {delta !== null && isAfter && (
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
          delta > 0 ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
          delta < 0 ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
          'bg-white/5 text-gray-400 border border-white/10'
        }`}>
          {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> :
           delta < 0 ? <TrendingDown className="h-3.5 w-3.5" /> :
           <Minus className="h-3.5 w-3.5" />}
          {delta > 0 ? '+' : ''}{delta.toFixed(1)}% vs. original
        </div>
      )}
    </div>
  );
};

export default AtsScoreCard;
