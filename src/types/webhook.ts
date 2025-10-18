// Assumindo a estrutura da interface WebhookFormState
export interface WebhookFormState {
    id: string;
    url: string;
    is_active: boolean;
    // ... outros campos
    vale_transporte: string | boolean | null; // Adicionado para resolver TS2339
    // ...
}