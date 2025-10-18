// ... (código anterior)

export interface WebhookFormState {
  id?: string;
  table_name: string;
  selected_fields: string[];
  webhook_url: string;
  title: string;
  vale_transporte?: string | boolean | null; // Adicionado para resolver o erro TS2339 (Erro 28)
}

// ... (restante do hook)