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
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- INTERFACE E ESTILOS (COPIADOS DO EXEMPLO) ---

interface SindicatoState {
  id?: string;
  nome: string;
  data_inicial: string; // Armazenará a data como DD/MM/AAAA
  data_final: string;   // Armazenará a data como DD/MM/AAAA
  mes_convencao: string;
  resumo_dissidio: string;
}

const inputClassNames = cn(
  "flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white",
  "focus-visible:outline-none focus-visible:ring-2 focus:ring-orange-500",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

// --- FUNÇÕES DE MÁSCARA E FORMATAÇÃO DE DATA ---

/**
 * Aplica a máscara DD/MM/AAAA a uma string conforme o usuário digita.
 */
const applyDateMask = (value: string): string => {
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.length > 8) {
    cleaned = cleaned.substring(0, 8);
  }
  let masked = '';
  for (let i = 0; i < cleaned.length; i++) {
    if (i === 2) masked += '/';
    if (i === 4) masked += '/';
    masked += cleaned[i];
  }
  return masked;
};

/**
 * Converte uma data do formato do Supabase (AAAA-MM-DD) para exibição (DD/MM/AAAA).
 */
const formatDateForDisplay = (isoDate: string | null): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Converte uma data do formato de exibição (DD/MM/AAAA) para o formato do Supabase (AAAA-MM-DD).
 */
const formatDateForSupabase = (displayDate: string): string | null => {
  if (!displayDate || displayDate.length !== 10) return null;
  const [day, month, year] = displayDate.split('/');
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
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
      navigate('/sindicatos');
    } else if (data) {
      // **CORREÇÃO:** Converte as datas do formato do DB para o formato de exibição antes de popular o estado.
      setSindicato({
        ...data,
        data_inicial: formatDateForDisplay(data.data_inicial),
        data_final: formatDateForDisplay(data.data_final),
        mes_convencao: data.mes_convencao || '',
        resumo_dissidio: data.resumo_dissidio || '',
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // **CORREÇÃO:** Aplica a máscara se o campo for de data.
    if (name === 'data_inicial' || name === 'data_final') {
      const maskedValue = applyDateMask(value);
      setSindicato((prev) => ({ ...prev, [name]: maskedValue }));
    } else {
      setSindicato((prev) => ({ ...prev, [name]: value }));
    }
  };

  // A função handleDateChange foi removida pois não é mais necessária.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // **CORREÇÃO:** Converte as datas do formato de exibição de volta para o formato do DB antes de salvar.
    const sindicatoToSave = {
      ...sindicato,
      data_inicial: formatDateForSupabase(sindicato.data_inicial),
      data_final: formatDateForSupabase(sindicato.data_final),
    };

    const response = isEditing
      ? await supabase.from('tbl_sindicatos').update(sindicatoToSave).eq('id', id)
      : await supabase.from('tbl_sindicatos').insert(sindicatoToSave);

    if (response.error) {
      showError('Erro ao salvar sindicato: ' + response.error.message);
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
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 flex-grow text-center">
            {isEditing ? 'Editar Sindicato' : 'Novo Sindicato'}
          </h1>
          <div className="w-full sm:w-24 h-0 sm:h-auto"></div>
        </div>
        <Card className="max-w-2xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Dados do Sindicato</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="nome" className="text-gray-300">Nome do Sindicato</Label>
                <Input id="nome" name="nome" value={sindicato.nome} onChange={handleChange} required className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>

              {/* --- Data Inicial (Input com Máscara) --- */}
              <div>
                <Label htmlFor="data_inicial" className="text-gray-300">Data Inicial do Acordo</Label>
                <input
                  id="data_inicial"
                  name="data_inicial"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={sindicato.data_inicial}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={10}
                  className={inputClassNames}
                />
              </div>

              {/* --- Data Final (Input com Máscara) --- */}
              <div>
                <Label htmlFor="data_final" className="text-gray-300">Data Final do Acordo</Label>
                <input
                  id="data_final"
                  name="data_final"
                  type="text"
                  placeholder="DD/MM/AAAA"
                  value={sindicato.data_final}
                  onChange={handleChange}
                  disabled={loading}
                  maxLength={10}
                  className={inputClassNames}
                />
              </div>

              <div>
                <Label htmlFor="mes_convencao" className="text-gray-300">Mês da Convenção</Label>
                <Input id="mes_convencao" name="mes_convencao" value={sindicato.mes_convencao || ''} onChange={handleChange} placeholder="Ex: Janeiro ou 01/2024" className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>

              <div>
                <Label htmlFor="resumo_dissidio" className="text-gray-300">Resumo do Dissídio</Label>
                <Textarea id="resumo_dissidio" name="resumo_dissidio" value={sindicato.resumo_dissidio} onChange={handleChange} rows={5} placeholder="Insira o resumo do dissídio aqui..." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
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