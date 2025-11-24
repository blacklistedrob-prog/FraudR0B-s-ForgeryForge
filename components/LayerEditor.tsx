

import React, { useState, useRef, useEffect } from 'react';
import { CustomLayer, LayerStyle } from '../types';

interface LayerEditorProps {
  layers: CustomLayer[];
  onUpdateLayer: (id: string, updates: Partial<CustomLayer>) => void;
  onSelectLayer: (id: string | null) => void;
  selectedLayerId: string | null;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const LayerEditor: React.FC<LayerEditorProps> = ({ 
  layers, 
  onUpdateLayer, 
  onSelectLayer, 
  selectedLayerId,
  containerRef
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStart = useRef<{x: number, y: number}>({x: 0, y: 0});
  const initialPos = useRef<{x: number, y: number, w: number, h: number}>({x: 0, y: 0, w: 0, h: 0});

  const handleMouseDown = (e: React.MouseEvent, layer: CustomLayer, action: 'drag' | 'resize') => {
    e.stopPropagation();
    onSelectLayer(layer.id);
    
    if (action === 'drag') setIsDragging(true);
    if (action === 'resize') setIsResizing(true);
    
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: layer.x, y: layer.y, w: layer.width, h: layer.height };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if ((!isDragging && !isResizing) || !selectedLayerId || !containerRef.current) return;

    const dxPixels = e.clientX - dragStart.current.x;
    const dyPixels = e.clientY - dragStart.current.y;

    const containerRect = containerRef.current.getBoundingClientRect();
    const dxPercent = (dxPixels / containerRect.width) * 100;
    const dyPercent = (dyPixels / containerRect.height) * 100;

    if (isDragging) {
      onUpdateLayer(selectedLayerId, {
        x: initialPos.current.x + dxPercent,
        y: initialPos.current.y + dyPercent
      });
    }

    if (isResizing) {
       // Only for images or resizing text boxes
       onUpdateLayer(selectedLayerId, {
         width: Math.max(5, initialPos.current.w + dxPercent),
         height: Math.max(5, initialPos.current.h + dyPercent)
       });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, selectedLayerId]);

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
      {layers.map(layer => {
        const isSelected = selectedLayerId === layer.id;
        
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${layer.x}%`,
          top: `${layer.y}%`,
          width: layer.type === 'image' ? `${layer.width}%` : 'auto',
          height: layer.type === 'image' ? `${layer.height}%` : 'auto',
          transform: `translate(-50%, -50%) rotate(${layer.style.rotation}deg)`,
          fontFamily: layer.style.fontFamily,
          fontSize: layer.type === 'text' ? `${layer.style.fontSize}px` : undefined, // Start px, ideally responsive
          fontWeight: layer.style.fontWeight,
          color: layer.style.color,
          backgroundColor: layer.style.backgroundColor || 'transparent',
          letterSpacing: `${layer.style.letterSpacing}px`,
          opacity: layer.style.opacity,
          textAlign: layer.style.textAlign,
          whiteSpace: 'nowrap',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          pointerEvents: 'auto',
          zIndex: isSelected ? 50 : 40,
        };

        return (
          <div
            key={layer.id}
            style={style}
            onMouseDown={(e) => handleMouseDown(e, layer, 'drag')}
            className={`group ${isSelected ? 'border border-dashed border-green-500' : 'hover:border hover:border-dashed hover:border-green-500/50'}`}
          >
            {layer.type === 'text' ? (
               <span className="p-1">{layer.content}</span>
            ) : (
               <img src={layer.content} alt="layer" className="w-full h-full object-contain pointer-events-none" />
            )}

            {/* Controls */}
            {isSelected && (
              <>
                {/* Resize Handle (Bottom Right) */}
                <div 
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 cursor-nwse-resize border border-black"
                  onMouseDown={(e) => handleMouseDown(e, layer, 'resize')}
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};