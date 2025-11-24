
import React, { useState } from 'react';

interface TerminalManualProps {
  onClose: () => void;
}

type Category = 'CORE' | 'ISP' | 'OSINT' | 'CRYPTO' | 'STEGO' | 'SCRIPTS';

export const TerminalManual: React.FC<TerminalManualProps> = ({ onClose }) => {
  const [category, setCategory] = useState<Category>('CORE');

  const navItems: Category[] = ['CORE', 'ISP', 'OSINT', 'CRYPTO', 'STEGO', 'SCRIPTS'];

  return (
    <div className="absolute inset-0 z-[110] bg-black/95 flex flex-col font-mono text-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="h-10 bg-[#222] border-b border-green-900 flex items-center justify-between px-4 select-none">
        <div className="flex items-center gap-2">
          <span className="text-yellow-500 font-bold text-lg">⚠</span>
          <span className="text-green-500 font-bold tracking-widest uppercase">KERNEL_MANUAL // V.1.0 (CLIFF_NOTES)</span>
        </div>
        <button onClick={onClose} className="text-red-500 hover:text-red-400 font-bold">[ CLOSE_MANUAL ]</button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-[#111] border-r border-green-900 flex flex-col">
          <div className="p-3 text-[10px] text-green-700 uppercase tracking-wider font-bold border-b border-green-900/30">
            Directive Modules
          </div>
          {navItems.map(item => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`text-left px-4 py-3 text-xs font-bold border-l-2 transition-all hover:bg-green-900/20 ${category === item ? 'text-green-400 border-green-500 bg-green-900/10' : 'text-gray-500 border-transparent'}`}
            >
              {item}_OPS
            </button>
          ))}
          
          <div className="mt-auto p-4 text-[9px] text-gray-600">
            > MAN_PAGE_LOADED<br/>
            > ACCESS_LEVEL: ROOT
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[linear-gradient(rgba(0,255,0,0.02)_1px,transparent_1px)] bg-[size:100%_4px]">
          
          {category === 'CORE' && (
            <div className="space-y-6">
              <div className="border border-green-900/50 p-4 bg-green-950/10">
                <h3 className="text-green-400 font-bold mb-2">SYSTEM SYNTAX</h3>
                <code className="block bg-black p-3 text-green-300 border border-green-900 font-mono text-xs">
                  command_name parameter:value parameter2:value<br/>
                  <span className="text-gray-500">Example:</span> isp_set_brightness value:120
                </code>
              </div>
              
              <h3 className="text-green-500 font-bold mt-6 mb-4 border-b border-green-900 pb-1">CORE COMMANDS</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-gray-800">
                    <th className="py-2 w-48">COMMAND</th>
                    <th className="py-2">PARAMS</th>
                    <th className="py-2">DESCRIPTION</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-gray-300">
                  <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-green-400">set_document_type</td><td className="text-yellow-600">type</td><td>Switch mode (GENERAL, ID_CARD, FINANCIAL)</td></tr>
                  <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-green-400">execute_operation</td><td className="text-gray-600">--</td><td>Run the AI edit generation process</td></tr>
                  <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-green-400">open_asset_fab</td><td className="text-yellow-600">prompt</td><td>Launch Agent Gamma for asset creation</td></tr>
                  <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-green-400">run_audit</td><td className="text-gray-600">--</td><td>Trigger Agent Omega forensics report</td></tr>
                  <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-green-400">toggle_intel_mode</td><td className="text-yellow-600">enabled</td><td>Activate real-time search grounding</td></tr>
                  <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-green-400">export_to_pdf</td><td className="text-gray-600">--</td><td>Instant PDF compilation and download</td></tr>
                  <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-green-400">sys_reboot</td><td className="text-gray-600">--</td><td>Full workspace reset</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {category === 'ISP' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-950/10 border border-blue-900/30">
                <h4 className="text-blue-400 font-bold mb-2">IMAGE SIGNAL PROCESSING (ISP)</h4>
                <p className="text-xs text-gray-400">
                  Direct manipulation of pixel data. These commands bypass the AI and apply mathematical filters instantly. 
                  Crucial for "aging" documents or matching environmental lighting.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                   <h3 className="text-green-500 font-bold mb-4 border-b border-green-900 pb-1">FILTERS</h3>
                   <ul className="text-xs space-y-2 text-gray-300 font-mono">
                      <li><span className="text-green-400">isp_set_brightness</span> <span className="text-gray-500">(val: 0-200)</span></li>
                      <li><span className="text-green-400">isp_set_contrast</span> <span className="text-gray-500">(val: 0-200)</span></li>
                      <li><span className="text-green-400">isp_set_blur</span> <span className="text-gray-500">(val: 0-20px)</span> - Vital for depth</li>
                      <li><span className="text-green-400">isp_set_sepia</span> <span className="text-gray-500">(val: 0-100)</span> - For old paper</li>
                      <li><span className="text-green-400">isp_set_hue_rotate</span> <span className="text-gray-500">(val: 0-360)</span> - Fix tint</li>
                   </ul>
                </div>
                <div>
                   <h3 className="text-green-500 font-bold mb-4 border-b border-green-900 pb-1">PRESETS (MACROS)</h3>
                   <ul className="text-xs space-y-2 text-gray-300 font-mono">
                      <li><span className="text-yellow-400">isp_apply_preset_photocopy</span> - High contrast b/w</li>
                      <li><span className="text-yellow-400">isp_apply_preset_cctv</span> - Scanlines + green tint</li>
                      <li><span className="text-yellow-400">isp_apply_preset_polaroid</span> - Warm vintage fade</li>
                      <li><span className="text-yellow-400">isp_apply_preset_blueprint</span> - Inverted technical blue</li>
                      <li><span className="text-yellow-400">isp_apply_preset_noir</span> - Cinematic black & white</li>
                   </ul>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4 mt-4">
                  <h4 className="text-white font-bold text-xs mb-2">SPATIAL COMMANDS</h4>
                  <code className="text-xs text-gray-400">
                      spatial_rotate degrees:0.5 <span className="text-gray-600">// Micro-rotation for realism</span><br/>
                      spatial_flip_h <span className="text-gray-600">// Mirror image</span>
                  </code>
              </div>
            </div>
          )}

          {category === 'OSINT' && (
             <div className="space-y-6">
                 <div className="border-l-4 border-purple-500 pl-4 py-1">
                    <h3 className="text-purple-400 font-bold">OPEN SOURCE INTELLIGENCE</h3>
                    <p className="text-xs text-gray-400">Gather data to validate your document's narrative. Don't guess—verify.</p>
                 </div>

                 <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-800">
                        <th className="py-2 w-48">TOOL</th>
                        <th className="py-2">TARGET</th>
                        <th className="py-2">USE CASE</th>
                    </tr>
                    </thead>
                    <tbody className="text-xs text-gray-300">
                    <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-purple-400">osint_lookup_ip</td><td className="text-gray-500">IP Addr</td><td>Trace server location/ISP</td></tr>
                    <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-purple-400">osint_lookup_username</td><td className="text-gray-500">Handle</td><td>Find accounts across social platforms</td></tr>
                    <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-purple-400">osint_search_breaches</td><td className="text-gray-500">Email</td><td>Check if target is compromised</td></tr>
                    <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-purple-400">osint_google_search</td><td className="text-gray-500">Query</td><td>Live web verification (Prices, Addresses)</td></tr>
                    <tr className="border-b border-gray-900/50"><td className="py-2 font-bold text-purple-400">osint_verify_fact</td><td className="text-gray-500">Statement</td><td>Cross-reference multiple sources</td></tr>
                    </tbody>
                </table>
             </div>
          )}

          {category === 'CRYPTO' && (
             <div className="space-y-6">
                 <h3 className="text-green-500 font-bold mb-4">CRYPTOGRAPHY & HASHING</h3>
                 <p className="text-xs text-gray-400 mb-4">Tools for generating or cracking codes found in documents.</p>
                 
                 <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                     <div className="bg-black border border-gray-800 p-3">
                         <div className="text-yellow-500 font-bold mb-2">ENCODERS</div>
                         <div>crypto_base64_encode text:"..."</div>
                         <div>crypto_hex_encode text:"..."</div>
                         <div>crypto_rot13 text:"..."</div>
                         <div>crypto_morse_encode text:"..."</div>
                         <div>crypto_qrcode_gen data:"..."</div>
                     </div>
                     <div className="bg-black border border-gray-800 p-3">
                         <div className="text-red-500 font-bold mb-2">HASHING</div>
                         <div>crypto_hash_sha256 text:"..."</div>
                         <div>crypto_detect_hash_type hash:"..."</div>
                         <div>crypto_generate_uuid</div>
                         <div>crypto_generate_password length:16</div>
                     </div>
                 </div>
             </div>
          )}

          {category === 'STEGO' && (
              <div className="space-y-6">
                  <h3 className="text-cyan-500 font-bold mb-4">STEGANOGRAPHY & FORENSICS</h3>
                  <div className="bg-cyan-950/10 border border-cyan-900/50 p-4 mb-4">
                      <h4 className="font-bold text-cyan-400 mb-2">HIDDEN DATA OPERATIONS</h4>
                      <p className="text-xs text-gray-400">
                          Techniques to hide messages within the pixel data itself (LSB - Least Significant Bit) or analyze images for manipulation.
                      </p>
                  </div>
                  
                  <ul className="text-xs space-y-3 text-gray-300 font-mono">
                      <li>
                          <span className="text-cyan-400 font-bold block">stego_embed_text</span>
                          Usage: <span className="text-gray-500">stego_embed_text text:"SECRET_PAYLOAD"</span>
                          <br/>Embeds invisible text into the current workspace image.
                      </li>
                      <li>
                          <span className="text-cyan-400 font-bold block">forensics_noise_analysis</span>
                          <br/>Visualizes the noise pattern. Uniform noise = fake. Random noise = real sensor data.
                      </li>
                      <li>
                          <span className="text-cyan-400 font-bold block">forensics_ela_analysis</span>
                          <br/>Error Level Analysis. Highlights areas with different compression levels (edited zones).
                      </li>
                  </ul>
              </div>
          )}

          {category === 'SCRIPTS' && (
             <div className="space-y-8">
                 <div className="border-b border-green-900 pb-2">
                     <h3 className="text-xl font-bold text-white">TACTICAL SCRIPTS</h3>
                     <p className="text-xs text-gray-500">Chained commands for specific outcomes.</p>
                 </div>

                 {/* Script 1 */}
                 <div className="bg-black/50 p-4 border-l-2 border-yellow-500">
                     <h4 className="text-yellow-500 font-bold text-sm mb-2">PROTOCOL: THE "ANALOG HACK"</h4>
                     <p className="text-[10px] text-gray-400 mb-3">
                         Makes a digital document look like it was printed, crumpled, and scanned back in.
                     </p>
                     <div className="bg-[#0a0a0a] p-3 font-mono text-xs text-green-300 space-y-1">
                         <div>1. isp_apply_preset_photocopy</div>
                         <div>2. isp_set_blur value:0.4</div>
                         <div>3. isp_set_noise value:15 <span className="text-gray-600">(if available)</span></div>
                         <div>4. spatial_rotate degrees:0.8</div>
                         <div>5. sys_toggle_scanlines</div>
                     </div>
                 </div>

                 {/* Script 2 */}
                 <div className="bg-black/50 p-4 border-l-2 border-red-500">
                     <h4 className="text-red-500 font-bold text-sm mb-2">PROTOCOL: GHOST IDENTITY</h4>
                     <p className="text-[10px] text-gray-400 mb-3">
                         Full background check and data generation workflow.
                     </p>
                     <div className="bg-[#0a0a0a] p-3 font-mono text-xs text-green-300 space-y-1">
                         <div>1. osint_lookup_username username:"target_handle"</div>
                         <div>2. osint_search_breaches email:"target@email.com"</div>
                         <div>3. crypto_generate_password length:18 <span className="text-gray-600">// Gen safe password</span></div>
                         <div>4. util_generate_iban <span className="text-gray-600">// Gen safe bank details</span></div>
                     </div>
                 </div>

                 {/* Script 3 */}
                 <div className="bg-black/50 p-4 border-l-2 border-blue-500">
                     <h4 className="text-blue-500 font-bold text-sm mb-2">PROTOCOL: HIDDEN COMMS</h4>
                     <p className="text-[10px] text-gray-400 mb-3">
                         Securely encoding a message into a mundane image.
                     </p>
                     <div className="bg-[#0a0a0a] p-3 font-mono text-xs text-green-300 space-y-1">
                         <div>1. crypto_base64_encode text:"MEET_AT_MIDNIGHT"</div>
                         <div>2. Output: "TUVFVF9BVF9NSUROSUdIVA=="</div>
                         <div>3. stego_embed_text text:"TUVFVF9BVF9NSUROSUdIVA=="</div>
                         <div>4. export_to_png</div>
                     </div>
                 </div>

             </div>
          )}

        </div>
      </div>
    </div>
  );
};
