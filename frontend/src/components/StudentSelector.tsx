import React from 'react';
import { User } from 'lucide-react';
import type { Student } from '../types';

interface StudentSelectorProps {
  students: Student[];
  selectedStudent: Student | null;
  onStudentSelect: (student: Student) => void;
}

const StudentSelector: React.FC<StudentSelectorProps> = ({ 
  students, 
  selectedStudent, 
  onStudentSelect 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Student</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {students.map((student) => (
          <button
            key={student.id}
            onClick={() => onStudentSelect(student)}
            className={`p-4 border rounded-lg text-left transition-all ${
              selectedStudent?.id === student.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{student.name}</p>
                <p className="text-sm text-gray-500">{student.preferred_domains[0]}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StudentSelector;