import React, { useState } from 'react';
import { Download, FileText, Printer, Check, Eye, Sparkles } from 'lucide-react';

interface ResumePreviewProps {
  rewrittenSections?: Record<string, string[]>;
  originalSections?: Record<string, string[]>;
  diff?: Array<{ section: string; bullet_index: number; original: string; rewritten: string }>;
  downloadUrlDocx?: string | null;
  downloadUrlPdf?: string | null;
  candidateName?: string;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({
  rewrittenSections = {},
  originalSections = {},
  diff = [],
  downloadUrlDocx,
  downloadUrlPdf,
  candidateName = 'Student Resume',
}) => {
  const [viewMode, setViewMode] = useState<'tailored' | 'original'>('tailored');
  const [highlightChanges, setHighlightChanges] = useState<boolean>(true);

  // Set of rewritten strings for highlighting
  const changedRewrittenSet = new Set(diff.map(d => d.rewritten.trim()));

  const activeSections = viewMode === 'tailored' ? rewrittenSections : originalSections;
  const hasSections = Object.keys(activeSections).length > 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm">
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('tailored')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'tailored'
                ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-teal-600" />
            Tailored ATS Version
          </button>
          <button
            onClick={() => setViewMode('original')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'original'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-slate-500" />
            Original Version
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {viewMode === 'tailored' && (
            <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer pr-2 select-none">
              <input
                type="checkbox"
                checked={highlightChanges}
                onChange={e => setHighlightChanges(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
              />
              Highlight edits
            </label>
          )}

          {downloadUrlPdf && (
            <a
              href={downloadUrlPdf}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs font-bold flex items-center gap-1.5 py-2 px-3.5 shadow-sm rounded-lg"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </a>
          )}

          {downloadUrlDocx && (
            <a
              href={downloadUrlDocx}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs font-bold flex items-center gap-1.5 py-2 px-3.5 border border-slate-300 rounded-lg"
            >
              <FileText className="h-3.5 w-3.5 text-slate-700" />
              Download Word (.docx)
            </a>
          )}

          <button
            onClick={handlePrint}
            title="Print or Save as PDF via browser"
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Paper Canvas */}
      <div className="bg-slate-100/70 p-4 sm:p-8 rounded-2xl border border-slate-200/90 overflow-x-auto">
        <div
          id="resume-paper"
          className="bg-white max-w-3xl mx-auto shadow-lg border border-slate-300/80 rounded-lg p-8 sm:p-14 text-slate-900 font-sans transition-all"
          style={{ minHeight: '840px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {!hasSections ? (
            <div className="text-center py-20 text-slate-400 text-sm">
              Resume preview is being formatted…
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Section */}
              {activeSections.header && activeSections.header.length > 0 && (
                <div className="text-center border-b border-slate-200 pb-5 mb-6">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
                    {activeSections.header[0] || candidateName}
                  </h1>
                  {activeSections.header.length > 1 && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {activeSections.header.slice(1).join('  •  ')}
                    </p>
                  )}
                </div>
              )}

              {/* Other sections */}
              {Object.entries(activeSections).map(([sectionName, bullets]) => {
                if (sectionName.toLowerCase() === 'header' || !bullets || bullets.length === 0) {
                  return null;
                }

                const cleanHeading = sectionName.replace(/_/g, ' ').toUpperCase();

                return (
                  <div key={sectionName} className="space-y-2">
                    {/* Section Title */}
                    <div className="border-b-2 border-teal-800/80 pb-1 flex items-center justify-between">
                      <h2 className="text-xs sm:text-sm font-bold tracking-wider text-teal-900 uppercase">
                        {cleanHeading}
                      </h2>
                    </div>

                    {/* Section Bullet Points */}
                    <ul className="space-y-2 pt-1 pl-1">
                      {bullets.map((bullet, idx) => {
                        const cleanBullet = bullet.replace(/^[•\-*]\s*/, '').trim();
                        if (!cleanBullet) return null;

                        const isChanged =
                          viewMode === 'tailored' &&
                          highlightChanges &&
                          changedRewrittenSet.has(cleanBullet);

                        return (
                          <li
                            key={idx}
                            className={`text-xs sm:text-sm leading-relaxed flex items-start gap-2.5 transition-colors ${
                              isChanged
                                ? 'bg-emerald-50/90 text-emerald-950 p-2 rounded-md border-l-3 border-emerald-600 font-medium'
                                : 'text-slate-800'
                            }`}
                          >
                            <span className="text-slate-400 font-bold shrink-0 mt-0.5">•</span>
                            <div className="flex-1">
                              {cleanBullet}
                              {isChanged && (
                                <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.2 rounded">
                                  <Check className="h-2.5 w-2.5" /> AI Tailored
                                </span>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;
