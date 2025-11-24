

import React, { useState } from 'react';
import { DetectedElement, FieldCategory } from '../types';

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

  const getBorderColor = (category: FieldCategory, isSelected: boolean) => {
      if (isSelected) return 'border-white';
      if (category === FieldCategory.VARIABLE) return 'border-green-500';
      if (category === FieldCategory.STATIC) return 'border-red-600';
      if (category === FieldCategory.PHOTO) return 'border-cyan-400';
      return 'border-gray-500';
  };

  const getBgColor = (category: FieldCategory, isSelected: boolean) => {
      if (isSelected) return 'bg-white/20';
      if (category === FieldCategory.VARIABLE) return 'bg-green-500/10';
      if (category === FieldCategory.STATIC) return 'bg-red-600/5';
      if (category === FieldCategory.PHOTO) return 'bg-cyan-400/10';
      return 'bg-gray-500/10';
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Grid Overlay Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

      {elements.map((el) => {
        const isSelected = selectedElementId === el.id;
        const isHovered = hoveredId === el.id;
        const style = getStyle(el.box_2d);
        const borderColor = getBorderColor(el.category, isSelected);
        const bgColor = getBgColor(el.category, isSelected);
        
        // Z-Index: Variable > Static so Green boxes overlay Red ones
        const zIndex = el.category === FieldCategory.VARIABLE ? 30 : 20;

        return (
          <div
            key={el.id}
            style={{...style, zIndex: isSelected ? 50 : zIndex}}
            onMouseEnter={() => setHoveredId(el.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={(e) => {
              e.stopPropagation();
              // Green (Variable) & Photo: Single Click
              if (el.category === FieldCategory.VARIABLE || el.category === FieldCategory.PHOTO) {
                  onSelectElement(el);
              }
            }}
            onDoubleClick={(e) => {
               e.stopPropagation();
               // Red (Static): Double Click
               if (el.category === FieldCategory.STATIC) {
                   onSelectElement(el);
               }
            }}
            className={`
              absolute border-2 transition-all duration-200 cursor-pointer pointer-events-auto
              flex items-start justify-start
              ${borderColor} ${isHovered ? bgColor : 'bg-transparent'}
              ${isSelected ? 'shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}
            `}
          >
            {/* Corner Markers */}
            <div className={`absolute -top-1 -left-1 w-2 h-2 border-t border-l ${borderColor}`}></div>
            <div className={`absolute -top-1 -right-1 w-2 h-2 border-t border-r ${borderColor}`}></div>
            <div className={`absolute -bottom-1 -left-1 w-2 h-2 border-b border-l ${borderColor}`}></div>
            <div className={`absolute -bottom-1 -right-1 w-2 h-2 border-b border-r ${borderColor}`}></div>

            {/* Label Tag */}
            {(isHovered || isSelected) && (
              <div className={`
                absolute -top-6 left-0 whitespace-nowrap px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest
                backdrop-blur-md border
                ${isSelected ? 'bg-white text-black border-white' : 'bg-black/90 border-current'}
                ${el.category === FieldCategory.VARIABLE ? 'text-green-400 border-green-500' : ''}
                ${el.category === FieldCategory.STATIC ? 'text-red-500 border-red-500' : ''}
                ${el.category === FieldCategory.PHOTO ? 'text-cyan-400 border-cyan-500' : ''}
              `}>
                {el.label} 
                <span className="opacity-60 ml-2 font-normal lowercase">
                    {el.category === FieldCategory.STATIC ? '(Double-Click)' : ''}
                </span>
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