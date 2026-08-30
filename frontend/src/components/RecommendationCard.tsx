import React from 'react';
import { Briefcase, MapPin, Clock, DollarSign, Star } from 'lucide-react';
import type { Recommendation } from '../types';

interface RecommendationCardProps {
  rec: Recommendation;
  index: number;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ rec, index }) => {
  const getMatchScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-6 border hover:border-blue-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-gray-600">{rec.company_name[0]}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{rec.role_title}</h3>
            <p className="text-gray-600">{rec.company_name}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(rec.match_score)}`}>
            {rec.match_score}% Match
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-4 w-4" />
          <span>{rec.domain}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4" />
          <span>{rec.location}{rec.is_remote && ' (Remote)'}</span>
        </div>
        {rec.duration_weeks && (
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{rec.duration_weeks} weeks</span>
          </div>
        )}
        {rec.stipend && (
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>₹{rec.stipend.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-gray-600">
            Rating: {rec.predicted_rating}/5.0
          </span>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Apply Now
        </button>
      </div>
    </div>
  );
};

export default RecommendationCard;