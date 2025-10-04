import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface Client {
  id: string;
  nome: string;
  tipo_empregador: string;
  created_at: string;
}

const ClientListPage = () => {
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

  const handleDeleteClient = async (id: string) => {
    const { error } = await supabase
      .from('tbl_clientes')
      .delete()
      .eq('id', id);

    if (error) {
      showError('Erro ao deletar cliente: ' + error.message);
      console.error('Error deleting client:', error);
    } else {
      showSuccess('Cliente deletado com sucesso!');
      fetchClients(); // Refresh the list
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Meus Clientes</h1>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link to="/clients/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Cliente
            </Link>
          </Button>
        </div>

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
                  <div className="flex space-x-2">
                    <Button asChild variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                      <Link to={`/clients/${client.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-red-600 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-500">Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente "{client.nome}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteClient(client.id)} className="bg-red-600 hover:bg-red-700 text-white">
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ClientListPage;