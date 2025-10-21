import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setLoading(true);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      showError('Erro ao carregar perfil: ' + error.message);
    } else if (user) {
      setEmail(user.email || '');
    }
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      showError('Erro ao atualizar perfil: ' + error.message);
      console.error('Profile update error:', error);
    } else {
      showSuccess('Perfil atualizado com sucesso! Verifique seu e-mail para confirmar a mudança.');
    }
    setIsUpdating(false);
  };

  if (loading) {
    return <MainLayout><div className="container text-center py-8 text-gray-400"><Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" /> Carregando perfil...</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container w-full py-8">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">Meu Perfil</h1>
        <Card className="max-w-md mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500 flex items-center">
                <User className="mr-2 h-6 w-6" /> Informações da Conta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              <Button type="submit" disabled={isUpdating} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3">
                {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Atualizar Email'}
              </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-gray-700">
                <h3 className="text-xl font-semibold text-orange-500 mb-4">Alterar Senha</h3>
                <p className="text-gray-400 mb-4">
                    Para alterar sua senha, use a função "Esqueceu sua senha?" na tela de login.
                </p>
                <Button 
                    onClick={async () => {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                            redirectTo: window.location.origin + '/reset-password',
                        });
                        if (error) {
                            showError('Erro ao enviar link de recuperação: ' + error.message);
                        } else {
                            showSuccess('Link de redefinição de senha enviado! Verifique seu e-mail.');
                        }
                    }}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                >
                    Enviar Link de Redefinição
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;