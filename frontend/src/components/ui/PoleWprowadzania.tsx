import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const PoleWprowadzania: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '', 
  ...props 
}) => {
  const inputClasses = `w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent backdrop-blur-sm ${error ? 'border-red-500 focus:ring-red-400' : ''} ${className}`;
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-white">
          {label}
        </label>
      )}
      <input className={inputClasses} {...props} />
      {error && (
        <p className="text-red-300 text-sm">{error}</p>
      )}
    </div>
  );
};

export default PoleWprowadzania;
