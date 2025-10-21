import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading, isAuthFlow } = useAuth();
  const location = useLocation(); 

  if (loading) {
    console.log("[PublicRoute Check] Loading: TRUE. Showing loading screen.");
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">Carregando autenticação...</div>;
  }

  const userIsLoggedIn = !!user;
  
  // 🚨 CORREÇÃO FINAL: Se a rota for de reset de senha, sempre permitimos o acesso.
  const isResetPasswordRoute = location.pathname === '/reset-password';
  
  // Verifica se há um hash de autenticação na URL (para login/registro normal)
  const hasAuthHash = location.hash.includes('access_token=') || location.hash.includes('type=recovery');

  console.log(`[PublicRoute Check] User Logged In: ${userIsLoggedIn}, Is Auth Flow: ${isAuthFlow}, Has Auth Hash: ${hasAuthHash}, Is Reset Route: ${isResetPasswordRoute}`);

  // 1. Se for a rota de reset, renderiza o conteúdo público.
  if (isResetPasswordRoute) {
    console.log("[PublicRoute Decision] Rendering Public Content (Reset Password).");
    return <>{children}</>;
  }

  // 2. Se o usuário estiver logado E não estiver em um fluxo de autenticação (login/registro normal), redireciona para o dashboard.
  if (userIsLoggedIn && !isAuthFlow && !hasAuthHash) {
    console.log("[PublicRoute Decision] Redirecting to /dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Caso contrário (não logado, ou em fluxo de login/registro), renderiza o conteúdo público.
  console.log("[PublicRoute Decision] Rendering Public Content (Auth Page).");
  return <>{children}</>;
};

export default PublicRoute;