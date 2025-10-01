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

## Estrutura do Projeto

```
.
├── public/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── MainLayout.tsx       # Layout principal para páginas autenticadas
│   │   ├── ui/
│   │   │   └── password-input.tsx   # Input de senha personalizado com toggle
│   │   └── made-with-dyad.tsx
│   ├── context/
│   │   └── AuthContext.tsx          # Contexto para gerenciar a autenticação Supabase
│   ├── integrations/
│   │   └── supabase/
│   │       └── client.ts            # Cliente Supabase inicializado
│   ├── pages/
│   │   ├── AuthPage.tsx             # Página de Login/Cadastro
│   │   ├── CalculationFormPage.tsx  # Formulário para dados de cálculo
│   │   ├── CalculationResultPage.tsx# Página de resultados do cálculo
│   │   ├── ClientFormPage.tsx       # Formulário para dados do cliente
│   │   ├── DashboardPage.tsx        # Dashboard principal após login
│   │   ├── Index.tsx                # Página inicial (redireciona para Auth/Dashboard)
│   │   └── NotFound.tsx             # Página 404
│   ├── utils/
│   │   └── toast.ts                 # Funções utilitárias para toasts
│   ├── App.tsx                      # Configuração de rotas e provedores
│   ├── globals.css                  # Estilos globais e Tailwind
│   └── main.tsx                     # Ponto de entrada da aplicação
├── .env                             # Variáveis de ambiente (Supabase keys)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
# ... outros arquivos de configuração
```

## Estrutura do Banco de Dados (Supabase)

As seguintes tabelas foram criadas com RLS (Row Level Security) habilitado e políticas de acesso adequadas:

*   **`public.profiles`**: Armazena informações adicionais do usuário, ligada a `auth.users`.
*   **`public.tbl_clientes`**: Informações do empregador/cliente. Relacionada a `auth.users` via `user_id`.
    *   `tipo_empregador` (ENUM): 'Empresa', 'Empregador Doméstico', 'Pessoa Física', 'Produtor Rural', 'Outros'.
*   **`public.tbl_sindicatos`**: Informações sindicais.
*   **`public.tbl_calculos`**: Dados específicos de um cálculo de rescisão. Relacionada a `tbl_clientes` e `tbl_sindicatos`.
    *   `tipo_aviso` (ENUM): 'Trabalhado pelo Empregado', 'Trabalhado pelo Empregador', 'Indenizado pelo Empregador', 'Indenizado pelo Empregado'.
*   **`public.tbl_resposta_calculo`**: Resposta gerada pela lógica de cálculo. Relacionada a `tbl_calculos`.

Uma função `public.handle_new_user()` e um trigger `on_auth_user_created` foram configurados para criar automaticamente um perfil na tabela `public.profiles` quando um novo usuário se cadastra no Supabase Auth.

## Configuração e Execução Local

1.  **Variáveis de Ambiente**:
    Crie um arquivo `.env` na raiz do projeto com suas credenciais do Supabase:
    ```
    VITE_SUPABASE_URL="https://oqiycpjayuzuyefkdujp.supabase.co"
    VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaXljcGphamF5dXp1eWVma2R1anAiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTMzNjE2NCwiZXhwIjoyMDc0OTEyMTY0fQ.9U4YAX2lAoc0vNyOrviBg10e-2ThVgwO0EKQiJuamag"
    ```

2.  **Instalar Dependências**:
    ```bash
    npm install
    ```

3.  **Iniciar o Servidor de Desenvolvimento**:
    ```bash
    npm run dev
    ```

    O aplicativo estará disponível em `http://localhost:8080` (ou outra porta configurada pelo Vite).

## Funcionalidades Implementadas

*   **Autenticação de Usuário**: Login e Cadastro via Supabase Auth UI.
*   **Gerenciamento de Sessão**: `AuthContext` para manter o estado do usuário.
*   **Redirecionamento**: Redirecionamento automático para `/dashboard` após login e para `/auth` após logout.
*   **Dashboard**: Página inicial para usuários autenticados com visão geral e botões de ação.
*   **Formulário de Cliente**: Criação e edição de clientes (`tbl_clientes`).
*   **Formulário de Cálculo**: Criação e edição de dados de cálculo de rescisão (`tbl_calculos`), com seleção de clientes e sindicatos.
*   **Página de Resultado de Cálculo**: Exibe a `tbl_resposta_calculo` e inclui uma lógica de placeholder para gerar um cálculo preliminar.
*   **Componente `PasswordInput`**: Input de senha com toggle de visibilidade.
*   **Design Responsivo**: Utiliza Tailwind CSS com a paleta de cores preta e laranja.

## Próximos Passos (Sugestões)

*   Implementar a lógica de cálculo de rescisão completa.
*   Adicionar validação de formulário mais robusta.
*   Melhorar a interface de usuário para listagem e detalhes de clientes/cálculos.
*   Adicionar funcionalidade para gerenciar sindicatos.
*   Implementar upload de arquivos para `anexo_dissidio_url` (Supabase Storage).
*   Integrar com um modelo de IA para gerar `resposta_ai` mais detalhada.