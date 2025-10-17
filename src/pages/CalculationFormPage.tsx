import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ClientSelectField from '@/components/calculations/ClientSelectField';
import SindicatoSelectField from '@/components/calculations/SindicatoSelectField';
import AiPromptTemplateSelectField from '@/components/calculations/AiPromptTemplateSelectField';
import AvisoTypeSelectField from '@/components/calculations/AvisoTypeSelectField';
import ContractDatesSection from '@/components/calculations/ContractDatesSection';
import RescissionTypeSelectField from '@/components/calculations/RescissionTypeSelectField'; // FIX 2: Importação adicionada

// Helper Interfaces
interface Client { id: string; nome: string; }
interface Sindicato { id: string; nome: string; }
interface AiPromptTemplate { id: string; title: string; }

// Rescission types list
const rescissionTypes = [
  { label: 'Rescisão sem Justa Causa', value: 'rescisao_sem_justa_causa' },
  { label: 'Rescisão com Justa Causa', value: 'rescisao_com_justa_causa' },
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

// Initial State based on the full schema (using JS-friendly names)
const initialCalculationState = {
    // IDs
    cliente_id: '',
    sindicato_id: '',
    ai_template_id: '',

    // Employee Info
    nome_funcionario: '',
    cpf_funcionario: '',
    funcao_funcionario: '',
    carga_horaria: '',

    // Contract Dates (ISO format: YYYY-MM-DD)
    inicio_contrato: '',
    fim_contrato: '',
    inicio_contrat_inregular: '',

    // Rescission Info
    tip_recisao: '',
    tipo_aviso: '',

    // Financial Info
    salario_trabalhador: 0,
    salario_sindicato: 0,
    media_descontos: 0,
    media_remuneracoes: 0,
    debito_com_empresa: 0,
    valor_recebido_ferias: 0,
    valor_recebido_13: 0,

    // Detailed Info (text fields)
    obs_sindicato: '',
    historia: '',
    info_hora_extra: '',
    info_feriados: '',
    info_folgas: '',
    info_ferias: '',
    info_13_salario: '',
    info_descontos: '', // Not in schema, but kept for form logic
    info_proventos: '',
    info_faltas: '',

    // Specific Counts (numbers)
    qunat_folgas_trabalhadas: 0,
    qunt_feriados_trabalhados: 0,
    qunat_faltas: 0,

    // Boolean Flags (using JS-friendly names where necessary)
    ctps_assinada: false, // Maps to DB ctps_assinada
    vale_transporte: false,
    caixa: false,
    insalubre: false,
    periculosidade: false,
    ferias_retroativas: false,
    decimo_terceiro_retroativo: false, // Maps to DB 13_retroativo
    he_retroativa: false,
    isalubridade_retroativa: false,
    periculosidade_retroativa: false,
    hx_mes: false,
    n_he: false,
    n_feriados: false,
    n_folgas: false,
    ignorar_salario_sindicato: false,
    info_basico: false,
    sem_cpts_assinada: false, // Maps to DB sem_cpts_assinada
    quebra_caixa: false,
    quebra_caixa_retroativo: false,
    n_dif_salario: false,
    somente_proporcional: false,
    recebia_sem_1_3: false,
    n_calcular_descontos: false,
    somente_inss: false,
    faltou_todo_aviso: false,
    faltas: false, // Maps to DB faltas
    n_calcular_proventos: false,
};

type Calculation = typeof initialCalculationState;

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

  const fetchInitialData = async () => {
    if (!user) return;

    try {
      const [clientsRes, sindicatosRes, aiTemplatesRes] = await Promise.all([
        supabase.from('tbl_clientes').select('id, nome').eq('user_id', user.id).order('nome', { ascending: true }),
        supabase.from('tbl_sindicatos').select('id, nome').order('nome', { ascending: true }),
        supabase.from('tbl_ai_prompt_templates').select('id, title').eq('user_id', user.id).order('title', { ascending: true }),
      ]);

      if (clientsRes.error) throw clientsRes.error;
      setClients(clientsRes.data || []);

      if (sindicatosRes.error) throw sindicatosRes.error;
      setSindicatos(sindicatosRes.data || []);

      if (aiTemplatesRes.error) throw aiTemplatesRes.error;
      setAiTemplates(aiTemplatesRes.data || []);

      if (isEditing && id) {
        const { data: calcData, error: calcError } = await supabase
          .from('tbl_calculos')
          .select('*')
          .eq('id', id)
          .single();

        if (calcError) throw calcError;

        // Map DB data to state, handling nulls and boolean defaults
        setCalculation({
          ...initialCalculationState,
          ...calcData,
          // Map DB 13_retroativo to state decimo_terceiro_retroativo
          decimo_terceiro_retroativo: calcData['13_retroativo'] ?? false,
          
          // Ensure numeric fields default to 0
          salario_trabalhador: calcData.salario_trabalhador ?? 0,
          salario_sindicato: calcData.salario_sindicato ?? 0,
          media_descontos: calcData.media_descontos ?? 0,
          media_remuneracoes: calcData.media_remuneracoes ?? 0,
          debito_com_empresa: calcData.debito_com_empresa ?? 0,
          valor_recebido_ferias: calcData.valor_recebido_ferias ?? 0,
          valor_recebido_13: calcData.valor_recebido_13 ?? 0,
          qunat_folgas_trabalhadas: calcData.qunat_folgas_trabalhadas ?? 0,
          qunt_feriados_trabalhados: calcData.qunt_feriados_trabalhados ?? 0,
          qunat_faltas: calcData.qunat_faltas ?? 0,

          // Ensure boolean fields default to false
          ctps_assinada: calcData.ctps_assinada ?? false,
          vale_transporte: calcData.vale_transporte ?? false,
          caixa: calcData.caixa ?? false,
          insalubre: calcData.insalubre ?? false,
          periculosidade: calcData.periculosidade ?? false,
          ferias_retroativas: calcData.ferias_retroativas ?? false,
          he_retroativa: calcData.he_retroativa ?? false,
          isalubridade_retroativa: calcData.isalubridade_retroativa ?? false,
          periculosidade_retroativa: calcData.periculosidade_retroativa ?? false,
          hx_mes: calcData.hx_mes ?? false,
          n_he: calcData.n_he ?? false,
          n_feriados: calcData.n_feriados ?? false,
          n_folgas: calcData.n_folgas ?? false,
          ignorar_salario_sindicato: calcData.ignorar_salario_sindicato ?? false,
          info_basico: calcData.info_basico ?? false,
          sem_cpts_assinada: calcData.sem_cpts_assinada ?? false,
          quebra_caixa: calcData.quebra_caixa ?? false,
          quebra_caixa_retroativo: calcData.quebra_caixa_retroativo ?? false,
          n_dif_salario: calcData.n_dif_salario ?? false,
          somente_proporcional: calcData.somente_proporcional ?? false,
          recebia_sem_1_3: calcData.recebia_sem_1_3 ?? false,
          n_calcular_descontos: calcData.n_calcular_descontos ?? false,
          somente_inss: calcData.somente_inss ?? false,
          faltou_todo_aviso: calcData.faltou_todo_aviso ?? false,
          faltas: calcData.faltas ?? false,
          n_calcular_proventos: calcData.n_calcular_proventos ?? false,

          // Handle optional foreign keys
          sindicato_id: calcData.sindicato_id || '',
          ai_template_id: calcData.ai_template_id || '',
        });
      }
    } catch (error: any) {
      showError('Erro ao carregar dados iniciais: ' + error.message);
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [user, id, isEditing]);

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
  const handleSelectChange = (name: keyof Calculation, value: string) => {
    setCalculation(prev => ({ ...prev, [name]: value }));
  };

  // FIX 1: Ajusta a tipagem para aceitar 'string' no nome do campo, pois o componente filho usa string.
  const handleDateInputChange = (name: string, dateString: string) => {
    setCalculation(prev => ({ ...prev, [name as keyof Calculation]: dateString }));
  };

  // Generic handler for checkbox components
  const handleCheckboxChange = (name: keyof Calculation, checked: boolean) => {
    setCalculation(prev => ({ ...prev, [name]: checked }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return showError('Usuário não autenticado.');

    // --- Basic Validation ---
    if (!calculation.cliente_id) return showError('Por favor, selecione um cliente.');
    if (!calculation.nome_funcionario) return showError('Por favor, insira o nome do funcionário.');
    if (!calculation.inicio_contrato) return showError('Data de início do contrato é obrigatória.');
    if (!calculation.fim_contrato) return showError('Data de fim do contrato é obrigatória.');

    setLoading(true);

    const calculationData = {
      ...calculation,
      // Map state name back to DB column name
      '13_retroativo': calculation.decimo_terceiro_retroativo,
      
      // Ensure numeric fields are numbers, not strings or nulls
      salario_trabalhador: Number(calculation.salario_trabalhador) || 0,
      salario_sindicato: Number(calculation.salario_sindicato) || 0,
      media_descontos: Number(calculation.media_descontos) || 0,
      media_remuneracoes: Number(calculation.media_remuneracoes) || 0,
      debito_com_empresa: Number(calculation.debito_com_empresa) || 0,
      valor_recebido_ferias: Number(calculation.valor_recebido_ferias) || 0,
      valor_recebido_13: Number(calculation.valor_recebido_13) || 0,
      qunat_folgas_trabalhadas: Number(calculation.qunat_folgas_trabalhadas) || 0,
      qunt_feriados_trabalhados: Number(calculation.qunt_feriados_trabalhados) || 0,
      qunat_faltas: Number(calculation.qunat_faltas) || 0,

      // Handle optional foreign keys (empty string -> null)
      sindicato_id: calculation.sindicato_id === '' ? null : calculation.sindicato_id,
      ai_template_id: calculation.ai_template_id === '' ? null : calculation.ai_template_id,
      inicio_contrat_inregular: calculation.inicio_contrat_inregular === '' ? null : calculation.inicio_contrat_inregular,
    };

    // Clean up the temporary fields before sending to DB
    // @ts-ignore
    delete calculationData.decimo_terceiro_retroativo;
    // @ts-ignore
    delete calculationData.info_descontos; // Remove non-schema field
    
    let response;
    if (isEditing) {
      response = await supabase.from('tbl_calculos').update(calculationData).eq('id', id).select();
    } else {
      response = await supabase.from('tbl_calculos').insert(calculationData).select();
    }

    if (response.error) {
      showError('Erro ao salvar cálculo: ' + response.error.message);
      console.error('Error saving calculation:', response.error);
    } else {
      showSuccess(`Cálculo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      // Redirect to the result page of the newly created/updated calculation
      navigate(`/calculations/${response.data[0].id}/result`);
    }
    setLoading(false);
  };

  if (loading) {
    return <MainLayout><div className="container text-center py-8 text-gray-400">Carregando...</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container w-full py-8">
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
                  <div><Label htmlFor="nome_funcionario" className="text-gray-300">Nome Completo</Label><Input id="nome_funcionario" name="nome_funcionario" value={calculation.nome_funcionario} onChange={handleChange} required className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                  <div><Label htmlFor="cpf_funcionario" className="text-gray-300">CPF</Label><Input id="cpf_funcionario" name="cpf_funcionario" value={calculation.cpf_funcionario} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                  <div><Label htmlFor="funcao_funcionario" className="text-gray-300">Função</Label><Input id="funcao_funcionario" name="funcao_funcionario" value={calculation.funcao_funcionario} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                  <div><Label htmlFor="carga_horaria" className="text-gray-300">Carga Horária Semanal</Label><Input id="carga_horaria" name="carga_horaria" value={calculation.carga_horaria} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
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
                  disabled={loading}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RescissionTypeSelectField 
                    tipo_aviso={calculation.tip_recisao} 
                    noticeTypes={rescissionTypes} 
                    onValueChange={(v: string) => handleSelectChange('tip_recisao', v)} // FIX 3: Tipagem explícita
                    disabled={loading} 
                  />
                  <AvisoTypeSelectField 
                    tipo_aviso={calculation.tipo_aviso} 
                    noticeTypes={avisoTypes} 
                    onValueChange={(v: string) => handleSelectChange('tipo_aviso', v)} // FIX 3: Tipagem explícita
                    disabled={loading} 
                  />
                </div>
              </div>
              
              {/* --- SECTION: DADOS FINANCEIROS E SINDICATO --- */}
              <div className="space-y-4 border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-300">Dados Financeiros e Sindicato</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><Label htmlFor="salario_trabalhador" className="text-gray-300">Último Salário (R$)</Label><Input id="salario_trabalhador" name="salario_trabalhador" type="number" value={calculation.salario_trabalhador} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                  <div><Label htmlFor="salario_sindicato" className="text-gray-300">Piso Salarial Sindicato (R$)</Label><Input id="salario_sindicato" name="salario_sindicato" type="number" value={calculation.salario_sindicato} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                  <div><Label htmlFor="debito_com_empresa" className="text-gray-300">Débito com a Empresa (R$)</Label><Input id="debito_com_empresa" name="debito_com_empresa" type="number" value={calculation.debito_com_empresa} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                  <div><Label htmlFor="valor_recebido_ferias" className="text-gray-300">Valor já Recebido de Férias (R$)</Label><Input id="valor_recebido_ferias" name="valor_recebido_ferias" type="number" value={calculation.valor_recebido_ferias} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                  <div><Label htmlFor="valor_recebido_13" className="text-gray-300">Valor já Recebido de 13º (R$)</Label><Input id="valor_recebido_13" name="valor_recebido_13" type="number" value={calculation.valor_recebido_13} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                </div>
                <div><Label htmlFor="obs_sindicato" className="text-gray-300">Observações Sindicato</Label><Textarea id="obs_sindicato" name="obs_sindicato" value={calculation.obs_sindicato} onChange={handleChange} rows={3} placeholder="Insira observações específicas da CCT ou dissídio." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
              </div>
              
              {/* --- SECTION: FLAGS E INFORMAÇÕES ADICIONAIS --- */}
              <div className="space-y-6 border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-300">Flags e Detalhes Contratuais</h3>

                {/* Linha 1: Flags Gerais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="ctps_assinada" name="ctps_assinada" checked={calculation.ctps_assinada} onCheckedChange={(c) => handleCheckboxChange('ctps_assinada', c as boolean)} className="border border-white/50" /><Label htmlFor="ctps_assinada" className="text-gray-300">CTPS Assinada?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="sem_cpts_assinada" name="sem_cpts_assinada" checked={calculation.sem_cpts_assinada} onCheckedChange={(c) => handleCheckboxChange('sem_cpts_assinada', c as boolean)} className="border border-white/50" /><Label htmlFor="sem_cpts_assinada" className="text-gray-300">Sem CTPS Assinada?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="vale_transporte" name="vale_transporte" checked={calculation.vale_transporte} onCheckedChange={(c) => handleCheckboxChange('vale_transporte', c as boolean)} className="border border-white/50" /><Label htmlFor="vale_transporte" className="text-gray-300">Recebe Vale Transporte?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="faltou_todo_aviso" name="faltou_todo_aviso" checked={calculation.faltou_todo_aviso} onCheckedChange={(c) => handleCheckboxChange('faltou_todo_aviso', c as boolean)} className="border border-white/50" /><Label htmlFor="faltou_todo_aviso" className="text-gray-300">Faltou Todo Aviso?</Label></div>
                </div>

                {/* Linha 2: Caixa e Adicionais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="caixa" name="caixa" checked={calculation.caixa} onCheckedChange={(c) => handleCheckboxChange('caixa', c as boolean)} className="border border-white/50" /><Label htmlFor="caixa" className="text-gray-300">Função de Caixa?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="quebra_caixa" name="quebra_caixa" checked={calculation.quebra_caixa} onCheckedChange={(c) => handleCheckboxChange('quebra_caixa', c as boolean)} className="border border-white/50" /><Label htmlFor="quebra_caixa" className="text-gray-300">Recebia Quebra de Caixa?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="insalubre" name="insalubre" checked={calculation.insalubre} onCheckedChange={(c) => handleCheckboxChange('insalubre', c as boolean)} className="border border-white/50" /><Label htmlFor="insalubre" className="text-gray-300">Serviço Insalubre?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="periculosidade" name="periculosidade" checked={calculation.periculosidade} onCheckedChange={(c) => handleCheckboxChange('periculosidade', c as boolean)} className="border border-white/50" /><Label htmlFor="periculosidade" className="text-gray-300">Serviço Periculoso?</Label></div>
                </div>

                {/* Linha 3: Retroativos */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="ferias_retroativas" name="ferias_retroativas" checked={calculation.ferias_retroativas} onCheckedChange={(c) => handleCheckboxChange('ferias_retroativas', c as boolean)} className="border border-white/50" /><Label htmlFor="ferias_retroativas" className="text-gray-300">Férias Retroativas?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="decimo_terceiro_retroativo" name="decimo_terceiro_retroativo" checked={calculation.decimo_terceiro_retroativo} onCheckedChange={(c) => handleCheckboxChange('decimo_terceiro_retroativo', c as boolean)} className="border border-white/50" /><Label htmlFor="decimo_terceiro_retroativo" className="text-gray-300">13º Retroativo?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="he_retroativa" name="he_retroativa" checked={calculation.he_retroativa} onCheckedChange={(c) => handleCheckboxChange('he_retroativa', c as boolean)} className="border border-white/50" /><Label htmlFor="he_retroativa" className="text-gray-300">HE Retroativa?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="quebra_caixa_retroativo" name="quebra_caixa_retroativo" checked={calculation.quebra_caixa_retroativo} onCheckedChange={(c) => handleCheckboxChange('quebra_caixa_retroativo', c as boolean)} className="border border-white/50" /><Label htmlFor="quebra_caixa_retroativo" className="text-gray-300">QC Retroativo?</Label></div>
                </div>

                {/* Linha 4: Retroativos Adicionais */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="isalubridade_retroativa" name="isalubridade_retroativa" checked={calculation.isalubridade_retroativa} onCheckedChange={(c) => handleCheckboxChange('isalubridade_retroativa', c as boolean)} className="border border-white/50" /><Label htmlFor="isalubridade_retroativa" className="text-gray-300">Insalubridade Retroativa?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="periculosidade_retroativa" name="periculosidade_retroativa" checked={calculation.periculosidade_retroativa} onCheckedChange={(c) => handleCheckboxChange('periculosidade_retroativa', c as boolean)} className="border border-white/50" /><Label htmlFor="periculosidade_retroativa" className="text-gray-300">Periculosidade Retroativa?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="recebia_sem_1_3" name="recebia_sem_1_3" checked={calculation.recebia_sem_1_3} onCheckedChange={(c) => handleCheckboxChange('recebia_sem_1_3', c as boolean)} className="border border-white/50" /><Label htmlFor="recebia_sem_1_3" className="text-gray-300">Recebia sem 1/3?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="somente_proporcional" name="somente_proporcional" checked={calculation.somente_proporcional} onCheckedChange={(c) => handleCheckboxChange('somente_proporcional', c as boolean)} className="border border-white/50" /><Label htmlFor="somente_proporcional" className="text-gray-300">Somente Proporcional?</Label></div>
                </div>

                {/* Linha 5: Flags de Cálculo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="ignorar_salario_sindicato" name="ignorar_salario_sindicato" checked={calculation.ignorar_salario_sindicato} onCheckedChange={(c) => handleCheckboxChange('ignorar_salario_sindicato', c as boolean)} className="border border-white/50" /><Label htmlFor="ignorar_salario_sindicato" className="text-gray-300">Ignorar Piso Sindical?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="n_dif_salario" name="n_dif_salario" checked={calculation.n_dif_salario} onCheckedChange={(c) => handleCheckboxChange('n_dif_salario', c as boolean)} className="border border-white/50" /><Label htmlFor="n_dif_salario" className="text-gray-300">Não Calcular Dif. Salário?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="info_basico" name="info_basico" checked={calculation.info_basico} onCheckedChange={(c) => handleCheckboxChange('info_basico', c as boolean)} className="border border-white/50" /><Label htmlFor="info_basico" className="text-gray-300">Usar Info Básica (IA)?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="somente_inss" name="somente_inss" checked={calculation.somente_inss} onCheckedChange={(c) => handleCheckboxChange('somente_inss', c as boolean)} className="border border-white/50" /><Label htmlFor="somente_inss" className="text-gray-300">Somente INSS (Desconto)?</Label></div>
                </div>
              </div>

              {/* --- SECTION: DETALHES DE HORAS/FALTAS --- */}
              <div className="space-y-4 border-b border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-300">Horas Extras, Feriados e Faltas</h3>
                
                {/* Horas Extras */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="n_he" name="n_he" checked={calculation.n_he} onCheckedChange={(c) => handleCheckboxChange('n_he', c as boolean)} className="border border-white/50" /><Label htmlFor="n_he" className="text-gray-300">Não Calcular HE?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="hx_mes" name="hx_mes" checked={calculation.hx_mes} onCheckedChange={(c) => handleCheckboxChange('hx_mes', c as boolean)} className="border border-white/50" /><Label htmlFor="hx_mes" className="text-gray-300">HE no Mês?</Label></div>
                </div>
                <div><Label htmlFor="info_hora_extra" className="text-gray-300">Detalhes Horas Extras</Label><Textarea id="info_hora_extra" name="info_hora_extra" value={calculation.info_hora_extra} onChange={handleChange} placeholder="Ex: Fazia 2h extras por dia, de segunda a sexta." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>

                {/* Feriados */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="n_feriados" name="n_feriados" checked={calculation.n_feriados} onCheckedChange={(c) => handleCheckboxChange('n_feriados', c as boolean)} className="border border-white/50" /><Label htmlFor="n_feriados" className="text-gray-300">Não Calcular Feriados?</Label></div>
                  <div><Label htmlFor="qunt_feriados_trabalhados" className="text-gray-300">Qtd. Feriados Trabalhados (não compensados)</Label><Input id="qunt_feriados_trabalhados" name="qunt_feriados_trabalhados" type="number" value={calculation.qunt_feriados_trabalhados} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                </div>
                <div><Label htmlFor="info_feriados" className="text-gray-300">Detalhes Feriados</Label><Textarea id="info_feriados" name="info_feriados" value={calculation.info_feriados} onChange={handleChange} placeholder="Ex: Trabalhou nos últimos 3 feriados nacionais sem folga." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>

                {/* Folgas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="n_folgas" name="n_folgas" checked={calculation.n_folgas} onCheckedChange={(c) => handleCheckboxChange('n_folgas', c as boolean)} className="border border-white/50" /><Label htmlFor="n_folgas" className="text-gray-300">Não Calcular Folgas?</Label></div>
                  <div><Label htmlFor="qunat_folgas_trabalhadas" className="text-gray-300">Qtd. Folgas Trabalhadas (não compensadas)</Label><Input id="qunat_folgas_trabalhadas" name="qunat_folgas_trabalhadas" type="number" value={calculation.qunat_folgas_trabalhadas} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                </div>
                <div><Label htmlFor="info_folgas" className="text-gray-300">Detalhes Folgas</Label><Textarea id="info_folgas" name="info_folgas" value={calculation.info_folgas} onChange={handleChange} placeholder="Ex: Tinha apenas 2 domingos de folga por mês." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>

                {/* Faltas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="faltas" name="faltas" checked={calculation.faltas} onCheckedChange={(c) => handleCheckboxChange('faltas', c as boolean)} className="border border-white/50" /><Label htmlFor="faltas" className="text-gray-300">Não Calcular Faltas?</Label></div>
                  <div><Label htmlFor="qunat_faltas" className="text-gray-300">Qtd. Faltas</Label><Input id="qunat_faltas" name="qunat_faltas" type="number" value={calculation.qunat_faltas} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                </div>
                <div><Label htmlFor="info_faltas" className="text-gray-300">Detalhes Faltas</Label><Textarea id="info_faltas" name="info_faltas" value={calculation.info_faltas} onChange={handleChange} placeholder="Ex: Faltou 5 dias no último mês sem justificativa." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
              </div>

              {/* --- SECTION: PROVENTOS E DESCONTOS --- */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-300">Proventos e Descontos</h3>
                
                {/* Proventos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="n_calcular_proventos" name="n_calcular_proventos" checked={calculation.n_calcular_proventos} onCheckedChange={(c) => handleCheckboxChange('n_calcular_proventos', c as boolean)} className="border border-white/50" /><Label htmlFor="n_calcular_proventos" className="text-gray-300">Não Calcular Proventos?</Label></div>
                  <div><Label htmlFor="media_remuneracoes" className="text-gray-300">Média de Proventos (R$)</Label><Input id="media_remuneracoes" name="media_remuneracoes" type="number" value={calculation.media_remuneracoes} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                </div>
                <div><Label htmlFor="info_proventos" className="text-gray-300">Detalhes Proventos</Label><Textarea id="info_proventos" name="info_proventos" value={calculation.info_proventos} onChange={handleChange} placeholder="Ex: O funcionário possui em seu contra-cheque proventos referentes a..." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>

                {/* Descontos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2"><Checkbox id="n_calcular_descontos" name="n_calcular_descontos" checked={calculation.n_calcular_descontos} onCheckedChange={(c) => handleCheckboxChange('n_calcular_descontos', c as boolean)} className="border border-white/50" /><Label htmlFor="n_calcular_descontos" className="text-gray-300">Não Calcular Descontos?</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="somente_inss" name="somente_inss" checked={calculation.somente_inss} onCheckedChange={(c) => handleCheckboxChange('somente_inss', c as boolean)} className="border border-white/50" /><Label htmlFor="somente_inss" className="text-gray-300">Calcular Desconto Somente INSS?</Label></div>
                  <div><Label htmlFor="media_descontos" className="text-gray-300">Média de Descontos (R$)</Label><Input id="media_descontos" name="media_descontos" type="number" value={calculation.media_descontos} onChange={handleChange} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /></div>
                </div>
              </div>

              {/* --- SECTION: HISTÓRICO --- */}
              <div>
                <Label htmlFor="historia" className="text-gray-300">Histórico / Resumo do Caso</Label>
                <Textarea id="historia" name="historia" value={calculation.historia} onChange={handleChange} rows={5} placeholder="Descreva aqui um resumo completo do caso e outras observações importantes." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
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