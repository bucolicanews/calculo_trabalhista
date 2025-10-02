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

### Tabela: `tbl_clientes`
Função: Armazenar informações do empregador/cliente que está solicitando o cálculo.
| Campo | Tipo de Dado | Descrição |
| :--- | :--- | :--- |
| id | UUID (PK) | Chave primária. |
| user_id | UUID (FK) | ID do usuário autenticado responsável por este cliente. |
| nome | TEXT | Nome/Razão Social do cliente/empregador. |
| cpf | TEXT | CPF do empregador (se for pessoa física). |
| cnpj | TEXT | CNPJ do empregador (se for pessoa jurídica). |
| tipo_empregador | ENUM | Lista de opções (e.g., 'Empresa', 'Empregador Doméstico', 'Pessoa Física', 'Produtor Rural', 'Outros'). |
| responsavel | TEXT | Nome do responsável pelo cliente/contato. |
| cpf_responsavel | TEXT | CPF do responsável/contato. |

**RLS Policies para `tbl_clientes`:**
*   **Enable RLS**: ON
*   **Policy for SELECT**: `(user_id = auth.uid())`
*   **Policy for INSERT**: `(user_id = auth.uid())`
*   **Policy for UPDATE**: `(user_id = auth.uid())`
*   **Policy for DELETE**: `(user_id = auth.uid())`

### Tabela: `tbl_sindicatos`
Função: Armazenar informações sindicais que podem afetar o cálculo.
| Campo | Tipo de Dado | Descrição |
| :--- | :--- | :--- |
| id | UUID (PK) | Chave primária. |
| nome | TEXT | Nome do Sindicato (e.g., "SINTRACON"). |
| data_inicial | DATE | Data de início da vigência do acordo/dissídio. |
| data_final | DATE | Data de fim da vigência do acordo/dissídio. |
| mes_convencao | TEXT | Mês da convenção (Ex: Janeiro, 01/2024). |

**RLS Policies para `tbl_sindicatos`:**
*   **Enable RLS**: ON
*   **Policy for SELECT**: `(true)` (Sindicatos são públicos para todos os usuários)
*   **Policy for INSERT**: `(auth.uid() IS NOT NULL)` (Apenas usuários autenticados podem adicionar)
*   **Policy for UPDATE**: `(auth.uid() IS NOT NULL)`
*   **Policy for DELETE**: `(auth.uid() IS NOT NULL)`

### Tabela: `tbl_dissidios`
Função: Armazenar os anexos de dissídios para cada sindicato.
| Campo | Tipo de Dado | Descrição |
| :--- | :--- | :--- |
| id | UUID (PK) | Chave primária. |
| sindicato_id | UUID (FK) | Chave estrangeira para `tbl_sindicatos`. |
| nome_dissidio | TEXT | Nome do dissídio. |
| url_documento | TEXT | URL para o anexo do dissídio (PDF, etc.) no Supabase Storage. |
| resumo_dissidio | TEXT | Resumo das cláusulas relevantes do dissídio. |
| data_vigencia_inicial | DATE | Data de início da vigência do dissídio. |
| data_vigencia_final | DATE | Data de fim da vigência do dissídio. |
| mes_convencao | TEXT | Mês da convenção do dissídio. |

**RLS Policies para `tbl_dissidios`:**
*   **Enable RLS**: ON
*   **Policy for SELECT**: `(true)` (Dissídios são públicos para todos os usuários)
*   **Policy for INSERT**: `(auth.uid() IS NOT NULL)` (Apenas usuários autenticados podem adicionar)
*   **Policy for UPDATE**: `(auth.uid() IS NOT NULL)`
*   **Policy for DELETE**: `(auth.uid() IS NOT NULL)`

### Tabela: `tbl_calculos`
Função: Armazenar os dados específicos de um cálculo de rescisão de um funcionário.
| Campo | Tipo de Dado | Descrição |
| :--- | :--- | :--- |
| id | UUID (PK) | Chave primária. |
| cliente_id | UUID (FK) | Chave estrangeira para `tbl_clientes`. |
| sindicato_id | UUID (FK) | Chave estrangeira para `tbl_sindicatos`. |
| nome_funcionario | TEXT | Nome completo do funcionário. |
| cpf_funcionario | TEXT | CPF do funcionário. |
| funcao_funcionario | TEXT | Cargo/Função exercida. |
| inicio_contrato | DATE | Data de admissão. |
| fim_contrato | DATE | Data de demissão (ou projeção do aviso prévio). |
| tipo_aviso | ENUM | Tipo de aviso (e.g., 'Trabalhado pelo Empregado', 'Trabalhado pelo Empregador', 'Indenizado pelo Empregador', 'Indenizado pelo Empregado'). |
| salario_sindicato | NUMERIC | Piso salarial da categoria (se aplicável). |
| obs_sindicato | TEXT | Observações relevantes sobre o sindicato/CCT. |
| historia | TEXT | Histórico do contrato/motivo da rescisão (texto longo). |
| ctps_assinada | BOOLEAN | Indica se a CTPS foi devidamente assinada. |
| media_descontos | NUMERIC | Média dos descontos dos últimos 12 meses (para médias). |
| media_remuneracoes | NUMERIC | Média das remunerações variáveis dos últimos 12 meses (para médias - e.g., horas extras, comissões). |
| carga_horaria | TEXT | Descrição da jornada de trabalho (e.g., "44 horas semanais, segunda a sexta"). |

**RLS Policies para `tbl_calculos`:**
*   **Enable RLS**: ON
*   **Policy for SELECT**: `(EXISTS ( SELECT 1 FROM tbl_clientes WHERE (tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid())))`
*   **Policy for INSERT**: `(EXISTS ( SELECT 1 FROM tbl_clientes WHERE (tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid())))`
*   **Policy for UPDATE**: `(EXISTS ( SELECT 1 FROM tbl_clientes WHERE (tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid())))`
*   **Policy for DELETE**: `(EXISTS ( SELECT 1 FROM tbl_clientes WHERE (tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid())))`

### Tabela: `tbl_resposta_calculo`
Função: Armazenar a resposta gerada pela lógica de cálculo ou por um modelo de IA.
| Campo | Tipo de Dado | Descrição |
| :--- | :--- | :--- |
| id | UUID (PK) | Chave primária. |
| calculo_id | UUID (FK) | Chave estrangeira para `tbl_calculos`. |
| resposta_ai | TEXT | O texto/JSON contendo a discriminação do cálculo (detalhes das verbas, bases de cálculo, etc.). |
| data_hora | TIMESTAMP | Data e hora da geração da resposta. |

**RLS Policies para `tbl_resposta_calculo`:**
*   **Enable RLS**: ON
*   **Policy for SELECT**: `(EXISTS ( SELECT 1 FROM tbl_calculos WHERE (tbl_calculos.id = tbl_resposta_calculo.calculo_id) AND (EXISTS ( SELECT 1 FROM tbl_clientes WHERE (tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid())))))`
*   **Policy for INSERT**: `(EXISTS ( SELECT 1 FROM tbl_calculos WHERE (tbl_calculos.id = tbl_resposta_calculo.calculo_id) AND (EXISTS ( SELECT 1 FROM tbl_clientes WHERE (tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid())))))`
*   **Policy for UPDATE**: `(EXISTS ( SELECT 1 FROM tbl_calculos WHERE (tbl_calculos.id = tbl_resposta_calculo.calculo_id) AND (EXISTS ( SELECT 1 FROM tbl_clientes WHERE (tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid())))))`
*   **Policy for DELETE**: `(EXISTS ( SELECT 1 FROM tbl_calculos WHERE (tbl_calculos.id = tbl_resposta_calculo.calculo_id) AND (EXISTS ( SELECT 1 FROM tbl_clientes WHERE (tbl_clientes.id = tbl_calculos.cliente_id) AND (tbl_clientes.user_id = auth.uid())))))`

### Tabela: `tbl_webhook_configs`
Função: Armazenar as configurações de webhooks para cada usuário.
| Campo | Tipo de Dado | Descrição |
| :--- | :--- | :--- |
| id | UUID (PK) | Chave primária. |
| user_id | UUID (FK) | ID do usuário autenticado responsável por esta configuração. |
| title | TEXT | Título descritivo para o webhook (ex: 'Webhook para Clientes Salesforce'). |
| table_name | TEXT | Nome da tabela que o webhook monitora (e.g., 'tbl_clientes' ou 'all_tables'). |
| selected_fields | TEXT[] | Array de nomes dos campos selecionados para enviar. |
| webhook_url | TEXT | URL do endpoint do webhook. |

**RLS Policies para `tbl_webhook_configs`:**
*   **Enable RLS**: ON
*   **Policy for SELECT**: `(user_id = auth.uid())`
*   **Policy for INSERT**: `(user_id = auth.uid())`
*   **Policy for UPDATE**: `(user_id = auth.uid())`
*   **Policy for DELETE**: `(user_id = auth.uid())`

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
*   **Formulário de Cálculo (`/calculations/new` ou `/calculations/:id`)**:
    *   Permite criar um novo cálculo ou editar um existente.
    *   Campos: Cliente (dropdown), Sindicato (dropdown), Nome/CPF/Função do Funcionário, Início/Fim do Contrato (seletores de data), Tipo de Aviso (dropdown), Salário Sindicato, Observações Sindicato, Histórico do Contrato, CTPS Assinada (checkbox), Média de Descontos/Remunerações, Carga Horária.
*   **Página de Resultado do Cálculo (`/calculations/:id/result`)**:
    *   Exibe os detalhes do cálculo e a resposta gerada (simulada inicialmente).
    *   Botão para "Gerar Cálculo Preliminar" se não houver resultado.

### 4.7. Configurações de Webhooks (`/webhooks`)
*   **Lista de Webhooks**:
    *   Exibe todas as configurações de webhook do usuário.
    *   Opções para "Novo Webhook", "Editar" e "Excluir" (com confirmação).
*   **Formulário de Webhook**:
    *   Permite criar ou editar uma configuração de webhook.
    *   Campos:
        *   **Título do Webhook**: Um nome descritivo para o webhook.
        *   **Tabela**: Dropdown para selecionar a tabela a ser monitorada (`tbl_clientes`, `tbl_calculos`, `tbl_sindicatos`, `tbl_resposta_calculo` ou `TODOS (Todos os Campos)`).
        *   **Campos Selecionados**: Um seletor de múltiplos itens que lista os campos disponíveis da tabela selecionada.
            *   Se "TODOS" for selecionado, todos os campos de todas as tabelas são listados.
            *   Para tabelas específicas, apenas os campos diretos daquela tabela são listados.
        *   **URL do Webhook**: O endpoint para onde os dados serão enviados.
    *   A lógica de seleção de campos é dinâmica, mostrando apenas os campos relevantes para a tabela escolhida.

### 4.8. Utilidades
*   `src/utils/toast.ts`: Funções para exibir notificações de sucesso, erro e carregamento.
*   `src/utils/supabaseDataExtraction.ts`: Função auxiliar para extrair valores de objetos Supabase aninhados.
*   `src/utils/webhookFields.ts`: Definições de campos e funções para construir caminhos de seleção do Supabase e filtrar campos para exibição na UI.