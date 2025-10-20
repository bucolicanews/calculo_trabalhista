import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation(); // Usamos useLocation para reagir a mudanças na URL/hash

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">Carregando autenticação...</div>;
  }

  // Verifica se há um hash de evento de autenticação na URL.
  // location.hash é mais confiável dentro do React Router do que window.location.hash
  const hash = location.hash;
  const isAuthEventPending = hash.includes('type=');

  // Se o usuário estiver logado, mas houver um evento de autenticação pendente,
  // permitimos que ele prossiga para o componente filho (AuthPage) para que o
  // componente Auth do Supabase possa processar o hash e mostrar o formulário.
  if (user && !isAuthEventPending) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;