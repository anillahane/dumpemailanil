import { useState, useMemo, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuditSearchBar from "@/components/audit/AuditSearchBar";
import AuditTable from "@/components/audit/AuditTable";
import { fetchAudits, FullAuditRow } from "@/lib/auditStore";

const DeferredAuditsPage = () => {
  const [filters, setFilters] = useState({ branchName: "", auditType: "", startDate: "", endDate: "" });
  const [rows, setRows] = useState<FullAuditRow[]>([]);

  useEffect(() => {
    fetchAudits({ status: "deferred" }).then(setRows).catch(() => setRows([]));
  }, []);

  const audits = useMemo(() => rows.filter(a =>
    (!filters.branchName || a.branchName === filters.branchName) &&
    (!filters.auditType || a.auditType === filters.auditType)
  ), [rows, filters]);

  return (
    <AppLayout
      title="Deferred Audits"
      breadcrumbs={[{ label: "Dashboard", path: "/dashboard" }, { label: "Deferred Audits" }]}
    >
      <AuditSearchBar onSearch={setFilters} />
      <AuditTable audits={audits} linkTo="/deferred-audit-details" />
    </AppLayout>
  );
};

export default DeferredAuditsPage;
