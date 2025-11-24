import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { Button } from './components/Button';
import { ComparisonView } from './components/ComparisonView';
import { TemplateSearch } from './components/TemplateSearch';
import { AppStatus, DocumentState, AgentStep, GeneratedAsset, PaperSize, ExportFormat, DocumentType, DetectedElement, RootTerminalActions, ImageFilters, ViewTransforms, UiFlags, AgentStatus, CustomLayer, LayerStyle, AppSettings, ThemeColor, AppLanguage, FieldCategory, AAMVAFields } from './types';
import { editDocumentImage, getSearchContext, analyzeDocument, generateSupportAsset, extractDocumentData, findAndFabricateTemplate, predictTextStyle, detectIdFields, generateCleanPlate, synthesizeHeadshot } from './services/geminiService';
import { generatePdf417, mapDetectedToAamva } from './services/aamvaService';
import { jsPDF } from 'jspdf';
import { RootTerminal } from './components/RootTerminal';
import { HelpModal } from './components/HelpModal';
import { SettingsModal } from './components/SettingsModal';
import { SmartEditModal } from './components/SmartEditModal';
import { BarcodeModal } from './components/BarcodeModal';

const DEFAULT_SETTINGS: AppSettings = {
    autoSaveLocal: true,
    historyLimit: 10,
    enableShortcuts: true,
    enableTerminalAutocomplete: true,
    showFraudKitAd: true,
    defaultExportFormat: ExportFormat.PNG,
    defaultDpiQuality: '600',
    themeColor: ThemeColor.GREEN,
    audioVolume: 50,
    reduceMotion: false,
    highContrast: false,
    gridOpacity: 20,
    crtFlickerIntensity: 'LOW',
    autoRunAudit: false,
    privacyBlurIdle: false,
    debugLogs: false,
    language: AppLanguage.EN
};

// --- Custom Logo Component ---
const FlailKitLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Card Body */}
    <rect x="3" y="3" width="94" height="58" rx="6" stroke="currentColor" strokeWidth="4" />
    {/* Photo Box */}
    <rect x="12" y="12" width="26" height="30" rx="3" stroke="currentColor" strokeWidth="3" />
    {/* Face */}
    <path d="M17 18 L23 24 M23 18 L17 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M27 18 L33 24 M33 18 L27 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M17 32 Q 25 37 33 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Lines */}
    <line x1="46" y1="16" x2="88" y2="16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    <line x1="46" y1="24" x2="80" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="46" y1="32" x2="65" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="46" y1="40" x2="86" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    {/* Barcode */}
    <path d="M12 52 L88 52" stroke="currentColor" strokeWidth="6" strokeDasharray="3 2 4 2 2 2 5 2 3 2 4 2" />
    <text x="88" y="58" fontSize="6" fill="currentColor" textAnchor="end" fontFamily="monospace" fontWeight="bold">F.R.F.K</text>
  </svg>
);

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [agentStep, setAgentStep] = useState<AgentStep>(AgentStep.IDLE);
  
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState<boolean>(false);

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

  // Safety / Audit State
  const [lastAuditIndex, setLastAuditIndex] = useState<number>(-1);
  const [showAuditWarning, setShowAuditWarning] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

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

  // Smart Insert Modal State
  const [showSmartInsert, setShowSmartInsert] = useState<boolean>(false);
  const [smartInsertValue, setSmartInsertValue] = useState<string>('');

  // Barcode Modal State
  const [showBarcodeModal, setShowBarcodeModal] = useState<boolean>(false);
  const [barcodeData, setBarcodeData] = useState<Partial<AAMVAFields>>({});

  // Visual & System State
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
  
  // Refs
  const layerUploadRef = useRef<HTMLInputElement>(null);
  const headshotUploadRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const comparisonViewRef = useRef<HTMLDivElement>(null);

  // Derived State
  const activeLayer = docState.customLayers?.find(l => l.id === selectedLayerId);
  const themeAccentClass = settings.themeColor === ThemeColor.AMBER ? 'text-amber-500 border-amber-500' : 
                           settings.themeColor === ThemeColor.CYAN ? 'text-cyan-500 border-cyan-500' :
                           settings.themeColor === ThemeColor.RED ? 'text-red-500 border-red-500' : 
                           'text-green-500 border-green-500';

  // --- Settings Persistence & AutoSave ---

  useEffect(() => {
      // Load Settings
      try {
          const saved = localStorage.getItem('ff_settings');
          if (saved) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
      } catch (e) { console.warn("Failed to load settings"); }
  }, []);

  useEffect(() => {
      // Save Settings Change
      localStorage.setItem('ff_settings', JSON.stringify(settings));
      
      // Update Export Defaults
      setExportFormat(settings.defaultExportFormat);

      // Apply Theme CSS Vars (Dynamic)
      const root = document.documentElement;
      const colors = {
          [ThemeColor.GREEN]: '#22c55e',
          [ThemeColor.AMBER]: '#f59e0b',
          [ThemeColor.CYAN]: '#06b6d4',
          [ThemeColor.RED]: '#ef4444'
      };
      root.style.setProperty('--theme-accent', colors[settings.themeColor]);

  }, [settings]);

  useEffect(() => {
      // Auto-Save Logic (2.5 mins = 150000ms)
      if (settings.autoSaveLocal && docState.originalImage) {
          autoSaveTimer.current = setInterval(() => {
              try {
                  localStorage.setItem('ff_autosave_state', JSON.stringify(docState));
                  console.log("[SYSTEM] Auto-Save Snapshot Created.");
              } catch (e) {
                  console.warn("Auto-Save failed (Quota?)", e);
              }
          }, 150000);
      }
      return () => {
          if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
      };
  }, [settings.autoSaveLocal, docState]);

  // --- Adaptive Learning (Local) ---
  const updateFieldPreference = (label: string) => {
      try {
          const raw = localStorage.getItem('ff_field_stats') || '{}';
          const stats = JSON.parse(raw);
          stats[label] = (stats[label] || 0) + 1;
          localStorage.setItem('ff_field_stats', JSON.stringify(stats));
      } catch (e) { console.warn("Stats update failed"); }
  };

  const getLearnedElements = (elements: DetectedElement[]) => {
      try {
          const raw = localStorage.getItem('ff_field_stats') || '{}';
          const stats = JSON.parse(raw);
          
          return elements.map(el => {
              // If a STATIC element has been edited 3+ times, upgrade it to VARIABLE
              if (el.category === FieldCategory.STATIC && (stats[el.label] || 0) > 3) {
                  return { ...el, category: FieldCategory.VARIABLE };
              }
              return el;
          });
      } catch (e) { return elements; }
  };


  // --- History Management ---

  const addToHistory = (newState: DocumentState) => {
    // Slice history to current point
    const prevHistory = history.slice(0, historyIndex + 1);
    const newHistory = [...prevHistory, newState];
    
    // Limit based on settings
    const limit = settings.historyLimit;
    if (newHistory.length > limit) {
        // Remove oldest elements to fit limit
        newHistory.splice(0, newHistory.length - limit);
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setDocState(history[newIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setDocState(history[newIndex]);
    }
  }, [historyIndex, history]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    if (!settings.enableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        // Check for Ctrl+Z (Undo) or Ctrl+Shift+Z (Redo)
        if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
            e.preventDefault();
            if (e.shiftKey) {
                handleRedo();
            } else {
                handleUndo();
            }
        }
        // Check for Ctrl+Y (Redo)
        if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
            e.preventDefault();
            handleRedo();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.enableShortcuts, handleUndo, handleRedo]);

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
          const stylePromise = predictTextStyle(originalBase64, "SAMPLE");
          const fieldsPromise = detectIdFields(originalBase64);
          const cleanPlatePromise = generateCleanPlate(originalBase64);
          
          const [baseStyle, fieldsRaw, cleanPlateUrl] = await Promise.all([stylePromise, fieldsPromise, cleanPlatePromise]);
          
          // Apply learning logic
          const fields = getLearnedElements(fieldsRaw);

          const newLayers: CustomLayer[] = fields.map(field => {
              const y = ((field.box_2d[0] + field.box_2d[2]) / 2) / 10;
              const x = ((field.box_2d[1] + field.box_2d[3]) / 2) / 10;
              
              if (field.category === FieldCategory.PHOTO) {
                  return {
                      id: crypto.randomUUID(),
                      type: 'image',
                      content: 'https://placehold.co/400x400/000000/22c55e?text=CLICK+TO+ADD+PHOTO', 
                      x: x, y: y,
                      width: (field.box_2d[3] - field.box_2d[1]) / 10,
                      height: (field.box_2d[2] - field.box_2d[0]) / 10,
                      style: { ...baseStyle, opacity: 0.8, blur: 0, noise: 0 },
                      label: field.label,
                      category: FieldCategory.PHOTO
                  };
              }
              
              if (field.category === FieldCategory.BARCODE) {
                   // Ignore barcode layers initially, let user trigger generator
                   return null; 
              }
              
              // Only create text layers for Variable data initially to reduce clutter
              // Static data exists in extractedElements but doesn't get a layer until clicked
              if (field.category === FieldCategory.VARIABLE) {
                   return {
                      id: crypto.randomUUID(),
                      type: 'text',
                      content: `[${field.label.toUpperCase()}]`,
                      x: x, y: y,
                      width: 20, height: 5,
                      style: {
                          ...baseStyle,
                          color: baseStyle.color || '#000000',
                          textAlign: 'left'
                      },
                      label: field.label,
                      category: FieldCategory.VARIABLE
                  };
              }
              return null;
          }).filter(l => l !== null) as CustomLayer[];

          return {
              ...currentState,
              originalImage: cleanPlateUrl, // The Clean Plate becomes the new base!
              customLayers: newLayers,
              detectedElements: fields // Keep all elements for reference
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
      setSelectedElement(undefined);
      setSelectedLayerId(null);
      setHistory([]);
      setHistoryIndex(-1);
      setLastAuditIndex(-1); 
      
      setImageFilters({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, invert: 0, blur: 0, hueRotate: 0, opacity: 100 });
      setViewTransforms({ rotate: 0, scale: 1, flipH: false, flipV: false });

      if (docType === DocumentType.ID_CARD) {
          initialState = await handleIdSanitization(base64, initialState);
          setDocState(initialState);
          addToHistory(initialState);
          setStatus(AppStatus.READY_TO_EDIT);
          return;
      }

      setDocState(initialState);
      setAgentStep(AgentStep.EXTRACTING);
      
      try {
          const elementsRaw = await extractDocumentData(base64, docType);
          const elements = getLearnedElements(elementsRaw); // Apply learning
          
          const dump = elements.map(e => `${e.label}: ${e.value}`).join('\n');
          
          const completeState = { 
              ...initialState, 
              extractedData: dump,
              detectedElements: elements
          };
          
          setDocState(completeState);
          addToHistory(completeState);
          setStatus(AppStatus.READY_TO_EDIT);
      } catch (e) {
         console.error("Extraction failed", e);
         addToHistory(initialState);
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
            textAlign: 'left',
            blur: 0,
            noise: 0
        },
        category: FieldCategory.VARIABLE
    };
    const newState = { ...docState, customLayers: [...(docState.customLayers || []), newLayer] };
    setDocState(newState);
    setSelectedLayerId(newLayer.id);
  };

  const handleSmartInsertExecute = async () => {
      const text = smartInsertValue;
      if (!text || !docState.originalImage) return;

      setShowSmartInsert(false);
      setSmartInsertValue('');
      setStatus(AppStatus.ANALYZING);
      setAgentStep(AgentStep.ANALYZING); 
      setErrorMsg(null);

      try {
          const predictedStyle = await predictTextStyle(docState.originalImage, text);
          
          const newLayer: CustomLayer = {
            id: crypto.randomUUID(),
            type: 'text',
            content: text,
            x: 50, y: 50, width: 20, height: 10,
            style: predictedStyle,
            category: FieldCategory.VARIABLE
          };

          const newState = { ...docState, customLayers: [...(docState.customLayers || []), newLayer] };
          setDocState(newState);
          setSelectedLayerId(newLayer.id);
          setStatus(AppStatus.READY_TO_EDIT);
      } catch (e) {
          console.error(e);
          setErrorMsg("Smart Auto-Match Failed. Using Defaults.");
          setStatus(AppStatus.READY_TO_EDIT);
          
          const fallbackLayer: CustomLayer = {
                id: crypto.randomUUID(),
                type: 'text',
                content: text,
                x: 50, y: 50, width: 20, height: 10,
                style: {
                    fontFamily: 'Courier New',
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#000000',
                    letterSpacing: 0,
                    opacity: 1,
                    rotation: 0,
                    textAlign: 'left',
                    blur: 0,
                    noise: 0
                },
                category: FieldCategory.VARIABLE
          };
          setDocState(prev => ({...prev, customLayers: [...(prev.customLayers||[]), fallbackLayer]}));
          setSelectedLayerId(fallbackLayer.id);
      } finally {
        setAgentStep(AgentStep.IDLE);
      }
  };

  const handleAutoMatchLayer = async () => {
      if (!selectedLayerId || !activeLayer || !docState.originalImage) return;
      
      setStatus(AppStatus.ANALYZING);
      try {
          const textContext = activeLayer.type === 'text' ? activeLayer.content : "SAMPLE";
          const style = await predictTextStyle(docState.originalImage, textContext);
          
          updateLayerStyle(selectedLayerId, style);
      } catch (e) {
          setErrorMsg("Agent Zeta: Auto-Match Failed.");
      } finally {
          setStatus(AppStatus.READY_TO_EDIT);
      }
  };

  const handleLayerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const newLayer: CustomLayer = {
                    id: crypto.randomUUID(),
                    type: 'image',
                    content: event.target.result as string,
                    x: 50, y: 50, width: 30, height: 30,
                    style: {
                        fontFamily: '',
                        fontSize: 0,
                        fontWeight: '',
                        color: '',
                        letterSpacing: 0,
                        opacity: 1,
                        rotation: 0,
                        textAlign: 'left',
                        blur: 0,
                        noise: 0
                    }
                };
                setDocState(prev => ({
                     ...prev,
                     customLayers: [...(prev.customLayers || []), newLayer]
                }));
                setSelectedLayerId(newLayer.id);
            }
        };
        reader.readAsDataURL(file);
    }
  };
  
  const handleHeadshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) return;
      if (!selectedElement || !docState.originalImage) return;
      
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (event) => {
          if (event.target?.result) {
              const newPhotoBase64 = event.target.result as string;
              setStatus(AppStatus.PROCESSING_HEADSHOT);
              setAgentStep(AgentStep.SYNTHESIZING);
              
              try {
                  const isGhost = selectedElement.label.toLowerCase().includes('ghost');
                  
                  // Run Agent Gamma Headshot Synthesis
                  const processedPhoto = await synthesizeHeadshot(
                      docState.originalImage!, 
                      newPhotoBase64, 
                      isGhost
                  );
                  
                  // Convert element to layer with processed content
                  const y = ((selectedElement.box_2d[0] + selectedElement.box_2d[2]) / 2) / 10;
                  const x = ((selectedElement.box_2d[1] + selectedElement.box_2d[3]) / 2) / 10;
                  const h = (selectedElement.box_2d[2] - selectedElement.box_2d[0]) / 10;
                  const w = (selectedElement.box_2d[3] - selectedElement.box_2d[1]) / 10;

                  const newLayer: CustomLayer = {
                        id: crypto.randomUUID(),
                        type: 'image',
                        content: processedPhoto,
                        x, y, width: w, height: h,
                        style: {
                            fontFamily: '',
                            fontSize: 0,
                            fontWeight: '',
                            color: '',
                            letterSpacing: 0,
                            opacity: isGhost ? 0.4 : 1, // Ghost default opacity
                            rotation: 0,
                            textAlign: 'left',
                            blur: 0,
                            noise: 0,
                            backgroundColor: 'transparent'
                        },
                        label: selectedElement.label,
                        category: FieldCategory.PHOTO
                   };
                   
                   setDocState(prev => ({
                       ...prev,
                       customLayers: [...(prev.customLayers || []), newLayer]
                   }));
                   setSelectedLayerId(newLayer.id);
                   setSelectedElement(undefined);

              } catch (e) {
                  setErrorMsg("Headshot Synthesis Failed. Please try a different photo.");
              } finally {
                  setStatus(AppStatus.READY_TO_EDIT);
                  setAgentStep(AgentStep.IDLE);
              }
          }
      };
      reader.readAsDataURL(file);
  };

  const handleAddAssetLayer = (assetUrl: string, category: FieldCategory = FieldCategory.STATIC) => {
    if (!docState.originalImage) {
        initializeDocumentWorkspace(assetUrl, "fabricated_asset.png");
        setShowAssetGen(false);
        return;
    }

    const newLayer: CustomLayer = {
        id: crypto.randomUUID(),
        type: 'image',
        content: assetUrl,
        x: 50, y: 50, width: 30, height: 10,
        style: {
            fontFamily: '',
            fontSize: 0,
            fontWeight: '',
            color: '',
            letterSpacing: 0,
            opacity: 1,
            rotation: 0,
            textAlign: 'left',
            blur: 0,
            noise: 0
        },
        category: category
    };
    const newState = { ...docState, customLayers: [...(docState.customLayers || []), newLayer] };
    setDocState(newState);
    setSelectedLayerId(newLayer.id);
    setShowAssetGen(false);
    return newLayer.id;
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
          img.crossOrigin = "anonymous";
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;

              ctx.drawImage(img, 0, 0);

              docState.customLayers?.forEach(layer => {
                 ctx.save();
                 const x = (layer.x / 100) * canvas.width;
                 const y = (layer.y / 100) * canvas.height;
                 
                 ctx.translate(x, y);
                 ctx.rotate((layer.style.rotation * Math.PI) / 180);

                 // Apply Blur
                 if (layer.style.blur > 0) {
                     ctx.filter = `blur(${layer.style.blur}px)`;
                 }
                 
                 ctx.globalAlpha = layer.style.opacity;

                 // Draw Layer
                 if (layer.type === 'image') {
                     const w = (layer.width / 100) * canvas.width;
                     const h = (layer.height / 100) * canvas.height;
                     const imgObj = new Image();
                     imgObj.src = layer.content;
                     imgObj.crossOrigin = "anonymous";
                     ctx.drawImage(imgObj, -w/2, -h/2, w, h); 
                 } else {
                     // Background Mask (Crucial for In-painting effect)
                     const fontSize = layer.style.fontSize;
                     ctx.font = `${layer.style.fontWeight} ${fontSize}px ${layer.style.fontFamily}`;
                     const metrics = ctx.measureText(layer.content);
                     const w = metrics.width;
                     const h = fontSize; // Approximate height

                     if (layer.style.backgroundColor && layer.style.backgroundColor !== 'transparent') {
                        ctx.fillStyle = layer.style.backgroundColor;
                        // Draw slightly larger background to cover old text artifacts
                        ctx.fillRect(-w/2 - 5, -h/2 - 5, w + 10, h + 10);
                     }
                     
                     ctx.fillStyle = layer.style.color;
                     ctx.textAlign = layer.style.textAlign;
                     ctx.textBaseline = 'middle';
                     ctx.fillText(layer.content, 0, 0);
                 }

                 // Apply Noise (Simulated Grain)
                 if (layer.style.noise > 0) {
                     const w = (layer.width / 100) * canvas.width || 200;
                     const h = (layer.height / 100) * canvas.height || 50;
                     
                     // Create a noise overlay for this layer's area
                     // Note: Direct pixel manipulation on the main canvas is expensive, 
                     // so we do a simple noise pass on top.
                     ctx.globalCompositeOperation = 'overlay';
                     ctx.globalAlpha = layer.style.noise / 200; // Scale down for realism
                     
                     for(let i=0; i<50; i++) { // Simple randomized specks
                         const nx = (Math.random() - 0.5) * w;
                         const ny = (Math.random() - 0.5) * h;
                         ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff';
                         ctx.fillRect(nx, ny, 2, 2);
                     }
                 }

                 ctx.restore();
              });

              resolve(canvas.toDataURL('image/png'));
          };
      });
  };

  // --- Barcode Logic ---
  const handleBarcodeTrigger = (el?: DetectedElement) => {
      // If triggered from element, we pre-fill partial data
      const extracted = docState.detectedElements || [];
      const mappedData = mapDetectedToAamva(extracted);
      setBarcodeData(mappedData);
      
      // If we clicked an existing barcode element, select it as "target" to replace
      if (el) setSelectedElement(el); 

      setShowBarcodeModal(true);
  };

  const handleBarcodeGenerate = async (data: Partial<AAMVAFields>) => {
      setStatus(AppStatus.GENERATING_BARCODE);
      setAgentStep(AgentStep.ENCODING);
      
      try {
          const barcodeImage = await generatePdf417(data);
          
          // Place the barcode
          // If replacing existing, match box. Else, place generic.
          if (selectedElement && selectedElement.category === FieldCategory.BARCODE) {
              const y = ((selectedElement.box_2d[0] + selectedElement.box_2d[2]) / 2) / 10;
              const x = ((selectedElement.box_2d[1] + selectedElement.box_2d[3]) / 2) / 10;
              const h = (selectedElement.box_2d[2] - selectedElement.box_2d[0]) / 10;
              const w = (selectedElement.box_2d[3] - selectedElement.box_2d[1]) / 10;
              
              const newLayer: CustomLayer = {
                id: crypto.randomUUID(),
                type: 'image',
                content: barcodeImage,
                x, y, width: w, height: h,
                style: {
                    fontFamily: '', fontSize: 0, fontWeight: '', color: '', 
                    letterSpacing: 0, opacity: 1, rotation: 0, textAlign: 'left',
                    blur: 0, noise: 0, backgroundColor: 'transparent'
                },
                category: FieldCategory.BARCODE,
                label: "PDF417_AAMVA"
              };
              
              setDocState(prev => ({...prev, customLayers: [...(prev.customLayers||[]), newLayer]}));
              setSelectedLayerId(newLayer.id);

          } else {
             // Generic placement (Back of card typically)
             const id = handleAddAssetLayer(barcodeImage, FieldCategory.BARCODE);
             // Default aspect ratio for PDF417 is approx 4:1 width:height
             if (id) updateLayer(id, { width: 50, height: 15 });
          }

          setShowBarcodeModal(false);
          setSelectedElement(undefined);
          
          // Auto Trigger Audit
          setTimeout(() => {
              handleForensicAudit();
          }, 1000);

      } catch (e) {
          setErrorMsg("Barcode Generation Failed.");
          console.error(e);
      } finally {
          setStatus(AppStatus.READY_TO_EDIT);
          setAgentStep(AgentStep.IDLE);
      }
  };

  const handleSearchAndFabricate = async (query: string, logUpdate: (msg: string) => void, statusUpdate: (status: Partial<AgentStatus>) => void) => {
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
          const base64 = await findAndFabricateTemplate(query, logUpdate, statusUpdate);
          logUpdate("Initiating Workspace...");
          
          await new Promise(r => setTimeout(r, 1000));
          
          await initializeDocumentWorkspace(base64, `FABRICATED_DOC_${Date.now()}.png`);
          
      } catch (e) {
          console.error(e);
          setErrorMsg("Fabrication process failed.");
          setStatus(AppStatus.IDLE);
      }
  };

  const triggerSafeAction = (action: () => void) => {
      const changesSinceAudit = historyIndex - lastAuditIndex;
      const isMajorChange = changesSinceAudit >= 3;
      const neverAudited = lastAuditIndex === -1 && !!docState.editedImage;
      const hasContent = !!docState.originalImage;
      
      if (hasContent && (isMajorChange || neverAudited)) {
          setPendingAction(() => action); 
          setShowAuditWarning(true);
      } else {
          action(); 
      }
  };

  const handleReset = () => {
    setDocState({ originalImage: null, editedImage: null, fileName: '', forensicReport: undefined, searchContext: undefined, extractedData: undefined, detectedElements: [], customLayers: [] });
    setHistory([]);
    setHistoryIndex(-1);
    setLastAuditIndex(-1);
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
    // 1. Photo Logic
    if (el.category === FieldCategory.PHOTO) {
        setSelectedElement(el);
        headshotUploadRef.current?.click();
        return;
    }

    // 2. Barcode Logic
    if (el.category === FieldCategory.BARCODE) {
        handleBarcodeTrigger(el);
        return;
    }

    // 3. Text Logic
    setSelectedElement(el);
    
    // Track usage to learn user behavior
    updateFieldPreference(el.label);

    // AUTO-CONVERT TO LAYER LOGIC
    setStatus(AppStatus.ANALYZING);
    setErrorMsg(null);
    
    try {
        // Find style AND background color AND noise level
        const style = await predictTextStyle(docState.originalImage!, el.value);
        
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
                ...style, // Now includes backgroundColor, blur, noise
                textAlign: 'center'
            },
            label: el.label,
            category: el.category
        };

        const newState = { 
            ...docState, 
            customLayers: [...(docState.customLayers || []), newLayer] 
        };
        setDocState(newState);
        setSelectedLayerId(newLayer.id); // Trigger SmartEditModal
        setSelectedElement(undefined); // Clear element selection as we now have a layer
        
    } catch (e) {
        console.error("Auto-convert failed", e);
        setErrorMsg("Agent Zeta: Style Match Failed.");
        setPrompt(`TARGET: "${el.label}" >> OVERWRITE_VALUE: `);
    } finally {
        setStatus(AppStatus.READY_TO_EDIT);
    }
  };
  
  const handleLayerSelect = (id: string | null) => {
      setSelectedLayerId(id);
      if (id) setSelectedElement(undefined);
  };

  const handleForensicAudit = async () => {
    const targetImage = docState.editedImage || docState.originalImage;
    if (!targetImage) return;

    setStatus(AppStatus.AUDITING);
    setAgentStep(AgentStep.AUDITING);
    try {
        const report = await analyzeDocument(targetImage, docType);
        
        const newState = { ...docState, forensicReport: report };
        setDocState(newState);
        addToHistory(newState);
        setLastAuditIndex(historyIndex + 1);

        setShowForensics(true);
    } catch (e) {
        setErrorMsg("Agent Omega: Audit Failed.");
    } finally {
        setStatus(AppStatus.READY_TO_EDIT);
        setAgentStep(AgentStep.IDLE);
    }
  };

  const executeAuditAndSave = async () => {
    await handleForensicAudit();

    const link = document.createElement('a');
    link.href = docState.editedImage || docState.originalImage!;
    link.download = `FORGERY_FORGE_SNAPSHOT_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setShowAuditWarning(false);
    if (pendingAction) pendingAction();
    setPendingAction(null);
  };
  
  const ignoreAuditAndProceed = () => {
    setShowAuditWarning(false);
    if (pendingAction) pendingAction();
    setPendingAction(null);
  };

  const handleAssetGeneration = async () => {
      if (!assetPrompt) return;
      
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
              resolution: '2K' // Note: Could use settings.defaultDpiQuality logic here to scale
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
    
    const hasManualLayers = docState.customLayers && docState.customLayers.length > 0;
    if (!prompt.trim() && !hasManualLayers) return;

    setStatus(AppStatus.PROCESSING);
    setErrorMsg(null);
    let context = "";

    try {
      let sourceImage = docState.originalImage;
      let finalPrompt = prompt;

      if (hasManualLayers) {
          setAgentStep(AgentStep.DESIGNING);
          sourceImage = await flattenLayersToImage();
          if (!finalPrompt) {
              finalPrompt = "Integrate the added text and graphics seamlessly. Match lighting, noise, and compression artifacts of the original document.";
          }
      }

      if (useIntel && prompt) {
        const aiStudio = (window as any).aistudio;
        if (aiStudio && aiStudio.hasSelectedApiKey && !await aiStudio.hasSelectedApiKey()) await aiStudio.openSelectKey();

        setAgentStep(AgentStep.SEARCHING);
        context = await getSearchContext(prompt);
        setDocState(prev => ({ ...prev, searchContext: context }));
      }

      setAgentStep(AgentStep.ANALYZING);
      await new Promise(r => setTimeout(r, 1000)); 
      
      setAgentStep(AgentStep.DESIGNING);
      
      setAgentStep(AgentStep.FORGING);
      const resultImage = await editDocumentImage(
          sourceImage, 
          finalPrompt, 
          docType, 
          context,
          selectedElement 
      );
      
      const newState = { 
          ...docState, 
          editedImage: resultImage,
          customLayers: [] 
      };
      setDocState(newState);
      addToHistory(newState);
      
      // Auto-Audit Trigger
      if (settings.autoRunAudit) {
          setTimeout(handleForensicAudit, 500);
      }

      setStatus(AppStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Mission Failed. Ops Commander encountered resistance.");
      setStatus(AppStatus.ERROR);
    } finally {
        setAgentStep(AgentStep.IDLE);
    }
  };

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
    if (status !== AppStatus.PROCESSING && status !== AppStatus.ANALYZING && status !== AppStatus.SANITIZING && status !== AppStatus.AUDITING && status !== AppStatus.PROCESSING_HEADSHOT && status !== AppStatus.GENERATING_BARCODE) return null;

    const agents = [
        { id: AgentStep.SEARCHING, name: "AGENT DELTA (Intel)", desc: "Gathering external data points...", color: "text-green-500", bg: "bg-green-500/10" },
        { id: AgentStep.EXTRACTING, name: "AGENT SIGMA (Recon)", desc: "Analyzing document structure...", color: "text-blue-400", bg: "bg-blue-500/10" },
        { id: AgentStep.CLEANING, name: "AGENT GAMMA (Cleaner)", desc: "Sanitizing ID credentials...", color: "text-cyan-400", bg: "bg-cyan-500/10" },
        { id: AgentStep.SYNTHESIZING, name: "AGENT GAMMA (Photo Synth)", desc: "Generating AAMVA compliant headshot...", color: "text-purple-400", bg: "bg-purple-500/10" },
        { id: AgentStep.ENCODING, name: "AGENT SIGMA (Encoder)", desc: "Generating AAMVA PDF417 Matrix...", color: "text-amber-500", bg: "bg-amber-500/10" },
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

  const terminalActions: RootTerminalActions = {
      setDocType: (t) => setDocType(t),
      toggleIntel: (e) => setUseIntel(e),
      undo: handleUndo,
      redo: handleRedo,
      reset: () => triggerSafeAction(handleReset),
      setPrompt: (t) => setPrompt(t),
      execute: handleGenerate,
      openAssetFab: (p) => {
          setShowAssetGen(true);
          if (p) setAssetPrompt(p);
      },
      runAudit: handleForensicAudit,
      closeTerminal: () => setShowTerminal(false),
      
      setFilter: (key, val) => setImageFilters(prev => ({ ...prev, [key]: val })),
      resetFilters: () => setImageFilters({ brightness: 100, contrast: 100, saturation: 100, grayscale: 0, sepia: 0, invert: 0, blur: 0, hueRotate: 0, opacity: 100 }),
      setTransform: (key, val) => setViewTransforms(prev => ({ ...prev, [key]: val })),
      resetTransforms: () => setViewTransforms({ rotate: 0, scale: 1, flipH: false, flipV: false }),
      setUiFlag: (key, val) => setUiFlags(prev => ({ ...prev, [key]: val })),
      logSystemMessage: (msg) => console.log(`[SYS]: ${msg}`)
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#000000] ${settings.themeColor === ThemeColor.AMBER ? 'text-amber-400 selection:bg-amber-900' : settings.themeColor === ThemeColor.CYAN ? 'text-cyan-400 selection:bg-cyan-900' : settings.themeColor === ThemeColor.RED ? 'text-red-400 selection:bg-red-900' : 'text-green-400 selection:bg-green-900'} selection:text-white font-sans ${uiFlags.crt ? 'contrast-125 brightness-110 saturate-120' : ''}`}>
      
      <div className={`fixed inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(to_right,var(--theme-accent)_1px,transparent_1px),linear-gradient(to_bottom,var(--theme-accent)_1px,transparent_1px)] bg-[size:24px_24px] z-0`}></div>

      {showAuditWarning && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200">
              <div className="w-full max-w-2xl bg-[#050505] border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.2)] p-8 relative overflow-hidden">
                   <div className="absolute top-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#000_10px,#000_20px)]"></div>
                   <div className="absolute bottom-0 left-0 right-0 h-2 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#000_10px,#000_20px)]"></div>
                   
                   <div className="flex items-start gap-6 mb-6">
                       <div className="text-5xl text-red-600 animate-pulse">⚠</div>
                       <div>
                           <h2 className="text-3xl font-black text-white mb-2 tracking-tighter font-['VT323']">UNSAVED_CHANGES_DETECTED</h2>
                           <p className="text-red-500 font-mono font-bold uppercase tracking-widest text-sm">
                               Security Protocol 99-B Initiated
                           </p>
                       </div>
                   </div>

                   <div className="bg-red-950/20 border border-red-900/50 p-4 mb-8 text-sm font-mono text-red-200 leading-relaxed">
                       <p className="mb-4">
                           <strong className="text-white">SYSTEM ALERT:</strong> Significant modifications have been made to the asset since the last Forensic Audit.
                       </p>
                       <p>
                           Exiting or Resetting now may result in the loss of critical forgery data or the release of a flawed document. Agent Omega strongly recommends running a final diagnostic and securing a snapshot.
                       </p>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <button 
                           onClick={executeAuditAndSave}
                           className="bg-green-600 hover:bg-green-500 text-black font-bold font-mono uppercase py-4 px-6 tracking-widest transition-all flex items-center justify-center gap-2 border border-green-400"
                       >
                           <span>🛡</span> RUN AUDIT & SAVE
                       </button>
                       <button 
                           onClick={ignoreAuditAndProceed}
                           className="bg-transparent hover:bg-red-950/30 text-red-500 hover:text-red-400 font-bold font-mono uppercase py-4 px-6 tracking-widest transition-all border border-red-800 hover:border-red-500"
                       >
                           IGNORE & PROCEED >
                       </button>
                   </div>
                   <div className="mt-4 text-center">
                        <button 
                            onClick={() => setShowAuditWarning(false)} 
                            className="text-xs text-gray-500 hover:text-white underline font-mono uppercase"
                        >
                            Cancel Action
                        </button>
                   </div>
              </div>
          </div>
      )}

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Barcode Generator Modal */}
      {showBarcodeModal && (
          <BarcodeModal 
             initialData={barcodeData}
             onGenerate={handleBarcodeGenerate}
             onClose={() => setShowBarcodeModal(false)}
             status={status}
          />
      )}

      {/* Smart Insert Modal (Manual Call) */}
      {showSmartInsert && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in zoom-in duration-200">
              <div className={`w-full max-w-lg bg-[#050505] border ${themeAccentClass} shadow-[0_0_50px_rgba(34,197,94,0.1)] p-8 relative`}>
                   <div className="flex justify-between items-center mb-6 border-b border-gray-900 pb-2">
                       <h3 className={`text-xl font-mono font-bold ${themeAccentClass.split(' ')[0]} tracking-widest`}>
                           AGENT ZETA // TEXT INJECTION
                       </h3>
                       <button onClick={() => setShowSmartInsert(false)} className="hover:text-white transition-colors">[CLOSE]</button>
                   </div>
                   
                   <p className="text-xs opacity-70 font-mono mb-4">
                       Agent Zeta will analyze surrounding typography to match font, weight, color, and aging effects automatically.
                   </p>

                   <div className="space-y-4">
                       <div>
                           <label className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-1 block">Content to Insert</label>
                           <input 
                               type="text" 
                               value={smartInsertValue}
                               onChange={(e) => setSmartInsertValue(e.target.value)}
                               placeholder="e.g. APPROVED, 12/25/2025, CONFIDENTIAL"
                               className={`w-full bg-black border ${themeAccentClass.split(' ')[1]} p-4 text-lg font-mono outline-none focus:ring-1 transition-all placeholder-gray-800`}
                               autoFocus
                               onKeyDown={(e) => e.key === 'Enter' && handleSmartInsertExecute()}
                           />
                       </div>

                       <Button 
                           onClick={handleSmartInsertExecute} 
                           disabled={!smartInsertValue}
                           className="w-full py-4 text-sm font-bold uppercase tracking-widest"
                           variant="primary"
                       >
                           [ INITIATE ANALYSIS & INSERT ]
                       </Button>
                   </div>
              </div>
          </div>
      )}

      {/* Asset Generation Overlay */}
      {showAssetGen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className={`w-full max-w-4xl bg-black border ${themeAccentClass.split(' ')[1]} shadow-2xl flex flex-col max-h-[90vh]`}>
                  <div className="p-4 border-b border-gray-900 flex justify-between items-center bg-gray-950/20">
                      <h3 className={`font-bold font-mono tracking-widest flex items-center gap-2 ${themeAccentClass.split(' ')[0]}`}>
                          <span className="text-xl">❖</span> AGENT GAMMA // ASSET FABRICATOR
                      </h3>
                      <button onClick={() => setShowAssetGen(false)} className="text-gray-500 hover:text-white font-mono text-xs">
                          [CLOSE_PANEL]
                      </button>
                  </div>
                  
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                      <div className="bg-gray-950/10 border border-gray-900/50 p-3 mb-6 text-[11px] font-mono opacity-80">
                          <span className={`font-bold ${themeAccentClass.split(' ')[0]}`}>INFO:</span> Generate high-fidelity stamps, seals, logos, or textures. 
                          Clicking "INSERT" will add the asset to your current document.
                      </div>

                       <div className="flex gap-0 mb-8">
                            <input 
                              type="text" 
                              value={assetPrompt}
                              onChange={(e) => setAssetPrompt(e.target.value)}
                              placeholder="Describe asset (e.g., 'Classified Stamp', 'Gold Embossed Seal', 'Fingerprint')" 
                              className={`flex-1 bg-black border ${themeAccentClass.split(' ')[1]} border-r-0 px-4 py-4 text-sm font-mono focus:border-white outline-none placeholder-gray-800`}
                              onKeyDown={(e) => e.key === 'Enter' && handleAssetGeneration()}
                            />
                            <button 
                              onClick={handleAssetGeneration}
                              disabled={status === AppStatus.GENERATING_ASSET}
                              className={`bg-gray-900 hover:bg-gray-800 text-white px-8 py-2 text-xs font-bold uppercase tracking-wide border border-gray-700 transition-all flex items-center gap-2`}
                            >
                                {status === AppStatus.GENERATING_ASSET ? <span className="animate-pulse">FABRICATING...</span> : 'GENERATE'}
                            </button>
                        </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {generatedAssets.map((asset, idx) => (
                              <div key={idx} className="aspect-square bg-[#050505] border border-gray-900 relative group flex items-center justify-center p-4">
                                  <img src={asset.imageUrl} className="max-w-full max-h-full object-contain" />
                                  <div className="absolute inset-0 bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                      <button 
                                          onClick={() => handleAddAssetLayer(asset.imageUrl)}
                                          className={`border ${themeAccentClass} px-3 py-1 text-[10px] font-bold uppercase hover:bg-white hover:text-black transition-colors`}
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
                              <div className="col-span-full text-center py-12 text-gray-800 font-mono text-xs border border-dashed border-gray-900/30">
                                  NO ASSETS FABRICATED. ENTER PROMPT TO BEGIN.
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Header */}
      <header className={`border-b border-gray-900 bg-black/90 backdrop-blur-md sticky top-0 z-50 ${!uiFlags.hud ? 'opacity-20 hover:opacity-100 transition-opacity' : ''}`}>
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 bg-black border ${themeAccentClass.split(' ')[1]} flex items-center justify-center rounded-sm`}>
              <span className={`font-bold font-mono ${themeAccentClass.split(' ')[0]}`}>F</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-gray-100 leading-none font-['VT323']">
                FORGERY<span className={themeAccentClass.split(' ')[0]}>FORGE</span>
              </span>
              <span className={`text-[10px] font-mono ${themeAccentClass.split(' ')[0]} tracking-[0.2em] uppercase`}>
                // ARCHITECT: FraudR0b
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border border-gray-900/50 bg-gray-950/20 px-3 py-1 rounded">
                  <div className={`w-2 h-2 rounded-full ${themeAccentClass.split(' ')[0].replace('text', 'bg')} animate-pulse`}></div>
                  <span className={`text-[10px] font-mono font-bold ${themeAccentClass.split(' ')[0]} tracking-wider`}>
                      SYSTEM: ONLINE
                  </span>
              </div>
              
              {/* GLOBAL UNDO/REDO */}
              <div className="flex gap-1 border-r border-gray-900/50 pr-4 mr-1">
                  <button
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className={`border border-gray-900 bg-gray-950/10 text-gray-500 hover:text-white hover:border-white px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${historyIndex <= 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Undo (Ctrl+Z)"
                  >
                      [ &lt; UNDO ]
                  </button>
                  <button
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className={`border border-gray-900 bg-gray-950/10 text-gray-500 hover:text-white hover:border-white px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${historyIndex >= history.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                      title="Redo (Ctrl+Y)"
                  >
                      [ REDO &gt; ]
                  </button>
              </div>

              <button
                onClick={() => setShowSettings(true)}
                className="border border-gray-900 bg-gray-950/10 text-gray-500 hover:text-white hover:border-white px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
              >
                  [ SETTINGS ]
              </button>

              <button
                onClick={() => setShowHelp(true)}
                className="border border-gray-900 bg-gray-950/10 text-gray-500 hover:text-white hover:border-white px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest transition-all"
              >
                  [ HELP ]
              </button>

              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className={`border text-[10px] font-bold font-mono uppercase tracking-widest px-3 py-1 transition-all ${
                    showTerminal 
                    ? 'bg-red-600 text-black border-red-500 hover:bg-red-500' 
                    : 'bg-red-950/30 border-red-900 hover:bg-red-900/40 hover:border-red-600 text-red-500'
                }`}
              >
                  {showTerminal ? '[ CLOSE CMD ]' : '[ ACCESS CMD ]'}
              </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full px-6 py-8 relative z-10">
        
        <HelpModal 
            isOpen={showHelp} 
            onClose={() => setShowHelp(false)} 
            language={settings.language}
        />

        <RootTerminal 
            isOpen={showTerminal} 
            onClose={() => setShowTerminal(false)} 
            actions={terminalActions} 
            enableAutocomplete={settings.enableTerminalAutocomplete}
        />

        {(status === AppStatus.IDLE || status === AppStatus.UPLOADING || status === AppStatus.SEARCHING_TEMPLATE) && (
           <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in duration-700">
             <div className="text-center max-w-3xl mb-12">
               <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tighter text-gray-100 font-['VT323']">
                 FORGERY<span className={themeAccentClass.split(' ')[0]}>FORGE</span>
               </h1>
               <div className="max-w-xl mx-auto space-y-4 mb-8">
                   <p className={`text-lg opacity-80 font-mono leading-relaxed border-l-2 ${themeAccentClass.split(' ')[1]} pl-4`}>
                     The ultimate generative forgery suite. From blank canvas to verified credential.
                   </p>
                   <p className="text-sm opacity-60 font-mono uppercase tracking-widest">
                     > AI-DRIVEN STYLE MATCHING<br/>
                     > FORENSIC-GRADE AUDITING<br/>
                     > SEAMLESS LAYER BLENDING<br/>
                     > REAL-TIME INTEL GROUNDING
                   </p>
               </div>
               
               <button 
                onClick={() => setShowHelp(true)}
                className={`mb-8 border ${themeAccentClass} hover:bg-white hover:text-black px-6 py-2 font-mono font-bold text-xs uppercase tracking-[0.2em] transition-all`}
               >
                   [ INITIATE TRAINING / READ MANUAL ]
               </button>

               {settings.showFraudKitAd && (
                   <a 
                      href="https://bit.ly/flailkit" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`block mt-6 mx-auto max-w-xl border-l-4 ${themeAccentClass.split(' ')[1]} bg-black/80 p-4 hover:bg-gray-900/50 transition-all group relative overflow-hidden text-left no-underline`}
                   >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      
                      <div className="flex items-start gap-4 relative z-10">
                          <div className="shrink-0 w-16 h-12 bg-gray-900/20 border border-gray-800 flex items-center justify-center rounded-sm p-1">
                              <FlailKitLogo className={`w-full h-full ${themeAccentClass.split(' ')[0]}`} />
                          </div>
                          <div>
                              <div className="flex items-center gap-2 mb-1">
                                 <h3 className={`font-bold font-mono text-sm tracking-widest uppercase ${themeAccentClass.split(' ')[0]}`}>
                                     FRAUD R0B'S FLAIL KIT
                                 </h3>
                                 <span className="bg-gray-600 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm">NEW TOOL</span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-mono leading-relaxed group-hover:text-white">
                                  Build a detailed interactive DOX DATABASE. Instantly generate fully passable state IDs, barcodes, MRZs, and AI-assisted headshots with attitude. 
                              </p>
                              <div className={`mt-2 text-[9px] font-bold ${themeAccentClass.split(' ')[0]} uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform`}>
                                 > ACCESS THE COLLECTION
                              </div>
                          </div>
                      </div>
                   </a>
               )}

             </div>
             
             <div className="w-full max-w-3xl">
                {status !== AppStatus.SEARCHING_TEMPLATE && (
                    <>
                        <UploadZone onFileSelect={handleFileSelect} />
                        
                        <div className="flex gap-4 mt-6">
                            {[
                                { id: DocumentType.GENERAL, label: 'STANDARD' },
                                { id: DocumentType.ID_CARD, label: 'ID CARD / CREDENTIAL' },
                                { id: DocumentType.FINANCIAL, label: 'FINANCIAL' }
                            ].map(type => (
                                <label key={type.id} className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-4 h-4 border ${docType === type.id ? `bg-current border-current ${themeAccentClass.split(' ')[0]}` : 'border-gray-800'}`}></div>
                                    <span className={`text-xs font-mono uppercase ${docType === type.id ? themeAccentClass.split(' ')[0] : 'text-gray-600 group-hover:text-white'}`}>{type.label}</span>
                                    <input type="radio" className="hidden" checked={docType === type.id} onChange={() => setDocType(type.id)} />
                                </label>
                            ))}
                        </div>
                    </>
                )}

                <div className={status === AppStatus.SEARCHING_TEMPLATE ? "block" : "mt-8"}>
                     <TemplateSearch 
                        onSearchAndFabricate={handleSearchAndFabricate} 
                        isLoading={status === AppStatus.SEARCHING_TEMPLATE || status === AppStatus.UPLOADING} 
                     />
                </div>
             </div>
           </div>
        )}

        {(status === AppStatus.READY_TO_EDIT || status === AppStatus.PROCESSING || status === AppStatus.ANALYZING || status === AppStatus.SANITIZING || status === AppStatus.GENERATING_ASSET || status === AppStatus.COMPLETED || status === AppStatus.ERROR || status === AppStatus.AUDITING || status === AppStatus.PROCESSING_HEADSHOT || status === AppStatus.GENERATING_BARCODE) && (
          <div className="flex-1 flex flex-col lg:flex-row gap-8 h-full">
            
            <div className="w-full lg:w-[400px] shrink-0 flex flex-col gap-6 order-2 lg:order-1">
              
              <div className="bg-black border border-gray-900 shadow-2xl relative overflow-hidden">
                 
                 <div className="bg-gray-950/20 p-4 border-b border-gray-900 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <div className={`w-1.5 h-1.5 rounded-full ${useIntel ? 'bg-green-500' : 'bg-red-500'}`}></div>
                         <h3 className={`font-mono text-xs font-bold tracking-widest uppercase ${themeAccentClass.split(' ')[0]}`}>Console</h3>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button onClick={() => triggerSafeAction(handleReset)} className="text-[10px] text-red-500 hover:text-red-400 font-mono uppercase tracking-wider hover:underline">Reset</button>
                    </div>
                 </div>

                 <div className="p-5">
                    
                    {selectedLayerId && activeLayer && (
                        <div className={`mb-6 bg-black border ${themeAccentClass.split(' ')[1]} shadow-[0_0_20px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-left-2 overflow-hidden flex flex-col`}>
                            <div className="flex justify-between items-center p-3 bg-gray-950/30 border-b border-gray-800">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${status === AppStatus.ANALYZING ? 'bg-yellow-500 animate-pulse' : 'bg-current'}`}></div>
                                    <h3 className="text-xs font-bold uppercase tracking-widest">
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
                                <div className="group">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className={`text-[9px] ${themeAccentClass.split(' ')[0]} uppercase font-bold tracking-wider flex items-center gap-2`}>
                                            <span>DATA_SOURCE</span>
                                            <div className="h-px w-12 bg-gray-900"></div>
                                        </label>
                                        <button 
                                            onClick={handleAutoMatchLayer}
                                            disabled={status === AppStatus.ANALYZING}
                                            className={`text-[9px] bg-gray-900/20 hover:bg-white hover:text-black border border-gray-700 px-2 py-1 transition-all uppercase font-bold flex items-center gap-1`}
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
                                                className={`w-full bg-[#050505] border ${themeAccentClass.split(' ')[1]} p-3 text-sm text-gray-100 font-mono focus:outline-none focus:ring-1 transition-all min-h-[100px] resize-y leading-relaxed`}
                                                placeholder="Enter text content..."
                                            />
                                        </div>
                                    ) : (
                                       <div className="space-y-2">
                                            <img src={activeLayer?.content} className="w-full h-32 object-contain bg-black/50 border border-gray-900/50 p-2" />
                                            <input 
                                                type="text"
                                                value={activeLayer?.content || ''}
                                                onChange={(e) => updateLayer(selectedLayerId, { content: e.target.value })}
                                                className="w-full bg-black border border-gray-900 p-2 text-[10px] font-mono truncate focus:border-white outline-none" 
                                                placeholder="Image Data URL..."
                                            />
                                       </div>
                                    )}
                                </div>

                                {activeLayer?.type === 'text' && (
                                    <div>
                                        <label className={`text-[9px] ${themeAccentClass.split(' ')[0]} uppercase font-bold tracking-wider mb-3 block flex items-center gap-2`}>
                                            <span>TYPOGRAPHY</span>
                                            <div className="h-px flex-1 bg-gray-900"></div>
                                        </label>
                                        
                                        <div className="grid grid-cols-2 gap-2 mb-4">
                                             {['Courier New', 'Arial', 'Times New Roman', 'Verdana'].map(font => (
                                                 <button
                                                    key={font}
                                                    onClick={() => updateLayerStyle(selectedLayerId, { fontFamily: font })}
                                                    className={`py-2 text-[9px] font-bold uppercase transition-all border ${activeLayer?.style.fontFamily === font ? `bg-current text-black border-current ${themeAccentClass.split(' ')[0]}` : 'bg-black text-gray-600 border-gray-900 hover:border-gray-600'}`}
                                                 >
                                                     {font.split(' ')[0]}
                                                 </button>
                                             ))}
                                        </div>

                                        <div className="flex gap-2 mb-4">
                                            <div className="flex border border-gray-900 bg-black rounded-sm overflow-hidden shrink-0">
                                                {['left', 'center', 'right'].map((align) => (
                                                    <button
                                                        key={align}
                                                        onClick={() => updateLayerStyle(selectedLayerId, { textAlign: align as any })}
                                                        className={`w-8 py-1.5 hover:bg-gray-900/30 flex items-center justify-center ${activeLayer?.style.textAlign === align ? 'bg-gray-900/50 text-white' : 'text-gray-600'}`}
                                                    >
                                                        {align === 'left' && 'L'} {align === 'center' && 'C'} {align === 'right' && 'R'}
                                                    </button>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const current = activeLayer?.style.fontWeight;
                                                    updateLayerStyle(selectedLayerId, { fontWeight: current === 'bold' ? 'normal' : 'bold' });
                                                }}
                                                className={`flex-1 py-1.5 text-[10px] border font-bold transition-all uppercase tracking-wider ${activeLayer?.style.fontWeight === 'bold' ? 'border-white bg-white text-black' : 'border-gray-900 text-gray-600'}`}
                                             >
                                                {activeLayer?.style.fontWeight === 'bold' ? 'BOLD' : 'REGULAR'}
                                             </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="flex justify-between text-[9px] text-gray-500 uppercase mb-1">Size</label>
                                                <input 
                                                    type="range" min="8" max="72" step="1"
                                                    value={activeLayer?.style.fontSize || 12}
                                                    onChange={(e) => updateLayerStyle(selectedLayerId, { fontSize: parseInt(e.target.value) })}
                                                    className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                             <div>
                                                <label className="flex justify-between text-[9px] text-gray-500 uppercase mb-1">Spacing</label>
                                                <input 
                                                    type="range" min="-2" max="10" step="0.5"
                                                    value={activeLayer?.style.letterSpacing || 0}
                                                    onChange={(e) => updateLayerStyle(selectedLayerId, { letterSpacing: parseFloat(e.target.value) })}
                                                    className="w-full h-1 bg-gray-900 rounded-lg appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="mb-4">
                                    <label className="block text-[9px] text-gray-500 uppercase mb-1 flex justify-between">
                                        <span>Color Hex</span>
                                    </label>
                                    <div className="flex gap-2 items-center">
                                        <div className="relative w-8 h-8 group overflow-hidden border border-gray-900">
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
                                            className="flex-1 bg-black border border-gray-900 p-2 text-xs font-mono uppercase focus:border-white outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {!selectedLayerId && (
                        <>
                            <div className="flex gap-2 mb-6">
                                <button 
                                    onClick={() => setUseIntel(!useIntel)}
                                    className={`flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-wide border transition-all ${useIntel ? 'bg-green-950/20 border-green-700 text-green-400' : 'bg-black/20 border-gray-900 text-gray-600 hover:border-gray-700'}`}
                                >
                                    {useIntel ? '[X] DELTA: ONLINE' : '[ ] DELTA: OFFLINE'}
                                </button>
                                <button 
                                    onClick={handleForensicAudit}
                                    disabled={status === AppStatus.ANALYZING || status === AppStatus.SANITIZING}
                                    className={`flex-1 py-3 text-[10px] font-mono font-bold uppercase tracking-wide border transition-all bg-black/20 border-gray-900 text-gray-600 hover:text-white hover:border-white`}
                                >
                                    Req. Omega Audit
                                </button>
                            </div>
                        </>
                    )}
                    
                    <div className="flex flex-col gap-2 mb-4">
                         <div className="flex gap-2">
                             <button onClick={() => setShowSmartInsert(true)} className={`flex-1 py-3 text-[10px] font-bold border ${themeAccentClass} bg-current/10 hover:bg-white hover:text-black transition-all uppercase tracking-widest shadow-[0_0_10px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2`}>
                                <span className="text-sm">✦</span> [ SMART INSERT ]
                            </button>
                             <button onClick={() => handleBarcodeTrigger()} className={`flex-1 py-3 text-[10px] font-bold border border-green-700 hover:border-green-500 bg-green-900/10 hover:bg-green-900/30 text-green-500 transition-all uppercase tracking-widest flex items-center justify-center gap-2`}>
                                <span className="text-sm">|||</span> [ PDF417 ]
                            </button>
                         </div>
                        
                        <input 
                            type="file" 
                            ref={layerUploadRef}
                            onChange={handleLayerUpload}
                            className="hidden" 
                            accept="image/png, image/jpeg, image/webp"
                        />
                         <input 
                            type="file" 
                            ref={headshotUploadRef}
                            onChange={handleHeadshotUpload}
                            className="hidden" 
                            accept="image/png, image/jpeg, image/webp"
                        />
                        
                        <div className="flex gap-2">
                            <button onClick={handleAddTextLayer} className="flex-1 py-2 text-[10px] font-bold border border-gray-900 hover:bg-gray-900/30 text-gray-500">+ ADD TEXT</button>
                            <button onClick={() => layerUploadRef.current?.click()} className="flex-1 py-2 text-[10px] font-bold border border-gray-900 hover:bg-gray-900/30 text-gray-500 transition-colors">+ UPLOAD LAYER</button>
                            <button onClick={() => setShowAssetGen(true)} className="flex-1 py-2 text-[10px] font-bold border border-gray-900 hover:bg-gray-900/30 text-gray-500">+ FABRICATE</button>
                        </div>
                    </div>

                    <div className="mb-6 relative group">
                        <div className="flex justify-between items-center mb-1">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ${themeAccentClass.split(' ')[0]}`}>
                            {selectedElement ? `EDITING: ${selectedElement.label}` : 'OPS COMMAND LINE'}
                          </label>
                          {selectedElement && (
                            <button onClick={() => setSelectedElement(undefined)} className="text-[9px] opacity-60 hover:opacity-100 uppercase tracking-widest">[RELEASE TARGET]</button>
                          )}
                        </div>

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
                            className={`relative w-full h-48 bg-black border p-4 text-sm font-mono focus:ring-0 outline-none resize-none placeholder-gray-800 leading-relaxed transition-colors ${selectedElement ? `border-current ${themeAccentClass.split(' ')[0]}` : 'border-gray-900'}`}
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
                             <Button variant="secondary" onClick={() => setShowExport(true)} className="w-full font-mono font-bold text-xs uppercase tracking-widest border border-gray-900 bg-black hover:bg-gray-950 text-gray-400 rounded-none relative overflow-hidden group">
                                <span className="relative z-10 flex items-center justify-center gap-2">
                                    [ EXFILTRATE ASSET ]
                                </span>
                            </Button>
                        </div>
                    )}
                 </div>
              </div>

              {renderAgentStatus()}

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
              
              {showForensics && docState.forensicReport && (
                  <div className="bg-[#020602] border border-red-900/50 font-mono text-xs text-green-600 shadow-[inset_0_0_20px_rgba(255,0,0,0.1)] animate-in fade-in duration-300 relative lg:col-span-1 lg:max-h-[600px] flex flex-col">
                      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_2px,3px_100%] opacity-20"></div>

                      <div className="p-4 border-b border-red-900/30 bg-red-950/20 flex justify-between items-center sticky top-0 backdrop-blur-sm z-10">
                          <div className="flex items-center gap-3">
                              <span className="text-xl">🛡</span>
                              <div>
                                <span className="block font-bold text-red-500 uppercase tracking-widest text-sm">OMEGA_DIAGNOSTIC_LOG.RPT</span>
                                <span className="block text-[9px] text-red-800/80 uppercase">Forensic Analysis & Recovery Plan</span>
                              </div>
                          </div>
                          <button onClick={() => setShowForensics(false)} className="text-red-800 hover:text-red-500 font-bold px-2 border border-transparent hover:border-red-900 transition-all uppercase text-[10px]">
                              [ CLOSE_REPORT ]
                          </button>
                      </div>
                      
                      <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4 min-h-[400px]">
                          <pre className="whitespace-pre-wrap font-mono leading-relaxed text-[11px] text-green-400/90 selection:bg-red-900 selection:text-white">
                              {docState.forensicReport}
                          </pre>
                      </div>

                      <div className="p-2 border-t border-red-900/30 bg-red-950/10 text-[9px] text-red-800/60 uppercase tracking-widest text-center">
                          // End of Line // Classification: Top Secret
                      </div>
                  </div>
              )}

              {errorMsg && (
                <div className="bg-red-950/20 border border-red-900/50 text-red-400 p-4 text-xs font-mono flex items-center gap-3">
                  <span className="animate-pulse">⚠</span> {errorMsg}
                </div>
              )}
            </div>

            <div className={`w-full lg:w-2/3 order-1 lg:order-2 flex flex-col h-full min-h-[500px] relative bg-black border border-gray-900`} ref={comparisonViewRef}>
              
              {/* SMART EDIT MODAL OVERLAY */}
              {activeLayer && selectedLayerId && (
                  <SmartEditModal 
                      layer={activeLayer}
                      onUpdate={updateLayer}
                      onClose={() => setSelectedLayerId(null)}
                      onAutoMatch={handleAutoMatchLayer}
                      status={status}
                  />
              )}

              {showExport && (
                  <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex items-end justify-end p-0 md:p-8 animate-in fade-in duration-200">
                      <div className={`w-full md:w-[400px] bg-black border ${themeAccentClass.split(' ')[1]} shadow-[0_0_30px_rgba(0,0,0,0.3)] p-6 animate-in slide-in-from-bottom duration-300`}>
                          <div className="flex justify-between items-start mb-6 border-b border-gray-900 pb-4">
                              <div>
                                  <h3 className={`text-lg font-bold ${themeAccentClass.split(' ')[0]} font-['VT323'] tracking-wider`}>EXFILTRATION PROTOCOL</h3>
                                  <p className="text-xs text-gray-600 font-mono uppercase">Secure Transport Layer</p>
                              </div>
                              <button onClick={() => setShowExport(false)} className="text-gray-500 hover:text-white font-mono">[CLOSE]</button>
                          </div>

                          <div className="space-y-6">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Output Format</label>
                                  <div className="flex gap-2">
                                      {[ExportFormat.PNG, ExportFormat.PDF].map((fmt) => (
                                          <button
                                              key={fmt}
                                              onClick={() => setExportFormat(fmt)}
                                              className={`flex-1 py-2 text-xs font-mono border transition-all ${exportFormat === fmt ? `bg-gray-800 text-white border-gray-700 font-bold` : 'border-gray-900 text-gray-600 hover:text-white'}`}
                                          >
                                              {fmt}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <div className="space-y-2">
                                   <div className="flex justify-between items-center">
                                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dimensions</label>
                                      <button onClick={handleAutoDetectSize} className="text-[10px] text-gray-600 hover:text-white font-mono underline cursor-pointer">Auto-Match</button>
                                   </div>
                                  <select 
                                      value={paperSize}
                                      onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                                      className={`w-full bg-black border border-gray-900 ${themeAccentClass.split(' ')[0]} text-xs font-mono p-2 focus:border-white outline-none appearance-none cursor-pointer`}
                                  >
                                      <option value={PaperSize.ORIGINAL}>ORIGINAL SOURCE</option>
                                      <option value={PaperSize.A4}>ISO A4 (210 x 297mm)</option>
                                      <option value={PaperSize.LETTER}>ANSI LETTER (8.5 x 11")</option>
                                      <option value={PaperSize.LEGAL}>LEGAL (8.5 x 14")</option>
                                  </select>
                              </div>

                              <div className="pt-4 flex flex-col gap-3">
                                  <Button onClick={() => triggerSafeAction(handleExport)} className="w-full" variant="primary">
                                      [ DOWNLOAD ASSET ]
                                  </Button>
                                  <button onClick={() => triggerSafeAction(handlePrint)} className="w-full py-3 border border-gray-900 text-gray-600 hover:text-white hover:border-white text-xs font-mono font-bold uppercase tracking-widest transition-colors">
                                      PRINT HARDCOPY
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <div className="flex-1 p-8 flex items-center justify-center bg-[radial-gradient(#1a1a1a_1px,transparent_1px)] [background-size:16px_16px]">
                  <ComparisonView 
                    original={docState.originalImage} 
                    edited={docState.editedImage} 
                    detectedElements={docState.detectedElements}
                    onSelectElement={handleElementSelect}
                    selectedElementId={selectedElement?.id}
                    filters={imageFilters}
                    transforms={viewTransforms}
                    uiFlags={uiFlags}
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