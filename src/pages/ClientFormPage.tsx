import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';

const employerTypes = ['Empresa', 'Empregador Doméstico', 'Pessoa Física', 'Produtor Rural', 'Outros'];

const ClientFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState({
    nome: '',
    cpf: '',
    cnpj: '',
    tipo_empregador: '',
    responsavel: '',
    cpf_responsavel: '',
  });
  const [loading, setLoading] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchClient();
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
      .eq('user_id', user.id)
      .single();

    if (error) {
      showError('Erro ao carregar cliente: ' + error.message);
      console.error('Error fetching client:', error);
      navigate('/dashboard');
    } else if (data) {
      setClient(data);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setClient((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }
    setLoading(true);

    const clientData = {
      ...client,
      user_id: user.id,
    };

    let response;
    if (isEditing) {
      response = await supabase
        .from('tbl_clientes')
        .update(clientData)
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      response = await supabase
        .from('tbl_clientes')
        .insert(clientData);
    }

    if (response.error) {
      showError('Erro ao salvar cliente: ' + response.error.message);
      console.error('Error saving client:', response.error);
    } else {
      showSuccess(`Cliente ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/dashboard');
    }
    setLoading(false);
  };

  if (loading && isEditing) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando cliente...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">
          {isEditing ? 'Editar Cliente' : 'Novo Cliente'}
        </h1>
        <Card className="max-w-2xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="2xl text-orange-500">Dados do Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="nome" className="text-gray-300">Nome/Razão Social</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={client.nome}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="tipo_empregador" className="text-gray-300">Tipo de Empregador</Label>
                <Select
                  name="tipo_empregador"
                  value={client.tipo_empregador}
                  onValueChange={(value) => handleSelectChange('tipo_empregador', value)}
                  required
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-orange-500">
                    <SelectValue placeholder="Selecione o tipo de empregador" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {employerTypes.map((type) => (
                      <SelectItem key={type} value={type} className="hover:bg-gray-700 focus:bg-gray-700">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cpf" className="text-gray-300">CPF (se Pessoa Física)</Label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={client.cpf}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="cnpj" className="text-gray-300">CNPJ (se Empresa)</Label>
                <Input
                  id="cnpj"
                  name="cnpj"
                  value={client.cnpj}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="responsavel" className="text-gray-300">Nome do Responsável</Label>
                <Input
                  id="responsavel"
                  name="responsavel"
                  value={client.responsavel}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="cpf_responsavel" className="text-gray-300">CPF do Responsável</Label>
                <Input
                  id="cpf_responsavel"
                  name="cpf_responsavel"
                  value={client.cpf_responsavel}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar Cliente' : 'Criar Cliente')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ClientFormPage;