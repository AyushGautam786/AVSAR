import React, { useState, useRef } from 'react';
import { X, Plus, Brain, CheckCircle, Upload, Loader2, Sparkles } from 'lucide-react';
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
  onParseResume?: (file: File) => Promise<{ data?: any; error?: string }>;
}

const colorMap = {
  indigo: 'badge-indigo',
  violet: 'badge-violet',
  cyan:   'badge-cyan',
};

// ── Standalone TagSection component (defined OUTSIDE so it never remounts or loses input focus) ──
interface TagSectionProps {
  label: string;
  required?: boolean;
  field: keyof CustomFormData;
  color: 'indigo' | 'violet' | 'cyan';
  inputVal: string;
  setInput: (v: string) => void;
  options: string[];
  placeholder: string;
  tags: string[];
  onAdd: (field: keyof CustomFormData, val: string) => void;
  onRemove: (field: keyof CustomFormData, val: string) => void;
}

const TagSection: React.FC<TagSectionProps> = ({
  label,
  required,
  field,
  color,
  inputVal,
  setInput,
  options,
  placeholder,
  tags,
  onAdd,
  onRemove,
}) => {
  const addBtnColor = {
    indigo: 'bg-teal-700 hover:bg-teal-800',
    violet: 'bg-teal-700 hover:bg-teal-800',
    cyan:   'bg-teal-700 hover:bg-teal-800',
  }[color];

  const selectOptions = [
    { value: '', label: 'Pick from list…' },
    ...options.filter(o => !tags.includes(o)).map(o => ({ value: o, label: o })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputVal.trim()) {
        onAdd(field, inputVal);
        setInput('');
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((tag, i) => (
            <span key={i} className={`badge ${colorMap[color]} flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg`}>
              {tag}
              <button
                type="button"
                onClick={() => onRemove(field, tag)}
                className="ml-0.5 opacity-60 hover:opacity-100 hover:text-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown picker */}
      {options.length > 0 && (
        <DarkSelect
          value=""
          onChange={val => { if (val) onAdd(field, val); }}
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
          onKeyDown={handleKeyDown}
          className="input-dark flex-1 text-slate-900 placeholder:text-slate-400"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => {
            if (inputVal.trim()) {
              onAdd(field, inputVal);
              setInput('');
            }
          }}
          className={`flex items-center justify-center px-3.5 py-2 rounded-lg text-white text-sm font-bold transition-colors ${addBtnColor}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

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
  onParseResume,
}) => {
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState<string | null>(null);
  const [isDraggingResume, setIsDraggingResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  if (!showCustomForm) return null;

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

  // ── Auto-fill from resume upload ─────────────────────────────────────────
  const handleResumeUpload = async (file: File) => {
    if (!onParseResume) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc', 'txt'].includes(ext || '')) {
      alert('Please upload a .pdf, .docx, or .txt resume file.');
      return;
    }

    setIsParsingResume(true);
    setResumeSuccessMsg(null);

    try {
      const res = await onParseResume(file);
      if (res.error) {
        alert(res.error);
        return;
      }

      if (res.data) {
        const p = res.data;
        setCustomForm(prev => ({
          name: p.name || prev.name,
          skills: Array.from(new Set([...(p.skills || []), ...prev.skills])),
          preferred_domains: Array.from(new Set([...(p.preferred_domains || []), ...prev.preferred_domains])),
          preferred_locations: Array.from(new Set([...(p.preferred_locations || []), ...prev.preferred_locations])),
          interests: Array.from(new Set([...(p.interests || []), ...prev.interests])),
        }));
        setResumeSuccessMsg(`✨ Successfully extracted ${p.skills?.length || 0} skills and profile info from ${file.name}!`);
      }
    } catch (err: any) {
      alert(err.message || 'Could not parse resume.');
    } finally {
      setIsParsingResume(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#20252b]/40 backdrop-blur-sm"
        onClick={() => { setShowCustomForm(false); onReset(); }}
      />

      <div className="relative glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in p-0 overscroll-contain bg-white rounded-2xl border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 z-10 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white shadow-xs">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Create or Update Profile
              </h2>
              <p className="text-xs text-slate-500">Fill in your skills or upload your resume to auto-fill</p>
            </div>
          </div>
          <button
            onClick={() => { setShowCustomForm(false); onReset(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
              {error}
            </div>
          )}

          {/* ── Option 1: Auto-create Profile by Uploading Resume ── */}
          <div className="rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50/50 p-5 sm:p-6 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-teal-700" />
                <h3 className="text-sm font-bold text-teal-950">Auto-Fill Profile with Resume</h3>
              </div>
              <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                AI Powered
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Upload your PDF or Word resume — our AI will automatically parse your skills, preferred domains, and location into your profile!
            </p>

            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.txt"
              className="hidden"
              onChange={e => {
                if (e.target.files?.[0]) {
                  handleResumeUpload(e.target.files[0]);
                }
              }}
            />

            <div
              onClick={() => resumeInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDraggingResume(true); }}
              onDragLeave={() => setIsDraggingResume(false)}
              onDrop={e => {
                e.preventDefault();
                setIsDraggingResume(false);
                if (e.dataTransfer.files?.[0]) {
                  handleResumeUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border border-teal-300 rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all bg-white hover:bg-teal-50/80 flex flex-col items-center gap-2 ${
                isDraggingResume ? 'border-teal-600 bg-teal-100/80' : ''
              }`}
            >
              {isParsingResume ? (
                <div className="flex items-center gap-2 text-teal-800 text-xs font-bold py-2">
                  <Loader2 className="h-5 w-5 animate-spin text-teal-700" />
                  <span>Analyzing resume & extracting skills with AI…</span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to upload or drag & drop your Resume (.pdf, .docx)
                  </p>
                  <p className="text-[11px] text-slate-500">Auto-populates all skills and details below instantly</p>
                </>
              )}
            </div>

            {resumeSuccessMsg && (
              <div className="mt-3 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">{resumeSuccessMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={onSubmit}
                  className="btn-primary text-xs font-bold py-1.5 px-3.5 shadow-sm whitespace-nowrap bg-teal-800 hover:bg-teal-900"
                >
                  <Brain className="h-3.5 w-3.5" />
                  Get Matches Now →
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Or Edit Details Manually</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Your Name</label>
            <input
              type="text"
              value={customForm.name}
              onChange={e => setCustomForm(prev => ({ ...prev, name: e.target.value }))}
              className="input-dark text-slate-900 placeholder:text-slate-400"
              placeholder="e.g. Ayush Gautam"
            />
          </div>

          <TagSection
            label="Your Skills"
            required
            field="skills"
            color="cyan"
            inputVal={customSkillInput}
            setInput={setCustomSkillInput}
            tags={customForm.skills}
            options={availableSkills}
            placeholder="Type a skill and press Enter (e.g. Python, React, SQL)…"
            onAdd={addToField}
            onRemove={removeFromField}
          />

          <TagSection
            label="Preferred Domains"
            required
            field="preferred_domains"
            color="indigo"
            inputVal={customDomainInput}
            setInput={setCustomDomainInput}
            tags={customForm.preferred_domains}
            options={availableDomains}
            placeholder="Type a domain & press Enter (e.g. Web Development)…"
            onAdd={addToField}
            onRemove={removeFromField}
          />

          <TagSection
            label="Preferred Locations"
            required
            field="preferred_locations"
            color="violet"
            inputVal={customLocationInput}
            setInput={setCustomLocationInput}
            tags={customForm.preferred_locations}
            options={availableLocations}
            placeholder="City, state, or Remote…"
            onAdd={addToField}
            onRemove={removeFromField}
          />

          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">Interests & Career Goals</label>
            <textarea
              value={customForm.interests.join(', ')}
              onChange={e =>
                setCustomForm(prev => ({
                  ...prev,
                  interests: e.target.value.split(',').map(i => i.trim()).filter(Boolean),
                }))
              }
              className="input-dark resize-none text-slate-900 placeholder:text-slate-400"
              rows={3}
              placeholder="e.g. machine learning, startups, open source, cloud computing…"
            />
            <p className="text-xs text-slate-500 mt-1">Separate with commas</p>
          </div>

          {(customForm.preferred_domains.length > 0 || customForm.skills.length > 0) && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
              <p className="text-xs font-bold text-teal-900 mb-2 flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-teal-700" /> Profile Summary
              </p>
              <div className="text-xs text-slate-600 space-y-0.5 font-medium">
                {customForm.skills.length > 0 && <p>✦ {customForm.skills.length} skill(s) added</p>}
                {customForm.preferred_domains.length > 0 && <p>✦ {customForm.preferred_domains.length} domain(s) selected</p>}
                {customForm.preferred_locations.length > 0 && <p>✦ {customForm.preferred_locations.length} location(s) selected</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0 bg-white border-t border-slate-100">
          <button
            onClick={() => {
              setShowCustomForm(false);
              onReset();
              setCustomDomainInput('');
              setCustomLocationInput('');
              setCustomSkillInput('');
            }}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || isParsingResume}
            className="btn-primary flex-1 justify-center disabled:opacity-50 shadow-md font-bold"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Getting matches…
              </>
            ) : (
              <>
                <Brain className="h-4 w-4" />
                Save & Get AI Matches
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFormModal;
