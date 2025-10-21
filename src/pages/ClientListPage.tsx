import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface Client {
  id: string;
  nome: string;
  cnpj: string | null;
  created_at: string;
}

const ClientListPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }

    const { data, error } = await supabase
      .from('tbl_clientes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar empregadores: ' + error.message);
      console.error('Error fetching clients:', error);
    } else {
      setClients(data || []);
    }
    setLoading(false);
  };

  const handleDeleteClient = async (id: string, nome: string) => {
    // Verifica se há cálculos associados antes de deletar
    const { count: calculationCount, error: countError } = await supabase
        .from('tbl_calculos')
        .select('id', { count: 'exact' })
        .eq('cliente_id', id);

    if (countError) {
        showError('Erro ao verificar cálculos associados.');
        return;
    }

    if (calculationCount && calculationCount > 0) {
        showError(`Não é possível deletar o empregador "${nome}" pois ele possui ${calculationCount} cálculo(s) associado(s).`);
        return;
    }

    const { error } = await supabase.from('tbl_clientes').delete().eq('id', id);
    if (error) {
      showError('Erro ao deletar empregador: ' + error.message);
    } else {
      showSuccess('Empregador deletado com sucesso!');
      fetchClients();
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500 mb-4 md:mb-0">Empregadores</h1>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto">
            <Link to="/clients/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Empregador
            </Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando empregadores...</p>
        ) : clients.length === 0 ? (
          <p className="text-gray-400">Nenhum empregador cadastrado ainda. Crie um novo para começar!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <Card key={client.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-500 flex items-center">
                    <User className="mr-2 h-5 w-5" /> {client.nome}
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-2">CNPJ/CPF: {client.cnpj || 'Não Informado'}</p>
                  <p className="text-xs text-gray-500 mt-2">Criado em: {format(new Date(client.created_at), 'dd/MM/yyyy')}</p>
                </CardHeader>
                <CardContent className="flex justify-end space-x-2 pt-4">
                  <Button asChild variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                    <Link to={`/clients/${client.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-red-600 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-500">Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente o empregador "{client.nome}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteClient(client.id, client.nome)} className="bg-red-600 hover:bg-red-700 text-white">
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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