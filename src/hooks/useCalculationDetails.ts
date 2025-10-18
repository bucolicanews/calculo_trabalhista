// useCalculationDetails.ts

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { showError } from '@/utils/toast';

// --- Interfaces de Verbas (Mapeamento do DB) ---
export interface Provento {
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
    memoria_calculo: string | null;
}

export interface Desconto {
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
    memoria_calculo: string | null;
}

// --- Interface Principal (Mapeamento da Tabela tbl_calculos) ---
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
    vale_transporte: boolean; // Campo Adicionado
    media_descontos: number;
    media_remuneracoes: number;
    carga_horaria: string | null;
    created_at: string;
    resposta_ai: any | null;
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
        observacoes_base_legal: string;
        estrutura_json_modelo_saida: string | null;
        instrucoes_entrada_dados_rescisao: string | null;
        created_at: string;
    } | null;
    tbl_resposta_calculo: {
        url_documento_calculo: string | null;
        texto_extraido: string | null;
        data_hora: string;
    } | null;
    tbl_proventos: Provento[]; // Corrigido para array
    tbl_descontos: Desconto[]; // Corrigido para array
}

// --- Hook ---
interface UseCalculationDetailsResult {
    calculation: CalculationDetails | null;
    loading: boolean;
    hasAnyResult: boolean;
}

export const useCalculationDetails = (calculationId: string | undefined): UseCalculationDetailsResult => {
    const { user } = useAuth();
    const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
    const [loading, setLoading] = useState(true);
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
                    tbl_ai_prompt_templates(
                        id, title, identificacao, comportamento, restricoes, atribuicoes, leis, observacoes_base_legal, 
                        estrutura_json_modelo_saida, instrucoes_entrada_dados_rescisao, created_at
                    ),
                    tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora),
                    tbl_proventos(*),
                    tbl_descontos(*)
                `)
                .eq('id', calculationId)
                .single();

            if (error) {
                showError('Erro ao carregar resultado do cálculo: ' + error.message);
                console.error('Error fetching calculation result:', error);
                setCalculation(null);
            } else if (data) {
                
                // Mapeamento explícito para garantir tipos de array e evitar 'null'
                const details = data as unknown as Omit<CalculationDetails, 'tbl_proventos' | 'tbl_descontos'> & {
                    tbl_proventos: Provento[] | null;
                    tbl_descontos: Desconto[] | null;
                };

                const finalCalculation: CalculationDetails = {
                    ...details,
                    // Garante que sejam arrays (corrigindo o problema de renderização)
                    tbl_proventos: details.tbl_proventos || [],
                    tbl_descontos: details.tbl_descontos || [],
                };
                
                setCalculation(finalCalculation);
                
                setHasAnyResult(
                    !!finalCalculation.resposta_ai || 
                    !!finalCalculation.tbl_resposta_calculo?.url_documento_calculo || 
                    !!finalCalculation.tbl_resposta_calculo?.texto_extraido ||
                    (finalCalculation.tbl_proventos.length > 0) || 
                    (finalCalculation.tbl_descontos.length > 0)    
                );
            } else {
                setCalculation(null);
                setHasAnyResult(false);
            }
            setLoading(false);
        };

        fetchCalculationResult();
    }, [user, calculationId]);

    return { calculation, loading, hasAnyResult };
};