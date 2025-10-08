import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { showError } from '@/utils/toast';
import { parseMarkdownTables, ParsedTable } from '@/utils/markdownParser';

export interface CalculationDetails {
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
    proventos: string;
    descontos: string;
    observacoes_base_legal: string;
    estrutura_json_modelo_saida: string | null; // NOVO CAMPO
    instrucoes_entrada_dados_rescisao: string | null; // NOVO CAMPO
    created_at: string;
  } | null;
  tbl_resposta_calculo: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
}

interface UseCalculationDetailsResult {
  calculation: CalculationDetails | null;
  loading: boolean;
  parsedTables: ParsedTable[];
  hasAnyResult: boolean;
}

export const useCalculationDetails = (calculationId: string | undefined): UseCalculationDetailsResult => {
  const { user } = useAuth();
  const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [parsedTables, setParsedTables] = useState<ParsedTable[]>([]);
  const [hasAnyResult, setHasAnyResult] = useState(false);

  useEffect(() => {
    if (!user || !calculationId) {
      setLoading(false);
      return;
    }

    const fetchCalculationResult = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('tbl_calculos')
        .select(`
          *,
          resposta_ai,
          tbl_clientes(nome),
          tbl_sindicatos(nome),
          tbl_ai_prompt_templates(id, title, identificacao, comportamento, restricoes, atribuicoes, leis, proventos, descontos, observacoes_base_legal, estrutura_json_modelo_saida, instrucoes_entrada_dados_rescisao, created_at),
          tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora)
        `)
        .eq('id', calculationId)
        .single();

      if (error) {
        showError('Erro ao carregar resultado do cálculo: ' + error.message);
        console.error('Error fetching calculation result:', error);
        setCalculation(null);
      } else if (data) {
        setCalculation(data as CalculationDetails);
        const tables = data.resposta_ai ? parseMarkdownTables(data.resposta_ai) : [];
        setParsedTables(tables);
        setHasAnyResult(
          !!data.resposta_ai || 
          !!data.tbl_resposta_calculo?.url_documento_calculo || 
          !!data.tbl_resposta_calculo?.texto_extraido
        );
      } else {
        setCalculation(null);
        setParsedTables([]);
        setHasAnyResult(false);
      }
      setLoading(false);
    };

    fetchCalculationResult();
  }, [user, calculationId]);

  return { calculation, loading, parsedTables, hasAnyResult };
};