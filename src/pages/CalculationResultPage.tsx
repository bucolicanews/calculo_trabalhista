import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Calculator } from 'lucide-react'; // Added Calculator import
import { showError, showSuccess } from '@/utils/toast';

interface CalculationResult {
  id: string;
  calculo_id: string;
  resposta_ai: string;
  data_hora: string;
}

interface CalculationDetails {
  id: string;
  nome_funcionario: string;
  cliente_id: string;
  tbl_clientes: Array<{
    nome: string;
  }> | null; // Adjusted to be an array or null based on TS error
}

const CalculationResultPage = () => {
  const { calculationId } = useParams<{ calculationId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculationDetails, setCalculationDetails] = useState<CalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (calculationId) {
      fetchCalculationResult();
      fetchCalculationDetails();
    }
  }, [calculationId]);

  const fetchCalculationResult = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_resposta_calculo')
      .select('*')
      .eq('calculo_id', calculationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
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
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select('id, nome_funcionario, cliente_id, tbl_clientes(nome)')
      .eq('id', calculationId)
      .single();

    if (error) {
      showError('Erro ao carregar detalhes do cálculo: ' + error.message);
      console.error('Error fetching calculation details:', error);
      navigate('/dashboard');
    } else if (data) {
      // Explicitly cast data to CalculationDetails to help TypeScript
      // Access tbl_clientes as an array and get the first element's name
      setCalculationDetails({
        ...data,
        tbl_clientes: data.tbl_clientes ? (Array.isArray(data.tbl_clientes) ? data.tbl_clientes : [data.tbl_clientes]) : null
      } as CalculationDetails);
    }
  };

  const handleCalculateRescisao = async () => {
    if (!calculationId) return;

    setCalculating(true);
    showSuccess('Iniciando cálculo preliminar...');

    // Placeholder logic for calculation
    const { data: calcData, error: calcError } = await supabase
      .from('tbl_calculos')
      .select('inicio_contrato, fim_contrato')
      .eq('id', calculationId)
      .single();

    if (calcError || !calcData) {
      showError('Erro ao obter dados para o cálculo: ' + (calcError?.message || 'Dados não encontrados.'));
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
      }, { onConflict: 'calculo_id' }); // Upsert based on calculo_id

    if (insertError) {
      showError('Erro ao salvar resultado do cálculo: ' + insertError.message);
      console.error('Error saving calculation result:', insertError);
    } else {
      showSuccess('Cálculo preliminar gerado e salvo!');
      fetchCalculationResult(); // Refresh the displayed result
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
          <div className="w-24"></div> {/* Placeholder for alignment */}
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
                <p className="whitespace-pre-wrap text-gray-300">{result.resposta_ai}</p>
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