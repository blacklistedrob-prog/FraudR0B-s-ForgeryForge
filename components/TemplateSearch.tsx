
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { AgentStatus } from '../types';

interface TemplateSearchProps {
  onSearchAndFabricate: (query: string, logUpdate: (msg: string) => void, statusUpdate: (status: Partial<AgentStatus>) => void) => Promise<void>;
  isLoading: boolean;
}

export const TemplateSearch: React.FC<TemplateSearchProps> = ({ onSearchAndFabricate, isLoading }) => {
  const [query, setQuery] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
      hunter: 'idle',
      architect: 'idle',
      forge: 'idle'
  });
  
  // Progress State
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Countdown & Progress Logic
  useEffect(() => {
    let interval: any;
    if (isLoading) {
        // Reset if starting fresh
        if (progress === 0 && timeLeft === 25) {
             setLogs(['INITIALIZING GOD MODE PROTOCOL...', 'ALLOCATING NEURAL RESOURCES...']);
        }

        interval = setInterval(() => {
            setTimeLeft(prev => Math.max(0, prev - 1));
        }, 1000);
        
        // Dynamic Progress Interpolation based on Agent Status
        let target = 5;
        if (agentStatus.hunter === 'scanning') target = 15;
        if (agentStatus.hunter === 'locked') target = 35;
        if (agentStatus.architect === 'designing') target = 55;
        if (agentStatus.architect === 'complete') target = 70;
        if (agentStatus.forge === 'rendering') target = 90;
        if (agentStatus.forge === 'complete') target = 100;

        setProgress(prev => {
            if (prev >= target) return prev;
            return prev + 1; // Smoothly increment to target
        });

    } else {
        // Reset when done
        if (progress > 0 && progress < 100) {
             setProgress(0);
             setTimeLeft(25);
        }
    }
    return () => clearInterval(interval);
  }, [isLoading, agentStatus, progress]);

  // Auto-scroll logs
  useEffect(() => {
      if (logContainerRef.current) {
          logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
  }, [logs]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLogs([]);
    setAgentStatus({ hunter: 'idle', architect: 'idle', forge: 'idle' });
    setProgress(0);
    setTimeLeft(25);
    
    // Wrappers to update local state
    const logUpdate = (msg: string) => {
        setLogs(prev => [...prev, msg]);
    };
    
    const statusUpdate = (status: Partial<AgentStatus>) => {
        setAgentStatus(prev => ({ ...prev, ...status }));
    };

    await onSearchAndFabricate(query, logUpdate, statusUpdate);
  };

  // Helper to get status color
  const getStatusColor = (status: string) => {
      if (status === 'idle') return 'text-slate-600 border-slate-800 bg-black/40 opacity-50';
      if (status === 'scanning' || status === 'designing' || status === 'rendering') return 'text-yellow-500 border-yellow-500 bg-yellow-900/20 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.2)]';
      if (status === 'locked' || status === 'complete') return 'text-green-500 border-green-500 bg-green-900/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]';
      if (status === 'failed') return 'text-red-500 border-red-500 bg-red-900/20';
      return 'text-slate-600';
  };

  if (isLoading) {
      return (
          <div className="w-full max-w-3xl mx-auto mt-8 font-mono animate-in fade-in zoom-in duration-500">
              <div className="bg-black/95 border-2 border-green-600 shadow-[0_0_100px_rgba(34,197,94,0.15)] relative overflow-hidden p-8 flex flex-col gap-6">
                  
                  {/* Decorative Background Elements */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-shimmer"></div>
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>

                  {/* Header Status */}
                  <div className="flex justify-between items-end border-b border-green-900 pb-4 relative z-10">
                      <div>
                          <h2 className="text-3xl font-black text-white tracking-tighter mb-1 font-['VT323']">
                              GOD_MODE <span className="text-green-500">ACTIVE</span>
                          </h2>
                          <p className="text-xs text-green-700 tracking-[0.4em] uppercase">
                              Fabricating Asset: "{query}"
                          </p>
                      </div>
                      <div className="text-right">
                          <div className="text-4xl font-mono font-bold text-green-500 tabular-nums leading-none">
                              T-{timeLeft.toString().padStart(2, '0')}s
                          </div>
                          <div className="text-[10px] text-green-800 uppercase tracking-widest mt-1">Est. Completion</div>
                      </div>
                  </div>

                  {/* Central Progress Visualization */}
                  <div className="relative z-10 py-4">
                      {/* Bar Container */}
                      <div className="h-4 bg-green-950/30 border border-green-900 rounded-sm overflow-hidden relative">
                          {/* Fill */}
                          <div 
                              className="h-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.8)] transition-all duration-300 ease-out relative"
                              style={{ width: `${progress}%` }}
                          >
                              <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.3)_25%,rgba(0,0,0,0.3)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.3)_75%)] bg-[size:10px_10px] animate-stripes"></div>
                          </div>
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] font-bold text-green-700 uppercase tracking-widest">
                          <span>Initiated</span>
                          <span>{progress}% Complete</span>
                      </div>
                  </div>

                  {/* Agent Cards */}
                  <div className="grid grid-cols-3 gap-4 relative z-10">
                      {/* Hunter */}
                      <div className={`border p-4 flex flex-col items-center justify-center transition-all duration-500 ${getStatusColor(agentStatus.hunter)}`}>
                          <div className="text-[10px] uppercase tracking-widest mb-2 opacity-80">AGENT HUNTER</div>
                          <div className="text-2xl mb-2">👁</div>
                          <div className="text-xs font-bold text-center">
                              {agentStatus.hunter === 'idle' && 'WAITING'}
                              {agentStatus.hunter === 'scanning' && 'SCANNING WEB...'}
                              {agentStatus.hunter === 'locked' && 'VISUALS ACQUIRED'}
                              {agentStatus.hunter === 'failed' && 'OFFLINE'}
                          </div>
                      </div>

                      {/* Architect */}
                      <div className={`border p-4 flex flex-col items-center justify-center transition-all duration-500 ${getStatusColor(agentStatus.architect)}`}>
                          <div className="text-[10px] uppercase tracking-widest mb-2 opacity-80">AGENT ARCHITECT</div>
                          <div className="text-2xl mb-2">📐</div>
                          <div className="text-xs font-bold text-center">
                              {agentStatus.architect === 'idle' && 'WAITING'}
                              {agentStatus.architect === 'designing' && 'DRAFTING BLUEPRINT...'}
                              {agentStatus.architect === 'complete' && 'BLUEPRINT READY'}
                          </div>
                      </div>

                      {/* Forge */}
                      <div className={`border p-4 flex flex-col items-center justify-center transition-all duration-500 ${getStatusColor(agentStatus.forge)}`}>
                          <div className="text-[10px] uppercase tracking-widest mb-2 opacity-80">AGENT FORGE</div>
                          <div className="text-2xl mb-2">⚡</div>
                          <div className="text-xs font-bold text-center">
                              {agentStatus.forge === 'idle' && 'WAITING'}
                              {agentStatus.forge === 'rendering' && 'SYNTHESIZING...'}
                              {agentStatus.forge === 'complete' && 'ASSET CREATED'}
                          </div>
                      </div>
                  </div>

                  {/* Terminal Output */}
                  <div className="bg-black border border-green-900/50 p-4 relative z-10 h-32 flex flex-col">
                      <div className="text-[9px] text-green-800 border-b border-green-900/30 pb-1 mb-2 uppercase tracking-widest flex justify-between">
                          <span>System Log</span>
                          <span>Live Feed</span>
                      </div>
                      <div 
                          ref={logContainerRef}
                          className="flex-1 overflow-y-auto font-mono text-[10px] custom-scrollbar space-y-1"
                      >
                          {logs.map((log, i) => (
                              <div key={i} className={`font-mono ${log.includes('ERROR') ? 'text-red-500' : 'text-green-400'}`}>
                                  <span className="opacity-30 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                  {log}
                              </div>
                          ))}
                          <div className="animate-pulse text-green-500">_</div>
                      </div>
                  </div>

              </div>
          </div>
      );
  }

  // DEFAULT VIEW (INPUT)
  return (
    <div className="w-full max-w-3xl mx-auto mt-8 relative group font-mono">
        <div className="flex items-center gap-4 mb-2">
            <div className="h-px flex-1 bg-green-900/50"></div>
            <span className="text-[10px] text-green-700 uppercase tracking-[0.3em]">GOD_MODE // FABRICATOR</span>
            <div className="h-px flex-1 bg-green-900/50"></div>
        </div>

        <div className="border border-green-900 bg-black/90 backdrop-blur-md p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)] hover:border-green-600 transition-colors duration-500">
            
            {/* Input Section */}
            <div className="flex mb-2 relative shadow-lg">
                <div className="bg-green-950/20 px-4 py-4 border border-green-800 border-r-0 flex items-center">
                    <span className="text-green-500 font-bold text-xs tracking-widest">TARGET_ASSET:</span>
                </div>
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter document name (e.g., 'California Drivers License 2025', 'Form 1040')..."
                    className="flex-1 bg-black border border-green-800 px-4 py-3 text-sm text-green-100 placeholder-green-900/50 outline-none focus:border-green-500 transition-colors font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                    onClick={handleSearch} 
                    disabled={!query}
                    className="rounded-none border-l-0 h-auto px-8 bg-green-900/10 hover:bg-green-500 hover:text-black border-green-800"
                >
                    [ INITIATE ]
                </Button>
            </div>
            <p className="text-[10px] text-green-800/60 text-right mt-2 uppercase tracking-wide">
                Warning: High-Resolution Generation consumes significant resources.
            </p>
            
            {/* Decorative Scanline */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(transparent_50%,rgba(0,255,0,0.02)_50%)] bg-[size:100%_4px]"></div>
        </div>
    </div>
  );
};
