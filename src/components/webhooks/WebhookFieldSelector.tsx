import React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { FieldDefinition } from '@/utils/webhookFields';

interface WebhookFieldSelectorProps {
  selectedFields: string[];
  availableFields: FieldDefinition[];
  onFieldToggle: (fieldKey: string) => void;
  onToggleSelectAll: () => void;
  disabled: boolean;
  fieldPopoverOpen: boolean;
  setFieldPopoverOpen: (open: boolean) => void;
}

const WebhookFieldSelector: React.FC<WebhookFieldSelectorProps> = ({
  selectedFields,
  availableFields,
  onFieldToggle,
  onToggleSelectAll,
  disabled,
  fieldPopoverOpen,
  setFieldPopoverOpen,
}) => {
  const areAllFieldsSelected = availableFields.length > 0 && selectedFields.length === availableFields.length;

  console.log("WebhookFieldSelector - selectedFields:", selectedFields); // Log para depuração

  return (
    <Popover open={fieldPopoverOpen} onOpenChange={setFieldPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={fieldPopoverOpen}
          className="col-span-3 justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          disabled={disabled}
        >
          {selectedFields.length > 0
            ? `${selectedFields.length} campo(s) selecionado(s)`
            : "Selecione os campos..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-gray-900 border-orange-500"> {/* Fundo escuro e borda laranja */}
        <Command>
          <CommandInput placeholder="Buscar campo..." className="bg-gray-800 border-gray-700 text-white focus:border-orange-500" /> {/* Estilo para o input de busca */}
          <CommandEmpty className="text-gray-400">Nenhum campo encontrado.</CommandEmpty> {/* Texto visível */}
          <CommandGroup className="max-h-60 overflow-y-auto">
            {availableFields.length > 0 && (
              <>
                <CommandItem
                  onSelect={onToggleSelectAll}
                  className="flex items-center justify-between cursor-pointer hover:bg-gray-700 text-orange-400 font-semibold"
                >
                  {areAllFieldsSelected ? 'Limpar Seleção' : 'Selecionar Todos'}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      areAllFieldsSelected ? "opacity-100 text-orange-500" : "opacity-0"
                    )}
                  />
                </CommandItem>
                <div className="my-1 h-px bg-gray-700" /> {/* Separador adicionado */}
              </>
            )}
            {availableFields.map((field) => (
              // Texto branco no fundo escuro
              <CommandItem
                key={field.key}
                onSelect={() => onFieldToggle(field.key)}
                className="flex items-center justify-between cursor-pointer hover:bg-gray-700 text-white"
              >
                {field.label}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    selectedFields.includes(field.key) ? "opacity-100 text-orange-500" : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default WebhookFieldSelector;