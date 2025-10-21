import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const UpdatePasswordForm: React.FC = () => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      // Usa a função updatePassword do Supabase.
      // O Supabase usa o token da sessão que foi injetado na URL para identificar o usuário.
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        // Se o token expirou, o erro será capturado aqui.
        throw new Error(error.message);
      }

      showSuccess('Senha atualizada com sucesso! Faça login com sua nova senha.');
      // Limpa o hash da URL e redireciona para a tela de login
      navigate('/login', { replace: true });
      
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      showError('Falha ao atualizar senha. O link pode ter expirado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <Card className="w-full max-w-md bg-gray-900 border-orange-500 text-white">
        <CardHeader>
          <CardTitle className="text-2xl text-orange-500 flex items-center justify-center">
            <Lock className="mr-2 h-6 w-6" /> Definir Nova Senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password" className="text-gray-300">Nova Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? 'Atualizando...' : 'Atualizar Senha'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UpdatePasswordForm;