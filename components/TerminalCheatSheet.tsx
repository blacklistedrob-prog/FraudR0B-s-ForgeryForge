
import React from 'react';

interface TerminalCheatSheetProps {
  onClose: () => void;
}

export const TerminalCheatSheet: React.FC<TerminalCheatSheetProps> = ({ onClose }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // We clone the cheat sheet styles into a print-friendly format
      printWindow.document.write(`
        <html>
          <head>
            <title>ROOT_CMD_CHEATSHEET_V9</title>
            <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { background-color: #000; color: #fff; font-family: 'Share Tech Mono', monospace; }
              @media print { 
                body { -webkit-print-color-adjust: exact; } 
                .no-print { display: none; }
              }
            </style>
          </head>
          <body class="p-8 flex justify-center">
             <div style="transform: scale(0.9); transform-origin: top center;">
                ${document.getElementById('cheat-sheet-content')?.innerHTML}
             </div>
             <script>
                setTimeout(() => { window.print(); window.close(); }, 500);
             </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="absolute inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-8 backdrop-blur-md animate-in fade-in zoom-in duration-200">
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-4 z-50">
        <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-green-900/20 hover:bg-green-500 hover:text-black border border-green-500 text-green-500 px-4 py-2 font-mono font-bold uppercase tracking-widest transition-all text-xs"
        >
            <span>🖨</span> Print / Save PDF
        </button>
        <button 
            onClick={onClose}
            className="flex items-center gap-2 bg-red-900/20 hover:bg-red-500 hover:text-black border border-red-500 text-red-500 px-4 py-2 font-mono font-bold uppercase tracking-widest transition-all text-xs"
        >
            [ Close (ESC) ]
        </button>
      </div>

      {/* The "Image" / Poster */}
      <div 
        id="cheat-sheet-content" 
        className="w-full max-w-5xl bg-[#0a0a0a] border-4 border-white/90 p-8 shadow-[0_0_100px_rgba(34,197,94,0.15)] relative overflow-hidden"
      >
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        {/* Header */}
        <div className="relative z-10 border-b-4 border-white pb-6 mb-8 flex justify-between items-end">
            <div>
                <h1 className="text-7xl font-black tracking-tighter text-white leading-none">
                    ROOT<span className="text-green-500">CMD</span>
                </h1>
                <p className="text-xl text-gray-400 font-mono tracking-[0.5em] uppercase mt-2">Operator Reference Card</p>
            </div>
            <div className="text-right">
                <div className="bg-green-500 text-black font-bold px-3 py-1 text-2xl inline-block mb-1">V.9.0</div>
                <div className="text-xs text-gray-500 uppercase">Authorized Personnel Only</div>
                <div className="text-sm font-bold text-white mt-1 border border-white px-2 py-0.5 inline-block">ARCHITECT: FraudR0b</div>
            </div>
        </div>

        {/* Columns */}
        <div className="grid grid-cols-3 gap-8 relative z-10 font-mono text-sm">
            
            {/* COL 1: CORE */}
            <div className="space-y-6">
                <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="text-2xl font-bold text-green-500 mb-2">CORE OPS</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="block text-white font-bold bg-green-900/30 px-1">execute_operation</span>
                            <span className="text-gray-400 text-xs">Run the current prompt/edit.</span>
                        </div>
                        <div>
                            <span className="block text-white font-bold bg-green-900/30 px-1">set_operation_prompt text:"..."</span>
                            <span className="text-gray-400 text-xs">Set instructions for the AI.</span>
                        </div>
                        <div>
                            <span className="block text-white font-bold bg-green-900/30 px-1">set_document_type type:ID_CARD</span>
                            <span className="text-gray-400 text-xs">Modes: GENERAL, ID_CARD, FINANCIAL</span>
                        </div>
                        <div>
                            <span className="block text-white font-bold bg-green-900/30 px-1">reset_workspace</span>
                            <span className="text-gray-400 text-xs">Nuclear wipe of current state.</span>
                        </div>
                    </div>
                </div>

                <div className="border-l-4 border-yellow-500 pl-4">
                    <h3 className="text-2xl font-bold text-yellow-500 mb-2">AGENTS</h3>
                    <div className="space-y-3">
                        <div>
                            <span className="block text-white font-bold bg-yellow-900/20 px-1">open_asset_fab prompt:"..."</span>
                            <span className="text-gray-400 text-xs">Agent Gamma: Create logos/stamps.</span>
                        </div>
                        <div>
                            <span className="block text-white font-bold bg-yellow-900/20 px-1">run_audit</span>
                            <span className="text-gray-400 text-xs">Agent Omega: Forensic check.</span>
                        </div>
                        <div>
                            <span className="block text-white font-bold bg-yellow-900/20 px-1">toggle_intel_mode enabled:true</span>
                            <span className="text-gray-400 text-xs">Agent Delta: Web search grounding.</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* COL 2: ISP / VISUALS */}
            <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                    <h3 className="text-2xl font-bold text-blue-500 mb-2">ISP / FX</h3>
                    <p className="text-xs text-gray-500 mb-2">Direct Pixel Manipulation</p>
                    <div className="space-y-2">
                        <div className="flex justify-between border-b border-gray-800 pb-1">
                            <span className="text-white font-bold">isp_set_contrast</span>
                            <span className="text-blue-400">val:0-200</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-800 pb-1">
                            <span className="text-white font-bold">isp_set_brightness</span>
                            <span className="text-blue-400">val:0-200</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-800 pb-1">
                            <span className="text-white font-bold">isp_set_blur</span>
                            <span className="text-blue-400">val:0-20</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-800 pb-1">
                            <span className="text-white font-bold">isp_set_grayscale</span>
                            <span className="text-blue-400">val:0-100</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-800 pb-1">
                            <span className="text-white font-bold">spatial_rotate</span>
                            <span className="text-blue-400">degrees:0.5</span>
                        </div>
                    </div>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                    <h3 className="text-2xl font-bold text-purple-500 mb-2">PRESETS</h3>
                    <div className="grid grid-cols-1 gap-1 text-xs">
                        <code className="bg-purple-900/20 p-1 text-purple-300">isp_apply_preset_photocopy</code>
                        <code className="bg-purple-900/20 p-1 text-purple-300">isp_apply_preset_cctv</code>
                        <code className="bg-purple-900/20 p-1 text-purple-300">isp_apply_preset_noir</code>
                        <code className="bg-purple-900/20 p-1 text-purple-300">isp_apply_preset_blueprint</code>
                    </div>
                </div>
            </div>

            {/* COL 3: INTEL / CRYPTO */}
            <div className="space-y-6">
                 <div className="border-l-4 border-red-500 pl-4">
                    <h3 className="text-2xl font-bold text-red-500 mb-2">OSINT & IO</h3>
                    <div className="space-y-3">
                         <div>
                            <span className="block text-white font-bold bg-red-900/20 px-1">osint_google_search query:"..."</span>
                            <span className="text-gray-400 text-xs">Verify facts/prices/addresses.</span>
                        </div>
                         <div>
                            <span className="block text-white font-bold bg-red-900/20 px-1">osint_lookup_username</span>
                            <span className="text-gray-400 text-xs">Cross-platform handle check.</span>
                        </div>
                        <div>
                            <span className="block text-white font-bold bg-red-900/20 px-1">crypto_generate_password</span>
                            <span className="text-gray-400 text-xs">Generate strong credentials.</span>
                        </div>
                        <div>
                            <span className="block text-white font-bold bg-red-900/20 px-1">util_generate_iban</span>
                            <span className="text-gray-400 text-xs">Mock financial data.</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 p-4 border border-gray-700 mt-4">
                    <h3 className="text-white font-bold mb-2 text-sm uppercase">SHORTCUTS</h3>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Toggle Cheat Sheet</span>
                        <span className="text-green-400 font-bold border border-green-500 px-1 rounded">F1</span>
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400">Execute Command</span>
                        <span className="text-white font-bold border border-gray-500 px-1 rounded">ENTER</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Clear Terminal</span>
                        <span className="text-white font-bold border border-gray-500 px-1 rounded">cls</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-2 right-4 text-[10px] text-gray-600 font-mono uppercase tracking-widest flex items-center gap-4">
            <span>Property of VelvetOps // Do Not Distribute</span>
            <span className="text-white border-l border-gray-600 pl-4 font-bold">Created by: FraudR0b</span>
        </div>
      </div>
      
      <p className="mt-4 text-gray-500 font-mono text-xs">Press <strong className="text-white">ESC</strong> or click Close to return to Terminal.</p>
    </div>
  );
};
