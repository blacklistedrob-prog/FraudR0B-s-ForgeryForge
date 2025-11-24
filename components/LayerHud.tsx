import React, { useState } from 'react';
import { DetectedElement } from '../types';

interface LayerHudProps {
  elements: DetectedElement[];
  onSelectElement: (element: DetectedElement) => void;
  selectedElementId?: string;
}

export const LayerHud: React.FC<LayerHudProps> = ({ elements, onSelectElement, selectedElementId }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Helper to convert 0-1000 coordinates to css percentage
  const getStyle = (box: number[]) => {
    // box is [ymin, xmin, ymax, xmax]
    const top = box[0] / 10;
    const left = box[1] / 10;
    const height = (box[2] - box[0]) / 10;
    const width = (box[3] - box[1]) / 10;
    
    return {
      top: `${top}%`,
      left: `${left}%`,
      height: `${height}%`,
      width: `${width}%`
    };
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Grid Overlay Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {elements.map((el) => {
        const isSelected = selectedElementId === el.id;
        const isHovered = hoveredId === el.id;
        const style = getStyle(el.box_2d);
        
        return (
          <div
            key={el.id}
            style={style}
            onMouseEnter={() => setHoveredId(el.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => {
              e.stopPropagation(); // Prevent bubbling if needed
              onSelectElement(el);
            }}
            className={`
              absolute border-2 transition-all duration-200 cursor-pointer pointer-events-auto
              flex items-start justify-start
              ${isSelected ? 'border-green-400 bg-green-900/30 z-30 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'border-green-900/40 hover:border-green-500/80 hover:bg-green-500/10 z-20'}
            `}
          >
            {/* Corner Markers */}
            <div className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l ${isSelected ? 'border-green-400' : 'border-green-700'}`}></div>
            <div className={`absolute -top-1 -right-1 w-2 h-2 border-t border-r ${isSelected ? 'border-green-400' : 'border-green-700'}`}></div>
            <div className={`absolute -bottom-1 -left-1 w-2 h-2 border-b border-l ${isSelected ? 'border-green-400' : 'border-green-700'}`}></div>
            <div className={`absolute -bottom-1 -right-1 w-2 h-2 border-b border-r ${isSelected ? 'border-green-400' : 'border-green-700'}`}></div>

            {/* Label Tag */}
            {(isHovered || isSelected) && (
              <div className={`
                absolute -top-6 left-0 whitespace-nowrap px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest
                backdrop-blur-md border
                ${isSelected ? 'bg-green-500 text-black border-green-400' : 'bg-black/80 text-green-400 border-green-700'}
              `}>
                {el.label} 
                <span className="opacity-60 ml-2 font-normal lowercase">id:{el.id}</span>
              </div>
            )}
            
            {/* Value Preview (if selected) */}
            {isSelected && (
                <div className="absolute top-full left-0 mt-1 bg-black/90 border border-green-500 text-green-100 text-[10px] p-1 font-mono max-w-[200px] break-words">
                   > {el.value}
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
