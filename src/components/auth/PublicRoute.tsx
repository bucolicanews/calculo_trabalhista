import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading, isAuthFlow } = useAuth();

  if (loading) {
    console.log("[PublicRoute Check] Loading: TRUE. Showing loading screen.");
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">Carregando autenticação...</div>;
  }

  const userIsLoggedIn = !!user;
  
  console.log(`[PublicRoute Check] User Logged In: ${userIsLoggedIn}, Is Auth Flow: ${isAuthFlow}`);

  // Se o usuário estiver logado E NÃO estiver em um fluxo de autenticação (isAuthFlow), redireciona.
  if (userIsLoggedIn && !isAuthFlow) {
    console.log("[PublicRoute Decision] Redirecting to /dashboard.");
    return <Navigate to="/dashboard" replace />;
  }

  // Se estiver em um fluxo de autenticação (isAuthFlow é true) ou se não estiver logado,
  // renderize o componente filho (AuthPage).
  console.log("[PublicRoute Decision] Rendering AuthPage (Public Content).");
  return <>{children}</>;
};

export default PublicRoute;