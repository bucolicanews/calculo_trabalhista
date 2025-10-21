import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { showError, showSuccess } from '@/utils/toast'; // Importando showSuccess/showError

// Define os tipos de view que o componente Auth pode ter
type AuthView = 'sign_in' | 'sign_up' | 'forgotten_password' | 'update_password' | 'magic_link' | 'verify_otp';

const AuthPage = () => {
  const { loading } = useAuth();
  const [initialView, setInitialView] = useState<AuthView>('sign_in');

  // Removemos toda a lógica de detecção de hash, pois o UpdatePasswordPage fará isso.
  useEffect(() => {
    // Se houver um hash, garantimos que a view padrão é 'sign_in'
    setInitialView('sign_in');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <p className="text-orange-500">Carregando...</p>
      </div>
    );
  }

  // Define a URL de redirecionamento para a rota de login.
  const redirectToUrl = window.location.origin + '/login';
  // Define a URL de redirecionamento para a recuperação de senha (nossa rota manual)
  const recoveryRedirectUrl = window.location.origin + '/reset-password';

  const handleResetPassword = async (email: string) => {
    // 1. Tenta deslogar o usuário atual (se houver) para evitar redirecionamento para o dashboard
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
        console.error("Erro ao tentar deslogar antes do reset:", signOutError);
        // Não é um erro fatal, apenas logamos e continuamos
    }

    // 2. Envia o e-mail de recuperação
    const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: recoveryRedirectUrl }
    );

    if (error) {
        showError('Erro ao enviar link de recuperação: ' + error.message);
    } else {
        showSuccess('Link de redefinição de senha enviado! Verifique seu e-mail.');
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-lg shadow-lg border border-orange-500">
        <h2 className="text-3xl font-bold text-center text-orange-500">Bem-vindo!</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          redirectTo={redirectToUrl} 
          view={initialView}
          // 🚨 CRÍTICO: Passamos a URL de recuperação para o Auth UI
          magicLink={true}
          socialLayout="horizontal"
          localization={{
            variables: {
              forgotten_password: {
                link_text: 'Esqueceu sua senha?',
              },
            },
          }}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#FF4500', // Laranja Vibrante
                  brandAccent: '#FF6347', // Laranja mais claro para destaque
                  inputBackground: '#333333', // Fundo escuro para inputs
                  inputBorder: '#555555', // Borda dos inputs
                  inputBorderHover: '#FF4500',
                  inputBorderFocus: '#FF4500',
                  inputText: '#FFFFFF', // Texto branco nos inputs
                  defaultButtonBackground: '#FF4500',
                  defaultButtonBackgroundHover: '#FF6347',
                  defaultButtonBorder: '#FF4500',
                  defaultButtonText: '#FFFFFF',
                  anchorTextColor: '#FF4500',
                  anchorTextHoverColor: '#FF6347',
                  messageBackground: '#222222',
                  messageText: '#FFFFFF',
                },
                radii: {
                  borderRadiusButton: '0.5rem',
                  inputBorderRadius: '0.5rem',
                },
              },
            },
          }}
          theme="dark"
          // @ts-ignore
          onResetPassword={() => {
            const emailInput = document.getElementById('email') as HTMLInputElement;
            if (emailInput && emailInput.value) {
                handleResetPassword(emailInput.value);
            } else {
                showError("Por favor, insira um email válido.");
            }
          }}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AuthPage;