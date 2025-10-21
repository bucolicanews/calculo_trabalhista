import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useParams, Link } from 'react-router-dom';
import { useCalculationDetails, ProventoDisplay, DescontoDisplay } from '@/hooks/useCalculationDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download, Send, RefreshCw, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { showError, showSuccess } from '@/utils/toast';
import { supabase } from '@/integrations/supabase/client';
import CalculationWebhookSender from '@/components/calculations/CalculationWebhookSender';

// Helper function to format currency
const formatCurrency = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return 'R$ 0,00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(num);
};

// Componente para exibir uma verba (Provento ou Desconto)
const VerbaItem: React.FC<{ item: ProventoDisplay | DescontoDisplay, type: 'provento' | 'desconto' }> = ({ item, type }) => {
    const name = type === 'provento' ? (item as ProventoDisplay).Provento : (item as DescontoDisplay).Desconto;
    const valor = item.Cálculo.Valor;
    const isIrregularidade = item.Natureza_da_Verba === 'Irregularidade_Contratual';

    return (
        <div className={`p-4 border-l-4 ${type === 'provento' ? 'border-green-500' : 'border-red-500'} bg-gray-800 rounded-md shadow-sm mb-4`}>
            <div className="flex justify-between items-start">
                <h4 className={`text-lg font-semibold ${type === 'provento' ? 'text-green-400' : 'text-red-400'}`}>
                    {name}
                </h4>
                <span className={`text-lg font-bold ${type === 'provento' ? 'text-green-300' : 'text-red-300'}`}>
                    {formatCurrency(valor)}
                </span>
            </div>
            {isIrregularidade && (
                <p className="text-xs text-yellow-500 mt-1">⚠️ Verba de Irregularidade Contratual</p>
            )}
            <p className="text-sm text-gray-400 mt-2">
                <span className="font-medium text-gray-300">Memória de Cálculo:</span> {item.Memoria_de_Calculo}
            </p>
            <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium text-gray-400">Legislação:</span> {item.Legislação}
            </p>
        </div>
    );
};

const CalculationResultPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { calculation, displayProventos, displayDescontos, loading, hasAnyResult } = useCalculationDetails(id);
    
    const [isSendingWebhook, setIsSendingWebhook] = useState(false);
    const [isWebhookSelectionOpen, setIsWebhookSelectionOpen] = useState(false);

    const totalProventos = displayProventos.reduce((sum, p) => sum + (p.Cálculo.Valor || 0), 0);
    const totalDescontos = displayDescontos.reduce((sum, d) => sum + (d.Cálculo.Valor || 0), 0);
    const valorLiquido = totalProventos - totalDescontos;

    const handleDownload = () => {
        if (calculation?.tbl_resposta_calculo?.url_documento_calculo) {
            window.open(calculation.tbl_resposta_calculo.url_documento_calculo, '_blank');
        } else {
            showError('Nenhum documento de cálculo disponível para download.');
        }
    };

    const handleOpenWebhookSelection = () => {
        setIsWebhookSelectionOpen(true);
    };

    const handleSendToWebhook = async (calculationId: string, webhookConfigIds: string[]) => {
        if (!calculationId) return;

        setIsSendingWebhook(true);
        showSuccess('Iniciando reenvio para webhooks selecionados...');

        try {
            // Chama a função Supabase para reprocessar o webhook
            const { data, error } = await supabase.functions.invoke('send-webhook', {
                body: {
                    calculation_id: calculationId,
                    webhook_config_ids: webhookConfigIds,
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            if (data && data.success) {
                showSuccess(`Cálculo reenviado com sucesso para ${data.sentCount} webhook(s)!`);
            } else {
                showError('Falha ao reenviar webhook. Verifique os logs.');
            }

        } catch (error: any) {
            showError('Erro ao reenviar webhook: ' + error.message);
            console.error('Webhook resend error:', error);
        } finally {
            setIsSendingWebhook(false);
        }
    };

    if (loading) {
        return <MainLayout><div className="container text-center py-8 text-gray-400"><Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" /> Carregando resultado...</div></MainLayout>;
    }

    if (!calculation) {
        return <MainLayout><div className="container text-center py-8 text-red-500">Cálculo não encontrado ou acesso negado.</div></MainLayout>;
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-4xl font-bold text-orange-500">Resultado: {calculation.nome_funcionario}</h1>
                    <div className="flex space-x-3">
                        <Button asChild variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                            <Link to={`/calculations/${id}`}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Editar Dados
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                            onClick={handleOpenWebhookSelection}
                            disabled={isSendingWebhook || !hasAnyResult}
                        >
                            <Send className="mr-2 h-4 w-4" /> Reenviar Webhook
                        </Button>
                    </div>
                </div>

                {/* --- RESUMO GERAL --- */}
                <Card className="bg-gray-900 border-orange-500 text-white mb-8">
                    <CardHeader>
                        <CardTitle className="text-2xl text-orange-500">Resumo Financeiro</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-400">Total Proventos</p>
                            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalProventos)}</p>
                        </div>
                        <div className="p-4 bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-400">Total Descontos</p>
                            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalDescontos)}</p>
                        </div>
                        <div className="p-4 bg-gray-700 rounded-lg border border-orange-500">
                            <p className="text-sm text-orange-400 font-semibold">Valor Líquido</p>
                            <p className="text-3xl font-extrabold text-orange-300">{formatCurrency(valorLiquido)}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* --- DETALHES DO CÁLCULO --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Coluna 1: Proventos */}
                    <Card className="bg-gray-900 border-green-500 text-white">
                        <CardHeader>
                            <CardTitle className="text-xl text-green-500">Proventos (Remuneração)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {displayProventos.length > 0 ? (
                                displayProventos.map((p, index) => <VerbaItem key={index} item={p} type="provento" />)
                            ) : (
                                <p className="text-gray-400">Nenhum provento calculado.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Coluna 2: Descontos */}
                    <Card className="bg-gray-900 border-red-500 text-white">
                        <CardHeader>
                            <CardTitle className="text-xl text-red-500">Descontos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {displayDescontos.length > 0 ? (
                                displayDescontos.map((d, index) => <VerbaItem key={index} item={d} type="desconto" />)
                            ) : (
                                <p className="text-gray-400">Nenhum desconto calculado.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* --- INFORMAÇÕES ADICIONAIS E DOWNLOAD --- */}
                <Card className="bg-gray-900 border-gray-700 text-white mt-8">
                    <CardHeader>
                        <CardTitle className="text-xl text-gray-300">Informações do Processamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-400">
                            <span className="font-semibold text-orange-400">Modelo IA Utilizado:</span> {calculation.tbl_ai_prompt_templates?.title || 'N/A'}
                        </p>
                        {calculation.tbl_resposta_calculo && (
                            <>
                                <p className="text-sm text-gray-400">
                                    <span className="font-semibold text-orange-400">Data da Resposta:</span> {format(new Date(calculation.tbl_resposta_calculo.data_hora), 'dd/MM/yyyy HH:mm')}
                                </p>
                                {calculation.tbl_resposta_calculo.url_documento_calculo && (
                                    <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Download className="mr-2 h-4 w-4" /> Baixar Documento de Cálculo
                                    </Button>
                                )}
                                {calculation.tbl_resposta_calculo.texto_extraido && (
                                    <div className="p-3 bg-gray-800 rounded-md max-h-40 overflow-y-auto">
                                        <p className="font-semibold text-gray-300 flex items-center"><FileText className="mr-2 h-4 w-4" /> Texto Extraído do Documento:</p>
                                        <p className="text-xs text-gray-500 whitespace-pre-wrap mt-1">{calculation.tbl_resposta_calculo.texto_extraido}</p>
                                    </div>
                                )}
                            </>
                        )}
                        {!hasAnyResult && (
                            <p className="text-red-500 font-semibold">Ainda não há resultados de cálculo disponíveis para este registro.</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {id && (
                <CalculationWebhookSender
                    calculationId={id}
                    isOpen={isWebhookSelectionOpen}
                    onOpenChange={setIsWebhookSelectionOpen}
                    onSend={handleSendToWebhook}
                    isSending={isSendingWebhook}
                />
            )}
        </MainLayout>
    );
};

export default CalculationResultPage;