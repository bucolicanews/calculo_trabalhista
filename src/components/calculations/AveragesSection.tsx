import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface AveragesSectionProps {
  media_descontos: number;
  media_remuneracoes: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

const AveragesSection: React.FC<AveragesSectionProps> = ({
  media_descontos,
  media_remuneracoes,
  onChange,
  disabled,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="media_descontos" className="text-gray-300">Média Descontos (últimos 12 meses)</Label>
        <Input
          id="media_descontos"
          name="media_descontos"
          type="number"
          value={media_descontos}
          onChange={onChange}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="media_remuneracoes" className="text-gray-300">Média Remunerações Variáveis (últimos 12 meses)</Label>
        <Input
          id="media_remuneracoes"
          name="media_remuneracoes"
          type="number"
          value={media_remuneracoes}
          onChange={onChange}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default AveragesSection;