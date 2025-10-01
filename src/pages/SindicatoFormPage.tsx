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

const SindicatoFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [sindicato, setSindicato] = useState({
    nome: '',
    anexo_dissidio_url: '',
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
      setSindicato(data);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSindicato((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let response;
    if (isEditing) {
      response = await supabase
        .from('tbl_sindicatos')
        .update(sindicato)
        .eq('id', id);
    } else {
      response = await supabase
        .from('tbl_sindicatos')
        .insert(sindicato);
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
            {isEditing ? 'Editar Sindicato' : 'Novo Sindicato'}
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
              <div>
                <Label htmlFor="anexo_dissidio_url" className="text-gray-300">URL do Anexo Dissídio (Opcional)</Label>
                <Input
                  id="anexo_dissidio_url"
                  name="anexo_dissidio_url"
                  value={sindicato.anexo_dissidio_url || ''}
                  onChange={handleChange}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              <div>
                <Label htmlFor="resumo_dissidio" className="text-gray-300">Resumo do Dissídio (Opcional)</Label>
                <Textarea
                  id="resumo_dissidio"
                  name="resumo_dissidio"
                  value={sindicato.resumo_dissidio || ''}
                  onChange={handleChange}
                  rows={4}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
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