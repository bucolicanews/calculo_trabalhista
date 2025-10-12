import React from 'react';

// Importar componentes auxiliares existentes
import CalculationDetailsCard from './CalculationDetailsCard';
import ProventosDescontosDisplay from './ProventosDescontosDisplay';

// Importar as interfaces de Provento e Desconto
import { Provento, Desconto } from '@/hooks/useCalculationDetails';

// Interface para os dados principais do cálculo
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
    tbl_clientes: { nome: string } | null;
    tbl_sindicatos: { nome: string } | null;
    tbl_ai_prompt_templates: {
        title: string;
        estrutura_json_modelo_saida: string | null; // Adicionado
        instrucoes_entrada_dados_rescisao: string | null;
    } | null;
}

// Interface para o componente FullRescissionView
interface FullRescissionViewProps {
    calculationDetails: CalculationDataForDetailsCard;
    proventos: Provento[];
    descontos: Desconto[];
}

export const FullRescissionView: React.FC<FullRescissionViewProps> = ({
    calculationDetails,
    proventos,
    descontos,
}) => {
    return (
        // --- MUDANÇA: 'p-4' foi trocado por 'py-4' ---
        // Isso remove o padding horizontal (px) e mantém apenas o vertical (py).
        <div className="py-4 w-full">
            <h1 className="text-3xl font-bold text-center text-orange-500 mb-6 px-4">
                Demonstrativo Completo da Rescisão
            </h1>

            {/* 1. Detalhes Principais do Cálculo */}
            <CalculationDetailsCard calculation={calculationDetails} />

            <div className="space-y-8 mt-8">
                {/* 2. Proventos e Descontos */}
                <ProventosDescontosDisplay
                    proventos={proventos}
                    descontos={descontos}
                />

                {/* 3. Resumo Final da Rescisão */}
            </div>
        </div>
    );
};

export default FullRescissionView;