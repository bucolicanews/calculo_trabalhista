import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast'; // Adicionado showSuccess aqui
import { ArrowLeft, FileText, Download, Table } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseMarkdownTables, convertToCsv, ParsedTable } from '@/utils/markdownParser';

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
    proventos: string;
    descontos: string;
    observacoes_base_legal: string;
    formatacao_texto_cabecalho: string;
    formatacao_texto_corpo: string;
    formatacao_texto_rodape: string;
    created_at: string;
  } | null;
  tbl_resposta_calculo: {
    url_documento_calculo: string | null;
    texto_extraido: string | null;
    data_hora: string;
  } | null;
}

const CalculationResultPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [calculation, setCalculation] = useState<CalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [parsedTables, setParsedTables] = useState<ParsedTable[]>([]); // Novo estado para tabelas parseadas

  useEffect(() => {
    if (user && id) {
      fetchCalculationResult();
    }
  }, [user, id]);

  useEffect(() => {
    if (calculation?.resposta_ai) {
      const tables = parseMarkdownTables(calculation.resposta_ai);
      setParsedTables(tables);
    } else {
      setParsedTables([]);
    }
  }, [calculation?.resposta_ai]);

  const fetchCalculationResult = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select(`
        *,
        resposta_ai,
        tbl_clientes(nome),
        tbl_sindicatos(nome),
        tbl_ai_prompt_templates(id, title, identificacao, comportamento, restricoes, atribuicoes, leis, proventos, descontos, observacoes_base_legal, formatacao_texto_cabecalho, formatacao_texto_corpo, formatacao_texto_rodape, created_at),
        tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora)
      `)
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar resultado do cálculo: ' + error.message);
      console.error('Error fetching calculation result:', error);
      navigate('/calculations');
    } else if (data) {
      setCalculation(data as CalculationDetails);
    }
    setLoading(false);
  };

  const handleDownloadCsv = () => {
    if (parsedTables.length > 0) {
      const csv = convertToCsv(parsedTables);
      const filename = `calculo_${calculation?.nome_funcionario.replace(/\s/g, '_')}_${calculation?.id.substring(0, 8)}.csv`;
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

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => navigate('/calculations')} className="text-orange-500 hover:text-orange-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Cálculos
          </Button>
          <h1 className="text-4xl font-bold text-orange-500 flex-grow text-center">
            Resultado do Cálculo
          </h1>
          <div className="w-48"></div>
        </div>

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
            {calculation.media_remuneracoes > 0 && <p><strong>Média Remunerações:</strong> R$ {calculation.media_remuneracoes.toFixed(2)}</p>}
            {calculation.carga_horaria && <p><strong>Carga Horária:</strong> {calculation.carga_horaria}</p>}
            {calculation.obs_sindicato && <p className="col-span-full"><strong>Obs. Sindicato:</strong> {calculation.obs_sindicato}</p>}
            {calculation.historia && <p className="col-span-full"><strong>Histórico:</strong> {calculation.historia}</p>}
          </CardContent>
        </Card>

        {hasAnyResult ? (
          <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-500">Resposta do Webhook</CardTitle>
              {otherResultDetails?.data_hora && <p className="text-sm text-gray-400">Gerado em: {format(new Date(otherResultDetails.data_hora), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>}
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              {calculation.resposta_ai && (
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-lg font-semibold text-orange-400 mb-2">Resposta da IA:</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {calculation.resposta_ai}
                  </ReactMarkdown>
                  {parsedTables.length > 0 && (
                    <Button
                      onClick={handleDownloadCsv}
                      className="mt-4 bg-green-600 hover:bg-green-700 text-white flex items-center"
                    >
                      <Table className="h-4 w-4 mr-2" /> Baixar Planilha (CSV)
                    </Button>
                  )}
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
              {!calculation.resposta_ai && !otherResultDetails?.texto_extraido && !otherResultDetails?.url_documento_calculo && (
                <p className="text-gray-400">Nenhuma resposta detalhada disponível para este cálculo ainda.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-500">Resposta do Webhook</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">Ainda não há uma resposta de webhook para este cálculo. Envie o cálculo para um webhook para gerar um resultado.</p>
              <Button asChild className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
                <Link to={`/calculations`}>
                  Enviar Cálculo
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default CalculationResultPage;