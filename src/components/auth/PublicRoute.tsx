import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">Carregando autenticação...</div>;
  }

  // CRITICAL CHECK: Se houver um token de acesso no hash, estamos no meio de um fluxo de autenticação
  // (recuperação de senha, magic link, etc.). Devemos permitir que o componente AuthPage seja renderizado
  // para que o componente Supabase Auth UI possa processar o token e mostrar a view correta (ex: update_password).
  const hash = window.location.hash;
  const isAuthFlowInProgress = hash.includes('access_token=');

  // Se o usuário estiver logado E NÃO houver um fluxo de autenticação pendente, redireciona.
  if (user && !isAuthFlowInProgress) {
    return <Navigate to="/dashboard" replace />;
  }

  // Se o usuário não estiver logado, ou se houver um fluxo de autenticação pendente,
  // renderize o componente filho (AuthPage).
  return <>{children}</>;
};

export default PublicRoute;