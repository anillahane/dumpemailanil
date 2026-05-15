import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardCounts } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  CalendarPlus, CalendarCheck, CalendarX, FolderOpen, FileEdit,
  FilePen, FileSearch, FileCheck, AlertCircle, XCircle, CheckCircle2, TrendingUp,
  ClipboardList, Eye
} from "lucide-react";

const AUDIT_STAGES = [
  { key: "scheduleAudit", label: "Schedule Audit", icon: CalendarPlus, path: "/schedule-audit", color: "bg-stage-schedule" },
  { key: "scheduledAudits", label: "Scheduled Audits", icon: CalendarCheck, path: "/scheduled-audits", color: "bg-stage-schedule" },
  { key: "deferredAudits", label: "Deferred Audits", icon: CalendarX, path: "/deferred-audits", color: "bg-stage-draft" },
  { key: "openAudit", label: "Open Audits", icon: FolderOpen, path: "/open-audits", color: "bg-stage-open" },
  { key: "draftOperation", label: "Draft Operation", icon: FileEdit, path: "/draft-operation", color: "bg-stage-draft" },
  { key: "draftAudit", label: "Draft Audit", icon: FilePen, path: "/draft-audits", color: "bg-stage-draft" },
  { key: "reviewAudits", label: "Review Audits", icon: FileSearch, path: "/review-audits", color: "bg-stage-review" },
  { key: "publishedAudits", label: "Published Audits", icon: FileCheck, path: "/published-audits", color: "bg-stage-published" },
] as const;

const OBSERVATION_STAGES = [
  { key: "assignedObservations", label: "Assigned Observations", icon: AlertCircle, path: "/assigned-observations", color: "bg-stage-observation" },
  { key: "outstandingObservations", label: "Outstanding Observations", icon: XCircle, path: "/outstanding-observations", color: "bg-stage-observation" },
  { key: "closedObservations", label: "Closed Observations", icon: CheckCircle2, path: "/closed-observations", color: "bg-stage-closed" },
] as const;

const ROLE_STAGES: Record<string, string[]> = {
  admin: ["scheduleAudit", "scheduledAudits", "deferredAudits", "openAudit", "draftOperation", "draftAudit", "reviewAudits", "publishedAudits", "assignedObservations", "outstandingObservations", "closedObservations"],
  auditor: ["scheduledAudits", "openAudit", "publishedAudits", "assignedObservations", "outstandingObservations", "closedObservations"],
  auditee: ["draftOperation", "publishedAudits", "assignedObservations", "closedObservations"],
  reviewer: ["scheduledAudits", "deferredAudits", "openAudit", "draftOperation", "draftAudit", "reviewAudits", "publishedAudits", "assignedObservations", "outstandingObservations", "closedObservations"],
};

const StageCard = ({ stage, count, onClick }: { stage: typeof AUDIT_STAGES[number] | typeof OBSERVATION_STAGES[number]; count: number; onClick: () => void }) => {
  const Icon = stage.icon;
  return (
    <button onClick={onClick} className="stage-card text-left group">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${stage.color} flex items-center justify-center text-primary-foreground transition-transform group-hover:scale-110`}>
          <Icon size={20} />
        </div>
        <span className="text-2xl font-bold text-foreground">{count}</span>
      </div>
      <p className="text-sm font-medium text-foreground">{stage.label}</p>
    </button>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const counts = getDashboardCounts();

  if (!user) return null;

  const allowed = ROLE_STAGES[user.role] || [];
  const visibleAudits = AUDIT_STAGES.filter(s => allowed.includes(s.key));
  const visibleObservations = OBSERVATION_STAGES.filter(s => allowed.includes(s.key));

  const auditTotal = visibleAudits.reduce((sum, s) => sum + (counts[s.key as keyof typeof counts] || 0), 0);
  const obsTotal = visibleObservations.reduce((sum, s) => sum + (counts[s.key as keyof typeof counts] || 0), 0);

  return (
    <AppLayout title="Dashboard" breadcrumbs={[{ label: "Dashboard" }]}>
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 mb-6 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Welcome back, {user.name.split(" ")[0]}!</h2>
            <p className="text-sm opacity-85 mt-1">Here's your audit management overview for today.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-primary-foreground/15 rounded-lg px-4 py-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">{auditTotal + obsTotal} Total Items</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="audits" className="w-full">
        <TabsList className="w-full justify-start gap-1 bg-muted/50 p-1 rounded-lg mb-4">
          <TabsTrigger value="audits" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-md">
            <ClipboardList size={16} />
            <span>Audits</span>
            <span className="ml-1 text-xs bg-background/20 rounded-full px-2 py-0.5 font-semibold">{auditTotal}</span>
          </TabsTrigger>
          <TabsTrigger value="observations" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 rounded-md">
            <Eye size={16} />
            <span>Observations</span>
            <span className="ml-1 text-xs bg-background/20 rounded-full px-2 py-0.5 font-semibold">{obsTotal}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audits" className="animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleAudits.map((stage) => (
              <StageCard
                key={stage.key}
                stage={stage}
                count={counts[stage.key as keyof typeof counts] || 0}
                onClick={() => navigate(stage.path)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="observations" className="animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleObservations.map((stage) => (
              <StageCard
                key={stage.key}
                stage={stage}
                count={counts[stage.key as keyof typeof counts] || 0}
                onClick={() => navigate(stage.path)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default DashboardPage;
