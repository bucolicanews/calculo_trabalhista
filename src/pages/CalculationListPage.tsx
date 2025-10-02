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

// Define ALL possible fields and their Supabase paths (same as in WebhookConfigPage.tsx)
const allAvailableFieldsDefinition = [
  // tbl_clientes fields
  { key: 'cliente_id', label: 'Cliente (ID)', supabasePath: 'id', mainTable: 'tbl_clientes' },
  { key: 'cliente_user_id', label: 'Cliente (ID do Usuário)', supabasePath: 'user_id', mainTable: 'tbl_clientes' },
  { key: 'cliente_nome', label: 'Cliente (Nome/Razão Social)', supabasePath: 'nome', mainTable: 'tbl_clientes' },
  { key: 'cliente_cpf', label: 'Cliente (CPF)', supabasePath: 'cpf', mainTable: 'tbl_clientes' },
  { key: 'cliente_cnpj', label: 'Cliente (CNPJ)', supabasePath: 'cnpj', mainTable: 'tbl_clientes' },
  { key: 'cliente_tipo_empregador', label: 'Cliente (Tipo de Empregador)', supabasePath: 'tipo_empregador', mainTable: 'tbl_clientes' },
  { key: 'cliente_responsavel', label: 'Cliente (Responsável)', supabasePath: 'responsavel', mainTable: 'tbl_clientes' },
  { key: 'cliente_cpf_responsavel', label: 'Cliente (CPF do Responsável)', supabasePath: 'cpf_responsavel', mainTable: 'tbl_clientes' },
  { key: 'cliente_created_at', label: 'Cliente (Criado Em)', supabasePath: 'created_at', mainTable: 'tbl_clientes' },

  // tbl_sindicatos fields
  { key: 'sindicato_id', label: 'Sindicato (ID)', supabasePath: 'id', mainTable: 'tbl_sindicatos' },
  { key: 'sindicato_nome', label: 'Sindicato (Nome)', supabasePath: 'nome', mainTable: 'tbl_sindicatos' },
  { key: 'sindicato_data_inicial', label: 'Sindicato (Data Inicial)', supabasePath: 'data_inicial', mainTable: 'tbl_sindicatos' },
  { key: 'sindicato_data_final', label: 'Sindicato (Data Final)', supabasePath: 'data_final', mainTable: 'tbl_sindicatos' },
  { key: 'sindicato_mes_convencao', label: 'Sindicato (Mês Convenção)', supabasePath: 'mes_convencao', mainTable: 'tbl_sindicatos' },
  { key: 'sindicato_url_documento_sindicato', label: 'Sindicato (URL Documento)', supabasePath: 'url_documento_sindicato', mainTable: 'tbl_sindicatos' },
  { key: 'sindicato_created_at', label: 'Sindicato (Criado Em)', supabasePath: 'created_at', mainTable: 'tbl_sindicatos' },

  // tbl_dissidios fields (related to tbl_sindicatos)
  { key: 'dissidio_id', label: 'Dissídio (ID)', supabasePath: 'tbl_dissidios(id)', mainTable: 'tbl_sindicatos' },
  { key: 'dissidio_nome_dissidio', label: 'Dissídio (Nome)', supabasePath: 'tbl_dissidios(nome_dissidio)', mainTable: 'tbl_sindicatos' },
  { key: 'dissidio_url_documento', label: 'Dissídio (URL Documento)', supabasePath: 'tbl_dissidios(url_documento)', mainTable: 'tbl_sindicatos' },
  { key: 'dissidio_resumo_dissidio', label: 'Dissídio (Resumo)', supabasePath: 'tbl_dissidios(resumo_dissidio)', mainTable: 'tbl_sindicatos' },
  { key: 'dissidio_data_vigencia_inicial', label: 'Dissídio (Início Vigência)', supabasePath: 'tbl_dissidios(data_vigencia_inicial)', mainTable: 'tbl_sindicatos' },
  { key: 'dissidio_data_vigencia_final', label: 'Dissídio (Fim Vigência)', supabasePath: 'tbl_dissidios(data_vigencia_final)', mainTable: 'tbl_sindicatos' },
  { key: 'dissidio_mes_convencao', label: 'Dissídio (Mês Convenção)', supabasePath: 'tbl_dissidios(mes_convencao)', mainTable: 'tbl_sindicatos' },
  { key: 'dissidio_created_at', label: 'Dissídio (Criado Em)', supabasePath: 'tbl_dissidios(created_at)', mainTable: 'tbl_sindicatos' },

  // tbl_calculos fields
  { key: 'calculo_id', label: 'Cálculo (ID)', supabasePath: 'id', mainTable: 'tbl_calculos' },
  { key: 'calculo_nome_funcionario', label: 'Cálculo (Nome Funcionário)', supabasePath: 'nome_funcionario', mainTable: 'tbl_calculos' },
  { key: 'calculo_cpf_funcionario', label: 'Cálculo (CPF Funcionário)', supabasePath: 'cpf_funcionario', mainTable: 'tbl_calculos' },
  { key: 'calculo_funcao_funcionario', label: 'Cálculo (Função Funcionário)', supabasePath: 'funcao_funcionario', mainTable: 'tbl_calculos' },
  { key: 'calculo_inicio_contrato', label: 'Cálculo (Início Contrato)', supabasePath: 'inicio_contrato', mainTable: 'tbl_calculos' },
  { key: 'calculo_fim_contrato', label: 'Cálculo (Fim Contrato)', supabasePath: 'fim_contrato', mainTable: 'tbl_calculos' },
  { key: 'calculo_tipo_aviso', label: 'Cálculo (Tipo de Aviso)', supabasePath: 'tipo_aviso', mainTable: 'tbl_calculos' },
  { key: 'calculo_salario_sindicato', label: 'Cálculo (Piso Salarial Sindicato)', supabasePath: 'salario_sindicato', mainTable: 'tbl_calculos' },
  { key: 'calculo_obs_sindicato', label: 'Cálculo (Obs. Sindicato)', supabasePath: 'obs_sindicato', mainTable: 'tbl_calculos' },
  { key: 'calculo_historia', label: 'Cálculo (História do Contrato)', supabasePath: 'historia', mainTable: 'tbl_calculos' },
  { key: 'calculo_ctps_assinada', label: 'Cálculo (CTPS Assinada)', supabasePath: 'ctps_assinada', mainTable: 'tbl_calculos' },
  { key: 'calculo_media_descontos', label: 'Cálculo (Média Descontos)', supabasePath: 'media_descontos', mainTable: 'tbl_calculos' },
  { key: 'calculo_media_remuneracoes', label: 'Cálculo (Média Remunerações)', supabasePath: 'media_remuneracoes', mainTable: 'tbl_calculos' },
  { key: 'calculo_carga_horaria', label: 'Cálculo (Carga Horária)', supabasePath: 'carga_horaria', mainTable: 'tbl_calculos' },
  { key: 'calculo_created_at', label: 'Cálculo (Criado Em)', supabasePath: 'created_at', mainTable: 'tbl_calculos' },

  // tbl_resposta_calculo fields
  { key: 'resposta_id', label: 'Resposta Cálculo (ID)', supabasePath: 'id', mainTable: 'tbl_resposta_calculo' },
  { key: 'resposta_calculo_id', label: 'Resposta Cálculo (ID do Cálculo)', supabasePath: 'calculo_id', mainTable: 'tbl_resposta_calculo' },
  { key: 'resposta_ai', label: 'Resposta Cálculo (Resposta AI)', supabasePath: 'resposta_ai', mainTable: 'tbl_resposta_calculo' },
  { key: 'resposta_data_hora', label: 'Resposta Cálculo (Data/Hora)', supabasePath: 'data_hora', mainTable: 'tbl_resposta_calculo' },
  { key: 'resposta_created_at', label: 'Resposta Cálculo (Criado Em)', supabasePath: 'created_at', mainTable: 'tbl_resposta_calculo' },
];

// Helper to extract value from nested Supabase data structure based on a path string
const extractValueFromPath = (data: any, path: string) => {
  // Example path: 'tbl_sindicatos(tbl_dissidios(nome_dissidio))'
  // Example path: 'tbl_clientes(nome)'
  // Example path: 'nome_funcionario'

  const parts = path.match(/(\w+)(?:\((.*)\))?/); // Matches 'table' and 'field(nested_path)'

  if (!parts) { // Direct field
    return data[path];
  }

  const [_, currentKey, nestedPath] = parts;

  let currentData = data[currentKey];

  if (!currentData) return null;

  if (nestedPath) {
    // If currentData is an array, process each item
    if (Array.isArray(currentData)) {
      const results: any[] = [];
      currentData.forEach(item => {
        const nestedValue = extractValueFromPath(item, nestedPath);
        if (nestedValue !== undefined && nestedValue !== null) {
          if (Array.isArray(nestedValue)) { // If nested path also returns an array
            results.push(...nestedValue);
          } else {
            results.push(nestedValue);
          }
        }
      });
      return results.length > 0 ? results : null;
    } else {
      // Single object, recurse
      return extractValueFromPath(currentData, nestedPath);
    }
  } else {
    // No nested path, return the value directly from currentKey
    return currentData;
  }
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
        .eq('table_name', 'tbl_calculos'); // Only fetch webhooks configured for tbl_calculos

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
        const selectParts: Set<string> = new Set(); // Use Set to avoid duplicate select paths

        // Always include 'id' of the main table for filtering
        selectParts.add('id');

        // Map selected field keys to their Supabase paths
        config.selected_fields.forEach(fieldKey => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            // For fields related to tbl_calculos, we need to prepend the relation path
            if (fieldDef.mainTable === 'tbl_clientes') {
              selectParts.add(`tbl_clientes(${fieldDef.supabasePath})`);
            } else if (fieldDef.mainTable === 'tbl_sindicatos') {
              // For sindicato fields, including nested dissidios
              selectParts.add(`tbl_sindicatos(${fieldDef.supabasePath})`);
            } else if (fieldDef.mainTable === 'tbl_calculos') {
              selectParts.add(fieldDef.supabasePath);
            }
            // Add other mainTable cases if needed for other webhook types
          }
        });

        const finalSelectString = Array.from(selectParts).join(', ');

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

        // Construct the payload using the generic extractValueFromPath
        const payload: { [key: string]: any } = {};
        config.selected_fields.forEach(fieldKey => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            let pathForExtraction = fieldDef.supabasePath;
            // Adjust path for extraction based on how it was fetched
            if (fieldDef.mainTable === 'tbl_clientes') {
              pathForExtraction = `tbl_clientes(${fieldDef.supabasePath})`;
            } else if (fieldDef.mainTable === 'tbl_sindicatos') {
              pathForExtraction = `tbl_sindicatos(${fieldDef.supabasePath})`;
            }
            // For tbl_calculos fields, the path is direct
            
            payload[fieldDef.key] = extractValueFromPath(specificCalculationData, pathForExtraction);
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