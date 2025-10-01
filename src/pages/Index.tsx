import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MadeWithDyad } from '@/components/made-with-dyad';

const Index = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (session) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-orange-500">Carregando...</h1>
        <p className="text-xl text-gray-400">Redirecionando para a página correta.</p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;