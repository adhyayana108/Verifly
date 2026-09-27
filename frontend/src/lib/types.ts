export type Role = "user" | "admin";

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
  dailyQuota: number;
}

export interface AdminUserView extends PublicUser {
  quotaUsedToday: number;
}

export interface AuthResponse {
  token: string;
  user: PublicUser;
}

export interface VerificationRecord {
  id: string;
  userId: string;
  domain: string;
  hasMX: boolean;
  hasSPF: boolean;
  hasDMARC: boolean;
  spfRecord?: string;
  dmarcRecord?: string;
  mxHosts?: string[];
  valid: boolean;
  error?: string;
  checkedAt: string;
}

export interface AnalyticsSummary {
  totalChecked: number;
  validCount: number;
  invalidCount: number;
  mxPresentRate: number;
  spfPresentRate: number;
  dmarcPresentRate: number;
  checkedByDay: Record<string, number>;
  recentDomains: string[];
}

export interface BulkEvent {
  type: "result" | "quota_exceeded" | "done";
  record?: VerificationRecord;
  completed: number;
  total: number;
}

export type VerificationStatus = "valid" | "partial" | "invalid";

export function statusOf(rec: Pick<VerificationRecord, "hasMX" | "hasSPF" | "hasDMARC" | "valid">): VerificationStatus {
  if (rec.valid) return "valid";
  if (rec.hasMX || rec.hasSPF || rec.hasDMARC) return "partial";
  return "invalid";
}