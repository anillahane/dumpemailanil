import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import AuditSearchBar from "@/components/audit/AuditSearchBar";
import AuditTable from "@/components/audit/AuditTable";
import { MOCK_AUDITS, AuditRecord } from "@/data/mockData";

interface GenericAuditListPageProps {
  title: string;
  status: AuditRecord["status"];
}

const GenericAuditListPage = ({ title, status }: GenericAuditListPageProps) => {
  const [filters, setFilters] = useState({ branchName: "", auditType: "", startDate: "", endDate: "" });

  const audits = useMemo(() => {
    return MOCK_AUDITS.filter(a => {
      if (a.status !== status) return false;
      if (filters.branchName && a.branchName !== filters.branchName) return false;
      if (filters.auditType && a.auditType !== filters.auditType) return false;
      return true;
    });
  }, [status, filters]);

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
