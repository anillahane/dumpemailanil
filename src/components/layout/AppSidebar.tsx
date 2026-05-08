import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CalendarPlus, CalendarCheck, CalendarX, FolderOpen, FileEdit,
  FilePen, FileSearch, FileCheck, Eye, AlertCircle, CheckCircle2,
  XCircle, LogOut, LayoutDashboard, X
} from "lucide-react";

interface AppSidebarProps {
  onClose?: () => void;
}

const ADMIN_LINKS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Schedule Audit", path: "/schedule-audit", icon: CalendarPlus },
  { label: "Scheduled Audits", path: "/scheduled-audits", icon: CalendarCheck },
  { label: "Deferred Audits", path: "/deferred-audits", icon: CalendarX },
  { label: "Open Audits", path: "/open-audits", icon: FolderOpen },
  { label: "Draft Operation", path: "/draft-operation", icon: FileEdit },
  { label: "Draft Audits", path: "/draft-audits", icon: FilePen },
  { label: "Review Audits", path: "/review-audits", icon: FileSearch },
  { label: "Published Audits", path: "/published-audits", icon: FileCheck },
  { label: "Audit View", path: "/audit-view", icon: Eye },
  { label: "Assigned Observations", path: "/assigned-observations", icon: AlertCircle },
  { label: "Outstanding Observations", path: "/outstanding-observations", icon: XCircle },
  { label: "Closed Observations", path: "/closed-observations", icon: CheckCircle2 },
];

const AUDITOR_LINKS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Scheduled Audits", path: "/scheduled-audits", icon: CalendarCheck },
  { label: "Open Audits", path: "/open-audits", icon: FolderOpen },
  { label: "Published Audits", path: "/published-audits", icon: FileCheck },
  { label: "Assigned Observations", path: "/assigned-observations", icon: AlertCircle },
  { label: "Outstanding Observations", path: "/outstanding-observations", icon: XCircle },
  { label: "Closed Observations", path: "/closed-observations", icon: CheckCircle2 },
];

const AUDITEE_LINKS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Draft Operation", path: "/draft-operation", icon: FileEdit },
  { label: "Published Audits", path: "/published-audits", icon: FileCheck },
  { label: "Assigned Observations", path: "/assigned-observations", icon: AlertCircle },
  { label: "Closed Observations", path: "/closed-observations", icon: CheckCircle2 },
];

const REVIEWER_LINKS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Scheduled Audits", path: "/scheduled-audits", icon: CalendarCheck },
  { label: "Deferred Audits", path: "/deferred-audits", icon: CalendarX },
  { label: "Open Audits", path: "/open-audits", icon: FolderOpen },
  { label: "Draft Operation", path: "/draft-operation", icon: FileEdit },
  { label: "Draft Audits", path: "/draft-audits", icon: FilePen },
  { label: "Review Audits", path: "/review-audits", icon: FileSearch },
  { label: "Published Audits", path: "/published-audits", icon: FileCheck },
  { label: "Assigned Observations", path: "/assigned-observations", icon: AlertCircle },
  { label: "Outstanding Observations", path: "/outstanding-observations", icon: XCircle },
  { label: "Closed Observations", path: "/closed-observations", icon: CheckCircle2 },
];

const ROLE_LINKS = {
  admin: ADMIN_LINKS,
  auditor: AUDITOR_LINKS,
  auditee: AUDITEE_LINKS,
  reviewer: REVIEWER_LINKS,
};

const AppSidebar = ({ onClose }: AppSidebarProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const links = ROLE_LINKS[user.role];

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose?.();
  };

  return (
    <aside className="h-screen w-64 bg-sidebar flex flex-col">
      <div className="p-5 border-b border-sidebar-border flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-wide">
            VISTAAR
          </h1>
          <p className="text-xs text-sidebar-muted mt-0.5">Audit Management System</p>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-sidebar-accent transition-colors">
          <X size={18} className="text-sidebar-muted" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.path;
          return (
            <button
              key={link.path}
              onClick={() => handleNavigate(link.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all duration-150 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <Icon size={18} className={isActive ? "text-sidebar-primary" : ""} />
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-semibold text-sm">
            {user.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
            <p className="text-xs text-sidebar-muted capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={() => { logout(); navigate("/"); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut size={16} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
