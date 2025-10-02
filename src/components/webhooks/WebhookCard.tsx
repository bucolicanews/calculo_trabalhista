import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { WebhookConfig } from '@/hooks/useWebhookManagement';
import { availableTables } from '@/utils/webhookFields';
import { Label } from '@/components/ui/label';

interface WebhookCardProps {
  webhook: WebhookConfig;
  onEdit: (webhook: WebhookConfig) => void;
  onDelete: (id: string) => Promise<void>;
  getFieldLabel: (table: string, fieldKey: string) => string;
}

const WebhookCard: React.FC<WebhookCardProps> = ({ webhook, onEdit, onDelete, getFieldLabel }) => {
  const getTableLabel = (value: string) => {
    return availableTables.find(t => t.value === value)?.label || value;
  };

  return (
    <Card className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors">
      <CardHeader>
        <CardTitle className="text-xl text-orange-500">
          {webhook.title || `Webhook para ${getTableLabel(webhook.table_name)}`}
        </CardTitle>
        <p className="text-sm text-gray-400 truncate">Tabela: {getTableLabel(webhook.table_name)}</p>
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
            onClick={() => onEdit(webhook)}
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
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente a configuração do webhook "{webhook.title || getTableLabel(webhook.table_name)}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(webhook.id)} className="bg-red-600 hover:bg-red-700 text-white">
                  Deletar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookCard;