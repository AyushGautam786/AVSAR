import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import type { CustomFormData } from '../types';

interface CustomFormModalProps {
  customForm: CustomFormData;
  setCustomForm: React.Dispatch<React.SetStateAction<CustomFormData>>;
  showCustomForm: boolean;
  setShowCustomForm: (show: boolean) => void;
  availableDomains: string[];
  availableLocations: string[];
  availableSkills: string[];
  loading: boolean;
  onSubmit: () => void;
  onReset: () => void;
  error: string | null;
}

const CustomFormModal: React.FC<CustomFormModalProps> = ({
  customForm,
  setCustomForm,
  showCustomForm,
  setShowCustomForm,
  availableDomains,
  availableLocations,
  availableSkills,
  loading,
  onSubmit,
  onReset,
  error
}) => {
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  const addToCustomForm = (field: keyof CustomFormData, value: string) => {
    const currentArray = customForm[field] as string[];
    if (!currentArray.includes(value) && value.trim()) {
      setCustomForm(prev => ({
        ...prev,
        [field]: [...currentArray, value.trim()]
      }));
    }
  };

  const removeFromCustomForm = (field: keyof CustomFormData, value: string) => {
    const currentArray = customForm[field] as string[];
    setCustomForm(prev => ({
      ...prev,
      [field]: currentArray.filter(item => item !== value)
    }));
  };

  const handleCustomInput = (field: keyof CustomFormData, inputValue: string, setInputValue: (value: string) => void) => {
    if (inputValue.trim()) {
      addToCustomForm(field, inputValue);
      setInputValue('');
    }
  };

  if (!showCustomForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create Custom Profile</h2>
          <button
            onClick={() => {
              setShowCustomForm(false);
              onReset();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={customForm.name}
              onChange={(e) => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>

          {/* Domains */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Domains <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {customForm.preferred_domains.map((domain, index) => (
                <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center space-x-1">
                  <span>{domain}</span>
                  <button
                    type="button"
                    onClick={() => removeFromCustomForm('preferred_domains', domain)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Dropdown for available domains */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addToCustomForm('preferred_domains', e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="">Select from available domains</option>
              {(availableDomains || [])
                .filter(domain => !customForm.preferred_domains.includes(domain))
                .map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
            </select>

            {/* Custom domain input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomInput('preferred_domains', customDomainInput, setCustomDomainInput);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Or add custom domain"
              />
              <button
                type="button"
                onClick={() => handleCustomInput('preferred_domains', customDomainInput, setCustomDomainInput)}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Locations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Locations <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {customForm.preferred_locations.map((location, index) => (
                <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center space-x-1">
                  <span>{location}</span>
                  <button
                    type="button"
                    onClick={() => removeFromCustomForm('preferred_locations', location)}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Dropdown for available locations */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addToCustomForm('preferred_locations', e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="">Select from available locations</option>
              {(availableLocations || [])
                .filter(location => !customForm.preferred_locations.includes(location))
                .map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              <option value="Remote" disabled={customForm.preferred_locations.includes('Remote')}>
                Remote
              </option>
            </select>

            {/* Custom location input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customLocationInput}
                onChange={(e) => setCustomLocationInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomInput('preferred_locations', customLocationInput, setCustomLocationInput);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Or add custom location"
              />
              <button
                type="button"
                onClick={() => handleCustomInput('preferred_locations', customLocationInput, setCustomLocationInput)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {customForm.skills.map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center space-x-1">
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeFromCustomForm('skills', skill)}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Dropdown for available skills */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addToCustomForm('skills', e.target.value);
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="">Select from available skills</option>
              {(availableSkills || [])
                .filter(skill => !customForm.skills.includes(skill))
                .map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
            </select>

            {/* Custom skill input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCustomInput('skills', customSkillInput, setCustomSkillInput);
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Or add custom skill"
              />
              <button
                type="button"
                onClick={() => handleCustomInput('skills', customSkillInput, setCustomSkillInput)}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interests (comma-separated)</label>
            <textarea
              value={customForm.interests.join(', ')}
              onChange={(e) => setCustomForm(prev => ({
                ...prev,
                interests: e.target.value.split(',').map(i => i.trim()).filter(i => i)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., machine learning, web development, startups"
            />
          </div>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowCustomForm(false);
                onReset();
                setCustomDomainInput('');
                setCustomLocationInput('');
                setCustomSkillInput('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomFormModal;