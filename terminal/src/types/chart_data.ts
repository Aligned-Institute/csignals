// terminal/src/types/chart_data.ts

export type CompanyName = 'Anthropic' | 'OpenAI' | 'Google/Deepmind' | 'Meta' | 'xAI' | 'Deepseek' | 'Qwen' | 'Mistral';

export interface TimeSeriesDataPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface StockPriceData {
  company: CompanyName;
  data: TimeSeriesDataPoint[];
}

export interface AIInvestmentData {
  company: CompanyName;
  data: TimeSeriesDataPoint[];
}

export interface AIRevenueData {
  company: CompanyName;
  data: TimeSeriesDataPoint[];
}

export interface PartnershipDataPoint {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface AIPartnershipData {
  company: CompanyName;
  data: PartnershipDataPoint[];
}

export interface FundingRound {
  round: string;   // e.g. "Series A", "Series B"
  date: string;    // YYYY-MM-DD
  amount: number;  // in millions USD
  valuation?: number; // post-money valuation in millions
  leadInvestor?: string;
}

export interface FundingData {
  company: CompanyName;
  totalRaised: number; // in millions
  rounds: FundingRound[];
}

export interface CompanyInfo {
  id: string;
  name: CompanyName;
  isPublic: boolean;
}

export const COMPANIES: CompanyInfo[] = [
  { id: 'anthropic', name: 'Anthropic', isPublic: false },
  { id: 'openai', name: 'OpenAI', isPublic: false },
  { id: 'google-deepmind', name: 'Google/Deepmind', isPublic: true },
  { id: 'meta', name: 'Meta', isPublic: true },
  { id: 'xai', name: 'xAI', isPublic: false },
  { id: 'deepseek', name: 'Deepseek', isPublic: false },
  { id: 'qwen', name: 'Qwen', isPublic: false },
  { id: 'mistral', name: 'Mistral', isPublic: false },
];


// --- New Interfaces for ASI Tear Sheet ---

export type BenchmarkStatus = 'passed' | 'failed' | 'partial' | 'n/a';

export interface BenchmarkResult {
  name: string; // e.g., "VC 'Can it Build?' Benchmark"
  status: BenchmarkStatus;
  score: number; // e.g., 0-100
  keyMetrics: { label: string; value: string | number }[];
  summary: string;
  linkToFullDetails?: string; // Optional link to granular data
}

export interface QualitativeSummary {
  synopsis: string;
  strengths: string[];
  weaknesses: string[];
}

export interface AuditHistoryEntry {
  date: string;
  benchmark: string;
  safetyScore: number;
  cost: number;
  outcome: string;
  auditId: string; // Link to detailed audit log
}

export interface TearSheetData {
  companyInfo: CompanyInfo;
  asiCompositeScore: {
    score: number; // 0-100
    verbalRating: string;
  };
  coreMetrics: {
    vaporwareProbability: { value: number; trend: 'up' | 'down' | 'stable' };
    safetyScore: { value: number; trend: 'up' | 'down' | 'stable' };
    unitEconomics: { value: number; trend: 'up' | 'down' | 'stable' }; // Cost per outcome
  };
  benchmarkPerformance: BenchmarkResult[];
  qualitativeSummary: QualitativeSummary;
  technicalDetails: {
    architecture: string;
    trainingDataOverview: string;
    apiEndpoints?: string;
    pricingModel?: string;
  };
  recentAuditHistory: AuditHistoryEntry[];
}