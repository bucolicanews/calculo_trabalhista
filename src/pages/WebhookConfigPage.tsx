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

const tableFields: Record<string, string[]> = {
  tbl_clientes: ['id', 'user_id', 'nome', 'cpf', 'cnpj', 'tipo_empregador', 'responsavel', 'cpf_responsavel', 'created_at'],
  tbl_calculos: [
    'id', 'cliente_id', 'sindicato_id', 'nome_funcionario', 'cpf_funcionario', 'funcao_funcionario',
    'inicio_contrato', 'fim_contrato', 'tipo_aviso', 'salario_sindicato', 'obs_sindicato', 'historia',
    'ctps_assinada', 'media_descontos', 'media_remuneracoes', 'carga_horaria', 'created_at'
  ],
  tbl_sindicatos: ['id', 'nome', 'data_inicial', 'data_final', 'mes_convencao', 'created_at'],
  tbl_resposta_calculo: ['id', 'calculo_id', 'resposta_ai', 'data_hora', 'created_at'],
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

  const handleFieldToggle = (field: string) => {
    setCurrentWebhook((prev) => {
      const newFields = prev.selected_fields.includes(field)
        ? prev.selected_fields.filter((f) => f !== field)
        : [...prev.selected_fields, field];
      return { ...prev, selected_fields: newFields };
    });
  };

  const currentTableAvailableFields = currentWebhook.table_name
    ? tableFields[currentWebhook.table_name] || []
    : [];

  const areAllFieldsSelected = currentTableAvailableFields.length > 0 &&
    currentWebhook.selected_fields.length === currentTableAvailableFields.length;

  const handleToggleSelectAllFields = () => {
    if (areAllFieldsSelected) {
      setCurrentWebhook((prev) => ({ ...prev, selected_fields: [] }));
    } else {
      setCurrentWebhook((prev) => ({ ...prev, selected_fields: currentTableAvailableFields }));
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
                        webhook.selected_fields.map((field) => (
                          <Badge key={field} variant="secondary" className="bg-gray-700 text-gray-200">
                            {field}
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
                            key={field}
                            onSelect={() => handleFieldToggle(field)}
                            className="flex items-center justify-between cursor-pointer hover:bg-gray-700 text-white"
                          >
                            {field}
                            <Check
                              className={cn(
                                "ml-auto h-4 w-4",
                                currentWebhook.selected_fields.includes(field) ? "opacity-100 text-orange-500" : "opacity-0"
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