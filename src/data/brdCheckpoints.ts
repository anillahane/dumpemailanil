// Complete BRD Checkpoint Library
// Sourced from the Audit BRD - covers all in-scope process areas, controls and checkpoints
// applicable for branch / operations audit. Each row is editable in the Audit Report screen.

export interface BrdCheckpoint {
  process: string;
  checkpointCode: string;
  checkpoint: string;
  expectedControl: string;
  defaultEvidence: string;
  defaultSampleSize: number;
  defaultSeverity: "Low" | "Medium" | "High" | "Critical";
  weight: number; // scoring weight
  mandatory: boolean;
}

export const BRD_CHECKPOINTS: BrdCheckpoint[] = [
  // 1. Sourcing
  { process: "Sourcing", checkpointCode: "SRC-01", checkpoint: "Lead source, sector and customer profile correctly captured in LOS/core system.", expectedControl: "System data matches application form and customer declaration.", defaultEvidence: "Application form, LOS screen", defaultSampleSize: 10, defaultSeverity: "Medium", weight: 2, mandatory: true },
  { process: "Sourcing", checkpointCode: "SRC-02", checkpoint: "KYC, address proof and mandatory customer documents complete and valid.", expectedControl: "All mandatory KYC documents available before login.", defaultEvidence: "KYC pack", defaultSampleSize: 10, defaultSeverity: "Critical", weight: 3, mandatory: true },
  { process: "Sourcing", checkpointCode: "SRC-03", checkpoint: "Customer photograph, signature & PAN/Form 60 captured per RBI norms.", expectedControl: "Photo and signature visible, PAN validated.", defaultEvidence: "KYC pack", defaultSampleSize: 10, defaultSeverity: "High", weight: 2, mandatory: true },
  { process: "Sourcing", checkpointCode: "SRC-04", checkpoint: "Co-applicant / Guarantor details captured where applicable.", expectedControl: "Co-applicant KYC and consent on file.", defaultEvidence: "Co-applicant docs", defaultSampleSize: 5, defaultSeverity: "Medium", weight: 1, mandatory: false },

  // 2. Assessment / FI
  { process: "Assessment", checkpointCode: "ASM-01", checkpoint: "Residence, business and income assessment independently verified.", expectedControl: "FI / personal discussion report supports credit decision.", defaultEvidence: "FI report", defaultSampleSize: 8, defaultSeverity: "Medium", weight: 2, mandatory: true },
  { process: "Assessment", checkpointCode: "ASM-02", checkpoint: "Income proofs validated (bank statement / ITR / cash flow).", expectedControl: "Income computation matches supporting documents.", defaultEvidence: "Bank statement, ITR", defaultSampleSize: 8, defaultSeverity: "High", weight: 3, mandatory: true },
  { process: "Assessment", checkpointCode: "ASM-03", checkpoint: "Bureau / CIBIL pulled and adverse remarks resolved.", expectedControl: "Bureau report on file with deviation note if any.", defaultEvidence: "Bureau report", defaultSampleSize: 8, defaultSeverity: "High", weight: 2, mandatory: true },
  { process: "Assessment", checkpointCode: "ASM-04", checkpoint: "Property / collateral valuation and legal scrutiny report on file.", expectedControl: "TSR/Valuation reports valid and signed.", defaultEvidence: "TSR, Valuation", defaultSampleSize: 6, defaultSeverity: "High", weight: 3, mandatory: true },

  // 3. Underwriting
  { process: "Underwriting", checkpointCode: "UND-01", checkpoint: "Credit approval conditions, deviations and delegation matrix followed.", expectedControl: "Approvals comply with policy authority limits.", defaultEvidence: "Approval note", defaultSampleSize: 8, defaultSeverity: "High", weight: 3, mandatory: true },
  { process: "Underwriting", checkpointCode: "UND-02", checkpoint: "Deviation approvals captured with appropriate authority.", expectedControl: "Deviations within DOA, signed by competent authority.", defaultEvidence: "Deviation memo", defaultSampleSize: 5, defaultSeverity: "High", weight: 2, mandatory: true },
  { process: "Underwriting", checkpointCode: "UND-03", checkpoint: "FOIR / LTV / IIR within policy threshold.", expectedControl: "Ratios computed and within sanction terms.", defaultEvidence: "Credit sheet", defaultSampleSize: 8, defaultSeverity: "Medium", weight: 2, mandatory: true },

  // 4. Disbursement
  { process: "Disbursement", checkpointCode: "DIS-01", checkpoint: "Pre-disbursement checklist, agreement execution and insurance tagging complete.", expectedControl: "Disbursement only after PDD checklist completion.", defaultEvidence: "PDD checklist", defaultSampleSize: 6, defaultSeverity: "High", weight: 3, mandatory: true },
  { process: "Disbursement", checkpointCode: "DIS-02", checkpoint: "Loan agreement, NACH/ECS mandate and welcome kit issued.", expectedControl: "Executed agreement and active mandate on file.", defaultEvidence: "Agreement, NACH", defaultSampleSize: 6, defaultSeverity: "High", weight: 2, mandatory: true },
  { process: "Disbursement", checkpointCode: "DIS-03", checkpoint: "Disbursement amount, mode and beneficiary match sanction.", expectedControl: "Payment to sanctioned beneficiary only.", defaultEvidence: "Disb advice", defaultSampleSize: 6, defaultSeverity: "Critical", weight: 3, mandatory: true },
  { process: "Disbursement", checkpointCode: "DIS-04", checkpoint: "Post-disbursement documents (PDD) tracked and closed within TAT.", expectedControl: "Open PDDs within agreed TAT.", defaultEvidence: "PDD MIS", defaultSampleSize: 6, defaultSeverity: "Medium", weight: 1, mandatory: false },

  // 5. Collection & Recovery
  { process: "Collection & Recovery", checkpointCode: "COL-01", checkpoint: "Collection follow-up, receipt issuance and overdue escalation per policy.", expectedControl: "Follow-up trails and receipts available for due cases.", defaultEvidence: "Collection trail", defaultSampleSize: 10, defaultSeverity: "Medium", weight: 2, mandatory: true },
  { process: "Collection & Recovery", checkpointCode: "COL-02", checkpoint: "Cash receipts deposited in bank within TAT.", expectedControl: "Receipt-to-deposit TAT within 24-48 hrs.", defaultEvidence: "Deposit slip", defaultSampleSize: 10, defaultSeverity: "High", weight: 3, mandatory: true },
  { process: "Collection & Recovery", checkpointCode: "COL-03", checkpoint: "Repossession / legal cases tracked with proper authorisation.", expectedControl: "Legal notices and authorisations on file.", defaultEvidence: "Legal file", defaultSampleSize: 5, defaultSeverity: "High", weight: 2, mandatory: false },
  { process: "Collection & Recovery", checkpointCode: "COL-04", checkpoint: "Settlement / waivers approved as per matrix.", expectedControl: "Settlements within delegation, evidence on file.", defaultEvidence: "Settlement note", defaultSampleSize: 5, defaultSeverity: "High", weight: 2, mandatory: false },

  // 6. Cash Management
  { process: "Cash Management", checkpointCode: "CSH-01", checkpoint: "Physical cash verification, vault control and handover register reconciled daily.", expectedControl: "Cash balance matches system and register.", defaultEvidence: "Cash register", defaultSampleSize: 5, defaultSeverity: "Critical", weight: 3, mandatory: true },
  { process: "Cash Management", checkpointCode: "CSH-02", checkpoint: "Cash retention limit and insurance limit respected.", expectedControl: "Cash holding within sanctioned limit.", defaultEvidence: "Cash MIS", defaultSampleSize: 5, defaultSeverity: "High", weight: 2, mandatory: true },
  { process: "Cash Management", checkpointCode: "CSH-03", checkpoint: "Dual custody for vault and key management followed.", expectedControl: "Two custodians, key register signed.", defaultEvidence: "Key register", defaultSampleSize: 3, defaultSeverity: "High", weight: 2, mandatory: true },

  // 7. Branch Operations / In-Branch
  { process: "Branch Operations", checkpointCode: "OPS-01", checkpoint: "Registers, notice board, statutory displays and branch control records updated.", expectedControl: "Mandatory registers and displays current.", defaultEvidence: "Branch registers", defaultSampleSize: 5, defaultSeverity: "Low", weight: 1, mandatory: true },
  { process: "Branch Operations", checkpointCode: "OPS-02", checkpoint: "Customer grievance register maintained and closed within TAT.", expectedControl: "Complaints logged and closed with response.", defaultEvidence: "Grievance register", defaultSampleSize: 5, defaultSeverity: "Medium", weight: 2, mandatory: true },
  { process: "Branch Operations", checkpointCode: "OPS-03", checkpoint: "Fixed assets, stationery and security items tagged and verified.", expectedControl: "FA register tallies with physical.", defaultEvidence: "FA register", defaultSampleSize: 5, defaultSeverity: "Low", weight: 1, mandatory: false },
  { process: "Branch Operations", checkpointCode: "OPS-04", checkpoint: "BCP / fire safety / first aid equipment in working condition.", expectedControl: "Equipment service log up to date.", defaultEvidence: "Service log", defaultSampleSize: 3, defaultSeverity: "Medium", weight: 1, mandatory: true },

  // 8. HR & Statutory
  { process: "HR & Statutory", checkpointCode: "HR-01", checkpoint: "Attendance, leave and statutory display compliance verified.", expectedControl: "Attendance / leave records up to date.", defaultEvidence: "HR register", defaultSampleSize: 5, defaultSeverity: "Low", weight: 1, mandatory: true },
  { process: "HR & Statutory", checkpointCode: "HR-02", checkpoint: "Code of Conduct, POSH and information security acknowledgements on file.", expectedControl: "Acknowledgements signed and dated.", defaultEvidence: "HR file", defaultSampleSize: 5, defaultSeverity: "Medium", weight: 1, mandatory: true },

  // 9. IT & Information Security
  { process: "IT & InfoSec", checkpointCode: "IT-01", checkpoint: "User access, password policy and system locking enforced.", expectedControl: "Inactive users disabled, passwords expire on schedule.", defaultEvidence: "User access list", defaultSampleSize: 5, defaultSeverity: "High", weight: 2, mandatory: true },
  { process: "IT & InfoSec", checkpointCode: "IT-02", checkpoint: "Asset inventory, antivirus and patching current.", expectedControl: "AV up-to-date, patching within SLA.", defaultEvidence: "IT asset MIS", defaultSampleSize: 3, defaultSeverity: "Medium", weight: 1, mandatory: false },

  // 10. Compliance & AML
  { process: "Compliance & AML", checkpointCode: "AML-01", checkpoint: "PEP / sanction screening performed at onboarding & periodic refresh.", expectedControl: "Screening evidence on file with results.", defaultEvidence: "Screening log", defaultSampleSize: 5, defaultSeverity: "Critical", weight: 3, mandatory: true },
  { process: "Compliance & AML", checkpointCode: "AML-02", checkpoint: "Suspicious transactions reported through STR mechanism.", expectedControl: "STR escalation register maintained.", defaultEvidence: "STR register", defaultSampleSize: 3, defaultSeverity: "Critical", weight: 3, mandatory: true },
];

export const SEVERITY_WEIGHT: Record<string, number> = {
  Low: 1,
  Medium: 2,
  High: 4,
  Critical: 8,
};

export const RATING_BANDS: { min: number; rating: string }[] = [
  { min: 90, rating: "Excellent (A+)" },
  { min: 80, rating: "Very Good (A)" },
  { min: 70, rating: "Good (B)" },
  { min: 60, rating: "Needs Improvement (C)" },
  { min: 0, rating: "Unsatisfactory (D)" },
];

export const computeRating = (score: number): string =>
  RATING_BANDS.find(b => score >= b.min)?.rating ?? "Unsatisfactory (D)";
