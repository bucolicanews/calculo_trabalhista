import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft, Brain, Info } from 'lucide-react'; // Importei o ícone Info

interface AiPromptTemplateState {
  id?: string;
  title: string;
  identificacao: string;
  comportamento: string;
  restricoes: string;
  atribuicoes: string;
  leis: string;
  proventos: string;
  descontos: string;
  observacoes_base_legal: string;
  estrutura_json_modelo_saida: string;
  instrucoes_entrada_dados_rescisao: string;
}

const AiPromptTemplateFormPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<AiPromptTemplateState>({
    title: '',
    identificacao: '',
    comportamento: '',
    restricoes: '',
    atribuicoes: '',
    leis: '',
    proventos: '',
    descontos: '',
    observacoes_base_legal: '',
    estrutura_json_modelo_saida: '',
    instrucoes_entrada_dados_rescisao: '',
  });
  const [loading, setLoading] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing && user) {
      fetchTemplate();
    }
  }, [id, isEditing, user]);

  const fetchTemplate = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_ai_prompt_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (error) {
      showError('Erro ao carregar modelo de prompt: ' + error.message);
      console.error('Error fetching AI prompt template:', error);
      navigate('/ai-templates');
    } else if (data) {
      setTemplate(data);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  // Função para limpar os campos
  const handleClearFields = () => {
    setTemplate({
      title: "",
      identificacao: "",
      comportamento: "",
      restricoes: "",
      atribuicoes: "",
      leis: "",
      proventos: "",
      descontos: "",
      observacoes_base_legal: "",
      estrutura_json_modelo_saida: "",
      instrucoes_entrada_dados_rescisao: "",
    });
    showSuccess('Campos limpos.');
  };

  // **NOVO: Função para abrir a página de informações padrão em uma nova aba**
  const handleOpenInfoPage = () => {
    // Arquivos na pasta `public` são acessíveis pela raiz do site.
    // Garanta que o caminho é `public/info/index.html` no seu projeto.
    navigate('/info')
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }
    setLoading(true);

    const templateData = {
      ...template,
      user_id: user.id,
    };

    let response;
    if (isEditing) {
      response = await supabase
        .from('tbl_ai_prompt_templates')
        .update(templateData)
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      response = await supabase
        .from('tbl_ai_prompt_templates')
        .insert(templateData);
    }

    if (response.error) {
      showError('Erro ao salvar modelo de prompt: ' + response.error.message);
      console.error('Error saving AI prompt template:', response.error);
    } else {
      showSuccess(`Modelo de prompt ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/ai-templates');
    }
    setLoading(false);
  };

  if (loading && isEditing) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando modelo de prompt...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-auto px-1 sm:px-1 lg:px-3 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/ai-templates')} className="text-orange-500 hover:text-orange-600 mb-4 sm:mb-0 sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 flex-grow text-center sm:text-center">
            {isEditing ? 'Editar Modelo de Prompt da IA' : 'Configurações de Prompt da IA'}
          </h1>
          <div className="w-full sm:w-24 h-0 sm:h-auto"></div> {/* Placeholder for alignment */}
        </div>
        <Card className="w-full sm:max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Configuração</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isEditing && (
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* **BOTÃO DE LIMPAR** */}
                  <Button
                    type="button"
                    onClick={handleClearFields}
                    disabled={loading}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    <Brain className="mr-2 h-4 w-4" /> Limpar Campos
                  </Button>

                  {/* **BOTÃO ALTERADO: Agora chama a nova função para abrir a página de info** */}
                  <Button
                    type="button"
                    onClick={handleOpenInfoPage}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Info className="mr-2 h-4 w-4" /> Ver Informações Padrão
                  </Button>
                </div>
              )}

              {/* O restante do formulário permanece igual... */}

              <div>
                <Label htmlFor="title" className="text-gray-300">Título do Modelo</Label>
                <Input
                  id="title"
                  name="title"
                  value={template.title}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="identificacao" className="text-gray-300">Identificação</Label>
                <Textarea
                  id="identificacao"
                  name="identificacao"
                  value={template.identificacao || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="comportamento" className="text-gray-300">Comportamento</Label>
                <Textarea
                  id="comportamento"
                  name="comportamento"
                  value={template.comportamento || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="restricoes" className="text-gray-300">Restrições</Label>
                <Textarea
                  id="restricoes"
                  name="restricoes"
                  value={template.restricoes || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="atribuicoes" className="text-gray-300">Atribuições</Label>
                <Textarea
                  id="atribuicoes"
                  name="atribuicoes"
                  value={template.atribuicoes || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="leis" className="text-gray-300">Leis</Label>
                <Textarea
                  id="leis"
                  name="leis"
                  value={template.leis || ''}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="proventos" className="text-gray-300">Proventos</Label>
                <Textarea
                  id="proventos"
                  name="proventos"
                  value={template.proventos || ''}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="descontos" className="text-gray-300">Descontos</Label>
                <Textarea
                  id="descontos"
                  name="descontos"
                  value={template.descontos || ''}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="observacoes_base_legal" className="text-gray-300">Observações e Base Legal</Label>
                <Textarea
                  id="observacoes_base_legal"
                  name="observacoes_base_legal"
                  value={template.observacoes_base_legal || ''}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <h3 className="text-xl font-semibold text-orange-400 mt-8 mb-4">Campos de Saída e Entrada (DB)</h3>
              <div>
                <Label htmlFor="estrutura_json_modelo_saida" className="text-gray-300">Estrutura JSON Modelo Saída</Label>
                <Textarea
                  id="estrutura_json_modelo_saida"
                  name="estrutura_json_modelo_saida"
                  value={template.estrutura_json_modelo_saida || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="instrucoes_entrada_dados_rescisao" className="text-gray-300">Instruções Entrada Dados Rescisão</Label>
                <Textarea
                  id="instrucoes_entrada_dados_rescisao"
                  name="instrucoes_entrada_dados_rescisao"
                  value={template.instrucoes_entrada_dados_rescisao || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar Modelo' : 'Criar Modelo')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AiPromptTemplateFormPage;