import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContractDatesSectionProps {
  // A data é uma string no formato ISO (AAAA-MM-DD) para inputs type="date".
  inicio_contrato: string;
  fim_contrato: string;
  inicio_contrat_inregular: string;
  // A função de mudança recebe o nome do campo e a string ISO.
  onDateChange: (name: string, dateString: string) => void;
  disabled: boolean;
}

const ContractDatesSection: React.FC<ContractDatesSectionProps> = ({
  inicio_contrato,
  fim_contrato,
  inicio_contrat_inregular,
  onDateChange,
  disabled,
}) => {

  // Função unificada para manipular a mudança de qualquer input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // O valor já é uma string ISO (AAAA-MM-DD) se for type="date"
    onDateChange(name, value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {/* --- Início do Contrato --- */}
      <div>
        <Label htmlFor="inicio_contrato" className="text-gray-300">Início do Contrato</Label>
        <Input
          id="inicio_contrato"
          name="inicio_contrato"
          type="date"
          value={inicio_contrato}
          onChange={handleChange}
          required
          disabled={disabled}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
        />
      </div>

      {/* --- Fim do Contrato --- */}
      <div>
        <Label htmlFor="fim_contrato" className="text-gray-300">Fim do Contrato</Label>
        <Input
          id="fim_contrato"
          name="fim_contrato"
          type="date"
          value={fim_contrato}
          onChange={handleChange}
          required
          disabled={disabled}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
        />
      </div>
      
      {/* --- Início Contrato Irregular (Opcional) --- */}
      <div>
        <Label htmlFor="inicio_contrat_inregular" className="text-gray-300">Início Contrato Irregular (Opcional)</Label>
        <Input
          id="inicio_contrat_inregular"
          name="inicio_contrat_inregular"
          type="date"
          value={inicio_contrat_inregular}
          onChange={handleChange}
          disabled={disabled}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
        />
      </div>
    </div>
  );
};

export default ContractDatesSection;