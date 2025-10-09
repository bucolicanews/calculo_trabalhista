import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Table } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { parseMarkdownTables, convertToCsv, ParsedTable } from '@/utils/markdownParser';
import { customMarkdownComponents } from './MarkdownComponents';
import { showError, showSuccess } from '@/utils/toast';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AiResponseDisplayProps {
  calculationId: string;
  employeeName: string;
  aiResponse: string | null;
  otherResultDetails: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
}

const AiResponseDisplay: React.FC<AiResponseDisplayProps> = ({
  calculationId,
  employeeName,
  aiResponse,
  otherResultDetails,
}) => {
  const [parsedTables, setParsedTables] = useState<ParsedTable[]>([]);
  const markdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiResponse) {
      const tables = parseMarkdownTables(aiResponse);
      setParsedTables(tables);
    } else {
      setParsedTables([]);
    }
  }, [aiResponse]);

  const handleDownloadCsv = () => {
    if (parsedTables.length > 0) {
      const csv = convertToCsv(parsedTables);
      const filename = `calculo_${employeeName.replace(/\s/g, '_')}_${calculationId.substring(0, 8)}.csv`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Download da planilha CSV iniciado!');
    } else {
      showError('Nenhuma tabela encontrada na resposta da IA para download em CSV.');
    }
  };

  const handleDownloadAiResponseAsPdf = async () => {
    const element = markdownRef.current;
    if (!element || !aiResponse) {
      showError('Nenhuma resposta da IA disponível ou conteúdo não renderizado para PDF.');
      return;
    }

    console.log('Attempting to generate PDF from element:', element);

    showSuccess('Gerando PDF, aguarde...');
    const filename = `calculo_${employeeName.replace(/\s/g, '_')}_${calculationId.substring(0, 8)}.pdf`;

    const buttonsContainer = element.querySelector('.flex.flex-wrap.gap-2.mt-4') as HTMLElement;
    const originalButtonsDisplay = buttonsContainer ? buttonsContainer.style.display : '';
    if (buttonsContainer) {
      buttonsContainer.style.display = 'none';
    }

    const originalClassList = element.classList.value;
    const originalBackgroundColor = element.style.backgroundColor;
    const originalColor = element.style.color;

    element.classList.remove('prose-invert');
    element.classList.add('prose');
    element.style.backgroundColor = 'white';
    element.style.color = 'black';

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: 'white',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const marginLeft = 10;
      const marginRight = 10;
      const marginTop = 35;
      const marginBottom = 10;

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const usableWidth = pdfWidth - marginLeft - marginRight;
      const usableHeight = pdfHeight - marginTop - marginBottom;

      let currentCanvasY = 0;
      let pageNumber = 0;

      const addHeader = (doc: jsPDF) => {
        doc.setFontSize(16);
        doc.text('Relatório de Cálculo de Rescisão', pdfWidth / 2, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`ID Cálculo: ${calculationId}`, pdfWidth / 2, 22, { align: 'center' });
        doc.text(`Data do Cálculo: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, pdfWidth / 2, 27, { align: 'center' });
      };

      while (currentCanvasY < canvas.height) {
        if (pageNumber > 0) {
          pdf.addPage();
        }
        addHeader(pdf);

        const contentHeightOnCanvas = (usableHeight * canvas.width) / usableWidth;
        let cropHeight = Math.min(contentHeightOnCanvas, canvas.height - currentCanvasY);

        (pdf as any).addImage(
          imgData,
          'PNG',
          marginLeft,
          marginTop,
          usableWidth,
          (cropHeight * usableWidth) / canvas.width,
          undefined,
          'NONE',
          0,
          0,
          currentCanvasY,
          canvas.width,
          cropHeight
        );

        currentCanvasY += cropHeight;
        pageNumber++;
      }

      pdf.save(filename);
      showSuccess('Download do PDF iniciado!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      showError('Falha ao gerar PDF. Verifique o console do navegador para mais detalhes.');
    } finally {
      element.classList.value = originalClassList;
      element.style.backgroundColor = originalBackgroundColor;
      element.style.color = originalColor;
      if (buttonsContainer) {
        buttonsContainer.style.display = originalButtonsDisplay;
      }
    }
  };

  const handleDownloadAiResponseAsTxt = (response: string) => {
    if (response) {
      const filename = `calculo_${employeeName.replace(/\s/g, '_')}_${calculationId.substring(0, 8)}.txt`;
      const blob = new Blob([response], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Download da resposta da IA (TXT) iniciado!');
    } else {
      showError('Nenhuma resposta da IA disponível para download em TXT.');
    }
  };

  return (
    <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
      <CardHeader>
        {otherResultDetails?.data_hora && <p className="text-sm text-gray-400">Gerado em: {format(new Date(otherResultDetails.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>}
      </CardHeader>
      <CardContent className="space-y-4 text-gray-300">
        {aiResponse && (
          <div ref={markdownRef} className="prose prose-invert max-w-none overflow-x-auto px-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={customMarkdownComponents}>
              {aiResponse}
            </ReactMarkdown>
            <div className="flex flex-wrap gap-2 mt-4">
              {parsedTables.length > 0 && (
                <Button
                  onClick={handleDownloadCsv}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center"
                >
                  <Table className="h-4 w-4 mr-2" /> Baixar Planilha (CSV)
                </Button>
              )}
              <Button
                onClick={handleDownloadAiResponseAsPdf}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center"
              >
                <Download className="h-4 w-4 mr-2" /> Baixar PDF
              </Button>
              <Button
                onClick={() => handleDownloadAiResponseAsTxt(aiResponse || '')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <FileText className="h-4 w-4 mr-2" /> Baixar TXT
              </Button>
            </div>
          </div>
        )}
        {otherResultDetails?.texto_extraido && (
          <div>
            <h3 className="text-lg font-semibold text-orange-400 mb-2">Texto Extraído do Documento:</h3>
            <p className="whitespace-pre-wrap">{otherResultDetails.texto_extraido}</p>
          </div>
        )}
        {otherResultDetails?.url_documento_calculo && (
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-orange-500" />
            <a
              href={otherResultDetails.url_documento_calculo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Visualizar Documento PDF
            </a>
            <Button asChild variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
              <a href={otherResultDetails.url_documento_calculo} download>
                <Download className="h-4 w-4 mr-1" /> Baixar PDF
              </a>
            </Button>
          </div>
        )}
        {!aiResponse && !otherResultDetails?.texto_extraido && !otherResultDetails?.url_documento_calculo && (
          <p className="text-gray-400">Nenhuma resposta detalhada disponível para este cálculo ainda.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AiResponseDisplay;