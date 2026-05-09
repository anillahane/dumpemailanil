import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";
import { BRANCHES, AUDIT_TYPES } from "@/data/mockData";

interface AuditSearchBarProps {
  onSearch: (filters: { branchName: string; auditType: string; startDate: string; endDate: string }) => void;
  showAuditorId?: boolean;
}

const AuditSearchBar = ({ onSearch, showAuditorId }: AuditSearchBarProps) => {
  const [branchName, setBranchName] = useState("");
  const [auditType, setAuditType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSearch = () => {
    onSearch({ branchName, auditType, startDate, endDate });
  };

  const handleReset = () => {
    setBranchName("");
    setAuditType("");
    setStartDate("");
    setEndDate("");
    onSearch({ branchName: "", auditType: "", startDate: "", endDate: "" });
  };

  return (
    <div className="bg-card rounded-xl border p-5 mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Search size={14} className="text-muted-foreground" />
        Search Audit
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Branch Name</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={branchName}
            onChange={e => setBranchName(e.target.value)}
          >
            <option value="">All Branches</option>
            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Audit Type</label>
          <select
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={auditType}
            onChange={e => setAuditType(e.target.value)}
          >
            <option value="">All Types</option>
            {AUDIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Audit Start Date</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Audit End Date</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={handleReset} variant="outline" size="sm">
          <RotateCcw size={14} />
          Reset
        </Button>
        <Button onClick={handleSearch} size="sm">
          <Search size={14} />
          Search
        </Button>
      </div>
    </div>
  );
};

export default AuditSearchBar;
