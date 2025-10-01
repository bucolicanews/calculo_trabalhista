import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { PasswordInput } from '@/components/ui/password-input';
import { MadeWithDyad } from '@/components/made-with-dyad';

const AuthPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900 rounded-lg shadow-lg border border-orange-500">
        <h2 className="text-3xl font-bold text-center text-orange-500">Bem-vindo!</h2>
        <Auth
          supabaseClient={supabase}
          providers={[]}
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
                  messageActionText: '#FF4500',
                },
                radii: {
                  borderRadiusButton: '0.5rem',
                  button: '0.5rem',
                  input: '0.5rem',
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
                social_auth_button_text: 'Entrar com {{provider}}',
                link_text: 'Já tem uma conta? Entrar',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Senha',
                email_input_placeholder: 'Seu email',
                password_input_placeholder: 'Sua senha',
                button_label: 'Cadastrar',
                social_auth_button_text: 'Cadastrar com {{provider}}',
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
          // Customizing the password input to use our component
          // This requires a custom component mapping if Auth UI doesn't support it directly
          // For now, we'll rely on the default Auth UI password input, but the custom component is ready if needed.
          // If direct component replacement is needed, it would look something like:
          // components={{
          //   Input: (props) => {
          //     if (props.type === 'password') {
          //       return <PasswordInput {...props} />;
          //     }
          //     return <Input {...props} />;
          //   },
          // }}
        />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AuthPage;