import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractDatesSectionProps {
  inicio_contrato: string;
  fim_contrato: string;
  onDateChange: (name: string, date: Date | undefined) => void;
  disabled: boolean;
}

const ContractDatesSection: React.FC<ContractDatesSectionProps> = ({
  inicio_contrato,
  fim_contrato,
  onDateChange,
  disabled,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="inicio_contrato" className="text-gray-300">Início do Contrato</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                !inicio_contrato && "text-gray-500"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {inicio_contrato ? format(new Date(inicio_contrato), 'PPP') : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-500 text-white">
            <Calendar
              mode="single"
              selected={inicio_contrato ? new Date(inicio_contrato) : undefined}
              onSelect={(date) => onDateChange('inicio_contrato', date)}
              initialFocus
              className="bg-gray-900 text-white"
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <Label htmlFor="fim_contrato" className="text-gray-300">Fim do Contrato</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                !fim_contrato && "text-gray-500"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fim_contrato ? format(new Date(fim_contrato), 'PPP') : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-500 text-white">
            <Calendar
              mode="single"
              selected={fim_contrato ? new Date(fim_contrato) : undefined}
              onSelect={(date) => onDateChange('fim_contrato', date)}
              initialFocus
              className="bg-gray-900 text-white"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ContractDatesSection;