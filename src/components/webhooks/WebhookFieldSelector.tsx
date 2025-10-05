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

  // Add a log here to see the actual count of available fields
  React.useEffect(() => {
    if (fieldPopoverOpen) {
      console.log("[WebhookFieldSelector] Available fields count:", availableFields.length);
      console.log("[WebhookFieldSelector] Selected fields count:", selectedFields.length);
    }
  }, [fieldPopoverOpen, availableFields.length, selectedFields.length]);

  return (
    <Popover open={fieldPopoverOpen} onOpenChange={setFieldPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={fieldPopoverOpen}
          className="col-span-1 sm:col-span-3 justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
          disabled={disabled}
        >
          {selectedFields.length > 0
            ? `${selectedFields.length} campo(s) selecionado(s)`
            : "Selecione os campos..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Buscar campo..." />
          <CommandEmpty>Nenhum campo encontrado.</CommandEmpty>
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
                <div className="my-1 h-px bg-orange-900" /> {/* Separador adicionado */}
              </>
            )}
            {availableFields.map((field) => (
              <CommandItem
                key={field.key}
                onSelect={() => onFieldToggle(field.key)}
                className="flex items-center justify-between cursor-pointer hover:bg-orange-700 text-red"
              >
                {field.label}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    selectedFields.includes(field.key) ? "border-2 border-red-500 opacity-100 text-red-500" : "opacity-0"
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