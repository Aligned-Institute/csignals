import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Static fallbacks — match dashboard defaults
const STATIC_COMMODITIES = [
  { label: 'WTI Crude Oil',  ticker: 'CL=F',    value: '90.80',  unit: '/bbl',   change: 2.95,  period: '1d', status: 'warning', note: 'Feedstock cost alert',   sublabel: 'MDI feedstock input' },
  { label: 'Natural Gas',    ticker: 'NG=F',    value: '3.19',   unit: '/MMBtu', change: 1.69,  period: '1d', status: 'warning', note: 'Trending to 10d high',   sublabel: 'Plant energy cost' },
  { label: 'XLB Materials',  ticker: 'XLB',     value: '50.21',  unit: '',       change: -1.41, period: '1d', status: 'danger',  note: 'Underperforming S&P',     sublabel: 'Sector benchmark' },
  { label: 'S&P 500',        ticker: '^GSPC',   value: '7321',   unit: '',       change: -3.21, period: '5d', status: 'danger',  note: 'Risk-off rotation',       sublabel: 'Demand environment' },
  { label: 'Brent Crude',    ticker: 'BZ=F',    value: '93.86',  unit: '/bbl',   change: 2.64,  period: '1d', status: 'warning', note: 'Hormuz supply risk',     sublabel: 'Asia feedstock proxy' },
  { label: 'EUR / USD',      ticker: 'EURUSD=X', value: '1.1600', unit: '',      change: 0.28,  period: '1d', status: 'ok',      note: 'Mild USD softness',       sublabel: 'Export pricing FX' },
];

const STATIC_MACRO = [
  { label: 'Housing Starts',   fred: 'HOUST',      value: '1,465', unit: 'K units/yr', change: -2.79, period: 'MoM', status: 'warning', note: 'MDI demand proxy — construction activity' },
  { label: 'Fed Funds Rate',   fred: 'FEDFUNDS',   value: '3.63',  unit: '%',           change: 0,     period: 'qtr', status: 'ok',      note: 'Capital cost environment' },
  { label: 'Real GDP Growth',  fred: 'A191RL1Q225SBEA', value: '1.6', unit: '%',        change: -0.4,  period: 'QoQ', status: 'warning', note: 'Macro demand trajectory' },
  { label: 'PPI Chemicals',    fred: 'PCU325325',  value: '368.2', unit: 'index',       change: 1.91,  period: 'MoM', status: 'warning', note: 'Input cost pressure index' },
];

const STATIC_CHAIN = [
  { Stage: 1, Input: 'WTI Crude',        Proxy_Price: 90.80,  Unit: '/bbl', Cost_Lag_Weeks: 0,    Margin_Pressure: 'High',     Notes: 'Brent/WTI spot linked — 2-3 week pass-through lag' },
  { Stage: 2, Input: 'Naphtha',          Proxy_Price: 680,    Unit: '/t',   Cost_Lag_Weeks: 1,    Margin_Pressure: 'High',     Notes: 'Refinery-linked; tracked via crack spread' },
  { Stage: 3, Input: 'Benzene (USGC)',   Proxy_Price: 1010,   Unit: '/t',   Cost_Lag_Weeks: 2,    Margin_Pressure: 'Critical', Notes: 'Direct MDI precursor; Huntsman Geismar integration' },
  { Stage: 4, Input: 'Aniline',          Proxy_Price: 1200,   Unit: '/t',   Cost_Lag_Weeks: 3,    Margin_Pressure: 'Critical', Notes: 'World-scale aniline plant in Geismar, LA' },
  { Stage: 5, Input: 'MDI (Polymeric)',  Proxy_Price: null,   Unit: '/t',   Cost_Lag_Weeks: null, Margin_Pressure: 'Monitor',  Notes: 'Final product — cost pressure accumulates upstream' },
];

export async function GET() {
  // Try to load live data from brief_data.json
  let liveData: any = null;
  try {
    const p = path.join(process.cwd(), 'public', 'brief_data.json');
    liveData = JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { /* fall through to static */ }

  const runDate: string = liveData?.generated_date ?? new Date().toISOString().split('T')[0];
  const commodities: any[] = liveData?.commodities?.length ? liveData.commodities : STATIC_COMMODITIES;
  const macro: any[]       = liveData?.macro?.length       ? liveData.macro       : STATIC_MACRO;

  // ── Sheet 1: All Signals — flat, pivot-ready ──────────────────────────
  const signalRows = [
    ...commodities.map((c: any) => ({
      Run_Date:       runDate,
      Category:       'Commodity',
      Signal:         c.label,
      Role:           c.sublabel ?? '',
      Ticker:         c.ticker ?? '',
      Value:          parseFloat(String(c.value ?? '').replace(/[$,]/g, '')) || 0,
      Value_Display:  c.value ?? '',
      Unit:           c.unit ?? '',
      Change_Pct:     typeof c.change === 'number' ? c.change : parseFloat(c.change) || 0,
      Period:         c.period ?? '',
      Status:         c.status ?? '',
      Alert:          c.note ?? '',
      FRED_Series:    '',
    })),
    ...macro.map((m: any) => ({
      Run_Date:       runDate,
      Category:       'Macro',
      Signal:         m.label,
      Role:           m.note ?? '',
      Ticker:         '',
      Value:          parseFloat(String(m.value ?? '').replace(/[$,K%]/g, '')) || 0,
      Value_Display:  `${m.value ?? ''}${m.unit ? ' ' + m.unit : ''}`,
      Unit:           m.unit ?? '',
      Change_Pct:     typeof m.change === 'number' ? m.change : parseFloat(m.change) || 0,
      Period:         m.period ?? '',
      Status:         m.status ?? '',
      Alert:          m.note ?? '',
      FRED_Series:    m.fred ?? '',
    })),
  ];

  // ── Sheet 2: MDI Feedstock Chain ──────────────────────────────────────
  const chainRows = STATIC_CHAIN;

  // ── Sheet 3: Latest Brief (if any) ───────────────────────────────────
  let briefRows: { Line: number; Content: string }[] = [];
  try {
    const outputDir = path.join(process.cwd(), '../output');
    const files = fs.readdirSync(outputDir)
      .filter((f: string) => f.startsWith('brief_') && f.endsWith('.md'))
      .sort().reverse();
    if (files.length > 0) {
      const content = fs.readFileSync(path.join(outputDir, files[0]), 'utf-8');
      briefRows = content.split('\n').map((line: string, i: number) => ({ Line: i + 1, Content: line }));
    }
  } catch { /* no briefs yet */ }

  // ── Sheet 4: Metadata ─────────────────────────────────────────────────
  const metaRows = [
    { Field: 'Generated',      Value: runDate },
    { Field: 'Pipeline',       Value: 'monday_brief.py — yfinance + FRED + Claude synthesis' },
    { Field: 'Commodities',    Value: 'CME/NYMEX/NYSE via Yahoo Finance (no key required)' },
    { Field: 'Macro',          Value: 'Federal Reserve FRED API (8 series)' },
    { Field: 'Update Schedule', Value: 'Monday & Friday 07:00 CT (cron automation)' },
    { Field: 'FRED Series',    Value: 'FEDFUNDS · CPIAUCSL · A191RL1Q225SBEA · HOUST · PERMIT · PCU325325 · INDPRO · TTLCONS' },
    { Field: 'Source',         Value: 'ChemSignals Terminal — Performance Products Market Intelligence' },
  ];

  // ── Build workbook ────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(signalRows);
  ws1['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 26 }, { wch: 36 }, { wch: 12 },
    { wch: 10 }, { wch: 16 }, { wch: 10 }, { wch: 12 }, { wch: 10 },
    { wch: 10 }, { wch: 40 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, 'Signals');

  const ws2 = XLSX.utils.json_to_sheet(chainRows);
  ws2['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 14 }, { wch: 8 }, { wch: 18 }, { wch: 14 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'MDI Feedstock Chain');

  if (briefRows.length > 0) {
    const ws3 = XLSX.utils.json_to_sheet(briefRows);
    ws3['!cols'] = [{ wch: 6 }, { wch: 120 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Latest Brief');
  }

  const ws4 = XLSX.utils.json_to_sheet(metaRows);
  ws4['!cols'] = [{ wch: 20 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, ws4, 'Metadata');

  // SheetJS 'buffer' type returns a Node.js Buffer which NextResponse can't type-check cleanly.
  // Writing as base64 then converting via Uint8Array is the safest cross-runtime path.
  const b64: string = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const filename = `chemsignals-${runDate}.xlsx`;

  return new NextResponse(bytes.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
