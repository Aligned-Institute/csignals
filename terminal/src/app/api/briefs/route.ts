import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), '../output');
const INTEL_DIR  = path.join(process.cwd(), '../intel');

const INTEL_LABELS: Record<string, string> = {
  '0001437749-24-005185.pdf': 'Huntsman Corp — 10-K Annual Report 2024',
  '0001437749-25-004205.pdf': 'Huntsman Corp — 10-K Annual Report 2025',
  '0001437749-26-004524.pdf': 'Huntsman Corp — 10-K Annual Report 2026',
  '2026-02-17_Huntsman_Announces_Fourth_Quarter_2025_618.pdf': 'Q4 2025 Earnings Press Release',
  'HUN 4Q25 Earnings Slides vFINAL.pdf': 'Q4 2025 Earnings Presentation Slides',
  'HUN 4Q25 Prepared Remarks vFINAL.pdf': 'Q4 2025 Earnings Prepared Remarks',
  'huntsman-notes.rtf': 'Internal Research Notes',
  'interview_study_guide.md': 'Role Study Guide',
};

function fmtSize(bytes: number): string {
  if (bytes > 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes > 1_000)     return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export async function GET() {
  // ── Briefs ──────────────────────────────────────────────
  const briefs: { filename: string; date: string; content: string; excerpt: string }[] = [];
  try {
    const files = fs.readdirSync(OUTPUT_DIR)
      .filter(f => f.startsWith('brief_') && f.endsWith('.md'))
      .sort()
      .reverse();

    for (const file of files) {
      const content = fs.readFileSync(path.join(OUTPUT_DIR, file), 'utf-8');
      const date    = file.replace('brief_', '').replace('.md', '');
      const excerpt = content
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('━') && !l.startsWith('#'))
        .slice(0, 3)
        .join(' ')
        .replace(/\*\*/g, '')
        .substring(0, 280);
      briefs.push({ filename: file, date, content, excerpt });
    }
  } catch { /* output dir may not exist yet */ }

  // ── Intel library ────────────────────────────────────────
  const intel: { filename: string; label: string; size: string; type: string }[] = [];
  try {
    const files = fs.readdirSync(INTEL_DIR).filter(f => !f.startsWith('.'));
    for (const file of files) {
      const stat = fs.statSync(path.join(INTEL_DIR, file));
      const ext  = path.extname(file).toLowerCase();
      intel.push({
        filename: file,
        label:    INTEL_LABELS[file] ?? file,
        size:     fmtSize(stat.size),
        type:     ext === '.pdf' ? 'PDF' : ext === '.md' ? 'Markdown' : 'Document',
      });
    }
  } catch { /* intel dir may not exist */ }

  return NextResponse.json({ briefs, intel });
}
