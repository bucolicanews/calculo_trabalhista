# App de Rescisão Trabalhista (Calculadora Jurídica)

Este é um aplicativo web construído com React e Supabase para auxiliar advogados e contadores no gerenciamento de clientes e no cálculo de rescisões trabalhistas.

## Objetivo

Permitir que usuários autenticados gerenciem clientes e insiram dados detalhados para o cálculo de rescisões trabalhistas, com foco inicial na coleta de dados estruturada e no esqueleto da lógica de cálculo e persistência.

## Tecnologias

*   **Frontend**: React (com componentes funcionais e hooks)
*   **Estilização**: Tailwind CSS (para design responsivo)
*   **Componentes UI**: shadcn/ui
*   **Estado Global**: React Context (para autenticação)
*   **Roteamento**: React Router DOM
*   **Banco de Dados & Autenticação**: Supabase (PostgreSQL para dados, Auth para gerenciamento de usuários)
*   **Cores Principais**: Preto (`#000000`) e Laranja Vibrante (`#FF4500`)

## Dependências do Projeto (`package.json`)

```json
{
  "name": "vite_react_shadcn_ts",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@radix-ui/react-accordion": "^1.2.0",
    "@radix-ui/react-alert-dialog": "^1.1.1",
    "@radix-ui/react-aspect-ratio": "^1.1.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-checkbox": "^1.1.1",
    "@radix-ui/react-collapsible": "^1.1.0",
    "@radix-ui/react-context-menu": "^2.2.1",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-hover-card": "^1.1.1",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-menubar": "^1.1.1",
    "@radix-ui/react-navigation-menu": "^1.2.0",
    "@radix-ui/react-popover": "^1.1.1",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-radio-group": "^1.2.0",
    "@radix-ui/react-scroll-area": "^1.1.0",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slider": "^1.2.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-switch": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-toast": "^1.2.1",
    "@radix-ui/react-toggle": "^1.1.0",
    "@radix-ui/react-toggle-group": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.4",
    "@supabase/auth-ui-react": "^0.4.7",
    "@supabase/auth-ui-shared": "^0.1.8",
    "@supabase/supabase-js": "^2.58.0",
    "@tanstack/react-query": "^5.56.2",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.3.0",
    "input-otp": "^1.2.4",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.53.0",
    "react-resizable-panels": "^2.1.3",
    "react-router-dom": "^6.26.2",
    "recharts": "^2.12.7",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@dyad-sh/react-vite-component-tagger": "^0.8.0",
    "@eslint/js": "^9.9.0",
    "@tailwindcss/typography": "^0.5.15",
    "@types/node": "^22.5.5",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react-swc": "^3.9.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.9.0",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.9",
    "globals": "^15.9.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.11",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.0.1",
    "vite": "^6.3.4"
  }
}
```

## Estrutura do Banco de Dados (Supabase)

As seguintes tabelas foram criadas com RLS (Row Level Security) habilitado e políticas de acesso adequadas. É **CRÍTICO** que essas políticas sejam mantidas para a segurança dos seus dados.

### Scripts SQL para Criação de Tabelas e RLS

Para configurar o banco de dados, execute os seguintes scripts SQL na ordem apresentada no seu editor SQL do Supabase.

#### 1. Tabela `public.profiles` e Função `handle_new_user`

Esta tabela armazena informações adicionais do usuário e está ligada à tabela `auth.users` do Supabase. A função `handle_new_user` e o trigger `on_auth_user_created` garantem que um perfil seja criado automaticamente quando um novo usuário se cadastra.

```sql
-- Tabela de perfis para armazenar dados adicionais do usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Habilitar RLS (OBRIGATÓRIO para segurança)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para a tabela profiles
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles_delete_policy" ON public.profiles
FOR DELETE TO authenticated USING (auth.uid() = id);

-- Função para inserir perfil quando um novo usuário se cadastra
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

-- Gatilho para a função handle_new_user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 2. Tabela `public.tbl_clientes`

Armazena informações dos empregadores/clientes. Cada cliente é associado a um `user_id` da tabela `auth.users`, garantindo que os usuários só possam acessar seus próprios clientes.

*   `tipo_empregador` (ENUM): 'Empresa', 'Empregador Doméstico', 'Pessoa Física', 'Produtor Rural', 'Outros'.

```sql
-- Tabela para armazenar informações dos clientes/empregadores
CREATE TYPE public.employer_type AS ENUM ('Empresa', 'Empregador Doméstico', 'Pessoa Física', 'Produtor Rural', 'Outros');

CREATE TABLE public.tbl_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cpf TEXT,
  cnpj TEXT,
  tipo_empregador employer_type NOT NULL,
  responsavel TEXT,
  cpf_responsavel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (OBRIGATÓRIO para segurança)
ALTER TABLE public.tbl_clientes ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para a tabela tbl_clientes
CREATE POLICY "Clientes podem ver apenas seus próprios clientes" ON public.tbl_clientes
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Clientes podem inserir seus próprios clientes" ON public.tbl_clientes
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clientes podem atualizar seus próprios clientes" ON public.tbl_clientes
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Clientes podem deletar seus próprios clientes" ON public.tbl_clientes
FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

#### 3. Tabela `public.tbl_sindicatos`

Armazena informações sindicais. Atualmente, permite acesso de leitura para todos os usuários autenticados.

```sql
-- Tabela para armazenar informações sindicais
CREATE TABLE public.tbl_sindicatos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  anexo_dissidio_url TEXT,
  resumo_dissidio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (OBRIGATÓRIO para segurança)
ALTER TABLE public.tbl_sindicatos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para a tabela tbl_sindicatos (acesso de leitura para usuários autenticados)
CREATE POLICY "Sindicatos podem ser lidos por autenticados" ON public.tbl_sindicatos
FOR SELECT TO authenticated USING (true);

-- Para inserção, atualização e exclusão, podemos restringir a administradores ou deixar para o futuro
-- Por enquanto, apenas leitura para autenticados.
```

#### 4. Tabela `public.tbl_calculos`

Contém os dados específicos de um cálculo de rescisão. Relacionada a `tbl_clientes` e `tbl_sindicatos`. As políticas de RLS garantem que apenas os donos dos clientes associados possam gerenciar os cálculos.

*   `tipo_aviso` (ENUM): 'Trabalhado pelo Empregado', 'Trabalhado pelo Empregador', 'Indenizado pelo Empregador', 'Indenizado pelo Empregado'.

```sql
-- Tabela para armazenar os dados específicos de um cálculo de rescisão
CREATE TYPE public.notice_type AS ENUM ('Trabalhado pelo Empregado', 'Trabalhado pelo Empregador', 'Indenizado pelo Empregador', 'Indenizado pelo Empregado');

CREATE TABLE public.tbl_calculos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES public.tbl_clientes(id) ON DELETE CASCADE NOT NULL,
  sindicato_id UUID REFERENCES public.tbl_sindicatos(id) ON DELETE SET NULL,
  nome_funcionario TEXT NOT NULL,
  cpf_funcionario TEXT,
  funcao_funcionario TEXT,
  inicio_contrato DATE NOT NULL,
  fim_contrato DATE NOT NULL,
  tipo_aviso notice_type NOT NULL,
  salario_sindicato NUMERIC,
  obs_sindicato TEXT,
  historia TEXT,
  ctps_assinada BOOLEAN DEFAULT FALSE,
  media_descontos NUMERIC DEFAULT 0,
  media_remuneracoes NUMERIC DEFAULT 0,
  carga_horaria TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (OBRIGATÓRIO para segurança)
ALTER TABLE public.tbl_calculos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para a tabela tbl_calculos
CREATE POLICY "Calculos podem ser vistos apenas pelos donos dos clientes" ON public.tbl_calculos
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tbl_clientes WHERE id = cliente_id AND user_id = auth.uid())
);

CREATE POLICY "Calculos podem ser inseridos apenas pelos donos dos clientes" ON public.tbl_calculos
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.tbl_clientes WHERE id = cliente_id AND user_id = auth.uid())
);

CREATE POLICY "Calculos podem ser atualizados apenas pelos donos dos clientes" ON public.tbl_calculos
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tbl_clientes WHERE id = cliente_id AND user_id = auth.uid())
);

CREATE POLICY "Calculos podem ser deletados apenas pelos donos dos clientes" ON public.tbl_calculos
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.tbl_clientes WHERE id = cliente_id AND user_id = auth.uid())
);
```

#### 5. Tabela `public.tbl_resposta_calculo`

Armazena a resposta gerada pela lógica de cálculo (atualmente um placeholder). Relacionada a `tbl_calculos`. As políticas de RLS garantem que apenas os donos dos cálculos associados possam acessar as respostas.

```sql
-- Tabela para armazenar a resposta gerada pela lógica de cálculo
CREATE TABLE public.tbl_resposta_calculo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calculo_id UUID REFERENCES public.tbl_calculos(id) ON DELETE CASCADE NOT NULL,
  resposta_ai TEXT,
  data_hora TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (OBRIGATÓRIO para segurança)
ALTER TABLE public.tbl_resposta_calculo ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para a tabela tbl_resposta_calculo
CREATE POLICY "Respostas de calculo podem ser vistas apenas pelos donos dos calculos" ON public.tbl_resposta_calculo
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.tbl_calculos c
    JOIN public.tbl_clientes cl ON c.cliente_id = cl.id
    WHERE c.id = calculo_id AND cl.user_id = auth.uid()
  )
);

CREATE POLICY "Respostas de calculo podem ser inseridas apenas pelos donos dos calculos" ON public.tbl_resposta_calculo
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tbl_calculos c
    JOIN public.tbl_clientes cl ON c.cliente_id = cl.id
    WHERE c.id = calculo_id AND cl.user_id = auth.uid()
  )
);

CREATE POLICY "Respostas de calculo podem ser atualizadas apenas pelos donos dos calculos" ON public.tbl_resposta_calculo
FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.tbl_calculos c
    JOIN public.tbl_clientes cl ON c.cliente_id = cl.id
    WHERE c.id = calculo_id AND cl.user_id = auth.uid()
  )
);

CREATE POLICY "Respostas de calculo podem ser deletadas apenas pelos donos dos calculos" ON public.tbl_resposta_calculo
FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.tbl_calculos c
    JOIN public.tbl_clientes cl ON c.cliente_id = cl.id
    WHERE c.id = calculo_id AND cl.user_id = auth.uid()
  )
);
```

## Credenciais do Supabase e Configuração do `.env`

Para que seu aplicativo se conecte ao Supabase, você precisa configurar as variáveis de ambiente no arquivo `.env` na raiz do seu projeto.

### Onde Encontrar as Credenciais no Supabase:

1.  **URL do Projeto Supabase:**
    *   Vá para o seu projeto Supabase.
    *   No menu lateral, clique em **Project Settings** (Configurações do Projeto).
    *   Em **API**, você encontrará a "URL" do seu projeto.

2.  **Chave Anônima Pública (Anon Key / Publishable Key):**
    *   No mesmo local (**Project Settings > API**), você encontrará a "Project API keys".
    *   Procure pela chave rotulada como **`anon public`** ou **`Publishable key`**. Esta é a chave que seu frontend usa para interagir com o Supabase para operações de autenticação e acesso a dados públicos (ou dados permitidos por RLS).
    *   **Importante:** **NUNCA** use a `service_role` key no seu frontend, pois ela tem permissões de administrador e expô-la comprometeria a segurança do seu banco de dados.

### Configuração do Arquivo `.env`:

Crie um arquivo chamado `.env` na **raiz do seu projeto** (na mesma pasta que `package.json`) e adicione as seguintes linhas, substituindo os valores pelos seus:

```
VITE_SUPABASE_URL="SUA_URL_DO_SUPABASE"
VITE_SUPABASE_ANON_KEY="SUA_CHAVE_PUBLICA_ANONIMA_OU_PUBLISHABLE_KEY"
```

**Exemplo com suas credenciais:**

```
VITE_SUPABASE_URL="https://oqiycpjayuzuyefkdujp.supabase.co"
VITE_SUPABASE_ANON_KEY="sb_publishable_L2SlxPH8VMR1Xlmp4KB-dw_wv4XMRiz"
```

## Estrutura do Projeto

```
.
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── MainLayout.tsx       # Layout principal para páginas autenticadas (cabeçalho, navegação, logout)
│   │   ├── ui/
│   │   │   └── password-input.tsx   # Input de senha personalizado com toggle de visibilidade
│   │   └── made-with-dyad.tsx       # Componente de rodapé "Made with Dyad"
│   ├── context/
│   │   └── AuthContext.tsx          # Contexto React para gerenciar o estado de autenticação do Supabase
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts            # Cliente Supabase inicializado com variáveis de ambiente
│   ├── pages/
│   │   ├── AuthPage.tsx             # Página de Login/Cadastro usando Supabase Auth UI
│   │   ├── CalculationFormPage.tsx  # Formulário para inserir/editar dados de um cálculo de rescisão
│   │   ├── CalculationResultPage.tsx# Página para exibir os resultados de um cálculo
│   │   ├── ClientFormPage.tsx       # Formulário para adicionar/editar informações de clientes
│   │   ├── DashboardPage.tsx        # Dashboard principal para usuários autenticados, listando clientes e ações
│   │   ├── Index.tsx                # Página inicial que redireciona para Auth ou Dashboard
│   │   └── NotFound.tsx             # Página 404 para rotas não encontradas
│   ├── utils/
│   │   └── toast.ts                 # Funções utilitárias para exibir notificações (toasts)
│   ├── App.tsx                      # Configuração de rotas (React Router DOM) e provedores de contexto
│   ├── globals.css                  # Estilos globais e diretivas Tailwind CSS
│   └── main.tsx                     # Ponto de entrada da aplicação React
├── .env                             # Variáveis de ambiente (chaves do Supabase)
├── package.json                     # Metadados do projeto e lista de dependências
├── tailwind.config.ts               # Configuração do Tailwind CSS
├── tsconfig.json                    # Configuração do TypeScript
└── vite.config.ts                   # Configuração do Vite
# ... outros arquivos de configuração
```

## Configuração e Execução Local

1.  **Variáveis de Ambiente**:
    Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase, conforme explicado na seção "Credenciais do Supabase e Configuração do `.env`" acima.

2.  **Instalar Dependências**:
    Abra o terminal na raiz do projeto e execute:
    ```bash
    npm install
    ```

3.  **Iniciar o Servidor de Desenvolvimento**:
    ```bash
    npm run dev
    ```
    O aplicativo estará disponível em `http://localhost:8080` (ou outra porta configurada pelo Vite).

## Funcionalidades Implementadas

*   **Autenticação de Usuário**: Login e Cadastro via Supabase Auth UI, com tema escuro e cores personalizadas.
*   **Gerenciamento de Sessão**: `AuthContext` para manter o estado do usuário e redirecionamento automático.
*   **Redirecionamento**: Redirecionamento automático para `/dashboard` após login e para `/auth` após logout.
*   **Dashboard**: Página inicial para usuários autenticados com visão geral e botões de ação para clientes e cálculos.
*   **Formulário de Cliente**: Criação e edição de clientes (`tbl_clientes`) com validação básica.
*   **Formulário de Cálculo**: Criação e edição de dados de cálculo de rescisão (`tbl_calculos`), com seleção de clientes e sindicatos, e seleção de datas.
*   **Página de Resultado de Cálculo**: Exibe a `tbl_resposta_calculo` e inclui uma lógica de placeholder para gerar um cálculo preliminar se não houver um resultado salvo.
*   **Componente `PasswordInput`**: Input de senha com toggle de visibilidade para melhor UX.
*   **Design Responsivo**: Utiliza Tailwind CSS com a paleta de cores preta e laranja.
*   **Notificações**: Sistema de toasts para feedback ao usuário (sucesso, erro, carregamento).

## Próximos Passos (Sugestões)

*   Implementar a lógica de cálculo de rescisão completa e precisa.
*   Adicionar validação de formulário mais robusta (ex: Zod, React Hook Form).
*   Melhorar a interface de usuário para listagem e detalhes de clientes/cálculos (tabelas, filtros, paginação).
*   Adicionar funcionalidade para gerenciar sindicatos (CRUD).
*   Implementar upload de arquivos para `anexo_dissidio_url` (Supabase Storage).
*   Integrar com um modelo de IA para gerar `resposta_ai` mais detalhada e precisa.
*   Adicionar funcionalidade de edição e exclusão para cálculos e clientes diretamente nas listagens.
*   Implementar um sistema de permissões mais granular, se necessário.