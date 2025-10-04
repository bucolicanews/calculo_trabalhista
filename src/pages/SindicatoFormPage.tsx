import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft, CalendarIcon } from 'lucide-react'; // Removido FileText e Upload
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import DissidioManager from '@/components/DissidioManager';

interface SindicatoState {
  id?: string;
  nome: string;
  data_inicial: string;
  data_final: string;
  mes_convencao: string;
  // url_documento_sindicato: string | null; // Removido
}

const SindicatoFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sindicato, setSindicato] = useState<SindicatoState>({
    nome: '',
    data_inicial: '',
    data_final: '',
    mes_convencao: '',
    // url_documento_sindicato: null, // Removido
  });
  const [loading, setLoading] = useState(false);
  // const [selectedFile, setSelectedFile] = useState<File | null>(null); // Removido
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchSindicato();
    }
  }, [id, isEditing]);

  const fetchSindicato = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_sindicatos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar sindicato: ' + error.message);
      console.error('Error fetching sindicato:', error);
      navigate('/sindicatos');
    } else if (data) {
      setSindicato({
        ...data,
        data_inicial: data.data_inicial || '',
        data_final: data.data_final || '',
        mes_convencao: data.mes_convencao || '',
        // url_documento_sindicato: data.url_documento_sindicato || null, // Removido
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSindicato((prev) => ({ ...prev, [name]: value }));
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Removido
  //   if (e.target.files && e.target.files.length > 0) {
  //     setSelectedFile(e.target.files[0]);
  //   } else {
  //     setSelectedFile(null);
  //   }
  // };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setSindicato((prev) => ({
      ...prev,
      [name]: date ? format(date, 'yyyy-MM-dd') : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // let documentUrl: string | null = sindicato.url_documento_sindicato; // Removido

    // if (selectedFile) { // Removido
    //   const fileExtension = selectedFile.name.split('.').pop();
    //   const sanitizedName = sindicato.nome.replace(/[^a-zA-Z0-9_.-]/g, '_');
    //   const fileName = `sindicatos/${sanitizedName}_${Date.now()}.${fileExtension}`;

    //   const { data: uploadData, error: uploadError } = await supabase.storage
    //     .from('sindicatos_documents')
    //     .upload(fileName, selectedFile, {
    //       cacheControl: '3600',
    //       upsert: false,
    //     });

    //   if (uploadError) {
    //     showError('Erro ao fazer upload do documento do sindicato: ' + uploadError.message);
    //     setLoading(false);
    //     return;
    //   }

    //   const { data: publicUrlData } = supabase.storage
    //     .from('sindicatos_documents')
    //     .getPublicUrl(fileName);
      
    //   documentUrl = publicUrlData.publicUrl;
    //   showSuccess('Documento do sindicato enviado com sucesso!');
    // }

    const sindicatoToSave = {
      ...sindicato,
      // url_documento_sindicato: documentUrl, // Removido
    };

    let response;
    if (isEditing) {
      response = await supabase
        .from('tbl_sindicatos')
        .update(sindicatoToSave)
        .eq('id', id);
    } else {
      response = await supabase
        .from('tbl_sindicatos')
        .insert(sindicatoToSave);
    }

    if (response.error) {
      showError('Erro ao salvar sindicato: ' + response.error.message);
      console.error('Error saving sindicato:', response.error);
    } else {
      showSuccess(`Sindicato ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/sindicatos');
    }
    setLoading(false);
  };

  if (loading && isEditing) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando sindicato...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => navigate('/sindicatos')} className="text-orange-500 hover:text-orange-600">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-4xl font-bold text-orange-500 flex-grow text-center">
            {isEditing ? 'Editar Cadastro de Sindicato' : 'Novo Cadastro de Sindicato'}
          </h1>
          <div className="w-24"></div> {/* Placeholder for alignment */}
        </div>
        <Card className="max-w-2xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Dados do Sindicato</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="nome" className="text-gray-300">Nome do Sindicato</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={sindicato.nome}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>

              {/* Data Inicial */}
              <div>
                <Label htmlFor="data_inicial" className="text-gray-300">Data Inicial do Acordo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                        !sindicato.data_inicial && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sindicato.data_inicial ? format(new Date(sindicato.data_inicial), 'PPP') : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-500 text-white">
                    <Calendar
                      mode="single"
                      selected={sindicato.data_inicial ? new Date(sindicato.data_inicial) : undefined}
                      onSelect={(date) => handleDateChange('data_inicial', date)}
                      initialFocus
                      className="bg-gray-900 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data Final */}
              <div>
                <Label htmlFor="data_final" className="text-gray-300">Data Final do Acordo</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                        !sindicato.data_final && "text-gray-500"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sindicato.data_final ? format(new Date(sindicato.data_final), 'PPP') : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-500 text-white">
                    <Calendar
                      mode="single"
                      selected={sindicato.data_final ? new Date(sindicato.data_final) : undefined}
                      onSelect={(date) => handleDateChange('data_final', date)}
                      initialFocus
                      className="bg-gray-900 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Mês da Convenção */}
              <div>
                <Label htmlFor="mes_convencao" className="text-gray-300">Mês da Convenção (Ex: Janeiro, 01/2024)</Label>
                <Input
                  id="mes_convencao"
                  name="mes_convencao"
                  value={sindicato.mes_convencao || ''}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  placeholder="Ex: Janeiro ou 01/2024"
                />
              </div>

              {/* Upload de Documento do Sindicato - REMOVIDO */}
              {/* <div>
                <Label htmlFor="sindicato_document_upload" className="text-gray-300 block mb-2">Documento do Sindicato (PDF)</Label>
                <div className="flex flex-col items-center space-y-2">
                  <div className="relative w-full max-w-xs">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700 flex items-center justify-center"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {selectedFile ? "Arquivo Selecionado" : "Selecionar PDF"}
                    </Button>
                    <Input
                      id="sindicato_document_upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  {selectedFile && (
                    <span className="text-sm text-gray-400">{selectedFile.name}</span>
                  )}
                  {!selectedFile && sindicato.url_documento_sindicato && (
                    <a href={sindicato.url_documento_sindicato} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center">
                      <FileText className="h-4 w-4 mr-1" /> Ver Atual
                    </a>
                  )}
                </div>
              </div> */}

              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar Sindicato' : 'Criar Sindicato')}
              </Button>
            </form>

            {isEditing && sindicato.id && (
              <DissidioManager sindicatoId={sindicato.id} />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SindicatoFormPage;