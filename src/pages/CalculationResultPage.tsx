// src/pages/CalculationResultPage.tsx

import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import AiResponseDisplay from '@/components/calculations/AiResponseDisplay';
import NoResultCard from '@/components/calculations/NoResultCard';
import FullRescissionView from '@/components/calculations/FullRescissionView';
import ClearEntriesButton from '@/components/calculations/ClearEntriesButton';
import DownloadPdfButton from '@/components/calculations/DownloadPdfButton';
import { useCalculationDetails } from '@/hooks/useCalculationDetails';

const CalculationResultPage: React.FC = () => {
  const { /* user */ } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Usamos o hook para buscar e mapear os dados
  const { 
    calculation, 
    displayProventos, 
    displayDescontos, 
    loading, 
    // hasAnyResult // Removido, pois não é usado
  } = useCalculationDetails(id);

  const [isReprocessing, setIsReprocessing] = useState(false);

  // A função fetchCalculationResult foi removida pois não é mais utilizada.

  const handleReprocess = async () => {
    if (!id || isReprocessing) return;
    setIsReprocessing(true);
    showSuccess('Iniciando reprocessamento...');

    try {
      const { error, data } = await supabase.functions.invoke('reprocess-calculation-ai-response', {
        body: { calculationId: id },
      });

      // Erro na chamada da função
      if (error) throw new Error(error.message);
      // Erro retornado pela lógica da função (ex: JSON inválido)
      if (data && data.error) throw new Error(data.details || data.error);

      showSuccess('Processamento concluído! Atualizando a página...');
      // Força a atualização do componente pai para re-executar o hook
      setTimeout(() => window.location.reload(), 2500); 

    } catch (e: any) {
      showError('Falha no processamento: ' + e.message);
    } finally {
      setIsReprocessing(false);
    }
  };

  if (loading) {
    return <MainLayout><div className="py-8 text-center text-gray-400">Carregando...</div></MainLayout>;
  }

  if (!calculation) {
    return <MainLayout><div className="py-8 text-center text-gray-400">Cálculo não encontrado.</div></MainLayout>;
  }

  // ================== LÓGICA DE EXIBIÇÃO ==================
  const hasAiResponse = !!calculation.resposta_ai;
  const hasProcessedEntries = displayProventos.length > 0 || displayDescontos.length > 0;

  // Condição para Reprocessar: tem resposta da IA, MAS AINDA não tem verbas processadas.
  const needsProcessing = hasAiResponse && !hasProcessedEntries;

  // Condição para Limpar Verbas: já tem verbas processadas.
  const canClearEntries = hasProcessedEntries;

  // Condição para Download: tem verbas processadas para gerar o PDF.
  const canDownloadPdf = hasProcessedEntries;
  // ========================================================

  const otherResultDetails = calculation.tbl_resposta_calculo;

  return (
    <MainLayout>
      <div className="container w-full">
        <div className="mb-0  sm:px-0">
          <Button variant="ghost" onClick={() => navigate('/calculations')} className="text-orange-500 hover:text-orange-600 mb-4 sm:mb-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Cálculos
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mt-2">
            <h1 className="text-2xl md:text-4xl font-extrabold text-orange-600 flex-grow text-left">
              Resultado do Cálculo
            </h1>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">

              {/* ALTERADO: Botão REPROCESSAR só aparece se precisar processar */}
              {needsProcessing && (
                <Button
                  onClick={handleReprocess}
                  className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto flex items-center justify-center"
                  disabled={isReprocessing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isReprocessing ? 'animate-spin' : ''}`} />
                  {isReprocessing ? 'Processando...' : 'Processar Detalhes'}
                </Button>
              )}

              {/* ALTERADO: Botão LIMPAR VERBAS só aparece se já houver verbas */}
              {canClearEntries && (
                <ClearEntriesButton calculationId={id!} onSuccess={() => window.location.reload()} />
              )}

              {/* ALTERADO: Botão DOWNLOAD só aparece se houver verbas para exibir */}
              {canDownloadPdf && (
                <DownloadPdfButton calculationId={id} />
              )}
            </div>
          </div>
        </div>

        <div className="report-content">
          <FullRescissionView
            calculationDetails={calculation as any} // Mantido 'as any' para detalhes, pois a interface é complexa
            proventos={displayProventos} // CORRIGIDO: Usando dados mapeados
            descontos={displayDescontos} // CORRIGIDO: Usando dados mapeados
          />
          {hasAiResponse ? (
            <AiResponseDisplay
              aiResponse={calculation.resposta_ai}
              otherResultDetails={otherResultDetails}
            />
          ) : (
            <NoResultCard />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CalculationResultPage;