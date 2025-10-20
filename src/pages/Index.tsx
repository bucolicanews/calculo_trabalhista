import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      const hash = window.location.hash;
      // Verifica se estamos processando qualquer evento de autenticação (recovery, signup, etc.)
      const isProcessingAuthEvent = hash.includes('type='); 

      if (user && !isProcessingAuthEvent) {
        navigate('/dashboard');
      } else {
        // Redireciona para /login para que o componente Auth possa processar o hash (se houver)
        navigate('/login');
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-orange-500">
      Carregando...
    </div>
  );
};

export default Index;