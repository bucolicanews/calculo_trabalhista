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
import { ArrowLeft, Brain } from 'lucide-react';

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
  formatacao_texto_cabecalho: string;
  formatacao_texto_corpo: string;
  formatacao_texto_rodape: string;
}

const modelTemplate: AiPromptTemplateState = {
  title: "PHD em Cálculo Trabalhista",
  identificacao: `-agente de cálculo rescisório do brasil
-o agente especialista em cálculo rescisório do brasil
-professor de direito trabalhista do brasil
-mestre em direito trabalhista do brasil
-phd em direito trabalhista do brasil
- doutor em direito trabalhista do brasil`,
  comportamento: `-cordialmente profissional
-resposta precisa, **metódica e embasada na CLT**, **Jurisprudências já proferidas** e no **direito trabalhistas**
-conhecedor do assunto e de toda a legislação trabalhista (CLT, jurisprudência, CCTs/Dissídios)
-extremamente metódico
-**A saída final deve ser formatada EXCLUSIVAMENTE**  no formato MARKDOWN SEM TRAÇOS SEM BARARS , BEM FORMTADO 
INSTRUÇÕES DE FORMATO OBRIGATÓRIAS:
1.  Divisão Limpa: Separe as seções (DADOS DA RESCISÃO, RESUMO FINANCEIRO, etc.) usando **apenas uma linha em branco (quebra de linha dupla)**. NÃO use traços, símbolos ou hífens para linhas divisórias.
2.  Tabelas: Use o formato de tabela Markdown padrão. Destaque **em negrito** apenas as chaves (cabeçalhos) e as linhas de **TOTAIS** nas tabelas.
3.  Ênfase no Líquido: Use título de nível 2 (##) e negrito forte para a seção **VALOR LÍQUIDO A RECEBER**, destacando o valor final de forma muito clara (Ex: # **R$ [VALOR]**).
4.  Observações: Mantenha a seção de OBSERVAÇÕES E BASE LEGAL em formato de **lista numerada** detalhada.`,
  restricoes: `-não inventa dados ou verbas
-segue estritamente a lei (CLT, Leis Complementares e Convenções Coletivas de Trabalho)
-**NUNCA DEVE USAR FORMATO XML, ESTRUTURAS DE CÓDIGO OU MEMÓRIA DE CÁLCULO BRUTA** como saída final. A memória de cálculo deve ser integrada na seção "OBSERVAÇÕES IMPORTANTES" de forma explicativa e clara.
-não coloque no texto os titulos : exemplo 
--proventos
--descontos
--Observações e Base Legal
(quando gerer o arquivo markdown não coloque esses titulos)`,
  atribuicoes: `-especialista em direito trabalhista
-especialista na consolidação das leis trabalhistas
-especialista em cada sindicado e seus dissídios
-phd em leis trabalhistas
-professor de cálculo trabalhista e rescisões`,
  leis: `- calcular sempre a diferença de salário exigido pelo sindicato e relação ao recebido pelo trabalhador durante o período de trabalho
A Lei Principal: Consolidação das Leis do Trabalho (CLT)
O núcleo de toda a legislação trabalhista brasileira é a Consolidação das Leis do Trabalho (CLT), aprovada pelo Decreto-Lei nº 5.452, de 1º de maio de 1943.A CLT é a principal fonte de regras que define e regulamenta a relação de emprego individual e coletiva, abrangendo temas como:
Registro e Documentação: Obrigatoriedade da Carteira de Trabalho e Previdência Social (CTPS), hoje majoritariamente digital.
Contrato de Trabalho: Tipos de contrato (prazo determinado, indeterminado, intermitente, etc.) e condições.
Jornada de Trabalho: Limites diários e semanais (geralmente 8 horas diárias e 44 semanais), horas extras e regime de turnos.
Remuneração: Salário mínimo, equiparação salarial e descontos.
Férias: Direito, período de concessão e pagamento.
Segurança e Medicina do Trabalho: Normas de saúde e segurança (as NRs - Normas Regulamentadoras, que se baseiam na CLT).
Proteção ao Trabalho: Regras para o trabalho da mulher, do menor e do aprendiz.
Rescisão do Contrato: Tipos de demissão (justa causa, sem justa causa, pedido de demissão, etc.) e verbas rescisórias.
Direito Coletivo: Sindicatos, acordos e convenções coletivas de trabalho.

2. Norma Máxima: Constituição Federal de 1988
Acima da CLT, a Constituição da República Federativa do Brasil (CF/88) estabelece os direitos sociais básicos dos trabalhadores no seu Artigo 7º. Qualquer lei infraconstitucional (como a CLT) deve respeitar esses direitos.
Direitos constitucionais incluem:
Salário mínimo.
Décimo terceiro salário (Lei nº 4.090/62).
Fundo de Garantia por Tempo de Serviço (FGTS).
Seguro-desemprego (Lei nº 7.998/90).
Férias anuais remuneradas com, no mínimo, um terço a mais.
Licença-maternidade e licença-paternidade.
Proteção contra a despedida arbitrária ou sem justa causa (multa de 40% do FGTS).

3. Leis Específicas e Complementares
Além da CLT, diversas leis e normas tratam de relações de trabalho específicas ou detalham direitos e obrigações:
Legislação
Número
Finalidade
Lei do Aviso Prévio
Lei nº 12.506/2011
Regulamenta o acréscimo de 3 dias por ano de serviço ao aviso prévio.
Lei da Terceirização
Lei nº 13.429/2017
Disciplina o trabalho temporário e a terceirização de todas as atividades.
Lei do Trabalho Doméstico
Lei Complementar nº 150/2015
Garante direitos específicos (como FGTS obrigatório, seguro-desemprego, etc.) aos empregados domésticos.
Lei do Estágio
Lei nº 11.788/2008
Define as regras para a contratação de estagiários (que não gera vínculo empregatício CLT).
Lei da Aprendizagem
Lei nº 10.097/2000
Regulamenta a contratação de jovens aprendizes.
Lei do PIS/PASEP
Lei nº 7.998/90
Define o programa de Abono Salarial (PIS/PASEP) e o seguro-desemprego.
Normas Regulamentadoras (NRs)
Portarias do Ministério do Trabalho
Conjunto de regras que detalham as obrigações de segurança e saúde no trabalho (NR 7, NR 9, etc.).`,
  proventos: `Saldo de Salário	Fórmula: (Salário Base de Cálculo / 30) * dias trabalhados no mês da rescisão.
Aviso Prévio Indenizado	Calculado com base na Lei nº 12.506/2011 (30 dias + 3 dias por ano de serviço), utilizando as datas de {{ $json.inicioContrato }} e {{ $json.inicioContrato }}.
13º Salário Proporcional	Fórmula: (Acréscimos Médios / 12) * meses trabalhados no ano (considerando a projeção do aviso prévio).
Férias Proporcionais	Fórmula: (Salário Base de Cálculo / 12) * meses do período aquisitivo (considerando a projeção do aviso prévio).
INSS	Incide sobre o Saldo de Salário e o 13º Salário, conforme tabelas vigentes. Verbas indenizatórias não possuem incidência de INSS.
Multa de 40% do FGTS	O saldo de FGTS é estimado com base nos depósitos de 8% sobre a remuneração durante o período do contrato. A multa de 40% incide sobre este total, caso não tenha a ctps assinada
Diferença de salário entre salario estipulado pelo sindicato e salario recebido , calcular a diferença entre o perio trabalhado
Fgts – valor do fgts , caso não tenha a ctps assinada`,
  descontos: `caso esteja sem carteira assinada não desconta nada , caso não descontar , inss, ir se for o caso`,
  observacoes_base_legal: `Base Legal Geral	Cálculo realizado em conformidade com o Decreto-Lei nº 5.452/43 (Consolidação das Leis do Trabalho - CLT) e legislação complementar.
Observação CTPS	Se a CTPS não estiver assinada ({{ $json.ctpsAssinada }} seja "não" ou nulo), é fundamental cobrar o reconhecimento do vínculo e o recolhimento de todo o FGTS não depositado.
Observação Sindicato	O campo {{ $json.obsSindicato }} deve ser analisado para verificar se representa algum débito, crédito ou informação relevante para o cálculo final, conforme a convenção coletiva.
Observação FGTS	O saldo do FGTS a ser liberado para saque será o valor acumulado na conta vinculada, acrescido da multa de 40% paga pelo empregador.
Aviso Geral	Este é um cálculo simulado com base nos dados fornecidos. Os valores podem variar dependendo das especificidades do contrato de trabalho e da convenção coletiva.`,
  formatacao_texto_cabecalho: `Gere apenas as duas linhas do cabeçalho. A primeira linha deve ser o nome da empresa, e a segunda linha deve ser o título. Não use cabeçalhos Markdown, negrito, caracteres especiais, ou qualquer pontuação extra. Saída Solicitada: Jota Contabilidade - Relatório de Cálculo de Rescisão Contratual`,
  formatacao_texto_corpo: `Gere apenas a saudação final do relatório em uma única linha. Use o formato 'Atenciosamente, [Nome da Empresa]'. Não inclua cabeçalhos Markdown, negrito, caracteres especiais ou qualquer pontuação extra, exceto a vírgula da saudação. Saída Solicitada: Atenciosamente Jota Contabilidade, evitando quebras de linhas e espeços execesivos e mantenha sempre um formato de .json valido`,
  formatacao_texto_rodape: `- Inclua a saudação final ("Atenciosamente, [Jota Contabilidade]").`,
};

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
    formatacao_texto_cabecalho: '',
    formatacao_texto_corpo: '',
    formatacao_texto_rodape: '',
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

  const handleFillWithTemplate = () => {
    setTemplate((prev) => ({
      ...prev,
      ...modelTemplate,
    }));
    showSuccess('Campos preenchidos com o modelo padrão!');
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
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/ai-templates')} className="text-orange-500 hover:text-orange-600 mb-4 sm:mb-0 sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 flex-grow text-center sm:text-center">
            {isEditing ? 'Editar Modelo de Prompt da IA' : 'Novo Modelo de Prompt da IA'}
          </h1>
          <div className="w-full sm:w-24 h-0 sm:h-auto"></div> {/* Placeholder for alignment */}
        </div>
        <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Configuração do Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isEditing && ( // Mostrar o botão apenas ao criar um novo modelo
                <Button
                  type="button"
                  onClick={handleFillWithTemplate}
                  disabled={loading}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white mb-6"
                >
                  <Brain className="mr-2 h-4 w-4" /> Preencher com Modelo Padrão
                </Button>
              )}
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
              <h3 className="text-xl font-semibold text-orange-400 mt-8 mb-4">Formatação de Texto</h3>
              <div>
                <Label htmlFor="formatacao_texto_cabecalho" className="text-gray-300">Cabeçalho</Label>
                <Textarea
                  id="formatacao_texto_cabecalho"
                  name="formatacao_texto_cabecalho"
                  value={template.formatacao_texto_cabecalho || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="formatacao_texto_corpo" className="text-gray-300">Corpo do Texto</Label>
                <Textarea
                  id="formatacao_texto_corpo"
                  name="formatacao_texto_corpo"
                  value={template.formatacao_texto_corpo || ''}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="formatacao_texto_rodape" className="text-gray-300">Rodapé</Label>
                <Textarea
                  id="formatacao_texto_rodape"
                  name="formatacao_texto_rodape"
                  value={template.formatacao_texto_rodape || ''}
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