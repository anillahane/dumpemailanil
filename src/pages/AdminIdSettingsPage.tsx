import { useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { RotateCcw, Save, Hash } from "lucide-react";
import {
  DEFAULT_ID_CONFIGS,
  IdConfig,
  IdEntity,
  getIdConfigs,
  previewId,
  resetCounter,
  resetIdConfig,
  saveIdConfig,
} from "@/lib/idGenerator";

const AdminIdSettingsPage = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<Record<IdEntity, IdConfig>>(() => getIdConfigs());

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  const update = (entity: IdEntity, patch: Partial<IdConfig>) => {
    setConfigs(prev => ({ ...prev, [entity]: { ...prev[entity], ...patch } }));
  };

  const handleSave = (entity: IdEntity) => {
    saveIdConfig(configs[entity]);
    toast({ title: "Saved", description: `${configs[entity].label} format updated.` });
  };

  const handleResetFormat = (entity: IdEntity) => {
    resetIdConfig(entity);
    setConfigs(getIdConfigs());
    toast({ title: "Reset to default", description: `${DEFAULT_ID_CONFIGS[entity].label} restored.` });
  };

  const handleResetCounter = (entity: IdEntity) => {
    resetCounter(entity);
    setConfigs(getIdConfigs());
    toast({ title: "Counter reset", description: `Next sequence reset to start value.` });
  };

  return (
    <AppLayout
      title="ID Generation Settings"
      breadcrumbs={[{ label: "Dashboard", path: "/dashboard" }, { label: "Admin" }, { label: "ID Settings" }]}
    >
      <div className="bg-card rounded-xl border p-5 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Hash size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold">Auto-generated identifiers</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Configure how Checkpoint, Observation, Issue and Audit IDs are generated across the system.
              Format = <code className="px-1 py-0.5 bg-muted rounded text-xs">PREFIX{" "}<span className="text-muted-foreground">+</span>{" "}SEPARATOR{" "}<span className="text-muted-foreground">+</span>{" "}PADDED-SEQUENCE{" "}<span className="text-muted-foreground">+</span>{" "}OPTIONAL-SUFFIX</code>.
              Counters are persistent and shared by every user on this device.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(configs) as IdEntity[]).map(entity => {
          const cfg = configs[entity];
          return (
            <div key={entity} className="bg-card rounded-xl border p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold">{cfg.label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Entity: {entity}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Next ID</p>
                  <p className="font-mono text-base font-semibold text-primary">{previewId(cfg)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Prefix</Label>
                  <Input value={cfg.prefix} onChange={e => update(entity, { prefix: e.target.value.toUpperCase().slice(0, 6) })} />
                </div>
                <div>
                  <Label className="text-xs">Separator</Label>
                  <Input value={cfg.separator} onChange={e => update(entity, { separator: e.target.value.slice(0, 2) })} />
                </div>
                <div>
                  <Label className="text-xs">Padding (digits)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={cfg.padding}
                    onChange={e => update(entity, { padding: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Start at</Label>
                  <Input
                    type="number"
                    min={0}
                    value={cfg.start}
                    onChange={e => update(entity, { start: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Next sequence</Label>
                  <Input
                    type="number"
                    min={0}
                    value={cfg.next}
                    onChange={e => update(entity, { next: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Suffix</Label>
                  <Select value={cfg.suffix ?? "none"} onValueChange={(v) => update(entity, { suffix: v as IdConfig["suffix"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="year">Year (e.g. 2026)</SelectItem>
                      <SelectItem value="yearmonth">Year-Month (e.g. 202605)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-muted/40 border">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Preview</p>
                <p className="font-mono text-sm">{previewId(cfg)}</p>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button size="sm" onClick={() => handleSave(entity)} className="gap-1.5">
                  <Save size={14} /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleResetCounter(entity)} className="gap-1.5">
                  <RotateCcw size={14} /> Reset counter
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleResetFormat(entity)}>
                  Restore defaults
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default AdminIdSettingsPage;
