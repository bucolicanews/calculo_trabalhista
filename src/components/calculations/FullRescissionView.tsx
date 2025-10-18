import React from 'react';
import { useParams } from 'react-router-dom';
import { useCalculationDetails, Provento, Desconto } from '@/hooks/useCalculationDetails';
import CalculationDetailsCard from './CalculationDetailsCard';
import CalculationResultDisplay from './CalculationResultDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';

// Define a estrutura de dados necessária para o CalculationDetailsCard
// Esta interface deve refletir a estrutura de dados que o useCalculationDetails retorna
// e que o CalculationDetailsCard espera.
interface CalculationDataForDetailsCard {
  nome_funcionario: string;
  inicio_contrato: string;
  fim_contrato: string;
  tipo_aviso: string;
  salario_trabalhador: number;
  ctps_assinada: boolean;
  cpf_funcionario: string | null;
  funcao_funcionario: string | null;
  salario_sindicato: number;
  media_descontos: number;
  media_remuneracoes: number;
  carga_horaria: string | null;
  obs_sindicato: string | null;
  historia: string | null;
  info_descontos: string | null; // NOVO CAMPO ADICIONADO
  tbl_clientes: { nome: string } | null;
  tbl_sindicatos: { nome: string } | null;
  tbl_ai_prompt_templates: {
    title: string;
    estrutura_json_modelo_saida: string | null;
    instrucoes_entrada_dados_rescisao: string | null;
  } | null;
}

const FullRescissionView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  // Usamos uma chave para forçar a re-execução do hook quando os dados são limpos/reprocessados
  const [refreshKey, setRefreshKey] = React.useState(0); 
  const { calculation, loading, hasAnyResult } = useCalculationDetails(id, refreshKey);

  // Função para forçar a recarga dos dados
  const handleRefreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (loading) {
    // Retorna apenas o conteúdo, o layout é fornecido pelo componente pai (CalculationResultPage)
    return <div className="container text-center py-8 text-gray-400">Carregando detalhes do cálculo...</div>;
  }

  if (!calculation) {
    // Retorna apenas o conteúdo, o layout é fornecido pelo componente pai
    return <div className="container text-center py-8 text-red-400">Cálculo não encontrado.</div>;
  }

  // Mapeia o objeto calculation para o tipo esperado pelo CalculationDetailsCard
  const calculationDetails: CalculationDataForDetailsCard = {
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
    info_descontos: calculation.info_descontos, // NOVO CAMPO
    tbl_clientes: calculation.tbl_clientes,
    tbl_sindicatos: calculation.tbl_sindicatos,
    tbl_ai_prompt_templates: calculation.tbl_ai_prompt_templates ? {
      title: calculation.tbl_ai_prompt_templates.title,
      estrutura_json_modelo_saida: calculation.tbl_ai_prompt_templates.estrutura_json_modelo_saida,
      instrucoes_entrada_dados_rescisao: calculation.tbl_ai_prompt_templates.instrucoes_entrada_dados_rescisao,
    } : null,
  };

  const proventos: Provento[] = calculation.tbl_proventos || [];
  const descontos: Desconto[] = calculation.tbl_descontos || [];

  return (
    <div className="container w-full py-8">
      <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">
        Detalhes do Cálculo de Rescisão
      </h1>

      {/* 1. Detalhes Principais do Cálculo */}
      <CalculationDetailsCard calculation={calculationDetails} />

      {/* 2. Resultados do Cálculo (Proventos/Descontos) */}
      {hasAnyResult ? (
        <CalculationResultDisplay 
          calculationId={calculation.id}
          proventos={proventos} 
          descontos={descontos} 
          respostaAi={calculation.resposta_ai} 
          otherResultDetails={calculation.tbl_resposta_calculo}
          onDataCleared={handleRefreshData}
          onReprocessed={handleRefreshData}
        />
      ) : (
        <Card className="max-w-4xl mx-auto bg-gray-900 border-gray-700 text-white">
          <CardHeader><CardTitle className="text-xl text-gray-400">Resultado</CardTitle></CardHeader>
          <CardContent><p>Ainda não há resultados de proventos ou descontos para este cálculo.</p></CardContent>
        </Card>
      )}
    </div>
  );
};

export default FullRescissionView;