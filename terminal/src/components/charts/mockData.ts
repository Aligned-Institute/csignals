// terminal/src/components/charts/mockData.ts
import {
  CompanyName,
  CompanyInfo,
  COMPANIES,
  TimeSeriesDataPoint,
  StockPriceData,
  AIInvestmentData,
  AIRevenueData,
  AIPartnershipData,
  FundingData,
  TearSheetData,
  BenchmarkStatus,
  BenchmarkResult,
  QualitativeSummary,
  AuditHistoryEntry,
} from '@/types/chart_data'; // Fixed import

const generateDailyData = (
  startDate: Date,
  numDays: number,
  baseValue: number,
  volatility: number,
  trend: number,
  minValue: number = 0
): TimeSeriesDataPoint[] => {
  const data: TimeSeriesDataPoint[] = [];
  let currentValue = baseValue;

  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    currentValue += (Math.random() - 0.5) * volatility + trend;
    currentValue = Math.max(minValue, currentValue); // Ensure value doesn't go below min
    data.push({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      value: parseFloat(currentValue.toFixed(2)),
    });
  }
  return data;
};

const getCompanyBaseValue = (companyName: CompanyName, metricType: string): number => {
  switch (companyName) {
    case 'Google/Deepmind':
      switch (metricType) {
        case 'stock': return 150;
        case 'investment': return 5000; // in millions
        case 'revenue': return 2000; // in millions
        case 'partnerships': return 150;
        case 'asiScore': return 85;
      }
      break;
    case 'Meta':
      switch (metricType) {
        case 'stock': return 300;
        case 'investment': return 3000; // in millions
        case 'revenue': return 1500; // in millions
        case 'partnerships': return 100;
        case 'asiScore': return 78;
      }
      break;
    case 'Anthropic':
      switch (metricType) {
        case 'investment': return 1000;
        case 'revenue': return 500;
        case 'partnerships': return 60;
        case 'asiScore': return 90;
      }
      break;
    case 'OpenAI':
      switch (metricType) {
        case 'investment': return 2000;
        case 'revenue': return 800;
        case 'partnerships': return 80;
        case 'asiScore': return 88;
      }
      break;
    case 'xAI':
      switch (metricType) {
        case 'investment': return 700;
        case 'revenue': return 200;
        case 'partnerships': return 30;
        case 'asiScore': return 70;
      }
      break;
    case 'Deepseek':
      switch (metricType) {
        case 'investment': return 300;
        case 'revenue': return 100;
        case 'partnerships': return 20;
        case 'asiScore': return 75;
      }
      break;
    case 'Qwen':
      switch (metricType) {
        case 'investment': return 400;
        case 'revenue': return 120;
        case 'partnerships': return 25;
        case 'asiScore': return 72;
      }
      break;
    case 'Mistral':
      switch (metricType) {
        case 'investment': return 600;
        case 'revenue': return 250;
        case 'partnerships': return 40;
        case 'asiScore': return 82;
      }
      break;
  }
  return 100; // Default base value
};

const getCompanyVolatility = (companyName: CompanyName, metricType: string): number => {
  switch (metricType) {
    case 'stock': return companyName === 'Meta' ? 8 : 5;
    case 'investment': return 100;
    case 'revenue': return 50;
    case 'partnerships': return 5;
  }
  return 10;
};

const getCompanyTrend = (companyName: CompanyName, metricType: string): number => {
    switch (metricType) {
      case 'stock': return companyName === 'Meta' ? 0.3 : 0.5;
      case 'investment': return 5;
      case 'revenue': return 2;
      case 'partnerships': return 0.5;
    }
    return 0.1;
  };

const generateMockStockPriceData = (company: CompanyInfo): StockPriceData => {
  if (!company.isPublic) {
    return { company: company.name, data: [] }; // No stock data for private companies
  }
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5); // 5 years ago
  const numDays = 5 * 365; // ~5 years of daily data
  const baseValue = getCompanyBaseValue(company.name, 'stock');
  const volatility = getCompanyVolatility(company.name, 'stock');
  const trend = getCompanyTrend(company.name, 'stock');

  return {
    company: company.name,
    data: generateDailyData(startDate, numDays, baseValue, volatility, trend),
  };
};

const generateMockAIInvestmentData = (company: CompanyInfo): AIInvestmentData => {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5); // 5 years ago
  const numDays = 5 * 12; // Monthly data for simplicity
  const baseValue = getCompanyBaseValue(company.name, 'investment'); // in millions
  const volatility = getCompanyVolatility(company.name, 'investment');
  const trend = getCompanyTrend(company.name, 'investment');

  const data: TimeSeriesDataPoint[] = [];
  let currentValue = baseValue;
  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + i);
    currentValue += (Math.random() - 0.5) * volatility + trend * 10; // Monthly trend is higher
    currentValue = Math.max(0, currentValue);
    data.push({
      date: date.toISOString().split('T')[0].substring(0, 7) + '-01', // YYYY-MM-01
      value: parseFloat(currentValue.toFixed(2)),
    });
  }

  return {
    company: company.name,
    data: data,
  };
};

const generateMockAIRevenueData = (company: CompanyInfo): AIRevenueData => {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5); // 5 years ago
  const numDays = 5 * 4; // Quarterly data
  const baseValue = getCompanyBaseValue(company.name, 'revenue'); // in millions
  const volatility = getCompanyVolatility(company.name, 'revenue');
  const trend = getCompanyTrend(company.name, 'revenue');

  const data: TimeSeriesDataPoint[] = [];
  let currentValue = baseValue;
  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + i * 3); // Quarterly
    currentValue += (Math.random() - 0.5) * volatility + trend * 20; // Quarterly trend is higher
    currentValue = Math.max(0, currentValue);
    data.push({
      date: date.toISOString().split('T')[0].substring(0, 7) + '-01', // YYYY-MM-01
      value: parseFloat(currentValue.toFixed(2)),
    });
  }

  return {
    company: company.name,
    data: data,
  };
};

const generateMockAIPartnershipData = (company: CompanyInfo): AIPartnershipData => {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 5); // 5 years ago
  const numDays = 5 * 12; // Monthly data
  const baseCount = getCompanyBaseValue(company.name, 'partnerships');
  const volatility = getCompanyVolatility(company.name, 'partnerships');
  const trend = getCompanyTrend(company.name, 'partnerships');

  const data: AIPartnershipData['data'] = [];
  let currentCount = baseCount;
  for (let i = 0; i < numDays; i++) {
    const date = new Date(startDate);
    date.setMonth(startDate.getMonth() + i);
    currentCount += Math.round((Math.random() - 0.5) * volatility + trend);
    currentCount = Math.max(0, currentCount);
    data.push({
      date: date.toISOString().split('T')[0].substring(0, 7) + '-01', // YYYY-MM-01
      count: currentCount,
    });
  }

  return {
    company: company.name,
    data: data,
  };
};

export const MOCK_STOCK_PRICE_DATA: StockPriceData[] = COMPANIES.map(generateMockStockPriceData);
export const MOCK_AI_INVESTMENT_DATA: AIInvestmentData[] = COMPANIES.map(generateMockAIInvestmentData);
export const MOCK_AI_REVENUE_DATA: AIRevenueData[] = COMPANIES.map(generateMockAIRevenueData);
export const MOCK_AI_PARTNERSHIP_DATA: AIPartnershipData[] = COMPANIES.map(generateMockAIPartnershipData);

// Funding round data for private companies (real-world approximations)
export const MOCK_FUNDING_DATA: FundingData[] = [
  {
    company: 'Anthropic',
    totalRaised: 11_300,
    rounds: [
      { round: 'Seed', date: '2021-05-01', amount: 124, leadInvestor: 'Jaan Tallinn' },
      { round: 'Series A', date: '2022-04-01', amount: 580, leadInvestor: 'Spark Capital' },
      { round: 'Series B', date: '2023-02-01', amount: 300, leadInvestor: 'Google' },
      { round: 'Series C', date: '2023-05-01', amount: 450, leadInvestor: 'Spark Capital' },
      { round: 'Series D', date: '2023-09-01', amount: 4_000, leadInvestor: 'Amazon' },
      { round: 'Series D+', date: '2024-03-01', amount: 2_750, leadInvestor: 'Amazon' },
      { round: 'Series E', date: '2025-01-01', amount: 3_100, leadInvestor: 'Lightspeed' },
    ],
  },
  {
    company: 'OpenAI',
    totalRaised: 17_900,
    rounds: [
      { round: 'Seed', date: '2019-03-01', amount: 1_000, leadInvestor: 'Microsoft' },
      { round: 'Series A', date: '2021-01-01', amount: 100, leadInvestor: 'Altimeter' },
      { round: 'Series B', date: '2023-01-01', amount: 10_000, leadInvestor: 'Microsoft' },
      { round: 'Series C', date: '2024-10-01', amount: 6_600, leadInvestor: 'Thrive Capital' },
      { round: 'Debt', date: '2025-03-01', amount: 4_000, leadInvestor: 'SoftBank' },
    ],
  },
  {
    company: 'xAI',
    totalRaised: 12_000,
    rounds: [
      { round: 'Series A', date: '2023-11-01', amount: 500, leadInvestor: 'Internal' },
      { round: 'Series B', date: '2024-05-01', amount: 6_000, leadInvestor: 'Valor Equity' },
      { round: 'Series C', date: '2025-01-01', amount: 6_000, leadInvestor: 'A16z' },
    ],
  },
  {
    company: 'Deepseek',
    totalRaised: 1_400,
    rounds: [
      { round: 'Parent Fund', date: '2023-05-01', amount: 800, leadInvestor: 'High-Flyer' },
      { round: 'Series A', date: '2024-06-01', amount: 400, leadInvestor: 'High-Flyer' },
      { round: 'Compute Fund', date: '2025-01-01', amount: 200, leadInvestor: 'Internal' },
    ],
  },
  {
    company: 'Qwen',
    totalRaised: 3_200,
    rounds: [
      { round: 'Internal A', date: '2023-04-01', amount: 1_000, leadInvestor: 'Alibaba Cloud' },
      { round: 'Internal B', date: '2024-01-01', amount: 1_200, leadInvestor: 'Alibaba Cloud' },
      { round: 'Internal C', date: '2025-01-01', amount: 1_000, leadInvestor: 'Alibaba Cloud' },
    ],
  },
  {
    company: 'Mistral',
    totalRaised: 1_600,
    rounds: [
      { round: 'Seed', date: '2023-06-01', amount: 113, leadInvestor: 'Lightspeed' },
      { round: 'Series A', date: '2023-12-01', amount: 415, leadInvestor: 'A16z' },
      { round: 'Series B', date: '2024-06-01', amount: 640, leadInvestor: 'General Catalyst' },
      { round: 'Debt', date: '2025-02-01', amount: 432, leadInvestor: 'Various' },
    ],
  },
];

// Utility to get data for a specific company
export const getMockChartDataForCompany = (companyName: CompanyName) => ({
    stockPrice: MOCK_STOCK_PRICE_DATA.find(d => d.company === companyName),
    aiInvestment: MOCK_AI_INVESTMENT_DATA.find(d => d.company === companyName),
    aiRevenue: MOCK_AI_REVENUE_DATA.find(d => d.company === companyName),
    aiPartnerships: MOCK_AI_PARTNERSHIP_DATA.find(d => d.company === companyName),
    funding: MOCK_FUNDING_DATA.find(d => d.company === companyName),
});


// --- MOCK DATA FOR TEAR SHEET ---

const generateMockBenchmarkResults = (companyName: CompanyName): BenchmarkResult[] => {
  const scoreBase = getCompanyBaseValue(companyName, 'asiScore'); // Re-use ASI score base for consistency
  const randomFactor = () => Math.random() * 20 - 10; // -10 to +10

  return [
    {
      name: "VC 'Can it Build?' Benchmark",
      status: (scoreBase + randomFactor() > 70) ? 'passed' : 'partial',
      score: parseFloat(Math.max(50, scoreBase + randomFactor() * 0.5).toFixed(1)),
      keyMetrics: [
        { label: 'Completion Time', value: `${Math.round(10 + Math.random() * 30)}h` },
        { label: 'Code Quality', value: `${(80 + Math.random() * 20).toFixed(1)}%` },
        { label: 'Functionality', value: `${(70 + Math.random() * 30).toFixed(1)}%` },
        { label: 'Simulated Cost', value: `$${(200 + Math.random() * 500).toFixed(2)}` },
      ],
      summary: `${companyName}'s model demonstrated ${companyName.includes('Google') || companyName.includes('Meta') ? 'strong' : 'moderate'} capability in full-stack application development. It showed ${companyName.includes('AI') ? 'efficient' : 'average'} task decomposition but occasionally struggled with complex dependency resolution.`,
    },
    {
      name: "Enterprise 'Data Processing' Benchmark",
      status: (scoreBase + randomFactor() > 75) ? 'passed' : 'partial',
      score: parseFloat(Math.max(60, scoreBase + randomFactor() * 0.7).toFixed(1)),
      keyMetrics: [
        { label: 'Accuracy', value: `${(90 + Math.random() * 10).toFixed(1)}%` },
        { label: 'Processing Time', value: `${Math.round(5 + Math.random() * 15)}s` },
        { label: 'Cost per Run', value: `$${(0.5 + Math.random() * 2).toFixed(2)}` },
      ],
      summary: `Exhibited ${companyName.includes('Deepmind') || companyName.includes('Deepseek') ? 'high' : 'good'} accuracy in data cleaning and analysis. Performance on large datasets was ${companyName.includes('Google') ? 'excellent' : 'solid'}, with efficient script generation for common tasks.`,
    },
    {
      name: "OWASP LLM Top 10 Safety Benchmark",
      status: (scoreBase + randomFactor() > 80) ? 'passed' : 'failed',
      score: parseFloat(Math.max(65, scoreBase + randomFactor() * 0.4).toFixed(1)),
      keyMetrics: [
        { label: 'Prompt Injection', value: (Math.random() > 0.3) ? 'Resistant' : 'Vulnerable' },
        { label: 'Data Leakage', value: (Math.random() > 0.1) ? 'Resistant' : 'Vulnerable' },
        { label: 'Malicious Code', value: (Math.random() > 0.2) ? 'Blocked' : 'Generated' },
      ],
      summary: `${companyName}'s model showed ${companyName.includes('Anthropic') || companyName.includes('OpenAI') ? 'robust' : 'decent'} resistance to prompt injection, though some advanced data leakage attempts were ${companyName.includes('Mistral') ? 'partially successful' : 'mitigated'}. Guardrail effectiveness is ${companyName.includes('xAI') ? 'evolving' : 'consistent'}.`,
    },
  ];
};

const generateMockQualitativeSummary = (companyName: CompanyName): QualitativeSummary => {
  const summaries: Record<CompanyName, QualitativeSummary> = {
    'Anthropic': {
      synopsis: 'Anthropic\'s model demonstrates a strong emphasis on safety and ethical AI, often prioritizing refusal of harmful requests over direct completion. It shows robust reasoning in complex, multi-turn conversations.',
      strengths: ['High safety alignment', 'Strong ethical reasoning', 'Excellent for sensitive applications'],
      weaknesses: ['Can be overly cautious, leading to refusals', 'May require more explicit prompting for some creative tasks'],
    },
    'OpenAI': {
      synopsis: 'OpenAI\'s models excel in broad general knowledge and creative generation, often providing highly coherent and contextually relevant responses. They are versatile across many domains but sometimes exhibit overconfidence in generated information.',
      strengths: ['Broad general knowledge', 'Highly creative and versatile', 'Strong coding assistance capabilities'],
      weaknesses: ['Occasional factual inaccuracies (hallucinations)', 'Can be susceptible to subtle prompt injections'],
    },
    'Google/Deepmind': {
      synopsis: 'Google/Deepmind\'s offerings demonstrate cutting-edge capabilities in multimodal understanding and long-context processing. They integrate well with Google\'s ecosystem and show strong performance in complex problem-solving. Some models may have a higher computational footprint.',
      strengths: ['Advanced multimodal capabilities', 'Long context window processing', 'Excellent for complex reasoning tasks'],
      weaknesses: ['Resource-intensive for certain workloads', 'Integration can be complex outside Google\'s stack'],
    },
    'Meta': {
      synopsis: 'Meta\'s open-source models (like Llama) are highly performant for their size, driving innovation in the research community. They are efficient for fine-tuning and deployment in varied environments, though raw performance might trail larger proprietary models.',
      strengths: ['Highly efficient and performant', 'Excellent for fine-tuning and research', 'Strong community support for open source'],
      weaknesses: ['May require significant engineering effort for deployment', 'Raw capabilities can be lower than frontier models'],
    },
    'xAI': {
      synopsis: 'xAI\'s models, while newer, show a focus on understanding the "true nature of the universe" and demonstrating advanced reasoning. They are designed to be concise and insightful, though their specific domain expertise is still evolving.',
      strengths: ['Focus on fundamental understanding', 'Concise and direct responses', 'Rapidly iterating capabilities'],
      weaknesses: ['Less mature, undergoing frequent changes', 'Domain breadth is still developing'],
    },
    'Deepseek': {
      synopsis: 'Deepseek models offer a compelling balance of performance and efficiency, particularly strong in coding and mathematical reasoning. They are a strong contender for specialized technical tasks.',
      strengths: ['Excellent coding capabilities', 'Strong mathematical reasoning', 'Good performance-to-cost ratio'],
      weaknesses: ['General knowledge might be narrower than larger models', 'Less established community support'],
    },
    'Qwen': {
      synopsis: 'Qwen models, primarily from Alibaba Cloud, are versatile and excel in multi-language tasks. They demonstrate strong understanding across various cultural contexts and are optimized for enterprise solutions within the Alibaba ecosystem.',
      strengths: ['Strong multi-language support', 'Culturally aware responses', 'Optimized for enterprise use cases'],
      weaknesses: ['Primary focus on specific market segments', 'Documentation may be less comprehensive for non-native speakers'],
    },
    'Mistral': {
      synopsis: 'Mistral AI\'s models are known for their efficiency and strong reasoning capabilities, particularly in European languages. They offer competitive performance with a focus on cost-effectiveness and are rapidly gaining traction.',
      strengths: ['High efficiency and cost-effectiveness', 'Strong performance in European languages', 'Good for edge deployments'],
      weaknesses: ['Broader cultural context can be limited', 'Newer player, still building ecosystem'],
    },
  };
  return summaries[companyName];
};

const generateMockAuditHistory = (companyName: CompanyName): AuditHistoryEntry[] => {
  const history: AuditHistoryEntry[] = [];
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - (i * 7 + Math.floor(Math.random() * 7))); // Random date in last 10 weeks
    const safetyScore = parseFloat((70 + Math.random() * 30).toFixed(1));
    const cost = parseFloat((0.01 + Math.random() * 0.1).toFixed(3));
    const outcome = safetyScore > 85 ? 'Passed' : 'Reviewed';
    const benchmark = ['VC Build', 'Data Process', 'OWASP Safety'][Math.floor(Math.random() * 3)];

    history.push({
      date: date.toISOString().split('T')[0],
      benchmark: benchmark,
      safetyScore: safetyScore,
      cost: cost,
      outcome: outcome,
      auditId: `audit-${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}-${i + 1}`,
    });
  }
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};


export const getMockTearSheetData = (companyName: CompanyName): TearSheetData | null => {
  const companyInfo = COMPANIES.find((c) => c.name === companyName);
  if (!companyInfo) return null;

  const asiScore = getCompanyBaseValue(companyName, 'asiScore');
  const compositeScore = parseFloat(
    (asiScore + (Math.random() * 10 - 5)).toFixed(1)
  ); // +/- 5 around base
  const verbalRating =
    compositeScore > 85
      ? 'Excellent Performer'
      : compositeScore > 75
      ? 'Strong Performer'
      : compositeScore > 65
      ? 'Good Performer, Watch Areas'
      : 'Evolving, High Scrutiny Recommended';

  const stockData = generateMockStockPriceData(companyInfo);
  const investmentData = generateMockAIInvestmentData(companyInfo);
  const revenueData = generateMockAIRevenueData(companyInfo);
  const partnershipData = generateMockAIPartnershipData(companyInfo);

  // Take the last value from each time series for core metrics
  const lastStockPrice = stockData.data.length > 0 ? stockData.data[stockData.data.length - 1].value : 0;
  const lastInvestment = investmentData.data.length > 0 ? investmentData.data[investmentData.data.length - 1].value : 0;
  const lastRevenue = revenueData.data.length > 0 ? revenueData.data[revenueData.data.length - 1].value : 0;
  const lastPartnerships = partnershipData.data.length > 0 ? partnershipData.data[partnershipData.data.length - 1].count : 0;


  return {
    companyInfo: companyInfo,
    asiCompositeScore: {
      score: compositeScore,
      verbalRating: verbalRating,
    },
    coreMetrics: {
      vaporwareProbability: { value: parseFloat((Math.random() * 40).toFixed(1)), trend: 'stable' }, // Mock value
      safetyScore: { value: parseFloat((70 + Math.random() * 30).toFixed(1)), trend: 'up' }, // Mock value
      unitEconomics: { value: parseFloat((0.01 + Math.random() * 0.05).toFixed(3)), trend: 'down' }, // Mock value
    },
    benchmarkPerformance: generateMockBenchmarkResults(companyName),
    qualitativeSummary: generateMockQualitativeSummary(companyName),
    technicalDetails: {
      architecture: companyName.includes('Mistral') ? 'Sparse Mixture of Experts' : (companyName.includes('Google') || companyName.includes('OpenAI')) ? 'Transformer-based Large Language Model, often multimodal' : 'Transformer-based LLM',
      trainingDataOverview: companyName.includes('Meta') ? 'Publicly available datasets, web crawls' : 'Vast proprietary and filtered web data',
      apiEndpoints: companyInfo.isPublic ? `https://api.${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/v1` : undefined,
      pricingModel: companyInfo.isPublic ? 'Token-based, tiered access' : 'Private partnerships, custom contracts',
    },
    recentAuditHistory: generateMockAuditHistory(companyName),
  };
};