import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContractDatesSectionProps {
  inicio_contrato: string;
  fim_contrato: string;
  inicio_contrat_inregular: string; // FIX 4: Adicionado
  onDateChange: (name: string, dateString: string) => void;
}

const ContractDatesSection: React.FC<ContractDatesSectionProps> = ({
  inicio_contrato,
  fim_contrato,
  inicio_contrat_inregular,
  onDateChange,
}) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.name, e.target.value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="space-y-1">
        <Label htmlFor="inicio_contrato">Início do Contrato</Label>
        <Input
          id="inicio_contrato"
          name="inicio_contrato"
          type="date"
          value={inicio_contrato}
          onChange={handleDateChange}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="fim_contrato">Fim do Contrato</Label>
        <Input
          id="fim_contrato"
          name="fim_contrato"
          type="date"
          value={fim_contrato}
          onChange={handleDateChange}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="inicio_contrat_inregular">Início Contrato Irregular</Label>
        <Input
          id="inicio_contrat_inregular"
          name="inicio_contrat_inregular"
          type="date"
          value={inicio_contrat_inregular}
          onChange={handleDateChange}
        />
      </div>
    </div>
  );
};

export default ContractDatesSection;