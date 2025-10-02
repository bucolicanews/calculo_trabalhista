import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { PlusCircle, Edit, Trash2, FileText, CalendarIcon, Upload, RefreshCw, FileSearch } from 'lucide-react'; // Adicionado FileSearch
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


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
  const [isExtractingText, setIsExtractingText] = useState(false);
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

  const triggerPdfTextExtraction = async (dissidioId: string, pdfUrl: string) => {
    setIsExtractingText(true);
    try {
      const extractResponse = await fetch(
        `https://oqiycpjayuzuyefkdujp.supabase.co/functions/v1/extract-pdf-text`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ dissidioId: dissidioId, pdfUrl: pdfUrl }),
        }
      );

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        showError('Erro ao extrair texto do PDF: ' + (errorData.error || 'Erro desconhecido'));
        console.error('PDF extraction failed:', errorData);
      } else {
        showSuccess('Extração de texto do PDF iniciada (simulada).');
        fetchDissidios(); // Refresh to show extracted text
      }
    } catch (extractError: any) {
      showError('Erro de rede ao iniciar extração de texto: ' + extractError.message);
      console.error('Network error during PDF extraction:', extractError);
    } finally {
      setIsExtractingText(false);
    }
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
    let shouldTriggerExtraction = false;

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
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('dissidios_documents')
        .getPublicUrl(fileName);
      
      fileUrl = publicUrlData.publicUrl;
      showSuccess('Documento enviado com sucesso!');
      shouldTriggerExtraction = true; // Trigger extraction if a new file was uploaded
    } else if (isEditingDissidio && currentDissidio.url_documento !== fileUrl) {
      // This case handles if the URL was manually changed without a new file upload
      shouldTriggerExtraction = true;
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
        .select('id')
        .single();
    } else {
      response = await supabase
        .from('tbl_dissidios')
        .insert(dissidioToSave)
        .select('id')
        .single();
    }

    if (response.error) {
      showError('Erro ao salvar dissídio: ' + response.error.message);
      console.error('Error saving dissídio:', response.error);
    } else {
      showSuccess(`Dissídio ${isEditingDissidio ? 'atualizado' : 'criado'} com sucesso!`);
      dissidioIdToUpdate = response.data.id;

      if (shouldTriggerExtraction && fileUrl && dissidioIdToUpdate) {
        await triggerPdfTextExtraction(dissidioIdToUpdate, fileUrl);
      }

      setIsDialogOpen(false);
      setCurrentDissidio(null);
      setSelectedFile(null);
      fetchDissidios();
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
                    <div className="flex items-center space-x-2 mt-2">
                      <a href={currentDissidio.url_documento} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center">
                        <FileText className="h-4 w-4 mr-1" /> Ver Atual
                      </a>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => currentDissidio.id && currentDissidio.url_documento && triggerPdfTextExtraction(currentDissidio.id, currentDissidio.url_documento)}
                        disabled={isExtractingText || loading}
                        className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                      >
                        {isExtractingText ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileSearch className="mr-2 h-4 w-4" />
                        )}
                        Extrair Texto
                      </Button>
                    </div>
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
                <Button type="submit" disabled={loading || isExtractingText} className="bg-orange-500 hover:bg-orange-600 text-white">
                  {loading || isExtractingText ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {isExtractingText ? 'Extraindo Texto...' : 'Salvando...'}
                    </>
                  ) : (isEditingDissidio ? 'Atualizar Dissídio' : 'Criar Dissídio')}
                </Button>
              </DialogFooter>
            </form>
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
    </div>
  );
};

export default DissidioManager;