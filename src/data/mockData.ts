export interface AuditRecord {
  auditId: string;
  auditorId: string;
  auditorName: string;
  auditType: string;
  branchName: string;
  auditPeriodFrom: string;
  auditPeriodTo: string;
  auditStartDate: string;
  auditEndDate: string;
  scheduleApproveDate: string;
  status: "scheduled" | "deferred" | "open" | "draft-operation" | "draft-audit" | "review" | "published" | "assigned" | "outstanding" | "closed";
  deferralReason?: string;
  remarks?: string;
  auditScore?: number;
  auditRating?: string;
  daysLeft?: number;
}

export type ObservationStatus =
  | "Pending"
  | "Responded by Auditee"
  | "Accepted"
  | "Rejected"
  | "Closed"
  | "Reopened";

export const OBSERVATION_STATUSES: ObservationStatus[] = [
  "Pending",
  "Responded by Auditee",
  "Accepted",
  "Rejected",
  "Closed",
  "Reopened",
];

// Allowed forward transitions for the observation lifecycle.
export const OBSERVATION_TRANSITIONS: Record<ObservationStatus, ObservationStatus[]> = {
  Pending: ["Responded by Auditee"],
  "Responded by Auditee": ["Accepted", "Rejected"],
  Accepted: ["Closed"],
  Rejected: ["Responded by Auditee"],
  Closed: ["Reopened"],
  Reopened: ["Responded by Auditee"],
};

export const canTransitionObservation = (from: ObservationStatus, to: ObservationStatus) =>
  OBSERVATION_TRANSITIONS[from]?.includes(to) ?? false;

export interface ObservationStatusEvent {
  status: ObservationStatus;
  timestamp: string;
  user: string;
  comment?: string;
}

export interface ObservationRecord {
  issueId: string;
  auditId: string;
  branchName: string;
  subProcess: string;
  issueCategory: string;
  observation: string;
  issueSeverity: string;
  riskClassification: string;
  department: string;
  secondaryDept: string;
  issueStatus: ObservationStatus;
  valueAtRisk: number;
  daysLeft: number;
  branchComments?: string;
  publishedDate?: string;
  // Separate flags retained from previous flat status set
  isOverdue?: boolean;
  isSentBack?: boolean;
  // Closure / acceptance / reopen workflow fields
  closureComment?: string;
  closureProof?: string[];
  closureDate?: string;
  auditorFeedback?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  reopenedAt?: string;
  reopenReason?: string;
  reopenCount?: number;
  statusHistory?: ObservationStatusEvent[];
}

export const MOCK_AUDITS: AuditRecord[] = [
  { auditId: "KAQ12601", auditorId: "EMP1012", auditorName: "Arun Sharma", auditType: "Regular Audit", branchName: "Hubli", auditPeriodFrom: "10-12-2025", auditPeriodTo: "15-03-2026", auditStartDate: "16-03-2026", auditEndDate: "20-03-2026", scheduleApproveDate: "14-03-2026", status: "scheduled" },
  { auditId: "KAQ12602", auditorId: "EMP1015", auditorName: "Chethan M", auditType: "Regular Audit", branchName: "Mysore", auditPeriodFrom: "08-11-2025", auditPeriodTo: "05-03-2026", auditStartDate: "06-03-2026", auditEndDate: "10-03-2026", scheduleApproveDate: "04-03-2026", status: "scheduled" },
  { auditId: "KAQ12603", auditorId: "EMP1018", auditorName: "Balaji Rao", auditType: "Regular Audit", branchName: "Haveri", auditPeriodFrom: "18-11-2025", auditPeriodTo: "08-03-2026", auditStartDate: "07-03-2026", auditEndDate: "12-03-2026", scheduleApproveDate: "05-03-2026", status: "open" },
  { auditId: "KAQ12604", auditorId: "EMP1012", auditorName: "Arun Sharma", auditType: "Surprise Audit", branchName: "Belgaum", auditPeriodFrom: "01-01-2026", auditPeriodTo: "28-02-2026", auditStartDate: "01-03-2026", auditEndDate: "05-03-2026", scheduleApproveDate: "28-02-2026", status: "deferred", deferralReason: "Auditor requested rescheduling due to prior engagement" },
  { auditId: "KAQ12605", auditorId: "EMP1015", auditorName: "Chethan M", auditType: "Regular Audit", branchName: "Dharwad", auditPeriodFrom: "15-12-2025", auditPeriodTo: "15-03-2026", auditStartDate: "18-03-2026", auditEndDate: "22-03-2026", scheduleApproveDate: "16-03-2026", status: "deferred", deferralReason: "Auditor not available during scheduled period" },
  { auditId: "KAQ12606", auditorId: "EMP1018", auditorName: "Balaji Rao", auditType: "Regular Audit", branchName: "Gulbarga", auditPeriodFrom: "01-12-2025", auditPeriodTo: "28-02-2026", auditStartDate: "01-03-2026", auditEndDate: "05-03-2026", scheduleApproveDate: "27-02-2026", status: "open" },
  { auditId: "KAQ12607", auditorId: "EMP1012", auditorName: "Arun Sharma", auditType: "Regular Audit", branchName: "Shimoga", auditPeriodFrom: "10-01-2026", auditPeriodTo: "10-03-2026", auditStartDate: "12-03-2026", auditEndDate: "16-03-2026", scheduleApproveDate: "10-03-2026", status: "draft-operation", daysLeft: 2 },
  { auditId: "KAQ12608", auditorId: "EMP1015", auditorName: "Chethan M", auditType: "Regular Audit", branchName: "Mangalore", auditPeriodFrom: "05-01-2026", auditPeriodTo: "05-03-2026", auditStartDate: "08-03-2026", auditEndDate: "12-03-2026", scheduleApproveDate: "06-03-2026", status: "draft-audit", daysLeft: 1 },
  { auditId: "KAQ12609", auditorId: "EMP1018", auditorName: "Balaji Rao", auditType: "Surprise Audit", branchName: "Udupi", auditPeriodFrom: "15-12-2025", auditPeriodTo: "28-02-2026", auditStartDate: "01-03-2026", auditEndDate: "04-03-2026", scheduleApproveDate: "27-02-2026", status: "review", daysLeft: 3 },
  { auditId: "KAQ12610", auditorId: "EMP1012", auditorName: "Arun Sharma", auditType: "Regular Audit", branchName: "Raichur", auditPeriodFrom: "01-11-2025", auditPeriodTo: "31-01-2026", auditStartDate: "02-02-2026", auditEndDate: "06-02-2026", scheduleApproveDate: "31-01-2026", status: "published", auditScore: 75.25, auditRating: "Good (B)" },
  { auditId: "KAQ12611", auditorId: "EMP1015", auditorName: "Chethan M", auditType: "Regular Audit", branchName: "Bidar", auditPeriodFrom: "01-10-2025", auditPeriodTo: "31-12-2025", auditStartDate: "05-01-2026", auditEndDate: "09-01-2026", scheduleApproveDate: "03-01-2026", status: "published", auditScore: 94.49, auditRating: "Very Good (A)" },
  { auditId: "KAQ12612", auditorId: "EMP1022", auditorName: "Deepak Gowda", auditType: "Regular Audit", branchName: "Bangalore", auditPeriodFrom: "01-09-2025", auditPeriodTo: "30-11-2025", auditStartDate: "05-12-2025", auditEndDate: "10-12-2025", scheduleApproveDate: "03-12-2025", status: "published", auditScore: 99.0, auditRating: "Excellent (A+)" },
];

export const MOCK_OBSERVATIONS: ObservationRecord[] = [
  { issueId: "000001", auditId: "KAQ12610", branchName: "Raichur", subProcess: "Sourcing", issueCategory: "Lead information", observation: "Sector wrongly updated", issueSeverity: "Medium", riskClassification: "Process non compliance risk", department: "Sales", secondaryDept: "Credit", issueStatus: "Pending", valueAtRisk: 300000, daysLeft: 12, statusHistory: [{ status: "Pending", timestamp: "2026-03-01T09:00:00Z", user: "system" }] },
  { issueId: "000002", auditId: "KAQ12610", branchName: "Raichur", subProcess: "Assessment", issueCategory: "Residence", observation: "Applicant's current address wrongly updated", issueSeverity: "Medium", riskClassification: "Data incompleteness risk", department: "Sales", secondaryDept: "Credit", issueStatus: "Rejected", valueAtRisk: 300000, daysLeft: 10, isSentBack: true, auditorFeedback: "Proof insufficient, please re-share", statusHistory: [{ status: "Rejected", timestamp: "2026-03-05T11:00:00Z", user: "Reviewer", comment: "Proof insufficient" }] },
  { issueId: "000003", auditId: "KAQ12610", branchName: "Raichur", subProcess: "Cash Management", issueCategory: "Physical cash", observation: "Cash verification not done properly", issueSeverity: "High", riskClassification: "Fraud Risk", department: "Operations", secondaryDept: "Finance", issueStatus: "Pending", valueAtRisk: 500000, daysLeft: -28, isOverdue: true, statusHistory: [{ status: "Pending", timestamp: "2026-02-01T09:00:00Z", user: "system" }] },
  { issueId: "000004", auditId: "KAQ12611", branchName: "Bidar", subProcess: "Collection follow up", issueCategory: "Collection process", observation: "Collection follow-up not done as per schedule", issueSeverity: "Medium", riskClassification: "Process non compliance risk", department: "Collection", secondaryDept: "Operations", issueStatus: "Pending", valueAtRisk: 150000, daysLeft: 8, statusHistory: [{ status: "Pending", timestamp: "2026-03-01T09:00:00Z", user: "system" }] },
  { issueId: "000005", auditId: "KAQ12611", branchName: "Bidar", subProcess: "Sourcing", issueCategory: "Documentation", observation: "KYC documents incomplete", issueSeverity: "Critical", riskClassification: "Regulatory Risk", department: "Sales", secondaryDept: "Compliance", issueStatus: "Accepted", valueAtRisk: 0, daysLeft: 5, acceptedBy: "Arun Sharma", acceptedAt: "2026-03-04T10:00:00Z", statusHistory: [{ status: "Accepted", timestamp: "2026-03-04T10:00:00Z", user: "Arun Sharma" }] },
  { issueId: "000006", auditId: "KAQ12612", branchName: "Bangalore", subProcess: "Register maintenance", issueCategory: "Register", observation: "Register entries not updated", issueSeverity: "Low", riskClassification: "Operational Risk", department: "Operations", secondaryDept: "Admin", issueStatus: "Closed", valueAtRisk: 0, daysLeft: 0, branchComments: "All registers updated and verified", publishedDate: "15-01-2026", closureComment: "All registers updated and verified", closureProof: ["registers_jan26.pdf"], closureDate: "15-01-2026", statusHistory: [{ status: "Closed", timestamp: "2026-01-15T10:00:00Z", user: "Arun Sharma" }] },
  { issueId: "000007", auditId: "KAQ12612", branchName: "Bangalore", subProcess: "Notice board", issueCategory: "Display", observation: "Mandatory notices not displayed", issueSeverity: "Low", riskClassification: "Regulatory Risk", department: "Operations", secondaryDept: "Compliance", issueStatus: "Closed", valueAtRisk: 0, daysLeft: 0, branchComments: "Notices displayed as per guidelines", publishedDate: "15-01-2026", closureComment: "Notices displayed as per guidelines", closureProof: ["notice_board_photo.jpg"], closureDate: "15-01-2026", statusHistory: [{ status: "Closed", timestamp: "2026-01-15T10:00:00Z", user: "Arun Sharma" }] },
];

export const MOCK_AUDITORS = [
  { empId: "EMP1012", name: "Arun Sharma" },
  { empId: "EMP1015", name: "Chethan M" },
  { empId: "EMP1018", name: "Balaji Rao" },
  { empId: "EMP1022", name: "Deepak Gowda" },
  { empId: "EMP1030", name: "Suresh Naik" },
];

export const BRANCHES = [
  "Hubli", "Mysore", "Haveri", "Belgaum", "Dharwad", "Gulbarga",
  "Shimoga", "Mangalore", "Udupi", "Raichur", "Bidar", "Bangalore",
  "Davangere", "Tumkur", "Hassan",
];

export const AUDIT_TYPES = ["Regular Audit", "Surprise Audit", "Follow-up Audit"];

// Master data for dropdowns
export const PROCESS_OPTIONS = [
  "Sourcing, Underwriting & Disbursement",
  "Collection & Recovery",
  "In-Branch Audit",
  "Cash Management",
  "KYC & Documentation",
  "Operations",
  "Statutory Compliance",
  "IT & Systems",
  "Customer Service",
  "HR & Administration",
];

export const RISK_CLASSIFICATIONS = [
  "Process non compliance risk",
  "Fraud Risk",
  "Operational Risk",
  "Credit Risk",
  "Compliance Risk",
  "Reputational Risk",
  "Financial Risk",
];

export const DEPARTMENTS = [
  "Sales",
  "Credit",
  "Operations",
  "Collection",
  "Compliance",
  "IT",
  "HR",
  "Finance",
];

export const ISSUE_CATEGORIES = [
  "Lead information",
  "Physical cash",
  "KYC documents",
  "Loan file",
  "Collection trail",
  "Vault records",
  "Statutory register",
  "Notice board",
  "System access",
  "Customer complaint",
];

export const getDashboardCounts = () => ({
  scheduleAudit: 0,
  scheduledAudits: MOCK_AUDITS.filter(a => a.status === "scheduled").length,
  deferredAudits: MOCK_AUDITS.filter(a => a.status === "deferred").length,
  openAudit: MOCK_AUDITS.filter(a => a.status === "open").length,
  draftOperation: MOCK_AUDITS.filter(a => a.status === "draft-operation").length,
  draftAudit: MOCK_AUDITS.filter(a => a.status === "draft-audit").length,
  reviewAudits: MOCK_AUDITS.filter(a => a.status === "review").length,
  publishedAudits: MOCK_AUDITS.filter(a => a.status === "published").length,
  assignedObservations: MOCK_OBSERVATIONS.filter(o => o.issueStatus !== "Closed").length,
  outstandingObservations: MOCK_OBSERVATIONS.filter(o => o.isOverdue || o.isSentBack || o.issueStatus === "Rejected").length,
  closedObservations: MOCK_OBSERVATIONS.filter(o => o.issueStatus === "Closed").length,
});
