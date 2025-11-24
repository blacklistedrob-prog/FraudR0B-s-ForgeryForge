import React, { useState, useEffect } from 'react';
import { AAMVAFields, AppStatus } from '../types';
import { Button } from './Button';

interface BarcodeModalProps {
  initialData: Partial<AAMVAFields>;
  onGenerate: (data: Partial<AAMVAFields>) => void;
  onClose: () => void;
  status: AppStatus;
}

export const BarcodeModal: React.FC<BarcodeModalProps> = ({ initialData, onGenerate, onClose, status }) => {
  const [formData, setFormData] = useState<Partial<AAMVAFields>>(initialData);

  useEffect(() => {
      setFormData(initialData);
  }, [initialData]);

  const handleChange = (key: keyof AAMVAFields, value: string) => {
      setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = () => {
      onGenerate(formData);
  };

  const inputClass = "w-full bg-black border border-green-900 text-green-100 p-2 text-xs font-mono focus:border-green-500 outline-none uppercase placeholder-green-900/50";
  const labelClass = "block text-[10px] text-green-700 uppercase font-bold tracking-widest mb-1";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in zoom-in duration-200">
      <div className="w-full max-w-2xl bg-[#050505] border border-green-600 shadow-[0_0_50px_rgba(0,255,0,0.15)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-green-900 bg-green-950/20 flex justify-between items-center">
            <div>
                <h3 className="text-xl font-['VT323'] text-white tracking-wider flex items-center gap-2">
                    <span className="text-green-500">|||</span> AAMVA PDF417 GENERATOR
                </h3>
                <p className="text-[10px] text-green-600 font-mono uppercase">Protocol: DL/ID-2020 // Agent: Compliance_Bot</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white font-mono text-xs">[ ABORT ]</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="bg-green-900/10 border border-green-900/50 p-3 mb-6 text-[10px] font-mono text-green-400">
                <strong className="text-green-300">AGENT NOTE:</strong> Input data below. System will auto-correct format (Abbreviations, Capitalization, Dates) to match AAMVA standards. Missing fields will be generated mathematically.
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                    <label className={labelClass}>Jurisdiction / State</label>
                    <input 
                        type="text" 
                        value={formData.state || ''} 
                        onChange={(e) => handleChange('state', e.target.value)}
                        className={inputClass}
                        placeholder="WA"
                        maxLength={2}
                    />
                 </div>
                 <div>
                    <label className={labelClass}>DL / ID Number</label>
                    <input 
                        type="text" 
                        value={formData.dlNumber || ''} 
                        onChange={(e) => handleChange('dlNumber', e.target.value)}
                        className={inputClass}
                        placeholder="WDL..."
                    />
                 </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
                 <div>
                    <label className={labelClass}>First Name</label>
                    <input 
                        type="text" 
                        value={formData.firstName || ''} 
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        className={inputClass}
                    />
                 </div>
                 <div>
                    <label className={labelClass}>Middle Name</label>
                    <input 
                        type="text" 
                        value={formData.middleName || ''} 
                        onChange={(e) => handleChange('middleName', e.target.value)}
                        className={inputClass}
                    />
                 </div>
                 <div>
                    <label className={labelClass}>Last Name</label>
                    <input 
                        type="text" 
                        value={formData.lastName || ''} 
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        className={inputClass}
                    />
                 </div>
            </div>

             <div className="mb-4">
                <label className={labelClass}>Full Address</label>
                <input 
                    type="text" 
                    value={formData.address || ''} 
                    onChange={(e) => handleChange('address', e.target.value)}
                    className={inputClass}
                    placeholder="123 FAKE ST"
                />
             </div>

             <div className="grid grid-cols-3 gap-4 mb-4">
                 <div className="col-span-1">
                    <label className={labelClass}>City</label>
                    <input 
                        type="text" 
                        value={formData.city || ''} 
                        onChange={(e) => handleChange('city', e.target.value)}
                        className={inputClass}
                    />
                 </div>
                 <div className="col-span-1">
                    <label className={labelClass}>Zip Code</label>
                    <input 
                        type="text" 
                        value={formData.zipCode || ''} 
                        onChange={(e) => handleChange('zipCode', e.target.value)}
                        className={inputClass}
                    />
                 </div>
                  <div>
                    <label className={labelClass}>DOB (YYYY-MM-DD)</label>
                    <input 
                        type="text" 
                        value={formData.dob || ''} 
                        onChange={(e) => handleChange('dob', e.target.value)}
                        className={inputClass}
                        placeholder="1990-01-01"
                    />
                 </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={labelClass}>EXP (YYYY-MM-DD)</label>
                    <input 
                        type="text" 
                        value={formData.expDate || ''} 
                        onChange={(e) => handleChange('expDate', e.target.value)}
                        className={inputClass}
                    />
                 </div>
                  <div>
                    <label className={labelClass}>ISS (YYYY-MM-DD)</label>
                    <input 
                        type="text" 
                        value={formData.issueDate || ''} 
                        onChange={(e) => handleChange('issueDate', e.target.value)}
                        className={inputClass}
                    />
                 </div>
                  <div>
                    <label className={labelClass}>Sex</label>
                    <select 
                        value={formData.sex || '1'} 
                        onChange={(e) => handleChange('sex', e.target.value)}
                        className={inputClass}
                    >
                        <option value="1">MALE (1)</option>
                        <option value="2">FEMALE (2)</option>
                    </select>
                 </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-4">
                 <div>
                    <label className={labelClass}>Height (in)</label>
                    <input 
                        type="text" 
                        value={formData.height || ''} 
                        onChange={(e) => handleChange('height', e.target.value)}
                        className={inputClass}
                        placeholder="070"
                    />
                 </div>
                 <div>
                    <label className={labelClass}>Weight (lbs)</label>
                    <input 
                        type="text" 
                        value={formData.weight || ''} 
                        onChange={(e) => handleChange('weight', e.target.value)}
                        className={inputClass}
                        placeholder="180"
                    />
                 </div>
                 <div>
                    <label className={labelClass}>Eyes</label>
                    <input 
                        type="text" 
                        value={formData.eyes || ''} 
                        onChange={(e) => handleChange('eyes', e.target.value)}
                        className={inputClass}
                        placeholder="BLU"
                    />
                 </div>
                 <div>
                    <label className={labelClass}>Hair</label>
                    <input 
                        type="text" 
                        value={formData.hair || ''} 
                        onChange={(e) => handleChange('hair', e.target.value)}
                        className={inputClass}
                        placeholder="BRO"
                    />
                 </div>
            </div>

             <div className="mb-4">
                <label className={labelClass}>Document Discriminator (DD)</label>
                <input 
                    type="text" 
                    value={formData.discriminator || ''} 
                    onChange={(e) => handleChange('discriminator', e.target.value)}
                    className={inputClass}
                    placeholder="Audit number"
                />
             </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-green-900 bg-black flex gap-4">
            <Button 
                onClick={handleGenerate} 
                className="w-full" 
                variant="primary"
                isLoading={status === AppStatus.GENERATING_BARCODE}
            >
                [ GENERATE & INJECT PDF417 ]
            </Button>
        </div>

      </div>
    </div>
  );
};