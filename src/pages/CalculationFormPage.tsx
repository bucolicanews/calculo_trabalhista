import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import ClientSelectField from '@/components/calculations/ClientSelectField';
import SindicatoSelectField from '@/components/calculations/SindicatoSelectField';
import AiPromptTemplateSelectField from '@/components/calculations/AiPromptTemplateSelectField';
import EmployeeDetailsSection from '@/components/calculations/EmployeeDetailsSection';
import ContractDatesSection from '@/components/calculations/ContractDatesSection';
import AvisoTypeSelectField from '@/components/calculations/AvisoTypeSelectField';
import SalaryAndObservationsSection from '@/components/calculations/SalaryAndObservationsSection';
import AveragesSection from '@/components/calculations/AveragesSection';
import ContractHistoryAndCTPS from '@/components/calculations/ContractHistoryAndCTPS';
import { formatCurrencyForDisplay, parseCurrencyToNumber } from '@/utils/formatters';

// --- Tipos e Constantes ---
interface Client { id: string; nome: string; }
interface Sindicato { id: string; nome: string; }
interface AiPromptTemplate { id: string; title: string; }

const noticeTypes = [
    { value: 'rescisao_sem_justa_causa', label: 'Sem Justa Causa' },
    { value: 'pedido_de_demissao', label: 'Pedido de Demissão' },
    { value: 'justa_causa', label: 'Justa Causa' },
    { value: 'acordo_mutuo', label: 'Acordo Mútuo (Art. 484-A)' },
    { value: 'rescisao_indireta', label: 'Rescisão Indireta' },
    { value: 'termino_contrato_determinado', label: 'Término Contrato Determinado' },
];

const initialCalculationState = {
    cliente_id: '',
    sindicato_id: '',
    ai_template_id: '',
    nome_funcionario: '',
    cpf_funcionario: '',
    funcao_funcionario: '',
    inicio_contrato: '',
    fim_contrato: '',
    data_aviso: '',
    tipo_aviso: 'rescisao_sem_justa_causa',
    salario_sindicato: 0,
    salario_trabalhador: 0,
    obs_sindicato: '',
    historia: '',
    ctps_assinada: false,
    media_descontos: 0,
    media_remuneracoes: 0,
    carga_horaria: '',
    // Novos campos booleanos/numéricos
    vale_transporte: false,
    caixa: false,
    insalubre: false,
    periculosidade: false,
    qunat_folgas_trabalhadas: 0,
    ferias_retroativas: false,
    '13_retroativo': false,
    he_retroativa: false,
    isalubridade_retroativa: false,
    periculosidade_retroativa: false,
    hx_mes: false,
    n_he: false,
    n_feriados: false,
    n_folgas: false,
    ignorar_salario_sindicato: false,
    info_basico: false,
    sem_cpts_assinada: false,
    inicio_contrat_inregular: '',
    debito_com_empresa: 0,
    valor_recebido_ferias: 0,
    valor_recebido_13: 0,
    quebra_caixa: false,
    quebra_caixa_retroativo: false,
    n_dif_salario: false,
    qunt_feriados_trabalhados: 0,
    somente_proporcional: false,
    recebia_sem_1_3: false,
    n_calcular_descontos: false,
    somente_inss: false,
    info_faltas: '',
    qunat_faltas: 0,
    faltou_todo_aviso: false,
    faltas: false,
    info_proventos: '',
    n_calcular_proventos: false,
    info_descontos: '',
};

type Calculation = typeof initialCalculationState;

const currencyFields: (keyof Calculation)[] = [
    'salario_trabalhador',
    'salario_sindicato',
    'media_descontos',
    'media_remuneracoes',
    'debito_com_empresa',
    'valor_recebido_ferias',
    'valor_recebido_13',
];

const CalculationFormPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const [calculation, setCalculation] = useState<Calculation>(initialCalculationState);
    const [clients, setClients] = useState<Client[]>([]);
    const [sindicatos, setSindicatos] = useState<Sindicato[]>([]);
    const [aiTemplates, setAiTemplates] = useState<AiPromptTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user, id]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('tbl_clientes')
                .select('id, nome')
                .eq('user_id', user?.id)
                .order('nome', { ascending: true });
            if (clientsError) throw clientsError;
            setClients(clientsData || []);

            // 2. Fetch Sindicatos
            const { data: sindicatosData, error: sindicatosError } = await supabase
                .from('tbl_sindicatos')
                .select('id, nome')
                .order('nome', { ascending: true });
            if (sindicatosError) throw sindicatosError;
            setSindicatos(sindicatosData || []);

            // 3. Fetch AI Templates
            const { data: templatesData, error: templatesError } = await supabase
                .from('tbl_ai_prompt_templates')
                .select('id, title')
                .eq('user_id', user?.id)
                .order('title', { ascending: true });
            if (templatesError) throw templatesError;
            setAiTemplates(templatesData || []);

            // 4. Fetch Calculation Data if editing
            if (isEditing && id) {
                const { data: calcData, error: calcError } = await supabase
                    .from('tbl_calculos')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (calcError) throw calcError;

                const loadedCalculation = calcData as Calculation;
                const initialCurrencyValues: Partial<Calculation> = {};

                // Aplica formatação de moeda
                currencyFields.forEach(field => {
                    const value = loadedCalculation[field];
                    // Se o valor for booleano (como 'false'), trata como 0 para evitar erro de formatação de moeda.
                    const safeValue = typeof value === 'boolean' ? 0 : value; 
                    initialCurrencyValues[field] = formatCurrencyForDisplay(safeValue);
                });

                setCalculation(prev => ({
                    ...prev,
                    ...loadedCalculation,
                    ...initialCurrencyValues,
                    // Garante que os campos de data sejam strings ISO (AAAA-MM-DD)
                    inicio_contrato: loadedCalculation.inicio_contrato || '',
                    fim_contrato: loadedCalculation.fim_contrato || '',
                    inicio_contrat_inregular: loadedCalculation.inicio_contrat_inregular || '',
                    data_aviso: loadedCalculation.data_aviso || '',
                }));
            } else {
                // Se for novo cálculo, tenta preencher o template padrão do perfil
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('default_ai_template_id')
                    .eq('id', user?.id)
                    .single();

                if (profileData?.default_ai_template_id) {
                    setCalculation(prev => ({
                        ...prev,
                        ai_template_id: profileData.default_ai_template_id,
                    }));
                }
            }
        } catch (error: any) {
            showError('Erro ao carregar dados iniciais: ' + error.message);
            console.error('Error fetching initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (currencyFields.includes(name as keyof Calculation)) {
            // Mantém a formatação de moeda na exibição
            setCalculation((prev) => ({ ...prev, [name]: value }));
        } else if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setCalculation((prev) => ({ ...prev, [name]: checked }));
        } else {
            setCalculation((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleDateChange = (name: string, dateString: string) => {
        setCalculation((prev) => ({ ...prev, [name]: dateString }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setCalculation((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            showError('Usuário não autenticado.');
            return;
        }
        setIsSubmitting(true);

        // 1. Converte campos de moeda de volta para número
        const numericData: Partial<Calculation> = {};
        currencyFields.forEach(field => {
            numericData[field] = parseCurrencyToNumber(String(calculation[field]));
        });

        // 2. Prepara o payload
        const payload = {
            ...calculation,
            ...numericData,
            // Garante que IDs nulos sejam null, não strings vazias
            sindicato_id: calculation.sindicato_id || null,
            ai_template_id: calculation.ai_template_id || null,
        };

        let response;
        if (isEditing) {
            response = await supabase
                .from('tbl_calculos')
                .update(payload)
                .eq('id', id);
        } else {
            response = await supabase
                .from('tbl_calculos')
                .insert(payload);
        }

        if (response.error) {
            showError('Erro ao salvar cálculo: ' + response.error.message);
            console.error('Error saving calculation:', response.error);
        } else {
            showSuccess(`Cálculo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
            navigate('/calculations');
        }
        setIsSubmitting(false);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="container mx-auto py-8 text-center text-gray-400">Carregando dados...</div>
            </MainLayout>
        );
    }

    if (!isEditing && clients.length === 0) {
        return (
            <MainLayout>
                <div className="container mx-auto py-8 text-center">
                    <Card className="max-w-xl mx-auto bg-gray-900 border-orange-500 text-white">
                        <CardHeader>
                            <CardTitle className="text-2xl text-orange-500">Atenção!</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-300 mb-4">Você precisa cadastrar pelo menos um Empregador antes de criar um Cálculo.</p>
                            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                                <a href="/clients/new">
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Cadastrar Empregador
                                </a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <Button variant="ghost" onClick={() => navigate('/calculations')} className="text-orange-500 hover:text-orange-600 mb-4 sm:mb-0 sm:w-auto">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                    </Button>
                    <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 flex-grow text-center sm:text-center">
                        {isEditing ? 'Editar Cálculo' : 'Novo Cálculo'}
                    </h1>
                    <div className="w-full sm:w-24 h-0 sm:h-auto"></div>
                </div>

                <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
                    <CardHeader>
                        <CardTitle className="text-2xl text-orange-500">Dados da Rescisão</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* --- SELETORES DE RELACIONAMENTO --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ClientSelectField
                                    cliente_id={calculation.cliente_id}
                                    clients={clients}
                                    onValueChange={(value) => handleSelectChange('cliente_id', value)}
                                    disabled={isSubmitting}
                                />
                                <SindicatoSelectField
                                    sindicato_id={calculation.sindicato_id || ''}
                                    sindicatos={sindicatos}
                                    onValueChange={(value) => handleSelectChange('sindicato_id', value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <AiPromptTemplateSelectField
                                ai_template_id={calculation.ai_template_id || ''}
                                aiTemplates={aiTemplates}
                                onValueChange={(value) => handleSelectChange('ai_template_id', value)}
                                disabled={isSubmitting}
                            />

                            {/* --- DETALHES DO FUNCIONÁRIO --- */}
                            <h3 className="text-xl font-semibold text-orange-400 border-b border-gray-700 pb-2">Dados do Funcionário</h3>
                            <EmployeeDetailsSection
                                nome_funcionario={calculation.nome_funcionario}
                                cpf_funcionario={calculation.cpf_funcionario}
                                funcao_funcionario={calculation.funcao_funcionario}
                                carga_horaria={calculation.carga_horaria}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />

                            {/* --- DATAS E TIPO DE AVISO --- */}
                            <h3 className="text-xl font-semibold text-orange-400 border-b border-gray-700 pb-2">Datas e Rescisão</h3>
                            <ContractDatesSection
                                inicio_contrato={calculation.inicio_contrato}
                                fim_contrato={calculation.fim_contrato}
                                inicio_contrat_inregular={calculation.inicio_contrat_inregular}
                                data_aviso={calculation.data_aviso}
                                onDateChange={handleDateChange}
                                disabled={isSubmitting}
                            />
                            <AvisoTypeSelectField
                                tipo_aviso={calculation.tipo_aviso}
                                noticeTypes={noticeTypes}
                                onValueChange={(value) => handleSelectChange('tipo_aviso', value)}
                                disabled={isSubmitting}
                            />

                            {/* --- SALÁRIOS E OBSERVAÇÕES --- */}
                            <h3 className="text-xl font-semibold text-orange-400 border-b border-gray-700 pb-2">Remuneração e Histórico</h3>
                            <SalaryAndObservationsSection
                                salario_sindicato={calculation.salario_sindicato}
                                salario_trabalhador={calculation.salario_trabalhador}
                                obs_sindicato={calculation.obs_sindicato}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            <AveragesSection
                                media_descontos={calculation.media_descontos}
                                media_remuneracoes={calculation.media_remuneracoes}
                                onChange={handleChange}
                                disabled={isSubmitting}
                            />
                            <ContractHistoryAndCTPS
                                historia={calculation.historia}
                                ctps_assinada={calculation.ctps_assinada}
                                onTextChange={handleChange}
                                onCheckboxChange={(checked) => handleSelectChange('ctps_assinada', checked ? 'true' : 'false')}
                                disabled={isSubmitting}
                            />

                            {/* --- INFORMAÇÕES ADICIONAIS (CHECKBOXES) --- */}
                            <h3 className="text-xl font-semibold text-orange-400 border-b border-gray-700 pb-2">Informações Adicionais</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Linha 1 */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="vale_transporte" checked={calculation.vale_transporte} onCheckedChange={(checked) => handleSelectChange('vale_transporte', checked ? 'true' : 'false')} disabled={isSubmitting} className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white" />
                                    <Label htmlFor="vale_transporte" className="text-gray-300">Vale Transporte</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="caixa" checked={calculation.caixa} onCheckedChange={(checked) => handleSelectChange('caixa', checked ? 'true' : 'false')} disabled={isSubmitting} className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white" />
                                    <Label htmlFor="caixa" className="text-gray-300">Caixa</Label>
                                </div>
                                {/* Linha 2 */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="insalubre" checked={calculation.insalubre} onCheckedChange={(checked) => handleSelectChange('insalubre', checked ? 'true' : 'false')} disabled={isSubmitting} className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white" />
                                    <Label htmlFor="insalubre" className="text-gray-300">Insalubre</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="periculosidade" checked={calculation.periculosidade} onCheckedChange={(checked) => handleSelectChange('periculosidade', checked ? 'true' : 'false')} disabled={isSubmitting} className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white" />
                                    <Label htmlFor="periculosidade" className="text-gray-300">Periculosidade</Label>
                                </div>
                                {/* Linha 3 */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="quebra_caixa" checked={calculation.quebra_caixa} onCheckedChange={(checked) => handleSelectChange('quebra_caixa', checked ? 'true' : 'false')} disabled={isSubmitting} className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white" />
                                    <Label htmlFor="quebra_caixa" className="text-gray-300">Quebra de Caixa</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="sem_cpts_assinada" checked={calculation.sem_cpts_assinada} onCheckedChange={(checked) => handleSelectChange('sem_cpts_assinada', checked ? 'true' : 'false')} disabled={isSubmitting} className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white" />
                                    <Label htmlFor="sem_cpts_assinada" className="text-gray-300">Sem CTPS Assinada</Label>
                                </div>
                            </div>

                            {/* --- CAMPOS DE INFORMAÇÃO EXTRA --- */}
                            <h3 className="text-xl font-semibold text-orange-400 border-b border-gray-700 pb-2">Informações para IA</h3>
                            <div>
                                <Label htmlFor="info_proventos" className="text-gray-300">Informações Adicionais sobre Proventos</Label>
                                <Textarea id="info_proventos" name="info_proventos" value={calculation.info_proventos} onChange={handleChange} rows={3} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" disabled={isSubmitting} />
                            </div>
                            <div>
                                <Label htmlFor="info_descontos" className="text-gray-300">Informações Adicionais sobre Descontos</Label>
                                <Textarea id="info_descontos" name="info_descontos" value={calculation.info_descontos} onChange={handleChange} rows={3} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" disabled={isSubmitting} />
                            </div>

                            <Button type="submit" disabled={isSubmitting} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                                {isSubmitting ? (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                                    </>
                                ) : (
                                    isEditing ? 'Atualizar Cálculo' : 'Criar Cálculo e Enviar para IA'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default CalculationFormPage;