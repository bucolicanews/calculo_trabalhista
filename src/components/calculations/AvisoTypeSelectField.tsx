import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NoticeTypeOption {
  label: string;
  value: string;
}

interface AvisoTypeSelectFieldProps {
  tipo_aviso: string;
  noticeTypes: NoticeTypeOption[]; // Agora é um array de objetos
  onValueChange: (value: string) => void;
  disabled: boolean;
}

const AvisoTypeSelectField: React.FC<AvisoTypeSelectFieldProps> = ({
  tipo_aviso,
  noticeTypes,
  onValueChange,
  disabled,
}) => {
  return (
    <div>
      <Label htmlFor="tipo_aviso" className="text-gray-300">Tipo do Aviso</Label>
      <Select
        name="tipo_aviso"
        value={tipo_aviso}
        onValueChange={onValueChange}
        required
        disabled={disabled}
      >
        <SelectTrigger className="bg-gray-800 border-orange-700 text-white focus:ring-orange-500">
          <SelectValue placeholder="Selecione o tipo de rescisão" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          {noticeTypes.map((type) => (
            <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white-700 focus:bg-orange-700">
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AvisoTypeSelectField;