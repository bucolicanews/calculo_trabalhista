import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AiResponseDisplayProps {
  aiResponse: any | null;
  otherResultDetails: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
}

// Componente auxiliar para formatar a "Memória de Cálculo"
const FormattedMemo: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  return (
    <div className="text-sm text-gray-400 space-y-1">
      {text.split('\\n').map((line, index) => {
        const trimmedLine = line.trim();
        const isListItem = /^\s*(\*|-|\d+\.\s*)/.test(trimmedLine);
        return (
          // Adicionado 'break-words' para evitar que texto longo quebre o layout
          <p key={index} className={`break-words ${isListItem ? 'pl-4' : ''}`}>
            {trimmedLine}
          </p>
        );
      })}
    </div>
  );
};

// Componente para renderizar uma única verba (Provento ou Desconto)
const VerbaCard: React.FC<{ item: any; type: 'provento' | 'desconto' }> = ({ item, type }) => {
  const title = (type === 'provento' ? item.Provento : item.Desconto)?.replace(/_/g, ' ');
  const value = item.Cálculo?.Valor || 0;
  const isPositive = value > 0;
  const valueColor = type === 'provento' ? 'text-green-400' : 'text-red-400';

  if (!isPositive) return null;

  return (
    <Card className="w-full bg-gray-800 border-gray-700 mb-4">
      <CardHeader className="p-4 sm:p-6 pb-2">
        {/* Container do título e valor agora é responsivo */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <CardTitle className="text-base sm:text-lg font-semibold text-orange-400">{title}</CardTitle>
          <span className={`text-lg sm:text-xl font-bold ${valueColor} whitespace-nowrap`}>
            {value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-2">
        <h4 className="text-md font-semibold text-gray-300 mt-2 mb-1">Memória de Cálculo:</h4>
        <FormattedMemo text={item.Memoria_de_Calculo} />
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-gray-500 hover:text-gray-400">Ver detalhes legais</summary>
          <div className="mt-2 pl-4 border-l-2 border-gray-600 space-y-1 text-gray-400">
            <p><strong>Parâmetro:</strong> <span className="break-all">{item.Cálculo?.Parametro}</span></p>
            {/* Adicionado 'break-all' para que fórmulas longas não quebrem o layout */}
            <p><strong>Fórmula Sugerida:</strong> <code className="bg-gray-700 p-1 rounded text-gray-300 break-all">{item.Cálculo?.Fórmula_Sugerida}</code></p>
            <p><strong>Legislação:</strong> <span className="break-all">{item.Legislação}</span></p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

const AiResponseDisplay: React.FC<AiResponseDisplayProps> = ({
  aiResponse,
  otherResultDetails,
}) => {
  const proventos = aiResponse?.Verbas_Rescisorias?.Remuneracao || [];
  const descontos = aiResponse?.Verbas_Rescisorias?.Descontos || [];

  return (
    // Removido mx-auto para permitir que o card ocupe 100% da largura em containers estreitos
    <Card className="w-full bg-gray-900 border-orange-500 text-white">
      <CardHeader className="p-4 sm:p-6">
        {/* Header principal agora é responsivo, empilhando em telas pequenas */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <CardTitle className="text-xl sm:text-2xl text-orange-500">Resultado do Cálculo da IA</CardTitle>
          {otherResultDetails?.data_hora && (
            <p className="text-xs sm:text-sm text-gray-400">
              Gerado em: {format(new Date(otherResultDetails.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6 text-gray-300">

        {/* Seção de Proventos */}
        <div>
          <h3 className="flex items-center text-lg sm:text-xl font-semibold text-green-500 mb-3 border-b border-gray-700 pb-2">
            <TrendingUp className="h-5 w-5 mr-2" /> Proventos (Remuneração)
          </h3>
          {proventos.filter((p: any) => p.Cálculo?.Valor > 0).length > 0 ? (
            proventos.map((provento: any, index: number) => (
              <VerbaCard key={`provento-${index}`} item={provento} type="provento" />
            ))
          ) : (
            <p className="text-gray-500 italic">Nenhum provento aplicável neste cálculo.</p>
          )}
        </div>

        {/* Seção de Descontos */}
        <div>
          <h3 className="flex items-center text-lg sm:text-xl font-semibold text-red-500 mb-3 border-b border-gray-700 pb-2">
            <TrendingDown className="h-5 w-5 mr-2" /> Descontos
          </h3>
          {descontos.filter((d: any) => d.Cálculo?.Valor > 0).length > 0 ? (
            descontos.map((desconto: any, index: number) => (
              <VerbaCard key={`desconto-${index}`} item={desconto} type="desconto" />
            ))
          ) : (
            <p className="text-gray-500 italic">Nenhum desconto aplicável neste cálculo.</p>
          )}
        </div>

        {/* Seção de Documentos e Anexos */}
        {(otherResultDetails?.url_documento_calculo || otherResultDetails?.texto_extraido) && (
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-orange-400 mb-3 border-b border-gray-700 pb-2">
              Documentos e Anexos
            </h3>
            {otherResultDetails?.texto_extraido && (
              <div className="mb-4">
                <h4 className="text-md sm:text-lg font-semibold text-gray-300 mb-2">Texto Extraído do Documento:</h4>
                <p className="whitespace-pre-wrap break-words bg-gray-800 p-3 rounded-md border border-gray-700 text-sm">{otherResultDetails.texto_extraido}</p>
              </div>
            )}
            {otherResultDetails?.url_documento_calculo && (
              // Adicionado flex-wrap para que os botões quebrem a linha se necessário
              <div className="flex flex-wrap items-center gap-4">
                <FileText className="h-5 w-5 text-orange-500" />
                <a href={otherResultDetails.url_documento_calculo} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  Visualizar Documento PDF
                </a>
                <Button asChild variant="outline" size="sm" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                  <a href={otherResultDetails.url_documento_calculo} download>
                    <Download className="h-4 w-4 mr-2" /> Baixar PDF
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Mensagem de fallback */}
        {!aiResponse && !otherResultDetails?.texto_extraido && !otherResultDetails?.url_documento_calculo && (
          <p className="text-gray-400">Nenhuma resposta detalhada disponível para este cálculo ainda.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AiResponseDisplay;