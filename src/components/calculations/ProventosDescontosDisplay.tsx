import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Provento {
  id: string;
  nome_provento: string;
  valor_calculado: number;
  natureza_da_verba: string;
  legislacao: string | null;
}

interface Desconto {
  id: string;
  nome_desconto: string;
  valor_calculado: number;
  natureza_da_verba: string;
  legislacao: string | null;
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

  return (
    <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-orange-500">Resumo Financeiro Detalhado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {proventos.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">Proventos</h3>
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-gray-800 hover:bg-gray-800">
                    <TableHead className="text-orange-400">Verba</TableHead>
                    <TableHead className="text-orange-400">Natureza</TableHead>
                    <TableHead className="text-orange-400 text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proventos.map((provento) => (
                    <TableRow key={provento.id} className="border-gray-700 hover:bg-gray-800">
                      <TableCell className="font-medium text-gray-200">{provento.nome_provento}</TableCell>
                      <TableCell className="text-gray-300">{provento.natureza_da_verba}</TableCell>
                      <TableCell className="text-right text-green-400">{formatCurrency(provento.valor_calculado)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-800 hover:bg-gray-800 font-bold text-lg border-t-2 border-orange-500">
                    <TableCell colSpan={2} className="text-orange-400">Total Proventos</TableCell>
                    <TableCell className="text-right text-green-400">{formatCurrency(totalProventos)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {descontos.length > 0 && (
          <div>
            <h3 className="text-xl font-bold text-orange-400 mb-4 text-center">Descontos</h3>
            <div className="overflow-x-auto">
              <Table className="w-full min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-gray-800 hover:bg-gray-800">
                    <TableHead className="text-orange-400">Verba</TableHead>
                    <TableHead className="text-orange-400">Natureza</TableHead>
                    <TableHead className="text-orange-400 text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {descontos.map((desconto) => (
                    <TableRow key={desconto.id} className="border-gray-700 hover:bg-gray-800">
                      <TableCell className="font-medium text-gray-200">{desconto.nome_desconto}</TableCell>
                      <TableCell className="text-gray-300">{desconto.natureza_da_verba}</TableCell>
                      <TableCell className="text-right text-red-400">-{formatCurrency(desconto.valor_calculado)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-800 hover:bg-gray-800 font-bold text-lg border-t-2 border-orange-500">
                    <TableCell colSpan={2} className="text-orange-400">Total Descontos</TableCell>
                    <TableCell className="text-right text-red-400">-{formatCurrency(totalDescontos)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {(proventos.length > 0 || descontos.length > 0) && (
          <div className="mt-8 p-4 bg-gray-800 border border-orange-500 rounded-md text-center">
            <h3 className="text-2xl font-bold text-orange-500 mb-2">Valor Líquido a Receber</h3>
            <p className="text-5xl font-extrabold text-green-500">
              {formatCurrency(valorLiquido)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProventosDescontosDisplay;