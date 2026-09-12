import { useState } from 'react';
import { X, Plus, Brain, CheckCircle } from 'lucide-react';
import type { CustomFormData } from '../types';
import DarkSelect from './DarkSelect';

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
  error,
}) => {
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  const addToField = (field: keyof CustomFormData, value: string) => {
    const arr = customForm[field] as string[];
    if (value.trim() && !arr.includes(value.trim())) {
      setCustomForm(prev => ({ ...prev, [field]: [...arr, value.trim()] }));
    }
  };

  const removeFromField = (field: keyof CustomFormData, value: string) => {
    setCustomForm(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(v => v !== value),
    }));
  };

  const handleKeyAdd = (
    field: keyof CustomFormData,
    inputVal: string,
    setInput: (v: string) => void,
    e: React.KeyboardEvent
  ) => {
    if (e.key === 'Enter') { e.preventDefault(); addToField(field, inputVal); setInput(''); }
  };

  if (!showCustomForm) return null;

  const colorMap = {
    indigo: 'badge-indigo',
    violet: 'badge-violet',
    cyan:   'badge-cyan',
  };

  const TagSection = ({
    label, required, field, color, inputVal, setInput, options, placeholder,
  }: {
    label: string; required?: boolean; field: keyof CustomFormData;
    color: 'indigo' | 'violet' | 'cyan'; inputVal: string;
    setInput: (v: string) => void; options: string[]; placeholder: string;
  }) => {
    const tags = customForm[field] as string[];
    const addBtnColor = {
      indigo: 'bg-indigo-600 hover:bg-indigo-500',
      violet: 'bg-violet-600 hover:bg-violet-500',
      cyan:   'bg-cyan-600 hover:bg-cyan-500',
    }[color];

    const selectOptions = [
      { value: '', label: 'Pick from list…' },
      ...options.filter(o => !tags.includes(o)).map(o => ({ value: o, label: o })),
    ];

    return (
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {label} {required && <span className="text-red-400">*</span>}
        </label>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag, i) => (
              <span key={i} className={`badge ${colorMap[color]} flex items-center gap-1`}>
                {tag}
                <button type="button" onClick={() => removeFromField(field, tag)} className="ml-0.5 opacity-60 hover:opacity-100">
                  <X className="h-2.5 w-2.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Custom dark dropdown */}
        {options.length > 0 && (
          <DarkSelect
            value=""
            onChange={val => { if (val) addToField(field, val); }}
            options={selectOptions}
            placeholder="Pick from list…"
            className="mb-2"
          />
        )}

        {/* Free-text input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputVal}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => handleKeyAdd(field, inputVal, setInput, e)}
            className="input-dark flex-1"
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => { addToField(field, inputVal); setInput(''); }}
            className={`flex items-center justify-center px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors ${addBtnColor}`}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#20252b]/35 backdrop-blur-sm"
        onClick={() => { setShowCustomForm(false); onReset(); }}
      />

      <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in p-0 overscroll-contain">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#dedbd2] sticky top-0 z-10" style={{ background: '#ffffff' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#20252b]">Create Your Profile</h2>
              <p className="text-xs text-gray-500">Fill in your preferences to get AI recommendations</p>
            </div>
          </div>
          <button
            onClick={() => { setShowCustomForm(false); onReset(); }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-[#fff1ef] border border-[#efc4bd] text-[#a9453f] text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Your Name</label>
            <input
              type="text"
              value={customForm.name}
              onChange={e => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
              className="input-dark"
              placeholder="e.g. Ayush Gautam"
            />
          </div>

          <TagSection
            label="Preferred Domains" required field="preferred_domains"
            color="indigo" inputVal={customDomainInput} setInput={setCustomDomainInput}
            options={availableDomains} placeholder="Type a domain & press Enter…"
          />
          <TagSection
            label="Preferred Locations" required field="preferred_locations"
            color="violet" inputVal={customLocationInput} setInput={setCustomLocationInput}
            options={availableLocations} placeholder="City, state, or Remote…"
          />
          <TagSection
            label="Your Skills" required field="skills"
            color="cyan" inputVal={customSkillInput} setInput={setCustomSkillInput}
            options={availableSkills} placeholder="e.g. Python, React, SQL…"
          />

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Interests</label>
            <textarea
              value={customForm.interests.join(', ')}
              onChange={e =>
                setCustomForm(prev => ({
                  ...prev,
                  interests: e.target.value.split(',').map(i => i.trim()).filter(Boolean),
                }))
              }
              className="input-dark resize-none"
              rows={3}
              placeholder="e.g. machine learning, startups, open source…"
            />
            <p className="text-xs text-gray-600 mt-1">Separate with commas</p>
          </div>

          {(customForm.preferred_domains.length > 0 || customForm.skills.length > 0) && (
            <div className="p-4 rounded-xl bg-indigo-500/8 border border-indigo-500/20">
              <p className="text-xs font-semibold text-indigo-300 mb-2 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" /> Profile summary
              </p>
              <div className="text-xs text-gray-400 space-y-0.5">
                {customForm.preferred_domains.length > 0 && <p>✦ {customForm.preferred_domains.length} domain(s) selected</p>}
                {customForm.preferred_locations.length > 0 && <p>✦ {customForm.preferred_locations.length} location(s) selected</p>}
                {customForm.skills.length > 0 && <p>✦ {customForm.skills.length} skill(s) added</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={() => { setShowCustomForm(false); onReset(); setCustomDomainInput(''); setCustomLocationInput(''); setCustomSkillInput(''); }}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Getting matches…
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Get My Recommendations
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFormModal;
