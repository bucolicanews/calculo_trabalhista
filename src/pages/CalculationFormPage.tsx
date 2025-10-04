import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { format } from 'date-fns';

// Importar os novos componentes modulares
import ClientSelectField from '@/components/calculations/ClientSelectField';
import SindicatoSelectField from '@/components/calculations/SindicatoSelectField';
import EmployeeDetailsSection from '@/components/calculations/EmployeeDetailsSection';
import ContractDatesSection from '@/components/calculations/ContractDatesSection';
import RescissionTypeSelectField from '@/components/calculations/RescissionTypeSelectField';
import SalaryAndObservationsSection from '@/components/calculations/SalaryAndObservationsSection';
import AveragesSection from '@/components/calculations/AveragesSection';
import ContractHistoryAndCTPS from '@/components/calculations/ContractHistoryAndCTPS';
import AiPromptTemplateSelectField from '@/components/calculations/AiPromptTemplateSelectField'; // NOVO

interface Client {
  id: string;
  nome: string;
}

interface Sindicato {
  id: string;
  nome: string;
}

interface AiPromptTemplate {
  id: string;
  title: string;
}

// Nova lista de Tipos de Rescisão de Contrato de Trabalho com label e value para o ENUM do DB
const noticeTypes = [
  { label: 'Rescisão com Justa Causa', value: 'rescisao_com_justa_causa' },
  { label: 'Rescisão sem Justa Causa', value: 'rescisao_sem_justa_causa' },
  { label: 'Pedido de Demissão', value: 'pedido_de_demissao' },
  { label: 'Rescisão Antecipada do Contrato a Termo (Empregador)', value: 'rescisao_antecipada_empregador' },
  { label: 'Rescisão Antecipada do Contrato a Termo (Empregado)', value: 'rescisao_antecipada_empregado' },
  { label: 'Término do Contrato a Termo', value: 'termino_contrato_a_termo' },
  { label: 'Rescisão por Culpa Recíproca', value: 'rescisao_culpa_reciproca' },
  { label: 'Rescisão Indireta', value: 'rescisao_indireta' },
  { label: 'Rescisão por Falecimento do Empregado', value: 'rescisao_falecimento_empregado' },
  { label: 'Encerramento da Empresa', value: 'encerramento_empresa' },
];

const CalculationFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [calculation, setCalculation] = useState({
    cliente_id: '',
    sindicato_id: '',
    ai_template_id: '', // NOVO CAMPO
    nome_funcionario: '',
    cpf_funcionario: '',
    funcao_funcionario: '',
    inicio_contrato: '',
    fim_contrato: '',
    tipo_aviso: '', // Este campo agora representa o tipo de rescisão
    salario_sindicato: 0,
    salario_trabalhador: 0,
    obs_sindicato: '',
    historia: '',
    ctps_assinada: false,
    media_descontos: 0,
    media_remuneracoes: 0,
    carga_horaria: '',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [sindicatos, setSindicatos] = useState<Sindicato[]>([]);
  const [aiTemplates, setAiTemplates] = useState<AiPromptTemplate[]>([]); // NOVO ESTADO
  const [loading, setLoading] = useState(true);
  const isEditing = !!id;

  useEffect(() => {
    if (user) {
      fetchClientsSindicatosAndAiTemplates();
      if (isEditing) {
        fetchCalculation();
      } else {
        setLoading(false);
      }
    }
  }, [id, isEditing, user]);

  const fetchClientsSindicatosAndAiTemplates = async () => {
    const { data: clientsData, error: clientsError } = await supabase
      .from('tbl_clientes')
      .select('id, nome')
      .eq('user_id', user?.id);

    if (clientsError) {
      showError('Erro ao carregar clientes: ' + clientsError.message);
      console.error('Error fetching clients:', clientsError);
    } else {
      setClients(clientsData || []);
    }

    const { data: sindicatosData, error: sindicatosError } = await supabase
      .from('tbl_sindicatos')
      .select('id, nome');

    if (sindicatosError) {
      showError('Erro ao carregar sindicatos: ' + sindicatosError.message);
      console.error('Error fetching sindicatos:', sindicatosError);
    } else {
      setSindicatos(sindicatosData || []);
    }

    // NOVO: Buscar modelos de prompt de IA
    const { data: aiTemplatesData, error: aiTemplatesError } = await supabase
      .from('tbl_ai_prompt_templates')
      .select('id, title')
      .eq('user_id', user?.id);

    if (aiTemplatesError) {
      showError('Erro ao carregar modelos de prompt de IA: ' + aiTemplatesError.message);
      console.error('Error fetching AI prompt templates:', aiTemplatesError);
    } else {
      setAiTemplates(aiTemplatesData || []);
    }
  };

  const fetchCalculation = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar cálculo: ' + error.message);
      console.error('Error fetching calculation:', error);
      navigate('/dashboard');
    } else if (data) {
      setCalculation({
        ...data,
        inicio_contrato: data.inicio_contrato || '',
        fim_contrato: data.fim_contrato || '',
        salario_trabalhador: data.salario_trabalhador || 0,
        ai_template_id: data.ai_template_id || '', // Carregar o ID do modelo IA
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCalculation((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log(`[CalculationFormPage] handleSelectChange: Setting ${name} to ${value}`);
    setCalculation((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setCalculation((prev) => ({
      ...prev,
      [name]: date ? format(date, 'yyyy-MM-dd') : '',
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCalculation((prev) => ({ ...prev, ctps_assinada: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }

    if (!calculation.cliente_id) {
      showError('Por favor, selecione um cliente.');
      return;
    }
    if (!calculation.nome_funcionario) {
      showError('Por favor, insira o nome do funcionário.');
      return;
    }
    if (!calculation.inicio_contrato) {
      showError('Por favor, selecione a data de início do contrato.');
      return;
    }
    if (!calculation.fim_contrato) {
      showError('Por favor, selecione a data de fim do contrato.');
      return;
    }
    if (!calculation.tipo_aviso) {
      showError('Por favor, selecione o tipo de rescisão.');
      return;
    }

    setLoading(true);

    const calculationData = {
      ...calculation,
      salario_sindicato: parseFloat(String(calculation.salario_sindicato)) || 0,
      salario_trabalhador: parseFloat(String(calculation.salario_trabalhador)) || 0,
      media_descontos: parseFloat(String(calculation.media_descontos)) || 0,
      media_remuneracoes: parseFloat(String(calculation.media_remuneracoes)) || 0,
      sindicato_id: calculation.sindicato_id === '' ? null : calculation.sindicato_id,
      ai_template_id: calculation.ai_template_id === '' ? null : calculation.ai_template_id, // Salvar o ID do modelo IA
    };

    console.log('[CalculationFormPage] Saving calculation with data:', calculationData); // NOVO LOG AQUI

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
      console.error('Error saving calculation:', response.error.message, response.error.details);
    } else {
      showSuccess(`Cálculo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/dashboard');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando formulário de cálculo...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">
          {isEditing ? 'Editar Cálculo' : 'Novo Cálculo de Rescisão'}
        </h1>
        <Card className="max-w-3xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="2xl text-orange-500">Dados do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <ClientSelectField
                cliente_id={calculation.cliente_id}
                clients={clients}
                onValueChange={(value) => handleSelectChange('cliente_id', value)}
                disabled={loading}
              />

              <SindicatoSelectField
                sindicato_id={calculation.sindicato_id}
                sindicatos={sindicatos}
                onValueChange={(value) => handleSelectChange('sindicato_id', value)}
                disabled={loading}
              />

              <AiPromptTemplateSelectField // NOVO COMPONENTE
                ai_template_id={calculation.ai_template_id}
                aiTemplates={aiTemplates}
                onValueChange={(value) => handleSelectChange('ai_template_id', value)}
                disabled={loading}
              />

              <EmployeeDetailsSection
                nome_funcionario={calculation.nome_funcionario}
                cpf_funcionario={calculation.cpf_funcionario}
                funcao_funcionario={calculation.funcao_funcionario}
                carga_horaria={calculation.carga_horaria}
                onChange={handleChange}
                disabled={loading}
              />

              <ContractDatesSection
                inicio_contrato={calculation.inicio_contrato}
                fim_contrato={calculation.fim_contrato}
                onDateChange={handleDateChange}
                disabled={loading}
              />

              <RescissionTypeSelectField
                tipo_aviso={calculation.tipo_aviso}
                noticeTypes={noticeTypes}
                onValueChange={(value) => handleSelectChange('tipo_aviso', value)}
                disabled={loading}
              />

              <SalaryAndObservationsSection
                salario_sindicato={calculation.salario_sindicato}
                salario_trabalhador={calculation.salario_trabalhador}
                obs_sindicato={calculation.obs_sindicato}
                onChange={handleChange}
                disabled={loading}
              />

              <AveragesSection
                media_descontos={calculation.media_descontos}
                media_remuneracoes={calculation.media_remuneracoes}
                onChange={handleChange}
                disabled={loading}
              />

              <ContractHistoryAndCTPS
                historia={calculation.historia}
                ctps_assinada={calculation.ctps_assinada}
                onTextChange={handleChange}
                onCheckboxChange={handleCheckboxChange}
                disabled={loading}
              />

              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar Cálculo' : 'Criar Cálculo')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CalculationFormPage;