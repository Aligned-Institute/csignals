import type {
  SignalResponse,
  ModelSummaryResponse,
  PortfolioItemResponse,
  AuthResponse,
  EcosystemReportRequest, EcosystemReportResponse,
  EcosystemLaunchRequest, EcosystemLaunchResponse,
} from '@/types/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // 1. If path is already a full URL (contains http), use it exactly as-is
  if (path.startsWith('http')) {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(body.detail || 'Request failed', res.status);
    }

    return res.json();
  }

  // 2. Ensure API_BASE has a protocol to prevent "Relative Path" bugs
  let base = API_BASE;
  if (!base.startsWith('http')) {
    base = `https://${base}`;
  }

  const url = `${base}${API_PREFIX}${path}`;
  
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(body.detail || 'Request failed', res.status);
  }

  return res.json();
}

function authHeaders(token?: string): HeadersInit { // Token is now optional
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const api = {
  // ---- Auth ----
  auth: {
    login: (email: string, password: string) =>
      request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string) =>
      request<{ user_id: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    logout: (token: string) =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
        headers: authHeaders(token),
      }),
  },

  // ---- Signals ----
  signals: {
    getLeaderboard: (limit = 10, sortBy = 'overall_risk_score', order = 'desc') =>
      request<ModelSummaryResponse[]>(
        `/signal/leaderboard/top?limit=${limit}&sort_by=${sortBy}&order=${order}`,
      ),
    getModelSignals: (modelId: string, days = 30) =>
      request<SignalResponse[]>(`/signal/${modelId}?days=${days}`),
    getLatestSignal: (modelId: string) =>
      request<SignalResponse | null>(`/signal/${modelId}/latest`),
    getModelSummary: (modelId: string) =>
      request<ModelSummaryResponse>(`/signal/${modelId}/summary`),
  },

  // ---- Portfolio (JWT required) ----
  portfolio: {
    getFeed: (token: string) =>
      request<PortfolioItemResponse[]>('/signal/portfolio/feed', {
        headers: authHeaders(token),
      }),
    addToPortfolio: (token: string, modelId: string, notes?: string) =>
      request<{ message: string; model_id: string }>('/signal/portfolio', {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ model_id: modelId, notes }),
      }),
    removeFromPortfolio: (token: string, modelId: string) =>
      request<{ message: string; model_id: string }>(
        `/signal/portfolio/${modelId}`,
        {
          method: 'DELETE',
          headers: authHeaders(token),
        },
      ),
  },

  // ---- Ecosystem ----
  ecosystem: {
    generateReport: (payload: EcosystemReportRequest) =>
      request<EcosystemReportResponse>('/ecosystem/report', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    launchAgent: (payload: EcosystemLaunchRequest) =>
      request<EcosystemLaunchResponse>('/ecosystem/launch', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getLaunchStatus: (jobId: string) =>
      request<EcosystemLaunchResponse>(`/ecosystem/launch/${jobId}/status`),
  },

  // ---- SWR fetcher (accessible via api.fetcher) ----
  fetcher: <T>(path: string): Promise<T> => request<T>(path),
  authFetcher: (token: string) => <T>(path: string): Promise<T> =>
    request<T>(path, { headers: authHeaders(token) }),
  API_BASE: API_BASE, // Export for direct use in frontend components if needed
};
