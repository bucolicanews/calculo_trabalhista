# Calculadora Trabalhista (Labor Calculator)

Este projeto é uma aplicação de cálculo trabalhista projetada para auxiliar em diversas operações relacionadas a cálculos de rescisão. Ele se integra com o Supabase para serviços de backend (banco de dados, autenticação) e utiliza o n8n para automação de fluxos de trabalho, especificamente para processar solicitações de cálculo via webhooks e interagir com modelos de IA.

## Sumário

1.  [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2.  [Guia de Implantação](#2-guia-de-implantação)
    *   [Pré-requisitos](#pré-requisitos)
    *   [Configuração do Supabase](#configuração-do-supabase)
        *   [Esquema do Banco de Dados](#esquema-do-banco-de-dados)
        *   [Relacionamentos](#relacionamentos)
        *   [Autenticação](#autenticação)
        *   [Segurança em Nível de Linha (RLS)](#segurança-em-nível-de-linha-rls)
        *   [Funções e Triggers](#funções-e-triggers)
    *   [Fluxo de Trabalho n8n](#fluxo-de-trabalho-n8n)
    *   [Funções Edge (Supabase)](#funções-edge-supabase)
    *   [Implantação do Frontend](#implantação-do-frontend)
    *   [Variáveis de Ambiente](#variáveis-de-ambiente)
3.  [Desenvolvimento Local](#3-desenvolvimento-local)
4.  [Contribuindo](#4-contribuindo)
5.  [Licença](#5-licença)

---

## 1. Visão Geral do Projeto

Esta aplicação oferece uma interface de usuário para inserir parâmetros de cálculo trabalhista. Ela utiliza um backend Supabase para armazenamento de dados e gerenciamento de usuários. Cálculos complexos ou integrações (por exemplo, com serviços de IA) são tratados por um fluxo de trabalho n8n, que recebe dados via webhooks. Os resultados do fluxo de trabalho n8n são então armazenados de volta no Supabase e exibidos no frontend.

## 2. Guia de Implantação

Para implantar esta aplicação, você precisará configurar o Supabase, implantar o fluxo de trabalho n8n e implantar a aplicação frontend.

### Pré-requisitos

Antes de começar, certifique-se de ter o seguinte instalado:

*   **Node.js** (versão LTS recomendada)
*   **npm** ou **Yarn** (pnpm é usado neste projeto)
*   **Supabase CLI**: `npm install -g supabase`
*   **Vercel CLI** (se for implantar o frontend no Vercel): `npm install -g vercel`
*   **Instância n8n**: Uma instância n8n em execução (auto-hospedada ou na nuvem) onde você pode importar e executar fluxos de trabalho.

### Configuração do Supabase

Esta aplicação depende fortemente do Supabase para seu backend. Você precisará criar um novo projeto Supabase e configurar seu esquema de banco de dados, autenticação e Segurança em Nível de Linha (RLS).

#### Esquema do Banco de Dados

Abaixo estão os esquemas de tabela inferidos com base no uso e busca de dados da aplicação. Você deve criar essas tabelas em seu projeto Supabase.

```sql
-- Habilitar extensão uuid-ossp para gerar UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Perfis de Usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  default_ai_template_id UUID REFERENCES public.tbl_ai_prompt_templates(id), -- Adicionado para vincular ao template padrão
  PRIMARY KEY (id)
);

-- Tabela de Clientes (Empregadores)
CREATE TABLE public.tbl_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT,
  cnpj TEXT,
  tipo_empregador TEXT NOT NULL,
  responsavel TEXT,
  cpf_responsavel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Sindicatos
CREATE TABLE public.tbl_sindicatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_inicial DATE,
  data_final DATE,
  mes_convencao TEXT,
  url_documento_sindicato TEXT,
  resumo_dissidio TEXT
);

-- Tabela de Modelos de Prompt de IA
CREATE TABLE public.tbl_ai_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  identificacao TEXT,
  comportamento TEXT,
  restricoes TEXT,
  atribuicoes TEXT,
  leis TEXT,
  proventos TEXT,
  descontos TEXT,
  observacoes_base_legal TEXT,
  formatacao_texto_cabecalho TEXT,
  formatacao_texto_corpo TEXT,
  formatacao_texto_rodape TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Cálculos
CREATE TABLE public.tbl_calculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID NOT NULL REFERENCES public.tbl_clientes(id) ON DELETE CASCADE,
  sindicato_id UUID REFERENCES public.tbl_sindicatos(id),
  ai_template_id UUID REFERENCES public.tbl_ai_prompt_templates(id),
  nome_funcionario TEXT NOT NULL,
  cpf_funcionario TEXT,
  funcao_funcionario TEXT,
  inicio_contrato DATE NOT NULL,
  fim_contrato DATE NOT NULL,
  tipo_aviso TEXT NOT NULL,
  salario_sindicato NUMERIC,
  salario_trabalhador NUMERIC DEFAULT 0,
  obs_sindicato TEXT,
  historia TEXT,
  ctps_assinada BOOLEAN DEFAULT FALSE,
  media_descontos NUMERIC DEFAULT 0,
  media_remuneracoes NUMERIC DEFAULT 0,
  carga_horaria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resposta_ai TEXT -- Armazena a resposta markdown da IA diretamente
);

-- Tabela de Respostas de Cálculo (para resultados de webhooks, etc.)
CREATE TABLE public.tbl_resposta_calculo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calculo_id UUID NOT NULL REFERENCES public.tbl_calculos(id) ON DELETE CASCADE,
  resposta_ai TEXT,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  url_documento_calculo TEXT,
  texto_extraido TEXT
);

-- Tabela de Configurações de Webhook
CREATE TABLE public.tbl_webhook_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  selected_fields TEXT[] NOT NULL,
  webhook_url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Relacionamentos

Certifique-se de que os relacionamentos de chave estrangeira estejam corretamente estabelecidos conforme indicado nas instruções `CREATE TABLE` acima:

*   `public.profiles.id` references `auth.users.id`
*   `public.profiles.default_ai_template_id` references `public.tbl_ai_prompt_templates.id`
*   `public.tbl_clientes.user_id` references `auth.users.id`
*   `public.tbl_calculos.cliente_id` references `public.tbl_clientes.id`
*   `public.tbl_calculos.sindicato_id` references `public.tbl_sindicatos.id`
*   `public.tbl_calculos.ai_template_id` references `public.tbl_ai_prompt_templates.id`
*   `public.tbl_resposta_calculo.calculo_id` references `public.tbl_calculos.id` (com `ON DELETE CASCADE` para integridade dos dados)
*   `public.tbl_webhook_configs.user_id` references `auth.users.id`

#### Autenticação

Configure o Supabase Auth para gerenciamento de usuários. A aplicação atualmente usa autenticação por e-mail/senha.

1.  Vá para **Authentication** em seu projeto Supabase.
2.  Habilite o provedor **Email**.
3.  Configure quaisquer modelos de e-mail ou configurações desejadas.

#### Segurança em Nível de Linha (RLS)

É altamente recomendável habilitar e configurar o RLS para todas as tabelas que contêm dados de usuário sensíveis para garantir a privacidade e segurança dos dados.

```sql
-- Habilitar RLS para todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_sindicatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_calculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_resposta_calculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_webhook_configs ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela 'profiles'
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- Políticas para a tabela 'tbl_clientes'
CREATE POLICY "Clientes podem ver apenas seus próprios clientes" ON public.tbl_clientes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Clientes podem inserir seus próprios clientes" ON public.tbl_clientes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Clientes podem atualizar seus próprios clientes" ON public.tbl_clientes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Clientes podem deletar seus próprios clientes" ON public.tbl_clientes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas para a tabela 'tbl_sindicatos' (acesso público para autenticados, conforme schema existente)
CREATE POLICY "Sindicatos podem ser lidos por autenticados" ON public.tbl_sindicatos
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sindicatos podem ser inseridos por autenticados" ON public.tbl_sindicatos
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Sindicatos podem ser atualizados por autenticados" ON public.tbl_sindicatos
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Sindicatos podem ser deletados por autenticados" ON public.tbl_sindicatos
  FOR DELETE TO authenticated USING (true);

-- Políticas para a tabela 'tbl_ai_prompt_templates'
CREATE POLICY "Users can only see their own AI prompt templates" ON public.tbl_ai_prompt_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own AI prompt templates" ON public.tbl_ai_prompt_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own AI prompt templates" ON public.tbl_ai_prompt_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own AI prompt templates" ON public.tbl_ai_prompt_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Políticas para a tabela 'tbl_calculos' (baseado no user_id do cliente)
CREATE POLICY "Calculos podem ser vistos apenas pelos donos dos clientes" ON public.tbl_calculos
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.tbl_clientes WHERE tbl_clientes.id = tbl_calculos.cliente_id AND tbl_clientes.user_id = auth.uid()));
CREATE POLICY "Calculos podem ser inseridos apenas pelos donos dos clientes" ON public.tbl_calculos
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.tbl_clientes WHERE tbl_clientes.id = tbl_calculos.cliente_id AND tbl_clientes.user_id = auth.uid()));
CREATE POLICY "Calculos podem ser atualizados apenas pelos donos dos clientes" ON public.tbl_calculos
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.tbl_clientes WHERE tbl_clientes.id = tbl_calculos.cliente_id AND tbl_clientes.user_id = auth.uid()));
CREATE POLICY "Calculos podem ser deletados apenas pelos donos dos clientes" ON public.tbl_calculos
  FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.tbl_clientes WHERE tbl_clientes.id = tbl_calculos.cliente_id AND tbl_clientes.user_id = auth.uid()));

-- Políticas para a tabela 'tbl_resposta_calculo' (baseado no user_id do cliente do cálculo)
CREATE POLICY "Respostas de calculo podem ser vistas apenas pelos donos dos ca" ON public.tbl_resposta_calculo
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.tbl_calculos c JOIN public.tbl_clientes cl ON c.cliente_id = cl.id WHERE c.id = tbl_resposta_calculo.calculo_id AND cl.user_id = auth.uid()));
CREATE POLICY "Respostas de calculo podem ser inseridas apenas pelos donos dos" ON public.tbl_resposta_calculo
  FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.tbl_calculos c JOIN public.tbl_clientes cl ON c.cliente_id = cl.id WHERE c.id = tbl_resposta_calculo.calculo_id AND cl.user_id = auth.uid()));
CREATE POLICY "Respostas de calculo podem ser atualizadas apenas pelos donos d" ON public.tbl_resposta_calculo
  FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.tbl_calculos c JOIN public.tbl_clientes cl ON c.cliente_id = cl.id WHERE c.id = tbl_resposta_calculo.calculo_id AND cl.user_id = auth.uid()));
CREATE POLICY "Respostas de calculo podem ser deletadas apenas pelos donos dos" ON public.tbl_resposta_calculo
  FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.tbl_calculos c JOIN public.tbl_clientes cl ON c.cliente_id = cl.id WHERE c.id = tbl_resposta_calculo.calculo_id AND cl.user_id = auth.uid()));

-- Políticas para a tabela 'tbl_webhook_configs'
CREATE POLICY "Users can only see their own webhook configs" ON public.tbl_webhook_configs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can only insert their own webhook configs" ON public.tbl_webhook_configs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can only update their own webhook configs" ON public.tbl_webhook_configs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can only delete their own webhook configs" ON public.tbl_webhook_configs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

#### Funções e Triggers

A função `handle_new_user` é responsável por criar um perfil para novos usuários no momento do cadastro, preenchendo automaticamente alguns campos com base nos metadados do usuário e definindo um modelo de IA padrão.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    default_template_id uuid;
BEGIN
    -- Encontra o ID do modelo de IA "PHD em Cálculo Trabalhista"
    SELECT id INTO default_template_id
    FROM public.tbl_ai_prompt_templates
    WHERE title = 'PHD em Cálculo Trabalhista'
    LIMIT 1;

    -- Insere um novo perfil para o novo usuário com o modelo de IA padrão
    INSERT INTO public.profiles (id, first_name, last_name, default_ai_template_id)
    VALUES (
        new.id,
        new.raw_user_meta_data ->> 'first_name',
        new.raw_user_meta_data ->> 'last_name',
        default_template_id
    );
    RETURN new;
END;
$$;

-- Trigger para executar a função 'handle_new_user' após a inserção de um novo usuário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Inserção de Modelo de IA Padrão (Seed)

Para garantir que a função `handle_new_user` encontre o modelo de IA padrão, você pode inserir um registro inicial na tabela `tbl_ai_prompt_templates`.

```sql
INSERT INTO public.tbl_ai_prompt_templates (
  id, user_id, title, identificacao, comportamento, restricoes, atribuicoes, leis, proventos, descontos, observacoes_base_legal, formatacao_texto_cabecalho, formatacao_texto_corpo, formatacao_texto_rodape, created_at
) VALUES (
  '4763eeea-1715-44f6-8265-d2ac3d5dabca', -- UUID fixo para o modelo padrão
  '10599047-4bb5-4003-9319-773476a44ef0', -- Substitua pelo ID de um usuário existente ou um UUID genérico se não houver user_id
  'PHD em Cálculo Trabalhista',
  '-agente de cálculo rescisório do brasil\n-o agente especialista em cálculo rescisório do brasil\n-professor de direito trabalhista do brasil\n-mestre em direito trabalhista do brasil\n-phd em direito trabalhista do brasil\n- doutor em direito trabalhista do brasil',
  '-cordialmente profissional\n-resposta precisa, **metódica e embasada na CLT**, **Jurisprudências já proferidas** e no **direito trabalhistas**\n-conhecedor do assunto e de toda a legislação trabalhista (CLT, jurisprudência, CCTs/Dissídios)\n-extremamente metódico\n-**A saída final deve ser formatada EXCLUSIVAMENTE**  no formato MARKDOWN SEM TRAÇOS SEM BARARS , BEM FORMTADO \nINSTRUÇÕES DE FORMATO OBRIGATÓRIAS:\n1.  Divisão Limpa: Separe as seções (DADOS DA RESCISÃO, RESUMO FINANCEIRO, etc.) usando **apenas uma linha em branco (quebra de linha dupla)**. NÃO use traços, símbolos ou hífens para linhas divisórias.\n2.  Tabelas: Use o formato de tabela Markdown padrão. Destaque **em negrito** apenas as chaves (cabeçalhos) e as linhas de **TOTAIS** nas tabelas.\n3.  Ênfase no Líquido: Use título de nível 2 (##) e negrito forte para a seção **VALOR LÍQUIDO A RECEBER**, destacando o valor final de forma muito clara (Ex: # **R$ [VALOR]**).\n4.  Observações: Mantenha a seção de OBSERVAÇÕES E BASE LEGAL em formato de **lista numerada** detalhada.',
  '-não inventa dados ou verbas\n-segue estritamente a lei (CLT, Leis Complementares e Convenções Coletivas de Trabalho)\n-**NUNCA DEVE USAR FORMATO XML, ESTRUTURAS DE CÓDIGO OU MEMÓRIA DE CÁLCULO BRUTA** como saída final. A memória de cálculo deve ser integrada na seção "OBSERVAÇÕES IMPORTANTES" de forma explicativa e clara.\n-não coloque no texto os titulos : exemplo \n--proventos\n--descontos\n--Observações e Base Legal\n(quando gerer o arquivo markdown não coloque esses titulos)',
  '-especialista em direito trabalhista\n-especialista na consolidação das leis trabalhistas\n-especialista em cada sindicado e seus dissídios\n-phd em leis trabalhistas\n-professor de cálculo trabalhista e rescisões',
  '- calcular sempre a diferença de salário exigido pelo sindicato e relação ao recebido pelo trabalhador durante o período de trabalho\nA Lei Principal: Consolidação das Leis do Trabalho (CLT)\nO núcleo de toda a legislação trabalhista brasileira é a Consolidação das Leis do Trabalho (CLT), aprovada pelo Decreto-Lei nº 5.452, de 1º de maio de 1943.A CLT é a principal fonte de regras que define e regulamenta a relação de emprego individual e coletiva, abrangendo temas como:\nRegistro e Documentação: Obrigatoriedade da Carteira de Trabalho e Previdência Social (CTPS), hoje majoritariamente digital.\nContrato de Trabalho: Tipos de contrato (prazo determinado, indeterminado, intermitente, etc.) e condições.\nJornada de Trabalho: Limites diários e semanais (geralmente 8 horas diárias e 44 semanais), horas extras e regime de turnos.\nRemuneração: Salário mínimo, equiparação salarial e descontos.\nFérias: Direito, período de concessão e pagamento.\nSegurança e Medicina do Trabalho: Normas de saúde e segurança (as NRs - Normas Regulamentadoras, que se baseiam na CLT).\nProteção ao Trabalho: Regras para o trabalho da mulher, do menor e do aprendiz.\nRescisão do Contrato: Tipos de demissão (justa causa, sem justa causa, pedido de demissão, etc.) e verbas rescisórias.\nDireito Coletivo: Sindicatos, acordos e convenções coletivas de trabalho.\n\n2. Norma Máxima: Constituição Federal de 1988\nAcima da CLT, a Constituição da República Federativa do Brasil (CF/88) estabelece os direitos sociais básicos dos trabalhadores no seu Artigo 7º. Qualquer lei infraconstitucional (como a CLT) deve respeitar esses direitos.\nDireitos constitucionais incluem:\nSalário mínimo.\nDécimo terceiro salário (Lei nº 4.090/62).\nFundo de Garantia por Tempo de Serviço (FGTS).\nSeguro-desemprego (Lei nº 7.998/90).\nFérias anuais remuneradas com, no mínimo, um terço a mais.\nLicença-maternidade e licença-paternidade.\nProteção contra a despedida arbitrária ou sem justa causa (multa de 40% do FGTS).\n\n3. Leis Específicas e Complementares\nAlém da CLT, diversas leis e normas tratam de relações de trabalho específicas ou detalham direitos e obrigações:\nLegislação\nNúmero\nFinalidade\nLei do Aviso Prévio\nLei nº 12.506/2011\nRegulamenta o acréscimo de 3 dias por ano de serviço ao aviso prévio.\nLei da Terceirização\nLei nº 13.429/2017\nDisciplina o trabalho temporário e a terceirização de todas as atividades.\nLei do Trabalho Doméstico\nLei Complementar nº 150/2015\nGarante direitos específicos (como FGTS obrigatório, seguro-desemprego, etc.) aos empregados domésticos.\nLei do Estágio\nLei nº 11.788/2008\nDefine as regras para a contratação de estagiários (que não gera vínculo empregatício CLT).\nLei da Aprendizagem\nLei nº 10.097/2000\nRegulamenta a contratação de jovens aprendizes.\nLei do PIS/PASEP\nLei nº 7.998/90\nDefine o programa de Abono Salarial (PIS/PASEP) e o seguro-desemprego.\nNormas Regulamentadoras (NRs)\nPortarias do Ministério do Trabalho\nConjunto de regras que detalham as obrigações de segurança e saúde no trabalho (NR 7, NR 9, etc.).',
  'Saldo de Salário\tFórmula: (Salário Base de Cálculo / 30) * dias trabalhados no mês da rescisão.\nAviso Prévio Indenizado\tCalculado com base na Lei nº 12.506/2011 (30 dias + 3 dias por ano de serviço), utilizando as datas de {{ $json.inicioContrato }} e {{ $json.inicioContrato }}.\n13º Salário Proporcional\tFórmula: (Acréscimos Médios / 12) * meses trabalhados no ano (considerando a projeção do aviso prévio).\nFérias Proporcionais\tFórmula: (Salário Base de Cálculo / 12) * meses do período aquisitivo (considerando a projeção do aviso prévio).\nINSS\tIncide sobre o Saldo de Salário e o 13º Salário, conforme tabelas vigentes. Verbas indenizatórias não possuem incidência de INSS.\nMulta de 40% do FGTS\tO saldo de FGTS é estimado com base nos depósitos de 8% sobre a remuneração durante o período do contrato. A multa de 40% incide sobre este total, caso não tenha a ctps assinada\nDiferença de salário entre salario estipulado pelo sindicato e relação ao recebido pelo trabalhador durante o período de trabalho\nFgts – valor do fgts , caso não tenha a ctps assinada',
  'caso esteja sem carteira assinada não desconta nada , caso não descontar , inss, ir se for o caso',
  'Base Legal Geral\tCálculo realizado em conformidade com o Decreto-Lei nº 5.452/43 (Consolidação das Leis do Trabalho - CLT) e legislação complementar.\nObservação CTPS\tSe a CTPS não estiver assinada ({{ $json.ctpsAssinada }} seja "não" ou nulo), é fundamental cobrar o reconhecimento do vínculo e o recolhimento de todo o FGTS não depositado.\nObservação Sindicato\tO campo {{ $json.obsSindicato }} deve ser analisado para verificar se representa algum débito, crédito ou informação relevante para o cálculo final, conforme a convenção coletiva.\nObservação FGTS\tO saldo do FGTS a ser liberado para saque será o valor acumulado na conta vinculada, acrescido da multa de 40% paga pelo empregador.\nAviso Geral\tEste é um cálculo simulado com base nos dados fornecidos. Os valores podem variar dependendo das especificidades do contrato de trabalho e da convenção coletiva.',
  'Gere apenas as duas linhas do cabeçalho. A primeira linha deve ser o nome da empresa, e a segunda linha deve ser o título. Não use cabeçalhos Markdown, negrito, caracteres especiais, ou qualquer pontuação extra. Saída Solicitada: Jota Contabilidade - Relatório de Cálculo de Rescisão Contratual',
  'Gere apenas a saudação final do relatório em uma única linha. Use o formato \'Atenciosamente, [Nome da Empresa]\'. Não inclua cabeçalhos Markdown, negrito, caracteres especiais ou qualquer pontuação extra, exceto a vírgula da saudação. Saída Solicitada: Atenciosamente Jota Contabilidade, evitando quebras de linhas e espeços execesivos e mantenha sempre um formato de .json valido',
  '- Inclua a saudação final ("Atenciosamente, [Jota Contabilidade]").',
  NOW()
) ON CONFLICT (id) DO NOTHING;
```
**Nota**: Substitua `'10599047-4bb5-4003-9319-773476a44ef0'` pelo `id` de um usuário existente em seu banco de dados `auth.users` ou por um UUID genérico se a política de RLS para `tbl_ai_prompt_templates` permitir inserções sem um `user_id` específico.

### Fluxo de Trabalho n8n

A aplicação utiliza um fluxo de trabalho n8n para processar solicitações de cálculo.

**Arquivo do Fluxo de Trabalho:** `src/n8n/calculo_trabalhista_n8n.json`

**Etapas para Implantar o Fluxo de Trabalho n8n:**

1.  **Importar**: Em sua instância n8n, vá para "Workflows" e clique em "New" -> "Import from JSON". Carregue o arquivo `calculo_trabalhista_n8n.json`.
2.  **Configurar Webhook**: O fluxo de trabalho provavelmente começará com um gatilho "Webhook". Após a importação, ative o fluxo de trabalho para obter sua URL de webhook exclusiva. Esta URL será usada nas variáveis de ambiente do seu frontend.
3.  **Variáveis de Ambiente/Credenciais no n8n**: O fluxo de trabalho n8n provavelmente exigirá credenciais ou variáveis de ambiente para:
    *   **Integração Supabase**: URL da API e Chave de Função de Serviço para gravar dados de volta no Supabase.
    *   **Integração de Serviço de IA**: Chaves de API para quaisquer modelos de IA (por exemplo, OpenAI, Gemini) se o fluxo de trabalho interagir com eles.
    *   **Outros Serviços**: Quaisquer outros serviços de terceiros aos quais o fluxo de trabalho se conecta.
    *   **Importante**: Certifique-se de que sua Chave de Função de Serviço do Supabase seja mantida em segurança e usada apenas em ambientes de backend confiáveis, como o n8n. Não a exponha em seu frontend.
4.  **Ativar**: Uma vez configurado, ative o fluxo de trabalho n8n.

### Funções Edge (Supabase)

O projeto inclui uma função Edge do Supabase para armazenar os resultados dos cálculos processados pelo n8n de volta no banco de dados.

**Arquivo da Função Edge:** `supabase/functions/store-calculation-result/index.ts`

Esta função recebe o `calculationId` e a `aiResponse` do n8n e atualiza o campo `resposta_ai` na tabela `tbl_calculos`.

**Etapas para Implantar a Função Edge:**

1.  **Deploy**: A função Edge será implantada automaticamente quando você aplicar as alterações de código. Não é necessário usar a CLI do Supabase manualmente para o deploy.
2.  **Configuração de Segredos**: A função utiliza as variáveis de ambiente `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. Estas são automaticamente fornecidas pelo ambiente Supabase. Certifique-se de que a `SUPABASE_SERVICE_ROLE_KEY` esteja configurada corretamente em seus segredos do Supabase, pois ela é usada para operações de escrita no banco de dados com privilégios elevados.

### Implantação do Frontend

O frontend é uma aplicação React. Ele pode ser implantado em plataformas como Vercel, Netlify ou qualquer serviço de hospedagem de site estático.

**Etapas para Implantação no Vercel (Recomendado):**

1.  **Instalar Vercel CLI**: `npm install -g vercel`
2.  **Login**: `vercel login`
3.  **Deploy**: Navegue até a raiz do seu projeto e execute `vercel`. Siga as instruções.
4.  **Configurar Variáveis de Ambiente**: Após a implantação, vá para as configurações do seu projeto Vercel e adicione as [Variáveis de Ambiente](#variáveis-de-ambiente) necessárias.

### Variáveis de Ambiente

Você precisará definir as seguintes variáveis de ambiente para sua aplicação frontend. Elas devem ser configuradas em seu provedor de hospedagem (por exemplo, configurações do projeto Vercel) e em seu arquivo local `.env` para desenvolvimento.

*   **`VITE_SUPABASE_URL`**: A URL do seu projeto Supabase (por exemplo, `https://your-project-ref.supabase.co`).
*   **`VITE_SUPABASE_ANON_KEY`**: Sua chave pública `anon` do Supabase.
*   **`VITE_N8N_WEBHOOK_URL`**: A URL do seu webhook n8n que recebe as solicitações de cálculo.

**Exemplo de arquivo `.env`:**

```
VITE_SUPABASE_URL="https://oqiycpjayuzuyefkdujp.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaXljcGphamV1enV5ZWZrZHVqcCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzU5MzM2MTY0LCJleHAiOjIwNzQ5MTIxNjR9.9U4YAX2lAoc0vNyOrviBg10e-2ThVgwO0EKQiJuamag"
VITE_N8N_WEBHOOK_URL="https://your-n8n-instance/webhook/resumo" # Substitua pela URL real do seu webhook n8n
```

## 3. Desenvolvimento Local

Para executar a aplicação localmente:

1.  **Clonar o repositório**:
    ```bash
    git clone <repository-url>
    cd <project-folder>
    ```
2.  **Instalar dependências**:
    ```bash
    pnpm install
    ```
3.  **Configurar variáveis de ambiente**: Crie um arquivo `.env` na raiz do projeto e preencha-o com as variáveis listadas na seção [Variáveis de Ambiente](#variáveis-de-ambiente).
4.  **Iniciar o servidor de desenvolvimento**:
    ```bash
    pnpm dev
    ```
    A aplicação estará tipicamente disponível em `http://localhost:8080`.

## 4. Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou enviar pull requests.

## 5. Licença

Este projeto está licenciado sob a Licença MIT.