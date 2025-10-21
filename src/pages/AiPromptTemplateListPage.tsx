import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2, Brain, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface AiPromptTemplate {
  id: string;
  title: string;
  identificacao: string;
  created_at: string;
}

const AiPromptTemplateListPage = () => {
  const [templates, setTemplates] = useState<AiPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }

    const { data, error } = await supabase
      .from('tbl_ai_prompt_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar modelos de IA: ' + error.message);
      console.error('Error fetching AI templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from('tbl_ai_prompt_templates').delete().eq('id', id);
    if (error) {
      showError('Erro ao deletar modelo: ' + error.message);
    } else {
      showSuccess('Modelo deletado com sucesso!');
      fetchTemplates();
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500 mb-4 md:mb-0">Modelos de Prompt IA</h1>
          <div className="flex space-x-3 w-full md:w-auto">
            <Button asChild variant="outline" className="bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 w-1/2 md:w-auto">
                <Link to="/ai-templates/guide">
                    <FileText className="mr-2 h-4 w-4" /> Guia de Configuração
                </Link>
            </Button>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white w-1/2 md:w-auto">
              <Link to="/ai-templates/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Novo Modelo
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando modelos...</p>
        ) : templates.length === 0 ? (
          <p className="text-gray-400">Nenhum modelo de prompt cadastrado ainda. Crie um novo para começar!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-500 flex items-center">
                    <Brain className="mr-2 h-5 w-5" /> {template.title}
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-2 line-clamp-3">{template.identificacao}</p>
                  <p className="text-xs text-gray-500 mt-2">Criado em: {format(new Date(template.created_at), 'dd/MM/yyyy')}</p>
                </CardHeader>
                <CardContent className="flex justify-end space-x-2 pt-4">
                  <Button asChild variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                    <Link to={`/ai-templates/${template.id}`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-red-600 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-500">Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente o modelo "{template.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTemplate(template.id)} className="bg-red-600 hover:bg-red-700 text-white">
                          Deletar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AiPromptTemplateListPage;