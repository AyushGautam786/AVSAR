import React from 'react';
import { User } from 'lucide-react';
import type { Student } from '../types';

interface StudentProfileProps {
  student: Student;
}

const StudentProfile: React.FC<StudentProfileProps> = ({ student }) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-6">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <User className="h-8 w-8 text-blue-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
        <p className="text-gray-600">{student.email}</p>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preferred Domains</h3>
        <div className="flex flex-wrap gap-2">
          {student.preferred_domains.map((domain, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {domain}
            </span>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Preferred Locations</h3>
        <div className="flex flex-wrap gap-2">
          {student.preferred_locations.map((location, index) => (
            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {location}
            </span>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {student.skills.slice(0, 5).map((skill, index) => (
            <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {skill}
            </span>
          ))}
          {student.skills.length > 5 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
              +{student.skills.length - 5} more
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default StudentProfile;