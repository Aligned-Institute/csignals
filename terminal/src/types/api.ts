export type RiskLevel = 'green' | 'yellow' | 'red';

export interface SignalResponse {
  audit_date: string;
  net_burn: number;
  loop_efficiency: number;
  task_success_rate: number; // 0-100 score
  goal_alignment_fidelity: number; // 0-100 score
  behavioral_consistency: number; // 0-2 divergence index
  cost_per_outcome: number;
  alignment_premium: number;

  economic_health_score: number;
  safety_alignment_score: number;
  overall_risk_score: number;
  risk_level: RiskLevel;
  audit_count?: number;
}

export interface ModelSummaryResponse {
  model_id: string;
  model_name: string;
  developer: string | null;
  overall_risk_score: number;
  economic_health_score: number;
  safety_alignment_score: number;
  risk_level: RiskLevel;
  risk_trend: string | null;
  total_audits: number;
}

export interface PortfolioItemResponse {
  model_id: string;
  model_name: string;
  developer: string | null;
  monthly_price_usd: number | null;
  overall_risk_score: number;
  economic_health_score: number;
  safety_alignment_score: number;
  risk_level: RiskLevel;
  user_notes: string | null;
  added_at: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserInfo {
  id: string;
  email: string;
  role: string;
}

// ---- Ecosystem Interfaces ----
export interface EcosystemReportRequest {
  category: string;
  service?: string;
  features?: string[];
}

export interface EcosystemReportResponse {
  id: string;
  title: string;
  category: string;
  service: string;
  features: string[];
  generatedAt: string;
  status: string;
  summary: string;
  fullContent: string;
}

export interface EcosystemLaunchRequest {
  category: string;
  service?: string;
  features?: string[];
}

export interface EcosystemLaunchResponse {
  job_id: string;
  status: string;
  message: string;
  progress?: number; // Added for polling
}

export interface EcosystemReport {
    id: string;
    title: string;
    category: string;
    service: string;
    features: string[];
    generatedAt: string; // ISO date
    status: 'completed' | 'generating' | 'failed';
    summary: string;
    fullContent: string; // Added for mock content
}
