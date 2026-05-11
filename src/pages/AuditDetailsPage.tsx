import { useParams, useNavigate, Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AppLayout from "@/components/layout/AppLayout";
import { PROCESS_OPTIONS, RISK_CLASSIFICATIONS, DEPARTMENTS, ISSUE_CATEGORIES, OBSERVATION_STATUSES, AuditRecord } from "@/data/mockData";
import { fetchAuditById, updateAudit, FullAuditRow, AuditTrailEntry } from "@/lib/auditStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState, useMemo, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, XCircle, RotateCcw, FileText, Info, History, Download, Printer, Save, Plus, Upload, Lock, Send, ShieldCheck, AlertTriangle, Trash2, FileDown } from "lucide-react";
import { MOCK_OBSERVATIONS } from "@/data/mockData";
import { BRD_CHECKPOINTS, SEVERITY_WEIGHT, computeRating } from "@/data/brdCheckpoints";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { generateId } from "@/lib/idGenerator";

const AuditDetailsPage = () => {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [audit, setAudit] = useState<AuditRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [activeTab, setActiveTab] = useState<"report" | "info" | "history">("info");
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; index: number | null; feedback: string }>({ open: false, index: null, feedback: "" });
  const [reopenDialog, setReopenDialog] = useState<{ open: boolean; index: number | null; reason: string }>({ open: false, index: null, reason: "" });

  const defaultReportData = (id: string | undefined, dbScore?: number, dbRating?: string) => ({
    reportNo: `RPT-${id ?? "DRAFT"}`,
    branchManager: "Ramesh Kumar",
    region: "Karnataka North",
    auditObjective: "Validate branch process compliance, operational controls, documentation quality, and observation closure readiness.",
    auditScope: "Sourcing, underwriting, disbursement, collections, cash management, register maintenance, notice board and statutory display checks.",
    auditMethodology: "Document review, system verification, sample testing, branch walkthrough, staff discussion and evidence validation.",
    sampleBasis: "Risk-based sample selection covering active files, closed files, overdue accounts, cash records and statutory registers.",
    documentsReviewed: "Loan files, KYC documents, approval notes, disbursement checklist, collection trails, cash register, vault records and branch registers.",
    limitations: "Report is based on records and evidence made available during the audit period.",
    overallRisk: "Medium",
    auditScore: String(dbScore ?? 75.25),
    auditRating: dbRating ?? "Good (B)",
    executiveSummary: "Audit completed as per approved schedule. Key gaps were noted in cash verification, address updation and process documentation.",
    rootCause: "Process checklist adherence and supervisory review frequency require strengthening.",
    managementActionPlan: "Branch team to close high-risk observations first, validate evidence, and submit rectification details for reviewer confirmation.",
    auditeeResponse: "Branch has acknowledged the observations and committed corrective actions within defined timelines.",
    auditConclusion: "Controls are generally operating with improvement required in exception monitoring, evidence retention and supervisory review.",
    reviewerComments: "Pending reviewer validation.",
    publicationDate: "Pending",
    auditorSignOff: "Arun Sharma / EMP1012",
    reviewerSignOff: "Reviewer Pending",
    adminSignOff: "Admin Pending",
  });

  const defaultCheckpointRows = () => BRD_CHECKPOINTS.map((cp) => ({
    process: cp.process,
    checkpointCode: cp.checkpointCode,
    accountRef: "",
    checkpoint: cp.checkpoint,
    expectedControl: cp.expectedControl,
    sampleSize: String(cp.defaultSampleSize),
    evidence: cp.defaultEvidence,
    evidenceFiles: [] as { name: string; size: number }[],
    result: "Pending" as "Pending" | "Compliant" | "Non-Compliant" | "Observation" | "Not Applicable",
    severity: cp.defaultSeverity as string,
    exceptionValue: "0",
    owner: "",
    targetDate: "",
    remarks: "",
    reviewerComment: "",
    weight: cp.weight,
    mandatory: cp.mandatory,
  }));

  const [reportData, setReportData] = useState(() => defaultReportData(auditId));
  const [checkpointRows, setCheckpointRows] = useState(defaultCheckpointRows);
  const [reportLocked, setReportLocked] = useState(false);
  const [workflowStage, setWorkflowStage] = useState<"draft" | "submitted" | "reviewed" | "published">("draft");
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([
    { timestamp: new Date().toISOString(), user: "System", role: "system", action: "Audit opened", details: `Loaded audit ${auditId}` },
  ]);

  // Load audit + persisted state from Supabase
  useEffect(() => {
    if (!auditId) return;
    let cancelled = false;
    (async () => {
      try {
        const row = await fetchAuditById(auditId);
        if (cancelled || !row) { setLoading(false); return; }
        setAudit(row);
        const hasReport = row.reportData && Object.keys(row.reportData).length > 0;
        if (hasReport) {
          setReportData({ ...defaultReportData(auditId, row.auditScore, row.auditRating), ...(row.reportData as Record<string, string>) });
        } else {
          setReportData(defaultReportData(auditId, row.auditScore, row.auditRating));
        }
        if (Array.isArray(row.checkpoints) && row.checkpoints.length > 0) {
          setCheckpointRows(row.checkpoints as never);
        }
        if (row.workflowStage) {
          setWorkflowStage(row.workflowStage);
          setReportLocked(row.workflowStage !== "draft");
        }
        if (Array.isArray(row.auditTrail) && row.auditTrail.length > 0) {
          setAuditTrail(row.auditTrail);
        }
      } catch (e) {
        console.error("Failed to load audit", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [auditId]);

  const logTrail = (action: string, details?: string) => {
    setAuditTrail(prev => [
      { timestamp: new Date().toISOString(), user: user?.name ?? "Anonymous", role: user?.role ?? "guest", action, details },
      ...prev,
    ]);
  };

  // Persist current report state to Supabase
  const persistReport = async (overrides: Partial<{ workflowStage: string; trail: AuditTrailEntry[] }> = {}) => {
    if (!auditId) return;
    try {
      const scoreNum = Number((computedScore as number) ?? 0);
      await updateAudit(auditId, {
        reportData: reportData as unknown as Record<string, unknown>,
        checkpoints: checkpointRows as unknown as unknown[],
        auditScore: isFinite(scoreNum) ? scoreNum : null,
        auditRating: reportRating,
        workflowStage: overrides.workflowStage ?? workflowStage,
        auditTrail: overrides.trail ?? auditTrail,
      });
    } catch (e) {
      console.error("Failed to persist audit", e);
      toast({ title: "Save failed", description: "Could not save to database.", variant: "destructive" });
    }
  };

  const [editableObservations, setEditableObservations] = useState(() => {
    const records = MOCK_OBSERVATIONS.filter(o => o.auditId === auditId);
    return (records.length ? records : [
      { issueId: "DRAFT-01", issueCategory: "Lead information", observation: "Sector wrongly updated", issueSeverity: "Medium", riskClassification: "Process non compliance risk", department: "Sales", issueStatus: "Pending" as const, valueAtRisk: 300000 },
      { issueId: "DRAFT-02", issueCategory: "Physical cash", observation: "Cash verification not done properly", issueSeverity: "High", riskClassification: "Fraud Risk", department: "Operations", issueStatus: "Pending" as const, valueAtRisk: 500000 },
    ]).map(o => ({
      ...o,
      valueAtRisk: String(o.valueAtRisk),
      closureComment: (o as { closureComment?: string }).closureComment ?? "",
      closureProof: (o as { closureProof?: string[] }).closureProof ?? [],
      auditorFeedback: (o as { auditorFeedback?: string }).auditorFeedback ?? "",
      closureDate: (o as { closureDate?: string }).closureDate ?? "",
      acceptedBy: (o as { acceptedBy?: string }).acceptedBy ?? "",
      acceptedAt: (o as { acceptedAt?: string }).acceptedAt ?? "",
      reopenedAt: (o as { reopenedAt?: string }).reopenedAt ?? "",
      reopenReason: (o as { reopenReason?: string }).reopenReason ?? "",
      reopenCount: (o as { reopenCount?: number }).reopenCount ?? 0,
      statusHistory: (o as { statusHistory?: { status: string; timestamp: string; user: string; comment?: string }[] }).statusHistory ?? [],
    }));
  });

  if (loading) {
    return (
      <AppLayout title="Loading Audit">
        <p className="text-muted-foreground">Loading audit {auditId}…</p>
      </AppLayout>
    );
  }

  if (!audit) {
    return (
      <AppLayout title="Audit Not Found">
        <p className="text-muted-foreground">No audit found with ID: {auditId}</p>
      </AppLayout>
    );
  }

  const handleAction = (action: string) => {
    toast({ title: `Audit ${action}`, description: `Audit ${audit.auditId} has been ${action.toLowerCase()}.` });
    navigate(-1);
  };

  const updateReportField = (field: keyof typeof reportData, value: string) => {
    setReportData(prev => ({ ...prev, [field]: value.slice(0, 1000) }));
  };

  const updateCheckpointRow = (index: number, field: string, value: string) => {
    setCheckpointRows(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value.slice(0, 500) } : row));
  };

  const addCheckpointRow = () => {
    setCheckpointRows(prev => [...prev, {
      process: "",
      checkpointCode: generateId("checkpoint"),
      accountRef: "",
      checkpoint: "",
      expectedControl: "",
      sampleSize: "0",
      evidence: "",
      evidenceFiles: [] as { name: string; size: number }[],
      result: "Pending" as "Pending" | "Compliant" | "Non-Compliant" | "Observation" | "Not Applicable",
      severity: "Low",
      exceptionValue: "0",
      owner: "",
      targetDate: "",
      remarks: "",
      reviewerComment: "",
      weight: 1,
      mandatory: false,
    }]);
  };

  const removeCheckpointRow = (index: number) => {
    setCheckpointRows(prev => prev.filter((_, i) => i !== index));
  };

  const handleEvidenceUpload = (index: number, files: FileList | null) => {
    if (!files) return;
    const uploads = Array.from(files).map(f => ({ name: f.name, size: f.size }));
    setCheckpointRows(prev => prev.map((row, i) => i === index ? { ...row, evidenceFiles: [...row.evidenceFiles, ...uploads] } : row));
    const cp = checkpointRows[index]?.checkpointCode ?? `#${index + 1}`;
    logTrail("Evidence uploaded", `${cp}: ${uploads.map(u => u.name).join(", ")}`);
    toast({ title: "Evidence attached", description: `${uploads.length} file(s) attached.` });
  };

  const removeEvidenceFile = (rowIdx: number, fileIdx: number) => {
    setCheckpointRows(prev => prev.map((row, i) => i === rowIdx ? { ...row, evidenceFiles: row.evidenceFiles.filter((_, fi) => fi !== fileIdx) } : row));
  };

  const updateObservationRow = (index: number, field: keyof (typeof editableObservations)[number], value: string) => {
    setEditableObservations(prev => prev.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value.slice(0, 500) } : row));
  };

  type ObservationRow = (typeof editableObservations)[number];
  const patchObservationRow = (index: number, patch: Partial<ObservationRow>) => {
    setEditableObservations(prev => prev.map((row, i) => i === index ? { ...row, ...patch } : row));
  };

  const appendStatusHistory = (row: ObservationRow, status: string, comment?: string) => {
    return [
      ...(row.statusHistory ?? []),
      { status, timestamp: new Date().toISOString(), user: user ? `${user.name} (${user.empId})` : "Unknown", comment },
    ];
  };

  const handleProofUpload = (index: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const names = Array.from(files).map(f => f.name);
    setEditableObservations(prev => prev.map((row, i) => i === index ? { ...row, closureProof: [...(row.closureProof ?? []), ...names] } : row));
    toast({ title: "Proof attached", description: `${names.length} file(s) attached.` });
  };

  const removeProofFile = (index: number, fileIdx: number) => {
    setEditableObservations(prev => prev.map((row, i) => i === index ? { ...row, closureProof: (row.closureProof ?? []).filter((_, fi) => fi !== fileIdx) } : row));
  };

  const submitClosure = (index: number) => {
    const row = editableObservations[index];
    if (!row) return;
    if (!row.closureComment?.trim() || (row.closureProof ?? []).length === 0) {
      toast({ title: "Cannot submit", description: "Closure comment and at least one proof file are required.", variant: "destructive" });
      return;
    }
    const now = new Date().toISOString();
    patchObservationRow(index, {
      issueStatus: "Responded by Auditee",
      closureDate: now,
      statusHistory: appendStatusHistory(row, "Responded by Auditee", row.closureComment),
    });
    toast({ title: "Closure submitted", description: `Issue ${row.issueId} sent to auditor for review.` });
  };

  const acceptClosure = (index: number) => {
    const row = editableObservations[index];
    if (!row) return;
    const now = new Date().toISOString();
    const acceptedBy = user ? `${user.name} (${user.empId})` : "Auditor";
    let history = appendStatusHistory(row, "Accepted");
    history = [...history, { status: "Closed", timestamp: now, user: acceptedBy }];
    patchObservationRow(index, {
      issueStatus: "Closed",
      acceptedBy,
      acceptedAt: now,
      closureDate: now,
      statusHistory: history,
    });
    toast({ title: "Closure accepted", description: `Issue ${row.issueId} marked as Closed.` });
  };

  const openRejectDialog = (index: number) => setRejectDialog({ open: true, index, feedback: "" });

  const confirmReject = () => {
    if (rejectDialog.index === null) return;
    const idx = rejectDialog.index;
    const row = editableObservations[idx];
    if (!row) return;
    if (!rejectDialog.feedback.trim()) {
      toast({ title: "Feedback required", description: "Please provide rejection feedback.", variant: "destructive" });
      return;
    }
    patchObservationRow(idx, {
      issueStatus: "Rejected",
      auditorFeedback: rejectDialog.feedback,
      reopenedAt: new Date().toISOString(),
      reopenCount: (row.reopenCount ?? 0) + 1,
      statusHistory: appendStatusHistory(row, "Rejected", rejectDialog.feedback),
    });
    toast({ title: "Closure rejected", description: `Issue ${row.issueId} sent back to auditee.` });
    setRejectDialog({ open: false, index: null, feedback: "" });
  };

  const openReopenDialog = (index: number) => setReopenDialog({ open: true, index, reason: "" });

  const confirmReopen = () => {
    if (reopenDialog.index === null) return;
    const idx = reopenDialog.index;
    const row = editableObservations[idx];
    if (!row) return;
    if (!reopenDialog.reason.trim()) {
      toast({ title: "Reason required", description: "Please provide a reason to reopen.", variant: "destructive" });
      return;
    }
    const now = new Date().toISOString();
    patchObservationRow(idx, {
      issueStatus: "Reopened",
      reopenedAt: now,
      reopenReason: reopenDialog.reason,
      reopenCount: (row.reopenCount ?? 0) + 1,
      closureComment: "",
      closureProof: [],
      closureDate: "",
      auditorFeedback: "",
      acceptedBy: "",
      acceptedAt: "",
      statusHistory: appendStatusHistory(row, "Reopened", reopenDialog.reason),
    });
    toast({ title: "Observation reopened", description: `Issue ${row.issueId} has been reopened for auditee action.` });
    setReopenDialog({ open: false, index: null, reason: "" });
  };

  const renderClosureActions = (observation: ObservationRow, index: number) => {
    const status = observation.issueStatus;
    const isAuditee = user?.role === "auditee";
    const isReviewer = user?.role === "auditor" || user?.role === "reviewer";
    const canReopen = user?.role === "auditor" || user?.role === "reviewer" || user?.role === "admin";
    const canEditClosure = isAuditee && (status === "Pending" || status === "Rejected" || status === "Reopened");
    const canSubmit = canEditClosure && observation.closureComment?.trim() && (observation.closureProof?.length ?? 0) > 0;
    const showReview = isReviewer && status === "Responded by Auditee";
    const showReopen = canReopen && status === "Closed";
    const isClosedOrAccepted = status === "Closed" || status === "Accepted";
    const inputId = `closure-proof-${index}`;
    return (
      <div className="mt-2 space-y-2">
        {observation.auditorFeedback && status === "Rejected" && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs">
            <p className="font-medium text-destructive">Auditor feedback</p>
            <p className="text-muted-foreground">{observation.auditorFeedback}</p>
          </div>
        )}
        {observation.reopenReason && status === "Reopened" && (
          <div className="rounded-md border border-warning/40 bg-warning/5 p-2 text-xs">
            <p className="font-medium text-warning-foreground">Reopen reason{(observation.reopenCount ?? 0) > 0 ? ` (#${observation.reopenCount})` : ""}</p>
            <p className="text-muted-foreground">{observation.reopenReason}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={inputId}
            type="file"
            multiple
            className="hidden"
            disabled={!canEditClosure}
            onChange={e => { handleProofUpload(index, e.target.files); e.target.value = ""; }}
          />
          <label htmlFor={inputId}>
            <Button asChild size="sm" variant="outline" disabled={!canEditClosure}>
              <span className="cursor-pointer"><Upload className="mr-1 h-3 w-3" /> Closure Proof</span>
            </Button>
          </label>
          {canSubmit && (
            <Button size="sm" onClick={() => submitClosure(index)}>
              <Send className="mr-1 h-3 w-3" /> Submit Closure
            </Button>
          )}
          {showReview && (
            <>
              <Button size="sm" variant="default" onClick={() => acceptClosure(index)}>
                <CheckCircle className="mr-1 h-3 w-3" /> Accept
              </Button>
              <Button size="sm" variant="destructive" onClick={() => openRejectDialog(index)}>
                <XCircle className="mr-1 h-3 w-3" /> Reject
              </Button>
            </>
          )}
          {showReopen && (
            <Button size="sm" variant="outline" onClick={() => openReopenDialog(index)}>
              <RotateCcw className="mr-1 h-3 w-3" /> Reopen
            </Button>
          )}
        </div>
        {(observation.closureProof?.length ?? 0) > 0 && (
          <ul className="space-y-1">
            {observation.closureProof.map((file, fi) => (
              <li key={`${file}-${fi}`} className="flex items-center justify-between rounded-md border bg-muted/30 px-2 py-1 text-xs">
                <span className="truncate flex items-center gap-1"><FileText className="h-3 w-3" /> {file}</span>
                {canEditClosure && (
                  <button type="button" onClick={() => removeProofFile(index, fi)} className="text-destructive hover:underline">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {isClosedOrAccepted && observation.closureDate && (
          <p className="text-xs text-success">
            Closed on {new Date(observation.closureDate).toLocaleString()}{observation.acceptedBy ? ` by ${observation.acceptedBy}` : ""}
          </p>
        )}
        {(observation.statusHistory?.length ?? 0) > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="history" className="border rounded-md bg-muted/20">
              <AccordionTrigger className="px-3 py-2 text-xs hover:no-underline">
                <span className="flex items-center gap-1.5"><History className="h-3 w-3" /> Audit history ({observation.statusHistory!.length})</span>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                <ol className="relative ml-2 border-l border-border pl-4 space-y-3">
                  {[...observation.statusHistory!].reverse().map((evt, ei) => (
                    <li key={`${evt.timestamp}-${ei}`} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-[10px]">{evt.status}</Badge>
                        <span className="text-muted-foreground">{new Date(evt.timestamp).toLocaleString()}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium">{evt.user}</span>
                      </div>
                      {evt.comment && (
                        <p className="mt-1 text-xs text-muted-foreground italic">"{evt.comment}"</p>
                      )}
                    </li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    );
  };

  const addObservationRow = () => {
    setEditableObservations(prev => [...prev, {
      issueId: generateId("observation"),
      issueCategory: "",
      observation: "",
      issueSeverity: "Medium",
      riskClassification: "",
      department: "",
      issueStatus: "Pending" as const,
      valueAtRisk: "0",
      closureComment: "",
      closureProof: [] as string[],
      auditorFeedback: "",
      closureDate: "",
      acceptedBy: "",
      acceptedAt: "",
      reopenedAt: "",
      reopenReason: "",
      reopenCount: 0,
      statusHistory: [] as { status: string; timestamp: string; user: string; comment?: string }[],
    }]);
  };

  const isScheduled = audit.status === "scheduled";
  const isDeferred = audit.status === "deferred";
  const isOpen = audit.status === "open";
  const auditObservations = MOCK_OBSERVATIONS.filter(o => o.auditId === audit.auditId);

  // Auto-scoring: weighted compliance with severity-based penalty
  const scoredCheckpoints = checkpointRows.filter(r => r.result !== "Not Applicable" && r.result !== "Pending");
  const totalWeight = scoredCheckpoints.reduce((s, r) => s + r.weight, 0);
  const earnedWeight = scoredCheckpoints.reduce((s, r) => {
    if (r.result === "Compliant") return s + r.weight;
    if (r.result === "Observation") return s + r.weight * 0.5;
    return s;
  }, 0);
  const penalty = scoredCheckpoints
    .filter(r => r.result === "Non-Compliant")
    .reduce((s, r) => s + (SEVERITY_WEIGHT[r.severity] || 1), 0);
  const rawScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
  const computedScore = Math.max(0, Math.round((rawScore - penalty * 0.5) * 100) / 100);
  const reportScore = computedScore;
  const reportRating = computeRating(computedScore);

  // Per-process metrics derived from checkpointRows
  const PROCESS_GROUP_MAP: Record<string, string[]> = {
    "Sourcing, Underwriting & Disbursement": ["Sourcing", "Assessment", "Underwriting", "Disbursement"],
    "Collection & Recovery": ["Collection & Recovery"],
    "In-Branch Audit": ["Branch Operations", "Cash Management", "Compliance & AML", "HR & Statutory", "IT & InfoSec"],
  };
  const processMetrics = (process: string) => {
    const group = PROCESS_GROUP_MAP[process] ?? [process];
    const rows = checkpointRows.filter(r => group.includes(r.process));
    const checkpoints = rows.length;
    const compliant = rows.filter(r => r.result === "Compliant").length;
    const nonCompliant = rows.filter(r => r.result === "Non-Compliant").length;
    const observation = rows.filter(r => r.result === "Observation").length;
    const scored = compliant + nonCompliant + observation;
    const earned = compliant + observation * 0.5;
    const score = scored > 0 ? Math.round((earned / scored) * 1000) / 10 : 0;
    return { checkpoints, compliant, nonCompliant, score };
  };

  // Auto-derived per-process summary table (replaces previously editable processRows)
  const processSummary = useMemo(() => {
    return Object.keys(PROCESS_GROUP_MAP).map(process => {
      const group = PROCESS_GROUP_MAP[process];
      const rows = checkpointRows.filter(r => group.includes(r.process));
      const applicable = rows.filter(r => r.result !== "Not Applicable");
      const compliant = applicable.filter(r => r.result === "Compliant").length;
      const nonCompliantRows = applicable.filter(r => r.result === "Non-Compliant");
      const nonCompliant = nonCompliantRows.length;
      const checkpoints = applicable.length;
      const score = checkpoints > 0 ? Math.round((compliant / checkpoints) * 1000) / 10 : 0;
      // Owner: most common among non-compliant; fallback to unique list across applicable rows
      const ownerCounts = new Map<string, number>();
      nonCompliantRows.forEach(r => {
        const o = (r.owner || "").trim();
        if (o) ownerCounts.set(o, (ownerCounts.get(o) ?? 0) + 1);
      });
      let owner = "—";
      if (ownerCounts.size > 0) {
        owner = Array.from(ownerCounts.entries()).sort((a, b) => b[1] - a[1])[0][0];
      } else {
        const owners = Array.from(new Set(applicable.map(r => (r.owner || "").trim()).filter(Boolean)));
        if (owners.length) owner = owners.join(", ");
      }
      return { process, checkpoints, compliant, nonCompliant, score, owner };
    });
  }, [checkpointRows]);

  // Validations
  const mandatoryPending = checkpointRows.filter(r => r.mandatory && r.result === "Pending").length;
  const ncWithoutOwner = checkpointRows.filter(r => r.result === "Non-Compliant" && (!r.owner || !r.targetDate)).length;
  const ncWithoutEvidence = checkpointRows.filter(r => r.result === "Non-Compliant" && r.evidenceFiles.length === 0).length;
  const validationErrors: string[] = [];
  if (mandatoryPending > 0) validationErrors.push(`${mandatoryPending} mandatory checkpoint(s) pending result.`);
  if (ncWithoutOwner > 0) validationErrors.push(`${ncWithoutOwner} non-compliant checkpoint(s) missing owner / target date.`);
  if (ncWithoutEvidence > 0) validationErrors.push(`${ncWithoutEvidence} non-compliant checkpoint(s) missing evidence.`);
  if (!reportData.executiveSummary.trim()) validationErrors.push("Executive Summary is required.");
  if (!reportData.auditConclusion.trim()) validationErrors.push("Audit Conclusion is required.");
  const canSubmit = validationErrors.length === 0;

  const issueSummaryRows = ["Critical", "High", "Medium", "Low"].map(severity => {
    const matchingIssues = editableObservations.filter(issue => issue.issueSeverity === severity);
    return {
      severity,
      total: matchingIssues.length,
      open: matchingIssues.filter(issue => issue.issueStatus !== "Closed").length,
      closed: matchingIssues.filter(issue => issue.issueStatus === "Closed").length,
      valueAtRisk: matchingIssues.reduce((sum, issue) => sum + (Number(issue.valueAtRisk) || 0), 0),
    };
  });

  const exportReport = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 36;
    let y = margin;

    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, pageW, 56, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Audit Report", margin, 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(reportData.reportNo, pageW - margin, 36, { align: "right" });
    y = 80;

    // Meta badges
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`${audit.branchName} Branch`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    y += 16;
    const meta: [string, string][] = [
      ["Auditor", `${audit.auditorName} (${audit.auditorId})`],
      ["Audit Period", `${audit.auditPeriodFrom} to ${audit.auditPeriodTo}`],
      ["Audit Score", `${reportScore}%`],
      ["Audit Rating", reportRating],
      ["Workflow Stage", workflowStage],
      ["Generated", new Date().toLocaleString()],
    ];
    meta.forEach(([k, v], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = margin + col * ((pageW - margin * 2) / 2);
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, x, y + row * 14);
      doc.setFont("helvetica", "normal");
      doc.text(v, x + 70, y + row * 14);
    });
    y += Math.ceil(meta.length / 2) * 14 + 8;

    const section = (title: string, body: string) => {
      if (y > 760) { doc.addPage(); y = margin; }
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageW - margin * 2, 18, "F");
      doc.setTextColor(30, 58, 138);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(title, margin + 6, y + 13);
      y += 22;
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(body || "-", pageW - margin * 2 - 4);
      doc.text(lines, margin + 2, y);
      y += lines.length * 12 + 8;
    };

    section("Executive Summary", reportData.executiveSummary);
    section("Audit Objective", reportData.auditObjective);
    section("Audit Scope", reportData.auditScope);
    section("Methodology", reportData.auditMethodology);
    section("Sample Basis", reportData.sampleBasis);
    section("Documents Reviewed", reportData.documentsReviewed);
    section("Limitations", reportData.limitations);

    // Issues summary table
    if (y > 720) { doc.addPage(); y = margin; }
    doc.setTextColor(30, 58, 138);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Issues Summary (5.4.2.a)", margin, y);
    y += 6;
    autoTable(doc, {
      startY: y + 4,
      head: [["Severity", "Total", "Open", "Closed", "Value at Risk"]],
      body: issueSummaryRows.map(r => [r.severity, r.total, r.open, r.closed, `INR ${r.valueAtRisk.toLocaleString("en-IN")}`]),
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9 },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 16;

    // Detailed checkpoints
    if (y > 700) { doc.addPage(); y = margin; }
    doc.setTextColor(30, 58, 138);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Detailed Checkpoint Findings", margin, y);
    autoTable(doc, {
      startY: y + 6,
      head: [["Code", "Process", "Checkpoint", "Result", "Severity", "Owner", "Target", "Remarks", "Reviewer"]],
      body: checkpointRows.map(r => [
        r.checkpointCode, r.process, r.checkpoint, r.result, r.severity,
        r.owner || "-", r.targetDate || "-", r.remarks || "-", r.reviewerComment || "-",
      ]),
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
      columnStyles: {
        0: { cellWidth: 38 }, 1: { cellWidth: 60 }, 2: { cellWidth: 110 },
        3: { cellWidth: 50 }, 4: { cellWidth: 40 }, 5: { cellWidth: 50 },
        6: { cellWidth: 50 }, 7: { cellWidth: 70 }, 8: { cellWidth: 60 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const v = String(data.cell.raw);
          if (v === "Non-Compliant") data.cell.styles.textColor = [185, 28, 28];
          else if (v === "Compliant") data.cell.styles.textColor = [21, 128, 61];
          else if (v === "Observation") data.cell.styles.textColor = [180, 83, 9];
        }
      },
      margin: { left: margin, right: margin },
    });
    y = (doc as any).lastAutoTable.finalY + 16;

    section("Auditee Response", reportData.auditeeResponse);
    section("Audit Conclusion", reportData.auditConclusion);
    section("Reviewer Comments", reportData.reviewerComments);

    // Sign-off
    if (y > 720) { doc.addPage(); y = margin; }
    autoTable(doc, {
      startY: y,
      head: [["Auditor", "Reviewer", "Admin"]],
      body: [[reportData.auditorSignOff, reportData.reviewerSignOff, reportData.adminSignOff]],
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 9, minCellHeight: 40, valign: "top" },
      margin: { left: margin, right: margin },
    });

    // Footer page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Audit Management System • ${reportData.reportNo} • Page ${i} of ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 16,
        { align: "center" },
      );
    }

    doc.save(`${reportData.reportNo}.pdf`);
    logTrail("Report exported", `Generated PDF ${reportData.reportNo}.pdf`);
    toast({ title: "PDF generated", description: `${reportData.reportNo}.pdf downloaded.` });
  };

  const submitForReview = async () => {
    if (!canSubmit) {
      toast({ title: "Cannot submit", description: validationErrors[0], variant: "destructive" });
      return;
    }
    setReportLocked(true);
    setWorkflowStage("submitted");
    logTrail("Submitted for review", `Score ${reportScore}%, Rating ${reportRating}`);
    await persistReport({ workflowStage: "submitted" });
    toast({ title: "Submitted for review", description: "Report locked and forwarded to reviewer." });
  };
  const reviewerApprove = async () => {
    setWorkflowStage("reviewed");
    logTrail("Reviewer approved", reportData.reviewerComments);
    await persistReport({ workflowStage: "reviewed" });
    toast({ title: "Reviewed", description: "Report approved by reviewer." });
  };
  const adminPublish = async () => {
    setWorkflowStage("published");
    logTrail("Published to auditee", `Publication date: ${new Date().toLocaleDateString()}`);
    await persistReport({ workflowStage: "published" });
    toast({ title: "Published", description: "Report published to auditee." });
  };
  const reopenForEdit = async () => {
    setReportLocked(false);
    setWorkflowStage("draft");
    logTrail("Report reopened", "Unlocked for edit");
    await persistReport({ workflowStage: "draft" });
    toast({ title: "Reopened", description: "Report unlocked for edit." });
  };

  const tabs = [
    { key: "report", label: "Audit Report", icon: FileText },
    { key: "info", label: "Audit Information", icon: Info },
    { key: "history", label: "Audit History", icon: History },
  ] as const;

  return (
    <AppLayout
      title="Audit Details"
      breadcrumbs={[
        { label: "Dashboard", path: "/dashboard" },
        { label: audit.status === "scheduled" ? "Scheduled Audits" : audit.status === "deferred" ? "Deferred Audits" : "Open Audits" },
        { label: audit.auditId },
      ]}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="bg-card rounded-xl border">
            <div className="flex border-b">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.key
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="p-6">
              {activeTab === "info" && (
                <div className="space-y-4">
                  {[
                    ["Audit ID", audit.auditId],
                    ["Branch Name", audit.branchName],
                    ["Auditor ID", audit.auditorId],
                    ["Auditor Name", audit.auditorName],
                    ["Schedule Approve Date", audit.scheduleApproveDate],
                    ["Audit Start Date", audit.auditStartDate],
                    ["Audit End Date", audit.auditEndDate],
                    ["Audit Period From", audit.auditPeriodFrom],
                    ["Audit Period To", audit.auditPeriodTo],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center py-2 border-b border-border/50 last:border-0">
                      <span className="w-48 text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "report" && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Editable Audit Report Format</p>
                      <h2 className="text-xl font-bold text-foreground">{audit.branchName} Branch Audit Report</h2>
                      <p className="text-sm text-muted-foreground">All BRD report parameters available for testing</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={workflowStage === "published" ? "default" : "secondary"} className="capitalize">
                        {reportLocked && <Lock size={12} className="mr-1" />} Stage: {workflowStage}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer size={15} /> Print
                      </Button>
                      <Button variant="outline" size="sm" onClick={exportReport}>
                        <FileDown size={15} /> Export
                      </Button>
                      <Button size="sm" disabled={reportLocked} onClick={async () => { logTrail("Draft saved", `Score ${reportScore}%, ${checkpointRows.length} checkpoints`); await persistReport(); toast({ title: "Draft saved", description: `${audit.auditId} report draft saved.` }); }}>
                        <Save size={15} /> Save Draft
                      </Button>
                    </div>
                  </div>

                  {validationErrors.length > 0 && (
                    <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                      <div className="flex items-center gap-2 text-destructive font-semibold text-sm mb-2">
                        <AlertTriangle size={16} /> Validation issues ({validationErrors.length})
                      </div>
                      <ul className="text-sm text-destructive/90 list-disc pl-5 space-y-1">
                        {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/20 p-3">
                    <span className="text-xs text-muted-foreground mr-2">Workflow:</span>
                    <Button size="sm" variant="default" disabled={!canSubmit || workflowStage !== "draft"} onClick={submitForReview}>
                      <Send size={14} /> Submit for Review
                    </Button>
                    <Button size="sm" variant="outline" disabled={workflowStage !== "submitted"} onClick={reviewerApprove}>
                      <ShieldCheck size={14} /> Reviewer Approve
                    </Button>
                    <Button size="sm" variant="outline" disabled={workflowStage !== "reviewed"} onClick={adminPublish}>
                      <CheckCircle size={14} /> Publish
                    </Button>
                    {reportLocked && (
                      <Button size="sm" variant="ghost" onClick={reopenForEdit}>
                        <RotateCcw size={14} /> Reopen
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      ["Audit Score", reportScore ? `${reportScore}%` : "Pending"],
                      ["Audit Rating", reportRating],
                      ["Observations", String(editableObservations.length)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg border bg-muted/30 p-4">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-md border-l-4 border-primary bg-primary/5 px-4 py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">Data Entry</p>
                    <p className="text-xs text-muted-foreground">Editable inputs captured by the auditor.</p>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <div className="bg-muted/40 px-4 py-3 border-b">
                      <h3 className="text-sm font-semibold">Report Header & Audit Summary <span className="ml-2 text-xs font-normal text-muted-foreground">(Data Entry)</span></h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 p-4">
                      <div className="space-y-1.5"><Label>Report No.</Label><Input value={reportData.reportNo} maxLength={40} onChange={e => updateReportField("reportNo", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Audit Type</Label><Input value={audit.auditType} readOnly className="bg-muted/40" /></div>
                      <div className="space-y-1.5"><Label>Branch</Label><Input value={audit.branchName} readOnly className="bg-muted/40" /></div>
                      <div className="space-y-1.5"><Label>Region</Label><Input value={reportData.region} maxLength={80} onChange={e => updateReportField("region", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Branch Manager</Label><Input value={reportData.branchManager} maxLength={80} onChange={e => updateReportField("branchManager", e.target.value)} /></div>
                      <div className="space-y-1.5"><Label>Auditor</Label><Input value={`${audit.auditorName} (${audit.auditorId})`} readOnly className="bg-muted/40" /></div>
                      <div className="space-y-1.5"><Label>Audit Period</Label><Input value={`${audit.auditPeriodFrom} to ${audit.auditPeriodTo}`} readOnly className="bg-muted/40" /></div>
                      <div className="space-y-1.5"><Label>Audit Dates</Label><Input value={`${audit.auditStartDate} to ${audit.auditEndDate}`} readOnly className="bg-muted/40" /></div>
                      <div className="space-y-1.5"><Label>Overall Risk</Label><Select value={reportData.overallRisk} onValueChange={value => updateReportField("overallRisk", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select></div>
                      <div className="space-y-1.5"><Label>Current Stage</Label><Input value={audit.status.replace(/-/g, " ")} readOnly className="bg-muted/40 capitalize" /></div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 border-t p-4">
                      <div className="space-y-1.5"><Label>Audit Objective</Label><Textarea value={reportData.auditObjective} maxLength={1000} onChange={e => updateReportField("auditObjective", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Audit Scope</Label><Textarea value={reportData.auditScope} maxLength={1000} onChange={e => updateReportField("auditScope", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Audit Methodology</Label><Textarea value={reportData.auditMethodology} maxLength={1000} onChange={e => updateReportField("auditMethodology", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Sample Basis</Label><Textarea value={reportData.sampleBasis} maxLength={1000} onChange={e => updateReportField("sampleBasis", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Documents / Evidence Reviewed</Label><Textarea value={reportData.documentsReviewed} maxLength={1000} onChange={e => updateReportField("documentsReviewed", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Limitations / Dependencies</Label><Textarea value={reportData.limitations} maxLength={1000} onChange={e => updateReportField("limitations", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Executive Summary</Label><Textarea value={reportData.executiveSummary} maxLength={1000} onChange={e => updateReportField("executiveSummary", e.target.value)} rows={3} /></div>
                    </div>
                  </div>

                  <div className="rounded-md border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20 px-4 py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Summary (auto-generated)</p>
                    <p className="text-xs text-muted-foreground">Read-only — computed from checkpoint data entered below.</p>
                  </div>

                  <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900/40 overflow-hidden">
                    <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-3 border-b border-amber-200 dark:border-amber-900/40">
                      <h3 className="text-sm font-semibold">Process-wise Compliance & Scoring <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">(auto)</span></h3>
                    </div>
                    {/* Desktop table */}
                    <div className="overflow-x-auto hidden sm:block">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Process</th>
                            <th className="px-4 py-3 text-left font-medium">Checkpoints</th>
                            <th className="px-4 py-3 text-left font-medium">Compliant</th>
                            <th className="px-4 py-3 text-left font-medium">Non-Compliant</th>
                            <th className="px-4 py-3 text-left font-medium">Score %</th>
                            <th className="px-4 py-3 text-left font-medium">Owner</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {processSummary.map(row => (
                            <tr key={row.process}>
                              <td className="px-4 py-3 min-w-64 font-medium">{row.process}</td>
                              <td className="px-4 py-3 min-w-28 font-medium">{row.checkpoints}</td>
                              <td className="px-4 py-3 min-w-28 text-success font-medium">{row.compliant}</td>
                              <td className="px-4 py-3 min-w-32 text-destructive font-medium">{row.nonCompliant}</td>
                              <td className="px-4 py-3 min-w-28 font-semibold">{row.score}%</td>
                              <td className="px-4 py-3 min-w-40 text-sm">{row.owner}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y">
                      {processSummary.map(row => (
                        <div key={row.process} className="p-4 space-y-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Process</p>
                            <p className="text-sm font-medium">{row.process}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Checkpoints</p>
                              <p className="text-sm font-medium">{row.checkpoints}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Compliant</p>
                              <p className="text-sm font-medium text-success">{row.compliant}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Non-Compliant</p>
                              <p className="text-sm font-medium text-destructive">{row.nonCompliant}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Score %</p>
                              <p className="text-sm font-semibold">{row.score}%</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Owner</p>
                            <p className="text-sm">{row.owner}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md border-l-4 border-primary bg-primary/5 px-4 py-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">Data Entry</p>
                    <p className="text-xs text-muted-foreground">Capture per-checkpoint results, owners and evidence.</p>
                  </div>

                  <div className="rounded-lg border overflow-hidden">
                    <div className="flex flex-col gap-3 bg-muted/40 px-4 py-3 border-b sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">Detailed Audit Checklist - Individual Checkpoints <span className="ml-2 text-xs font-normal text-muted-foreground">(Data Entry)</span></h3>
                        <p className="text-xs text-muted-foreground">Editable checkpoint-level testing format covering process, control, sample, result, severity and remarks.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={addCheckpointRow}><Plus size={15} /> Add Checkpoint</Button>
                    </div>
                    {/* Desktop table */}
                    <div className="overflow-x-auto hidden sm:block">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Process</th>
                            <th className="px-4 py-3 text-left font-medium">Checkpoint ID</th>
                            <th className="px-4 py-3 text-left font-medium">Account / Ref</th>
                            <th className="px-4 py-3 text-left font-medium">Checkpoint</th>
                            <th className="px-4 py-3 text-left font-medium">Expected Control</th>
                            <th className="px-4 py-3 text-left font-medium">Sample</th>
                            <th className="px-4 py-3 text-left font-medium">Evidence Type</th>
                            <th className="px-4 py-3 text-left font-medium">Evidence Files</th>
                            <th className="px-4 py-3 text-left font-medium">Result</th>
                            <th className="px-4 py-3 text-left font-medium">Severity</th>
                            <th className="px-4 py-3 text-left font-medium">Exception Value</th>
                            <th className="px-4 py-3 text-left font-medium">Owner</th>
                            <th className="px-4 py-3 text-left font-medium">Target Date</th>
                            <th className="px-4 py-3 text-left font-medium">Auditor Remarks</th>
                            <th className="px-4 py-3 text-left font-medium">Reviewer Comment</th>
                            <th className="px-4 py-3 text-left font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {checkpointRows.map((row, index) => (
                            <tr key={`${row.checkpointCode}-${index}`} className={row.mandatory && row.result === "Pending" ? "bg-destructive/5" : ""}>
                              <td className="px-4 py-3 min-w-44">
                                <Select disabled={reportLocked} value={row.process} onValueChange={v => updateCheckpointRow(index, "process", v)}>
                                  <SelectTrigger><SelectValue placeholder="Select process" /></SelectTrigger>
                                  <SelectContent>{PROCESS_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3 min-w-32">
                                <div className="flex items-center gap-1">
                                  <Input readOnly value={row.checkpointCode} className="font-mono bg-muted/40" title="Auto-generated. Format managed in Admin → ID Settings." />
                                  {row.mandatory && <Badge variant="destructive" className="text-[10px] px-1">M</Badge>}
                                </div>
                              </td>
                              <td className="px-4 py-3 min-w-36"><Input disabled={reportLocked} value={row.accountRef} onChange={e => updateCheckpointRow(index, "accountRef", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-80"><Textarea disabled={reportLocked} value={row.checkpoint} rows={2} onChange={e => updateCheckpointRow(index, "checkpoint", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-72"><Textarea disabled={reportLocked} value={row.expectedControl} rows={2} onChange={e => updateCheckpointRow(index, "expectedControl", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-24"><Input disabled={reportLocked} type="number" min="0" value={row.sampleSize} onChange={e => updateCheckpointRow(index, "sampleSize", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-48"><Input disabled={reportLocked} value={row.evidence} onChange={e => updateCheckpointRow(index, "evidence", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-48">
                                <label className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border cursor-pointer hover:bg-accent ${reportLocked ? "opacity-50 pointer-events-none" : ""}`}>
                                  <Upload size={12} /> Upload
                                  <input type="file" multiple className="hidden" onChange={e => handleEvidenceUpload(index, e.target.files)} />
                                </label>
                                <div className="mt-1 space-y-0.5">
                                  {row.evidenceFiles.map((f, fi) => (
                                    <div key={fi} className="flex items-center justify-between gap-1 text-[11px] bg-muted/40 px-1.5 py-0.5 rounded">
                                      <span className="truncate max-w-[120px]" title={f.name}>{f.name}</span>
                                      <button disabled={reportLocked} onClick={() => removeEvidenceFile(index, fi)} className="text-destructive hover:opacity-70"><Trash2 size={10} /></button>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-4 py-3 min-w-40"><Select disabled={reportLocked} value={row.result} onValueChange={value => updateCheckpointRow(index, "result", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Compliant">Compliant</SelectItem><SelectItem value="Non-Compliant">Non-Compliant</SelectItem><SelectItem value="Observation">Observation</SelectItem><SelectItem value="Not Applicable">Not Applicable</SelectItem></SelectContent></Select></td>
                              <td className="px-4 py-3 min-w-36"><Select disabled={reportLocked} value={row.severity} onValueChange={value => updateCheckpointRow(index, "severity", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select></td>
                              <td className="px-4 py-3 min-w-36"><Input disabled={reportLocked} type="number" min="0" value={row.exceptionValue} onChange={e => updateCheckpointRow(index, "exceptionValue", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-40"><Input disabled={reportLocked} value={row.owner} onChange={e => updateCheckpointRow(index, "owner", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-36"><Input disabled={reportLocked} type="date" value={row.targetDate} onChange={e => updateCheckpointRow(index, "targetDate", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-72"><Textarea disabled={reportLocked} value={row.remarks} rows={2} onChange={e => updateCheckpointRow(index, "remarks", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-72">
                                <Textarea
                                  placeholder={user?.role === "reviewer" || user?.role === "admin" ? "Add reviewer comment..." : "Reviewer to comment"}
                                  disabled={user?.role !== "reviewer" && user?.role !== "admin"}
                                  value={row.reviewerComment}
                                  rows={2}
                                  onChange={e => updateCheckpointRow(index, "reviewerComment", e.target.value)}
                                  className={row.reviewerComment ? "border-primary/40 bg-primary/5" : ""}
                                />
                              </td>
                              <td className="px-4 py-3"><Button variant="ghost" size="icon" disabled={reportLocked || row.mandatory} onClick={() => removeCheckpointRow(index)}><Trash2 size={14} /></Button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile cards */}
                    <div className="sm:hidden divide-y">
                      {checkpointRows.map((row, index) => (
                        <div key={`${row.checkpointCode}-${index}`} className={`p-4 space-y-3 ${row.mandatory && row.result === "Pending" ? "bg-destructive/5" : ""}`}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-xs text-muted-foreground mb-1">Checkpoint ID</p>
                              <div className="flex items-center gap-1">
                                <Input readOnly value={row.checkpointCode} className="font-mono bg-muted/40" title="Auto-generated. Format managed in Admin → ID Settings." />
                                {row.mandatory && <Badge variant="destructive" className="text-[10px] px-1 shrink-0">M</Badge>}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" disabled={reportLocked || row.mandatory} onClick={() => removeCheckpointRow(index)}><Trash2 size={14} /></Button>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Process</p>
                            <Select disabled={reportLocked} value={row.process} onValueChange={v => updateCheckpointRow(index, "process", v)}>
                              <SelectTrigger><SelectValue placeholder="Select process" /></SelectTrigger>
                              <SelectContent>{PROCESS_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Account / Ref</p>
                            <Input disabled={reportLocked} value={row.accountRef} onChange={e => updateCheckpointRow(index, "accountRef", e.target.value)} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Checkpoint</p>
                            <Textarea disabled={reportLocked} value={row.checkpoint} rows={2} onChange={e => updateCheckpointRow(index, "checkpoint", e.target.value)} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Expected Control</p>
                            <Textarea disabled={reportLocked} value={row.expectedControl} rows={2} onChange={e => updateCheckpointRow(index, "expectedControl", e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Sample Size</p>
                              <Input disabled={reportLocked} type="number" min="0" value={row.sampleSize} onChange={e => updateCheckpointRow(index, "sampleSize", e.target.value)} />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Exception Value</p>
                              <Input disabled={reportLocked} type="number" min="0" value={row.exceptionValue} onChange={e => updateCheckpointRow(index, "exceptionValue", e.target.value)} />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Evidence Type</p>
                            <Input disabled={reportLocked} value={row.evidence} onChange={e => updateCheckpointRow(index, "evidence", e.target.value)} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Evidence Files</p>
                            <label className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border cursor-pointer hover:bg-accent ${reportLocked ? "opacity-50 pointer-events-none" : ""}`}>
                              <Upload size={12} /> Upload
                              <input type="file" multiple className="hidden" onChange={e => handleEvidenceUpload(index, e.target.files)} />
                            </label>
                            <div className="mt-1 space-y-0.5">
                              {row.evidenceFiles.map((f, fi) => (
                                <div key={fi} className="flex items-center justify-between gap-1 text-[11px] bg-muted/40 px-1.5 py-0.5 rounded">
                                  <span className="truncate max-w-[120px]" title={f.name}>{f.name}</span>
                                  <button disabled={reportLocked} onClick={() => removeEvidenceFile(index, fi)} className="text-destructive hover:opacity-70"><Trash2 size={10} /></button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Result</p>
                              <Select disabled={reportLocked} value={row.result} onValueChange={value => updateCheckpointRow(index, "result", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Compliant">Compliant</SelectItem><SelectItem value="Non-Compliant">Non-Compliant</SelectItem><SelectItem value="Observation">Observation</SelectItem><SelectItem value="Not Applicable">Not Applicable</SelectItem></SelectContent></Select>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Severity</p>
                              <Select disabled={reportLocked} value={row.severity} onValueChange={value => updateCheckpointRow(index, "severity", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Owner</p>
                              <Input disabled={reportLocked} value={row.owner} onChange={e => updateCheckpointRow(index, "owner", e.target.value)} />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Target Date</p>
                              <Input disabled={reportLocked} type="date" value={row.targetDate} onChange={e => updateCheckpointRow(index, "targetDate", e.target.value)} />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Auditor Remarks</p>
                            <Textarea disabled={reportLocked} value={row.remarks} rows={2} onChange={e => updateCheckpointRow(index, "remarks", e.target.value)} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Reviewer Comment</p>
                            <Textarea
                              placeholder={user?.role === "reviewer" || user?.role === "admin" ? "Add reviewer comment..." : "Reviewer to comment"}
                              disabled={user?.role !== "reviewer" && user?.role !== "admin"}
                              value={row.reviewerComment}
                              rows={2}
                              onChange={e => updateCheckpointRow(index, "reviewerComment", e.target.value)}
                              className={row.reviewerComment ? "border-primary/40 bg-primary/5" : ""}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900/40 overflow-hidden">
                    <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-3 border-b border-amber-200 dark:border-amber-900/40">
                      <h3 className="text-sm font-semibold">Audit Score & Rating <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">(Summary — auto)</span></h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-amber-50/40 dark:bg-amber-950/10">
                      <div className="space-y-1.5"><Label>Audit Score % (auto)</Label><Input type="number" value={reportScore} readOnly className="bg-muted/40" /></div>
                      <div className="space-y-1.5"><Label>Audit Rating (auto)</Label><Input value={reportRating} readOnly className="bg-muted/40" /></div>
                      <div className="space-y-1.5"><Label>Report Status</Label><Input value={audit.status.replace(/-/g, " ")} readOnly className="bg-muted/40 capitalize" /></div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 border-t p-4 bg-background">
                      <div className="rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2 -mx-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-primary">Data Entry — Management Response</p>
                      </div>
                      <div className="space-y-1.5"><Label>Root Cause Analysis</Label><Textarea value={reportData.rootCause} maxLength={1000} onChange={e => updateReportField("rootCause", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Management Action Plan</Label><Textarea value={reportData.managementActionPlan} maxLength={1000} onChange={e => updateReportField("managementActionPlan", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Auditee Response</Label><Textarea value={reportData.auditeeResponse} maxLength={1000} onChange={e => updateReportField("auditeeResponse", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Audit Conclusion</Label><Textarea value={reportData.auditConclusion} maxLength={1000} onChange={e => updateReportField("auditConclusion", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Reviewer Comments</Label><Textarea value={reportData.reviewerComments} maxLength={1000} onChange={e => updateReportField("reviewerComments", e.target.value)} rows={2} /></div>
                      <div className="space-y-1.5"><Label>Publication Date</Label><Input value={reportData.publicationDate} maxLength={40} onChange={e => updateReportField("publicationDate", e.target.value)} /></div>
                    </div>
                  </div>

                  <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900/40 overflow-hidden">
                    <div className="flex flex-col gap-3 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 border-b border-amber-200 dark:border-amber-900/40 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">5.4.2.a. Issues Summary <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-300">(Summary — auto)</span></h3>
                        <p className="text-xs text-muted-foreground">Severity-wise counts and value at risk computed from observations entered below.</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={addObservationRow}><Plus size={15} /> Add Observation</Button>
                    </div>
                    {/* Desktop Issues Summary table */}
                    <div className="overflow-x-auto border-b hidden sm:block">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Severity</th>
                            <th className="px-4 py-3 text-left font-medium">Total Issues</th>
                            <th className="px-4 py-3 text-left font-medium">Open Issues</th>
                            <th className="px-4 py-3 text-left font-medium">Closed Issues</th>
                            <th className="px-4 py-3 text-left font-medium">Value at Risk</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {issueSummaryRows.map(row => (
                            <tr key={row.severity}>
                              <td className="px-4 py-3 font-medium">{row.severity}</td>
                              <td className="px-4 py-3">{row.total}</td>
                              <td className="px-4 py-3">{row.open}</td>
                              <td className="px-4 py-3">{row.closed}</td>
                              <td className="px-4 py-3">₹{row.valueAtRisk.toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Issues Summary cards */}
                    <div className="sm:hidden divide-y border-b">
                      {issueSummaryRows.map(row => (
                        <div key={row.severity} className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Severity</span>
                            <span className="text-sm font-medium">{row.severity}</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Total</p>
                              <p className="text-sm font-medium">{row.total}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Open</p>
                              <p className="text-sm font-medium">{row.open}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Closed</p>
                              <p className="text-sm font-medium">{row.closed}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Value at Risk</span>
                            <span className="text-sm font-medium">₹{row.valueAtRisk.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-muted/20 px-4 py-3 border-b">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Issue-wise editable details</h4>
                    </div>
                    {/* Desktop Issue-wise details table */}
                    <div className="overflow-x-auto hidden sm:block">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/30 text-muted-foreground">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium">Issue ID</th>
                            <th className="px-4 py-3 text-left font-medium">Category</th>
                            <th className="px-4 py-3 text-left font-medium">Observation</th>
                            <th className="px-4 py-3 text-left font-medium">Severity</th>
                            <th className="px-4 py-3 text-left font-medium">Risk</th>
                            <th className="px-4 py-3 text-left font-medium">Department</th>
                            <th className="px-4 py-3 text-left font-medium">Value at Risk</th>
                            <th className="px-4 py-3 text-left font-medium">Status</th>
                            <th className="px-4 py-3 text-left font-medium">Closure Comment (Auditee)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {editableObservations.map((observation, index) => (
                            <tr key={`${observation.issueId}-${index}`}>
                              <td className="px-4 py-3 min-w-28">
                                <Link
                                  to={`/observation/${observation.issueId}`}
                                  className="font-mono text-sm text-primary hover:underline"
                                  title="Open observation detail"
                                >
                                  {observation.issueId}
                                </Link>
                              </td>
                              <td className="px-4 py-3 min-w-44">
                                <Select value={observation.issueCategory} onValueChange={v => updateObservationRow(index, "issueCategory", v)}>
                                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                  <SelectContent>{ISSUE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3 min-w-72"><Textarea value={observation.observation} rows={2} onChange={e => updateObservationRow(index, "observation", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-36"><Select value={observation.issueSeverity} onValueChange={value => updateObservationRow(index, "issueSeverity", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select></td>
                              <td className="px-4 py-3 min-w-56">
                                <Select value={observation.riskClassification} onValueChange={v => updateObservationRow(index, "riskClassification", v)}>
                                  <SelectTrigger><SelectValue placeholder="Select risk" /></SelectTrigger>
                                  <SelectContent>{RISK_CLASSIFICATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3 min-w-40">
                                <Select value={observation.department} onValueChange={v => updateObservationRow(index, "department", v)}>
                                  <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                                  <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3 min-w-36"><Input type="number" min="0" value={observation.valueAtRisk} onChange={e => updateObservationRow(index, "valueAtRisk", e.target.value)} /></td>
                              <td className="px-4 py-3 min-w-36"><Select value={observation.issueStatus} onValueChange={value => updateObservationRow(index, "issueStatus", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OBSERVATION_STATUSES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select></td>
                              <td className="px-4 py-3 min-w-80 align-top">
                                <Textarea
                                  rows={2}
                                  placeholder={user?.role === "auditee" ? (observation.issueStatus === "Pending" || observation.issueStatus === "Rejected" || observation.issueStatus === "Reopened" ? "Enter closure comment for auditor review..." : "Closure already submitted") : "Auditee to provide closure comment"}
                                  disabled={user?.role !== "auditee" || (observation.issueStatus !== "Pending" && observation.issueStatus !== "Rejected" && observation.issueStatus !== "Reopened")}
                                  value={observation.closureComment}
                                  onChange={e => updateObservationRow(index, "closureComment", e.target.value)}
                                  className={observation.closureComment ? "border-success/40 bg-success/5" : ""}
                                />
                                {renderClosureActions(observation, index)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile Issue-wise details cards */}
                    <div className="sm:hidden divide-y">
                      {editableObservations.map((observation, index) => (
                        <div key={`${observation.issueId}-${index}`} className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Issue ID</p>
                              <Link
                                to={`/observation/${observation.issueId}`}
                                className="font-mono text-sm text-primary hover:underline"
                              >
                                {observation.issueId}
                              </Link>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Category</p>
                              <Select value={observation.issueCategory} onValueChange={v => updateObservationRow(index, "issueCategory", v)}>
                                <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                                <SelectContent>{ISSUE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Observation</p>
                            <Textarea value={observation.observation} rows={2} onChange={e => updateObservationRow(index, "observation", e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Severity</p>
                              <Select value={observation.issueSeverity} onValueChange={value => updateObservationRow(index, "issueSeverity", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Critical">Critical</SelectItem></SelectContent></Select>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Status</p>
                              <Select value={observation.issueStatus} onValueChange={value => updateObservationRow(index, "issueStatus", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OBSERVATION_STATUSES.map(s => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent></Select>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Risk Classification</p>
                            <Select value={observation.riskClassification} onValueChange={v => updateObservationRow(index, "riskClassification", v)}>
                              <SelectTrigger><SelectValue placeholder="Select risk" /></SelectTrigger>
                              <SelectContent>{RISK_CLASSIFICATIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Department</p>
                              <Select value={observation.department} onValueChange={v => updateObservationRow(index, "department", v)}>
                                <SelectTrigger><SelectValue placeholder="Dept" /></SelectTrigger>
                                <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Value at Risk</p>
                              <Input type="number" min="0" value={observation.valueAtRisk} onChange={e => updateObservationRow(index, "valueAtRisk", e.target.value)} />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Closure Comment (Auditee)</p>
                            <Textarea
                              rows={2}
                              placeholder={user?.role === "auditee" ? (observation.issueStatus === "Pending" || observation.issueStatus === "Rejected" || observation.issueStatus === "Reopened" ? "Enter closure comment..." : "Closure already submitted") : "Auditee to provide closure comment"}
                              disabled={user?.role !== "auditee" || (observation.issueStatus !== "Pending" && observation.issueStatus !== "Rejected" && observation.issueStatus !== "Reopened")}
                              value={observation.closureComment}
                              onChange={e => updateObservationRow(index, "closureComment", e.target.value)}
                              className={observation.closureComment ? "border-success/40 bg-success/5" : ""}
                            />
                            {renderClosureActions(observation, index)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg border p-4 space-y-1.5"><Label>Prepared by Auditor</Label><Input value={reportData.auditorSignOff} onChange={e => updateReportField("auditorSignOff", e.target.value)} /><p className="text-xs text-muted-foreground">Signature / Date</p></div>
                    <div className="rounded-lg border p-4 space-y-1.5"><Label>Reviewed by Reviewer</Label><Input value={reportData.reviewerSignOff} onChange={e => updateReportField("reviewerSignOff", e.target.value)} /><p className="text-xs text-muted-foreground">Signature / Date</p></div>
                    <div className="rounded-lg border p-4 space-y-1.5"><Label>Published by Admin</Label><Input value={reportData.adminSignOff} onChange={e => updateReportField("adminSignOff", e.target.value)} /><p className="text-xs text-muted-foreground">Signature / Date</p></div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Audit Trail / Change Log</h3>
                      <p className="text-xs text-muted-foreground">Chronological log of all workflow events ({auditTrail.length})</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">Stage: {workflowStage}</Badge>
                  </div>
                  <div className="space-y-3 border-l-2 border-border pl-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-muted-foreground mt-2 -ml-5 ring-4 ring-background" />
                      <div>
                        <p className="text-sm font-medium">Schedule Audit</p>
                        <p className="text-xs text-muted-foreground">Admin - EMP1001</p>
                        <p className="text-xs text-muted-foreground">{audit.scheduleApproveDate} 09:05:15 AM</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 -ml-5 ring-4 ring-background" />
                      <div>
                        <p className="text-sm font-medium">Scheduled Audit → {audit.status === "scheduled" ? "Current" : "Open Audit"}</p>
                        <p className="text-xs text-muted-foreground">{audit.auditorName} - {audit.auditorId}</p>
                        <p className="text-xs text-muted-foreground">{audit.scheduleApproveDate} 09:06:02 AM</p>
                      </div>
                    </div>
                    {auditTrail.slice().reverse().map((entry, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-success mt-2 -ml-5 ring-4 ring-background" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{entry.action}</p>
                            <Badge variant="outline" className="text-[10px] capitalize">{entry.role}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{entry.user}</p>
                          {entry.details && <p className="text-xs text-foreground/80 mt-0.5 italic">{entry.details}</p>}
                          <p className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar actions */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border p-5">
            <h3 className="text-sm font-semibold mb-4">Actions</h3>

            <div className="mb-4">
              <label className="text-sm text-muted-foreground mb-1.5 block">Remarks</label>
              <Textarea
                placeholder="Enter remarks..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                rows={3}
              />
            </div>

            {isScheduled && user?.role === "auditor" && (
              <div className="space-y-2">
                <Button onClick={() => handleAction("Accepted")} className="w-full bg-success hover:bg-success/90 text-success-foreground">
                  <CheckCircle size={16} /> Accept
                </Button>
                <Button onClick={() => handleAction("Rescheduled")} variant="outline" className="w-full">
                  <RotateCcw size={16} /> Request Reschedule
                </Button>
                <Button onClick={() => handleAction("Rejected")} variant="destructive" className="w-full">
                  <XCircle size={16} /> Request Rejection
                </Button>
              </div>
            )}

            {isDeferred && user?.role === "admin" && (
              <div className="space-y-2">
                <Button onClick={() => navigate(`/schedule-audit`)} variant="outline" className="w-full">
                  <RotateCcw size={16} /> Reschedule
                </Button>
                <Button onClick={() => handleAction("Cancelled")} variant="destructive" className="w-full">
                  <XCircle size={16} /> Cancel Audit
                </Button>
              </div>
            )}

            {isOpen && user?.role === "auditor" && (
              <Button onClick={() => handleAction("Submitted")} className="w-full">
                Submit Audit Report
              </Button>
            )}
          </div>

          {isDeferred && audit.deferralReason && (
            <div className="bg-warning/10 rounded-xl border border-warning/30 p-5">
              <h3 className="text-sm font-semibold mb-2 text-warning">Deferral Reason</h3>
              <p className="text-sm text-muted-foreground">{audit.deferralReason}</p>
            </div>
          )}
        </div>
      </div>
      <Dialog open={rejectDialog.open} onOpenChange={open => setRejectDialog(s => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Closure</DialogTitle>
            <DialogDescription>Provide feedback for the auditee. The observation will be reopened for re-submission.</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder="Explain why the closure is rejected..."
            value={rejectDialog.feedback}
            onChange={e => setRejectDialog(s => ({ ...s, feedback: e.target.value }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, index: null, feedback: "" })}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={reopenDialog.open} onOpenChange={open => setReopenDialog(s => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Observation</DialogTitle>
            <DialogDescription>Provide a reason for reopening. The auditee will be required to submit a fresh closure.</DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            placeholder="Reason for reopening this observation..."
            value={reopenDialog.reason}
            onChange={e => setReopenDialog(s => ({ ...s, reason: e.target.value }))}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenDialog({ open: false, index: null, reason: "" })}>Cancel</Button>
            <Button onClick={confirmReopen}><RotateCcw className="mr-1 h-3 w-3" /> Confirm Reopen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AuditDetailsPage;
