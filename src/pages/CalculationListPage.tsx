import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Calculator, Send, RefreshCw } from 'lucide-react';
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
  [key: string]: any; // Allow arbitrary properties for webhook payload
}

interface WebhookConfig {
  id: string;
  table_name: string;
  selected_fields: string[];
  webhook_url: string;
}

// Define all available fields, including related ones, for webhook payload construction
const allAvailableFieldsForWebhook: Record<string, Array<{ key: string; label: string; supabasePath: string; isRelation: boolean; relationTable?: string; relationField?: string }>> = {
  tbl_clientes: [
    { key: 'id', label: 'ID', supabasePath: 'id', isRelation: false },
    { key: 'user_id', label: 'ID do Usuário', supabasePath: 'user_id', isRelation: false },
    { key: 'nome', label: 'Nome/Razão Social', supabasePath: 'nome', isRelation: false },
    { key: 'cpf', label: 'CPF', supabasePath: 'cpf', isRelation: false },
    { key: 'cnpj', label: 'CNPJ', supabasePath: 'cnpj', isRelation: false },
    { key: 'tipo_empregador', label: 'Tipo de Empregador', supabasePath: 'tipo_empregador', isRelation: false },
    { key: 'responsavel', label: 'Responsável', supabasePath: 'responsavel', isRelation: false },
    { key: 'cpf_responsavel', label: 'CPF do Responsável', supabasePath: 'cpf_responsavel', isRelation: false },
    { key: 'created_at', label: 'Criado Em', supabasePath: 'created_at', isRelation: false },
  ],
  tbl_calculos: [
    { key: 'id', label: 'ID', supabasePath: 'id', isRelation: false },
    { key: 'cliente_id', label: 'ID do Cliente', supabasePath: 'cliente_id', isRelation: false },
    { key: 'cliente_nome', label: 'Cliente (Nome)', supabasePath: 'tbl_clientes(nome)', isRelation: true, relationTable: 'tbl_clientes', relationField: 'nome' },
    { key: 'sindicato_id', label: 'ID do Sindicato', supabasePath: 'sindicato_id', isRelation: false },
    { key: 'sindicato_nome', label: 'Sindicato (Nome)', supabasePath: 'tbl_sindicatos(nome)', isRelation: true, relationTable: 'tbl_sindicatos', relationField: 'nome' },
    { key: 'nome_funcionario', label: 'Nome do Funcionário', supabasePath: 'nome_funcionario', isRelation: false },
    { key: 'cpf_funcionario', label: 'CPF do Funcionário', supabasePath: 'cpf_funcionario', isRelation: false },
    { key: 'funcao_funcionario', label: 'Função do Funcionário', supabasePath: 'funcao_funcionario', isRelation: false },
    { key: 'inicio_contrato', label: 'Início do Contrato', supabasePath: 'inicio_contrato', isRelation: false },
    { key: 'fim_contrato', label: 'Fim do Contrato', supabasePath: 'fim_contrato', isRelation: false },
    { key: 'tipo_aviso', label: 'Tipo de Aviso', supabasePath: 'tipo_aviso', isRelation: false },
    { key: 'salario_sindicato', label: 'Salário Sindicato', supabasePath: 'salario_sindicato', isRelation: false },
    { key: 'obs_sindicato', label: 'Obs. Sindicato', supabasePath: 'obs_sindicato', isRelation: false },
    { key: 'historia', label: 'História', supabasePath: 'historia', isRelation: false },
    { key: 'ctps_assinada', label: 'CTPS Assinada', supabasePath: 'ctps_assinada', isRelation: false },
    { key: 'media_descontos', label: 'Média Descontos', supabasePath: 'media_descontos', isRelation: false },
    { key: 'media_remuneracoes', label: 'Média Remunerações', supabasePath: 'media_remuneracoes', isRelation: false },
    { key: 'carga_horaria', label: 'Carga Horária', supabasePath: 'carga_horaria', isRelation: false },
    { key: 'created_at', label: 'Criado Em', supabasePath: 'created_at', isRelation: false },
  ],
  tbl_sindicatos: [
    { key: 'id', label: 'ID', supabasePath: 'id', isRelation: false },
    { key: 'nome', label: 'Nome do Sindicato', supabasePath: 'nome', isRelation: false },
    { key: 'data_inicial', label: 'Data Inicial', supabasePath: 'data_inicial', isRelation: false },
    { key: 'data_final', label: 'Data Final', supabasePath: 'data_final', isRelation: false },
    { key: 'mes_convencao', label: 'Mês Convenção', supabasePath: 'mes_convencao', isRelation: false },
    { key: 'url_documento_sindicato', label: 'URL Documento Sindicato', supabasePath: 'url_documento_sindicato', isRelation: false },
    { key: 'created_at', label: 'Criado Em', supabasePath: 'created_at', isRelation: false },
  ],
  tbl_resposta_calculo: [
    { key: 'id', label: 'ID', supabasePath: 'id', isRelation: false },
    { key: 'calculo_id', label: 'ID do Cálculo', supabasePath: 'calculo_id', isRelation: false },
    { key: 'calculo_nome_funcionario', label: 'Cálculo (Nome Funcionário)', supabasePath: 'tbl_calculos(nome_funcionario)', isRelation: true, relationTable: 'tbl_calculos', relationField: 'nome_funcionario' },
    { key: 'resposta_ai', label: 'Resposta AI', supabasePath: 'resposta_ai', isRelation: false },
    { key: 'data_hora', label: 'Data/Hora', supabasePath: 'data_hora', isRelation: false },
    { key: 'created_at', label: 'Criado Em', supabasePath: 'created_at', isRelation: false },
  ],
};


const CalculationListPage = () => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingWebhook, setSendingWebhook] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCalculations();
    }
  }, [user]);

  const fetchCalculations = async () => {
    setLoading(true);
    // For the list display, we only need basic info and client name
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select('id, nome_funcionario, inicio_contrato, fim_contrato, created_at, tbl_clientes(nome)')
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

  const handleSendToWebhook = async (calculationId: string) => {
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }

    setSendingWebhook(calculationId);
    showSuccess('Verificando webhooks e enviando cálculo...');

    try {
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
        // Construct dynamic select string for Supabase
        const selectParts: string[] = [];
        const relationSelects: Set<string> = new Set(); // To store unique relation selects like 'tbl_clientes(nome)'

        // Always include 'id' of the main table for filtering
        selectParts.push('id');

        config.selected_fields.forEach(fieldKey => {
          const fieldDef = allAvailableFieldsForWebhook['tbl_calculos'].find(f => f.key === fieldKey);
          if (fieldDef) {
            if (fieldDef.isRelation) {
              relationSelects.add(fieldDef.supabasePath);
            } else {
              selectParts.push(fieldDef.supabasePath);
            }
          }
        });

        const finalSelectString = [...new Set(selectParts), ...Array.from(relationSelects)].join(', ');

        // Fetch the specific calculation data with the dynamically constructed select
        const { data: specificCalculationData, error: fetchError } = await supabase
          .from('tbl_calculos')
          .select(finalSelectString)
          .eq('id', calculationId)
          .single();

        if (fetchError) {
          showError(`Erro ao buscar dados do cálculo para webhook: ${fetchError.message}`);
          console.error('Error fetching specific calculation data:', fetchError);
          continue; // Try next webhook config
        }

        if (!specificCalculationData) {
          showError('Dados do cálculo não encontrados para o webhook.');
          continue;
        }

        // Construct the payload
        const payload: { [key: string]: any } = {};
        config.selected_fields.forEach(fieldKey => {
          const fieldDef = allAvailableFieldsForWebhook['tbl_calculos'].find(f => f.key === fieldKey);
          if (fieldDef) {
            if (fieldDef.isRelation && fieldDef.relationTable && fieldDef.relationField) {
              // Handle nested data from relations
              const relatedData = (specificCalculationData as any)[fieldDef.relationTable];
              if (relatedData && Array.isArray(relatedData) && relatedData.length > 0) {
                payload[fieldKey] = relatedData[0][fieldDef.relationField];
              } else if (relatedData && !Array.isArray(relatedData)) { // For single object relations
                payload[fieldKey] = relatedData[fieldDef.relationField];
              } else {
                payload[fieldKey] = null; // Or undefined, depending on desired behavior
              }
            } else {
              payload[fieldKey] = (specificCalculationData as any)[fieldDef.key];
            }
          }
        });

        // Send the data to the webhook URL
        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
      setSendingWebhook(null);
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
                      onClick={() => handleSendToWebhook(calculation.id)}
                      disabled={sendingWebhook === calculation.id}
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