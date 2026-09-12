import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DarkSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * A fully custom dark-themed select that replaces the native browser
 * <select> so we get a consistent dark dropdown on ALL browsers/OS.
 */
const DarkSelect: React.FC<DarkSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all
          bg-[#0d1120] border text-left
          ${open ? 'border-indigo-500/60 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]' : 'border-white/10 hover:border-white/20'}
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          text-${selected ? 'white' : '[rgba(255,255,255,0.3)]'}`}
      >
        <span className={selected ? 'text-white' : 'text-gray-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-[200] left-0 right-0 mt-1.5 rounded-xl overflow-hidden shadow-2xl border border-white/10"
          style={{ background: '#0d1120' }}
        >
          <div className="max-h-52 overflow-y-auto py-1">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-left transition-colors
                  ${opt.value === value
                    ? 'bg-indigo-600/20 text-indigo-300'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                {opt.label}
                {opt.value === value && <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DarkSelect;
