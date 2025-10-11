import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, getDay, getDate } from 'date-fns'; // Importando getDate
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
    tbl_ai_prompt_templates: {
      title: string;
      estrutura_json_modelo_saida: string | null; // Campo do DB
      instrucoes_entrada_dados_rescisao: string | null; // Campo do DB
    } | null;
  };
}

const CalculationDetailsCard: React.FC<CalculationDetailsCardProps> = ({ calculation }) => {

  // 🛑 CÁLCULO DA BASE DE CÁLCULO FINAL (Salário Base + Médias de Variáveis)
  const baseCalculoTotal = calculation.salario_trabalhador + (calculation.media_remuneracoes || 0);

  // Calcula a duração do contrato em dias (para o Saldo de Salário e o Aviso Prévio Proporcional)
  const inicio = new Date(calculation.inicio_contrato);
  const fim = new Date(calculation.fim_contrato);
  // Calcula a diferença em milissegundos e converte para dias (+1 para incluir o dia de início)
  const diasTrabalhadosNoVinculo = Math.ceil(Math.abs(fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const anosCompletos = Math.floor(diasTrabalhadosNoVinculo / 365.25);

  // 🛑 NOVO CÁLCULO: Dias trabalhados no mês da rescisão
  const diaDoMesDaRescisao = getDate(fim);


  return (
    <Card className="w-full mx-auto bg-gray-900 border-orange-500 text-white mb-8">
      <CardHeader>
        <CardTitle className="text-2xl text-orange-500">Detalhes do Cálculo</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 px-4">

        {/* === DETALHES GERAIS === */}
        <p className="break-words"><strong>Funcionário:</strong> {calculation.nome_funcionario}</p>
        <p className="break-words"><strong>Cliente:</strong> {calculation.tbl_clientes?.nome || 'N/A'}</p>
        <p className="break-words"><strong>Sindicato:</strong> {calculation.tbl_sindicatos?.nome || 'N/A'}</p>
        {calculation.tbl_ai_prompt_templates?.title && (
          <p className="break-words"><strong>Modelo IA:</strong> {calculation.tbl_ai_prompt_templates.title}</p>
        )}

        {/* === DURAÇÃO E DATAS === */}
        <p className="break-words"><strong>Início Contrato:</strong> {format(new Date(calculation.inicio_contrato), 'dd/MM/yyyy', { locale: ptBR })}</p>
        <p className="break-words"><strong>Fim Contrato:</strong> {format(new Date(calculation.fim_contrato), 'dd/MM/yyyy', { locale: ptBR })}</p>
        <p className="break-words"><strong>Dias Trabalhados no Vínculo:</strong> {diasTrabalhadosNoVinculo} dias ({anosCompletos} anos completos)</p>
        {/* 🛑 NOVO CAMPO EXIBIDO */}
        <p className="break-words"><strong>Dias Trabalhados no Mês da Rescisão:</strong> {diaDoMesDaRescisao} dias</p>

        {/* === REMUNERAÇÃO === */}
        <p className="break-words"><strong>Salário Base Contratual:</strong> R$ {calculation.salario_trabalhador.toFixed(2)}</p>
        {calculation.media_remuneracoes > 0 && (
          <p className="break-words"><strong>Média Remunerações Variáveis:</strong> R$ {calculation.media_remuneracoes.toFixed(2)}</p>
        )}

        {/* 🛑 CAMPO BASE DE CÁLCULO TOTAL (Destaque) */}
        <p className="col-span-full md:col-span-2 text-lg font-semibold text-green-500 border-t border-b border-gray-700 py-2 mt-2">
          <strong>BASE DE CÁLCULO RESCISÓRIA:</strong> R$ {baseCalculoTotal.toFixed(2)}
        </p>

        {/* === OUTROS DETALHES === */}
        <p className="break-words"><strong>Tipo de Rescisão:</strong> {calculation.tipo_aviso}</p>
        <p className="break-words"><strong>CTPS Assinada:</strong> {calculation.ctps_assinada ? 'Sim' : 'Não'}</p>
        {calculation.cpf_funcionario && <p className="break-words"><strong>CPF Funcionário:</strong> {calculation.cpf_funcionario}</p>}
        {calculation.funcao_funcionario && <p className="break-words"><strong>Função:</strong> {calculation.funcao_funcionario}</p>}
        {calculation.salario_sindicato > 0 && <p className="break-words"><strong>Piso Salarial Sindicato:</strong> R$ {calculation.salario_sindicato.toFixed(2)}</p>}
        {calculation.media_descontos > 0 && <p className="break-words"><strong>Média Descontos Informados:</strong> R$ {calculation.media_descontos.toFixed(2)}</p>}
        {calculation.carga_horaria && <p className="break-words"><strong>Carga Horária:</strong> {calculation.carga_horaria}</p>}

        {/* === INSTRUÇÕES / HISTÓRICO === */}
        {calculation.obs_sindicato && <p className="col-span-full break-words"><strong>Obs. Sindicato:</strong> {calculation.obs_sindicato}</p>}
        {calculation.historia && <p className="col-span-full break-words"><strong>Histórico:</strong> {calculation.historia}</p>}
        {calculation.tbl_ai_prompt_templates?.instrucoes_entrada_dados_rescisao &&
          <p className="col-span-full break-words"><strong>Instruções IA:</strong> {calculation.tbl_ai_prompt_templates.instrucoes_entrada_dados_rescisao}</p>
        }
      </CardContent>
    </Card>
  );
};

export default CalculationDetailsCard;
