import { useAuth, UserRole } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Shield, ClipboardCheck, Building2, Search } from "lucide-react";

const ROLES: { role: UserRole; label: string; desc: string; icon: typeof Shield }[] = [
  { role: "admin", label: "Audit Admin", desc: "Schedule, manage and oversee all audits", icon: Shield },
  { role: "auditor", label: "Auditor", desc: "Execute audits and submit reports", icon: ClipboardCheck },
  { role: "auditee", label: "Auditee", desc: "Respond to audit observations", icon: Building2 },
  { role: "reviewer", label: "Reviewer", desc: "Review and publish audit reports", icon: Search },
];

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: UserRole) => {
    login(role);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary-foreground/20" />
          <div className="absolute bottom-40 right-10 w-96 h-96 rounded-full bg-primary-foreground/10" />
        </div>
        <div className="relative z-10 px-16 text-primary-foreground">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">VISTAAR</h1>
          <p className="text-xl font-light opacity-90 mb-2">Audit Management System</p>
          <p className="text-sm opacity-70 max-w-md leading-relaxed">
            Streamlined branch audit workflow — from scheduling to closure.
            Comprehensive compliance tracking for Vistaar Financial Services.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <h1 className="text-3xl font-bold text-primary mb-1">VISTAAR</h1>
            <p className="text-muted-foreground">Audit Management System</p>
          </div>

          <h2 className="text-2xl font-semibold mb-2">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Select your role to continue</p>

          <div className="space-y-3">
            {ROLES.map(({ role, label, desc, icon: Icon }) => (
              <button
                key={role}
                onClick={() => handleLogin(role)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-primary hover:shadow-md transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon size={22} />
                </div>
                <div>
                  <p className="font-medium text-card-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-8 text-center">
            Vistaar Financial Services Pvt Ltd © 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
