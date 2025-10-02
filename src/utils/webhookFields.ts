export interface FieldDefinition {
  key: string; // Unique key for the field (e.g., 'cliente_nome')
  label: string; // Display label (e.g., 'Cliente (Nome/Razão Social)')
  supabasePath: string; // Supabase select path (e.g., 'tbl_clientes(nome)')
  sourceTable: string; // The table where this field originates (e.g., 'tbl_clientes')
  appliesToTables: string[]; // The main tables for which this field is relevant for selection
}

export const allAvailableFieldsDefinition: FieldDefinition[] = [
  // tbl_clientes fields
  { key: 'cliente_id', label: 'Cliente (ID)', supabasePath: 'id', sourceTable: 'tbl_clientes', appliesToTables: ['tbl_clientes', 'tbl_calculos', 'tbl_resposta_calculo'] },
  { key: 'cliente_user_id', label: 'Cliente (ID do Usuário)', supabasePath: 'user_id', sourceTable: 'tbl_clientes', appliesToTables: ['tbl_clientes'] },
  { key: 'cliente_nome', label: 'Cliente (Nome/Razão Social)', supabasePath: 'nome', sourceTable: 'tbl_clientes', appliesToTables: ['tbl_clientes', 'tbl_calculos', 'tbl_resposta_calculo'] },
  { key: 'cliente_cpf', label: 'Cliente (CPF)', supabasePath: 'cpf', sourceTable: 'tbl_clientes', appliesToTables: ['tbl_clientes', 'tbl_calculos'] },
  { key: 'cliente_cnpj', label: 'Cliente (CNPJ)', supabasePath: 'cnpj', sourceTable: 'tbl_clientes', appliesToTables: ['tbl_clientes', 'tbl_calculos'] },
  { key: 'cliente_tipo_empregador', label: 'Cliente (Tipo de Empregador)', supabasePath: 'tipo_empregador', sourceTable: 'tbl_clientes', appliesToTables: ['tbl_clientes', 'tbl_calculos'] },
  { key: 'cliente_responsavel', label: 'Cliente (Responsável)', supabasePath: 'responsavel', sourceTable: 'tbl_clientes', appliesToTables: ['tbl_clientes', 'tbl_calculos'] },
  { key: 'cliente_cpf_responsavel', label: 'Cliente (CPF do Responsável)', supabasePath: 'cpf_responsavel', sourceTable: 'tbl_clientes', appliesToTables: ['tbl_clientes', 'tbl_calculos'] },
  { key: 'cliente_created_at', label: 'Cliente (Criado Em)', supabasePath: 'created_at', sourceTable: 'tbl_clientes', appliesToTables: ['tbl_clientes', 'tbl_calculos'] },

  // tbl_sindicatos fields
  { key: 'sindicato_id', label: 'Sindicato (ID)', supabasePath: 'id', sourceTable: 'tbl_sindicatos', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'sindicato_nome', label: 'Sindicato (Nome)', supabasePath: 'nome', sourceTable: 'tbl_sindicatos', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'sindicato_data_inicial', label: 'Sindicato (Data Inicial)', supabasePath: 'data_inicial', sourceTable: 'tbl_sindicatos', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'sindicato_data_final', label: 'Sindicato (Data Final)', supabasePath: 'data_final', sourceTable: 'tbl_sindicatos', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'sindicato_mes_convencao', label: 'Sindicato (Mês Convenção)', supabasePath: 'mes_convencao', sourceTable: 'tbl_sindicatos', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'sindicato_url_documento_sindicato', label: 'Sindicato (URL Documento)', supabasePath: 'url_documento_sindicato', sourceTable: 'tbl_sindicatos', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'sindicato_created_at', label: 'Sindicato (Criado Em)', supabasePath: 'created_at', sourceTable: 'tbl_sindicatos', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },

  // tbl_dissidios fields (related to tbl_sindicatos)
  { key: 'dissidio_id', label: 'Dissídio (ID)', supabasePath: 'tbl_dissidios(id)', sourceTable: 'tbl_dissidios', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'dissidio_nome_dissidio', label: 'Dissídio (Nome)', supabasePath: 'tbl_dissidios(nome_dissidio)', sourceTable: 'tbl_dissidios', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'dissidio_url_documento', label: 'Dissídio (URL Documento)', supabasePath: 'tbl_dissidios(url_documento)', sourceTable: 'tbl_dissidios', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'dissidio_resumo_dissidio', label: 'Dissídio (Resumo)', supabasePath: 'tbl_dissidios(resumo_dissidio)', sourceTable: 'tbl_dissidios', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'dissidio_data_vigencia_inicial', label: 'Dissídio (Início Vigência)', supabasePath: 'tbl_dissidios(data_vigencia_inicial)', sourceTable: 'tbl_dissidios', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'dissidio_data_vigencia_final', label: 'Dissídio (Fim Vigência)', supabasePath: 'tbl_dissidios(data_vigencia_final)', sourceTable: 'tbl_dissidios', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'dissidio_mes_convencao', label: 'Dissídio (Mês Convenção)', supabasePath: 'tbl_dissidios(mes_convencao)', sourceTable: 'tbl_dissidios', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },
  { key: 'dissidio_created_at', label: 'Dissídio (Criado Em)', supabasePath: 'tbl_dissidios(created_at)', sourceTable: 'tbl_dissidios', appliesToTables: ['tbl_sindicatos', 'tbl_calculos'] },

  // tbl_calculos fields
  { key: 'calculo_id', label: 'Cálculo (ID)', supabasePath: 'id', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos', 'tbl_resposta_calculo'] },
  { key: 'calculo_nome_funcionario', label: 'Cálculo (Nome Funcionário)', supabasePath: 'nome_funcionario', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos', 'tbl_resposta_calculo'] },
  { key: 'calculo_cpf_funcionario', label: 'Cálculo (CPF Funcionário)', supabasePath: 'cpf_funcionario', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_funcao_funcionario', label: 'Cálculo (Função Funcionário)', supabasePath: 'funcao_funcionario', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_inicio_contrato', label: 'Cálculo (Início Contrato)', supabasePath: 'inicio_contrato', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_fim_contrato', label: 'Cálculo (Fim Contrato)', supabasePath: 'fim_contrato', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_tipo_aviso', label: 'Cálculo (Tipo de Aviso)', supabasePath: 'tipo_aviso', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_salario_sindicato', label: 'Cálculo (Piso Salarial Sindicato)', supabasePath: 'salario_sindicato', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_obs_sindicato', label: 'Cálculo (Obs. Sindicato)', supabasePath: 'obs_sindicato', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_historia', label: 'Cálculo (História do Contrato)', supabasePath: 'historia', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_ctps_assinada', label: 'Cálculo (CTPS Assinada)', supabasePath: 'ctps_assinada', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_media_descontos', label: 'Cálculo (Média Descontos)', supabasePath: 'media_descontos', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_media_remuneracoes', label: 'Cálculo (Média Remunerações)', supabasePath: 'media_remuneracoes', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_carga_horaria', label: 'Cálculo (Carga Horária)', supabasePath: 'carga_horaria', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },
  { key: 'calculo_created_at', label: 'Cálculo (Criado Em)', supabasePath: 'created_at', sourceTable: 'tbl_calculos', appliesToTables: ['tbl_calculos'] },

  // tbl_resposta_calculo fields
  { key: 'resposta_id', label: 'Resposta Cálculo (ID)', supabasePath: 'id', sourceTable: 'tbl_resposta_calculo', appliesToTables: ['tbl_resposta_calculo'] },
  { key: 'resposta_calculo_id', label: 'Resposta Cálculo (ID do Cálculo)', supabasePath: 'calculo_id', sourceTable: 'tbl_resposta_calculo', appliesToTables: ['tbl_resposta_calculo'] },
  { key: 'resposta_ai', label: 'Resposta Cálculo (Resposta AI)', supabasePath: 'resposta_ai', sourceTable: 'tbl_resposta_calculo', appliesToTables: ['tbl_resposta_calculo'] },
  { key: 'resposta_data_hora', label: 'Resposta Cálculo (Data/Hora)', supabasePath: 'data_hora', sourceTable: 'tbl_resposta_calculo', appliesToTables: ['tbl_resposta_calculo'] },
  { key: 'resposta_created_at', label: 'Resposta Cálculo (Criado Em)', supabasePath: 'created_at', sourceTable: 'tbl_resposta_calculo', appliesToTables: ['tbl_resposta_calculo'] },
];

export const getFieldsForMainTable = (mainTableName: string): FieldDefinition[] => {
  const fields = allAvailableFieldsDefinition.filter(field =>
    field.appliesToTables.includes(mainTableName)
  );

  // Ensure unique keys and sort for better UX
  const uniqueFields = Array.from(new Map(fields.map(item => [item.key, item])).values());
  return uniqueFields.sort((a, b) => a.label.localeCompare(b.label));
};

export const availableTables = [
  { value: 'tbl_clientes', label: 'Clientes' },
  { value: 'tbl_calculos', label: 'Cálculos' },
  { value: 'tbl_sindicatos', label: 'Sindicatos' },
  { value: 'tbl_resposta_calculo', label: 'Respostas de Cálculo' },
];