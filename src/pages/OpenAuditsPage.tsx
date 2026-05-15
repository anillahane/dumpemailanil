import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuditSearchBar from "@/components/audit/AuditSearchBar";
import AuditTable from "@/components/audit/AuditTable";
import { fetchAudits, FullAuditRow } from "@/lib/auditStore";

const OpenAuditsPage = () => {
  const [filters, setFilters] = useState({ auditId: "", branchName: "", auditType: "", startDate: "", endDate: "" });
  const [rows, setRows] = useState<FullAuditRow[]>([]);

  useEffect(() => {
    fetchAudits({ status: "open" }).then(setRows).catch(() => setRows([]));
  }, []);

  const audits = useMemo(() => rows.filter(a =>
    (!filters.auditId || a.auditId.toLowerCase().includes(filters.auditId.toLowerCase())) &&
    (!filters.branchName || a.branchName === filters.branchName) &&
    (!filters.auditType || a.auditType === filters.auditType)
  ), [rows, filters]);

  return (
    <AppLayout
      title="Open Audits"
      breadcrumbs={[{ label: "Dashboard", path: "/dashboard" }, { label: "Open Audits" }]}
    >
      <AuditSearchBar onSearch={setFilters} />
      <AuditTable audits={audits} linkTo="/open-audit-details" />
    </AppLayout>
  );
};

export default OpenAuditsPage;
