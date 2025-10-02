import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'number' | 'textarea' | 'select';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  prefix?: string;
  suffix?: string;
  min?: string;
  max?: string;
  step?: string;
  rows?: number;
  options?: { value: string; label: string; icon?: string }[];
  className?: string;
  disabled?: boolean;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helperText,
  icon: Icon,
  prefix,
  suffix,
  min,
  max,
  step,
  rows = 4,
  options = [],
  className = '',
  disabled = false
}) => {
  const hasPrefix = prefix || Icon;
  const hasSuffix = suffix;
  const inputClasses = `
    w-full p-3 sm:p-4 border border-gray-300/50 rounded-2xl bg-white/90 backdrop-blur-sm 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
    transition-all duration-200
    ${hasPrefix ? 'pl-10 sm:pl-12' : ''}
    ${hasSuffix ? 'pr-10 sm:pr-12' : ''}
    ${error ? 'border-red-300 focus:ring-red-500' : ''}
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60' : ''}
    ${className}
  `.trim();

  const renderInput = () => {
    const commonProps = {
      name,
      value,
      onChange,
      placeholder,
      required,
      className: inputClasses,
      min,
      max,
      step,
      disabled
    };

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={rows}
            className={inputClasses.replace('pl-10 sm:pl-12', 'pl-3 sm:pl-4').replace('pr-10 sm:pr-12', 'pr-3 sm:pr-4')}
          />
        );
      case 'select':
        return (
          <select {...commonProps} className={inputClasses.replace('pl-10 sm:pl-12', 'pl-3 sm:pl-4')}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon ? `${option.icon} ${option.label}` : option.label}
              </option>
            ))}
          </select>
        );
      default:
        return <input type={type} {...commonProps} />;
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex flex-col text-sm font-semibold text-gray-700">
        <div className="flex items-center gap-1 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </div>
        {helperText && (
          <span className="text-xs text-gray-500 font-normal">{helperText}</span>
        )}
      </label>
      
      <div className="relative">
        {renderInput()}
        
        {hasPrefix && (
          <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 flex items-center">
            {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />}
            {prefix && !Icon && (
              <span className="text-xs sm:text-sm font-bold text-gray-400">{prefix}</span>
            )}
          </div>
        )}
        
        {hasSuffix && (
          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
            <span className="text-xs sm:text-sm font-bold text-gray-400">{suffix}</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="text-sm text-red-600 mt-1 flex items-center gap-1">
          <span className="text-red-500">⚠</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;