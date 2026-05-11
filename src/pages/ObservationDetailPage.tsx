import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Send,
  Upload,
  Trash2,
  FileText,
  History,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useObservation, updateObservation } from "@/lib/observationStore";
import { ObservationStatus } from "@/data/mockData";

const STATUS_BADGE: Record<ObservationStatus, string> = {
  Pending: "bg-stage-draft/15 text-stage-draft border-stage-draft/30",
  "Responded by Auditee": "bg-info/15 text-info border-info/30",
  Accepted: "bg-success/15 text-success border-success/30",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  Closed: "bg-stage-closed/15 text-stage-closed border-stage-closed/30",
  Reopened: "bg-stage-observation/15 text-stage-observation border-stage-observation/30",
};

const ObservationDetailPage = () => {
  const { issueId } = useParams();
  const { user } = useAuth();
  const observation = useObservation(issueId ?? "");

  const [closureComment, setClosureComment] = useState("");
  const [pendingFiles, setPendingFiles] = useState<string[]>([]);
  const [rejectDialog, setRejectDialog] = useState({ open: false, feedback: "" });
  const [reopenDialog, setReopenDialog] = useState({ open: false, reason: "" });

  if (!observation) {
    return (
      <AppLayout
        title="Observation Not Found"
        breadcrumbs={[
          { label: "Dashboard", path: "/dashboard" },
          { label: "Observations" },
          { label: issueId ?? "—" },
        ]}
      >
        <p className="text-muted-foreground">No observation found with ID: {issueId}</p>
      </AppLayout>
    );
  }

  const userLabel = user ? `${user.name} (${user.empId})` : "Anonymous";
  const status = observation.issueStatus;
  const isAuditee = user?.role === "auditee";
  const isReviewer = user?.role === "auditor" || user?.role === "reviewer";
  const canReopen = isReviewer || user?.role === "admin";
  const canEditClosure =
    isAuditee && (status === "Pending" || status === "Rejected" || status === "Reopened");

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const names = Array.from(files).map((f) => f.name);
    setPendingFiles((prev) => [...prev, ...names]);
  };

  const submitClosure = () => {
    if (!closureComment.trim() || pendingFiles.length === 0) return;
    const now = new Date().toISOString();
    updateObservation(
      observation.issueId,
      {
        issueStatus: "Responded by Auditee",
        closureComment,
        closureProof: [...(observation.closureProof ?? []), ...pendingFiles],
        closureDate: now,
      },
      { status: "Responded by Auditee", timestamp: now, user: userLabel, comment: closureComment },
    );
    setClosureComment("");
    setPendingFiles([]);
    toast({ title: "Closure submitted", description: `Issue ${observation.issueId} sent for review.` });
  };

  const acceptClosure = () => {
    const now = new Date().toISOString();
    updateObservation(
      observation.issueId,
      {
        issueStatus: "Closed",
        acceptedBy: userLabel,
        acceptedAt: now,
        closureDate: now,
      },
      { status: "Closed", timestamp: now, user: userLabel, comment: "Closure accepted" },
    );
    toast({ title: "Closure accepted", description: `Issue ${observation.issueId} marked Closed.` });
  };

  const confirmReject = () => {
    if (!rejectDialog.feedback.trim()) {
      toast({ title: "Feedback required", variant: "destructive" });
      return;
    }
    const now = new Date().toISOString();
    updateObservation(
      observation.issueId,
      {
        issueStatus: "Rejected",
        auditorFeedback: rejectDialog.feedback,
        reopenCount: (observation.reopenCount ?? 0) + 1,
      },
      { status: "Rejected", timestamp: now, user: userLabel, comment: rejectDialog.feedback },
    );
    toast({ title: "Closure rejected", description: `Issue ${observation.issueId} sent back to auditee.` });
    setRejectDialog({ open: false, feedback: "" });
  };

  const confirmReopen = () => {
    if (!reopenDialog.reason.trim()) {
      toast({ title: "Reason required", variant: "destructive" });
      return;
    }
    const now = new Date().toISOString();
    updateObservation(
      observation.issueId,
      {
        issueStatus: "Reopened",
        reopenedAt: now,
        reopenReason: reopenDialog.reason,
        reopenCount: (observation.reopenCount ?? 0) + 1,
        closureComment: "",
        closureProof: [],
        closureDate: "",
        auditorFeedback: "",
        acceptedBy: "",
        acceptedAt: "",
      },
      { status: "Reopened", timestamp: now, user: userLabel, comment: reopenDialog.reason },
    );
    toast({ title: "Observation reopened", description: `Issue ${observation.issueId} reopened.` });
    setReopenDialog({ open: false, reason: "" });
  };

  const detailRows: [string, string | number][] = [
    ["Issue ID", observation.issueId],
    ["Branch", observation.branchName],
    ["Sub-Process", observation.subProcess],
    ["Category", observation.issueCategory],
    ["Severity", observation.issueSeverity],
    ["Risk Classification", observation.riskClassification],
    ["Department", observation.department],
    [
      "Value at Risk",
      observation.valueAtRisk > 0 ? `₹${observation.valueAtRisk.toLocaleString("en-IN")}` : "—",
    ],
  ];

  return (
    <AppLayout
      title={`Observation ${observation.issueId}`}
      breadcrumbs={[
        { label: "Dashboard", path: "/dashboard" },
        { label: "Observations" },
        { label: observation.issueId },
      ]}
    >
      <div className="space-y-6">
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide">Observation</p>
              <h2 className="text-xl font-bold font-mono text-primary">{observation.issueId}</h2>
            </div>
            <Badge variant="outline" className={`text-xs ${STATUS_BADGE[status]}`}>
              {status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {detailRows.map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-border/50 py-1.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-right">{value}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">Observation</p>
            <p className="text-sm">{observation.observation}</p>
          </div>

          {observation.closureComment && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs uppercase text-muted-foreground tracking-wide mb-1">
                Closure Comment
              </p>
              <p className="text-sm">{observation.closureComment}</p>
            </div>
          )}

          {(observation.closureProof?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground tracking-wide mb-2">
                Attached Proof
              </p>
              <ul className="space-y-1">
                {observation.closureProof!.map((f, i) => (
                  <li
                    key={`${f}-${i}`}
                    className="flex items-center gap-2 rounded border bg-muted/30 px-2 py-1 text-xs"
                  >
                    <FileText className="h-3 w-3" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {observation.auditorFeedback && status === "Rejected" && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-xs font-medium text-destructive mb-1">Auditor feedback</p>
              <p className="text-sm text-muted-foreground">{observation.auditorFeedback}</p>
            </div>
          )}

          {observation.reopenReason && status === "Reopened" && (
            <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
              <p className="text-xs font-medium mb-1">
                Reopen reason{(observation.reopenCount ?? 0) > 0 ? ` (#${observation.reopenCount})` : ""}
              </p>
              <p className="text-sm text-muted-foreground">{observation.reopenReason}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-card rounded-xl border p-6 space-y-4">
          <h3 className="text-sm font-semibold">Actions</h3>

          {canEditClosure && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Closure comment</label>
                <Textarea
                  rows={3}
                  value={closureComment}
                  onChange={(e) => setClosureComment(e.target.value)}
                  placeholder="Describe the closure action and evidence..."
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="proof-upload"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    handleFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <label htmlFor="proof-upload">
                  <Button asChild size="sm" variant="outline">
                    <span className="cursor-pointer">
                      <Upload className="mr-1 h-3 w-3" /> Upload Proof
                    </span>
                  </Button>
                </label>
                <Button
                  size="sm"
                  disabled={!closureComment.trim() || pendingFiles.length === 0}
                  onClick={submitClosure}
                >
                  <Send className="mr-1 h-3 w-3" /> Submit Closure
                </Button>
              </div>
              {pendingFiles.length > 0 && (
                <ul className="space-y-1">
                  {pendingFiles.map((f, i) => (
                    <li
                      key={`${f}-${i}`}
                      className="flex items-center justify-between rounded border bg-muted/30 px-2 py-1 text-xs"
                    >
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" /> {f}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingFiles((p) => p.filter((_, fi) => fi !== i))}
                        className="text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {isReviewer && status === "Responded by Auditee" && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={acceptClosure}>
                <CheckCircle className="mr-1 h-3 w-3" /> Accept
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setRejectDialog({ open: true, feedback: "" })}
              >
                <XCircle className="mr-1 h-3 w-3" /> Reject
              </Button>
            </div>
          )}

          {canReopen && status === "Closed" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReopenDialog({ open: true, reason: "" })}
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Reopen
            </Button>
          )}

          {!canEditClosure &&
            !(isReviewer && status === "Responded by Auditee") &&
            !(canReopen && status === "Closed") && (
              <p className="text-xs text-muted-foreground">
                No actions available for your role at the current status.
              </p>
            )}
        </div>

        {/* Status History */}
        <Accordion type="single" collapsible defaultValue="history" className="bg-card rounded-xl border">
          <AccordionItem value="history" className="border-0">
            <AccordionTrigger className="px-6">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4" /> Status History (
                {observation.statusHistory?.length ?? 0})
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {(observation.statusHistory?.length ?? 0) === 0 ? (
                <p className="text-xs text-muted-foreground">No history yet.</p>
              ) : (
                <ol className="relative ml-2 border-l border-border pl-4 space-y-4">
                  {[...observation.statusHistory!].reverse().map((evt, i) => (
                    <li key={`${evt.timestamp}-${i}`} className="relative">
                      <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary" className="text-[10px]">
                          {evt.status}
                        </Badge>
                        <span className="text-muted-foreground">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium">{evt.user}</span>
                      </div>
                      {evt.comment && (
                        <p className="mt-1 text-xs text-muted-foreground italic">"{evt.comment}"</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div>
          <Link
            to={`/audit-details/${observation.auditId}`}
            className="text-xs text-primary hover:underline"
          >
            ← Back to audit {observation.auditId}
          </Link>
        </div>
      </div>

      <Dialog
        open={rejectDialog.open}
        onOpenChange={(o) => setRejectDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject closure</DialogTitle>
            <DialogDescription>
              Provide feedback for the auditee describing what needs correction.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={rejectDialog.feedback}
            onChange={(e) => setRejectDialog((p) => ({ ...p, feedback: e.target.value }))}
            placeholder="Reason for rejection..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, feedback: "" })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={reopenDialog.open}
        onOpenChange={(o) => setReopenDialog((p) => ({ ...p, open: o }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen observation</DialogTitle>
            <DialogDescription>
              Provide a reason. The observation will be sent back to the auditee.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={4}
            value={reopenDialog.reason}
            onChange={(e) => setReopenDialog((p) => ({ ...p, reason: e.target.value }))}
            placeholder="Reason to reopen..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenDialog({ open: false, reason: "" })}>
              Cancel
            </Button>
            <Button onClick={confirmReopen}>Reopen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ObservationDetailPage;