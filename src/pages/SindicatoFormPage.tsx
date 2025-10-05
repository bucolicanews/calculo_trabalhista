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

// Objeto de classes para estilizar o calendário. Copiado de ContractDatesSection.
const calendarClassNames = {
  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
  month: "space-y-4",
  caption: "flex justify-center pt-1 relative items-center",
  caption_label: "text-sm font-medium text-orange-400",
  caption_dropdowns: "flex gap-2 [&_.rdp-vhidden]:hidden", // Esconde o label visualmente oculto que pode atrapalhar o layout
  nav: "space-x-1 flex items-center",
  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  table: "w-full border-collapse space-y-1",
  head_row: "flex",
  head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
  row: "flex w-full mt-2",
  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-orange-600/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-gray-200",
  day_selected: "bg-orange-600 text-white hover:bg-orange-700 focus:bg-orange-600 focus:text-white rounded-md",
  day_today: "bg-gray-700 text-gray-100 rounded-md",
  day_outside: "text-gray-500 opacity-50",
  day_disabled: "text-gray-600 opacity-50",
  day_range_middle: "aria-selected:bg-orange-600/30 aria-selected:text-white",
  day_hidden: "invisible",
  // Classes para os dropdowns de Mês e Ano
  dropdown_month: "[&>div]:bg-gray-800 [&>div]:border-orange-700 [&>div]:text-white",
  dropdown_year: "[&>div]:bg-gray-800 [&>div]:border-orange-700 [&>div]:text-white",
};

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/sindicatos')} className="text-orange-500 hover:text-orange-600 mb-4 sm:mb-0 sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 flex-grow text-center sm:text-center">
            {isEditing ? 'Editar Cadastro de Sindicato' : 'Novo Cadastro de Sindicato'}
          </h1>
          <div className="w-full sm:w-24 h-0 sm:h-auto"></div> {/* Placeholder for alignment */}
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
                        "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700 focus:ring-2 focus:ring-orange-500",
                        !sindicato.data_inicial && "text-gray-400"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sindicato.data_inicial ? format(new Date(sindicato.data_inicial), 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-700">
                    <Calendar
                      mode="single"
                      selected={sindicato.data_inicial ? new Date(sindicato.data_inicial) : undefined}
                      onSelect={(date) => handleDateChange('data_inicial', date)}
                      initialFocus
                      locale={ptBR}
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear() + 5}
                      classNames={calendarClassNames}
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
                        "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700 focus:ring-2 focus:ring-orange-500",
                        !sindicato.data_final && "text-gray-400"
                      )}
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sindicato.data_final ? format(new Date(sindicato.data_final), 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-700">
                    <Calendar
                      mode="single"
                      selected={sindicato.data_final ? new Date(sindicato.data_final) : undefined}
                      onSelect={(date) => handleDateChange('data_final', date)}
                      initialFocus
                      locale={ptBR}
                      captionLayout="dropdown-buttons"
                      fromYear={1950}
                      toYear={new Date().getFullYear() + 5}
                      classNames={calendarClassNames}
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