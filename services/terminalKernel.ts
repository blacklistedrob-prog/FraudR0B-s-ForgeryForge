

import { RootTerminalActions } from "../types";

// Helper for simulated delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for crypto
const sha256 = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const executeKernelCommand = async (name: string, args: any, actions: RootTerminalActions): Promise<string> => {
  console.log(`[KERNEL] Executing: ${name}`, args);

  // --- SYSTEM / TERMINAL ---
  if (name === "ui_close_terminal") { actions.closeTerminal(); return "Terminating session..."; }
  if (name === "sys_clear_terminal") { return "CLS_TRIGGERED"; }
  if (name === "sys_matrix_mode") { return "Matrix Mode Enabled. (Visual only)"; }
  if (name === "sys_reboot") { actions.reset(); return "System reboot initiated..."; }
  
  // --- CORE OPS ---
  if (name === "set_document_type") { actions.setDocType(args.type); return `Document Mode: ${args.type}`; }
  if (name === "toggle_intel_mode") { actions.toggleIntel(args.enabled); return `Agent Delta: ${args.enabled ? 'ONLINE' : 'OFFLINE'}`; }
  if (name === "trigger_undo") { actions.undo(); return "Undo executed."; }
  if (name === "trigger_redo") { actions.redo(); return "Redo executed."; }
  if (name === "reset_workspace") { actions.reset(); return "Workspace reset."; }
  if (name === "set_operation_prompt") { actions.setPrompt(args.text); return "Prompt updated."; }
  if (name === "execute_operation") { actions.execute(); return "Executing..."; }
  if (name === "open_asset_fab") { actions.openAssetFab(args.prompt); return "Fab Lab opened."; }
  if (name === "run_audit") { actions.runAudit(); return "Audit running..."; }
  if (name === "print_hardcopy") { setTimeout(() => window.print(), 500); return "Print job spooled."; }
  if (name === "export_to_pdf") { return "Use the Exfiltrate menu to save as PDF."; }
  
  // --- ISP ---
  if (name.startsWith("isp_")) {
    const val = args.value;
    switch (name) {
      case "isp_set_brightness": actions.setFilter('brightness', val); return `Brightness: ${val}%`;
      case "isp_set_contrast": actions.setFilter('contrast', val); return `Contrast: ${val}%`;
      case "isp_set_saturation": actions.setFilter('saturation', val); return `Saturation: ${val}%`;
      case "isp_set_grayscale": actions.setFilter('grayscale', val); return `Grayscale: ${val}%`;
      case "isp_set_sepia": actions.setFilter('sepia', val); return `Sepia: ${val}%`;
      case "isp_set_invert": actions.setFilter('invert', val); return `Invert: ${val}%`;
      case "isp_set_blur": actions.setFilter('blur', val); return `Blur: ${val}px`;
      case "isp_set_hue_rotate": actions.setFilter('hueRotate', val); return `Hue: ${val}deg`;
      case "isp_set_opacity": actions.setFilter('opacity', val); return `Opacity: ${val}%`;
      case "isp_reset_all": actions.resetFilters(); return "Filters reset.";
      // Presets
      case "isp_apply_preset_cctv": actions.resetFilters(); actions.setFilter('grayscale', 100); actions.setFilter('contrast', 120); actions.setFilter('blur', 1); actions.setUiFlag('scanlines', true); return "Preset: CCTV";
      case "isp_apply_preset_night_vision": actions.resetFilters(); actions.setFilter('grayscale', 100); actions.setFilter('hueRotate', 90); actions.setFilter('brightness', 120); actions.setUiFlag('scanlines', true); return "Preset: NIGHT_VISION";
      case "isp_apply_preset_thermal": actions.resetFilters(); actions.setFilter('invert', 100); actions.setFilter('hueRotate', 180); actions.setFilter('contrast', 150); return "Preset: THERMAL";
      case "isp_apply_preset_xray": actions.resetFilters(); actions.setFilter('invert', 100); actions.setFilter('grayscale', 100); return "Preset: XRAY";
      case "isp_apply_preset_photocopy": actions.resetFilters(); actions.setFilter('grayscale', 100); actions.setFilter('contrast', 250); actions.setFilter('brightness', 110); return "Preset: PHOTOCOPY";
      case "isp_apply_preset_blueprint": actions.resetFilters(); actions.setFilter('invert', 100); actions.setFilter('saturation', 0); actions.setFilter('hueRotate', 200); actions.setUiFlag('grid', true); return "Preset: BLUEPRINT";
      case "isp_apply_preset_noir": actions.resetFilters(); actions.setFilter('grayscale', 100); actions.setFilter('contrast', 150); actions.setFilter('brightness', 80); return "Preset: NOIR";
      case "isp_apply_preset_polaroid": actions.resetFilters(); actions.setFilter('sepia', 30); actions.setFilter('contrast', 110); actions.setFilter('saturation', 120); return "Preset: POLAROID";
      case "isp_apply_preset_vhs": actions.resetFilters(); actions.setFilter('saturation', 150); actions.setFilter('blur', 1); actions.setUiFlag('scanlines', true); return "Preset: VHS";
    }
  }

  // --- SPATIAL ---
  if (name.startsWith("spatial_")) {
      if (name === "spatial_rotate") { actions.setTransform('rotate', args.degrees); return `Rotated ${args.degrees}°`; }
      if (name === "spatial_zoom") { actions.setTransform('scale', args.scale); return `Zoom: ${args.scale}x`; }
      if (name === "spatial_flip_h") { actions.setTransform('flipH', true); return "Flipped H"; }
      if (name === "spatial_flip_v") { actions.setTransform('flipV', true); return "Flipped V"; }
      if (name === "spatial_reset_transforms") { actions.resetTransforms(); return "Transforms reset"; }
      if (name === "spatial_center_view") { actions.resetTransforms(); return "Centered"; }
  }

  // --- CRYPTOGRAPHY (Native JS) ---
  if (name === "crypto_hash_md5") return "MD5: [UNAVAILABLE_IN_BROWSER_NATIVE_USE_SHA]";
  if (name === "crypto_hash_sha256") { const h = await sha256(args.text); return `SHA256: ${h}`; }
  if (name === "crypto_base64_encode") return btoa(args.text);
  if (name === "crypto_base64_decode") return atob(args.text);
  if (name === "crypto_rot13") return args.text.replace(/[a-zA-Z]/g, (c: string) => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13)));
  if (name === "crypto_hex_encode") return Array.from(args.text).map((c: any) => c.charCodeAt(0).toString(16)).join('');
  if (name === "crypto_url_encode") return encodeURIComponent(args.text);
  if (name === "crypto_url_decode") return decodeURIComponent(args.text);
  if (name === "crypto_generate_uuid") return crypto.randomUUID();
  if (name === "crypto_generate_password") {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
      return Array(args.length || 12).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
  if (name === "crypto_morse_encode") {
      const morseMap: any = { 'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/' };
      return args.text.toUpperCase().split('').map((c: string) => morseMap[c] || c).join(' ');
  }

  // --- OSINT (Simulated / Real Search Wrapper) ---
  // Note: Most of these would be routed to Google Search in the Agent context, 
  // but here in the Kernel we act as a simulated terminal response or trigger a real search if possible.
  if (name.startsWith("osint_")) {
      // In a real app, these would call specific APIs.
      // Here we simulate the successful execution or prompt the Agent to use its Search tool.
      if (name === "osint_lookup_ip") { await delay(500); return `IP INFO (${args.ip}):\nISP: Google Cloud\nRegion: us-central1\nASN: 15169\nStatus: Active`; }
      if (name === "osint_lookup_domain") { await delay(500); return `DOMAIN: ${args.domain}\nRegistrar: NameCheap\nCreated: 2020-05-12\nExpiry: 2026-05-12`; }
      if (name === "osint_google_search") return `[EXEC_SEARCH] Triggering Agent Delta for: ${args.query}`;
      
      return `OSINT Module '${name}' executed. Data stream logged to console.`;
  }

  // --- UTILS ---
  if (name === "util_get_timestamp") return Date.now().toString();
  if (name === "util_calculate") { try { return String(eval(args.expression)); } catch { return "Error"; } }
  if (name === "util_generate_iban") return "GB33BUKB20201555555555";
  if (name === "util_lorem_ipsum") return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris.";
  
  return `Command '${name}' executed.`;
};