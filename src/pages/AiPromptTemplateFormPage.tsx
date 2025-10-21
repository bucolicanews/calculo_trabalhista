import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Label } from '@/components/ui/label';

// Initial State based on the full schema
const initialTemplateState = {
  title: '',
  identificacao: '',
  comportamento: '',
  restricoes: '',
  atribuicoes: '',
  leis: '',
  observacoes_base_legal: '',
  estrutura_json_modelo_saida: '',
  instrucoes_entrada_dados_rescisao: '',
};

type AiPromptTemplate = typeof initialTemplateState;

const AiPromptTemplateFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const [template, setTemplate] = useState<AiPromptTemplate>(initialTemplateState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isEditing && id) {
      fetchTemplate();
    } else {
      setLoading(false);
    }
  }, [id, isEditing]);

  const fetchTemplate = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }

    const { data, error } = await supabase
      .from('tbl_ai_prompt_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id) // Filtro de segurança
      .single();

    if (error) {
      showError('Erro ao carregar modelo: ' + error.message);
      console.error('Error fetching template:', error);
      navigate('/ai-templates');
    } else {
      setTemplate({
        ...initialTemplateState,
        ...data,
        // Ensure string fields are not null
        estrutura_json_modelo_saida: data.estrutura_json_modelo_saida || '',
        instrucoes_entrada_dados_rescisao: data.instrucoes_entrada_dados_rescisao || '',
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTemplate(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return showError('Usuário não autenticado.');

    if (!template.title || !template.identificacao) {
      return showError('Título e Identificação são obrigatórios.');
    }

    setLoading(true);

    const templateData = {
      ...template,
      user_id: user.id,
      // Convert empty strings to null for optional DB fields
      estrutura_json_modelo_saida: template.estrutura_json_modelo_saida || null,
      instrucoes_entrada_dados_rescisao: template.instrucoes_entrada_dados_rescisao || null,
    };

    let response;
    if (isEditing) {
      response = await supabase.from('tbl_ai_prompt_templates').update(templateData).eq('id', id).select();
    } else {
      response = await supabase.from('tbl_ai_prompt_templates').insert(templateData).select();
    }

    if (response.error) {
      showError('Erro ao salvar modelo: ' + response.error.message);
      console.error('Error saving template:', response.error);
    } else {
      showSuccess(`Modelo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/ai-templates');
    }
    setLoading(false);
  };

  if (loading) {
    return <MainLayout><div className="container text-center py-8 text-gray-400"><Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" /> Carregando...</div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="container w-full py-8">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">
          {isEditing ? 'Editar Modelo IA' : 'Novo Modelo de Prompt IA'}
        </h1>
        <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Configuração do Agente</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* --- 1. IDENTIFICAÇÃO --- */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-300">Título do Modelo</Label>
                <Input id="title" name="title" value={template.title} onChange={handleChange} required className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identificacao" className="text-gray-300">Identificação (Quem é a IA?)</Label>
                <Textarea id="identificacao" name="identificacao" value={template.identificacao} onChange={handleChange} rows={3} required placeholder="Ex: Você é um Especialista Sênior em Cálculo Trabalhista e Tributário (CLT)." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>

              {/* --- 2. COMPORTAMENTO E RESTRIÇÕES --- */}
              <div className="space-y-2">
                <Label htmlFor="comportamento" className="text-gray-300">Comportamento (Como deve agir?)</Label>
                <Textarea id="comportamento" name="comportamento" value={template.comportamento} onChange={handleChange} rows={5} placeholder="Ex: Seja rigoroso com a CLT. Preencha TODOS os campos do JSON. Use a maior base de cálculo possível." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restricoes" className="text-gray-300">Restrições (O que NÃO deve fazer?)</Label>
                <Textarea id="restricoes" name="restricoes" value={template.restricoes} onChange={handleChange} rows={3} placeholder="Ex: Não invente verbas. Não use valores monetários no campo 'Memoria_de_Calculo'." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>

              {/* --- 3. ATRIBUIÇÕES E LEIS --- */}
              <div className="space-y-2">
                <Label htmlFor="atribuicoes" className="text-gray-300">Atribuições (O que deve calcular/fazer?)</Label>
                <Textarea id="atribuicoes" name="atribuicoes" value={template.atribuicoes} onChange={handleChange} rows={5} placeholder="Ex: Calcular Saldo de Salário, Férias Vencidas e Proporcionais, 13º Salário, Multas de FGTS e INSS." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leis" className="text-gray-300">Leis e Súmulas (Base Legal)</Label>
                <Textarea id="leis" name="leis" value={template.leis} onChange={handleChange} rows={3} placeholder="Ex: CLT, Súmulas 264 e 347 do TST, Lei 8.036/90 (FGTS)." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>

              {/* --- 4. ESTRUTURA E INSTRUÇÕES --- */}
              <div className="space-y-2">
                <Label htmlFor="estrutura_json_modelo_saida" className="text-gray-300">Estrutura JSON Modelo Saída (Opcional)</Label>
                <Textarea id="estrutura_json_modelo_saida" name="estrutura_json_modelo_saida" value={template.estrutura_json_modelo_saida} onChange={handleChange} rows={8} placeholder="Cole aqui o JSON de saída esperado (para modelos que exigem JSON estrito)." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500 font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instrucoes_entrada_dados_rescisao" className="text-gray-300">Instruções de Entrada de Dados (Opcional)</Label>
                <Textarea id="instrucoes_entrada_dados_rescisao" name="instrucoes_entrada_dados_rescisao" value={template.instrucoes_entrada_dados_rescisao} onChange={handleChange} rows={5} placeholder="Instruções sobre como a IA deve interpretar os dados de entrada do cálculo." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isEditing ? 'Atualizar Modelo' : 'Criar Modelo')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AiPromptTemplateFormPage;