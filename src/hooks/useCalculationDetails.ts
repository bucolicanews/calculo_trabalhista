import { useState, useEffect } from 'react'; // Adicionado para resolver TS2304 e TS2306
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

// Reexporta as interfaces originais para uso fora do hook (caso o componente Display as use)
export interface Provento {
// ... (código omitido)
    tbl_descontos: Desconto[] | null;
}

// === NOVAS INTERFACES PARA O FORMATO DE EXIBIÇÃO (N8N-STYLE) ===
// ... (código omitido)

// ================================================================

export const useCalculationDetails = (calculationId: string | undefined): UseCalculationDetailsResult => {
    const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
    const [displayProventos, setDisplayProventos] = useState<ProventoDisplay[]>([]);
    const [displayDescontos, setDisplayDescontos] = useState<DescontoDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasAnyResult, setHasAnyResult] = useState(false);

    useEffect(() => {
        if (!calculationId) {
            setLoading(false);
            return;
        }

        const fetchCalculationResult = async () => {
            setLoading(true);
            
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('tbl_calculos')
                .select(`
                    *,
                    tbl_clientes(nome),
                    tbl_sindicatos(nome),
                    tbl_ai_prompt_templates(*),
                    tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora),
                    tbl_proventos(*),
                    tbl_descontos(*)
                `)
                .eq('id', calculationId)
                .eq('user_id', user.id) // Filtro de segurança
                .single();

            if (error) {
                showError('Erro ao carregar detalhes do cálculo: ' + error.message);
                console.error('Error fetching calculation details:', error);
                setCalculation(null);
                setHasAnyResult(false);
            } else {
                const details = data as unknown as CalculationDetails;
                setCalculation(details);
                // CORREÇÃO: Usando optional chaining para garantir que o resultado seja um booleano
                setHasAnyResult(!!details.resposta_ai || (details.tbl_proventos?.length > 0));

                const { displayProventos, displayDescontos } = mapSupabaseVerbasToDisplayFormat(
                    details.tbl_proventos,
                    details.tbl_descontos
                );
                setDisplayProventos(displayProventos);
                setDisplayDescontos(displayDescontos);
            }
            setLoading(false);
        };

        fetchCalculationResult();
    }, [calculationId]);

    return { calculation, displayProventos, displayDescontos, loading, hasAnyResult };
};