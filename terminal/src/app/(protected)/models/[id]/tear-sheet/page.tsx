'use client';

import { use } from 'react';
import useSWR from 'swr';
import { COMPANIES, type CompanyName, TearSheetData } from '@/types/chart_data'; // Import TearSheetData
import type { ModelSummaryResponse } from '@/types/api'; // Import ModelSummaryResponse
import TearSheet from '@/components/tear-sheet/TearSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api'; // Import api client
import { getMockTearSheetData } from '@/components/charts/mockData'; // Re-add getMockTearSheetData import

// Map backend model names / developers to COMPANIES entries
const MODEL_TO_COMPANY: Record<string, CompanyName> = {
  'claude-sonnet-4': 'Anthropic',
  'claude-opus-4': 'Anthropic',
  'claude-haiku-4': 'Anthropic',
  'gpt-4o': 'OpenAI',
  'gpt-4': 'OpenAI',
  'o1': 'OpenAI',
  'o3': 'OpenAI',
  'gemini-2.0-flash': 'Google/Deepmind',
  'gemini-pro': 'Google/Deepmind',
  'llama-4': 'Meta',
  'llama-3': 'Meta',
  'grok-3': 'xAI',
  'grok-2': 'xAI',
  'deepseek-v3': 'Deepseek',
  'deepseek-r1': 'Deepseek',
  'qwen-2.5': 'Qwen',
  'qwen-3': 'Qwen',
  'mistral-large-3': 'Mistral',
  'mistral-medium': 'Mistral',
};

const DEVELOPER_TO_COMPANY: Record<string, CompanyName> = {
  'anthropic': 'Anthropic',
  'openai': 'OpenAI',
  'google': 'Google/Deepmind',
  'deepmind': 'Google/Deepmind',
  'meta': 'Meta',
  'xai': 'xAI',
  'deepseek': 'Deepseek',
  'alibaba': 'Qwen',
  'qwen': 'Qwen',
  'mistral': 'Mistral',
};

function resolveCompany(modelName?: string, developer?: string): CompanyName | null {
  if (modelName) {
    const lower = modelName.toLowerCase();
    if (MODEL_TO_COMPANY[lower]) return MODEL_TO_COMPANY[lower];
    // Partial match
    for (const [key, company] of Object.entries(MODEL_TO_COMPANY)) {
      if (lower.includes(key) || key.includes(lower)) return company;
    }
  }
  if (developer) {
    const lower = developer.toLowerCase();
    for (const [key, company] of Object.entries(DEVELOPER_TO_COMPANY)) {
      if (lower.includes(key)) return company;
    }
  }
  // Slug-prefix fallback for unknown model slugs (e.g. 'gemini-1.5-pro', 'claude-3-opus')
  const MODEL_NAME_PREFIXES: Partial<Record<string, CompanyName>> = {
    'claude':    'Anthropic',
    'gpt':       'OpenAI',
    'o1':        'OpenAI',
    'o3':        'OpenAI',
    'gemini':    'Google/Deepmind',
    'llama':     'Meta',
    'grok':      'xAI',
    'deepseek':  'Deepseek',
    'qwen':      'Qwen',
    'mistral':   'Mistral',
  };
  if (modelName) {
    const lower = modelName.toLowerCase();
    for (const [prefix, company] of Object.entries(MODEL_NAME_PREFIXES)) {
      if (lower.startsWith(prefix)) return company as CompanyName;
    }
  }
  return null;
}

const USE_MOCK_TEAR_SHEET_DATA = process.env.NEXT_PUBLIC_DATA_PROVIDER_TEAR_SHEET === 'mock';

export default function TearSheetPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const { id } = use(paramsPromise);

  // First check if the id is a COMPANIES slug (e.g. "anthropic", "google-deepmind")
  const directMatch = COMPANIES.find((c) => c.id === id || c.name === id || c.id === id.toLowerCase());

  // If not a slug, it's a UUID — fetch model summary to resolve company
  const { data, isLoading: loadingSummary } = useSWR(
    directMatch ? null : `${api.API_BASE}/api/v1/signal/${id}/summary`,
    api.fetcher,
  );
  const summary = data as ModelSummaryResponse | undefined; // Explicitly cast

  const companyName = directMatch
    ? directMatch.name
    : resolveCompany(summary?.model_name, summary?.developer === null ? undefined : summary?.developer);

  // Fetch TearSheetData based on resolved companyName
  const { data: fetchedTearSheetData, isLoading: loadingTearSheet, error: tearSheetError } = useSWR<TearSheetData>(
    companyName && !USE_MOCK_TEAR_SHEET_DATA ? `${api.API_BASE}/api/v1/signals/${companyName}/tear-sheet` : null,
    api.fetcher
  );

  const tearSheetData = USE_MOCK_TEAR_SHEET_DATA
    ? getMockTearSheetData(companyName ?? 'Anthropic') // Default to Anthropic if companyName is null for mock
    : fetchedTearSheetData;

  if (loadingSummary || (loadingTearSheet && !USE_MOCK_TEAR_SHEET_DATA)) {
    return (
      <div className="space-y-6 animate-page-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (tearSheetError && !USE_MOCK_TEAR_SHEET_DATA) {
    return (
      <div className="text-destructive p-6 animate-page-in">
        Error loading tear sheet data: {tearSheetError.message}
      </div>
    );
  }

  if (!companyName) {
    return (
      <div className="text-muted-foreground p-6 animate-page-in">
        Unable to resolve company for model &ldquo;{summary?.model_name ?? id}&rdquo;.
      </div>
    );
  }

  if (!tearSheetData) {
    return <div className="text-muted-foreground p-6">No tear sheet data available for {companyName}.</div>;
  }

  return (
    <div className="animate-page-in">
      <TearSheet data={tearSheetData} />
    </div>
  );
}
