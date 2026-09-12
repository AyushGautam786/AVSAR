import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ArrowDown } from 'lucide-react';

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
      <div className="text-center py-8 text-slate-500 text-sm font-medium bg-slate-50 rounded-xl border border-slate-200">
        No changes were made to the resume content.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Fabrication guard warnings */}
      {fabricationFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 text-sm mb-1">
                Fabrication guard: {fabricationFlags.length} new term{fabricationFlags.length !== 1 ? 's' : ''} detected
              </p>
              <p className="text-amber-800 text-xs mb-3 leading-relaxed">
                These terms appear in the rewrite but weren't in your original resume. Please confirm you actually have this experience before downloading.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {fabricationFlags.map(flag => (
                  <span key={flag} className="px-2.5 py-1 bg-white text-amber-900 rounded-lg text-xs font-semibold border border-amber-200 shadow-xs">
                    {flag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-section diffs */}
      {Object.entries(bySection).map(([section, items]) => {
        const isExpanded = expandedSections.has(section) || expandedSections.has('all');
        return (
          <div key={section} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            <button
              onClick={() => toggleSection(section)}
              className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50/90 hover:bg-slate-100/90 transition-colors text-left border-b border-slate-200"
            >
              <span className="font-bold text-slate-800 capitalize text-sm">
                {section.replace(/_/g, ' ')}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-teal-800 bg-teal-50 border border-teal-200 rounded-full px-2.5 py-0.5 font-bold">
                  {items.length} change{items.length !== 1 ? 's' : ''}
                </span>
                {isExpanded
                  ? <ChevronUp className="h-4 w-4 text-slate-500" />
                  : <ChevronDown className="h-4 w-4 text-slate-500" />
                }
              </div>
            </button>

            {isExpanded && (
              <div className="divide-y divide-slate-100">
                {items.map((item, i) => (
                  <div key={i} className="p-4 sm:p-5 space-y-2.5 bg-white">
                    {/* Original bullet (Deleted / Strikethrough) */}
                    <div className="bg-red-50/90 border border-red-200 rounded-xl p-3 sm:p-3.5 flex items-start gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-md bg-red-600 text-white text-xs flex items-center justify-center font-bold mt-0.5 shadow-xs">−</span>
                      <p className="text-xs sm:text-sm text-red-900 line-through leading-relaxed font-normal">{item.original}</p>
                    </div>

                    {/* Transition arrow */}
                    <div className="flex items-center gap-2 pl-4 py-0.5 text-slate-400">
                      <ArrowDown className="h-3.5 w-3.5 text-teal-600 shrink-0" />
                      <span className="text-[11px] font-semibold text-teal-700 tracking-wide uppercase">AI Optimized Replacement</span>
                    </div>

                    {/* Rewritten bullet (Added / Enhanced) */}
                    <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-3 sm:p-3.5 flex items-start gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-md bg-emerald-600 text-white text-xs flex items-center justify-center font-bold mt-0.5 shadow-xs">+</span>
                      <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-semibold">{item.rewritten}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default DiffViewer;
