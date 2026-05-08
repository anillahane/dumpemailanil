import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuditSearchBar from "@/components/audit/AuditSearchBar";
import { MOCK_OBSERVATIONS, ObservationRecord } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileX, AlertTriangle, Clock, CheckCircle2, XCircle } from "lucide-react";

interface ObservationListPageProps {
  title: string;
  filterFn: (o: ObservationRecord) => boolean;
  showDaysLeft?: boolean;
  showCloseAction?: boolean;
}

const SEVERITY_BADGE: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-stage-observation/15 text-stage-observation border-stage-observation/30",
  Medium: "bg-stage-draft/15 text-stage-draft border-stage-draft/30",
  Low: "bg-stage-open/15 text-stage-open border-stage-open/30",
  Intimation: "bg-info/15 text-info border-info/30",
};

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string }> = {
  Pending: { icon: Clock, color: "text-stage-draft" },
  Accept: { icon: CheckCircle2, color: "text-success" },
  Reject: { icon: XCircle, color: "text-destructive" },
  "Sent Back": { icon: AlertTriangle, color: "text-stage-draft" },
  Overdue: { icon: AlertTriangle, color: "text-destructive" },
  Closed: { icon: CheckCircle2, color: "text-stage-closed" },
};

const ObservationListPage = ({ title, filterFn, showDaysLeft = true, showCloseAction }: ObservationListPageProps) => {
  const navigate = useNavigate();
  const observations = useMemo(() => MOCK_OBSERVATIONS.filter(filterFn), [filterFn]);

  // Group by branch for assigned view
  const branchSummary = useMemo(() => {
    const map = new Map<string, {
      branchName: string;
      auditId: string;
      publishedDate: string;
      reported: number;
      closed: number;
      pending: number;
      overdue: number;
    }>();

    observations.forEach(o => {
      const existing = map.get(o.branchName) || {
        branchName: o.branchName,
        auditId: o.auditId,
        publishedDate: o.publishedDate || "28-03-2026",
        reported: 0, closed: 0, pending: 0, overdue: 0,
      };
      existing.reported++;
      if (o.issueStatus === "Closed") existing.closed++;
      else if (o.issueStatus === "Overdue") existing.overdue++;
      else existing.pending++;
      map.set(o.branchName, existing);
    });

    return Array.from(map.values());
  }, [observations]);

  return (
    <AppLayout
      title={title}
      breadcrumbs={[{ label: "Dashboard", path: "/dashboard" }, { label: title }]}
    >
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b">
          <p className="text-xs text-muted-foreground">
            Total <span className="font-medium text-foreground">{observations.length}</span> observations
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold">Issue ID</TableHead>
                <TableHead className="font-semibold">Branch</TableHead>
                <TableHead className="font-semibold">Sub-Process</TableHead>
                <TableHead className="font-semibold">Observation</TableHead>
                <TableHead className="font-semibold">Severity</TableHead>
                <TableHead className="font-semibold">Department</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Value at Risk</TableHead>
                {showDaysLeft && <TableHead className="font-semibold">Days Left</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {observations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showDaysLeft ? 9 : 8} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                        <FileX size={24} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">No observations found</p>
                        <p className="text-xs text-muted-foreground mt-0.5">No observations match this filter</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                observations.map((obs) => {
                  const sevBadge = SEVERITY_BADGE[obs.issueSeverity] || "";
                  const statusCfg = STATUS_CONFIG[obs.issueStatus] || STATUS_CONFIG.Pending;
                  const StatusIcon = statusCfg.icon;
                  return (
                    <TableRow key={obs.issueId} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm font-medium text-primary">{obs.issueId}</TableCell>
                      <TableCell className="text-sm font-medium">{obs.branchName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{obs.subProcess}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{obs.observation}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] font-medium ${sevBadge}`}>
                          {obs.issueSeverity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{obs.department}</TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1.5 text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon size={13} />
                          {obs.issueStatus}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {obs.valueAtRisk > 0 ? `₹${obs.valueAtRisk.toLocaleString("en-IN")}` : "—"}
                      </TableCell>
                      {showDaysLeft && (
                        <TableCell>
                          <span className={`text-sm font-medium ${obs.daysLeft < 0 ? "text-destructive" : obs.daysLeft <= 3 ? "text-stage-draft" : "text-foreground"}`}>
                            {obs.daysLeft}
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
};

export default ObservationListPage;
