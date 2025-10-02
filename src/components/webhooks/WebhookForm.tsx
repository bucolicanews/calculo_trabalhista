import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WebhookFieldSelector from './WebhookFieldSelector';
import { availableTables, FieldDefinition } from '@/utils/webhookFields';
import { WebhookFormState } from '@/hooks/useWebhookManagement';

interface WebhookFormProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  currentWebhook: WebhookFormState;
  isEditing: boolean;
  loading: boolean;
  fieldPopoverOpen: boolean;
  setFieldPopoverOpen: (open: boolean) => void;
  currentTableAvailableFields: FieldDefinition[];
  areAllFieldsSelected: boolean;
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
  areAllFieldsSelected,
  handleChange,
  handleTableChange,
  handleFieldToggle,
  handleToggleSelectAllFields,
  handleSubmit,
}) => {
  return (
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
            <WebhookFieldSelector
              selectedFields={currentWebhook.selected_fields}
              availableFields={currentTableAvailableFields}
              onFieldToggle={handleFieldToggle}
              onToggleSelectAll={handleToggleSelectAllFields}
              disabled={!currentWebhook.table_name || loading}
              fieldPopoverOpen={fieldPopoverOpen}
              setFieldPopoverOpen={setFieldPopoverOpen}
            />
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
  );
};

export default WebhookForm;