import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

// Define os tipos de view que o componente Auth pode ter
type AuthView = 'sign_in' | 'sign_up' | 'forgotten_password' | 'update_password' | 'magic_link' | 'verify_otp';

const AuthPage = () => {
  const { loading } = useAuth();
  const [initialView, setInitialView] = useState<AuthView>('sign_in');

  // REMOVIDO: useEffect de redirecionamento, pois o PublicRoute já faz isso.
  // Isso evita que o AuthPage tente redirecionar antes de processar o hash.

  useEffect(() => {
    const hash = window.location.hash;
    
    // 1. Se houver um hash, tentamos determinar a view correta
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const type = params.get('type');
      
      if (type === 'recovery') {
        // Se for recuperação de senha, forçamos a view de atualização de senha
        setInitialView('update_password');
      } else if (type === 'signup') {
        // Se for confirmação de cadastro, forçamos a view de verificação de OTP
        setInitialView('verify_otp');
      } else {
        // Se for qualquer outro hash (ex: magiclink), deixamos o componente Auth lidar com ele,
        // mas garantimos que a view inicial não seja 'sign_in' para evitar o redirecionamento.
        setInitialView('sign_in');
      }
    }
    
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <p className="text-orange-500">Carregando...</p>
      </div>
    );
  }

  // Define a URL de redirecionamento de volta para a rota de login.
  const redirectToUrl = window.location.origin + '/login';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-lg shadow-lg border border-orange-500">
        <h2 className="text-3xl font-bold text-center text-orange-500">Bem-vindo!</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
          redirectTo={redirectToUrl} 
          view={initialView} // Força a view inicial baseada no hash
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
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Senha',
                email_input_placeholder: 'Seu email',
                password_input_placeholder: 'Sua senha',
                button_label: 'Entrar',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entrar',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Senha',
                email_input_placeholder: 'Seu email',
                password_input_placeholder: 'Sua senha',
                button_label: 'Cadastrar',
                social_provider_text: 'Cadastrar com {{provider}}',
                link_text: 'Não tem uma conta? Cadastrar',
              },
              forgotten_password: {
                email_label: 'Email',
                email_input_placeholder: 'Seu email',
                button_label: 'Enviar instruções de recuperação',
                link_text: 'Esqueceu sua senha?',
              },
              update_password: {
                password_label: 'Nova Senha',
                password_input_placeholder: 'Sua nova senha',
                button_label: 'Atualizar Senha',
              },
            },
          }}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AuthPage;