import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import AuditSearchBar from "@/components/audit/AuditSearchBar";
import AuditTable from "@/components/audit/AuditTable";
import { fetchAudits, FullAuditRow } from "@/lib/auditStore";

const AuditViewPage = () => {
  const [searchParams] = useSearchParams();
  const globalQuery = (searchParams.get("q") || "").trim().toLowerCase();
  const [filters, setFilters] = useState({ auditId: "", branchName: "", auditType: "", startDate: "", endDate: "" });
  const [rows, setRows] = useState<FullAuditRow[]>([]);

  useEffect(() => {
    fetchAudits().then(setRows).catch(() => setRows([]));
  }, []);

  const audits = useMemo(() => rows.filter(a => {
    const matchesFilters =
      (!filters.auditId || a.auditId.toLowerCase().includes(filters.auditId.toLowerCase())) &&
      (!filters.branchName || a.branchName === filters.branchName) &&
      (!filters.auditType || a.auditType === filters.auditType);

    if (!globalQuery) return matchesFilters;

    const haystack = [a.auditId, a.branchName, a.auditType, a.auditorName, a.status]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return matchesFilters && haystack.includes(globalQuery);
  }), [rows, filters, globalQuery]);

  return (
    <AppLayout
      title="Audit View"
      breadcrumbs={[{ label: "Dashboard", path: "/dashboard" }, { label: "Audit View" }]}
    >
      <AuditSearchBar onSearch={setFilters} />
      <AuditTable audits={audits} linkTo="/audit-details" showScore />
    </AppLayout>
  );
};

export default AuditViewPage;
