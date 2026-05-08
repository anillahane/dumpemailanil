import { useState, useMemo } from "react";
import { AuditRecord } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight, FileX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AuditTableProps {
  audits: AuditRecord[];
  linkTo?: string;
  showScore?: boolean;
  showDaysLeft?: boolean;
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-stage-schedule/15 text-stage-schedule border-stage-schedule/30" },
  deferred: { label: "Deferred", className: "bg-stage-draft/15 text-stage-draft border-stage-draft/30" },
  open: { label: "Open", className: "bg-stage-open/15 text-stage-open border-stage-open/30" },
  "draft-operation": { label: "Draft Op.", className: "bg-stage-draft/15 text-stage-draft border-stage-draft/30" },
  "draft-audit": { label: "Draft", className: "bg-stage-draft/15 text-stage-draft border-stage-draft/30" },
  review: { label: "Review", className: "bg-stage-review/15 text-stage-review border-stage-review/30" },
  published: { label: "Published", className: "bg-stage-published/15 text-stage-published border-stage-published/30" },
  assigned: { label: "Assigned", className: "bg-stage-observation/15 text-stage-observation border-stage-observation/30" },
  outstanding: { label: "Outstanding", className: "bg-stage-observation/15 text-stage-observation border-stage-observation/30" },
  closed: { label: "Closed", className: "bg-stage-closed/15 text-stage-closed border-stage-closed/30" },
};

const PAGE_SIZE = 10;

const AuditTable = ({ audits, linkTo = "/audit-details", showScore, showDaysLeft }: AuditTableProps) => {
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey) return audits;
    return [...audits].sort((a, b) => {
      const va = (a as any)[sortKey] ?? "";
      const vb = (b as any)[sortKey] ?? "";
      const cmp = String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [audits, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const SortHeader = ({ label, field }: { label: string; field: string }) => (
    <TableHead className="font-semibold cursor-pointer select-none group" onClick={() => toggleSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </TableHead>
  );

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Results count */}
      <div className="px-5 py-3 border-b flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-medium text-foreground">{paged.length}</span> of{" "}
          <span className="font-medium text-foreground">{sorted.length}</span> results
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <SortHeader label="Audit ID" field="auditId" />
              <SortHeader label="Auditor ID" field="auditorId" />
              <SortHeader label="Audit Type" field="auditType" />
              <SortHeader label="Branch Name" field="branchName" />
              <SortHeader label="Period From" field="auditPeriodFrom" />
              <SortHeader label="Period To" field="auditPeriodTo" />
              <SortHeader label="Start Date" field="auditStartDate" />
              <SortHeader label="End Date" field="auditEndDate" />
              <TableHead className="font-semibold">Status</TableHead>
              {showScore && <TableHead className="font-semibold">Score</TableHead>}
              {showDaysLeft && <TableHead className="font-semibold">Days Left</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showScore ? 10 : showDaysLeft ? 10 : 9} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <FileX size={24} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No audits found</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Try adjusting your search filters</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paged.map((audit) => {
                const badge = STATUS_BADGE[audit.status] || { label: audit.status, className: "" };
                return (
                  <TableRow
                    key={audit.auditId}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate(`${linkTo}/${audit.auditId}`)}
                  >
                    <TableCell className="font-mono text-sm font-medium text-primary">{audit.auditId}</TableCell>
                    <TableCell className="text-sm">{audit.auditorId}</TableCell>
                    <TableCell className="text-sm">{audit.auditType}</TableCell>
                    <TableCell>
                      <span className="text-primary font-medium hover:underline">{audit.branchName}</span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{audit.auditPeriodFrom}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{audit.auditPeriodTo}</TableCell>
                    <TableCell className="text-sm">{audit.auditStartDate}</TableCell>
                    <TableCell className="text-sm">{audit.auditEndDate}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] font-medium ${badge.className}`}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    {showScore && (
                      <TableCell className="text-sm font-medium">
                        {audit.auditScore ? `${audit.auditScore}%` : "—"}
                      </TableCell>
                    )}
                    {showDaysLeft && (
                      <TableCell>
                        <span className={`text-sm font-medium ${(audit.daysLeft ?? 0) <= 1 ? "text-destructive" : "text-foreground"}`}>
                          {audit.daysLeft ?? "—"}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={14} />
              Prev
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page < 3 ? i : page > totalPages - 3 ? totalPages - 5 + i : page - 2 + i;
              if (pageNum < 0 || pageNum >= totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              Next
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditTable;
