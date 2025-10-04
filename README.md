# Especificação de Projeto: App de Rescisão Trabalhista (Calculadora Jurídica)

## 1. Apresentação do Sistema
Este aplicativo web, denominado "Calculadora Jurídica", foi desenvolvido para auxiliar advogados, contadores e outros profissionais do direito a gerenciar clientes e realizar cálculos de rescisões trabalhistas de forma eficiente. Ele oferece uma interface intuitiva para inserção de dados detalhados de funcionários e contratos, integração com sistemas externos via webhooks e a capacidade de gerar resumos de cálculos em formatos TXT, PDF e CSV.

## 2. Objetivo Geral
Criar um aplicativo web robusto e seguro utilizando React e Supabase, permitindo que usuários autenticados gerenciem clientes, sindicatos e insiram dados detalhados para o cálculo de rescisões trabalhistas. O sistema foca na coleta de dados estruturada, persistência segura e integração flexível com lógicas de cálculo externas (via webhooks) e geração de documentos.

## 3. Tecnologias & Arquitetura
*   **Frontend**: React (com componentes funcionais e hooks).
*   **Estilização**: Tailwind CSS (para design responsivo e ágil) e Shadcn/ui (componentes pré-construídos).
*   **Banco de Dados & Autenticação**: Supabase (PostgreSQL para dados, Auth para gerenciamento de usuários, Storage para arquivos).
*   **Geração de PDF**: `jspdf` e `html2canvas` (para gerar documentos PDF no lado do cliente com base na renderização HTML).
*   **Roteamento**: React Router DOM.
*   **Gerenciamento de Estado**: Context API (para autenticação).
*   **Cores Principais**: Preto (`#000000`) e Laranja Vibrante (`#FF4500` ou similar).

## 4. Estrutura do Banco de Dados (Supabase Schema)
O banco de dados é modelado com as seguintes tabelas e relacionamentos. Todas as tabelas incluem a coluna padrão `created_at` (TIMESTAMP WITH TIME ZONE DEFAULT NOW()) e possuem Row Level Security (RLS) habilitada para garantir a segurança dos dados.

### Tabela: `public.profiles`
Função: Armazenar informações de perfil do usuário.
```sql
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS (REQUIRED for security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create secure policies for each operation
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE TO authenticated USING (auth.uid() = id);
```

### Tabela: `tbl_clientes`
Função: Armazenar informações do empregador/cliente que está solicitando o cálculo.
```sql
-- Create table
CREATE TABLE tbl_clientes (
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

-- Enable RLS (REQUIRED)
ALTER TABLE tbl_clientes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tbl_clientes
CREATE POLICY "Clientes podem ver apenas seus próprios clientes" ON tbl_clientes
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Clientes podem inserir seus próprios clientes" ON tbl_clientes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clientes podem atualizar seus próprios clientes" ON tbl_clientes
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Clientes podem deletar seus próprios clientes" ON tbl_clientes
FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### Tabela: `tbl_sindicatos`
Função: Armazenar informações sindicais que podem afetar o cálculo.
```sql
-- Create table
CREATE TABLE tbl_sindicatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  data_inicial DATE,
  data_final DATE,
  mes_convencao TEXT,
  url_documento_sindicato TEXT,
  resumo_dissidio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE tbl_sindicatos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tbl_sindicatos
CREATE POLICY "Sindicatos podem ser lidos por autenticados" ON tbl_sindicatos
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Sindicatos podem ser inseridos por autenticados" ON tbl_sindicatos
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Sindicatos podem ser atualizados por autenticados" ON tbl_sindicatos
FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Sindicatos podem ser deletados por autenticados" ON tbl_sindicatos
FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
```

### Tabela: `tbl_ai_prompt_templates`
Função: Armazenar modelos de prompt de IA personalizados por usuário.
```sql
-- Create table
CREATE TABLE tbl_ai_prompt_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Enable RLS (REQUIRED)
ALTER TABLE tbl_ai_prompt_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tbl_ai_prompt_templates
CREATE POLICY "Users can only see their own AI prompt templates" ON tbl_ai_prompt_templates
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own AI prompt templates" ON tbl_ai_prompt_templates
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own AI prompt templates" ON tbl_ai_prompt_templates
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own AI prompt templates" ON tbl_ai_prompt_templates
FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### Tabela: `tbl_calculos`
Função: Armazenar os dados específicos de um cálculo de rescisão de um funcionário, incluindo a resposta da IA e a referência ao modelo de prompt utilizado.
```sql
-- Create table
CREATE TABLE tbl_calculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES tbl_clientes(id) ON DELETE CASCADE NOT NULL,
  sindicato_id UUID REFERENCES tbl_sindicatos(id) ON DELETE SET NULL,
  nome_funcionario TEXT NOT NULL,
  cpf_funcionario TEXT,
  funcao_funcionario TEXT,
  inicio_contrato DATE NOT NULL,
  fim_contrato DATE NOT NULL,
  tipo_aviso TEXT NOT NULL,
  salario_sindicato NUMERIC DEFAULT 0,
  salario_trabalhador NUMERIC DEFAULT 0,
  obs_sindicato TEXT,
  historia TEXT,
  ctps_assinada BOOLEAN DEFAULT FALSE,
  media_descontos NUMERIC DEFAULT 0,
  media_remuneracoes NUMERIC DEFAULT 0,
  carga_horaria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resposta_ai TEXT,
  ai_template_id UUID REFERENCES tbl_ai_prompt_templates(id) ON DELETE SET NULL
);

-- Enable RLS (REQUIRED)
ALTER TABLE tbl_calculos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tbl_calculos
CREATE POLICY "Calculos podem ser vistos apenas pelos donos dos clientes" ON tbl_calculos
FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM tbl_clientes WHERE ((tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid()))));

CREATE POLICY "Calculos podem ser inseridos apenas pelos donos dos clientes" ON tbl_calculos
FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM tbl_clientes WHERE ((tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid()))));

CREATE POLICY "Calculos podem ser atualizados apenas pelos donos dos clientes" ON tbl_calculos
FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM tbl_clientes WHERE ((tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid()))));

CREATE POLICY "Calculos podem ser deletados apenas pelos donos dos clientes" ON tbl_calculos
FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM tbl_clientes WHERE ((tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid()))));
```

### Tabela: `tbl_resposta_calculo`
Função: Armazenar detalhes adicionais da resposta gerada pela lógica de cálculo ou por um modelo de IA, como URLs de documentos PDF e texto extraído. A resposta principal da IA (`resposta_ai`) é armazenada diretamente em `tbl_calculos`.
```sql
-- Create table
CREATE TABLE tbl_resposta_calculo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calculo_id UUID REFERENCES tbl_calculos(id) ON DELETE CASCADE NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  url_documento_calculo TEXT,
  texto_extraido TEXT
);

-- Enable RLS (REQUIRED)
ALTER TABLE tbl_resposta_calculo ENABLE ROW LEVEL SECURITY;

-- Adicionar restrição UNIQUE para permitir UPSERTs na função Edge
ALTER TABLE public.tbl_resposta_calculo
ADD CONSTRAINT unique_calculo_id UNIQUE (calculo_id);

-- RLS Policies for tbl_resposta_calculo
CREATE POLICY "Respostas de calculo podem ser vistas apenas pelos donos dos ca" ON tbl_resposta_calculo
FOR SELECT TO authenticated USING (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_resposta_calculo.calculo_id) AND (cl.user_id = auth.uid()))));

CREATE POLICY "Respostas de calculo podem ser inseridas apenas pelos donos dos" ON tbl_resposta_calculo
FOR INSERT TO authenticated WITH CHECK (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_resposta_calculo.calculo_id) AND (cl.user_id = auth.uid()))));

CREATE POLICY "Respostas de calculo podem ser atualizadas apenas pelos donos d" ON tbl_resposta_calculo
FOR UPDATE TO authenticated USING (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_resposta_calculo.calculo_id) AND (cl.user_id = auth.uid()))));

CREATE POLICY "Respostas de calculo podem ser deletadas apenas pelos donos dos" ON tbl_resposta_calculo
FOR DELETE TO authenticated USING (EXISTS ( SELECT 1 FROM (tbl_calculos c JOIN tbl_clientes cl ON ((c.cliente_id = cl.id))) WHERE ((c.id = tbl_resposta_calculo.calculo_id) AND (cl.user_id = auth.uid()))));
```

### Tabela: `tbl_webhook_configs`
Função: Armazenar as configurações de webhooks para cada usuário.
```sql
-- Create table
CREATE TABLE tbl_webhook_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  table_name TEXT NOT NULL,
  selected_fields TEXT[] NOT NULL,
  webhook_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE tbl_webhook_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tbl_webhook_configs
CREATE POLICY "Users can only see their own webhook configs" ON tbl_webhook_configs
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own webhook configs" ON tbl_webhook_configs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own webhook configs" ON tbl_webhook_configs
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own webhook configs" ON tbl_webhook_configs
FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

### Funções SQL (PostgreSQL)

#### Função: `public.handle_new_user()`
Função para criar automaticamente um perfil público para novos usuários autenticados.
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  );
  RETURN new;
END;
$$;

-- Trigger the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## 5. Requisitos de Frontend (React)

### 5.1. Autenticação
*   **Página de Login/Cadastro (`/auth`)**: Utiliza `@supabase/auth-ui-react` com tema escuro e cores vibrantes de laranja.
*   **Proteção de Rotas**: `PrivateRoute` garante que apenas usuários autenticados acessem rotas protegidas, redirecionando para `/auth` caso contrário.
*   **Contexto de Autenticação (`AuthContext`)**: Gerencia o estado do usuário globalmente, incluindo login, cadastro e logout.

### 5.2. Layout Principal
*   **`MainLayout`**: Componente de layout principal com um `Sidebar` responsivo (menu lateral para desktop, sheet para mobile).
*   **Cores**: Predominância de preto e laranja vibrante para uma experiência de usuário moderna e consistente.

### 5.3. Dashboard (`/dashboard`)
*   Exibe um resumo rápido de métricas importantes (ex: total de clientes).
*   Botões de acesso rápido para as principais funcionalidades: "Adicionar Cliente", "Iniciar Novo Cálculo", "Ver Todos os Clientes", "Ver Todos os Cálculos", "Gerenciar Sindicatos", "Gerenciar Webhooks" e "Gerenciar Modelos IA".

### 5.4. Gerenciamento de Clientes
*   **Lista de Clientes (`/clients`)**: Exibe todos os clientes cadastrados pelo usuário, com opções para "Adicionar Cliente", "Editar" e "Excluir" (com confirmação via `AlertDialog`).
*   **Formulário de Cliente (`/clients/new` ou `/clients/:id`)**: Permite criar um novo cliente ou editar um existente. Inclui campos como Nome/Razão Social, CPF, CNPJ, Tipo de Empregador (dropdown), Nome do Responsável e CPF do Responsável.

### 5.5. Gerenciamento de Sindicatos
*   **Lista de Sindicatos (`/sindicatos`)**: Exibe todos os sindicatos cadastrados (visíveis para todos os usuários), com opções para "Adicionar Sindicato", "Editar" e "Excluir" (com confirmação).
*   **Formulário de Sindicato (`/sindicatos/new` ou `/sindicatos/:id`)**: Permite criar ou editar um sindicato. Campos incluem Nome do Sindicato, Data Inicial/Final do Acordo, Mês da Convenção, URL do Documento do Sindicato e Resumo do Dissídio.

### 5.6. Gerenciamento de Cálculos
*   **Lista de Cálculos (`/calculations`)**:
    *   Exibe todos os cálculos de rescisão criados pelo usuário.
    *   Opções para "Novo Cálculo", "Editar", "Ver Resultado" e "Excluir" (com confirmação).
    *   **Envio para Webhook**: Um botão "Enviar" que abre um modal para selecionar um ou mais webhooks configurados (para `tbl_calculos` ou `all_tables`) antes de enviar os dados do cálculo.
    *   **Status do Webhook**: O status do cálculo é atualizado com base na `resposta_ai`.
        *   `Enviando...`: Exibido enquanto o cálculo está sendo enviado para o(s) webhook(s).
        *   `Aguardando Resposta...`: Exibido após o envio, durante o período de espera pela resposta da IA.
        *   `Concluído`: Exibido quando a `resposta_ai` é recebida e salva no banco de dados.
        *   Um botão "Processar" é exibido se o cálculo não estiver concluído e não estiver em processo de envio/espera, permitindo ao usuário recarregar a página para verificar o status.
*   **Formulário de Cálculo (`/calculations/new` ou `/calculations/:id`)**: Permite criar ou editar um cálculo. Inclui campos para Cliente (dropdown), Sindicato (dropdown), **Modelo de Prompt IA (dropdown)**, detalhes do Funcionário (Nome, CPF, Função, Carga Horária), datas de Início/Fim do Contrato, Tipo de Rescisão (dropdown), Salário Sindicato, Salário do Trabalhador, Observações Sindicato, Histórico do Contrato, CTPS Assinada (checkbox) e Médias de Descontos/Remunerações.
*   **Página de Resultado do Cálculo (`/calculations/:id/result`)**: Exibe os detalhes do cálculo e a resposta gerada pelo webhook. A `resposta_ai` é buscada diretamente de `tbl_calculos`. Outros detalhes como `url_documento_calculo` e `texto_extraido` são buscados de `tbl_resposta_calculo`. Inclui botões para download da `resposta_ai` como **CSV, PDF e TXT**, se disponível.

### 5.7. Configurações de Webhooks (`/webhooks`)
*   **Lista de Webhooks**: Exibe todas as configurações de webhook do usuário, com opções para "Novo Webhook", "Editar" e "Excluir" (com confirmação).
*   **Formulário de Webhook**: Permite criar ou editar uma configuração de webhook. Campos incluem:
    *   **Título do Webhook**: Um nome descritivo.
    *   **Tabela**: Dropdown para selecionar a tabela a ser monitorada (`tbl_clientes`, `tbl_calculos`, `tbl_sindicatos`, `tbl_ai_prompt_templates` ou `TODOS (Todos os Campos)`).
    *   **Campos Selecionados**: Um seletor de múltiplos itens que lista dinamicamente os campos disponíveis da tabela selecionada.
    *   **URL do Webhook**: O endpoint para onde os dados serão enviados.

### 5.8. Gerenciamento de Modelos de Prompt IA (`/ai-templates`)
*   **Lista de Modelos de Prompt IA**: Exibe todos os modelos de prompt de IA cadastrados pelo usuário, com opções para "Novo Modelo", "Editar" e "Excluir" (com confirmação).
*   **Formulário de Modelo de Prompt IA**: Permite criar ou editar um modelo. Inclui campos para Título, Identificação, Comportamento, Restrições, Atribuições, Leis, Proventos, Descontos, Observações e Base Legal, e campos de formatação de texto (Cabeçalho, Corpo, Rodapé).

### 5.9. Utilidades
*   `src/utils/toast.ts`: Funções para exibir notificações de sucesso, erro e carregamento.
*   `src/utils/supabaseDataExtraction.ts`: Função auxiliar para extrair valores de objetos Supabase aninhados.
*   `src/utils/webhookFields.ts`: Definições de campos e funções para construir caminhos de seleção do Supabase e filtrar campos para exibição na UI.
*   `src/utils/markdownParser.ts`: Funções para analisar tabelas Markdown e convertê-las para CSV.

## 6. Edge Functions (Supabase)

### Função: `supabase/functions/store-calculation-result/index.ts`
Função Edge para receber a resposta da IA de um cálculo de rescisão e armazená-la diretamente na coluna `resposta_ai` da tabela `tbl_calculos`.
**Estrutura JSON esperada para a resposta do webhook de cálculo:**
```json
{
  "calculationId": "UUID_DO_CALCULO",
  "aiResponse": "Texto detalhado da resposta do cálculo gerada pela IA."
}
```
```typescript
declare const Deno: any;

// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
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
    const { calculationId, aiResponse } = await req.json();

    if (!calculationId || !aiResponse) {
      return new Response(JSON.stringify({ error: 'Missing calculationId or aiResponse' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error: updateCalculoError } = await supabaseClient
      .from('tbl_calculos')
      .update({
        resposta_ai: aiResponse,
      })
      .eq('id', calculationId);

    if (updateCalculoError) {
      console.error('Error updating calculation with AI response:', updateCalculoError);
      return new Response(JSON.stringify({ error: 'Failed to update calculation with AI response', details: updateCalculoError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'AI response received and updated successfully in tbl_calculos', calculationId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in store-calculation-result Edge Function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

## 7. Como o Sistema Funciona (Fluxo Geral)

1.  **Autenticação**: Usuários fazem login ou se cadastram. Ao se cadastrar, um perfil básico é criado automaticamente.
2.  **Gerenciamento de Clientes, Sindicatos e Modelos IA**: Usuários podem cadastrar e gerenciar seus clientes, sindicatos relevantes e **modelos de prompt de IA personalizados**.
3.  **Criação de Cálculos**: Para cada funcionário de um cliente, o usuário insere os dados detalhados do contrato e da rescisão no formulário de cálculo, **selecionando opcionalmente um Modelo de Prompt IA**.
4.  **Envio para Webhook**: Após salvar um cálculo, o usuário pode enviá-lo para um ou mais webhooks configurados. O sistema coleta os campos selecionados (incluindo dados do modelo IA, se selecionado) e os envia para o endpoint externo.
5.  **Processamento Externo (n8n/IA)**: Um serviço externo (como n8n) recebe os dados do cálculo, processa-os (ex: usando um agente de IA para gerar a resposta do cálculo com base no modelo de prompt selecionado) e envia a resposta de volta para a função Edge `store-calculation-result`.
6.  **Armazenamento da Resposta**: A função Edge recebe a resposta da IA e a salva na coluna `resposta_ai` da tabela `tbl_calculos`.
7.  **Visualização e Download**: Na lista de cálculos, o status é atualizado automaticamente após 1 minuto (com um refresh da página) ou manualmente através do botão "Processar". O usuário pode visualizar o resultado detalhado na página de resultados ou baixar a `resposta_ai` como **CSV, PDF ou TXT** diretamente da página de resultados.

## 8. Scripts NPM Essenciais

*   `npm run dev`: Inicia o servidor de desenvolvimento.
*   `npm run build`: Compila o projeto para produção.
*   `npm run build:dev`: Compila o projeto em modo de desenvolvimento.
*   `npm run lint`: Executa o linter para verificar problemas de código.
*   `npm run preview`: Visualiza a build de produção localmente.

## 9. Bibliotecas Chave

*   `react`, `react-dom`: Core do React.
*   `react-router-dom`: Gerenciamento de rotas.
*   `@supabase/supabase-js`, `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`: Integração com Supabase.
*   `tailwindcss`, `tailwindcss-animate`, `clsx`, `tailwind-merge`: Estilização e utilitários de CSS.
*   `lucide-react`: Ícones.
*   `date-fns`: Manipulação de datas.
*   `sonner`: Notificações toast.
*   `jspdf`, `html2canvas`: Geração de documentos PDF no cliente.
*   `react-markdown`, `remark-gfm`: Renderização de Markdown.
*   `next-themes`: Gerenciamento de temas (claro/escuro).
*   `@radix-ui/*`: Componentes Radix UI (base para Shadcn/ui).
*   `@hookform/resolvers`, `react-hook-form`, `zod`: Validação de formulários.

Este `README.md` fornece uma visão completa do projeto, facilitando a compreensão e a manutenção.