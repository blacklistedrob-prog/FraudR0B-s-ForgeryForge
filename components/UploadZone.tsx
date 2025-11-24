import React, { useRef } from 'react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className="w-full max-w-3xl mx-auto mt-12 relative group"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={inputRef}
        onChange={handleChange}
        className="hidden" 
        accept="image/png, image/jpeg, image/webp"
      />

      {/* Decorative corners */}
      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-600"></div>
      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-600"></div>
      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-600"></div>
      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-600"></div>

      <div 
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-green-900 bg-black/50 hover:bg-green-900/10 hover:border-green-500/50 py-16 text-center cursor-pointer transition-all duration-200 backdrop-blur-sm px-4"
      >
        <div className="mb-6 text-green-700 group-hover:text-green-500 transition-colors animate-pulse">
            <span className="font-mono text-4xl font-bold">[ + ]</span>
        </div>
        <h3 className="text-2xl font-['VT323'] text-green-100 tracking-wider mb-2">INITIALIZE UPLOAD SEQUENCE</h3>
        <p className="font-mono text-xs text-green-800 uppercase tracking-widest">
            Drop Source Material or Click to Browse
        </p>
        <p className="font-mono text-[10px] text-green-900 mt-4">
            SUPPORTED: PNG // JPEG // WEBP
        </p>
        <p className="font-mono text-[9px] text-green-900/60 mt-3 max-w-lg mx-auto leading-relaxed uppercase tracking-wider">
            SUGGESTED TARGETS:<br/>
            ID Cards // Business Checks // Signed Contracts // Medical Records // Secure Account Portals // Paystubs // Chat Logs // Bank Statements // Bills // Membership Docs // Insurance Cards
        </p>
      </div>
    </div>
  );
};