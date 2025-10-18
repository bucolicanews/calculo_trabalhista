import React from 'react';
import ProventosDescontosDisplay from './ProventosDescontosDisplay';
import AiResponseDisplay from './AiResponseDisplay';
import ClearEntriesButton from './ClearEntriesButton';
import DownloadPdfButton from './DownloadPdfButton';
import { Provento, Desconto } from '@/hooks/useCalculationDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

interface CalculationResultDisplayProps {
  calculationId: string;
  proventos: Provento[];
  descontos: Desconto[];
  respostaAi: any | null;
  otherResultDetails: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
  onDataCleared: () => void;
  onReprocessed: () => void;
}

const CalculationResultDisplay: React.FC<CalculationResultDisplayProps> = ({
  calculationId,
  proventos,
  descontos,
  respostaAi,
  otherResultDetails,
  onDataCleared,
  onReprocessed,
}) => {
  const [isReprocessing, setIsReprocessing] = React.useState(false);

  const handleReprocess = async () => {
    if (!calculationId || !respostaAi) {
      showError("Cálculo ou resposta da IA não disponíveis para reprocessamento.");
      return;
    }

    setIsReprocessing(true);
    showSuccess("Iniciando reprocessamento da resposta da IA...");

    try {
      const { error } = await supabase.functions.invoke('reprocess-calculation-ai-response', {
        body: { calculationId: calculationId },
      });

      if (error) {
        throw new Error(`Falha ao reprocessar: ${error.message}`);
      }

      showSuccess("Reprocessamento iniciado com sucesso! Atualizando dados em breve.");
      onReprocessed(); // Chama a função para recarregar os dados na página pai

    } catch (e: any) {
      console.error("ERRO AO REPROCESSAR:", e);
      showError(e.message);
    } finally {
      setIsReprocessing(false);
    }
  };

  const hasDetailedEntries = proventos.length > 0 || descontos.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Ações */}
      <Card className="bg-gray-900 border-orange-500 text-white">
        <CardHeader><CardTitle className="text-xl text-orange-500">Ações do Resultado</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          
          <DownloadPdfButton calculationId={calculationId} />

          {hasDetailedEntries && (
            <Button
              onClick={handleReprocess}
              disabled={isReprocessing}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto flex items-center justify-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isReprocessing ? 'animate-spin' : ''}`} />
              {isReprocessing ? 'Reprocessando...' : 'Reprocessar Verbas'}
            </Button>
          )}

          {hasDetailedEntries && (
            <ClearEntriesButton calculationId={calculationId} onSuccess={onDataCleared} />
          )}
        </CardContent>
      </Card>

      {/* Exibição Detalhada (Tabelas) */}
      {hasDetailedEntries && (
        <ProventosDescontosDisplay proventos={proventos} descontos={descontos} />
      )}

      <Separator className="bg-gray-700" />

      {/* Exibição da Resposta Bruta da IA / Documentos */}
      <AiResponseDisplay 
        aiResponse={respostaAi} 
        otherResultDetails={otherResultDetails}
      />
    </div>
  );
};

export default CalculationResultDisplay;