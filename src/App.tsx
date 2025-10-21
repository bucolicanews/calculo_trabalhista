import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CalculationListPage from './pages/CalculationListPage';
import CalculationFormPage from './pages/CalculationFormPage';
import CalculationResultPage from './pages/CalculationResultPage';
import AiPromptTemplateListPage from './pages/AiPromptTemplateListPage';
import AiPromptTemplateFormPage from './pages/AiPromptTemplateFormPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';
import { Toaster } from '@/components/ui/toaster';
import AiTemplateConfigurationGuidePage from './pages/AiTemplateConfigurationGuidePage';
import ClientListPage from './pages/ClientListPage';
import ClientFormPage from './pages/ClientFormPage';
import SindicatoListPage from './pages/SindicatoListPage';
import SindicatoFormPage from './pages/SindicatoFormPage';
import WebhookConfigPage from './pages/WebhookConfigPage';
import Info from './pages/Info';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import AuthPage from './pages/AuthPage';
import MainLayout from './components/layout/MainLayout';
import { supabase } from './integrations/supabase/client';
import { User } from '@supabase/supabase-js';

// Componente de Rota Protegida Simples (Recriado para este contexto)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        setLoading(false);
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">Carregando autenticação...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


const App: React.FC = () => {
  useEffect(() => {
    // Any global app initialization can go here
  }, []);

  return (
    <Router>
        <Routes>

          {/* Rotas Públicas */}
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/" element={<AuthPage />} /> 
          
          {/* ROTA DE ATUALIZAÇÃO DE SENHA MANUAL */}
          <Route path="/reset-password" element={<UpdatePasswordPage />} />

          {/* Rotas Protegidas */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/info" element={<ProtectedRoute><MainLayout><Info /></MainLayout></ProtectedRoute>} />
          
          <Route path="/clients" element={<ProtectedRoute><ClientListPage /></ProtectedRoute>} />
          <Route path="/clients/new" element={<ProtectedRoute><ClientFormPage /></ProtectedRoute>} />
          <Route path="/clients/:id" element={<ProtectedRoute><ClientFormPage /></ProtectedRoute>} />

          <Route path="/calculations" element={<ProtectedRoute><CalculationListPage /></ProtectedRoute>} />
          <Route path="/calculations/new" element={<ProtectedRoute><CalculationFormPage /></ProtectedRoute>} />
          <Route path="/calculations/:id" element={<ProtectedRoute><CalculationFormPage /></ProtectedRoute>} />
          <Route path="/calculations/:id/result" element={<ProtectedRoute><CalculationResultPage /></ProtectedRoute>} />
          
          <Route path="/sindicatos" element={<ProtectedRoute><SindicatoListPage /></ProtectedRoute>} />
          <Route path="/sindicatos/new" element={<ProtectedRoute><SindicatoFormPage /></ProtectedRoute>} />
          <Route path="/sindicatos/:id" element={<ProtectedRoute><SindicatoFormPage /></ProtectedRoute>} />

          <Route path="/webhooks" element={<ProtectedRoute><WebhookConfigPage /></ProtectedRoute>} />

          <Route path="/ai-templates" element={<ProtectedRoute><AiPromptTemplateListPage /></ProtectedRoute>} />
          <Route path="/ai-templates/new" element={<ProtectedRoute><AiPromptTemplateFormPage /></ProtectedRoute>} />
          <Route path="/ai-templates/:id" element={<ProtectedRoute><AiPromptTemplateFormPage /></ProtectedRoute>} />
          <Route path="/ai-templates/guide" element={<ProtectedRoute><AiTemplateConfigurationGuidePage /></ProtectedRoute>} />

          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          

          {/* Catch-all for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
    </Router>
  );
};

export default App;