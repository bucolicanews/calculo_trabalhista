import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react'; // Importar RefreshCw

// Importar os novos componentes modulares
import AiResponseDisplay from '@/components/calculations/AiResponseDisplay';
import NoResultCard from '@/components/calculations/NoResultCard';
import FullRescissionView from '@/components/calculations/FullRescissionView'; // Importar o novo componente

// MODIFIED IMPORT FOR JSPDF - Usando importação de namespace para garantir o carregamento completo
import * as JsPDFModule from 'jspdf';
// import 'jspdf-autotable'; // Se esta dependência não está instalada, mantemos comentada.
const jsPDF = JsPDFModule.default;

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Importando as interfaces de Provento e Desconto do hook centralizado
import { Provento, Desconto } from '@/hooks/useCalculationDetails';

interface CalculationDetails {
  id: string;
  cliente_id: string;
  sindicato_id: string | null;
  ai_template_id: string | null;
  nome_funcionario: string;
  cpf_funcionario: string | null;
  funcao_funcionario: string | null;
  inicio_contrato: string;
  fim_contrato: string;
  tipo_aviso: string;
  salario_sindicato: number;
  salario_trabalhador: number;
  obs_sindicato: string | null;
  historia: string | null;
  ctps_assinada: boolean;
  media_descontos: number;
  media_remuneracoes: number;
  carga_horaria: string | null;
  created_at: string;
  resposta_ai: any | null;
  tbl_clientes: { nome: string } | null;
  tbl_sindicatos: { nome: string } | null;
  tbl_ai_prompt_templates: {
    id: string;
    title: string;
    identificacao: string;
    comportamento: string;
    restricoes: string;
    atribuicoes: string;
    leis: string;
    observacoes_base_legal: string;
    estrutura_json_modelo_saida: string | null;
    instrucoes_entrada_dados_rescisao: string | null;
    created_at: string;
  } | null;
  tbl_resposta_calculo: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
  tbl_proventos: Provento[] | null;
  tbl_descontos: Desconto[] | null;
}

const CalculationResultPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReprocessing, setIsReprocessing] = useState(false); // Declaração correta mantida

  useEffect(() => {
    if (user && id) {
      fetchCalculationResult();
    }
  }, [user, id]);

  const fetchCalculationResult = async () => {
    setLoading(true);
    // QUERY: Incluindo 'memoria_calculo' (via *) e todos os dados
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select(`
        *,
        resposta_ai,
        tbl_clientes(nome),
        tbl_sindicatos(nome),
        tbl_ai_prompt_templates(
          id, title, identificacao, comportamento, restricoes, atribuicoes, leis, observacoes_base_legal, 
          estrutura_json_modelo_saida, instrucoes_entrada_dados_rescisao, created_at
        ),
        tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora),
        tbl_proventos(*), 
        tbl_descontos(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar resultado do cálculo: ' + error.message);
      console.error('Error fetching calculation result:', error);
      // Aqui você voltaria para a lista de cálculos, onde a lista não está a ser exibida.
      // O problema da lista está no componente que lista todos os cálculos, não nesta página de resultado.
      // navigate('/calculations');
    } else if (data) {
      setCalculation(data as unknown as CalculationDetails);
    } else {
      setCalculation(null);
    }
    setLoading(false);
  };

  // Função de reprocessamento (agora como função única)
  const handleReprocessGranularity = async () => {
    if (!id) return;

    setIsReprocessing(true);
    showSuccess('Iniciando reprocessamento dos detalhes do cálculo (granularização).');

    try {
      const { error, data: _data } = await supabase.functions.invoke('reprocess-calculation-ai-response', {
        body: { calculationId: id },
      });

      if (error) {
        showError('Erro ao reprocessar: ' + error.message);
        console.error('Reprocessing failed:', error);
      } else {
        showSuccess('Reprocessamento iniciado com sucesso. Recarregando dados em instantes...');
        setTimeout(() => {
          fetchCalculationResult();
        }, 3000);
      }
    } catch (e: any) {
      showError('Falha de rede ao chamar reprocessamento: ' + e.message);
      console.error('Network error during reprocessing:', e);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleDownloadFullReportAsPdf = async () => {
    if (!calculation) {
      showError('Dados do cálculo não disponíveis para gerar PDF.');
      return;
    }

    showSuccess('Gerando PDF do relatório completo, aguarde...');

    // A biblioteca jspdf-autotable é necessária para a função autoTable
    // Presumimos que jspdf-autotable está disponível globalmente após o import comentado.
    const doc = new (jsPDF as any)('p', 'mm', 'a4');
    let yPos = 15;
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const lineHeight = 7;
    const smallLineHeight = 5;
    const tableMarginTop = 10;

    const addPageHeader = (pageNumber: number, totalPages: number) => {
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('Jota Contabilidade - Relatório de Cálculo de Rescisão Trabalhista', pageWidth / 2, 10, { align: 'center' });
      doc.text(`Funcionário: ${calculation.nome_funcionario}`, pageWidth / 2, 15, { align: 'center' });
      doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, margin, pageHeight - 10, { align: 'left' });
      doc.setDrawColor(200);
      doc.line(margin, 18, pageWidth - margin, 18);
      yPos = 25;
    };

    let currentPage = 1;
    let totalPagesPlaceholder = 1;

    addPageHeader(currentPage, totalPagesPlaceholder);

    // --- Título Principal ---
    doc.setFontSize(20);
    doc.setTextColor(255, 69, 0);
    doc.text('Demonstrativo Completo da Rescisão', pageWidth / 2, yPos, { align: 'center' });
    yPos += lineHeight * 2;

    // --- Detalhes do Cálculo ---
    doc.setFontSize(16);
    doc.setTextColor(255, 69, 0);
    doc.text('Detalhes do Cálculo', margin, yPos);
    yPos += lineHeight;
    doc.setDrawColor(255, 69, 0);
    doc.line(margin, yPos - 2, margin + 50, yPos - 2);
    yPos += smallLineHeight;

    doc.setFontSize(10);
    doc.setTextColor(0);
    const details = [
      `Funcionário: ${calculation.nome_funcionario}`,
      `Cliente: ${calculation.tbl_clientes?.nome || 'N/A'}`,
      `Sindicato: ${calculation.tbl_sindicatos?.nome || 'N/A'}`,
      calculation.tbl_ai_prompt_templates?.title ? `Modelo IA: ${calculation.tbl_ai_prompt_templates.title}` : '',
      `Início Contrato: ${format(new Date(calculation.inicio_contrato), 'dd/MM/yyyy', { locale: ptBR })}`,
      `Fim Contrato: ${format(new Date(calculation.fim_contrato), 'dd/MM/yyyy', { locale: ptBR })}`,
      `Tipo de Rescisão: ${calculation.tipo_aviso}`,
      `Salário Trabalhador: R$ ${calculation.salario_trabalhador.toFixed(2)}`,
      `CTPS Assinada: ${calculation.ctps_assinada ? 'Sim' : 'Não'}`,
      calculation.cpf_funcionario ? `CPF Funcionário: ${calculation.cpf_funcionario}` : '',
      calculation.funcao_funcionario ? `Função: ${calculation.funcao_funcionario}` : '',
      calculation.salario_sindicato > 0 ? `Piso Salarial Sindicato: R$ ${calculation.salario_sindicato.toFixed(2)}` : '',
      calculation.media_descontos > 0 ? `Média Descontos: R$ ${calculation.media_descontos.toFixed(2)}` : '',
      calculation.media_remuneracoes > 0 ? `Média Remunerações: R$ ${calculation.media_remuneracoes.toFixed(2)}` : '',
      calculation.carga_horaria ? `Carga Horária: ${calculation.carga_horaria}` : '',
      calculation.obs_sindicato ? `Obs. Sindicato: ${calculation.obs_sindicato}` : '',
      calculation.historia ? `Histórico: ${calculation.historia}` : '',
      calculation.tbl_ai_prompt_templates?.instrucoes_entrada_dados_rescisao ? `Instruções Entrada Dados Rescisão: ${calculation.tbl_ai_prompt_templates.instrucoes_entrada_dados_rescisao}` : '',
    ].filter(Boolean);

    details.forEach(detail => {
      if (yPos + smallLineHeight > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        addPageHeader(currentPage, totalPagesPlaceholder);
      }
      doc.text(detail, margin, yPos);
      yPos += smallLineHeight;
    });
    yPos += lineHeight;

    // --- Resumo Financeiro Detalhado (Proventos) ---
    const proventos = calculation.tbl_proventos || [];
    const totalProventos = proventos.reduce((sum, p) => sum + p.valor_calculado, 0);

    if (proventos.length > 0) {
      if (yPos + lineHeight * 2 + tableMarginTop > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        addPageHeader(currentPage, totalPagesPlaceholder);
      }
      doc.setFontSize(16);
      doc.setTextColor(255, 69, 0);
      doc.text('Proventos', margin, yPos);
      yPos += lineHeight;
      doc.setDrawColor(255, 69, 0);
      doc.line(margin, yPos - 2, margin + 30, yPos - 2);
      yPos += smallLineHeight;

      // Adicionando Memória de Cálculo ao cabeçalho da tabela de Proventos
      const proventosTableData = proventos.map(p => [
        p.nome_provento,
        p.natureza_da_verba,
        `R$ ${p.valor_calculado.toFixed(2)}`,
        [
          p.memoria_calculo ? `Memória: ${p.memoria_calculo}` : '', // <--- CAMPO MEMÓRIA AQUI
          p.formula_sugerida ? `Fórmula: ${p.formula_sugerida}` : '',
          p.parametro_calculo ? `Parâmetro: ${p.parametro_calculo}` : '',
          p.exemplo_aplicavel ? `Exemplo: ${p.exemplo_aplicavel}` : '',
          p.legislacao ? `Legislação: ${p.legislacao}` : '',
        ].filter(Boolean).join('\n')
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Verba', 'Natureza', 'Valor', 'Detalhes / Memória de Cálculo']], // <--- CABEÇALHO ATUALIZADO
        body: proventosTableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, textColor: 0, lineColor: 200 },
        headStyles: { fillColor: [240, 240, 240], textColor: [255, 69, 0], fontStyle: 'bold' },
        columnStyles: {
          2: { halign: 'right', textColor: [34, 139, 34] },
          3: { fontSize: 7, textColor: [100, 100, 100] }
        },
        didDrawPage: (data: any) => {
          if (data.pageNumber > 1) {
            addPageHeader(currentPage, totalPagesPlaceholder);
          }
        },
        margin: { left: margin, right: margin },
      });
      yPos = (doc as any).autoTable.previous.finalY + tableMarginTop;

      // Total Proventos
      if (yPos + lineHeight > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        addPageHeader(currentPage, totalPagesPlaceholder);
      }
      doc.setFontSize(12);
      doc.setTextColor(255, 69, 0);
      doc.text(`Total Proventos: R$ ${totalProventos.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight * 1.5;
    }

    // --- Resumo Financeiro Detalhado (Descontos) ---
    const descontos = calculation.tbl_descontos || [];
    const totalDescontos = descontos.reduce((sum, d) => sum + d.valor_calculado, 0);

    if (descontos.length > 0) {
      if (yPos + lineHeight * 2 + tableMarginTop > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        addPageHeader(currentPage, totalPagesPlaceholder);
      }
      doc.setFontSize(16);
      doc.setTextColor(255, 69, 0);
      doc.text('Descontos', margin, yPos);
      yPos += lineHeight;
      doc.setDrawColor(255, 69, 0);
      doc.line(margin, yPos - 2, margin + 30, yPos - 2);
      yPos += smallLineHeight;

      const descontosTableData = descontos.map(d => [
        d.nome_desconto,
        d.natureza_da_verba,
        `-R$ ${d.valor_calculado.toFixed(2)}`,
        [
          d.memoria_calculo ? `Memória: ${d.memoria_calculo}` : '', // <--- CAMPO MEMÓRIA AQUI
          d.formula_sugerida ? `Fórmula: ${d.formula_sugerida}` : '',
          d.parametro_calculo ? `Parâmetro: ${d.parametro_calculo}` : '',
          d.exemplo_aplicavel ? `Exemplo: ${d.exemplo_aplicavel}` : '',
          d.legislacao ? `Legislação: ${d.legislacao}` : '',
        ].filter(Boolean).join('\n')
      ]);

      (doc as any).autoTable({
        startY: yPos,
        head: [['Verba', 'Natureza', 'Valor', 'Detalhes / Memória de Cálculo']], // <--- CABEÇALHO ATUALIZADO
        body: descontosTableData,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 2, textColor: 0, lineColor: 200 },
        headStyles: { fillColor: [240, 240, 240], textColor: [255, 69, 0], fontStyle: 'bold' },
        columnStyles: {
          2: { halign: 'right', textColor: [220, 20, 60] },
          3: { fontSize: 7, textColor: [100, 100, 100] }
        },
        didDrawPage: (data: any) => {
          if (data.pageNumber > 1) {
            addPageHeader(currentPage, totalPagesPlaceholder);
          }
        },
        margin: { left: margin, right: margin },
      });
      yPos = (doc as any).autoTable.previous.finalY + tableMarginTop;

      // Total Descontos
      if (yPos + lineHeight > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        addPageHeader(currentPage, totalPagesPlaceholder);
      }
      doc.setFontSize(12);
      doc.setTextColor(255, 69, 0);
      doc.text(`Total Descontos: -R$ ${totalDescontos.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight * 1.5;
    }

    // --- Valor Líquido a Receber ---
    const valorLiquido = totalProventos - totalDescontos;
    if (yPos + lineHeight * 3 > pageHeight - margin) {
      doc.addPage();
      currentPage++;
      addPageHeader(currentPage, totalPagesPlaceholder);
    }
    doc.setFontSize(18);
    doc.setTextColor(255, 69, 0);
    doc.text('Valor Líquido a Receber', margin, yPos);
    yPos += lineHeight;
    doc.setFontSize(24);
    doc.setTextColor(34, 139, 34);
    doc.text(`R$ ${valorLiquido.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += lineHeight * 2;

    // --- Base Legal Aplicada ---
    const allLegislations = new Set<string>();
    proventos.forEach(p => { if (p.legislacao) allLegislations.add(p.legislacao); });
    descontos.forEach(d => { if (d.legislacao) allLegislations.add(d.legislacao); });
    const uniqueLegislations = Array.from(allLegislations);

    if (uniqueLegislations.length > 0) {
      if (yPos + lineHeight * 2 > pageHeight - margin) {
        doc.addPage();
        currentPage++;
        addPageHeader(currentPage, totalPagesPlaceholder);
      }
      doc.setFontSize(16);
      doc.setTextColor(255, 69, 0);
      doc.text('Base Legal Aplicada', margin, yPos);
      yPos += lineHeight;
      doc.setDrawColor(255, 69, 0);
      doc.line(margin, yPos - 2, margin + 60, yPos - 2);
      yPos += smallLineHeight;

      doc.setFontSize(10);
      doc.setTextColor(0);
      uniqueLegislations.forEach((leg) => {
        const textLines = doc.splitTextToSize(`- ${leg}`, pageWidth - 2 * margin);
        textLines.forEach((line: string) => {
          if (yPos + smallLineHeight > pageHeight - margin) {
            doc.addPage();
            currentPage++;
            addPageHeader(currentPage, totalPagesPlaceholder);
          }
          doc.text(line, margin, yPos);
          yPos += smallLineHeight;
        });
      });
    }

    // Atualizar o número total de páginas no cabeçalho/rodapé de todas as páginas
    const finalPageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= finalPageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Página ${i} de ${finalPageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }

    doc.save(`relatorio_calculo_${calculation.nome_funcionario.replace(/\s/g, '_')}_${calculation.id.substring(0, 8)}.pdf`);
    showSuccess('Download do PDF do relatório completo iniciado!');
  };


  if (loading) {
    return (
      <MainLayout>
        {/* CORREÇÃO DE RESPONSIVIDADE: Removido container mx-auto aqui para ocupar 100% */}
        <div className="py-8 text-center text-gray-400">Carregando resultado do cálculo...</div>
      </MainLayout>
    );
  }

  if (!calculation) {
    return (
      <MainLayout>
        {/* CORREÇÃO DE RESPONSIVIDADE: Removido container mx-auto aqui */}
        <div className="py-8 text-center text-gray-400">Nenhum resultado de cálculo encontrado.</div>
      </MainLayout>
    );
  }

  const otherResultDetails = calculation.tbl_resposta_calculo;
  const hasAnyResult = calculation.resposta_ai || otherResultDetails?.url_documento_calculo || otherResultDetails?.texto_extraido;

  const calculationDataForDetailsCard = {
    nome_funcionario: calculation.nome_funcionario,
    inicio_contrato: calculation.inicio_contrato,
    fim_contrato: calculation.fim_contrato,
    tipo_aviso: calculation.tipo_aviso,
    salario_trabalhador: calculation.salario_trabalhador,
    ctps_assinada: calculation.ctps_assinada,
    cpf_funcionario: calculation.cpf_funcionario,
    funcao_funcionario: calculation.funcao_funcionario,
    salario_sindicato: calculation.salario_sindicato,
    media_descontos: calculation.media_descontos,
    media_remuneracoes: calculation.media_remuneracoes,
    carga_horaria: calculation.carga_horaria,
    obs_sindicato: calculation.obs_sindicato,
    historia: calculation.historia,
    tbl_clientes: calculation.tbl_clientes,
    tbl_sindicatos: calculation.tbl_sindicatos,
    tbl_ai_prompt_templates: calculation.tbl_ai_prompt_templates,
  };

  return (
    <MainLayout>
      {/* CORREÇÃO DE RESPONSIVIDADE: O container mx-auto é aplicado aqui para manter margens laterais, mas ocupando o máximo da largura. */}
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 max-w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0 sm:space-x-4">

          <Button variant="ghost" onClick={() => navigate('/calculations')} className="text-orange-500 hover:text-orange-600 sm:w-auto">
            <ArrowLeft className="mr-1 h-1 w-1" /> Voltar para Cálculos
          </Button>

          <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 flex-grow text-center">
            Resultado do Cálculo
          </h1>

          <div className="flex space-x-2">
            {/* Botão de Reprocessamento (para testar a escrita de Proventos/Descontos) */}
            <Button
              onClick={handleReprocessGranularity}
              disabled={isReprocessing}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto flex items-center justify-center"
            >
              {isReprocessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Reprocessando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reprocessar Detalhes
                </>
              )}
            </Button>

            <Button
              onClick={handleDownloadFullReportAsPdf}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto flex items-center justify-center"
            >
              <Download className="h-4 w-4 mr-2" /> Baixar Relatório Completo (PDF)
            </Button>
          </div>
        </div>

        <div className="report-content">
          <FullRescissionView
            calculationDetails={calculationDataForDetailsCard}
            proventos={calculation.tbl_proventos || []}
            descontos={calculation.tbl_descontos || []}
          />

          {hasAnyResult ? (
            <AiResponseDisplay
              aiResponse={calculation.resposta_ai}
              otherResultDetails={otherResultDetails}
            />
          ) : (
            <NoResultCard />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default CalculationResultPage;