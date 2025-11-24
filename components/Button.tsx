import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyle = "px-6 py-3 font-mono text-sm uppercase tracking-widest transition-all duration-100 flex items-center justify-center gap-2 border active:translate-y-1";
  
  const variants = {
    primary: "bg-green-600/10 border-green-500 text-green-400 hover:bg-green-500 hover:text-black shadow-[0_0_15px_rgba(34,197,94,0.2)]",
    secondary: "bg-transparent border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300",
    danger: "bg-red-900/10 border-red-500 text-red-500 hover:bg-red-600 hover:text-black"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${disabled || isLoading ? 'opacity-50 cursor-not-allowed border-dashed' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="animate-pulse mr-2">
            [PROCESSING]
        </span>
      )}
      {children}
    </button>
  );
};