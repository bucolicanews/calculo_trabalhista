export interface FieldDefinition {
  key: string; // Unique key for the field (e.g., 'cliente_nome')
  label: string; // Display label (e.g., 'Cliente (Nome/Razão Social)')
  baseSupabasePath: string; // Path from its sourceTable (e.g., 'nome' for client, 'tbl_dissidios(id)' for sindicato)
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

  // tbl_dissidios fields (related to tbl_sindicatos, but also direct fields)
  { key: 'dissidio_id', label: 'Dissídio (ID)', baseSupabasePath: 'id', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_sindicato_id', label: 'Dissídio (ID do Sindicato)', baseSupabasePath: 'sindicato_id', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_nome_dissidio', label: 'Dissídio (Nome)', baseSupabasePath: 'nome_dissidio', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_url_documento', label: 'Dissídio (URL Documento)', baseSupabasePath: 'url_documento', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_resumo_dissidio', label: 'Dissídio (Resumo Manual)', baseSupabasePath: 'resumo_dissidio', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_data_vigencia_inicial', label: 'Dissídio (Início Vigência)', baseSupabasePath: 'data_vigencia_inicial', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_data_vigencia_final', label: 'Dissídio (Fim Vigência)', baseSupabasePath: 'data_vigencia_final', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_mes_convencao', label: 'Dissídio (Mês Convenção)', baseSupabasePath: 'mes_convencao', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_texto_extraido', label: 'Dissídio (Texto Extraído PDF)', baseSupabasePath: 'texto_extraido', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_resumo_ai', label: 'Dissídio (Resumo IA)', baseSupabasePath: 'resumo_ai', sourceTable: 'tbl_dissidios' },
  { key: 'dissidio_created_at', label: 'Dissídio (Criado Em)', baseSupabasePath: 'created_at', sourceTable: 'tbl_dissidios' },

  // tbl_calculos fields
  { key: 'calculo_id', label: 'Cálculo (ID)', baseSupabasePath: 'id', sourceTable: 'tbl_calculos' },
  { key: 'calculo_nome_funcionario', label: 'Cálculo (Nome Funcionário)', baseSupabasePath: 'nome_funcionario', sourceTable: 'tbl_calculos' },
  { key: 'calculo_cpf_funcionario', label: 'Cálculo (CPF Funcionário)', baseSupabasePath: 'cpf_funcionario', sourceTable: 'tbl_calculos' },
  { key: 'calculo_funcao_funcionario', label: 'Cálculo (Função Funcionário)', baseSupabasePath: 'funcao_funcionario', sourceTable: 'tbl_calculos' },
  { key: 'calculo_inicio_contrato', label: 'Cálculo (Início Contrato)', baseSupabasePath: 'inicio_contrato', sourceTable: 'tbl_calculos' },
  { key: 'calculo_fim_contrato', label: 'Cálculo (Fim Contrato)', baseSupabasePath: 'fim_contrato', sourceTable: 'tbl_calculos' },
  { key: 'calculo_tipo_aviso', label: 'Cálculo (Tipo de Aviso)', baseSupabasePath: 'tipo_aviso', sourceTable: 'tbl_calculos' },
  { key: 'calculo_salario_sindicato', label: 'Cálculo (Piso Salarial Sindicato)', baseSupabasePath: 'salario_sindicato', sourceTable: 'tbl_calculos' },
  { key: 'calculo_obs_sindicato', label: 'Cálculo (Obs. Sindicato)', baseSupabasePath: 'obs_sindicato', sourceTable: 'tbl_calculos' },
  { key: 'calculo_historia', label: 'Cálculo (História do Contrato)', baseSupabasePath: 'historia', sourceTable: 'tbl_calculos' },
  { key: 'calculo_ctps_assinada', label: 'Cálculo (CTPS Assinada)', baseSupabasePath: 'ctps_assinada', sourceTable: 'tbl_calculos' },
  { key: 'calculo_media_descontos', label: 'Cálculo (Média Descontos)', baseSupabasePath: 'media_descontos', sourceTable: 'tbl_calculos' },
  { key: 'calculo_media_remuneracoes', label: 'Cálculo (Média Remunerações)', baseSupabasePath: 'media_remuneracoes', sourceTable: 'tbl_calculos' },
  { key: 'calculo_carga_horaria', label: 'Cálculo (Carga Horária)', baseSupabasePath: 'carga_horaria', sourceTable: 'tbl_calculos' },
  { key: 'calculo_created_at', label: 'Cálculo (Criado Em)', baseSupabasePath: 'created_at', sourceTable: 'tbl_calculos' },

  // tbl_resposta_calculo fields
  { key: 'resposta_id', label: 'Resposta Cálculo (ID)', baseSupabasePath: 'id', sourceTable: 'tbl_resposta_calculo' },
  { key: 'resposta_calculo_id', label: 'Resposta Cálculo (ID do Cálculo)', baseSupabasePath: 'calculo_id', sourceTable: 'tbl_resposta_calculo' },
  { key: 'resposta_ai', label: 'Resposta Cálculo (Resposta AI)', baseSupabasePath: 'resposta_ai', sourceTable: 'tbl_resposta_calculo' },
  { key: 'resposta_data_hora', label: 'Resposta Cálculo (Data/Hora)', baseSupabasePath: 'data_hora', sourceTable: 'tbl_resposta_calculo' },
  { key: 'resposta_url_documento_calculo', label: 'Resposta Cálculo (URL Documento PDF)', baseSupabasePath: 'url_documento_calculo', sourceTable: 'tbl_resposta_calculo' }, // NOVO
  { key: 'resposta_texto_extraido', label: 'Resposta Cálculo (Texto Extraído PDF)', baseSupabasePath: 'texto_extraido', sourceTable: 'tbl_resposta_calculo' }, // NOVO
  { key: 'resposta_created_at', label: 'Resposta Cálculo (Criado Em)', baseSupabasePath: 'created_at', sourceTable: 'tbl_resposta_calculo' },
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
    if (field.sourceTable === 'tbl_resposta_calculo') {
      return `tbl_calculos(tbl_resposta_calculo(${field.baseSupabasePath}))`;
    }
  } else if (mainTableName === 'tbl_calculos') {
    if (field.sourceTable === 'tbl_clientes') {
      return `tbl_clientes(${field.baseSupabasePath})`;
    }
    if (field.sourceTable === 'tbl_sindicatos') {
      // If sindicato field is already nested (like dissidio fields), use its base path directly
      // This case is for when a sindicato field is selected from a calculation webhook
      return `tbl_sindicatos(${field.baseSupabasePath})`;
    }
    if (field.sourceTable === 'tbl_dissidios') {
      // If dissidio field is selected from a calculation webhook
      return `tbl_sindicatos(tbl_dissidios(${field.baseSupabasePath}))`;
    }
    if (field.sourceTable === 'tbl_resposta_calculo') {
      return `tbl_resposta_calculo(${field.baseSupabasePath})`;
    }
  } else if (mainTableName === 'tbl_sindicatos') {
    // For sindicatos, we only show its own fields and its dissidios
    if (field.sourceTable === 'tbl_dissidios') {
      return `tbl_dissidios(${field.baseSupabasePath})`;
    }
  } else if (mainTableName === 'tbl_dissidios') { // NEW LOGIC FOR tbl_dissidios AS MAIN TABLE
    if (field.sourceTable === 'tbl_sindicatos') {
      return `tbl_sindicatos(${field.baseSupabasePath})`;
    }
  } else if (mainTableName === 'tbl_resposta_calculo') {
    if (field.sourceTable === 'tbl_calculos') {
      return `tbl_calculos(${field.baseSupabasePath})`;
    }
    if (field.sourceTable === 'tbl_clientes') {
      return `tbl_calculos(tbl_clientes(${field.baseSupabasePath}))`;
    }
    if (field.sourceTable === 'tbl_sindicatos') {
      return `tbl_calculos(tbl_sindicatos(${field.baseSupabasePath}))`;
    }
    if (field.sourceTable === 'tbl_dissidios') {
      return `tbl_calculos(tbl_sindicatos(tbl_dissidios(${field.baseSupabasePath})))`;
    }
  }
  return field.baseSupabasePath; // Fallback, should not happen if logic is complete
};

// New function to get fields for UI display based on selected table
export const getDisplayFieldsForTable = (selectedTable: string): FieldDefinition[] => {
  if (selectedTable === 'all_tables') {
    return allAvailableFieldsDefinition
      .map(f => ({ ...f, supabasePath: f.baseSupabasePath }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  const relevantFields: FieldDefinition[] = [];

  // 1. Always include fields directly from the selected table
  allAvailableFieldsDefinition.forEach(field => {
    if (field.sourceTable === selectedTable) {
      relevantFields.push({ ...field, supabasePath: field.baseSupabasePath });
    }
  });

  // 2. Include fields from related tables based on the selected main table
  if (selectedTable === 'tbl_calculos') {
    allAvailableFieldsDefinition.forEach(field => {
      if (field.sourceTable === 'tbl_clientes' || field.sourceTable === 'tbl_sindicatos' || field.sourceTable === 'tbl_dissidios' || field.sourceTable === 'tbl_resposta_calculo') { // Adicionado tbl_resposta_calculo
        relevantFields.push({ ...field, supabasePath: getFullSupabasePath(selectedTable, field) });
      }
    });
  } else if (selectedTable === 'tbl_resposta_calculo') {
    allAvailableFieldsDefinition.forEach(field => {
      if (field.sourceTable === 'tbl_calculos' || field.sourceTable === 'tbl_clientes' || field.sourceTable === 'tbl_sindicatos' || field.sourceTable === 'tbl_dissidios') {
        relevantFields.push({ ...field, supabasePath: getFullSupabasePath(selectedTable, field) });
      }
    });
  } else if (selectedTable === 'tbl_sindicatos') {
    allAvailableFieldsDefinition.forEach(field => {
      if (field.sourceTable === 'tbl_dissidios') {
        relevantFields.push({ ...field, supabasePath: getFullSupabasePath(selectedTable, field) });
      }
    });
  } else if (selectedTable === 'tbl_dissidios') { // NEW LOGIC FOR tbl_dissidios
    allAvailableFieldsDefinition.forEach(field => {
      if (field.sourceTable === 'tbl_sindicatos') {
        relevantFields.push({ ...field, supabasePath: getFullSupabasePath(selectedTable, field) });
      }
    });
  }
  // For tbl_clientes, only its own fields are directly relevant for selection in the UI.
  // If a user wants calculation fields, they should select tbl_calculos as the main table.

  // Remove duplicates and sort
  const uniqueFields = Array.from(new Set(relevantFields.map(f => f.key)))
    .map(key => relevantFields.find(f => f.key === key)!);

  return uniqueFields.sort((a, b) => a.label.localeCompare(b.label));
};

// Keep getFieldsForMainTable for backward compatibility if needed elsewhere,
// but getDisplayFieldsForTable is the one for UI filtering.
// Note: The previous getFieldsForMainTable was effectively replaced by getDisplayFieldsForTable
// for UI purposes, and getFullSupabasePath is for actual query building.
// I'll keep getFieldsForMainTable as a simple alias for getDisplayFieldsForTable for now,
// but it's important to understand their distinct roles.
export const getFieldsForMainTable = (mainTableName: string): FieldDefinition[] => {
  return getDisplayFieldsForTable(mainTableName);
};


export const availableTables = [
  { value: 'all_tables', label: 'TODOS (Todos os Campos)' },
  { value: 'tbl_clientes', label: 'Clientes' },
  { value: 'tbl_calculos', label: 'Cálculos' },
  { value: 'tbl_sindicatos', label: 'Sindicatos' },
  { value: 'tbl_dissidios', label: 'Dissídios' }, // Adicionado tbl_dissidios como tabela principal
  { value: 'tbl_resposta_calculo', label: 'Respostas de Cálculo' },
];