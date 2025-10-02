import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Client {
  id: string;
  nome: string;
}

interface Sindicato {
  id: string;
  nome: string;
}

// Nova lista de Tipos de Rescisão de Contrato de Trabalho
const noticeTypes = [
  'Rescisão com Justa Causa',
  'Rescisão sem Justa Causa',
  'Pedido de Demissão',
  'Rescisão Antecipada do Contrato a Termo (Empregador)',
  'Rescisão Antecipada do Contrato a Termo (Empregado)',
  'Término do Contrato a Termo',
  'Rescisão por Culpa Recíproca',
  'Rescisão Indireta',
  'Rescisão por Falecimento do Empregado',
  'Encerramento da Empresa',
];

const CalculationFormPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [calculation, setCalculation] = useState({
    cliente_id: '',
    sindicato_id: '',
    nome_funcionario: '',
    cpf_funcionario: '',
    funcao_funcionario: '',
    inicio_contrato: '',
    fim_contrato: '',
    tipo_aviso: '', // Este campo agora representa o tipo de rescisão
    salario_sindicato: 0,
    obs_sindicato: '',
    historia: '',
    ctps_assinada: false,
    media_descontos: 0,
    media_remuneracoes: 0,
    carga_horaria: '',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [sindicatos, setSindicatos] = useState<Sindicato[]>([]);
  const [loading, setLoading] = useState(true);
  const isEditing = !!id;

  useEffect(() => {
    if (user) {
      fetchClientsAndSindicatos();
      if (isEditing) {
        fetchCalculation();
      } else {
        setLoading(false);
      }
    }
  }, [id, isEditing, user]);

  const fetchClientsAndSindicatos = async () => {
    const { data: clientsData, error: clientsError } = await supabase
      .from('tbl_clientes')
      .select('id, nome')
      .eq('user_id', user?.id);

    if (clientsError) {
      showError('Erro ao carregar clientes: ' + clientsError.message);
      console.error('Error fetching clients:', clientsError);
    } else {
      setClients(clientsData || []);
    }

    const { data: sindicatosData, error: sindicatosError } = await supabase
      .from('tbl_sindicatos')
      .select('id, nome');

    if (sindicatosError) {
      showError('Erro ao carregar sindicatos: ' + sindicatosError.message);
      console.error('Error fetching sindicatos:', sindicatosError);
    } else {
      setSindicatos(sindicatosData || []);
    }
  };

  const fetchCalculation = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_calculos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      showError('Erro ao carregar cálculo: ' + error.message);
      console.error('Error fetching calculation:', error);
      navigate('/dashboard');
    } else if (data) {
      setCalculation({
        ...data,
        inicio_contrato: data.inicio_contrato || '',
        fim_contrato: data.fim_contrato || '',
      });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCalculation((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCalculation((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date | undefined) => {
    setCalculation((prev) => ({
      ...prev,
      [name]: date ? format(date, 'yyyy-MM-dd') : '',
    }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setCalculation((prev) => ({ ...prev, ctps_assinada: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }
    setLoading(true);

    const calculationData = {
      ...calculation,
      salario_sindicato: calculation.salario_sindicato || 0,
      media_descontos: calculation.media_descontos || 0,
      media_remuneracoes: calculation.media_remuneracoes || 0,
    };

    let response;
    if (isEditing) {
      response = await supabase
        .from('tbl_calculos')
        .update(calculationData)
        .eq('id', id);
    } else {
      response = await supabase
        .from('tbl_calculos')
        .insert(calculationData);
    }

    if (response.error) {
      showError('Erro ao salvar cálculo: ' + response.error.message);
      console.error('Error saving calculation:', response.error);
    } else {
      showSuccess(`Cálculo ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/dashboard'); // Or to a calculation detail page
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando formulário de cálculo...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-orange-500 mb-8 text-center">
          {isEditing ? 'Editar Cálculo' : 'Novo Cálculo de Rescisão'}
        </h1>
        <Card className="max-w-3xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="2xl text-orange-500">Dados do Cálculo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cliente */}
              <div>
                <Label htmlFor="cliente_id" className="text-gray-300">Cliente</Label>
                <Select
                  name="cliente_id"
                  value={calculation.cliente_id}
                  onValueChange={(value) => handleSelectChange('cliente_id', value)}
                  required
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-orange-500">
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id} className="text-white hover:bg-gray-700 focus:bg-gray-700 focus:text-white">
                        {client.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sindicato */}
              <div>
                <Label htmlFor="sindicato_id" className="text-gray-300">Sindicato (Opcional)</Label>
                <Select
                  name="sindicato_id"
                  value={calculation.sindicato_id}
                  onValueChange={(value) => handleSelectChange('sindicato_id', value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-orange-500">
                    <SelectValue placeholder="Selecione o sindicato" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {sindicatos.map((sindicato) => (
                      <SelectItem key={sindicato.id} value={sindicato.id} className="text-white hover:bg-gray-700 focus:bg-gray-700 focus:text-white">
                        {sindicato.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dados do Funcionário */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_funcionario" className="text-gray-300">Nome do Funcionário</Label>
                  <Input
                    id="nome_funcionario"
                    name="nome_funcionario"
                    value={calculation.nome_funcionario}
                    onChange={handleChange}
                    required
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="cpf_funcionario" className="text-gray-300">CPF do Funcionário</Label>
                  <Input
                    id="cpf_funcionario"
                    name="cpf_funcionario"
                    value={calculation.cpf_funcionario}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="funcao_funcionario" className="text-gray-300">Função do Funcionário</Label>
                  <Input
                    id="funcao_funcionario"
                    name="funcao_funcionario"
                    value={calculation.funcao_funcionario}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="carga_horaria" className="text-gray-300">Carga Horária</Label>
                  <Input
                    id="carga_horaria"
                    name="carga_horaria"
                    value={calculation.carga_horaria}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Datas do Contrato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inicio_contrato" className="text-gray-300">Início do Contrato</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal bg-gray-800 border-gray-700 text-white hover:bg-gray-700",
                          !calculation.inicio_contrato && "text-gray-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {calculation.inicio_contrato ? format(new Date(calculation.inicio_contrato), 'PPP') : <span>Selecione a data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-500 text-white">
                      <Calendar
                        mode="single"
                        selected={calculation.inicio_contrato ? new Date(calculation.inicio_contrato) : undefined}
                        onSelect={(date) => handleDateChange('inicio_contrato', date)}
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
                          !calculation.fim_contrato && "text-gray-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {calculation.fim_contrato ? format(new Date(calculation.fim_contrato), 'PPP') : <span>Selecione a data</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-gray-900 border-orange-500 text-white">
                      <Calendar
                        mode="single"
                        selected={calculation.fim_contrato ? new Date(calculation.fim_contrato) : undefined}
                        onSelect={(date) => handleDateChange('fim_contrato', date)}
                        initialFocus
                        className="bg-gray-900 text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Tipo de Aviso / Rescisão */}
              <div>
                <Label htmlFor="tipo_aviso" className="text-gray-300">Tipo de Rescisão</Label>
                <Select
                  name="tipo_aviso"
                  value={calculation.tipo_aviso}
                  onValueChange={(value) => handleSelectChange('tipo_aviso', value)}
                  required
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white focus:ring-orange-500">
                    <SelectValue placeholder="Selecione o tipo de rescisão" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {noticeTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-white hover:bg-gray-700 focus:bg-gray-700 focus:text-white">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Salário Sindicato e Observações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salario_sindicato" className="text-gray-300">Piso Salarial Sindicato (R$)</Label>
                  <Input
                    id="salario_sindicato"
                    name="salario_sindicato"
                    type="number"
                    value={calculation.salario_sindicato}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="obs_sindicato" className="text-gray-300">Observações Sindicato</Label>
                  <Input
                    id="obs_sindicato"
                    name="obs_sindicato"
                    value={calculation.obs_sindicato}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Médias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="media_descontos" className="text-gray-300">Média Descontos (últimos 12 meses)</Label>
                  <Input
                    id="media_descontos"
                    name="media_descontos"
                    type="number"
                    value={calculation.media_descontos}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  />
                </div>
                <div>
                  <Label htmlFor="media_remuneracoes" className="text-gray-300">Média Remunerações Variáveis (últimos 12 meses)</Label>
                  <Input
                    id="media_remuneracoes"
                    name="media_remuneracoes"
                    type="number"
                    value={calculation.media_remuneracoes}
                    onChange={handleChange}
                    className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Histórico e CTPS */}
              <div>
                <Label htmlFor="historia" className="text-gray-300">Histórico do Contrato/Motivo da Rescisão</Label>
                <Textarea
                  id="historia"
                  name="historia"
                  value={calculation.historia}
                  onChange={handleChange}
                  rows={4}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ctps_assinada"
                  checked={calculation.ctps_assinada}
                  onCheckedChange={handleCheckboxChange}
                  className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-white"
                />
                <Label htmlFor="ctps_assinada" className="text-gray-300">CTPS devidamente assinada?</Label>
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar Cálculo' : 'Criar Cálculo')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default CalculationFormPage;