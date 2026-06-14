import { getSessionToken } from './session';

// ═════════════════════════════════════
// 类型定义（对齐后端 schema）
// ═════════════════════════════════════

export type CandidateStatus = 'voting' | 'in_dev' | 'launched' | 'archived';

export interface VotingCandidate {
  id: number;
  key: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  status: CandidateStatus;
  vote_count: number;
  vote_percentage: number;
  is_voted_by_me: boolean;
}

export interface InDevItem {
  id: number;
  key: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  progress: number;
}

export interface LaunchedItem {
  id: number;
  key: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  launched_at: string | null;
}

export interface CandidateListData {
  max_votes_per_user: number;
  user_remaining_votes: number;
  user_voted_candidate_ids: number[];
  total_voters: number;
  candidates: VotingCandidate[];
  in_dev: InDevItem[];
  launched: LaunchedItem[];
}

export interface VoteActionData {
  candidate_id: number;
  new_vote_count: number;
  user_remaining_votes: number;
}

// 后端响应外壳 {code, message, data}
interface VoteApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

// ═════════════════════════════════════
// 内部 fetch（注入 JWT，剥外壳，code !== 0 抛错）
// ═════════════════════════════════════

const envBaseUrl = (import.meta as any)?.env?.VITE_API_BASE_URL || "";
const API_BASE = String(envBaseUrl).replace(/\/$/, "");

async function voteFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    const detail = body?.detail;
    const detailMsg = typeof detail === 'string' ? detail : detail?.message;
    throw new Error(detailMsg || body?.message || `请求失败（HTTP ${res.status}）`);
  }

  const envelope = body as VoteApiEnvelope<T> | null;
  if (envelope == null) {
    throw new Error('响应为空');
  }
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '请求失败');
  }
  return envelope.data;
}

// ═════════════════════════════════════
// 公开 API
// ═════════════════════════════════════

export function listVoteCandidates(): Promise<CandidateListData> {
  return voteFetch<CandidateListData>('/api/v1/vote/candidates');
}

export function castVote(candidateId: number): Promise<VoteActionData> {
  return voteFetch<VoteActionData>('/api/v1/vote/cast', {
    method: 'POST',
    body: JSON.stringify({ candidate_id: candidateId }),
  });
}

export function revokeVote(candidateId: number): Promise<VoteActionData> {
  return voteFetch<VoteActionData>(`/api/v1/vote/cast/${candidateId}`, {
    method: 'DELETE',
  });
}
