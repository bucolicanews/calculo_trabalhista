# Calculadora Trabalhista (Labor Calculator)

Este projeto é uma aplicação de cálculo trabalhista projetada para auxiliar em diversas operações relacionadas a cálculos de rescisão. Ele se integra com o Supabase para serviços de backend (banco de dados, autenticação) e utiliza o n8n para automação de fluxos de trabalho, especificamente para processar solicitações de cálculo via webhooks e interagir com modelos de IA.

## Sumário

1.  [Apresentação Profissional](#1-apresentação-profissional)
2.  [Visão Geral do Projeto](#2-visão-geral-do-projeto)
3.  [Guia de Implantação](#3-guia-de-implantação)
    *   [Pré-requisitos](#pré-requisitos)
    *   [Configuração do Supabase](#configuração-do-supabase)
        *   [Esquema do Banco de Dados](#esquema-do-banco-de-dados)
        *   [Relacionamentos](#relacionamentos)
        *   [Autenticação](#autenticação)
        *   [Segurança em Nível de Linha (RLS)](#segurança-em-nível-de-linha-rls)
        *   [Funções e Triggers](#funções-e-triggers)
        *   [Inserção de Modelo de IA Padrão (Seed)](#inserção-de-modelo-de-ia-padrão-seed)
    *   [Funções Edge (Supabase)](#funções-edge-supabase)
    *   [Fluxo de Trabalho n8n](#fluxo-de-trabalho-n8n)
    *   [Implantação do Frontend](#implantação-do-frontend)
    *   [Variáveis de Ambiente](#variáveis-de-ambiente)
    *   [Dependências do Projeto](#dependências-do-projeto)
4.  [Desenvolvimento Local](#4-desenvolvimento-local)
5.  [Contribuindo](#5-contribuindo)
6.  [Licença](#6-licença)

---

## 1. Apresentação Profissional Padrão

Apresentamos a "Calculadora Trabalhista Jota Empresas", uma solução robusta e intuitiva desenvolvida para otimizar e automatizar os complexos processos de cálculo de rescisões contratuais. Criada com foco na precisão e conformidade legal, esta aplicação é uma ferramenta indispensável para profissionais de contabilidade, departamentos de RH e escritórios jurídicos que buscam eficiência e segurança nas operações trabalhistas.

Integrando tecnologias de ponta como React para uma interface de usuário dinâmica, Supabase para um backend escalável e seguro, e n8n para automação inteligente de fluxos de trabalho, a Calculadora Trabalhista Jota Empresas não apenas simplifica a entrada de dados, mas também aproveita o poder da Inteligência Artificial para gerar relatórios detalhados e embasados na legislação vigente. Com ela, você garante cálculos transparentes, reduz erros e otimiza o tempo, permitindo que sua equipe se concentre em atividades estratégicas.

Nossa plataforma é projetada para ser responsiva, segura e fácil de usar, proporcionando uma experiência de usuário superior e garantindo que todos os cálculos estejam em estrita conformidade com a CLT, jurisprudências e convenções coletivas.

## 2. Visão Geral do Projeto

Esta aplicação oferece uma interface de usuário para inserir parâmetros de cálculo trabalhista. Ela utiliza um backend Supabase para armazenamento de dados e gerenciamento de usuários. Cálculos complexos ou integrações (por exemplo, com serviços de IA) são tratados por um fluxo de trabalho n8n, que recebe dados via webhooks. Os resultados do fluxo de trabalho n8n são então armazenados de volta no Supabase e exibidos no frontend.

## 3. Guia de Implantação

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

<dyad-execute-sql description="Esquema completo do banco de dados Supabase">
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
  estrutura_json_modelo_saida TEXT, -- Adicionado
  instrucoes_entrada_dados_rescisao TEXT, -- Adicionado
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
  resposta_ai JSONB -- Armazena a resposta JSON da IA diretamente
);

-- Tabela de Proventos (Verbas Remuneratórias)
CREATE TABLE public.tbl_proventos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_calculo UUID REFERENCES public.tbl_calculos(id) ON DELETE CASCADE,
  nome_provento TEXT NOT NULL,
  valor_calculado NUMERIC NOT NULL,
  natureza_da_verba TEXT NOT NULL,
  legislacao TEXT,
  exemplo_aplicavel TEXT,
  formula_sugerida TEXT,
  parametro_calculo TEXT,
  json_completo JSONB,
  memoria_calculo TEXT
);

-- Tabela de Descontos
CREATE TABLE public.tbl_descontos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  id_calculo UUID REFERENCES public.tbl_calculos(id) ON DELETE CASCADE,
  nome_desconto TEXT NOT NULL,
  valor_calculado NUMERIC NOT NULL,
  natureza_da_verba TEXT NOT NULL,
  legislacao TEXT,
  exemplo_aplicavel TEXT,
  formula_sugerida TEXT,
  parametro_calculo TEXT,
  json_completo JSONB,
  memoria_calculo TEXT
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
</dyad-execute-sql>

#### Relacionamentos

Certifique-se de que os relacionamentos de chave estrangeira estejam corretamente estabelecidos conforme indicado nas instruções `CREATE TABLE` acima:

*   `public.profiles.id` references `auth.users.id`
*   `public.profiles.default_ai_template_id` references `public.tbl_ai_prompt_templates.id`
*   `public.tbl_clientes.user_id` references `auth.users.id`
*   `public.tbl_calculos.cliente_id` references `public.tbl_clientes.id`
*   `public.tbl_calculos.sindicato_id` references `public.tbl_sindicatos.id`
*   `public.tbl_calculos.ai_template_id` references `public.tbl_ai_prompt_templates.id`
*   `public.tbl_proventos.id_calculo` references `public.tbl_calculos.id`
*   `public.tbl_descontos.id_calculo` references `public.tbl_calculos.id`
*   `public.tbl_resposta_calculo.calculo_id` references `public.tbl_calculos.id` (com `ON DELETE CASCADE` para integridade dos dados)
*   `public.tbl_webhook_configs.user_id` references `auth.users.id`

#### Autenticação

Configure o Supabase Auth para gerenciamento de usuários. A aplicação atualmente usa autenticação por e-mail/senha.

1.  Vá para **Authentication** em seu projeto Supabase.
2.  Habilite o provedor **Email**.
3.  Configure quaisquer modelos de e-mail ou configurações desejadas.

#### Segurança em Nível de Linha (RLS)

É altamente recomendável habilitar e configurar o RLS para todas as tabelas que contêm dados de usuário sensíveis para garantir a privacidade e segurança dos dados.

<dyad-execute-sql description="Políticas de RLS para todas as tabelas">
-- Habilitar RLS para todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_sindicatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_calculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_proventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tbl_descontos ENABLE ROW LEVEL SECURITY;
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

-- Políticas para a tabela 'tbl_proventos' (baseado no user_id do cliente do cálculo)
CREATE POLICY "proventos_select_policy" ON public.tbl_proventos
FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_proventos.id_calculo) AND (cl.user_id = auth.uid()))));
CREATE POLICY "proventos_insert_policy" ON public.tbl_proventos
FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_proventos.id_calculo) AND (cl.user_id = auth.uid()))));
CREATE POLICY "proventos_update_policy" ON public.tbl_proventos
FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_proventos.id_calculo) AND (cl.user_id = auth.uid()))));
CREATE POLICY "proventos_delete_policy" ON public.tbl_proventos
FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_proventos.id_calculo) AND (cl.user_id = auth.uid()))));

-- Políticas para a tabela 'tbl_descontos' (baseado no user_id do cliente do cálculo)
CREATE POLICY "descontos_select_policy" ON public.tbl_descontos
FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_descontos.id_calculo) AND (cl.user_id = auth.uid()))));
CREATE POLICY "descontos_insert_policy" ON public.tbl_descontos
FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_descontos.id_calculo) AND (cl.user_id = auth.uid()))));
CREATE POLICY "descontos_update_policy" ON public.tbl_descontos
FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_descontos.id_calculo) AND (cl.user_id = auth.uid()))));
CREATE POLICY "descontos_delete_policy" ON public.tbl_descontos
FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_descontos.id_calculo) AND (cl.user_id = auth.uid()))));

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
</dyad-execute-sql>

#### Funções e Triggers

A função `handle_new_user` é responsável por criar um perfil para novos usuários no momento do cadastro, preenchendo automaticamente alguns campos com base nos metadados do usuário e definindo um modelo de IA padrão.

<dyad-execute-sql description="Função e Trigger para criar perfil de usuário e vincular modelo de IA padrão">
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
</dyad-execute-sql>

#### Inserção de Modelo de IA Padrão (Seed)

Para garantir que a função `handle_new_user` encontre o modelo de IA padrão, você pode inserir um registro inicial na tabela `tbl_ai_prompt_templates`.

<dyad-execute-sql description="Inserção do modelo de prompt de IA padrão">
INSERT INTO public.tbl_ai_prompt_templates (
  id, user_id, title, identificacao, comportamento, restricoes, atribuicoes, leis, proventos, descontos, observacoes_base_legal, estrutura_json_modelo_saida, instrucoes_entrada_dados_rescisao, created_at
) VALUES (
  '4763eeea-1715-44f6-8265-d2ac3d5dabca', -- UUID fixo para o modelo padrão
  '10599047-4bb5-4003-9319-773476a44ef0', -- Substitua pelo ID de um usuário existente ou um UUID genérico se não houver user_id
  'PHD em Cálculo Trabalhista',
  '-agente de cálculo rescisório do brasil
-o agente especialista em cálculo rescisório do brasil
-professor de direito trabalhista do brasil
-mestre em direito trabalhista do brasil
-phd em direito trabalhista do brasil
- doutor em direito trabalhista do brasil',
  '-cordialmente profissional
-resposta precisa, **metódica e embasada na CLT**, **Jurisprudências já proferidas** e no **direito trabalhistas**
-conhecedor do assunto e de toda a legislação trabalhista (CLT, jurisprudência, CCTs/Dissídios)
-extremamente metódico
-**A saída final deve ser formatada EXCLUSIVAMENTE** no formato JSON, seguindo a estrutura detalhada em \'Estrutura JSON Modelo Saída\'.',
  '-não inventa dados ou verbas
-segue estritamente a lei (CLT, Leis Complementares e Convenções Coletivas de Trabalho)
-**NUNCA DEVE USAR FORMATO XML OU ESTRUTURAS DE CÓDIGO BRUTA** como saída final, apenas o JSON solicitado.',
  '-especialista em direito trabalhista
-especialista na consolidação das leis trabalhistas
-especialista em cada sindicado e seus dissídios
-phd em leis trabalhistas
-professor de cálculo trabalhista e rescisões',
  '- calcular sempre a diferença de salário exigido pelo sindicato e relação ao recebido pelo trabalhador durante o período de trabalho
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
Conjunto de regras que detalham as obrigações de segurança e saúde no trabalho (NR 7, NR 9, etc.).',
  'Saldo de Salário	Fórmula: (Salário Base de Cálculo / 30) * dias trabalhados no mês da rescisão.
Aviso Prévio Indenizado	Calculado com base na Lei nº 12.506/2011 (30 dias + 3 dias por ano de serviço), utilizando as datas de {{ $json.inicioContrato }} e {{ $json.inicioContrato }}.
13º Salário Proporcional	Fórmula: (Acréscimos Médios / 12) * meses trabalhados no ano (considerando a projeção do aviso prévio).
Férias Proporcionais	Fórmula: (Salário Base de Cálculo / 12) * meses do período aquisitivo (considerando a projeção do aviso prévio).
INSS	Incide sobre o Saldo de Salário e o 13º Salário, conforme tabelas vigentes. Verbas indenizatórias não possuem incidência de INSS.
Multa de 40% do FGTS	O saldo de FGTS é estimado com base nos depósitos de 8% sobre a remuneração durante o período do contrato. A multa de 40% incide sobre este total, caso não tenha a ctps assinada
Diferença de salário entre salario estipulado pelo sindicato e relação ao recebido pelo trabalhador durante o período de trabalho
Fgts – valor do fgts , caso não tenha a ctps assinada',
  'caso esteja sem carteira assinada não desconta nada , caso não descontar , inss, ir se for o caso',
  'Base Legal Geral	Cálculo realizado em conformidade com o Decreto-Lei nº 5.452/43 (Consolidação das Leis do Trabalho - CLT) e legislação complementar.
Observação CTPS	Se a CTPS não estiver assinada ({{ $json.ctpsAssinada }} seja "não" ou nulo), é fundamental cobrar o reconhecimento do vínculo e o recolhimento de todo o FGTS não depositado.
Observação Sindicato	O campo {{ $json.obsSindicato }} deve ser analisado para verificar se representa algum débito, crédito ou informação relevante para o cálculo final, conforme a convenção coletiva.
Observação FGTS	O saldo do FGTS a ser liberado para saque será o valor acumulado na conta vinculada, acrescido da multa de 40% paga pelo empregador.
Aviso Geral	Este é um cálculo simulado com base nos dados fornecidos. Os valores podem variar dependendo das especificidades do contrato de trabalho e da convenção coletiva.',
  '{
  "Verbas_Rescisorias": {
    "Remuneracao": [
      {
        "Provento": "string",
        "Cálculo": {
          "Parametro": "string",
          "Valor": "number",
          "Fórmula_Sugerida": "string"
        },
        "Memoria_de_Calculo": "string",
        "Legislação": "string",
        "Exemplos_Aplicaveis": "string",
        "Natureza_da_Verba": "string"
      }
    ],
    "Descontos": [
      {
        "Desconto": "string",
        "Cálculo": {
          "Parametro": "string",
          "Valor": "number",
          "Fórmula_Sugerida": "string"
        },
        "Memoria_de_Calculo": "string",
        "Legislação": "string",
        "Exemplos_Aplicaveis": "string",
        "Natureza_da_Verba": "string"
      }
    ]
  }
}',
  'Instruções para entrada de dados para rescisão',
  NOW()
) ON CONFLICT (id) DO NOTHING;
</dyad-execute-sql>

### Funções Edge (Supabase)

As funções Edge são usadas para lógica de backend sem servidor, como processamento de webhooks e geração de documentos.

#### `store-calculation-result`

Esta função recebe a resposta da IA (geralmente um JSON ou Markdown) de um webhook (n8n) e a armazena na coluna `resposta_ai` da tabela `tbl_calculos`. Se a resposta for um JSON válido, ela também invoca a função `process-ai-calculation-json` para detalhar os proventos e descontos em suas respectivas tabelas.

<dyad-write path="supabase/functions/store-calculation-result/index.ts" description="Código da função Edge store-calculation-result">
// @ts-nocheck
// deno-lint-ignore-file
// @ts-ignore
/// <reference lib="deno.ns" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2.45.0" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calculationId, aiResponse } = await req.json(); // aiResponse é o JSON string

    // NOVO LOG PARA DEPURAR O PAYLOAD RECEBIDO
    console.log(`[store-calculation-result] Received payload: calculationId=${calculationId}, aiResponse length=${aiResponse?.length || 0}`);

    if (!calculationId || !aiResponse) {
      console.error(`[store-calculation-result] Missing calculationId or aiResponse. calculationId: ${calculationId}, aiResponse present: ${!!aiResponse}`);
      return new Response(JSON.stringify({ error: 'Missing calculationId or aiResponse' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for server-side operations
    );

    // 1. Tenta parsear a resposta da IA como JSON.
    let isJson = false;
    try {
      JSON.parse(aiResponse);
      isJson = true;
    } catch (e) {
      console.warn(`[store-calculation-result] AI response for calculationId ${calculationId} is not valid JSON. Skipping detailed processing.`);
    }

    // 2. Se for JSON, invoca a função para processar proventos/descontos.
    if (isJson) {
      console.log(`[store-calculation-result] Invoking process-ai-calculation-json for calculationId: ${calculationId}`);
      const { data: invokeData, error: invokeError } = await supabaseClient.functions.invoke(
        'process-ai-calculation-json',
        {
          body: {
            calculationId: calculationId,
            aiResponseJson: aiResponse, // Passa a string JSON completa
          },
        }
      );

      if (invokeError) {
        console.error('[store-calculation-result] Error invoking process-ai-calculation-json:', invokeError);
        // Continua, mas loga o erro de processamento secundário
      } else {
        console.log('[store-calculation-result] process-ai-calculation-json invoked successfully:', invokeData);
      }
    }

    // 3. Armazena a resposta original (JSON string ou Markdown) na tabela tbl_calculos.
    console.log(`[store-calculation-result] Attempting to update tbl_calculos for calculationId: ${calculationId}`);
    const { error: updateCalculoError } = await supabaseClient
      .from('tbl_calculos')
      .update({
        resposta_ai: aiResponse, // Armazena a string JSON original
      })
      .eq('id', calculationId);

    if (updateCalculoError) {
      console.error('[store-calculation-result] Error updating calculation with AI response:', updateCalculoError);
      return new Response(JSON.stringify({ error: 'Failed to update calculation with AI response', details: updateCalculoError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log(`[store-calculation-result] Successfully updated tbl_calculos for calculationId: ${calculationId}`);
    return new Response(JSON.stringify({ message: 'AI response received, processed (if JSON), and updated successfully in tbl_calculos', calculationId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[store-calculation-result] Error in store-calculation-result Edge Function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});