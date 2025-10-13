import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft, RefreshCw } from 'lucide-react';

// Importar os novos componentes modulares
import AiResponseDisplay from '@/components/calculations/AiResponseDisplay';
import NoResultCard from '@/components/calculations/NoResultCard';
import FullRescissionView from '@/components/calculations/FullRescissionView';
import ClearEntriesButton from '@/components/calculations/ClearEntriesButton';
import DownloadPdfButton from '@/components/calculations/DownloadPdfButton'; // Certifique-se que o import está aqui

// Importando as interfaces
import { Provento, Desconto } from '@/hooks/useCalculationDetails';

// TIPAGEM
interface CalculationDetails {
  id: string;
  nome_funcionario: string;
  inicio_contrato: string;
  fim_contrato: string;
  tipo_aviso: string;
  salario_trabalhador: number;
  ctps_assinada: boolean;
  resposta_ai: any | null;
  cpf_funcionario: string | null;
  funcao_funcionario: string | null;
  salario_sindicato: number;
  media_descontos: number;
  media_remuneracoes: number;
  carga_horaria: string | null;
  obs_sindicato: string | null;
  historia: string | null;
  tbl_clientes: { nome: string } | null;
  tbl_sindicatos: { nome: string } | null;
  tbl_ai_prompt_templates: {
    title: string;
    estrutura_json_modelo_saida: string | null; // Adicionado
    instrucoes_entrada_dados_rescisao: string | null;
  } | null;
  tbl_resposta_calculo: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
  tbl_proventos: Provento[] | null;
  tbl_descontos: Desconto[] | null;
}

const CalculationResultPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false);

  useEffect(() => {
    if (user && id) {
      fetchCalculationResult();
    }
  }, [user, id]);

  const fetchCalculationResult = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select(`
        *, resposta_ai, tbl_clientes(nome), tbl_sindicatos(nome),
        tbl_ai_prompt_templates(*),
        tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora),
        tbl_proventos(*), tbl_descontos(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar resultado do cálculo: ' + error.message);
    } else if (data) {
      setCalculation(data as unknown as CalculationDetails);
    } else {
      setCalculation(null);
    }
    setLoading(false);
  };

  const handleReprocessGranularity = async () => {
    if (!id || isReprocessing) return;
    setIsReprocessing(true);
    const aiResponseData = calculation?.resposta_ai;

    if (!aiResponseData) {
      showError('Resposta da IA não encontrada.');
      setIsReprocessing(false);
      return;
    }

    let aiResponseJsonString: string;
    if (typeof aiResponseData === 'object') {
      aiResponseJsonString = JSON.stringify(aiResponseData);
    } else if (typeof aiResponseData === 'string') {
      try {
        JSON.parse(aiResponseData);
        aiResponseJsonString = aiResponseData;
      } catch (e) {
        showError('A resposta da IA não é um JSON válido.');
        setIsReprocessing(false);
        return;
      }
    } else {
      showError('O formato da resposta da IA é desconhecido.');
      setIsReprocessing(false);
      return;
    }

    showSuccess('Iniciando reprocessamento...');
    try {
      const { error: clearError } = await supabase.functions.invoke('clear-calculation-entries', {
        body: { calculationId: id },
      });
      if (clearError) throw new Error(`Falha ao limpar dados antigos: ${clearError.message}`);

      const { error: processError, data: processData } = await supabase.functions.invoke('process-ai-calculation-json', {
        body: {
          calculationId: id,
          aiResponseJson: aiResponseJsonString,
        },
      });
      if (processError) throw new Error(processError.message);
      if (processData && processData.error) throw new Error(processData.details || processData.error);

      showSuccess('Reprocessamento concluído! Atualizando...');
      setTimeout(() => fetchCalculationResult(), 2500);
    } catch (e: any) {
      showError('Falha no reprocessamento: ' + e.message);
    } finally {
      setIsReprocessing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="py-8 text-center text-gray-400">Carregando...</div>
      </MainLayout>
    );
  }

  if (!calculation) {
    return (
      <MainLayout>
        <div className="py-8 text-center text-gray-400">Cálculo não encontrado.</div>
      </MainLayout>
    );
  }

  const otherResultDetails = calculation.tbl_resposta_calculo;
  const hasAnyResult = calculation.resposta_ai || otherResultDetails?.url_documento_calculo || otherResultDetails?.texto_extraido;
  const canReprocess = !!(calculation.resposta_ai);

  const calculationDataForDetailsCard = {
    nome_funcionario: calculation.nome_funcionario,
    inicio_contrato: calculation.inicio_contrato,
    fim_contrato: calculation.fim_contrato,
    tipo_aviso: calculation.tipo_aviso,
    salario_trabalhador: calculation.salario_trabalhador,
    ctps_assinada: calculation.ctps_assinada,
    cpf_funcionario: calculation.cpf_funcionario,
    funcao_funcionario: calculation.funcao_funcionario,
    salario_sindicato: calculation.salario_sindicato,
    media_descontos: calculation.media_descontos,
    media_remuneracoes: calculation.media_remuneracoes,
    carga_horaria: calculation.carga_horaria,
    obs_sindicato: calculation.obs_sindicato,
    historia: calculation.historia,
    tbl_clientes: calculation.tbl_clientes,
    tbl_sindicatos: calculation.tbl_sindicatos,
    tbl_ai_prompt_templates: calculation.tbl_ai_prompt_templates,
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 w-full">
        <div className="mb-6 px-4 sm:px-0">
          <Button variant="ghost" onClick={() => navigate('/calculations')} className="text-orange-500 hover:text-orange-600 mb-4 sm:mb-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Cálculos
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mt-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 flex-grow text-left">
              Resultado do Cálculo
            </h1>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              {canReprocess && (
                <Button
                  onClick={handleReprocessGranularity}
                  className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto flex items-center justify-center"
                  disabled={isReprocessing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isReprocessing ? 'animate-spin' : ''}`} />
                  {isReprocessing ? 'Processando...' : 'Reprocessar Detalhes'}
                </Button>
              )}
              {(calculation?.tbl_proventos?.length || 0) > 0 && (
                <ClearEntriesButton calculationId={id!} onSuccess={fetchCalculationResult} />
              )}

              {/* --- CORREÇÃO APLICADA AQUI --- */}
              {canReprocess && (
                // Simplesmente renderize o componente e passe o ID do cálculo como prop
                <DownloadPdfButton calculationId={id} />
              )}
              {/* --- FIM DA CORREÇÃO --- */}

            </div>
          </div>
        </div>

        <div className="report-content">
          <FullRescissionView
            calculationDetails={calculationDataForDetailsCard}
            proventos={calculation.tbl_proventos || []}
            descontos={calculation.tbl_descontos || []}
          />
          {hasAnyResult ? (
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