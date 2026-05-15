import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuditSearchBar from "@/components/audit/AuditSearchBar";
import AuditTable from "@/components/audit/AuditTable";
import { fetchAudits, FullAuditRow } from "@/lib/auditStore";

const ScheduledAuditsPage = () => {
  const [filters, setFilters] = useState({ auditId: "", branchName: "", auditType: "", startDate: "", endDate: "" });
  const [rows, setRows] = useState<FullAuditRow[]>([]);

  useEffect(() => {
    fetchAudits({ status: "scheduled" }).then(setRows).catch(() => setRows([]));
  }, []);

  const audits = useMemo(() => rows.filter(a =>
    (!filters.auditId || a.auditId.toLowerCase().includes(filters.auditId.toLowerCase())) &&
    (!filters.branchName || a.branchName === filters.branchName) &&
    (!filters.auditType || a.auditType === filters.auditType)
  ), [rows, filters]);

  return (
    <AppLayout
      title="Scheduled Audits"
      breadcrumbs={[{ label: "Dashboard", path: "/dashboard" }, { label: "Scheduled Audits" }]}
    >
      <AuditSearchBar onSearch={setFilters} />
      <AuditTable audits={audits} linkTo="/audit-details" />
    </AppLayout>
  );
};

export default ScheduledAuditsPage;
