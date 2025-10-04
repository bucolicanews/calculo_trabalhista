import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalculationDetailsCardProps {
  calculation: {
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
    tbl_ai_prompt_templates: { title: string } | null;
  };
}

const CalculationDetailsCard: React.FC<CalculationDetailsCardProps> = ({ calculation }) => {
  return (
    <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-orange-500">Detalhes do Cálculo</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
        <p><strong>Funcionário:</strong> {calculation.nome_funcionario}</p>
        <p><strong>Cliente:</strong> {calculation.tbl_clientes?.nome || 'N/A'}</p>
        <p><strong>Sindicato:</strong> {calculation.tbl_sindicatos?.nome || 'N/A'}</p>
        {calculation.tbl_ai_prompt_templates?.title && (
          <p><strong>Modelo IA:</strong> {calculation.tbl_ai_prompt_templates.title}</p>
        )}
        <p><strong>Início Contrato:</strong> {format(new Date(calculation.inicio_contrato), 'dd/MM/yyyy', { locale: ptBR })}</p>
        <p><strong>Fim Contrato:</strong> {format(new Date(calculation.fim_contrato), 'dd/MM/yyyy', { locale: ptBR })}</p>
        <p><strong>Tipo de Rescisão:</strong> {calculation.tipo_aviso}</p>
        <p><strong>Salário Trabalhador:</strong> R$ {calculation.salario_trabalhador.toFixed(2)}</p>
        <p><strong>CTPS Assinada:</strong> {calculation.ctps_assinada ? 'Sim' : 'Não'}</p>
        {calculation.cpf_funcionario && <p><strong>CPF Funcionário:</strong> {calculation.cpf_funcionario}</p>}
        {calculation.funcao_funcionario && <p><strong>Função:</strong> {calculation.funcao_funcionario}</p>}
        {calculation.salario_sindicato > 0 && <p><strong>Piso Salarial Sindicato:</strong> R$ {calculation.salario_sindicato.toFixed(2)}</p>}
        {calculation.media_descontos > 0 && <p><strong>Média Descontos:</strong> R$ {calculation.media_descontos.toFixed(2)}</p>}
        {calculation.media_remuneracoes > 0 && <p><strong>Média Remuneracoes:</strong> R$ {calculation.media_remuneracoes.toFixed(2)}</p>}
        {calculation.carga_horaria && <p><strong>Carga Horária:</strong> {calculation.carga_horaria}</p>}
        {calculation.obs_sindicato && <p className="col-span-full"><strong>Obs. Sindicato:</strong> {calculation.obs_sindicato}</p>}
        {calculation.historia && <p className="col-span-full"><strong>Histórico:</strong> {calculation.historia}</p>}
      </CardContent>
    </Card>
  );
};

export default CalculationDetailsCard;