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
    *   [Fluxo de Trabalho n8n](#fluxo-de-trabalho-n8n)
    *   [Funções Edge (Supabase)](#funções-edge-supabase)
    *   [Implantação do Frontend](#implantação-do-frontend)
    *   [Variáveis de Ambiente](#variáveis-de-ambiente)
    *   [Dependências do Projeto](#dependências-do-projeto)
4.  [Desenvolvimento Local](#4-desenvolvimento-local)
5.  [Contribuindo](#5-contribuindo)
6.  [Licença](#6-licença)

---

## 1. Apresentação Profissional

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

### Fluxo de Trabalho n8n

O fluxo de trabalho n8n é responsável por orquestrar a comunicação entre o frontend, o modelo de IA e o Supabase. Ele recebe os dados do cálculo via webhook, envia para o AI Agent e armazena a resposta no Supabase.

<dyad-write path="src/n8n/calculo_trabalhista_n8n.json" description="Workflow n8n para cálculo trabalhista">
{
  "name": "calculo_trabalhista",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "resumo",
        "options": {
          "allowedOrigins": "*"
        }
      },
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 2.1,
      "position": [
        -272,
        -96
      ],
      "id": "7a34f1c8-6dad-4320-9fed-0c7274e75d1b",
      "name": "Webhook",
      "webhookId": "95378f01-d475-477e-9879-92f3c3b3947f"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://oqiycpjayuzuyefkdujp.supabase.co/functions/v1/store-calculation-result",
        "sendHeaders": false,
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={{ $json.json }}",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [
        592,
        -96
      ],
      "id": "7b0877c1-3475-487b-8c53-d33f8ea3190a",
      "name": "HTTP Request"
    },
    {
      "parameters": {
        "promptType": "define",
        "text": "=Contexto\tCampo\tValor\nEmpresa\tCNPJ\t{{ $json.cnpjEmpresa }}\nCPF Responsável\t{{ $json.cpf_Responsavel_empresa }}\nTrabalhador\tNome\t{{ $json.NomeFuncionario }}\nCPF\t{{ $json.Cpf_Funcionario }}\nFunção\t{{ $json.funcaoFuncionario }}\nContrato\tSalário Base de Cálculo\t{{ $json.salarioTrabalhador }}\nData Início Contrato\t{{ $json.inicioContrato }}\nData Fim Contrato\t{{ $json.Fim_contrato }}\nCTPS Assinada\t{{ $json.ctpsAssinada }}\nTipo Aviso Prévio\t{{ $json.tipoAviso }}\nCarga Horária\t{{ $json.CargaHoraria }}\nPiso Salarial Sindicato\t{{ $json.salarioSindicato }}\nDescontos\tDescontos Médios Informados\t{{ $json.DescontosMedios }}\nOutros/Memória\tObservação Sindicato\t{{ $json.obsSindicato }}\nID Cálculo\t{{ $json.IdCalculo }}\nData do Cálculo\t{{ $json.dataDoCalculo }}\nAcréscimos Médios\t{{ $json.AcrescimosMedios }}",
        "options": {
          "systemMessage": "Você é um agente de cálculo rescisório do Brasil, especialista em direito trabalhista. Sua tarefa é analisar os dados fornecidos e gerar um JSON com a estrutura de 'Verbas_Rescisorias' contendo 'Remuneracao' e 'Descontos'. Para cada item, inclua 'Provento'/'Desconto', 'Cálculo' (com 'Parametro', 'Valor', 'Fórmula_Sugerida'), 'Memoria_de_Calculo', 'Legislação', 'Exemplos_Aplicaveis', 'Natureza_da_Verba'. O 'Valor' deve ser numérico. Inclua apenas proventos e descontos com valor calculado maior que zero, a menos que seja uma verba de irregularidade que deve ser listada mesmo com valor zero para indicar ausência de pagamento. A saída deve ser EXCLUSIVAMENTE um objeto JSON válido, sem qualquer texto adicional ou formatação Markdown fora do JSON. Use os seguintes detalhes para guiar sua resposta:\n\natribuicoes : {{ $json.atribuicoes }}\ncomportamento : {{ $json.comportamento }}\ndescontos : {{ $json.descontos_template}}\nidentificação:{{ $json['identificação'] }}\nleis :{{ $json.leis_templates }}\nbase_legal : {{ $json.base_legal_templates }}\nESPECIALIDADE :{{ $json.title_tempalte }}\nESTRUTURA JSON MODELO SAÍDA: {{ $json.estrutura_json_modelo_saida }}"
        }
      },
      "type": "@n8n/n8n-nodes-langchain.agent",
      "typeVersion": 2.2,
      "position": [
        80,
        -96
      ],
      "id": "d2e364dd-cbb7-4c52-89f9-e37fcd57020d",
      "name": "AI Agent"
    },
    {
      "parameters": {
        "options": {}
      },
      "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
      "typeVersion": 1,
      "position": [
        -96,
        96
      ],
      "id": "87cf375c-8c76-4954-a335-e97928a0a731",
      "name": "Google Gemini Chat Model",
      "credentials": {
        "googlePalmApi": {
          "id": "FlYgz578AkLOeocc",
          "name": "jmoka"
        }
      }
    },
    {
      "parameters": {
        "sessionIdType": "customKey",
        "sessionKey": "Jota1@@jota79",
        "contextWindowLength": 30
      },
      "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
      "typeVersion": 1.3,
      "position": [
        80,
        112
      ],
      "id": "a73f5dd1-5f6a-40ba-b4a2-b8b39708a84b",
      "name": "Simple Memory"
    },
    {
      "parameters": {
        "assignments": {
          "assignments": [
            {
              "id": "41f2da9b-803c-4027-8534-06435ff91873",
              "name": "CargaHoraria",
              "value": "={{ $json.body.body.calculo_carga_horaria }}",
              "type": "string"
            },
            {
              "id": "2bf1d3bb-5475-486b-b242-4f0b197e224f",
              "name": "Cpf_Funcionario",
              "value": "={{ $json.body.body.calculo_cpf_funcionario }}",
              "type": "string"
            },
            {
              "id": "dc7d39ac-9fd9-4652-97ef-41b9c8544a74",
              "name": "dataDoCalculo",
              "value": "={{ $json.body.body.calculo_created_at }}",
              "type": "string"
            },
            {
              "id": "a6bbc027-5fb2-4b9a-bb4a-5f6470113ad4",
              "name": "ctpsAssinada",
              "value": "={{ $json.body.body.calculo_ctps_assinada }}",
              "type": "string"
            },
            {
              "id": "0e43d029-7d70-4aa8-a71a-dafbfdbd7f17",
              "name": "Fim_contrato",
              "value": "={{ $json.body.body.calculo_fim_contrato }}",
              "type": "string"
            },
            {
              "id": "2b60c3c7-4da6-4c3b-a2ea-26b6a4ca2a6c",
              "name": "funcaoFuncionario",
              "value": "={{ $json.body.body.calculo_funcao_funcionario }}",
              "type": "string"
            },
            {
              "id": "f8ad4615-cb4c-48dd-9c6e-f0bd1c70cf22",
              "name": "HistorioCalculo",
              "value": "={{ $json.body.body.calculo_historia }}",
              "type": "string"
            },
            {
              "id": "5fe95c80-7a05-4cd1-8f99-eb6098888fc8",
              "name": "IdCalculo",
              "value": "={{ $json.body.body.calculo_id }}",
              "type": "string"
            },
            {
              "id": "9235c237-33ed-4a0d-b6b0-b6f30a043919",
              "name": "inicioContrato",
              "value": "={{ $json.body.body.calculo_inicio_contrato }}",
              "type": "string"
            },
            {
              "id": "1fd5ee2e-837f-4786-80fb-2fb947f596c7",
              "name": "DescontosMedios",
              "value": "={{ $json.body.body.calculo_media_descontos }}",
              "type": "string"
            },
            {
              "id": "90991da2-9b02-473d-ba26-73765f0539fe",
              "name": "AcrescimosMedios",
              "value": "={{ $json.body.body.calculo_media_remuneracoes }}",
              "type": "string"
            },
            {
              "id": "357fbf6a-4077-4edd-98cb-e2c9f8733a79",
              "name": "NomeFuncionario",
              "value": "={{ $json.body.body.calculo_nome_funcionario }}",
              "type": "string"
            },
            {
              "id": "c280b3c0-4eab-4acf-9747-c899a8c47c3b",
              "name": "obsSindicato",
              "value": "={{ $json.body.body.calculo_obs_sindicato }}",
              "type": "string"
            },
            {
              "id": "ce47f6ac-5664-4b66-bc2b-d328cff08078",
              "name": "salarioSindicato",
              "value": "={{ $json.body.body.calculo_salario_sindicato }}",
              "type": "string"
            },
            {
              "id": "2bf9d94e-8bc0-4d3e-9b32-e5212743765d",
              "name": "salarioTrabalhador",
              "value": "={{ $json.body.body.calculo_salario_trabalhador }}",
              "type": "string"
            },
            {
              "id": "8ecfe1dc-b3d9-4f10-99df-5d884b143fcc",
              "name": "tipoAviso",
              "value": "={{ $json.body.body.calculo_tipo_aviso }}",
              "type": "string"
            },
            {
              "id": "ffd28b2e-c868-44d5-b360-f00c52e1497c",
              "name": "cnpjEmpresa",
              "value": "={{ $json.body.body.cliente_cnpj }}",
              "type": "string"
            },
            {
              "id": "a9d23bfe-5c24-44f2-bc6f-3ca10644bd26",
              "name": "cpf_Responsavel_empresa",
              "value": "={{ $json.body.body.cliente_cpf_responsavel }}",
              "type": "string"
            },
            {
              "id": "c0c298fa-3c1b-4d8b-a51c-da5d817634db",
              "name": "cpf?",
              "value": "={{ $json.body.body.cliente_cpf }}",
              "type": "string"
            },
            {
              "id": "473dff85-8431-4ba9-a8f3-004c6c9c17a3",
              "name": "nome_cliente",
              "value": "={{ $json.body.body.cliente_nome }}",
              "type": "string"
            },
            {
              "id": "cac35fb1-e53e-4869-b6e3-aaf011496bcb",
              "name": "responsavel_empresa",
              "value": "={{ $json.body.body.cliente_responsavel }}",
              "type": "string"
            },
            {
              "id": "55bb625a-e80d-4c09-b875-9d74f1ce16c6",
              "name": "atribuicoes",
              "value": "={{ $json.body.body.ai_template_atribuicoes }}",
              "type": "string"
            },
            {
              "id": "ea3dce2c-f7da-4480-a776-1a187eb7e3de",
              "name": "comportamento",
              "value": "={{ $json.body.body.ai_template_comportamento }}",
              "type": "string"
            },
            {
              "id": "17c1de58-3033-4104-b6b4-98be23bde75b",
              "name": "descontos_template",
              "value": "={{ $json.body.body.ai_template_descontos }}",
              "type": "string"
            },
            {
              "id": "8c980633-245e-49cd-b96f-b477b91b1785",
              "name": "estrutura_json_modelo_saida",
              "value": "={{ $json.body.body.ai_template_estrutura_json_modelo_saida }}",
              "type": "string"
            },
            {
              "id": "8eb81960-7924-451c-a49b-4e60599262c4",
              "name": "instrucoes_entrada_dados_rescisao",
              "value": "={{ $json.body.body.ai_template_instrucoes_entrada_dados_rescisao }}",
              "type": "string"
            },
            {
              "id": "2cbe6dba-4e3f-4b08-85d2-fb711e29bd53",
              "name": "rodape_template",
              "value": "={{ $json.body.body.ai_template_formatacao_texto_rodape }}",
              "type": "string"
            },
            {
              "id": "342c93d3-07ed-4e2c-a8c6-5edaab66a50f",
              "name": "identificação",
              "value": "={{ $json.body.body.ai_template_identificacao }}",
              "type": "string"
            },
            {
              "id": "9cee148e-37d2-4426-a21a-60edba476a33",
              "name": "leis_templates",
              "value": "={{ $json.body.body.ai_template_leis }}",
              "type": "string"
            },
            {
              "id": "c53daeb0-f02f-4d57-899e-9bf361ba6f9f",
              "name": "base_legal_templates",
              "value": "={{ $json.body.body.ai_template_observacoes_base_legal }}",
              "type": "string"
            },
            {
              "id": "4fd4b9a9-d172-40e6-b3dd-f3f26e5a4719",
              "name": "title_tempalte",
              "value": "={{ $json.body.body.ai_template_title }}",
              "type": "string"
            },
            {
              "id": "d9a25452-e54e-40d1-bfd6-d3a8c36cd73e",
              "name": "",
              "value": "",
              "type": "string"
            }
          ]
        },
        "options": {}
      },
      "type": "n8n-nodes-base.set",
      "typeVersion": 3.4,
      "position": [
        -96,
        -96
      ],
      "id": "609ec50a-3bf8-43fe-aaaf-584ce307e19f",
      "name": "Edit Fields"
    },
    {
      "parameters": {
        "jsCode": "// Obtém os dados dos nós anteriores\nconst idCalculo = $json.IdCalculo; // O valor deve estar no item anterior que você está processando\nconst aiResponse = $('AI Agent').item.json.output;\n\n// Cria o objeto de dados garantindo que aiResponse é uma string escapada\nconst body = {\n  calculationId: idCalculo,\n  aiResponse: aiResponse // aiResponse deve ser a string JSON gerada pela IA\n};\n\n// Retorna o objeto (O n8n o transformará em JSON para o nó HTTP Request)\nreturn [{ json: body }];"
      },
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        384,
        -96
      ],
      "id": "67982a01-bdf4-4786-b7b4-19592820ce89",
      "name": "Code in JavaScript"
    }
  ],
  "pinData": {
    "Webhook": [
      {
        "json": {
          "headers": {
            "host": "jota-empresas-n8n.ubjifz.easypanel.host",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
            "content-length": "14402",
            "accept": "*/*",
            "accept-encoding": "gzip, deflate, br, zstd",
            "accept-language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json",
            "origin": "http://localhost:8080",
            "priority": "u=1, i",
            "referer": "http://localhost:8080/",
            "sec-ch-ua": "\"Chromium\";v=\"140\", \"Not=A?Brand\";v=\"24\", \"Google Chrome\";v=\"140\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"Windows\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "cross-site",
            "x-forwarded-for": "45.176.47.39",
            "x-forwarded-host": "jota-empresas-n8n.ubjifz.easypanel.host",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https",
            "x-forwarded-server": "c33a9392550e",
            "x-real-ip": "45.176.47.39"
          },
          "params": {},
          "query": {},
          "body": {
            "body": {
              "calculo_carga_horaria": "08:00 as 12 e de 14:00 as 18",
              "calculo_cpf_funcionario": "657982112300",
              "calculo_created_at": "2025-10-04T15:20:40.455495+00:00",
              "calculo_ctps_assinada": null,
              "calculo_fim_contrato": "2025-10-01",
              "calculo_funcao_funcionario": "AÇOUGUEIRO",
              "calculo_historia": "mandou o funcionario esperar em casa o aviso e não deu nada para assinar",
              "calculo_ai_template_id": "4763eeea-1715-44f6-8265-d2ac3d5dabca",
              "calculo_id": "40cb4015-6ac3-4e19-8fcb-bf8784bea1b2",
              "calculo_inicio_contrato": "2023-11-01",
              "calculo_media_descontos": 33,
              "calculo_media_remuneracoes": null,
              "calculo_nome_funcionario": "JOÃO LUIZ SILVA TAVARES teste",
              "calculo_obs_sindicato": "cesta basica valor de 150 por mes",
              "calculo_salario_sindicato": 1600,
              "calculo_resposta_ai": "Jota Contabilidade\n\n## Relatório de Cálculo de Rescisão de Contrato de Trabalho por Prazo Determinado\n\n**Agente de Cálculo Rescisório do Brasil, Professor e Doutor em Direito Trabalhista**\n\nID Cálculo: 40cb4015-6ac3-4e19-8fcb-bf8784bea1b2\nData do Cálculo: 2025-10-04\n\n## DADOS DA RESCISÃO\n\n| **Campo** | **Detalhe** |\n| :--- | :--- |\
| **Nome do Trabalhador** | JOÃO LUIZ SILVA TAVARES teste |\n| **CPF do Trabalhador** | 657982112300 |\n| **Função** | AÇOUGUEIRO |\n| **CNPJ do Empregador** | 23.802.364/0001-90 |\n| **Data Início Contrato** | 2023-11-01 |\n| **Data Fim Contrato** | 2025-10-01 |\n| **Duração do Contrato** | 1 ano, 11 meses e 1 dia |\n| **Tipo de Rescisão** | Término Natural de Contrato por Prazo Determinado |\n| **Salário Base Contratual** | R$ 1.500,00 |\n| **Piso Salarial Sindicato** | R$ 1.600,00 |\n| **Remuneração Base para Cálculo** | R$ 1.750,00 (Piso Salarial + Cesta Básica) |\n| **CTPS Assinada** | Sim (Presumido) |\n\nRESUMO FINANCEIRO\n\n#### PROVENTOS\n\n| **Verba Rescisória** | **Base de Cálculo** | **Valor (R$)** |\n| :--- | :--- | :--- |\
| Saldo de Salário (1 dia de Outubro/2025) | R$ 1.750,00 / 30 * 1 | 58,33 |\n| 13º Salário Proporcional (9/12 avos) | (R$ 1.750,00 / 12) * 9 | 1.312,50 |\n| Férias Vencidas (2023-11-01 a 2024-10-31) | R$ 1.750,00 | 1.750,00 |\n| Adicional 1/3 Férias Vencidas | R$ 1.750,00 / 3 | 583,33 |\n| Férias Proporcionais (11/12 avos) | (R$ 1.750,00 / 12) * 11 | 1.604,17 |\n| Adicional 1/3 Férias Proporcionais | (R$ 1.604,17 / 3) | 534,72 |\n| Multa de 40% sobre o Saldo do FGTS¹ | R$ 3.220,00 (FGTS Estimado) * 0,40 | 1.288,00 |\n| **TOTAL BRUTO** | | **7.131,05** |\n\n#### DESCONTOS\n\n| **Desconto** | **Base de Cálculo** | **Valor (R$)** |\n| :--- | :--- | :--- |\
| INSS sobre Saldo de Salário | R$ 58,33 * 7,5% | 4,37 |\n| INSS sobre 13º Salário Proporcional | R$ 1.312,50 * 7,5% | 98,44 |\n| IRRF sobre Verbas Remuneratórias² | (R$ 3.412,50 * 15%) - R$ 370,40 | 141,47 |\n| Outros Descontos Informados | | 33,00 |\n| **TOTAL DE DESCONTOS** | | **277,28** |\n\n## VALOR LÍQUIDO A RECEBER\n# **R$ 6.853,77**\n\n### OBSERVAÇÕES E BASE LEGAL\n\n1.  **Base Legal Geral:** Cálculo realizado em conformidade com o Decreto-Lei nº 5.452/43 (Consolidação das Leis do Trabalho - CLT), Constituição Federal de 1988 (Art. 7º) e legislação complementar pertinente.\n2.  **Remuneração Base:** O salário de cálculo foi ajustado para R$ 1.600,00, conforme o Piso Salarial do Sindicato, que é superior ao salário contratual de R$ 1.500,00. A Cesta Básica no valor de R$ 150,00 por mês foi integrada à remuneração para fins de cálculo de verbas rescisórias, por ter natureza salarial, totalizando R$ 1.750,00 como remuneração base para os cálculos de férias, 13º salário e FGTS (Jurisprudência consolidada, como Súmula 209 do TST - embora a natureza da cesta básica possa ser discutida em CCT, presume-se salarial na ausência de prova em contrário).\n3.  **Observação CTPS:** Presume-se que a Carteira de Trabalho e Previdência Social (CTPS) esteja devidamente assinada. Caso contrário, é fundamental que o empregador regularize o vínculo empregatício e realize o recolhimento de todos os encargos devidos, sob pena de infração à CLT (Art. 29).\n4.  **Observação FGTS:** O valor da multa de 40% do FGTS (Lei nº 8.036/90) apresentado é uma estimativa baseada nos depósitos mensais sobre a remuneração base. O valor final a ser liberado para saque será calculado sobre o saldo atualizado de todos os depósitos na conta vinculada do trabalhador.\n5.  **Término de Contrato por Prazo Determinado:** Por se tratar de término natural de contrato por prazo determinado, não há aviso prévio a ser cumprido ou indenizado (CLT, Art. 478). O seguro-desemprego **não** é devido nesta modalidade de rescisão, conforme Lei nº 7.998/90.\n6.  **IRRF (Imposto de Renda Retido na Fonte):** O cálculo do IRRF segue a tabela progressiva vigente para o ano de 2025, considerando as deduções legais aplicáveis. As férias indenizadas (terço constitucional) são isentas de Imposto de Renda, conforme Art. 6º, V da Lei nº 7.713/88.\n\nAtenciosamente, Jota Contabilidade",
              "calculo_salario_trabalhador": 1500,
              "calculo_tipo_aviso": "rescisao_sem_justa_causa",
              "cliente_cnpj": "23.802.364/0001-90",
              "cliente_cpf_responsavel": "00429988249",
              "cliente_cpf": null,
              "cliente_created_at": "2025-10-04T09:49:26.319698+00:00",
              "cliente_user_id": "10599047-4bb5-4003-9319-773476a44ef0",
              "cliente_id": "5fc9a0fb-fbe5-4b42-b459-0589a4710274",
              "cliente_nome": "BARÉ",
              "cliente_responsavel": "J COSME",
              "cliente_tipo_empregador": "Empresa",
              "ai_template_atribuicoes": "-especialista em direito trabalhista\n-especialista na consolidação das leis trabalhistas\n-especialista em cada sindicado e seus dissídios\n-phd em leis trabalhistas\n-professor de cálculo trabalhista e rescisões",
              "ai_template_comportamento": "-cordialmente profissional\n-resposta precisa, **metódica e embasada na CLT**, **Jurisprudências já proferidas** e no **direito trabalhistas**\n-conhecedor do assunto e de toda a legislação trabalhista (CLT, jurisprudência, CCTs/Dissídios)
-extremamente metódico
-**A saída final deve ser formatada EXCLUSIVAMENTE** no formato JSON, seguindo a estrutura detalhada em 'Estrutura JSON Modelo Saída'.",
              "ai_template_created_at": "2025-10-04T12:28:52.803822+00:00",
              "ai_template_descontos": "caso esteja sem carteira assinada não desconta nada , caso não descontar , inss, ir se for o caso",
              "ai_template_estrutura_json_modelo_saida": "{\n  \"Verbas_Rescisorias\": {\n    \"Remuneracao\": [\n      {\n        \"Provento\": \"string\",\n        \"Cálculo\": {\n          \"Parametro\": \"string\",
          \"Valor\": \"number\",
          \"Fórmula_Sugerida\": \"string\"
        },\n        \"Memoria_de_Calculo\": \"string\",
        \"Legislação\": \"string\",
        \"Exemplos_Aplicaveis\": \"string\",
        \"Natureza_da_Verba\": \"string\"
      }\n    ],\n    \"Descontos\": [\n      {\n        \"Desconto\": \"string\",
        \"Cálculo\": {\n          \"Parametro\": \"string\",
          \"Valor\": \"number\",
          \"Fórmula_Sugerida\": \"string\"
        },\n        \"Memoria_de_Calculo\": \"string\",
        \"Legislação\": \"string\",
        \"Exemplos_Aplicaveis\": \"string\",
        \"Natureza_da_Verba\": \"string\"
      }\n    ]\n  }\n}",
              "ai_template_instrucoes_entrada_dados_rescisao": "",
              "ai_template_formatacao_texto_rodape": "- Inclua a saudação final (\"Atenciosamente, [Jota Contabilidade]\").",
              "ai_template_identificacao": "-agente de cálculo rescisório do brasil\n-o agente especialista em cálculo rescisório do brasil\n-professor de direito trabalhista do brasil\n-mestre em direito trabalhista do brasil\n-phd em direito trabalhista do brasil\n- doutor em direito trabalhista do brasil",
              "ai_template_leis": "- calcular sempre a diferença de salário exigido pelo sindicato e relação ao recebido pelo trabalhador durante o período de trabalho
A Lei Principal: Consolidação das Leis do Trabalho (CLT)
O núcleo de toda a legislação trabalhista brasileira é a Consolidação das Leis do Trabalho (CLT), aprovada pelo Decreto-Lei nº 5.452, de 1º de maio de 1943.A CLT é a principal fonte de regras que define e regulamenta a relação de emprego individual e coletiva, abrangendo temas como:\nRegistro e Documentação: Obrigatoriedade da Carteira de Trabalho e Previdência Social (CTPS), hoje majoritariamente digital.\nContrato de Trabalho: Tipos de contrato (prazo determinado, indeterminado, intermitente, etc.) e condições.\nJornada de Trabalho: Limites diários e semanais (geralmente 8 horas diárias e 44 semanais), horas extras e regime de turnos.\nRemuneração: Salário mínimo, equiparação salarial e descontos.\nFérias: Direito, período de concessão e pagamento.\nSegurança e Medicina do Trabalho: Normas de saúde e segurança (as NRs - Normas Regulamentadoras, que se baseiam na CLT).\nProteção ao Trabalho: Regras para o trabalho da mulher, do menor e do aprendiz.\nRescisão do Contrato: Tipos de demissão (justa causa, sem justa causa, pedido de demissão, etc.) e verbas rescisórias.\nDireito Coletivo: Sindicatos, acordos e convenções coletivas de trabalho.\n\n2. Norma Máxima: Constituição Federal de 1988\nAcima da CLT, a Constituição da República Federativa do Brasil (CF/88) estabelece os direitos sociais básicos dos trabalhadores no seu Artigo 7º. Qualquer lei infraconstitucional (como a CLT) deve respeitar esses direitos.\nDireitos constitucionais incluem:\nSalário mínimo.\nDécimo terceiro salário (Lei nº 4.090/62).\nFundo de Garantia por Tempo de Serviço (FGTS).\nSeguro-desemprego (Lei nº 7.998/90).\nFérias anuais remuneradas com, no mínimo, um terço a mais.\nLicença-maternidade e licença-paternidade.\nProteção contra a despedida arbitrária ou sem justa causa (multa de 40% do FGTS).\n\n3. Leis Específicas e Complementares\nAlém da CLT, diversas leis e normas tratam de relações de trabalho específicas ou detalham direitos e obrigações:\nLegislação\nNúmero\nFinalidade\nLei do Aviso Prévio\nLei nº 12.506/2011\nRegulamenta o acréscimo de 3 dias por ano de serviço ao aviso prévio.\nLei da Terceirização\nLei nº 13.429/2017\nDisciplina o trabalho temporário e a terceirização de todas as atividades.\nLei do Trabalho Doméstico\nLei Complementar nº 150/2015\nGarante direitos específicos (como FGTS obrigatório, seguro-desemprego, etc.) aos empregados domésticos.\nLei do Estágio\nLei nº 11.788/2008\nDefine as regras para a contratação de estagiários (que não gera vínculo empregatício CLT).\nLei da Aprendizagem\nLei nº 10.097/2000\nRegulamenta a contratação de jovens aprendizes.\nLei do PIS/PASEP\nLei nº 7.998/90\nDefine o programa de Abono Salarial (PIS/PASEP) e o seguro-desemprego.\nNormas Regulamentadoras (NRs)\nPortarias do Ministério do Trabalho\nConjunto de regras que detalham as obrigações de segurança e saúde no trabalho (NR 7, NR 9, etc.).",
              "ai_template_observacoes_base_legal": "Base Legal Geral	Cálculo realizado em conformidade com o Decreto-Lei nº 5.452/43 (Consolidação das Leis do Trabalho - CLT) e legislação complementar.\nObservação CTPS	Se a CTPS não estiver assinada ({{ $json.ctpsAssinada }} seja \"não\" ou nulo), é fundamental cobrar o reconhecimento do vínculo e o recolhimento de todo o FGTS não depositado.\nObservação Sindicato	O campo {{ $json.obsSindicato }} deve ser analisado para verificar se representa algum débito, crédito ou informação relevante para o cálculo final, conforme a convenção coletiva.\nObservação FGTS	O saldo do FGTS a ser liberado para saque será o valor acumulado na conta vinculada, acrescido da multa de 40% paga pelo empregador.\nAviso Geral	Este é um cálculo simulado com base nos dados fornecidos. Os valores podem variar dependendo das especificidades do contrato de trabalho e da convenção coletiva.",
              "ai_template_proventos": "Saldo de Salário	Fórmula: (Salário Base de Cálculo / 30) * dias trabalhados no mês da rescisão.\nAviso Prévio Indenizado	Calculado com base na Lei nº 12.506/2011 (30 dias + 3 dias por ano de serviço), utilizando as datas de {{ $json.inicioContrato }} e {{ $json.inicioContrato }}.\n13º Salário Proporcional	Fórmula: (Acréscimos Médios / 12) * meses trabalhados no ano (considerando a projeção do aviso prévio).\nFérias Proporcionais	Fórmula: (Salário Base de Cálculo / 12) * meses do período aquisitivo (considerando a projeção do aviso prévio).\nINSS	Incide sobre o Saldo de Salário e o 13º Salário, conforme tabelas vigentes. Verbas indenizatórias não possuem incidência de INSS.\nMulta de 40% do FGTS	O saldo de FGTS é estimado com base nos depósitos de 8% sobre a remuneração durante o período do contrato. A multa de 40% incide sobre este total, caso não tenha a ctps assinada\nDiferença de salário entre salario estipulado pelo sindicato e salario recebido , calcular a diferença entre o perio trabalhado\nFgts – valor do fgts , caso não tenha a ctps assinada",
              "ai_template_restricoes": "-não inventa dados ou verbas\n-segue estritamente a lei (CLT, Leis Complementares e Convenções Coletivas de Trabalho)\n-**NUNCA DEVE USAR FORMATO XML OU ESTRUTURAS DE CÓDIGO BRUTA** como saída final, apenas o JSON solicitado.",
              "ai_template_title": "PHD em Cálculo Trabalhista",
              "sindicato_created_at": "2025-10-04T01:53:19.127222+00:00",
              "sindicato_data_final": "2025-10-01",
              "sindicato_data_inicial": "2025-10-01",
              "sindicato_id": "1965a6d8-c7c3-449a-9843-23caef41b3e1",
              "sindicato_mes_convencao": "janeiro",
              "sindicato_nome": "Básico",
              "sindicato_resumo_dissidio": "tem direiro a cesta basica no valor de 100 reais",
              "sindicato_url_documento_sindicato": null
            }
          },
          "webhookUrl": "https://jota-empresas-n8n.ubjifz.easypanel.host/webhook-test/resumo",
          "executionMode": "test"
        }
      }
    ]
  },
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Edit Fields",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Gemini Chat Model": {
      "ai_languageModel": [
        [
          {
            "node": "AI Agent",
            "type": "ai_languageModel",
            "index": 0
          }
        ]
      ]
    },
    "Simple Memory": {
      "ai_memory": [
        [
          {
            "node": "AI Agent",
            "type": "ai_memory",
            "index": 0
          }
        ]
      ]
    },
    "AI Agent": {
      "main": [
        [
          {
            "node": "Code in JavaScript",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Edit Fields": {
      "main": [
        [
          {
            "node": "AI Agent",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Code in JavaScript": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "HTTP Request": {
      "main": [
        []
      ]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1"
  },
  "versionId": "f7bdebf4-1074-4f22-83ae-029917d2d15e",
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "798aeff1915f045ba9e0dd8d8fe3ecd53ff2dc02669c1f1c295f61e0943a66db"
  },
  "id": "HzxXQ1jASxKx50N8",
  "tags": []
}