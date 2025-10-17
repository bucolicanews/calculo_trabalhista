import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';

// Assuming you have these components for inputs.
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Modular components
import ClientSelectField from '@/components/calculations/ClientSelectField';
import SindicatoSelectField from '@/components/calculations/SindicatoSelectField';
import AiPromptTemplateSelectField from '@/components/calculations/AiPromptTemplateSelectField';
import ContractDatesSection from '@/components/calculations/ContractDatesSection';
import RescissionTypeSelectField from '@/components/calculations/RescissionTypeSelectField';
import AvisoTypeSelectField from '@/components/calculations/AvisoTypeSelectField';

// Type definitions (assuming they are defined elsewhere or inferred)
interface Client { id: string; nome: string; }
interface Sindicato { id: string; nome: string; }
interface AiPromptTemplate { id: string; nome: string; }

// Initial state structure (updated to include all required fields)
const initialCalculationState = {
  cliente_id: '',
  sindicato_id: '',
  ai_template_id: '',
  nome_funcionario: '',
  cpf_funcionario: '',
  funcao_funcionario: '',
  inicio_contrato: '',
  fim_contrato: '',
  inicio_contrat_inregular: '',
  tip_recisao: '',
  tipo_aviso: '',
  salario_trabalhador: 0,
  media_descontos: 0,
  media_remuneracoes: 0,
  debito_com_empresa: 0,
  valor_recebido_ferias: 0,
  valor_recebido_13: 0,
  salario_sindicato: 0, // ADDED
  obs_sindicato: '', // ADDED
  historia: '',
  info_hora_extra: '',
  info_feriados: '',
  info_folgas: '',
  info_ferias: '',
  info_13_salario: '',
  qunat_folgas_trabalhadas: 0,
  sem_cpts_assinada: false,
  vale_transporte: false,
  somente_inss: false,
  caixa: false,
  insalubre: false,
  periculosidade: false,
  ferias_retroativas: false,
  decimo_terceiro_retroativo: false,
  he_retroativo: false,
  insalubridade_retroativa: false,
  periculosidade_retroativa: false,
  hx_mes: false,
  n_he: true,
  n_feriados: true,
  n_folgas: true,
  ignorar_salario_sindicato: false,
  n_dif_salario: false,
  info_basico: false,
  qunt_feriados_trabalhados: 0,
  somente_proporcional: false,
  recebia_sem_1_3: false,
  n_calcular_descontos: false,
  info_descontos: '',
  faltas: true,
  qunat_faltas: 0,
  info_faltas: '',
  info_proventos: '',
  n_calcular_proventos: false,
  quebra_caixa: false, // ADDED
  quebra_caixa_retroativo: false, // ADDED
  faltou_todo_aviso: false, // ADDED
  carga_horaria: '',
};

type Calculation = typeof initialCalculationState;

const rescissionTypes = [
  { label: 'Sem Justa Causa', value: 'sem_justa_causa' },
  { label: 'Com Justa Causa', value: 'com_justa_causa' },
  { label: 'Pedido de Demissão', value: 'pedido_demissao' },
];

const avisoTypes = [
  { label: 'Trabalhado', value: 'trabalhado' },
  { label: 'Indenizado', value: 'indenizado' },
];

const CalculationFormPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [calculation, setCalculation] = useState<Calculation>(initialCalculationState);
  const [isLoading, setIsLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [sindicatos, setSindicatos] = useState<Sindicato[]>([]);
  const [aiTemplates, setAiTemplates] = useState<AiPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true); // Estado de carregamento inicial

  // Handlers for Select Fields
  const handleSelectChange = (name: keyof Calculation, value: string) => {
    setCalculation({ ...calculation, [name]: value });
  };

  // Generic handler for text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Handle number inputs separately, parsing to a number
    setCalculation({
      ...calculation,
      [name]:
        ['salario_trabalhador', 'media_descontos', 'media_remuneracoes', 'debito_com_empresa', 'valor_recebido_ferias', 'valor_recebido_13', 'salario_sindicato'].includes(name)
          ? parseFloat(value) || 0
          : value,
    });
  };

  const handleDateInputChange = (name: keyof Calculation, dateString: string) => {
    setCalculation({ ...calculation, [name]: dateString });
  };

  const handleCheckboxChange = (name: keyof Calculation, checked: boolean) => {
    setCalculation({ ...calculation, [name]: checked });
  };

  // Fetch initial data like clients, sindicatos, etc. (FIXES 1, 2, 3)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;

      setIsLoading(true);
      setLoading(true);

      try {
        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase.from('tbl_clientes').select('*');
        if (clientsError) throw clientsError;
        setClients(clientsData as Client[]);

        // Fetch sindicatos
        const { data: sindicatosData, error: sindicatosError } = await supabase.from('tbl_sindicatos').select('*');
        if (sindicatosError) throw sindicatosError;
        setSindicatos(sindicatosData as Sindicato[]);

        // Fetch AI Templates
        const { data: aiTemplatesData, error: aiTemplatesError } = await supabase.from('tbl_ai_prompt_templates').select('*');
        if (aiTemplatesError) throw aiTemplatesError;
        setAiTemplates(aiTemplatesData as AiPromptTemplate[]);

        // If in edit mode, fetch existing calculation data
        if (isEditMode && id) {
          const { data: calcData, error: calcError } = await supabase
            .from('tbl_calculos')
            .select('*')
            .eq('id', id)
            .single();

          if (calcError) throw calcError;
          setCalculation({
            ...initialCalculationState,
            ...calcData,
            // Ensure boolean fields are correctly mapped if they come as null/undefined
            quebra_caixa: calcData.quebra_caixa ?? false,
            quebra_caixa_retroativo: calcData.quebra_caixa_retroativo ?? false,
            faltou_todo_aviso: calcData.faltou_todo_aviso ?? false,
          });
        }
      } catch (error) {
        showError('Erro ao carregar dados iniciais.');
        console.error('Error fetching initial data:', error);
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user, id, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }

    setIsLoading(true);

    try {
      const dataToSubmit = {
        ...calculation,
        // Ensure numeric fields are numbers, even if input was empty string
        salario_trabalhador: Number(calculation.salario_trabalhador) || 0,
        salario_sindicato: Number(calculation.salario_sindicato) || 0,
        // ... other numeric fields
      };

      let result;
      if (isEditMode && id) {
        // Update existing calculation
        result = await supabase
          .from('tbl_calculos')
          .update(dataToSubmit)
          .eq('id', id)
          .select();
      } else {
        // Insert new calculation
        result = await supabase
          .from('tbl_calculos')
          .insert(dataToSubmit)
          .select();
      }

      if (result.error) throw result.error;

      showSuccess(`Cálculo ${isEditMode ? 'atualizado' : 'cadastrado'} com sucesso!`);
      navigate(`/calculation/${result.data[0].id}`);
    } catch (error) {
      showError(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} cálculo.`);
      console.error('Submission error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{isEditMode ? 'Editar' : 'Novo'} Cálculo Trabalhista</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção de Seleção */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <ClientSelectField
                clientId={calculation.cliente_id}
                clients={clients}
                onValueChange={(v) => handleSelectChange('cliente_id', v)}
                disabled={loading}
              />
              <SindicatoSelectField
                sindicatoId={calculation.sindicato_id}
                sindicatos={sindicatos}
                onValueChange={(v) => handleSelectChange('sindicato_id', v)}
                disabled={loading}
              />
              <AiPromptTemplateSelectField
                aiTemplateId={calculation.ai_template_id}
                aiTemplates={aiTemplates}
                onValueChange={(v) => handleSelectChange('ai_template_id', v)}
                disabled={loading}
              />
            </div>

            {/* Dados do Funcionário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Funcionário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  name="nome_funcionario"
                  placeholder="Nome do Funcionário"
                  value={calculation.nome_funcionario}
                  onChange={handleInputChange}
                  disabled={isLoading || loading}
                />
                <Input
                  name="cpf_funcionario"
                  placeholder="CPF"
                  value={calculation.cpf_funcionario}
                  onChange={handleInputChange}
                  disabled={isLoading || loading}
                />
                <Input
                  name="funcao_funcionario"
                  placeholder="Função"
                  value={calculation.funcao_funcionario}
                  onChange={handleInputChange}
                  disabled={isLoading || loading}
                />
                <Input
                  name="carga_horaria"
                  placeholder="Carga Horária (ex: 220h)"
                  value={calculation.carga_horaria}
                  onChange={handleInputChange}
                  disabled={isLoading || loading}
                />
              </CardContent>
            </Card>

            {/* Datas e Tipos de Rescisão */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Datas e Rescisão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* FIX 4: inicio_contrat_inregular é passado, mas a interface precisa ser atualizada */}
                <ContractDatesSection
                  inicio_contrato={calculation.inicio_contrato}
                  fim_contrato={calculation.fim_contrato}
                  inicio_contrat_inregular={calculation.inicio_contrat_inregular} 
                  onDateChange={handleDateInputChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* FIX 5: Adicionando disabled */}
                  <RescissionTypeSelectField
                    tipo_aviso={calculation.tip_recisao}
                    noticeTypes={rescissionTypes}
                    onValueChange={(v) => handleSelectChange('tip_recisao', v)}
                    disabled={loading} 
                  />
                  {/* FIX 6: Adicionando disabled */}
                  <AvisoTypeSelectField
                    tipo_aviso={calculation.tipo_aviso}
                    noticeTypes={avisoTypes}
                    onValueChange={(v) => handleSelectChange('tipo_aviso', v)}
                    disabled={loading} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informações Financeiras Básicas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Salários e Médias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  name="salario_trabalhador"
                  type="number"
                  placeholder="Salário Base do Trabalhador"
                  value={calculation.salario_trabalhador}
                  onChange={handleInputChange}
                  disabled={isLoading || loading}
                />
                {/* Campo Salário Sindicato (Anteriormente Ausente) */}
                <Input
                  name="salario_sindicato"
                  type="number"
                  placeholder="Salário Base do Sindicato (se diferente)"
                  value={calculation.salario_sindicato}
                  onChange={handleInputChange}
                  disabled={isLoading || loading}
                />
                <Textarea
                  name="obs_sindicato"
                  placeholder="Observações sobre o Sindicato (Anteriormente Ausente)"
                  value={calculation.obs_sindicato}
                  onChange={handleInputChange}
                  disabled={isLoading || loading}
                />
                {/* ... outros campos financeiros ... */}
              </CardContent>
            </Card>

            {/* Checkboxes de Quebra de Caixa e Aviso */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benefícios e Aviso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="quebra_caixa"
                    checked={calculation.quebra_caixa}
                    onCheckedChange={(checked) => handleCheckboxChange('quebra_caixa', checked as boolean)}
                    disabled={isLoading || loading}
                  />
                  <Label htmlFor="quebra_caixa">Recebia Quebra de Caixa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="quebra_caixa_retroativo"
                    checked={calculation.quebra_caixa_retroativo}
                    onCheckedChange={(checked) => handleCheckboxChange('quebra_caixa_retroativo', checked as boolean)}
                    disabled={isLoading || loading}
                  />
                  <Label htmlFor="quebra_caixa_retroativo">Quebra de Caixa Retroativo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="faltou_todo_aviso"
                    checked={calculation.faltou_todo_aviso}
                    onCheckedChange={(checked) => handleCheckboxChange('faltou_todo_aviso', checked as boolean)}
                    disabled={isLoading || loading}
                  />
                  <Label htmlFor="faltou_todo_aviso">Faltou todo o Aviso Prévio</Label>
                </div>
                {/* ... outros checkboxes ... */}
              </CardContent>
            </Card>

            <Button type="submit" disabled={isLoading || loading}>
              {isLoading ? 'Processando...' : isEditMode ? 'Salvar Alterações' : 'Cadastrar Cálculo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </MainLayout>
  );
};

export default CalculationFormPage;