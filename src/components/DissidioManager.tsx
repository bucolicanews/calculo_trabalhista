import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { PlusCircle, Edit, Trash2, FileText, CalendarIcon, Upload, RefreshCw, Send } from 'lucide-react'; // Adicionado Send
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import DissidioWebhookSender from './dissidios/DissidioWebhookSender'; // Caminho corrigido para relativo

interface Dissidio {
  id: string;
  sindicato_id: string;
  nome_dissidio: string;
  url_documento: string | null;
  resumo_dissidio: string | null;
  data_vigencia_inicial: string | null;
  data_vigencia_final: string | null;
  mes_convencao: string | null;
  texto_extraido: string | null;
  resumo_ai: string | null;
  created_at: string;
}

interface DissidioManagerProps {
  sindicatoId: string;
}

const DissidioManager: React.FC<DissidioManagerProps> = ({ sindicatoId }) => {
  const [dissidios, setDissidios] = useState<Dissidio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDissidio, setCurrentDissidio] = useState<Partial<Dissidio> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false); // Estado para o envio de webhook
  const [isDissidioWebhookSenderOpen, setIsDissidioWebhookSenderOpen] = useState(false); // Estado para o modal de seleção de webhook
  const [currentDissidioForWebhook, setCurrentDissidioForWebhook] = useState<Dissidio | null>(null); // Dissídio a ser enviado
  const isEditingDissidio = !!currentDissidio?.id;

  useEffect(() => {
    if (sindicatoId) {
      fetchDissidios();
    }
  }, [sindicatoId]);

  const fetchDissidios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_dissidios')
      .select('*')
      .eq('sindicato_id', sindicatoId)
      .order('data_vigencia_inicial', { ascending: false });

    if (error) {
      showError('Erro ao carregar dissídios: ' + error.message);
      console.error('Error fetching dissídios:', error);
    } else {
      setDissidios(data || []);
    }
    setLoading(false);
  };

  const handleAddDissidioClick = () => {
    setCurrentDissidio({ sindicato_id: sindicatoId });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleEditDissidioClick = (dissidio: Dissidio) => {
    setCurrentDissidio(dissidio);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleDissidioFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentDissidio((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleDissidioDateChange = (name: string, date: Date | undefined) => {
    setCurrentDissidio((prev) => ({
      ...prev,
      [name]: date ? format(date, 'yyyy-MM-dd') : '',
    }));
  };

  const handleSaveDissidio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDissidio?.nome_dissidio) {
      showError('O nome do dissídio é obrigatório.');
      return;
    }

    setLoading(true);
    let fileUrl: string | null = currentDissidio.url_documento || null;
    let dissidioIdToUpdate = currentDissidio.id;

    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop();
      const sanitizedName = currentDissidio.nome_dissidio.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const fileName = `${sindicatoId}/${sanitizedName}_${Date.now()}.${fileExtension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('dissidios_documents')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        showError('Erro ao fazer upload do documento: ' + uploadError.message);
        console.error('Error uploading document:', uploadError);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('dissidios_documents')
        .getPublicUrl(fileName);
      
      fileUrl = publicUrlData.publicUrl;
      showSuccess('Documento enviado para o armazenamento!');
    }

    const dissidioToSave = {
      ...currentDissidio,
      url_documento: fileUrl,
    };

    let response;
    if (isEditingDissidio) {
      response = await supabase
        .from('tbl_dissidios')
        .update(dissidioToSave)
        .eq('id', currentDissidio.id)
        .select('*') // Select all to get updated data for webhook sender
        .single();
    } else {
      response = await supabase
        .from('tbl_dissidios')
        .insert(dissidioToSave)
        .select('*') // Select all to get newly created data for webhook sender
        .single();
    }

    if (response.error) {
      showError('Erro ao salvar dissídio: ' + response.error.message);
      console.error('Error saving dissídio:', response.error);
    } else {
      showSuccess(`Dissídio ${isEditingDissidio ? 'atualizado' : 'criado'} com sucesso!`);
      setCurrentDissidio(response.data); // Update currentDissidio with fresh data
      setSelectedFile(null); // Clear selected file after successful save/upload
      fetchDissidios(); // Refresh the list
    }
    setLoading(false);
  };

  const handleDeleteDissidio = async (dissidioId: string) => {
    setLoading(true);
    const { error } = await supabase
      .from('tbl_dissidios')
      .delete()
      .eq('id', dissidioId);

    if (error) {
      showError('Erro ao deletar dissídio: ' + error.message);
      console.error('Error deleting dissídio:', error);
    } else {
      showSuccess('Dissídio deletado com sucesso!');
      fetchDissidios();
    }
    setLoading(false);
  };

  const handleOpenWebhookSelection = (dissidio: Dissidio) => {
    setCurrentDissidioForWebhook(dissidio);
    setIsDissidioWebhookSenderOpen(true);
  };

  const handleSendDissidioToWebhook = async (
    dissidioId: string,
    webhookConfigIds: string[],
    pdfFile: File | null,
    pdfUrl: string | null
  ) => {
    setIsSendingWebhook(true);
    showSuccess('Iniciando envio para webhooks selecionados...');

    try {
      const { data: dissidioData, error: fetchError } = await supabase
        .from('tbl_dissidios')
        .select('*') // Fetch all fields for the payload
        .eq('id', dissidioId)
        .single();

      if (fetchError || !dissidioData) {
        showError('Erro ao buscar dados do dissídio para webhook: ' + (fetchError?.message || 'Dados não encontrados.'));
        setIsSendingWebhook(false);
        return;
      }

      const { data: webhookConfigs, error: webhookError } = await supabase
        .from('tbl_webhook_configs')
        .select('*')
        .in('id', webhookConfigIds);

      if (webhookError) {
        showError('Erro ao buscar configurações de webhook: ' + webhookError.message);
        console.error('Error fetching webhook configs:', webhookError);
        setIsSendingWebhook(false);
        return;
      }

      if (!webhookConfigs || webhookConfigs.length === 0) {
        showError('Nenhum webhook selecionado ou configurado encontrado.');
        setIsSendingWebhook(false);
        return;
      }

      let sentCount = 0;
      for (const config of webhookConfigs) {
        const payload: { [key: string]: any } = {};
        
        // Populate payload with selected fields from dissidioData
        config.selected_fields.forEach(fieldKey => {
          // For dissidios, the fields are direct or nested under tbl_dissidios
          // We need to map fieldKey (e.g., 'dissidio_nome_dissidio') to actual column name (e.g., 'nome_dissidio')
          // Or handle nested paths if 'all_tables' is selected and it's a complex path
          const actualColumnName = fieldKey.replace('dissidio_', ''); // Simple mapping for direct fields
          if (dissidioData.hasOwnProperty(actualColumnName)) {
            payload[fieldKey] = dissidioData[actualColumnName];
          } else {
            // Fallback for more complex paths or if fieldKey doesn't match directly
            // This part would need more sophisticated logic if 'all_tables' fields are selected
            // and they refer to related tables for dissidios. For now, focusing on direct fields.
            payload[fieldKey] = dissidioData[fieldKey]; // Try direct access
          }
        });

        // Always include dissidio ID and URL for n8n processing
        payload.dissidio_id = dissidioData.id;
        payload.sindicato_id = dissidioData.sindicato_id;
        payload.url_documento = pdfUrl || dissidioData.url_documento; // Use new URL if available, else existing

        let requestBody: FormData | string;
        let headers: HeadersInit = {};

        if (pdfFile) {
          // If a new binary file is selected, send it as FormData
          const formData = new FormData();
          formData.append('pdfFile', pdfFile);
          Object.keys(payload).forEach(key => {
            formData.append(key, payload[key]);
          });
          requestBody = formData;
          // Content-Type will be set automatically by fetch for FormData
        } else {
          // If no new binary file, send as JSON
          requestBody = JSON.stringify(payload);
          headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(config.webhook_url, {
          method: 'POST',
          headers: headers,
          body: requestBody,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erro ao enviar para webhook ${config.webhook_url}:`, response.status, response.statusText, errorText);
          showError(`Falha ao enviar para o webhook: ${config.webhook_url}. Status: ${response.status}`);
        } else {
          sentCount++;
          console.log(`Dissídio enviado com sucesso para webhook: ${config.webhook_url}`);
        }
      }

      if (sentCount > 0) {
        showSuccess(`Dissídio enviado para ${sentCount} webhook(s) com sucesso!`);
      } else {
        showError('Nenhum dissídio foi enviado para os webhooks selecionados.');
      }

    } catch (error: any) {
      showError('Erro inesperado ao enviar dissídio para webhook: ' + error.message);
      console.error('Unexpected error sending webhook:', error);
    } finally {
      setIsSendingWebhook(false);
      fetchDissidios(); // Refresh list in case n8n updated something
    }
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-orange-500">Dissídios Associados</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddDissidioClick} className="bg-orange-500 hover:bg-orange-600 text-white">
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Dissídio
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-orange-500 text-white sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-orange-500">{isEditingDissidio ? 'Editar Dissídio' : 'Novo Dissídio'}</DialogTitle>
              <DialogDescription className="text-gray-400">
                Preencha os detalhes do dissídio. Clique em salvar quando terminar.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveDissidio} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nome_dissidio" className="text-right text-gray-300">Nome</Label>
                <Input
                  id="nome_dissidio"
                  name="nome_dissidio"
                  value={currentDissidio?.nome_dissidio || ''}
                  onChange={handleDissidioFormChange}
                  className="col-span-3 bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="document_upload" className="text-right text-gray-300">Documento PDF</Label>
                <div className="col-span-3 flex flex-col items-center space-y-2">
                  <div className="relative w-full">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedFile ? "Arquivo Selecionado" : "Selecionar PDF"}
                    </Button>
                    <Input
                      id="document_upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  {selectedFile && (
                    <span className="text-sm text-gray-400">{selectedFile.name}</span>
                  )}
                  {!selectedFile && currentDissidio?.url_documento && (
                    <a href={currentDissidio.url_documento} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center">
                      <FileText className="h-4 w-4 mr-1" /> Ver Atual
                    </a>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resumo_dissidio" className="text-right text-gray-300">Resumo Manual</Label>
                <Textarea
                  id="resumo_dissidio"
                  name="resumo_dissidio"
                  value={currentDissidio?.resumo_dissidio || ''}
                  onChange={handleDissidioFormChange}
                  rows={3}
                  className="col-span-3 bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              {currentDissidio?.texto_extraido && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right text-gray-300">Texto Extraído do PDF</Label>
                  <Textarea
                    value={currentDissidio.texto_extraido}
                    readOnly
                    rows={5}
                    className="col-span-3 bg-gray-800 border-gray-700 text-gray-400 resize-none"
                  />
                </div>
              )}
              {currentDissidio?.resumo_ai && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right text-gray-300">Resumo IA</Label>
                  <Textarea
                    value={currentDissidio.resumo_ai}
                    readOnly
                    rows={5}
                    className="col-span-3 bg-gray-800 border-gray-700 text-gray-400 resize-none"
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data_vigencia_inicial" className="text-right text-gray-300">Início Vigência</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                        !currentDissidio?.data_vigencia_inicial && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentDissidio?.data_vigencia_inicial ? format(new Date(currentDissidio.data_vigencia_inicial), 'PPP') : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-500 text-white">
                    <Calendar
                      mode="single"
                      selected={currentDissidio?.data_vigencia_inicial ? new Date(currentDissidio.data_vigencia_inicial) : undefined}
                      onSelect={(date) => handleDissidioDateChange('data_vigencia_inicial', date)}
                      initialFocus
                      className="bg-gray-900 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data_vigencia_final" className="text-right text-gray-300">Fim Vigência</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "col-span-3 justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                        !currentDissidio?.data_vigencia_final && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentDissidio?.data_vigencia_final ? format(new Date(currentDissidio.data_vigencia_final), 'PPP') : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-500 text-white">
                    <Calendar
                      mode="single"
                      selected={currentDissidio?.data_vigencia_final ? new Date(currentDissidio.data_vigencia_final) : undefined}
                      onSelect={(date) => handleDissidioDateChange('data_vigencia_final', date)}
                      initialFocus
                      className="bg-gray-900 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mes_convencao" className="text-right text-gray-300">Mês Convenção</Label>
                <Input
                  id="mes_convencao"
                  name="mes_convencao"
                  value={currentDissidio?.mes_convencao || ''}
                  onChange={handleDissidioFormChange}
                  className="col-span-3 bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  placeholder="Ex: Janeiro ou 01/2024"
                />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost" className="bg-gray-700 text-white hover:bg-gray-600">Cancelar</Button>
                </DialogClose>
                <Button type="submit" disabled={loading || isSendingWebhook} className="bg-orange-500 hover:bg-orange-600 text-white">
                  {loading ? 'Salvando...' : (isEditingDissidio ? 'Atualizar Dissídio' : 'Criar Dissídio')}
                </Button>
              </DialogFooter>
            </form>
            {currentDissidio?.id && (currentDissidio.url_documento || selectedFile) && (
              <div className="mt-4 pt-4 border-t border-gray-700 flex justify-end">
                <Button
                  onClick={() => handleOpenWebhookSelection(currentDissidio as Dissidio)}
                  disabled={isSendingWebhook || loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSendingWebhook ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Processar com Webhook
                    </>
                  )}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando dissídios...</p>
      ) : dissidios.length === 0 ? (
        <p className="text-gray-400">Nenhum dissídio associado a este sindicato ainda.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {dissidios.map((dissidio) => (
            <Card key={dissidio.id} className="bg-gray-800 border-gray-700 text-white">
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex-grow">
                  <h4 className="font-semibold text-orange-400">{dissidio.nome_dissidio}</h4>
                  {dissidio.resumo_ai ? (
                    <p className="text-sm text-gray-300 line-clamp-1">Resumo IA: {dissidio.resumo_ai}</p>
                  ) : dissidio.resumo_dissidio ? (
                    <p className="text-sm text-gray-300 line-clamp-1">Resumo Manual: {dissidio.resumo_dissidio}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum resumo disponível.</p>
                  )}
                  <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                    {dissidio.data_vigencia_inicial && dissidio.data_vigencia_final && (
                      <p>Vigência: {format(new Date(dissidio.data_vigencia_inicial), 'dd/MM/yyyy')} a {format(new Date(dissidio.data_vigencia_final), 'dd/MM/yyyy')}</p>
                    )}
                    {dissidio.mes_convencao && <p>Mês Convenção: {dissidio.mes_convencao}</p>}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  {dissidio.url_documento && (
                    <a href={dissidio.url_documento} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white">
                        <FileText className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  <Button onClick={() => handleEditDissidioClick(dissidio)} variant="outline" size="icon" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-red-600 text-white">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-500">Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Esta ação não pode ser desfeita. Isso excluirá permanentemente o dissídio "{dissidio.nome_dissidio}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteDissidio(dissidio.id)} className="bg-red-600 hover:bg-red-700 text-white">
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

      {currentDissidioForWebhook && (
        <DissidioWebhookSender
          dissidioId={currentDissidioForWebhook.id}
          pdfFile={selectedFile} // Pass the currently selected file
          pdfUrl={currentDissidioForWebhook.url_documento} // Pass the saved URL
          isOpen={isDissidioWebhookSenderOpen}
          onOpenChange={setIsDissidioWebhookSenderOpen}
          onSend={handleSendDissidioToWebhook}
          isSending={isSendingWebhook}
        />
      )}
    </div>
  );
};

export default DissidioManager;