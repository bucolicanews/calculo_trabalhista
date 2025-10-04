import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { showError } from '@/utils/toast';
import { WebhookConfig } from '@/hooks/useWebhookManagement';
import { RefreshCw } from 'lucide-react';

interface DissidioWebhookSenderProps {
  dissidioId: string;
  pdfFile: File | null; // Pass the binary file if available
  pdfUrl: string | null; // Pass the URL if available
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (dissidioId: string, webhookConfigIds: string[], pdfFile: File | null, pdfUrl: string | null) => Promise<void>;
  isSending: boolean;
}

const DissidioWebhookSender: React.FC<DissidioWebhookSenderProps> = ({
  dissidioId,
  pdfFile,
  pdfUrl,
  isOpen,
  onOpenChange,
  onSend,
  isSending,
}) => {
  const { user } = useAuth();
  const [availableWebhooks, setAvailableWebhooks] = useState<WebhookConfig[]>([]);
  const [selectedWebhookIds, setSelectedWebhookIds] = useState<Set<string>>(new Set());
  const [loadingWebhooks, setLoadingWebhooks] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      fetchAvailableWebhooks();
    } else if (!isOpen) {
      setSelectedWebhookIds(new Set()); // Reset selection when dialog closes
    }
  }, [isOpen, user]);

  const fetchAvailableWebhooks = async () => {
    setLoadingWebhooks(true);
    const { data, error } = await supabase
      .from('tbl_webhook_configs')
      .select('*')
      .eq('user_id', user?.id)
      .or('table_name.eq.tbl_dissidios,table_name.eq.tbl_sindicatos,table_name.eq.all_tables'); // Modificado para incluir 'tbl_sindicatos'

    if (error) {
      showError('Erro ao carregar webhooks disponíveis: ' + error.message);
      console.error('Error fetching available webhooks:', error);
      setAvailableWebhooks([]);
    } else {
      console.log('Webhooks disponíveis para dissídios:', data); // Adicionado log aqui
      setAvailableWebhooks(data || []);
    }
    setLoadingWebhooks(false);
  };

  const handleCheckboxChange = (webhookId: string, checked: boolean) => {
    setSelectedWebhookIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(webhookId);
      } else {
        newSet.delete(webhookId);
      }
      return newSet;
    });
  };

  const handleConfirmSend = async () => {
    if (selectedWebhookIds.size === 0) {
      showError('Selecione pelo menos um webhook para enviar.');
      return;
    }
    await onSend(dissidioId, Array.from(selectedWebhookIds), pdfFile, pdfUrl);
    onOpenChange(false); // Close dialog after sending
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-orange-500 text-white">
        <DialogHeader>
          <DialogTitle className="text-orange-500">Enviar Dissídio para Webhook(s)</DialogTitle>
          <DialogDescription className="text-gray-300">
            Selecione os webhooks para os quais você deseja enviar os dados deste dissídio.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {loadingWebhooks ? (
            <p className="text-gray-400">Carregando webhooks...</p>
          ) : availableWebhooks.length === 0 ? (
            <p className="text-gray-400">Nenhum webhook configurado para dissídios. Crie um na página de Webhooks.</p>
          ) : (
            <div className="space-y-2">
              {availableWebhooks.map((webhook) => (
                <div key={webhook.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`webhook-${webhook.id}`}
                    checked={selectedWebhookIds.has(webhook.id)}
                    onCheckedChange={(checked: boolean) => handleCheckboxChange(webhook.id, checked)}
                    className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                  />
                  <Label htmlFor={`webhook-${webhook.id}`} className="text-gray-300 cursor-pointer">
                    {webhook.title || `Webhook para ${webhook.table_name}`}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="bg-gray-700 text-white hover:bg-gray-600"
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmSend}
            disabled={isSending || selectedWebhookIds.size === 0 || loadingWebhooks}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {isSending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Enviando...
              </>
            ) : (
              'Enviar Selecionados'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DissidioWebhookSender;