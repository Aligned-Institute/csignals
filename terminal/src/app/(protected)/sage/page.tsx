'use client';

import { useState } from 'react';
import { PersonaSelector } from '@/components/sage/PersonaSelector';
import { ChatInterface } from '@/components/sage/ChatInterface';
import { Persona } from '@/lib/sageFlows';
import { Button } from '@/components/ui/button';
import { Terminal, X } from 'lucide-react';

export default function SagePage() {
    const [persona, setPersona] = useState<Persona | null>(null);
    const [consoleOpen, setConsoleOpen] = useState(false);
    const [synthesisModel, setSynthesisModel] = useState<'Internal' | 'External1' | 'External2'>('Internal');
    const [logs, setLogs] = useState<string[]>([
        "[SYSTEM] Sage Router initialized. Connected to local gemma2:2b.",
        "[SYSTEM] Awaiting user session..."
    ]);

    const addLog = (log: string) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${log}`]);
    };

    return (
        <div className="animate-page-in h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-6 flex-none flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] bg-clip-text text-transparent">
                        Sage Analysis
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Structured evaluation for the AI ecosystem.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Model Dropdown */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider select-none">Model:</span>
                        <select
                            value={synthesisModel}
                            onChange={(e) => {
                                const newModel = e.target.value as 'Internal' | 'External1' | 'External2';
                                setSynthesisModel(newModel);
                                addLog(`[SYSTEM] Switched synthesis engine to ${newModel}.`);
                            }}
                            className="bg-sidebar border border-sidebar-border text-foreground text-xs rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00f3ff]/40 font-mono cursor-pointer"
                        >
                            <option value="Internal">Internal</option>
                            <option value="External1">External 1</option>
                            <option value="External2">External 2</option>
                        </select>
                    </div>

                    {/* Console Toggle Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setConsoleOpen(!consoleOpen)}
                        className="gap-1.5 border-[#00f3ff]/30 hover:border-[#00f3ff]/50 hover:bg-[#00f3ff]/10 text-[#00f3ff] transition-all font-mono text-xs shadow-none cursor-pointer"
                    >
                        <Terminal className="size-4" />
                        <span>{consoleOpen ? 'Hide Console' : 'Console/Toggle Terminal'}</span>
                    </Button>
                </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-6">
                <div className="flex-1 min-h-0 bg-sidebar rounded-xl border border-sidebar-border overflow-hidden flex flex-col relative shadow-lg glow-cyan/10">
                    {!persona ? (
                        <PersonaSelector onSelect={(p) => {
                            setPersona(p);
                            addLog(`[SYSTEM] Perspective selected: ${p.toUpperCase()}`);
                        }} />
                    ) : (
                        <ChatInterface 
                            persona={persona} 
                            onReset={() => {
                                setPersona(null);
                                addLog("[SYSTEM] Resetting evaluation perspective.");
                            }}
                            onAddLog={addLog}
                            consoleOpen={consoleOpen}
                            synthesisModel={synthesisModel}
                        />
                    )}
                </div>

                {/* System Log Console Panel */}
                {consoleOpen && (
                    <div className="w-80 md:w-96 bg-black/60 border border-sidebar-border rounded-xl flex flex-col h-full font-mono text-xs overflow-hidden shadow-lg glow-purple/10">
                        <div className="p-3 border-b border-sidebar-border flex items-center justify-between bg-sidebar/50">
                            <span className="text-[#00f3ff] font-semibold flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
                                <Terminal className="size-3.5" />
                                SYSTEM LOG CONSOLE
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setLogs([`[${new Date().toLocaleTimeString()}] [SYSTEM] Console cleared.`])} 
                                    className="text-muted-foreground hover:text-foreground text-[10px] cursor-pointer"
                                >
                                    Clear
                                </button>
                                <span className="text-muted-foreground">|</span>
                                <button onClick={() => setConsoleOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                                    <X className="size-3.5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin text-muted-foreground leading-relaxed whitespace-pre-wrap select-text">
                            {logs.map((log, index) => {
                                let color = "text-zinc-400";
                                if (log.includes("[SYSTEM]")) color = "text-cyan-400";
                                else if (log.includes("[iSLM]")) color = "text-purple-400 font-semibold";
                                else if (log.includes("[RAG]")) color = "text-violet-400";
                                else if (log.includes("[MCP]")) color = "text-yellow-400";
                                else if (log.includes("[MODEL]")) color = "text-green-400 font-mono";
                                else if (log.includes("[USER]")) color = "text-zinc-200 font-medium";
                                
                                return (
                                    <div key={index} className={`${color} border-b border-white/5 pb-1`}>
                                        {log}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
