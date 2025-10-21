import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/auth/PrivateRoute';
import PublicRoute from './components/auth/PublicRoute';
import AuthPage from './pages/AuthPage'; // Usando AuthPage para login/registro
import DashboardPage from './pages/DashboardPage';
import CalculationListPage from './pages/CalculationListPage'; // Usando CalculationListPage
import CalculationFormPage from './pages/CalculationFormPage';
import CalculationResultPage from './pages/CalculationResultPage';
import AiPromptTemplateListPage from './pages/AiPromptTemplateListPage'; // Usando AiPromptTemplateListPage
import AiPromptTemplateFormPage from './pages/AiPromptTemplateFormPage';
import ProfilePage from './pages/ProfilePage'; // Placeholder
import SettingsPage from './pages/SettingsPage'; // Placeholder
import NotFound from './pages/NotFound'; // Usando NotFound
import { Toaster } from '@/components/ui/toaster';
import AiTemplateConfigurationGuidePage from './pages/AiTemplateConfigurationGuidePage';
import ClientListPage from './pages/ClientListPage';
import ClientFormPage from './pages/ClientFormPage';
import SindicatoListPage from './pages/SindicatoListPage';
import SindicatoFormPage from './pages/SindicatoFormPage';
import WebhookConfigPage from './pages/WebhookConfigPage';
import Info from './pages/Info';
import UpdatePasswordPage from './pages/UpdatePasswordPage'; // NOVO IMPORT

const App: React.FC = () => {
  useEffect(() => {
    // Any global app initialization can go here
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>

          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><AuthPage /></PublicRoute>} />
          <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} /> {/* Default public route */}
          
          {/* ROTA DE ATUALIZAÇÃO DE SENHA MANUAL */}
          <Route path="/update-password" element={<PublicRoute><UpdatePasswordPage /></PublicRoute>} />

          {/* Private Routes */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/info" element={<PrivateRoute><Info /></PrivateRoute>} />
          
          <Route path="/clients" element={<PrivateRoute><ClientListPage /></PrivateRoute>} />
          <Route path="/clients/new" element={<PrivateRoute><ClientFormPage /></PrivateRoute>} />
          <Route path="/clients/:id" element={<PrivateRoute><ClientFormPage /></PrivateRoute>} /> {/* Rota para editar/visualizar cliente */}

          <Route path="/calculations" element={<PrivateRoute><CalculationListPage /></PrivateRoute>} />
          <Route path="/calculations/new" element={<PrivateRoute><CalculationFormPage /></PrivateRoute>} />
          <Route path="/calculations/:id" element={<PrivateRoute><CalculationFormPage /></PrivateRoute>} /> {/* Rota para editar/visualizar cálculo */}
          <Route path="/calculations/:id/result" element={<PrivateRoute><CalculationResultPage /></PrivateRoute>} />
          
          <Route path="/sindicatos" element={<PrivateRoute><SindicatoListPage /></PrivateRoute>} />
          <Route path="/sindicatos/new" element={<PrivateRoute><SindicatoFormPage /></PrivateRoute>} />
          <Route path="/sindicatos/:id" element={<PrivateRoute><SindicatoFormPage /></PrivateRoute>} /> {/* Rota para editar/visualizar sindicato */}

          <Route path="/webhooks" element={<PrivateRoute><WebhookConfigPage /></PrivateRoute>} />

          <Route path="/ai-templates" element={<PrivateRoute><AiPromptTemplateListPage /></PrivateRoute>} />
          <Route path="/ai-templates/new" element={<PrivateRoute><AiPromptTemplateFormPage /></PrivateRoute>} />
          <Route path="/ai-templates/:id" element={<PrivateRoute><AiPromptTemplateFormPage /></PrivateRoute>} /> {/* Nova rota para visualizar/editar modelo de IA */}
          <Route path="/ai-templates/guide" element={<PrivateRoute><AiTemplateConfigurationGuidePage /></PrivateRoute>} />

          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          

          {/* Catch-all for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
};

export default App;