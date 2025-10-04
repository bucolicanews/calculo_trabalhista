import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NoticeTypeOption {
  label: string;
  value: string;
}

interface RescissionTypeSelectFieldProps {
  tipo_aviso: string;
  noticeTypes: NoticeTypeOption[]; // Agora é um array de objetos
  onValueChange: (value: string) => void;
  disabled: boolean;
}

const RescissionTypeSelectField: React.FC<RescissionTypeSelectFieldProps> = ({
  tipo_aviso,
  noticeTypes,
  onValueChange,
  disabled,
}) => {
  return (
    <div>
      <Label htmlFor="tipo_aviso" className="text-gray-300">Tipo de Rescisão</Label>
      <Select
        name="tipo_aviso"
        value={tipo_aviso}
        onValueChange={onValueChange}
        required
        disabled={disabled}
      >
        <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-orange-500">
          <SelectValue placeholder="Selecione o tipo de rescisão" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          {noticeTypes.map((type) => (
            <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700 focus:bg-gray-700">
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default RescissionTypeSelectField;