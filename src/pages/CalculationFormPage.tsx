import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';

// Assuming you have these components for inputs.
// If not, you can replace them with standard <input>, <textarea>, <select> elements.
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Modular components (assuming they are updated or we implement logic here)
import ClientSelectField from '@/components/calculations/ClientSelectField';
import SindicatoSelectField from '@/components/calculations/SindicatoSelectField';
import AiPromptTemplateSelectField from '@/components/calculations/AiPromptTemplateSelectField';
import RescissionTypeSelectField from '@/components/calculations/RescissionTypeSelectField';
import AvisoTypeSelectField from '@/components/calculations/AvisoTypeSelectField';
import ContractDatesSection from '@/components/calculations/ContractDatesSection'; // Needs to handle a third date

// Helper Interfaces
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

// Rescission types list
const rescissionTypes = [
  { label: 'Rescisão com Justa Causa', value: 'rescisao_com_justa_causa' },
  { label: 'Rescisão sem Justa Causa', value: 'rescisao_sem_justa_causa' },
  { label: 'Pedido de Demissão', value: 'pedido_de_demissao' },
  { label: 'Rescisão por Acordo Mútuo', value: 'rescisao_acordo_mutuo' },
  { label: 'Dispensa Indireta', value: 'dispensa_indireta' },
  { label: 'Término Contrato Prazo Determinado', value: 'termino_prazo_determinado' },
  { label: 'Encerramento da Empresa', value: 'encerramento_empresa' },
];
// Aviso types list
const avisoTypes = [
  { label: 'Aviso Prévio Trabalhado', value: 'aviso_previo_trabalhado' },
  { label: 'Aviso Prévio Indenizado', value: 'aviso_previo_indenizado' },
  { label: 'Sem Aviso Prévio', value: 'sem_aviso_previo' },
];

/**
 * Converts a DD/MM/AAAA string to an ISO string (AAAA-MM-DD) for database storage.
 * Returns null if the format is invalid or incomplete.
 */
const convertDDMMAAAAtoISO = (dateString: string): string | null => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    return null;
  }
  const [day, month, year] = dateString.split('/');
  return `${year}-${month}-${day}`;
};

/**
 * Converts an ISO string (AAAA-MM-DD) from the database to DD/MM/AAAA for display.
 */
const convertISOtoDDMMAAAA = (isoString: string | null | undefined): string => {
  if (!isoString) return '';
  const parts = isoString.split('-'); // [YYYY, MM, DD]
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : isoString;
};

const CalculationFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  // Expanded state to include all fields from the schema
  const [calculation, setCalculation] = useState({
    // IDs
    cliente_id: '',
    sindicato_id: '',
    ai_template_id: '',

    // Employee Info
    nome_funcionario: '',
    cpf_funcionario: '',
    funcao_funcionario: '',
    carga_horaria: '',

    // Contract Dates (stored as DD/MM/AAAA strings)
    inicio_contrato: '',
    fim_contrato: '',
    inicio_contrat_inregular: '',

    // Rescission Info
    tip_recisao: '',
    tipo_aviso: '',

    // Financial Info
    salario_trabalhador: 0,
    media_descontos: 0,
    media_remuneracoes: 0,
    debito_com_empresa: 0,
    valor_recebido_ferias: 0,
    valor_recebido_13: 0,
    salario_sindicato: 0, // ADICIONADO
    obs_sindicato: '', // ADICIONADO

    // Detailed Info (text fields)
    historia: '',
    info_hora_extra: '',
    info_feriados: '',
    info_folgas: '',
    info_ferias: '',
    info_13_salario: '',
    info_descontos: '',
    info_proventos: '',
    info_faltas: '', // ADICIONADO

    // Specific Counts
    qunat_folgas_trabalhadas: 0,
    qunat_feriados_trabalhados: 0,
    qunat_faltas: 0,

    // Boolean Flags
    sem_cpts_assinada: false,
    vale_transporte: false,
    somente_inss: false,
    caixa: false,
    insalubre: false,
    periculosidade: false,
    ferias_retroativas: false,
    decimo_terceiro_retroativo: false, // JS-friendly name for "13_retroativo"
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
    somente_proporcional: false,
    recebia_sem_1_3: false,
    n_calcular_descontos: false,
    faltas: true,
    faltou_todo_aviso: false, // ADICIONADO
    quebra_caixa: false, // ADICIONADO
    quebra_caixa_retroativo: false, // ADICIONADO
    n_calcular_proventos: false,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [sindicatos, setSindicatos] = useState<Sindicato[]>([]);
  const [aiTemplates, setAiTemplates] = useState<AiPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInitialData = async () => {
    const [clientsRes, sindicatosRes, aiTemplatesRes] = await Promise.all([
      supabase.from('tbl_clientes').select('id, nome').eq('user_id', user?.id).order('nome', { ascending: true }),
      supabase.from('tbl_sindicatos').select('id, nome').order('nome', { ascending: true }),
      supabase.from('tbl_ai_prompt_templates').select('id, title').eq('user_id', user?.id).order('title', { ascending: true }),
    ]);

    if (clientsRes.error) showError('Erro ao carregar clientes: ' + clientsRes.error.message);
    else setClients(clientsRes.data || []);

    if (sindicatosRes.error) showError('Erro ao carregar sindicatos: ' + sindicatosRes.error.message);
    else setSindicatos(sindicatosRes.data || []);

    if (aiTemplatesRes.error) showError('Erro ao carregar modelos IA: ' + aiTemplatesRes.error.message);
    else setAiTemplates(aiTemplatesRes.data || []);
  };

  const fetchCalculation = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tbl_calculos').select('*').eq('id', id).single();

    if (error) {
      showError('Erro ao carregar cálculo: ' + error.message);
      navigate('/dashboard');
    } else if (data) {
      setCalculation({
        ...data,
        // Convert dates from DB (YYYY-MM-DD) to display format (DD/MM/AAAA)
        inicio_contrato: convertISOtoDDMMAAAA(data.inicio_contrato),
        fim_contrato: convertISOtoDDMMAAAA(data.fim_contrato),
        inicio_contrat_inregular: convertISOtoDDMMAAAA(data.inicio_contrat_inregular),
        
        // Ensure numeric fields are numbers, not null
        salario_trabalhador: data.salario_trabalhador || 0,
        salario_sindicato: data.salario_sindicato || 0, // ADICIONADO
        media_descontos: data.media_descontos || 0,
        media_remuneracoes: data.media_remuneracoes || 0,
        debito_com_empresa: data.debito_com_empresa || 0,
        valor_recebido_ferias: data.valor_recebido_ferias || 0,
        valor_recebido_13: data.valor_recebido_13 || 0,
        qunat_folgas_trabalhadas: data.qunat_folgas_trabalhadas || 0,
        qunat_feriados_trabalhados: data.qunat_feriados_trabalhados || 0,
        qunat_faltas: data.qunat_faltas || 0,

        // Map DB name to state name
        decimo_terceiro_retroativo: data['13_retroativo'] || false,
        
        // Handle optional foreign keys
        sindicato_id: data.sindicato_id || '',
        ai_template_id: data.ai_template_id || '',

        // ADICIONADOS
        obs_sindicato: data.obs_sindicato || '',
        faltou_todo_aviso: data.faltou_todo_aviso || false,
        quebra_caixa: data.quebra_caixa || false,
        quebra_caixa_retroativo: data.quebra_caixa_retroativo || false,
        info_faltas: data.info_faltas || '', // ADICIONADO
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchInitialData();
      if (isEditing) {
        fetchCalculation();
      } else {
        setLoading(false);
      }
    }
  }, [id, isEditing, user]);

  // Generic handler for text, number, and textarea inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number';
    setCalculation(prev => ({
      ...prev,
      [name]: isNumber ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  // Generic handler for select/dropdown components
  const handleSelectChange = (name: string, value: string) => {
    setCalculation(prev => ({ ...prev, [name]: value }));
  };

  // Generic handler for custom date input components that return a DD/MM/AAAA string
  const handleDateInputChange = (name: string, dateString: string) => {
    setCalculation(prev => ({ ...prev, [name]: dateString }));
  };

  // Generic handler for checkbox components
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setCalculation(prev => ({ ...prev, [name]: checked }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showError('Usuário não autenticado.');

    // --- Basic Validation ---
    if (!calculation.cliente_id) return showError('Por favor, selecione um cliente.');
    if (!calculation.nome_funcionario) return showError('Por favor, insira o nome do funcionário.');

    const inicioContratoISO = convertDDMMAAAAtoISO(calculation.inicio_contrato);
    if (!inicioContratoISO) return showError('Data de início do contrato é inválida (use DD/MM/AAAA).');

    const fimContratoISO = convertDDMMAAAAtoISO(calculation.fim_contrato);
    if (!fimContratoISO) return showError('Data de fim do contrato é inválida (use DD/MM/AAAA).');

    const inicioIrregularISO = calculation.inicio_contrat_inregular ? convertDDMMAAAAtoISO(calculation.inicio_contrat_inregular) : null;
    if (calculation.inicio_contrat_inregular && !inicioIrregularISO) {
      return showError('Data de início irregular é inválida (use DD/MM/AAAA).');
    }

    setLoading(true);

    const calculationData = {
      ...calculation,
      // Convert dates to ISO format for Supabase
      inicio_contrato: inicioContratoISO,
      fim_contrato: fimContratoISO,
      inicio_contrat_inregular: inicioIrregularISO,

      // Ensure numeric fields are numbers, not strings
      salario_trabalhador: parseFloat(String(calculation.salario_trabalhador)) || 0,
      salario_sindicato: parseFloat(String(calculation.salario_sindicato)) || 0,
      media_descontos: parseFloat(String(calculation.media_descontos)) || 0,
      media_remuneracoes: parseFloat(String(calculation.media_remuneracoes)) || 0,
      debito_com_empresa: parseFloat(String(calculation.debito_com_empresa)) || 0,
      valor_recebido_ferias: parseFloat(String(calculation.valor_recebido_ferias)) || 0,
      valor_recebido_13: parseFloat(String(calculation.valor_recebido_13)) || 0,
      qunat_folgas_trabalhadas: parseInt(String(calculation.qunat_folgas_trabalhadas)) || 0,
      qunat_feriados_trabalhados: parseInt(String(calculation.qunat_feriados_trabalhados)) || 0,
      qunat_faltas: parseFloat(String(calculation.qunat_faltas)) || 0,

      // Map state name back to DB column name
      '13_retroativo': calculation.decimo_terceiro_retroativo,
      // @ts-ignore - remove the temporary field before sending to DB
      decimo_terceiro_retroativo: undefined,

      // Handle optional foreign keys
      sindicato_id: calculation.sindicato_id === '' ? null : calculation.sindicato_id,
      ai_template_id: calculation.ai_template_id === '' ? null : calculation.ai_template_id,
    };

    // Clean up the undefined field
    delete calculationData.decimo_terceiro_retroativo;

    let response;
    if (isEditing) {
      response = await supabase.from('tbl_calculos').update(calculationData).eq('id', id);
    } else {
      response = await supabase.from('tbl_calculos').insert(calculationData);
    }

    if (response.error) {
      showError('Erro ao salvar cálculo: ' + response.error.message);
    } else {
      showSuccess(`Cálculo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/dashboard');
    }
    setLoading(false);
  };

  if (loading) {
    return <MainLayout><div className="container text-center">Carregando...</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container w-full">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">
          {isEditing ? 'Editar Cálculo' : 'Novo Cálculo de Rescisão'}
        </h1>
        <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Dados do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* --- SECTION: IDENTIFICAÇÃO --- */}
              <div className="space-y-4 border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-300">Identificação</h3>
                <ClientSelectField cliente_id={calculation.cliente_id} clients={clients} onValueChange={(v) => handleSelectChange('cliente_id', v)} disabled={loading} />
                <SindicatoSelectField sindicato_id={calculation.sindicato_id} sindicatos={sindicatos} onValueChange={(v) => handleSelectChange('sindicato_id', v)} disabled={loading} />
                <AiPromptTemplateSelectField ai_template_id={calculation.ai_template_id} aiTemplates={aiTemplates} onValueChange={(v) => handleSelectChange('ai_template_id', v)} disabled={loading} />
              </div>

              {/* --- SECTION: DADOS DO FUNCIONÁRIO --- */}
              <div className="space-y-4 border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-300">Dados do Funcionário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label htmlFor="nome_funcionario">Nome Completo</Label><Input id="nome_funcionario" name="nome_funcionario" value={calculation.nome_funcionario} onChange={handleChange} /></div>
                  <div><Label htmlFor="cpf_funcionario">CPF</Label><Input id="cpf_funcionario" name="cpf_funcionario" value={calculation.cpf_funcionario} onChange={handleChange} /></div>
                  <div><Label htmlFor="funcao_funcionario">Função</Label><Input id="funcao_funcionario" name="funcao_funcionario" value={calculation.funcao_funcionario} onChange={handleChange} /></div>
                  <div><Label htmlFor="carga_horaria">Carga Horária Semanal</Label><Input id="carga_horaria" name="carga_horaria" value={calculation.carga_horaria} onChange={handleChange} /></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">Situações Irregulares</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox id="info_basico" name="info_basico" checked={calculation.info_basico} onCheckedChange={(c) => handleCheckboxChange('info_basico', c as boolean)} className="border border-white/50" />
                    <Label htmlFor="info_basico">Usar Info Básica (IA)!</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox id="ignorar_salario_sindicato" name="ignorar_salario_sindicato" checked={calculation.ignorar_salario_sindicato} onCheckedChange={(c) => handleCheckboxChange('ignorar_salario_sindicato', c as boolean)} className="border border-white/50" />
                    <Label htmlFor="ignorar_salario_sindicato">Ignorar Salário do Sindicato!</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox id="n_dif_salario" name="n_dif_salario" checked={calculation.n_dif_salario} onCheckedChange={(c) => handleCheckboxChange('n_dif_salario', c as boolean)} className="border border-white/50" />
                    <Label htmlFor="n_dif_salario">Não Calcular Diferença de Salário</Label>
                  </div>
                </div>
                
                {/* Coluna 1 - Situações Irregulares */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox
                      id="sem_cpts_assinada"
                      name="sem_cpts_assinada"
                      checked={calculation.sem_cpts_assinada}
                      onCheckedChange={(c) => handleCheckboxChange('sem_cpts_assinada', c as boolean)}
                      className="border border-white/50"
                    />
                    <Label htmlFor="sem_cpts_assinada">CTPS assinada?</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox
                      id="vale_transporte"
                      name="vale_transporte"
                      checked={calculation.vale_transporte}
                      onCheckedChange={(c) => handleCheckboxChange('vale_transporte', c as boolean)}
                      className="border border-white/50"
                    />
                    <Label htmlFor="vale_transporte">Recebe Vale Transporte?</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox
                      id="faltou_todo_aviso"
                      name="faltou_todo_aviso"
                      checked={calculation.faltou_todo_aviso}
                      onCheckedChange={(c) => handleCheckboxChange('faltou_todo_aviso', c as boolean)}
                      className="border border-white/50"
                    />
                    <Label htmlFor="faltou_todo_aviso">Faltou todo o Aviso?</Label>
                  </div>
                </div>

                {/* Coluna 2 - Situações Irregulares (Caixa) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox
                      id="caixa"
                      name="caixa"
                      checked={calculation.caixa}
                      onCheckedChange={(c) => handleCheckboxChange('caixa', c as boolean)}
                      className="border border-white/50"
                    />
                    <Label htmlFor="caixa">Função de Caixa?</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox id="quebra_caixa" name="quebra_caixa" checked={calculation.quebra_caixa} onCheckedChange={(c) => handleCheckboxChange('quebra_caixa', c as boolean)} className="border border-white/50" />
                    <Label htmlFor="quebra_caixa">Recebia Quebra de Caixa?</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox id="quebra_caixa_retroativo" name="quebra_caixa_retroativo" checked={calculation.quebra_caixa_retroativo} onCheckedChange={(c) => handleCheckboxChange('quebra_caixa_retroativo', c as boolean)} className="border border-white/50" />
                    <Label htmlFor="quebra_caixa_retroativo">Calcular Quebra de Caixa Retroativo!</Label>
                  </div>
                </div>

                {/* Coluna 3 - Situações Irregulares (Adicionais) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox
                      id="insalubre"
                      name="insalubre"
                      checked={calculation.insalubre}
                      onCheckedChange={(c) => handleCheckboxChange('insalubre', c as boolean)}
                      className="border border-white/50"
                    />
                    <Label htmlFor="insalubre">Serviço Insalubre?</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox id="insalubridade_retroativa" name="insalubridade_retroativa" checked={calculation.insalubridade_retroativa} onCheckedChange={(c) => handleCheckboxChange('insalubridade_retroativa', c as boolean)} className="border border-white/50" />
                    <Label htmlFor="insalubridade_retroativa">Calcular Insalubridade Retroativa!</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox id="periculosidade" name="periculosidade" checked={calculation.periculosidade} onCheckedChange={(c) => handleCheckboxChange('periculosidade', c as boolean)} className="border border-white/50" />
                    <Label htmlFor="periculosidade">Serviço Periculoso?</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox id="periculosidade_retroativa" name="periculosidade_retroativa" checked={calculation.periculosidade_retroativa} onCheckedChange={(c) => handleCheckboxChange('periculosidade_retroativa', c as boolean)} className="border border-white/50" />
                    <Label htmlFor="periculosidade_retroativa">Calcular Periculosidade Retroativa!</Label>
                  </div>
                </div>
              </div>

              {/* --- SECTION: CONTRATO E RESCISÃO --- */}
              <div className="space-y-4 border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-300">Contrato e Rescisão</h3>
                <ContractDatesSection
                  inicio_contrato={calculation.inicio_contrato}
                  fim_contrato={calculation.fim_contrato}
                  inicio_contrat_inregular={calculation.inicio_contrat_inregular}
                  onDateChange={handleDateInputChange}
                  disabled={loading} // Adicionado disabled
                />
                <RescissionTypeSelectField tipo_aviso={calculation.tip_recisao} noticeTypes={rescissionTypes} onValueChange={(v) => handleSelectChange('tip_recisao', v)} disabled={loading} />
                <AvisoTypeSelectField tipo_aviso={calculation.tipo_aviso} noticeTypes={avisoTypes} onValueChange={(v) => handleSelectChange('tipo_aviso', v)} disabled={loading} />

              </div>
              
              {/* --- SECTION: DADOS FINANCEIROS E SINDICATO --- */}
              <div className="space-y-4 border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-300">Dados Financeiros e Sindicato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><Label htmlFor="salario_trabalhador">Último Salário (R$)</Label><Input id="salario_trabalhador" name="salario_trabalhador" type="number" value={calculation.salario_trabalhador} onChange={handleChange} /></div>
                  
                  {/* CAMPO SALARIO SINDICATO ADICIONADO */}
                  <div><Label htmlFor="salario_sindicato">Piso Salarial Sindicato (R$)</Label><Input id="salario_sindicato" name="salario_sindicato" type="number" value={calculation.salario_sindicato} onChange={handleChange} /></div>
                  
                  <div><Label htmlFor="debito_com_empresa">Débito com a Empresa (R$)</Label><Input id="debito_com_empresa" name="debito_com_empresa" type="number" value={calculation.debito_com_empresa} onChange={handleChange} /></div>
                  <div><Label htmlFor="valor_recebido_ferias">Valor já Recebido de Férias (R$)</Label><Input id="valor_recebido_ferias" name="valor_recebido_ferias" type="number" value={calculation.valor_recebido_ferias} onChange={handleChange} /></div>
                  <div><Label htmlFor="valor_recebido_13">Valor já Recebido de 13º (R$)</Label><Input id="valor_recebido_13" name="valor_recebido_13" type="number" value={calculation.valor_recebido_13} onChange={handleChange} /></div>
                </div>
                
                {/* CAMPO OBS SINDICATO ADICIONADO */}
                <div><Label htmlFor="obs_sindicato">Observações Sindicato</Label><Textarea id="obs_sindicato" name="obs_sindicato" value={calculation.obs_sindicato} onChange={handleChange} rows={3} placeholder="Insira observações específicas da CCT ou dissídio." /></div>
              </div>
              
              {/* --- SECTION: INFORMAÇÕES ADICIONAIS --- */}
              <div className="space-y-4 border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-300">Informações Adicionais (Relato do Cliente)</h3>
                <div>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="he_retroativo" name="he_retroativo" checked={calculation.he_retroativo} onCheckedChange={(c) => handleCheckboxChange('he_retroativo', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="he_retroativo">Calcular Hora Extra Retroativa?</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="n_he" name="n_he" checked={calculation.n_he} onCheckedChange={(c) => handleCheckboxChange('n_he', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="n_he">Não Calcular Hora Extra!</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="hx_mes" name="hx_mes" checked={calculation.hx_mes} onCheckedChange={(c) => handleCheckboxChange('hx_mes', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="hx_mes">Hora Extra no Mês?</Label>
                    </div>
                  </div>
                  <div><Label htmlFor="info_hora_extra">Horas Extras</Label><Textarea id="info_hora_extra" name="info_hora_extra" value={calculation.info_hora_extra} onChange={handleChange} placeholder="Ex: Fazia 2h extras por dia, de segunda a sexta." /></div>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="n_feriados" name="n_feriados" checked={calculation.n_feriados} onCheckedChange={(c) => handleCheckboxChange('n_feriados', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="n_feriados">Não Calcular Feriados!</Label>
                    </div>
                    <div>
                      <Label htmlFor="qunt_feriados_trabalhados">Qtd. Feriados Trabalhados (não compensados)</Label>
                      <Input className="text-white bg-gray-800 border border-white/50" id="qunt_feriados_trabalhados" name="qunat_feriados_trabalhados" type="number" value={calculation.qunat_feriados_trabalhados} onChange={handleChange} />
                    </div>
                  </div>
                  <div><Label htmlFor="info_feriados">Feriados Trabalhados</Label><Textarea id="info_feriados" name="info_feriados" value={calculation.info_feriados} onChange={handleChange} placeholder="Ex: Trabalhou nos últimos 3 feriados nacionais sem folga." /></div>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="n_folgas" name="n_folgas" checked={calculation.n_folgas} onCheckedChange={(c) => handleCheckboxChange('n_folgas', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="n_folgas">Não Calcular Folgas!</Label>
                    </div>
                    <div>
                      <Label htmlFor="qunat_folgas_trabalhadas">Qtd. Folgas Trabalhadas (não compensadas)</Label>
                      <Input className="text-white bg-gray-800 border border-white/50" id="qunat_folgas_trabalhadas" name="qunat_folgas_trabalhadas" type="number" value={calculation.qunat_folgas_trabalhadas} onChange={handleChange} />
                    </div>
                  </div>
                  <div><Label htmlFor="info_folgas">Folgas</Label><Textarea id="info_folgas" name="info_folgas" value={calculation.info_folgas} onChange={handleChange} placeholder="Ex: Tinha apenas 2 domingos de folga por mês." /></div>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="faltas" name="faltas" checked={calculation.faltas} onCheckedChange={(c) => handleCheckboxChange('faltas', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="faltas">Não Calcular Faltas!</Label>
                    </div>
                    <div>
                      <Label htmlFor="qunat_faltas">Qtd. Faltas (não compensadas)</Label>
                      <Input className="text-white bg-gray-800 border border-white/50" id="qunat_faltas" name="qunat_faltas" type="number" value={calculation.qunat_faltas} onChange={handleChange} />
                    </div>
                  </div>
                  <div><Label htmlFor="info_faltas">Faltas</Label><Textarea id="info_faltas" name="info_faltas" value={calculation.info_faltas} onChange={handleChange} placeholder="Ex: Faltou 5 dias no último mês sem justificativa." /></div>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="ferias_retroativas" name="ferias_retroativas" checked={calculation.ferias_retroativas} onCheckedChange={(c) => handleCheckboxChange('ferias_retroativas', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="ferias_retroativas">Calcular Férias Retroativas!</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="somente_proporcional" name="somente_proporcional" checked={calculation.somente_proporcional} onCheckedChange={(c) => handleCheckboxChange('somente_proporcional', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="somente_proporcional">Calcular Somente Proporcional!</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="recebia_sem_1_3" name="recebia_sem_1_3" checked={calculation.recebia_sem_1_3} onCheckedChange={(c) => handleCheckboxChange('recebia_sem_1_3', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="recebia_sem_1_3">Recebia sem 1/3</Label>
                    </div>
                  </div>
                  <div><Label htmlFor="info_ferias">Férias</Label><Textarea id="info_ferias" name="info_ferias" value={calculation.info_ferias} onChange={handleChange} placeholder="Ex: O Funcionário retornou de férias no mês 10/2029 ou Nunca tirou Férias Contrato rescente menos de dois anos." /></div>

                  <div className="flex items-center space-x-2 bg-gray-800 p-2 mt-2 rounded">
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="decimo_terceiro_retroativo" name="decimo_terceiro_retroativo" checked={calculation.decimo_terceiro_retroativo} onCheckedChange={(c) => handleCheckboxChange('decimo_terceiro_retroativo', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="decimo_terceiro_retroativo">Calcular 13º Retroativo!</Label>
                    </div>
                  </div>
                  <div><Label htmlFor="info_13_salario">13º Salário</Label><Textarea id="info_13_salario" name="info_13_salario" value={calculation.info_13_salario} onChange={handleChange} placeholder="Ex: Recebeu apenas a primeira parcela no último ano." /></div>
                </div>
                
                {/* Descontos e Proventos */}
                <div>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="n_calcular_descontos" name="n_calcular_descontos" checked={calculation.n_calcular_descontos} onCheckedChange={(c) => handleCheckboxChange('n_calcular_descontos', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="n_calcular_descontos">Nâo Calcular Descontos</Label>
                    </div>
                    <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                      <Checkbox id="somente_inss" name="somente_inss" checked={calculation.somente_inss} onCheckedChange={(c) => handleCheckboxChange('somente_inss', c as boolean)} className="border border-white/50" />
                      <Label htmlFor="somente_inss">Calcular Desconto Somente INSS</Label>
                    </div>
                    <div><Label htmlFor="media_descontos">Média de Descontos (R$)</Label><Input id="media_descontos" name="media_descontos" type="number" value={calculation.media_descontos} onChange={handleChange} /></div>
                  </div>
                  <div><Label htmlFor="info_descontos">Descontos</Label><Textarea id="info_descontos" name="info_descontos" value={calculation.info_descontos} onChange={handleChange} placeholder="Ex: O funcionário possui em seu contra-cheque descontos referentes a..." /></div>
                </div>
                
                <div className='flex flex-wrap gap-4 mt-2'>
                  <div className="flex items-center space-x-2 bg-gray-800 p-2 rounded">
                    <Checkbox id="n_calcular_proventos" name="n_calcular_proventos" checked={calculation.n_calcular_proventos} onCheckedChange={(c) => handleCheckboxChange('n_calcular_proventos', c as boolean)} className="border border-white/50" />
                    <Label htmlFor="n_calcular_proventos">Nâo Calcular Proventos</Label>
                  </div>
                  <div><Label htmlFor="media_remuneracoes">Média de Proventos(R$)</Label><Input id="media_remuneracoes" name="media_remuneracoes" type="number" value={calculation.media_remuneracoes} onChange={handleChange} /></div>
                </div>
                <div><Label htmlFor="info_proventos">Proventos</Label><Textarea id="info_proventos" name="info_proventos" value={calculation.info_proventos} onChange={handleChange} placeholder="Ex: O funcionário possui em seu contra-cheque proventos referentes a..." /></div>
                
                <div>
                  <Label htmlFor="historia">Histórico / Resumo do Caso</Label>
                  <Textarea id="historia" name="historia" value={calculation.historia} onChange={handleChange} rows={5} placeholder="Descreva aqui um resumo completo do caso e outras observações importantes." />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3">
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