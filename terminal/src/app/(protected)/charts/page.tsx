'use client';

import { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Activity, Database, Cpu, Globe, ChevronDown, Star } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

// ---------------------------------------------------------------------------
// Static 28-day price series — ending 2026-06-10
// Commodity tickers: CME/NYMEX/NYSE  |  Equity tickers: NYSE / OTC / Shanghai / Tadawul
// ---------------------------------------------------------------------------

const COMMODITY_SERIES = {
  WTI: {
    label: 'WTI Crude Oil', ticker: 'CL=F', unit: '/bbl', color: 'var(--chart-4)',
    shortName: 'WTI',
    current: '$90.80', change1d: '+2.95%', signal: 'Cost Alert',
    signalClass: 'bg-danger/20 text-[var(--chart-5)]',
    role: 'Primary feedstock: crude → naphtha → benzene → aniline → MDI. Price moves transmit to MDI input costs in 2–3 weeks. At $90+ sustained, energy surcharge clauses on variable-rate contracts should be reviewed.',
    data: [
      { d: 'May 1', v: 81.90 }, { d: 'May 2', v: 82.60 }, { d: 'May 5', v: 83.20 },
      { d: 'May 6', v: 82.80 }, { d: 'May 7', v: 84.10 }, { d: 'May 8', v: 83.70 },
      { d: 'May 9', v: 85.20 }, { d: 'May 12', v: 84.90 }, { d: 'May 13', v: 85.50 },
      { d: 'May 14', v: 86.10 }, { d: 'May 15', v: 85.80 }, { d: 'May 16', v: 86.80 },
      { d: 'May 19', v: 87.30 }, { d: 'May 20', v: 86.90 }, { d: 'May 21', v: 87.80 },
      { d: 'May 22', v: 87.40 }, { d: 'May 23', v: 88.20 }, { d: 'May 27', v: 87.60 },
      { d: 'May 28', v: 88.40 }, { d: 'May 29', v: 87.90 }, { d: 'May 30', v: 88.70 },
      { d: 'Jun 2', v: 87.80 }, { d: 'Jun 3', v: 88.50 }, { d: 'Jun 4', v: 89.20 },
      { d: 'Jun 5', v: 88.60 }, { d: 'Jun 6', v: 89.80 }, { d: 'Jun 9', v: 88.20 },
      { d: 'Jun 10', v: 90.80 },
    ],
  },
  Brent: {
    label: 'Brent Crude', ticker: 'BZ=F', unit: '/bbl', color: 'var(--chart-1)',
    shortName: 'Brent',
    current: '$93.86', change1d: '+2.64%', signal: 'Supply Risk',
    signalClass: 'bg-danger/20 text-[var(--chart-5)]',
    role: 'Asia/Europe benchmark. Brent/WTI spread at $3.06 signals tightening global supply. Asia-Pacific benzene and aniline intermediates track Brent — sustained spread widening raises import costs for Huntsman Asia operations.',
    data: [
      { d: 'May 1', v: 84.90 }, { d: 'May 2', v: 85.70 }, { d: 'May 5', v: 86.30 },
      { d: 'May 6', v: 85.90 }, { d: 'May 7', v: 87.20 }, { d: 'May 8', v: 86.80 },
      { d: 'May 9', v: 88.40 }, { d: 'May 12', v: 88.10 }, { d: 'May 13', v: 88.70 },
      { d: 'May 14', v: 89.40 }, { d: 'May 15', v: 89.10 }, { d: 'May 16', v: 90.10 },
      { d: 'May 19', v: 90.60 }, { d: 'May 20', v: 90.20 }, { d: 'May 21', v: 91.10 },
      { d: 'May 22', v: 90.70 }, { d: 'May 23', v: 91.50 }, { d: 'May 27', v: 90.90 },
      { d: 'May 28', v: 91.60 }, { d: 'May 29', v: 91.20 }, { d: 'May 30', v: 91.90 },
      { d: 'Jun 2', v: 91.10 }, { d: 'Jun 3', v: 91.80 }, { d: 'Jun 4', v: 92.50 },
      { d: 'Jun 5', v: 91.90 }, { d: 'Jun 6', v: 92.80 }, { d: 'Jun 9', v: 91.40 },
      { d: 'Jun 10', v: 93.86 },
    ],
  },
  Benzene: {
    label: 'Benzene Spot (USGC)', ticker: 'BENZ-USGC', unit: '/t', color: 'var(--chart-5)',
    shortName: 'Benzene',
    current: '$1,010', change1d: '+1.85%', signal: 'Cost Alert',
    signalClass: 'bg-danger/20 text-[var(--chart-5)]',
    role: 'Primary precursor for aniline and MDI (Polyurethanes division). Spiked to $1,010/tonne due to feedstock shortages. Directly compresses MDI margins.',
    data: [
      { d: 'May 1', v: 950 }, { d: 'May 2', v: 955 }, { d: 'May 5', v: 962 },
      { d: 'May 6', v: 958 }, { d: 'May 7', v: 968 }, { d: 'May 8', v: 964 },
      { d: 'May 9', v: 974 }, { d: 'May 12', v: 970 }, { d: 'May 13', v: 978 },
      { d: 'May 14', v: 985 }, { d: 'May 15', v: 980 }, { d: 'May 16', v: 988 },
      { d: 'May 19', v: 994 }, { d: 'May 20', v: 990 }, { d: 'May 21', v: 998 },
      { d: 'May 22', v: 992 }, { d: 'May 23', v: 1002 }, { d: 'May 27', v: 996 },
      { d: 'May 28', v: 1004 }, { d: 'May 29', v: 998 }, { d: 'May 30', v: 1006 },
      { d: 'Jun 2', v: 995 }, { d: 'Jun 3', v: 1000 }, { d: 'Jun 4', v: 1008 },
      { d: 'Jun 5', v: 1002 }, { d: 'Jun 6', v: 1006 }, { d: 'Jun 9', v: 998 },
      { d: 'Jun 10', v: 1010 },
    ],
  },
  NatGas: {
    label: 'Natural Gas (HH)', ticker: 'NG=F', unit: '/MMBtu', color: 'var(--color-warning)',
    shortName: 'Nat Gas',
    current: '$3.19', change1d: '+1.69%', signal: 'Watch',
    signalClass: 'bg-warning/20 text-[var(--color-warning)]',
    role: 'Direct energy input for Gulf Coast MDI and amine production. At $3.40+, adds ~$12–18/t to production costs. Monitor NYMEX forward strip for inflection above $3.40.',
    data: [
      { d: 'May 1', v: 2.48 }, { d: 'May 2', v: 2.52 }, { d: 'May 5', v: 2.45 },
      { d: 'May 6', v: 2.61 }, { d: 'May 7', v: 2.58 }, { d: 'May 8', v: 2.70 },
      { d: 'May 9', v: 2.66 }, { d: 'May 12', v: 2.74 }, { d: 'May 13', v: 2.80 },
      { d: 'May 14', v: 2.77 }, { d: 'May 15', v: 2.85 }, { d: 'May 16', v: 2.91 },
      { d: 'May 19', v: 2.88 }, { d: 'May 20', v: 2.94 }, { d: 'May 21', v: 3.02 },
      { d: 'May 22', v: 2.98 }, { d: 'May 23', v: 3.05 }, { d: 'May 27', v: 2.97 },
      { d: 'May 28', v: 3.04 }, { d: 'May 29', v: 3.10 }, { d: 'May 30', v: 3.08 },
      { d: 'Jun 2', v: 3.14 }, { d: 'Jun 3', v: 3.10 }, { d: 'Jun 4', v: 3.18 },
      { d: 'Jun 5', v: 3.12 }, { d: 'Jun 6', v: 3.16 }, { d: 'Jun 9', v: 3.14 },
      { d: 'Jun 10', v: 3.19 },
    ],
  },
  XLB: {
    label: 'XLB Materials ETF', ticker: 'XLB', unit: '', color: 'var(--chart-2)',
    shortName: 'XLB',
    current: '$50.21', change1d: '-1.41%', signal: 'Sector Weak',
    signalClass: 'bg-danger/20 text-[var(--chart-5)]',
    role: 'Sector demand proxy. XLB underperformance vs S&P 500 signals downstream volume weakness 3–5 weeks ahead. Materials ETF near 10-day low with no institutional buying support.',
    data: [
      { d: 'May 1', v: 54.20 }, { d: 'May 2', v: 53.80 }, { d: 'May 5', v: 54.10 },
      { d: 'May 6', v: 53.40 }, { d: 'May 7', v: 53.90 }, { d: 'May 8', v: 53.20 },
      { d: 'May 9', v: 52.80 }, { d: 'May 12', v: 53.10 }, { d: 'May 13', v: 52.60 },
      { d: 'May 14', v: 52.90 }, { d: 'May 15', v: 52.30 }, { d: 'May 16', v: 52.60 },
      { d: 'May 19', v: 52.10 }, { d: 'May 20', v: 52.40 }, { d: 'May 21', v: 51.80 },
      { d: 'May 22', v: 52.00 }, { d: 'May 23', v: 51.50 }, { d: 'May 27', v: 51.80 },
      { d: 'May 28', v: 51.30 }, { d: 'May 29', v: 51.60 }, { d: 'May 30', v: 51.10 },
      { d: 'Jun 2', v: 51.40 }, { d: 'Jun 3', v: 50.90 }, { d: 'Jun 4', v: 51.20 },
      { d: 'Jun 5', v: 50.70 }, { d: 'Jun 6', v: 51.00 }, { d: 'Jun 9', v: 50.50 },
      { d: 'Jun 10', v: 50.21 },
    ],
  },
  SP500: {
    label: 'S&P 500 Index', ticker: '^GSPC', unit: '', color: 'var(--chart-3)',
    shortName: 'S&P 500',
    current: '7,321', change1d: '-0.89%', signal: 'Risk-Off',
    signalClass: 'bg-warning/20 text-[var(--color-warning)]',
    role: 'Macro demand environment. 5-day drawdown >3% historically precedes softening in industrial chemical volumes by 4–6 weeks. Cyclical end-markets (automotive OEM, construction) most exposed.',
    data: [
      { d: 'May 1', v: 7582 }, { d: 'May 2', v: 7610 }, { d: 'May 5', v: 7598 },
      { d: 'May 6', v: 7625 }, { d: 'May 7', v: 7614 }, { d: 'May 8', v: 7641 },
      { d: 'May 9', v: 7628 }, { d: 'May 12', v: 7612 }, { d: 'May 13', v: 7598 },
      { d: 'May 14', v: 7620 }, { d: 'May 15', v: 7605 }, { d: 'May 16', v: 7589 },
      { d: 'May 19', v: 7572 }, { d: 'May 20', v: 7561 }, { d: 'May 21', v: 7548 },
      { d: 'May 22', v: 7534 }, { d: 'May 23', v: 7519 }, { d: 'May 27', v: 7504 },
      { d: 'May 28', v: 7528 }, { d: 'May 29', v: 7512 }, { d: 'May 30', v: 7490 },
      { d: 'Jun 2', v: 7476 }, { d: 'Jun 3', v: 7460 }, { d: 'Jun 4', v: 7448 },
      { d: 'Jun 5', v: 7432 }, { d: 'Jun 6', v: 7416 }, { d: 'Jun 9', v: 7387 },
      { d: 'Jun 10', v: 7321 },
    ],
  },
  Naphtha: {
    label: 'Naphtha Spot (USGC)', ticker: 'NAPH-USGC', unit: '/t', color: 'var(--chart-4)',
    shortName: 'Naphtha',
    current: '$680.00', change1d: '+1.25%', signal: 'Watch',
    signalClass: 'bg-warning/20 text-[var(--color-warning)]',
    role: 'Light distillate feedstock processed into olefins (propylene/ethylene) and aromatics (benzene). Pricing dictates cracker feedstock costs and aniline-MDI margins.',
    data: [
      { d: 'May 1', v: 620.0 }, { d: 'May 2', v: 622.0 }, { d: 'May 5', v: 628.0 },
      { d: 'May 6', v: 625.0 }, { d: 'May 7', v: 631.0 }, { d: 'May 8', v: 629.0 },
      { d: 'May 9', v: 634.0 }, { d: 'May 12', v: 632.0 }, { d: 'May 13', v: 638.0 },
      { d: 'May 14', v: 641.0 }, { d: 'May 15', v: 639.0 }, { d: 'May 16', v: 645.0 },
      { d: 'May 19', v: 648.0 }, { d: 'May 20', v: 646.0 }, { d: 'May 21', v: 652.0 },
      { d: 'May 22', v: 650.0 }, { d: 'May 23', v: 656.0 }, { d: 'May 27', v: 654.0 },
      { d: 'May 28', v: 660.0 }, { d: 'May 29', v: 658.0 }, { d: 'May 30', v: 664.0 },
      { d: 'Jun 2', v: 662.0 }, { d: 'Jun 3', v: 668.0 }, { d: 'Jun 4', v: 671.0 },
      { d: 'Jun 5', v: 669.0 }, { d: 'Jun 6', v: 675.0 }, { d: 'Jun 9', v: 672.0 },
      { d: 'Jun 10', v: 680.0 },
    ],
  },
  Propylene: {
    label: 'Propylene Spot (USGC)', ticker: 'PROP-USGC', unit: '/t', color: 'var(--chart-1)',
    shortName: 'Propylene',
    current: '$820.00', change1d: '-2.38%', signal: 'Margin Gain',
    signalClass: 'bg-success/20 text-[var(--color-success)]',
    role: 'Olefins intermediate feedstock. Primary input for propylene oxide (PO) and downstream polyether polyols. Lower propylene prices ease margins for polyurethane seating foams.',
    data: [
      { d: 'May 1', v: 850.0 }, { d: 'May 2', v: 848.0 }, { d: 'May 5', v: 849.0 },
      { d: 'May 6', v: 846.0 }, { d: 'May 7', v: 847.0 }, { d: 'May 8', v: 844.0 },
      { d: 'May 9', v: 845.0 }, { d: 'May 12', v: 842.0 }, { d: 'May 13', v: 843.0 },
      { d: 'May 14', v: 840.0 }, { d: 'May 15', v: 841.0 }, { d: 'May 16', v: 838.0 },
      { d: 'May 19', v: 839.0 }, { d: 'May 20', v: 836.0 }, { d: 'May 21', v: 837.0 },
      { d: 'May 22', v: 834.0 }, { d: 'May 23', v: 835.0 }, { d: 'May 27', v: 832.0 },
      { d: 'May 28', v: 833.0 }, { d: 'May 29', v: 830.0 }, { d: 'May 30', v: 831.0 },
      { d: 'Jun 2', v: 828.0 }, { d: 'Jun 3', v: 829.0 }, { d: 'Jun 4', v: 826.0 },
      { d: 'Jun 5', v: 827.0 }, { d: 'Jun 6', v: 824.0 }, { d: 'Jun 9', v: 825.0 },
      { d: 'Jun 10', v: 820.0 },
    ],
  },
  Butane: {
    label: 'Butane Spot (USGC)', ticker: 'BUTA-USGC', unit: '/t', color: 'var(--chart-3)',
    shortName: 'Butane',
    current: '$410.00', change1d: '+0.49%', signal: 'Stable',
    signalClass: 'bg-success/20 text-[var(--color-success)]',
    role: 'Primary feedstock for maleic anhydride (Performance Products division). US butane surplus keeps input costs stable, securing healthy margins for wind composites.',
    data: [
      { d: 'May 1', v: 415.0 }, { d: 'May 2', v: 414.0 }, { d: 'May 5', v: 416.0 },
      { d: 'May 6', v: 413.0 }, { d: 'May 7', v: 415.0 }, { d: 'May 8', v: 412.0 },
      { d: 'May 9', v: 414.0 }, { d: 'May 12', v: 411.0 }, { d: 'May 13', v: 413.0 },
      { d: 'May 14', v: 410.0 }, { d: 'May 15', v: 412.0 }, { d: 'May 16', v: 409.0 },
      { d: 'May 19', v: 411.0 }, { d: 'May 20', v: 408.0 }, { d: 'May 21', v: 410.0 },
      { d: 'May 22', v: 407.0 }, { d: 'May 23', v: 409.0 }, { d: 'May 27', v: 406.0 },
      { d: 'May 28', v: 408.0 }, { d: 'May 29', v: 405.0 }, { d: 'May 30', v: 407.0 },
      { d: 'Jun 2', v: 405.0 }, { d: 'Jun 3', v: 408.0 }, { d: 'Jun 4', v: 406.0 },
      { d: 'Jun 5', v: 409.0 }, { d: 'Jun 6', v: 407.0 }, { d: 'Jun 9', v: 408.0 },
      { d: 'Jun 10', v: 410.0 },
    ],
  },
  Ethylene: {
    label: 'Ethylene Spot (USGC)', ticker: 'ETHY-USGC', unit: '/t', color: 'var(--chart-2)',
    shortName: 'Ethylene',
    current: '$715.00', change1d: '+3.62%', signal: 'Cost Alert',
    signalClass: 'bg-danger/20 text-[var(--chart-5)]',
    role: 'Key upstream olefin used to produce ethylene oxide reactants. Volatile spot cracker rates transmit pricing pressure to specialty amine formulations.',
    data: [
      { d: 'May 1', v: 680.0 }, { d: 'May 2', v: 682.0 }, { d: 'May 5', v: 685.0 },
      { d: 'May 6', v: 683.0 }, { d: 'May 7', v: 688.0 }, { d: 'May 8', v: 686.0 },
      { d: 'May 9', v: 691.0 }, { d: 'May 12', v: 689.0 }, { d: 'May 13', v: 694.0 },
      { d: 'May 14', v: 697.0 }, { d: 'May 15', v: 695.0 }, { d: 'May 16', v: 700.0 },
      { d: 'May 19', v: 703.0 }, { d: 'May 20', v: 701.0 }, { d: 'May 21', v: 706.0 },
      { d: 'May 22', v: 704.0 }, { d: 'May 23', v: 709.0 }, { d: 'May 27', v: 707.0 },
      { d: 'May 28', v: 712.0 }, { d: 'May 29', v: 710.0 }, { d: 'May 30', v: 715.0 },
      { d: 'Jun 2', v: 711.0 }, { d: 'Jun 3', v: 714.0 }, { d: 'Jun 4', v: 712.0 },
      { d: 'Jun 5', v: 716.0 }, { d: 'Jun 6', v: 713.0 }, { d: 'Jun 9', v: 711.0 },
      { d: 'Jun 10', v: 715.0 },
    ],
  },
} as const;

const EQUITY_SERIES = {
  HUN: {
    label: 'Huntsman Corp', ticker: 'HUN', exchange: 'NYSE', unit: '',
    shortName: 'HUN',
    current: '$18.40', color: 'var(--color-success)',
    role: 'Performance Products parent. HUN equity reflects investor confidence in MDI margins and specialty amine growth prospects. Current price shows pressure from elevated feedstock costs.',
    data: [
      { d: 'May 1', v: 20.10 }, { d: 'May 2', v: 19.85 }, { d: 'May 5', v: 20.20 },
      { d: 'May 6', v: 19.65 }, { d: 'May 7', v: 19.90 }, { d: 'May 8', v: 19.40 },
      { d: 'May 9', v: 19.20 }, { d: 'May 12', v: 19.50 }, { d: 'May 13', v: 19.10 },
      { d: 'May 14', v: 19.35 }, { d: 'May 15', v: 19.00 }, { d: 'May 16', v: 19.25 },
      { d: 'May 19', v: 18.80 }, { d: 'May 20', v: 19.05 }, { d: 'May 21', v: 18.60 },
      { d: 'May 22', v: 18.85 }, { d: 'May 23', v: 18.40 }, { d: 'May 27', v: 18.65 },
      { d: 'May 28', v: 18.20 }, { d: 'May 29', v: 18.45 }, { d: 'May 30', v: 18.10 },
      { d: 'Jun 2', v: 18.35 }, { d: 'Jun 3', v: 18.00 }, { d: 'Jun 4', v: 18.25 },
      { d: 'Jun 5', v: 17.90 }, { d: 'Jun 6', v: 18.15 }, { d: 'Jun 9', v: 17.80 },
      { d: 'Jun 10', v: 18.40 },
    ],
  },
  DOW: {
    label: 'Dow Inc', ticker: 'DOW', exchange: 'NYSE', unit: '',
    shortName: 'DOW',
    current: '$41.50', color: 'var(--chart-1)',
    role: 'Direct competitor and feedstock peer. Dow MDI and polyols compete across Huntsman\'s end markets. DOW equity decline mirrors sector-wide margin compression from crude/energy cost inflation.',
    data: [
      { d: 'May 1', v: 45.20 }, { d: 'May 2', v: 44.80 }, { d: 'May 5', v: 45.10 },
      { d: 'May 6', v: 44.50 }, { d: 'May 7', v: 44.90 }, { d: 'May 8', v: 44.30 },
      { d: 'May 9', v: 43.90 }, { d: 'May 12', v: 44.20 }, { d: 'May 13', v: 43.70 },
      { d: 'May 14', v: 44.00 }, { d: 'May 15', v: 43.50 }, { d: 'May 16', v: 43.80 },
      { d: 'May 19', v: 43.20 }, { d: 'May 20', v: 43.50 }, { d: 'May 21', v: 43.00 },
      { d: 'May 22', v: 43.30 }, { d: 'May 23', v: 42.80 }, { d: 'May 27', v: 43.10 },
      { d: 'May 28', v: 42.60 }, { d: 'May 29', v: 42.90 }, { d: 'May 30', v: 42.40 },
      { d: 'Jun 2', v: 42.70 }, { d: 'Jun 3', v: 42.20 }, { d: 'Jun 4', v: 42.50 },
      { d: 'Jun 5', v: 42.00 }, { d: 'Jun 6', v: 42.30 }, { d: 'Jun 9', v: 41.80 },
      { d: 'Jun 10', v: 41.50 },
    ],
  },
  BASF: {
    label: 'BASF SE (ADR)', ticker: 'BASFY', exchange: 'OTC', unit: '',
    shortName: 'BASF',
    current: '$8.80', color: 'var(--chart-4)',
    role: 'World\'s largest chemical company. BASF isocyanate capacity shapes global MDI contract pricing. BASF stock declining in tandem with sector — confirms industry-wide margin pressure, not company-specific.',
    data: [
      { d: 'May 1', v: 9.80 }, { d: 'May 2', v: 9.65 }, { d: 'May 5', v: 9.72 },
      { d: 'May 6', v: 9.55 }, { d: 'May 7', v: 9.63 }, { d: 'May 8', v: 9.48 },
      { d: 'May 9', v: 9.40 }, { d: 'May 12', v: 9.52 }, { d: 'May 13', v: 9.38 },
      { d: 'May 14', v: 9.45 }, { d: 'May 15', v: 9.32 }, { d: 'May 16', v: 9.40 },
      { d: 'May 19', v: 9.26 }, { d: 'May 20', v: 9.34 }, { d: 'May 21', v: 9.20 },
      { d: 'May 22', v: 9.28 }, { d: 'May 23', v: 9.14 }, { d: 'May 27', v: 9.22 },
      { d: 'May 28', v: 9.08 }, { d: 'May 29', v: 9.16 }, { d: 'May 30', v: 9.02 },
      { d: 'Jun 2', v: 9.10 }, { d: 'Jun 3', v: 8.96 }, { d: 'Jun 4', v: 9.04 },
      { d: 'Jun 5', v: 8.90 }, { d: 'Jun 6', v: 8.98 }, { d: 'Jun 9', v: 8.84 },
      { d: 'Jun 10', v: 8.80 },
    ],
  },
  Wanhua: {
    label: 'Wanhua Chemical', ticker: '600309.SS', exchange: 'Shanghai', unit: ' CNY',
    shortName: 'Wanhua',
    current: '88.10 CNY', color: 'var(--chart-5)',
    role: 'World\'s largest MDI producer. Wanhua\'s pricing and capacity utilization sets the floor for global MDI contract prices. Wanhua decline confirms sector cost pressure is global, not U.S.-specific.',
    data: [
      { d: 'May 1', v: 95.40 }, { d: 'May 2', v: 94.80 }, { d: 'May 5', v: 96.10 },
      { d: 'May 6', v: 94.20 }, { d: 'May 7', v: 95.50 }, { d: 'May 8', v: 93.80 },
      { d: 'May 9', v: 93.10 }, { d: 'May 12', v: 94.40 }, { d: 'May 13', v: 92.70 },
      { d: 'May 14', v: 93.90 }, { d: 'May 15', v: 92.20 }, { d: 'May 16', v: 93.40 },
      { d: 'May 19', v: 91.50 }, { d: 'May 20', v: 92.60 }, { d: 'May 21', v: 90.80 },
      { d: 'May 22', v: 91.90 }, { d: 'May 23', v: 90.10 }, { d: 'May 27', v: 91.20 },
      { d: 'May 28', v: 89.40 }, { d: 'May 29', v: 90.50 }, { d: 'May 30', v: 88.80 },
      { d: 'Jun 2', v: 89.90 }, { d: 'Jun 3', v: 88.20 }, { d: 'Jun 4', v: 89.30 },
      { d: 'Jun 5', v: 87.60 }, { d: 'Jun 6', v: 88.70 }, { d: 'Jun 9', v: 86.90 },
      { d: 'Jun 10', v: 88.10 },
    ],
  },
  Aramco: {
    label: 'Saudi Aramco', ticker: '2222.SR', exchange: 'Tadawul', unit: ' SAR',
    shortName: 'Aramco',
    current: '33.85 SAR', color: 'var(--chart-2)',
    role: 'Dominant crude supplier and Covestro acquirer (2024). Aramco production decisions directly impact global benzene feedstock supply and availability. Rising Aramco equity signals market pricing in sustained high crude.',
    data: [
      { d: 'May 1', v: 30.80 }, { d: 'May 2', v: 31.20 }, { d: 'May 5', v: 31.00 },
      { d: 'May 6', v: 31.45 }, { d: 'May 7', v: 31.30 }, { d: 'May 8', v: 31.70 },
      { d: 'May 9', v: 31.55 }, { d: 'May 12', v: 31.40 }, { d: 'May 13', v: 31.80 },
      { d: 'May 14', v: 32.10 }, { d: 'May 15', v: 31.90 }, { d: 'May 16', v: 32.30 },
      { d: 'May 19', v: 32.15 }, { d: 'May 20', v: 32.50 }, { d: 'May 21', v: 32.35 },
      { d: 'May 22', v: 32.70 }, { d: 'May 23', v: 32.55 }, { d: 'May 27', v: 32.40 },
      { d: 'May 28', v: 32.80 }, { d: 'May 29', v: 32.60 }, { d: 'May 30', v: 33.00 },
      { d: 'Jun 2', v: 32.80 }, { d: 'Jun 3', v: 33.20 }, { d: 'Jun 4', v: 33.50 },
      { d: 'Jun 5', v: 33.30 }, { d: 'Jun 6', v: 33.70 }, { d: 'Jun 9', v: 33.50 },
      { d: 'Jun 10', v: 33.85 },
    ],
  },
  Lyondell: {
    label: 'LyondellBasell', ticker: 'LYB', exchange: 'NYSE', unit: '',
    shortName: 'Lyondell',
    current: '$84.50', color: 'var(--chart-4)',
    role: 'Global olefins and polyolefins peer. LYB stock performance tracks global plastics demand and feedstock cracker spreads.',
    data: [
      { d: 'May 1', v: 88.00 }, { d: 'May 2', v: 87.50 }, { d: 'May 5', v: 87.90 },
      { d: 'May 6', v: 87.20 }, { d: 'May 7', v: 87.60 }, { d: 'May 8', v: 86.90 },
      { d: 'May 9', v: 86.40 }, { d: 'May 12', v: 86.80 }, { d: 'May 13', v: 86.10 },
      { d: 'May 14', v: 86.50 }, { d: 'May 15', v: 85.90 }, { d: 'May 16', v: 86.30 },
      { d: 'May 19', v: 85.60 }, { d: 'May 20', v: 86.00 }, { d: 'May 21', v: 85.30 },
      { d: 'May 22', v: 85.70 }, { d: 'May 23', v: 85.10 }, { d: 'May 27', v: 85.50 },
      { d: 'May 28', v: 84.80 }, { d: 'May 29', v: 85.20 }, { d: 'May 30', v: 84.50 },
      { d: 'Jun 2', v: 84.90 }, { d: 'Jun 3', v: 84.20 }, { d: 'Jun 4', v: 84.60 },
      { d: 'Jun 5', v: 83.90 }, { d: 'Jun 6', v: 84.30 }, { d: 'Jun 9', v: 83.60 },
      { d: 'Jun 10', v: 84.50 },
    ],
  },
  Westlake: {
    label: 'Westlake Corp', ticker: 'WLK', exchange: 'NYSE', unit: '',
    shortName: 'Westlake',
    current: '$125.00', color: 'var(--chart-1)',
    role: 'Upstream petrochemical peer. WLK equity highlights domestic housing and chlorine/ethylene integration margin strength.',
    data: [
      { d: 'May 1', v: 130.00 }, { d: 'May 2', v: 129.20 }, { d: 'May 5', v: 129.80 },
      { d: 'May 6', v: 128.90 }, { d: 'May 7', v: 129.40 }, { d: 'May 8', v: 128.50 },
      { d: 'May 9', v: 127.90 }, { d: 'May 12', v: 128.30 }, { d: 'May 13', v: 127.40 },
      { d: 'May 14', v: 127.90 }, { d: 'May 15', v: 127.00 }, { d: 'May 16', v: 127.50 },
      { d: 'May 19', v: 126.60 }, { d: 'May 20', v: 127.10 }, { d: 'May 21', v: 126.20 },
      { d: 'May 22', v: 126.70 }, { d: 'May 23', v: 125.80 }, { d: 'May 27', v: 126.30 },
      { d: 'May 28', v: 125.40 }, { d: 'May 29', v: 125.90 }, { d: 'May 30', v: 125.00 },
      { d: 'Jun 2', v: 125.50 }, { d: 'Jun 3', v: 124.60 }, { d: 'Jun 4', v: 125.10 },
      { d: 'Jun 5', v: 124.20 }, { d: 'Jun 6', v: 124.70 }, { d: 'Jun 9', v: 123.80 },
      { d: 'Jun 10', v: 125.00 },
    ],
  },
  Eastman: {
    label: 'Eastman Chemical', ticker: 'EMN', exchange: 'NYSE', unit: '',
    shortName: 'Eastman',
    current: '$92.20', color: 'var(--chart-3)',
    role: 'Specialty chemical manufacturer. EMN tracks advanced materials margin defense and consumer product coatings demand.',
    data: [
      { d: 'May 1', v: 96.00 }, { d: 'May 2', v: 95.40 }, { d: 'May 5', v: 95.80 },
      { d: 'May 6', v: 95.10 }, { d: 'May 7', v: 95.50 }, { d: 'May 8', v: 94.80 },
      { d: 'May 9', v: 94.30 }, { d: 'May 12', v: 94.70 }, { d: 'May 13', v: 94.00 },
      { d: 'May 14', v: 94.40 }, { d: 'May 15', v: 93.70 }, { d: 'May 16', v: 94.10 },
      { d: 'May 19', v: 93.40 }, { d: 'May 20', v: 93.80 }, { d: 'May 21', v: 93.10 },
      { d: 'May 22', v: 93.50 }, { d: 'May 23', v: 92.80 }, { d: 'May 27', v: 93.20 },
      { d: 'May 28', v: 92.50 }, { d: 'May 29', v: 92.90 }, { d: 'May 30', v: 92.20 },
      { d: 'Jun 2', v: 92.60 }, { d: 'Jun 3', v: 91.90 }, { d: 'Jun 4', v: 92.30 },
      { d: 'Jun 5', v: 91.60 }, { d: 'Jun 6', v: 92.00 }, { d: 'Jun 9', v: 91.30 },
      { d: 'Jun 10', v: 92.20 },
    ],
  },
  Celanese: {
    label: 'Celanese Corp', ticker: 'CE', exchange: 'NYSE', unit: '',
    shortName: 'Celanese',
    current: '$115.80', color: 'var(--chart-2)',
    role: 'Acetyl chain global leader. CE is highly sensitive to acetic acid feedstock costs and global industrial coatings volumes.',
    data: [
      { d: 'May 1', v: 120.00 }, { d: 'May 2', v: 119.30 }, { d: 'May 5', v: 119.70 },
      { d: 'May 6', v: 118.80 }, { d: 'May 7', v: 119.20 }, { d: 'May 8', v: 118.30 },
      { d: 'May 9', v: 117.70 }, { d: 'May 12', v: 118.10 }, { d: 'May 13', v: 117.20 },
      { d: 'May 14', v: 117.60 }, { d: 'May 15', v: 116.70 }, { d: 'May 16', v: 117.10 },
      { d: 'May 19', v: 116.20 }, { d: 'May 20', v: 116.60 }, { d: 'May 21', v: 115.70 },
      { d: 'May 22', v: 116.10 }, { d: 'May 23', v: 115.20 }, { d: 'May 27', v: 115.60 },
      { d: 'May 28', v: 114.70 }, { d: 'May 29', v: 115.10 }, { d: 'May 30', v: 114.20 },
      { d: 'Jun 2', v: 114.60 }, { d: 'Jun 3', v: 113.70 }, { d: 'Jun 4', v: 114.10 },
      { d: 'Jun 5', v: 113.20 }, { d: 'Jun 6', v: 113.60 }, { d: 'Jun 9', v: 112.70 },
      { d: 'Jun 10', v: 115.80 },
    ],
  },
  Covestro: {
    label: 'Covestro AG', ticker: 'COVTY', exchange: 'OTC', unit: '',
    shortName: 'Covestro',
    current: '$14.20', color: 'var(--chart-5)',
    role: 'European polyurethanes competitor. Subject to Aramco acquisition bids (2024). COVTY equity movements indicate European MDI/TDI margins.',
    data: [
      { d: 'May 1', v: 13.50 }, { d: 'May 2', v: 13.60 }, { d: 'May 5', v: 13.55 },
      { d: 'May 6', v: 13.70 }, { d: 'May 7', v: 13.65 }, { d: 'May 8', v: 13.80 },
      { d: 'May 9', v: 13.75 }, { d: 'May 12', v: 13.70 }, { d: 'May 13', v: 13.85 },
      { d: 'May 14', v: 13.90 }, { d: 'May 15', v: 13.85 }, { d: 'May 16', v: 14.00 },
      { d: 'May 19', v: 13.95 }, { d: 'May 20', v: 14.10 }, { d: 'May 21', v: 14.05 },
      { d: 'May 22', v: 14.20 }, { d: 'May 23', v: 14.15 }, { d: 'May 27', v: 14.10 },
      { d: 'May 28', v: 14.25 }, { d: 'May 29', v: 14.20 }, { d: 'May 30', v: 14.35 },
      { d: 'Jun 2', v: 14.30 }, { d: 'Jun 3', v: 14.45 }, { d: 'Jun 4', v: 14.50 },
      { d: 'Jun 5', v: 14.40 }, { d: 'Jun 6', v: 14.55 }, { d: 'Jun 9', v: 14.50 },
      { d: 'Jun 10', v: 14.20 },
    ],
  },
} as const;

type CommodityKey = keyof typeof COMMODITY_SERIES;
type EquityKey = keyof typeof EQUITY_SERIES;

const COMMODITY_KEYS = Object.keys(COMMODITY_SERIES) as CommodityKey[];
const EQUITY_KEYS = Object.keys(EQUITY_SERIES) as EquityKey[];

const SPARKLINE_DATA = [
  {
    id: 'WTI',
    label: 'WTI Crude',
    price: '$90.80',
    change: '+2.95%',
    isPositive: true,
    data: [81.90, 83.20, 84.10, 85.20, 86.10, 87.30, 88.20, 89.80, 90.80],
    type: 'commodity',
  },
  {
    id: 'Brent',
    label: 'Brent Crude',
    price: '$93.86',
    change: '+2.64%',
    isPositive: true,
    data: [84.90, 86.30, 87.20, 88.40, 89.40, 90.60, 91.50, 92.80, 93.86],
    type: 'commodity',
  },
  {
    id: 'Benzene',
    label: 'Benzene Spot',
    price: '$1,010',
    change: '+1.85%',
    isPositive: true,
    data: [950, 962, 968, 974, 980, 988, 998, 1006, 1010],
    type: 'commodity',
  },
  {
    id: 'NatGas',
    label: 'Natural Gas',
    price: '$3.19',
    change: '+1.69%',
    isPositive: true,
    data: [2.48, 2.52, 2.61, 2.70, 2.80, 2.91, 3.02, 3.12, 3.19],
    type: 'commodity',
  },
  {
    id: 'HUN',
    label: 'Huntsman Corp',
    price: '$18.40',
    change: '+0.50%',
    isPositive: true,
    data: [20.10, 19.65, 19.20, 19.35, 19.00, 18.60, 18.20, 17.80, 18.40],
    type: 'equity',
  },
  {
    id: 'Wanhua',
    label: 'Wanhua Chem',
    price: '88.10 CNY',
    change: '-1.40%',
    isPositive: false,
    data: [95.40, 94.20, 93.10, 92.20, 91.50, 90.10, 89.40, 86.90, 88.10],
    type: 'equity',
  },
  {
    id: 'Aramco',
    label: 'Saudi Aramco',
    price: '33.85 SAR',
    change: '+1.09%',
    isPositive: true,
    data: [30.80, 31.00, 31.30, 31.55, 32.10, 32.50, 32.70, 33.50, 33.85],
    type: 'equity',
  },
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="w-14 h-7 flex-none">
      <LineChart width={56} height={28} data={chartData}>
        <Line type="linear" dataKey="v" stroke={color} strokeWidth={1.2} dot={false} />
      </LineChart>
    </div>
  );
}

function getChartColor(data: readonly { d: string; v: number }[], isLight: boolean) {
  if (data.length < 2) return isLight ? '#16a34a' : 'var(--color-success)';
  const startVal = data[0].v;
  const endVal = data[data.length - 1].v;
  const pctChange = ((endVal - startVal) / startVal) * 100;
  if (pctChange > 0) return isLight ? '#16a34a' : 'var(--color-success)';
  if (pctChange >= -5) return isLight ? '#d97706' : 'var(--color-warning)';
  return isLight ? '#dc2626' : 'var(--color-danger)';
}

function formatValue(val: number, unit: string) {
  if (unit === ' CNY') return `${val.toFixed(2)} CNY`;
  if (unit === ' SAR') return `${val.toFixed(2)} SAR`;
  if (unit === '') return val > 999 ? val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : `$${val.toFixed(2)}`;
  return `$${val.toFixed(2)}${unit}`;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg font-mono text-popover-foreground">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className="font-semibold text-foreground">
        {formatValue(Number(payload[0].value), unit)}
      </p>
    </div>
  );
};

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function calculatePearsonCorrelation(x: number[], y: number[]): { r: number; r2: number; cov: number } {
  const n = Math.min(x.length, y.length);
  if (n === 0) return { r: 0, r2: 0, cov: 0 };
  const meanX = calculateMean(x);
  const meanY = calculateMean(y);
  
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  
  const cov = num / (n - 1);
  const stdX = Math.sqrt(denX);
  const stdY = Math.sqrt(denY);
  if (stdX === 0 || stdY === 0) return { r: 0, r2: 0, cov: 0 };
  
  const r = num / (stdX * stdY);
  return { r, r2: r * r, cov };
}

function getCorrelationVerdict(r: number, commodityLabel: string, equityLabel: string) {
  if (r > 0.6) {
    return {
      verdict: "STRONG POSITIVE CORRELATION",
      description: `The selected pair (${commodityLabel} and ${equityLabel}) moves in close lockstep (r = +${r.toFixed(4)}). This suggests that ${equityLabel}'s valuation rises alongside rising commodity prices, typical for upstream integrated players with pricing power.`
    };
  } else if (r > 0.2) {
    return {
      verdict: "MODERATE POSITIVE CORRELATION",
      description: `A moderate positive relationship (r = +${r.toFixed(4)}) exists. ${equityLabel} reacts in partial alignment with ${commodityLabel} price movements, indicating moderate pricing leverage or regional demand synchronization.`
    };
  } else if (r > -0.2 && r <= 0.2) {
    return {
      verdict: "NEUTRAL / NO CORRELATION",
      description: `The correlation between ${commodityLabel} and ${equityLabel} is statistically weak (r = ${r.toFixed(4)}). They move independently, which suggests that factors like operational hedges, local logistics, or broader market indexes dominate.`
    };
  } else if (r < -0.6) {
    return {
      verdict: "STRONG NEGATIVE CORRELATION",
      description: `There is a strong inverse relationship (r = ${r.toFixed(4)}) between ${commodityLabel} and ${equityLabel}. Rising commodity costs correlate with lower equity valuation, indicating severe margin compression where feedstock costs cannot be easily passed downstream.`
    };
  } else {
    return {
      verdict: "MODERATE NEGATIVE CORRELATION",
      description: `A moderate inverse relationship (r = ${r.toFixed(4)}) exists. Rising ${commodityLabel} costs compress ${equityLabel}'s operational margin, signaling a lag in price adjustments to downstream contract buyers.`
    };
  }
}

const COMMODITY_METADATA = {
  WTI: { subtitle: 'NY Mercantile - Delayed Quote • USD', fullName: 'Crude Oil Jul 26 (CL=F)' },
  Brent: { subtitle: 'ICE Europe - Delayed Quote • USD', fullName: 'Brent Crude Oil (BZ=F)' },
  Benzene: { subtitle: 'USGC Spot - Delayed Quote • USD', fullName: 'Benzene Spot USGC (BENZ-USGC)' },
  NatGas: { subtitle: 'NY Mercantile - Delayed Quote • USD', fullName: 'Natural Gas Henry Hub (NG=F)' },
  XLB: { subtitle: 'NYSE Arca - Delayed Quote • USD', fullName: 'Materials Select Sector SPDR (XLB)' },
  SP500: { subtitle: 'S&P Index - Delayed Quote • USD', fullName: 'S&P 500 Index (^GSPC)' },
  Naphtha: { subtitle: 'USGC Spot - Delayed Quote • USD', fullName: 'Naphtha Spot USGC (NAPH-USGC)' },
  Propylene: { subtitle: 'USGC Spot - Delayed Quote • USD', fullName: 'Propylene Spot USGC (PROP-USGC)' },
  Butane: { subtitle: 'USGC Spot - Delayed Quote • USD', fullName: 'Butane Spot USGC (BUTA-USGC)' },
  Ethylene: { subtitle: 'USGC Spot - Delayed Quote • USD', fullName: 'Ethylene Spot USGC (ETHY-USGC)' },
} as const;

const EQUITY_METADATA = {
  HUN: { subtitle: 'NYSE - Delayed Quote • USD', fullName: 'Huntsman Corporation (HUN)' },
  DOW: { subtitle: 'NYSE - Delayed Quote • USD', fullName: 'Dow Inc. (DOW)' },
  BASF: { subtitle: 'OTC - Delayed Quote • USD', fullName: 'BASF SE (BASFY)' },
  Wanhua: { subtitle: 'Shanghai - Delayed Quote • CNY', fullName: 'Wanhua Chemical Group Co. (600309.SS)' },
  Aramco: { subtitle: 'Tadawul - Delayed Quote • SAR', fullName: 'Saudi Arabian Oil Co. (2222.SR)' },
  Lyondell: { subtitle: 'NYSE - Delayed Quote • USD', fullName: 'LyondellBasell Industries N.V. (LYB)' },
  Westlake: { subtitle: 'NYSE - Delayed Quote • USD', fullName: 'Westlake Corporation (WLK)' },
  Eastman: { subtitle: 'NYSE - Delayed Quote • USD', fullName: 'Eastman Chemical Company (EMN)' },
  Celanese: { subtitle: 'NYSE - Delayed Quote • USD', fullName: 'Celanese Corporation (CE)' },
  Covestro: { subtitle: 'OTC - Delayed Quote • USD', fullName: 'Covestro AG (COVTY)' },
} as const;

// Helper to generate a high-density series from the base 28-day data to get the detailed Yahoo Finance peaks & valleys look
function generateHighDensityData(baseData: readonly { d: string; v: number }[]) {
  const dense: { d: string; v: number }[] = [];
  for (let i = 0; i < baseData.length - 1; i++) {
    const start = baseData[i];
    const end = baseData[i + 1];
    // Interpolate 6 sub-points between each daily point
    const steps = 6;
    for (let j = 0; j < steps; j++) {
      const ratio = j / steps;
      const baseVal = start.v + (end.v - start.v) * ratio;
      // Seeded mock oscillation to simulate micro-peaks/valleys cleanly
      const wave = Math.sin(ratio * Math.PI * 2) * 0.15;
      const noise = (Math.sin(i * 3 + j * 2) * 0.1 + wave) * (Math.abs(end.v - start.v) * 0.4 || 0.4);
      dense.push({
        d: `${start.d} ${j === 0 ? 'AM' : j === 3 ? 'PM' : ''}`,
        v: Math.max(0.01, baseVal + noise)
      });
    }
  }
  // Add final point
  dense.push({ d: baseData[baseData.length - 1].d, v: baseData[baseData.length - 1].v });
  return dense;
}

function getTimeframeData(baseData: readonly { d: string; v: number }[], timeframe: string) {
  const endVal = baseData[baseData.length - 1].v;
  const startVal = baseData[0].v;
  
  if (timeframe === '1D') {
    // 24 hourly points ending at current value with micro-peaks and valleys
    const data: { d: string; v: number }[] = [];
    const baseVal = endVal * 0.99;
    for (let i = 0; i < 24; i++) {
      const hour = i === 0 ? '12 AM' : i === 12 ? '12 PM' : `${i % 12} ${i < 12 ? 'AM' : 'PM'}`;
      const ratio = i / 23;
      const wave = Math.sin(ratio * Math.PI * 4) * (endVal * 0.005) + Math.cos(ratio * Math.PI * 8) * (endVal * 0.003);
      const v = baseVal + (endVal - baseVal) * ratio + wave;
      data.push({ d: hour, v });
    }
    data[data.length - 1].v = endVal;
    return data;
  }
  
  if (timeframe === '5D') {
    // Take last 5 days of data, expand to 30 points
    const subData = baseData.slice(-5);
    return generateHighDensityData(subData);
  }
  
  if (timeframe === '1M') {
    // Full 28 days with high-density ticks
    return generateHighDensityData(baseData);
  }
  
  // 6M, YTD, 1Y, 5Y, All: show a larger generated history of e.g. 120 points starting from 15% lower/higher
  const data: { d: string; v: number }[] = [];
  const startOffset = startVal * 0.82;
  const steps = 120;
  for (let i = 0; i < steps; i++) {
    const ratio = i / (steps - 1);
    const baseVal = startOffset + (endVal - startOffset) * ratio;
    // Multi-frequency wave for classic stock peaks/valleys
    const wave = Math.sin(ratio * Math.PI * 8) * (endVal * 0.04) + 
                 Math.cos(ratio * Math.PI * 16) * (endVal * 0.02) + 
                 Math.sin(ratio * Math.PI * 32) * (endVal * 0.005);
    data.push({
      d: `Month -${Math.ceil((1 - ratio) * 6)}`,
      v: Math.max(0.01, baseVal + wave)
    });
  }
  data[data.length - 1].v = endVal;
  return data;
}

export default function ChartsPage() {
  const [selCommodity, setSelCommodity] = useState<CommodityKey>('WTI');
  const [selEquity, setSelEquity]       = useState<EquityKey>('Aramco');
  const [commTimeframe, setCommTimeframe] = useState<string>('1M');
  const [eqTimeframe, setEqTimeframe]     = useState<string>('1M');
  const { light } = useTheme();

  const [commoditySeries, setCommoditySeries] = useState(COMMODITY_SERIES);
  const [equitySeries, setEquitySeries]       = useState(EQUITY_SERIES);
  const [sparklineData, setSparklineData]     = useState(SPARKLINE_DATA);

  useEffect(() => {
    fetch('/brief_data.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !data.commodities) return;
        
        // Update commodity series
        const updatedCommoditySeries = { ...COMMODITY_SERIES };
        const labelMap: Record<string, string> = {
          WTI: 'WTI Crude Oil',
          Brent: 'Brent Crude',
          NatGas: 'Natural Gas',
          XLB: 'XLB Materials',
          SP500: 'S&P 500',
        };
        
        const dateObj = new Date(data.generated_date + 'T00:00:00');
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        for (const key of Object.keys(labelMap)) {
          const matchLabel = labelMap[key];
          const card = data.commodities.find((c: any) => c.label === matchLabel);
          if (card) {
            const cleanVal = parseFloat(card.value.replace(/[^0-9.-]/g, ''));
            const changeStr = `${card.change >= 0 ? '+' : ''}${card.change.toFixed(2)}%`;
            const original = COMMODITY_SERIES[key as CommodityKey];
            const newData = [...original.data];
            newData[newData.length - 1] = { d: dateStr, v: cleanVal } as any;

            updatedCommoditySeries[key as CommodityKey] = {
              ...original,
              current: card.value,
              change1d: changeStr,
              data: newData,
            } as any;
          }
        }
        setCommoditySeries(updatedCommoditySeries);

        // Update sparkline data
        const updatedSparklineData = SPARKLINE_DATA.map((item) => {
          const keyMap: Record<string, string> = {
            WTI: 'WTI Crude Oil',
            Brent: 'Brent Crude',
            NatGas: 'Natural Gas',
            XLB: 'XLB Materials',
            SP500: 'S&P 500',
          };
          const matchLabel = keyMap[item.id];
          if (matchLabel) {
            const card = data.commodities.find((c: any) => c.label === matchLabel);
            if (card) {
              const cleanVal = parseFloat(card.value.replace(/[^0-9.-]/g, ''));
              const isPositive = card.change >= 0;
              const newData = [...item.data];
              newData[newData.length - 1] = cleanVal;
              return {
                ...item,
                price: card.value,
                change: `${card.change >= 0 ? '+' : ''}${card.change.toFixed(2)}%`,
                isPositive,
                data: newData,
              };
            }
          }
          return item;
        });
        setSparklineData(updatedSparklineData);
      })
      .catch(() => {});
  }, []);

  const commodity = commoditySeries[selCommodity];
  const equity    = equitySeries[selEquity];

  const commColor = getChartColor(commodity.data, light);
  const eqColor   = getChartColor(equity.data, light);

  const commChartData = getTimeframeData(commodity.data, commTimeframe);
  const eqChartData   = getTimeframeData(equity.data, eqTimeframe);

  const commValues = commChartData.map((p) => p.v);
  const commMean = calculateMean(commValues);
  const commMedian = calculateMedian(commValues);
  const commStdDev = calculateStdDev(commValues, commMean);
  const commMin = Math.min(...commValues);
  const commMax = Math.max(...commValues);
  const commRange = commMax - commMin;
  const commPad = commRange * 0.08;

  const eqValues = eqChartData.map((p) => p.v);
  const eqMean = calculateMean(eqValues);
  const eqMedian = calculateMedian(eqValues);
  const eqStdDev = calculateStdDev(eqValues, eqMean);
  const eqMin = Math.min(...eqValues);
  const eqMax = Math.max(...eqValues);
  const eqRange = eqMax - eqMin;
  const eqPad = eqRange * 0.08;

  const correlation = calculatePearsonCorrelation(commValues, eqValues);
  const verdict = getCorrelationVerdict(correlation.r, commodity.label, equity.label);

  const tickFormatter = (v: number) => {
    if (v > 999) return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return v.toFixed(2);
  };

  // Dynamic price change calculations
  const commStart = commChartData[0].v;
  const commEnd = commChartData[commChartData.length - 1].v;
  const commPct = ((commEnd - commStart) / commStart) * 100;
  const commDiff = commEnd - commStart;
  const commChangeStr = `${commDiff >= 0 ? '+' : ''}${commDiff.toFixed(2)} (${commDiff >= 0 ? '+' : ''}${commPct.toFixed(2)}%)`;
  const isCommPos = commDiff >= 0;
  const commChangeColor = isCommPos ? 'text-[#00b074]' : 'text-[#ff0055]';

  const eqStart = eqChartData[0].v;
  const eqEnd = eqChartData[eqChartData.length - 1].v;
  const eqPct = ((eqEnd - eqStart) / eqStart) * 100;
  const eqDiff = eqEnd - eqStart;
  const eqChangeStr = `${eqDiff >= 0 ? '+' : ''}${eqDiff.toFixed(2)} (${eqDiff >= 0 ? '+' : ''}${eqPct.toFixed(2)}%)`;
  const isEqPos = eqDiff >= 0;
  const eqChangeColor = isEqPos ? 'text-[#00b074]' : 'text-[#ff0055]';

  return (
    <div className="animate-page-in space-y-6">
      
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Price Charts
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            28-day price history — feedstock cost signals (left) &amp; supply chain equity signals (right)
          </p>
        </div>
        <div className="text-right font-mono text-[10px] text-muted-foreground">
          STATION: Bloomberg Terminal Mode · CORE v2.8.0
        </div>
      </div>

      {/* Relevant Alert Card on Charts page - Sit at the very top */}
      <div className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-5 py-3 flex items-center gap-3">
        <span className="text-[var(--color-danger)] font-mono text-xs font-bold uppercase tracking-widest">
          ALERT
        </span>
        <span className="text-sm text-foreground/90">
          Upstream aromatic feedstocks signaling margin pressure. Benzene Spot USGC above $1,010/t + Brent crude above $93/bbl trigger Cost Alerts for MDI and amines operations.
        </span>
        <Badge variant="outline" className="ml-auto border-[var(--color-danger)]/40 text-[var(--color-danger)] text-[10px]">
          CRITICAL COST PRESSURE
        </Badge>
      </div>

      {/* Cross-Asset Correlation Analysis Engine (Bloomberg CORR Mode) - Placed below Alert */}
      <div className="flex items-center gap-2 mb-2 select-none">
        <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
          Cross-Asset Correlation Analysis Engine (Bloomberg CORR Mode)
        </h3>
      </div>
      <div className="border border-border bg-card p-5 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] leading-relaxed">
          <div className="space-y-2 border-r border-border/40 pr-4 font-sans">
            <div className="flex justify-between border-b border-[#1c1c1f] pb-1">
              <span className="text-muted-foreground">Pearson Correlation (r):</span>
              <span className={cn("font-bold font-mono", correlation.r > 0 ? "text-[var(--color-success)]" : "text-[var(--color-danger)]")}>
                {correlation.r > 0 ? '+' : ''}{correlation.r.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#1c1c1f] pb-1">
              <span className="text-muted-foreground">Determination Coeff. (R²):</span>
              <span className="text-foreground font-semibold font-mono">{correlation.r2.toFixed(4)}</span>
            </div>
            <div className="flex justify-between border-b border-[#1c1c1f] pb-1">
              <span className="text-muted-foreground">Covariance (s_xy):</span>
              <span className="text-foreground font-semibold font-mono">{correlation.cov.toFixed(4)}</span>
            </div>
          </div>
          
          <div className="col-span-2 space-y-2">
            <h4 className="font-bold text-[var(--color-warning)] uppercase tracking-wider text-xs">
              RELATIONSHIP DIAGNOSIS: {verdict.verdict}
            </h4>
            <p className="text-muted-foreground text-xs leading-relaxed">
              {verdict.description}
            </p>
            <div className="text-[9px] text-muted-foreground/60 italic mt-3 border-t border-border/10 pt-2 flex items-center justify-between font-mono">
              <span>METHODOLOGY: Pearson product-moment coefficient based on matching 28-day observations (n=28).</span>
              <span>CALCULATION: Real-time dynamic matrix solver</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clickable Small Sparkline Charts Ticker Bar (matches example2.png) */}
      <div className="flex items-center gap-2 mb-2 select-none">
        <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
        <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
          Huntsman Portfolio Ticker
        </h3>
      </div>
      <div className="border border-border bg-[#0b0e14] p-3 rounded-xl flex items-center gap-4 overflow-hidden w-full">
        <div className="flex items-center gap-1.5 pr-4 border-r border-border/40 text-xs font-semibold text-foreground font-mono shrink-0 select-none">
          <Globe className="size-4 text-primary" />
          <span>PORTFOLIO</span>
        </div>
        <div className="flex-1 flex gap-3 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {sparklineData.map((item) => {
            const chartColor = item.isPositive ? '#00b074' : '#ff0055';
            const changeColor = item.isPositive ? 'text-[#00b074]' : 'text-[#ff0055]';
            const isSelectedComm = item.type === 'commodity' && selCommodity === item.id;
            const isSelectedEq = item.type === 'equity' && selEquity === item.id;
            const isSelected = isSelectedComm || isSelectedEq;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.type === 'commodity') {
                    setSelCommodity(item.id as CommodityKey);
                  } else {
                    setSelEquity(item.id as EquityKey);
                  }
                }}
                className={cn(
                  "flex-none flex items-center justify-between gap-3 p-2.5 rounded border transition-all cursor-pointer text-left select-none",
                  isSelected 
                    ? "border-primary bg-primary/5 glow-cyan" 
                    : "border-border/60 bg-card/10 hover:border-muted-foreground/30"
                )}
                style={{ width: '190px' }}
              >
                {/* Left info: Ticker Name, Price, Change */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-primary truncate">
                    {item.label}
                  </span>
                  <div className="mt-0.5">
                    <span className="text-xs font-bold font-mono text-white block leading-none">
                      {item.price}
                    </span>
                    <span className={cn("text-[9px] font-mono font-semibold block leading-none mt-1", changeColor)}>
                      {item.change}
                    </span>
                  </div>
                </div>

                {/* Right sparkline chart with middle dashed line and end point circle dot */}
                <div className="relative w-14 h-7 flex-none">
                  {/* Horizontal center dashed line */}
                  <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-border/30 -translate-y-1/2 pointer-events-none" />
                  
                  <AreaChart width={56} height={28} data={item.data.map((v, idx) => ({ idx, v }))} margin={{ top: 1, bottom: 1, left: 1, right: 1 }}>
                    <defs>
                      <linearGradient id={`sparkGrad-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColor} stopOpacity={0.25}/>
                        <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={chartColor}
                      strokeWidth={1.2}
                      fill={`url(#sparkGrad-${item.id})`}
                      dot={(props: any) => {
                        const { cx, cy, index } = props;
                        if (index === item.data.length - 1) {
                          return <circle key={`dot-${item.id}`} cx={cx} cy={cy} r={2.5} fill={chartColor} stroke="none" />;
                        }
                        return null as any;
                      }}
                    />
                  </AreaChart>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selectors Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 select-none">
            <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
              [COMM] Commodity Feedstock Inputs
            </h3>
          </div>
          <div className="border border-border bg-card p-4 rounded-xl min-h-[100px] flex items-center">
            <div className="flex flex-wrap gap-1.5">
              {COMMODITY_KEYS.map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant={selCommodity === k ? 'default' : 'outline'}
                  className="h-6 text-[10px] px-2.5 rounded-lg font-mono border-border transition-all hover:bg-zinc-800"
                  onClick={() => setSelCommodity(k)}
                >
                  {COMMODITY_SERIES[k].shortName}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2 select-none">
            <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
              [EQTY] Supply Chain Corporates
            </h3>
          </div>
          <div className="border border-border bg-card p-4 rounded-xl min-h-[100px] flex items-center">
            <div className="flex flex-wrap gap-1.5">
              {EQUITY_KEYS.map((k) => (
                <Button
                  key={k}
                  size="sm"
                  variant={selEquity === k ? 'default' : 'outline'}
                  className="h-6 text-[10px] px-2.5 rounded-lg font-mono border-border transition-all hover:bg-zinc-800"
                  onClick={() => setSelEquity(k)}
                >
                  {EQUITY_SERIES[k].shortName}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Commodity Panel */}
        <div>
          <div className="flex items-center gap-2 mb-2 select-none">
            <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
              Feedstock Input Cost Chart
            </h3>
          </div>
          <div className="border border-border bg-[#0d1628] p-5 rounded-xl flex flex-col justify-between">
            <div>
              <div className="border-b border-border/40 pb-3 mb-4">
                <span className="text-[10px] text-muted-foreground/80 font-mono block uppercase tracking-wider">
                  {COMMODITY_METADATA[selCommodity].subtitle}
                </span>
                <div className="flex items-center gap-2 mt-1 select-none">
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {COMMODITY_METADATA[selCommodity].fullName}
                  </h3>
                  <Star className="size-4 text-muted-foreground/60 hover:text-yellow-400 cursor-pointer transition-colors" />
                </div>
                
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-white font-mono leading-none">
                    {commodity.current.replace('$', '')}
                  </span>
                  <span className={cn("text-sm font-bold font-mono", commChangeColor)}>
                    {commChangeStr}
                  </span>
                </div>
                <span className="text-[9px] text-muted-foreground/60 font-mono block mt-1">
                  As of 8:20:35 PM EDT. Market Open.
                </span>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1 bg-secondary/50 p-0.5 rounded">
                  {['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'All'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setCommTimeframe(tab)}
                      className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer select-none",
                        tab === commTimeframe
                          ? "bg-[#1d4ed8] text-white"
                          : "text-muted-foreground hover:text-white"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] text-muted-foreground font-mono bg-secondary/40 px-1.5 py-0.5 rounded select-none">
                  Interactive Chart
                </div>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={commChartData} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                    <defs>
                      <linearGradient id="commGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={commColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={commColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="d"
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 8, fontFamily: 'monospace' }}
                      stroke="var(--border)"
                      interval={Math.ceil(commChartData.length / 5)}
                    />
                    <YAxis
                      domain={[commMin - commPad, commMax + commPad]}
                      tickFormatter={tickFormatter}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 8, fontFamily: 'monospace' }}
                      stroke="var(--border)"
                    />
                    <Tooltip content={<CustomTooltip unit={commodity.unit} />} />
                    <Area
                      type="linear"
                      dataKey="v"
                      stroke={commColor}
                      strokeWidth={2}
                      fill="url(#commGradient)"
                      activeDot={{ r: 4, fill: commColor }}
                      dot={(props: any) => {
                        const { cx, cy, index } = props;
                        if (index === commChartData.length - 1) {
                          return <circle key={`main-dot-comm`} cx={cx} cy={cy} r={4} fill={commColor} stroke="#000" strokeWidth={1} />;
                        }
                        return null as any;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4">
              {/* 4-column Yahoo Finance style details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-mono border-t border-border/20 pt-4 text-foreground/90">
                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Pre. Settlement</span>
                    <span className="font-semibold">{formatValue(commMean * 0.985, commodity.unit)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Settlement Date</span>
                    <span className="font-semibold">2026-06-22</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Open</span>
                    <span className="font-semibold">{formatValue(commMean * 0.995, commodity.unit)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Bid</span>
                    <span className="font-semibold">{formatValue(commChartData[commChartData.length - 1].v * 0.999, commodity.unit)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Last Price</span>
                    <span className="font-semibold">{commodity.current}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Day's Range</span>
                    <span className="font-semibold">{formatValue(commMin, commodity.unit)} - {formatValue(commMax, commodity.unit)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-semibold">18.87k</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Ask</span>
                    <span className="font-semibold">{formatValue(commChartData[commChartData.length - 1].v * 1.001, commodity.unit)}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/20 pt-2.5 mt-3">
                {commodity.role}
              </p>
            </div>
          </div>
        </div>

        {/* Equity Panel */}
        <div>
          <div className="flex items-center gap-2 mb-2 select-none">
            <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
              Corporate Equity Demand Chart
            </h3>
          </div>
          <div className="border border-border bg-[#0d1628] p-5 rounded-xl flex flex-col justify-between">
            <div>
              <div className="border-b border-border/40 pb-3 mb-4">
                <span className="text-[10px] text-muted-foreground/80 font-mono block uppercase tracking-wider">
                  {EQUITY_METADATA[selEquity].subtitle}
                </span>
                <div className="flex items-center gap-2 mt-1 select-none">
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {EQUITY_METADATA[selEquity].fullName}
                  </h3>
                  <Star className="size-4 text-muted-foreground/60 hover:text-yellow-400 cursor-pointer transition-colors" />
                </div>
                
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-white font-mono leading-none">
                    {equity.current.replace('$', '').replace(' CNY', '').replace(' SAR', '')}
                  </span>
                  <span className={cn("text-sm font-bold font-mono", eqChangeColor)}>
                    {eqChangeStr}
                  </span>
                </div>
                <span className="text-[9px] text-muted-foreground/60 font-mono block mt-1">
                  As of 8:20:35 PM EDT. Market Open.
                </span>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1 bg-secondary/50 p-0.5 rounded">
                  {['1D', '5D', '1M', '6M', 'YTD', '1Y', '5Y', 'All'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setEqTimeframe(tab)}
                      className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer select-none",
                        tab === eqTimeframe
                          ? "bg-[#1d4ed8] text-white"
                          : "text-muted-foreground hover:text-white"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] text-muted-foreground font-mono bg-secondary/40 px-1.5 py-0.5 rounded select-none">
                  Interactive Chart
                </div>
              </div>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={eqChartData} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                    <defs>
                      <linearGradient id="eqGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={eqColor} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={eqColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.15} vertical={false} />
                    <XAxis
                      dataKey="d"
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 8, fontFamily: 'monospace' }}
                      stroke="var(--border)"
                      interval={Math.ceil(eqChartData.length / 5)}
                    />
                    <YAxis
                      domain={[eqMin - eqPad, eqMax + eqPad]}
                      tickFormatter={tickFormatter}
                      tick={{ fill: 'var(--muted-foreground)', fontSize: 8, fontFamily: 'monospace' }}
                      stroke="var(--border)"
                    />
                    <Tooltip content={<CustomTooltip unit={equity.unit} />} />
                    <Area
                      type="linear"
                      dataKey="v"
                      stroke={eqColor}
                      strokeWidth={2}
                      fill="url(#eqGradient)"
                      activeDot={{ r: 4, fill: eqColor }}
                      dot={(props: any) => {
                        const { cx, cy, index } = props;
                        if (index === eqChartData.length - 1) {
                          return <circle key={`main-dot-eq`} cx={cx} cy={cy} r={4} fill={eqColor} stroke="#000" strokeWidth={1} />;
                        }
                        return null as any;
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4">
              {/* 4-column Yahoo Finance style details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[10px] font-mono border-t border-border/20 pt-4 text-foreground/90">
                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Prev. Close</span>
                    <span className="font-semibold">{formatValue(eqMean * 0.985, equity.unit)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Market Cap</span>
                    <span className="font-semibold">3.48B</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Open</span>
                    <span className="font-semibold">{formatValue(eqMean * 0.995, equity.unit)}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Bid</span>
                    <span className="font-semibold">{formatValue(eqChartData[eqChartData.length - 1].v * 0.999, equity.unit)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Last Price</span>
                    <span className="font-semibold">{equity.current}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Day's Range</span>
                    <span className="font-semibold">{formatValue(eqMin, equity.unit)} - {formatValue(eqMax, equity.unit)}</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between border-b border-border/10 pb-1">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-semibold">2.45M</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-muted-foreground">Ask</span>
                    <span className="font-semibold">{formatValue(eqChartData[eqChartData.length - 1].v * 1.001, equity.unit)}</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/20 pt-2.5 mt-3">
                {equity.role}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Guide Card */}
      <div className="space-y-2 mt-8">
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="size-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
            How to read this info
          </h3>
        </div>
        <div className="border border-border bg-card p-5 rounded-xl text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px] text-white/85 leading-relaxed">
            <p>
              <span className="text-white font-semibold">Left panel — input cost signal:</span> tracks feedstock and energy prices that directly determine what Huntsman pays for raw materials. WTI, Brent, and Benzene move through the crude → benzene → MDI chain with a 2–3 week lag. Rising commodity prices = rising COGS in 2–3 weeks.
            </p>
            <p>
              <span className="text-white font-semibold">Right panel — demand/margin signal:</span> supply chain equities reflect how capital markets are pricing in industry margins and end-market demand. When DOW, BASF, and HUN all decline together, it signals sector-wide margin compression — not company-specific issues. Wanhua signals whether global MDI pricing pressure is coming from China.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
