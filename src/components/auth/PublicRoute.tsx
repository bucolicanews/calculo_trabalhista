import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading, isAuthFlow } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">Carregando autenticação...</div>;
  }

  // Se o usuário estiver logado E NÃO estiver em um fluxo de autenticação (isAuthFlow), redireciona.
  // O isAuthFlow é true quando há um token de acesso na URL (recuperação de senha).
  if (user && !isAuthFlow) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se estiver em um fluxo de autenticação (isAuthFlow é true) ou se não estiver logado,
  // renderize o componente filho (AuthPage).
  return <>{children}</>;
};

export default PublicRoute;