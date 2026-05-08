import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ScheduleAuditPage from "./pages/ScheduleAuditPage";
import ScheduledAuditsPage from "./pages/ScheduledAuditsPage";
import DeferredAuditsPage from "./pages/DeferredAuditsPage";
import OpenAuditsPage from "./pages/OpenAuditsPage";
import AuditDetailsPage from "./pages/AuditDetailsPage";
import GenericAuditListPage from "./pages/GenericAuditListPage";
import AuditViewPage from "./pages/AuditViewPage";
import ObservationListPage from "./pages/ObservationListPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/schedule-audit" element={<ScheduleAuditPage />} />
            <Route path="/scheduled-audits" element={<ScheduledAuditsPage />} />
            <Route path="/deferred-audits" element={<DeferredAuditsPage />} />
            <Route path="/open-audits" element={<OpenAuditsPage />} />
            <Route path="/audit-details/:auditId" element={<AuditDetailsPage />} />
            <Route path="/deferred-audit-details/:auditId" element={<AuditDetailsPage />} />
            <Route path="/open-audit-details/:auditId" element={<AuditDetailsPage />} />
            <Route path="/audit-view" element={<AuditViewPage />} />
            <Route path="/draft-operation" element={<GenericAuditListPage title="Draft Operation" status="draft-operation" />} />
            <Route path="/draft-audits" element={<GenericAuditListPage title="Draft Audits" status="draft-audit" />} />
            <Route path="/review-audits" element={<GenericAuditListPage title="Review Audits" status="review" />} />
            <Route path="/published-audits" element={<GenericAuditListPage title="Published Audits" status="published" />} />
            <Route
              path="/assigned-observations"
              element={
                <ObservationListPage
                  title="Assigned Observations"
                  filterFn={(o) => o.issueStatus !== "Closed"}
                  showDaysLeft
                />
              }
            />
            <Route
              path="/outstanding-observations"
              element={
                <ObservationListPage
                  title="Outstanding Observations"
                  filterFn={(o) => o.issueStatus === "Overdue" || o.issueStatus === "Sent Back"}
                  showDaysLeft
                />
              }
            />
            <Route
              path="/closed-observations"
              element={
                <ObservationListPage
                  title="Closed Observations"
                  filterFn={(o) => o.issueStatus === "Closed"}
                  showDaysLeft={false}
                />
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
