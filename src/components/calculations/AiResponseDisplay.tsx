import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AiResponseDisplayProps {
  aiResponse: any | null; // O objeto JSON lido do banco de dados (JSONB)
  otherResultDetails: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
}

const AiResponseDisplay: React.FC<AiResponseDisplayProps> = ({
  aiResponse,
  otherResultDetails,
}) => {
  // Converte o objeto JavaScript em uma string JSON formatada (indentação 2)
  const formattedJson = aiResponse
    ? JSON.stringify(aiResponse, null, 2)
    : '';

  return (
    <Card className="w-full mx-auto bg-gray-900 border-orange-500 text-white">
      <CardHeader>
        {otherResultDetails?.data_hora && <p className="text-sm text-gray-400">Gerado em: {format(new Date(otherResultDetails.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>}
      </CardHeader>
      <CardContent className="space-y-4 text-gray-300">

        {formattedJson && (
          <div>
            <h3 className="w-full text-lg font-semibold text-orange-400 mb-2">Resposta JSON da IA (Texto Puro):</h3>

            {/* Renderização de JSON puro em <pre> (Mais estável que o Markdown complexo) */}
            <pre className="whitespace-pre-wrap text-sm bg-gray-800 p-3 rounded-md border border-gray-700 max-h-60 overflow-auto">
              {formattedJson}
            </pre>
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
