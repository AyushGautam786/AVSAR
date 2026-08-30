import React from 'react';
import type { Internship } from '../types';
import InternshipCard from '../components/InternshipCard';

interface InternshipsTabProps {
  internships: Internship[];
}

const InternshipsTab: React.FC<InternshipsTabProps> = ({ internships }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-900 mb-8">All Internships</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {internships.map((internship) => (
          <InternshipCard key={internship.id} internship={internship} />
        ))}
      </div>
    </div>
  );
};

export default InternshipsTab;