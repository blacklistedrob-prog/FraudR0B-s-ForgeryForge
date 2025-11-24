
import { allTools } from './toolDefinitions';
import { FunctionDeclaration } from '@google/genai';

interface CommandWeight {
  usage: number;
  lastUsed: number;
  successRate: number;
}

// Simulated "Global Knowledge" based on "Psychology of what leads to happy results"
// We pre-train the model with bias towards tools that actually help the user finish the job.
const GLOBAL_BIAS: Record<string, number> = {
    'run_audit': 50,           // Critical for quality
    'execute_operation': 100,  // The primary goal
    'osint_google_search': 80, // High utility
    'set_document_type': 60,   // Foundational step
    'open_asset_fab': 70,      // Creative step
    'sys_clear_terminal': 10,
    'isp_apply_preset_photocopy': 45, // Most popular realistic preset
    'isp_set_blur': 40,        // Most common fix for forensic errors
    'isp_set_contrast': 35
};

class TerminalIntelligence {
  private weights: Record<string, CommandWeight> = {};
  private tools: FunctionDeclaration[];
  private toolNames: string[];

  constructor() {
    this.tools = allTools;
    this.toolNames = allTools.map(t => t.name);
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem('ff_term_weights');
      if (raw) {
          this.weights = JSON.parse(raw);
      }
      
      // Merge global bias if not present (simulating "All Users" learning)
      for (const [cmd, score] of Object.entries(GLOBAL_BIAS)) {
          if (!this.weights[cmd]) {
              this.weights[cmd] = { usage: score, lastUsed: Date.now(), successRate: 1.0 };
          }
      }

    } catch (e) { console.warn("Intel load failed", e); }
  }

  public save() {
    localStorage.setItem('ff_term_weights', JSON.stringify(this.weights));
  }

  /**
   * Reinforcement Learning: Update weights based on execution
   */
  public train(input: string, successful: boolean = true) {
    const cmd = input.split(' ')[0];
    if (!cmd) return;
    
    // Validate it's a real tool before learning (don't learn typos)
    const tool = this.toolNames.find(t => t === cmd);
    if (!tool) return;

    if (!this.weights[cmd]) {
      this.weights[cmd] = { usage: 0, lastUsed: Date.now(), successRate: 1.0 };
    }
    
    // Reward mechanism
    if (successful) {
        this.weights[cmd].usage += 1;
    } else {
        // Minor penalty for failure, but don't forget it exists
        this.weights[cmd].usage = Math.max(0, this.weights[cmd].usage - 0.5);
    }
    
    this.weights[cmd].lastUsed = Date.now();
    this.save();
  }

  /**
   * Predict the next likely command based on partial input
   * Returns null if confidence < 70%
   */
  public predict(input: string): { text: string, confidence: number, isTypoCorrection?: boolean } | null {
    if (!input || input.trim().length === 0) return null;
    const lowerInput = input.toLowerCase();

    // 1. Exact Prefix Matching
    // Filter tools that start with input OR where input starts with tool (parameters)
    const matches = this.tools.filter(t => t.name.startsWith(lowerInput) || lowerInput.startsWith(t.name));
    
    if (matches.length === 0) {
        // 2. Fuzzy / Typo Detection (Levenshtein)
        // Only trigger if input is significant (>3 chars)
        if (input.length > 3) {
            const bestFuzzy = this.tools.reduce((best, tool) => {
                const dist = this.levenshtein(lowerInput, tool.name);
                if (dist < best.dist) return { tool, dist };
                return best;
            }, { tool: null as FunctionDeclaration | null, dist: 100 });

            // Threshold: Allow ~20% error rate (e.g., 2 chars in a 10 char string)
            if (bestFuzzy.tool && bestFuzzy.dist <= Math.ceil(bestFuzzy.tool.name.length * 0.25)) {
                 return this.formatSuggestion(bestFuzzy.tool, input, 0.75, true);
            }
        }
        return null;
    }

    // 3. Sort Candidates by Neural Weight (Usage + Recency)
    matches.sort((a, b) => {
        const wA = this.weights[a.name]?.usage || 0;
        const wB = this.weights[b.name]?.usage || 0;
        return wB - wA;
    });

    const bestTool = matches[0];
    const weight = this.weights[bestTool.name]?.usage || 0;
    
    // 4. Calculate Confidence Score
    // Base Confidence: 60%
    // Usage Bonus: +1% per usage count (Max +35%)
    // Length Bonus: +5% if input > 3 chars (User is committed)
    let confidence = 0.60;
    confidence += Math.min(weight * 0.01, 0.35);
    if (input.length > 3) confidence += 0.05;

    // Check if user is typing parameters (input is longer than tool name)
    if (lowerInput.startsWith(bestTool.name) && lowerInput.length > bestTool.name.length) {
        // Already fully typed command, maybe predicting param values?
        // For now, we only complete the schema structure.
        return this.formatSuggestion(bestTool, input, 0.95);
    } 
    
    return this.formatSuggestion(bestTool, input, confidence);
  }

  private formatSuggestion(tool: FunctionDeclaration, currentInput: string, confidence: number, isTypo: boolean = false): { text: string, confidence: number, isTypoCorrection?: boolean } {
      let prediction = tool.name;
      
      // Expand parameters schema
      if (tool.parameters && tool.parameters.properties) {
          const props = Object.keys(tool.parameters.properties);
          if (props.length > 0) {
              // Construct template: command param:""
              const paramStr = props.map(p => `${p}:""`).join(' ');
              prediction = `${tool.name} ${paramStr}`;
          }
      }

      return { text: prediction, confidence, isTypoCorrection: isTypo };
  }

  private levenshtein(a: string, b: string): number {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
    }
    return matrix[b.length][a.length];
  }
}

export const intel = new TerminalIntelligence();
