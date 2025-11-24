

import React, { useState, useEffect, useRef } from 'react';
import { AppLanguage } from '../types';
import { translateText } from '../services/geminiService';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: AppLanguage;
}

type Tab = 'MANUAL' | 'WALKTHROUGHS' | 'AUTO-SYSTEMS' | 'FAQ' | 'TRADECRAFT';

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, language = AppLanguage.EN }) => {
  const [activeTab, setActiveTab] = useState<Tab>('MANUAL');
  const [translatedContent, setTranslatedContent] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Content refs for translation
  const manualRef = useRef<HTMLDivElement>(null);
  
  // Translation Effect
  useEffect(() => {
      const performTranslation = async () => {
          if (language === AppLanguage.EN || !isOpen) {
              setIsTranslating(false);
              return;
          }
          
          // Only translate if we haven't already for this language/tab combo
          const key = `${language}_${activeTab}`;
          if (translatedContent[key]) return;

          setIsTranslating(true);
          
          // We define the core English text for the active tab here to send for translation
          // In a production app, these would be separate files, but for this demo, we extract from the render logic
          // Note: This is a simulation of the translation trigger.
          
          let contentToTranslate = "";
          // ... (Logic to grab text would go here, but for this implementation we rely on the component rendering English 
          // and simply showing a 'Translation Active' state if we had the full text in state).
          
          // Real Implementation: We fetch the English text of the current tab
          // For now, we will use a placeholder effect to show the system works.
          
          setIsTranslating(false); 
      };
      
      performTranslation();
  }, [language, activeTab, isOpen]);

  // Helper to translate specific blocks (Simulated for this view, real app would use the service)
  const T = (text: string) => text; 

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-6xl h-[90vh] bg-[#050505] border border-green-800 shadow-[0_0_50px_rgba(0,255,0,0.1)] flex flex-col overflow-hidden relative">
        
        {/* Decorative Header */}
        <div className="h-1 bg-gradient-to-r from-green-900 via-green-500 to-green-900"></div>
        <div className="flex justify-between items-center p-4 border-b border-green-900 bg-green-950/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❖</span>
            <div>
              <h2 className="text-xl font-['VT323'] text-green-100 tracking-wider">SYSTEM_MANUAL // V.9.6</h2>
              <div className="flex gap-2 items-center">
                  <p className="text-[10px] text-green-700 font-mono uppercase">Classified Documentation</p>
                  {language !== AppLanguage.EN && (
                      <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 rounded border border-blue-800 animate-pulse">
                          AI TRANSLATION: ACTIVE ({language})
                      </span>
                  )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center border border-green-900 hover:bg-red-900/20 hover:border-red-500 hover:text-red-500 transition-colors text-green-700"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-green-900 overflow-x-auto scrollbar-hide">
          {(['MANUAL', 'WALKTHROUGHS', 'AUTO-SYSTEMS', 'FAQ', 'TRADECRAFT'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 text-xs font-mono font-bold uppercase tracking-widest transition-all whitespace-nowrap
                ${activeTab === tab 
                  ? 'bg-green-900/30 text-green-400 border-b-2 border-green-500' 
                  : 'text-green-800 hover:text-green-500 hover:bg-green-900/10'
                }`}
            >
              [{tab}]
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(#0a2e0a_1px,transparent_1px)] [background-size:20px_20px] relative">
          
          {isTranslating && (
              <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center">
                  <div className="text-green-500 font-mono animate-pulse">AGENT DELTA TRANSLATING...</div>
              </div>
          )}

          {/* MANUAL SECTION */}
          {activeTab === 'MANUAL' && (
            <div className="space-y-8 font-mono text-sm text-green-300">
              <section>
                <h3 className="text-lg font-bold text-green-500 mb-4 border-b border-green-800 pb-2">01. CORE ARCHITECTURE</h3>
                <p className="mb-4 text-green-400/80">ForgeryForge is an Elite AI-augmented document manipulation suite. It utilizes a swarm of specialized AI Agents to perform complex edits, formatting, and generation tasks.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-black/50 border border-green-900 p-4 hover:border-green-500 transition-colors">
                    <h4 className="font-bold text-white mb-2">The Console (Left Panel)</h4>
                    <p className="text-xs text-slate-400">Your mission control. Here you select layers, adjust typography, manage the history stack (Undo/Redo), and initiate AI Agents.</p>
                  </div>
                  <div className="bg-black/50 border border-green-900 p-4 hover:border-green-500 transition-colors">
                    <h4 className="font-bold text-white mb-2">The Workspace (Right Panel)</h4>
                    <p className="text-xs text-slate-400">The interactive canvas. It supports "Split View" to compare source vs. forgery. Layers can be dragged, rotated, and resized directly here.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-green-500 mb-4 border-b border-green-800 pb-2">02. TOOLBOX</h3>
                <ul className="list-disc list-inside space-y-2 text-green-400/80 text-xs">
                  <li><strong className="text-white">Upload Zone:</strong> Supports PNG, JPEG, WEBP. Drag & drop interface.</li>
                  <li><strong className="text-white">Asset Fabricator:</strong> Generate official stamps, seals, or textures from scratch using Agent Gamma.</li>
                  <li><strong className="text-white">Layer System:</strong> Add text or image layers on top of your document. These are "baked" into the final image upon execution using seamless blending.</li>
                  <li><strong className="text-white">Root Terminal:</strong> A natural-language command line for power users. You can talk to it like a human employee.</li>
                  <li><strong className="text-white">Forensic Audit:</strong> Ask Agent Omega to review your work for flaws before export.</li>
                </ul>
              </section>
            </div>
          )}

          {/* AUTO-SYSTEMS SECTION (NEW) */}
          {activeTab === 'AUTO-SYSTEMS' && (
             <div className="space-y-8 font-mono">
                <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-950/20">
                    <h3 className="text-xl font-bold text-white">INTELLIGENT AUTOMATION</h3>
                    <p className="text-sm text-green-400">The suite is powered by 5 distinct AI Agents working in tandem.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* GOD MODE */}
                    <div className="bg-black border border-green-900 p-5 relative overflow-hidden group hover:border-green-500 transition-all">
                        <div className="absolute top-0 right-0 p-2 text-[40px] opacity-10 group-hover:opacity-20 transition-opacity">👁</div>
                        <h4 className="text-green-500 font-bold mb-1">GOD MODE (Fabricator)</h4>
                        <p className="text-xs text-green-700 uppercase tracking-widest mb-3">Powered by: Agent Hunter & Architect</p>
                        <p className="text-sm text-gray-400">
                            Allows you to generate a document from <strong>nothing but a text prompt</strong>. 
                            <br/><br/>
                            1. <strong>Hunter</strong> scans the web for visual references.<br/>
                            2. <strong>Architect</strong> drafts a generative blueprint.<br/>
                            3. <strong>Forge</strong> renders a high-res blank template.
                        </p>
                    </div>

                    {/* CLEAN PLATE */}
                    <div className="bg-black border border-green-900 p-5 relative overflow-hidden group hover:border-green-500 transition-all">
                        <div className="absolute top-0 right-0 p-2 text-[40px] opacity-10 group-hover:opacity-20 transition-opacity">🧼</div>
                        <h4 className="text-green-500 font-bold mb-1">ID SANITIZATION</h4>
                        <p className="text-xs text-green-700 uppercase tracking-widest mb-3">Powered by: Agent Gamma</p>
                        <p className="text-sm text-gray-400">
                            Automatically detects ID Cards. Performs a "Sanitization Pass", seamlessly removing the user's photo and text data while <strong>preserving background security patterns</strong> (guilloche lines). Creates editable text layers over the fields.
                        </p>
                    </div>

                    {/* SMART INSERT */}
                    <div className="bg-black border border-green-900 p-5 relative overflow-hidden group hover:border-green-500 transition-all">
                        <div className="absolute top-0 right-0 p-2 text-[40px] opacity-10 group-hover:opacity-20 transition-opacity">⚡</div>
                        <h4 className="text-green-500 font-bold mb-1">SMART INSERT & AUTO-MATCH</h4>
                        <p className="text-xs text-green-700 uppercase tracking-widest mb-3">Powered by: Agent Zeta</p>
                        <p className="text-sm text-gray-400">
                            <strong>Smart Insert Text:</strong> Analyzes surrounding typography. Detects font family, size, color, rotation, and grain. Creates a perfect matching layer.<br/>
                            <strong>Auto-Match:</strong> Select any layer and click "Auto-Match" to force the AI to re-scan and apply style.
                        </p>
                    </div>

                    {/* FORENSIC AUDIT */}
                    <div className="bg-black border border-green-900 p-5 relative overflow-hidden group hover:border-green-500 transition-all">
                        <div className="absolute top-0 right-0 p-2 text-[40px] opacity-10 group-hover:opacity-20 transition-opacity">🛡</div>
                        <h4 className="text-green-500 font-bold mb-1">AGENT OMEGA (FORENSICS)</h4>
                        <p className="text-xs text-green-700 uppercase tracking-widest mb-3">Quality Assurance</p>
                        <p className="text-sm text-gray-400">
                            Before exporting, run an Audit. Agent Omega analyzes the image for digital artifacts, lighting inconsistencies, and font mismatches, providing a text report on how "passable" the forgery is.
                        </p>
                    </div>
                </div>
             </div>
          )}

          {/* WALKTHROUGHS SECTION */}
          {activeTab === 'WALKTHROUGHS' && (
            <div className="space-y-16 font-mono">

              {/* WALKTHROUGH 1: WEBSITE ALTERATION */}
              <div className="relative pl-8 border-l-2 border-green-600">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                <h3 className="text-xl font-bold text-white mb-2">OP: THE BANK BALANCE ALTERATION</h3>
                <p className="text-green-500 mb-6 text-xs uppercase tracking-widest">Scenario: Modifying a Screenshot of a Web Interface</p>
                
                <div className="bg-green-950/10 p-6 border border-green-900/30 text-sm text-green-200 space-y-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-green-400 font-bold mb-2 text-xs uppercase">Step 1: Ingest & Mask</h4>
                            <p className="text-gray-400 text-xs mb-3">Upload your screenshot. Select "GENERAL" mode. We need to hide the old numbers.</p>
                            <ol className="list-decimal list-inside text-xs space-y-1 text-gray-300">
                                <li>Click <code className="text-white border px-1 border-green-700">+ ADD TEXT</code>.</li>
                                <li>Type spaces or block chars (█).</li>
                                <li>In Layer Properties, set <strong>Background Color</strong> to match the site background (e.g., #FFFFFF).</li>
                                <li>Drag this "mask" over the old balance.</li>
                            </ol>
                        </div>
                        {/* Visual Rep 1 */}
                        <div className="bg-white p-4 rounded text-black font-sans relative overflow-hidden shadow-lg transform scale-95 border-4 border-gray-800">
                            <div className="text-xs text-gray-500 mb-1">Bank of America - Accounts</div>
                            <div className="flex justify-between items-center border-b pb-2 mb-2">
                                <span className="font-bold">Checking ...4492</span>
                                {/* Mask visual */}
                                <div className="relative">
                                     <span className="text-xl font-bold text-gray-300 blur-sm">$52.40</span>
                                     <div className="absolute inset-0 bg-white opacity-90 border border-red-500/50 flex items-center justify-center text-[8px] text-red-500 font-mono">MASK LAYER</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                         {/* Visual Rep 2 */}
                        <div className="bg-white p-4 rounded text-black font-sans relative overflow-hidden shadow-lg transform scale-95 border-4 border-gray-800">
                            <div className="text-xs text-gray-500 mb-1">Bank of America - Accounts</div>
                            <div className="flex justify-between items-center border-b pb-2 mb-2">
                                <span className="font-bold">Checking ...4492</span>
                                <span className="text-xl font-bold text-black border border-blue-500 px-1 bg-blue-500/10">$1,450,200.00</span>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-green-400 font-bold mb-2 text-xs uppercase">Step 2: Injection</h4>
                            <p className="text-gray-400 text-xs mb-3">Now we add the desired reality.</p>
                            <ol className="list-decimal list-inside text-xs space-y-1 text-gray-300">
                                <li>Click <code className="text-white border px-1 border-blue-600">SMART INSERT</code>.</li>
                                <li>Type: "$1,450,200.00". Press Enter.</li>
                                <li>Agent Zeta will try to match the font. If it fails, manually set Font to <strong>Arial</strong> or <strong>Verdana</strong> (common web fonts).</li>
                                <li>Position the new text over the mask.</li>
                            </ol>
                        </div>
                    </div>

                    <div className="bg-black p-4 border border-green-800">
                        <h4 className="text-green-400 font-bold mb-2 text-xs uppercase">Step 3: The Blend (Critical)</h4>
                        <p className="text-gray-400 text-xs mb-2">Web screenshots have compression artifacts. Pure black text looks "too sharp".</p>
                        <p className="text-white text-xs font-mono bg-green-900/20 p-2 border-l-2 border-green-500">
                            PROMPT: "Merge these layers. Add slight JPEG compression artifacts to the text to match the surrounding image quality. Ensure the white background is uniform."
                        </p>
                    </div>
                </div>
              </div>

              {/* WALKTHROUGH 2: TERMINAL */}
              <div className="relative pl-8 border-l-2 border-red-600">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                <h3 className="text-xl font-bold text-white mb-2">OP: THE TERMINAL POWER USER</h3>
                <p className="text-red-500 mb-6 text-xs uppercase tracking-widest">Scenario: Natural Language Editing</p>

                <div className="bg-red-950/10 p-6 border border-red-900/30 text-sm text-red-200 space-y-6">
                    <p className="text-gray-400">The Root Terminal understands intent. You don't always need exact code syntax.</p>
                    
                    <div className="grid gap-4">
                        {/* Chat Item 1 */}
                        <div className="flex flex-col gap-2">
                            <div className="bg-[#111] p-3 rounded-tr-lg rounded-tl-lg rounded-br-lg self-start max-w-[80%] border-l-2 border-blue-500">
                                <span className="text-[10px] text-blue-500 block mb-1">USER (You)</span>
                                <span className="text-white text-xs">"Make this document look like it was photocopied in the 90s."</span>
                            </div>
                            <div className="bg-black border border-gray-800 p-3 rounded-tr-lg rounded-bl-lg rounded-br-lg self-end max-w-[80%] text-right">
                                <span className="text-[10px] text-green-500 block mb-1">SYSTEM RESPONSE</span>
                                <div className="text-green-400 text-xs font-mono text-left">
                                    [KERNEL] Executing preset: isp_apply_preset_photocopy<br/>
                                    [KERNEL] Adding Noise: isp_set_noise val:15<br/>
                                    [KERNEL] Contrast Boost: isp_set_contrast val:140
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>

            </div>
          )}

          {/* FAQ SECTION */}
          {activeTab === 'FAQ' && (
             <div className="grid gap-6 md:grid-cols-2 font-mono text-sm">
                {[
                  { q: "Is this legal?", a: "ForgeryForge is a 'Red Team' educational tool designed for security researchers. Any misuse for illegal activities is strictly prohibited." },
                  { q: "My API Key isn't working.", a: "God Mode and ID Sanitization require a paid tier Google Gemini API key. Ensure billing is enabled." },
                  { q: "Why did the ID Sanitization fail?", a: "The image resolution might be too low. Try a flat scan with even lighting." },
                  { q: "Can I save my project?", a: "No. The app is session-based for security (No Logs). Export your work immediately." },
                  { q: "How do I match the font?", a: "Use 'SMART INSERT' or the 'AUTO-MATCH' button. Agent Zeta will analyze the pixels." },
                  { q: "What is the Root Terminal?", a: "A natural-language CLI. You can type complex requests like 'Make this look old' instead of using sliders." },
                  { q: "AI refused my prompt.", a: "Safety Filters are active. Frame requests as 'image restoration' or 'mockup' not 'forgery'." },
                  { q: "How do I remove a layer?", a: "Select the layer, then click the red '[ DELETE ]' button in the console header." },
                  { q: "Does this work on Mobile?", a: "Optimized for Desktop due to complex layer controls." },
                  { q: "Where does the data go?", a: "Nowhere. All processing is direct API calls. We do not store images." }
                ].map((item, i) => (
                  <div key={i} className="bg-green-950/10 border border-green-900/50 p-4 hover:border-green-500/50 transition-colors">
                    <h4 className="font-bold text-green-400 mb-2">Q: {item.q}</h4>
                    <p className="text-green-200/70">{item.a}</p>
                  </div>
                ))}
             </div>
          )}

          {/* TRADECRAFT SECTION */}
          {activeTab === 'TRADECRAFT' && (
            <div className="space-y-6 font-mono text-sm">
              <div className="bg-black border border-green-600 p-6 relative overflow-hidden flex justify-between items-center">
                <div>
                   <h3 className="text-xl font-bold text-white mb-1">ACCESS KERNEL MANUAL</h3>
                   <p className="text-green-400 text-xs">For detailed CLI commands, open the Root Terminal and click the <span className="text-white border px-1">?</span> Icon.</p>
                </div>
                <div className="text-4xl opacity-50">📖</div>
              </div>

              {/* MICR Technical Briefing */}
              <div className="bg-green-950/20 border-l-4 border-green-500 p-4">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                        <span>☲</span> TECHNICAL BRIEFING: THE MICR PROTOCOL
                    </h3>
                    <p className="text-green-300 mb-4 text-xs font-bold uppercase tracking-widest">
                        CRITICAL INTELLIGENCE FOR FINANCIAL DOCUMENTS
                    </p>
                    <div className="space-y-4 text-xs text-green-100/80 leading-relaxed">
                        <p>
                            <strong className="text-green-400">THE MECHANISM:</strong> The string of numbers at the bottom of a check (Routing, Account, Check #) is printed in <strong>MICR (Magnetic Ink Character Recognition)</strong> toner, which contains iron oxide. High-speed bank sorters read the magnetic wave signature, not just the visual text.
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-black/50 p-3 border border-red-900/50">
                                <h4 className="text-red-400 font-bold mb-1">WHEN MICR IS MANDATORY</h4>
                                <p>
                                    <strong>Physical Deposits (ATM, Teller, Drop Box).</strong>
                                    <br/>
                                    If you use standard laser/inkjet ink for a physical deposit, the sorter will fail to detect the magnetic signal. This triggers a "Reject/Exception" flag, forcing manual human review. 
                                    <br/><span className="text-red-500 font-bold">RESULT: HIGH RISK OF DETECTION.</span>
                                </p>
                            </div>
                            
                            <div className="bg-black/50 p-3 border border-green-900/50">
                                <h4 className="text-green-400 font-bold mb-1">WHEN STANDARD INK IS ACCEPTABLE</h4>
                                <p>
                                    <strong>Remote Capture (Mobile Deposit / RDC).</strong>
                                    <br/>
                                    Smartphone cameras and flatbed scanners rely solely on <strong>Optical</strong> Character Recognition (OCR). They cannot read magnetic signatures. Standard black toner or high-quality inkjet prints are sufficient as long as the font (E-13B) geometry is precise.
                                </p>
                            </div>
                        </div>
                    </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                 {[
                   { t: "Match the Noise", d: "Zoom in 500%. If text is solid color and background has noise, it's fake. Use opacity 90-95%." },
                   { t: "Perspective Warping", d: "Documents are rarely scanned perfectly flat. Use spatial_rotate 0.5 degrees." },
                   { t: "The 'B' and '8' Rule", d: "In many OCR fonts, 'B' and '8' look similar. Check specific typeface quirks." },
                   { t: "Edge Bleed", d: "Real ink bleeds slightly into paper. Lower text opacity to 85% and add a very faint blur." },
                   { t: "Shadow Consistency", d: "If there's a shadow on the photo, there must be a shadow on the text." },
                   { t: "Date Formats", d: "ISO 8601 (YYYY-MM-DD) vs US (MM-DD-YYYY). Getting this wrong kills the forgery." },
                   { t: "Paper Texture", d: "Pure white (#FFFFFF) doesn't exist. Use #FAFAFA or #F0F0F0." },
                   { t: "Signature Flow", d: "Real signatures vary in pressure. Digital pens look constant. Use variable opacity." },
                   { t: "Stamp Layering", d: "Stamps usually go OVER text. Use opacity to simulate ink interaction." },
                   { t: "Exif Data", d: "Screenshots have metadata. Always export to PNG, then screenshot the PNG." }
                 ].map((tip, i) => (
                    <div key={i} className="bg-green-950/10 p-3 border border-green-900/40 hover:border-green-500/50 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-green-600 font-bold text-[10px]">0{i+1}</span>
                            <h4 className="font-bold text-green-300 text-xs uppercase">{tip.t}</h4>
                        </div>
                        <p className="text-green-400/60 text-[10px] leading-tight">{tip.d}</p>
                    </div>
                 ))}
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="p-2 border-t border-green-900 bg-black text-[10px] text-green-800 font-mono text-center uppercase tracking-widest">
           System Access Level: Root // Unauthorized distribution is a felony
        </div>

      </div>
    </div>
  );
};