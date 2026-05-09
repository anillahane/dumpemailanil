import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuditSearchBar from "@/components/audit/AuditSearchBar";
import AuditTable from "@/components/audit/AuditTable";
import { MOCK_AUDITS } from "@/data/mockData";

const OpenAuditsPage = () => {
  const [filters, setFilters] = useState({ branchName: "", auditType: "", startDate: "", endDate: "" });

  const audits = useMemo(() => {
    return MOCK_AUDITS.filter(a => {
      if (a.status !== "open") return false;
      if (filters.branchName && a.branchName !== filters.branchName) return false;
      if (filters.auditType && a.auditType !== filters.auditType) return false;
      return true;
    });
  }, [filters]);

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
