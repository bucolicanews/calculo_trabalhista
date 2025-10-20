import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AiPromptTemplate {
  id: string;
  title: string;
}

interface AiPromptTemplateSelectFieldProps {
  ai_template_id: string | null | undefined; 
  aiTemplates: AiPromptTemplate[];
  onValueChange: (value: string) => void;
  disabled: boolean;
}

const AiPromptTemplateSelectField: React.FC<AiPromptTemplateSelectFieldProps> = ({
  ai_template_id,
  aiTemplates,
  onValueChange,
  disabled,
}) => {
  // Garante que o valor do Select seja sempre uma string vazia ("") quando o estado for null/undefined.
  const controlledValue = ai_template_id || "";
  
  return (
    <div>
      <Label htmlFor="ai_template_id" className="text-gray-300">Modelo de Prompt IA (Opcional)</Label>
      <Select
        name="ai_template_id"
        value={controlledValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger className="bg-gray-800 border-orange-700 text-white focus:ring-orange-500">
          <SelectValue placeholder="Selecione um modelo de prompt IA" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          {aiTemplates.map((template) => (
            <SelectItem 
              key={template.id}
              value={template.id}
              className="text-white hover:bg-white-700 focus:bg-orange-700"
            >
              {template.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AiPromptTemplateSelectField;