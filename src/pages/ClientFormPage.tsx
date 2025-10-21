import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

// Initial State
const initialClientState = {
  nome: '',
  cnpj: '',
  endereco: '',
  telefone: '',
  email: '',
};

type Client = typeof initialClientState;

const ClientFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [client, setClient] = useState<Client>(initialClientState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isEditing && id) {
      fetchClient();
    } else {
      setLoading(false);
    }
  }, [id, isEditing]);

  const fetchClient = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }

    const { data, error } = await supabase
      .from('tbl_clientes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Filtro de segurança
      .single();

    if (error) {
      showError('Erro ao carregar empregador: ' + error.message);
      console.error('Error fetching client:', error);
      navigate('/clients');
    } else {
      setClient({
        ...initialClientState,
        ...data,
        // Ensure string fields are not null
        cnpj: data.cnpj || '',
        endereco: data.endereco || '',
        telefone: data.telefone || '',
        email: data.email || '',
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showError('Usuário não autenticado.');

    if (!client.nome) {
      return showError('O nome do empregador é obrigatório.');
    }

    setLoading(true);

    const clientData = {
      ...client,
      user_id: user.id,
      // Convert empty strings to null for optional DB fields
      cnpj: client.cnpj || null,
      endereco: client.endereco || null,
      telefone: client.telefone || null,
      email: client.email || null,
    };

    let response;
    if (isEditing) {
      response = await supabase.from('tbl_clientes').update(clientData).eq('id', id).select();
    } else {
      response = await supabase.from('tbl_clientes').insert(clientData).select();
    }

    if (response.error) {
      showError('Erro ao salvar empregador: ' + response.error.message);
      console.error('Error saving client:', response.error);
    } else {
      showSuccess(`Empregador ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/clients');
    }
    setLoading(false);
  };

  if (loading) {
    return <MainLayout><div className="container text-center py-8 text-gray-400"><Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" /> Carregando...</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container w-full py-8">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">
          {isEditing ? 'Editar Empregador' : 'Novo Empregador'}
        </h1>
        <Card className="max-w-2xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Dados do Empregador</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-gray-300">Nome/Razão Social</Label>
                <Input id="nome" name="nome" value={client.nome} onChange={handleChange} required className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj" className="text-gray-300">CNPJ/CPF</Label>
                <Input id="cnpj" name="cnpj" value={client.cnpj} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input id="email" name="email" type="email" value={client.email} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-gray-300">Telefone</Label>
                <Input id="telefone" name="telefone" value={client.telefone} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco" className="text-gray-300">Endereço</Label>
                <Input id="endereco" name="endereco" value={client.endereco} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? 'Atualizar Empregador' : 'Criar Empregador')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ClientFormPage;