import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BRANCHES, AUDIT_TYPES, MOCK_AUDITORS } from "@/data/mockData";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, Search } from "lucide-react";

const ScheduleAuditPage = () => {
  const [form, setForm] = useState({
    auditType: "", branchName: "", auditStartDate: "", auditEndDate: "",
    auditPeriodFrom: "", auditPeriodTo: "", auditorId: "",
  });
  const [auditorSearch, setAuditorSearch] = useState("");
  const [showAuditorDropdown, setShowAuditorDropdown] = useState(false);

  const filteredAuditors = MOCK_AUDITORS.filter(a =>
    a.name.toLowerCase().includes(auditorSearch.toLowerCase()) ||
    a.empId.toLowerCase().includes(auditorSearch.toLowerCase())
  );

  const handleSchedule = () => {
    if (!form.auditType || !form.branchName || !form.auditStartDate || !form.auditEndDate || !form.auditorId) {
      toast({ title: "Validation Error", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    toast({ title: "Audit Scheduled", description: `Audit scheduled for ${form.branchName} branch successfully.` });
  };

  return (
    <AppLayout
      title="Schedule Audit"
      breadcrumbs={[{ label: "Dashboard", path: "/dashboard" }, { label: "Schedule Audit" }]}
    >
      <div className="max-w-2xl">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <CalendarPlus size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Schedule New Audit</h2>
              <p className="text-sm text-muted-foreground">Fill in details to schedule a branch audit</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Audit Type *</label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={form.auditType}
                onChange={e => setForm({ ...form, auditType: e.target.value })}
              >
                <option value="">Select Audit Type</option>
                {AUDIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Branch Name *</label>
              <select
                className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                value={form.branchName}
                onChange={e => setForm({ ...form, branchName: e.target.value })}
              >
                <option value="">Select Branch</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Audit Start Date *</label>
                <Input type="date" value={form.auditStartDate} onChange={e => setForm({ ...form, auditStartDate: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Audit End Date *</label>
                <Input type="date" value={form.auditEndDate} onChange={e => setForm({ ...form, auditEndDate: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Audit Period From *</label>
                <Input type="date" value={form.auditPeriodFrom} onChange={e => setForm({ ...form, auditPeriodFrom: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Audit Period To *</label>
                <Input type="date" value={form.auditPeriodTo} onChange={e => setForm({ ...form, auditPeriodTo: e.target.value })} />
              </div>
            </div>

            <div className="relative">
              <label className="text-sm font-medium mb-1.5 block">Auditor *</label>
              <div className="relative">
                <Input
                  placeholder="Type Auditor ID or Name"
                  value={auditorSearch}
                  onChange={e => { setAuditorSearch(e.target.value); setShowAuditorDropdown(true); }}
                  onFocus={() => setShowAuditorDropdown(true)}
                />
                <Search size={16} className="absolute right-3 top-3 text-muted-foreground" />
              </div>
              {showAuditorDropdown && filteredAuditors.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredAuditors.map(a => (
                    <button
                      key={a.empId}
                      className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm transition-colors"
                      onClick={() => {
                        setForm({ ...form, auditorId: a.empId });
                        setAuditorSearch(`${a.empId} - ${a.name}`);
                        setShowAuditorDropdown(false);
                      }}
                    >
                      <span className="font-mono text-primary">{a.empId}</span>
                      <span className="text-muted-foreground"> — </span>
                      <span>{a.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button onClick={handleSchedule} className="flex-1">
              <CalendarPlus size={16} />
              Schedule Audit
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ScheduleAuditPage;
