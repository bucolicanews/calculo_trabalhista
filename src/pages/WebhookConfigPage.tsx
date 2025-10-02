import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface WebhookConfig {
  id: string;
  user_id: string;
  table_name: string;
  selected_fields: string[];
  webhook_url: string;
  created_at: string;
}

interface WebhookFormState {
  id?: string;
  table_name: string;
  selected_fields: string[];
  webhook_url: string;
}

// Hardcoded tables and their fields for selection
const availableTables = [
  { value: 'tbl_clientes', label: 'Clientes' },
  { value: 'tbl_calculos', label: 'Cálculos' },
  { value: 'tbl_sindicatos', label: 'Sindicatos' },
  { value: 'tbl_resposta_calculo', label: 'Respostas de Cálculo' },
];

// Define all available fields, including related ones
const allAvailableFields: Record<string, Array<{ key: string; label: string; supabasePath: string; isRelation: boolean; relationTable?: string; relationField?: string }>> = {
  tbl_clientes: [
    { key: 'id', label: 'ID', supabasePath: 'id', isRelation: false },
    { key: 'user_id', label: 'ID do Usuário', supabasePath: 'user_id', isRelation: false },
    { key: 'nome', label: 'Nome/Razão Social', supabasePath: 'nome', isRelation: false },
    { key: 'cpf', label: 'CPF', supabasePath: 'cpf', isRelation: false },
    { key: 'cnpj', label: 'CNPJ', supabasePath: 'cnpj', isRelation: false },
    { key: 'tipo_empregador', label: 'Tipo de Empregador', supabasePath: 'tipo_empregador', isRelation: false },
    { key: 'responsavel', label: 'Responsável', supabasePath: 'responsavel', isRelation: false },
    { key: 'cpf_responsavel', label: 'CPF do Responsável', supabasePath: 'cpf_responsavel', isRelation: false },
    { key: 'created_at', label: 'Criado Em', supabasePath: 'created_at', isRelation: false },
  ],
  tbl_calculos: [
    // Fields directly from tbl_calculos
    { key: 'id', label: 'ID do Cálculo', supabasePath: 'id', isRelation: false },
    { key: 'nome_funcionario', label: 'Nome do Funcionário', supabasePath: 'nome_funcionario', isRelation: false },
    { key: 'cpf_funcionario', label: 'CPF do Funcionário', supabasePath: 'cpf_funcionario', isRelation: false },
    { key: 'funcao_funcionario', label: 'Função do Funcionário', supabasePath: 'funcao_funcionario', isRelation: false },
    { key: 'inicio_contrato', label: 'Início do Contrato', supabasePath: 'inicio_contrato', isRelation: false },
    { key: 'fim_contrato', label: 'Fim do Contrato', supabasePath: 'fim_contrato', isRelation: false },
    { key: 'tipo_aviso', label: 'Tipo de Aviso', supabasePath: 'tipo_aviso', isRelation: false },
    { key: 'salario_sindicato', label: 'Piso Salarial Sindicato', supabasePath: 'salario_sindicato', isRelation: false },
    { key: 'obs_sindicato', label: 'Obs. Sindicato', supabasePath: 'obs_sindicato', isRelation: false },
    { key: 'historia', label: 'História do Contrato', supabasePath: 'historia', isRelation: false },
    { key: 'ctps_assinada', label: 'CTPS Assinada', supabasePath: 'ctps_assinada', isRelation: false },
    { key: 'media_descontos', label: 'Média Descontos', supabasePath: 'media_descontos', isRelation: false },
    { key: 'media_remuneracoes', label: 'Média Remunerações', supabasePath: 'media_remuneracoes', isRelation: false },
    { key: 'carga_horaria', label: 'Carga Horária', supabasePath: 'carga_horaria', isRelation: false },
    { key: 'created_at', label: 'Cálculo (Criado Em)', supabasePath: 'created_at', isRelation: false },

    // Fields from tbl_clientes (related via cliente_id)
    { key: 'cliente_id', label: 'Cliente (ID)', supabasePath: 'cliente_id', isRelation: false },
    { key: 'cliente_nome', label: 'Cliente (Nome/Razão Social)', supabasePath: 'tbl_clientes(nome)', isRelation: true, relationTable: 'tbl_clientes', relationField: 'nome' },
    { key: 'cliente_cpf', label: 'Cliente (CPF)', supabasePath: 'tbl_clientes(cpf)', isRelation: true, relationTable: 'tbl_clientes', relationField: 'cpf' },
    { key: 'cliente_cnpj', label: 'Cliente (CNPJ)', supabasePath: 'tbl_clientes(cnpj)', isRelation: true, relationTable: 'tbl_clientes', relationField: 'cnpj' },
    { key: 'cliente_tipo_empregador', label: 'Cliente (Tipo Empregador)', supabasePath: 'tbl_clientes(tipo_empregador)', isRelation: true, relationTable: 'tbl_clientes', relationField: 'tipo_empregador' },
    { key: 'cliente_responsavel', label: 'Cliente (Responsável)', supabasePath: 'tbl_clientes(responsavel)', isRelation: true, relationTable: 'tbl_clientes', relationField: 'responsavel' },
    { key: 'cliente_cpf_responsavel', label: 'Cliente (CPF Responsável)', supabasePath: 'tbl_clientes(cpf_responsavel)', isRelation: true, relationTable: 'tbl_clientes', relationField: 'cpf_responsavel' },
    { key: 'cliente_created_at', label: 'Cliente (Criado Em)', supabasePath: 'tbl_clientes(created_at)', isRelation: true, relationTable: 'tbl_clientes', relationField: 'created_at' },

    // Fields from tbl_sindicatos (related via sindicato_id)
    { key: 'sindicato_id', label: 'Sindicato (ID)', supabasePath: 'sindicato_id', isRelation: false },
    { key: 'sindicato_nome', label: 'Sindicato (Nome)', supabasePath: 'tbl_sindicatos(nome)', isRelation: true, relationTable: 'tbl_sindicatos', relationField: 'nome' },
    { key: 'sindicato_data_inicial', label: 'Sindicato (Data Inicial)', supabasePath: 'tbl_sindicatos(data_inicial)', isRelation: true, relationTable: 'tbl_sindicatos', relationField: 'data_inicial' },
    { key: 'sindicato_data_final', label: 'Sindicato (Data Final)', supabasePath: 'tbl_sindicatos(data_final)', isRelation: true, relationTable: 'tbl_sindicatos', relationField: 'data_final' },
    { key: 'sindicato_mes_convencao', label: 'Sindicato (Mês Convenção)', supabasePath: 'tbl_sindicatos(mes_convencao)', isRelation: true, relationTable: 'tbl_sindicatos', relationField: 'mes_convencao' },
    { key: 'sindicato_url_documento', label: 'Sindicato (URL Documento)', supabasePath: 'tbl_sindicatos(url_documento_sindicato)', isRelation: true, relationTable: 'tbl_sindicatos', relationField: 'url_documento_sindicato' },
    { key: 'sindicato_created_at', label: 'Sindicato (Criado Em)', supabasePath: 'tbl_sindicatos(created_at)', isRelation: true, relationTable: 'tbl_sindicatos', relationField: 'created_at' },
  ],
  tbl_sindicatos: [
    { key: 'id', label: 'ID do Sindicato', supabasePath: 'id', isRelation: false },
    { key: 'nome', label: 'Nome do Sindicato', supabasePath: 'nome', isRelation: false },
    { key: 'data_inicial', label: 'Data Inicial do Acordo', supabasePath: 'data_inicial', isRelation: false },
    { key: 'data_final', label: 'Data Final do Acordo', supabasePath: 'data_final', isRelation: false },
    { key: 'mes_convencao', label: 'Mês da Convenção', supabasePath: 'mes_convencao', isRelation: false },
    { key: 'url_documento_sindicato', label: 'URL Documento Sindicato', supabasePath: 'url_documento_sindicato', isRelation: false },
    { key: 'created_at', label: 'Sindicato (Criado Em)', supabasePath: 'created_at', isRelation: false },

    // Fields from tbl_dissidios (related via sindicato_id)
    { key: 'dissidio_id', label: 'Dissídio (ID)', supabasePath: 'tbl_dissidios(id)', isRelation: true, relationTable: 'tbl_dissidios', relationField: 'id' },
    { key: 'dissidio_nome_dissidio', label: 'Dissídio (Nome)', supabasePath: 'tbl_dissidios(nome_dissidio)', isRelation: true, relationTable: 'tbl_dissidios', relationField: 'nome_dissidio' },
    { key: 'dissidio_url_documento', label: 'Dissídio (URL Documento)', supabasePath: 'tbl_dissidios(url_documento)', isRelation: true, relationTable: 'tbl_dissidios', relationField: 'url_documento' },
    { key: 'dissidio_resumo_dissidio', label: 'Dissídio (Resumo)', supabasePath: 'tbl_dissidios(resumo_dissidio)', isRelation: true, relationTable: 'tbl_dissidios', relationField: 'resumo_dissidio' },
    { key: 'dissidio_data_vigencia_inicial', label: 'Dissídio (Início Vigência)', supabasePath: 'tbl_dissidios(data_vigencia_inicial)', isRelation: true, relationTable: 'tbl_dissidios', relationField: 'data_vigencia_inicial' },
    { key: 'dissidio_data_vigencia_final', label: 'Dissídio (Fim Vigência)', supabasePath: 'tbl_dissidios(data_vigencia_final)', isRelation: true, relationTable: 'tbl_dissidios', relationField: 'data_vigencia_final' },
    { key: 'dissidio_mes_convencao', label: 'Dissídio (Mês Convenção)', supabasePath: 'tbl_dissidios(mes_convencao)', isRelation: true, relationTable: 'tbl_dissidios', relationField: 'mes_convencao' },
    { key: 'dissidio_created_at', label: 'Dissídio (Criado Em)', supabasePath: 'tbl_dissidios(created_at)', isRelation: true, relationTable: 'tbl_dissidios', relationField: 'created_at' },
  ],
  tbl_resposta_calculo: [
    { key: 'id', label: 'ID', supabasePath: 'id', isRelation: false },
    { key: 'calculo_id', label: 'ID do Cálculo', supabasePath: 'calculo_id', isRelation: false },
    { key: 'calculo_nome_funcionario', label: 'Cálculo (Nome Funcionário)', supabasePath: 'tbl_calculos(nome_funcionario)', isRelation: true, relationTable: 'tbl_calculos', relationField: 'nome_funcionario' },
    { key: 'resposta_ai', label: 'Resposta AI', supabasePath: 'resposta_ai', isRelation: false },
    { key: 'data_hora', label: 'Data/Hora', supabasePath: 'data_hora', isRelation: false },
    { key: 'created_at', label: 'Criado Em', supabasePath: 'created_at', isRelation: false },
  ],
};

const WebhookConfigPage = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentWebhook, setCurrentWebhook] = useState<WebhookFormState>({
    table_name: '',
    selected_fields: [],
    webhook_url: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [fieldPopoverOpen, setFieldPopoverOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWebhooks();
    }
  }, [user]);

  const fetchWebhooks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_webhook_configs')
      .select('*')
      .eq('user_id', user?.id);

    if (error) {
      showError('Erro ao carregar configurações de webhook: ' + error.message);
      console.error('Error fetching webhooks:', error);
    } else {
      setWebhooks(data || []);
    }
    setLoading(false);
  };

  const handleNewWebhook = () => {
    setIsEditing(false);
    setCurrentWebhook({ table_name: '', selected_fields: [], webhook_url: '' });
    setIsDialogOpen(true);
  };

  const handleEditWebhook = (webhook: WebhookConfig) => {
    setIsEditing(true);
    setCurrentWebhook({
      id: webhook.id,
      table_name: webhook.table_name,
      selected_fields: webhook.selected_fields,
      webhook_url: webhook.webhook_url,
    });
    setIsDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentWebhook((prev) => ({ ...prev, [name]: value }));
  };

  const handleTableChange = (value: string) => {
    setCurrentWebhook((prev) => ({
      ...prev,
      table_name: value,
      selected_fields: [], // Reset fields when table changes
    }));
  };

  const handleFieldToggle = (fieldKey: string) => {
    setCurrentWebhook((prev) => {
      const newFields = prev.selected_fields.includes(fieldKey)
        ? prev.selected_fields.filter((f) => f !== fieldKey)
        : [...prev.selected_fields, fieldKey];
      return { ...prev, selected_fields: newFields };
    });
  };

  const currentTableAvailableFields = currentWebhook.table_name
    ? allAvailableFields[currentWebhook.table_name] || []
    : [];

  const areAllFieldsSelected = currentTableAvailableFields.length > 0 &&
    currentWebhook.selected_fields.length === currentTableAvailableFields.length;

  const handleToggleSelectAllFields = () => {
    if (areAllFieldsSelected) {
      setCurrentWebhook((prev) => ({ ...prev, selected_fields: [] }));
    } else {
      setCurrentWebhook((prev) => ({ ...prev, selected_fields: currentTableAvailableFields.map(f => f.key) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }

    setLoading(true);
    const payload = {
      user_id: user.id,
      table_name: currentWebhook.table_name,
      selected_fields: currentWebhook.selected_fields,
      webhook_url: currentWebhook.webhook_url,
    };

    let response;
    if (isEditing && currentWebhook.id) {
      response = await supabase
        .from('tbl_webhook_configs')
        .update(payload)
        .eq('id', currentWebhook.id);
    } else {
      response = await supabase
        .from('tbl_webhook_configs')
        .insert(payload);
    }

    if (response.error) {
      showError('Erro ao salvar webhook: ' + response.error.message);
      console.error('Error saving webhook:', response.error);
    } else {
      showSuccess(`Webhook ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      setIsDialogOpen(false);
      fetchWebhooks();
    }
    setLoading(false);
  };

  const handleDeleteWebhook = async (id: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('tbl_webhook_configs')
      .delete()
      .eq('id', id);

    if (error) {
      showError('Erro ao deletar webhook: ' + error.message);
      console.error('Error deleting webhook:', error);
    } else {
      showSuccess('Webhook deletado com sucesso!');
      fetchWebhooks();
    }
    setLoading(false);
  };

  const getTableLabel = (value: string) => {
    return availableTables.find(t => t.value === value)?.label || value;
  };

  // Helper to get the field label for display in badges
  const getFieldLabel = (table: string, fieldKey: string) => {
    return allAvailableFields[table]?.find(f => f.key === fieldKey)?.label || fieldKey;
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Configurações de Webhook</h1>
          <Button onClick={handleNewWebhook} className="bg-orange-500 hover:bg-orange-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Webhook
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando configurações...</p>
        ) : webhooks.length === 0 ? (
          <p className="text-gray-400">Nenhuma configuração de webhook cadastrada ainda. Crie uma nova para começar!</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-500">
                    Webhook para {getTableLabel(webhook.table_name)}
                  </CardTitle>
                  <p className="text-sm text-gray-400 truncate">URL: {webhook.webhook_url}</p>
                </CardHeader>
                <CardContent className="flex flex-col space-y-3">
                  <div>
                    <Label className="text-gray-300">Campos Selecionados:</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {webhook.selected_fields.length > 0 ? (
                        webhook.selected_fields.map((fieldKey) => (
                          <Badge key={fieldKey} variant="secondary" className="bg-gray-700 text-gray-200">
                            {getFieldLabel(webhook.table_name, fieldKey)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">Nenhum campo selecionado</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                      onClick={() => handleEditWebhook(webhook)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-900 border-red-600 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-500">Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente a configuração do webhook para "{getTableLabel(webhook.table_name)}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteWebhook(webhook.id)} className="bg-red-600 hover:bg-red-700 text-white">
                            Deletar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] bg-gray-900 border-orange-500 text-white">
            <DialogHeader>
              <DialogTitle className="text-orange-500">{isEditing ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
              <DialogDescription className="text-gray-300">
                Configure qual tabela e quais campos você deseja enviar para um endpoint de webhook.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="table_name" className="text-right text-gray-300">Tabela</Label>
                <Select
                  value={currentWebhook.table_name}
                  onValueChange={handleTableChange}
                  disabled={loading}
                >
                  <SelectTrigger className="col-span-3 bg-gray-800 border-gray-700 text-white focus:border-orange-500">
                    <SelectValue placeholder="Selecione a tabela" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-orange-500 text-white">
                    {availableTables.map((table) => (
                      <SelectItem key={table.value} value={table.value}>
                        {table.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="selected_fields" className="text-right text-gray-300">Campos</Label>
                <Popover open={fieldPopoverOpen} onOpenChange={setFieldPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={fieldPopoverOpen}
                      className="col-span-3 justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                      disabled={!currentWebhook.table_name || loading}
                    >
                      {currentWebhook.selected_fields.length > 0
                        ? `${currentWebhook.selected_fields.length} campo(s) selecionado(s)`
                        : "Selecione os campos..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0 bg-gray-800 border-orange-500 text-white">
                    <Command className="bg-gray-800">
                      <CommandInput placeholder="Buscar campo..." className="bg-gray-700 border-gray-600 text-white" />
                      <CommandEmpty className="text-white p-2">Nenhum campo encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-60 overflow-y-auto">
                        {currentWebhook.table_name && currentTableAvailableFields.length > 0 && (
                          <CommandItem
                            onSelect={handleToggleSelectAllFields}
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-700 text-orange-400 font-semibold"
                          >
                            {areAllFieldsSelected ? 'Limpar Seleção' : 'Selecionar Todos'}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                areAllFieldsSelected ? "opacity-100 text-orange-500" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        )}
                        {currentTableAvailableFields.map((field) => (
                          <CommandItem
                            key={field.key}
                            onSelect={() => handleFieldToggle(field.key)}
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-700 text-white"
                          >
                            {field.label}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                currentWebhook.selected_fields.includes(field.key) ? "opacity-100 text-orange-500" : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="webhook_url" className="text-right text-gray-300">URL do Webhook</Label>
                <Input
                  id="webhook_url"
                  name="webhook_url"
                  value={currentWebhook.webhook_url}
                  onChange={handleChange}
                  required
                  className="col-span-3 bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
                  {loading ? 'Salvando...' : (isEditing ? 'Atualizar Webhook' : 'Criar Webhook')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default WebhookConfigPage;