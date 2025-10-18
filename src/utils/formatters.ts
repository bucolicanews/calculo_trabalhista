/**
 * Formata um número ou string para exibição em formato de moeda (R$ X.XXX,XX).
 * Se o valor for nulo ou indefinido, retorna uma string vazia.
 */
export const formatCurrencyForDisplay = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const num = typeof value === 'string' ? parseCurrencyToNumber(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num).replace('R$', '').trim(); // Remove o R$ para que o usuário possa digitar apenas o valor
};

/**
 * Converte uma string formatada de moeda (ex: '1.234,56') para um número float.
 */
export const parseCurrencyToNumber = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return value;
  }
  // Remove pontos de milhar e substitui vírgula decimal por ponto
  const cleanedValue = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleanedValue);
  return isNaN(num) ? 0 : num;
};