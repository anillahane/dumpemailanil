import { useMemo, useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuditSearchBar from "@/components/audit/AuditSearchBar";
import AuditTable from "@/components/audit/AuditTable";
import { AuditRecord } from "@/data/mockData";
import { fetchAudits, FullAuditRow } from "@/lib/auditStore";

interface GenericAuditListPageProps {
  title: string;
  status: AuditRecord["status"];
}

const GenericAuditListPage = ({ title, status }: GenericAuditListPageProps) => {
  const [filters, setFilters] = useState({ branchName: "", auditType: "", startDate: "", endDate: "" });
  const [rows, setRows] = useState<FullAuditRow[]>([]);

  useEffect(() => {
    fetchAudits({ status }).then(setRows).catch(() => setRows([]));
  }, [status]);

  const audits = useMemo(() => rows.filter(a =>
    (!filters.branchName || a.branchName === filters.branchName) &&
    (!filters.auditType || a.auditType === filters.auditType)
  ), [rows, filters]);

  const showScore = status === "published";
  const showDaysLeft = status === "draft-operation" || status === "draft-audit" || status === "review";

  return (
    <AppLayout
      title={title}
      breadcrumbs={[{ label: "Dashboard", path: "/dashboard" }, { label: title }]}
    >
      <AuditSearchBar onSearch={setFilters} />
      <AuditTable audits={audits} linkTo="/audit-details" showScore={showScore} showDaysLeft={showDaysLeft} />
    </AppLayout>
  );
};

export default GenericAuditListPage;
