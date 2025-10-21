import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading, isAuthFlow } = useAuth();
  const location = useLocation(); // Adicionado para verificar a rota atual

  if (loading) {
    console.log("[PublicRoute Check] Loading: TRUE. Showing loading screen.");
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">Carregando autenticação...</div>;
  }

  const userIsLoggedIn = !!user;
  
  // Verifica se a rota atual é a página de redefinição de senha
  const isPasswordResetPage = location.pathname === '/reset-password';

  console.log(`[PublicRoute Check] User Logged In: ${userIsLoggedIn}, Is Auth Flow: ${isAuthFlow}, Is Reset Page: ${isPasswordResetPage}`);

  // Se o usuário estiver logado E NÃO estiver em um fluxo de autenticação (isAuthFlow) 
  // E NÃO estiver na página de reset de senha, redireciona para o dashboard.
  if (userIsLoggedIn && !isAuthFlow && !isPasswordResetPage) {
    console.log("[PublicRoute Decision] Redirecting to /dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  // Se estiver em um fluxo de autenticação (isAuthFlow é true), ou na página de reset, ou se não estiver logado,
  // renderize o componente filho (AuthPage ou UpdatePasswordForm).
  console.log("[PublicRoute Decision] Rendering AuthPage (Public Content).");
  return <>{children}</>;
};

export default PublicRoute;