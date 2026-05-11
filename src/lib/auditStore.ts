import { supabase } from "@/integrations/supabase/client";
import type { AuditRecord } from "@/data/mockData";

export interface AuditFilters {
  status?: AuditRecord["status"];
  branchName?: string;
  auditType?: string;
}

export interface AuditTrailEntry {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  details?: string;
}

export interface FullAuditRow extends AuditRecord {
  reportData: Record<string, unknown>;
  checkpoints: unknown[];
  workflowStage: "draft" | "submitted" | "reviewed" | "published";
  auditTrail: AuditTrailEntry[];
}

const fromDb = (r: Record<string, any>): FullAuditRow => ({
  auditId: r.audit_id,
  auditorId: r.auditor_id ?? "",
  auditorName: r.auditor_name ?? "",
  auditType: r.audit_type ?? "",
  branchName: r.branch_name ?? "",
  auditPeriodFrom: r.audit_period_from ?? "",
  auditPeriodTo: r.audit_period_to ?? "",
  auditStartDate: r.audit_start_date ?? "",
  auditEndDate: r.audit_end_date ?? "",
  scheduleApproveDate: r.schedule_approve_date ?? "",
  status: (r.status ?? "scheduled") as AuditRecord["status"],
  deferralReason: r.deferral_reason ?? undefined,
  remarks: r.remarks ?? undefined,
  auditScore: r.audit_score == null ? undefined : Number(r.audit_score),
  auditRating: r.audit_rating ?? undefined,
  reportData: (r.report_data ?? {}) as Record<string, unknown>,
  checkpoints: (r.checkpoints ?? []) as unknown[],
  workflowStage: (r.workflow_stage ?? "draft") as FullAuditRow["workflowStage"],
  auditTrail: (r.audit_trail ?? []) as AuditTrailEntry[],
});

export const fetchAudits = async (filters: AuditFilters = {}): Promise<FullAuditRow[]> => {
  let q = supabase.from("audits").select("*").order("audit_id", { ascending: true });
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.branchName) q = q.eq("branch_name", filters.branchName);
  if (filters.auditType) q = q.eq("audit_type", filters.auditType);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(fromDb);
};

export const fetchAuditById = async (auditId: string): Promise<FullAuditRow | null> => {
  const { data, error } = await supabase.from("audits").select("*").eq("audit_id", auditId).maybeSingle();
  if (error) throw error;
  return data ? fromDb(data) : null;
};

export interface AuditUpdate {
  status?: string;
  remarks?: string;
  reportData?: Record<string, unknown>;
  checkpoints?: unknown[];
  auditScore?: number | null;
  auditRating?: string | null;
  workflowStage?: string;
  auditTrail?: AuditTrailEntry[];
  deferralReason?: string;
}

export const updateAudit = async (auditId: string, changes: AuditUpdate) => {
  const patch: Record<string, unknown> = {};
  if (changes.status !== undefined) patch.status = changes.status;
  if (changes.remarks !== undefined) patch.remarks = changes.remarks;
  if (changes.reportData !== undefined) patch.report_data = changes.reportData;
  if (changes.checkpoints !== undefined) patch.checkpoints = changes.checkpoints;
  if (changes.auditScore !== undefined) patch.audit_score = changes.auditScore;
  if (changes.auditRating !== undefined) patch.audit_rating = changes.auditRating;
  if (changes.workflowStage !== undefined) patch.workflow_stage = changes.workflowStage;
  if (changes.auditTrail !== undefined) patch.audit_trail = changes.auditTrail;
  if (changes.deferralReason !== undefined) patch.deferral_reason = changes.deferralReason;
  const { error } = await supabase.from("audits").update(patch as never).eq("audit_id", auditId);
  if (error) throw error;
};

export const insertAudit = async (row: Partial<AuditRecord> & { auditId: string }) => {
  const { error } = await supabase.from("audits").insert({
    audit_id: row.auditId,
    auditor_id: row.auditorId,
    auditor_name: row.auditorName,
    audit_type: row.auditType,
    branch_name: row.branchName,
    audit_period_from: row.auditPeriodFrom,
    audit_period_to: row.auditPeriodTo,
    audit_start_date: row.auditStartDate,
    audit_end_date: row.auditEndDate,
    schedule_approve_date: row.scheduleApproveDate,
    status: row.status ?? "scheduled",
    deferral_reason: row.deferralReason,
    audit_score: row.auditScore,
    audit_rating: row.auditRating,
  });
  if (error) throw error;
};
