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

  // Verifica se há um hash de recuperação de senha na URL
  const hash = window.location.hash;
  const isRecoveryEvent = hash.includes('type=recovery') || hash.includes('type=signup');

  // Se o usuário estiver logado, mas for um evento de recuperação/confirmação,
  // permitimos que ele prossiga para o componente filho (AuthPage) para que o
  // componente Auth do Supabase possa processar o hash e mostrar o formulário.
  if (user && !isRecoveryEvent) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;