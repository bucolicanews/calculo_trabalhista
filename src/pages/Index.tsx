import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user, loading } = useAuth(); // Corrigido: usando 'user' em vez de 'session'
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) { // Corrigido: verificando 'user'
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }
  }, [user, loading, navigate]); // Adicionado 'user' às dependências

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">
      Carregando...
    </div>
  );
};

export default Index;