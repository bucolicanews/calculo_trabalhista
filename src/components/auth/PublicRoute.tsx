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
  
  // Verifica se a rota atual é a rota de redefinição de senha
  const isResetPasswordRoute = location.pathname === '/reset-password';
  
  // Verifica se há um token de acesso ou tipo de recuperação no hash da URL.
  const hasAuthHash = location.hash.includes('access_token=') || location.hash.includes('type=recovery');

  console.log(`[PublicRoute Check] User Logged In: ${userIsLoggedIn}, Is Auth Flow: ${isAuthFlow}, Has Auth Hash: ${hasAuthHash}, Is Reset Route: ${isResetPasswordRoute}`);

  // Se o usuário estiver logado E NÃO estiver em um fluxo de autenticação (isAuthFlow) 
  // E NÃO houver um hash de autenticação na URL, E NÃO for a rota de reset, redireciona para o dashboard.
  if (userIsLoggedIn && !isAuthFlow && !hasAuthHash && !isResetPasswordRoute) {
    console.log("[PublicRoute Decision] Redirecting to /dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  // Se estiver em um fluxo de autenticação (isAuthFlow ou hasAuthHash) ou se não estiver logado,
  // ou se for a rota de reset, renderiza o componente filho.
  console.log("[PublicRoute Decision] Rendering Public Content.");
  return <>{children}</>;
};

export default PublicRoute;