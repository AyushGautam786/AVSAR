import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

interface DiffItem {
  section: string;
  bullet_index: number;
  original: string;
  rewritten: string;
}

interface DiffViewerProps {
  diff: DiffItem[];
  fabricationFlags: string[];
}

const DiffViewer: React.FC<DiffViewerProps> = ({ diff, fabricationFlags }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['all']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  // Group diff by section
  const bySection: Record<string, DiffItem[]> = {};
  for (const item of diff) {
    const key = item.section;
    if (!bySection[key]) bySection[key] = [];
    bySection[key].push(item);
  }

  if (diff.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No changes were made to the resume content.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fabrication guard warnings */}
      {fabricationFlags.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 text-sm mb-1">
                Fabrication guard: {fabricationFlags.length} new term{fabricationFlags.length !== 1 ? 's' : ''} detected
              </p>
              <p className="text-amber-400/80 text-xs mb-3 leading-relaxed">
                These terms appear in the rewrite but weren't in your original resume. Please confirm you actually have this experience before downloading.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {fabricationFlags.map(flag => (
                  <span key={flag} className="px-2.5 py-1 bg-amber-500/20 text-amber-200 rounded-lg text-xs font-semibold border border-amber-500/30">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-section diffs */}
      {Object.entries(bySection).map(([section, items]) => (
        <div key={section} className="glass-card rounded-xl overflow-hidden border border-white/8">
          <button
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between px-5 py-3.5 bg-white/5 hover:bg-white/8 transition-colors text-left"
          >
            <span className="font-semibold text-white capitalize text-sm">
              {section.replace(/_/g, ' ')}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-2.5 py-0.5 font-medium">
                {items.length} change{items.length !== 1 ? 's' : ''}
              </span>
              {expandedSections.has(section)
                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                : <ChevronDown className="h-4 w-4 text-gray-400" />
              }
            </div>
          </button>

          {expandedSections.has(section) && (
            <div className="divide-y divide-white/5">
              {items.map((item, i) => (
                <div key={i} className="px-5 py-4 space-y-3 bg-black/20">
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs flex items-center justify-center font-bold mt-0.5">−</span>
                    <p className="text-xs sm:text-sm text-rose-300/80 line-through leading-relaxed">{item.original}</p>
                  </div>
                  <div className="flex items-center gap-2 pl-1 text-gray-500">
                    <ArrowRight className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs flex items-center justify-center font-bold mt-0.5">+</span>
                    <p className="text-xs sm:text-sm text-emerald-300 leading-relaxed font-medium">{item.rewritten}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default DiffViewer;
