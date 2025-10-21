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
    const isAuthEventPending = hash.includes('access_token=') || hash.includes('type=recovery');
    
    console.log(`[AuthContext Init] Hash: ${hash}`);
    console.log(`[AuthContext Init] isAuthEventPending: ${isAuthEventPending}`);

    // 🚨 CORREÇÃO AGRESSIVA: Se houver um hash de recuperação, forçamos o estado de fluxo de autenticação
    // e pulamos a busca inicial de sessão para evitar que o usuário seja considerado logado imediatamente.
    if (isAuthEventPending) {
        setIsAuthFlow(true);
        setLoading(true); // Mantém o loading ativo
        setUser(null); // Força o usuário a ser NULL para evitar redirecionamento do PublicRoute
        console.log("[AuthContext Init] Recovery hash detected. Forcing isAuthFlow=TRUE and user=NULL.");
    } else {
        setIsAuthFlow(false);
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`[AuthContext Event] Event: ${event}, Session exists: ${!!session}`);

        if (event === 'TOKEN_REFRESHED' && !session) {
          showError('Sua sessão expirou. Por favor, faça login novamente.');
          setUser(null);
        } else {
          setUser(session?.user ?? null);
        }
        
        setLoading(false);
        
        // Se for PASSWORD_RECOVERY, garantimos que o fluxo está ativo.
        if (event === 'PASSWORD_RECOVERY') {
            setIsAuthFlow(true);
            console.log(`[AuthContext Event] PASSWORD_RECOVERY detected. Forcing isAuthFlow = TRUE.`);
        } else if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
            // Se for um login/logout normal, o fluxo termina.
            setIsAuthFlow(false);
            console.log(`[AuthContext Event] Auth flow finished. Setting isAuthFlow = FALSE.`);
        }
        
        console.log(`[AuthContext State] User is now: ${session?.user ? 'LOGGED IN' : 'NULL'}, Loading: FALSE, isAuthFlow: ${isAuthFlow}`);
      }
    );

    // Fetch initial user session SOMENTE se não houver um hash de recuperação pendente
    if (!isAuthEventPending) {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
            setLoading(false);
            setIsAuthFlow(false);
            console.log(`[AuthContext Initial Session] User is: ${session?.user ? 'LOGGED IN' : 'NULL'}, isAuthFlow: ${isAuthFlow}`);
        }).catch((e) => {
            console.error("[AuthContext Initial Session] Error fetching session:", e);
            setUser(null);
            setLoading(false);
            setIsAuthFlow(false);
        });
    }


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