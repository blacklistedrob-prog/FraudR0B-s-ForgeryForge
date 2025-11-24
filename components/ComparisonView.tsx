
import React, { useState, useRef } from 'react';
import { DetectedElement, ImageFilters, ViewTransforms, UiFlags, CustomLayer } from '../types';
import { LayerHud } from './LayerHud';
import { LayerEditor } from './LayerEditor';

interface ComparisonViewProps {
  original: string | null;
  edited: string | null;
  detectedElements?: DetectedElement[];
  onSelectElement?: (el: DetectedElement) => void;
  selectedElementId?: string;
  filters?: ImageFilters;
  transforms?: ViewTransforms;
  uiFlags?: UiFlags;
  // New props for custom layers
  customLayers?: CustomLayer[];
  onUpdateLayer?: (id: string, updates: Partial<CustomLayer>) => void;
  onSelectLayer?: (id: string | null) => void;
  selectedLayerId?: string | null;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ 
    original, 
    edited, 
    detectedElements, 
    onSelectElement,
    selectedElementId,
    filters,
    transforms,
    uiFlags,
    customLayers,
    onUpdateLayer,
    onSelectLayer,
    selectedLayerId
}) => {
  const [activeTab, setActiveTab] = useState<'original' | 'edited' | 'split'>('edited');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Default to original view if editing hasn't happened yet to show HUD
  React.useEffect(() => {
      if (!edited && original) {
          setActiveTab('original');
      } else if (edited) {
          setActiveTab('edited');
      }
  }, [edited, original]);

  if (!original) return null;

  // Construct CSS filter string
  const getFilterStyle = () => {
      if (!filters) return {};
      return {
          filter: `
            brightness(${filters.brightness}%) 
            contrast(${filters.contrast}%) 
            saturate(${filters.saturation}%) 
            grayscale(${filters.grayscale}%) 
            sepia(${filters.sepia}%) 
            invert(${filters.invert}%) 
            blur(${filters.blur}px) 
            hue-rotate(${filters.hueRotate}deg) 
            opacity(${filters.opacity}%)
          `
      };
  };

  // Construct Transform string
  const getTransformStyle = () => {
      if (!transforms) return {};
      const scale = `scale(${transforms.scale})`;
      const rotate = `rotate(${transforms.rotate}deg)`;
      const flipH = transforms.flipH ? 'scaleX(-1)' : '';
      const flipV = transforms.flipV ? 'scaleY(-1)' : '';
      return {
          transform: `${scale} ${rotate} ${flipH} ${flipV}`.trim()
      };
  };

  const combinedStyle = { ...getFilterStyle(), ...getTransformStyle(), transition: 'all 0.3s ease' };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-4">
        <button 
          onClick={() => setActiveTab('original')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'original' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
        >
          Targeting (Source)
        </button>
        <button 
          onClick={() => setActiveTab('split')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'split' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
        >
          Split View
        </button>
        <button 
          onClick={() => setActiveTab('edited')}
          disabled={!edited}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'edited' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} ${!edited ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Result
        </button>
      </div>

      {/* Canvas Area */}
      <div className={`flex-1 relative bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 backdrop-blur-sm min-h-[400px] flex items-center justify-center p-4 ${uiFlags?.grid ? 'bg-[url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMCAwTDQwIDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLCAyNTUsIDAsIDAuMTUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=")]' : ''}`}>
        
        {/* Original View with HUD & Custom Layers */}
        {activeTab === 'original' && (
          <div ref={containerRef} className="relative inline-block max-w-full max-h-[60vh]" style={combinedStyle}>
              <img src={original} alt="Original" className="max-w-full max-h-[60vh] object-contain shadow-2xl rounded-lg block" />
              
              {/* HUD Overlay */}
              {(uiFlags?.hud !== false) && detectedElements && detectedElements.length > 0 && onSelectElement && (
                  <LayerHud 
                    elements={detectedElements} 
                    onSelectElement={onSelectElement}
                    selectedElementId={selectedElementId}
                  />
              )}

              {/* Custom Layer Editor Overlay */}
              {customLayers && onUpdateLayer && onSelectLayer && (
                  <LayerEditor 
                      layers={customLayers} 
                      onUpdateLayer={onUpdateLayer} 
                      onSelectLayer={onSelectLayer}
                      selectedLayerId={selectedLayerId || null}
                      containerRef={containerRef}
                  />
              )}
          </div>
        )}

        {/* Edited Result */}
        {activeTab === 'edited' && edited && (
          <img src={edited} alt="Edited" className="max-w-full max-h-[60vh] object-contain shadow-2xl rounded-lg animate-in fade-in duration-500" style={combinedStyle} />
        )}
        
        {activeTab === 'edited' && !edited && (
            <div className="text-slate-400 flex flex-col items-center">
                <span className="mb-2 text-3xl">✨</span>
                <p>Waiting for generation...</p>
            </div>
        )}

        {/* Split View */}
        {activeTab === 'split' && (
          <div className="relative w-full h-[60vh] flex gap-4">
             <div className="flex-1 flex flex-col items-center justify-center border-r border-slate-700 pr-2 overflow-hidden">
                <span className="text-slate-500 text-xs uppercase tracking-wider mb-2">Before</span>
                <img src={original} alt="Original" className="max-w-full max-h-full object-contain shadow-lg rounded" style={combinedStyle} />
             </div>
             <div className="flex-1 flex flex-col items-center justify-center pl-2 overflow-hidden">
                <span className="text-indigo-400 text-xs uppercase tracking-wider mb-2">After</span>
                {edited ? (
                     <img src={edited} alt="Edited" className="max-w-full max-h-full object-contain shadow-lg rounded" style={combinedStyle} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-700 rounded text-slate-500">
                        Pending
                    </div>
                )}
             </div>
          </div>
        )}

        {/* Scanlines Overlay */}
        {uiFlags?.scanlines && (
             <div className="absolute inset-0 pointer-events-none z-50 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%]"></div>
        )}
      </div>
    </div>
  );
};