import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { showError, showSuccess } from '@/utils/toast';
import { FieldDefinition, getFieldsForMainTable } from '@/utils/webhookFields';

export interface WebhookConfig {
  id: string;
  user_id: string;
  table_name: string;
  selected_fields: string[];
  webhook_url: string;
  created_at: string;
}

export interface WebhookFormState {
  id?: string;
  table_name: string;
  selected_fields: string[];
  webhook_url: string;
}

export const useWebhookManagement = () => {
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

  const currentTableAvailableFields: FieldDefinition[] = currentWebhook.table_name
    ? getFieldsForMainTable(currentWebhook.table_name)
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

  const getFieldLabel = (table: string, fieldKey: string) => {
    const fieldDef = getFieldsForMainTable(table).find(f => f.key === fieldKey);
    return fieldDef?.label || fieldKey;
  };

  return {
    webhooks,
    loading,
    isDialogOpen,
    setIsDialogOpen,
    currentWebhook,
    isEditing,
    fieldPopoverOpen,
    setFieldPopoverOpen,
    currentTableAvailableFields,
    areAllFieldsSelected,
    handleNewWebhook,
    handleEditWebhook,
    handleChange,
    handleTableChange,
    handleFieldToggle,
    handleToggleSelectAllFields,
    handleSubmit,
    handleDeleteWebhook,
    getFieldLabel,
  };
};