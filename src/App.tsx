import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ClientListPage from './pages/ClientListPage';
import ClientFormPage from './pages/ClientFormPage';
import CalculationListPage from './pages/CalculationListPage';
import CalculationFormPage from './pages/CalculationFormPage';
import SindicatoListPage from './pages/SindicatoListPage';
import SindicatoFormPage from './pages/SindicatoFormPage';
import WebhookConfigPage from './pages/WebhookConfigPage';
import { Toaster } from './components/ui/toaster';
import Index from './pages/Index'; // Importando a página Index

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">Carregando...</div>;
  }

  return user ? children : <Navigate to="/auth" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Index />} /> {/* Rota principal agora usa o Index */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <ClientListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/clients/new"
            element={
              <PrivateRoute>
                <ClientFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/clients/:id"
            element={
              <PrivateRoute>
                <ClientFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/calculations"
            element={
              <PrivateRoute>
                <CalculationListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/calculations/new"
            element={
              <PrivateRoute>
                <CalculationFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/calculations/:id"
            element={
              <PrivateRoute>
                <CalculationFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/sindicatos"
            element={
              <PrivateRoute>
                <SindicatoListPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/sindicatos/new"
            element={
              <PrivateRoute>
                <SindicatoFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/sindicatos/:id"
            element={
              <PrivateRoute>
                <SindicatoFormPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/webhooks"
            element={
              <PrivateRoute>
                <WebhookConfigPage />
              </PrivateRoute>
            }
          />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;