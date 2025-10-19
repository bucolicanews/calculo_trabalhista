import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
// Importando as interfaces mapeadas que o hook retorna
import { ProventoDisplay, DescontoDisplay } from '@/hooks/useCalculationDetails'; 

interface ProventosDescontosDisplayProps {
    // Usando as interfaces que o hook retorna (formato mapeado N8N)
    proventos: ProventoDisplay[];
    descontos: DescontoDisplay[];
}

// União das interfaces para uso na lógica genérica
type VerbaItem = ProventoDisplay | DescontoDisplay;

const ProventosDescontosDisplay: React.FC<ProventosDescontosDisplayProps> = ({ proventos, descontos }) => {
    
    // === LÓGICA AUXILIAR DE AGRUPAMENTO ===
    
    // 🛑 CORRIGIDO: Garante que 'Provento' ou 'Desconto' nunca é null/undefined antes de ser processado.
    const getVerbaName = (item: VerbaItem) => {
        let name;
        if (item.hasOwnProperty('Provento')) {
            name = (item as ProventoDisplay).Provento;
        } else {
            name = (item as DescontoDisplay).Desconto;
        }
        // Retorna a string ou uma string de fallback segura
        return name || 'Verba Desconhecida';
    };

    const isProvento = (item: VerbaItem) => item.hasOwnProperty('Provento');

    const getGroupNameAndOrder = (name: string): { group: string, order: number } => {
        // Esta linha agora está segura
        const lowerName = name.toLowerCase();

        // Descontos
        if (lowerName.includes('inss') || lowerName.includes('irrf')) return { group: '1. Descontos Obrigatórios (INSS/IRRF)', order: 1 };
        if (lowerName.includes('aviso_prévio_indenizado_pelo_empregado') && !isProvento({ Provento: name } as VerbaItem)) return { group: '2. Descontos Autorizados (Aviso/Faltas)', order: 2 };
        if (lowerName.includes('faltas') || lowerName.includes('adiantamento') || lowerName.includes('vale') || lowerName.includes('empréstimo') || lowerName.includes('dano') || lowerName.includes('sindical')) return { group: '2. Descontos Autorizados (Aviso/Faltas)', order: 2 };

        // Proventos
        if (lowerName.includes('saldo_de_salário') || lowerName.includes('base_de_cálculo') || lowerName.includes('diferença_salarial') || lowerName.includes('media')) return { group: '3. Base e Salário', order: 3 };
        if (lowerName.includes('férias') || lowerName.includes('um_terço')) return { group: '4. Férias e 1/3', order: 4 };
        if (lowerName.includes('13º') || lowerName.includes('decimo')) return { group: '5. Décimo Terceiro', order: 5 };
        if (lowerName.includes('aviso_prévio_indenizado_pelo_empregador')) return { group: '6. Aviso Prévio Indenizado', order: 6 };
        if (lowerName.includes('hora_extra') || lowerName.includes('adicional') || lowerName.includes('dsr') || lowerName.includes('feriado') || lowerName.includes('banco_de_horas') || lowerName.includes('diárias') || lowerName.includes('gorjetas') || lowerName.includes('biênio') || lowerName.includes('triênio')) return { group: '7. Adicionais e Extras', order: 7 };
        if (lowerName.includes('fgts') || lowerName.includes('multa') || lowerName.includes('indenização') || lowerName.includes('art_477')) return { group: '8. Indenizações e Irregularidades', order: 8 };
        if (lowerName.includes('auxílio') || lowerName.includes('salário_família') || lowerName.includes('quebra_de_caixa')) return { group: '9. Benefícios e Outros', order: 9 };
        
        return { group: 'Z. Outras Verbas', order: 10 };
    };

    const groupItemsForRendering = (items: VerbaItem[]) => {
        const grouped: { [key: string]: VerbaItem[] } = {};
        items.forEach(item => {
            const name = getVerbaName(item);
            const { group: groupName } = getGroupNameAndOrder(name);
            
            if (!grouped[groupName]) {
                grouped[groupName] = [];
            }
            grouped[groupName].push(item);
        });
        return grouped;
    };
    // ================================================================
    
    // === 2. Cálculos e Preparação ===
    // 🛑 CORREÇÃO: Usar encadeamento opcional para evitar 'Cannot read properties of undefined (reading 'Valor')'
    const totalProventos = proventos.reduce((sum, p) => sum + (p.Cálculo?.Valor || 0), 0);
    const totalDescontos = descontos.reduce((sum, d) => sum + (d.Cálculo?.Valor || 0), 0);
    const valorLiquido = totalProventos - totalDescontos;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    if (proventos.length === 0 && descontos.length === 0) {
        return null; 
    }

    // Coletar todas as legislações únicas
    const allLegislations = new Set<string>();
    [...proventos, ...descontos].forEach(p => {
        if (p.Legislação) allLegislations.add(p.Legislação);
    });
    const uniqueLegislations = Array.from(allLegislations);

    const groupedProventos = groupItemsForRendering(proventos);
    const groupedDescontos = groupItemsForRendering(descontos);

    // === 3. Funções de Renderização ===

    const renderItemDetails = (item: VerbaItem) => (
        <div className="p-3 bg-gray-800 border-t border-gray-700 text-sm text-gray-300 space-y-2">
            
            {/* Memória de Cálculo */}
            {item.Memoria_de_Calculo && (
                <p>
                    <strong>Memória de Cálculo:</strong>
                    <span className="text-orange-300 ml-1 whitespace-pre-wrap">{item.Memoria_de_Calculo}</span>
                </p>
            )}

            {/* Detalhes Técnicos (usando encadeamento opcional) */}
            {item.Cálculo?.Fórmula_Sugerida && (
                <p><strong>Fórmula Sugerida:</strong> <span className="font-mono bg-gray-700 px-1 rounded">{item.Cálculo.Fórmula_Sugerida.replace(/_/g, ' ')}</span></p>
            )}
            {item.Cálculo?.Parametro && (
                <p><strong>Parâmetro de Cálculo:</strong> {item.Cálculo.Parametro.replace(/_/g, ' ')}</p>
            )}
            {item.Exemplos_Aplicaveis && (
                <p><strong>Exemplo Aplicável:</strong> {item.Exemplos_Aplicaveis}</p>
            )}
            {item.Legislação && (
                <p><strong>Legislação Específica:</strong> {item.Legislação}</p>
            )}
        </div>
    );

    const TableItem = ({ item }: { item: VerbaItem }) => {
        const isP = isProvento(item);
        const name = getVerbaName(item);
        const value = item.Cálculo?.Valor || 0;
        
        // Remove o prefixo de agrupamento
        const displayName = name.replace(/^\d+\.\s*/, ''); 
        
        return (
            <Collapsible asChild>
                <React.Fragment>
                    <CollapsibleTrigger asChild>
                        <TableRow className="border-gray-700 hover:bg-gray-800 cursor-pointer">
                            <TableCell className="font-medium text-gray-200 w-2/5 break-words">
                                {displayName.replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell className="text-gray-300 w-1/5">{item.Natureza_da_Verba.replace(/_/g, ' ')}</TableCell>
                            <TableCell className={`text-right w-1/5 ${isP ? 'text-green-400' : 'text-red-400'}`}>
                                {isP ? formatCurrency(value) : `-${formatCurrency(value)}`}
                            </TableCell>
                            <TableCell className="text-right w-[30px]">
                                <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                            </TableCell>
                        </TableRow>
                    </CollapsibleTrigger>

                    <CollapsibleContent asChild>
                        <TableRow className="bg-gray-800">
                            <TableCell colSpan={4} className="p-0 border-t border-orange-500">
                                {renderItemDetails(item)}
                            </TableCell>
                        </TableRow>
                    </CollapsibleContent>
                </React.Fragment>
            </Collapsible>
        );
    };


    const renderGroupedTable = (groupedItems: { [key: string]: VerbaItem[] }, isP: boolean) => {
        const total = isP ? totalProventos : totalDescontos;
        const title = isP ? 'Proventos' : 'Descontos';
        const totalText = isP ? 'Total Proventos' : 'Total Descontos';
        const totalClassName = isP ? 'text-green-400' : 'text-red-400';
        
        // Ordenação garantida pelo prefixo (1., 2., 3., ...)
        const sortedGroups = Object.keys(groupedItems).sort();

        return (
            <div>
                <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">
                    {title}
                </h3>
                <div className="overflow-x-auto">
                    <Table className="w-full min-w-[700px]">
                        <TableHeader>
                            <TableRow className="bg-gray-800 hover:bg-gray-800">
                                <TableHead className="text-orange-400 w-2/5">Verba</TableHead>
                                <TableHead className="text-orange-400 w-1/5">Natureza</TableHead>
                                <TableHead className="text-orange-400 text-right w-1/5">Valor</TableHead>
                                <TableHead className="w-[30px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedGroups.map(groupName => (
                                <React.Fragment key={groupName}>
                                    <TableRow className="bg-gray-700/50 hover:bg-gray-700/50 font-semibold">
                                        <TableCell colSpan={4} className="text-orange-300 text-sm py-1">
                                            {/* Remove o prefixo de ordenação do nome do grupo */}
                                            {groupName.replace(/^\d+\.\s*/, '').trim()}
                                        </TableCell>
                                    </TableRow>
                                    {groupedItems[groupName].map((item, index) => (
                                        <TableItem 
                                            key={`${getVerbaName(item)}-${index}`} 
                                            item={item} 
                                        />
                                    ))}
                                </React.Fragment>
                            ))}
                            <TableRow className="bg-gray-800 hover:bg-gray-800 font-bold text-lg border-t-2 border-orange-500">
                                <TableCell colSpan={2} className="text-orange-400">{totalText}</TableCell>
                                <TableCell className={`text-right ${totalClassName}`}>
                                    {isP ? formatCurrency(total) : `-${formatCurrency(total)}`}
                                </TableCell>
                                <TableCell></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    // === 4. Renderização Final (Ordem: Descontos > Proventos) ===
    return (
        <Card className="w-full bg-gray-900 border-orange-500 text-white mb-8">
            <CardHeader>
                <CardTitle className="w-full text-2xl text-orange-500">Resumo Financeiro Detalhado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                
                {/* 🔴 DESCONTOS (PRIMEIRO) */}
                {descontos.length > 0 && renderGroupedTable(groupedDescontos, false)}
                
                {/* 🟢 PROVENTOS (DEPOIS) */}
                {proventos.length > 0 && renderGroupedTable(groupedProventos, true)}

                {/* VALOR LÍQUIDO FINAL */}
                {(proventos.length > 0 || descontos.length > 0) && (
                    <div className="mt-8 p-4 bg-gray-800 border border-orange-500 rounded-md text-center">
                        <h5 className="text-2xl font-bold text-orange-500 mb-2">Valor Líquido a Receber</h5>
                        <p className="text-3xl font-extrabold text-green-500">
                            {formatCurrency(valorLiquido)}
                        </p>
                    </div>
                )}

                {/* BASE LEGAL */}
                {uniqueLegislations.length > 0 && (
                    <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-md">
                        <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">Base Legal Aplicada</h3>
                        <ul className="list-disc list-inside text-gray-300 space-y-1">
                            {uniqueLegislations.map((leg) => (
                                <li key={leg}>{leg.replace(/_/g, ' ')}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ProventosDescontosDisplay;