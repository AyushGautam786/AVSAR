import React from 'react';
import { MapPin, DollarSign, Clock } from 'lucide-react';
import type { Internship } from '../types';

interface InternshipCardProps {
  internship: Internship;
}

const InternshipCard: React.FC<InternshipCardProps> = ({ internship }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {internship.role_title || internship.title}
          </h3>
          <p className="text-gray-600">{internship.company_name}</p>
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {internship.domain}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4" />
          <span>{internship.location}{internship.is_remote && ' (Remote)'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4" />
          <span>₹{internship.stipend?.toLocaleString() || 'N/A'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4" />
          <span>{internship.duration_weeks} weeks</span>
        </div>
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-3">
        {internship.description}
      </p>

      <div className="flex flex-wrap gap-1 mb-4">
        {internship.required_skills?.slice(0, 3).map((skill, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
            {skill}
          </span>
        ))}
        {internship.required_skills?.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
            +{internship.required_skills.length - 3}
          </span>
        )}
      </div>

      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
        View Details
      </button>
    </div>
  );
};

export default InternshipCard;