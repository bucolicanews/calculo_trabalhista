import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, getDate } from 'date-fns';
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
      estrutura_json_modelo_saida: string | null;
      instrucoes_entrada_dados_rescisao: string | null;
    } | null;
  };
}

/**
 * Tenta converter a string de data (DD/MM/AAAA ou AAAA-MM-DD) para um objeto Date.
 * A data é criada com horário de 12:00:00 para evitar erros de fuso horário (UTC offset).
 */
const parseDateSafely = (dateString: string): Date | null => {
  if (!dateString) return null;

  // Tenta formato DD/MM/AAAA (Formulário)
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        // CRITICAL FIX: Forçar a data para 12:00:00
        const date = new Date(year, month - 1, day, 12, 0, 0);

        // Validação simples
        if (date.getFullYear() === year && date.getMonth() === month - 1) {
          return date;
        }
      }
    }
  }

  // Tenta formato AAAA-MM-DD (Supabase/ISO) - Esta é a conversão mais propensa ao erro de deslocamento
  if (dateString.includes('-')) {
    const date = new Date(dateString + 'T12:00:00'); // CRITICAL FIX: Adicionar horário
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};


const CalculationDetailsCard: React.FC<CalculationDetailsCardProps> = ({ calculation }) => {

  // --- MANIPULAÇÃO SEGURA DAS DATAS ---
  const inicio = parseDateSafely(calculation.inicio_contrato);
  const fim = parseDateSafely(calculation.fim_contrato);

  // 'baseCalculoTotal' removido pois não é utilizado.

  let diasTrabalhadosNoVinculo = 0;
  let anosCompletos = 0;
  let diaDoMesDaRescisao = 0;

  if (inicio && fim) {
    // Cálculo da duração do contrato em dias
    const diffTime = Math.abs(fim.getTime() - inicio.getTime());
    // Math.ceil garante que o último dia é sempre contado
    diasTrabalhadosNoVinculo = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Calcula anos completos
    anosCompletos = Math.floor(diasTrabalhadosNoVinculo / 365);

    // Dia do mês da rescisão (para Saldo de Salário)
    diaDoMesDaRescisao = getDate(fim);
  }

  // Função auxiliar para exibição
  const formatDisplayDate = (date: Date | null) =>
    date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Data Inválida';


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
        <p className="break-words"><strong>Início Contrato:</strong> {formatDisplayDate(inicio)}</p>
        <p className="break-words"><strong>Fim Contrato:</strong> {formatDisplayDate(fim)}</p>
        <p className="break-words"><strong>Dias Trabalhados no Vínculo:</strong> {diasTrabalhadosNoVinculo} dias ({anosCompletos} anos completos)</p>
        <p className="break-words"><strong>Dias Trabalhados no Mês da Rescisão:</strong> {diaDoMesDaRescisao} dias</p>

        {/* === REMUNERAÇÃO === */}
        <p className="break-words"><strong>Salário Base Contratual:</strong> R$ {calculation.salario_trabalhador.toFixed(2)}</p>
        {calculation.media_remuneracoes > 0 && (
          <p className="break-words"><strong>Média Remunerações Variáveis:</strong> R$ {calculation.media_remuneracoes.toFixed(2)}</p>
        )}


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

      </CardContent>
    </Card>
  );
};

export default CalculationDetailsCard;