import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Calculator, Send, RefreshCw, FileText, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { allAvailableFieldsDefinition, getFullSupabasePath } from '@/utils/webhookFields';
import { extractValueFromPath } from '@/utils/supabaseDataExtraction';
import CalculationWebhookSender from '@/components/calculations/CalculationWebhookSender';

interface CalculationResult {
  id: string;
  resposta_ai: string | null;
  url_documento_calculo: string | null; // Novo campo
  texto_extraido: string | null; // Novo campo
  data_hora: string;
}

interface Calculation {
  id: string;
  nome_funcionario: string;
  inicio_contrato: string;
  fim_contrato: string;
  tbl_clientes: Array<{ nome: string }> | null;
  tbl_resposta_calculo: CalculationResult[] | null; // Incluir resultados do cálculo
  created_at: string;
  [key: string]: any; // Allow arbitrary properties for webhook payload
}

type WebhookStatus = 'idle' | 'sending' | 'waiting' | 'received';

const CalculationListPage = () => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhookStatuses, setWebhookStatuses] = useState<Map<string, WebhookStatus>>(new Map()); // Status por cálculo
  const [isWebhookSelectionOpen, setIsWebhookSelectionOpen] = useState(false);
  const [currentCalculationIdForWebhook, setCurrentCalculationIdForWebhook] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCalculations();
    }
  }, [user]);

  const fetchCalculations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select('id, nome_funcionario, inicio_contrato, fim_contrato, created_at, tbl_clientes(nome), tbl_resposta_calculo(*)') // Selecionar tbl_resposta_calculo
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar cálculos: ' + error.message);
      console.error('Error fetching calculations:', error);
    } else {
      const processedCalculations = data?.map(calc => ({
        ...calc,
        tbl_clientes: calc.tbl_clientes ? (Array.isArray(calc.tbl_clientes) ? calc.tbl_clientes : [calc.tbl_clientes]) : null,
        tbl_resposta_calculo: calc.tbl_resposta_calculo ? (Array.isArray(calc.tbl_resposta_calculo) ? calc.tbl_resposta_calculo : [calc.tbl_resposta_calculo]) : null,
      })) || [];
      setCalculations(processedCalculations as Calculation[]);

      // Initialize webhook statuses based on fetched data
      const initialStatuses = new Map<string, WebhookStatus>();
      processedCalculations.forEach(calc => {
        if (calc.tbl_resposta_calculo && calc.tbl_resposta_calculo.length > 0 && calc.tbl_resposta_calculo[0].resposta_ai) {
          initialStatuses.set(calc.id, 'received');
        } else {
          initialStatuses.set(calc.id, 'idle');
        }
      });
      setWebhookStatuses(initialStatuses);
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

  const handleOpenWebhookSelection = (calculationId: string) => {
    setCurrentCalculationIdForWebhook(calculationId);
    setIsWebhookSelectionOpen(true);
  };

  const handleSendToWebhook = async (calculationId: string, webhookConfigIds: string[]) => {
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }

    setWebhookStatuses(prev => new Map(prev).set(calculationId, 'sending'));
    showSuccess('Iniciando envio para webhooks selecionados...');

    try {
      const { data: webhookConfigs, error: webhookError } = await supabase
        .from('tbl_webhook_configs')
        .select('*')
        .in('id', webhookConfigIds);

      if (webhookError) {
        showError('Erro ao buscar configurações de webhook: ' + webhookError.message);
        console.error('Error fetching webhook configs:', webhookError);
        setWebhookStatuses(prev => new Map(prev).set(calculationId, 'idle'));
        return;
      }

      if (!webhookConfigs || webhookConfigs.length === 0) {
        showError('Nenhum webhook selecionado ou configurado encontrado.');
        setWebhookStatuses(prev => new Map(prev).set(calculationId, 'idle'));
        return;
      }

      let sentCount = 0;
      for (const config of webhookConfigs) {
        const selectParts: Set<string> = new Set();
        selectParts.add('id'); // Always include the ID of the main record

        const relatedTableSelections: { [tableName: string]: Set<string> } = {};

        config.selected_fields.forEach(fieldKey => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            if (fieldDef.sourceTable === 'tbl_calculos') {
              selectParts.add(fieldDef.baseSupabasePath);
            } else {
              // Handle related tables
              if (!relatedTableSelections[fieldDef.sourceTable]) {
                relatedTableSelections[fieldDef.sourceTable] = new Set();
              }
              relatedTableSelections[fieldDef.sourceTable].add(fieldDef.baseSupabasePath);
            }
          }
        });

        // Combine related table selections into the main select string
        for (const tableName in relatedTableSelections) {
          if (relatedTableSelections[tableName].size > 0) {
            // Special handling for tbl_dissidios nested under tbl_sindicatos
            if (tableName === 'tbl_dissidios' && relatedTableSelections['tbl_sindicatos']) {
              const sindicatoFields = Array.from(relatedTableSelections['tbl_sindicatos']).join(',');
              const dissidioFields = Array.from(relatedTableSelections['tbl_dissidios']).join(',');
              selectParts.add(`tbl_sindicatos(${sindicatoFields},tbl_dissidios(${dissidioFields}))`);
              delete relatedTableSelections['tbl_sindicatos']; // Prevent duplicate join
            } else {
              selectParts.add(`${tableName}(${Array.from(relatedTableSelections[tableName]).join(',')})`);
            }
          }
        }

        const finalSelectString = Array.from(selectParts).join(', ');

        const { data: specificCalculationData, error: fetchError } = await supabase
          .from('tbl_calculos')
          .select(finalSelectString)
          .eq('id', calculationId)
          .single();

        if (fetchError) {
          showError(`Erro ao buscar dados do cálculo para webhook: ${fetchError.message}`);
          console.error('Error fetching specific calculation data:', fetchError);
          continue;
        }

        if (!specificCalculationData) {
          showError('Dados do cálculo não encontrados para o webhook.');
          continue;
        }

        const calculationRecord: Calculation = specificCalculationData as unknown as Calculation;

        const payload: { [key: string]: any } = {};
        config.selected_fields.forEach(fieldKey => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            const extractionPath = getFullSupabasePath('tbl_calculos', fieldDef);
            payload[fieldDef.key] = extractValueFromPath(calculationRecord, extractionPath);
          }
        });

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
        setWebhookStatuses(prev => new Map(prev).set(calculationId, 'waiting')); // Set to waiting after successful send
      } else {
        showError('Nenhum cálculo foi enviado para os webhooks selecionados.');
        setWebhookStatuses(prev => new Map(prev).set(calculationId, 'idle'));
      }

    } catch (error: any) {
      showError('Erro inesperado ao enviar cálculo para webhook: ' + error.message);
      console.error('Unexpected error sending webhook:', error);
      setWebhookStatuses(prev => new Map(prev).set(calculationId, 'idle'));
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
            {calculations.map((calculation) => {
              const currentStatus = webhookStatuses.get(calculation.id) || 'idle';
              const hasResult = calculation.tbl_resposta_calculo && calculation.tbl_resposta_calculo.length > 0 && calculation.tbl_resposta_calculo[0].resposta_ai;
              const resultPdfUrl = calculation.tbl_resposta_calculo?.[0]?.url_documento_calculo;

              return (
                <Card key={calculation.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-xl text-orange-500">{calculation.nome_funcionario}</CardTitle>
                    <p className="text-sm text-gray-400">Cliente: {calculation.tbl_clientes?.[0]?.nome || 'N/A'}</p>
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p>Início Contrato: {format(new Date(calculation.inicio_contrato), 'dd/MM/yyyy')}</p>
                      <p>Fim Contrato: {format(new Date(calculation.fim_contrato), 'dd/MM/yyyy')}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-between items-start space-y-3">
                    <div className="flex items-center text-sm">
                      {currentStatus === 'sending' && (
                        <span className="flex items-center text-blue-400">
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Enviando...
                        </span>
                      )}
                      {currentStatus === 'waiting' && !hasResult && (
                        <span className="flex items-center text-yellow-400">
                          <Clock className="h-4 w-4 mr-1 animate-pulse" /> Aguardando resposta...
                        </span>
                      )}
                      {hasResult && (
                        <span className="flex items-center text-green-400">
                          <Calculator className="h-4 w-4 mr-1" /> Resultado disponível
                        </span>
                      )}
                      {!hasResult && currentStatus === 'idle' && (
                        <span className="flex items-center text-gray-500">
                          <Calculator className="h-4 w-4 mr-1" /> Sem resultado
                        </span>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2 w-full">
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
                      {resultPdfUrl && (
                        <a href={resultPdfUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                        onClick={() => handleOpenWebhookSelection(calculation.id)}
                        disabled={currentStatus === 'sending' || currentStatus === 'waiting'}
                      >
                        {(currentStatus === 'sending' || currentStatus === 'waiting') ? (
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
              );
            })}
          </div>
        )}
      </div>

      {currentCalculationIdForWebhook && (
        <CalculationWebhookSender
          calculationId={currentCalculationIdForWebhook}
          isOpen={isWebhookSelectionOpen}
          onOpenChange={setIsWebhookSelectionOpen}
          onSend={handleSendToWebhook}
          isSending={webhookStatuses.get(currentCalculationIdForWebhook) === 'sending'}
        />
      )}
    </MainLayout>
  );
};

export default CalculationListPage;