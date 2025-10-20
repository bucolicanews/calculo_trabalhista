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

  // 1. Verifica se há um hash de evento de autenticação na URL.
  // Se houver, o componente Auth precisa ser renderizado para processá-lo.
  const hash = window.location.hash;
  const isAuthEventPending = hash.includes('type=');

  // 2. Se houver um evento de autenticação pendente, renderize o filho (AuthPage)
  // imediatamente, mesmo que o AuthContext já tenha detectado o usuário (user != null).
  if (isAuthEventPending) {
    return <>{children}</>;
  }

  // 3. Se não houver evento pendente E o usuário estiver logado, redirecione para o dashboard.
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Caso contrário (não logado e sem evento pendente), renderize o filho (AuthPage).
  return <>{children}</>;
};

export default PublicRoute;