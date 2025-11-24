
import React, { useState } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'MANUAL' | 'WALKTHROUGHS' | 'AUTO-SYSTEMS' | 'FAQ' | 'TRADECRAFT';

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('MANUAL');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] bg-[#050505] border border-green-800 shadow-[0_0_50px_rgba(0,255,0,0.1)] flex flex-col overflow-hidden relative">
        
        {/* Decorative Header */}
        <div className="h-1 bg-gradient-to-r from-green-900 via-green-500 to-green-900"></div>
        <div className="flex justify-between items-center p-4 border-b border-green-900 bg-green-950/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">❖</span>
            <div>
              <h2 className="text-xl font-['VT323'] text-green-100 tracking-wider">SYSTEM_MANUAL // V.9.5</h2>
              <p className="text-[10px] text-green-700 font-mono uppercase">Classified Documentation</p>
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
        <div className="flex border-b border-green-900 overflow-x-auto">
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
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[radial-gradient(#0a2e0a_1px,transparent_1px)] [background-size:20px_20px]">
          
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

                <div className="grid gap-6">
                    {/* GOD MODE */}
                    <div className="bg-black border border-green-900 p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 text-[40px] opacity-10 group-hover:opacity-20 transition-opacity">👁</div>
                        <h4 className="text-green-500 font-bold mb-1">GOD MODE (TEMPLATE FABRICATION)</h4>
                        <p className="text-xs text-green-700 uppercase tracking-widest mb-3">Powered by: Agent Hunter & Agent Architect</p>
                        <p className="text-sm text-gray-400">
                            Allows you to generate a document from <strong>nothing but a text prompt</strong>. 
                            <br/><br/>
                            1. <strong>Hunter</strong> scans the web for visual references of the document type.<br/>
                            2. <strong>Architect</strong> drafts a generative blueprint.<br/>
                            3. <strong>Forge</strong> renders a high-resolution blank template ready for filling.
                        </p>
                    </div>

                    {/* CLEAN PLATE */}
                    <div className="bg-black border border-green-900 p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 text-[40px] opacity-10 group-hover:opacity-20 transition-opacity">🧼</div>
                        <h4 className="text-green-500 font-bold mb-1">ID SANITIZATION (CLEAN PLATE)</h4>
                        <p className="text-xs text-green-700 uppercase tracking-widest mb-3">Powered by: Agent Gamma</p>
                        <p className="text-sm text-gray-400">
                            When uploading an ID Card, the system automatically detects it. It performs a "Sanitization Pass", seamlessly removing the user's photo and text data while <strong>preserving the complex background security patterns</strong> (guilloche lines). It then automatically creates editable text layers over the correct fields.
                        </p>
                    </div>

                    {/* SMART INSERT */}
                    <div className="bg-black border border-green-900 p-5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 text-[40px] opacity-10 group-hover:opacity-20 transition-opacity">⚡</div>
                        <h4 className="text-green-500 font-bold mb-1">SMART INSERT & AUTO-MATCH</h4>
                        <p className="text-xs text-green-700 uppercase tracking-widest mb-3">Powered by: Agent Zeta</p>
                        <p className="text-sm text-gray-400">
                            <strong>Smart Insert Text:</strong> Asks Agent Zeta to analyze the document's typography. It detects the font family (Serif/Sans/Mono), size, color, and even the rotation angle, then creates a text layer that matches perfectly.<br/>
                            <strong>Auto-Match Button:</strong> If you manually add a layer, click "Auto-Match" in the properties panel to force the AI to re-scan the document and apply the best style settings to your layer.
                        </p>
                    </div>

                    {/* FORENSIC AUDIT */}
                    <div className="bg-black border border-green-900 p-5 relative overflow-hidden group">
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
            <div className="space-y-12 font-mono">
              
              {/* Scenario: Screenshot */}
              <div className="relative pl-8 border-l-2 border-green-600">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                <h3 className="text-xl font-bold text-white mb-2">OP: THE SCREENSHOT ALTERATION</h3>
                <p className="text-green-500 mb-4 text-xs uppercase tracking-widest">Target: Web Banking / Email / Chat Logs</p>
                <div className="bg-green-900/10 p-4 border border-green-900/30 text-sm text-green-200 space-y-4">
                    <p><strong>Objective:</strong> Change a bank balance or chat message while keeping the screenshot looking authentic (matching pixelation and compression).</p>
                    <ol className="list-decimal list-inside space-y-3 text-green-300">
                        <li><strong>Ingest:</strong> Upload the screenshot. Set Document Type to "GENERAL".</li>
                        <li><strong>Masking:</strong> Click "+ ADD TEXT". Type a series of block characters (█) or spaces with a background color (if supported) to cover the old text. Alternatively, use "+ ADD ASSET" to upload a small patch of the background color to cover the text.</li>
                        <li><strong>New Data:</strong> Click "SMART INSERT TEXT". Type the new bank balance (e.g., "$1,450,200.00").</li>
                        <li><strong>Placement:</strong> Drag the new text layer over the masked area.</li>
                        <li><strong>Refinement:</strong> Use the sliders in the console. Screenshots usually have sharp text (Anti-aliasing). Ensure "Blur" is 0. If it's a JPEG, add 5% noise using the prompt later.</li>
                        <li><strong>Blend Command:</strong> In the main prompt box, type: <span className="text-white italic">"Merge these layers. Add slight JPEG compression artifacts to the text to match the surrounding image quality."</span></li>
                        <li><strong>Execute:</strong> The AI will flatten the image and degrade the new text just enough to match the low-quality screenshot.</li>
                    </ol>
                </div>
              </div>

              {/* Scenario: Terminal */}
              <div className="relative pl-8 border-l-2 border-red-600">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                <h3 className="text-xl font-bold text-white mb-2">OP: TERMINAL LINGUISTICS</h3>
                <p className="text-red-500 mb-4 text-xs uppercase tracking-widest">Target: Advanced Editing via Chat</p>
                <div className="bg-red-900/10 p-4 border border-red-900/30 text-sm text-red-200 space-y-4">
                    <p><strong>Objective:</strong> Use the Root Terminal to perform complex tasks by talking to the system naturally.</p>
                    <p className="text-xs text-gray-400">The Terminal isn't just for code. It understands intent.</p>
                    <div className="space-y-4">
                        <div className="bg-black p-3 border border-red-900/50">
                            <p className="text-gray-500 text-xs mb-1">// COMMAND 1: Visual Aging</p>
                            <p className="text-white">"Make the document look like it was scanned on a dirty machine in the 90s. Add noise and make it black and white."</p>
                            <p className="text-green-500 text-xs mt-1">-> System executes: isp_set_grayscale, isp_apply_preset_photocopy, isp_set_noise</p>
                        </div>
                        <div className="bg-black p-3 border border-red-900/50">
                            <p className="text-gray-500 text-xs mb-1">// COMMAND 2: Intel Gathering</p>
                            <p className="text-white">"I need the current exchange rate for USD to Euro and the hex code for the Deutsche Bank logo."</p>
                            <p className="text-green-500 text-xs mt-1">-> System executes: osint_google_search, osint_image_search</p>
                        </div>
                        <div className="bg-black p-3 border border-red-900/50">
                            <p className="text-gray-500 text-xs mb-1">// COMMAND 3: Mass Reset</p>
                            <p className="text-white">"Wipe the workspace, clear the cache, and set mode to ID Card."</p>
                            <p className="text-green-500 text-xs mt-1">-> System executes: reset_workspace, set_document_type</p>
                        </div>
                    </div>
                </div>
              </div>

              {/* Scenario: ID Shift */}
              <div className="relative pl-8 border-l-2 border-blue-600">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
                <h3 className="text-xl font-bold text-white mb-2">OP: THE IDENTITY SHIFT</h3>
                <p className="text-blue-500 mb-4 text-xs uppercase tracking-widest">Scenario: Changing ID Card Details</p>
                <ol className="list-decimal list-inside space-y-3 text-sm text-blue-200">
                  <li><strong>Select Document Type:</strong> Before uploading, click "ID CARD / CREDENTIAL" radio button.</li>
                  <li><strong>Upload Asset:</strong> Drop your ID image into the zone.</li>
                  <li><strong>Auto-Sanitization:</strong> The system will automatically trigger <em>Agent Gamma</em> to remove the photo and text, leaving the background pattern intact.</li>
                  <li><strong>Edit Fields:</strong> Click on any detected text box (e.g., [SURNAME]) in the workspace. Change the value in the Console.</li>
                  <li><strong>Add Photo:</strong> Click the "Photo Placeholder" layer. Replace the content URL with your target photo.</li>
                  <li><strong>Execute:</strong> Click "EXECUTE COMPOSITE". The AI will bake the layers into the image.</li>
                </ol>
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

          {/* TRADECRAFT (TIPS) SECTION */}
          {activeTab === 'TRADECRAFT' && (
            <div className="space-y-6 font-mono text-sm">
              <div className="bg-black border border-green-600 p-6 relative overflow-hidden flex justify-between items-center">
                <div>
                   <h3 className="text-xl font-bold text-white mb-1">ACCESS KERNEL MANUAL</h3>
                   <p className="text-green-400 text-xs">For detailed CLI commands, open the Root Terminal and click the <span className="text-white border px-1">?</span> Icon.</p>
                </div>
                <div className="text-4xl opacity-50">📖</div>
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
                   { t: "Exif Data", d: "Screenshots have metadata. Always export to PNG, then screenshot the PNG." },
                   { t: "Uncanny Fonts", d: "Arial is rarely used in official docs. It's usually Helvetica, Univers, or custom types." },
                   { t: "Scan Lines", d: "High speed scanners leave vertical streaks. Use isp_apply_preset_cctv at low opacity." },
                   { t: "Fold Lines", d: "A folded letter has shadow and distortion at the crease." },
                   { t: "Dynamic Range", d: "Scans often clip whites. Don't be afraid to blow out the highlights." },
                   { t: "File Naming", d: "'Scan_20231024.pdf' looks real. 'Fake_ID_Final.png' does not." },
                   { t: "Battery Life", d: "In mobile screenshots, 100% battery looks suspicious. 43% feels real." },
                   { t: "Signal Strength", d: "Full bars are rare in screenshots. 2-3 bars is authentic." },
                   { t: "Printer Dots", d: "Laser printers leave microscopic yellow tracking dots." },
                   { t: "Fax Headers", d: "If it's a fax, it needs the transmission header timestamp at the very top." },
                   { t: "Golden Ratio", d: "90% Research (Intel), 10% Photoshop (Forge)." }
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
