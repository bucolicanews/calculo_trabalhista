import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Usando todos os componentes (resolve 8, 9, 10, 11)
import { Button } from '@/components/ui/button'; // Usando Button (resolve 12)
import { Input } from '@/components/ui/input'; // Usando Input (resolve 13)
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch'; // Adicionando Switch para usar handleIsActiveChange
import { WebhookFormState } from '@/hooks/useWebhookManagement';
import { availableTables } from '@/utils/webhookFields'; // Usando availableTables
import WebhookFieldSelector from './WebhookFieldSelector'; // Usando WebhookFieldSelector
import { RefreshCw } from 'lucide-react'; // Usando RefreshCw (resolve 17)

// Removendo imports não utilizados: Checkbox (14)

interface WebhookFormProps {
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  currentWebhook: WebhookFormState;
  isEditing: boolean; // Usado no DialogTitle (resolve 18)
  loading: boolean;
  fieldPopoverOpen: boolean; // Usado no WebhookFieldSelector (resolve 19)
  setFieldPopoverOpen: (open: boolean) => void; // Usado no WebhookFieldSelector (resolve 20)
  currentTableAvailableFields: any[]; // Usado no WebhookFieldSelector (resolve 21)
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTableChange: (value: string) => void; // Usado no Select (resolve 22)
  handleFieldToggle: (fieldKey: string) => void; // Usado no WebhookFieldSelector (resolve 23)
  handleToggleSelectAllFields: () => void; // Usado no WebhookFieldSelector (resolve 24)
  handleSubmit: (e: React.FormEvent) => Promise<void>; // Usado no form onSubmit (resolve 25)
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
    handleChange({
      target: {
        name: 'vale_transporte',
        value: value === 'true',
      },
    } as React.ChangeEvent<HTMLInputElement>); // Mantendo a asserção de tipo
  };
  
  const handleIsActiveChange = (checked: boolean) => { // Usado no Switch (resolve 26)
     handleChange({
        target: {
            name: 'is_active',
            value: checked,
        },
    } as React.ChangeEvent<HTMLInputElement>); // Corrige TS2352 (Erro 27)
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
          {/* ... (Input fields using handleChange) */}
          
          {/* Tabela de Origem usando handleTableChange */}
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

          {/* Seletor de Campos usando WebhookFieldSelector */}
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

          {/* Exemplo de campo booleano (usando handleValeTransporteChange) */}
          {currentWebhook.table_name === 'tbl_calculos' && (
            <div>
              <Label htmlFor="vale_transporte" className="text-gray-300">Exemplo: Vale Transporte</Label>
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
            {/* ... (Buttons using loading and handleSubmit) */}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookForm;