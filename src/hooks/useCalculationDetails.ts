import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { showError } from '@/utils/toast';

// Reexporta as interfaces originais para uso fora do hook (caso o componente Display as use)
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
    tbl_proventos: Provento[] | null;
    tbl_descontos: Desconto[] | null;
}

// === NOVAS INTERFACES PARA O FORMATO DE EXIBIÇÃO (N8N-STYLE) ===
// Isso permite que o componente de exibição funcione como está
interface CalculoDisplay {
    Valor: number;
    Parametro: string | null;
    Fórmula_Sugerida: string | null;
}

export interface ProventoDisplay {
    Cálculo: CalculoDisplay;
    Provento: string; // Nome da verba mapeado
    Legislação: string | null;
    Natureza_da_Verba: string;
    Memoria_de_Calculo: string | null;
    Exemplos_Aplicaveis: string | null;
}

export interface DescontoDisplay {
    Cálculo: CalculoDisplay;
    Desconto: string; // Nome da verba mapeado
    Legislação: string | null;
    Natureza_da_Verba: string;
    Memoria_de_Calculo: string | null;
    Exemplos_Aplicaveis: string | null;
}

// Definição do resultado que será usado pelo componente de exibição
interface UseCalculationDetailsResult {
    calculation: CalculationDetails | null;
    displayProventos: ProventoDisplay[];
    displayDescontos: DescontoDisplay[];
    loading: boolean;
    hasAnyResult: boolean;
}

/**
 * Mapeia os dados flat de proventos/descontos do Supabase para o formato
 * aninhado JSON do N8N (Ex: { Provento: '...', Cálculo: { Valor: 100 } }).
 */
const mapSupabaseVerbasToDisplayFormat = (proventos: Provento[] | null, descontos: Desconto[] | null) => {
    // Garante que proventos e descontos são arrays antes de mapear
    const safeProventos = proventos || [];
    const safeDescontos = descontos || [];

    const displayProventos: ProventoDisplay[] = safeProventos.map(p => ({
        Provento: p.nome_provento,
        Natureza_da_Verba: p.natureza_da_verba,
        Legislação: p.legislacao,
        Memoria_de_Calculo: p.memoria_calculo,
        Exemplos_Aplicaveis: p.exemplo_aplicavel,
        Cálculo: {
            Valor: p.valor_calculado,
            Parametro: p.parametro_calculo,
            Fórmula_Sugerida: p.formula_sugerida,
        }
    }));

    const displayDescontos: DescontoDisplay[] = safeDescontos.map(d => ({
        Desconto: d.nome_desconto,
        Natureza_da_Verba: d.natureza_da_verba,
        Legislação: d.legislacao,
        Memoria_de_Calculo: d.memoria_calculo,
        Exemplos_Aplicaveis: d.exemplo_aplicavel,
        Cálculo: {
            Valor: d.valor_calculado,
            Parametro: d.parametro_calculo,
            Fórmula_Sugerida: d.formula_sugerida,
        }
    }));
    
    // Organiza os descontos primeiro (INSS/IRRF) e depois proventos por afinidade
    const organizedDescontos = organizeAndSortVerbas(displayDescontos, 'desconto') as DescontoDisplay[];
    const organizedProventos = organizeAndSortVerbas(displayProventos, 'provento') as ProventoDisplay[];

    return { displayProventos: organizedProventos, displayDescontos: organizedDescontos };
};


// === FUNÇÃO DE AGRUPAMENTO E ORDENAÇÃO POR AFINIDADE ===
const organizeAndSortVerbas = (items: Array<ProventoDisplay | DescontoDisplay>, type: 'provento' | 'desconto') => {
    
    const getVerbaName = (item: ProventoDisplay | DescontoDisplay) => type === 'provento' ? (item as ProventoDisplay).Provento : (item as DescontoDisplay).Desconto;

    // Mapeia o nome da verba para um grupo de afinidade e uma ordem interna
    const groupMapping = (name: string): { group: string, order: number } => {
        const lowerName = name.toLowerCase();

        // GRUPO 1: Descontos Obrigatórios (INSS/IRRF)
        if (lowerName.includes('inss') || lowerName.includes('irrf')) {
            return { group: '1. Descontos Obrigatórios', order: 1 };
        }
        // GRUPO 2: Descontos Autorizados (Vales/Adiantamentos)
        if (lowerName.includes('adiantamento') || lowerName.includes('vale') || lowerName.includes('empréstimo') || lowerName.includes('dano') || lowerName.includes('sindical') || lowerName.includes('aviso_prévio_indenizado_pelo_empregado') || lowerName.includes('faltas')) {
            return { group: '2. Descontos Autorizados', order: 2 };
        }
        // GRUPO 3: Salário/Base
        if (lowerName.includes('saldo_de_salário') || lowerName.includes('base_de_cálculo') || lowerName.includes('diferença_salarial') || lowerName.includes('media') || lowerName.includes('diárias') || lowerName.includes('gorjetas')) {
            return { group: '3. Base e Salário', order: 3 };
        }
        // GRUPO 4: Férias
        if (lowerName.includes('férias') || lowerName.includes('um_terço')) {
            return { group: '4. Férias e 1/3', order: 4 };
        }
        // GRUPO 5: 13º Salário
        if (lowerName.includes('13º') || lowerName.includes('decimo')) {
            return { group: '5. Décimo Terceiro', order: 5 };
        }
        // GRUPO 6: Aviso Prévio (Proventos)
        if (lowerName.includes('aviso_prévio_indenizado_pelo_empregador')) {
            return { group: '6. Aviso Prévio', order: 6 };
        }
        // GRUPO 7: Adicionais/Extras/DSR
        if (lowerName.includes('hora_extra') || lowerName.includes('adicional') || lowerName.includes('dsr') || lowerName.includes('feriado') || lowerName.includes('banco_de_horas') || lowerName.includes('biênio') || lowerName.includes('triênio') || lowerName.includes('quadriênio') || lowerName.includes('tempo_de_serviço')) {
            return { group: '7. Adicionais e Extras', order: 7 };
        }
        // GRUPO 8: Indenizações/Multas/FGTS
        if (lowerName.includes('fgts') || lowerName.includes('multa') || lowerName.includes('indenização') || lowerName.includes('lei_6.708')) {
            return { group: '8. Indenizações e Irregularidades', order: 8 };
        }
        // GRUPO 9: Benefícios/Outros
        if (lowerName.includes('auxílio') || lowerName.includes('salário_família') || lowerName.includes('quebra_de_caixa')) {
            return { group: '9. Benefícios e Outros', order: 9 };
        }
        
        return { group: 'Z. Outras Verbas', order: 10 };
    };

    const itemsWithOrder = items.map(item => ({
        ...item,
        ...groupMapping(getVerbaName(item)),
    }));

    // Ordena pelo grupo de afinidade (order) e depois pelo nome da verba (para consistência)
    itemsWithOrder.sort((a, b) => {
        if (a.order !== b.order) {
            return a.order - b.order;
        }
        return getVerbaName(a).localeCompare(getVerbaName(b));
    });

    // Remove as chaves de organização antes de retornar, mantendo o tipo original (ProventoDisplay/DescontoDisplay)
    return itemsWithOrder.map(({ group, order, ...rest }) => rest);
};

// ================================================================

export const useCalculationDetails = (calculationId: string | undefined): UseCalculationDetailsResult => {
    const { user } = useAuth();
    const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
    const [displayProventos, setDisplayProventos] = useState<ProventoDisplay[]>([]);
    const [displayDescontos, setDisplayDescontos] = useState<DescontoDisplay[]>([]);
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
                setDisplayProventos([]);
                setDisplayDescontos([]);
            } else if (data) {
                const fetchedData = data as unknown as CalculationDetails;
                
                // === PONTO CRÍTICO: Mapeamento e Organização ===
                const { displayProventos, displayDescontos } = mapSupabaseVerbasToDisplayFormat(
                    fetchedData.tbl_proventos,
                    fetchedData.tbl_descontos
                );

                setCalculation(fetchedData);
                setDisplayProventos(displayProventos);
                setDisplayDescontos(displayDescontos);
                
                // Atualiza o hasAnyResult
                setHasAnyResult(
                    !!fetchedData.resposta_ai || 
                    !!fetchedData.tbl_resposta_calculo?.url_documento_calculo || 
                    !!fetchedData.tbl_resposta_calculo?.texto_extraido ||
                    displayProventos.length > 0 || 
                    displayDescontos.length > 0
                );
            } else {
                setCalculation(null);
                setDisplayProventos([]);
                setDisplayDescontos([]);
                setHasAnyResult(false);
            }
            setLoading(false);
        };

        fetchCalculationResult();
    }, [user, calculationId]);

    // Retorna os arrays mapeados para serem usados no componente de exibição
    return { calculation, displayProventos, displayDescontos, loading, hasAnyResult };
};