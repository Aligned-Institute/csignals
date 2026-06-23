'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Persona, SageQA, getFlow } from '@/lib/sageFlows';
import {
  Send,
  ArrowLeft,
  Loader2,
  FileText,
  CheckCircle2,
  Sparkles,
  Terminal,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  pillar?: string;
  thinking?: string;
  sources?: { name: string; text: string; score: number }[];
  routing?: {
    route: string;
    agents: string[];
    reasoning: string;
    confidence: number;
  };
  latency_ms?: number;
}

// Custom simple markdown inline parser
function parseInline(text: string) {
  const boldParts = text.split(/\*\*/);
  return boldParts.map((part, i) => {
    const isBold = i % 2 === 1;
    const codeParts = part.split(/`/);
    const renderedCode = codeParts.map((subPart, j) => {
      const isCode = j % 2 === 1;
      if (isCode) {
        return (
          <code
            key={j}
            className="bg-black/30 px-1.5 py-0.5 rounded font-mono text-xs text-[#00f3ff] border border-sidebar-border"
          >
            {subPart}
          </code>
        );
      }
      return subPart;
    });
    if (isBold) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {renderedCode}
        </strong>
      );
    }
    return <span key={i}>{renderedCode}</span>;
  });
}

// Custom simple markdown block renderer
function renderMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('```')) {
      return null;
    }
    if (line.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-sm font-semibold text-[#00f3ff] mt-3 mb-1.5">
          {parseInline(line.substring(4))}
        </h4>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-base font-bold text-foreground mt-4 mb-2">
          {parseInline(line.substring(3))}
        </h3>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h2 key={idx} className="text-lg font-extrabold text-foreground mt-4 mb-2">
          {parseInline(line.substring(2))}
        </h2>
      );
    }
    if (line.trim() === '---' || line.trim() === '***') {
      return <hr key={idx} className="border-sidebar-border my-4" />;
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      return (
        <li key={idx} className="ml-4 list-disc text-sm leading-relaxed mb-1">
          {parseInline(line.substring(2))}
        </li>
      );
    }
    if (line.trim() === '') {
      return <div key={idx} className="h-2" />;
    }
    return (
      <p key={idx} className="text-sm leading-relaxed mb-2">
        {parseInline(line)}
      </p>
    );
  });
}

export function ChatInterface({ persona, onReset, onAddLog, consoleOpen, synthesisModel }: { persona: Persona; onReset: () => void; onAddLog?: (log: string) => void; consoleOpen?: boolean; synthesisModel?: 'Internal' | 'External1' | 'External2' }) {
  const router = useRouter();
  const isInteractive = persona === 'interactive';

  // Guided evaluation states
  const [flow] = useState<SageQA[]>(() => (isInteractive ? [] : getFlow(persona)));
  const [currentIndex, setCurrentIndex] = useState(0);

  // Messages init
  const [messages, setMessages] = useState<Message[]>(() => {
    if (isInteractive) {
      return [
        {
          role: 'assistant',
          content:
            'Hello! I am Sage, your private ChemSignals market intelligence assistant. Ask me anything about competitor intelligence reports (RAG), live commodity prices (MCP), or feedstock value chain dynamics. You can download the [EIA Spot Prices Sample Dataset](/api/download/sample) to test my data analysis capabilities.',
        },
      ];
    } else {
      return [{ role: 'assistant', content: flow[0].question, pillar: flow[0].pillar }];
    }
  });

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [expandedThinking, setExpandedThinking] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating, isComplete]);

  const toggleThinking = (index: number) => {
    setExpandedThinking((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput('');

    // 1. Add User Message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsGenerating(true);
    onAddLog?.(`[USER] Sent: "${userMessage}"`);

    if (isInteractive) {
      onAddLog?.(`[iSLM] Requesting routing classification from gemma2:2b...`);
      onAddLog?.(`[iSLM] Target synthesis engine: ${synthesisModel || 'Internal'}`);
      // INTERACTIVE MODE: Query the FastAPI backend via Next.js proxy
      try {
        const response = await fetch('/api/sage/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: userMessage, model: synthesisModel }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to communicate with Sage API');
        }

        const data = await response.json();
        
        if (data.routing_decision) {
          const dec = data.routing_decision;
          onAddLog?.(`[iSLM] ROUTE: ${dec.route.toUpperCase()} (Confidence: ${(dec.confidence * 100).toFixed(0)}%)`);
          if (dec.agents && dec.agents.length > 0) {
            onAddLog?.(`[iSLM] ACTIVE AGENTS: ${dec.agents.join(', ')}`);
          }
          onAddLog?.(`[iSLM] REASONING: ${dec.reasoning}`);
        }
        
        if (data.sources && data.sources.length > 0) {
          onAddLog?.(`[RAG] Retrieved ${data.sources.length} matching corporate records:`);
          data.sources.forEach((src: any) => {
            onAddLog?.(`[RAG]   * "${src.name}" (similarity matching: ${src.score})`);
          });
        }
        
        if (data.thinking) {
          onAddLog?.(`[MODEL] REASONING:\n${data.thinking}`);
        }
        
        onAddLog?.(`[SYSTEM] Response synthesized successfully in ${data.latency_ms}ms.`);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.answer,
            thinking: data.thinking,
            sources: data.sources,
            routing: data.routing_decision,
            latency_ms: data.latency_ms,
          },
        ]);
      } catch (err: any) {
        console.error(err);
        onAddLog?.(`[SYSTEM] ERROR: Failed to execute query. Details: ${err.message || 'Unknown error'}`);
        toast.error(err.message || 'Error communicating with Sage.');
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `**Query execution failed.** Please ensure the FastAPI backend is running on port 8000 and Ollama has the correct models loaded. Error details: \`${err.message || 'Unknown error'}\``,
          },
        ]);
      } finally {
        setIsGenerating(false);
      }
    } else {
      // GUIDED QUESTIONNAIRE MODE
      onAddLog?.(`[USER] Answered: "${userMessage}"`);
      flow[currentIndex].response = userMessage;
      await new Promise((res) => setTimeout(res, 500));

      if (currentIndex + 1 < flow.length) {
        const nextQ = flow[currentIndex + 1];
        setCurrentIndex((prev) => prev + 1);
        onAddLog?.(`[SYSTEM] Questionnaire update: rendering step ${currentIndex + 2} of ${flow.length}: "${nextQ.question}"`);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: nextQ.question, pillar: nextQ.pillar },
        ]);
        setIsGenerating(false);
      } else {
        // Complete guided flow
        onAddLog?.(`[SYSTEM] Guided questionnaire successfully completed.`);
        setIsGenerating(false);
        generateReport();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    onAddLog?.(`[SYSTEM] Generating briefing summary via deepseek-r1:8b synthesis...`);
    try {
      const response = await fetch('/api/sage/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona, flow }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      setIsComplete(true);
      onAddLog?.(`[SYSTEM] Briefing document generated and saved to Portfolio successfully.`);
      toast.success('Analysis document generated and saved to Portfolio!');
    } catch (err: any) {
      console.error(err);
      onAddLog?.(`[SYSTEM] ERROR: Failed to generate briefing document. Details: ${err.message || 'Unknown error'}`);
      toast.error('Error generating document. Check console.');
      setIsComplete(true); // Soft-fail to allow testing UI easily
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-none p-4 border-b border-sidebar-border flex items-center justify-between bg-sidebar/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="text-sm font-medium">
            {isInteractive ? (
              <span className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#00f3ff]" />
                Interactive Sage Chat
              </span>
            ) : persona === 'investor' ? (
              'Asset Evaluation'
            ) : (
              'Due Diligence'
            )}
            {!isInteractive && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                {currentIndex + 1} of {flow.length}
              </span>
            )}
          </div>
        </div>
        {!isInteractive && (
          <div className="h-1.5 w-32 bg-sidebar-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] transition-all duration-300"
              style={{
                width: `${Math.max(
                  5,
                  ((currentIndex + (isComplete ? 1 : 0)) / flow.length) * 100,
                )}%`,
              }}
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {messages.map((msg, i) => {
          const isAssistant = msg.role === 'assistant';
          const isThinkingExpanded = expandedThinking[i] ?? false;

          return (
            <div key={i} className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-[90%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm ${
                  isAssistant
                    ? 'bg-sidebar-accent text-sidebar-foreground border border-sidebar-border rounded-bl-sm'
                    : 'bg-primary text-primary-foreground rounded-br-sm'
                }`}
              >
                {msg.pillar && (
                  <div className="text-[10px] uppercase tracking-wider font-semibold opacity-60 mb-1.5 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#bd00ff]"></div>
                    {msg.pillar}
                  </div>
                )}

                {/* Routing & Metadata details for Assistant */}
                {isAssistant && msg.routing && (
                  <div className="flex flex-wrap items-center gap-2 mb-2 pb-2 border-b border-sidebar-border/30 text-[10px] font-mono select-none">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Cpu className="size-3 text-[#bd00ff]" />
                      Route:
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold uppercase ${
                        msg.routing.route === 'rag'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : msg.routing.route === 'mcp'
                          ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                          : msg.routing.route === 'hybrid'
                          ? 'bg-gradient-to-r from-[#00f3ff]/10 to-[#bd00ff]/10 text-[#00f3ff] border border-[#00f3ff]/30'
                          : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                      }`}
                    >
                      {msg.routing.route}
                    </span>
                    {msg.routing.agents && msg.routing.agents.length > 0 && (
                      <>
                        <span className="text-muted-foreground ml-1">Agents:</span>
                        {msg.routing.agents.map((agent) => (
                          <span
                            key={agent}
                            className="bg-black/30 px-1 py-0.5 rounded text-muted-foreground/80 border border-sidebar-border/50"
                          >
                            {agent}
                          </span>
                        ))}
                      </>
                    )}
                    {msg.latency_ms && (
                      <span className="text-muted-foreground/60 ml-auto">
                        {msg.latency_ms.toLocaleString()}ms
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsible reasoning tags */}
                {isAssistant && msg.thinking && (
                  <div className="mb-3 bg-black/40 border border-sidebar-border rounded-lg overflow-hidden font-mono">
                    <button
                      onClick={() => toggleThinking(i)}
                      className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] text-muted-foreground/80 hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
                    >
                      <span className="flex items-center gap-1.5">
                        <Terminal className="size-3.5 text-[#00f3ff]" />
                        {isThinkingExpanded
                          ? 'Collapse Reasoning Chain'
                          : 'Expand Reasoning Chain'}
                      </span>
                      {isThinkingExpanded ? (
                        <ChevronUp className="size-3.5" />
                      ) : (
                        <ChevronDown className="size-3.5" />
                      )}
                    </button>
                    {isThinkingExpanded && (
                      <div className="p-3 border-t border-sidebar-border/40 text-[10px] leading-relaxed text-muted-foreground/75 overflow-x-auto whitespace-pre-wrap max-h-56 scrollbar-thin">
                        {msg.thinking}
                      </div>
                    )}
                  </div>
                )}

                {/* Main Content */}
                <div className="space-y-1">
                  {isInteractive && isAssistant
                    ? renderMarkdown(msg.content)
                    : <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>}
                </div>

                {/* Source Citations */}
                {isAssistant && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-sidebar-border/30 text-[11px]">
                    <div className="flex items-center gap-1 text-muted-foreground mb-1.5 font-medium">
                      <BookOpen className="size-3 text-[#00f3ff]" />
                      Retrieved Competitor Filings (RAG):
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, sIdx) => (
                        <div
                          key={sIdx}
                          title={src.text}
                          className="bg-black/30 border border-sidebar-border/50 text-muted-foreground/90 px-2 py-0.5 rounded flex items-center gap-1 select-none"
                        >
                          <span className="font-semibold text-foreground">{src.name}</span>
                          <span className="text-[9px] text-[#00f3ff] bg-[#00f3ff]/5 px-1 py-0.1 rounded border border-[#00f3ff]/10">
                            Sim: {src.score.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-sidebar-accent border border-sidebar-border text-sidebar-foreground px-4 py-3 rounded-2xl rounded-bl-sm text-sm flex items-center gap-3 shadow-sm">
              <Loader2 className="size-4 animate-spin text-[#00f3ff]" />
              {isInteractive
                ? 'Sage is reasoning...'
                : 'Compiling your responses into a final Analysis Document...'}
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex justify-center mt-8 pb-4">
            <div className="bg-gradient-to-br from-sidebar-accent to-sidebar-accent/50 border border-sidebar-border p-6 rounded-xl max-w-sm text-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f3ff]/10 to-[#bd00ff]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CheckCircle2 className="size-10 text-[#00f3ff] mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-1">Analysis Complete</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your answers have been synthesized into a final report.
              </p>
              <Button
                className="w-full bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/30 shadow-none"
                onClick={() => router.push('/portfolio')}
              >
                <FileText className="size-4 mr-2" />
                View in Portfolio
              </Button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-none p-4 pt-2 bg-sidebar border-t border-sidebar-border">
        <label className="sr-only">Your answer</label>
        <div className="relative flex items-end shadow-sm">
          <textarea
            className="w-full min-h-[56px] max-h-[200px] bg-background border border-sidebar-border rounded-xl text-sm px-4 py-3 pr-14 resize-none focus:outline-none focus:ring-1 focus:ring-[#00f3ff]/50 disabled:opacity-50 transition-all placeholder:text-muted-foreground/60"
            placeholder={
              isComplete
                ? 'Analysis finished.'
                : isInteractive
                ? 'Ask Sage (e.g. "What is Huntsman\'s contract pricing methodology?")'
                : 'Type your answer...'
            }
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
            }}
            onKeyDown={handleKeyDown}
            disabled={isGenerating || isComplete}
          />
          <Button
            size="icon"
            className="absolute right-2 top-[10px] h-[36px] w-[36px] bg-[#bd00ff] hover:bg-[#bd00ff]/90 text-white rounded-lg disabled:bg-sidebar-accent disabled:text-muted-foreground transition-colors shadow-none"
            onClick={handleSend}
            disabled={!input.trim() || isGenerating || isComplete}
          >
            <Send className="size-4" />
          </Button>
        </div>
        <div className="text-center mt-2">
          <span className="text-[10px] text-muted-foreground">
            Press <kbd className="font-mono bg-sidebar-accent px-1 rounded">Shift + Enter</kbd> for
            new line. Hit <kbd className="font-mono bg-sidebar-accent px-1 rounded">Enter</kbd> to
            send.
          </span>
        </div>
      </div>
    </div>
  );
}
