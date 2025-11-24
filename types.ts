

export enum AppStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  SEARCHING_TEMPLATE = 'SEARCHING_TEMPLATE',
  READY_TO_EDIT = 'READY_TO_EDIT',
  PROCESSING = 'PROCESSING',
  ANALYZING = 'ANALYZING',
  SANITIZING = 'SANITIZING', // New: ID Card Cleaning
  GENERATING_ASSET = 'GENERATING_ASSET',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export enum AgentStep {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING', // Agent Delta (Intel)
  EXTRACTING = 'EXTRACTING', // Agent Sigma (OCR/Recognition)
  AUDITING = 'AUDITING',   // Agent Omega (Thinking)
  ANALYZING = 'ANALYZING', // Agent Alpha (Forensics)
  DESIGNING = 'DESIGNING', // Agent Beta (Logic)
  FORGING = 'FORGING',     // Agent Gamma (Render)
  CLEANING = 'CLEANING'    // New: Sanitization
}

export enum DocumentType {
  GENERAL = 'GENERAL',
  ID_CARD = 'ID_CARD',
  FINANCIAL = 'FINANCIAL'
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectedElement {
  id: string;
  label: string;
  value: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax] 0-1000 scale
}

// --- NEW: Custom Layer Support ---
export interface LayerStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor?: string; // New: For masking underlying text
  letterSpacing: number;
  opacity: number;
  rotation: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface CustomLayer {
  id: string;
  type: 'text' | 'image';
  content: string; // Text string or Image Base64
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  width: number; // Percentage 0-100 (auto for text)
  height: number; // Percentage 0-100 (auto for text)
  style: LayerStyle;
  label?: string; // Metadata for UI
}

export interface DocumentState {
  originalImage: string | null; // Base64
  editedImage: string | null; // Base64
  fileName: string;
  extractedData?: string; // OCR/Recognition Text Dump
  detectedElements?: DetectedElement[]; // Structured Layer Data
  customLayers?: CustomLayer[]; // NEW: Added layers
  forensicReport?: string;
  searchContext?: string;
}

export interface AssetSpec {
  prompt: string;
  aspectRatio: '1:1' | '16:9' | '4:3' | '3:4' | '9:16';
  resolution: '1K' | '2K' | '4K';
}

export interface GeneratedAsset {
  imageUrl: string;
  spec: AssetSpec;
}

export enum PaperSize {
  ORIGINAL = 'ORIGINAL',
  A4 = 'A4',
  LETTER = 'LETTER',
  LEGAL = 'LEGAL'
}

export enum ExportFormat {
  PNG = 'PNG',
  PDF = 'PDF'
}

export interface ImageFilters {
  brightness: number; // 0-200, default 100
  contrast: number;   // 0-200, default 100
  saturation: number; // 0-200, default 100
  grayscale: number;  // 0-100, default 0
  sepia: number;      // 0-100, default 0
  invert: number;     // 0-100, default 0
  blur: number;       // 0-20, default 0
  hueRotate: number;  // 0-360, default 0
  opacity: number;    // 0-100, default 100
}

export interface ViewTransforms {
  rotate: number; // degrees
  scale: number;  // 0.1 - 5.0
  flipH: boolean;
  flipV: boolean;
}

export interface UiFlags {
  crt: boolean;
  grid: boolean;
  scanlines: boolean;
  hud: boolean;
  debug: boolean;
  audio: boolean;
}

export interface RootTerminalActions {
  // Core Ops
  setDocType: (type: DocumentType) => void;
  toggleIntel: (enabled: boolean) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  setPrompt: (text: string) => void;
  execute: () => void;
  openAssetFab: (prompt?: string) => void;
  runAudit: () => void;
  closeTerminal: () => void;
  
  // Extended Ops (Visual)
  setFilter: (key: keyof ImageFilters, value: number) => void;
  resetFilters: () => void;
  setTransform: (key: keyof ViewTransforms, value: number | boolean) => void;
  resetTransforms: () => void;
  
  // Extended Ops (System)
  setUiFlag: (key: keyof UiFlags, value: boolean) => void;
  logSystemMessage: (msg: string) => void;
}

export interface AgentStatus {
    hunter: 'idle' | 'scanning' | 'locked' | 'failed';
    architect: 'idle' | 'designing' | 'complete';
    forge: 'idle' | 'rendering' | 'complete';
}