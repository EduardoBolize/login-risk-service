export type Decision = 'ALLOW' | 'CHALLENGE' | 'DENY';

export interface RuleResult {
  rule: string;
  triggered: boolean;
  score: number;
  reason?: string;
  details?: Record<string, string | number | boolean | null>;
}

export interface Assessment {
  id: string;
  userId: string;
  ip: string;
  deviceId: string;
  userAgent: string | null;
  country: string | null;
  loginSuccess: boolean;
  score: number;
  decision: Decision;
  reasons: string[];
  ruleResults: RuleResult[];
  createdAt: string;
}

export interface Summary {
  since: string;
  total: number;
  ALLOW: number;
  CHALLENGE: number;
  DENY: number;
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY ?? 'dev-api-key';

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'x-api-key': API_KEY } });
  if (!response.ok) {
    throw new Error(`API respondeu ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const fetchSummary = () => get<Summary>('/v1/assessments/summary');

export const fetchAssessments = (decision?: Decision) => {
  const params = new URLSearchParams({ limit: '50' });
  if (decision) params.set('decision', decision);
  return get<Assessment[]>(`/v1/assessments?${params}`);
};
