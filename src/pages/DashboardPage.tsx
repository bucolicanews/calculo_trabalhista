import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, User, Briefcase, Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError } from '@/utils/toast';

interface Client {
  id: string;
  nome: string;
  tipo_empregador: string;
  created_at: string;
}

const DashboardPage = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_clientes')
      .select('id, nome, tipo_empregador, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar clientes: ' + error.message);
      console.error('Error fetching clients:', error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-orange-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <User className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-gray-400">Clientes cadastrados</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-orange-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novo Cliente</CardTitle>
              <Briefcase className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Link to="/clients/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cliente
                </Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-orange-500 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Novo Cálculo</CardTitle>
              <Calculator className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Link to="/calculations/new">
                  <PlusCircle className="mr-2 h-4 w-4" /> Iniciar Novo Cálculo
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-3xl font-bold text-orange-500 mb-6">Meus Clientes</h2>
        {loading ? (
          <p className="text-gray-400">Carregando clientes...</p>
        ) : clients.length === 0 ? (
          <p className="text-gray-400">Nenhum cliente cadastrado ainda. Adicione um novo cliente para começar!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card key={client.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-500">{client.nome}</CardTitle>
                  <p className="text-sm text-gray-400">{client.tipo_empregador}</p>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Criado em: {new Date(client.created_at).toLocaleDateString()}</span>
                  <Button asChild variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                    <Link to={`/clients/${client.id}`}>Ver Detalhes</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default DashboardPage;