import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface EmployeeDetailsSectionProps {
  nome_funcionario: string;
  cpf_funcionario: string;
  funcao_funcionario: string;
  carga_horaria: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  disabled: boolean;
}

const EmployeeDetailsSection: React.FC<EmployeeDetailsSectionProps> = ({
  nome_funcionario,
  cpf_funcionario,
  funcao_funcionario,
  carga_horaria,
  onChange,
  disabled,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="nome_funcionario" className="text-gray-300">Nome do Funcionário</Label>
        <Input
          id="nome_funcionario"
          name="nome_funcionario"
          value={nome_funcionario}
          onChange={onChange}
          required
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="cpf_funcionario" className="text-gray-300">CPF do Funcionário</Label>
        <Input
          id="cpf_funcionario"
          name="cpf_funcionario"
          value={cpf_funcionario}
          onChange={onChange}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="funcao_funcionario" className="text-gray-300">Função do Funcionário</Label>
        <Input
          id="funcao_funcionario"
          name="funcao_funcionario"
          value={funcao_funcionario}
          onChange={onChange}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
          disabled={disabled}
        />
      </div>
      <div>
        <Label htmlFor="carga_horaria" className="text-gray-300">Carga Horária</Label>
        <Textarea
          id="carga_horaria"
          name="carga_horaria"
          value={carga_horaria}
          onChange={onChange}
          rows={3}
          className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default EmployeeDetailsSection;