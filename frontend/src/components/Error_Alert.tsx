import React from 'react';
import { X } from 'lucide-react';

interface ErrorAlertProps {
  error: string;
  onClose: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, onClose }) => {
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
      <button 
        onClick={onClose} 
        className="float-right text-red-500 hover:text-red-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ErrorAlert;