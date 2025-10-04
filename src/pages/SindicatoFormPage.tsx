import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SindicatoState {
  id?: string;
  nome: string;
  data_inicial: string;
  data_final: string;
  mes_convencao: string;
  resumo_dissidio: string;
}

const SindicatoFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sindicato, setSindicato] = useState<SindicatoState>({
    nome: '',
    data_inicial: '',
    data_final: '',
    mes_convencao: '',
    resumo_dissidio: '',
  });
  const [loading, setLoading] = useState(false);
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
        resumo_dissidio: data.resumo_dissidio || '',
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSindicato((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setSindicato((prev) => ({
      ...prev,
      [name]: date ? format(date, 'yyyy-MM-dd') : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const sindicatoToSave = {
      ...sindicato,
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
                      {sindicato.data_inicial ? format(new Date(sindicato.data_inicial), 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="dark w-auto p-0 bg-background border-border">
                    <Calendar
                      mode="single"
                      selected={sindicato.data_inicial ? new Date(sindicato.data_inicial) : undefined}
                      onSelect={(date) => handleDateChange('data_inicial', date)}
                      initialFocus
                      locale={ptBR}
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
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
                      {sindicato.data_final ? format(new Date(sindicato.data_final), 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="dark w-auto p-0 bg-background border-border">
                    <Calendar
                      mode="single"
                      selected={sindicato.data_final ? new Date(sindicato.data_final) : undefined}
                      onSelect={(date) => handleDateChange('data_final', date)}
                      initialFocus
                      locale={ptBR}
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear()}
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

              {/* Resumo do Dissídio */}
              <div>
                <Label htmlFor="resumo_dissidio" className="text-gray-300">Resumo do Dissídio</Label>
                <Textarea
                  id="resumo_dissidio"
                  name="resumo_dissidio"
                  value={sindicato.resumo_dissidio}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  placeholder="Insira o resumo do dissídio aqui..."
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-gray-800 hover:bg-gray-700 text-white">
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar Sindicato' : 'Criar Sindicato')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SindicatoFormPage;