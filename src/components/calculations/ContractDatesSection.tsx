import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
// Removemos: Button, Calendar, Popover, PopoverContent, PopoverTrigger, format, ptBR, CalendarIcon, e qualquer dependência de máscara externa.

interface ContractDatesSectionProps {
  // A data é uma string no formato DD/MM/AAAA.
  inicio_contrato: string;
  fim_contrato: string;
  // Adicionado o novo campo
  inicio_contrat_inregular: string;
  // A função de mudança recebe o nome do campo e a string mascarada.
  onDateChange: (name: string, dateString: string) => void;
  disabled: boolean;
}

// Estilização base para o Input, mantendo o tema escuro/laranja
const inputClassNames = cn(
  "flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white",
  "focus-visible:outline-none focus-visible:ring-2 focus:ring-orange-500", // A cor de foco laranja
  "disabled:cursor-not-allowed disabled:opacity-50"
);

/**
 * Aplica a máscara DD/MM/AAAA a uma string conforme o usuário digita.
 * Remove caracteres não numéricos e insere as barras automaticamente.
 */
const applyDateMask = (value: string): string => {
  // 1. Remove tudo que não for dígito
  let cleaned = value.replace(/\D/g, '');

  // 2. Limita a 8 dígitos (DDMMYYYY)
  if (cleaned.length > 8) {
    cleaned = cleaned.substring(0, 8);
  }

  // 3. Aplica a máscara: DD/MM/AAAA
  let masked = '';
  for (let i = 0; i < cleaned.length; i++) {
    // Insere a primeira barra após o dia (2 dígitos)
    if (i === 2) {
      masked += '/';
    }
    // Insere a segunda barra após o mês (4 dígitos no total)
    if (i === 4) {
      masked += '/';
    }
    masked += cleaned[i];
  }

  return masked;
};


const ContractDatesSection: React.FC<ContractDatesSectionProps> = ({
  inicio_contrato,
  fim_contrato,
  inicio_contrat_inregular, // Desestruturado
  onDateChange,
  disabled,
}) => {

  // Função unificada para manipular a mudança de qualquer input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Aplica a máscara ao valor atual do input
    const maskedValue = applyDateMask(value);

    // Envia o valor mascarado (ex: '11/10/2025') para o componente pai
    onDateChange(name, maskedValue);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* --- Início do Contrato (Input Manual com Máscara) --- */}
      <div>
        <Label htmlFor="inicio_contrato" className="text-gray-300">Início do Contrato</Label>
        <input
          id="inicio_contrato"
          name="inicio_contrato"
          type="text" // Tipo texto para permitir a máscara manual
          placeholder="DD/MM/AAAA"
          // O valor é o estado atual, que é uma string mascarada
          value={inicio_contrato}
          onChange={handleChange}
          disabled={disabled}
          maxLength={10} // Limita a 10 caracteres (incluindo as duas barras)
          className={inputClassNames}
        />
      </div>

      {/* --- Fim do Contrato (Input Manual com Máscara) --- */}
      <div>
        <Label htmlFor="fim_contrato" className="text-gray-300">Fim do Contrato</Label>
        <input
          id="fim_contrato"
          name="fim_contrato"
          type="text" // Tipo texto para permitir a máscara manual
          placeholder="DD/MM/AAAA"
          // O valor é o estado atual, que é uma string mascarada
          value={fim_contrato}
          onChange={handleChange}
          disabled={disabled}
          maxLength={10} // Limita a 10 caracteres (incluindo as duas barras)
          className={inputClassNames}
        />
      </div>
      
      {/* --- Início Contrato Irregular (NOVO CAMPO) --- */}
      <div>
        <Label htmlFor="inicio_contrat_inregular" className="text-gray-300">Início Contrato Irregular (Opcional)</Label>
        <input
          id="inicio_contrat_inregular"
          name="inicio_contrat_inregular"
          type="text"
          placeholder="DD/MM/AAAA"
          value={inicio_contrat_inregular}
          onChange={handleChange}
          disabled={disabled}
          maxLength={10}
          className={inputClassNames}
        />
      </div>
    </div>
  );
};

export default ContractDatesSection;