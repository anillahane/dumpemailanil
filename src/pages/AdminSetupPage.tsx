import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save } from "lucide-react";
import {
  BRD_CHECKPOINTS,
  SEVERITY_VALUES,
  replaceBrdCheckpoints,
  type BrdCheckpoint,
} from "@/data/brdCheckpoints";
import {
  PROCESS_OPTIONS, DEPARTMENTS, ISSUE_CATEGORIES, RISK_CLASSIFICATIONS,
  setProcessOptions, setDepartments, setIssueCategories, setRiskClassifications,
} from "@/data/mockData";

const blankCheckpoint = (): BrdCheckpoint => ({
  process: "",
  checkpointCode: "",
  checkpoint: "",
  expectedControl: "",
  defaultEvidence: "",
  defaultSampleSize: 1,
  defaultSeverity: "Low",
  weight: 1,
  mandatory: false,
});

const AdminSetupPage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<BrdCheckpoint[]>(() => BRD_CHECKPOINTS.map(c => ({ ...c })));
  const [processText, setProcessText] = useState(PROCESS_OPTIONS.join("\n"));
  const [deptText, setDeptText] = useState(DEPARTMENTS.join("\n"));
  const [issueText, setIssueText] = useState(ISSUE_CATEGORIES.join("\n"));
  const [riskText, setRiskText] = useState(RISK_CLASSIFICATIONS.join("\n"));

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") {
    return (
      <AppLayout title="Master Data Admin">
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </AppLayout>
    );
  }

  const update = (i: number, field: keyof BrdCheckpoint, value: string | number | boolean) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } as BrdCheckpoint : r));
  };
  const addRow = () => setRows(prev => [...prev, blankCheckpoint()]);
  const deleteRow = (i: number) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const saveCheckpoints = () => {
    const cleaned = rows.filter(r => r.checkpointCode.trim() && r.checkpoint.trim());
    replaceBrdCheckpoints(cleaned);
    toast({ title: "Checkpoint library saved", description: `${cleaned.length} checkpoints stored for this session.` });
  };

  const parseLines = (s: string) => s.split("\n").map(l => l.trim()).filter(Boolean);
  const saveMaster = () => {
    setProcessOptions(parseLines(processText));
    setDepartments(parseLines(deptText));
    setIssueCategories(parseLines(issueText));
    setRiskClassifications(parseLines(riskText));
    toast({ title: "Master data saved", description: "Dropdown options updated for this session." });
  };

  const processOptions = useMemo(() => parseLines(processText), [processText]);

  return (
    <AppLayout title="Master Data Admin">
      <div className="space-y-6">
        <div className="rounded-lg border bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
          Admin-only setup. Changes persist in-memory for the current session and reset on full page reload.
        </div>

        {/* Master dropdowns */}
        <section className="rounded-lg border overflow-hidden">
          <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Master Dropdown Options</h2>
              <p className="text-xs text-muted-foreground">One value per line. Used across audit forms.</p>
            </div>
            <Button size="sm" onClick={saveMaster}><Save size={14} /> Save Master Data</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="space-y-1.5">
              <Label>Process Options</Label>
              <Textarea rows={8} value={processText} onChange={e => setProcessText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Departments</Label>
              <Textarea rows={8} value={deptText} onChange={e => setDeptText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Issue Categories</Label>
              <Textarea rows={8} value={issueText} onChange={e => setIssueText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Risk Classifications</Label>
              <Textarea rows={8} value={riskText} onChange={e => setRiskText(e.target.value)} />
            </div>
          </div>
        </section>

        {/* BRD Checkpoint library */}
        <section className="rounded-lg border overflow-hidden">
          <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-semibold">BRD Checkpoint Library</h2>
              <p className="text-xs text-muted-foreground">Add, edit, or remove checkpoints used to seed every audit.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={addRow}><Plus size={14} /> Add Checkpoint</Button>
              <Button size="sm" onClick={saveCheckpoints}><Save size={14} /> Save Checkpoints</Button>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rows.map((r, i) => (
                <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Code</Label>
                        <Input size={1} className="h-8 text-sm mt-0.5" value={r.checkpointCode} onChange={e => update(i, "checkpointCode", e.target.value)} placeholder="e.g. CP-001" />
                      </div>
                      <div>
                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Process</Label>
                        <Select value={r.process} onValueChange={v => update(i, "process", v)}>
                          <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue placeholder="Select process" /></SelectTrigger>
                          <SelectContent>
                            {processOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            {r.process && !processOptions.includes(r.process) && (
                              <SelectItem value={r.process}>{r.process}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive" onClick={() => deleteRow(i)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div>
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Checkpoint</Label>
                    <Textarea rows={2} className="text-sm mt-0.5 resize-none" value={r.checkpoint} onChange={e => update(i, "checkpoint", e.target.value)} placeholder="Checkpoint description" />
                  </div>

                  <div>
                    <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Expected Control</Label>
                    <Textarea rows={2} className="text-sm mt-0.5 resize-none" value={r.expectedControl} onChange={e => update(i, "expectedControl", e.target.value)} placeholder="Expected control description" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Evidence</Label>
                      <Input className="h-8 text-sm mt-0.5" value={r.defaultEvidence} onChange={e => update(i, "defaultEvidence", e.target.value)} placeholder="e.g. Invoice" />
                    </div>
                    <div>
                      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Sample Size</Label>
                      <Input type="number" min={0} className="h-8 text-sm mt-0.5" value={r.defaultSampleSize} onChange={e => update(i, "defaultSampleSize", Number(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Severity</Label>
                      <Select value={r.defaultSeverity} onValueChange={v => update(i, "defaultSeverity", v as BrdCheckpoint["defaultSeverity"])}>
                        <SelectTrigger className="h-8 text-sm mt-0.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SEVERITY_VALUES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Weight</Label>
                      <Input type="number" min={0} className="h-8 text-sm mt-0.5" value={r.weight} onChange={e => update(i, "weight", Number(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input id={`mandatory-${i}`} type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={r.mandatory} onChange={e => update(i, "mandatory", e.target.checked)} />
                    <Label htmlFor={`mandatory-${i}`} className="text-xs font-medium">Mandatory checkpoint</Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default AdminSetupPage;
