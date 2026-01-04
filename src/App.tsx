import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Leads from "./pages/Leads";
import Pricing from "./pages/Pricing";
import Confirmed from "./pages/Confirmed";
import Operations from "./pages/Operations";
import Payables from "./pages/Payables";
import Collections from "./pages/Collections";
import Commissions from "./pages/Commissions";
import Database from "./pages/Database";
import ActivityLog from "./pages/ActivityLog";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <ProtectedRoute>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/confirmed" element={<Confirmed />} />
              <Route path="/operations" element={<Operations />} />
              <Route path="/payables" element={<Payables />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/commissions" element={<Commissions />} />
              <Route path="/database" element={<Database />} />
              <Route path="/activity-log" element={<ActivityLog />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ProtectedRoute>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
