

import React, { useState, useEffect, useRef } from 'react';
import { RootTerminalActions } from '../types';
import { createRootChat } from '../services/geminiService';
import { executeKernelCommand } from '../services/terminalKernel';
import { intel } from '../services/terminalIntelligence';
import { Chat } from '@google/genai';
import { TerminalManual } from './TerminalManual';
import { TerminalCheatSheet } from './TerminalCheatSheet';

interface RootTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: RootTerminalActions;
  enableAutocomplete?: boolean;
}

interface TerminalLine {
  type: 'input' | 'output' | 'system';
  content: string;
}

export const RootTerminal: React.FC<RootTerminalProps> = ({ isOpen, onClose, actions, enableAutocomplete = true }) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', content: 'VelvetOps Security Layer [Version 9.0.1-kali3]' },
    { type: 'system', content: 'Copyright (c) 2025 VelvetOps Foundation. All rights reserved.' },
    { type: 'system', content: ' ' },
    { type: 'system', content: 'Initializing Root Admin Protocol...' },
    { type: 'system', content: 'Kernel loaded. 120+ System Functions available.' },
    { type: 'system', content: 'Connection Established. Root Access: GRANTED.' },
    { type: 'system', content: 'Type "help" for manual or Press [F1] for Quick Reference Card.' },
    { type: 'system', content: ' ' },
  ]);
  const [input, setInput] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  
  const chatRef = useRef<Chat | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = createRootChat();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Autocomplete Logic
  useEffect(() => {
      if (!input || !enableAutocomplete) {
          setSuggestion(null);
          return;
      }
      
      const pred = intel.predict(input);
      // Threshold: 70% confidence
      if (pred && pred.confidence > 0.7) {
          // If the prediction matches what we already typed exactly, don't show it unless it adds more
          if (pred.text === input) {
              setSuggestion(null);
          } else {
              setSuggestion(pred.text);
          }
      } else {
          setSuggestion(null);
      }
  }, [input, enableAutocomplete]);

  // Keyboard Shortcut Listener for F1
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;
        
        // F1 to toggle Cheat Sheet
        if (e.key === 'F1') {
            e.preventDefault();
            setShowCheatSheet(prev => !prev);
        }

        // ESC to close cheat sheet if open
        if (e.key === 'Escape') {
            if (showCheatSheet) {
                setShowCheatSheet(false);
                e.preventDefault();
            } else if (showManual) {
                setShowManual(false);
                e.preventDefault();
            }
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCheatSheet, showManual]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isProcessing) return;

      // Tab or Right Arrow: Accept Suggestion
      if ((e.key === 'Tab' || e.key === 'ArrowRight') && suggestion && enableAutocomplete) {
          e.preventDefault();
          setInput(suggestion);
          return;
      }

      // Enter Logic
      if (e.key === 'Enter') {
          e.preventDefault(); // Always prevent default form submit

          // If we have a suggestion, and the input is NOT yet the full suggestion...
          // AND the input is likely incomplete (simple heuristic: no spaces or short), 
          // we prioritize "Auto-Type Out" (Completion) over Execution.
          // BUT, we must allow execution of short commands (like 'ls').
          // Strategy: If input exactly matches start of suggestion, and length diff is significant, complete it.
          
          if (suggestion && suggestion !== input && enableAutocomplete) {
             // If suggestion is 'osint_google_search query:""' and input is 'osint'
             // We want Enter to complete it.
             // But if input is 'help' and suggestion is 'help_me', we might want to run 'help'.
             // We check if input is a valid exact tool name.
             const isExactCommand = input.trim().length > 0 && !input.includes(' '); // Simplified check
             
             if (!isExactCommand) {
                 setInput(suggestion);
                 return;
             }
          }
          
          handleSubmit();
      }
  };

  const handleSubmit = async () => {
    if (!input.trim() || !chatRef.current || isProcessing) return;

    const userCmd = input;
    setLines(prev => [...prev, { type: 'input', content: userCmd }]);
    setInput('');
    setSuggestion(null);

    // Learn from this submission
    if (enableAutocomplete) {
        intel.train(userCmd, true);
    }

    // Immediate local command traps
    if (userCmd === 'clear' || userCmd === 'cls') {
        setLines([]);
        return;
    }
    
    if (userCmd === 'help' || userCmd === 'man') {
        setShowManual(true);
        setLines(prev => [...prev, { type: 'system', content: 'Opening Manual...' }]);
        return;
    }

    if (userCmd === 'cheatsheet' || userCmd === 'ref') {
        setShowCheatSheet(true);
        setLines(prev => [...prev, { type: 'system', content: 'Loading Reference Card...' }]);
        return;
    }
    
    // Check for exit commands
    const exitCmds = ['exit', 'close', 'end', 'close window', 'bye', 'quit'];
    if (exitCmds.includes(userCmd.toLowerCase().trim())) {
        onClose();
        return;
    }

    setIsProcessing(true);

    try {
      let response = await chatRef.current.sendMessage({ message: userCmd });
      
      // Handle Tool Calls Loop
      while (response.functionCalls && response.functionCalls.length > 0) {
        const functionResponses = [];
        
        for (const fc of response.functionCalls) {
            // Render execution attempt
            setLines(prev => [...prev, { type: 'system', content: `[root@velvetops] executing ${fc.name}...` }]);
            
            // Execute via Kernel
            let result;
            try {
                if (fc.name === 'sys_clear_terminal') {
                    setLines([]);
                    result = "Terminal Cleared";
                } else {
                    result = await executeKernelCommand(fc.name, fc.args, actions);
                }
            } catch (err) {
                console.error(err);
                result = "Error: Kernel Execution Failed.";
            }

            functionResponses.push({
                id: fc.id,
                name: fc.name,
                response: { result: result }
            });
        }

        // Send tool results back to model
        response = await chatRef.current.sendMessage(functionResponses);
      }

      if (response.text) {
        setLines(prev => [...prev, { type: 'output', content: response.text }]);
      }

    } catch (err) {
      setLines(prev => [...prev, { type: 'system', content: 'Error: Connection interrupted.' }]);
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-full z-[100] flex items-center justify-center pointer-events-none">
      {/* Draggable-like window centered */}
      <div className="w-[800px] h-[500px] bg-black/95 rounded-t-lg shadow-2xl overflow-hidden pointer-events-auto flex flex-col font-mono text-sm border border-neutral-800 relative">
        
        {/* OVERLAYS */}
        {showManual && <TerminalManual onClose={() => setShowManual(false)} />}
        {showCheatSheet && <TerminalCheatSheet onClose={() => setShowCheatSheet(false)} />}

        {/* Title Bar */}
        <div className="h-8 bg-[#1a1a1a] flex items-center justify-between px-3 border-b border-neutral-800 select-none">
          <div className="flex items-center gap-2">
             <span className="text-gray-400 font-bold">root@velvetops:~</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setShowCheatSheet(!showCheatSheet)}
                className="text-green-500 hover:text-green-300 font-bold px-2 border border-green-900 bg-green-900/20 text-xs"
                title="Open Cheat Sheet [F1]"
            >
                [F1] CHEATSHEET
            </button>
            <button 
                onClick={() => setShowManual(!showManual)} 
                className="text-gray-500 hover:text-gray-300 font-bold px-2 border border-gray-800 bg-gray-900/20 text-xs"
                title="Open Command Manual"
            >
                [?] MAN
            </button>
            <div className="flex gap-2 ml-2">
                <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600"></button>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>

        {/* Terminal Body */}
        <div 
            ref={scrollRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-[13px] leading-5 custom-scrollbar"
            onClick={() => document.getElementById('terminal-input')?.focus()}
        >
          {lines.map((line, idx) => (
            <div key={idx} className={`${line.type === 'system' ? 'text-gray-500' : line.type === 'input' ? 'text-white' : 'text-green-500'} mb-1 break-words whitespace-pre-wrap`}>
              {line.type === 'input' && (
                <span className="text-blue-500 font-bold mr-2">
                  ┌──(root💀velvetops)-[~]<br/>
                  └─#
                </span>
              )}
              {line.content}
            </div>
          ))}
          {isProcessing && (
              <div className="animate-pulse text-green-700">_ processing root command...</div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-black p-2 flex items-center gap-2 border-t border-neutral-800 relative">
            <span className="text-blue-500 font-bold whitespace-nowrap z-20">└─#</span>
            
            <div className="flex-1 relative">
                {/* Ghost Text (Suggestion) */}
                {suggestion && enableAutocomplete && (
                   <div className="absolute inset-0 text-gray-600 pointer-events-none whitespace-pre font-mono bg-transparent z-0 truncate">
                      <span className="opacity-0">{input}</span>{suggestion.slice(input.length)}
                   </div>
                )}

                <input 
                    id="terminal-input"
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    autoComplete="off"
                    autoFocus
                    className="w-full bg-transparent outline-none text-white border-none focus:ring-0 placeholder-gray-700 relative z-10 font-mono"
                    placeholder="Enter command..."
                />
            </div>
            
            {/* Enter Hint */}
            {suggestion && enableAutocomplete && (
                <div className="absolute right-4 text-[10px] text-gray-500 animate-pulse hidden md:block z-20">
                    [TAB] to Complete
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
