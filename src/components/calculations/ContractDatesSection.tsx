import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractDatesSectionProps {
  inicio_contrato: string;
  fim_contrato: string;
  onDateChange: (name: string, date: Date | undefined) => void;
  disabled: boolean;
}

// Objeto de classes para estilizar o calendário. Pode ser reutilizado.
const calendarClassNames = {
  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
  month: "space-y-4",
  caption: "flex justify-center pt-1 relative items-center",
  caption_label: "text-sm font-medium text-orange-400",
  caption_dropdowns: "flex gap-2 [&_.rdp-vhidden]:hidden", // Esconde o label visualmente oculto que pode atrapalhar o layout
  nav: "space-x-1 flex items-center",
  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
  nav_button_previous: "absolute left-1",
  nav_button_next: "absolute right-1",
  table: "w-full border-collapse space-y-1",
  head_row: "flex",
  head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
  row: "flex w-full mt-2",
  cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-orange-600/20 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-gray-200",
  day_selected: "bg-orange-600 text-white hover:bg-orange-700 focus:bg-orange-600 focus:text-white rounded-md",
  day_today: "bg-gray-700 text-gray-100 rounded-md",
  day_outside: "text-gray-500 opacity-50",
  day_disabled: "text-gray-600 opacity-50",
  day_range_middle: "aria-selected:bg-orange-600/30 aria-selected:text-white",
  day_hidden: "invisible",
  // Classes para os dropdowns de Mês e Ano
  dropdown_month: "[&>div]:bg-gray-800 [&>div]:border-orange-700 [&>div]:text-white",
  dropdown_year: "[&>div]:bg-gray-800 [&>div]:border-orange-700 [&>div]:text-white",
};

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
                "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700 focus:ring-2 focus:ring-orange-500",
                !inicio_contrato && "text-gray-400"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {inicio_contrato ? format(new Date(inicio_contrato), 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-700">
            <Calendar
              mode="single"
              selected={inicio_contrato ? new Date(inicio_contrato) : undefined}
              onSelect={(date) => onDateChange('inicio_contrato', date)}
              initialFocus
              locale={ptBR}
              captionLayout="dropdown-buttons"
              fromYear={1950}
              toYear={new Date().getFullYear() + 5}
              classNames={calendarClassNames} // <-- AQUI A MÁGICA ACONTECE
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
                "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700 focus:ring-2 focus:ring-orange-500",
                !fim_contrato && "text-gray-400"
              )}
              disabled={disabled}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {fim_contrato ? format(new Date(fim_contrato), 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-700">
            <Calendar
              mode="single"
              selected={fim_contrato ? new Date(fim_contrato) : undefined}
              onSelect={(date) => onDateChange('fim_contrato', date)}
              initialFocus
              locale={ptBR}
              captionLayout="dropdown-buttons"
              fromYear={1950}
              toYear={new Date().getFullYear() + 5}
              classNames={calendarClassNames} // <-- AQUI A MÁGICA ACONTECE
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ContractDatesSection;