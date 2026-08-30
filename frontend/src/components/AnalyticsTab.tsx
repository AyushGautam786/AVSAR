import React from 'react';
import { Users, Building2, Briefcase, TrendingUp } from 'lucide-react';
import type { Stats } from '../types';
import StatCard from '../components/Stat_Card';

interface AnalyticsTabProps {
  stats: Stats;
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ stats }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">System Analytics</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Students" 
          value={stats.total_students} 
          icon={Users} 
          color="blue" 
        />
        <StatCard 
          title="Total Internships" 
          value={stats.total_internships} 
          icon={Building2} 
          color="green" 
        />
        <StatCard 
          title="Domains Available" 
          value={Object.keys(stats.domain_distribution).length} 
          icon={Briefcase} 
          color="purple" 
        />
        <StatCard 
          title="ML Model Status" 
          value={stats.model_trained ? "Active" : "Inactive"} 
          icon={TrendingUp} 
          color={stats.model_trained ? "green" : "red"} 
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Domain Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Domain Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.domain_distribution).map(([domain, count]) => (
              <div key={domain} className="flex items-center justify-between">
                <span className="text-gray-700">{domain}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(count / Math.max(...Object.values(stats.domain_distribution))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Distribution</h3>
          <div className="space-y-3">
            {Object.entries(stats.location_distribution).map(([location, count]) => (
              <div key={location} className="flex items-center justify-between">
                <span className="text-gray-700">{location}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(count / Math.max(...Object.values(stats.location_distribution))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Average Stipend by Domain */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Stipend by Domain</h3>
          <div className="space-y-4">
            {Object.entries(stats.avg_stipend_by_domain).map(([domain, avgStipend]) => (
              <div key={domain} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{domain}</span>
                </div>
                <span className="text-lg font-bold text-green-600">
                  ₹{Math.round(avgStipend).toLocaleString()}
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