import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { showError } from '@/utils/toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthFlow: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthFlow, setIsAuthFlow] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    // Verifica se há um token de acesso ou tipo de recuperação no hash
    const isAuthEventPending = hash.includes('access_token=') || hash.includes('type=recovery');
    
    console.log(`[AuthContext Init] Hash: ${hash}`);
    console.log(`[AuthContext Init] isAuthEventPending: ${isAuthEventPending}`);

    // Define o estado inicial de isAuthFlow com base no hash
    setIsAuthFlow(isAuthEventPending);
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext Event] Event: ${event}, Session exists: ${!!session}`);

        if (event === 'TOKEN_REFRESHED' && !session) {
          showError('Sua sessão expirou. Por favor, faça login novamente.');
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
        
        // AQUI ESTÁ O AJUSTE CRÍTICO:
        // Se o evento for SIGNED_IN, SIGNED_OUT ou INITIAL_SESSION, o fluxo de autenticação terminou.
        // No entanto, se houver um hash na URL, o fluxo AINDA NÃO TERMINOU, pois o componente Auth UI precisa processá-lo.
        // Portanto, só definimos isAuthFlow como false se o hash estiver vazio.
        if (event === 'SIGNED_OUT' || event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (window.location.hash === '') {
                setIsAuthFlow(false);
            }
        }
        
        setLoading(false);
        
        console.log(`[AuthContext State] User is now: ${session?.user ? 'LOGGED IN' : 'NULL'}, Loading: FALSE, isAuthFlow: ${isAuthFlow}`);
      }
    );

    // Fetch initial user session
    supabase.auth.getSession().then(({ data: { session } }) => {
      
      setUser(session?.user || null);
      setLoading(false);
      
      // Garante que isAuthFlow é false após a carga inicial, a menos que haja um hash de recuperação.
      if (!isAuthEventPending) {
          setIsAuthFlow(false);
      }
      console.log(`[AuthContext Initial Session] User is: ${session?.user ? 'LOGGED IN' : 'NULL'}, isAuthFlow: ${isAuthFlow}`);
      
    }).catch((e) => {
      console.error("[AuthContext Initial Session] Error fetching session:", e);
      setUser(null);
      setLoading(false);
      setIsAuthFlow(false);
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
    // Após o logout, o onAuthStateChange deve ser acionado, mas garantimos que o estado local é limpo.
    setUser(null);
    // Redirecionamento deve ser tratado pelo PublicRoute/PrivateRoute
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthFlow, signInWithEmail, signUpWithEmail, signOut }}>
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