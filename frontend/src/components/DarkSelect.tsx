import React from 'react';
import { ChevronDown } from 'lucide-react';

interface DarkSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Native select wrapper. Native menus are rendered by the operating system,
 * so they never get clipped by cards, modals, or scroll containers.
 */
const DarkSelect: React.FC<DarkSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  className = '',
  disabled = false,
}) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      aria-label={placeholder}
      className="input-dark pr-10 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      {!options.some(option => option.value === '') && (
        <option value="">{placeholder}</option>
      )}
      {options.map(option => (
        <option key={`${option.value}-${option.label}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#748087]" />
  </div>
);

export default DarkSelect;
