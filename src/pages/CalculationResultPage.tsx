import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Calculator, FileText } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';

interface CalculationResult {
  id: string;
  calculo_id: string;
  resposta_ai: string | null;
  url_documento_calculo: string | null; // Novo campo
  texto_extraido: string | null; // Novo campo
  data_hora: string;
}

interface CalculationDetails {
  id: string;
  nome_funcionario: string;
  cliente_id: string;
  tbl_clientes: Array<{
    nome: string;
  }> | null;
}

const CalculationResultPage = () => {
  const { user } = useAuth();
  const { calculationId } = useParams<{ calculationId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculationDetails, setCalculationDetails] = useState<CalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (calculationId && user) {
      fetchCalculationResult();
      fetchCalculationDetails();
    }
  }, [calculationId, user]);

  const fetchCalculationResult = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_resposta_calculo')
      .select('*')
      .eq('calculo_id', calculationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
      showError('Erro ao carregar resultado do cálculo: ' + error.message);
      console.error('Error fetching calculation result:', error);
      setResult(null);
    } else if (data) {
      setResult(data);
    } else {
      setResult(null);
    }
    setLoading(false);
  };

  const fetchCalculationDetails = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('tbl_calculos')
      .select('id, nome_funcionario, cliente_id, tbl_clientes(nome)')
      .eq('id', calculationId)
      .eq('tbl_clientes.user_id', user.id)
      .single();

    if (error) {
      showError('Erro ao carregar detalhes do cálculo: ' + error.message);
      console.error('Error fetching calculation details:', error);
      navigate('/dashboard');
    } else if (data) {
      setCalculationDetails({
        ...data,
        tbl_clientes: data.tbl_clientes ? (Array.isArray(data.tbl_clientes) ? data.tbl_clientes : [data.tbl_clientes]) : null
      } as CalculationDetails);
    }
  };

  const handleCalculateRescisao = async () => {
    if (!calculationId || !user) {
      showError('Usuário não autenticado ou ID do cálculo ausente.');
      return;
    }

    setCalculating(true);
    showSuccess('Iniciando cálculo preliminar...');

    const { data: calcData, error: calcError } = await supabase
      .from('tbl_calculos')
      .select('inicio_contrato, fim_contrato, cliente_id')
      .eq('id', calculationId)
      .single(); // Removed .eq('tbl_clientes.user_id', user.id) as it's already handled by RLS

    if (calcError || !calcData) {
      showError('Erro ao obter dados para o cálculo: ' + (calcError?.message || 'Dados não encontrados ou você não tem permissão para acessá-los.'));
      setCalculating(false);
      return;
    }

    const startDate = new Date(calcData.inicio_contrato);
    const endDate = new Date(calcData.fim_contrato);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const placeholderResponse = `Cálculo preliminar realizado.
    Tempo de contrato: ${diffDays} dias.
    Verbas simuladas: Férias Proporcionais, 13º Salário Proporcional, Aviso Prévio Indenizado.
    Este é um resultado simulado e não substitui um cálculo completo.`;

    const { error: insertError } = await supabase
      .from('tbl_resposta_calculo')
      .upsert({
        calculo_id: calculationId,
        resposta_ai: placeholderResponse,
        data_hora: new Date().toISOString(),
        url_documento_calculo: null, // Placeholder for now
        texto_extraido: null, // Placeholder for now
      }, { onConflict: 'calculo_id' });

    if (insertError) {
      showError('Erro ao salvar resultado do cálculo: ' + insertError.message);
      console.error('Error saving calculation result:', insertError);
    } else {
      showSuccess('Cálculo preliminar gerado e salvo!');
      fetchCalculationResult();
    }
    setCalculating(false);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-orange-500 hover:text-orange-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-4xl font-bold text-orange-500 text-center flex-grow">
            Resultado do Cálculo
          </h1>
          <div className="w-24"></div>
        </div>

        {calculationDetails && (
          <Card className="max-w-3xl mx-auto bg-gray-900 border-orange-500 text-white mb-6">
            <CardHeader>
              <CardTitle className="text-2xl text-orange-500">Detalhes do Cálculo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-semibold">Funcionário:</span> {calculationDetails.nome_funcionario}</p>
              <p><span className="font-semibold">Cliente:</span> {calculationDetails.tbl_clientes?.[0]?.nome || 'N/A'}</p>
              <p><span className="font-semibold">ID do Cálculo:</span> {calculationDetails.id}</p>
            </CardContent>
          </Card>
        )}

        <Card className="max-w-3xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="2xl text-orange-500">Resposta do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-gray-400">Carregando resultado...</p>
            ) : result ? (
              <div className="space-y-4">
                {result.resposta_ai && (
                  <div>
                    <h3 className="font-semibold text-orange-400 mb-2">Resposta da IA:</h3>
                    <p className="whitespace-pre-wrap text-gray-300">{result.resposta_ai}</p>
                  </div>
                )}
                {result.texto_extraido && (
                  <div>
                    <h3 className="font-semibold text-orange-400 mb-2">Texto Extraído do PDF:</h3>
                    <p className="whitespace-pre-wrap text-gray-300 text-sm max-h-60 overflow-y-auto border border-gray-700 p-3 rounded-md">{result.texto_extraido}</p>
                  </div>
                )}
                {result.url_documento_calculo && (
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-purple-400" />
                    <a
                      href={result.url_documento_calculo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Baixar Documento do Cálculo
                    </a>
                  </div>
                )}
                <p className="text-sm text-gray-500">Gerado em: {new Date(result.data_hora).toLocaleString()}</p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-gray-400">Nenhum resultado de cálculo encontrado para este ID.</p>
                <Button
                  onClick={handleCalculateRescisao}
                  disabled={calculating}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {calculating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Calculando...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" /> Gerar Cálculo Preliminar
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CalculationResultPage;