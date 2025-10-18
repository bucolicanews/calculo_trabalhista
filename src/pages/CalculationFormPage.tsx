import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft } from 'lucide-react';
import ClientSelectField from '@/components/calculations/ClientSelectField';
import SindicatoSelectField from '@/components/calculations/SindicatoSelectField';
import AiPromptTemplateSelectField from '@/components/calculations/AiPromptTemplateSelectField';
import AvisoTypeSelectField from '@/components/calculations/AvisoTypeSelectField';
import EmployeeDetailsSection from '@/components/calculations/EmployeeDetailsSection';
import ContractDatesSection from '@/components/calculations/ContractDatesSection';
import SalaryAndObservationsSection from '@/components/calculations/SalaryAndObservationsSection';
import AveragesSection from '@/components/calculations/AveragesSection';
import ContractHistoryAndCTPS from '@/components/calculations/ContractHistoryAndCTPS';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// --- Interfaces e Tipos ---

interface Client { id: string; nome: string; }
interface Sindicato { id: string; nome: string; }
interface AiPromptTemplate { id: string; title: string; }

interface CalculationState {
  cliente_id: string;
  sindicato_id: string;
  ai_template_id: string;
  nome_funcionario: string;
  cpf_funcionario: string;
  funcao_funcionario: string;
  inicio_contrato: string; // ISO Date string (YYYY-MM-DD)
  fim_contrato: string;     // ISO Date string (YYYY-MM-DD)
  data_aviso: string;       // ISO Date string (YYYY-MM-DD)
  tipo_aviso: string;
  salario_sindicato: number | string;
  salario_trabalhador: number | string;
  obs_sindicato: string;
  historia: string;
  ctps_assinada: boolean;
  media_descontos: number | string;
  media_remuneracoes: number | string;
  carga_horaria: string;
  info_descontos: string; // Novo campo
  inicio_contrat_inregular: string; // Novo campo
}

interface CurrencyState {
  salario_sindicato: string;
  salario_trabalhador: string;
  media_descontos: string;
  media_remuneracoes: string;
}

// --- Constantes e Helpers ---

const noticeTypes = [
  { label: 'Sem Justa Causa', value: 'rescisao_sem_justa_causa' },
  { label: 'Com Justa Causa', value: 'rescisao_com_justa_causa' },
  { label: 'Pedido de Demissão', value: 'pedido_de_demissao' },
  { label: 'Acordo Mútuo (Art. 484-A)', value: 'acordo_mutuo' },
  { label: 'Término Contrato Determinado', value: 'termino_contrato_determinado' },
  { label: 'Rescisão Indireta', value: 'rescisao_indireta' },
];

const currencyFields = [
  'salario_sindicato',
  'salario_trabalhador',
  'media_descontos',
  'media_remuneracoes',
];

const formatCurrencyForDisplay = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  // Garante que booleanos (como 'false' do DB) sejam tratados como 0
  const safeValue = typeof value === 'boolean' ? 0 : value;
  const num = typeof safeValue === 'string' ? parseFloat(safeValue.replace(/\./g, '').replace(',', '.')) : Number(safeValue);
  if (isNaN(num)) return '';
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrencyForSave = (displayValue: string | number): number | null => {
  if (typeof displayValue === 'number') return displayValue;
  if (!displayValue) return null;
  const cleaned = displayValue.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
};

const CalculationFormPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [clients, setClients] = useState<Client[]>([]);
  const [sindicatos, setSindicatos] = useState<Sindicato[]>([]);
  const [aiTemplates, setAiTemplates] = useState<AiPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [calculation, setCalculation] = useState<CalculationState>({
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
    salario_sindicato: '',
    salario_trabalhador: '',
    obs_sindicato: '',
    historia: '',
    ctps_assinada: true,
    media_descontos: '',
    media_remuneracoes: '',
    carga_horaria: '',
    info_descontos: '',
    inicio_contrat_inregular: '',
  });

  // Estado para inputs de moeda (mantém a formatação de exibição)
  const [currencyInputs, setCurrencyInputs] = useState<CurrencyState>({
    salario_sindicato: '',
    salario_trabalhador: '',
    media_descontos: '',
    media_remuneracoes: '',
  });

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user, id]);

  const fetchInitialData = async () => {
    setLoading(true);
    const [clientsRes, sindicatosRes, templatesRes] = await Promise.all([
      supabase.from('tbl_clientes').select('id, nome').eq('user_id', user?.id).order('nome'),
      supabase.from('tbl_sindicatos').select('id, nome').order('nome'),
      supabase.from('tbl_ai_prompt_templates').select('id, title').eq('user_id', user?.id).order('title'),
    ]);

    if (clientsRes.error) showError('Erro ao carregar clientes: ' + clientsRes.error.message);
    if (sindicatosRes.error) showError('Erro ao carregar sindicatos: ' + sindicatosRes.error.message);
    if (templatesRes.error) showError('Erro ao carregar modelos IA: ' + templatesRes.error.message);

    setClients(clientsRes.data || []);
    setSindicatos(sindicatosRes.data || []);
    setAiTemplates(templatesRes.data || []);

    if (isEditing) {
      await fetchCalculation();
    } else {
      setLoading(false);
    }
  };

  const fetchCalculation = async () => {
    const { data: loadedCalculation, error } = await supabase
      .from('tbl_calculos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar cálculo: ' + error.message);
      navigate('/calculations');
    } else if (loadedCalculation) {
      const initialCurrencyValues: Partial<CurrencyState> = {};

      // Fix for TS2345: Ensure only string or number is passed to formatCurrencyForDisplay
      currencyFields.forEach(field => {
          const value = loadedCalculation[field];
          // Se o valor for booleano (como 'false'), trata como 0 para evitar erro de formatação de moeda.
          const safeValue = typeof value === 'boolean' ? 0 : value; 
          initialCurrencyValues[field as keyof CurrencyState] = formatCurrencyForDisplay(safeValue);
      });

      setCalculation({
        ...loadedCalculation,
        salario_sindicato: loadedCalculation.salario_sindicato || '',
        salario_trabalhador: loadedCalculation.salario_trabalhador || '',
        media_descontos: loadedCalculation.media_descontos || '',
        media_remuneracoes: loadedCalculation.media_remuneracoes || '',
        ctps_assinada: loadedCalculation.ctps_assinada ?? true,
        info_descontos: loadedCalculation.info_descontos || '',
        inicio_contrat_inregular: loadedCalculation.inicio_contrat_inregular || '',
        data_aviso: loadedCalculation.data_aviso || '',
      } as CalculationState);
      setCurrencyInputs(initialCurrencyValues as CurrencyState);
    }
    setLoading(false);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCalculation((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, dateString: string) => {
    setCalculation((prev) => ({ ...prev, [name]: dateString }));
  };

  const handleSelectChange = (name: keyof CalculationState, value: string) => {
    setCalculation((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCalculation((prev) => ({ ...prev, ctps_assinada: checked }));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const cleanedValue = value.replace(/[^\d,]/g, '');
    const [integerPart, decimalPart] = cleanedValue.split(',');

    let formattedValue = integerPart;
    if (integerPart) {
      formattedValue = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    if (decimalPart !== undefined) {
      formattedValue += `,${decimalPart.substring(0, 2)}`;
    }

    setCurrencyInputs((prev) => ({ ...prev, [name]: formattedValue } as CurrencyState));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }
    setIsSaving(true);

    // 1. Parse currency inputs back to numbers/null
    const parsedCurrencyData = currencyFields.reduce((acc, field) => {
      acc[field as keyof CalculationState] = parseCurrencyForSave(currencyInputs[field as keyof CurrencyState]);
      return acc;
    }, {} as Partial<CalculationState>);

    // 2. Combine all data
    const calculationData = {
      ...calculation,
      ...parsedCurrencyData,
      user_id: user.id,
      // Ensure empty strings for optional IDs are converted to null for Supabase
      sindicato_id: calculation.sindicato_id || null,
      ai_template_id: calculation.ai_template_id || null,
    };

    let response;
    if (isEditing) {
      response = await supabase
        .from('tbl_calculos')
        .update(calculationData)
        .eq('id', id);
    } else {
      response = await supabase
        .from('tbl_calculos')
        .insert(calculationData);
    }

    if (response.error) {
      showError('Erro ao salvar cálculo: ' + response.error.message);
      console.error('Error saving calculation:', response.error);
    } else {
      showSuccess(`Cálculo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/calculations');
    }
    setIsSaving(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando dados iniciais...</div>
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

              {/* SELETORES DE RELACIONAMENTO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ClientSelectField
                  cliente_id={calculation.cliente_id}
                  clients={clients}
                  onValueChange={(value) => handleSelectChange('cliente_id', value)}
                  disabled={isSaving}
                />
                <SindicatoSelectField
                  sindicato_id={calculation.sindicato_id}
                  sindicatos={sindicatos}
                  onValueChange={(value) => handleSelectChange('sindicato_id', value)}
                  disabled={isSaving}
                />
                <AiPromptTemplateSelectField
                  ai_template_id={calculation.ai_template_id}
                  aiTemplates={aiTemplates}
                  onValueChange={(value) => handleSelectChange('ai_template_id', value)}
                  disabled={isSaving}
                />
              </div>

              {/* DETALHES DO FUNCIONÁRIO */}
              <EmployeeDetailsSection
                nome_funcionario={calculation.nome_funcionario}
                cpf_funcionario={calculation.cpf_funcionario}
                funcao_funcionario={calculation.funcao_funcionario}
                carga_horaria={calculation.carga_horaria}
                onChange={handleTextChange}
                disabled={isSaving}
              />

              {/* DATAS E TIPO DE AVISO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AvisoTypeSelectField
                  tipo_aviso={calculation.tipo_aviso}
                  noticeTypes={noticeTypes}
                  onValueChange={(value) => handleSelectChange('tipo_aviso', value)}
                  disabled={isSaving}
                />
              </div>
              <ContractDatesSection
                inicio_contrato={calculation.inicio_contrato}
                fim_contrato={calculation.fim_contrato}
                inicio_contrat_inregular={calculation.inicio_contrat_inregular}
                data_aviso={calculation.data_aviso}
                onDateChange={handleDateChange}
                disabled={isSaving}
              />

              {/* SALÁRIOS E OBSERVAÇÕES */}
              <SalaryAndObservationsSection
                salario_sindicato={currencyInputs.salario_sindicato as any} // Passa a string formatada
                salario_trabalhador={currencyInputs.salario_trabalhador as any} // Passa a string formatada
                obs_sindicato={calculation.obs_sindicato}
                onChange={handleCurrencyChange} // Usa o manipulador de moeda
                disabled={isSaving}
              />

              {/* MÉDIAS */}
              <AveragesSection
                media_descontos={currencyInputs.media_descontos as any} // Passa a string formatada
                media_remuneracoes={currencyInputs.media_remuneracoes as any} // Passa a string formatada
                onChange={handleCurrencyChange} // Usa o manipulador de moeda
                disabled={isSaving}
              />

              {/* HISTÓRICO E CTPS */}
              <ContractHistoryAndCTPS
                historia={calculation.historia}
                ctps_assinada={calculation.ctps_assinada}
                onTextChange={handleTextChange}
                onCheckboxChange={handleCheckboxChange}
                disabled={isSaving}
              />

              {/* NOVO CAMPO DE INFORMAÇÕES DE DESCONTOS */}
              <div>
                <Label htmlFor="info_descontos" className="text-gray-300">Informações Adicionais de Descontos (Opcional)</Label>
                <Textarea
                  id="info_descontos"
                  name="info_descontos"
                  value={calculation.info_descontos}
                  onChange={handleTextChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={isSaving}
                  placeholder="Ex: Desconto de R$ 500,00 referente a um empréstimo não quitado."
                />
              </div>

              <Button type="submit" disabled={isSaving} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {isSaving ? 'Salvando...' : (isEditing ? 'Atualizar Cálculo' : 'Criar Cálculo')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CalculationFormPage;