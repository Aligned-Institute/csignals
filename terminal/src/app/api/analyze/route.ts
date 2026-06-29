import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MAX_PREVIEW_ROWS = 30;

// Load current market context from brief_data.json or static fallback
function getMarketContext(): string {
  try {
    const p = path.join(process.cwd(), 'public', 'brief_data.json');
    const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const date = d.generated_date ?? 'recent';

    const commodityLines = (d.commodities ?? [])
      .map((c: any) => `  • ${c.label}: ${c.value}${c.unit} (${c.change > 0 ? '+' : ''}${c.change}% ${c.period}) — ${c.note}`)
      .join('\n');

    const macroLines = (d.macro ?? [])
      .map((m: any) => `  • ${m.label}: ${m.value} ${m.unit} (${m.change > 0 ? '+' : ''}${m.change}% ${m.period}) — ${m.note}`)
      .join('\n');

    return `## Current Market Context (as of ${date})

### Commodity & FX Signals
${commodityLines}

### Macro Indicators (FRED)
${macroLines}`;
  } catch {
    return `## Current Market Context

### Commodity Signals (static fallback)
  • WTI Crude: $90.80/bbl (+2.95% 1d) — Feedstock cost alert
  • Brent Crude: $93.86/bbl (+2.64% 1d) — Supply risk (Hormuz)
  • Natural Gas: $3.19/MMBtu (+1.69% 1d) — Plant energy cost
  • Benzene (USGC): $1,010/t (+1.85% 1d) — MDI precursor, Critical
  • XLB Materials: $50.21 (-1.41% 1d) — Sector underperforming
  • S&P 500: 7,321 (-3.21% 5d) — Risk-off rotation

### Macro Indicators (FRED)
  • Housing Starts (HOUST): 1,465K/yr (-2.79% MoM) — MDI demand proxy
  • Fed Funds Rate: 3.63% — Capital cost environment
  • Real GDP Growth: +1.6% QoQ — Demand trajectory softening
  • PPI Chemicals (PCU325325): 368.2 (+1.91% MoM) — Input cost pressure`;
  }
}

// Format sheet data as a readable table for the prompt
function formatSheetData(rows: any[][], headers: string[]): string {
  if (rows.length === 0) return '(no data rows)';
  const sample = rows.slice(0, MAX_PREVIEW_ROWS);
  const divider = headers.map(h => '-'.repeat(Math.max(h.length, 6))).join(' | ');
  const headerRow = headers.join(' | ');
  const dataRows = sample.map(row =>
    headers.map((_, i) => String(row[i] ?? '')).join(' | ')
  );
  return [headerRow, divider, ...dataRows].join('\n');
}

export async function POST(req: NextRequest) {
  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const selectedSheet = formData.get('sheet') as string | null;
  const parseOnly = formData.get('parseOnly') === 'true';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Parse Excel
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

  const sheetNames = workbook.SheetNames;
  const targetSheet = selectedSheet && sheetNames.includes(selectedSheet)
    ? selectedSheet
    : sheetNames[0];

  const worksheet = workbook.Sheets[targetSheet];
  const raw: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // Find the header row by searching for 'date' or 'worksheet name' in the first cell
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(raw.length, 10); i++) {
    const row = raw[i] ?? [];
    const cell0 = String(row[0] ?? '').trim().toLowerCase();
    if (cell0 === 'date' || cell0 === 'worksheet name') {
      headerRowIdx = i;
      break;
    }
  }

  // Get raw header row and filter trailing empty headers
  const rawHeader = raw[headerRowIdx] ?? [];
  const headers: string[] = [];
  let lastNonEmptyIdx = -1;
  for (let i = 0; i < rawHeader.length; i++) {
    if (String(rawHeader[i] ?? '').trim() !== '') {
      lastNonEmptyIdx = i;
    }
  }
  
  const headerSlice = rawHeader.slice(0, lastNonEmptyIdx + 1);
  for (let i = 0; i < headerSlice.length; i++) {
    const h = String(headerSlice[i] ?? '').trim();
    headers.push(h || `Column ${String.fromCharCode(65 + i)}`);
  }

  // Separate data rows starting after the headers
  const dataRows = raw.slice(headerRowIdx + 1)
    .filter(row => row.some((cell: any) => cell !== ''))
    .map(row => {
      const newRow = Array(headers.length).fill('');
      for (let i = 0; i < headers.length; i++) {
        newRow[i] = row[i] !== undefined ? row[i] : '';
      }
      return newRow;
    });

  const totalRows = dataRows.length;
  const tableText = formatSheetData(dataRows, headers);

  if (parseOnly) {
    return NextResponse.json({
      filename: file.name,
      sheet: targetSheet,
      sheets: sheetNames,
      rows: totalRows,
      columns: headers,
      dataSample: dataRows,
    });
  }

  // Construct context block containing spreadsheet data & metadata
  const contextText = `Uploaded File Info:
- Filename: ${file.name}
- Selected Sheet: ${targetSheet}${sheetNames.length > 1 ? ` (of ${sheetNames.length} sheets: ${sheetNames.join(', ')})` : ''}
- Total rows: ${totalRows}
- Columns: ${headers.join(', ')}

### Data Sample (first ${Math.min(totalRows, MAX_PREVIEW_ROWS)} rows)
\`\`\`
${tableText}
\`\`\``;

  // Call local FastAPI query service instead of direct Anthropic API
  const API_URL = process.env.API_URL || 'http://localhost:8000';
  const cookieStore = await cookies();
  const token = cookieStore.get('asi_token')?.value;

  let reportText: string;
  try {
    const res = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `Analyze my uploaded file "${file.name}" against current market conditions, commodity prices, and input cost signals. 
Please act as a professional petrochemical market analyst and produce a structured intelligence report with the following sections:
### 1. Data Summary
What this file likely represents (systems, processes) and key patterns, outliers, or trends visible in the data.
### 2. Market Context Overlay
How current commodity prices, macro indicators, and feedstock chain status affect or are reflected in this data. Reference numbers.
### 3. Margin & Cost Implications
What the combined picture signals for Huntsman's input costs, product margins, or demand outlook. Quantify where possible.
### 4. Risk Flags
2–3 specific risks this data reveals when read against current market conditions.
### 5. Recommended Actions
2–3 concrete, prioritized actions for a decision-maker to act on this week.`,
        context: contextText,
        token: token,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      return NextResponse.json({ error: `Query service error: ${err.detail || res.statusText}` }, { status: 502 });
    }

    const data = await res.json();
    reportText = data.answer ?? '(no response)';
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to reach query service: ${e.message}` }, { status: 502 });
  }

  return NextResponse.json({
    report: reportText,
    filename: file.name,
    sheet: targetSheet,
    sheets: sheetNames,
    rows: totalRows,
    columns: headers,
    dataSample: dataRows.slice(0, MAX_PREVIEW_ROWS),
  });
}
