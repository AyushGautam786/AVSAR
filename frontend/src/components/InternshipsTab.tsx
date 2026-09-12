import React, { useState, useCallback } from 'react';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import type { Internship } from '../types';
import InternshipCard from '../components/InternshipCard';
import DarkSelect from '../components/DarkSelect';

interface InternshipsTabProps {
  internships: Internship[];
  totalPages?: number;
  currentPage?: number;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onSearch?: (q: string) => void;
  onFilterDomain?: (domain: string) => void;
  onSave?: (internship: Internship) => Promise<void>;
  savedIds?: Set<string>;
  availableDomains?: string[];
  activeDomain?: string;
}

const InternshipsTab: React.FC<InternshipsTabProps> = ({
  internships,
  totalPages = 1,
  currentPage = 1,
  isLoading = false,
  onPageChange,
  onSearch,
  onFilterDomain,
  onSave,
  savedIds = new Set(),
  availableDomains = [],
  activeDomain = '',
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchValue);
  };

  const handleSave = useCallback(async (internship: Internship) => {
    setSavingIds(prev => new Set(prev).add(internship.id));
    await onSave?.(internship);
    setSavingIds(prev => { const next = new Set(prev); next.delete(internship.id); return next; });
  }, [onSave]);

  return (
    <div className="workspace internships-workspace">
      {/* Page header */}
      <div className="workspace-header mb-8">
        <h1 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          All Internships
        </h1>
        <p className="text-gray-500 text-sm">
          Browse {internships.length > 0 ? `${internships.length}+` : 'live'} internships from Greenhouse, Lever, Adzuna & more
        </p>
      </div>

      {/* Search & Filter */}
      <div className="search-toolbar glass p-4 rounded-2xl mb-8 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by role, company, or skill…"
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className="input-dark pl-9"
            />
          </div>
          <button type="submit" className="btn-primary px-4 py-2 text-sm">
            Search
          </button>
        </form>

        {availableDomains.length > 0 && onFilterDomain && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-500 shrink-0" />
            <DarkSelect
              value={activeDomain}
              onChange={val => onFilterDomain(val)}
              options={[
                { value: '', label: 'All Domains' },
                ...availableDomains.map(d => ({ value: d, label: d })),
              ]}
              placeholder="All Domains"
              className="w-44"
            />
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="opportunity-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 h-72">
              <div className="shimmer rounded-lg h-5 w-3/4 mb-2" />
              <div className="shimmer rounded-lg h-4 w-1/2 mb-6" />
              <div className="shimmer rounded-lg h-3 w-full mb-2" />
              <div className="shimmer rounded-lg h-3 w-2/3 mb-6" />
              <div className="flex gap-2">
                <div className="shimmer rounded-full h-6 w-20" />
                <div className="shimmer rounded-full h-6 w-16" />
              </div>
              <div className="shimmer rounded-xl h-9 w-full mt-auto" style={{ marginTop: '3rem' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && internships.length === 0 && (
        <div className="text-center py-24 glass-card">
          <Briefcase className="h-16 w-16 text-indigo-500/30 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No internships found</h3>
          <p className="text-gray-500 text-sm">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Grid */}
      {!isLoading && internships.length > 0 && (
        <div className="opportunity-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {internships.map((internship, i) => (
            <div key={internship.id} className={`animate-fade-in-up delay-${Math.min(i * 50, 500)}`}>
              <InternshipCard
                internship={internship}
                onSave={onSave ? handleSave : undefined}
                isSaving={savingIds.has(internship.id)}
                isSaved={savedIds.has(internship.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-center gap-3 mt-12">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="px-4 py-2 glass rounded-xl text-sm text-gray-300">
            Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span>
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-30"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default InternshipsTab;
