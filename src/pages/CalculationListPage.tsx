import { useEffect, useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Send, RefreshCw, Eye, CheckCircle2, Download, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { allAvailableFieldsDefinition, getFullSupabasePath } from '@/utils/webhookFields';
import { extractValueFromPath } from '@/utils/supabaseDataExtraction';
import CalculationWebhookSender from '@/components/calculations/CalculationWebhookSender';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf'; // Importar jspdf

// Definindo os possíveis status de um cálculo
type CalculationStatus = 'idle' | 'sending' | 'pending_response' | 'completed';

interface Calculation {
  id: string;
  nome_funcionario: string;
  inicio_contrato: string;
  fim_contrato: string;
  resposta_ai: string | null;
  tbl_clientes: { nome: string } | null;
  tbl_sindicatos: { nome: string } | null;
  tbl_ai_prompt_templates: { 
    id: string;
    title: string;
    identificacao: string;
    comportamento: string;
    restricoes: string;
    atribuicoes: string;
    leis: string;
    proventos: string;
    descontos: string;
    observacoes_base_legal: string;
    formatacao_texto_cabecalho: string;
    formatacao_texto_corpo: string;
    formatacao_texto_rodape: string;
    created_at: string;
  } | null; // NOVO: Adicionado todos os campos do modelo IA
  tbl_resposta_calculo: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
  created_at: string;
  status?: CalculationStatus; // Adicionando o status ao tipo Calculation
  [key: string]: any;
}

const AUTO_REFRESH_DURATION = 1 * 60 * 1000; // 1 minuto em milissegundos

const CalculationListPage = () => {
  console.log("[CalculationListPage] Componente CalculationListPage renderizado.");

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
    }

    return () => {
      // Limpa todos os timeouts ao desmontar o componente
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();
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
        tbl_ai_prompt_templates(id, title, identificacao, comportamento, restricoes, atribuicoes, leis, proventos, descontos, observacoes_base_legal, formatacao_texto_cabecalho, formatacao_texto_corpo, formatacao_texto_rodape, created_at), 
        tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora)
      `) // NOVO: Adicionado todos os campos do modelo IA
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar cálculos: ' + error.message);
      console.error('Error fetching calculations:', error);
    } else {
      const initialCalculations: Calculation[] = (data as unknown as Calculation[] || []).map(calc => {
        // Determina o status inicial com base na resposta_ai
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
      clearTimeoutById(id); // Limpa o timeout se o cálculo for deletado
      fetchCalculations();
    }
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
        let selectParts: Set<string> = new Set(['id']); // Always select the main ID of tbl_calculos
        let clientSelectParts: Set<string> = new Set();
        let sindicatoSelectParts: Set<string> = new Set();
        let aiTemplateSelectParts: Set<string> = new Set(); // NOVO

        // Collect all unique Supabase paths needed for the selected fields
        config.selected_fields.forEach((fieldKey: string) => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            // Only include fields that are directly related or reachable from tbl_calculos
            if (fieldDef.sourceTable === 'tbl_calculos') {
              selectParts.add(fieldDef.baseSupabasePath);
            } else if (fieldDef.sourceTable === 'tbl_clientes') {
              clientSelectParts.add(fieldDef.baseSupabasePath);
            } else if (fieldDef.sourceTable === 'tbl_sindicatos') {
              sindicatoSelectParts.add(fieldDef.baseSupabasePath);
            } else if (fieldDef.sourceTable === 'tbl_ai_prompt_templates') { // NOVO
              aiTemplateSelectParts.add(fieldDef.baseSupabasePath);
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

        if (aiTemplateSelectParts.size > 0) { // NOVO
          let aiTemplatePath = `tbl_ai_prompt_templates(${Array.from(aiTemplateSelectParts).join(',')})`;
          selectParts.add(aiTemplatePath);
        }

        const finalSelectString = Array.from(selectParts).join(', ');
        console.log(`[Webhook Sender] Final Supabase SELECT string: ${finalSelectString}`);


        const { data: specificCalculationData, error: fetchError } = await supabase
          .from('tbl_calculos')
          .select(finalSelectString)
          .eq('id', calculationId)
          .single();

        if (fetchError) {
          showError(`Erro ao buscar dados do cálculo para webhook: ${fetchError.message}`);
          console.error(`[Webhook Sender] Erro ao buscar dados do cálculo:`, fetchError);
          continue;
        }

        if (!specificCalculationData) {
          showError('Dados do cálculo não encontrados para o webhook.');
          console.warn(`[Webhook Sender] Dados do cálculo não encontrados para ID: ${calculationId}`);
          continue;
        }
        console.log(`[Webhook Sender] Dados do Supabase recebidos:`, specificCalculationData);


        const payload: { [key: string]: any } = {};
        config.selected_fields.forEach((fieldKey: string) => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            // Use o fieldKey diretamente como chave no payload e extraia o valor
            const extractionPath = getFullSupabasePath('tbl_calculos', fieldDef);
            payload[fieldKey] = extractValueFromPath(specificCalculationData, extractionPath);
          }
        });

        // Encapsular o payload dentro de uma chave 'body' para compatibilidade com n8n
        const finalPayload = {
          body: payload
        };

        console.log(`[Webhook Sender] Enviando para URL: ${config.webhook_url}`);
        console.log(`[Webhook Sender] Payload final (JSON.stringify):`, JSON.stringify(finalPayload));

        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload), // Envia o payload encapsulado
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Webhook Sender] Falha no envio para ${config.webhook_url}. Status: ${response.status}. Detalhes: ${errorText}`);
          console.error(`[Webhook Sender] Resposta completa do erro:`, response);
          showError(`Falha ao enviar para o webhook: ${config.webhook_url}. Status: ${response.status}. Detalhes: ${errorText}`);
        } else {
          sentCount++;
          const successResponse = await response.json();
          console.log(`[Webhook Sender] Sucesso ao enviar para ${config.webhook_url}. Resposta:`, successResponse);
        }
      }

      if (sentCount > 0) {
        showSuccess(`Cálculo enviado para ${sentCount} webhook(s) com sucesso! A página será atualizada em ${AUTO_REFRESH_DURATION / 1000 / 60} minuto(s).`);
        updateCalculationStatus(calculationId, 'pending_response');
        const timeoutId = setTimeout(() => {
          console.log(`Atualizando a página para verificar o cálculo ${calculationId} após ${AUTO_REFRESH_DURATION / 1000 / 60} minuto(s).`);
          window.location.reload();
        }, AUTO_REFRESH_DURATION);
        timeoutsRef.current.set(calculationId, timeoutId);
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

  const handleDownloadAiResponseAsPdf = (calculation: Calculation) => {
    if (calculation.resposta_ai) {
      const doc = new jsPDF();
      const filename = `calculo_${calculation.nome_funcionario.replace(/\s/g, '_')}_${calculation.id.substring(0, 8)}.pdf`;
      
      const text = calculation.resposta_ai;
      const lines = doc.splitTextToSize(text, 180);
      let y = 10;

      doc.setFontSize(12);
      for (let i = 0; i < lines.length; i++) {
        if (y + 10 > doc.internal.pageSize.height - 10) {
          doc.addPage();
          y = 10;
        }
        doc.text(lines[i], 10, y);
        y += 7;
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
              const hasResult = calculation.resposta_ai;

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
                      {currentStatus !== 'sending' && currentStatus !== 'completed' && !hasResult && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-gray-700 text-white hover:bg-gray-600"
                          onClick={() => window.location.reload()}
                        >
                          Processar
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">Cliente: {calculation.tbl_clientes?.nome || 'N/A'}</p>
                    {calculation.tbl_ai_prompt_templates?.title && ( // NOVO
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