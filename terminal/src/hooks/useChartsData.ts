// terminal/src/hooks/useChartsData.ts
import { useState, useEffect } from 'react';
import {
  CompanyName,
  COMPANIES,
  TimeSeriesDataPoint,
} from '@/types/chart_data';
import { api } from '@/lib/api';
import {
  MOCK_STOCK_PRICE_DATA,
  MOCK_AI_INVESTMENT_DATA,
  MOCK_AI_REVENUE_DATA,
  MOCK_AI_PARTNERSHIP_DATA,
} from '@/components/charts/mockData';

export type ChartDataType = TimeSeriesDataPoint[];

export type ChartMetric =
  | 'stockPrice'
  | 'aiInvestment'
  | 'aiRevenue'
  | 'aiPartnerships';

interface UseChartDataResult {
  data: ChartDataType; // Guaranteed to be an array
  loading: boolean;
  error: string | null;
}

const USE_MOCK_DATA = process.env.NEXT_PUBLIC_DATA_PROVIDER_CHARTS === 'mock';

export const useChartData = (
  companyName: CompanyName | null,
  metric: ChartMetric,
  timeline: '12m' | '5y' = '5y'
): UseChartDataResult => {
  const [data, setData] = useState<ChartDataType>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData([]); // Reset to empty array

    if (!companyName) {
      setLoading(false);
      return;
    }

    const company = COMPANIES.find((c) => c.name === companyName);
    if (!company) {
      setError(`Company "${companyName}" not found.`);
      setLoading(false);
      return;
    }

    // --- MOCK DATA LOGIC ---
    if (USE_MOCK_DATA) {
      let fetchedData: ChartDataType = [];
      switch (metric) {
        case 'stockPrice':
          fetchedData = MOCK_STOCK_PRICE_DATA.find((d) => d.company === companyName)?.data ?? [];
          if (fetchedData && !company.isPublic) {
            fetchedData = [];
          }
          break;
        case 'aiInvestment':
          fetchedData = MOCK_AI_INVESTMENT_DATA.find((d) => d.company === companyName)?.data ?? [];
          break;
        case 'aiRevenue':
          fetchedData = MOCK_AI_REVENUE_DATA.find((d) => d.company === companyName)?.data ?? [];
          break;
        case 'aiPartnerships':
          fetchedData = MOCK_AI_PARTNERSHIP_DATA.find((d) => d.company === companyName)?.data?.map(p => ({ date: p.date, value: p.count })) ?? [];
          break;
      }
      
      const timer = setTimeout(() => {
        setData(fetchedData);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }

    // --- REAL API DATA LOGIC ---
    const apiUrl = `/signals/${companyName}/metrics/${metric}?timeline=${timeline}`;

    api.fetcher<ChartDataType>(apiUrl)
      .then((fetchedData) => {
        // Ensure fetchedData is actually an array before setting it
        if (Array.isArray(fetchedData)) {
          setData(fetchedData);
        } else {
          console.error("API returned non-array data for chart:", fetchedData);
          setData([]);
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch data.");
        setData([]);
      })
      .finally(() => {
        setLoading(false);
      });

  }, [companyName, metric, timeline]);

  return { data, loading, error };
};
