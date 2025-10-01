import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ClientListPage from "./pages/ClientListPage"; // Importar a nova página
import ClientFormPage from "./pages/ClientFormPage";
import CalculationListPage from "./pages/CalculationListPage"; // Importar a nova página
import CalculationFormPage from "./pages/CalculationFormPage";
import CalculationResultPage from "./pages/CalculationResultPage";
import SindicatoListPage from "./pages/SindicatoListPage";
import SindicatoFormPage from "./pages/SindicatoFormPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clients" element={<ClientListPage />} /> {/* Nova rota para listar clientes */}
            <Route path="/clients/new" element={<ClientFormPage />} />
            <Route path="/clients/:id" element={<ClientFormPage />} /> {/* For editing clients */}
            <Route path="/calculations" element={<CalculationListPage />} /> {/* Nova rota para listar cálculos */}
            <Route path="/calculations/new" element={<CalculationFormPage />} />
            <Route path="/calculations/:id" element={<CalculationFormPage />} /> {/* For editing calculations */}
            <Route path="/calculations/:calculationId/result" element={<CalculationResultPage />} />
            <Route path="/sindicatos" element={<SindicatoListPage />} />
            <Route path="/sindicatos/new" element={<SindicatoFormPage />} />
            <Route path="/sindicatos/:id" element={<SindicatoFormPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;