'use client';

import { useState } from 'react';
import {
  Layers, Cpu, Atom, Shirt, Factory, FlaskConical, Droplet, Flame, Home, Wind, Plane, ChevronRight, Info, AlertTriangle, ShieldAlert
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PipelineNode {
  label: string;
  name: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  marginPressure: 'Low' | 'Medium' | 'High' | 'Critical';
  logistics: string;
  huntsmanNotes: string;
}

interface Segment {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  status: string;
  statusVariant: 'success' | 'warning' | 'danger';
  pipeline: PipelineNode[];
}

const SEGMENTS: Segment[] = [
  {
    id: 'polyurethanes',
    title: 'Polyurethanes Division',
    subtitle: 'MDI Feedstock-to-Market Chain',
    icon: Layers,
    description: 'Huntsman’s crown jewel segment. Global leader in MDI formulations, targeting high-efficiency building insulation, automotive seating, and footwear soles.',
    status: 'Feedstock Alert: Benzene Up',
    statusVariant: 'danger',
    pipeline: [
      {
        label: 'Upstream Feedstock',
        name: 'Crude Oil & Naphtha',
        desc: 'Base hydrocarbon feedstocks (WTI/Brent spot linked)',
        icon: Droplet,
        marginPressure: 'High',
        logistics: 'Pipeline / Tankers',
        huntsmanNotes: 'Directly linked to Brent/WTI fluctuations. Price moves transmit to intermediates with a 2-3 week lag.'
      },
      {
        label: 'Intermediates',
        name: 'Benzene ➔ Aniline',
        desc: 'Processed chemical building blocks',
        icon: FlaskConical,
        marginPressure: 'Critical',
        logistics: 'Integrated Pipe / Rail',
        huntsmanNotes: 'World-scale aniline facility in Geismar, LA supplies Huntsman’s domestic polymeric MDI production.'
      },
      {
        label: 'Huntsman Specialty',
        name: 'Polymeric & Pure MDI',
        desc: 'Formulated isocyanates & polyols (Rubinate, Suprasec)',
        icon: Atom,
        marginPressure: 'Medium',
        logistics: 'Bulk Truck / Isotanks',
        huntsmanNotes: 'Customized specialty formulations sold based on value-in-use, shielding margins from raw material volatility.'
      },
      {
        label: 'Downstream End-Markets',
        name: 'Building Insulation & Auto',
        desc: 'Rigid foam panels, acoustic seating, footwear soles',
        icon: Home,
        marginPressure: 'Low',
        logistics: 'Finished Goods Freight',
        huntsmanNotes: 'Strong correlation to US Housing Starts (HOUST) and automotive industrial production index (INDPRO).'
      }
    ]
  },
  {
    id: 'performance_products',
    title: 'Performance Products',
    subtitle: 'Amines & Maleic Anhydride Chain',
    icon: Cpu,
    description: 'Produces specialty amines and maleic anhydride used in wind turbine composites, fuel/lubricant additives, crop protection, and personal care products.',
    status: 'Margin Outlook: Stable',
    statusVariant: 'success',
    pipeline: [
      {
        label: 'Upstream Feedstock',
        name: 'Natural Gas & Butane',
        desc: 'Primary energy & hydrocarbon feeds',
        icon: Flame,
        marginPressure: 'Medium',
        logistics: 'US Pipeline Grids',
        huntsmanNotes: 'Henry Hub natural gas pricing dictates plant utility overheads. Butane acts as the key input for maleic anhydride.'
      },
      {
        label: 'Intermediates',
        name: 'Ammonia & Ethylene Oxide',
        desc: 'Reactant building blocks',
        icon: FlaskConical,
        marginPressure: 'Medium',
        logistics: 'Railcar / Barge transport',
        huntsmanNotes: 'Ethylene oxide sourced via long-term contracts from Gulf Coast ethylene crackers.'
      },
      {
        label: 'Huntsman Specialty',
        name: 'Specialty Amines (Jeffamine)',
        desc: 'Polyetheramines, morpholine, ethyleneamines',
        icon: Cpu,
        marginPressure: 'Low',
        logistics: 'Drums / Bulk Tankers',
        huntsmanNotes: 'Huntsman holds dominant patent positions on Jeffamine polyetheramines, giving robust margin defense.'
      },
      {
        label: 'Downstream End-Markets',
        name: 'Wind Blades & SURF',
        desc: 'Epoxy wind composites, fuel additives, surfactants',
        icon: Wind,
        marginPressure: 'Low',
        logistics: 'Distribution Logistics',
        huntsmanNotes: 'Driven by renewable energy investments, wind blade manufacturing activity, and global consumer surfactant demand.'
      }
    ]
  },
  {
    id: 'advanced_materials',
    title: 'Advanced Materials',
    subtitle: 'High-Performance Epoxy Systems',
    icon: Atom,
    description: 'High-performance epoxy, acrylic, and polyurethane formulations. Custom engineered for structural lightweighting in aerospace, wind energy, and automotive composites.',
    status: 'Margin Outlook: Positive',
    statusVariant: 'success',
    pipeline: [
      {
        label: 'Upstream Feedstock',
        name: 'Benzene & Propylene',
        desc: 'Upstream refinery olefins & aromatics',
        icon: Droplet,
        marginPressure: 'High',
        logistics: 'Refinery Integration',
        huntsmanNotes: 'Olefins are volatile commodities. Global cracker operating rates determine base spot pricing.'
      },
      {
        label: 'Intermediates',
        name: 'BPA & Epichlorohydrin',
        desc: 'Epoxy resin monomers',
        icon: FlaskConical,
        marginPressure: 'Medium',
        logistics: 'Rail / Isotankers',
        huntsmanNotes: 'Bisphenol A (BPA) and Epichlorohydrin (ECH) pricing closely dictates base epoxy resin cost structures.'
      },
      {
        label: 'Huntsman Specialty',
        name: 'Araldite Epoxy Formulations',
        desc: 'Aerospace structural resins, curatives, adhesives',
        icon: ShieldAlert,
        marginPressure: 'Low',
        logistics: 'Specialized Air/Road Freight',
        huntsmanNotes: 'Araldite is a premier brand in aerospace structural composites, with strict qualified-supplier certification.'
      },
      {
        label: 'Downstream End-Markets',
        name: 'Aerospace & Automotive OEM',
        desc: 'Commercial aviation composites, structural adhesives',
        icon: Plane,
        marginPressure: 'Low',
        logistics: 'Cold Chain / Finished Logistics',
        huntsmanNotes: 'Long-term qualifications on Boeing 787 and Airbus A350 build cycles secure multi-year backlog stability.'
      }
    ]
  },
  {
    id: 'textile_effects',
    title: 'Textile Effects',
    subtitle: 'Dyes & Fabric Chemicals (Archroma Partner Feed)',
    icon: Shirt,
    description: 'Novacron dyes and specialty finishing agents. Sells water-repellent, flame-retardant, and performance textile chemicals. (Divested in 2023 to Archroma; operated under supply partner contract).',
    status: 'Partner Managed Feed',
    statusVariant: 'warning',
    pipeline: [
      {
        label: 'Upstream Feedstock',
        name: 'Petrochemical Aromatics',
        desc: 'Coal tar, aniline, and benzene derivatives',
        icon: Factory,
        marginPressure: 'Medium',
        logistics: 'Bulk Marine Cargo',
        huntsmanNotes: 'Primary feedstocks sourced from Asian refinery complexes.'
      },
      {
        label: 'Intermediates',
        name: 'Organic Colorants',
        desc: 'Dye intermediates and color bases',
        icon: FlaskConical,
        marginPressure: 'Low',
        logistics: 'Container Freight',
        huntsmanNotes: 'Sourced from cost-efficient production centers in India and China.'
      },
      {
        label: 'Specialty Formulations',
        name: 'Novacron Dyes & Chemicals',
        desc: 'Textile inks, water-resistance agents',
        icon: Shirt,
        marginPressure: 'Medium',
        logistics: 'Global Distribution Networks',
        huntsmanNotes: 'Archroma manages chemical synthesis. Huntsman maintains close technical collaboration for specialized technical end-uses.'
      },
      {
        label: 'Downstream End-Markets',
        name: 'Apparel & Technical Textiles',
        desc: 'Activewear, technical outerwear, home textiles',
        icon: Shirt,
        marginPressure: 'Medium',
        logistics: 'Global Apparel Supply Chain',
        huntsmanNotes: 'Highly sensitive to consumer discretionary spending and global textile manufacturing shifts in Southeast Asia.'
      }
    ]
  }
];

const PRESSURE_VARIANTS = {
  Low:      'border-green-500/30 bg-green-500/10 text-green-500',
  Medium:   'border-yellow-500/30 bg-yellow-500/10 text-yellow-500',
  High:      'border-orange-500/30 bg-orange-500/10 text-orange-500',
  Critical:  'border-red-500/30 bg-red-500/10 text-red-500',
};

const STATUS_BADGES = {
  success: 'border-green-500/30 bg-green-500/5 text-green-500',
  warning: 'border-yellow-500/30 bg-yellow-500/5 text-yellow-500',
  danger:  'border-red-500/30 bg-red-500/5 text-red-500',
};

export default function EcosystemPage() {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('polyurethanes');
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number>(1); // Default to Benzene -> Aniline node of Polyurethanes

  const currentSegment = SEGMENTS.find((s) => s.id === selectedSegmentId) || SEGMENTS[0];
  const currentNode = currentSegment.pipeline[selectedNodeIndex] || currentSegment.pipeline[0];

  const handleNodeClick = (segmentId: string, nodeIndex: number) => {
    setSelectedSegmentId(segmentId);
    setSelectedNodeIndex(nodeIndex);
  };

  const SegmentIcon = currentSegment.icon;
  const NodeIcon = currentNode.icon;

  return (
    <div className="animate-page-in space-y-6">
      
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">Huntsman Value Chain</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Petrochemical Value Chains — select any supply chain node to inspect dynamic intermediate pricing, logistics, and margin pressures
        </p>
      </div>

      {/* Node Details Inspector (At the Top) */}
      <div className="flex items-center gap-2 mb-2 select-none">
        <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
          Supply Chain Node Inspector
        </h3>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-primary/10 text-primary">
              <Info className="size-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono">
                ACTIVE FIELD: {currentSegment.title} ➔ {currentNode.label} ({currentNode.name})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono uppercase">Margin Risk:</span>
            <Badge variant="outline" className={cn("text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold uppercase", PRESSURE_VARIANTS[currentNode.marginPressure])}>
              {currentNode.marginPressure} Pressure
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Col 1: Summary */}
          <div className="space-y-3 border-r border-border/40 pr-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-background border border-border text-foreground">
                <NodeIcon className="size-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">{currentNode.name}</h4>
                <p className="text-xs text-muted-foreground font-mono">{currentNode.label}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground dark:text-white/80 leading-relaxed">
              {currentNode.desc}
            </p>
          </div>

          {/* Col 2: Logistics & Operations */}
          <div className="space-y-3 border-r border-border/40 pr-4">
            <h4 className="text-xs font-bold text-[var(--color-warning)] uppercase tracking-wider font-mono">
              Logistics &amp; Operations
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border/10 pb-1">
                <span className="text-muted-foreground dark:text-white/70">Logistics Mode:</span>
                <span className="text-foreground font-semibold font-mono">{currentNode.logistics}</span>
              </div>
              <div className="flex justify-between border-b border-border/10 pb-1">
                <span className="text-muted-foreground dark:text-white/70">Segment Anchor:</span>
                <span className="text-foreground font-semibold font-mono">{currentSegment.subtitle.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between border-b border-border/10 pb-1">
                <span className="text-muted-foreground dark:text-white/70">Key Benchmark:</span>
                <span className="text-foreground font-semibold font-mono">
                  {currentSegment.id === 'polyurethanes' || currentSegment.id === 'advanced_materials' ? 'WTI/Brent spot linkages' : 'Henry Hub natural gas'}
                </span>
              </div>
            </div>
          </div>

          {/* Col 3: Huntsman Competitive Advantage */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider font-mono">
              Huntsman Value Integration Notes
            </h4>
            <p className="text-sm text-muted-foreground dark:text-white/80 leading-relaxed">
              {currentNode.huntsmanNotes}
            </p>
          </div>
        </div>
      </div>

      {/* Business Unit Cards Stack */}
      <div className="space-y-6">
        {SEGMENTS.map((segment) => {
          const IconComponent = segment.icon;
          const isCurrentSegment = selectedSegmentId === segment.id;

          return (
            <div key={segment.id} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3 select-none">
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                  <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
                    {segment.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[11px] px-2.5 py-0.5 rounded-full font-mono uppercase font-semibold tracking-wider", STATUS_BADGES[segment.statusVariant])}>
                    {segment.status}
                  </Badge>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-xl border p-5 space-y-4 transition-all duration-200 bg-card",
                  isCurrentSegment ? "border-primary/50 ring-1 ring-primary/20" : "border-border/60"
                )}
              >
                {/* Segment Subtitle Banner */}
                <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-2">
                  <div className="p-1 rounded bg-primary/10 text-primary">
                    <IconComponent className="size-4" />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground dark:text-white/80">{segment.subtitle}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground dark:text-white/80 leading-relaxed">
                  {segment.description}
                </p>

                {/* Supply Chain Diagram Flow */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                  {segment.pipeline.map((node, index) => {
                    const CurrentNodeIcon = node.icon;
                    const isNodeSelected = isCurrentSegment && selectedNodeIndex === index;

                    return (
                      <div
                        key={node.name}
                        onClick={() => handleNodeClick(segment.id, index)}
                        className={cn(
                          "flex flex-col p-3 rounded-lg border cursor-pointer select-none relative transition-all duration-150 hover-lift",
                          isNodeSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border/50 bg-background/50 hover:border-border hover:bg-background/80"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1.5 text-xs text-muted-foreground uppercase tracking-wider font-mono">
                          <span className="flex items-center gap-1.5">
                            <CurrentNodeIcon className="size-3 text-muted-foreground/80" />
                            {node.label}
                          </span>
                          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 rounded-none uppercase font-mono font-bold", PRESSURE_VARIANTS[node.marginPressure])}>
                            {node.marginPressure}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-foreground mt-2">{node.name}</p>
                        <p className="text-xs text-muted-foreground/80 dark:text-white/60 mt-1 truncate">{node.desc}</p>
                        
                        {/* Arrow Connector (Desktop only, skip last column) */}
                        {index < 3 && (
                          <div className="absolute top-1/2 -right-3.5 -translate-y-1/2 hidden lg:block z-10 bg-background rounded-full border border-border/80 p-0.5">
                            <ChevronRight className="size-3.5 text-muted-foreground/60" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
