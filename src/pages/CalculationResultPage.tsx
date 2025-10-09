import React, { useEffect, useState, useRef } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft, Download } from 'lucide-react';

// Importar os novos componentes modulares
import AiResponseDisplay from '@/components/calculations/AiResponseDisplay';
import NoResultCard from '@/components/calculations/NoResultCard';
import FullRescissionView from '@/components/calculations/FullRescissionView'; // Importar o novo componente

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

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
  resposta_ai: string | null;
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
    estrutura_json_modelo_saida: string | null; // Campo do DB
    instrucoes_entrada_dados_rescisao: string | null; // Campo do DB
    created_at: string;
  } | null;
  tbl_resposta_calculo: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
  tbl_proventos: Provento[] | null; // Usar o nome da tabela diretamente
  tbl_descontos: Desconto[] | null; // Usar o nome da tabela diretamente
}

const CalculationResultPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null); // Ref para o conteúdo a ser exportado

  useEffect(() => {
    if (user && id) {
      fetchCalculationResult();
    }
  }, [user, id]);

  const fetchCalculationResult = async () => {
    setLoading(true);
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
      navigate('/calculations');
    } else if (data) {
      setCalculation(data as unknown as CalculationDetails);
    } else {
      setCalculation(null);
    }
    setLoading(false);
  };

  const handleDownloadFullReportAsPdf = async () => {
    const element = contentRef.current;
    if (!element || !calculation) {
      showError('Conteúdo do relatório não disponível para PDF.');
      return;
    }

    showSuccess('Gerando PDF do relatório completo, aguarde...');
    const filename = `relatorio_calculo_${calculation.nome_funcionario.replace(/\s/g, '_')}_${calculation.id.substring(0, 8)}.pdf`;

    // Temporariamente ajustar o estilo para impressão
    const originalBodyClass = document.body.className;
    const originalHtmlClass = document.documentElement.className;
    const originalBg = document.body.style.backgroundColor;
    const originalColor = document.body.style.color;

    document.body.classList.remove('dark');
    document.documentElement.classList.remove('dark');
    document.body.style.backgroundColor = 'white';
    document.body.style.color = 'black';
    element.classList.remove('prose-invert'); // Se houver markdown, garantir que não esteja invertido

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Aumenta a resolução para melhor qualidade
        useCORS: true,
        backgroundColor: 'white',
        windowWidth: element.scrollWidth, // Captura a largura total do conteúdo
        windowHeight: element.scrollHeight, // Captura a altura total do conteúdo
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 20; // Margem de 10mm de cada lado
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 10; // Posição inicial com margem superior

      const addHeaderAndFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
        doc.setFontSize(10);
        doc.setTextColor(100); // Cor cinza para o texto do cabeçalho/rodapé
        doc.text('Relatório de Cálculo de Rescisão Trabalhista', pdfWidth / 2, 10, { align: 'center' });
        doc.text(`Funcionário: ${calculation.nome_funcionario}`, pdfWidth / 2, 15, { align: 'center' });
        doc.text(`Página ${pageNum} de ${totalPages}`, pdfWidth - 15, pdfHeight - 10, { align: 'right' });
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 15, pdfHeight - 10, { align: 'left' });
      };

      const totalPages = Math.ceil(imgHeight / (pdfHeight - 20)); // Calcula o número total de páginas

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        addHeaderAndFooter(pdf, i + 1, totalPages);

        const cropHeight = Math.min(imgHeight - (i * (pdfHeight - 20)), (pdfHeight - 20));
        const sY = i * (pdfHeight - 20) * (canvas.width / imgWidth); // Posição Y no canvas original

        (pdf as any).addImage(
          imgData,
          'PNG',
          10, // Margem esquerda
          position,
          imgWidth,
          cropHeight,
          undefined,
          'NONE',
          0,
          sY, // Posição de corte Y no canvas
          canvas.width,
          (cropHeight * canvas.width) / imgWidth // Altura de corte no canvas
        );
      }

      pdf.save(filename);
      showSuccess('Download do PDF do relatório completo iniciado!');
    } catch (error) {
      console.error('Erro ao gerar PDF do relatório completo:', error);
      showError('Falha ao gerar PDF do relatório completo. Verifique o console do navegador para mais detalhes.');
    } finally {
      // Restaurar o estilo original
      document.body.className = originalBodyClass;
      document.documentElement.className = originalHtmlClass;
      document.body.style.backgroundColor = originalBg;
      document.body.style.color = originalColor;
      element.classList.add('prose-invert'); // Reverter se necessário
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando resultado do cálculo...</div>
      </MainLayout>
    );
  }

  if (!calculation) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Nenhum resultado de cálculo encontrado.</div>
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
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
          <Button variant="ghost" onClick={() => navigate('/calculations')} className="text-orange-500 hover:text-orange-600 mb-2 sm:mb-0 sm:w-auto">
            <ArrowLeft className="mr-1 h-1 w-1" /> Voltar para Cálculos
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 flex-grow text-center sm:text-center">
            Resultado do Cálculo
          </h1>
          <Button
            onClick={handleDownloadFullReportAsPdf}
            className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto flex items-center justify-center"
          >
            <Download className="h-4 w-4 mr-2" /> Baixar Relatório Completo (PDF)
          </Button>
        </div>

        <div ref={contentRef} className="report-content"> {/* Adicionado o ref aqui */}
          {/* Usar o novo componente FullRescissionView */}
          <FullRescissionView
            calculationDetails={calculationDataForDetailsCard}
            proventos={calculation.tbl_proventos || []}
            descontos={calculation.tbl_descontos || []}
          />

          {hasAnyResult ? (
            <AiResponseDisplay
              calculationId={calculation.id}
              employeeName={calculation.nome_funcionario}
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