# Especificação de Projeto: App de Rescisão Trabalhista (Calculadora Jurídica)

## 1. Objetivo Geral
Criar um aplicativo web utilizando React e Supabase para permitir que usuários autenticados (advogados, contadores, etc.) gerenciem clientes e insiram dados detalhados para o cálculo de rescisões trabalhistas. O foco inicial é na coleta de dados estruturada e no esqueleto da lógica de cálculo e persistência.

## 2. Tecnologias & Arquitetura
*   **Frontend**: React (usando componentes funcionais e hooks, preferencialmente Zustand ou Context para estado global).
*   **Estilização**: Tailwind CSS (para design responsivo e ágil).
*   **Banco de Dados & Autenticação**: Supabase (PostgreSQL para dados, Auth para gerenciamento de usuários).
*   **Cores Principais**: Preto (#000000) e Laranja Vibrante (#FF4500 ou similar).

## 3. Estrutura do Banco de Dados (Supabase Schema)
O banco de dados deve ser modelado com as seguintes tabelas e relacionamentos. Todas as tabelas devem ter a coluna padrão `created_at` (TIMESTAMP WITH TIME ZONE DEFAULT NOW()).

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
  tipo_empregador TEXT NOT NULL, -- Assuming ENUM is handled by text for simplicity in SQL, or define ENUM type
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

### Tabela: `tbl_dissidios`
Função: Armazenar os anexos de dissídios para cada sindicato.
```sql
-- Create table
CREATE TABLE tbl_dissidios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sindicato_id UUID REFERENCES tbl_sindicatos(id) ON DELETE CASCADE NOT NULL,
  nome_dissidio TEXT NOT NULL,
  url_documento TEXT,
  resumo_dissidio TEXT,
  data_vigencia_inicial DATE,
  data_vigencia_final DATE,
  mes_convencao TEXT,
  texto_extraido TEXT,
  resumo_ai TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (REQUIRED)
ALTER TABLE tbl_dissidios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tbl_dissidios
CREATE POLICY "Dissidios podem ser lidos por autenticados" ON tbl_dissidios
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Dissidios podem ser inseridos por autenticados" ON tbl_dissidios
FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Dissidios podem ser atualizados por autenticados" ON tbl_dissidios
FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Dissidios podem ser deletados por autenticados" ON tbl_dissidios
FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);
```

### Tabela: `tbl_calculos`
Função: Armazenar os dados específicos de um cálculo de rescisão de um funcionário.
```sql
-- Create table
CREATE TABLE tbl_calculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES tbl_clientes(id) ON DELETE CASCADE NOT NULL,
  sindicato_id UUID REFERENCES tbl_sindicatos(id) ON DELETE SET NULL, -- Changed to SET NULL as per common practice if sindicato is optional
  nome_funcionario TEXT NOT NULL,
  cpf_funcionario TEXT,
  funcao_funcionario TEXT,
  inicio_contrato DATE NOT NULL,
  fim_contrato DATE NOT NULL,
  tipo_aviso TEXT NOT NULL, -- Assuming ENUM is handled by text
  salario_sindicato NUMERIC DEFAULT 0,
  salario_trabalhador NUMERIC DEFAULT 0, -- NOVO CAMPO: Salário do trabalhador
  obs_sindicato TEXT,
  historia TEXT,
  ctps_assinada BOOLEAN DEFAULT FALSE,
  media_descontos NUMERIC DEFAULT 0,
  media_remuneracoes NUMERIC DEFAULT 0,
  carga_horaria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
Função: Armazenar a resposta gerada pela lógica de cálculo ou por um modelo de IA, incluindo documentos PDF e texto extraído.
```sql
-- Create table
CREATE TABLE tbl_resposta_calculo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calculo_id UUID REFERENCES tbl_calculos(id) ON DELETE CASCADE NOT NULL,
  resposta_ai TEXT,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  url_documento_calculo TEXT, -- NOVO: URL pública do PDF do cálculo
  texto_extraido TEXT -- NOVO: Texto extraído do PDF do cálculo
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

## 4. Requisitos de Frontend (React)

### 4.1. Autenticação
*   Página de Login/Cadastro (`/auth`) usando `@supabase/auth-ui-react`.
*   Proteção de rotas privadas com `PrivateRoute` (redireciona para `/auth` se não autenticado).
*   Contexto de autenticação (`AuthContext`) para gerenciar o estado do usuário globalmente.

### 4.2. Layout Principal
*   `MainLayout` com um `Sidebar` responsivo (menu lateral para desktop, sheet para mobile).
*   Cores predominantes: preto e laranja vibrante.

### 4.3. Dashboard (`/dashboard`)
*   Exibe um resumo rápido (ex: total de clientes).
*   Botões de acesso rápido para "Adicionar Cliente", "Iniciar Novo Cálculo", "Ver Todos os Clientes", "Ver Todos os Cálculos", "Gerenciar Sindicatos" e "Gerenciar Webhooks".

### 4.4. Gerenciamento de Clientes
*   **Lista de Clientes (`/clients`)**:
    *   Exibe todos os clientes cadastrados pelo usuário.
    *   Opções para "Adicionar Cliente", "Editar" e "Excluir" (com confirmação).
*   **Formulário de Cliente (`/clients/new` ou `/clients/:id`)**:
    *   Permite criar um novo cliente ou editar um existente.
    *   Campos: Nome/Razão Social, CPF, CNPJ, Tipo de Empregador (dropdown), Nome do Responsável, CPF do Responsável.
    *   Validação básica.

### 4.5. Gerenciamento de Sindicatos
*   **Lista de Sindicatos (`/sindicatos`)**:
    *   Exibe todos os sindicatos cadastrados (públicos para todos os usuários).
    *   Opções para "Adicionar Sindicato", "Editar" e "Excluir" (com confirmação).
*   **Formulário de Sindicato (`/sindicatos/new` ou `/sindicatos/:id`)**:
    *   Permite criar um novo sindicato ou editar um existente.
    *   Campos: Nome do Sindicato, Data Inicial do Acordo, Data Final do Acordo, Mês da Convenção.
    *   **Gerenciamento de Dissídios**: Dentro do formulário de sindicato (ao editar), há uma seção para gerenciar os dissídios associados a esse sindicato.
        *   Permite adicionar, editar e excluir dissídios.
        *   Campos do Dissídio: Nome, Documento PDF (upload para Supabase Storage), Resumo, Data Início/Fim Vigência, Mês Convenção.

### 4.6. Gerenciamento de Cálculos
*   **Lista de Cálculos (`/calculations`)**:
    *   Exibe todos os cálculos de rescisão criados pelo usuário.
    *   Opções para "Novo Cálculo", "Editar", "Ver Resultado" e "Excluir" (com confirmação).
    *   **Envio para Webhook**: Um botão "Enviar" que abre um modal para selecionar um ou mais webhooks configurados (para `tbl_calculos` ou `all_tables`) antes de enviar os dados do cálculo.
    *   **Status do Webhook**: Exibe o status do envio do webhook (enviando, aguardando resposta, resultado disponível).
    *   **Download do PDF**: Se um `url_documento_calculo` for retornado pelo webhook, um botão de download do PDF é exibido.
*   **Formulário de Cálculo (`/calculations/new` ou `/calculations/:id`)**:
    *   Permite criar um novo cálculo ou editar um existente.
    *   Campos: Cliente (dropdown), Sindicato (dropdown), Nome/CPF/Função do Funcionário, Início/Fim do Contrato (seletores de data), Tipo de Aviso (dropdown), Salário Sindicato, **Salário do Trabalhador**, Observações Sindicato, Histórico do Contrato, CTPS Assinada (checkbox), Média de Descontos/Remunerações, Carga Horária.
*   **Página de Resultado do Cálculo (`/calculations/:id/result`)**:
    *   Exibe os detalhes do cálculo e a resposta gerada pelo webhook (resposta da IA, texto extraído do PDF e link para download do PDF).
    *   O botão "Gerar Cálculo Preliminar" foi removido, pois a geração do resultado é esperada via webhook.

### 4.7. Configurações de Webhooks (`/webhooks`)
*   **Lista de Webhooks**:
    *   Exibe todas as configurações de webhook do usuário.
    *   Opções para "Novo Webhook", "Editar" e "Excluir" (com confirmação).
*   **Formulário de Webhook**:
    *   Permite criar ou editar uma configuração de webhook.
    *   Campos:
        *   **Título do Webhook**: Um nome descritivo para o webhook.
        *   **Tabela**: Dropdown para selecionar a tabela a ser monitorada (`tbl_clientes`, `tbl_calculos`, `tbl_sindicatos`, `tbl_dissidios` ou `TODOS (Todos os Campos)`).
        *   **Campos Selecionados**: Um seletor de múltiplos itens que lista os campos disponíveis da tabela selecionada.
            *   Se "TODOS" for selecionado, todos os campos de todas as tabelas são listados.
            *   Para tabelas específicas, apenas os campos diretos daquela tabela são listados.
        *   **URL do Webhook**: O endpoint para onde os dados serão enviados.
    *   A lógica de seleção de campos é dinâmica, mostrando apenas os campos relevantes para a tabela escolhida.

### 4.8. Utilidades
*   `src/utils/toast.ts`: Funções para exibir notificações de sucesso, erro e carregamento.
*   `src/utils/supabaseDataExtraction.ts`: Função auxiliar para extrair valores de objetos Supabase aninhados.
*   `src/utils/webhookFields.ts`: Definições de campos e funções para construir caminhos de seleção do Supabase e filtrar campos para exibição na UI.

## 5. Edge Functions (Supabase)

### Função: `supabase/functions/store-ai-summary/index.ts`
Função Edge para receber e armazenar o resumo de IA e texto extraído de documentos de dissídios.
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dissidioId, resumo, url_documento, texto_extraido } = await req.json();

    if (!dissidioId || !resumo) {
      return new Response(JSON.stringify({ error: 'Missing dissidioId or resumo' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for server-side operations
    );

    const updatePayload: { resumo_ai: string; url_documento?: string; texto_extraido?: string } = {
      resumo_ai: resumo,
    };

    if (url_documento) {
      updatePayload.url_documento = url_documento;
    }
    if (texto_extraido) {
      updatePayload.texto_extraido = texto_extraido;
    }

    const { data, error } = await supabaseClient
      .from('tbl_dissidios')
      .update(updatePayload)
      .eq('id', dissidioId);

    if (error) {
      console.error('Error updating dissidio with AI summary/extracted text:', error);
      return new Response(JSON.stringify({ error: 'Failed to update dissidio with AI summary/extracted text', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'AI summary and other fields received and updated successfully', dissidioId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in store-ai-summary Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

### Função: `supabase/functions/store-calculation-result/index.ts`
Função Edge para receber e armazenar os resultados de um cálculo de rescisão, incluindo a resposta da IA, URL do documento PDF e texto extraído.

**Estrutura JSON esperada para a resposta do webhook de cálculo:**
```json
{
  "calculationId": "UUID_DO_CALCULO", // O ID do cálculo que foi enviado
  "aiResponse": "Texto detalhado da resposta do cálculo gerada pela IA.",
  "pdfUrl": "https://seu-bucket-supabase.supabase.co/storage/v1/object/public/calculos/resultado_calculo_123.pdf", // URL pública do PDF do cálculo, se gerado
  "extractedText": "Texto extraído do PDF do cálculo, se aplicável." // Opcional: texto extraído do PDF
}
```
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calculationId, aiResponse, pdfUrl, extractedText } = await req.json();

    if (!calculationId || !aiResponse) {
      return new Response(JSON.stringify({ error: 'Missing calculationId or aiResponse' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for server-side operations
    );

    const updatePayload: {
      resposta_ai: string;
      url_documento_calculo?: string;
      texto_extraido?: string;
      data_hora: string;
    } = {
      resposta_ai: aiResponse,
      data_hora: new Date().toISOString(),
    };

    if (pdfUrl) {
      updatePayload.url_documento_calculo = pdfUrl;
    }
    if (extractedText) {
      updatePayload.texto_extraido = extractedText;
    }

    // Upsert (insert or update) the calculation result
    const { data, error } = await supabaseClient
      .from('tbl_resposta_calculo')
      .upsert(
        {
          calculo_id: calculationId,
          ...updatePayload,
        },
        { onConflict: 'calculo_id' } // If a result for this calculation_id already exists, update it
      );

    if (error) {
      console.error('Error updating calculation result with AI response/PDF/extracted text:', error);
      return new Response(JSON.stringify({ error: 'Failed to update calculation result', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Calculation result received and updated successfully', calculationId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in store-calculation-result Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});