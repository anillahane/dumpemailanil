import { useState, useMemo } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuditSearchBar from "@/components/audit/AuditSearchBar";
import AuditTable from "@/components/audit/AuditTable";
import { MOCK_AUDITS } from "@/data/mockData";

const ScheduledAuditsPage = () => {
  const [filters, setFilters] = useState({ branchName: "", auditType: "", startDate: "", endDate: "" });

  const audits = useMemo(() => {
    return MOCK_AUDITS.filter(a => {
      if (a.status !== "scheduled") return false;
      if (filters.branchName && a.branchName !== filters.branchName) return false;
      if (filters.auditType && a.auditType !== filters.auditType) return false;
      return true;
    });
  }, [filters]);

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
