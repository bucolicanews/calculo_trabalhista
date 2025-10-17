// ... (código anterior)

// Componente para o botão de copiar
const CopyButton: React.FC<{ content: string; buttonId: string; copiedButton: string | null; onClick: () => void; }> = ({ buttonId, copiedButton, onClick }) => { // FIX 8: 'content' removido da desestruturação
    const isCopied = copiedButton === buttonId;
// ... (código posterior)