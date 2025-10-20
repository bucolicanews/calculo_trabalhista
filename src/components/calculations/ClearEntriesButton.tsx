// src/components/calculations/ClearEntriesButton.tsx

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

interface ClearEntriesButtonProps {
    calculationId: string; // Adicionado
    // Passamos uma função para ser executada após o sucesso, como recarregar os dados.
    onSuccess: () => void;
}

const ClearEntriesButton: React.FC<ClearEntriesButtonProps> = ({ calculationId, onSuccess }) => {
    // Removido useParams, pois calculationId agora é passado via props
    const [isClearing, setIsClearing] = useState(false);

    const handleClearEntries = async () => {
        // Validação para garantir que temos um ID
        if (!calculationId) {
            showError("ID do cálculo não encontrado.");
            return;
        }

        // Pede confirmação ao usuário antes de uma ação destrutiva
        if (!window.confirm("Tem certeza que deseja apagar todos os proventos e descontos deste cálculo? Esta ação não pode ser desfeita.")) {
            return;
        }

        setIsClearing(true);
        showSuccess("Limpando registros, por favor aguarde...");

        try {
            console.log(`🚀 Invocando 'clear-calculation-entries' para o ID: ${calculationId}`);

            const { error } = await supabase.functions.invoke('clear-calculation-entries', {
                body: { calculationId: calculationId },
            });

            if (error) {
                // Lança um erro para ser pego pelo bloco catch
                throw new Error(`Falha ao limpar registros: ${error.message}`);
            }

            console.log("✅ Registros limpos com sucesso!");
            showSuccess("Todos os proventos e descontos foram apagados.");

            // Executa a função de callback (ex: recarregar os dados da página)
            onSuccess();

        } catch (e: any) {
            console.error("💥 ERRO CRÍTICO AO LIMPAR REGISTROS:", e);
            showError(e.message);
        } finally {
            setIsClearing(false);
        }
    };

    return (
        <Button
            onClick={handleClearEntries}
            className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto flex items-center justify-center transition-all duration-300"
            disabled={isClearing}
        >
            <Trash2 className="h-4 w-4 mr-2" />
            {isClearing ? 'Limpando...' : 'Limpar Lançamentos'}
        </Button>
    );
};

export default ClearEntriesButton;