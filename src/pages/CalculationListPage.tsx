import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Calculator, Send, RefreshCw } from 'lucide-react'; // Adicionado RefreshCw
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface Calculation {
  id: string;
  nome_funcionario: string;
  inicio_contrato: string;
  fim_contrato: string;
  tbl_clientes: Array<{ nome: string }> | null;
  created_at: string;
  // Adicionar todos os campos que podem ser enviados via webhook
  cliente_id: string;
  sindicato_id: string | null;
  cpf_funcionario: string | null;
  funcao_funcionario: string | null;
  tipo_aviso: string;
  salario_sindicato: number | null;
  obs_sindicato: string | null;
  historia: string | null;
  ctps_assinada: boolean | null;
  media_descontos: number | null;
  media_remuneracoes: number | null;
  carga_horaria: string | null;
}

interface WebhookConfig {
  id: string;
  table_name: string;
  selected_fields: string[];
  webhook_url: string;
}

const CalculationListPage = () => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingWebhook, setSendingWebhook] = useState<string | null>(null); // Para controlar o estado de envio por cálculo

  useEffect(() => {
    if (user) {
      fetchCalculations();
    }
  }, [user]);

  const fetchCalculations = async () => {
    setLoading(true);
    // Selecionar todos os campos para que possam ser filtrados pelos webhooks
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select('*, tbl_clientes(nome)') // Seleciona todos os campos do cálculo e o nome do cliente
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar cálculos: ' + error.message);
      console.error('Error fetching calculations:', error);
    } else {
      const processedCalculations = data?.map(calc => ({
        ...calc,
        tbl_clientes: calc.tbl_clientes ? (Array.isArray(calc.tbl_clientes) ? calc.tbl_clientes : [calc.tbl_clientes]) : null
      })) || [];
      setCalculations(processedCalculations as Calculation[]);
    }
    setLoading(false);
  };

  const handleDeleteCalculation = async (id: string) => {
    const { error } = await supabase
      .from('tbl_calculos')
      .delete()
      .eq('id', id);

    if (error) {
      showError('Erro ao deletar cálculo: ' + error.message);
      console.error('Error deleting calculation:', error);
    } else {
      showSuccess('Cálculo deletado com sucesso!');
      fetchCalculations(); // Refresh the list
    }
  };

  const handleSendToWebhook = async (calculation: Calculation) => {
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }

    setSendingWebhook(calculation.id); // Define o cálculo que está sendo enviado
    showSuccess('Verificando webhooks e enviando cálculo...');

    try {
      // 1. Buscar configurações de webhook para 'tbl_calculos' do usuário
      const { data: webhookConfigs, error: webhookError } = await supabase
        .from('tbl_webhook_configs')
        .select('*')
        .eq('user_id', user.id)
        .eq('table_name', 'tbl_calculos');

      if (webhookError) {
        showError('Erro ao buscar configurações de webhook: ' + webhookError.message);
        console.error('Error fetching webhook configs:', webhookError);
        return;
      }

      if (!webhookConfigs || webhookConfigs.length === 0) {
        showError('Nenhum webhook configurado para cálculos. Configure um na página de Webhooks.');
        return;
      }

      let sentCount = 0;
      for (const config of webhookConfigs) {
        // 2. Filtrar os dados do cálculo com base nos selected_fields
        const payload: { [key: string]: any } = {};
        for (const field of config.selected_fields) {
          if (field in calculation) {
            payload[field] = (calculation as any)[field];
          } else if (field === 'cliente_nome' && calculation.tbl_clientes?.[0]?.nome) {
            payload['cliente_nome'] = calculation.tbl_clientes[0].nome;
          }
        }

        // 3. Enviar os dados para a URL do webhook
        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Adicione headers de autenticação se o webhook exigir (ex: 'Authorization': 'Bearer seu_token')
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error(`Erro ao enviar para webhook ${config.webhook_url}:`, response.status, response.statusText);
          showError(`Falha ao enviar para o webhook: ${config.webhook_url}. Status: ${response.status}`);
        } else {
          sentCount++;
          console.log(`Cálculo enviado com sucesso para webhook: ${config.webhook_url}`);
        }
      }

      if (sentCount > 0) {
        showSuccess(`Cálculo enviado para ${sentCount} webhook(s) com sucesso!`);
      } else {
        showError('Nenhum cálculo foi enviado para os webhooks configurados.');
      }

    } catch (error: any) {
      showError('Erro inesperado ao enviar cálculo para webhook: ' + error.message);
      console.error('Unexpected error sending webhook:', error);
    } finally {
      setSendingWebhook(null); // Reseta o estado de envio
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Meus Cálculos</h1>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link to="/calculations/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Cálculo
            </Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando cálculos...</p>
        ) : calculations.length === 0 ? (
          <p className="text-gray-400">Nenhum cálculo cadastrado ainda. Crie um novo para começar!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calculations.map((calculation) => (
              <Card key={calculation.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-500">{calculation.nome_funcionario}</CardTitle>
                  <p className="text-sm text-gray-400">Cliente: {calculation.tbl_clientes?.[0]?.nome || 'N/A'}</p>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <p>Início Contrato: {format(new Date(calculation.inicio_contrato), 'dd/MM/yyyy')}</p>
                    <p>Fim Contrato: {format(new Date(calculation.fim_contrato), 'dd/MM/yyyy')}</p>
                  </div>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button asChild variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                      <Link to={`/calculations/${calculation.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                      <Link to={`/calculations/${calculation.id}/result`}>
                        <Calculator className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      onClick={() => handleSendToWebhook(calculation)}
                      disabled={sendingWebhook === calculation.id} // Desabilita enquanto envia
                    >
                      {sendingWebhook === calculation.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
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
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o cálculo de "{calculation.nome_funcionario}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteCalculation(calculation.id)} className="bg-red-600 hover:bg-red-700 text-white">
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

export default CalculationListPage;