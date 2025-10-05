import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showError, showSuccess } from '@/utils/toast';
import { PlusCircle, Trash2, Save, Loader2 } from 'lucide-react';

interface WebhookConfig {
  id?: string;
  event_type: string;
  url: string;
  headers: string; // JSON string
  is_active: boolean;
  user_id?: string;
}

const WebhookConfigPage: React.FC = () => {
  const { user } = useAuth();
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      showError('Erro ao carregar webhooks: ' + error.message);
      console.error('Error fetching webhooks:', error);
    } else {
      setWebhooks(data || []);
    }
    setLoading(false);
  };

  const handleAddWebhook = () => {
    setWebhooks([...webhooks, { event_type: '', url: '', headers: '{}', is_active: true }]);
  };

  const handleChange = (index: number, field: keyof WebhookConfig, value: string | boolean) => {
    const newWebhooks = [...webhooks];
    // Ensure headers is always a valid JSON string
    if (field === 'headers' && typeof value === 'string') {
      try {
        JSON.parse(value); // Test if it's valid JSON
        newWebhooks[index] = { ...newWebhooks[index], [field]: value };
      } catch (e) {
        // If not valid JSON, don't update, or show an error
        console.error("Invalid JSON for headers:", value);
        showError("Formato JSON inválido para os cabeçalhos.");
        return;
      }
    } else {
      newWebhooks[index] = { ...newWebhooks[index], [field]: value };
    }
    setWebhooks(newWebhooks);
  };

  const handleDeleteWebhook = async (index: number) => {
    if (!user) return;

    const webhookToDelete = webhooks[index];
    if (webhookToDelete.id) {
      setSaving(true);
      const { error } = await supabase
        .from('tbl_webhook_configs')
        .delete()
        .eq('id', webhookToDelete.id)
        .eq('user_id', user.id);

      if (error) {
        showError('Erro ao deletar webhook: ' + error.message);
        console.error('Error deleting webhook:', error);
      } else {
        showSuccess('Webhook deletado com sucesso!');
        setWebhooks(webhooks.filter((_, i) => i !== index));
      }
      setSaving(false);
    } else {
      // If it's a new webhook not yet saved to DB, just remove from state
      setWebhooks(webhooks.filter((_, i) => i !== index));
      showSuccess('Webhook removido da lista.');
    }
  };

  const handleSaveWebhook = async (index: number) => {
    if (!user) return;

    setSaving(true);
    const webhookToSave = { ...webhooks[index], user_id: user.id };

    let response;
    if (webhookToSave.id) {
      response = await supabase
        .from('tbl_webhook_configs')
        .update(webhookToSave)
        .eq('id', webhookToSave.id)
        .eq('user_id', user.id);
    } else {
      response = await supabase
        .from('tbl_webhook_configs')
        .insert(webhookToSave)
        .select(); // Select the inserted data to get the new ID
    }

    if (response.error) {
      showError('Erro ao salvar webhook: ' + response.error.message);
      console.error('Error saving webhook:', response.error);
    } else {
      showSuccess('Webhook salvo com sucesso!');
      if (response.data && !webhookToSave.id) {
        // Update the state with the new ID for newly created webhooks
        const newWebhooks = [...webhooks];
        newWebhooks[index] = response.data[0];
        setWebhooks(newWebhooks);
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando configurações de webhooks...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">Configuração de Webhooks</h1>

        <Button onClick={handleAddWebhook} className="mb-6 bg-orange-500 hover:bg-orange-600 text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo Webhook
        </Button>

        <div className="space-y-8">
          {webhooks.length === 0 && (
            <p className="text-center text-gray-400">Nenhum webhook configurado ainda. Adicione um para começar!</p>
          )}
          {webhooks.map((webhook, index) => (
            <Card key={webhook.id || `new-${index}`} className="bg-gray-900 border-orange-500 text-white">
              <CardHeader>
                <CardTitle className="text-xl text-orange-500">Webhook #{index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`event_type-${index}`} className="text-gray-300">Tipo de Evento</Label>
                  <Select
                    value={webhook.event_type}
                    onValueChange={(value) => handleChange(index, 'event_type', value)}
                    disabled={saving}
                  >
                    <SelectTrigger id={`event_type-${index}`} className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"> {/* Corrigido para text-white */}
                      <SelectValue placeholder="Selecione um tipo de evento" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem value="calculation_completed">Cálculo Concluído</SelectItem>
                      <SelectItem value="user_registered">Usuário Registrado</SelectItem>
                      {/* Adicione outros tipos de evento conforme necessário */}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`url-${index}`} className="text-gray-300">URL do Webhook</Label>
                  <Input
                    id={`url-${index}`}
                    name="url"
                    type="url"
                    value={webhook.url}
                    onChange={(e) => handleChange(index, 'url', e.target.value)}
                    required
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor={`headers-${index}`} className="text-gray-300">Cabeçalhos (JSON)</Label>
                  <Textarea
                    id={`headers-${index}`}
                    name="headers"
                    value={webhook.headers}
                    onChange={(e) => handleChange(index, 'headers', e.target.value)}
                    rows={4}
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500 font-mono"
                    placeholder='Ex: {"Content-Type": "application/json", "Authorization": "Bearer your_token"}'
                    disabled={saving}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`is_active-${index}`}
                    checked={webhook.is_active}
                    onChange={(e) => handleChange(index, 'is_active', e.target.checked)}
                    className="form-checkbox h-5 w-5 text-orange-500 bg-gray-700 border-gray-600 rounded focus:ring-orange-500"
                    disabled={saving}
                  />
                  <Label htmlFor={`is_active-${index}`} className="text-gray-300">Ativo</Label>
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteWebhook(index)}
                    disabled={saving}
                    className="text-red-500 border-red-500 hover:bg-red-900 hover:text-white"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Deletar
                  </Button>
                  <Button
                    onClick={() => handleSaveWebhook(index)}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default WebhookConfigPage;