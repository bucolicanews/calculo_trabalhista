import { useEffect, useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Send, RefreshCw, Eye, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { allAvailableFieldsDefinition, getFullSupabasePath } from '@/utils/webhookFields';
import { extractValueFromPath } from '@/utils/supabaseDataExtraction';
import CalculationWebhookSender from '@/components/calculations/CalculationWebhookSender';
import { Badge } from '@/components/ui/badge';

// Definindo os possíveis status de um cálculo
type CalculationStatus = 'idle' | 'sending' | 'pending_response' | 'completed' | 'reprocessing';

interface Calculation {
  id: string;
  nome_funcionario: string;
  inicio_contrato: string;
  fim_contrato: string;
  resposta_ai: any | null; // Changed from string to any to reflect JSONB type
  tbl_clientes: { nome: string } | null;
  tbl_sindicatos: { nome: string } | null;
  tbl_ai_prompt_templates: {
    id: string;
    title: string;
  } | null;
  tbl_resposta_calculo: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
  created_at: string;
  status?: CalculationStatus;
  [key: string]: any;
}

const AUTO_REFRESH_DURATION = 2 * 60 * 1000; // 2 minutos em milissegundos
const PROCESS_WAIT_DURATION = 1 * 60 * 1000; // 1 minuto em milissegundos

const formatCountdown = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const CalculationListPage = () => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingWebhook, setIsSendingWebhook] = useState<string | null>(null);
  const [isWebhookSelectionOpen, setIsWebhookSelectionOpen] = useState(false);
  const [currentCalculationIdForWebhook, setCurrentCalculationIdForWebhook] = useState<string | null>(null);

  // 🛑 CORREÇÃO APLICADA: Inicializando como estado com new Map()
  const [countdownTimers, setCountdownTimers] = useState<Map<string, number>>(new Map());

  const [isReprocessing] = useState<string | null>(null); // 'setIsReprocessing' removido pois não é utilizado neste arquivo

  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const intervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const updateCalculationStatus = (id: string, newStatus: CalculationStatus) => {
    setCalculations(prevCalculations =>
      prevCalculations.map(calc =>
        calc.id === id ? { ...calc, status: newStatus } : calc
      )
    );
  };

  const clearTimeoutAndIntervalById = (id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    const interval = intervalsRef.current.get(id);
    if (interval) {
      clearInterval(interval);
      intervalsRef.current.delete(id);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCalculations();
    }

    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current.clear();
    };
  }, [user]);

  const fetchCalculations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select(`
        id, nome_funcionario, inicio_contrato, fim_contrato, created_at, resposta_ai, 
        tbl_clientes(nome), 
        tbl_sindicatos(nome), 
        tbl_ai_prompt_templates(id, title),
        tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar cálculos: ' + error.message);
      console.error('Error fetching calculations:', error);
    } else {
      const initialCalculations: Calculation[] = (data as unknown as Calculation[] || []).map(calc => {
        return {
          ...calc,
          status: calc.resposta_ai ? 'completed' : 'idle',
        };
      });
      setCalculations(initialCalculations);
    }
    setLoading(false);
  };


  const handleDeleteCalculation = async (id: string) => {
    const { error } = await supabase.from('tbl_calculos').delete().eq('id', id);
    if (error) {
      showError('Erro ao deletar cálculo: ' + error.message);
    } else {
      showSuccess('Cálculo deletado com sucesso!');
      clearTimeoutAndIntervalById(id);
      fetchCalculations();
    }
  };

  const handleProcessWait = (calculationId: string) => {
    console.log(`[CalculationListPage] Iniciando espera de 1 minuto para o cálculo ID: ${calculationId}`);

    updateCalculationStatus(calculationId, 'pending_response');
    showSuccess('Processamento iniciado. A página será atualizada em 1 minuto.');

    const timeoutId = setTimeout(() => {
      console.log(`Atualizando a página para o cálculo ${calculationId} após 1 minuto.`);
      window.location.reload();
    }, PROCESS_WAIT_DURATION);
    timeoutsRef.current.set(calculationId, timeoutId);

    const initialSeconds = PROCESS_WAIT_DURATION / 1000;
    setCountdownTimers(prev => new Map(prev).set(calculationId, initialSeconds));

    const intervalId = setInterval(() => {
      setCountdownTimers(prev => {
        const newTimers = new Map(prev);
        const currentSeconds = newTimers.get(calculationId);

        if (currentSeconds !== undefined && currentSeconds > 1) {
          newTimers.set(calculationId, currentSeconds - 1);
          return newTimers;
        } else {
          clearInterval(intervalId);
          intervalsRef.current.delete(calculationId);
          newTimers.delete(calculationId);
          return newTimers;
        }
      });
    }, 1000);
    intervalsRef.current.set(calculationId, intervalId);
  };


  const handleOpenWebhookSelection = (calculationId: string) => {
    console.log(`[CalculationListPage] Abrindo seleção de webhook para cálculo ID: ${calculationId}`);
    setCurrentCalculationIdForWebhook(calculationId);
    setIsWebhookSelectionOpen(true);
  };

  const handleSendToWebhook = async (calculationId: string, webhookConfigIds: string[]) => {
    console.log(`[CalculationListPage] handleSendToWebhook called for calculationId: ${calculationId}, webhookConfigIds:`, webhookConfigIds);

    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }

    setIsSendingWebhook(calculationId);
    updateCalculationStatus(calculationId, 'sending');
    showSuccess('Iniciando envio para webhooks selecionados...');

    try {
      const { data: webhookConfigs, error: webhookError } = await supabase
        .from('tbl_webhook_configs')
        .select('*')
        .in('id', webhookConfigIds);

      if (webhookError) {
        showError('Erro ao buscar configurações de webhook: ' + webhookError.message);
        console.error('[Webhook Sender] Erro ao buscar configurações de webhook:', webhookError);
        updateCalculationStatus(calculationId, 'idle');
        setIsSendingWebhook(null);
        return;
      }

      if (!webhookConfigs || webhookConfigs.length === 0) {
        showError('Nenhum webhook selecionado ou configurado encontrado.');
        console.warn('[Webhook Sender] Nenhum webhook selecionado ou configurado encontrado.');
        updateCalculationStatus(calculationId, 'idle');
        setIsSendingWebhook(null);
        return;
      }

      let sentCount = 0;
      for (const config of webhookConfigs) {
        let selectParts: Set<string> = new Set(['id']);
        let clientSelectParts: Set<string> = new Set();
        let sindicatoSelectParts: Set<string> = new Set();
        let aiTemplateSelectParts: Set<string> = new Set();
        let proventosSelectParts: Set<string> = new Set();
        let descontosSelectParts: Set<string> = new Set();

        config.selected_fields.forEach((fieldKey: string) => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            if (fieldDef.sourceTable === 'tbl_calculos') {
              selectParts.add(fieldDef.baseSupabasePath);
            } else if (fieldDef.sourceTable === 'tbl_clientes') {
              clientSelectParts.add(fieldDef.baseSupabasePath);
            } else if (fieldDef.sourceTable === 'tbl_sindicatos') {
              sindicatoSelectParts.add(fieldDef.baseSupabasePath);
            } else if (fieldDef.sourceTable === 'tbl_ai_prompt_templates') {
              aiTemplateSelectParts.add(fieldDef.baseSupabasePath);
            } else if (fieldDef.sourceTable === 'tbl_proventos') {
              proventosSelectParts.add(fieldDef.baseSupabasePath);
            } else if (fieldDef.sourceTable === 'tbl_descontos') {
              descontosSelectParts.add(fieldDef.baseSupabasePath);
            }
          }
        });

        if (clientSelectParts.size > 0) {
          selectParts.add(`tbl_clientes(${Array.from(clientSelectParts).join(',')})`);
        }

        if (sindicatoSelectParts.size > 0) {
          let sindicatoPath = `tbl_sindicatos(${Array.from(sindicatoSelectParts).join(',')})`;
          selectParts.add(sindicatoPath);
        }

        if (aiTemplateSelectParts.size > 0) {
          let aiTemplatePath = `tbl_ai_prompt_templates(${Array.from(aiTemplateSelectParts).join(',')})`;
          selectParts.add(aiTemplatePath);
        }

        if (proventosSelectParts.size > 0) {
          selectParts.add(`tbl_proventos(${Array.from(proventosSelectParts).join(',')})`);
        }

        if (descontosSelectParts.size > 0) {
          selectParts.add(`tbl_descontos(${Array.from(descontosSelectParts).join(',')})`);
        }

        const finalSelectString = Array.from(selectParts).join(', ');
        const { data: specificCalculationData, error: fetchError } = await supabase
          .from('tbl_calculos')
          .select(finalSelectString)
          .eq('id', calculationId)
          .single();

        if (fetchError) {
          showError(`Erro ao buscar dados do cálculo para webhook: ${fetchError.message}`);
          continue;
        }

        if (!specificCalculationData) {
          showError('Dados do cálculo não encontrados para o webhook.');
          continue;
        }

        const payload: { [key: string]: any } = {};
        config.selected_fields.forEach((fieldKey: string) => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            const extractionPath = getFullSupabasePath('tbl_calculos', fieldDef);
            payload[fieldKey] = extractValueFromPath(specificCalculationData, extractionPath);
          }
        });

        const finalPayload = {
          body: payload
        };

        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          showError(`Falha ao enviar para o webhook: ${config.webhook_url}. Status: ${response.status}. Detalhes: ${errorText}`);
        } else {
          sentCount++;
        }
      }

      if (sentCount > 0) {
        showSuccess(`Cálculo enviado para ${sentCount} webhook(s) com sucesso! A página será atualizada em ${AUTO_REFRESH_DURATION / 1000 / 60} minuto(s).`);
        updateCalculationStatus(calculationId, 'pending_response');

        const timeoutId = setTimeout(() => {
          window.location.reload();
        }, AUTO_REFRESH_DURATION);
        timeoutsRef.current.set(calculationId, timeoutId);

        const initialSeconds = AUTO_REFRESH_DURATION / 1000;
        setCountdownTimers(prev => new Map(prev).set(calculationId, initialSeconds));

        const intervalId = setInterval(() => {
          setCountdownTimers(prev => {
            const newTimers = new Map(prev);
            const currentSeconds = newTimers.get(calculationId);

            if (currentSeconds !== undefined && currentSeconds > 1) {
              newTimers.set(calculationId, currentSeconds - 1);
              return newTimers;
            } else {
              clearInterval(intervalId);
              intervalsRef.current.delete(calculationId);
              newTimers.delete(calculationId);
              return newTimers;
            }
          });
        }, 1000);
        intervalsRef.current.set(calculationId, intervalId);

      } else {
        showError('Nenhum webhook foi enviado com sucesso.');
        updateCalculationStatus(calculationId, 'idle');
      }

    } catch (error: any) {
      showError('Erro inesperado ao enviar cálculo para webhook: ' + error.message);
      console.error('[Webhook Sender] Erro inesperado:', error);
      updateCalculationStatus(calculationId, 'idle');
    } finally {
      setIsSendingWebhook(null);
    }
  };


  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500 mb-4 md:mb-0">Cálculos</h1>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white w-full md:w-auto">
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
              const currentStatus = calculation.status || 'idle';
              const hasResult = calculation.resposta_ai;
              const remainingSeconds = countdownTimers.get(calculation.id);
              const isProcessingAny = isSendingWebhook === calculation.id || isReprocessing === calculation.id || currentStatus === 'pending_response';

              return (
                <Card key={calculation.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-xl text-orange-500">{calculation.nome_funcionario}</CardTitle>
                    <div className="flex items-center justify-between mb-2">

                      {currentStatus === 'sending' && (
                        <Badge variant="secondary" className="bg-yellow-600 text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Enviando...
                        </Badge>
                      )}

                      {currentStatus === 'pending_response' && (
                        <Badge variant="secondary" className="bg-blue-600 text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Aguardando Resposta...
                          {remainingSeconds !== undefined && (
                            <span className="ml-2 font-mono">({formatCountdown(remainingSeconds)})</span>
                          )}
                        </Badge>
                      )}

                      {currentStatus === 'reprocessing' && (
                        <Badge variant="secondary" className="bg-purple-600 text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Reprocessando...
                        </Badge>
                      )}

                      {currentStatus === 'completed' && (
                        <Badge variant="secondary" className="bg-green-600 text-white flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Concluído
                        </Badge>
                      )}


                      {currentStatus !== 'sending' && currentStatus !== 'completed' && currentStatus !== 'pending_response' && currentStatus !== 'reprocessing' && !hasResult && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-gray-700 text-white hover:bg-gray-600"
                          onClick={() => handleProcessWait(calculation.id)}
                          disabled={isProcessingAny}
                        >
                          Processar
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">Cliente: {calculation.tbl_clientes?.nome || 'N/A'}</p>
                    {calculation.tbl_ai_prompt_templates?.title && (
                      <p className="text-sm text-gray-400">Modelo IA: {calculation.tbl_ai_prompt_templates.title}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p>Início Contrato: {format(new Date(calculation.inicio_contrato), 'dd/MM/yyyy')}</p>
                      <p>Fim Contrato: {format(new Date(calculation.fim_contrato), 'dd/MM/yyyy')}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-end space-x-2 w-full">
                    <Button asChild variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                      <Link to={`/calculations/${calculation.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>

                    {hasResult && (
                      <Button asChild variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                        <Link to={`/calculations/${calculation.id}/result`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      onClick={() => handleOpenWebhookSelection(calculation.id)}
                      disabled={isProcessingAny}
                    >
                      {isSendingWebhook === calculation.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
          isSending={!!isSendingWebhook}
        />
      )}
    </MainLayout>
  );
};

export default CalculationListPage;