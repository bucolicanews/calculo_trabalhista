import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';

const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  useEffect(() => {
    // Usar onAuthStateChange é a maneira mais confiável de lidar com eventos de autenticação como a recuperação de senha
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[UpdatePasswordPage] Auth Event: ${event}, Session exists: ${!!session}`);
      
      // O evento 'PASSWORD_RECOVERY' é emitido quando o usuário clica no link de redefinição
      if (event === 'PASSWORD_RECOVERY') {
        setSessionValid(true);
      } else if (session) {
        // Se a sessão é válida mas o evento não é de recuperação, redireciona para o dashboard
        navigate('/dashboard', { replace: true });
      } else {
        // Se a sessão não for válida de forma alguma, setamos a permissão como falsa
        setSessionValid(false);
      }
      setLoading(false);
    });

    // Limpa o 'ouvinte' quando o componente é desmontado para evitar vazamentos de memória
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showError('As senhas não coincidem. Por favor, verifique.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      showError('Não foi possível atualizar sua senha. Por favor, tente novamente.');
      console.error('Password update error:', error);
    } else {
      showSuccess('Senha atualizada com sucesso! Redirecionando para o login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    }
    setLoading(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!sessionValid) {
    // Se a sessão não for válida, mostra a mensagem de erro
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 text-center">
        <Card className="w-full max-w-md bg-gray-900 border-orange-500 text-white">
            <CardHeader>
                <CardTitle className="text-2xl text-red-500">Link Inválido ou Expirado</CardTitle>
                <CardDescription className="text-gray-400">Por favor, solicite uma nova recuperação de senha.</CardDescription>
            </CardHeader>
            <CardContent>
                <Link to="/login">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">Voltar para o Login</Button>
                </Link>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <Card className="w-full max-w-md bg-gray-900 border-orange-500 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-orange-500 flex items-center justify-center">
            <Lock className="mr-2 h-6 w-6" /> Criar Nova Senha
          </CardTitle>
          <CardDescription className="text-gray-400">Digite sua nova senha abaixo (mínimo 6 caracteres).</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-gray-300">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-gray-300">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
              />
            </div>
            <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading || !password || !confirmPassword}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Nova Senha
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-400">
            Lembrou sua senha?{' '}
            <Link to="/login" className="underline text-orange-500 hover:text-orange-600">
              Voltar para o login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordPage;