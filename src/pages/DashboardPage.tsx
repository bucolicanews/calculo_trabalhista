import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, User, Briefcase, Calculator, Landmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError } from '@/utils/toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTotalClients();
    }
  }, [user]);

  const fetchTotalClients = async () => {
    setLoading(true);
    const { count, error } = await supabase
      .from('tbl_clientes')
      .select('id', { count: 'exact' })
      .eq('user_id', user?.id);

    if (error) {
      showError('Erro ao carregar total de clientes: ' + error.message);
      console.error('Error fetching total clients:', error);
    } else {
      setTotalClients(count || 0);
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
              {loading ? (
                <div className="text-2xl font-bold text-gray-400">...</div>
              ) : (
                <div className="text-2xl font-bold">{totalClients}</div>
              )}
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

        <h2 className="text-3xl font-bold text-orange-500 mb-6">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button asChild className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700">
            <Link to="/clients">
              <User className="mr-2 h-4 w-4" /> Ver Todos os Clientes
            </Link>
          </Button>
          <Button asChild className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700">
            <Link to="/calculations">
              <Calculator className="mr-2 h-4 w-4" /> Ver Todos os Cálculos
            </Link>
          </Button>
          <Button asChild className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700">
            <Link to="/sindicatos">
              <Landmark className="mr-2 h-4 w-4" /> Gerenciar Sindicatos
            </Link>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;