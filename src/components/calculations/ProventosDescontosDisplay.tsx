import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

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
  memoria_calculo: string | null; // Novo campo
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
  memoria_calculo: string | null; // Novo campo
}

interface ProventosDescontosDisplayProps {
  proventos: Provento[];
  descontos: Desconto[];
}

const ProventosDescontosDisplay: React.FC<ProventosDescontosDisplayProps> = ({ proventos, descontos }) => {
  const totalProventos = proventos.reduce((sum, p) => sum + p.valor_calculado, 0);
  const totalDescontos = descontos.reduce((sum, d) => sum + d.valor_calculado, 0);
  const valorLiquido = totalProventos - totalDescontos;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (proventos.length === 0 && descontos.length === 0) {
    return null; // Não renderiza se não houver dados
  }

  // Coletar todas as legislações únicas
  const allLegislations = new Set<string>();
  proventos.forEach(p => {
    if (p.legislacao) allLegislations.add(p.legislacao);
  });
  descontos.forEach(d => {
    if (d.legislacao) allLegislations.add(d.legislacao);
  });
  const uniqueLegislations = Array.from(allLegislations);

  const renderItemDetails = (item: Provento | Desconto) => (
    <div className="p-3 bg-gray-800 border-t border-gray-700 text-sm text-gray-300 space-y-2">
      {/* 🛑 CAMPO: Memória de Cálculo */}
      {item.memoria_calculo && (
        <p>
          <strong>Memória de Cálculo:</strong>
          <span className="text-orange-300 ml-1 whitespace-pre-wrap">{item.memoria_calculo}</span>
        </p>
      )}

      {/* Detalhes Técnicos */}
      {item.formula_sugerida && (
        <p><strong>Fórmula Sugerida:</strong> <span className="font-mono bg-gray-700 px-1 rounded">{item.formula_sugerida.replace(/_/g, ' ')}</span></p>
      )}
      {item.parametro_calculo && (
        <p><strong>Parâmetro de Cálculo:</strong> {item.parametro_calculo.replace(/_/g, ' ')}</p>
      )}
      {item.exemplo_aplicavel && (
        <p><strong>Exemplo Aplicável:</strong> {item.exemplo_aplicavel}</p>
      )}
      {item.legislacao && (
        <p><strong>Legislação Específica:</strong> {item.legislacao}</p>
      )}
    </div>
  );

  // Componente que renderiza um item completo da tabela
  const TableItem = ({ item, isProvento }: { item: Provento | Desconto, isProvento: boolean }) => (
    // Usa Collapsible como um elemento invisível (asChild) que fornece o contexto Radix
    <Collapsible asChild>
      <React.Fragment>
        {/* TR 1: A Linha Principal (Gatilho) */}
        <CollapsibleTrigger asChild>
          <TableRow className="border-gray-700 hover:bg-gray-800 cursor-pointer">
            <TableCell className="font-medium text-gray-200 w-2/5 break-words">
              {item.nome_provento ? item.nome_provento.replace(/_/g, ' ') : item.nome_desconto.replace(/_/g, ' ')}
            </TableCell>
            <TableCell className="text-gray-300 w-1/5">{item.natureza_da_verba.replace(/_/g, ' ')}</TableCell>
            <TableCell className={`text-right w-1/5 ${isProvento ? 'text-green-400' : 'text-red-400'}`}>
              {isProvento ? formatCurrency(item.valor_calculado) : `-${formatCurrency(item.valor_calculado)}`}
            </TableCell>
            <TableCell className="text-right w-[30px]">
              <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
            </TableCell>
          </TableRow>
        </CollapsibleTrigger>

        {/* TR 2: A Linha de Conteúdo (Content) - Must be directly under the same parent as the Trigger */}
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


  return (
    // Removido max-w-4xl mx-auto para ocupar 100% da largura do contêiner pai
    <Card className="w-full bg-gray-900 border-orange-500 text-white mb-8">
      <CardHeader>
        <CardTitle className="w-full text-2xl text-orange-500">Resumo Financeiro Detalhado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">

        {/* === PROVENTOS === */}
        {proventos.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">Proventos</h3>
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
                  {/* 🛑 ITERAÇÃO: Usamos o TableItem que contém o Collapsible completo */}
                  {proventos.map((provento) => (
                    <TableItem key={provento.id} item={provento} isProvento={true} />
                  ))}
                  {/* Total */}
                  <TableRow className="bg-gray-800 hover:bg-gray-800 font-bold text-lg border-t-2 border-orange-500">
                    <TableCell colSpan={2} className="text-orange-400">Total Proventos</TableCell>
                    <TableCell className="text-right text-green-400">{formatCurrency(totalProventos)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* === DESCONTOS === */}
        {descontos.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">Descontos</h3>
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
                  {descontos.map((desconto) => (
                    // 🛑 ITERAÇÃO CORRIGIDA
                    <TableItem key={desconto.id} item={desconto} isProvento={false} />
                  ))}
                  {/* Total */}
                  <TableRow className="bg-gray-800 hover:bg-gray-800 font-bold text-lg border-t-2 border-orange-500">
                    <TableCell colSpan={2} className="text-orange-400">Total Descontos</TableCell>
                    <TableCell className="text-right text-red-400">-{formatCurrency(totalDescontos)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

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
