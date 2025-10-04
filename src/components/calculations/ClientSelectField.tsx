import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Client {
  id: string;
  nome: string;
}

interface ClientSelectFieldProps {
  cliente_id: string;
  clients: Client[];
  onValueChange: (value: string) => void;
  disabled: boolean;
}

const ClientSelectField: React.FC<ClientSelectFieldProps> = ({
  cliente_id,
  clients,
  onValueChange,
  disabled,
}) => {
  return (
    <div>
      <Label htmlFor="cliente_id" className="text-gray-300">Cliente</Label>
      <Select
        name="cliente_id"
        value={cliente_id}
        onValueChange={onValueChange}
        required
        disabled={disabled}
      >
        <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-orange-500">
          <SelectValue placeholder="Selecione o cliente" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700 text-white">
          {clients.map((client) => (
            <SelectItem key={client.id} value={client.id} className="text-white hover:bg-gray-700 focus:bg-gray-700">
              {client.nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClientSelectField;