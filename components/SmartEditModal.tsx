
import React, { useState, useEffect } from 'react';
import { CustomLayer, AppStatus } from '../types';

interface SmartEditModalProps {
  layer: CustomLayer;
  onUpdate: (id: string, updates: Partial<CustomLayer>) => void;
  onClose: () => void;
  onAutoMatch: () => void;
  status: AppStatus;
}

export const SmartEditModal: React.FC<SmartEditModalProps> = ({ 
    layer, 
    onUpdate, 
    onClose, 
    onAutoMatch,
    status 
}) => {
    // Local state for input to allow smooth typing
    const [inputValue, setInputValue] = useState(layer.content);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        setInputValue(layer.content);
    }, [layer.content]);

    const handleInputConfirm = () => {
        onUpdate(layer.id, { content: inputValue });
    };

    const updateStyle = (key: keyof typeof layer.style, value: any) => {
        onUpdate(layer.id, { 
            style: { ...layer.style, [key]: value } 
        });
    };

    return (
        <div className="absolute z-[100] bg-black/95 border-2 border-green-500 shadow-[0_0_30px_rgba(0,0,0,0.8)] rounded-sm p-4 w-[320px] backdrop-blur-md animate-in fade-in zoom-in duration-200"
             style={{
                 left: `clamp(10px, ${layer.x}%, calc(100% - 330px))`,
                 top: `clamp(10px, ${layer.y + 10}%, calc(100% - 400px))`
             }}
        >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-800">
                <span className="text-green-500 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    LAYER_EDIT: {layer.label || 'UNKNOWN'}
                </span>
                <button onClick={onClose} className="text-gray-500 hover:text-white text-xs font-bold">[X]</button>
            </div>

            {/* Main Input */}
            <div className="mb-4">
                <div className="relative group">
                    <input 
                        type="text" 
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={handleInputConfirm}
                        onKeyDown={(e) => e.key === 'Enter' && handleInputConfirm()}
                        className="w-full bg-[#111] border border-green-900/50 p-2 text-lg font-mono text-white focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all placeholder-gray-700"
                        autoFocus
                    />
                    <div className="absolute top-0 right-0 h-full flex items-center pr-2">
                        <button 
                            onClick={onAutoMatch}
                            className={`text-[9px] uppercase font-bold px-2 py-1 rounded-sm transition-colors ${status === AppStatus.ANALYZING ? 'bg-yellow-500 text-black' : 'bg-green-900/30 text-green-500 hover:bg-green-500 hover:text-black'}`}
                            title="Agent Zeta: Re-analyze pixels to match style"
                        >
                            {status === AppStatus.ANALYZING ? 'SCANNING...' : '⚡ MATCH STYLE'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Controls */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                     <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Size (px)</label>
                     <input 
                        type="number" 
                        value={layer.style.fontSize}
                        onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                        className="w-full bg-black border border-gray-800 p-1 text-xs text-green-400 font-mono focus:border-green-500 outline-none"
                     />
                </div>
                <div>
                     <label className="text-[9px] text-gray-500 uppercase font-bold block mb-1">Color</label>
                     <div className="flex items-center gap-2">
                        <input 
                            type="color" 
                            value={layer.style.color}
                            onChange={(e) => updateStyle('color', e.target.value)}
                            className="w-6 h-6 bg-transparent border-none cursor-pointer"
                        />
                        <span className="text-[9px] text-gray-400 font-mono">{layer.style.color}</span>
                     </div>
                </div>
            </div>

            {/* Blending Controls */}
            <div className="bg-green-950/10 border border-green-900/30 p-2 mb-2">
                 <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
                     <label className="text-[9px] text-green-600 uppercase font-bold flex items-center gap-1">
                         Seamless Blend {showAdvanced ? '▼' : '▶'}
                     </label>
                     <span className="text-[8px] text-gray-500">NOISE / BLUR / MASK</span>
                 </div>
                 
                 {showAdvanced && (
                     <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                         <div>
                             <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                                 <span>NOISE GRAIN</span>
                                 <span>{layer.style.noise || 0}%</span>
                             </div>
                             <input 
                                type="range" min="0" max="100" 
                                value={layer.style.noise || 0}
                                onChange={(e) => updateStyle('noise', parseInt(e.target.value))}
                                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                             />
                         </div>
                         <div>
                             <div className="flex justify-between text-[9px] text-gray-400 mb-1">
                                 <span>BLUR (SOFTNESS)</span>
                                 <span>{layer.style.blur || 0}px</span>
                             </div>
                             <input 
                                type="range" min="0" max="10" step="0.5"
                                value={layer.style.blur || 0}
                                onChange={(e) => updateStyle('blur', parseFloat(e.target.value))}
                                className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-green-500"
                             />
                         </div>
                         <div className="flex items-center justify-between pt-1">
                             <label className="text-[9px] text-gray-400 uppercase">Background Mask</label>
                             <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={layer.style.backgroundColor || '#ffffff'}
                                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                                    className="w-4 h-4 bg-transparent border-none cursor-pointer"
                                />
                                <button 
                                    onClick={() => updateStyle('backgroundColor', 'transparent')}
                                    className="text-[8px] text-red-500 border border-red-900 px-1 hover:bg-red-900/20"
                                >
                                    CLEAR
                                </button>
                             </div>
                         </div>
                     </div>
                 )}
            </div>

            <div className="text-[8px] text-gray-600 font-mono text-center pt-2 border-t border-gray-900">
                DRAG TO MOVE • CLICK OUTSIDE TO SAVE
            </div>
        </div>
    );
};
