import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Karta: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  hover = true 
}) => {
  const baseClasses = 'bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/20 transition-all duration-300';
  const hoverClasses = hover ? 'hover:bg-white/20 hover:shadow-2xl hover:scale-105' : '';
  const classes = `${baseClasses} ${hoverClasses} ${className}`;
  
  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Karta;
