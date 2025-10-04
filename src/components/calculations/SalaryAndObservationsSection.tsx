import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface SalaryAndObservationsSectionProps {
  salario_sindicato: number;
  salario_trabalhador: number;
  obs_sindicato: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled: boolean;
}

const SalaryAndObservationsSection: React.FC<SalaryAndObservationsSectionProps> = ({
  salario_sindicato,
  salario_trabalhador,
  obs_sindicato,
  onChange,
  disabled,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salario_sindicato" className="text-gray-300">Piso Salarial Sindicato (R$)</Label>
          <Input
            id="salario_sindicato"
            name="salario_sindicato"
            type="number"
            value={salario_sindicato}
            onChange={onChange}
            className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
            disabled={disabled}
          />
        </div>
        <div>
          <Label htmlFor="salario_trabalhador" className="text-gray-300">Salário do Trabalhador (R$)</Label>
          <Input
            id="salario_trabalhador"
            name="salario_trabalhador"
            type="number"
            value={salario_trabalhador}
            onChange={onChange}
            className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
            disabled={disabled}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="obs_sindicato" className="text-gray-300">Observações Sindicato</Label>
        <Textarea
          id="obs_sindicato"
          name="obs_sindicato"
          value={obs_sindicato}
          onChange={onChange}
          rows={3}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
          disabled={disabled}
        />
      </div>
    </>
  );
};

export default SalaryAndObservationsSection;