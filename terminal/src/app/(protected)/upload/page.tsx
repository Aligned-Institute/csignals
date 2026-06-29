'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, FileSpreadsheet, Loader2, AlertCircle, X, ChevronDown, Download, Grid, Filter, Calculator, RefreshCw, BarChart2, Check, ArrowRight, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AnalysisResult {
  report: string;
  filename: string;
  sheet: string;
  sheets: string[];
  rows: number;
  columns: string[];
  dataSample?: any[][];
}

function fmtBytes(b: number): string {
  if (b > 1_000_000) return `${(b / 1_000_000).toFixed(1)} MB`;
  if (b > 1_000)     return `${(b / 1_000).toFixed(0)} KB`;
  return `${b} B`;
}

// Clean non-numeric characters for analysis (e.g. $, %, commas)
function cleanNumeric(val: any): number | null {
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  if (!val) return null;
  const cleaned = String(val).replace(/[$,%\s]/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) || cleaned === '' ? null : num;
}

// Convert column letter to 0-based index or search by header name
function getColumnIndex(range: string, columns: string[]): number {
  const cleanRange = range.replace(/['"]/g, '').trim();
  
  // Try matching against column header names (case-insensitive)
  const colIdx = columns.findIndex(c => c.toLowerCase() === cleanRange.toLowerCase());
  if (colIdx !== -1) return colIdx;

  // Try matching coordinate letters (e.g. A, B, AA...)
  const colLetter = cleanRange.split(':')[0].toUpperCase();
  if (/^[A-Z]+$/.test(colLetter)) {
    let idx = 0;
    for (let i = 0; i < colLetter.length; i++) {
      idx = idx * 26 + (colLetter.charCodeAt(i) - 64);
    }
    return idx - 1;
  }
  return -1;
}

// Helper to translate Excel comparisons (e.g. ">50", "<100") into test functions
function buildCriteriaTest(criteriaVal: any): (val: any) => boolean {
  const strVal = String(criteriaVal).trim();
  const match = strVal.match(/^([><=!]+)\s*(.*)$/);
  if (match) {
    const op = match[1];
    const targetStr = match[2];
    const targetNum = cleanNumeric(targetStr);
    
    return (val: any) => {
      const valNum = cleanNumeric(val);
      if (valNum !== null && targetNum !== null) {
        if (op === '>') return valNum > targetNum;
        if (op === '<') return valNum < targetNum;
        if (op === '>=') return valNum >= targetNum;
        if (op === '<=') return valNum <= targetNum;
        if (op === '!=') return valNum !== targetNum;
      }
      const valStr = String(val).trim();
      if (op === '!=') return valStr !== targetStr;
      return false;
    };
  }
  
  return (val: any) => {
    const valNum = cleanNumeric(val);
    const targetNum = cleanNumeric(criteriaVal);
    if (valNum !== null && targetNum !== null) {
      return valNum === targetNum;
    }
    return String(val).toLowerCase().trim() === String(criteriaVal).toLowerCase().trim();
  };
}

// Tokenize comma-separated Excel function arguments respecting quotes/parentheses
function parseArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let parenDepth = 0;
  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '(') {
      parenDepth++;
      current += char;
    } else if (char === ')') {
      parenDepth--;
      current += char;
    } else if (char === ',' && !inQuotes && parenDepth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current) {
    args.push(current.trim());
  }
  return args.map(arg => {
    if (arg.startsWith('"') && arg.endsWith('"')) {
      return arg.slice(1, -1);
    }
    return arg;
  });
}

// Dynamic Client-Side Formula Engine: evaluates lookup, math, arrays
function parseAndEvaluate(expr: string, columns: string[], gridData: any[][]): any {
  expr = expr.trim();
  if (expr.startsWith('=')) {
    expr = expr.slice(1).trim();
  }

  const funcMatch = expr.match(/^([A-Z0-9_]+)\((.*)\)$/i);
  if (!funcMatch) {
    if (expr.startsWith('"') && expr.endsWith('"')) {
      return expr.slice(1, -1);
    }
    const num = Number(expr);
    if (!isNaN(num) && expr !== '') {
      return num;
    }
    return expr;
  }

  const funcName = funcMatch[1].toUpperCase();
  const rawArgsStr = funcMatch[2];
  const args = parseArgs(rawArgsStr);

  if (funcName === 'IFERROR') {
    if (args.length < 2) return '#ERR: IFERROR expects 2 args';
    try {
      const val = parseAndEvaluate(args[0], columns, gridData);
      if (val === null || val === undefined || String(val).startsWith('#ERR') || String(val).startsWith('#N/A')) {
        return parseAndEvaluate(args[1], columns, gridData);
      }
      return val;
    } catch {
      return parseAndEvaluate(args[1], columns, gridData);
    }
  }

  if (funcName === 'AVERAGE') {
    if (args.length < 1) return '#ERR: AVERAGE expects 1 arg';
    const range = args[0];
    const colIdx = getColumnIndex(range, columns);
    if (colIdx === -1) return `#ERR: Invalid range ${range}`;
    
    let sum = 0;
    let count = 0;
    for (const row of gridData) {
      const rawVal = row[colIdx];
      const val = cleanNumeric(rawVal);
      if (val !== null) {
        sum += val;
        count++;
      }
    }
    if (count === 0) return 0;
    return sum / count;
  }

  if (funcName === 'SUMIFS') {
    if (args.length < 3 || args.length % 2 === 0) return '#ERR: SUMIFS expects odd number of args >= 3';
    const sumRange = args[0];
    const sumColIdx = getColumnIndex(sumRange, columns);
    if (sumColIdx === -1) return `#ERR: Invalid sum range ${sumRange}`;

    const criteria: { colIdx: number; test: (val: any) => boolean }[] = [];
    for (let i = 1; i < args.length; i += 2) {
      const critRange = args[i];
      const critColIdx = getColumnIndex(critRange, columns);
      if (critColIdx === -1) return `#ERR: Invalid criteria range ${critRange}`;
      
      const critVal = parseAndEvaluate(args[i + 1], columns, gridData);
      const test = buildCriteriaTest(critVal);
      criteria.push({ colIdx: critColIdx, test });
    }

    let sum = 0;
    for (const row of gridData) {
      let match = true;
      for (const c of criteria) {
        if (!c.test(row[c.colIdx])) {
          match = false;
          break;
        }
      }
      if (match) {
        const val = cleanNumeric(row[sumColIdx]);
        if (val !== null) {
          sum += val;
        }
      }
    }
    return sum;
  }

  if (funcName === 'COUNTIFS') {
    if (args.length < 2 || args.length % 2 !== 0) return '#ERR: COUNTIFS expects even number of args >= 2';

    const criteria: { colIdx: number; test: (val: any) => boolean }[] = [];
    for (let i = 0; i < args.length; i += 2) {
      const critRange = args[i];
      const critColIdx = getColumnIndex(critRange, columns);
      if (critColIdx === -1) return `#ERR: Invalid criteria range ${critRange}`;
      
      const critVal = parseAndEvaluate(args[i + 1], columns, gridData);
      const test = buildCriteriaTest(critVal);
      criteria.push({ colIdx: critColIdx, test });
    }

    let count = 0;
    for (const row of gridData) {
      let match = true;
      for (const c of criteria) {
        if (!c.test(row[c.colIdx])) {
          match = false;
          break;
        }
      }
      if (match) {
        count++;
      }
    }
    return count;
  }

  if (funcName === 'XLOOKUP') {
    if (args.length < 3) return '#ERR: XLOOKUP expects at least 3 args';
    const lookupVal = parseAndEvaluate(args[0], columns, gridData);
    const lookupRange = args[1];
    const returnRange = args[2];
    const ifNotFound = args[3] ?? '#N/A';

    const lookupColIdx = getColumnIndex(lookupRange, columns);
    const returnColIdx = getColumnIndex(returnRange, columns);

    if (lookupColIdx === -1) return `#ERR: Invalid lookup range ${lookupRange}`;
    if (returnColIdx === -1) return `#ERR: Invalid return range ${returnRange}`;

    for (const row of gridData) {
      const cellVal = String(row[lookupColIdx] ?? '').trim();
      const lookupStr = String(lookupVal).trim();
      
      if (cellVal === lookupStr || (cleanNumeric(cellVal) !== null && cleanNumeric(cellVal) === cleanNumeric(lookupStr))) {
        return row[returnColIdx];
      }
    }
    return ifNotFound;
  }

  return `#ERR: Unsupported function ${funcName}`;
}

// Convert column index to Excel column coordinate (e.g. A, B... AA, AB)
function getColLetter(index: number): string {
  let temp = index;
  let letter = '';
  while (temp >= 0) {
    letter = String.fromCharCode((temp % 26) + 65) + letter;
    temp = Math.floor(temp / 26) - 1;
  }
  return letter;
}

function MarkdownReport({ content }: { content: string }) {
  return (
    <div className="space-y-2 text-base leading-relaxed">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h3 key={i} className="text-base font-bold mt-5 mb-1 text-primary border-b border-border pb-1">{line.substring(4)}</h3>;
        if (line.startsWith('## '))
          return <h2 key={i} className="text-lg font-bold mt-6 mb-2 text-foreground">{line.substring(3)}</h2>;
        if (line.startsWith('# '))
          return <h1 key={i} className="text-2xl font-bold mt-6 mb-2 text-primary">{line.substring(2)}</h1>;
        if (line.match(/^---+$/))
          return <hr key={i} className="border-border my-3" />;
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-5 list-disc text-sm text-foreground/90 leading-relaxed">
              {line.substring(2).split(/\*\*(.*?)\*\*/g).map((p, j) =>
                j % 2 === 1 ? <strong key={j} className="text-foreground font-semibold">{p}</strong> : p
              )}
            </li>
          );
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-5 list-decimal text-sm text-foreground/90 leading-relaxed">
              {line.replace(/^\d+\.\s/, '').split(/\*\*(.*?)\*\*/g).map((p, j) =>
                j % 2 === 1 ? <strong key={j} className="text-foreground font-semibold">{p}</strong> : p
              )}
            </li>
          );
        if (line.trim() === '')
          return <div key={i} className="h-1.5" />;
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <p key={i} className="text-sm text-foreground/85 leading-relaxed">
            {parts.map((p, j) =>
              j % 2 === 1 ? <strong key={j} className="text-foreground font-semibold">{p}</strong> : p
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function UploadPage() {
  const [file, setFile]             = useState<File | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [selectedSheet, setSheet]   = useState<string>('');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState<AnalysisResult | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);

  // New Excel Workspace States
  const [activeTab, setActiveTab]   = useState<'report' | 'excel' | 'pivot'>('report');
  const [activeGridData, setActiveGridData] = useState<any[][]>([]);
  const [editingCell, setEditingCell] = useState<{ rIdx: number; cIdx: number } | null>(null);
  const [editValue, setEditValue]   = useState<string>('');
  const [statsColIdx, setStatsColIdx] = useState<number>(0);
  const [formulaInput, setFormulaInput] = useState<string>('');
  const [formulaResult, setFormulaResult] = useState<any>(null);

  // Full Active Sheet Data State (Complete Rows)
  const [fullActiveData, setFullActiveData] = useState<any[][] | null>(null);

  // Data Joining States
  const [leftSheet, setLeftSheet] = useState<string>('');
  const [rightSheet, setRightSheet] = useState<string>('');
  const [leftColumns, setLeftColumns] = useState<string[]>([]);
  const [rightColumns, setRightColumns] = useState<string[]>([]);
  const [leftKey, setLeftKey] = useState<string>('');
  const [rightKey, setRightKey] = useState<string>('');
  const [joinType, setJoinType] = useState<'inner' | 'left'>('inner');
  const [leftData, setLeftData] = useState<any[][] | null>(null);
  const [rightData, setRightData] = useState<any[][] | null>(null);
  const [joinedColumns, setJoinedColumns] = useState<string[]>([]);
  const [joinedData, setJoinedData] = useState<any[][] | null>(null);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [joiningError, setJoiningError] = useState<string | null>(null);

  // Pivot Table States
  const [pivotSource, setPivotSource] = useState<'active' | 'joined'>('active');
  const [pivotRowCol, setPivotRowCol] = useState<string>('');
  const [pivotColCol, setPivotColCol] = useState<string>('');
  const [pivotValCol, setPivotValCol] = useState<string>('');
  const [pivotAggFunc, setPivotAggFunc] = useState<'sum' | 'avg' | 'count' | 'min' | 'max'>('avg');
  const [pivotDateGroup, setPivotDateGroup] = useState<'none' | 'year' | 'month'>('none');
  const [pivotResultTable, setPivotResultTable] = useState<{
    headers: string[];
    rows: any[][];
    totals: any;
  } | null>(null);
  const [pivotPage, setPivotPage] = useState<number>(1);
  const PIVOT_ROWS_PER_PAGE = 30;

  // Helper to fetch complete sheet rows client-side in background
  const fetchSheetData = async (sheetName: string): Promise<{ columns: string[]; data: any[][] } | null> => {
    if (!file) return null;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('sheet', sheetName);
    fd.append('parseOnly', 'true');
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to parse sheet');
      return { columns: data.columns, data: data.dataSample };
    } catch (e: any) {
      console.error('fetchSheetData error:', e);
      return null;
    }
  };

  // Load full active sheet rows in the background
  useEffect(() => {
    if (result) {
      setFullActiveData(null);
      fetchSheetData(result.sheet).then(resData => {
        if (resData) setFullActiveData(resData.data);
      });
    }
  }, [result]);

  // Auto-synchronize Grid Data and setup defaults when a new analysis completes
  useEffect(() => {
    if (result?.dataSample) {
      setActiveGridData(result.dataSample);
      // Auto-detect first numeric column for descriptive statistics
      let firstNumIdx = 0;
      for (let i = 0; i < result.columns.length; i++) {
        const hasNum = result.dataSample.some(row => cleanNumeric(row[i]) !== null);
        if (hasNum) {
          firstNumIdx = i;
          break;
        }
      }
      setStatsColIdx(firstNumIdx);
      const colLetter = getColLetter(firstNumIdx);
      setFormulaInput(`=AVERAGE(${colLetter}:${colLetter})`);
      
      // Default join configuration options
      setLeftSheet(result.sheets[1] || result.sheets[0] || '');
      setRightSheet(result.sheets[2] || result.sheets[0] || '');
      setLeftColumns([]);
      setRightColumns([]);
      setLeftKey('');
      setRightKey('');
      setLeftData(null);
      setRightData(null);
      setJoinedColumns([]);
      setJoinedData(null);
      setJoiningError(null);
      setPivotResultTable(null);
    } else {
      setActiveGridData([]);
      setFullActiveData(null);
    }
    setFormulaResult(null);
    setActiveTab('report');
  }, [result]);

  // Reactive Formula Evaluation: run when grid data or formula updates
  useEffect(() => {
    if (activeGridData && formulaInput && result) {
      try {
        const res = parseAndEvaluate(formulaInput, result.columns, activeGridData);
        setFormulaResult(res);
      } catch (e: any) {
        setFormulaResult(`#ERR: ${e.message}`);
      }
    }
  }, [activeGridData, formulaInput, result]);

  const acceptFile = useCallback((f: File) => {
    const ok = f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv');
    if (!ok) { setError('Please upload an Excel (.xlsx, .xls) or CSV file.'); return; }
    setFile(f);
    setError(null);
    setResult(null);
    setSheet('');
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }, [acceptFile]);

  // ETL Transformation handlers
  const filterWeekends = () => {
    if (!activeGridData || !result) return;
    // Find column containing Date
    let dateColIdx = -1;
    for (let col = 0; col < result.columns.length; col++) {
      const hasDateVal = activeGridData.some(row => {
        const cellStr = String(row[col] ?? '');
        return /^\d{4}-\d{2}-\d{2}$/.test(cellStr) || (!isNaN(Date.parse(cellStr)) && cellStr.includes('-'));
      });
      if (hasDateVal) {
        dateColIdx = col;
        break;
      }
    }
    if (dateColIdx === -1) dateColIdx = 0;

    const filtered = activeGridData.filter(row => {
      const cellVal = String(row[dateColIdx] ?? '');
      const date = new Date(cellVal);
      if (!isNaN(date.getTime())) {
        const day = date.getDay();
        return day !== 0 && day !== 6;
      }
      const lower = cellVal.toLowerCase();
      return !lower.includes('sat') && !lower.includes('sun') && !lower.includes('saturday') && !lower.includes('sunday');
    });
    setActiveGridData(filtered);
  };

  const removeNulls = () => {
    if (!activeGridData) return;
    const cleaned = activeGridData.filter(row =>
      row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
    );
    setActiveGridData(cleaned);
  };

  const convertBblToTonnes = (colIdx: number) => {
    if (!activeGridData) return;
    const updated = activeGridData.map(row => {
      const newRow = [...row];
      const numVal = cleanNumeric(row[colIdx]);
      if (numVal !== null) {
        newRow[colIdx] = (numVal * 7.33).toFixed(2);
      }
      return newRow;
    });
    setActiveGridData(updated);
  };

  const resetData = () => {
    if (result?.dataSample) {
      setActiveGridData(result.dataSample);
    }
  };

  const startEditing = (rIdx: number, cIdx: number, currentVal: any) => {
    setEditingCell({ rIdx, cIdx });
    setEditValue(String(currentVal ?? ''));
  };

  const saveCellEdit = () => {
    if (!editingCell || !activeGridData) return;
    const { rIdx, cIdx } = editingCell;
    const updated = activeGridData.map((row, r) => {
      if (r === rIdx) {
        const newRow = [...row];
        newRow[cIdx] = editValue;
        return newRow;
      }
      return row;
    });
    setActiveGridData(updated);
    setEditingCell(null);
  };

  const loadJoinSheets = async () => {
    if (!leftSheet || !rightSheet) {
      setJoiningError('Please select both a left and right sheet.');
      return;
    }
    setLoadingSheets(true);
    setJoiningError(null);
    setJoinedData(null);
    try {
      const resLeft = await fetchSheetData(leftSheet);
      if (!resLeft) throw new Error(`Failed to load Left Sheet: ${leftSheet}`);
      const resRight = await fetchSheetData(rightSheet);
      if (!resRight) throw new Error(`Failed to load Right Sheet: ${rightSheet}`);

      setLeftColumns(resLeft.columns);
      setLeftData(resLeft.data);
      setLeftKey(resLeft.columns[0] || '');

      setRightColumns(resRight.columns);
      setRightData(resRight.data);
      setRightKey(resRight.columns[0] || '');
    } catch (e: any) {
      setJoiningError(e.message);
    } finally {
      setLoadingSheets(false);
    }
  };

  const executeJoin = () => {
    if (!leftData || !rightData || !leftKey || !rightKey) {
      setJoiningError('Please load sheets first and select valid join keys.');
      return;
    }
    setJoiningError(null);

    const leftKeyIdx = leftColumns.indexOf(leftKey);
    const rightKeyIdx = rightColumns.indexOf(rightKey);

    if (leftKeyIdx === -1 || rightKeyIdx === -1) {
      setJoiningError('Selected join keys not found in columns.');
      return;
    }

    const mergedCols: string[] = [...leftColumns];
    rightColumns.forEach((col, idx) => {
      if (idx !== rightKeyIdx) {
        if (mergedCols.includes(col)) {
          mergedCols.push(`${col}_Right`);
          const origIdx = mergedCols.indexOf(col);
          if (origIdx !== -1) {
            mergedCols[origIdx] = `${col}_Left`;
          }
        } else {
          mergedCols.push(col);
        }
      }
    });

    const normKey = (val: any): string => {
      if (val === null || val === undefined) return '';
      return String(val).trim().toLowerCase();
    };

    const rightMap = new Map<string, any[][]>();
    rightData.forEach(row => {
      const keyVal = normKey(row[rightKeyIdx]);
      if (keyVal) {
        if (!rightMap.has(keyVal)) rightMap.set(keyVal, []);
        rightMap.get(keyVal)!.push(row);
      }
    });

    const joined: any[][] = [];

    leftData.forEach(lRow => {
      const lKeyVal = normKey(lRow[leftKeyIdx]);
      const matches = rightMap.get(lKeyVal) ?? [];

      if (matches.length > 0) {
        matches.forEach(rRow => {
          const mergedRow = [...lRow];
          rightColumns.forEach((col, rIdx) => {
            if (rIdx !== rightKeyIdx) {
              mergedRow.push(rRow[rIdx] ?? '');
            }
          });
          joined.push(mergedRow);
        });
      } else if (joinType === 'left') {
        const mergedRow = [...lRow];
        rightColumns.forEach((col, rIdx) => {
          if (rIdx !== rightKeyIdx) {
            mergedRow.push('');
          }
        });
        joined.push(mergedRow);
      }
    });

    setJoinedColumns(mergedCols);
    setJoinedData(joined);
  };

  const generatePivotTable = () => {
    const sourceCols = pivotSource === 'joined' ? joinedColumns : (result?.columns ?? []);
    const sourceRows = pivotSource === 'joined' ? (joinedData ?? []) : (fullActiveData ?? activeGridData);

    if (sourceRows.length === 0) {
      alert('Selected data source contains no rows. Please upload or join data first.');
      return;
    }

    const rowIdx = sourceCols.indexOf(pivotRowCol);
    const valIdx = sourceCols.indexOf(pivotValCol);
    const colIdx = sourceCols.indexOf(pivotColCol);

    if (rowIdx === -1 || valIdx === -1) {
      alert('Row dimension and Value field are required.');
      return;
    }

    const formatRowVal = (val: any): string => {
      if (val === null || val === undefined || String(val).trim() === '') return '(blank)';
      
      if (pivotDateGroup !== 'none') {
        let dateVal = val;
        if (typeof val === 'number' && val > 20000 && val < 60000) {
          const dateObj = new Date((val - 25569) * 86400 * 1000);
          if (!isNaN(dateObj.getTime())) {
            dateVal = dateObj.toISOString().split('T')[0];
          }
        }
        
        const dateStr = String(dateVal);
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          if (pivotDateGroup === 'year') {
            return String(parsedDate.getFullYear());
          }
          if (pivotDateGroup === 'month') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${parsedDate.getFullYear()}-${months[parsedDate.getMonth()]}`;
          }
        }
      }
      return String(val).trim();
    };

    const rowValsMap = new Map<string, any[]>();
    const colValsSet = new Set<string>();

    sourceRows.forEach(row => {
      const rowValStr = formatRowVal(row[rowIdx]);
      const rawVal = cleanNumeric(row[valIdx]);

      let colValStr = 'Value';
      if (colIdx !== -1) {
        colValStr = String(row[colIdx] ?? '').trim() || '(blank)';
        colValsSet.add(colValStr);
      }

      if (!rowValsMap.has(rowValStr)) {
        rowValsMap.set(rowValStr, []);
      }
      rowValsMap.get(rowValStr)!.push({ colValStr, rawVal });
    });

    const sortedRowVals = Array.from(rowValsMap.keys()).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    const sortedColVals = Array.from(colValsSet).sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    const pivotCols = sortedColVals.length > 0 ? sortedColVals : ['Value'];

    const runAgg = (vals: number[], func: string): number | string => {
      if (vals.length === 0) return '';
      if (func === 'sum') return vals.reduce((a, b) => a + b, 0);
      if (func === 'avg') return vals.reduce((a, b) => a + b, 0) / vals.length;
      if (func === 'count') return vals.length;
      if (func === 'min') return Math.min(...vals);
      if (func === 'max') return Math.max(...vals);
      return '';
    };

    const pivotRows: any[][] = sortedRowVals.map(rowVal => {
      const items = rowValsMap.get(rowVal) ?? [];
      const rowOutput: any[] = [rowVal];

      pivotCols.forEach(colVal => {
        const filteredVals = items
          .filter(item => sortedColVals.length === 0 || item.colValStr === colVal)
          .map(item => item.rawVal)
          .filter((v): v is number => v !== null);

        const aggValue = runAgg(filteredVals, pivotAggFunc);
        rowOutput.push(aggValue);
      });

      if (sortedColVals.length > 0) {
        const allRowVals = items
          .map(item => item.rawVal)
          .filter((v): v is number => v !== null);
        const rowTotal = runAgg(allRowVals, pivotAggFunc);
        rowOutput.push(rowTotal);
      }

      return rowOutput;
    });

    const grandTotals: any[] = ['Grand Total'];
    pivotCols.forEach(colVal => {
      const colItemsVals = sourceRows
        .filter(row => {
          if (colIdx === -1) return true;
          return (String(row[colIdx] ?? '').trim() || '(blank)') === colVal;
        })
        .map(row => cleanNumeric(row[valIdx]))
        .filter((v): v is number => v !== null);
      grandTotals.push(runAgg(colItemsVals, pivotAggFunc));
    });

    if (sortedColVals.length > 0) {
      const allVals = sourceRows
        .map(row => cleanNumeric(row[valIdx]))
        .filter((v): v is number => v !== null);
      grandTotals.push(runAgg(allVals, pivotAggFunc));
    }

    setPivotResultTable({
      headers: [pivotRowCol, ...pivotCols, ...(sortedColVals.length > 0 ? ['Grand Total'] : [])],
      rows: pivotRows,
      totals: grandTotals
    });
    setPivotPage(1);
  };

  async function analyze(targetSheet?: string) {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append('file', file);
    
    const activeSheet = targetSheet !== undefined ? targetSheet : selectedSheet;
    if (activeSheet) fd.append('sheet', activeSheet);

    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');
      setResult(data);
      if (data.sheets?.length > 1 && !selectedSheet) setSheet(data.sheet);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-page-in space-y-8 max-w-4xl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Data Upload & Analysis</h1>
        <p className="text-sm text-muted-foreground dark:text-white/80 mt-1">
          Upload any internal system export — SAP, procurement, trading platform — and ChemSignals will analyze it against live market conditions.
        </p>
      </div>

      {/* Explainer Card */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex-none rounded-lg bg-primary/10 border border-primary/20 p-3">
            <FileSpreadsheet className="size-6 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Why every large company is stuck in the same loop
            </h2>
            <p className="text-sm text-muted-foreground dark:text-white/80 mt-1 leading-relaxed">
              SAP doesn't talk to Ariba. Ariba doesn't talk to the trading platform. The trading platform doesn't talk to the quality system.
              Every enterprise runs 5–10 critical systems that are completely siloed — and <strong className="text-foreground">Excel is the only language they all speak.</strong> So
              every Monday, an analyst exports from each one, pastes into a master workbook, cleans it, reconciles it, builds pivot tables,
              and writes the "so what" paragraph by hand. That's 90–120 minutes of pure data plumbing before any actual analysis begins.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Before */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
            <p className="text-xs font-bold text-destructive uppercase tracking-widest font-mono">Before — Today's Reality</p>
            <ul className="space-y-1.5">
              {[
                'Export from SAP → paste into Excel',
                'Export from procurement → reconcile units',
                'Pull FRED / Bloomberg manually',
                'Rebuild pivot tables from scratch',
                'Write commentary by hand',
                '→ 90–120 min before analysis starts',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="text-destructive/60 font-mono text-xs mt-0.5 flex-none">{String(i + 1).padStart(2, '0')}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4 space-y-2">
            <p className="text-xs font-bold text-green-500 uppercase tracking-widest font-mono">After — ChemSignals</p>
            <ul className="space-y-1.5">
              {[
                'Export from any system as usual',
                'Drop the file here',
                'Live commodity + FRED data auto-loaded',
                'Claude cross-references both in seconds',
                'VP-ready report: risks, margins, actions',
                '→ 30 seconds. No pivot tables. No manual work.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                  <span className="text-green-500/60 font-mono text-xs mt-0.5 flex-none">{String(i + 1).padStart(2, '0')}</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 pt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          {[
            { label: 'SAP',           desc: 'Production & financials' },
            { label: 'Ariba',         desc: 'Procurement & sourcing' },
            { label: 'Trading desk',  desc: 'Commodity positions' },
            { label: 'Quality systems', desc: 'Batch & compliance data' },
            { label: 'Any CSV / xlsx', desc: 'If it exports to Excel, it works' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-primary/60" />
              <span className="text-sm font-semibold text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground dark:text-white/60">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Zone */}
      <div>
        <div className="flex items-center justify-between mb-3 select-none">
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
              Upload Enterprise Data Export
            </h3>
          </div>
          <a
            href="/api/download/sample"
            download
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-mono transition-colors border border-primary/20 bg-primary/5 px-2 py-1 rounded"
          >
            <Download className="size-3.5" />
            Download Sample EIA Dataset
          </a>
        </div>

        <div
          className={cn(
            "relative rounded-xl border-2 border-dashed p-10 text-center transition-all duration-150 cursor-pointer",
            dragging
              ? "border-primary bg-primary/5 scale-[1.01]"
              : file
              ? "border-primary/40 bg-primary/5"
              : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) acceptFile(f); }}
          />

          {file ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="size-8 text-primary" />
                <div className="text-left">
                  <p className="text-base font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground dark:text-white/70 font-mono">{fmtBytes(file.size)}</p>
                </div>
                <button
                  className="ml-2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  onClick={e => { e.stopPropagation(); setFile(null); setResult(null); setError(null); }}
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground dark:text-white/60">Click to change file</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="size-10 text-muted-foreground/40 mx-auto" />
              <div>
                <p className="text-base font-semibold text-foreground">Drop your Excel file here</p>
                <p className="text-sm text-muted-foreground dark:text-white/70 mt-1">
                  .xlsx, .xls, or .csv — SAP exports, procurement data, pricing sheets, volume reports
                </p>
              </div>
              <p className="text-xs text-muted-foreground/60 dark:text-white/40 font-mono">or click to browse</p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-5 py-3 flex items-start gap-3">
          <AlertCircle className="size-4 text-destructive flex-none mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Sheet selector + Analyze button */}
      {file && (
        <div className="flex items-center gap-3">
          {result && result.sheets.length > 1 && (
            <div className="relative">
              <select
                value={selectedSheet || result.sheet}
                disabled={loading}
                onChange={e => {
                  const s = e.target.value;
                  setSheet(s);
                  analyze(s);
                }}
                className="appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {result.sheets.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            </div>
          )}

          <Button
            onClick={() => analyze()}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <FileSpreadsheet className="size-4" />
                {result ? 'Re-analyze' : 'Analyze with ChemSignals'}
              </>
            )}
          </Button>

          {result && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white/70 font-mono">
              <span>{result.rows.toLocaleString()} rows</span>
              <span>·</span>
              <span>{result.columns.length} columns</span>
              <span>·</span>
              <span>Sheet: {result.sheet}</span>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="rounded-xl border border-border bg-card p-10 text-center space-y-4">
          <Loader2 className="size-8 text-primary animate-spin mx-auto" />
          <div>
            <p className="text-base font-semibold text-foreground">ChemSignals is analyzing your data</p>
            <p className="text-sm text-muted-foreground dark:text-white/70 mt-1">
              Cross-referencing uploaded data against live commodity prices and FRED macro indicators…
            </p>
          </div>
        </div>
      )}

      {/* Report */}
      {result && !loading && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-3 select-none">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">
              WORKSPACE
            </h3>
            <Badge variant="outline" className="text-[11px] border-primary/40 text-primary ml-auto">
              {result.filename}
            </Badge>
          </div>

          {/* Workspace Tabs Navigation */}
          <div className="flex items-center gap-4 border-b border-border pb-2">
            <button
              onClick={() => setActiveTab('report')}
              className={cn(
                "text-sm font-semibold pb-2 border-b-2 transition-all cursor-pointer",
                activeTab === 'report'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              AI Intelligence Report
            </button>
            <button
              onClick={() => setActiveTab('excel')}
              className={cn(
                "text-sm font-semibold pb-2 border-b-2 transition-all cursor-pointer",
                activeTab === 'excel'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Interactive Excel Sandbox
            </button>
            <button
              onClick={() => setActiveTab('pivot')}
              className={cn(
                "text-sm font-semibold pb-2 border-b-2 transition-all cursor-pointer",
                activeTab === 'pivot'
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Pivot & Join Sandbox
            </button>
          </div>

          {activeTab === 'report' ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-6">
                <MarkdownReport content={result.report} />
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Print to PDF
                </Button>
              </div>
            </div>
          ) : activeTab === 'excel' ? (
            <div className="space-y-6 animate-fade-in">
              
              {/* ETL Toolbar */}
              <div className="flex flex-wrap items-center gap-3 bg-sidebar/40 p-4 border border-border rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-muted-foreground select-none">
                  <Filter className="size-3.5 text-primary" />
                  ETL Transformers:
                </div>
                <Button variant="outline" size="sm" onClick={filterWeekends} className="text-xs h-8 cursor-pointer">
                  Strip Weekends
                </Button>
                <Button variant="outline" size="sm" onClick={removeNulls} className="text-xs h-8 cursor-pointer">
                  Remove Null Rows
                </Button>
                
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-xs text-muted-foreground select-none">Scale:</span>
                  <select
                    value={statsColIdx}
                    onChange={e => setStatsColIdx(Number(e.target.value))}
                    className="bg-sidebar border border-border text-foreground text-xs rounded px-2.5 py-1 focus:outline-none"
                  >
                    {result.columns.map((c, i) => (
                      <option key={i} value={i}>{getColLetter(i)}: {c}</option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => convertBblToTonnes(statsColIdx)}
                    className="text-xs h-8 cursor-pointer"
                  >
                    7.33x Convert ($/bbl to $/tonne)
                  </Button>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={resetData}
                    className="text-xs h-8 gap-1.5 cursor-pointer ml-3"
                  >
                    <RefreshCw className="size-3 h-3" />
                    Reset Grid
                  </Button>
                </div>
              </div>

              {/* Descriptive Stats */}
              {(() => {
                const stats = activeGridData ? calculateStats() : null;
                function calculateStats() {
                  if (!activeGridData) return null;
                  const values = activeGridData
                    .map(row => cleanNumeric(row[statsColIdx]))
                    .filter((v): v is number => v !== null);
                  
                  if (values.length === 0) return null;
                  
                  const count = values.length;
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const sum = values.reduce((a, b) => a + b, 0);
                  const mean = sum / count;
                  
                  const sorted = [...values].sort((a, b) => a - b);
                  const mid = Math.floor(count / 2);
                  const median = count % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
                  
                  const sqDiffs = values.map(v => Math.pow(v - mean, 2));
                  const variance = sqDiffs.reduce((a, b) => a + b, 0) / count;
                  const stdDev = Math.sqrt(variance);
                  
                  return { count, min, max, mean, median, variance, stdDev };
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 rounded-xl border border-border bg-sidebar/20 p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                          <BarChart2 className="size-4" />
                          Descriptive Statistics: {result.columns[statsColIdx]}
                        </h4>
                      </div>
                      
                      {stats ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 font-mono text-xs">
                          <div className="p-3 bg-black/30 border border-border/40 rounded-lg">
                            <div className="text-muted-foreground text-[10px]">MEAN (AVERAGE)</div>
                            <div className="text-lg font-bold text-foreground mt-1">
                              {stats.mean.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </div>
                          </div>
                          <div className="p-3 bg-black/30 border border-border/40 rounded-lg">
                            <div className="text-muted-foreground text-[10px]">MEDIAN</div>
                            <div className="text-lg font-bold text-foreground mt-1">
                              {stats.median.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </div>
                          </div>
                          <div className="p-3 bg-black/30 border border-border/40 rounded-lg">
                            <div className="text-muted-foreground text-[10px]">MIN</div>
                            <div className="text-lg font-bold text-foreground mt-1">
                              {stats.min.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </div>
                          </div>
                          <div className="p-3 bg-black/30 border border-border/40 rounded-lg">
                            <div className="text-muted-foreground text-[10px]">MAX</div>
                            <div className="text-lg font-bold text-foreground mt-1">
                              {stats.max.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </div>
                          </div>
                          <div className="p-3 bg-black/30 border border-border/40 rounded-lg">
                            <div className="text-muted-foreground text-[10px]">STD DEV</div>
                            <div className="text-lg font-bold text-foreground mt-1">
                              {stats.stdDev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </div>
                          </div>
                          <div className="p-3 bg-black/30 border border-border/40 rounded-lg">
                            <div className="text-muted-foreground text-[10px]">ROW COUNT</div>
                            <div className="text-lg font-bold text-foreground mt-1">{stats.count}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">No numeric data in column {getColLetter(statsColIdx)}.</div>
                      )}
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3 text-xs leading-relaxed">
                      <h4 className="font-semibold text-primary flex items-center gap-1.5 select-none">
                        <HelpCircle className="size-4" />
                        Understanding Volatility & Outliers
                      </h4>
                      <div className="space-y-2 text-muted-foreground dark:text-white/80">
                        <p>
                          <strong className="text-foreground">Standard Deviation (Std Dev)</strong> measures the dispersion of price signals. A higher Std Dev flags supply-chain cost instability, warning procurement of budget risks.
                        </p>
                        <p>
                          <strong className="text-foreground">Median</strong> marks the 50th percentile. If Median and Mean diverge significantly, it signals heavy skew from contract outlier prices or spike events.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Excel Formula Playground */}
              <div className="rounded-xl border border-border bg-sidebar/20 p-5 space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2 select-none">
                  <Calculator className="size-4" />
                  Excel-Like Formula Playground
                </h4>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 flex items-stretch">
                    <div className="flex items-center justify-center bg-muted border border-border border-r-0 rounded-l-lg px-3 text-sm font-mono text-muted-foreground select-none">fx</div>
                    <input
                      type="text"
                      value={formulaInput}
                      onChange={e => setFormulaInput(e.target.value)}
                      placeholder="e.g. =AVERAGE(B:B) or =IFERROR(XLOOKUP(31414, A:A, B:B), 0)"
                      className="w-full bg-sidebar border border-border rounded-r-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                  <div className="md:w-60 bg-black/25 border border-border rounded-lg px-4 py-2 flex items-center justify-between min-h-[40px]">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest select-none">Result:</span>
                    <span className={cn(
                      "font-mono text-sm font-bold",
                      String(formulaResult).startsWith('#ERR') ? "text-destructive" : "text-foreground"
                    )}>
                      {formulaResult !== null ? (
                        typeof formulaResult === 'number'
                          ? formulaResult.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                          : String(formulaResult)
                      ) : (
                        <span className="text-muted-foreground italic select-none">Type a formula or click a template...</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Formula Template Quick Actions */}
                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2 select-none">Interactive Templates (Click to evaluate):</div>
                  <div className="flex flex-wrap gap-2 text-xs font-mono">
                    <button
                      onClick={() => setFormulaInput(`=AVERAGE(${getColLetter(statsColIdx)}:${getColLetter(statsColIdx)})`)}
                      className="px-2 py-1 bg-sidebar border border-border hover:border-primary rounded transition-all cursor-pointer hover:text-primary"
                    >
                      AVERAGE({getColLetter(statsColIdx)}:{getColLetter(statsColIdx)})
                    </button>
                    {result.columns.length > 2 && (
                      <>
                        <button
                          onClick={() => setFormulaInput(`=SUMIFS(B:B, A:A, ">31415")`)}
                          className="px-2 py-1 bg-sidebar border border-border hover:border-primary rounded transition-all cursor-pointer hover:text-primary"
                        >
                          SUMIFS(B:B, Date &gt; 1986-01-03)
                        </button>
                        <button
                          onClick={() => setFormulaInput(`=COUNTIFS(B:B, ">25.0")`)}
                          className="px-2 py-1 bg-sidebar border border-border hover:border-primary rounded transition-all cursor-pointer hover:text-primary"
                        >
                          COUNTIFS(Prices &gt; $25.00)
                        </button>
                        <button
                          onClick={() => setFormulaInput(`=IFERROR(XLOOKUP(31420, A:A, B:B), "Not Found")`)}
                          className="px-2 py-1 bg-sidebar border border-border hover:border-primary rounded transition-all cursor-pointer hover:text-primary"
                        >
                          XLOOKUP price on Date 31420
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Data Grid Card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-primary flex items-center gap-2 select-none">
                    <Grid className="size-4" />
                    Coordinate Worksheet Sandbox (First 30 Rows)
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-mono select-none">Double-click cells to edit value</span>
                </div>

                <div className="overflow-x-auto border border-border rounded-lg max-h-[400px]">
                  <table className="w-full text-xs font-mono text-left border-collapse select-text">
                    <thead className="bg-sidebar sticky top-0 z-10 select-none">
                      <tr>
                        <th className="p-2 border-b border-r border-border text-center text-muted-foreground w-12 bg-black/20 font-bold"></th>
                        {result.columns.map((col, idx) => (
                          <th key={idx} className="p-2 border-b border-r border-border text-center">
                            <div className="text-[10px] text-primary font-bold">{getColLetter(idx)}</div>
                            <div className="truncate max-w-[150px] font-semibold text-foreground/80 mt-0.5" title={col}>{col}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {activeGridData.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                          <td className="p-2 border-r border-border bg-black/20 text-center text-muted-foreground font-bold font-mono select-none">{rIdx + 1}</td>
                          {result.columns.map((_, cIdx) => {
                            const val = row[cIdx] ?? '';
                            const isEditing = editingCell?.rIdx === rIdx && editingCell?.cIdx === cIdx;
                            
                            return (
                              <td
                                key={cIdx}
                                className="p-2 border-r border-border min-w-[120px] max-w-[200px] truncate relative cursor-pointer hover:bg-[#00f3ff]/5 font-mono"
                                onDoubleClick={() => {
                                  if (!isEditing) startEditing(rIdx, cIdx, val);
                                }}
                              >
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={saveCellEdit}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveCellEdit();
                                      if (e.key === 'Escape') setEditingCell(null);
                                    }}
                                    className="absolute inset-0 w-full h-full bg-sidebar border border-primary px-2 py-1 text-foreground focus:outline-none z-20 font-mono"
                                    autoFocus
                                  />
                                ) : (
                                  <span>{String(val)}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              
              {/* Sheet Joining Card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 select-none">
                  <Calculator className="size-4" />
                  Dataset Reconciliation & Joining
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Join data from two different worksheets inside the uploaded workbook. Sourced dates and keys will be automatically normalized to align data points.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left Sheet Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold">Left Table (Sheet A)</label>
                    <select
                      value={leftSheet}
                      onChange={e => setLeftSheet(e.target.value)}
                      className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Select Sheet --</option>
                      {result.sheets.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Right Sheet Select */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold">Right Table (Sheet B)</label>
                    <select
                      value={rightSheet}
                      onChange={e => setRightSheet(e.target.value)}
                      className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="">-- Select Sheet --</option>
                      {result.sheets.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  {/* Load/Load Status */}
                  <div className="flex items-end">
                    <Button
                      onClick={loadJoinSheets}
                      disabled={loadingSheets || !leftSheet || !rightSheet}
                      variant="outline"
                      className="w-full text-xs h-9 gap-1.5 cursor-pointer"
                    >
                      {loadingSheets ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="size-3.5" />
                          Load Sheet Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {leftData && rightData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 animate-fade-in">
                    {/* Left Key Column */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase text-muted-foreground font-semibold">Join Key Column A</label>
                      <select
                        value={leftKey}
                        onChange={e => setLeftKey(e.target.value)}
                        className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      >
                        {leftColumns.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Right Key Column */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase text-muted-foreground font-semibold">Join Key Column B</label>
                      <select
                        value={rightKey}
                        onChange={e => setRightKey(e.target.value)}
                        className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      >
                        {rightColumns.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Join Type & Button */}
                    <div className="grid grid-cols-2 gap-2 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase text-muted-foreground font-semibold">Join Type</label>
                        <select
                          value={joinType}
                          onChange={e => setJoinType(e.target.value as 'inner' | 'left')}
                          className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="inner">Inner Join</option>
                          <option value="left">Left Join</option>
                        </select>
                      </div>
                      <Button
                        onClick={executeJoin}
                        className="text-xs h-9 gap-1.5 bg-primary hover:bg-primary/95 text-primary-foreground font-bold cursor-pointer"
                      >
                        <ArrowRight className="size-3.5" />
                        Execute Join
                      </Button>
                    </div>
                  </div>
                )}

                {joiningError && (
                  <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 p-2.5 rounded-lg font-mono">{joiningError}</p>
                )}

                {joinedData && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 flex items-center justify-between text-xs animate-page-in font-mono">
                    <div className="space-y-1">
                      <div className="font-bold text-foreground">Sheet Join Completed Successfully</div>
                      <div className="text-muted-foreground">Joined Columns: {joinedColumns.length} | Output Dataset: {joinedData.length} records.</div>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 font-bold uppercase select-none">Joined Source Ready</Badge>
                  </div>
                )}
              </div>

              {/* Pivot Builder Card */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 select-none">
                  <Grid className="size-4" />
                  Pivot Table Creator
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Source Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold">Data Source</label>
                    <select
                      value={pivotSource}
                      onChange={e => {
                        const src = e.target.value as 'active' | 'joined';
                        setPivotSource(src);
                        setPivotRowCol('');
                        setPivotColCol('');
                        setPivotValCol('');
                        setPivotResultTable(null);
                      }}
                      className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="active">Active Sheet (Full Data)</option>
                      <option value="joined" disabled={!joinedData}>Joined Dataset {!joinedData && '(Run join first)'}</option>
                    </select>
                  </div>

                  {/* Row Dimension */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold">Row Field (Groups)</label>
                    <select
                      value={pivotRowCol}
                      onChange={e => setPivotRowCol(e.target.value)}
                      className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono font-bold text-foreground"
                    >
                      <option value="">-- Select Row Field --</option>
                      {(pivotSource === 'joined' ? joinedColumns : result.columns).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Column Dimension */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold">Column Field (optional)</label>
                    <select
                      value={pivotColCol}
                      onChange={e => setPivotColCol(e.target.value)}
                      className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    >
                      <option value="">-- None --</option>
                      {(pivotSource === 'joined' ? joinedColumns : result.columns)
                        .filter(c => c !== pivotRowCol)
                        .map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                  </div>

                  {/* Value Column */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold">Value Field (Metrics)</label>
                    <select
                      value={pivotValCol}
                      onChange={e => setPivotValCol(e.target.value)}
                      className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    >
                      <option value="">-- Select Value Field --</option>
                      {(pivotSource === 'joined' ? joinedColumns : result.columns)
                        .filter(c => c !== pivotRowCol && c !== pivotColCol)
                        .map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 items-center">
                  {/* Aggregation Function */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold">Aggregation Function</label>
                    <select
                      value={pivotAggFunc}
                      onChange={e => setPivotAggFunc(e.target.value as any)}
                      className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="avg">AVERAGE</option>
                      <option value="sum">SUM</option>
                      <option value="count">COUNT</option>
                      <option value="min">MIN</option>
                      <option value="max">MAX</option>
                    </select>
                  </div>

                  {/* Date Grouping Option */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase text-muted-foreground font-semibold">Date Grouping Options</label>
                    <select
                      value={pivotDateGroup}
                      onChange={e => setPivotDateGroup(e.target.value as any)}
                      className="w-full bg-sidebar border border-border text-foreground text-xs rounded p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="none">No Grouping (Raw values)</option>
                      <option value="year">Group by Year</option>
                      <option value="month">Group by Year-Month</option>
                    </select>
                  </div>

                  {/* Execute Button */}
                  <div className="flex items-end h-full pt-6">
                    <Button
                      onClick={generatePivotTable}
                      disabled={!pivotRowCol || !pivotValCol}
                      className="w-full text-xs h-9 gap-1.5 bg-primary hover:bg-primary/95 font-bold cursor-pointer"
                    >
                      <Calculator className="size-3.5" />
                      Generate Pivot Table
                    </Button>
                  </div>
                </div>
              </div>

              {/* Pivot Output Table */}
              {pivotResultTable && (
                <div className="rounded-xl border border-border bg-sidebar/20 p-5 space-y-4 animate-page-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-primary font-mono select-none">
                      Pivot Table: {pivotAggFunc.toUpperCase()} of {pivotValCol} by {pivotRowCol}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono select-none">
                      Rows {((pivotPage - 1) * PIVOT_ROWS_PER_PAGE) + 1} – {Math.min(pivotPage * PIVOT_ROWS_PER_PAGE, pivotResultTable.rows.length)} of {pivotResultTable.rows.length}
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-border/60 rounded-lg">
                    <table className="w-full text-xs font-mono border-collapse text-left select-text">
                      <thead className="bg-sidebar select-none font-bold text-muted-foreground">
                        <tr className="border-b border-border">
                          {pivotResultTable.headers.map((h, i) => (
                            <th key={i} className="p-2 border-r border-border truncate max-w-[200px]" title={h}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {pivotResultTable.rows.slice((pivotPage - 1) * PIVOT_ROWS_PER_PAGE, pivotPage * PIVOT_ROWS_PER_PAGE).map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-border/40 hover:bg-white/5 transition-colors">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-2 border-r border-border font-mono text-foreground/90">
                                {typeof cell === 'number'
                                  ? cell.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                                  : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {/* Grand Total Row */}
                        <tr className="bg-primary/5 font-bold border-t border-border font-mono select-none">
                          {pivotResultTable.totals.map((total: any, tIdx: number) => (
                            <td key={tIdx} className="p-2 border-r border-border text-primary font-bold">
                              {typeof total === 'number'
                                ? total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                                : String(total)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {pivotResultTable.rows.length > PIVOT_ROWS_PER_PAGE && (
                    <div className="flex items-center justify-between text-xs font-mono select-none pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pivotPage === 1}
                        onClick={() => setPivotPage(prev => Math.max(prev - 1, 1))}
                        className="cursor-pointer"
                      >
                        Previous Page
                      </Button>
                      <span className="text-muted-foreground font-semibold">
                        Page {pivotPage} of {Math.ceil(pivotResultTable.rows.length / PIVOT_ROWS_PER_PAGE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pivotPage >= Math.ceil(pivotResultTable.rows.length / PIVOT_ROWS_PER_PAGE)}
                        onClick={() => setPivotPage(prev => prev + 1)}
                        className="cursor-pointer"
                      >
                        Next Page
                      </Button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
}
