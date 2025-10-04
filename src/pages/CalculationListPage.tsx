import { useEffect, useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Send, RefreshCw, Eye, CheckCircle2, Clock, AlertTriangle, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { allAvailableFieldsDefinition, getFullSupabasePath } from '@/utils/webhookFields';
import { extractValueFromPath } from '@/utils/supabaseDataExtraction';
import CalculationWebhookSender from '@/components/calculations/CalculationWebhookSender';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf'; // Importar jspdf novamente

// Definindo os possíveis status de um cálculo
type CalculationStatus = 'idle' | 'sending' | 'pending_response' | 'completed' | 'timed_out' | 'error';

interface Calculation {
  id: string;
  nome_funcionario: string;
  inicio_contrato: string;
  fim_contrato: string;
  resposta_ai: string | null;
  tbl_clientes: { nome: string } | null;
  tbl_resposta_calculo: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
  created_at: string;
  status?: CalculationStatus; // Adicionando o status ao tipo Calculation
  [key: string]: any;
}

const TIMEOUT_DURATION = 20 * 60 * 1000; // 20 minutos em milissegundos

const CalculationListPage = () => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingWebhook, setIsSendingWebhook] = useState<string | null>(null);
  const [isWebhookSelectionOpen, setIsWebhookSelectionOpen] = useState(false);
  const [currentCalculationIdForWebhook, setCurrentCalculationIdForWebhook] = useState<string | null>(null);

  // Usar um ref para armazenar os timeouts, para que possamos limpá-los
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Função para atualizar o status de um cálculo específico
  const updateCalculationStatus = (id: string, newStatus: CalculationStatus) => {
    setCalculations(prevCalculations =>
      prevCalculations.map(calc =>
        calc.id === id ? { ...calc, status: newStatus } : calc
      )
    );
  };

  // Limpa um timeout específico
  const clearTimeoutById = (id: string) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCalculations();

      console.log('Attempting to subscribe to Supabase Realtime channel for tbl_calculos...');
      const channel = supabase
        .channel('calculation_responses_channel') // Nome do canal para evitar conflitos
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'tbl_calculos', filter: 'resposta_ai=neq.null' }, // Escuta por atualizações em tbl_calculos onde resposta_ai não é nula
          (payload) => {
            console.log('Realtime event received:', payload); // Log do payload completo
            const updatedCalculation = payload.new as Calculation;
            if (updatedCalculation && updatedCalculation.id && updatedCalculation.resposta_ai) {
              console.log('Realtime update received for calculation ID:', updatedCalculation.id, 'with AI response.');
              // Atualiza o status para 'completed' e limpa o timeout para o cálculo específico
              updateCalculationStatus(updatedCalculation.id, 'completed');
              clearTimeoutById(updatedCalculation.id);
              // Opcional: Atualiza os dados do cálculo no estado para refletir a nova resposta_ai
              setCalculations(prevCalculations =>
                prevCalculations.map(calc =>
                  calc.id === updatedCalculation.id ? { ...calc, resposta_ai: updatedCalculation.resposta_ai } : calc
                )
              );
            } else {
              console.log('Realtime event received, but no relevant AI response update:', updatedCalculation);
            }
          }
        )
        .subscribe((status) => {
          console.log('Supabase Realtime channel status:', status); // Log do status da subscrição
        });

      return () => {
        console.log('Unsubscribing from Supabase Realtime channel.');
        supabase.removeChannel(channel);
        // Limpa todos os timeouts ao desmontar o componente
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current.clear();
      };
    }
  }, [user]);

  const fetchCalculations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select('id, nome_funcionario, inicio_contrato, fim_contrato, created_at, resposta_ai, tbl_clientes(nome), tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora)')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar cálculos: ' + error.message);
      console.error('Error fetching calculations:', error);
    } else {
      const initialCalculations: Calculation[] = (data as unknown as Calculation[] || []).map(calc => {
        // Determina o status inicial
        const hasResult = calc.resposta_ai || calc.tbl_resposta_calculo?.url_documento_calculo || calc.tbl_resposta_calculo?.texto_extraido;
        return {
          ...calc,
          status: hasResult ? 'completed' : 'idle',
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
      clearTimeoutById(id); // Limpa o timeout se o cálculo for deletado
      fetchCalculations();
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
        updateCalculationStatus(calculationId, 'error');
        setIsSendingWebhook(null);
        return;
      }

      if (!webhookConfigs || webhookConfigs.length === 0) {
        showError('Nenhum webhook selecionado ou configurado encontrado.');
        updateCalculationStatus(calculationId, 'error');
        setIsSendingWebhook(null);
        return;
      }

      let sentCount = 0;
      for (const config of webhookConfigs) {
        const selectParts: Set<string> = new Set(['id']);
        const relatedTableSelections: { [tableName: string]: Set<string> } = {};

        if (config.selected_fields.includes('calculo_resposta_ai')) {
            selectParts.add('resposta_ai');
        }

        config.selected_fields.forEach((fieldKey: string) => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            if (fieldDef.sourceTable === 'tbl_calculos' && fieldDef.key !== 'calculo_resposta_ai') {
              selectParts.add(fieldDef.baseSupabasePath);
            } else if (fieldDef.sourceTable !== 'tbl_calculos') {
              if (!relatedTableSelections[fieldDef.sourceTable]) {
                relatedTableSelections[fieldDef.sourceTable] = new Set();
              }
              relatedTableSelections[fieldDef.sourceTable].add(fieldDef.baseSupabasePath);
            }
          }
        });

        for (const tableName in relatedTableSelections) {
          if (relatedTableSelections[tableName].size > 0) {
            selectParts.add(`${tableName}(${Array.from(relatedTableSelections[tableName]).join(',')})`);
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
            if (fieldDef.key === 'calculo_resposta_ai') {
                payload[fieldDef.key] = (specificCalculationData as any).resposta_ai;
            } else {
                const extractionPath = getFullSupabasePath('tbl_calculos', fieldDef);
                payload[fieldDef.key] = extractValueFromPath(specificCalculationData, extractionPath);
            }
          }
        });

        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          showError(`Falha ao enviar para o webhook: ${config.webhook_url}. Status: ${response.status}`);
        } else {
          sentCount++;
        }
      }

      if (sentCount > 0) {
        showSuccess(`Cálculo enviado para ${sentCount} webhook(s) com sucesso!`);
        updateCalculationStatus(calculationId, 'pending_response');
        // Inicia o timeout para 'timed_out'
        const timeoutId = setTimeout(() => {
          updateCalculationStatus(calculationId, 'timed_out');
          timeoutsRef.current.delete(calculationId);
        }, TIMEOUT_DURATION);
        timeoutsRef.current.set(calculationId, timeoutId);
      } else {
        updateCalculationStatus(calculationId, 'error');
      }

    } catch (error: any) {
      showError('Erro inesperado ao enviar cálculo para webhook: ' + error.message);
      updateCalculationStatus(calculationId, 'error');
    } finally {
      setIsSendingWebhook(null);
    }
  };

  // Função para lidar com o download da resposta da IA como TXT
  const handleDownloadAiResponseAsTxt = (calculation: Calculation) => {
    if (calculation.resposta_ai) {
      const filename = `calculo_${calculation.nome_funcionario.replace(/\s/g, '_')}_${calculation.id.substring(0, 8)}.txt`;
      const blob = new Blob([calculation.resposta_ai], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Download da resposta da IA (TXT) iniciado!');
    } else {
      showError('Nenhuma resposta da IA disponível para download em TXT.');
    }
  };

  // Função para lidar com o download da resposta da IA como PDF
  const handleDownloadAiResponseAsPdf = (calculation: Calculation) => {
    if (calculation.resposta_ai) {
      const doc = new jsPDF();
      const filename = `calculo_${calculation.nome_funcionario.replace(/\s/g, '_')}_${calculation.id.substring(0, 8)}.pdf`;
      
      const text = calculation.resposta_ai;
      const lines = doc.splitTextToSize(text, 180); // 180mm de largura para o texto
      let y = 10; // Posição inicial Y

      doc.setFontSize(12);
      for (let i = 0; i < lines.length; i++) {
        if (y + 10 > doc.internal.pageSize.height - 10) { // Verifica se precisa de nova página
          doc.addPage();
          y = 10; // Reseta Y para a nova página
        }
        doc.text(lines[i], 10, y);
        y += 7; // Incrementa Y para a próxima linha
      }

      doc.save(filename);
      showSuccess('Download da resposta da IA (PDF) iniciado!');
    } else {
      showError('Nenhuma resposta da IA disponível para download em PDF.');
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
              const currentStatus = calculation.status || 'idle';
              const hasResult = calculation.resposta_ai || calculation.tbl_resposta_calculo?.url_documento_calculo || calculation.tbl_resposta_calculo?.texto_extraido;

              return (
                <Card key={calculation.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-xl text-orange-500">{calculation.nome_funcionario}</CardTitle>
                      {currentStatus === 'sending' && (
                        <Badge variant="secondary" className="bg-yellow-600 text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Enviando...
                        </Badge>
                      )}
                      {currentStatus === 'pending_response' && (
                        <Badge variant="secondary" className="bg-blue-600 text-white flex items-center">
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Aguardando Resposta...
                        </Badge>
                      )}
                      {currentStatus === 'completed' && (
                        <Badge variant="secondary" className="bg-green-600 text-white flex items-center">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Concluído
                        </Badge>
                      )}
                      {currentStatus === 'timed_out' && (
                        <Badge variant="destructive" className="bg-red-600 text-white flex items-center">
                          <Clock className="h-3 w-3 mr-1" /> Tempo Excedido
                        </Badge>
                      )}
                      {currentStatus === 'error' && (
                        <Badge variant="destructive" className="bg-red-600 text-white flex items-center">
                          <AlertTriangle className="h-3 w-3 mr-1" /> Erro
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">Cliente: {calculation.tbl_clientes?.nome || 'N/A'}</p>
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

                    {/* Botão de download para a resposta da IA como TXT */}
                    {calculation.resposta_ai && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
                        onClick={() => handleDownloadAiResponseAsTxt(calculation)}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}

                    {/* NOVO: Botão de download para a resposta da IA como PDF */}
                    {calculation.resposta_ai && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white"
                        onClick={() => handleDownloadAiResponseAsPdf(calculation)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                      onClick={() => handleOpenWebhookSelection(calculation.id)}
                      disabled={isSendingWebhook === calculation.id || currentStatus === 'pending_response'}
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