// src/components/FinancialItemsTable.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Interface para um item de Provento ou Desconto
interface ItemFinanceiro {
    id: string | number;
    descricao: string;
    valor: number;
    formula_aplicada?: string;
}

interface FinancialItemsTableProps {
    title: string;
    items: ItemFinanceiro[];
    total: number;
    isDiscount: boolean; // Para aplicar cores vermelhas (desconto) ou verdes (provento)
}

const FinancialItemsTable: React.FC<FinancialItemsTableProps> = ({ title, items, total, isDiscount }) => {
    const textColor = isDiscount ? 'text-red-400' : 'text-green-400';
    const totalLabel = isDiscount ? 'Total de Descontos' : 'Total de Proventos';

    return (
        <Card className="bg-gray-800 border-gray-700 text-white shadow-lg">
            <CardHeader className="p-4 border-b border-gray-700">
                <CardTitle className={`text-xl ${textColor}`}>{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <div className="space-y-2">
                    {/* Cabeçalho da Tabela */}
                    <div className="grid grid-cols-4 font-semibold text-sm text-gray-400 border-b border-gray-600 pb-1">
                        <span className="col-span-2">Descrição</span>
                        {/* Opcional: <span className="text-center">Fórmula</span> */}
                        <span className="text-right col-span-2">Valor (R$)</span>
                    </div>

                    {/* Linhas de Itens */}
                    {items.map((item) => (
                        <div key={item.id} className="grid grid-cols-4 text-sm border-b border-gray-700 py-1 last:border-b-0">
                            <span className="col-span-2 break-words">{item.descricao}</span>
                            {/* Opcional: <span className="text-center text-xs text-gray-500">{item.formula_aplicada || '-'}</span> */}
                            <span className={`text-right col-span-2 ${textColor} font-medium`}>{item.valor.toFixed(2)}</span>
                        </div>
                    ))}

                    {/* Linha do Total */}
                    <div className="grid grid-cols-4 font-bold text-lg pt-3 border-t border-gray-600">
                        <span className="col-span-2">{totalLabel}</span>
                        <span className={`text-right col-span-2 ${textColor}`}>R$ {total.toFixed(2)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default FinancialItemsTable;