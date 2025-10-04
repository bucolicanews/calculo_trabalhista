# Calculadora Trabalhista (Labor Calculator)

This project is a labor calculation application designed to assist with various labor-related calculations. It integrates with Supabase for backend services (database, authentication) and uses n8n for workflow automation, specifically for processing calculation requests via webhooks and potentially interacting with AI models.

## Table of Contents

1.  [Project Overview](#project-overview)
2.  [Deployment Guide](#deployment-guide)
    *   [Prerequisites](#prerequisites)
    *   [Supabase Setup](#supabase-setup)
        *   [Database Schema](#database-schema)
        *   [Relationships](#relationships)
        *   [Authentication](#authentication)
        *   [Row Level Security (RLS)](#row-level-security-rls)
    *   [n8n Workflow](#n8n-workflow)
    *   [Edge Functions](#edge-functions)
    *   [Frontend Deployment](#frontend-deployment)
    *   [Environment Variables](#environment-variables)
3.  [Local Development](#local-development)
4.  [Contributing](#contributing)
5.  [License](#license)

---

## 1. Project Overview

This application provides a user interface for inputting labor calculation parameters. It leverages a Supabase backend for data storage and user management. Complex calculations or integrations (e.g., with AI services) are handled by an n8n workflow, which receives data via webhooks. The results from the n8n workflow are then stored back into Supabase and displayed in the frontend.

## 2. Deployment Guide

To deploy this application, you will need to set up Supabase, deploy the n8n workflow, and deploy the frontend application.

### Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js** (LTS version recommended)
*   **npm** or **Yarn**
*   **Supabase CLI**: `npm install -g supabase`
*   **Vercel CLI** (if deploying frontend to Vercel): `npm install -g vercel`
*   **n8n instance**: A running instance of n8n (self-hosted or cloud) where you can import and run workflows.

### Supabase Setup

This application relies heavily on Supabase for its backend. You'll need to create a new Supabase project and configure its database schema, authentication, and Row Level Security.

#### Database Schema

Below are the inferred table schemas based on the application's data fetching and usage. You should create these tables in your Supabase project.

**`tbl_clientes`**
Stores information about clients.
```sql
CREATE TABLE public.tbl_clientes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
```

**`tbl_sindicatos`**
Stores information about labor unions.
```sql
CREATE TABLE public.tbl_sindicatos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
```

**`tbl_ai_prompt_templates`**
Stores templates for AI prompts used in calculations.
```sql
CREATE TABLE public.tbl_ai_prompt_templates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    identificacao text,
    comportamento text,
    restricoes text,
    atribuicoes text,
    leis text,
    proventos text,
    descontos text,
    observacoes_base_legal text,
    formatacao_texto_cabecalho text,
    formatacao_texto_corpo text,
    formatacao_texto_rodape text,
    created_at timestamp with time zone DEFAULT now()
);
```

**`tbl_calculos`**
The main table storing details of each labor calculation.
```sql
CREATE TABLE public.tbl_calculos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id uuid REFERENCES public.tbl_clientes(id),
    sindicato_id uuid REFERENCES public.tbl_sindicatos(id),
    ai_template_id uuid REFERENCES public.tbl_ai_prompt_templates(id),
    nome_funcionario text NOT NULL,
    cpf_funcionario text,
    funcao_funcionario text,
    inicio_contrato date NOT NULL,
    fim_contrato date NOT NULL,
    tipo_aviso text NOT NULL,
    salario_sindicato numeric,
    salario_trabalhador numeric NOT NULL,
    obs_sindicato text,
    historia text,
    ctps_assinada boolean DEFAULT FALSE,
    media_descontos numeric,
    media_remuneracoes numeric,
    carga_horaria text,
    created_at timestamp with time zone DEFAULT now(),
    resposta_ai text -- Stores the AI's markdown response directly
);
```

**`tbl_resposta_calculo`**
Stores additional details or documents related to the calculation response, often from a webhook.
```sql
CREATE TABLE public.tbl_resposta_calculo (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    calculo_id uuid REFERENCES public.tbl_calculos(id) ON DELETE CASCADE, -- Link to tbl_calculos
    url_documento_calculo text,
    texto_extraido text,
    data_hora timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);
```

#### Relationships

Ensure the foreign key relationships are correctly established as indicated in the `CREATE TABLE` statements above:

*   `tbl_calculos.cliente_id` references `tbl_clientes.id`
*   `tbl_calculos.sindicato_id` references `tbl_sindicatos.id`
*   `tbl_calculos.ai_template_id` references `tbl_ai_prompt_templates.id`
*   `tbl_resposta_calculo.calculo_id` references `tbl_calculos.id` (with `ON DELETE CASCADE` for data integrity)

#### Authentication

Configure Supabase Auth for user management. The application currently uses email/password authentication.

1.  Go to **Authentication** in your Supabase project.
2.  Enable **Email** provider.
3.  Configure any desired email templates or settings.

#### Row Level Security (RLS)

It is highly recommended to enable and configure RLS for all tables containing sensitive user data to ensure data privacy and security. For example, you might want to ensure users can only view/edit their own calculations.

**Example RLS Policy for `tbl_calculos` (adjust as needed):**

```sql
-- Enable RLS on tbl_calculos
ALTER TABLE public.tbl_calculos ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own calculations
CREATE POLICY "Users can view their own calculations" ON public.tbl_calculos
  FOR SELECT USING (auth.uid() = (SELECT id FROM auth.users WHERE id = auth.uid()));

-- Policy for authenticated users to insert their own calculations
CREATE POLICY "Users can insert their own calculations" ON public.tbl_calculos
  FOR INSERT WITH CHECK (auth.uid() = (SELECT id FROM auth.users WHERE id = auth.uid()));

-- Policy for authenticated users to update their own calculations
CREATE POLICY "Users can update their own calculations" ON public.tbl_calculos
  FOR UPDATE USING (auth.uid() = (SELECT id FROM auth.users WHERE id = auth.uid()));

-- Policy for authenticated users to delete their own calculations
CREATE POLICY "Users can delete their own calculations" ON public.tbl_calculos
  FOR DELETE USING (auth.uid() = (SELECT id FROM auth.users WHERE id = auth.uid()));
```
**Note**: The RLS policies above are examples. You will need to adapt them based on how `auth.uid()` is linked to your `tbl_calculos` table (e.g., if `tbl_calculos` has a `user_id` column). If `tbl_calculos` does not directly store `auth.uid()`, you'll need to adjust the `USING` and `WITH CHECK` clauses accordingly. For this application, it's assumed that `tbl_calculos` might implicitly be tied to the user who created it, or a `user_id` column would be added.

### n8n Workflow

The application uses an n8n workflow for processing calculation requests.

**Workflow File:** `src/n8n/calculo_trabalhista_n8n.json`

**Steps to Deploy the n8n Workflow:**

1.  **Import**: In your n8n instance, go to "Workflows" and click "New" -> "Import from JSON". Upload the `calculo_trabalhista_n8n.json` file.
2.  **Configure Webhook**: The workflow will likely start with a "Webhook" trigger. After importing, activate the workflow to get its unique webhook URL. This URL will be used in your frontend environment variables.
3.  **Environment Variables/Credentials in n8n**: The n8n workflow will likely require credentials or environment variables for:
    *   **Supabase Integration**: API URL and Service Role Key for writing data back to Supabase.
    *   **AI Service Integration**: API keys for any AI models (e.g., OpenAI, Gemini) if the workflow interacts with them.
    *   **Other Services**: Any other third-party services the workflow connects to.
    *   **Important**: Ensure your Supabase Service Role Key is kept secure and only used within trusted backend environments like n8n. Do not expose it in your frontend.
4.  **Activate**: Once configured, activate the n8n workflow.

### Edge Functions

Based on the current application structure, there are no explicit Supabase Edge Functions defined or used in the provided code snippets. If your project requires server-side logic that runs close to your users, you would typically define and deploy them using the Supabase CLI.

**Example of deploying an Edge Function (if you were to add one):**

```bash
# Create a new Edge Function
supabase functions new my-function

# Deploy the Edge Function
supabase functions deploy my-function --no-verify-jwt
```
*(Note: `--no-verify-jwt` is often used for functions called by webhooks or other services where JWT verification is handled differently or not required for the specific use case. Always consider security implications.)*

### Frontend Deployment

The frontend is a React application. It can be deployed to platforms like Vercel, Netlify, or any static site hosting service.

**Steps for Vercel Deployment (Recommended):**

1.  **Install Vercel CLI**: `npm install -g vercel`
2.  **Login**: `vercel login`
3.  **Deploy**: Navigate to your project root and run `vercel`. Follow the prompts.
4.  **Configure Environment Variables**: After deployment, go to your Vercel project settings and add the necessary [Environment Variables](#environment-variables).

### Environment Variables

You will need to set the following environment variables for your frontend application. These should be configured in your hosting provider (e.g., Vercel project settings) and in your local `.env.local` file for development.

*   **`VITE_SUPABASE_URL`**: Your Supabase project URL (e.g., `https://your-project-ref.supabase.co`).
*   **`VITE_SUPABASE_ANON_KEY`**: Your Supabase public `anon` key.
*   **`VITE_N8N_WEBHOOK_URL`**: The URL of your n8n webhook that receives calculation requests.

**Example `.env.local` file:**

```
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
VITE_N8N_WEBHOOK_URL="https://your-n8n-instance/webhook/your-webhook-path"
```

## 3. Local Development

To run the application locally:

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd <project-folder>
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up environment variables**: Create a `.env.local` file in the project root and populate it with the variables listed in the [Environment Variables](#environment-variables) section.
4.  **Start the development server**:
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    The application will typically be available at `http://localhost:5173`.

## 4. Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## 5. License

This project is licensed under the MIT License.