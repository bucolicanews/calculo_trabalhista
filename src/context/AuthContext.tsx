import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { showError } from '@/utils/toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>; // Adicionado
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Adicionado para depuração
        console.log(`Auth event: ${event}`, session);

        // Se o token foi atualizado mas a sessão é nula, significa que o refresh token era inválido.
        if (event === 'TOKEN_REFRESHED' && !session) {
          showError('Sua sessão expirou. Por favor, faça login novamente.');
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
        
        setLoading(false);
      }
    );

    // Fetch initial user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    }).catch(() => {
      // Em caso de erro ao buscar a sessão inicial, garante que o usuário seja nulo.
      setUser(null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) throw error;
  };

  const signOut = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) {
      showError('Erro ao fazer logout: ' + error.message);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};