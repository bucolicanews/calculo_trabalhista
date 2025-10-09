import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
// Removidas as importações de 'format' e 'ptBR' pois não são usadas diretamente aqui.

// Importar componentes auxiliares existentes
import CalculationDetailsCard from './CalculationDetailsCard';
import ProventosDescontosDisplay from './ProventosDescontosDisplay';

// Importar as interfaces de Provento e Desconto de um local centralizado (useCalculationDetails.ts)
// Isso garante que os tipos sejam consistentes em toda a aplicação.
import { Provento, Desconto } from '@/hooks/useCalculationDetails';

// Interface para os dados principais do cálculo (para CalculationDetailsCard)
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
        estrutura_json_modelo_saida: string | null;
        instrucoes_entrada_dados_rescisao: string | null;
    } | null;
}

// Interface para o componente FullRescissionView
interface FullRescissionViewProps {
    calculationDetails: CalculationDataForDetailsCard;
    proventos: Provento[]; // Usando a interface importada
    descontos: Desconto[]; // Usando a interface importada
}

export const FullRescissionView: React.FC<FullRescissionViewProps> = ({
    calculationDetails,
    proventos,
    descontos,
}) => {
    // O ProventosDescontosDisplay já calcula os totais e o líquido.
    // Para o resumo final, podemos recalcular aqui ou extrair do ProventosDescontosDisplay se ele expor.
    // Por simplicidade, vamos recalcular para o card de resumo.
    const totalProventos = proventos.reduce((acc, item) => acc + item.valor_calculado, 0);
    const totalDescontos = descontos.reduce((acc, item) => acc + item.valor_calculado, 0);
    const liquidoReceber = totalProventos - totalDescontos;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-center text-orange-500 mb-6">Demonstrativo Completo da Rescisão</h1>

            {/* 1. Detalhes Principais do Cálculo */}
            <CalculationDetailsCard calculation={calculationDetails} />

            <div className="space-y-8 mt-8">
                {/* 2. Proventos e Descontos */}
                <ProventosDescontosDisplay
                    proventos={proventos}
                    descontos={descontos}
                />

                {/* 3. Resumo Final da Rescisão */}
                <Card className="bg-gray-900 border-4 border-orange-500 text-white shadow-2xl">
                    <CardContent className="flex flex-col sm:flex-row justify-between items-center p-6 space-y-4 sm:space-y-0">
                        <h2 className="text-3xl font-extrabold text-orange-500">Valor Líquido a Receber</h2>
                        <div className="text-4xl font-extrabold">
                            <span className={liquidoReceber >= 0 ? 'text-green-400' : 'text-red-400'}>
                                R$ {liquidoReceber.toFixed(2)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FullRescissionView;