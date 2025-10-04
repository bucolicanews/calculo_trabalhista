import { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess } from '@/utils/toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

interface AiPromptTemplate {
  id: string;
  title: string;
  created_at: string;
}

const AiPromptTemplateListPage: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<AiPromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_ai_prompt_templates')
      .select('id, title, created_at')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      showError('Erro ao carregar modelos de prompt: ' + error.message);
      console.error('Error fetching AI prompt templates:', error);
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase
      .from('tbl_ai_prompt_templates')
      .delete()
      .eq('id', id);

    if (error) {
      showError('Erro ao deletar modelo de prompt: ' + error.message);
      console.error('Error deleting AI prompt template:', error);
    } else {
      showSuccess('Modelo de prompt deletado com sucesso!');
      fetchTemplates(); // Refresh the list
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-orange-500">Meus Modelos de Prompt da IA</h1>
          <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
            <Link to="/ai-templates/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Novo Modelo
            </Link>
          </Button>
        </div>

        {loading ? (
          <p className="text-gray-400">Carregando modelos de prompt...</p>
        ) : templates.length === 0 ? (
          <p className="text-gray-400">Nenhum modelo de prompt cadastrado ainda. Crie um novo para começar!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="bg-gray-900 border-gray-700 text-white hover:border-orange-500 transition-colors">
                <CardHeader>
                  <CardTitle className="text-xl text-orange-500">{template.title}</CardTitle>
                  <p className="text-sm text-gray-400">Criado em: {format(new Date(template.created_at), 'dd/MM/yyyy')}</p>
                </CardHeader>
                <CardContent className="flex justify-end space-x-2">
                  <Button asChild variant="outline" size="sm" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">
                    <Link to={`/ai-templates/${template.id}`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-900 border-red-600 text-white">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-500">Tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente o modelo de prompt "{template.title}".
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