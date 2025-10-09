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

  // tbl_ai_prompt_templates fields (agora acessíveis via tbl_calculos)
  { key: 'ai_template_title', label: 'Modelo IA (Título)', baseSupabasePath: 'title', sourceTable: 'tbl_ai_prompt_templates' },
  { key: 'ai_template_identificacao', label: 'Modelo IA (Identificação)', baseSupabasePath: 'identificacao', sourceTable: 'tbl_ai_prompt_templates' },
  { key: 'ai_template_comportamento', label: 'Modelo IA (Comportamento)', baseSupabasePath: 'comportamento', sourceTable: 'tbl_ai_prompt_templates' },
  { key: 'ai_template_restricoes', label: 'Modelo IA (Restrições)', baseSupabasePath: 'restricoes', sourceTable: 'tbl_ai_prompt_templates' },
  { key: 'ai_template_atribuicoes', label: 'Modelo IA (Atribuições)', baseSupabasePath: 'atribuicoes', sourceTable: 'tbl_ai_prompt_templates' },
  { key: 'ai_template_leis', label: 'Modelo IA (Leis)', baseSupabasePath: 'leis', sourceTable: 'tbl_ai_prompt_templates' },
  { key: 'ai_template_proventos_text', label: 'Modelo IA (Proventos Texto)', baseSupabasePath: 'proventos', sourceTable: 'tbl_ai_prompt_templates' }, // Renomeado para evitar conflito
  { key: 'ai_template_descontos_text', label: 'Modelo IA (Descontos Texto)', baseSupabasePath: 'descontos', sourceTable: 'tbl_ai_prompt_templates' }, // Renomeado para evitar conflito
  { key: 'ai_template_observacoes_base_legal', label: 'Modelo IA (Obs. Base Legal)', baseSupabasePath: 'observacoes_base_legal', sourceTable: 'tbl_ai_prompt_templates' },
  { key: 'ai_template_estrutura_json_modelo_saida', label: 'Modelo IA (Estrutura JSON Saída)', baseSupabasePath: 'estrutura_json_modelo_saida', sourceTable: 'tbl_ai_prompt_templates' },
  { key: 'ai_template_instrucoes_entrada_dados_rescisao', label: 'Modelo IA (Instruções Entrada Dados Rescisão)', baseSupabasePath: 'instrucoes_entrada_dados_rescisao', sourceTable: 'tbl_ai_prompt_templates' },
  { key: 'ai_template_created_at', label: 'Modelo IA (Criado Em)', baseSupabasePath: 'created_at', sourceTable: 'tbl_ai_prompt_templates' },

  // tbl_proventos fields (agora com o novo nome da tabela)
  { key: 'provento_id', label: 'Provento (ID)', baseSupabasePath: 'id', sourceTable: 'tbl_proventos' },
  { key: 'provento_id_calculo', label: 'Provento (ID Cálculo)', baseSupabasePath: 'id_calculo', sourceTable: 'tbl_proventos' },
  { key: 'provento_nome_provento', label: 'Provento (Nome)', baseSupabasePath: 'nome_provento', sourceTable: 'tbl_proventos' },
  { key: 'provento_valor_calculado', label: 'Provento (Valor Calculado)', baseSupabasePath: 'valor_calculado', sourceTable: 'tbl_proventos' },
  { key: 'provento_natureza_da_verba', label: 'Provento (Natureza da Verba)', baseSupabasePath: 'natureza_da_verba', sourceTable: 'tbl_proventos' },
  { key: 'provento_legislacao', label: 'Provento (Legislação)', baseSupabasePath: 'legislacao', sourceTable: 'tbl_proventos' },
  { key: 'provento_exemplo_aplicavel', label: 'Provento (Exemplo Aplicável)', baseSupabasePath: 'exemplo_aplicavel', sourceTable: 'tbl_proventos' },
  { key: 'provento_formula_sugerida', label: 'Provento (Fórmula Sugerida)', baseSupabasePath: 'formula_sugerida', sourceTable: 'tbl_proventos' },
  { key: 'provento_parametro_calculo', label: 'Provento (Parâmetro Cálculo)', baseSupabasePath: 'parametro_calculo', sourceTable: 'tbl_proventos' },
  { key: 'provento_json_completo', label: 'Provento (JSON Completo)', baseSupabasePath: 'json_completo', sourceTable: 'tbl_proventos' },

  // tbl_descontos fields (agora com o novo nome da tabela)
  { key: 'desconto_id', label: 'Desconto (ID)', baseSupabasePath: 'id', sourceTable: 'tbl_descontos' },
  { key: 'desconto_id_calculo', label: 'Desconto (ID Cálculo)', baseSupabasePath: 'id_calculo', sourceTable: 'tbl_descontos' },
  { key: 'desconto_nome_desconto', label: 'Desconto (Nome)', baseSupabasePath: 'nome_desconto', sourceTable: 'tbl_descontos' },
  { key: 'desconto_valor_calculado', label: 'Desconto (Valor Calculado)', baseSupabasePath: 'valor_calculado', sourceTable: 'tbl_descontos' },
  { key: 'desconto_natureza_da_verba', label: 'Desconto (Natureza da Verba)', baseSupabasePath: 'natureza_da_verba', sourceTable: 'tbl_descontos' },
  { key: 'desconto_legislacao', label: 'Desconto (Legislação)', baseSupabasePath: 'legislacao', sourceTable: 'tbl_descontos' },
  { key: 'desconto_exemplo_aplicavel', label: 'Desconto (Exemplo Aplicável)', baseSupabasePath: 'exemplo_aplicavel', sourceTable: 'tbl_descontos' },
  { key: 'desconto_formula_sugerida', label: 'Desconto (Fórmula Sugerida)', baseSupabasePath: 'formula_sugerida', sourceTable: 'tbl_descontos' },
  { key: 'desconto_parametro_calculo', label: 'Desconto (Parâmetro Cálculo)', baseSupabasePath: 'parametro_calculo', sourceTable: 'tbl_descontos' },
  { key: 'desconto_json_completo', label: 'Desconto (JSON Completo)', baseSupabasePath: 'json_completo', sourceTable: 'tbl_descontos' },
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
  { value: 'tbl_proventos', label: 'Proventos' }, // NOVO
  { value: 'tbl_descontos', label: 'Descontos' }, // NOVO
];