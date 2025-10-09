import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { showError } from '@/utils/toast';
import { ArrowLeft } from 'lucide-react';

// Importar os novos componentes modulares
import CalculationDetailsCard from '@/components/calculations/CalculationDetailsCard';
import AiResponseDisplay from '@/components/calculations/AiResponseDisplay';
import NoResultCard from '@/components/calculations/NoResultCard';
import ProventosDescontosDisplay from '@/components/calculations/ProventosDescontosDisplay';

interface Provento {
  id: string;
  id_calculo: string | null;
  nome_provento: string;
  valor_calculado: number;
  natureza_da_verba: string;
  legislacao: string | null;
  exemplo_aplicavel: string | null;
  formula_sugerida: string | null;
  parametro_calculo: string | null;
  json_completo: any | null;
}

interface Desconto {
  id: string;
  id_calculo: string | null;
  nome_desconto: string;
  valor_calculado: number;
  natureza_da_verba: string;
  legislacao: string | null;
  exemplo_aplicavel: string | null;
  formula_sugerida: string | null;
  parametro_calculo: string | null;
  json_completo: any | null;
}

interface CalculationDetails {
  id: string;
  cliente_id: string;
  sindicato_id: string | null;
  ai_template_id: string | null;
  nome_funcionario: string;
  cpf_funcionario: string | null;
  funcao_funcionario: string | null;
  inicio_contrato: string;
  fim_contrato: string;
  tipo_aviso: string;
  salario_sindicato: number;
  salario_trabalhador: number;
  obs_sindicato: string | null;
  historia: string | null;
  ctps_assinada: boolean;
  media_descontos: number;
  media_remuneracoes: number;
  carga_horaria: string | null;
  created_at: string;
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
    // proventos: string; // Removido para evitar conflito
    // descontos: string; // Removido para evitar conflito
    observacoes_base_legal: string;
    estrutura_json_modelo_saida: string | null; // Campo do DB
    instrucoes_entrada_dados_rescisao: string | null; // Campo do DB
    created_at: string;
  } | null;
  tbl_resposta_calculo: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
  related_proventos: Provento[] | null;
  related_descontos: Desconto[] | null;
}

const CalculationResultPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);

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
        *,
        resposta_ai,
        tbl_clientes(nome),
        tbl_sindicatos(nome),
        tbl_ai_prompt_templates(
          id, title, identificacao, comportamento, restricoes, atribuicoes, leis, observacoes_base_legal, 
          estrutura_json_modelo_saida, instrucoes_entrada_dados_rescisao, created_at
        ),
        tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora),
        related_proventos:proventos(*),
        related_descontos:descontos(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar resultado do cálculo: ' + error.message);
      console.error('Error fetching calculation result:', error);
      navigate('/calculations');
    } else if (data) {
      setCalculation(data as unknown as CalculationDetails);
    } else {
      setCalculation(null);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando resultado do cálculo...</div>
      </MainLayout>
    );
  }

  if (!calculation) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Nenhum resultado de cálculo encontrado.</div>
      </MainLayout>
    );
  }

  const otherResultDetails = calculation.tbl_resposta_calculo;
  const hasAnyResult = calculation.resposta_ai || otherResultDetails?.url_documento_calculo || otherResultDetails?.texto_extraido;
  const hasStructuredData = (calculation.related_proventos && calculation.related_proventos.length > 0) || (calculation.related_descontos && calculation.related_descontos.length > 0);

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
          <Button variant="ghost" onClick={() => navigate('/calculations')} className="text-orange-500 hover:text-orange-600 mb-2 sm:mb-0 sm:w-auto">
            <ArrowLeft className="mr-1 h-1 w-1" /> Voltar para Cálculos
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 flex-grow text-center sm:text-center">
            Resultado do Cálculo
          </h1>
          <div className="w-full sm:w-48 h-0 sm:h-auto"></div>
        </div>

        <CalculationDetailsCard calculation={calculation} />

        {hasStructuredData && ( 
          <ProventosDescontosDisplay
            proventos={calculation.related_proventos || []}
            descontos={calculation.related_descontos || []}
          />
        )}

        {hasAnyResult ? (
          <AiResponseDisplay
            calculationId={calculation.id}
            employeeName={calculation.nome_funcionario}
            aiResponse={calculation.resposta_ai}
            otherResultDetails={otherResultDetails}
          />
        ) : (
          <NoResultCard />
        )}
      </div>
    </MainLayout>
  );
};

export default CalculationResultPage;