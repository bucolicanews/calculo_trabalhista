import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Send, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { allAvailableFieldsDefinition, getFullSupabasePath } from '@/utils/webhookFields';
import { extractValueFromPath } from '@/utils/supabaseDataExtraction';
import CalculationWebhookSender from '@/components/calculations/CalculationWebhookSender';

interface Calculation {
  id: string;
  nome_funcionario: string;
  inicio_contrato: string;
  fim_contrato: string;
  tbl_clientes: Array<{ nome: string }> | null;
  created_at: string;
  [key: string]: any; // Allow arbitrary properties for webhook payload
}

const CalculationListPage = () => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingWebhook, setIsSendingWebhook] = useState<string | null>(null);
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
      .select('id, nome_funcionario, inicio_contrato, fim_contrato, created_at, tbl_clientes(nome)')
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar cálculos: ' + error.message);
      console.error('Error fetching calculations:', error);
    } else {
      const processedCalculations = data?.map(calc => ({
        ...calc,
        tbl_clientes: calc.tbl_clientes ? (Array.isArray(calc.tbl_clientes) ? calc.tbl_clientes : [calc.tbl_clientes]) : null,
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
    showSuccess('Iniciando envio para webhooks selecionados...');

    try {
      const { data: webhookConfigs, error: webhookError } = await supabase
        .from('tbl_webhook_configs')
        .select('*')
        .in('id', webhookConfigIds);

      if (webhookError) {
        showError('Erro ao buscar configurações de webhook: ' + webhookError.message);
        console.error('Error fetching webhook configs:', webhookError);
        setIsSendingWebhook(null);
        return;
      }

      if (!webhookConfigs || webhookConfigs.length === 0) {
        showError('Nenhum webhook selecionado ou configurado encontrado.');
        setIsSendingWebhook(null);
        return;
      }

      let sentCount = 0;
      for (const config of webhookConfigs) {
        const selectParts: Set<string> = new Set();
        selectParts.add('id');

        const relatedTableSelections: { [tableName: string]: Set<string> } = {};

        config.selected_fields.forEach(fieldKey => {
          const fieldDef = allAvailableFieldsDefinition.find(f => f.key === fieldKey);
          if (fieldDef) {
            if (fieldDef.sourceTable === 'tbl_calculos') {
              selectParts.add(fieldDef.baseSupabasePath);
            } else {
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
      } else {
        showError('Nenhum cálculo foi enviado para os webhooks selecionados.');
      }

    } catch (error: any) {
      showError('Erro inesperado ao enviar cálculo para webhook: ' + error.message);
      console.error('Unexpected error sending webhook:', error);
    } finally {
      setIsSendingWebhook(null);
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
                <CardContent className="flex justify-end space-x-2 w-full">
                  <Button asChild variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                    <Link to={`/calculations/${calculation.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                    onClick={() => handleOpenWebhookSelection(calculation.id)}
                    disabled={isSendingWebhook === calculation.id}
                  >
                    {isSendingWebhook === calculation.id ? (
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
                </CardContent>
              </Card>
            ))}
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