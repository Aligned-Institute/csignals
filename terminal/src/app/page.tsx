'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Cpu,
  Database,
  Network,
  ArrowRight,
  Sparkles,
  Shield,
  Activity,
  FileText,
  LineChart,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

const features = [
  {
    icon: Cpu,
    title: 'iSLM Router',
    desc: 'Local routing model (Gemma-2-2B) that deterministically classifies queries into RAG, MCP, or Hybrid pathways.',
    color: 'text-[#00f3ff]',
    bg: 'bg-[#00f3ff]/5 border-[#00f3ff]/20',
  },
  {
    icon: Database,
    title: 'Private Vector RAG',
    desc: 'Strictly local document indexing (PDF/Markdown) of Huntsman and competitor earnings, manuals, and feedstock methodologies.',
    color: 'text-[#bd00ff]',
    bg: 'bg-[#bd00ff]/5 border-[#bd00ff]/20',
  },
  {
    icon: Network,
    title: 'MCP Live Data Agents',
    desc: 'Real-time telemetry integration with FRED macro indicators, yfinance spot tickers, and RSS chemical news feeds.',
    color: 'text-[#00ff9d]',
    bg: 'bg-[#00ff9d]/5 border-[#00ff9d]/20',
  },
  {
    icon: Activity,
    title: 'Feedstock Cost Maps',
    desc: 'Mathematical tracking of upstream crude derivatives (Crude → Naphtha → Benzene → Aniline → MDI) to predict margin changes.',
    color: 'text-[#ffd000]',
    bg: 'bg-[#ffd000]/5 border-[#ffd000]/20',
  },
];

const dashboardLinks = [
  { href: '/dashboard', label: 'Market Terminal', desc: 'Real-time commodity cards, news ticker, and feedstock maps', icon: LineChart },
  { href: '/leaderboard', label: 'Signal Board', desc: 'Composite model safety scoring and anomaly flags', icon: Shield },
  { href: '/sage', label: 'Interactive Sage', desc: 'Chat privately with RAG document stores and live data engines', icon: Sparkles },
  { href: '/ecosystem', label: 'Value Chain', desc: '4-segment interactive chemical industry supply inspector', icon: Network },
  { href: '/portfolio', label: 'Brief Archive', desc: 'Access generated Monday market intelligence briefs', icon: FileText },
];

const faqItems = [
  {
    q: 'What exact problem does ChemSignals solve?',
    a: 'ChemSignals automates the manual "Monday Morning Tax" on strategic thinking. Instead of analysts manually extracting data, normalising units, and rebuilding pivot tables, ChemSignals unifies internal enterprise data and external market feeds in under 30 seconds with zero manual friction.',
  },
  {
    q: 'How does the iSLM Intelligent Router work?',
    a: 'The core of the architecture is an internal Small Language Model (iSLM) running locally. The router classifies incoming queries at temperature 0.0, routing them to local static document databases (RAG), live external APIs (MCP), or combining both (Hybrid).',
  },
  {
    q: 'How do you guarantee corporate data privacy?',
    a: 'We enforce complete Data Locality. The local iSLM, RAG vector database (embedded in the local workspace), and MCP agents run entirely inside the enterprise\'s private cloud VPC. No proprietary document chunks, procurement costs, or search queries are sent to external, shared AI APIs.',
  },
  {
    q: 'What role does the Model Context Protocol (MCP) play?',
    a: 'MCP serves as a unified connector standard. Instead of writing custom API wrappers for every source, MCP allows the platform\'s orchestration layer to query live external market feeds (yfinance, FRED, RSS news) dynamically using the same model-accessible interface.',
  },
  {
    q: 'How does the platform eliminate model hallucinations?',
    a: 'Hallucinations are eliminated by decoupling routing from synthesis. The routing model selects only verified context from RAG (static docs) and MCP (live feeds). The synthesis layer (DeepSeek-R1) receives this verified context and attributes every metric back to its original source document.',
  },
];

export default function Home() {
  const { light, toggle } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden select-none">
      {/* HUD Scanline & Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,243,255,0.03),transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,white,transparent_80%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-border bg-background/50 backdrop-blur-md">
        <div className="flex items-center justify-between max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/asi-logo.png"
              alt="ASI Logo"
              width={26}
              height={26}
              className="brightness-90 contrast-125"
            />
            <span className="text-lg font-bold text-foreground font-mono tracking-wider">
              ASI <span className="text-[#00f3ff]">CHEMSIGNALS</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground text-sm font-medium">
              <Link href="/dashboard">Direct Terminal Access</Link>
            </Button>
            <Button variant="outline" asChild className="border-border hover:bg-sidebar-accent font-medium text-sm">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] hover:opacity-90 text-black font-semibold text-sm border-none shadow-cyan/20">
              <Link href="/dashboard">Launch App</Link>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="border-border hover:bg-sidebar-accent"
            >
              {light ? <Moon className="size-4" /> : <Sun className="size-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-6xl mx-auto px-6 space-y-28 pb-24 pt-16">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight tracking-tight text-foreground font-sans">
            Data Alignment for<br />
            <span className="bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] bg-clip-text text-transparent">
              Chemical Market Intelligence
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Bridge the gap between private enterprise document stores and live feedstock telemetry. Runs 100% privately and offline via local inference models.
          </p>
          <div className="flex flex-wrap gap-4 justify-center pt-2">
            <Button size="lg" asChild className="bg-[#00f3ff] text-black font-semibold hover:bg-[#00f3ff]/90 px-8 shadow-lg shadow-[#00f3ff]/10">
              <Link href="/dashboard">
                Launch Terminal
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-border hover:bg-sidebar-accent px-8">
              <Link href="/sage">Talk to Sage AI</Link>
            </Button>
          </div>
        </section>

        {/* Direct Dashboard Links (New Feature requested by USER) */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-[#00f3ff]" />
            <h2 className="text-xs uppercase tracking-widest font-mono text-muted-foreground">Terminal Navigation Hub</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group block p-6 rounded-xl border border-border bg-card/40 hover:bg-sidebar-accent/50 hover:border-[#00f3ff]/30 transition-all duration-200 shadow-md relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#00f3ff]">
                    <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <Icon className="size-8 text-[#00f3ff] mb-4 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="text-base font-semibold text-foreground mb-1.5">{link.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{link.desc}</p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ChemSignals Architecture (iSLM / RAG / MCP) */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Unified Three-Layer AI Architecture</h2>
            <p className="text-sm text-muted-foreground">
              Every query is intelligently routed and answered dynamically from localized, verified context pools.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className={`rounded-xl border p-6 flex flex-col space-y-4 bg-card/20 shadow-sm ${f.bg}`}>
                  <div className={`p-2.5 rounded-lg w-fit ${f.color} bg-white/5 border border-white/5`}>
                    <Icon className="size-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Interactive FAQ Section (Accords HTML R&D documentation) */}
        <section className="space-y-8 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Platform FAQ</h2>
            <p className="text-sm text-muted-foreground">Rigorous details regarding enterprise security, routing, and data privacy.</p>
          </div>
          <div className="space-y-3">
            {faqItems.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-card/30 overflow-hidden transition-colors hover:border-[#00f3ff]/20"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-medium text-sm sm:text-base text-foreground hover:bg-sidebar-accent/30 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="size-5 text-[#00f3ff]" />
                    ) : (
                      <ChevronDown className="size-5 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/20 bg-black/10 animate-page-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center pt-12 border-t border-border/55 space-y-6">
          <Image
            src="/asi-logo.png"
            alt="ASI Institute"
            width={60}
            height={60}
            className="mx-auto brightness-90 contrast-125"
          />
          <div className="space-y-2 text-xs sm:text-sm">
            <p className="text-muted-foreground">
              Built by the <span className="text-[#00f3ff] font-medium">Aligned Sovereign Intelligence Institute</span> for petrochemical manufacturers.
            </p>
            <p className="text-[11px] text-muted-foreground/60">
              ASI Signals Platform &copy; 2026. Confidential — Internal Distribution Only.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
