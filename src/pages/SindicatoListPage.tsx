import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Sindicato {
  id: string;
  nome: string;
  anexo_dissidio_url: string | null;
  resumo_dissidio: string | null;
  created_at: string;
}

const SindicatoListPage = () => {
  const [sindicatos, setSindicatos] = useState<Sindicato[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSindicatos();
  }, []);

  const fetchSindicatos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_sindicatos')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      showError('Erro ao carregar sindicatos: ' + error.message);
      console.error('Error fetching sindicatos:', error);
    } else {
      setSindicatos(data || []);
    }
    setLoading(false);
  };

  const handleDeleteSindicato = async (id: string) => {
    const { error } = await supabase
      .from('tbl_sindicatos')
      .delete()
      .eq('id', id);

    if (error) {
      showError('Erro ao deletar sindicato: ' + error.message);
      console.error('Error deleting sindicato:', error);
    } else {
      showSuccess('Sindicato deletado com sucesso!');
      fetchSindicatos(); // Refresh the list
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Sindicatos</h1>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link to="/sindicatos/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Sindicato
            </Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando sindicatos...</p>
        ) : sindicatos.length === 0 ? (
          <p className="text-gray-400">Nenhum sindicato cadastrado ainda. Adicione um novo para começar!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sindicatos.map((sindicato) => (
              <Card key={sindicato.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-500">{sindicato.nome}</CardTitle>
                  {sindicato.resumo_dissidio && (
                    <p className="text-sm text-gray-400 line-clamp-2">{sindicato.resumo_dissidio}</p>
                  )}
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button asChild variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                      <Link to={`/sindicatos/${sindicato.id}`}>
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
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o sindicato "{sindicato.nome}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteSindicato(sindicato.id)} className="bg-red-600 hover:bg-red-700 text-white">
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  {sindicato.anexo_dissidio_url && (
                    <a href={sindicato.anexo_dissidio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                      Ver Dissídio
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SindicatoListPage;