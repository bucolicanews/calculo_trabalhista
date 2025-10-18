// ... (dentro da função handleIsActiveChange)

// Simula o evento de mudança para que o hook useWebhookManagement possa processar
handleChange({ 
    target: {
        name: 'is_active',
        value: checked,
    },
} as any); // Corrigido: Usando 'as any' para ignorar a verificação estrita do SyntheticEvent

// ... (e o erro 3 é resolvido pela atualização da interface)
<Select
    value={String(currentWebhook.vale_transporte)} // TS2339 resolvido pela atualização da interface
    onValueChange={handleValeTransporteChange}
>
// ...