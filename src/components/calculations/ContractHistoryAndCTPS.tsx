import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ContractHistoryAndCTPSProps {
  historia: string;
  ctps_assinada: boolean;
  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onCheckboxChange: (checked: boolean) => void;
  disabled: boolean;
}

const ContractHistoryAndCTPS: React.FC<ContractHistoryAndCTPSProps> = ({
  historia,
  ctps_assinada,
  onTextChange,
  onCheckboxChange,
  disabled,
}) => {
  return (
    <>
      <div>
        <Label htmlFor="historia" className="text-gray-300">Histórico do Contrato/Motivo da Rescisão</Label>
        <Textarea
          id="historia"
          name="historia"
          value={historia}
          onChange={onTextChange}
          rows={4}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
          disabled={disabled}
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ctps_assinada"
          checked={ctps_assinada}
          onCheckedChange={onCheckboxChange}
          className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
          disabled={disabled}
        />
        <Label htmlFor="ctps_assinada" className="text-gray-300">CTPS devidamente assinada?</Label>
      </div>
    </>
  );
};

export default ContractHistoryAndCTPS;