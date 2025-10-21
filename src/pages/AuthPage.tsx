import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { MadeWithDyad } from '@/components/made-with-dyad';
import { useState, useEffect } from 'react';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

// Define os tipos de view que o componente Auth pode ter
type AuthView = 'sign_in' | 'sign_up' | 'forgotten_password' | 'update_password' | 'magic_link' | 'verify_otp';

const AuthPage = () => {
  const navigate = useNavigate();
  const [initialView] = useState<AuthView>('sign_in');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se o usuário já está logado e redireciona
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard', { replace: true });
      }
      setLoading(false);
    });
    
    // Configura o listener para redirecionar após login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
            navigate('/dashboard', { replace: true });
        }
        // Se for um evento de recuperação, o UpdatePasswordPage lida com isso.
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, [navigate]);


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
          // 1. Deixar somente Magic Link
          providers={[]}
          onlyThirdPartyProviders={false}
          redirectTo={redirectToUrl} 
          view={initialView}
          magicLink={true}
          socialLayout="horizontal"
          // 2. Tradução completa para PT-BR
          localization={{
            variables: {
              sign_in: {
                email_label: 'Seu e-mail',
                password_label: 'Sua senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Digite sua senha',
                button_label: 'Entrar',
                loading_button_label: 'Entrando...',
                social_provider_text: 'Entrar com {{provider}}',
                link_text: '', 
              },
              sign_up: {
                email_label: 'Seu e-mail',
                password_label: 'Crie uma senha',
                email_input_placeholder: 'Digite seu e-mail',
                password_input_placeholder: 'Crie uma senha forte',
                button_label: 'Cadastrar',
                loading_button_label: 'Cadastrando...',
                social_provider_text: 'Cadastrar com {{provider}}',
                link_text: '', 
              },
              forgotten_password: {
                email_label: 'Seu e-mail',
                email_input_placeholder: 'Digite seu e-mail para recuperação',
                button_label: 'Enviar instruções de redefinição',
                loading_button_label: 'Enviando...',
                link_text: '', 
              },
              update_password: {
                password_label: 'Nova senha',
                password_input_placeholder: 'Digite sua nova senha',
                button_label: 'Atualizar senha',
                loading_button_label: 'Atualizando...',
              },
              magic_link: {
                email_input_label: 'Seu e-mail',
                email_input_placeholder: 'Digite seu e-mail para o link mágico',
                button_label: 'Enviar Link Mágico',
                loading_button_label: 'Enviando Link...',
                link_text: 'Entrar com Link Mágico',
              },
              verify_otp: {
                email_input_label: 'Seu e-mail',
                email_input_placeholder: 'Digite seu e-mail',
                phone_input_label: 'Seu telefone',
                phone_input_placeholder: 'Digite seu telefone',
                token_input_label: 'Token',
                token_input_placeholder: 'Digite o token de 6 dígitos',
                button_label: 'Verificar Token',
                loading_button_label: 'Verificando...',
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