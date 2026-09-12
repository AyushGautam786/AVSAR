import React from 'react';
import { Users, Building2, Briefcase, Cpu, MapPin, IndianRupee, BarChart3 } from 'lucide-react';
import type { Stats } from '../types';

interface AnalyticsTabProps {
  stats: Stats;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ stats }) => {
  const maxDomain = Math.max(...Object.values(stats.domain_distribution), 1);
  const maxLocation = Math.max(...Object.values(stats.location_distribution), 1);

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white" style={{ fontFamily: 'var(--font-display)' }}>Platform Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Real-time stats from the AVSAR database</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students',   value: stats.total_students,                               icon: Users,     color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20' },
          { label: 'Live Internships', value: stats.total_internships,                             icon: Building2, color: 'text-violet-400',  bg: 'bg-violet-500/10 border-violet-500/20' },
          { label: 'Domains Available',value: Object.keys(stats.domain_distribution).length,       icon: Briefcase, color: 'text-cyan-400',    bg: 'bg-cyan-500/10 border-cyan-500/20' },
          { label: 'ML Model',         value: stats.model_trained ? 'Active ✓' : 'Training',       icon: Cpu,       color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <div key={i} className={`glass-card p-5 animate-fade-in-up delay-${i * 100}`}>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Domain Distribution */}
        <div className="glass-card p-6 animate-fade-in-up delay-300">
          <div className="flex items-center gap-2 mb-5">
            <Briefcase className="h-4 w-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Domain Distribution</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.domain_distribution).slice(0, 10).map(([domain, count]) => (
              <div key={domain}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 truncate max-w-[60%]">{domain}</span>
                  <span className="text-xs font-semibold text-white">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                    style={{ width: `${(count / maxDomain) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="glass-card p-6 animate-fade-in-up delay-400">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="h-4 w-4 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Location Distribution</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(stats.location_distribution).slice(0, 10).map(([location, count]) => (
              <div key={location}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400 truncate max-w-[60%]">{location}</span>
                  <span className="text-xs font-semibold text-white">{count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-700"
                    style={{ width: `${(count / maxLocation) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Stipend */}
        <div className="glass-card p-6 lg:col-span-2 animate-fade-in-up delay-500">
          <div className="flex items-center gap-2 mb-5">
            <IndianRupee className="h-4 w-4 text-amber-400" />
            <h3 className="text-base font-bold text-white">Average Stipend by Domain</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {Object.entries(stats.avg_stipend_by_domain).map(([domain, avg]) => (
              <div key={domain} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/8">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
                  <span className="text-sm text-gray-300 truncate max-w-[140px]">{domain}</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">
                  ₹{Math.round(avg).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;