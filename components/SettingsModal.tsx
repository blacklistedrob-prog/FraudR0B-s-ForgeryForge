


import React from 'react';
import { AppSettings, ExportFormat, ThemeColor, AppLanguage } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdateSettings }) => {
  if (!isOpen) return null;

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const getThemeClass = (theme: ThemeColor) => {
      switch(theme) {
          case ThemeColor.AMBER: return 'text-amber-500 border-amber-500';
          case ThemeColor.CYAN: return 'text-cyan-500 border-cyan-500';
          case ThemeColor.RED: return 'text-red-500 border-red-500';
          default: return 'text-green-500 border-green-500';
      }
  };

  const activeColor = getThemeClass(settings.themeColor);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`w-full max-w-4xl h-[85vh] bg-[#050505] border ${activeColor} shadow-2xl flex flex-col relative`}>
        
        {/* Header */}
        <div className={`flex justify-between items-center p-6 border-b border-gray-900 bg-gray-950/30`}>
          <div>
            <h2 className={`text-2xl font-['VT323'] tracking-wider ${activeColor.split(' ')[0]} font-bold`}>SYSTEM_CONFIGURATION</h2>
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Global Preferences // User: Root</p>
          </div>
          <button 
            onClick={onClose}
            className={`px-4 py-2 border font-mono text-xs uppercase hover:bg-white/10 transition-colors ${activeColor}`}
          >
            [ Save & Close ]
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 font-mono text-sm">
            
            {/* WORKFLOW & STORAGE */}
            <section className="space-y-6">
                <h3 className={`text-lg font-bold border-b border-gray-800 pb-2 mb-4 ${activeColor.split(' ')[0]}`}>01 // STORAGE & WORKFLOW</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Auto-Save Protocol</label>
                            <p className="text-[10px] text-gray-600">Snapshots local state every 2.5 minutes.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={settings.autoSaveLocal} 
                            onChange={(e) => handleChange('autoSaveLocal', e.target.checked)}
                            className="w-5 h-5 accent-current cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">History Buffer Size</label>
                            <p className="text-[10px] text-gray-600">Limit undo steps to save RAM/Storage.</p>
                        </div>
                        <select 
                            value={settings.historyLimit}
                            onChange={(e) => handleChange('historyLimit', parseInt(e.target.value))}
                            className="bg-black border border-gray-800 text-white p-2 text-xs outline-none focus:border-white"
                        >
                            <option value={5}>5 Steps (Light)</option>
                            <option value={10}>10 Steps (Standard)</option>
                            <option value={20}>20 Steps (Heavy)</option>
                            <option value={50}>50 Steps (Max)</option>
                        </select>
                    </div>

                     <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Auto-Run Forensic Audit</label>
                            <p className="text-[10px] text-gray-600">Trigger Agent Omega after every generation.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={settings.autoRunAudit} 
                            onChange={(e) => handleChange('autoRunAudit', e.target.checked)}
                            className="w-5 h-5 accent-current cursor-pointer"
                        />
                    </div>
                </div>
            </section>

             {/* OUTPUT SPECS */}
            <section className="space-y-6">
                <h3 className={`text-lg font-bold border-b border-gray-800 pb-2 mb-4 ${activeColor.split(' ')[0]}`}>02 // EXFILTRATION DEFAULTS</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Preferred Format</label>
                            <p className="text-[10px] text-gray-600">Default extension for exports.</p>
                        </div>
                        <select 
                            value={settings.defaultExportFormat}
                            onChange={(e) => handleChange('defaultExportFormat', e.target.value as ExportFormat)}
                            className="bg-black border border-gray-800 text-white p-2 text-xs outline-none focus:border-white w-32"
                        >
                            <option value={ExportFormat.PNG}>PNG (Lossless)</option>
                            <option value={ExportFormat.PDF}>PDF (Document)</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Generation Fidelity (DPI)</label>
                            <p className="text-[10px] text-gray-600">Target resolution for new assets.</p>
                        </div>
                         <select 
                            value={settings.defaultDpiQuality}
                            onChange={(e) => handleChange('defaultDpiQuality', e.target.value as any)}
                            className="bg-black border border-gray-800 text-white p-2 text-xs outline-none focus:border-white w-32"
                        >
                            <option value="300">300 DPI (Screen)</option>
                            <option value="600">600 DPI (Print)</option>
                            <option value="1200">1200 DPI (Archival)</option>
                        </select>
                    </div>
                </div>
            </section>

             {/* UI / VISUALS */}
            <section className="space-y-6">
                <h3 className={`text-lg font-bold border-b border-gray-800 pb-2 mb-4 ${activeColor.split(' ')[0]}`}>03 // INTERFACE & THEME</h3>
                
                <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">System Accent Color</label>
                            <p className="text-[10px] text-gray-600">Global UI highlight color.</p>
                        </div>
                         <div className="flex gap-2">
                             {[ThemeColor.GREEN, ThemeColor.AMBER, ThemeColor.CYAN, ThemeColor.RED].map(color => (
                                 <button
                                    key={color}
                                    onClick={() => handleChange('themeColor', color)}
                                    className={`w-6 h-6 rounded-full border-2 ${settings.themeColor === color ? 'border-white scale-110' : 'border-transparent opacity-50'}`}
                                    style={{ backgroundColor: color === ThemeColor.GREEN ? '#22c55e' : color === ThemeColor.AMBER ? '#f59e0b' : color === ThemeColor.CYAN ? '#06b6d4' : '#ef4444' }}
                                 />
                             ))}
                         </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Interface Language</label>
                            <p className="text-[10px] text-gray-600">Translates Help & Guides via AI.</p>
                        </div>
                        <select 
                            value={settings.language}
                            onChange={(e) => handleChange('language', e.target.value as AppLanguage)}
                            className="bg-black border border-gray-800 text-white p-2 text-xs outline-none focus:border-white w-32"
                        >
                            {Object.values(AppLanguage).map((lang) => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Reduce Motion</label>
                            <p className="text-[10px] text-gray-600">Disable heavy animations/scans.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={settings.reduceMotion} 
                            onChange={(e) => handleChange('reduceMotion', e.target.checked)}
                            className="w-5 h-5 accent-current cursor-pointer"
                        />
                    </div>
                     <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Privacy Blur</label>
                            <p className="text-[10px] text-gray-600">Blur canvas when inactive.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={settings.privacyBlurIdle} 
                            onChange={(e) => handleChange('privacyBlurIdle', e.target.checked)}
                            className="w-5 h-5 accent-current cursor-pointer"
                        />
                    </div>
                     <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Show Flail Kit Ad</label>
                            <p className="text-[10px] text-gray-600">Toggle main page promotion.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={settings.showFraudKitAd} 
                            onChange={(e) => handleChange('showFraudKitAd', e.target.checked)}
                            className="w-5 h-5 accent-current cursor-pointer"
                        />
                    </div>
                </div>
            </section>

             {/* TERMINAL & ADVANCED */}
            <section className="space-y-6">
                <h3 className={`text-lg font-bold border-b border-gray-800 pb-2 mb-4 ${activeColor.split(' ')[0]}`}>04 // ROOT KERNEL</h3>
                
                 <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Neural Autocomplete</label>
                            <p className="text-[10px] text-gray-600">AI command predictions.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={settings.enableTerminalAutocomplete} 
                            onChange={(e) => handleChange('enableTerminalAutocomplete', e.target.checked)}
                            className="w-5 h-5 accent-current cursor-pointer"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">Keyboard Shortcuts</label>
                            <p className="text-[10px] text-gray-600">Enable F1, Ctrl+Z hotkeys.</p>
                        </div>
                        <input 
                            type="checkbox" 
                            checked={settings.enableShortcuts} 
                            onChange={(e) => handleChange('enableShortcuts', e.target.checked)}
                            className="w-5 h-5 accent-current cursor-pointer"
                        />
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="block text-gray-300 font-bold">CRT Flicker Intensity</label>
                            <p className="text-[10px] text-gray-600">Visual screen noise level.</p>
                        </div>
                        <select 
                            value={settings.crtFlickerIntensity}
                            onChange={(e) => handleChange('crtFlickerIntensity', e.target.value as any)}
                            className="bg-black border border-gray-800 text-white p-2 text-xs outline-none focus:border-white"
                        >
                            <option value="LOW">Low</option>
                            <option value="MED">Medium</option>
                            <option value="HIGH">High</option>
                        </select>
                    </div>
                    
                    <div>
                         <label className="block text-gray-300 font-bold mb-2">Grid Overlay Opacity</label>
                         <input 
                            type="range" 
                            min="0" max="100" 
                            value={settings.gridOpacity}
                            onChange={(e) => handleChange('gridOpacity', parseInt(e.target.value))}
                            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-900 bg-black text-[10px] text-gray-600 font-mono text-center uppercase tracking-widest">
            Configuration saved to LocalStorage // Session ID: {Date.now().toString().slice(-6)}
        </div>
      </div>
    </div>
  );
};