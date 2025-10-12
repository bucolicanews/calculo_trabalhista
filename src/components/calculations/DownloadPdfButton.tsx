// src/components/calculations/DownloadPdfButton.tsx

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { showError } from '@/utils/toast';

interface DownloadPdfButtonProps {
    calculationId: string | undefined;
}

const DownloadPdfButton: React.FC<DownloadPdfButtonProps> = ({ calculationId }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownload = async () => {
        if (!calculationId) {
            showError('ID do cálculo não fornecido.');
            return;
        }

        setIsLoading(true);

        try {
            const { data, error: functionError } = await supabase.functions.invoke('gerar-pdf-rescisao', {
                body: { calculoId: calculationId },
            });

            if (functionError) {
                throw functionError;
            }

            // ✅ MUDANÇA 1: Diga ao navegador que o conteúdo é HTML
            const blob = new Blob([data], { type: 'text/html' });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // ✅ MUDANÇA 2: Salve o arquivo com a extensão .html
            a.download = `demonstrativo_rescisao_${calculationId}.html`;

            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err: any) {
            console.error('Erro detalhado ao gerar o arquivo:', err);
            showError(err.message || 'Falha ao gerar o demonstrativo. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            onClick={handleDownload}
            disabled={isLoading || !calculationId}
            className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto flex items-center justify-center"
        >
            <Download className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Gerando...' : 'Baixar Demonstrativo'}
        </Button>
    );
};

export default DownloadPdfButton;