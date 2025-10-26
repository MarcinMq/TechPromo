import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

const SekcjaFormularza: React.FC<FormSectionProps> = ({ 
  title, 
  description, 
  icon: Icon, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default SekcjaFormularza;