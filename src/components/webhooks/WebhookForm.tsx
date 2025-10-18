import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WebhookFormState } from '@/hooks/useWebhookManagement';
import { availableTables } from '@/utils/webhookFields';
import WebhookFieldSelector from './WebhookFieldSelector';
import { RefreshCw } from 'lucide-react';

interface WebhookFormProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  currentWebhook: WebhookFormState;
  isEditing: boolean;
  loading: boolean;
  fieldPopoverOpen: boolean;
  setFieldPopoverOpen: (open: boolean) => void;
  currentTableAvailableFields: any[];
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTableChange: (value: string) => void;
  handleFieldToggle: (fieldKey: string) => void;
  handleToggleSelectAllFields: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

const WebhookForm: React.FC<WebhookFormProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  currentWebhook,
  isEditing,
  loading,
  fieldPopoverOpen,
  setFieldPopoverOpen,
  currentTableAvailableFields,
  handleChange,
  handleTableChange,
  handleFieldToggle,
  handleToggleSelectAllFields,
  handleSubmit,
}) => {

  const handleValeTransporteChange = (value: string) => {
    // Simula o evento de mudança para que o hook useWebhookManagement possa processar
    handleChange({
      target: {
        name: 'vale_transporte',
        value: value === 'true', // Converte string 'true'/'false' para boolean
      },
    } as any); // Usando 'as any' para flexibilidade de tipo
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-orange-500 text-white">
        <DialogHeader>
          <DialogTitle className="text-orange-500">{isEditing ? 'Editar Webhook' : 'Novo Webhook'}</DialogTitle>
          <DialogDescription className="text-gray-300">
            Configure o endpoint e os dados que serão enviados quando um evento ocorrer.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="title" className="text-gray-300">Título (Opcional)</Label>
            <Input
              id="title"
              name="title"
              value={currentWebhook.title}
              onChange={handleChange}
              className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="webhook_url" className="text-gray-300">URL do Webhook</Label>
            <Input
              id="webhook_url"
              name="webhook_url"
              value={currentWebhook.webhook_url}
              onChange={handleChange}
              required
              className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="table_name" className="text-gray-300">Tabela de Origem</Label>
            <Select
              name="table_name"
              value={currentWebhook.table_name}
              onValueChange={handleTableChange}
              required
              disabled={loading}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-orange-500">
                <SelectValue placeholder="Selecione a tabela de origem" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {availableTables.map((table) => (
                  <SelectItem key={table.value} value={table.value} className="hover:bg-gray-700 focus:bg-gray-700">
                    {table.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Campos */}
          {currentWebhook.table_name && (
            <div className="space-y-2">
              <Label className="text-gray-300 block">Campos a Enviar</Label>
              <WebhookFieldSelector
                selectedFields={currentWebhook.selected_fields}
                availableFields={currentTableAvailableFields}
                onFieldToggle={handleFieldToggle}
                onToggleSelectAll={handleToggleSelectAllFields}
                disabled={loading}
                fieldPopoverOpen={fieldPopoverOpen}
                setFieldPopoverOpen={setFieldPopoverOpen}
              />
              <p className="text-xs text-gray-500">Selecione quais campos da tabela serão incluídos no payload do webhook.</p>
            </div>
          )}

          {/* Exemplo de campo booleano (para resolver o erro TS2339) */}
          {/* Este campo é apenas um placeholder para demonstrar a correção do erro de tipagem no Select */}
          {currentWebhook.table_name === 'tbl_calculos' && (
            <div>
              <Label htmlFor="vale_transporte" className="text-gray-300">Exemplo: Vale Transporte (Apenas para teste de tipo)</Label>
              <Select
                value={String(currentWebhook.vale_transporte)}
                onValueChange={handleValeTransporteChange}
                disabled={loading}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-orange-500">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDialogOpen(false)}
              className="bg-gray-700 text-white hover:bg-gray-600"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                isEditing ? 'Atualizar Webhook' : 'Criar Webhook'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookForm;