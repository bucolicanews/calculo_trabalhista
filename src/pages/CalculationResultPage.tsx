import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText } from 'lucide-react';
import { showError } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';

interface CalculationResult {
  id: string;
  calculo_id: string;
  resposta_ai: string | null;
  url_documento_calculo: string | null;
  texto_extraido: string | null;
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
  // Corrigido: Lendo o parâmetro 'id' da URL
  const { id } = useParams<{ id: string }>(); 
  const calculationId = id; // Usando 'calculationId' para manter o resto do código consistente
  const navigate = useNavigate();
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculationDetails, setCalculationDetails] = useState<CalculationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('CalculationResultPage: useEffect triggered.');
    console.log('Current calculationId from URL params (now "id"):', calculationId);
    console.log('Current authenticated user:', user?.id);

    if (calculationId && user) {
      fetchCalculationResult();
      fetchCalculationDetails();
    } else {
      console.log('CalculationResultPage: Not fetching results. Missing calculationId or user.');
      setLoading(false);
    }
  }, [calculationId, user]);

  const fetchCalculationResult = async () => {
    setLoading(true);
    console.log('fetchCalculationResult: Attempting to fetch result for calculo_id:', calculationId);
    const { data, error } = await supabase
      .from('tbl_resposta_calculo')
      .select('*')
      .eq('calculo_id', calculationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        console.log('fetchCalculationResult: No result found for this calculationId (PGRST116).');
      } else {
        showError('Erro ao carregar resultado do cálculo: ' + error.message);
        console.error('fetchCalculationResult: Error fetching calculation result:', error);
      }
      setResult(null);
    } else if (data) {
      console.log('fetchCalculationResult: Data received successfully:', data);
      setResult(data);
    } else {
      console.log('fetchCalculationResult: Data was null/undefined, but no error. This should not happen with .single().');
      setResult(null);
    }
    setLoading(false);
    console.log('fetchCalculationResult: Finished. Loading set to false.');
  };

  const fetchCalculationDetails = async () => {
    if (!user) {
      console.log('fetchCalculationDetails: User not authenticated, skipping fetch.');
      return;
    }
    console.log('fetchCalculationDetails: Starting fetch for calculation details for calculationId:', calculationId);

    const { data, error } = await supabase
      .from('tbl_calculos')
      .select('id, nome_funcionario, cliente_id, tbl_clientes(nome)')
      .eq('id', calculationId)
      .eq('tbl_clientes.user_id', user.id) // This join condition is crucial for RLS
      .single();

    if (error) {
      showError('Erro ao carregar detalhes do cálculo: ' + error.message);
      console.error('fetchCalculationDetails: Error fetching calculation details:', error);
      navigate('/dashboard');
    } else if (data) {
      console.log('fetchCalculationDetails: Details received:', data);
      setCalculationDetails({
        ...data,
        tbl_clientes: data.tbl_clientes ? (Array.isArray(data.tbl_clientes) ? data.tbl_clientes : [data.tbl_clientes]) : null
      } as CalculationDetails);
    } else {
      console.log('fetchCalculationDetails: No details found for calculationId:', calculationId);
    }
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CalculationResultPage;