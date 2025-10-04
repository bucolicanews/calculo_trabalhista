import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Sindicato {
  id: string;
  nome: string;
}

interface SindicatoSelectFieldProps {
  sindicato_id: string;
  sindicatos: Sindicato[];
  onValueChange: (value: string) => void;
  disabled: boolean;
}

const SindicatoSelectField: React.FC<SindicatoSelectFieldProps> = ({
  sindicato_id,
  sindicatos,
  onValueChange,
  disabled,
}) => {
  return (
    <div>
      <Label htmlFor="sindicato_id" className="text-gray-300">Sindicato (Opcional)</Label>
      <Select
        name="sindicato_id"
        value={sindicato_id}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-orange-500">
          <SelectValue placeholder="Selecione o sindicato" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          {sindicatos.map((sindicato) => (
            <SelectItem key={sindicato.id} value={sindicato.id} className="text-white hover:bg-gray-700 focus:bg-gray-700">
              {sindicato.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SindicatoSelectField;