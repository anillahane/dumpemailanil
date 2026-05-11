import { ReactNode, useState } from "react";
import AppSidebar from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { Bell, ChevronDown, User, Lock, RefreshCw, LogOut, Menu, X, ArrowLeft } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  breadcrumbs?: { label: string; path?: string }[];
}

const AppLayout = ({ children, title, breadcrumbs }: AppLayoutProps) => {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const showBack = location.pathname !== "/" && location.pathname !== "/dashboard";

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - hidden on mobile unless toggled */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <AppSidebar onClose={() => setMobileOpen(false)} />
      </div>

      <main className="lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              {showBack && (
                <button
                  onClick={() => navigate(-1)}
                  aria-label="Go back"
                  className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              )}
              <div>
                {breadcrumbs && (
                  <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
                    {breadcrumbs.map((crumb, i) => (
                      <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-border">/</span>}
                        <span className={i === breadcrumbs.length - 1 ? "text-foreground font-medium" : ""}>
                          {crumb.label}
                        </span>
                      </span>
                    ))}
                  </nav>
                )}
                {title && <h1 className="text-lg lg:text-xl font-semibold text-foreground">{title}</h1>}
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {/* Notification bell */}
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell size={18} className="text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 lg:gap-3 p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-medium leading-tight">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.baseLocation} • {user.empId}</p>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-xs">
                    {user.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <ChevronDown size={14} className={`hidden lg:block text-muted-foreground transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-card border rounded-xl shadow-lg z-20 py-1.5 animate-fade-in">
                      <div className="px-4 py-2.5 border-b">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role} • {user.empId}</p>
                      </div>
                      <div className="py-1">
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                          <User size={15} className="text-muted-foreground" />
                          Profile Settings
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                          <Lock size={15} className="text-muted-foreground" />
                          Change Password
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors">
                          <RefreshCw size={15} className="text-muted-foreground" />
                          Clear Cache
                        </button>
                      </div>
                      <div className="border-t pt-1">
                        <button
                          onClick={() => { logout(); }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 lg:p-8 animate-fade-in">{children}</div>
      </main>
    </div>
  );
};

export default AppLayout;
