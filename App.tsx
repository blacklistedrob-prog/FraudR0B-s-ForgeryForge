

import React, { useState, useCallback } from 'react';
import { UploadZone } from './components/UploadZone';
import { Button } from './components/Button';
import { ComparisonView } from './components/ComparisonView';
import { TemplateSearch } from './components/TemplateSearch';
import { AppStatus, DocumentState, AgentStep, GeneratedAsset, PaperSize, ExportFormat, DocumentType, DetectedElement, RootTerminalActions, ImageFilters, ViewTransforms, UiFlags, AgentStatus, CustomLayer, LayerStyle } from './types';
import { editDocumentImage, getSearchContext, analyzeDocument, generateSupportAsset, extractDocumentData, findAndFabricateTemplate, predictTextStyle, detectIdFields, generateCleanPlate } from './services/geminiService';
import { jsPDF } from 'jspdf';
import { RootTerminal } from './components/RootTerminal';
import { HelpModal } from './components/HelpModal';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [agentStep, setAgentStep] = useState<AgentStep>(AgentStep.IDLE);
  
  // Document State
  const [docState, setDocState] = useState<DocumentState>({
    originalImage: null,
    editedImage: null,
    fileName: '',
    extractedData: undefined,
    detectedElements: [],
    customLayers: []
  });
  
  // History State
  const [history, setHistory] = useState<DocumentState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const [prompt, setPrompt] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<DetectedElement | undefined>(undefined);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  
  // Advanced Features State
  const [docType, setDocType] = useState<DocumentType>(DocumentType.GENERAL);
  const [useIntel, setUseIntel] = useState<boolean>(false);
  const [showForensics, setShowForensics] = useState<boolean>(false);
  const [showAssetGen, setShowAssetGen] = useState<boolean>(false);
  const [assetPrompt, setAssetPrompt] = useState<string>('');
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAsset[]>([]);

  // Visual & System State (New)
  const [imageFilters, setImageFilters] = useState<ImageFilters>({
      brightness: 100, contrast: 100, saturation: 100, grayscale: 0, 
      sepia: 0, invert: 0, blur: 0, hueRotate: 0, opacity: 100
  });
  const [viewTransforms, setViewTransforms] = useState<ViewTransforms>({
      rotate: 0, scale: 1, flipH: false, flipV: false
  });
  const [uiFlags, setUiFlags] = useState<UiFlags>({
      crt: false, grid: false, scanlines: false, hud: true, debug: false, audio: false
  });

  // Export State
  const [showExport, setShowExport] = useState<boolean>(false);
  const [paperSize, setPaperSize] = useState<PaperSize>(PaperSize.ORIGINAL);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.PNG);

  // Root Terminal
  const [showTerminal, setShowTerminal] = useState<boolean>(false);
  
  // Help System
  const [showHelp, setShowHelp] = useState<boolean>(false);
  
  // Derived State
  const activeLayer = docState.customLayers?.find(l => l.id === selectedLayerId);

  // --- History Management ---

  const addToHistory = (newState: DocumentState) => {
    // Slice history to current point (removes future if we were in the middle of undo stack)
    const prevHistory = history.slice(0, historyIndex + 1);
    const newHistory = [...prevHistory, newState];
    
    // Limit to 5 UNDO steps (so 6 states total: current + 5 past)
    if (newHistory.length > 6) {
        newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setDocState(history[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setDocState(history[newIndex]);
    }
  };

  // --- Helpers ---

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileSelect = useCallback(async (file: File) => {
    setStatus(AppStatus.UPLOADING);
    try {
      const base64 = await fileToBase64(file);
      await initializeDocumentWorkspace(base64, file.name);
    } catch (err) {
      console.error(err);
      setErrorMsg("Upload Link Failed.");
      setStatus(AppStatus.ERROR);
    }
  }, [docType]);

  const handleIdSanitization = async (originalBase64: string, currentState: DocumentState): Promise<DocumentState> => {
      // 1. Check for API Key (required for high-quality clean plate)
      const aiStudio = (window as any).aistudio;
      if (aiStudio && aiStudio.hasSelectedApiKey) {
          const hasKey = await aiStudio.hasSelectedApiKey();
          if (!hasKey) {
             try { await aiStudio.openSelectKey(); } catch(e) {}
          }
      }

      setStatus(AppStatus.SANITIZING);
      setAgentStep(AgentStep.CLEANING);
      
      try {
          // Parallel Execution: 
          // 1. Get Style from Original (Agent Zeta)
          // 2. Get Field Locations from Original (Agent Sigma)
          // 3. Generate Clean Plate (Agent Gamma)
          
          // Note: We use a generic "Text" for style prediction to get general document font
          const stylePromise = predictTextStyle(originalBase64, "SAMPLE");
          const fieldsPromise = detectIdFields(originalBase64);
          const cleanPlatePromise = generateCleanPlate(originalBase64);
          
          const [baseStyle, fields, cleanPlateUrl] = await Promise.all([stylePromise, fieldsPromise, cleanPlatePromise]);
          
          // Map detected fields to Custom Layers
          const newLayers: CustomLayer[] = fields.map(field => {
              // Calculate percent coordinates
              const y = ((field.box_2d[0] + field.box_2d[2]) / 2) / 10;
              const x = ((field.box_2d[1] + field.box_2d[3]) / 2) / 10;
              
              if (field.id === 'portrait_photo') {
                  return {
                      id: crypto.randomUUID(),
                      type: 'image',
                      content: 'https://placehold.co/400x400/000000/22c55e?text=CLICK+TO+ADD+PHOTO', // Placeholder
                      x: x, y: y,
                      width: (field.box_2d[3] - field.box_2d[1]) / 10,
                      height: (field.box_2d[2] - field.box_2d[0]) / 10,
                      style: { ...baseStyle, opacity: 0.8 }
                  };
              }
              
              return {
                  id: crypto.randomUUID(),
                  type: 'text',
                  content: `[${field.label.toUpperCase()}]`,
                  x: x, y: y,
                  width: 20, height: 5,
                  style: {
                      ...baseStyle,
                      color: baseStyle.color || '#000000',
                      textAlign: 'left' // usually left aligned on IDs
                  },
                  label: field.label
              };
          });

          return {
              ...currentState,
              originalImage: cleanPlateUrl, // The Clean Plate becomes the new base!
              customLayers: newLayers
          };

      } catch (e) {
          console.error("Sanitization Failed", e);
          setErrorMsg("Auto-Sanitization Failed. Reverting to manual mode.");
          return currentState;
      } finally {
          setAgentStep(AgentStep.IDLE);
      }
  };

  const initializeDocumentWorkspace = async (base64: string, fileName: string) => {
      let initialState: DocumentState = {
        originalImage: base64,
        editedImage: null,
        fileName: fileName,
        extractedData: undefined,
        detectedElements: [],
        customLayers: []
      };

      setStatus(AppStatus.PROCESSING);
      setErrorMsg(null);
      setPaperSize(PaperSize.ORIGINAL);
      setExportFormat(ExportFormat.PNG);
      setSelectedElement(undefined);
      setSelectedLayerId(null);
      setHistory([]);
      setHistoryIndex(-1);
      
      setImageFilters({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, invert: 0, blur: 0, hueRotate: 0, opacity: 100 });
      setViewTransforms({ rotate: 0, scale: 1, flipH: false, flipV: false });

      // Special Flow for ID Cards
      if (docType === DocumentType.ID_CARD) {
          initialState = await handleIdSanitization(base64, initialState);
          setDocState(initialState);
          setHistory([initialState]);
          setHistoryIndex(0);
          setStatus(AppStatus.READY_TO_EDIT);
          return;
      }

      // Standard Flow
      setDocState(initialState);
      setAgentStep(AgentStep.EXTRACTING);
      
      try {
          const elements = await extractDocumentData(base64, docType);
          const dump = elements.map(e => `${e.label}: ${e.value}`).join('\n');
          
          const completeState = { 
              ...initialState, 
              extractedData: dump,
              detectedElements: elements
          };
          
          setDocState(completeState);
          setHistory([completeState]);
          setHistoryIndex(0);
          setStatus(AppStatus.READY_TO_EDIT);
      } catch (e) {
         console.error("Extraction failed", e);
         setHistory([initialState]);
         setHistoryIndex(0);
         setStatus(AppStatus.READY_TO_EDIT);
      } finally {
          setAgentStep(AgentStep.IDLE);
      }
  };

  // --- Layer Management ---
  const handleAddTextLayer = () => {
    const newLayer: CustomLayer = {
        id: crypto.randomUUID(),
        type: 'text',
        content: 'NEW TEXT',
        x: 50, y: 50, width: 20, height: 10,
        style: {
            fontFamily: 'Courier New',
            fontSize: 24,
            fontWeight: 'bold',
            color: '#000000',
            letterSpacing: 0,
            opacity: 1,
            rotation: 0,
            textAlign: 'left'
        }
    };
    const newState = { ...docState, customLayers: [...(docState.customLayers || []), newLayer] };
    setDocState(newState);
    setSelectedLayerId(newLayer.id);
  };

  const handleSmartAddText = async () => {
      const text = prompt("ENTER TEXT CONTENT:", "APPROVED");
      if (!text || !docState.originalImage) return;

      setStatus(AppStatus.ANALYZING);
      setErrorMsg(null);

      try {
          // Agent Zeta: Typography Forensics
          const predictedStyle = await predictTextStyle(docState.originalImage, text);
          
          const newLayer: CustomLayer = {
            id: crypto.randomUUID(),
            type: 'text',
            content: text,
            x: 50, y: 50, width: 20, height: 10,
            style: predictedStyle
          };

          const newState = { ...docState, customLayers: [...(docState.customLayers || []), newLayer] };
          setDocState(newState);
          setSelectedLayerId(newLayer.id);
          setStatus(AppStatus.READY_TO_EDIT);
      } catch (e) {
          console.error(e);
          setErrorMsg("Smart Auto-Match Failed. Using Defaults.");
          setStatus(AppStatus.READY_TO_EDIT);
          handleAddTextLayer(); // Fallback
      }
  };

  const handleAutoMatchLayer = async () => {
      if (!selectedLayerId || !activeLayer || !docState.originalImage) return;
      
      setStatus(AppStatus.ANALYZING);
      try {
          // Agent Zeta needs text context to match fonts, or a generic sample
          const textContext = activeLayer.type === 'text' ? activeLayer.content : "SAMPLE";
          const style = await predictTextStyle(docState.originalImage, textContext);
          
          updateLayerStyle(selectedLayerId, style);
      } catch (e) {
          setErrorMsg("Agent Zeta: Auto-Match Failed.");
      } finally {
          setStatus(AppStatus.READY_TO_EDIT);
      }
  };

  const handleAddAssetLayer = (assetUrl: string) => {
    // If we are in IDLE (no document loaded), treat this asset as the starting document
    if (!docState.originalImage) {
        initializeDocumentWorkspace(assetUrl, "fabricated_asset.png");
        setShowAssetGen(false);
        return;
    }

    const newLayer: CustomLayer = {
        id: crypto.randomUUID(),
        type: 'image',
        content: assetUrl,
        x: 50, y: 50, width: 30, height: 30,
        style: {
            fontFamily: '',
            fontSize: 0,
            fontWeight: '',
            color: '',
            letterSpacing: 0,
            opacity: 1,
            rotation: 0,
            textAlign: 'left'
        }
    };
    const newState = { ...docState, customLayers: [...(docState.customLayers || []), newLayer] };
    setDocState(newState);
    setSelectedLayerId(newLayer.id);
    setShowAssetGen(false);
  };

  const updateLayer = (id: string, updates: Partial<CustomLayer>) => {
      setDocState(prev => ({
          ...prev,
          customLayers: prev.customLayers?.map(l => l.id === id ? { ...l, ...updates } : l)
      }));
  };
  
  const updateLayerStyle = (id: string, updates: Partial<CustomLayer['style']>) => {
      setDocState(prev => ({
          ...prev,
          customLayers: prev.customLayers?.map(l => l.id === id ? { ...l, style: { ...l.style, ...updates } } : l)
      }));
  };

  const deleteLayer = (id: string) => {
      setDocState(prev => ({
          ...prev,
          customLayers: prev.customLayers?.filter(l => l.id !== id)
      }));
      setSelectedLayerId(null);
  };

  const flattenLayersToImage = async (): Promise<string> => {
      if (!docState.originalImage || !docState.customLayers || docState.customLayers.length === 0) {
          return docState.originalImage || '';
      }

      return new Promise((resolve) => {
          const img = new Image();
          img.src = docState.originalImage!;
          img.crossOrigin = "anonymous"; // Try to handle CORS if needed
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              // Draw original
              ctx.drawImage(img, 0, 0);

              // Draw Layers
              docState.customLayers?.forEach(layer => {
                 ctx.save();
                 // Convert percentages to pixels
                 const x = (layer.x / 100) * canvas.width;
                 const y = (layer.y / 100) * canvas.height;
                 
                 ctx.translate(x, y);
                 ctx.rotate((layer.style.rotation * Math.PI) / 180);

                 ctx.globalAlpha = layer.style.opacity;

                 if (layer.type === 'image') {
                     const w = (layer.width / 100) * canvas.width;
                     const h = (layer.height / 100) * canvas.height;
                     const imgObj = new Image();
                     imgObj.src = layer.content;
                     imgObj.crossOrigin = "anonymous";
                     // Synchronous drawing for Base64 usually works if preloaded
                     ctx.drawImage(imgObj, -w/2, -h/2, w, h); 
                 } else {
                     // Draw Background Mask if present
                     if (layer.style.backgroundColor) {
                        ctx.fillStyle = layer.style.backgroundColor;
                        // Use the detected box size (stored in layer width/height)
                        const w = (layer.width / 100) * canvas.width;
                        const h = (layer.height / 100) * canvas.height;
                        ctx.fillRect(-w/2, -h/2, w, h);
                     }
                     
                     ctx.font = `${layer.style.fontWeight} ${layer.style.fontSize}px ${layer.style.fontFamily}`;
                     ctx.fillStyle = layer.style.color;
                     ctx.textAlign = layer.style.textAlign;
                     ctx.textBaseline = 'middle';
                     // Note: canvas text doesn't support letter-spacing natively easily without loop, skipping for MVP speed
                     ctx.fillText(layer.content, 0, 0);
                 }
                 ctx.restore();
              });

              resolve(canvas.toDataURL('image/png'));
          };
      });
  };

  // --- End Layer Management ---


  const handleSearchAndFabricate = async (query: string, logUpdate: (msg: string) => void, statusUpdate: (status: Partial<AgentStatus>) => void) => {
      // API Key Check: God Mode uses Search Grounding and Image Gen which requires a user-selected key.
      const aiStudio = (window as any).aistudio;
      if (aiStudio && aiStudio.hasSelectedApiKey && typeof aiStudio.hasSelectedApiKey === 'function') {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (!hasKey) {
            logUpdate("SYSTEM: API Key required for GOD MODE. Requesting Access...");
            try {
                if (aiStudio.openSelectKey && typeof aiStudio.openSelectKey === 'function') {
                    await aiStudio.openSelectKey();
                } else {
                     logUpdate("SYSTEM ERROR: Key Selector Unavailable.");
                     return;
                }
            } catch (e) {
                console.error(e);
                logUpdate("SYSTEM: Key selection aborted.");
                return;
            }
        }
      }

      setStatus(AppStatus.SEARCHING_TEMPLATE);
      setErrorMsg(null);
      
      try {
          // Pass the statusUpdate callback down to the service
          const base64 = await findAndFabricateTemplate(query, logUpdate, statusUpdate);
          logUpdate("Initiating Workspace...");
          
          // Delay briefly to let user read success
          await new Promise(r => setTimeout(r, 1000));
          
          await initializeDocumentWorkspace(base64, `FABRICATED_DOC_${Date.now()}.png`);
          
      } catch (e) {
          console.error(e);
          setErrorMsg("Fabrication process failed.");
          setStatus(AppStatus.IDLE);
      }
  };

  const handleReset = () => {
    setDocState({ originalImage: null, editedImage: null, fileName: '', forensicReport: undefined, searchContext: undefined, extractedData: undefined, detectedElements: [], customLayers: [] });
    setHistory([]);
    setHistoryIndex(-1);
    setPrompt('');
    setStatus(AppStatus.IDLE);
    setAgentStep(AgentStep.IDLE);
    setErrorMsg(null);
    setShowForensics(false);
    setShowAssetGen(false);
    setShowExport(false);
    setDocType(DocumentType.GENERAL);
    setSelectedElement(undefined);
    setSelectedLayerId(null);
    setImageFilters({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, invert: 0, blur: 0, hueRotate: 0, opacity: 100 });
    setViewTransforms({ rotate: 0, scale: 1, flipH: false, flipV: false });
  };

  const handleElementSelect = async (el: DetectedElement) => {
    // 1. Highlight briefly
    setSelectedElement(el);
    
    // 2. Auto-Convert to Editable Layer
    setStatus(AppStatus.ANALYZING);
    setErrorMsg(null);
    
    try {
        // Agent Zeta: Analyze specifically this element's style
        // We pass the detected value as the reference text
        const style = await predictTextStyle(docState.originalImage!, el.value);
        
        // Convert 1000-scale box to percentages
        // box_2d: [ymin, xmin, ymax, xmax]
        const y = ((el.box_2d[0] + el.box_2d[2]) / 2) / 10;
        const x = ((el.box_2d[1] + el.box_2d[3]) / 2) / 10;
        const h = (el.box_2d[2] - el.box_2d[0]) / 10;
        const w = (el.box_2d[3] - el.box_2d[1]) / 10;

        const newLayer: CustomLayer = {
            id: crypto.randomUUID(),
            type: 'text',
            content: el.value,
            x, y, width: w, height: h,
            style: {
                ...style,
                textAlign: 'center' // Force center to align with bounding box center
            },
            label: el.label
        };

        // Add layer
        const newState = { 
            ...docState, 
            customLayers: [...(docState.customLayers || []), newLayer] 
        };
        setDocState(newState);
        
        // Switch selection to the new layer
        setSelectedLayerId(newLayer.id);
        setSelectedElement(undefined); // Unselect the raw element
        
    } catch (e) {
        console.error("Auto-convert failed", e);
        setErrorMsg("Agent Zeta: Style Match Failed.");
        // Fallback: Just let them inspect it, but prompt them they can create layer manually
        setPrompt(`TARGET: "${el.label}" >> OVERWRITE_VALUE: `);
    } finally {
        setStatus(AppStatus.READY_TO_EDIT);
    }
  };
  
  const handleLayerSelect = (id: string | null) => {
      setSelectedLayerId(id);
      if (id) setSelectedElement(undefined); // Deselect extracted element
  };

  const handleForensicAudit = async () => {
    if (!docState.originalImage) return;
    setStatus(AppStatus.ANALYZING);
    setAgentStep(AgentStep.AUDITING);
    try {
        const report = await analyzeDocument(docState.originalImage, docType);
        
        const newState = { ...docState, forensicReport: report };
        setDocState(newState);
        addToHistory(newState);

        setShowForensics(true);
    } catch (e) {
        setErrorMsg("Agent Omega: Audit Failed.");
    } finally {
        setStatus(AppStatus.READY_TO_EDIT);
        setAgentStep(AgentStep.IDLE);
    }
  };

  const handleAssetGeneration = async () => {
      if (!assetPrompt) return;
      
      // Check Key for Asset Gen
      const aiStudio = (window as any).aistudio;
      if (aiStudio && aiStudio.hasSelectedApiKey) {
           const hasKey = await aiStudio.hasSelectedApiKey();
           if (!hasKey) {
               await aiStudio.openSelectKey();
           }
      }

      setStatus(AppStatus.GENERATING_ASSET);
      try {
          const result = await generateSupportAsset({
              prompt: assetPrompt,
              aspectRatio: '1:1',
              resolution: '2K'
          });
          setGeneratedAssets(prev => [...prev, {
              imageUrl: result,
              spec: { prompt: assetPrompt, aspectRatio: '1:1', resolution: '2K' }
          }]);
          setAssetPrompt('');
      } catch (e) {
          setErrorMsg("Agent Gamma: Fabrication Failed.");
      } finally {
          setStatus(AppStatus.READY_TO_EDIT);
      }
  };

  const handleGenerate = async () => {
    if (!docState.originalImage) return;
    
    // Check if we are doing a manual layer composite or a text prompt
    const hasManualLayers = docState.customLayers && docState.customLayers.length > 0;
    if (!prompt.trim() && !hasManualLayers) return;

    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);
    let context = "";

    try {
      // Step 0: Flatten Manual Layers (Client Side Composition)
      let sourceImage = docState.originalImage;
      let finalPrompt = prompt;

      if (hasManualLayers) {
          setAgentStep(AgentStep.DESIGNING);
          sourceImage = await flattenLayersToImage();
          if (!finalPrompt) {
              finalPrompt = "Integrate the added text and graphics seamlessly. Match lighting, noise, and compression artifacts of the original document.";
          }
      }

      // Step 1: Agent Delta (Intel)
      if (useIntel && prompt) {
        // Intel requires tools/grounding - Ensure key
        const aiStudio = (window as any).aistudio;
        if (aiStudio && aiStudio.hasSelectedApiKey && !await aiStudio.hasSelectedApiKey()) await aiStudio.openSelectKey();

        setAgentStep(AgentStep.SEARCHING);
        context = await getSearchContext(prompt);
        setDocState(prev => ({ ...prev, searchContext: context }));
      }

      // Step 2: The Director's Analysis
      setAgentStep(AgentStep.ANALYZING);
      await new Promise(r => setTimeout(r, 1000)); 
      
      setAgentStep(AgentStep.DESIGNING);
      
      // Step 3: Execution
      setAgentStep(AgentStep.FORGING);
      const resultImage = await editDocumentImage(
          sourceImage, 
          finalPrompt, 
          docType, 
          context,
          selectedElement // Pass the specific target if selected
      );
      
      // If we flattened layers, we want to clear them now as they are baked into the result
      const newState = { 
          ...docState, 
          editedImage: resultImage,
          customLayers: [] // Clear layers after baking
      };
      setDocState(newState);
      addToHistory(newState);
      
      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Mission Failed. Ops Commander encountered resistance.");
      setStatus(AppStatus.ERROR);
    } finally {
        setAgentStep(AgentStep.IDLE);
    }
  };

  // --- Exfiltration Logic ---

  const detectBestPaperSize = (img: HTMLImageElement) => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (Math.abs(ratio - 0.707) < 0.05 || Math.abs(ratio - 1.414) < 0.05) {
          setPaperSize(PaperSize.A4);
      } else if (Math.abs(ratio - 0.772) < 0.05 || Math.abs(ratio - 1.294) < 0.05) {
          setPaperSize(PaperSize.LETTER);
      } else {
          setPaperSize(PaperSize.ORIGINAL);
      }
  };

  const handleAutoDetectSize = () => {
      if (!docState.editedImage) return;
      const img = new Image();
      img.src = docState.editedImage;
      img.onload = () => detectBestPaperSize(img);
  };

  const handleExport = () => {
      if (!docState.editedImage) return;

      const img = new Image();
      img.src = docState.editedImage;
      img.onload = () => {
          if (exportFormat === ExportFormat.PDF) {
              let doc: jsPDF;
              const isLandscape = img.naturalWidth > img.naturalHeight;
              
              if (paperSize === PaperSize.A4) {
                  doc = new jsPDF({ orientation: isLandscape ? 'l' : 'p', format: 'a4' });
              } else if (paperSize === PaperSize.LETTER) {
                  doc = new jsPDF({ orientation: isLandscape ? 'l' : 'p', format: 'letter' });
              } else if (paperSize === PaperSize.LEGAL) {
                  doc = new jsPDF({ orientation: isLandscape ? 'l' : 'p', format: 'legal' });
              } else {
                   const mmWidth = img.naturalWidth * 0.264583;
                   const mmHeight = img.naturalHeight * 0.264583;
                   doc = new jsPDF({ orientation: isLandscape ? 'l' : 'p', unit: 'mm', format: [mmWidth, mmHeight] });
              }

              const width = doc.internal.pageSize.getWidth();
              const height = doc.internal.pageSize.getHeight();
              
              doc.addImage(docState.editedImage!, 'PNG', 0, 0, width, height);
              doc.save(`FORGERY_FORGE_${docState.fileName.replace(/\.[^/.]+$/, "")}.pdf`);

          } else {
              const link = document.createElement('a');
              link.href = docState.editedImage!;
              link.download = `FORGERY_FORGE_${docState.fileName}`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
          }
      };
  };

  const handlePrint = () => {
      if (!docState.editedImage) return;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>FORGERY_FORGE_PRINT_JOB_${Date.now()}</title>
                <style>
                  body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
                  img { max-width: 100%; max-height: 100%; object-fit: contain; }
                  @media print { img { width: 100%; height: 100%; } }
                </style>
              </head>
              <body>
                <img src="${docState.editedImage}" onload="window.print();window.close()">
              </body>
            </html>
          `);
          printWindow.document.close();
      }
  };

  const renderAgentStatus = () => {
    if (status !== AppStatus.PROCESSING && status !== AppStatus.ANALYZING && status !== AppStatus.SANITIZING) return null;

    const agents = [
        { id: AgentStep.SEARCHING, name: "AGENT DELTA (Intel)", desc: "Gathering external data points...", color: "text-green-500", bg: "bg-green-500/10" },
        { id: AgentStep.EXTRACTING, name: "AGENT SIGMA (Recon)", desc: "Analyzing document structure...", color: "text-blue-400", bg: "bg-blue-500/10" },
        { id: AgentStep.CLEANING, name: "AGENT GAMMA (Cleaner)", desc: "Sanitizing ID credentials...", color: "text-cyan-400", bg: "bg-cyan-500/10" },
        { id: AgentStep.AUDITING, name: "AGENT OMEGA (QA)", desc: "Checking quality standards...", color: "text-red-500", bg: "bg-red-500/10" },
        { id: AgentStep.ANALYZING, name: "AGENT ALPHA (Forensics)", desc: "Matching noise & grain patterns...", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { id: AgentStep.DESIGNING, name: "AGENT BETA (Logic)", desc: "Calculating checksums...", color: "text-indigo-400", bg: "bg-indigo-500/10" },
        { id: AgentStep.FORGING, name: "AGENT ROUGE (Render)", desc: "Executing seamless edit...", color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
    ];

    return (
      <div className="w-full bg-black/60 border border-green-900 rounded-sm p-4 mb-4 font-mono text-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500/50 to-transparent"></div>
        <h3 className="text-xs font-bold text-green-700 mb-4 flex items-center justify-between uppercase tracking-widest">
          <span>OPS STATUS: ACTIVE</span>
          <span className="text-green-500 animate-pulse">● LIVE</span>
        </h3>
        <div className="space-y-3">
            {agents.map(agent => (
                <div key={agent.id} className={`flex items-center gap-3 transition-all duration-300 p-2 border-l-2 ${agentStep === agent.id ? `border-green-500 bg-green-950/30` : 'border-transparent opacity-30'}`}>
                    <div className={`w-2 h-2 rounded-sm ${agentStep === agent.id ? 'bg-green-500 animate-ping' : 'bg-slate-700'}`}></div>
                    <div className="flex-1">
                        <div className={`font-bold tracking-tight ${agentStep === agent.id ? 'text-green-100' : 'text-slate-500'}`}>{agent.name}</div>
                        {agentStep === agent.id && <div className={`text-xs ${agent.color} mt-1`}>{agent.desc}</div>}
                    </div>
                </div>
            ))}
        </div>
      </div>
    );
  };

  // --- Terminal Action Binding ---
  const terminalActions: RootTerminalActions = {
      setDocType: (t) => setDocType(t),
      toggleIntel: (e) => setUseIntel(e),
      undo: handleUndo,
      redo: handleRedo,
      reset: handleReset,
      setPrompt: (t) => setPrompt(t),
      execute: handleGenerate,
      openAssetFab: (p) => {
          setShowAssetGen(true);
          if (p) setAssetPrompt(p);
      },
      runAudit: handleForensicAudit,
      closeTerminal: () => setShowTerminal(false),
      
      // Extended
      setFilter: (key, val) => setImageFilters(prev => ({ ...prev, [key]: val })),
      resetFilters: () => setImageFilters({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, invert: 0, blur: 0, hueRotate: 0, opacity: 100 }),
      setTransform: (key, val) => setViewTransforms(prev => ({ ...prev, [key]: val })),
      resetTransforms: () => setViewTransforms({ rotate: 0, scale: 1, flipH: false, flipV: false }),
      setUiFlag: (key, val) => setUiFlags(prev => ({ ...prev, [key]: val })),
      logSystemMessage: (msg) => console.log(`[SYS]: ${msg}`)
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#000000] text-green-400 font-sans selection:bg-green-900 selection:text-white ${uiFlags.crt ? 'contrast-125 brightness-110 saturate-120' : ''}`}>
      
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(to_right,#00ff0012_1px,transparent_1px),linear-gradient(to_bottom,#00ff0012_1px,transparent_1px)] bg-[size:24px_24px] z-0"></div>

      {/* Asset Generation Overlay (Global) */}
      {showAssetGen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="w-full max-w-4xl bg-black border border-green-500 shadow-2xl flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="p-4 border-b border-green-900 flex justify-between items-center bg-green-950/20">
                      <h3 className="font-bold text-green-500 font-mono tracking-widest flex items-center gap-2">
                          <span className="text-xl">❖</span> AGENT GAMMA // ASSET FABRICATOR
                      </h3>
                      <button onClick={() => setShowAssetGen(false)} className="text-green-700 hover:text-green-400 font-mono text-xs">
                          [CLOSE_PANEL]
                      </button>
                  </div>
                  
                  {/* Body */}
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                      <div className="bg-green-950/10 border border-green-900/50 p-3 mb-6 text-[11px] font-mono text-green-300">
                          <span className="font-bold text-green-500">INFO:</span> Generate high-fidelity stamps, seals, logos, or textures. 
                          Clicking "INSERT" will add the asset to your current document. 
                          If no document is loaded, a new workspace will be initialized.
                      </div>

                      {/* Input Area */}
                       <div className="flex gap-0 mb-8">
                            <input 
                              type="text" 
                              value={assetPrompt}
                              onChange={(e) => setAssetPrompt(e.target.value)}
                              placeholder="Describe asset (e.g., 'Classified Stamp', 'Gold Embossed Seal', 'Fingerprint')" 
                              className="flex-1 bg-black border border-green-800 border-r-0 px-4 py-4 text-sm font-mono text-green-100 focus:border-green-500 outline-none placeholder-green-900"
                              onKeyDown={(e) => e.key === 'Enter' && handleAssetGeneration()}
                            />
                            <button 
                              onClick={handleAssetGeneration}
                              disabled={status === AppStatus.GENERATING_ASSET}
                              className="bg-green-900 hover:bg-green-800 text-green-100 px-8 py-2 text-xs font-bold uppercase tracking-wide border border-green-700 transition-all flex items-center gap-2"
                            >
                                {status === AppStatus.GENERATING_ASSET ? <span className="animate-pulse">FABRICATING...</span> : 'GENERATE'}
                            </button>
                        </div>

                      {/* Gallery */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {generatedAssets.map((asset, idx) => (
                              <div key={idx} className="aspect-square bg-[#050505] border border-green-900 relative group flex items-center justify-center p-4">
                                  <img src={asset.imageUrl} className="max-w-full max-h-full object-contain" />
                                  <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                      <button 
                                          onClick={() => handleAddAssetLayer(asset.imageUrl)}
                                          className="border border-green-500 text-green-400 px-3 py-1 text-[10px] font-bold uppercase hover:bg-green-500 hover:text-black transition-colors"
                                      >
                                          {docState.originalImage ? 'INSERT LAYER' : 'CREATE DOC'}
                                      </button>
                                      <a 
                                          href={asset.imageUrl} 
                                          download={`asset_${idx}.png`}
                                          className="text-[10px] text-gray-500 hover:text-gray-300 underline font-mono"
                                      >
                                          DOWNLOAD PNG
                                      </a>
                                  </div>
                              </div>
                          ))}
                          {generatedAssets.length === 0 && (
                              <div className="col-span-full text-center py-12 text-green-900 font-mono text-xs border border-dashed border-green-900/30">
                                  NO ASSETS FABRICATED. ENTER PROMPT TO BEGIN.
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className={`border-b border-green-900 bg-black/90 backdrop-blur-md sticky top-0 z-50 ${!uiFlags.hud ? 'opacity-20 hover:opacity-100 transition-opacity' : ''}`}>
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black border border-green-600 flex items-center justify-center rounded-sm">
              <span className="text-green-500 font-bold font-mono">F</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-green-100 leading-none font-['VT323']">
                FORGERY<span className="text-green-600">FORGE</span>
              </span>
              <span className="text-[10px] font-mono text-green-700 tracking-[0.2em] uppercase">
                // ARCHITECT: FraudR0b
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border border-green-900/50 bg-green-950/20 px-3 py-1 rounded">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-mono font-bold text-green-500 tracking-wider">
                      SYSTEM: ONLINE
                  </span>
              </div>
              
              {/* Help Button */}
              <button
                onClick={() => setShowHelp(true)}
                className="border border-green-900 bg-green-950/10 text-green-600 hover:text-green-300 hover:border-green-500 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
              >
                  [ HELP / MAN ]
              </button>

              {/* Root Command Button */}
              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className={`border text-[10px] font-bold font-mono uppercase tracking-widest px-3 py-1 transition-all ${
                    showTerminal 
                    ? 'bg-red-600 text-black border-red-500 hover:bg-red-500' 
                    : 'bg-red-950/30 border-red-900 hover:bg-red-900/40 hover:border-red-600 text-red-500'
                }`}
              >
                  {showTerminal ? '[ CLOSE ROOT CMD ]' : '[ ACCESS ROOT CMD ]'}
              </button>

             <button 
                onClick={() => setShowAssetGen(!showAssetGen)}
                className={`text-[12px] font-bold font-mono uppercase tracking-wider px-4 py-2 border transition-all ${showAssetGen ? 'border-green-600 text-green-500 bg-green-950/30' : 'border-green-900 text-green-700 hover:border-green-600 hover:text-green-400'}`}
             >
                [ ASSET FABRICATOR ]
             </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-6 py-8 relative z-10">
        
        {/* Help Modal */}
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

        {/* Root Terminal Overlay */}
        <RootTerminal isOpen={showTerminal} onClose={() => setShowTerminal(false)} actions={terminalActions} />

        {/* State: IDLE / Uploading / Searching */}
        {(status === AppStatus.IDLE || status === AppStatus.UPLOADING || status === AppStatus.SEARCHING_TEMPLATE) && (
           <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
             <div className="text-center max-w-3xl mb-12">
               <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tighter text-green-100 font-['VT323']">
                 FORGERY<span className="text-green-600">FORGE</span>
               </h1>
               <div className="max-w-xl mx-auto space-y-4 mb-8">
                   <p className="text-lg text-green-300 font-mono leading-relaxed border-l-2 border-green-600 pl-4">
                     The ultimate generative forgery suite. From blank canvas to verified credential.
                   </p>
                   <p className="text-sm text-green-700 font-mono uppercase tracking-widest">
                     > AI-DRIVEN STYLE MATCHING<br/>
                     > FORENSIC-GRADE AUDITING<br/>
                     > SEAMLESS LAYER BLENDING<br/>
                     > REAL-TIME INTEL GROUNDING
                   </p>
               </div>
               
               <button 
                onClick={() => setShowHelp(true)}
                className="mb-8 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black px-6 py-2 font-mono font-bold text-xs uppercase tracking-[0.2em] transition-all"
               >
                   [ INITIATE TRAINING / READ MANUAL ]
               </button>
             </div>
             
             {/* Main Upload / Search Container */}
             <div className="w-full max-w-3xl">
                {/* Only show Upload Zone when NOT searching */}
                {status !== AppStatus.SEARCHING_TEMPLATE && (
                    <>
                        <UploadZone onFileSelect={handleFileSelect} />
                        
                        {/* Doc Type Selector */}
                        <div className="flex gap-4 mt-6">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 border ${docType === DocumentType.GENERAL ? 'bg-green-600 border-green-500' : 'border-green-900'}`}></div>
                                <span className={`text-xs font-mono uppercase ${docType === DocumentType.GENERAL ? 'text-green-400' : 'text-green-800 group-hover:text-green-600'}`}>STANDARD</span>
                                <input type="radio" className="hidden" checked={docType === DocumentType.GENERAL} onChange={() => setDocType(DocumentType.GENERAL)} />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 border ${docType === DocumentType.ID_CARD ? 'bg-green-600 border-green-500' : 'border-green-900'}`}></div>
                                <span className={`text-xs font-mono uppercase ${docType === DocumentType.ID_CARD ? 'text-green-400' : 'text-green-800 group-hover:text-green-600'}`}>ID CARD / CREDENTIAL</span>
                                <input type="radio" className="hidden" checked={docType === DocumentType.ID_CARD} onChange={() => setDocType(DocumentType.ID_CARD)} />
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className={`w-4 h-4 border ${docType === DocumentType.FINANCIAL ? 'bg-green-600 border-green-500' : 'border-green-900'}`}></div>
                                <span className={`text-xs font-mono uppercase ${docType === DocumentType.FINANCIAL ? 'text-green-400' : 'text-green-800 group-hover:text-green-600'}`}>FINANCIAL</span>
                                <input type="radio" className="hidden" checked={docType === DocumentType.FINANCIAL} onChange={() => setDocType(DocumentType.FINANCIAL)} />
                            </label>
                        </div>
                    </>
                )}

                {/* Persistent TemplateSearch Component - Props update to trigger Loading View */}
                <div className={status === AppStatus.SEARCHING_TEMPLATE ? "block" : "mt-8"}>
                     <TemplateSearch 
                        onSearchAndFabricate={handleSearchAndFabricate} 
                        isLoading={status === AppStatus.SEARCHING_TEMPLATE || status === AppStatus.UPLOADING} 
                     />
                </div>
             </div>
           </div>
        )}

        {/* State: Editor */}
        {(status === AppStatus.READY_TO_EDIT || status === AppStatus.PROCESSING || status === AppStatus.ANALYZING || status === AppStatus.SANITIZING || status === AppStatus.GENERATING_ASSET || status === AppStatus.COMPLETED || status === AppStatus.ERROR) && (
          <div className="flex-1 flex flex-col lg:flex-row gap-8 h-full">
            
            {/* Left: Controls */}
            <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6 order-2 lg:order-1">
              
              {/* Operation Console */}
              <div className="bg-black border border-green-900 shadow-2xl relative overflow-hidden">
                 
                 {/* Top Bar */}
                 <div className="bg-green-950/20 p-4 border-b border-green-900 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${useIntel ? 'bg-green-500' : 'bg-green-900'}`}></div>
                         <h3 className="font-mono text-xs font-bold text-green-700 tracking-widest uppercase">Console</h3>
                    </div>
                    
                    {/* History Controls */}
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1 mr-2 border-r border-green-900 pr-2">
                            <button 
                                onClick={handleUndo} 
                                disabled={historyIndex <= 0 || status === AppStatus.PROCESSING}
                                className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 transition-colors ${historyIndex > 0 ? 'text-green-500 hover:bg-green-900/30 cursor-pointer' : 'text-green-900 cursor-not-allowed'}`}
                                title="Revert last change"
                            >
                                [ &lt; UNDO ]
                            </button>
                            <button 
                                onClick={handleRedo} 
                                disabled={historyIndex >= history.length - 1 || status === AppStatus.PROCESSING}
                                className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 transition-colors ${historyIndex < history.length - 1 ? 'text-green-500 hover:bg-green-900/30 cursor-pointer' : 'text-green-900 cursor-not-allowed'}`}
                                title="Redo last reverted change"
                            >
                                [ REDO &gt; ]
                            </button>
                        </div>
                        <button onClick={handleReset} className="text-[10px] text-red-500 hover:text-red-400 font-mono uppercase tracking-wider hover:underline">Reset</button>
                    </div>
                 </div>

                 <div className="p-5">
                    
                    {/* Layer Property Editor (Shows if layer selected) */}
                    {selectedLayerId && (
                        <div className="mb-6 bg-black border border-green-600 shadow-[0_0_20px_rgba(34,197,94,0.1)] animate-in fade-in slide-in-from-left-2 overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="flex justify-between items-center p-3 bg-green-950/30 border-b border-green-800">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${status === AppStatus.ANALYZING ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></div>
                                    <h3 className="text-xs font-bold text-green-100 uppercase tracking-widest">
                                        {activeLayer?.label || 'LAYER_PROPERTIES'}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => deleteLayer(selectedLayerId)} 
                                    className="text-[10px] text-red-500 hover:bg-red-900/20 px-2 py-1 border border-transparent hover:border-red-900 transition-all uppercase"
                                >
                                    [ DELETE ]
                                </button>
                            </div>
                            
                            <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar max-h-[500px]">
                                
                                {/* CONTENT SECTION */}
                                <div className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-[9px] text-green-500 uppercase font-bold tracking-wider flex items-center gap-2">
                                            <span>DATA_SOURCE</span>
                                            <div className="h-px w-12 bg-green-900"></div>
                                        </label>
                                        <button 
                                            onClick={handleAutoMatchLayer}
                                            disabled={status === AppStatus.ANALYZING}
                                            className="text-[9px] bg-green-900/20 hover:bg-green-500 hover:text-black border border-green-700 text-green-400 px-2 py-1 transition-all uppercase font-bold flex items-center gap-1"
                                            title="Agent Zeta: Analyze document and match style"
                                        >
                                            {status === AppStatus.ANALYZING ? 'SCANNING...' : '⚡ AUTO-MATCH'}
                                        </button>
                                    </div>
                                    
                                    {activeLayer?.type === 'text' ? (
                                        <div className="relative">
                                            <textarea 
                                                value={activeLayer?.content || ''} 
                                                onChange={(e) => updateLayer(selectedLayerId, { content: e.target.value })}
                                                className="w-full bg-[#050505] border border-green-800 p-3 text-sm text-green-100 font-mono focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500/50 transition-all min-h-[100px] resize-y leading-relaxed"
                                                placeholder="Enter text content..."
                                            />
                                            <div className="absolute bottom-2 right-2 text-[9px] text-green-800 pointer-events-none">
                                                {activeLayer.content.length} chars
                                            </div>
                                        </div>
                                    ) : (
                                       <div className="space-y-2">
                                            <img src={activeLayer?.content} className="w-full h-32 object-contain bg-black/50 border border-green-900/50 p-2" />
                                            <input 
                                                type="text"
                                                value={activeLayer?.content || ''}
                                                onChange={(e) => updateLayer(selectedLayerId, { content: e.target.value })}
                                                className="w-full bg-black border border-green-900 p-2 text-[10px] text-green-600 font-mono truncate focus:border-green-500 focus:text-green-300 outline-none" 
                                                placeholder="Image Data URL..."
                                            />
                                       </div>
                                    )}
                                </div>

                                {/* TYPOGRAPHY SECTION (Text Only) */}
                                {activeLayer?.type === 'text' && (
                                    <div>
                                        <label className="text-[9px] text-green-500 uppercase font-bold tracking-wider mb-3 block flex items-center gap-2">
                                            <span>TYPOGRAPHY</span>
                                            <div className="h-px flex-1 bg-green-900"></div>
                                        </label>
                                        
                                        {/* Font Family Grid */}
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                             {['Courier New', 'Arial', 'Times New Roman', 'Verdana'].map(font => {
                                                const isSelected = activeLayer?.style.fontFamily === font;
                                                let label = font.split(' ')[0].toUpperCase();
                                                if(font === 'Courier New') label = 'MONO (CODE)';
                                                if(font === 'Times New Roman') label = 'SERIF (DOC)';
                                                if(font === 'Arial') label = 'SANS (STD)';
                                                if(font === 'Verdana') label = 'SANS (MOD)';
                                                
                                                return (
                                                    <button
                                                        key={font}
                                                        onClick={() => updateLayerStyle(selectedLayerId, { fontFamily: font })}
                                                        className={`py-2 text-[9px] font-bold uppercase transition-all border ${isSelected ? 'bg-green-600 text-black border-green-500' : 'bg-black text-green-800 border-green-900 hover:border-green-600 hover:text-green-400'}`}
                                                    >
                                                        {label}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {/* Alignment & Weight */}
                                        <div className="flex gap-2 mb-4">
                                            <div className="flex border border-green-900 bg-black rounded-sm overflow-hidden shrink-0">
                                                {['left', 'center', 'right'].map((align) => (
                                                    <button
                                                        key={align}
                                                        onClick={() => updateLayerStyle(selectedLayerId, { textAlign: align as any })}
                                                        className={`w-8 py-1.5 hover:bg-green-900/30 flex items-center justify-center ${activeLayer?.style.textAlign === align ? 'text-green-400 bg-green-900/50' : 'text-green-800'}`}
                                                    >
                                                        {align === 'left' && <span className="text-xs">⇤</span>}
                                                        {align === 'center' && <span className="text-xs">⇹</span>}
                                                        {align === 'right' && <span className="text-xs">⇥</span>}
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const current = activeLayer?.style.fontWeight;
                                                    updateLayerStyle(selectedLayerId, { fontWeight: current === 'bold' ? 'normal' : 'bold' });
                                                }}
                                                className={`flex-1 py-1.5 text-[10px] border font-bold transition-all uppercase tracking-wider ${activeLayer?.style.fontWeight === 'bold' ? 'border-green-500 bg-green-500 text-black' : 'border-green-900 text-green-700 hover:border-green-600'}`}
                                             >
                                                {activeLayer?.style.fontWeight === 'bold' ? 'BOLD' : 'REGULAR'}
                                             </button>
                                        </div>

                                        {/* Size & Spacing */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="flex justify-between text-[9px] text-green-700 uppercase mb-1">Size</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="range" min="8" max="72" step="1"
                                                        value={activeLayer?.style.fontSize || 12}
                                                        onChange={(e) => updateLayerStyle(selectedLayerId, { fontSize: parseInt(e.target.value) })}
                                                        className="flex-1 h-1 bg-green-900/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-green-500"
                                                    />
                                                    <input 
                                                        type="number"
                                                        value={activeLayer?.style.fontSize || 12}
                                                        onChange={(e) => updateLayerStyle(selectedLayerId, { fontSize: parseInt(e.target.value) })}
                                                        className="w-10 bg-black border border-green-900 p-1 text-[10px] text-green-400 font-mono text-center outline-none focus:border-green-500"
                                                    />
                                                </div>
                                            </div>
                                             <div>
                                                <label className="flex justify-between text-[9px] text-green-700 uppercase mb-1">Spacing</label>
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="range" min="-2" max="10" step="0.5"
                                                        value={activeLayer?.style.letterSpacing || 0}
                                                        onChange={(e) => updateLayerStyle(selectedLayerId, { letterSpacing: parseFloat(e.target.value) })}
                                                        className="flex-1 h-1 bg-green-900/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-green-500"
                                                    />
                                                    <span className="text-[10px] font-mono text-green-600 w-8 text-right">{activeLayer?.style.letterSpacing}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* APPEARANCE SECTION */}
                                <div>
                                    <label className="text-[9px] text-green-500 uppercase font-bold tracking-wider mb-3 block flex items-center gap-2">
                                        <span>VISUALS</span>
                                        <div className="h-px flex-1 bg-green-900"></div>
                                    </label>
                                    
                                    {/* Color */}
                                    <div className="mb-4">
                                        <label className="block text-[9px] text-green-700 uppercase mb-1 flex justify-between">
                                            <span>Pigment Hex</span>
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <div className="relative w-8 h-8 group overflow-hidden border border-green-900">
                                                 <input 
                                                    type="color" 
                                                    value={activeLayer?.style.color || '#000000'} 
                                                    onChange={(e) => updateLayerStyle(selectedLayerId, { color: e.target.value })}
                                                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                                />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={activeLayer?.style.color || '#000000'} 
                                                onChange={(e) => updateLayerStyle(selectedLayerId, { color: e.target.value })}
                                                className="flex-1 bg-black border border-green-900 p-2 text-xs text-green-300 font-mono uppercase focus:border-green-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Background Color (Masking) */}
                                    <div className="mb-4">
                                        <label className="block text-[9px] text-green-700 uppercase mb-1 flex justify-between">
                                            <span>Background Mask</span>
                                            <button 
                                                onClick={() => updateLayerStyle(selectedLayerId, { backgroundColor: '' })}
                                                className="text-[9px] text-red-500 hover:text-red-300"
                                            >
                                                [CLEAR]
                                            </button>
                                        </label>
                                        <div className="flex gap-2 items-center">
                                            <div className="relative w-8 h-8 group overflow-hidden border border-green-900">
                                                 <input 
                                                    type="color" 
                                                    value={activeLayer?.style.backgroundColor || '#ffffff'} 
                                                    onChange={(e) => updateLayerStyle(selectedLayerId, { backgroundColor: e.target.value })}
                                                    className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                                                />
                                            </div>
                                            <input 
                                                type="text" 
                                                value={activeLayer?.style.backgroundColor || 'TRANSPARENT'} 
                                                onChange={(e) => updateLayerStyle(selectedLayerId, { backgroundColor: e.target.value })}
                                                className="flex-1 bg-black border border-green-900 p-2 text-xs text-green-300 font-mono uppercase focus:border-green-500 outline-none"
                                                placeholder="TRANSPARENT"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Opacity */}
                                    <div>
                                        <label className="block text-[9px] text-green-700 uppercase mb-1 flex justify-between">
                                            <span>Transparency</span>
                                            <span className="text-green-500">{Math.round((activeLayer?.style.opacity || 1) * 100)}%</span>
                                        </label>
                                        <input 
                                            type="range" min="0" max="1" step="0.01"
                                            value={activeLayer?.style.opacity || 1} 
                                            onChange={(e) => updateLayerStyle(selectedLayerId, { opacity: parseFloat(e.target.value) })}
                                            className="w-full h-1 bg-green-900/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-500"
                                        />
                                    </div>
                                </div>

                                {/* TRANSFORM SECTION */}
                                <div>
                                     <label className="text-[9px] text-green-500 uppercase font-bold tracking-wider mb-3 block flex items-center gap-2">
                                        <span>TRANSFORM</span>
                                        <div className="h-px flex-1 bg-green-900"></div>
                                    </label>
                                     <div className="flex items-center gap-3">
                                         <div className="flex-1">
                                            <label className="block text-[9px] text-green-700 uppercase mb-1">Rotation</label>
                                            <input 
                                                type="range" min="-180" max="180" step="1"
                                                value={activeLayer?.style.rotation || 0} 
                                                onChange={(e) => updateLayerStyle(selectedLayerId, { rotation: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-green-900/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-500"
                                            />
                                         </div>
                                         <div className="w-16">
                                            <label className="block text-[9px] text-green-700 uppercase mb-1">Deg</label>
                                            <input 
                                                type="number"
                                                value={activeLayer?.style.rotation || 0}
                                                onChange={(e) => updateLayerStyle(selectedLayerId, { rotation: parseInt(e.target.value) })}
                                                className="w-full bg-black border border-green-900 p-1 text-[10px] text-green-400 font-mono text-center outline-none focus:border-green-500"
                                            />
                                         </div>
                                     </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {!selectedLayerId && (
                        <>
                            {/* Document Class Selection */}
                            <div className="mb-4">
                                <label className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-2 block">Document Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: DocumentType.GENERAL, label: 'STD' },
                                        { id: DocumentType.ID_CARD, label: 'ID CARD' },
                                        { id: DocumentType.FINANCIAL, label: 'FINANCE' },
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setDocType(type.id)}
                                            className={`py-2 text-[10px] font-mono border transition-all ${docType === type.id ? 'bg-green-600 text-black border-green-500 font-bold' : 'border-green-900 text-green-800 hover:text-green-500'}`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tools Toggle */}
                            <div className="flex gap-2 mb-6">
                                <button 
                                    onClick={() => setUseIntel(!useIntel)}
                                    className={`flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-wide border transition-all ${useIntel ? 'bg-green-950/20 border-green-700 text-green-400' : 'bg-black/20 border-green-900 text-green-800 hover:border-green-700'}`}
                                >
                                    {useIntel ? '[X] DELTA: ONLINE' : '[ ] DELTA: OFFLINE'}
                                </button>
                                <button 
                                    onClick={handleForensicAudit}
                                    disabled={status === AppStatus.ANALYZING || status === AppStatus.SANITIZING}
                                    className={`flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-wide border transition-all bg-black/20 border-green-900 text-green-800 hover:text-green-400 hover:border-green-700 hover:bg-green-950/10`}
                                >
                                    Req. Omega Audit
                                </button>
                            </div>
                        </>
                    )}
                    
                    {/* Add Layer Buttons */}
                    <div className="flex flex-col gap-2 mb-4">
                         <button onClick={handleSmartAddText} className="w-full py-3 text-[10px] font-bold border border-green-500 bg-green-900/20 hover:bg-green-500 text-green-400 hover:text-black transition-all uppercase tracking-widest shadow-[0_0_10px_rgba(34,197,94,0.15)] flex items-center justify-center gap-2">
                            <span className="text-sm">✦</span> [ SMART INSERT TEXT ]
                        </button>
                        <div className="flex gap-2">
                            <button onClick={handleAddTextLayer} className="flex-1 py-2 text-[10px] font-bold border border-green-900 hover:bg-green-900/30 text-green-500">+ ADD TEXT</button>
                            <button onClick={() => setShowAssetGen(true)} className="flex-1 py-2 text-[10px] font-bold border border-green-900 hover:bg-green-900/30 text-green-500">+ ADD ASSET</button>
                        </div>
                    </div>

                    <div className="mb-6 relative group">
                        {/* Prompt area label changes based on selection */}
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                            {selectedElement ? `EDITING: ${selectedElement.label}` : 'OPS COMMAND LINE'}
                          </label>
                          {selectedElement && (
                            <button onClick={() => setSelectedElement(undefined)} className="text-[9px] text-green-600 hover:text-green-400 uppercase tracking-widest">[RELEASE TARGET]</button>
                          )}
                        </div>

                        <div className="absolute top-6 bottom-0 left-0 right-0 bg-gradient-to-r from-green-900/20 to-green-800/20 rounded opacity-0 group-focus-within:opacity-100 transition duration-500 pointer-events-none"></div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={
                                docState.customLayers?.length 
                                ? "Describe how to blend these new layers (e.g., 'Make the added text look printed and worn')..." 
                                : selectedElement 
                                    ? "Enter new value for this field..." 
                                    : "// ENTER COMMANDS FOR OPS TEAM..."
                            }
                            className={`relative w-full h-48 bg-black border p-4 text-sm font-mono text-green-400 focus:border-green-500 focus:ring-0 outline-none resize-none placeholder-green-900 leading-relaxed transition-colors ${selectedElement ? 'border-green-500/50' : 'border-green-900'}`}
                        />
                    </div>

                    <Button 
                        onClick={handleGenerate} 
                        isLoading={status === AppStatus.PROCESSING || status === AppStatus.ANALYZING || status === AppStatus.SANITIZING}
                        disabled={(!prompt && !docState.customLayers?.length)}
                        className="w-full font-mono font-bold text-xs uppercase tracking-widest h-14"
                        variant="primary"
                    >
                        {docState.customLayers?.length ? 'Execute Composite & Blend' : (selectedElement ? 'Execute Surgical Edit' : 'Execute Operation')}
                    </Button>

                    {status === AppStatus.COMPLETED && (
                        <div className="mt-4 flex gap-2">
                             <Button variant="secondary" onClick={() => setShowExport(true)} className="w-full font-mono font-bold text-xs uppercase tracking-widest border border-green-900 bg-black hover:bg-green-950 text-green-400 rounded-none relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    [ EXFILTRATE ASSET ]
                                </span>
                            </Button>
                        </div>
                    )}
                 </div>
              </div>

              {renderAgentStatus()}

              {/* Layer / Elements List (Clickable) */}
              {docState.detectedElements && docState.detectedElements.length > 0 && (
                  <div className="bg-[#020602] border border-blue-900/50 p-4 font-mono text-xs text-blue-400/80 overflow-y-auto max-h-60 shadow-inner animate-in fade-in slide-in-from-top-4">
                      <div className="mb-2 border-b border-blue-900/30 pb-1 flex justify-between items-center">
                          <span className="font-bold text-blue-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                            DETECTED LAYERS ({docState.detectedElements.length})
                          </span>
                      </div>
                      <div className="space-y-1">
                        {docState.detectedElements.map(el => (
                          <div 
                            key={el.id}
                            onClick={() => handleElementSelect(el)}
                            className={`p-2 cursor-pointer border border-transparent hover:border-blue-500/50 hover:bg-blue-900/20 transition-all flex justify-between items-center ${selectedElement?.id === el.id ? 'bg-blue-900/30 border-blue-500 text-blue-300' : ''}`}
                          >
                             <span className="font-bold">{el.label}</span>
                             <span className="opacity-50 text-[10px] truncate max-w-[100px]">{el.value}</span>
                          </div>
                        ))}
                      </div>
                  </div>
              )}
              
              {/* Forensic Report Display */}
              {showForensics && docState.forensicReport && (
                  <div className="bg-[#020602] border border-red-900/50 p-4 font-mono text-xs text-green-600 overflow-y-auto max-h-60 shadow-inner">
                      <div className="mb-3 border-b border-red-900/20 pb-2 flex justify-between items-center">
                          <span className="font-bold text-red-700 uppercase tracking-widest">OMEGA_QA_LOG.TXT</span>
                          <button onClick={() => setShowForensics(false)} className="text-green-800 hover:text-green-500">×</button>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[11px]">{docState.forensicReport}</pre>
                  </div>
              )}

              {errorMsg && (
                <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 text-xs font-mono flex items-center gap-3">
                  <span className="animate-pulse">⚠</span> {errorMsg}
                </div>
              )}
            </div>

            {/* Right: Workspace */}
            <div className="w-full lg:w-2/3 order-1 lg:order-2 flex flex-col h-full min-h-[500px] relative bg-black border border-green-900">
              
              {/* Export Modal Overlay */}
              {showExport && (
                  <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex items-end justify-end p-0 md:p-8 animate-in fade-in duration-200">
                      <div className="w-full md:w-[400px] bg-black border border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.1)] p-6 animate-in slide-in-from-bottom duration-300">
                          <div className="flex justify-between items-start mb-6 border-b border-green-900 pb-4">
                              <div>
                                  <h3 className="text-lg font-bold text-green-500 font-['VT323'] tracking-wider">EXFILTRATION PROTOCOL</h3>
                                  <p className="text-[10px] text-green-800 font-mono uppercase">Secure Transport Layer</p>
                              </div>
                              <button onClick={() => setShowExport(false)} className="text-green-800 hover:text-green-500 font-mono">[CLOSE]</button>
                          </div>

                          <div className="space-y-6">
                              {/* Format Selection */}
                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Output Format</label>
                                  <div className="flex gap-2">
                                      {[ExportFormat.PNG, ExportFormat.PDF].map((fmt) => (
                                          <button
                                              key={fmt}
                                              onClick={() => setExportFormat(fmt)}
                                              className={`flex-1 py-2 text-xs font-mono border transition-all ${exportFormat === fmt ? 'bg-green-600 text-black border-green-500 font-bold' : 'border-green-900 text-green-800 hover:text-green-500'}`}
                                          >
                                              {fmt}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              {/* Size Selection */}
                              <div className="space-y-2">
                                   <div className="flex justify-between items-center">
                                      <label className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Dimensions</label>
                                      <button onClick={handleAutoDetectSize} className="text-[10px] text-green-600 hover:text-green-400 font-mono underline cursor-pointer">Auto-Match</button>
                                   </div>
                                  <select 
                                      value={paperSize}
                                      onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                                      className="w-full bg-black border border-green-900 text-green-400 text-xs font-mono p-2 focus:border-green-500 outline-none appearance-none cursor-pointer"
                                  >
                                      <option value={PaperSize.ORIGINAL}>ORIGINAL SOURCE</option>
                                      <option value={PaperSize.A4}>ISO A4 (210 x 297mm)</option>
                                      <option value={PaperSize.LETTER}>ANSI LETTER (8.5 x 11")</option>
                                      <option value={PaperSize.LEGAL}>LEGAL (8.5 x 14")</option>
                                  </select>
                              </div>

                              {/* Actions */}
                              <div className="pt-4 flex flex-col gap-3">
                                  <Button onClick={handleExport} className="w-full" variant="primary">
                                      [ DOWNLOAD ASSET ]
                                  </Button>
                                  <button onClick={handlePrint} className="w-full py-3 border border-green-900 text-green-700 hover:text-green-400 hover:border-green-600 text-xs font-mono font-bold uppercase tracking-widest transition-colors">
                                      PRINT HARDCOPY
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <div className="flex-1 p-8 flex items-center justify-center bg-[radial-gradient(#052e05_1px,transparent_1px)] [background-size:16px_16px]">
                  <ComparisonView 
                    original={docState.originalImage} 
                    edited={docState.editedImage} 
                    detectedElements={docState.detectedElements}
                    onSelectElement={handleElementSelect}
                    selectedElementId={selectedElement?.id}
                    filters={imageFilters}
                    transforms={viewTransforms}
                    uiFlags={uiFlags}
                    // Layer props
                    customLayers={docState.customLayers}
                    onUpdateLayer={updateLayer}
                    onSelectLayer={handleLayerSelect}
                    selectedLayerId={selectedLayerId}
                  />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;