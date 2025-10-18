export interface FieldDefinition {
  key: string; // Unique key for the field (e.g., 'cliente_nome')
  label: string; // Display label (e.g., 'Cliente (Nome/Razão Social)')
  baseSupabasePath: string; // Path from its sourceTable (e.g., 'nome' for client)
  sourceTable: string; // The table where this field originates (e.g., 'tbl_clientes')
  supabasePath?: string; // Full Supabase path, dynamically generated for the selected main table
}

export const allAvailableFieldsDefinition: FieldDefinition[] = [
  // tbl_clientes fields
  { key: 'cliente_id', label: 'Cliente (ID)', baseSupabasePath: 'id', sourceTable: 'tbl_clientes' },
  { key: 'cliente_user_id', label: 'Cliente (ID do Usuário)', baseSupabasePath: 'user_id', sourceTable: 'tbl_clientes' },
  { key: 'cliente_nome', label: 'Cliente (Nome/Razão Social)', baseSupabasePath: 'nome', sourceTable: 'tbl_clientes' },
  { key: 'cliente_cpf', label: 'Cliente (CPF)', baseSupabasePath: 'cpf', sourceTable: 'tbl_clientes' },
  { key: 'cliente_cnpj', label: 'Cliente (CNPJ)', baseSupabasePath: 'cnpj', sourceTable: 'tbl_clientes' },
  { key: 'cliente_tipo_empregador', label: 'Cliente (Tipo de Empregador)', baseSupabasePath: 'tipo_empregador', sourceTable: 'tbl_clientes' },
  { key: 'cliente_responsavel', label: 'Cliente (Responsável)', baseSupabasePath: 'responsavel', sourceTable: 'tbl_clientes' },
  { key: 'cliente_cpf_responsavel', label: 'Cliente (CPF do Responsável)', baseSupabasePath: 'cpf_responsavel', sourceTable: 'tbl_clientes' },
  { key: 'cliente_created_at', label: 'Cliente (Criado Em)', baseSupabasePath: 'created_at', sourceTable: 'tbl_clientes' },

  // tbl_sindicatos fields
  { key: 'sindicato_id', label: 'Sindicato (ID)', baseSupabasePath: 'id', sourceTable: 'tbl_sindicatos' },
  { key: 'sindicato_nome', label: 'Sindicato (Nome)', baseSupabasePath: 'nome', sourceTable: 'tbl_sindicatos' },
  { key: 'sindicato_data_inicial', label: 'Sindicato (Data Inicial)', baseSupabasePath: 'data_inicial', sourceTable: 'tbl_sindicatos' },
  { key: 'sindicato_data_final', label: 'Sindicato (Data Final)', baseSupabasePath: 'data_final', sourceTable: 'tbl_sindicatos' },
  { key: 'sindicato_mes_convencao', label: 'Sindicato (Mês Convenção)', baseSupabasePath: 'mes_convencao', sourceTable: 'tbl_sindicatos' },
  { key: 'sindicato_url_documento_sindicato', label: 'Sindicato (URL Documento)', baseSupabasePath: 'url_documento_sindicato', sourceTable: 'tbl_sindicatos' },
  { key: 'sindicato_created_at', label: 'Sindicato (Criado Em)', baseSupabasePath: 'created_at', sourceTable: 'tbl_sindicatos' },
  { key: 'sindicato_resumo_dissidio', label: 'Sindicato (Resumo Dissídio)', baseSupabasePath: 'resumo_dissidio', sourceTable: 'tbl_sindicatos' },


  // tbl_calculos fields
  { key: 'calculo_id', label: 'Cálculo (ID)', baseSupabasePath: 'id', sourceTable: 'tbl_calculos' },
  { key: 'calculo_nome_funcionario', label: 'Cálculo (Nome Funcionário)', baseSupabasePath: 'nome_funcionario', sourceTable: 'tbl_calculos' },
  { key: 'calculo_cpf_funcionario', label: 'Cálculo (CPF Funcionário)', baseSupabasePath: 'cpf_funcionario', sourceTable: 'tbl_calculos' },
  { key: 'calculo_funcao_funcionario', label: 'Cálculo (Função Funcionário)', baseSupabasePath: 'funcao_funcionario', sourceTable: 'tbl_calculos' },
  { key: 'calculo_inicio_contrato', label: 'Cálculo (Início Contrato)', baseSupabasePath: 'inicio_contrato', sourceTable: 'tbl_calculos' },
  { key: 'calculo_fim_contrato', label: 'Cálculo (Fim Contrato)', baseSupabasePath: 'fim_contrato', sourceTable: 'tbl_calculos' },
  { key: 'calculo_data_aviso', label: 'Cálculo (Data Aviso)', baseSupabasePath: 'data_aviso', sourceTable: 'tbl_calculos' }, // NOVO CAMPO
  { key: 'calculo_tipo_aviso', label: 'Cálculo (Tipo de Aviso)', baseSupabasePath: 'tipo_aviso', sourceTable: 'tbl_calculos' },
  { key: 'calculo_salario_sindicato', label: 'Cálculo (Piso Salarial Sindicato)', baseSupabasePath: 'salario_sindicato', sourceTable: 'tbl_calculos' },
  { key: 'calculo_salario_trabalhador', label: 'Cálculo (Salário do Trabalhador)', baseSupabasePath: 'salario_trabalhador', sourceTable: 'tbl_calculos' },
  { key: 'calculo_obs_sindicato', label: 'Cálculo (Obs. Sindicato)', baseSupabasePath: 'obs_sindicato', sourceTable: 'tbl_calculos' },
  { key: 'calculo_historia', label: 'Cálculo (História do Contrato)', baseSupabasePath: 'historia', sourceTable: 'tbl_calculos' },
  { key: 'calculo_ctps_assinada', label: 'Cálculo (CTPS Assinada)', baseSupabasePath: 'ctps_assinada', sourceTable: 'tbl_calculos' },
  { key: 'calculo_media_descontos', label: 'Cálculo (Média Descontos)', baseSupabasePath: 'media_descontos', sourceTable: 'tbl_calculos' },
  { key: 'calculo_media_remuneracoes', label: 'Cálculo (Média Remunerações)', baseSupabasePath: 'media_remuneracoes', sourceTable: 'tbl_calculos' },
  { key: 'calculo_carga_horaria', label: 'Cálculo (Carga Horária)', baseSupabasePath: 'carga_horaria', sourceTable: 'tbl_calculos' },
  { key: 'calculo_created_at', label: 'Cálculo (Criado Em)', baseSupabasePath: 'created_at', sourceTable: 'tbl_calculos' },
  { key: 'calculo_resposta_ai', label: 'Cálculo (Resposta IA)', baseSupabasePath: 'resposta_ai', sourceTable: 'tbl_calculos' },
  { key: 'calculo_ai_template_id', label: 'Cálculo (ID Modelo IA)', baseSupabasePath: 'ai_template_id', sourceTable: 'tbl_calculos' },
  { key: 'calculo_tip_recisao', label: 'Cálculo (Tipo Rescisão)', baseSupabasePath: 'tip_recisao', sourceTable: 'tbl_calculos' },
  { key: 'calculo_info_hora_extra', label: 'Cálculo (Info Hora Extra)', baseSupabasePath: 'info_hora_extra', sourceTable: 'tbl_calculos' },
  { key: 'calculo_info_feriados', label: 'Cálculo (Info Feriados)', baseSupabasePath: 'info_feriados', sourceTable: 'tbl_calculos' },
  { key: 'calculo_info_folgas', label: 'Cálculo (Info Folgas)', baseSupabasePath: 'info_folgas', sourceTable: 'tbl_calculos' },
  { key: 'calculo_info_ferias', label: 'Cálculo (Info Férias)', baseSupabasePath: 'info_ferias', sourceTable: 'tbl_calculos' },
  { key: 'calculo_info_13_salario', label: 'Cálculo (Info 13º Salário)', baseSupabasePath: 'info_13_salario', sourceTable: 'tbl_calculos' },
  { key: 'calculo_vale_transporte', label: 'Cálculo (Vale Transporte)', baseSupabasePath: 'vale_transporte', sourceTable: 'tbl_calculos' },
  { key: 'calculo_caixa', label: 'Cálculo (Caixa)', baseSupabasePath: 'caixa', sourceTable: 'tbl_calculos' },
  { key: 'calculo_insalubre', label: 'Cálculo (Insalubre)', baseSupabasePath: 'insalubre', sourceTable: 'tbl_calculos' },
  { key: 'calculo_periculosidade', label: 'Cálculo (Periculosidade)', baseSupabasePath: 'periculosidade', sourceTable: 'tbl_calculos' },
  { key: 'calculo_qunat_folgas_trabalhadas', label: 'Cálculo (Qtd Folgas Trabalhadas)', baseSupabasePath: 'qunat_folgas_trabalhadas', sourceTable: 'tbl_calculos' },
  { key: 'calculo_ferias_retroativas', label: 'Cálculo (Férias Retroativas)', baseSupabasePath: 'ferias_retroativas', sourceTable: 'tbl_calculos' },
  { key: 'calculo_13_retroativo', label: 'Cálculo (13º Retroativo)', baseSupabasePath: '13_retroativo', sourceTable: 'tbl_calculos' },
  { key: 'calculo_he_retroativa', label: 'Cálculo (HE Retroativa)', baseSupabasePath: 'he_retroativa', sourceTable: 'tbl_calculos' },
  { key: 'calculo_isalubridade_retroativa', label: 'Cálculo (Insalubridade Retroativa)', baseSupabasePath: 'isalubridade_retroativa', sourceTable: 'tbl_calculos' },
  { key: 'calculo_periculosidade_retroativa', label: 'Cálculo (Periculosidade Retroativa)', baseSupabasePath: 'periculosidade_retroativa', sourceTable: 'tbl_calculos' },
  { key: 'calculo_hx_mes', label: 'Cálculo (HX Mês)', baseSupabasePath: 'hx_mes', sourceTable: 'tbl_calculos' },
  { key: 'calculo_n_he', label: 'Cálculo (Não Calcular HE)', baseSupabasePath: 'n_he', sourceTable: 'tbl_calculos' },
  { key: 'calculo_n_feriados', label: 'Cálculo (Não Calcular Feriados)', baseSupabasePath: 'n_feriados', sourceTable: 'tbl_calculos' },
  { key: 'calculo_n_folgas', label: 'Cálculo (Não Calcular Folgas)', baseSupabasePath: 'n_folgas', sourceTable: 'tbl_calculos' },
  { key: 'calculo_ignorar_salario_sindicato', label: 'Cálculo (Ignorar Salário Sindicato)', baseSupabasePath: 'ignorar_salario_sindicato', sourceTable: 'tbl_calculos' },
  { key: 'calculo_info_basico', label: 'Cálculo (Info Básico)', baseSupabasePath: 'info_basico', sourceTable: 'tbl_calculos' },
  { key: 'calculo_sem_cpts_assinada', label: 'Cálculo (Sem CTPS Assinada)', baseSupabasePath: 'sem_cpts_assinada', sourceTable: 'tbl_calculos' },
  { key: 'calculo_inicio_contrat_inregular', label: 'Cálculo (Início Contrato Irregular)', baseSupabasePath: 'inicio_contrat_inregular', sourceTable: 'tbl_calculos' },
  { key: 'calculo_debito_com_empresa', label: 'Cálculo (Débito com Empresa)', baseSupabasePath: 'debito_com_empresa', sourceTable: 'tbl_calculos' },
  { key: 'calculo_valor_recebido_ferias', label: 'Cálculo (Valor Recebido Férias)', baseSupabasePath: 'valor_recebido_ferias', sourceTable: 'tbl_calculos' },
  { key: 'calculo_valor_recebido_13', label: 'Cálculo (Valor Recebido 13º)', baseSupabasePath: 'valor_recebido_13', sourceTable: 'tbl_calculos' },
  { key: 'calculo_quebra_caixa', label: 'Cálculo (Quebra Caixa)', baseSupabasePath: 'quebra_caixa', sourceTable: 'tbl_calculos' },
  { key: 'calculo_quebra_caixa_retroativo', label: 'Cálculo (Quebra Caixa Retroativo)', baseSupabasePath: 'quebra_caixa_retroativo', sourceTable: 'tbl_calculos' },
  { key: 'calculo_n_dif_salario', label: 'Cálculo (Não Calcular Dif. Salário)', baseSupabasePath: 'n_dif_salario', sourceTable: 'tbl_calculos' },
  { key: 'calculo_qunt_feriados_trabalhados', label: 'Cálculo (Qtd Feriados Trabalhados)', baseSupabasePath: 'qunt_feriados_trabalhados', sourceTable: 'tbl_calculos' },
  { key: 'calculo_somente_proporcional', label: 'Cálculo (Somente Proporcional)', baseSupabasePath: 'somente_proporcional', sourceTable: 'tbl_calculos' },
  { key: 'calculo_recebia_sem_1_3', label: 'Cálculo (Recebia sem 1/3)', baseSupabasePath: 'recebia_sem_1_3', sourceTable: 'tbl_calculos' },
  { key: 'calculo_n_calcular_descontos', label: 'Cálculo (Não Calcular Descontos)', baseSupabasePath: 'n_calcular_descontos', sourceTable: 'tbl_calculos' },
  { key: 'calculo_somente_inss', label: 'Cálculo (Somente INSS)', baseSupabasePath: 'somente_inss', sourceTable: 'tbl_calculos' },
  { key: 'calculo_info_faltas', label: 'Cálculo (Info Faltas)', baseSupabasePath: 'info_faltas', sourceTable: 'tbl_calculos' },
  { key: 'calculo_qunat_faltas', label: 'Cálculo (Qtd Faltas)', baseSupabasePath: 'qunat_faltas', sourceTable: 'tbl_calculos' },
  { key: 'calculo_faltou_todo_aviso', label: 'Cálculo (Faltou Todo Aviso)', baseSupabasePath: 'faltou_todo_aviso', sourceTable: 'tbl_calculos' },
  { key: 'calculo_faltas', label: 'Cálculo (Não Calcular Faltas)', baseSupabasePath: 'faltas', sourceTable: 'tbl_calculos' },
  { key: 'calculo_info_proventos', label: 'Cálculo (Info Proventos)', baseSupabasePath: 'info_proventos', sourceTable: 'tbl_calculos' },
  { key: 'calculo_n_calcular_proventos', label: 'Cálculo (Não Calcular Proventos)', baseSupabasePath: 'n_calcular_proventos', sourceTable: 'tbl_calculos' },
];

// Helper to construct the full Supabase path for a field based on the main table
export const getFullSupabasePath = (mainTableName: string, field: FieldDefinition): string => {
  if (field.sourceTable === mainTableName) {
    return field.baseSupabasePath;
  }

  // Handle relations
  if (mainTableName === 'tbl_clientes') {
    if (field.sourceTable === 'tbl_calculos') {
      return `tbl_calculos(${field.baseSupabasePath})`;
    }
    if (field.sourceTable === 'tbl_sindicatos') {
      return `tbl_calculos(tbl_sindicatos(${field.baseSupabasePath}))`;
    }
    if (field.sourceTable === 'tbl_ai_prompt_templates') {
      return `tbl_calculos(tbl_ai_prompt_templates(${field.baseSupabasePath}))`;
    }
    if (field.sourceTable === 'tbl_proventos') { // NOVO
      return `tbl_calculos(tbl_proventos(${field.baseSupabasePath}))`;
    }
    if (field.sourceTable === 'tbl_descontos') { // NOVO
      return `tbl_calculos(tbl_descontos(${field.baseSupabasePath}))`;
    }
  } else if (mainTableName === 'tbl_calculos') {
    if (field.sourceTable === 'tbl_clientes') {
      return `tbl_clientes(${field.baseSupabasePath})`;
    }
    if (field.sourceTable === 'tbl_sindicatos') {
      return `tbl_sindicatos(${field.baseSupabasePath})`;
    }
    if (field.sourceTable === 'tbl_ai_prompt_templates') {
      return `tbl_ai_prompt_templates(${field.baseSupabasePath})`;
    }
    if (field.sourceTable === 'tbl_proventos') { // NOVO
      return `tbl_proventos(${field.baseSupabasePath})`;
    }
    if (field.sourceTable === 'tbl_descontos') { // NOVO
      return `tbl_descontos(${field.baseSupabasePath})`;
    }
  }
  return field.baseSupabasePath; // Fallback for direct fields or if no specific relation is found
};

// Função para obter campos para exibição na UI com base na tabela selecionada
export const getDisplayFieldsForTable = (selectedTable: string): FieldDefinition[] => {
  if (selectedTable === 'all_tables') {
    return allAvailableFieldsDefinition
      .map(f => ({ ...f, supabasePath: f.baseSupabasePath }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  const relevantFields: FieldDefinition[] = allAvailableFieldsDefinition.filter(
    field => field.sourceTable === selectedTable
  );

  const uniqueFields = Array.from(new Set(relevantFields.map(f => f.key)))
    .map(key => relevantFields.find(f => f.key === key)!);

  return uniqueFields.sort((a, b) => a.label.localeCompare(b.label));
};

export const getFieldsForMainTable = (mainTableName: string): FieldDefinition[] => {
  return getDisplayFieldsForTable(mainTableName);
};


export const availableTables = [
  { value: 'all_tables', label: 'TODOS (Todos os Campos)' },
  { value: 'tbl_clientes', label: 'Clientes' },
  { value: 'tbl_calculos', label: 'Cálculos' },
  { value: 'tbl_sindicatos', label: 'Sindicatos' },
  { value: 'tbl_ai_prompt_templates', label: 'Modelos de Prompt IA' },
  { value: 'tbl_proventos', label: 'Proventos' },
  { value: 'tbl_descontos', label: 'Descontos' },
];