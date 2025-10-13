import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft, Brain } from 'lucide-react';

interface AiPromptTemplateState {
  id?: string;
  title: string;
  identificacao: string;
  comportamento: string;
  restricoes: string;
  atribuicoes: string;
  leis: string;
  proventos: string;
  descontos: string;
  observacoes_base_legal: string;
  estrutura_json_modelo_saida: string; // Campo do DB
  instrucoes_entrada_dados_rescisao: string; // Campo do DB
}

const modelTemplate: AiPromptTemplateState = {
  title: "PHD Cálculo Trabalhista",
  identificacao: `Você é um Especialista Sênior em Cálculo Trabalhista e Tributário (CLT). Sua única responsabilidade é analisar os dados de entrada de uma rescisão contratual e preencher o JSON de saída com os valores e detalhes de cálculo corretos.`,
  comportamento: `Rigor Legal: Baseie todos os cálculos e descrições nas normas da CLT, Lei 8.036/90 (FGTS), Decreto 3.048/99 (INSS) e Normas Coletivas (CCT/ACT) aplicáveis, assumindo que as CCTs devem ser respeitadas. 2. Completo e Objetivo: Você deve preencher TODOS os campos de proventos e descontos presentes na estrutura JSON. Se um item não for aplicável, o campo "Valor" deve ser 0.00, e o campo "Memoria_de_Calculo" deve justificar a não aplicação. 3. Cálculo Detalhado: O campo "Memoria_de_Calculo" deve ser a explicação textual passo a passo que levou ao "Valor" final.`,
  restricoes: `Saída Única: Sua única saída deve ser o bloco de código JSON completo. 2. Sem Prosa: NUNCA inclua qualquer texto introdutório, conclusivo, observações ou explicações fora do bloco de código JSON. 3. Formato Rígido: O JSON deve aderir estritamente à estrutura fornecida, incluindo todos os campos, chaves e ordem.
Nunca calcular o desconto do INSS se o trabalhador não estiver de CTPS assinada.
Nunca invente nenhum valor qunado o valro o campo estiver null ou zerado.
Nunca lançar multa de 40% nos proventos quando o funcionario estiver de CTPS assinada (true)
Nunca lançar Saldo do FGTS nos proventos quando o funcionario estiver de CTPS assinada (true)`,
  atribuicoes: `Cálculo da Base: Calcule o Valor final para cada provento e desconto. 2. Preenchimento do JSON: Insira os valores calculados no campo "Valor" e a justificativa no campo "Memoria_de_Calculo". 3. Manter Metadados: Mantenha inalterados os campos "Legislação", "Exemplos_Aplicaveis", "Fórmula_Sugerida" e "Natureza_da_Verba".`,
  leis: `Constituição Federal	CF/88, Art. 7º	Direitos Fundamentais: Estabelece o rol mínimo de direitos sociais, servindo como base para todos os cálculos de 13º Salário, Férias + 1/3, FGTS e proteção contra dispensa arbitrária.
Consolidação das Leis do Trabalho	Decreto-Lei nº 5.452/43 (CLT)	Regra Geral: Principal fonte para verbas como Saldo de Salário, Aviso Prévio, Férias, 13º Salário, Adicionais (Insalubridade/Periculosidade) e limites de desconto. É a base para a maioria dos campos do JSON.
Lei do Fundo de Garantia por Tempo de Serviço	Lei nº 8.036/90	FGTS e Multas: Define as regras de depósito (8%) e, crucialmente, as multas rescisórias (40% ou 20%) e o saque do FGTS.
Regulamento da Previdência Social	Decreto nº 3.048/99	INSS: Contém o Regulamento que, em seu Artigo 214 e parágrafos, define precisamente a base de cálculo e as verbas de natureza indenizatória (como Férias Indenizadas e Aviso Prévio Indenizado) que são isentos do INSS.
Regulamento do Imposto de Renda	Decreto nº 9.580/2018	IRRF: Define as regras de retenção na fonte e, principalmente, as verbas que são isentadas do IRRF (Férias Indenizadas, FGTS, etc.).
Aviso Prévio Proporcional	Lei nº 12.506/2011	Detalha o cálculo do aviso prévio, adicionando 3 dias por ano de serviço completo (além dos 30 dias base).
Décimo Terceiro Salário	Lei nº 4.090/62	Regulamenta o pagamento do 13º, essencial para o cálculo das avos proporcionais.
Consignação em Folha	Lei nº 10.820/03	Base legal para o desconto de empréstimos consignados e seu limite na rescisão.
Jornada de Trabalho	CLT, Art. 59 e Súmulas do TST	Regras para cálculo de Horas Extras (50%, 100%) e Banco de Horas.
Proteção contra Despedida Arbitrária	Lei nº 7.998/90	Define as regras para liberação do Seguro-Desemprego.`,
  proventos: `[
  {
    "Provento": "Média_de_Verbas_Variáveis_(Integração_à_Base)",
    "Cálculo": {
      "Parametro": "Média_das_Variáveis_Pendentes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Média_Horas_Extras + Média_Comissões + Média_Adicionais) / N_Meses"
    },
    "Memoria_de_Calculo": "Base: Verbas variáveis pagas nos últimos 12 meses (Horas Extras, Adicional Noturno, Comissões, etc.). Cálculo: Soma dessas verbas dividida por 12. Este valor deve ser somado ao Salário Base Fixo para compor a Remuneração Média.",
    "Legislação": "Súmulas 264 e 347 do TST",
    "Exemplos_Aplicaveis": "O valor encontrado aqui é a base para corrigir o Salário Base (Salário Base Corrigido).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Base_de_Cálculo_Rescisória",
    "Cálculo": {
      "Parametro": "Remuneração_Média_para_Proporcionais",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Fixo + Média_de_Verbas_Variáveis"
    },
    "Memoria_de_Calculo": "Base: Salário Base Fixo do Contrato. Cálculo: Soma do Salário Base Fixo com o valor calculado na verba 'Média_de_Verbas_Variáveis_(Integração_à_Base)'. Este valor compõe o Salário Base Corrigido/Remuneração Média utilizado como base para Férias, 13º e Aviso Prévio.",
    "Legislação": "Súmulas 264 e 347 do TST",
    "Exemplos_Aplicaveis": "É a remuneração integral (Salário Base Corrigido) considerada para calcular todas as verbas proporcionais e indenizadas.",
    "Natureza_da_Verba": "Informativa"
  },
  {
    "Provento": "Saldo_de_Salário",
    "Cálculo": {
      "Parametro": "Dias_Trabalhados_no_Mês",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido/Remuneração Média. Cálculo: (Salário Base Corrigido / 30) * [Número de Dias Trabalhados no Mês da Rescisão].",
    "Legislação": "CLT, Art. 457, §1º",
    "Exemplos_Aplicaveis": "Qualquer tipo de rescisão contratual.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Diferença_Salarial_Retroativa_(Piso_ou_Função)",
    "Cálculo": {
      "Parametro": "Meses_de_Diferença_a_ser_Paga",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_das_diferenças_mensais (Salário_Devido - Salário_Pago) * Meses_do_Contrato"
    },
    "Memoria_de_Calculo": "Cálculo: (Piso Salarial da Categoria - Salário Pago) multiplicado pelo número de meses em que a diferença foi devida.",
    "Legislação": "CLT, Art. 460 e Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Aplica-se quando o salário pago é inferior ao piso da categoria ou quando há acúmulo/desvio de função.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "13º_Salário_Devido_Anos_Anteriores",
    "Cálculo": {
      "Parametro": "Anos_Integrais_Pendentes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Corrigido * N_Anos"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: Salário Base Corrigido multiplicado pelo número de anos integrais pendentes de pagamento do 13º.",
    "Legislação": "Lei 4.090/62",
    "Exemplos_Aplicaveis": "Quando o 13º Salário de anos anteriores não foi pago no prazo legal.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "13º_Salário_Integral_(Ano_Corrente)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Rescisão_em_Dezembro",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Corrigido * 1.0"
    },
    "Memoria_de_Calculo": "Aplicável se a rescisão ocorrer em dezembro. Base: Salário Base Corrigido. Cálculo: Salário Base Corrigido * 1.0.",
    "Legislação": "Lei 4.090/62",
    "Exemplos_Aplicaveis": "Devido integralmente no ano da rescisão (se a rescisão ocorrer em Dezembro).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "13º_Salário_Proporcional",
    "Cálculo": {
      "Parametro": "Meses_Trabalhados_no_Ano",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: (Salário Base Corrigido / 12) * [Número de Meses Proporcionais (mês com 15 dias ou mais)].",
    "Legislação": "Lei 4.090/62",
    "Exemplos_Aplicaveis": "Avos do 13º devidos no ano da rescisão (exceto justa causa).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "13º_do_Aviso_(Projeção)",
    "Cálculo": {
      "Parametro": "Projeção_do_Aviso_Prévio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * 1_Mês"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
    "Legislação": "CLT, Art. 487, §1º",
    "Exemplos_Aplicaveis": "1/12 avos do 13º Salário referente ao mês projetado pelo aviso prévio indenizado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Férias_Vencidas_Simples_(Indenizadas)",
    "Cálculo": {
      "Parametro": "Qtd_Períodos_Vencidos_Não_Dobrados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos não dobrados.",
    "Legislação": "CLT, Art. 146",
    "Exemplos_Aplicaveis": "Férias vencidas, mas que ainda não atingiram o período para pagamento em dobro (após 12 meses do período concessivo).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Férias_Vencidas_em_Dobro_(Indenizadas)",
    "Cálculo": {
      "Parametro": "Qtd_Períodos_Vencidos_Dobrados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos * 2"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos dobrados (multiplicar por 2).",
    "Legislação": "CLT, Art. 137",
    "Exemplos_Aplicaveis": "Férias vencidas, não usufruídas, e que já ultrapassaram o período concessivo.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Férias_Proporcionais",
    "Cálculo": {
      "Parametro": "Meses_Proporcionais_de_Férias",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: (Salário Base Corrigido / 12) multiplicado pelo número de meses proporcionais no último período aquisitivo.",
    "Legislação": "CLT, Art. 147",
    "Exemplos_Aplicaveis": "Meses trabalhados no último período aquisitivo (geralmente pago exceto em justa causa).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Férias_do_Aviso_Prévio",
    "Cálculo": {
      "Parametro": "Meses_Projetados_pelo_Aviso",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Projetados"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
    "Legislação": "CLT, Art. 487, §1º",
    "Exemplos_Aplicaveis": "Projeção de férias referente ao período indenizado do Aviso Prévio.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Um_Terço_Constitucional_Geral",
    "Cálculo": {
      "Parametro": "Soma_de_Todas_as_Férias",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Férias_Vencidas_Simples + Férias_Dobro + Férias_Proporcionais + Férias_Aviso) * 1/3"
    },
    "Memoria_de_Calculo": "Base: Soma de todas as verbas de Férias (Vencidas, Dobradas, Proporcionais, Aviso). Cálculo: Soma da Base de Férias * 1/3 (0.3333).",
    "Legislação": "CF/88, Art. 7º, XVII",
    "Exemplos_Aplicaveis": "Adicional obrigatório de 1/3 incidente sobre a soma de todas as verbas de férias.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Aviso_Prévio_Indenizado_pelo_Empregador",
    "Cálculo": {
      "Parametro": "Dias_de_Aviso",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_de_Aviso"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Aviso Prévio Devidos (30 dias + 3 dias/ano)].",
    "Legislação": "CLT, Art. 487 e Lei 12.506/11",
    "Exemplos_Aplicaveis": "Demissão sem justa causa, dispensa indireta. Base de cálculo deve incluir as médias das verbas variáveis.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Horas_Extras_50_Por_Cento",
    "Cálculo": {
      "Parametro": "Total_Horas_Pendentes_50%",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora_Normal * 1.50 * Total_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.50 * [Total de Horas Extras a 50% Pendentes].",
    "Legislação": "CF/88, Art. 7º, XVI e CLT, Art. 59",
    "Exemplos_Aplicaveis": "Horas trabalhadas em dias úteis fora da jornada normal (acréscimo mínimo de 50%).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Horas_Extras_70_Por_Cento",
    "Cálculo": {
      "Parametro": "Total_Horas_Pendentes_70%",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora_Normal * 1.70 * Total_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.70 * [Total de Horas Extras a 70% Pendentes]. Aplicar se houver previsão em CCT.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Horas trabalhadas que possuem um adicional majorado por previsão em Convenção Coletiva.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Horas_Extras_100_Por_Cento",
    "Cálculo": {
      "Parametro": "Total_Horas_Pendentes_100%",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora_Normal * 2.00 * Total_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 2.00 * [Total de Horas Extras a 100% Pendentes].",
    "Legislação": "Súmula 113 do TST e Lei 605/49",
    "Exemplos_Aplicaveis": "Horas trabalhadas em domingos e feriados não compensados (adicional de 100%).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Folgas_DSR_Trabalhado_e_Não_Compensado",
    "Cálculo": {
      "Parametro": "Dias_de_Folga_Trabalhados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Folga * 2"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Folga Trabalhados] * 2 (Pagamento em dobro).",
    "Legislação": "CLT, Art. 67 e Lei 605/49",
    "Exemplos_Aplicaveis": "Pagamento em dobro dos Descansos Semanais Remunerados (DSRs) trabalhados e não usufruídos/compensados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Feriado_Trabalhado_e_Não_Compensado",
    "Cálculo": {
      "Parametro": "Dias_de_Feriado_Trabalhados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Feriado * 2"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Feriado Trabalhados] * 2 (Pagamento em dobro).",
    "Legislação": "Lei 605/49, Art. 9º",
    "Exemplos_Aplicaveis": "Pagamento em dobro dos feriados civis ou religiosos trabalhados e não usufruídos/compensados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_FGTS_40_Por_Cento",
    "Cálculo": {
      "Parametro": "Saldo_do_FGTS_na_Rescisão",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Saldo_FGTS * 0.40"
    },
    "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.40 (40%).",
    "Legislação": "Lei 8.036/90, Art. 18, §1º",
     "Exemplos_Aplicaveis": "**Verba de Irregularidade** \"Dispensa sem justa causa e Rescisão Indireta. somente se o funcionário estiver sem CTPS assinada\"",
        "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "FGTS_Não_Depositado_e_Devido",
    "Cálculo": {
      "Parametro": "Total_de_Depósitos_Faltantes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_8%_de_cada_mês_não_recolhido + Juros_e_Multa"
    },
    "Memoria_de_Calculo": "Base: Remuneração de cada mês não recolhido. Cálculo: Soma dos 8% de cada competência faltante, acrescida de juros e multa conforme legislação do FGTS.",
    "Legislação": "Lei 8.036/90",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Meses em que a empresa não recolheu o FGTS, ou todo o período em caso de **CTPS não assinada**.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Adicional_de_Periculosidade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base * 0.30"
    },
    "Memoria_de_Calculo": "Base: Salário Base (sem adicionais). Cálculo: Salário Base * 0.30 (30%). Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 193",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a risco (eletricidade, inflamáveis, explosivos).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_de_Insalubridade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Mínimo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Mínimo * (0.10, 0.20 ou 0.40)"
    },
    "Memoria_de_Calculo": "Base: Salário Mínimo Vigente. Cálculo: Salário Mínimo * [Grau de Insalubridade (10%, 20% ou 40%)]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 192",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a agentes nocivos à saúde em grau Mínimo, Médio ou Máximo.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_por_Tempo_de_Serviço_(Biênio, Triênio, Quinquênio)",
    "Cálculo": {
      "Parametro": "Anos_Completos_e_Percentual_Aplicável",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_sobre_Salário_Base * N_Períodos_Completos"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Período) * [Número de Períodos Completos]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "Convenção/Acordo_Coletivo_ou_Lei_Estadual/Municipal",
    "Exemplos_Aplicaveis": "Pagamento de percentual progressivo por tempo de serviço, conforme previsto em norma coletiva. (Inclui Biênio, Triênio, Quadriênio, etc.).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Saldo_Banco_de_Horas_Não_Compensado",
    "Cálculo": {
      "Parametro": "Total_Horas_Credoras_no_Banco",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora * Saldo_Banco_de_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Extra. Cálculo: [Valor da Hora Extra] multiplicado pelo Saldo de Horas Credoras (a favor do empregado).",
    "Legislação": "CLT, Art. 59, §3º",
    "Exemplos_Aplicaveis": "Horas positivas no banco de horas, pagas como extra na rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_FGTS_20_Por_Cento_(Acordo_Mútuo)",
    "Cálculo": {
      "Parametro": "Saldo_do_FGTS_na_Rescisão",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Saldo_FGTS * 0.20"
    },
    "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.20 (20%). Aplicável apenas na rescisão por acordo mútuo.",
    "Legislação": "CLT, Art. 484-A",
    "Exemplos_Aplicaveis": "Rescisão por acordo entre empregado e empregador (demissão consensual).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Diárias_para_Viagem_Excedentes_a_50%",
    "Cálculo": {
      "Parametro": "Valor_Total_Diárias",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Diárias_que_excedem_50%_do_salário_mensal"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Valor das diárias de viagem que ultrapassam 50% do Salário Base. Este valor passa a ter natureza salarial.",
    "Legislação": "CLT, Art. 457, §2º",
    "Exemplos_Aplicaveis": "Diárias que, por seu valor excessivo, adquirem natureza salarial e devem integrar o cálculo rescisório.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Gorjetas_(Apuradas_e_Registradas)",
    "Cálculo": {
      "Parametro": "Média_das_Gorjetas_no_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Integram_a_base_de_cálculo_das_verbas_rescisórias"
    },
    "Memoria_de_Calculo": "Base: Média dos valores de gorjeta. Cálculo: Média do valor das gorjetas sobre o período de apuração. Este valor integra a base de cálculo.",
    "Legislação": "CLT, Art. 457, §3º",
    "Exemplos_Aplicaveis": "Gorjetas que integravam a remuneração média e precisam ser refletidas nas verbas rescisórias.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_Noturno_Devido",
    "Cálculo": {
      "Parametro": "Total_Adicional_Noturno_Pendentes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_do_Adicional_Noturno_devido"
    },
    "Memoria_de_Calculo": "Base: Horas noturnas pendentes. Cálculo: Soma do valor do adicional noturno devido, calculado sobre as horas trabalhadas entre 22h e 5h.",
    "Legislação": "CLT, Art. 73",
    "Exemplos_Aplicaveis": "Horas trabalhadas no período noturno e não pagas.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Salário_Família_Proporcional",
    "Cálculo": {
      "Parametro": "Dias_Trabalhados_no_Mês",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Benefício / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor do Salário-Família. Cálculo: (Valor Benefício / 30) * [Dias Trabalhados no Mês da Rescisão].",
    "Legislação": "Lei 8.213/91",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês de rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Adicional_(Lei_6.708/79)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Dispensa_Próximo_Data_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Geralmente_Equivalente_a_Um_Salário"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: Geralmente equivalente a 1 Salário Base. Aplicável se a dispensa sem justa causa ocorrer nos 30 dias que antecedem a data base.",
    "Legislação": "Lei 6.708/79 (Verificar CCT)",
    "Exemplos_Aplicaveis": "Dispensa nos 30 dias que antecedem a data base de correção salarial.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Art_479_CLT_(Prazo_Determinado)",
    "Cálculo": {
      "Parametro": "Dias_Faltantes_para_Fim_do_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Metade_da_Remuneração_a_que_teria_direito"
    },
    "Memoria_de_Calculo": "Base: Remuneração restante até o fim do contrato. Cálculo: Metade da remuneração que o empregado teria direito até o fim do contrato por prazo determinado.",
    "Legislação": "CLT, Art. 479",
    "Exemplos_Aplicaveis": "Contrato por prazo determinado (ex: experiência) rescindido antecipadamente e sem justa causa pelo empregador.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_por_Dispensa_Indireta",
    "Cálculo": {
      "Parametro": "Decisão_Judicial_ou_Acordo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Definido_em_Sentença_ou_Acordo"
    },
    "Memoria_de_Calculo": "Base: Remuneração Devida. Cálculo: Conforme decisão judicial ou acordo. Verbas equivalentes à demissão sem justa causa.",
    "Legislação": "CLT, Art. 483",
    "Exemplos_Aplicaveis": "Empregado demite o empregador por falta grave (resulta em verbas de demissão sem justa causa).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_Art_477_CLT_(Atraso_na_Quitação)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Pagamento_Atrasado",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Salário Base Integral. Aplicável se as verbas rescisórias não forem pagas no prazo legal (10 dias após o término do contrato).",
    "Legislação": "CLT, Art. 477, §8º",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Atraso no pagamento da rescisão.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Quebra_de_Caixa_Devida",
    "Cálculo": {
      "Parametro": "Valor_mensal_conforme_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Mensal_CCT / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor estabelecido em norma coletiva ou contrato. Cálculo: Pagamento proporcional ao Saldo de Salário, caso o empregado tenha exercido a função no mês da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Contrato",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês da rescisão para empregados que lidam com numerário e têm a verba prevista em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Alimentação_ou_Refeição_Devido",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_valores_pendentes_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor do benefício estabelecido em norma coletiva. Cálculo: Pagamento dos valores de Auxílio Alimentação/Refeição devidos no mês da rescisão e não fornecidos/pagos. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Lei 6.321/76",
    "Exemplos_Aplicaveis": "Valores pendentes de pagamento ou fornecimento no período trabalhado do mês da rescisão. Geralmente verba indenizatória.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Creche_ou_Babá_Indenizado",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_mensal_ou_proporcional_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor e critérios estabelecidos em norma coletiva. Cálculo: Valores devidos e não pagos/indenizados até a data da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou CLT, Art. 389, §1º",
    "Exemplos_Aplicaveis": "Pagamento de valores devidos conforme as regras da CCT ou acordo (geralmente com natureza indenizatória).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Funeral_Devido",
    "Cálculo": {
      "Parametro": "Valor_total_da_indenização_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Fixo_Definido_na_CCT_em_caso_de_óbito"
    },
    "Memoria_de_Calculo": "Base: Valor fixo ou critérios definidos em norma coletiva. Cálculo: Indenização devida aos dependentes em caso de óbito do empregado, conforme as regras da CCT. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Indenização paga aos dependentes em caso de falecimento do empregado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Biênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Biênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Biênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Biênio) * [Número de Biênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 2 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Triênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Triênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Triênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Triênio) * [Número de Triênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 3 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Quadriênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Quadriênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Quadriênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Quadriênio) * [Número de Quadriênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 4 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  }
]`,
  descontos: `[
  {
    "Desconto": "Aviso_Prévio_Indenizado_pelo_Empregado",
    "Cálculo": {
      "Parametro": "Dias_de_Aviso_a_Descontar",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Um_Mês_de_Salário_Base"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: O valor de 1 Salário Base (equivalente a 30 dias) é descontado quando o empregado pede demissão e não cumpre o aviso.",
    "Legislação": "CLT, Art. 487, §2º",
    "Exemplos_Aplicaveis": "Empregado pede demissão e não cumpre o aviso prévio, indenizando o empregador.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_Remunerações_(Saldo_Salário_e_Variáveis)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Saldo_Salário + Variáveis)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_mensal"
    },
    "Memoria_de_Calculo": "Base: Saldo de Salário, Horas Extras, e Adicionais (Periculosidade/Insalubridade/Tempo_de_Serviço/Quebra_de_Caixa/etc.). Cálculo: Aplicação da Tabela Progressiva do INSS sobre a Base de Cálculo Mensal.",
    "Legislação": "Lei 8.212/91",
    "Exemplos_Aplicaveis": "Incide sobre Saldo de Salário, Horas Extras, Adicionais (Insalubridade/Periculosidade) e quaisquer diferenças salariais mensais.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_13º_Salário_Proporcional",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(13º_Proporcional)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_do_13º"
    },
    "Memoria_de_Calculo": "Base: Valor do 13º Salário Proporcional. Cálculo: Aplicação da Tabela Progressiva do INSS sobre a Base de Cálculo do 13º (cálculo separado das verbas mensais).",
    "Legislação": "Lei 8.212/91",
    "Exemplos_Aplicaveis": "Incide sobre o valor do 13º Salário (integral e/ou proporcional).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_13º_Salário_Aviso",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(13º_Aviso)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_do_13º_aviso"
    },
    "Memoria_de_Calculo": "Base: 1/12 avos do 13º Salário projetado pelo Aviso Prévio Indenizado. Cálculo: Aplicação da Tabela Progressiva do INSS sobre esta base.",
    "Legislação": "Lei 8.212/91 e Decreto 3.048/99, Art. 214, § 9º, V, “f”",
    "Exemplos_Aplicaveis": "Incide sobre a projeção do 13º salário referente ao período do aviso prévio indenizado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Férias_Vencidas_(Indenizadas)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Férias_Indenizadas)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Isento_de_INSS"
    },
    "Memoria_de_Calculo": "O valor é **R$0,00** porque as Férias Vencidas e seu adicional de 1/3, quando pagas na rescisão, **são isentas de INSS**.",
    "Legislação": "Decreto 3.048/99, Art. 214, § 9º, VI",
    "Exemplos_Aplicaveis": "Não há incidência de INSS sobre Férias Vencidas (e seu adicional de 1/3) pagas na rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Férias_Vencidas_do_Aviso",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Férias_Aviso)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Isento_de_INSS"
    },
    "Memoria_de_Calculo": "O valor é **R$0,00** porque a projeção de Férias e seu adicional de 1/3 referente ao Aviso Prévio indenizado **é isenta de INSS**.",
    "Legislação": "Decreto 3.048/99, Art. 214, § 9º, VI",
    "Exemplos_Aplicaveis": "Não há incidência de INSS sobre a projeção de Férias e 1/3 referente ao Aviso Prévio indenizado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Imposto_de_Renda_Retido_na_Fonte_(IRRF)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Verbas_Tributáveis)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_IRRF_aplicada_sobre_base_de_cálculo"
    },
    "Memoria_de_Calculo": "Base: Verbas Remuneratórias e 13º (após deduções do INSS, dependentes e parcela isenta). Cálculo: Aplicação da Tabela Progressiva do IRRF sobre a base líquida.",
    "Legislação": "Lei 7.713/88",
    "Exemplos_Aplicaveis": "Incide sobre verbas tributáveis.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Adiantamentos_e_Vales_(Saldo_Devedor)",
    "Cálculo": {
      "Parametro": "Valores_Adiantados_e_Não_Compensados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_de_Vales_e_Adiantamentos"
    },
    "Memoria_de_Calculo": "Base: Total de vales e adiantamentos concedidos. Cálculo: Soma de todos os adiantamentos salariais e vales (transporte, refeição, etc.) que não foram compensados.",
    "Legislação": "CLT, Art. 462",
    "Exemplos_Aplicaveis": "Vales salariais, adiantamentos de 13º e outros valores antecipados não compensados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Empréstimos_Consignados_e_Outros_Autorizados",
    "Cálculo": {
      "Parametro": "Saldo_Devedor_a_ser_descontado",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Desconto_permitido_por_lei_ou_contrato"
    },
    "Memoria_de_Calculo": "Base: Saldo devedor. Cálculo: Desconto do saldo de empréstimos consignados ou outros empréstimos, respeitando o limite legal de desconto na rescisão.",
    "Legislação": "Lei 10.820/03 e CLT, Art. 462",
    "Exemplos_Aplicaveis": "Parcelas restantes de empréstimos e descontos expressamente autorizados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Faltas_e_Atrasos_Injustificados",
    "Cálculo": {
      "Parametro": "Qtd_Dias_Faltas_e_Horas_Atrasos",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_por_dia_ou_hora_não_trabalhada"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Salário Base / 30) * [Dias de Falta] e/ou (Valor Hora) * [Horas de Atraso], mais DSR's perdidos.",
    "Legislação": "CLT, Art. 473",
    "Exemplos_Aplicaveis": "Desconto dos dias ou horas em que o empregado faltou sem justificativa legal.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Vale_Transporte_e_Alimentação_Antecipado",
    "Cálculo": {
      "Parametro": "Valor_Relativo_aos_Dias_Não_Trabalhados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Benefício_Proporcional"
    },
    "Memoria_de_Calculo": "Base: Valor do benefício mensal. Cálculo: Valor do benefício antecipado referente aos dias que o empregado não trabalhará após a rescisão.",
    "Legislação": "Lei 7.418/85 (VT) e Lei 6.321/76 (VA/VR)",
    "Exemplos_Aplicaveis": "Desconto de vales fornecidos para dias não trabalhados após a rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Danos_e_Prejuízos_Causados",
    "Cálculo": {
      "Parametro": "Valor_do_Prejuízo_(Com_Dolo_ou_Previsão)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_do_Dano_Causado"
    },
    "Memoria_de_Calculo": "Base: Valor do prejuízo. Cálculo: Valor do prejuízo, descontado apenas se comprovado **dolo** ou se houver **previsão expressa** em contrato para desconto por culpa.",
    "Legislação": "CLT, Art. 462, §1º",
    "Exemplos_Aplicaveis": "Dano causado com **dolo** ou com **culpa** se houver **previsão expressa** em contrato.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Mensalidades_Sindicais_e_Contribuições",
    "Cálculo": {
      "Parametro": "Valores_Devidos_e_Autorizados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_da_Contribuição_Sindical_Devida"
    },
    "Memoria_de_Calculo": "Base: Valor da contribuição sindical/associativa. Cálculo: Valor da contribuição devida, descontado apenas se houver autorização prévia e expressa do empregado.",
    "Legislação": "CLT, Art. 578 e 579",
    "Exemplos_Aplicaveis": "Contribuições sindicais ou associativas apenas se houver autorização prévia e expressa do empregado.",
    "Natureza_da_Verba": "Normal"
  }
]`,
  observacoes_base_legal: `Base Legal Central	Todos os cálculos devem ser realizados sob o rigor do Decreto-Lei nº 5.452/43 (CLT), a Lei nº 8.036/90 (FGTS) e o Decreto nº 3.048/99 (Regulamento da Previdência Social/INSS).	Estabelece as fontes legais primárias e obrigatórias para todos os cálculos.
Validação de Vínculo (CTPS)	Regra de Validação: Se a informação de entrada ctpsAssinada for "não" ou nula, você deve cobrar o valor integral do item "FGTS_Não_Depositado_e_Devido", mesmo que o valor de entrada seja zero, pois a irregularidade implica no não recolhimento de todo o período.	Força a inclusão da verba de irregularidade quando houver ausência de registro formal.
Análise Sindical	Validação de Verba: O campo de entrada obsSindicato deve ser analisado para verificar se indica a aplicação de piso salarial não cumprido, multa por atraso na homologação, ou qualquer crédito/débito que afete a remuneração ou os descontos finais.	Garante que o Agente incorpore detalhes específicos da Convenção Coletiva (CCT).
Proventos de FGTS	Regra de Cálculo: O campo "Multa_FGTS_40_Por_Cento" deve ser calculado sobre o saldo total do FGTS (Saldo na Conta + FGTS Não Depositado). O Agente deve garantir que o valor não depositado seja cobrado.	Clarifica a base de cálculo correta da multa, incluindo a parte devida por irregularidade.
Aviso Geral	Princípio de Execução: O cálculo deve ser tratado como uma simulação baseada estritamente nos dados de entrada. A IA não deve introduzir dados externos, mas sim usar a maior base de cálculo possível (Salário Base + Média de Variáveis, Piso Categoria, etc.) para todas as verbas reflexas (Férias, 13º, Aviso).	Reforça a natureza simulada e a necessidade de usar o maior valor da remuneração para calcular reflexos.`,
  estrutura_json_modelo_saida: `{
  "Verbas_Rescisorias": {
    "Remuneracao": [
      {
        "Provento": "Média_de_Verbas_Variáveis_(Integração_à_Base)",
        "Cálculo": {
          "Parametro": "Média_das_Variáveis_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Média_Horas_Extras + Média_Comissões + Média_Adicionais) / N_Meses"
        },
        "Memoria_de_Calculo": "Base: Verbas variáveis pagas nos últimos 12 meses (Horas Extras, Adicional Noturno, Comissões, etc.). Cálculo: Soma dessas verbas dividida por 12. Este valor deve ser somado ao Salário Base Fixo para compor a Remuneração Média.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "O valor encontrado aqui é a base para corrigir o Salário Base (Salário Base Corrigido).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Base_de_Cálculo_Rescisória",
        "Cálculo": {
          "Parametro": "Remuneração_Média_para_Proporcionais",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Fixo + Média_de_Verbas_Variáveis"
        },
        "Memoria_de_Calculo": "Base: Salário Base Fixo do Contrato. Cálculo: Soma do Salário Base Fixo com o valor calculado na verba 'Média_de_Verbas_Variáveis_(Integração_à_Base)'. Este valor compõe o Salário Base Corrigido/Remuneração Média utilizado como base para Férias, 13º e Aviso Prévio.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "É a remuneração integral (Salário Base Corrigido) considerada para calcular todas as verbas proporcionais e indenizadas.",
        "Natureza_da_Verba": "Informativa"
      },
      {
        "Provento": "Saldo_de_Salário",
        "Cálculo": {
          "Parametro": "Dias_Trabalhados_no_Mês",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_Trabalhados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido/Remuneração Média. Cálculo: (Salário Base Corrigido / 30) * [Número de Dias Trabalhados no Mês da Rescisão].",
        "Legislação": "CLT, Art. 457, §1º",
        "Exemplos_Aplicaveis": "Qualquer tipo de rescisão contratual.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Diferença_Salarial_Retroativa_(Piso_ou_Função)",
        "Cálculo": {
          "Parametro": "Meses_de_Diferença_a_ser_Paga",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_das_diferenças_mensais (Salário_Devido - Salário_Pago) * Meses_do_Contrato"
        },
        "Memoria_de_Calculo": "Cálculo: (Piso Salarial da Categoria - Salário Pago) multiplicado pelo número de meses em que a diferença foi devida.",
        "Legislação": "CLT, Art. 460 e Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Aplica-se quando o salário pago é inferior ao piso da categoria ou quando há acúmulo/desvio de função.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Devido_Anos_Anteriores",
        "Cálculo": {
          "Parametro": "Anos_Integrais_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * N_Anos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: Salário Base Corrigido multiplicado pelo número de anos integrais pendentes de pagamento do 13º.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Quando o 13º Salário de anos anteriores não foi pago no prazo legal.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Integral_(Ano_Corrente)",
        "Cálculo": {
          "Parametro": "Aplicável_se_Rescisão_em_Dezembro",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * 1.0"
        },
        "Memoria_de_Calculo": "Aplicável se a rescisão ocorrer em dezembro. Base: Salário Base Corrigido. Cálculo: Salário Base Corrigido * 1.0.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Devido integralmente no ano da rescisão (se a rescisão ocorrer em Dezembro).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_Salário_Proporcional",
        "Cálculo": {
          "Parametro": "Meses_Trabalhados_no_Ano",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: (Salário Base Corrigido / 12) * [Número de Meses Proporcionais (mês com 15 dias ou mais)].",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Avos do 13º devidos no ano da rescisão (exceto justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_do_Aviso_(Projeção)",
        "Cálculo": {
          "Parametro": "Projeção_do_Aviso_Prévio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * 1_Mês"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "1/12 avos do 13º Salário referente ao mês projetado pelo aviso prévio indenizado.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_Simples_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Não_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos não dobrados.",
        "Legislação": "CLT, Art. 146",
        "Exemplos_Aplicaveis": "Férias vencidas, mas que ainda não atingiram o período para pagamento em dobro (após 12 meses do período concessivo).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_em_Dobro_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos dobrados (multiplicar por 2).",
        "Legislação": "CLT, Art. 137",
        "Exemplos_Aplicaveis": "Férias vencidas, não usufruídas, e que já ultrapassaram o período concessivo.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Proporcionais",
        "Cálculo": {
          "Parametro": "Meses_Proporcionais_de_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: (Salário Base Corrigido / 12) multiplicado pelo número de meses proporcionais no último período aquisitivo.",
        "Legislação": "CLT, Art. 147",
        "Exemplos_Aplicaveis": "Meses trabalhados no último período aquisitivo (geralmente pago exceto em justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_do_Aviso_Prévio",
        "Cálculo": {
          "Parametro": "Meses_Projetados_pelo_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Projetados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "Projeção de férias referente ao período indenizado do Aviso Prévio.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Um_Terço_Constitucional_Geral",
        "Cálculo": {
          "Parametro": "Soma_de_Todas_as_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Férias_Vencidas_Simples + Férias_Dobro + Férias_Proporcionais + Férias_Aviso) * 1/3"
        },
        "Memoria_de_Calculo": "Base: Soma de todas as verbas de Férias (Vencidas, Dobradas, Proporcionais, Aviso). Cálculo: Soma da Base de Férias * 1/3 (0.3333).",
        "Legislação": "CF/88, Art. 7º, XVII",
        "Exemplos_Aplicaveis": "Adicional obrigatório de 1/3 incidente sobre a soma de todas as verbas de férias.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Aviso_Prévio_Indenizado_pelo_Empregador",
        "Cálculo": {
          "Parametro": "Dias_de_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_de_Aviso"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Aviso Prévio Devidos (30 dias + 3 dias/ano)].",
        "Legislação": "CLT, Art. 487 e Lei 12.506/11",
        "Exemplos_Aplicaveis": "Demissão sem justa causa, dispensa indireta. Base de cálculo deve incluir as médias das verbas variáveis.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_50_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_50%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.50 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.50 * [Total de Horas Extras a 50% Pendentes].",
        "Legislação": "CF/88, Art. 7º, XVI e CLT, Art. 59",
        "Exemplos_Aplicaveis": "Horas trabalhadas em dias úteis fora da jornada normal (acréscimo mínimo de 50%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_70_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_70%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.70 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.70 * [Total de Horas Extras a 70% Pendentes]. Aplicar se houver previsão em CCT.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Horas trabalhadas que possuem um adicional majorado por previsão em Convenção Coletiva.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_100_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_100%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 2.00 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 2.00 * [Total de Horas Extras a 100% Pendentes].",
        "Legislação": "Súmula 113 do TST e Lei 605/49",
        "Exemplos_Aplicaveis": "Horas trabalhadas em domingos e feriados não compensados (adicional de 100%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Folgas_DSR_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Folga_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Folga * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Folga Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "CLT, Art. 67 e Lei 605/49",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos Descansos Semanais Remunerados (DSRs) trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Feriado_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Feriado_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Feriado * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Feriado Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "Lei 605/49, Art. 9º",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos feriados civis ou religiosos trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Multa_FGTS_40_Por_Cento",
        "Cálculo": {
          "Parametro": "Saldo_do_FGTS_na_Rescisão",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Saldo_FGTS * 0.40"
        },
        "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.40 (40%).",
        "Legislação": "Lei 8.036/90, Art. 18, §1º",
         "Exemplos_Aplicaveis": "**Verba de Irregularidade** \"Dispensa sem justa causa e Rescisão Indireta. somente se o funcionário estiver sem CTPS assinada\"",
            "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "FGTS_Não_Depositado_e_Devido",
        "Cálculo": {
          "Parametro": "Total_de_Depósitos_Faltantes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_dos_8%_de_cada_mês_não_recolhido + Juros_e_Multa"
        },
        "Memoria_de_Calculo": "Base: Remuneração de cada mês não recolhido. Cálculo: Soma dos 8% de cada competência faltante, acrescida de juros e multa conforme legislação do FGTS.",
        "Legislação": "Lei 8.036/90",
        "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Meses em que a empresa não recolheu o FGTS, ou todo o período em caso de **CTPS não assinada**.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "Adicional_de_Periculosidade",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Base",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base * 0.30"
        },
        "Memoria_de_Calculo": "Base: Salário Base (sem adicionais). Cálculo: Salário Base * 0.30 (30%). Devido proporcionalmente ao saldo de salário.",
        "Legislação": "CLT, Art. 193",
        "Exemplos_Aplicaveis": "Quando o empregado estava exposto a risco (eletricidade, inflamáveis, explosivos).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Adicional_de_Insalubridade",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Mínimo",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Mínimo * (0.10, 0.20 ou 0.40)"
        },
        "Memoria_de_Calculo": "Base: Salário Mínimo Vigente. Cálculo: Salário Mínimo * [Grau de Insalubridade (10%, 20% ou 40%)]. Devido proporcionalmente ao saldo de salário.",
        "Legislação": "CLT, Art. 192",
        "Exemplos_Aplicaveis": "Quando o empregado estava exposto a agentes nocivos à saúde em grau Mínimo, Médio ou Máximo.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Adicional_por_Tempo_de_Serviço_(Biênio, Triênio, Quinquênio)",
        "Cálculo": {
          "Parametro": "Anos_Completos_e_Percentual_Aplicável",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Percentual_sobre_Salário_Base * N_Períodos_Completos"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Período) * [Número de Períodos Completos]. Devido proporcionalmente ao saldo de salário.",
        "Legislação": "Convenção/Acordo_Coletivo_ou_Lei_Estadual/Municipal",
        "Exemplos_Aplicaveis": "Pagamento de percentual progressivo por tempo de serviço, conforme previsto em norma coletiva. (Inclui Biênio, Triênio, Quadriênio, etc.).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Saldo_Banco_de_Horas_Não_Compensado",
        "Cálculo": {
          "Parametro": "Total_Horas_Credoras_no_Banco",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora * Saldo_Banco_de_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Extra. Cálculo: [Valor da Hora Extra] multiplicado pelo Saldo de Horas Credoras (a favor do empregado).",
        "Legislação": "CLT, Art. 59, §3º",
        "Exemplos_Aplicaveis": "Horas positivas no banco de horas, pagas como extra na rescisão.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Multa_FGTS_20_Por_Cento_(Acordo_Mútuo)",
        "Cálculo": {
          "Parametro": "Saldo_do_FGTS_na_Rescisão",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Saldo_FGTS * 0.20"
        },
        "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.20 (20%). Aplicável apenas na rescisão por acordo mútuo.",
        "Legislação": "CLT, Art. 484-A",
        "Exemplos_Aplicaveis": "Rescisão por acordo entre empregado e empregador (demissão consensual).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Diárias_para_Viagem_Excedentes_a_50%",
        "Cálculo": {
          "Parametro": "Valor_Total_Diárias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Diárias_que_excedem_50%_do_salário_mensal"
        },
        "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Valor das diárias de viagem que ultrapassam 50% do Salário Base. Este valor passa a ter natureza salarial.",
        "Legislação": "CLT, Art. 457, §2º",
        "Exemplos_Aplicaveis": "Diárias que, por seu valor excessivo, adquirem natureza salarial e devem integrar o cálculo rescisório.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Gorjetas_(Apuradas_e_Registradas)",
        "Cálculo": {
          "Parametro": "Média_das_Gorjetas_no_Contrato",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Integram_a_base_de_cálculo_das_verbas_rescisórias"
        },
        "Memoria_de_Calculo": "Base: Média dos valores de gorjeta. Cálculo: Média do valor das gorjetas sobre o período de apuração. Este valor integra a base de cálculo.",
        "Legislação": "CLT, Art. 457, §3º",
        "Exemplos_Aplicaveis": "Gorjetas que integravam a remuneração média e precisam ser refletidas nas verbas rescisórias.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Adicional_Noturno_Devido",
        "Cálculo": {
          "Parametro": "Total_Adicional_Noturno_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_do_Adicional_Noturno_devido"
        },
        "Memoria_de_Calculo": "Base: Horas noturnas pendentes. Cálculo: Soma do valor do adicional noturno devido, calculado sobre as horas trabalhadas entre 22h e 5h.",
        "Legislação": "CLT, Art. 73",
        "Exemplos_Aplicaveis": "Horas trabalhadas no período noturno e não pagas.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Salário_Família_Proporcional",
        "Cálculo": {
          "Parametro": "Dias_Trabalhados_no_Mês",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Valor_Benefício / 30) * Dias_Trabalhados"
        },
        "Memoria_de_Calculo": "Base: Valor do Salário-Família. Cálculo: (Valor Benefício / 30) * [Dias Trabalhados no Mês da Rescisão].",
        "Legislação": "Lei 8.213/91",
        "Exemplos_Aplicaveis": "Pagamento proporcional no mês de rescisão.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Indenização_Adicional_(Lei_6.708/79)",
        "Cálculo": {
          "Parametro": "Aplicável_se_Dispensa_Próximo_Data_Base",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Geralmente_Equivalente_a_Um_Salário"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: Geralmente equivalente a 1 Salário Base. Aplicável se a dispensa sem justa causa ocorrer nos 30 dias que antecedem a data base.",
        "Legislação": "Lei 6.708/79 (Verificar CCT)",
        "Exemplos_Aplicaveis": "Dispensa nos 30 dias que antecedem a data base de correção salarial.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Indenização_Art_479_CLT_(Prazo_Determinado)",
        "Cálculo": {
          "Parametro": "Dias_Faltantes_para_Fim_do_Contrato",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Metade_da_Remuneração_a_que_teria_direito"
        },
        "Memoria_de_Calculo": "Base: Remuneração restante até o fim do contrato. Cálculo: Metade da remuneração que o empregado teria direito até o fim do contrato por prazo determinado.",
        "Legislação": "CLT, Art. 479",
        "Exemplos_Aplicaveis": "Contrato por prazo determinado (ex: experiência) rescindido antecipadamente e sem justa causa pelo empregador.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Indenização_por_Dispensa_Indireta",
        "Cálculo": {
          "Parametro": "Decisão_Judicial_ou_Acordo",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Definido_em_Sentença_ou_Acordo"
        },
        "Memoria_de_Calculo": "Base: Remuneração Devida. Cálculo: Conforme decisão judicial ou acordo. Verbas equivalentes à demissão sem justa causa.",
        "Legislação": "CLT, Art. 483",
        "Exemplos_Aplicaveis": "Empregado demite o empregador por falta grave (resulta em verbas de demissão sem justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Multa_Art_477_CLT_(Atraso_na_Quitação)",
        "Cálculo": {
          "Parametro": "Aplicável_se_Pagamento_Atrasado",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base"
        },
        "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Salário Base Integral. Aplicável se as verbas rescisórias não forem pagas no prazo legal (10 dias após o término do contrato).",
        "Legislação": "CLT, Art. 477, §8º",
        "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Atraso no pagamento da rescisão.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "Quebra_de_Caixa_Devida",
        "Cálculo": {
          "Parametro": "Valor_mensal_conforme_CCT",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Valor_Mensal_CCT / 30) * Dias_Trabalhados"
        },
        "Memoria_de_Calculo": "Base: Valor estabelecido em norma coletiva ou contrato. Cálculo: Pagamento proporcional ao Saldo de Salário, caso o empregado tenha exercido a função no mês da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT) ou Contrato",
        "Exemplos_Aplicaveis": "Pagamento proporcional no mês da rescisão para empregados que lidam com numerário e têm a verba prevista em CCT.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Auxílio_Alimentação_ou_Refeição_Devido",
        "Cálculo": {
          "Parametro": "Valores_pendentes_não_compensados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_dos_valores_pendentes_conforme_CCT"
        },
        "Memoria_de_Calculo": "Base: Valor do benefício estabelecido em norma coletiva. Cálculo: Pagamento dos valores de Auxílio Alimentação/Refeição devidos no mês da rescisão e não fornecidos/pagos. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT) ou Lei 6.321/76",
        "Exemplos_Aplicaveis": "Valores pendentes de pagamento ou fornecimento no período trabalhado do mês da rescisão. Geralmente verba indenizatória.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Auxílio_Creche_ou_Babá_Indenizado",
        "Cálculo": {
          "Parametro": "Valores_pendentes_não_compensados_CCT",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_mensal_ou_proporcional_conforme_CCT"
        },
        "Memoria_de_Calculo": "Base: Valor e critérios estabelecidos em norma coletiva. Cálculo: Valores devidos e não pagos/indenizados até a data da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT) ou CLT, Art. 389, §1º",
        "Exemplos_Aplicaveis": "Pagamento de valores devidos conforme as regras da CCT ou acordo (geralmente com natureza indenizatória).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Auxílio_Funeral_Devido",
        "Cálculo": {
          "Parametro": "Valor_total_da_indenização_CCT",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Fixo_Definido_na_CCT_em_caso_de_óbito"
        },
        "Memoria_de_Calculo": "Base: Valor fixo ou critérios definidos em norma coletiva. Cálculo: Indenização devida aos dependentes em caso de óbito do empregado, conforme as regras da CCT. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Indenização paga aos dependentes em caso de falecimento do empregado.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Biênio_(Adicional_por_Tempo_de_Serviço)",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Base_por_Biênio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Percentual_CCT * N_Biênios"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Biênio) * [Número de Biênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 2 anos completos de serviço, se previsto em CCT.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Triênio_(Adicional_por_Tempo_de_Serviço)",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Base_por_Triênio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Percentual_CCT * N_Triênios"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Triênio) * [Número de Triênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 3 anos completos de serviço, se previsto em CCT.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Quadriênio_(Adicional_por_Tempo_de_Serviço)",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Base_por_Quadriênio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Percentual_CCT * N_Quadriênios"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Quadriênio) * [Número de Quadriênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 4 anos completos de serviço, se previsto em CCT.",
        "Natureza_da_Verba": "Normal"
      }
    ]`,
  descontos: `[
  {
    "Desconto": "Aviso_Prévio_Indenizado_pelo_Empregado",
    "Cálculo": {
      "Parametro": "Dias_de_Aviso_a_Descontar",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Um_Mês_de_Salário_Base"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: O valor de 1 Salário Base (equivalente a 30 dias) é descontado quando o empregado pede demissão e não cumpre o aviso.",
    "Legislação": "CLT, Art. 487, §2º",
    "Exemplos_Aplicaveis": "Empregado pede demissão e não cumpre o aviso prévio, indenizando o empregador.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_Remunerações_(Saldo_Salário_e_Variáveis)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Saldo_Salário + Variáveis)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_mensal"
    },
    "Memoria_de_Calculo": "Base: Saldo de Salário, Horas Extras, e Adicionais (Periculosidade/Insalubridade/Tempo_de_Serviço/Quebra_de_Caixa/etc.). Cálculo: Aplicação da Tabela Progressiva do INSS sobre a Base de Cálculo Mensal.",
    "Legislação": "Lei 8.212/91",
    "Exemplos_Aplicaveis": "Incide sobre Saldo de Salário, Horas Extras, Adicionais (Insalubridade/Periculosidade) e quaisquer diferenças salariais mensais.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_13º_Salário_Proporcional",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(13º_Proporcional)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_do_13º"
    },
    "Memoria_de_Calculo": "Base: Valor do 13º Salário Proporcional. Cálculo: Aplicação da Tabela Progressiva do INSS sobre a Base de Cálculo do 13º (cálculo separado das verbas mensais).",
    "Legislação": "Lei 8.212/91",
    "Exemplos_Aplicaveis": "Incide sobre o valor do 13º Salário (integral e/ou proporcional).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_13º_Salário_Aviso",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(13º_Aviso)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_do_13º_aviso"
    },
    "Memoria_de_Calculo": "Base: 1/12 avos do 13º Salário projetado pelo Aviso Prévio Indenizado. Cálculo: Aplicação da Tabela Progressiva do INSS sobre esta base.",
    "Legislação": "Lei 8.212/91 e Decreto 3.048/99, Art. 214, § 9º, V, “f”",
    "Exemplos_Aplicaveis": "Incide sobre a projeção do 13º salário referente ao período do aviso prévio indenizado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Férias_Vencidas_(Indenizadas)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Férias_Indenizadas)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Isento_de_INSS"
    },
    "Memoria_de_Calculo": "O valor é **R$0,00** porque as Férias Vencidas e seu adicional de 1/3, quando pagas na rescisão, **são isentas de INSS**.",
    "Legislação": "Decreto 3.048/99, Art. 214, § 9º, VI",
    "Exemplos_Aplicaveis": "Não há incidência de INSS sobre Férias Vencidas (e seu adicional de 1/3) pagas na rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Férias_Vencidas_do_Aviso",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Férias_Aviso)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Isento_de_INSS"
    },
    "Memoria_de_Calculo": "O valor é **R$0,00** porque a projeção de Férias e seu adicional de 1/3 referente ao Aviso Prévio indenizado **é isenta de INSS**.",
    "Legislação": "Decreto 3.048/99, Art. 214, § 9º, VI",
    "Exemplos_Aplicaveis": "Não há incidência de INSS sobre a projeção de Férias e 1/3 referente ao Aviso Prévio indenizado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Imposto_de_Renda_Retido_na_Fonte_(IRRF)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Verbas_Tributáveis)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_IRRF_aplicada_sobre_base_de_cálculo"
    },
    "Memoria_de_Calculo": "Base: Verbas Remuneratórias e 13º (após deduções do INSS, dependentes e parcela isenta). Cálculo: Aplicação da Tabela Progressiva do IRRF sobre a base líquida.",
    "Legislação": "Lei 7.713/88",
    "Exemplos_Aplicaveis": "Incide sobre verbas tributáveis.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Adiantamentos_e_Vales_(Saldo_Devedor)",
    "Cálculo": {
      "Parametro": "Valores_Adiantados_e_Não_Compensados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_de_Vales_e_Adiantamentos"
    },
    "Memoria_de_Calculo": "Base: Total de vales e adiantamentos concedidos. Cálculo: Soma de todos os adiantamentos salariais e vales (transporte, refeição, etc.) que não foram compensados.",
    "Legislação": "CLT, Art. 462",
    "Exemplos_Aplicaveis": "Vales salariais, adiantamentos de 13º e outros valores antecipados não compensados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Empréstimos_Consignados_e_Outros_Autorizados",
    "Cálculo": {
      "Parametro": "Saldo_Devedor_a_ser_descontado",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Desconto_permitido_por_lei_ou_contrato"
    },
    "Memoria_de_Calculo": "Base: Saldo devedor. Cálculo: Desconto do saldo de empréstimos consignados ou outros empréstimos, respeitando o limite legal de desconto na rescisão.",
    "Legislação": "Lei 10.820/03 e CLT, Art. 462",
    "Exemplos_Aplicaveis": "Parcelas restantes de empréstimos e descontos expressamente autorizados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Faltas_e_Atrasos_Injustificados",
    "Cálculo": {
      "Parametro": "Qtd_Dias_Faltas_e_Horas_Atrasos",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_por_dia_ou_hora_não_trabalhada"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Salário Base / 30) * [Dias de Falta] e/ou (Valor Hora) * [Horas de Atraso], mais DSR's perdidos.",
    "Legislação": "CLT, Art. 473",
    "Exemplos_Aplicaveis": "Desconto dos dias ou horas em que o empregado faltou sem justificativa legal.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Vale_Transporte_e_Alimentação_Antecipado",
    "Cálculo": {
      "Parametro": "Valor_Relativo_aos_Dias_Não_Trabalhados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Benefício_Proporcional"
    },
    "Memoria_de_Calculo": "Base: Valor do benefício mensal. Cálculo: Valor do benefício antecipado referente aos dias que o empregado não trabalhará após a rescisão.",
    "Legislação": "Lei 7.418/85 (VT) e Lei 6.321/76 (VA/VR)",
    "Exemplos_Aplicaveis": "Desconto de vales fornecidos para dias não trabalhados após a rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Danos_e_Prejuízos_Causados",
    "Cálculo": {
      "Parametro": "Valor_do_Prejuízo_(Com_Dolo_ou_Previsão)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_do_Dano_Causado"
    },
    "Memoria_de_Calculo": "Base: Valor do prejuízo. Cálculo: Valor do prejuízo, descontado apenas se comprovado **dolo** ou se houver **previsão expressa** em contrato para desconto por culpa.",
    "Legislação": "CLT, Art. 462, §1º",
    "Exemplos_Aplicaveis": "Dano causado com **dolo** ou com **culpa** se houver **previsão expressa** em contrato.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Mensalidades_Sindicais_e_Contribuições",
    "Cálculo": {
      "Parametro": "Valores_Devidos_e_Autorizados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_da_Contribuição_Sindical_Devida"
    },
    "Memoria_de_Calculo": "Base: Valor da contribuição sindical/associativa. Cálculo: Valor da contribuição devida, descontado apenas se houver autorização prévia e expressa do empregado.",
    "Legislação": "CLT, Art. 578 e 579",
    "Exemplos_Aplicaveis": "Contribuições sindicais ou associativas apenas se houver autorização prévia e expressa do empregado.",
    "Natureza_da_Verba": "Normal"
  }
]`,
  observacoes_base_legal: `Base Legal Central	Todos os cálculos devem ser realizados sob o rigor do Decreto-Lei nº 5.452/43 (CLT), a Lei nº 8.036/90 (FGTS) e o Decreto nº 3.048/99 (Regulamento da Previdência Social/INSS).	Estabelece as fontes legais primárias e obrigatórias para todos os cálculos.
Validação de Vínculo (CTPS)	Regra de Validação: Se a informação de entrada ctpsAssinada for "não" ou nula, você deve cobrar o valor integral do item "FGTS_Não_Depositado_e_Devido", mesmo que o valor de entrada seja zero, pois a irregularidade implica no não recolhimento de todo o período.	Força a inclusão da verba de irregularidade quando houver ausência de registro formal.
Análise Sindical	Validação de Verba: O campo de entrada obsSindicato deve ser analisado para verificar se indica a aplicação de piso salarial não cumprido, multa por atraso na homologação, ou qualquer crédito/débito que afete a remuneração ou os descontos finais.	Garante que o Agente incorpore detalhes específicos da Convenção Coletiva (CCT).
Proventos de FGTS	Regra de Cálculo: O campo "Multa_FGTS_40_Por_Cento" deve ser calculado sobre o saldo total do FGTS (Saldo na Conta + FGTS Não Depositado). O Agente deve garantir que o valor não depositado seja cobrado.	Clarifica a base de cálculo correta da multa, incluindo a parte devida por irregularidade.
Aviso Geral	Princípio de Execução: O cálculo deve ser tratado como uma simulação baseada estritamente nos dados de entrada. A IA não deve introduzir dados externos, mas sim usar a maior base de cálculo possível (Salário Base + Média de Variáveis, Piso Categoria, etc.) para todas as verbas reflexas (Férias, 13º, Aviso).	Reforça a natureza simulada e a necessidade de usar o maior valor da remuneração para calcular reflexos.`,
  estrutura_json_modelo_saida: `{
  "Verbas_Rescisorias": {
    "Remuneracao": [
      {
        "Provento": "Média_de_Verbas_Variáveis_(Integração_à_Base)",
        "Cálculo": {
          "Parametro": "Média_das_Variáveis_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Média_Horas_Extras + Média_Comissões + Média_Adicionais) / N_Meses"
        },
        "Memoria_de_Calculo": "Base: Verbas variáveis pagas nos últimos 12 meses (Horas Extras, Adicional Noturno, Comissões, etc.). Cálculo: Soma dessas verbas dividida por 12. Este valor deve ser somado ao Salário Base Fixo para compor a Remuneração Média.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "O valor encontrado aqui é a base para corrigir o Salário Base (Salário Base Corrigido).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Base_de_Cálculo_Rescisória",
        "Cálculo": {
          "Parametro": "Remuneração_Média_para_Proporcionais",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Fixo + Média_de_Verbas_Variáveis"
        },
        "Memoria_de_Calculo": "Base: Salário Base Fixo do Contrato. Cálculo: Soma do Salário Base Fixo com o valor calculado na verba 'Média_de_Verbas_Variáveis_(Integração_à_Base)'. Este valor compõe o Salário Base Corrigido/Remuneração Média utilizado como base para Férias, 13º e Aviso Prévio.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "É a remuneração integral (Salário Base Corrigido) considerada para calcular todas as verbas proporcionais e indenizadas.",
        "Natureza_da_Verba": "Informativa"
      },
      {
        "Provento": "Saldo_de_Salário",
        "Cálculo": {
          "Parametro": "Dias_Trabalhados_no_Mês",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_Trabalhados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido/Remuneração Média. Cálculo: (Salário Base Corrigido / 30) * [Número de Dias Trabalhados no Mês da Rescisão].",
        "Legislação": "CLT, Art. 457, §1º",
        "Exemplos_Aplicaveis": "Qualquer tipo de rescisão contratual.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Diferença_Salarial_Retroativa_(Piso_ou_Função)",
        "Cálculo": {
          "Parametro": "Meses_de_Diferença_a_ser_Paga",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_das_diferenças_mensais (Salário_Devido - Salário_Pago) * Meses_do_Contrato"
        },
        "Memoria_de_Calculo": "Cálculo: (Piso Salarial da Categoria - Salário Pago) multiplicado pelo número de meses em que a diferença foi devida.",
        "Legislação": "CLT, Art. 460 e Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Aplica-se quando o salário pago é inferior ao piso da categoria ou quando há acúmulo/desvio de função.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Devido_Anos_Anteriores",
        "Cálculo": {
          "Parametro": "Anos_Integrais_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * N_Anos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: Salário Base Corrigido multiplicado pelo número de anos integrais pendentes de pagamento do 13º.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Quando o 13º Salário de anos anteriores não foi pago no prazo legal.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Integral_(Ano_Corrente)",
        "Cálculo": {
          "Parametro": "Aplicável_se_Rescisão_em_Dezembro",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * 1.0"
        },
        "Memoria_de_Calculo": "Aplicável se a rescisão ocorrer em dezembro. Base: Salário Base Corrigido. Cálculo: Salário Base Corrigido * 1.0.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Devido integralmente no ano da rescisão (se a rescisão ocorrer em Dezembro).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_Salário_Proporcional",
        "Cálculo": {
          "Parametro": "Meses_Trabalhados_no_Ano",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: (Salário Base Corrigido / 12) * [Número de Meses Proporcionais (mês com 15 dias ou mais)].",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Avos do 13º devidos no ano da rescisão (exceto justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_do_Aviso_(Projeção)",
        "Cálculo": {
          "Parametro": "Projeção_do_Aviso_Prévio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * 1_Mês"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "1/12 avos do 13º Salário referente ao mês projetado pelo aviso prévio indenizado.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_Simples_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Não_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos não dobrados.",
        "Legislação": "CLT, Art. 146",
        "Exemplos_Aplicaveis": "Férias vencidas, mas que ainda não atingiram o período para pagamento em dobro (após 12 meses do período concessivo).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_em_Dobro_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos dobrados (multiplicar por 2).",
        "Legislação": "CLT, Art. 137",
        "Exemplos_Aplicaveis": "Férias vencidas, não usufruídas, e que já ultrapassaram o período concessivo.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Proporcionais",
        "Cálculo": {
          "Parametro": "Meses_Proporcionais_de_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: (Salário Base Corrigido / 12) multiplicado pelo número de meses proporcionais no último período aquisitivo.",
        "Legislação": "CLT, Art. 147",
        "Exemplos_Aplicaveis": "Meses trabalhados no último período aquisitivo (geralmente pago exceto em justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_do_Aviso_Prévio",
        "Cálculo": {
          "Parametro": "Meses_Projetados_pelo_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Projetados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "Projeção de férias referente ao período indenizado do Aviso Prévio.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Um_Terço_Constitucional_Geral",
        "Cálculo": {
          "Parametro": "Soma_de_Todas_as_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Férias_Vencidas_Simples + Férias_Dobro + Férias_Proporcionais + Férias_Aviso) * 1/3"
        },
        "Memoria_de_Calculo": "Base: Soma de todas as verbas de Férias (Vencidas, Dobradas, Proporcionais, Aviso). Cálculo: Soma da Base de Férias * 1/3 (0.3333).",
        "Legislação": "CF/88, Art. 7º, XVII",
        "Exemplos_Aplicaveis": "Adicional obrigatório de 1/3 incidente sobre a soma de todas as verbas de férias.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Aviso_Prévio_Indenizado_pelo_Empregador",
        "Cálculo": {
          "Parametro": "Dias_de_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_de_Aviso"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Aviso Prévio Devidos (30 dias + 3 dias/ano)].",
        "Legislação": "CLT, Art. 487 e Lei 12.506/11",
        "Exemplos_Aplicaveis": "Demissão sem justa causa, dispensa indireta. Base de cálculo deve incluir as médias das verbas variáveis.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_50_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_50%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.50 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.50 * [Total de Horas Extras a 50% Pendentes].",
        "Legislação": "CF/88, Art. 7º, XVI e CLT, Art. 59",
        "Exemplos_Aplicaveis": "Horas trabalhadas em dias úteis fora da jornada normal (acréscimo mínimo de 50%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_70_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_70%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.70 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.70 * [Total de Horas Extras a 70% Pendentes]. Aplicar se houver previsão em CCT.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Horas trabalhadas que possuem um adicional majorado por previsão em Convenção Coletiva.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_100_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_100%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 2.00 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 2.00 * [Total de Horas Extras a 100% Pendentes].",
        "Legislação": "Súmula 113 do TST e Lei 605/49",
        "Exemplos_Aplicaveis": "Horas trabalhadas em domingos e feriados não compensados (adicional de 100%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Folgas_DSR_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Folga_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Folga * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Folga Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "CLT, Art. 67 e Lei 605/49",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos Descansos Semanais Remunerados (DSRs) trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Feriado_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Feriado_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Feriado * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Feriado Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "Lei 605/49, Art. 9º",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos feriados civis ou religiosos trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Multa_FGTS_40_Por_Cento",
        "Cálculo": {
          "Parametro": "Saldo_do_FGTS_na_Rescisão",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Saldo_FGTS * 0.40"
        },
        "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.40 (40%).",
        "Legislação": "Lei 8.036/90, Art. 18, §1º",
         "Exemplos_Aplicaveis": "**Verba de Irregularidade** \"Dispensa sem justa causa e Rescisão Indireta. somente se o funcionário estiver sem CTPS assinada\"",
            "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "FGTS_Não_Depositado_e_Devido",
        "Cálculo": {
          "Parametro": "Total_de_Depósitos_Faltantes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_dos_8%_de_cada_mês_não_recolhido + Juros_e_Multa"
        },
        "Memoria_de_Calculo": "Base: Remuneração de cada mês não recolhido. Cálculo: Soma dos 8% de cada competência faltante, acrescida de juros e multa conforme legislação do FGTS.",
        "Legislação": "Lei 8.036/90",
        "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Meses em que a empresa não recolheu o FGTS, ou todo o período em caso de **CTPS não assinada**.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "Adicional_de_Periculosidade",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Base",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base * 0.30"
        },
        "Memoria_de_Calculo": "Base: Salário Base (sem adicionais). Cálculo: Salário Base * 0.30 (30%). Devido proporcionalmente ao saldo de salário.",
        "Legislação": "CLT, Art. 193",
        "Exemplos_Aplicaveis": "Quando o empregado estava exposto a risco (eletricidade, inflamáveis, explosivos).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Adicional_de_Insalubridade",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Mínimo",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Mínimo * (0.10, 0.20 ou 0.40)"
        },
        "Memoria_de_Calculo": "Base: Salário Mínimo Vigente. Cálculo: Salário Mínimo * [Grau de Insalubridade (10%, 20% ou 40%)]. Devido proporcionalmente ao saldo de salário.",
        "Legislação": "CLT, Art. 192",
        "Exemplos_Aplicaveis": "Quando o empregado estava exposto a agentes nocivos à saúde em grau Mínimo, Médio ou Máximo.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Adicional_por_Tempo_de_Serviço_(Biênio, Triênio, Quinquênio)",
        "Cálculo": {
          "Parametro": "Anos_Completos_e_Percentual_Aplicável",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Percentual_sobre_Salário_Base * N_Períodos_Completos"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Período) * [Número de Períodos Completos]. Devido proporcionalmente ao saldo de salário.",
        "Legislação": "Convenção/Acordo_Coletivo_ou_Lei_Estadual/Municipal",
        "Exemplos_Aplicaveis": "Pagamento de percentual progressivo por tempo de serviço, conforme previsto em norma coletiva. (Inclui Biênio, Triênio, Quadriênio, etc.).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Saldo_Banco_de_Horas_Não_Compensado",
        "Cálculo": {
          "Parametro": "Total_Horas_Credoras_no_Banco",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora * Saldo_Banco_de_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Extra. Cálculo: [Valor da Hora Extra] multiplicado pelo Saldo de Horas Credoras (a favor do empregado).",
        "Legislação": "CLT, Art. 59, §3º",
        "Exemplos_Aplicaveis": "Horas positivas no banco de horas, pagas como extra na rescisão.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Multa_FGTS_20_Por_Cento_(Acordo_Mútuo)",
        "Cálculo": {
          "Parametro": "Saldo_do_FGTS_na_Rescisão",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Saldo_FGTS * 0.20"
        },
        "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.20 (20%). Aplicável apenas na rescisão por acordo mútuo.",
        "Legislação": "CLT, Art. 484-A",
        "Exemplos_Aplicaveis": "Rescisão por acordo entre empregado e empregador (demissão consensual).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Diárias_para_Viagem_Excedentes_a_50%",
        "Cálculo": {
          "Parametro": "Valor_Total_Diárias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Diárias_que_excedem_50%_do_salário_mensal"
        },
        "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Valor das diárias de viagem que ultrapassam 50% do Salário Base. Este valor passa a ter natureza salarial.",
        "Legislação": "CLT, Art. 457, §2º",
        "Exemplos_Aplicaveis": "Diárias que, por seu valor excessivo, adquirem natureza salarial e devem integrar o cálculo rescisório.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Gorjetas_(Apuradas_e_Registradas)",
        "Cálculo": {
          "Parametro": "Média_das_Gorjetas_no_Contrato",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Integram_a_base_de_cálculo_das_verbas_rescisórias"
        },
        "Memoria_de_Calculo": "Base: Média dos valores de gorjeta. Cálculo: Média do valor das gorjetas sobre o período de apuração. Este valor integra a base de cálculo.",
        "Legislação": "CLT, Art. 457, §3º",
        "Exemplos_Aplicaveis": "Gorjetas que integravam a remuneração média e precisam ser refletidas nas verbas rescisórias.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Adicional_Noturno_Devido",
        "Cálculo": {
          "Parametro": "Total_Adicional_Noturno_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_do_Adicional_Noturno_devido"
        },
        "Memoria_de_Calculo": "Base: Horas noturnas pendentes. Cálculo: Soma do valor do adicional noturno devido, calculado sobre as horas trabalhadas entre 22h e 5h.",
        "Legislação": "CLT, Art. 73",
        "Exemplos_Aplicaveis": "Horas trabalhadas no período noturno e não pagas.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Salário_Família_Proporcional",
        "Cálculo": {
          "Parametro": "Dias_Trabalhados_no_Mês",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Valor_Benefício / 30) * Dias_Trabalhados"
        },
        "Memoria_de_Calculo": "Base: Valor do Salário-Família. Cálculo: (Valor Benefício / 30) * [Dias Trabalhados no Mês da Rescisão].",
        "Legislação": "Lei 8.213/91",
        "Exemplos_Aplicaveis": "Pagamento proporcional no mês de rescisão.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Indenização_Adicional_(Lei_6.708/79)",
        "Cálculo": {
          "Parametro": "Aplicável_se_Dispensa_Próximo_Data_Base",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Geralmente_Equivalente_a_Um_Salário"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: Geralmente equivalente a 1 Salário Base. Aplicável se a dispensa sem justa causa ocorrer nos 30 dias que antecedem a data base.",
        "Legislação": "Lei 6.708/79 (Verificar CCT)",
        "Exemplos_Aplicaveis": "Dispensa nos 30 dias que antecedem a data base de correção salarial.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Indenização_Art_479_CLT_(Prazo_Determinado)",
        "Cálculo": {
          "Parametro": "Dias_Faltantes_para_Fim_do_Contrato",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Metade_da_Remuneração_a_que_teria_direito"
        },
        "Memoria_de_Calculo": "Base: Remuneração restante até o fim do contrato. Cálculo: Metade da remuneração que o empregado teria direito até o fim do contrato por prazo determinado.",
        "Legislação": "CLT, Art. 479",
        "Exemplos_Aplicaveis": "Contrato por prazo determinado (ex: experiência) rescindido antecipadamente e sem justa causa pelo empregador.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Indenização_por_Dispensa_Indireta",
        "Cálculo": {
          "Parametro": "Decisão_Judicial_ou_Acordo",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Definido_em_Sentença_ou_Acordo"
        },
        "Memoria_de_Calculo": "Base: Remuneração Devida. Cálculo: Conforme decisão judicial ou acordo. Verbas equivalentes à demissão sem justa causa.",
        "Legislação": "CLT, Art. 483",
        "Exemplos_Aplicaveis": "Empregado demite o empregador por falta grave (resulta em verbas de demissão sem justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Multa_Art_477_CLT_(Atraso_na_Quitação)",
        "Cálculo": {
          "Parametro": "Aplicável_se_Pagamento_Atrasado",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base"
        },
        "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Salário Base Integral. Aplicável se as verbas rescisórias não forem pagas no prazo legal (10 dias após o término do contrato).",
        "Legislação": "CLT, Art. 477, §8º",
        "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Atraso no pagamento da rescisão.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "Quebra_de_Caixa_Devida",
        "Cálculo": {
          "Parametro": "Valor_mensal_conforme_CCT",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Valor_Mensal_CCT / 30) * Dias_Trabalhados"
        },
        "Memoria_de_Calculo": "Base: Valor estabelecido em norma coletiva ou contrato. Cálculo: Pagamento proporcional ao Saldo de Salário, caso o empregado tenha exercido a função no mês da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT) ou Contrato",
        "Exemplos_Aplicaveis": "Pagamento proporcional no mês da rescisão para empregados que lidam com numerário e têm a verba prevista em CCT.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Auxílio_Alimentação_ou_Refeição_Devido",
        "Cálculo": {
          "Parametro": "Valores_pendentes_não_compensados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_dos_valores_pendentes_conforme_CCT"
        },
        "Memoria_de_Calculo": "Base: Valor do benefício estabelecido em norma coletiva. Cálculo: Pagamento dos valores de Auxílio Alimentação/Refeição devidos no mês da rescisão e não fornecidos/pagos. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT) ou Lei 6.321/76",
        "Exemplos_Aplicaveis": "Valores pendentes de pagamento ou fornecimento no período trabalhado do mês da rescisão. Geralmente verba indenizatória.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Auxílio_Creche_ou_Babá_Indenizado",
        "Cálculo": {
          "Parametro": "Valores_pendentes_não_compensados_CCT",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_mensal_ou_proporcional_conforme_CCT"
        },
        "Memoria_de_Calculo": "Base: Valor e critérios estabelecidos em norma coletiva. Cálculo: Valores devidos e não pagos/indenizados até a data da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT) ou CLT, Art. 389, §1º",
        "Exemplos_Aplicaveis": "Pagamento de valores devidos conforme as regras da CCT ou acordo (geralmente com natureza indenizatória).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Auxílio_Funeral_Devido",
        "Cálculo": {
          "Parametro": "Valor_total_da_indenização_CCT",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Fixo_Definido_na_CCT_em_caso_de_óbito"
        },
        "Memoria_de_Calculo": "Base: Valor fixo ou critérios definidos em norma coletiva. Cálculo: Indenização devida aos dependentes em caso de óbito do empregado, conforme as regras da CCT. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Indenização paga aos dependentes em caso de falecimento do empregado.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Biênio_(Adicional_por_Tempo_de_Serviço)",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Base_por_Biênio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Percentual_CCT * N_Biênios"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Biênio) * [Número de Biênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 2 anos completos de serviço, se previsto em CCT.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Triênio_(Adicional_por_Tempo_de_Serviço)",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Base_por_Triênio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Percentual_CCT * N_Triênios"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Triênio) * [Número de Triênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 3 anos completos de serviço, se previsto em CCT.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Quadriênio_(Adicional_por_Tempo_de_Serviço)",
        "Cálculo": {
          "Parametro": "Percentual_sobre_Salário_Base_por_Quadriênio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Percentual_CCT * N_Quadriênios"
        },
        "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Quadriênio) * [Número de Quadriênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 4 anos completos de serviço, se previsto em CCT.",
        "Natureza_da_Verba": "Normal"
      }
    ]`,
  descontos: `[
  {
    "Desconto": "Aviso_Prévio_Indenizado_pelo_Empregado",
    "Cálculo": {
      "Parametro": "Dias_de_Aviso_a_Descontar",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Um_Mês_de_Salário_Base"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: O valor de 1 Salário Base (equivalente a 30 dias) é descontado quando o empregado pede demissão e não cumpre o aviso.",
    "Legislação": "CLT, Art. 487, §2º",
    "Exemplos_Aplicaveis": "Empregado pede demissão e não cumpre o aviso prévio, indenizando o empregador.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_Remunerações_(Saldo_Salário_e_Variáveis)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Saldo_Salário + Variáveis)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_mensal"
    },
    "Memoria_de_Calculo": "Base: Saldo de Salário, Horas Extras, e Adicionais (Periculosidade/Insalubridade/Tempo_de_Serviço/Quebra_de_Caixa/etc.). Cálculo: Aplicação da Tabela Progressiva do INSS sobre a Base de Cálculo Mensal.",
    "Legislação": "Lei 8.212/91",
    "Exemplos_Aplicaveis": "Incide sobre Saldo de Salário, Horas Extras, Adicionais (Insalubridade/Periculosidade) e quaisquer diferenças salariais mensais.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_13º_Salário_Proporcional",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(13º_Proporcional)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_do_13º"
    },
    "Memoria_de_Calculo": "Base: Valor do 13º Salário Proporcional. Cálculo: Aplicação da Tabela Progressiva do INSS sobre a Base de Cálculo do 13º (cálculo separado das verbas mensais).",
    "Legislação": "Lei 8.212/91",
    "Exemplos_Aplicaveis": "Incide sobre o valor do 13º Salário (integral e/ou proporcional).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_13º_Salário_Aviso",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(13º_Aviso)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_do_13º_aviso"
    },
    "Memoria_de_Calculo": "Base: 1/12 avos do 13º Salário projetado pelo Aviso Prévio Indenizado. Cálculo: Aplicação da Tabela Progressiva do INSS sobre esta base.",
    "Legislação": "Lei 8.212/91 e Decreto 3.048/99, Art. 214, § 9º, V, “f”",
    "Exemplos_Aplicaveis": "Incide sobre a projeção do 13º salário referente ao período do aviso prévio indenizado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Férias_Vencidas_(Indenizadas)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Férias_Indenizadas)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Isento_de_INSS"
    },
    "Memoria_de_Calculo": "O valor é **R$0,00** porque as Férias Vencidas e seu adicional de 1/3, quando pagas na rescisão, **são isentas de INSS**.",
    "Legislação": "Decreto 3.048/99, Art. 214, § 9º, VI",
    "Exemplos_Aplicaveis": "Não há incidência de IN<dyad-problem-report summary="3 problems">
<problem file="src/pages/AiPromptTemplateFormPage.tsx" line="1202" column="3" code="1117">An object literal cannot have multiple properties with the same name.</problem>
<problem file="src/pages/AiPromptTemplateFormPage.tsx" line="1360" column="3" code="1117">An object literal cannot have multiple properties with the same name.</problem>
<problem file="src/pages/AiPromptTemplateFormPage.tsx" line="1365" column="3" code="1117">An object literal cannot have multiple properties with the same name.</problem>
</dyad-problem-report><think>**Reviewing Duplicate Keys**

I'm currently focused on the `modelTemplate` object and its duplicate property issue in `AiPromptTemplateFormPage.tsx`.  I've pinpointed three instances of `TS1117` errors. The `modelTemplate` object is the culprit, so I'm diving deeper into that object to identify and resolve the repeated keys. I'll need to refactor the object to ensure uniqueness.


**Eliminating Redundant Properties**

I've zeroed in on the `modelTemplate` object in `AiPromptTemplateFormPage.tsx` and have identified the source of the `TS1117` errors. The duplicate keys are `descontos`, `observacoes_base_legal`, and `estrutura_json_modelo_saida`. My current plan is to eliminate the redundant earlier definitions of each key, leaving only the most recent definition for each property, to resolve this conflict.


</think>Com certeza! Os erros que você está vendo são devido a propriedades duplicadas no objeto `modelTemplate` dentro do arquivo `src/pages/AiPromptTemplateFormPage.tsx`. Isso acontece quando a mesma chave é definida mais de uma vez em um objeto literal.

Vou corrigir isso removendo as definições anteriores e mantendo apenas a última para cada uma das propriedades (`descontos`, `observacoes_base_legal`, `estrutura_json_modelo_saida`), garantindo que o objeto seja válido.

<dyad-write path="src/pages/AiPromptTemplateFormPage.tsx" description="Corrigindo chaves duplicadas no objeto modelTemplate.">
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeft, Brain } from 'lucide-react';

interface AiPromptTemplateState {
  id?: string;
  title: string;
  identificacao: string;
  comportamento: string;
  restricoes: string;
  atribuicoes: string;
  leis: string;
  proventos: string;
  descontos: string;
  observacoes_base_legal: string;
  estrutura_json_modelo_saida: string; // Campo do DB
  instrucoes_entrada_dados_rescisao: string; // Campo do DB
}

const modelTemplate: AiPromptTemplateState = {
  title: "PHD Cálculo Trabalhista",
  identificacao: `Você é um Especialista Sênior em Cálculo Trabalhista e Tributário (CLT). Sua única responsabilidade é analisar os dados de entrada de uma rescisão contratual e preencher o JSON de saída com os valores e detalhes de cálculo corretos.`,
  comportamento: `Rigor Legal: Baseie todos os cálculos e descrições nas normas da CLT, Lei 8.036/90 (FGTS), Decreto 3.048/99 (INSS) e Normas Coletivas (CCT/ACT) aplicáveis, assumindo que as CCTs devem ser respeitadas. 2. Completo e Objetivo: Você deve preencher TODOS os campos de proventos e descontos presentes na estrutura JSON. Se um item não for aplicável, o campo "Valor" deve ser 0.00, e o campo "Memoria_de_Calculo" deve justificar a não aplicação. 3. Cálculo Detalhado: O campo "Memoria_de_Calculo" deve ser a explicação textual passo a passo que levou ao "Valor" final.`,
  restricoes: `Saída Única: Sua única saída deve ser o bloco de código JSON completo. 2. Sem Prosa: NUNCA inclua qualquer texto introdutório, conclusivo, observações ou explicações fora do bloco de código JSON. 3. Formato Rígido: O JSON deve aderir estritamente à estrutura fornecida, incluindo todos os campos, chaves e ordem.
Nunca calcular o desconto do INSS se o trabalhador não estiver de CTPS assinada.
Nunca invente nenhum valor qunado o valro o campo estiver null ou zerado.
Nunca lançar multa de 40% nos proventos quando o funcionario estiver de CTPS assinada (true)
Nunca lançar Saldo do FGTS nos proventos quando o funcionario estiver de CTPS assinada (true)`,
  atribuicoes: `Cálculo da Base: Calcule o Valor final para cada provento e desconto. 2. Preenchimento do JSON: Insira os valores calculados no campo "Valor" e a justificativa no campo "Memoria_de_Calculo". 3. Manter Metadados: Mantenha inalterados os campos "Legislação", "Exemplos_Aplicaveis", "Fórmula_Sugerida" e "Natureza_da_Verba".`,
  leis: `Constituição Federal	CF/88, Art. 7º	Direitos Fundamentais: Estabelece o rol mínimo de direitos sociais, servindo como base para todos os cálculos de 13º Salário, Férias + 1/3, FGTS e proteção contra dispensa arbitrária.
Consolidação das Leis do Trabalho	Decreto-Lei nº 5.452/43 (CLT)	Regra Geral: Principal fonte para verbas como Saldo de Salário, Aviso Prévio, Férias, 13º Salário, Adicionais (Insalubridade/Periculosidade) e limites de desconto. É a base para a maioria dos campos do JSON.
Lei do Fundo de Garantia por Tempo de Serviço	Lei nº 8.036/90	FGTS e Multas: Define as regras de depósito (8%) e, crucialmente, as multas rescisórias (40% ou 20%) e o saque do FGTS.
Regulamento da Previdência Social	Decreto nº 3.048/99	INSS: Contém o Regulamento que, em seu Artigo 214 e parágrafos, define precisamente a base de cálculo e as verbas de natureza indenizatória (como Férias Indenizadas e Aviso Prévio Indenizado) que são isentos do INSS.
Regulamento do Imposto de Renda	Decreto nº 9.580/2018	IRRF: Define as regras de retenção na fonte e, principalmente, as verbas que são isentadas do IRRF (Férias Indenizadas, FGTS, etc.).
Aviso Prévio Proporcional	Lei nº 12.506/2011	Detalha o cálculo do aviso prévio, adicionando 3 dias por ano de serviço completo (além dos 30 dias base).
Décimo Terceiro Salário	Lei nº 4.090/62	Regulamenta o pagamento do 13º, essencial para o cálculo das avos proporcionais.
Consignação em Folha	Lei nº 10.820/03	Base legal para o desconto de empréstimos consignados e seu limite na rescisão.
Jornada de Trabalho	CLT, Art. 59 e Súmulas do TST	Regras para cálculo de Horas Extras (50%, 100%) e Banco de Horas.
Proteção contra Despedida Arbitrária	Lei nº 7.998/90	Define as regras para liberação do Seguro-Desemprego.`,
  proventos: `[
  {
    "Provento": "Média_de_Verbas_Variáveis_(Integração_à_Base)",
    "Cálculo": {
      "Parametro": "Média_das_Variáveis_Pendentes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Média_Horas_Extras + Média_Comissões + Média_Adicionais) / N_Meses"
    },
    "Memoria_de_Calculo": "Base: Verbas variáveis pagas nos últimos 12 meses (Horas Extras, Adicional Noturno, Comissões, etc.). Cálculo: Soma dessas verbas dividida por 12. Este valor deve ser somado ao Salário Base Fixo para compor a Remuneração Média.",
    "Legislação": "Súmulas 264 e 347 do TST",
    "Exemplos_Aplicaveis": "O valor encontrado aqui é a base para corrigir o Salário Base (Salário Base Corrigido).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Base_de_Cálculo_Rescisória",
    "Cálculo": {
      "Parametro": "Remuneração_Média_para_Proporcionais",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Fixo + Média_de_Verbas_Variáveis"
    },
    "Memoria_de_Calculo": "Base: Salário Base Fixo do Contrato. Cálculo: Soma do Salário Base Fixo com o valor calculado na verba 'Média_de_Verbas_Variáveis_(Integração_à_Base)'. Este valor compõe o Salário Base Corrigido/Remuneração Média utilizado como base para Férias, 13º e Aviso Prévio.",
    "Legislação": "Súmulas 264 e 347 do TST",
    "Exemplos_Aplicaveis": "É a remuneração integral (Salário Base Corrigido) considerada para calcular todas as verbas proporcionais e indenizadas.",
    "Natureza_da_Verba": "Informativa"
  },
  {
    "Provento": "Saldo_de_Salário",
    "Cálculo": {
      "Parametro": "Dias_Trabalhados_no_Mês",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido/Remuneração Média. Cálculo: (Salário Base Corrigido / 30) * [Número de Dias Trabalhados no Mês da Rescisão].",
    "Legislação": "CLT, Art. 457, §1º",
    "Exemplos_Aplicaveis": "Qualquer tipo de rescisão contratual.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Diferença_Salarial_Retroativa_(Piso_ou_Função)",
    "Cálculo": {
      "Parametro": "Meses_de_Diferença_a_ser_Paga",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_das_diferenças_mensais (Salário_Devido - Salário_Pago) * Meses_do_Contrato"
    },
    "Memoria_de_Calculo": "Cálculo: (Piso Salarial da Categoria - Salário Pago) multiplicado pelo número de meses em que a diferença foi devida.",
    "Legislação": "CLT, Art. 460 e Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Aplica-se quando o salário pago é inferior ao piso da categoria ou quando há acúmulo/desvio de função.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "13º_Salário_Devido_Anos_Anteriores",
    "Cálculo": {
      "Parametro": "Anos_Integrais_Pendentes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Corrigido * N_Anos"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: Salário Base Corrigido multiplicado pelo número de anos integrais pendentes de pagamento do 13º.",
    "Legislação": "Lei 4.090/62",
    "Exemplos_Aplicaveis": "Quando o 13º Salário de anos anteriores não foi pago no prazo legal.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "13º_Salário_Integral_(Ano_Corrente)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Rescisão_em_Dezembro",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Corrigido * 1.0"
    },
    "Memoria_de_Calculo": "Aplicável se a rescisão ocorrer em dezembro. Base: Salário Base Corrigido. Cálculo: Salário Base Corrigido * 1.0.",
    "Legislação": "Lei 4.090/62",
    "Exemplos_Aplicaveis": "Devido integralmente no ano da rescisão (se a rescisão ocorrer em Dezembro).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "13º_Salário_Proporcional",
    "Cálculo": {
      "Parametro": "Meses_Trabalhados_no_Ano",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: (Salário Base Corrigido / 12) * [Número de Meses Proporcionais (mês com 15 dias ou mais)].",
    "Legislação": "Lei 4.090/62",
    "Exemplos_Aplicaveis": "Avos do 13º devidos no ano da rescisão (exceto justa causa).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "13º_do_Aviso_(Projeção)",
    "Cálculo": {
      "Parametro": "Projeção_do_Aviso_Prévio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * 1_Mês"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
    "Legislação": "CLT, Art. 487, §1º",
    "Exemplos_Aplicaveis": "1/12 avos do 13º Salário referente ao mês projetado pelo aviso prévio indenizado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Férias_Vencidas_Simples_(Indenizadas)",
    "Cálculo": {
      "Parametro": "Qtd_Períodos_Vencidos_Não_Dobrados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos não dobrados.",
    "Legislação": "CLT, Art. 146",
    "Exemplos_Aplicaveis": "Férias vencidas, mas que ainda não atingiram o período para pagamento em dobro (após 12 meses do período concessivo).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Férias_Vencidas_em_Dobro_(Indenizadas)",
    "Cálculo": {
      "Parametro": "Qtd_Períodos_Vencidos_Dobrados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos * 2"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos dobrados (multiplicar por 2).",
    "Legislação": "CLT, Art. 137",
    "Exemplos_Aplicaveis": "Férias vencidas, não usufruídas, e que já ultrapassaram o período concessivo.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Férias_Proporcionais",
    "Cálculo": {
      "Parametro": "Meses_Proporcionais_de_Férias",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: (Salário Base Corrigido / 12) multiplicado pelo número de meses proporcionais no último período aquisitivo.",
    "Legislação": "CLT, Art. 147",
    "Exemplos_Aplicaveis": "Meses trabalhados no último período aquisitivo (geralmente pago exceto em justa causa).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Férias_do_Aviso_Prévio",
    "Cálculo": {
      "Parametro": "Meses_Projetados_pelo_Aviso",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Projetados"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
    "Legislação": "CLT, Art. 487, §1º",
    "Exemplos_Aplicaveis": "Projeção de férias referente ao período indenizado do Aviso Prévio.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Um_Terço_Constitucional_Geral",
    "Cálculo": {
      "Parametro": "Soma_de_Todas_as_Férias",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Férias_Vencidas_Simples + Férias_Dobro + Férias_Proporcionais + Férias_Aviso) * 1/3"
    },
    "Memoria_de_Calculo": "Base: Soma de todas as verbas de Férias (Vencidas, Dobradas, Proporcionais, Aviso). Cálculo: Soma da Base de Férias * 1/3 (0.3333).",
    "Legislação": "CF/88, Art. 7º, XVII",
    "Exemplos_Aplicaveis": "Adicional obrigatório de 1/3 incidente sobre a soma de todas as verbas de férias.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Aviso_Prévio_Indenizado_pelo_Empregador",
    "Cálculo": {
      "Parametro": "Dias_de_Aviso",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_de_Aviso"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Aviso Prévio Devidos (30 dias + 3 dias/ano)].",
    "Legislação": "CLT, Art. 487 e Lei 12.506/11",
    "Exemplos_Aplicaveis": "Demissão sem justa causa, dispensa indireta. Base de cálculo deve incluir as médias das verbas variáveis.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Horas_Extras_50_Por_Cento",
    "Cálculo": {
      "Parametro": "Total_Horas_Pendentes_50%",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora_Normal * 1.50 * Total_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.50 * [Total de Horas Extras a 50% Pendentes].",
    "Legislação": "CF/88, Art. 7º, XVI e CLT, Art. 59",
    "Exemplos_Aplicaveis": "Horas trabalhadas em dias úteis fora da jornada normal (acréscimo mínimo de 50%).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Horas_Extras_70_Por_Cento",
    "Cálculo": {
      "Parametro": "Total_Horas_Pendentes_70%",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora_Normal * 1.70 * Total_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.70 * [Total de Horas Extras a 70% Pendentes]. Aplicar se houver previsão em CCT.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Horas trabalhadas que possuem um adicional majorado por previsão em Convenção Coletiva.",
        "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Horas_Extras_100_Por_Cento",
    "Cálculo": {
      "Parametro": "Total_Horas_Pendentes_100%",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora_Normal * 2.00 * Total_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 2.00 * [Total de Horas Extras a 100% Pendentes].",
    "Legislação": "Súmula 113 do TST e Lei 605/49",
    "Exemplos_Aplicaveis": "Horas trabalhadas em domingos e feriados não compensados (adicional de 100%).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Folgas_DSR_Trabalhado_e_Não_Compensado",
    "Cálculo": {
      "Parametro": "Dias_de_Folga_Trabalhados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Folga * 2"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Folga Trabalhados] * 2 (Pagamento em dobro).",
    "Legislação": "CLT, Art. 67 e Lei 605/49",
    "Exemplos_Aplicaveis": "Pagamento em dobro dos Descansos Semanais Remunerados (DSRs) trabalhados e não usufruídos/compensados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Feriado_Trabalhado_e_Não_Compensado",
    "Cálculo": {
      "Parametro": "Dias_de_Feriado_Trabalhados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Feriado * 2"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Feriado Trabalhados] * 2 (Pagamento em dobro).",
    "Legislação": "Lei 605/49, Art. 9º",
    "Exemplos_Aplicaveis": "Pagamento em dobro dos feriados civis ou religiosos trabalhados e não usufruídos/compensados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_FGTS_40_Por_Cento",
    "Cálculo": {
      "Parametro": "Saldo_do_FGTS_na_Rescisão",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Saldo_FGTS * 0.40"
    },
    "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.40 (40%).",
    "Legislação": "Lei 8.036/90, Art. 18, §1º",
     "Exemplos_Aplicaveis": "**Verba de Irregularidade** \"Dispensa sem justa causa e Rescisão Indireta. somente se o funcionário estiver sem CTPS assinada\"",
        "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "FGTS_Não_Depositado_e_Devido",
    "Cálculo": {
      "Parametro": "Total_de_Depósitos_Faltantes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_8%_de_cada_mês_não_recolhido + Juros_e_Multa"
    },
    "Memoria_de_Calculo": "Base: Remuneração de cada mês não recolhido. Cálculo: Soma dos 8% de cada competência faltante, acrescida de juros e multa conforme legislação do FGTS.",
    "Legislação": "Lei 8.036/90",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Meses em que a empresa não recolheu o FGTS, ou todo o período em caso de **CTPS não assinada**.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Adicional_de_Periculosidade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base * 0.30"
    },
    "Memoria_de_Calculo": "Base: Salário Base (sem adicionais). Cálculo: Salário Base * 0.30 (30%). Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 193",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a risco (eletricidade, inflamáveis, explosivos).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_de_Insalubridade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Mínimo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Mínimo * (0.10, 0.20 ou 0.40)"
    },
    "Memoria_de_Calculo": "Base: Salário Mínimo Vigente. Cálculo: Salário Mínimo * [Grau de Insalubridade (10%, 20% ou 40%)]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 192",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a agentes nocivos à saúde em grau Mínimo, Médio ou Máximo.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_por_Tempo_de_Serviço_(Biênio, Triênio, Quinquênio)",
    "Cálculo": {
      "Parametro": "Anos_Completos_e_Percentual_Aplicável",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_sobre_Salário_Base * N_Períodos_Completos"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Período) * [Número de Períodos Completos]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "Convenção/Acordo_Coletivo_ou_Lei_Estadual/Municipal",
    "Exemplos_Aplicaveis": "Pagamento de percentual progressivo por tempo de serviço, conforme previsto em norma coletiva. (Inclui Biênio, Triênio, Quadriênio, etc.).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Saldo_Banco_de_Horas_Não_Compensado",
    "Cálculo": {
      "Parametro": "Total_Horas_Credoras_no_Banco",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora * Saldo_Banco_de_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Extra. Cálculo: [Valor da Hora Extra] multiplicado pelo Saldo de Horas Credoras (a favor do empregado).",
    "Legislação": "CLT, Art. 59, §3º",
    "Exemplos_Aplicaveis": "Horas positivas no banco de horas, pagas como extra na rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_FGTS_20_Por_Cento_(Acordo_Mútuo)",
    "Cálculo": {
      "Parametro": "Saldo_do_FGTS_na_Rescisão",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Saldo_FGTS * 0.20"
    },
    "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.20 (20%). Aplicável apenas na rescisão por acordo mútuo.",
    "Legislação": "CLT, Art. 484-A",
    "Exemplos_Aplicaveis": "Rescisão por acordo entre empregado e empregador (demissão consensual).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Diárias_para_Viagem_Excedentes_a_50%",
    "Cálculo": {
      "Parametro": "Valor_Total_Diárias",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Diárias_que_excedem_50%_do_salário_mensal"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Valor das diárias de viagem que ultrapassam 50% do Salário Base. Este valor passa a ter natureza salarial.",
    "Legislação": "CLT, Art. 457, §2º",
    "Exemplos_Aplicaveis": "Diárias que, por seu valor excessivo, adquirem natureza salarial e devem integrar o cálculo rescisório.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Gorjetas_(Apuradas_e_Registradas)",
    "Cálculo": {
      "Parametro": "Média_das_Gorjetas_no_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Integram_a_base_de_cálculo_das_verbas_rescisórias"
    },
    "Memoria_de_Calculo": "Base: Média dos valores de gorjeta. Cálculo: Média do valor das gorjetas sobre o período de apuração. Este valor integra a base de cálculo.",
    "Legislação": "CLT, Art. 457, §3º",
    "Exemplos_Aplicaveis": "Gorjetas que integravam a remuneração média e precisam ser refletidas nas verbas rescisórias.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_Noturno_Devido",
    "Cálculo": {
      "Parametro": "Total_Adicional_Noturno_Pendentes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_do_Adicional_Noturno_devido"
    },
    "Memoria_de_Calculo": "Base: Horas noturnas pendentes. Cálculo: Soma do valor do adicional noturno devido, calculado sobre as horas trabalhadas entre 22h e 5h.",
    "Legislação": "CLT, Art. 73",
    "Exemplos_Aplicaveis": "Horas trabalhadas no período noturno e não pagas.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Salário_Família_Proporcional",
    "Cálculo": {
      "Parametro": "Dias_Trabalhados_no_Mês",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Benefício / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor do Salário-Família. Cálculo: (Valor Benefício / 30) * [Dias Trabalhados no Mês da Rescisão].",
    "Legislação": "Lei 8.213/91",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês de rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Adicional_(Lei_6.708/79)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Dispensa_Próximo_Data_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Geralmente_Equivalente_a_Um_Salário"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: Geralmente equivalente a 1 Salário Base. Aplicável se a dispensa sem justa causa ocorrer nos 30 dias que antecedem a data base.",
    "Legislação": "Lei 6.708/79 (Verificar CCT)",
    "Exemplos_Aplicaveis": "Dispensa nos 30 dias que antecedem a data base de correção salarial.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Art_479_CLT_(Prazo_Determinado)",
    "Cálculo": {
      "Parametro": "Dias_Faltantes_para_Fim_do_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Metade_da_Remuneração_a_que_teria_direito"
    },
    "Memoria_de_Calculo": "Base: Remuneração restante até o fim do contrato. Cálculo: Metade da remuneração que o empregado teria direito até o fim do contrato por prazo determinado.",
    "Legislação": "CLT, Art. 479",
    "Exemplos_Aplicaveis": "Contrato por prazo determinado (ex: experiência) rescindido antecipadamente e sem justa causa pelo empregador.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_por_Dispensa_Indireta",
    "Cálculo": {
      "Parametro": "Decisão_Judicial_ou_Acordo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Definido_em_Sentença_ou_Acordo"
    },
    "Memoria_de_Calculo": "Base: Remuneração Devida. Cálculo: Conforme decisão judicial ou acordo. Verbas equivalentes à demissão sem justa causa.",
    "Legislação": "CLT, Art. 483",
    "Exemplos_Aplicaveis": "Empregado demite o empregador por falta grave (resulta em verbas de demissão sem justa causa).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_Art_477_CLT_(Atraso_na_Quitação)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Pagamento_Atrasado",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Salário Base Integral. Aplicável se as verbas rescisórias não forem pagas no prazo legal (10 dias após o término do contrato).",
    "Legislação": "CLT, Art. 477, §8º",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Atraso no pagamento da rescisão.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Quebra_de_Caixa_Devida",
    "Cálculo": {
      "Parametro": "Valor_mensal_conforme_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Mensal_CCT / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor estabelecido em norma coletiva ou contrato. Cálculo: Pagamento proporcional ao Saldo de Salário, caso o empregado tenha exercido a função no mês da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Contrato",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês da rescisão para empregados que lidam com numerário e têm a verba prevista em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Alimentação_ou_Refeição_Devido",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_valores_pendentes_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor do benefício estabelecido em norma coletiva. Cálculo: Pagamento dos valores de Auxílio Alimentação/Refeição devidos no mês da rescisão e não fornecidos/pagos. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Lei 6.321/76",
    "Exemplos_Aplicaveis": "Valores pendentes de pagamento ou fornecimento no período trabalhado do mês da rescisão. Geralmente verba indenizatória.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Creche_ou_Babá_Indenizado",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_mensal_ou_proporcional_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor e critérios estabelecidos em norma coletiva. Cálculo: Valores devidos e não pagos/indenizados até a data da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou CLT, Art. 389, §1º",
    "Exemplos_Aplicaveis": "Pagamento de valores devidos conforme as regras da CCT ou acordo (geralmente com natureza indenizatória).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Funeral_Devido",
    "Cálculo": {
      "Parametro": "Valor_total_da_indenização_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Fixo_Definido_na_CCT_em_caso_de_óbito"
    },
    "Memoria_de_Calculo": "Base: Valor fixo ou critérios definidos em norma coletiva. Cálculo: Indenização devida aos dependentes em caso de óbito do empregado, conforme as regras da CCT. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Indenização paga aos dependentes em caso de falecimento do empregado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Biênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Biênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Biênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Biênio) * [Número de Biênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 2 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Triênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Triênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Triênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Triênio) * [Número de Triênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 3 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Quadriênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Quadriênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Quadriênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Quadriênio) * [Número de Quadriênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 4 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  }
]`,
  descontos: `[
  {
    "Desconto": "Aviso_Prévio_Indenizado_pelo_Empregado",
    "Cálculo": {
      "Parametro": "Dias_de_Aviso_a_Descontar",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Um_Mês_de_Salário_Base"
    },
    "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: O valor de 1 Salário Base (equivalente a 30 dias) é descontado quando o empregado pede demissão e não cumpre o aviso.",
    "Legislação": "CLT, Art. 487, §2º",
    "Exemplos_Aplicaveis": "Empregado pede demissão e não cumpre o aviso prévio, indenizando o empregador.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_Remunerações_(Saldo_Salário_e_Variáveis)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Saldo_Salário + Variáveis)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_mensal"
    },
    "Memoria_de_Calculo": "Base: Saldo de Salário, Horas Extras, e Adicionais (Periculosidade/Insalubridade/Tempo_de_Serviço/Quebra_de_Caixa/etc.). Cálculo: Aplicação da Tabela Progressiva do INSS sobre a Base de Cálculo Mensal.",
    "Legislação": "Lei 8.212/91",
    "Exemplos_Aplicaveis": "Incide sobre Saldo de Salário, Horas Extras, Adicionais (Insalubridade/Periculosidade) e quaisquer diferenças salariais mensais.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_13º_Salário_Proporcional",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(13º_Proporcional)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_do_13º"
    },
    "Memoria_de_Calculo": "Base: Valor do 13º Salário Proporcional. Cálculo: Aplicação da Tabela Progressiva do INSS sobre a Base de Cálculo do 13º (cálculo separado das verbas mensais).",
    "Legislação": "Lei 8.212/91",
    "Exemplos_Aplicaveis": "Incide sobre o valor do 13º Salário (integral e/ou proporcional).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Sobre_13º_Salário_Aviso",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(13º_Aviso)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_INSS_aplicada_sobre_base_tributável_do_13º_aviso"
    },
    "Memoria_de_Calculo": "Base: 1/12 avos do 13º Salário projetado pelo Aviso Prévio Indenizado. Cálculo: Aplicação da Tabela Progressiva do INSS sobre esta base.",
    "Legislação": "Lei 8.212/91 e Decreto 3.048/99, Art. 214, § 9º, V, “f”",
    "Exemplos_Aplicaveis": "Incide sobre a projeção do 13º salário referente ao período do aviso prévio indenizado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Férias_Vencidas_(Indenizadas)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Férias_Indenizadas)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Isento_de_INSS"
    },
    "Memoria_de_Calculo": "O valor é **R$0,00** porque as Férias Vencidas e seu adicional de 1/3, quando pagas na rescisão, **são isentas de INSS**.",
    "Legislação": "Decreto 3.048/99, Art. 214, § 9º, VI",
    "Exemplos_Aplicaveis": "Não há incidência de INSS sobre Férias Vencidas (e seu adicional de 1/3) pagas na rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "INSS_Férias_Vencidas_do_Aviso",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Férias_Aviso)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Isento_de_INSS"
    },
    "Memoria_de_Calculo": "O valor é **R$0,00** porque a projeção de Férias e seu adicional de 1/3 referente ao Aviso Prévio indenizado **é isenta de INSS**.",
    "Legislação": "Decreto 3.048/99, Art. 214, § 9º, VI",
    "Exemplos_Aplicaveis": "Não há incidência de INSS sobre a projeção de Férias e 1/3 referente ao Aviso Prévio indenizado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Imposto_de_Renda_Retido_na_Fonte_(IRRF)",
    "Cálculo": {
      "Parametro": "Base_de_Cálculo_(Verbas_Tributáveis)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Tabela_IRRF_aplicada_sobre_base_de_cálculo"
    },
    "Memoria_de_Calculo": "Base: Verbas Remuneratórias e 13º (após deduções do INSS, dependentes e parcela isenta). Cálculo: Aplicação da Tabela Progressiva do IRRF sobre a base líquida.",
    "Legislação": "Lei 7.713/88",
    "Exemplos_Aplicaveis": "Incide sobre verbas tributáveis.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Adiantamentos_e_Vales_(Saldo_Devedor)",
    "Cálculo": {
      "Parametro": "Valores_Adiantados_e_Não_Compensados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_de_Vales_e_Adiantamentos"
    },
    "Memoria_de_Calculo": "Base: Total de vales e adiantamentos concedidos. Cálculo: Soma de todos os adiantamentos salariais e vales (transporte, refeição, etc.) que não foram compensados.",
    "Legislação": "CLT, Art. 462",
    "Exemplos_Aplicaveis": "Vales salariais, adiantamentos de 13º e outros valores antecipados não compensados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Empréstimos_Consignados_e_Outros_Autorizados",
    "Cálculo": {
      "Parametro": "Saldo_Devedor_a_ser_descontado",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Desconto_permitido_por_lei_ou_contrato"
    },
    "Memoria_de_Calculo": "Base: Saldo devedor. Cálculo: Desconto do saldo de empréstimos consignados ou outros empréstimos, respeitando o limite legal de desconto na rescisão.",
    "Legislação": "Lei 10.820/03 e CLT, Art. 462",
    "Exemplos_Aplicaveis": "Parcelas restantes de empréstimos e descontos expressamente autorizados.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Faltas_e_Atrasos_Injustificados",
    "Cálculo": {
      "Parametro": "Qtd_Dias_Faltas_e_Horas_Atrasos",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_por_dia_ou_hora_não_trabalhada"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Salário Base / 30) * [Dias de Falta] e/ou (Valor Hora) * [Horas de Atraso], mais DSR's perdidos.",
    "Legislação": "CLT, Art. 473",
    "Exemplos_Aplicaveis": "Desconto dos dias ou horas em que o empregado faltou sem justificativa legal.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Vale_Transporte_e_Alimentação_Antecipado",
    "Cálculo": {
      "Parametro": "Valor_Relativo_aos_Dias_Não_Trabalhados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Benefício_Proporcional"
    },
    "Memoria_de_Calculo": "Base: Valor do benefício mensal. Cálculo: Valor do benefício antecipado referente aos dias que o empregado não trabalhará após a rescisão.",
    "Legislação": "Lei 7.418/85 (VT) e Lei 6.321/76 (VA/VR)",
    "Exemplos_Aplicaveis": "Desconto de vales fornecidos para dias não trabalhados após a rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Danos_e_Prejuízos_Causados",
    "Cálculo": {
      "Parametro": "Valor_do_Prejuízo_(Com_Dolo_ou_Previsão)",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_do_Dano_Causado"
    },
    "Memoria_de_Calculo": "Base: Valor do prejuízo. Cálculo: Valor do prejuízo, descontado apenas se comprovado **dolo** ou se houver **previsão expressa** em contrato para desconto por culpa.",
    "Legislação": "CLT, Art. 462, §1º",
    "Exemplos_Aplicaveis": "Dano causado com **dolo** ou com **culpa** se houver **previsão expressa** em contrato.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Desconto": "Mensalidades_Sindicais_e_Contribuições",
    "Cálculo": {
      "Parametro": "Valores_Devidos_e_Autorizados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_da_Contribuição_Sindical_Devida"
    },
    "Memoria_de_Calculo": "Base: Valor da contribuição sindical/associativa. Cálculo: Valor da contribuição devida, descontado apenas se houver autorização prévia e expressa do empregado.",
    "Legislação": "CLT, Art. 578 e 579",
    "Exemplos_Aplicaveis": "Contribuições sindicais ou associativas apenas se houver autorização prévia e expressa do empregado.",
    "Natureza_da_Verba": "Normal"
  }
]`,
  observacoes_base_legal: `Base Legal Central	Todos os cálculos devem ser realizados sob o rigor do Decreto-Lei nº 5.452/43 (CLT), a Lei nº 8.036/90 (FGTS) e o Decreto nº 3.048/99 (Regulamento da Previdência Social/INSS).	Estabelece as fontes legais primárias e obrigatórias para todos os cálculos.
Validação de Vínculo (CTPS)	Regra de Validação: Se a informação de entrada ctpsAssinada for "não" ou nula, você deve cobrar o valor integral do item "FGTS_Não_Depositado_e_Devido", mesmo que o valor de entrada seja zero, pois a irregularidade implica no não recolhimento de todo o período.	Força a inclusão da verba de irregularidade quando houver ausência de registro formal.
Análise Sindical	Validação de Verba: O campo de entrada obsSindicato deve ser analisado para verificar se indica a aplicação de piso salarial não cumprido, multa por atraso na homologação, ou qualquer crédito/débito que afete a remuneração ou os descontos finais.	Garante que o Agente incorpore detalhes específicos da Convenção Coletiva (CCT).
Proventos de FGTS	Regra de Cálculo: O campo "Multa_FGTS_40_Por_Cento" deve ser calculado sobre o saldo total do FGTS (Saldo na Conta + FGTS Não Depositado). O Agente deve garantir que o valor não depositado seja cobrado.	Clarifica a base de cálculo correta da multa, incluindo a parte devida por irregularidade.
Aviso Geral	Princípio de Execução: O cálculo deve ser tratado como uma simulação baseada estritamente nos dados de entrada. A IA não deve introduzir dados externos, mas sim usar a maior base de cálculo possível (Salário Base + Média de Variáveis, Piso Categoria, etc.) para todas as verbas reflexas (Férias, 13º, Aviso).	Reforça a natureza simulada e a necessidade de usar o maior valor da remuneração para calcular reflexos.`,
  estrutura_json_modelo_saida: `{
  "Verbas_Rescisorias": {
    "Remuneracao": [
      {
        "Provento": "Média_de_Verbas_Variáveis_(Integração_à_Base)",
        "Cálculo": {
          "Parametro": "Média_das_Variáveis_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Média_Horas_Extras + Média_Comissões + Média_Adicionais) / N_Meses"
        },
        "Memoria_de_Calculo": "Base: Verbas variáveis pagas nos últimos 12 meses (Horas Extras, Adicional Noturno, Comissões, etc.). Cálculo: Soma dessas verbas dividida por 12. Este valor deve ser somado ao Salário Base Fixo para compor a Remuneração Média.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "O valor encontrado aqui é a base para corrigir o Salário Base (Salário Base Corrigido).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Base_de_Cálculo_Rescisória",
        "Cálculo": {
          "Parametro": "Remuneração_Média_para_Proporcionais",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Fixo + Média_de_Verbas_Variáveis"
        },
        "Memoria_de_Calculo": "Base: Salário Base Fixo do Contrato. Cálculo: Soma do Salário Base Fixo com o valor calculado na verba 'Média_de_Verbas_Variáveis_(Integração_à_Base)'. Este valor compõe o Salário Base Corrigido/Remuneração Média utilizado como base para Férias, 13º e Aviso Prévio.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "É a remuneração integral (Salário Base Corrigido) considerada para calcular todas as verbas proporcionais e indenizadas.",
        "Natureza_da_Verba": "Informativa"
      },
      {
        "Provento": "Saldo_de_Salário",
        "Cálculo": {
          "Parametro": "Dias_Trabalhados_no_Mês",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_Trabalhados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido/Remuneração Média. Cálculo: (Salário Base Corrigido / 30) * [Número de Dias Trabalhados no Mês da Rescisão].",
        "Legislação": "CLT, Art. 457, §1º",
        "Exemplos_Aplicaveis": "Qualquer tipo de rescisão contratual.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Diferença_Salarial_Retroativa_(Piso_ou_Função)",
        "Cálculo": {
          "Parametro": "Meses_de_Diferença_a_ser_Paga",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_das_diferenças_mensais (Salário_Devido - Salário_Pago) * Meses_do_Contrato"
        },
        "Memoria_de_Calculo": "Cálculo: (Piso Salarial da Categoria - Salário Pago) multiplicado pelo número de meses em que a diferença foi devida.",
        "Legislação": "CLT, Art. 460 e Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Aplica-se quando o salário pago é inferior ao piso da categoria ou quando há acúmulo/desvio de função.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Devido_Anos_Anteriores",
        "Cálculo": {
          "Parametro": "Anos_Integrais_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * N_Anos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: Salário Base Corrigido multiplicado pelo número de anos integrais pendentes de pagamento do 13º.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Quando o 13º Salário de anos anteriores não foi pago no prazo legal.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Integral_(Ano_Corrente)",
        "Cálculo": {
          "Parametro": "Aplicável_se_Rescisão_em_Dezembro",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * 1.0"
        },
        "Memoria_de_Calculo": "Aplicável se a rescisão ocorrer em dezembro. Base: Salário Base Corrigido. Cálculo: Salário Base Corrigido * 1.0.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Devido integralmente no ano da rescisão (se a rescisão ocorrer em Dezembro).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_Salário_Proporcional",
        "Cálculo": {
          "Parametro": "Meses_Trabalhados_no_Ano",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: (Salário Base Corrigido / 12) * [Número de Meses Proporcionais (mês com 15 dias ou mais)].",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Avos do 13º devidos no ano da rescisão (exceto justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_do_Aviso_(Projeção)",
        "Cálculo": {
          "Parametro": "Projeção_do_Aviso_Prévio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * 1_Mês"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "1/12 avos do 13º Salário referente ao mês projetado pelo aviso prévio indenizado.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_Simples_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Não_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos não dobrados.",
        "Legislação": "CLT, Art. 146",
        "Exemplos_Aplicaveis": "Férias vencidas, mas que ainda não atingiram o período para pagamento em dobro (após 12 meses do período concessivo).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_em_Dobro_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos dobrados (multiplicar por 2).",
        "Legislação": "CLT, Art. 137",
        "Exemplos_Aplicaveis": "Férias vencidas, não usufruídas, e que já ultrapassaram o período concessivo.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Proporcionais",
        "Cálculo": {
          "Parametro": "Meses_Proporcionais_de_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: (Salário Base Corrigido / 12) multiplicado pelo número de meses proporcionais no último período aquisitivo.",
        "Legislação": "CLT, Art. 147",
        "Exemplos_Aplicaveis": "Meses trabalhados no último período aquisitivo (geralmente pago exceto em justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_do_Aviso_Prévio",
        "Cálculo": {
          "Parametro": "Meses_Projetados_pelo_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Projetados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "Projeção de férias referente ao período indenizado do Aviso Prévio.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Um_Terço_Constitucional_Geral",
        "Cálculo": {
          "Parametro": "Soma_de_Todas_as_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Férias_Vencidas_Simples + Férias_Dobro + Férias_Proporcionais + Férias_Aviso) * 1/3"
        },
        "Memoria_de_Calculo": "Base: Soma de todas as verbas de Férias (Vencidas, Dobradas, Proporcionais, Aviso). Cálculo: Soma da Base de Férias * 1/3 (0.3333).",
        "Legislação": "CF/88, Art. 7º, XVII",
        "Exemplos_Aplicaveis": "Adicional obrigatório de 1/3 incidente sobre a soma de todas as verbas de férias.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Aviso_Prévio_Indenizado_pelo_Empregador",
        "Cálculo": {
          "Parametro": "Dias_de_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_de_Aviso"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Aviso Prévio Devidos (30 dias + 3 dias/ano)].",
        "Legislação": "CLT, Art. 487 e Lei 12.506/11",
        "Exemplos_Aplicaveis": "Demissão sem justa causa, dispensa indireta. Base de cálculo deve incluir as médias das verbas variáveis.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_50_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_50%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.50 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.50 * [Total de Horas Extras a 50% Pendentes].",
        "Legislação": "CF/88, Art. 7º, XVI e CLT, Art. 59",
        "Exemplos_Aplicaveis": "Horas trabalhadas em dias úteis fora da jornada normal (acréscimo mínimo de 50%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_70_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_70%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.70 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.70 * [Total de Horas Extras a 70% Pendentes]. Aplicar se houver previsão em CCT.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Horas trabalhadas que possuem um adicional majorado por previsão em Convenção Coletiva.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_100_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_100%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 2.00 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 2.00 * [Total de Horas Extras a 100% Pendentes].",
        "Legislação": "Súmula 113 do TST e Lei 605/49",
        "Exemplos_Aplicaveis": "Horas trabalhadas em domingos e feriados não compensados (adicional de 100%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Folgas_DSR_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Folga_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Folga * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Folga Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "CLT, Art. 67 e Lei 605/49",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos Descansos Semanais Remunerados (DSRs) trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Feriado_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Feriado_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Feriado * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Feriado Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "Lei 605/49, Art. 9º",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos feriados civis ou religiosos trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Multa_FGTS_40_Por_Cento",
        "Cálculo": {
          "Parametro": "Saldo_do_FGTS_na_Rescisão",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Saldo_FGTS * 0.40"
        },
        "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.40 (40%).",
        "Legislação": "Lei 8.036/90, Art. 18, §1º",
         "Exemplos_Aplicaveis": "**Verba de Irregularidade** \"Dispensa sem justa causa e Rescisão Indireta. somente se o funcionário estiver sem CTPS assinada\"",
            "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "FGTS_Não_Depositado_e_Devido",
    "Cálculo": {
      "Parametro": "Total_de_Depósitos_Faltantes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_8%_de_cada_mês_não_recolhido + Juros_e_Multa"
    },
    "Memoria_de_Calculo": "Base: Remuneração de cada mês não recolhido. Cálculo: Soma dos 8% de cada competência faltante, acrescida de juros e multa conforme legislação do FGTS.",
    "Legislação": "Lei 8.036/90",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Meses em que a empresa não recolheu o FGTS, ou todo o período em caso de **CTPS não assinada**.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Adicional_de_Periculosidade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base * 0.30"
    },
    "Memoria_de_Calculo": "Base: Salário Base (sem adicionais). Cálculo: Salário Base * 0.30 (30%). Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 193",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a risco (eletricidade, inflamáveis, explosivos).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_de_Insalubridade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Mínimo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Mínimo * (0.10, 0.20 ou 0.40)"
    },
    "Memoria_de_Calculo": "Base: Salário Mínimo Vigente. Cálculo: Salário Mínimo * [Grau de Insalubridade (10%, 20% ou 40%)]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 192",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a agentes nocivos à saúde em grau Mínimo, Médio ou Máximo.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_por_Tempo_de_Serviço_(Biênio, Triênio, Quinquênio)",
    "Cálculo": {
      "Parametro": "Anos_Completos_e_Percentual_Aplicável",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_sobre_Salário_Base * N_Períodos_Completos"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Período) * [Número de Períodos Completos]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "Convenção/Acordo_Coletivo_ou_Lei_Estadual/Municipal",
    "Exemplos_Aplicaveis": "Pagamento de percentual progressivo por tempo de serviço, conforme previsto em norma coletiva. (Inclui Biênio, Triênio, Quadriênio, etc.).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Saldo_Banco_de_Horas_Não_Compensado",
    "Cálculo": {
      "Parametro": "Total_Horas_Credoras_no_Banco",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora * Saldo_Banco_de_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Extra. Cálculo: [Valor da Hora Extra] multiplicado pelo Saldo de Horas Credoras (a favor do empregado).",
    "Legislação": "CLT, Art. 59, §3º",
    "Exemplos_Aplicaveis": "Horas positivas no banco de horas, pagas como extra na rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_FGTS_20_Por_Cento_(Acordo_Mútuo)",
    "Cálculo": {
      "Parametro": "Saldo_do_FGTS_na_Rescisão",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Saldo_FGTS * 0.20"
    },
    "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.20 (20%). Aplicável apenas na rescisão por acordo mútuo.",
    "Legislação": "CLT, Art. 484-A",
    "Exemplos_Aplicaveis": "Rescisão por acordo entre empregado e empregador (demissão consensual).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Diárias_para_Viagem_Excedentes_a_50%",
    "Cálculo": {
      "Parametro": "Valor_Total_Diárias",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Diárias_que_excedem_50%_do_salário_mensal"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Valor das diárias de viagem que ultrapassam 50% do Salário Base. Este valor passa a ter natureza salarial.",
    "Legislação": "CLT, Art. 457, §2º",
    "Exemplos_Aplicaveis": "Diárias que, por seu valor excessivo, adquirem natureza salarial e devem integrar o cálculo rescisório.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Gorjetas_(Apuradas_e_Registradas)",
    "Cálculo": {
      "Parametro": "Média_das_Gorjetas_no_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Integram_a_base_de_cálculo_das_verbas_rescisórias"
    },
    "Memoria_de_Calculo": "Base: Média dos valores de gorjeta. Cálculo: Média do valor das gorjetas sobre o período de apuração. Este valor integra a base de cálculo.",
    "Legislação": "CLT, Art. 457, §3º",
    "Exemplos_Aplicaveis": "Gorjetas que integravam a remuneração média e precisam ser refletidas nas verbas rescisórias.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_Noturno_Devido",
    "Cálculo": {
      "Parametro": "Total_Adicional_Noturno_Pendentes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_do_Adicional_Noturno_devido"
    },
    "Memoria_de_Calculo": "Base: Horas noturnas pendentes. Cálculo: Soma do valor do adicional noturno devido, calculado sobre as horas trabalhadas entre 22h e 5h.",
    "Legislação": "CLT, Art. 73",
    "Exemplos_Aplicaveis": "Horas trabalhadas no período noturno e não pagas.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Salário_Família_Proporcional",
    "Cálculo": {
      "Parametro": "Dias_Trabalhados_no_Mês",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Benefício / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor do Salário-Família. Cálculo: (Valor Benefício / 30) * [Dias Trabalhados no Mês da Rescisão].",
    "Legislação": "Lei 8.213/91",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês de rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Adicional_(Lei_6.708/79)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Dispensa_Próximo_Data_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Geralmente_Equivalente_a_Um_Salário"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: Geralmente equivalente a 1 Salário Base. Aplicável se a dispensa sem justa causa ocorrer nos 30 dias que antecedem a data base.",
    "Legislação": "Lei 6.708/79 (Verificar CCT)",
    "Exemplos_Aplicaveis": "Dispensa nos 30 dias que antecedem a data base de correção salarial.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Art_479_CLT_(Prazo_Determinado)",
    "Cálculo": {
      "Parametro": "Dias_Faltantes_para_Fim_do_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Metade_da_Remuneração_a_que_teria_direito"
    },
    "Memoria_de_Calculo": "Base: Remuneração restante até o fim do contrato. Cálculo: Metade da remuneração que o empregado teria direito até o fim do contrato por prazo determinado.",
    "Legislação": "CLT, Art. 479",
    "Exemplos_Aplicaveis": "Contrato por prazo determinado (ex: experiência) rescindido antecipadamente e sem justa causa pelo empregador.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_por_Dispensa_Indireta",
    "Cálculo": {
      "Parametro": "Decisão_Judicial_ou_Acordo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Definido_em_Sentença_ou_Acordo"
    },
    "Memoria_de_Calculo": "Base: Remuneração Devida. Cálculo: Conforme decisão judicial ou acordo. Verbas equivalentes à demissão sem justa causa.",
    "Legislação": "CLT, Art. 483",
    "Exemplos_Aplicaveis": "Empregado demite o empregador por falta grave (resulta em verbas de demissão sem justa causa).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_Art_477_CLT_(Atraso_na_Quitação)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Pagamento_Atrasado",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Salário Base Integral. Aplicável se as verbas rescisórias não forem pagas no prazo legal (10 dias após o término do contrato).",
    "Legislação": "CLT, Art. 477, §8º",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Atraso no pagamento da rescisão.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Quebra_de_Caixa_Devida",
    "Cálculo": {
      "Parametro": "Valor_mensal_conforme_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Mensal_CCT / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor estabelecido em norma coletiva ou contrato. Cálculo: Pagamento proporcional ao Saldo de Salário, caso o empregado tenha exercido a função no mês da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Contrato",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês da rescisão para empregados que lidam com numerário e têm a verba prevista em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Alimentação_ou_Refeição_Devido",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_valores_pendentes_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor do benefício estabelecido em norma coletiva. Cálculo: Pagamento dos valores de Auxílio Alimentação/Refeição devidos no mês da rescisão e não fornecidos/pagos. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Lei 6.321/76",
    "Exemplos_Aplicaveis": "Valores pendentes de pagamento ou fornecimento no período trabalhado do mês da rescisão. Geralmente verba indenizatória.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Creche_ou_Babá_Indenizado",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_mensal_ou_proporcional_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor e critérios estabelecidos em norma coletiva. Cálculo: Valores devidos e não pagos/indenizados até a data da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou CLT, Art. 389, §1º",
    "Exemplos_Aplicaveis": "Pagamento de valores devidos conforme as regras da CCT ou acordo (geralmente com natureza indenizatória).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Funeral_Devido",
    "Cálculo": {
      "Parametro": "Valor_total_da_indenização_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Fixo_Definido_na_CCT_em_caso_de_óbito"
    },
    "Memoria_de_Calculo": "Base: Valor fixo ou critérios definidos em norma coletiva. Cálculo: Indenização devida aos dependentes em caso de óbito do empregado, conforme as regras da CCT. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Indenização paga aos dependentes em caso de falecimento do empregado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Biênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Biênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Biênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Biênio) * [Número de Biênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 2 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Triênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Triênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Triênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Triênio) * [Número de Triênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 3 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Quadriênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Quadriênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Quadriênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Quadriênio) * [Número de Quadriênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 4 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  }
]`,
  observacoes_base_legal: `Base Legal Central	Todos os cálculos devem ser realizados sob o rigor do Decreto-Lei nº 5.452/43 (CLT), a Lei nº 8.036/90 (FGTS) e o Decreto nº 3.048/99 (Regulamento da Previdência Social/INSS).	Estabelece as fontes legais primárias e obrigatórias para todos os cálculos.
Validação de Vínculo (CTPS)	Regra de Validação: Se a informação de entrada ctpsAssinada for "não" ou nula, você deve cobrar o valor integral do item "FGTS_Não_Depositado_e_Devido", mesmo que o valor de entrada seja zero, pois a irregularidade implica no não recolhimento de todo o período.	Força a inclusão da verba de irregularidade quando houver ausência de registro formal.
Análise Sindical	Validação de Verba: O campo de entrada obsSindicato deve ser analisado para verificar se indica a aplicação de piso salarial não cumprido, multa por atraso na homologação, ou qualquer crédito/débito que afete a remuneração ou os descontos finais.	Garante que o Agente incorpore detalhes específicos da Convenção Coletiva (CCT).
Proventos de FGTS	Regra de Cálculo: O campo "Multa_FGTS_40_Por_Cento" deve ser calculado sobre o saldo total do FGTS (Saldo na Conta + FGTS Não Depositado). O Agente deve garantir que o valor não depositado seja cobrado.	Clarifica a base de cálculo correta da multa, incluindo a parte devida por irregularidade.
Aviso Geral	Princípio de Execução: O cálculo deve ser tratado como uma simulação baseada estritamente nos dados de entrada. A IA não deve introduzir dados externos, mas sim usar a maior base de cálculo possível (Salário Base + Média de Variáveis, Piso Categoria, etc.) para todas as verbas reflexas (Férias, 13º, Aviso).	Reforça a natureza simulada e a necessidade de usar o maior valor da remuneração para calcular reflexos.`,
  estrutura_json_modelo_saida: `{
  "Verbas_Rescisorias": {
    "Remuneracao": [
      {
        "Provento": "Média_de_Verbas_Variáveis_(Integração_à_Base)",
        "Cálculo": {
          "Parametro": "Média_das_Variáveis_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Média_Horas_Extras + Média_Comissões + Média_Adicionais) / N_Meses"
        },
        "Memoria_de_Calculo": "Base: Verbas variáveis pagas nos últimos 12 meses (Horas Extras, Adicional Noturno, Comissões, etc.). Cálculo: Soma dessas verbas dividida por 12. Este valor deve ser somado ao Salário Base Fixo para compor a Remuneração Média.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "O valor encontrado aqui é a base para corrigir o Salário Base (Salário Base Corrigido).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Base_de_Cálculo_Rescisória",
        "Cálculo": {
          "Parametro": "Remuneração_Média_para_Proporcionais",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Fixo + Média_de_Verbas_Variáveis"
        },
        "Memoria_de_Calculo": "Base: Salário Base Fixo do Contrato. Cálculo: Soma do Salário Base Fixo com o valor calculado na verba 'Média_de_Verbas_Variáveis_(Integração_à_Base)'. Este valor compõe o Salário Base Corrigido/Remuneração Média utilizado como base para Férias, 13º e Aviso Prévio.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "É a remuneração integral (Salário Base Corrigido) considerada para calcular todas as verbas proporcionais e indenizadas.",
        "Natureza_da_Verba": "Informativa"
      },
      {
        "Provento": "Saldo_de_Salário",
        "Cálculo": {
          "Parametro": "Dias_Trabalhados_no_Mês",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_Trabalhados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido/Remuneração Média. Cálculo: (Salário Base Corrigido / 30) * [Número de Dias Trabalhados no Mês da Rescisão].",
        "Legislação": "CLT, Art. 457, §1º",
        "Exemplos_Aplicaveis": "Qualquer tipo de rescisão contratual.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Diferença_Salarial_Retroativa_(Piso_ou_Função)",
        "Cálculo": {
          "Parametro": "Meses_de_Diferença_a_ser_Paga",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_das_diferenças_mensais (Salário_Devido - Salário_Pago) * Meses_do_Contrato"
        },
        "Memoria_de_Calculo": "Cálculo: (Piso Salarial da Categoria - Salário Pago) multiplicado pelo número de meses em que a diferença foi devida.",
        "Legislação": "CLT, Art. 460 e Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Aplica-se quando o salário pago é inferior ao piso da categoria ou quando há acúmulo/desvio de função.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Devido_Anos_Anteriores",
        "Cálculo": {
          "Parametro": "Anos_Integrais_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * N_Anos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: Salário Base Corrigido multiplicado pelo número de anos integrais pendentes de pagamento do 13º.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Quando o 13º Salário de anos anteriores não foi pago no prazo legal.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Integral_(Ano_Corrente)",
        "Cálculo": {
          "Parametro": "Aplicável_se_Rescisão_em_Dezembro",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * 1.0"
        },
        "Memoria_de_Calculo": "Aplicável se a rescisão ocorrer em dezembro. Base: Salário Base Corrigido. Cálculo: Salário Base Corrigido * 1.0.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Devido integralmente no ano da rescisão (se a rescisão ocorrer em Dezembro).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_Salário_Proporcional",
        "Cálculo": {
          "Parametro": "Meses_Trabalhados_no_Ano",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: (Salário Base Corrigido / 12) * [Número de Meses Proporcionais (mês com 15 dias ou mais)].",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Avos do 13º devidos no ano da rescisão (exceto justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_do_Aviso_(Projeção)",
        "Cálculo": {
          "Parametro": "Projeção_do_Aviso_Prévio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * 1_Mês"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "1/12 avos do 13º Salário referente ao mês projetado pelo aviso prévio indenizado.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_Simples_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Não_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos não dobrados.",
        "Legislação": "CLT, Art. 146",
        "Exemplos_Aplicaveis": "Férias vencidas, mas que ainda não atingiram o período para pagamento em dobro (após 12 meses do período concessivo).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_em_Dobro_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos dobrados (multiplicar por 2).",
        "Legislação": "CLT, Art. 137",
        "Exemplos_Aplicaveis": "Férias vencidas, não usufruídas, e que já ultrapassaram o período concessivo.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Proporcionais",
        "Cálculo": {
          "Parametro": "Meses_Proporcionais_de_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: (Salário Base Corrigido / 12) multiplicado pelo número de meses proporcionais no último período aquisitivo.",
        "Legislação": "CLT, Art. 147",
        "Exemplos_Aplicaveis": "Meses trabalhados no último período aquisitivo (geralmente pago exceto em justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_do_Aviso_Prévio",
        "Cálculo": {
          "Parametro": "Meses_Projetados_pelo_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Projetados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "Projeção de férias referente ao período indenizado do Aviso Prévio.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Um_Terço_Constitucional_Geral",
        "Cálculo": {
          "Parametro": "Soma_de_Todas_as_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Férias_Vencidas_Simples + Férias_Dobro + Férias_Proporcionais + Férias_Aviso) * 1/3"
        },
        "Memoria_de_Calculo": "Base: Soma de todas as verbas de Férias (Vencidas, Dobradas, Proporcionais, Aviso). Cálculo: Soma da Base de Férias * 1/3 (0.3333).",
        "Legislação": "CF/88, Art. 7º, XVII",
        "Exemplos_Aplicaveis": "Adicional obrigatório de 1/3 incidente sobre a soma de todas as verbas de férias.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Aviso_Prévio_Indenizado_pelo_Empregador",
        "Cálculo": {
          "Parametro": "Dias_de_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_de_Aviso"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Aviso Prévio Devidos (30 dias + 3 dias/ano)].",
        "Legislação": "CLT, Art. 487 e Lei 12.506/11",
        "Exemplos_Aplicaveis": "Demissão sem justa causa, dispensa indireta. Base de cálculo deve incluir as médias das verbas variáveis.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_50_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_50%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.50 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.50 * [Total de Horas Extras a 50% Pendentes].",
        "Legislação": "CF/88, Art. 7º, XVI e CLT, Art. 59",
        "Exemplos_Aplicaveis": "Horas trabalhadas em dias úteis fora da jornada normal (acréscimo mínimo de 50%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_70_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_70%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.70 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.70 * [Total de Horas Extras a 70% Pendentes]. Aplicar se houver previsão em CCT.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Horas trabalhadas que possuem um adicional majorado por previsão em Convenção Coletiva.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_100_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_100%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 2.00 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 2.00 * [Total de Horas Extras a 100% Pendentes].",
        "Legislação": "Súmula 113 do TST e Lei 605/49",
        "Exemplos_Aplicaveis": "Horas trabalhadas em domingos e feriados não compensados (adicional de 100%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Folgas_DSR_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Folga_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Folga * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Folga Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "CLT, Art. 67 e Lei 605/49",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos Descansos Semanais Remunerados (DSRs) trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Feriado_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Feriado_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Feriado * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Feriado Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "Lei 605/49, Art. 9º",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos feriados civis ou religiosos trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Multa_FGTS_40_Por_Cento",
        "Cálculo": {
          "Parametro": "Saldo_do_FGTS_na_Rescisão",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Saldo_FGTS * 0.40"
        },
        "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.40 (40%).",
        "Legislação": "Lei 8.036/90, Art. 18, §1º",
         "Exemplos_Aplicaveis": "**Verba de Irregularidade** \"Dispensa sem justa causa e Rescisão Indireta. somente se o funcionário estiver sem CTPS assinada\"",
            "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "FGTS_Não_Depositado_e_Devido",
    "Cálculo": {
      "Parametro": "Total_de_Depósitos_Faltantes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_8%_de_cada_mês_não_recolhido + Juros_e_Multa"
    },
    "Memoria_de_Calculo": "Base: Remuneração de cada mês não recolhido. Cálculo: Soma dos 8% de cada competência faltante, acrescida de juros e multa conforme legislação do FGTS.",
    "Legislação": "Lei 8.036/90",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Meses em que a empresa não recolheu o FGTS, ou todo o período em caso de **CTPS não assinada**.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Adicional_de_Periculosidade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base * 0.30"
    },
    "Memoria_de_Calculo": "Base: Salário Base (sem adicionais). Cálculo: Salário Base * 0.30 (30%). Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 193",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a risco (eletricidade, inflamáveis, explosivos).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_de_Insalubridade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Mínimo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Mínimo * (0.10, 0.20 ou 0.40)"
    },
    "Memoria_de_Calculo": "Base: Salário Mínimo Vigente. Cálculo: Salário Mínimo * [Grau de Insalubridade (10%, 20% ou 40%)]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 192",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a agentes nocivos à saúde em grau Mínimo, Médio ou Máximo.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_por_Tempo_de_Serviço_(Biênio, Triênio, Quinquênio)",
    "Cálculo": {
      "Parametro": "Anos_Completos_e_Percentual_Aplicável",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_sobre_Salário_Base * N_Períodos_Completos"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Período) * [Número de Períodos Completos]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "Convenção/Acordo_Coletivo_ou_Lei_Estadual/Municipal",
    "Exemplos_Aplicaveis": "Pagamento de percentual progressivo por tempo de serviço, conforme previsto em norma coletiva. (Inclui Biênio, Triênio, Quadriênio, etc.).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Saldo_Banco_de_Horas_Não_Compensado",
    "Cálculo": {
      "Parametro": "Total_Horas_Credoras_no_Banco",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora * Saldo_Banco_de_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Extra. Cálculo: [Valor da Hora Extra] multiplicado pelo Saldo de Horas Credoras (a favor do empregado).",
    "Legislação": "CLT, Art. 59, §3º",
    "Exemplos_Aplicaveis": "Horas positivas no banco de horas, pagas como extra na rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_FGTS_20_Por_Cento_(Acordo_Mútuo)",
    "Cálculo": {
      "Parametro": "Saldo_do_FGTS_na_Rescisão",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Saldo_FGTS * 0.20"
    },
    "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.20 (20%). Aplicável apenas na rescisão por acordo mútuo.",
    "Legislação": "CLT, Art. 484-A",
    "Exemplos_Aplicaveis": "Rescisão por acordo entre empregado e empregador (demissão consensual).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Diárias_para_Viagem_Excedentes_a_50%",
    "Cálculo": {
      "Parametro": "Valor_Total_Diárias",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Diárias_que_excedem_50%_do_salário_mensal"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Valor das diárias de viagem que ultrapassam 50% do Salário Base. Este valor passa a ter natureza salarial.",
    "Legislação": "CLT, Art. 457, §2º",
    "Exemplos_Aplicaveis": "Diárias que, por seu valor excessivo, adquirem natureza salarial e devem integrar o cálculo rescisório.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Gorjetas_(Apuradas_e_Registradas)",
    "Cálculo": {
      "Parametro": "Média_das_Gorjetas_no_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Integram_a_base_de_cálculo_das_verbas_rescisórias"
    },
    "Memoria_de_Calculo": "Base: Média dos valores de gorjeta. Cálculo: Média do valor das gorjetas sobre o período de apuração. Este valor integra a base de cálculo.",
    "Legislação": "CLT, Art. 457, §3º",
    "Exemplos_Aplicaveis": "Gorjetas que integravam a remuneração média e precisam ser refletidas nas verbas rescisórias.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_Noturno_Devido",
    "Cálculo": {
      "Parametro": "Total_Adicional_Noturno_Pendentes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_do_Adicional_Noturno_devido"
    },
    "Memoria_de_Calculo": "Base: Horas noturnas pendentes. Cálculo: Soma do valor do adicional noturno devido, calculado sobre as horas trabalhadas entre 22h e 5h.",
    "Legislação": "CLT, Art. 73",
    "Exemplos_Aplicaveis": "Horas trabalhadas no período noturno e não pagas.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Salário_Família_Proporcional",
    "Cálculo": {
      "Parametro": "Dias_Trabalhados_no_Mês",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Benefício / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor do Salário-Família. Cálculo: (Valor Benefício / 30) * [Dias Trabalhados no Mês da Rescisão].",
    "Legislação": "Lei 8.213/91",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês de rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Adicional_(Lei_6.708/79)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Dispensa_Próximo_Data_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Geralmente_Equivalente_a_Um_Salário"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: Geralmente equivalente a 1 Salário Base. Aplicável se a dispensa sem justa causa ocorrer nos 30 dias que antecedem a data base.",
    "Legislação": "Lei 6.708/79 (Verificar CCT)",
    "Exemplos_Aplicaveis": "Dispensa nos 30 dias que antecedem a data base de correção salarial.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Art_479_CLT_(Prazo_Determinado)",
    "Cálculo": {
      "Parametro": "Dias_Faltantes_para_Fim_do_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Metade_da_Remuneração_a_que_teria_direito"
    },
    "Memoria_de_Calculo": "Base: Remuneração restante até o fim do contrato. Cálculo: Metade da remuneração que o empregado teria direito até o fim do contrato por prazo determinado.",
    "Legislação": "CLT, Art. 479",
    "Exemplos_Aplicaveis": "Contrato por prazo determinado (ex: experiência) rescindido antecipadamente e sem justa causa pelo empregador.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_por_Dispensa_Indireta",
    "Cálculo": {
      "Parametro": "Decisão_Judicial_ou_Acordo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Definido_em_Sentença_ou_Acordo"
    },
    "Memoria_de_Calculo": "Base: Remuneração Devida. Cálculo: Conforme decisão judicial ou acordo. Verbas equivalentes à demissão sem justa causa.",
    "Legislação": "CLT, Art. 483",
    "Exemplos_Aplicaveis": "Empregado demite o empregador por falta grave (resulta em verbas de demissão sem justa causa).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_Art_477_CLT_(Atraso_na_Quitação)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Pagamento_Atrasado",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Salário Base Integral. Aplicável se as verbas rescisórias não forem pagas no prazo legal (10 dias após o término do contrato).",
    "Legislação": "CLT, Art. 477, §8º",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Atraso no pagamento da rescisão.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Quebra_de_Caixa_Devida",
    "Cálculo": {
      "Parametro": "Valor_mensal_conforme_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Mensal_CCT / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor estabelecido em norma coletiva ou contrato. Cálculo: Pagamento proporcional ao Saldo de Salário, caso o empregado tenha exercido a função no mês da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Contrato",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês da rescisão para empregados que lidam com numerário e têm a verba prevista em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Alimentação_ou_Refeição_Devido",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_valores_pendentes_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor do benefício estabelecido em norma coletiva. Cálculo: Pagamento dos valores de Auxílio Alimentação/Refeição devidos no mês da rescisão e não fornecidos/pagos. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Lei 6.321/76",
    "Exemplos_Aplicaveis": "Valores pendentes de pagamento ou fornecimento no período trabalhado do mês da rescisão. Geralmente verba indenizatória.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Creche_ou_Babá_Indenizado",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_mensal_ou_proporcional_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor e critérios estabelecidos em norma coletiva. Cálculo: Valores devidos e não pagos/indenizados até a data da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou CLT, Art. 389, §1º",
    "Exemplos_Aplicaveis": "Pagamento de valores devidos conforme as regras da CCT ou acordo (geralmente com natureza indenizatória).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Funeral_Devido",
    "Cálculo": {
      "Parametro": "Valor_total_da_indenização_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Fixo_Definido_na_CCT_em_caso_de_óbito"
    },
    "Memoria_de_Calculo": "Base: Valor fixo ou critérios definidos em norma coletiva. Cálculo: Indenização devida aos dependentes em caso de óbito do empregado, conforme as regras da CCT. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Indenização paga aos dependentes em caso de falecimento do empregado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Biênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Biênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Biênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Biênio) * [Número de Biênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 2 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Triênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Triênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Triênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Triênio) * [Número de Triênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 3 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Quadriênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Quadriênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Quadriênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Quadriênio) * [Número de Quadriênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 4 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  }
]`,
  observacoes_base_legal: `Base Legal Central	Todos os cálculos devem ser realizados sob o rigor do Decreto-Lei nº 5.452/43 (CLT), a Lei nº 8.036/90 (FGTS) e o Decreto nº 3.048/99 (Regulamento da Previdência Social/INSS).	Estabelece as fontes legais primárias e obrigatórias para todos os cálculos.
Validação de Vínculo (CTPS)	Regra de Validação: Se a informação de entrada ctpsAssinada for "não" ou nula, você deve cobrar o valor integral do item "FGTS_Não_Depositado_e_Devido", mesmo que o valor de entrada seja zero, pois a irregularidade implica no não recolhimento de todo o período.	Força a inclusão da verba de irregularidade quando houver ausência de registro formal.
Análise Sindical	Validação de Verba: O campo de entrada obsSindicato deve ser analisado para verificar se indica a aplicação de piso salarial não cumprido, multa por atraso na homologação, ou qualquer crédito/débito que afete a remuneração ou os descontos finais.	Garante que o Agente incorpore detalhes específicos da Convenção Coletiva (CCT).
Proventos de FGTS	Regra de Cálculo: O campo "Multa_FGTS_40_Por_Cento" deve ser calculado sobre o saldo total do FGTS (Saldo na Conta + FGTS Não Depositado). O Agente deve garantir que o valor não depositado seja cobrado.	Clarifica a base de cálculo correta da multa, incluindo a parte devida por irregularidade.
Aviso Geral	Princípio de Execução: O cálculo deve ser tratado como uma simulação baseada estritamente nos dados de entrada. A IA não deve introduzir dados externos, mas sim usar a maior base de cálculo possível (Salário Base + Média de Variáveis, Piso Categoria, etc.) para todas as verbas reflexas (Férias, 13º, Aviso).	Reforça a natureza simulada e a necessidade de usar o maior valor da remuneração para calcular reflexos.`,
  estrutura_json_modelo_saida: `{
  "Verbas_Rescisorias": {
    "Remuneracao": [
      {
        "Provento": "Média_de_Verbas_Variáveis_(Integração_à_Base)",
        "Cálculo": {
          "Parametro": "Média_das_Variáveis_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Média_Horas_Extras + Média_Comissões + Média_Adicionais) / N_Meses"
        },
        "Memoria_de_Calculo": "Base: Verbas variáveis pagas nos últimos 12 meses (Horas Extras, Adicional Noturno, Comissões, etc.). Cálculo: Soma dessas verbas dividida por 12. Este valor deve ser somado ao Salário Base Fixo para compor a Remuneração Média.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "O valor encontrado aqui é a base para corrigir o Salário Base (Salário Base Corrigido).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Base_de_Cálculo_Rescisória",
        "Cálculo": {
          "Parametro": "Remuneração_Média_para_Proporcionais",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Fixo + Média_de_Verbas_Variáveis"
        },
        "Memoria_de_Calculo": "Base: Salário Base Fixo do Contrato. Cálculo: Soma do Salário Base Fixo com o valor calculado na verba 'Média_de_Verbas_Variáveis_(Integração_à_Base)'. Este valor compõe o Salário Base Corrigido/Remuneração Média utilizado como base para Férias, 13º e Aviso Prévio.",
        "Legislação": "Súmulas 264 e 347 do TST",
        "Exemplos_Aplicaveis": "É a remuneração integral (Salário Base Corrigido) considerada para calcular todas as verbas proporcionais e indenizadas.",
        "Natureza_da_Verba": "Informativa"
      },
      {
        "Provento": "Saldo_de_Salário",
        "Cálculo": {
          "Parametro": "Dias_Trabalhados_no_Mês",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_Trabalhados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido/Remuneração Média. Cálculo: (Salário Base Corrigido / 30) * [Número de Dias Trabalhados no Mês da Rescisão].",
        "Legislação": "CLT, Art. 457, §1º",
        "Exemplos_Aplicaveis": "Qualquer tipo de rescisão contratual.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Diferença_Salarial_Retroativa_(Piso_ou_Função)",
        "Cálculo": {
          "Parametro": "Meses_de_Diferença_a_ser_Paga",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Soma_das_diferenças_mensais (Salário_Devido - Salário_Pago) * Meses_do_Contrato"
        },
        "Memoria_de_Calculo": "Cálculo: (Piso Salarial da Categoria - Salário Pago) multiplicado pelo número de meses em que a diferença foi devida.",
        "Legislação": "CLT, Art. 460 e Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Aplica-se quando o salário pago é inferior ao piso da categoria ou quando há acúmulo/desvio de função.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Devido_Anos_Anteriores",
        "Cálculo": {
          "Parametro": "Anos_Integrais_Pendentes",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * N_Anos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: Salário Base Corrigido multiplicado pelo número de anos integrais pendentes de pagamento do 13º.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Quando o 13º Salário de anos anteriores não foi pago no prazo legal.",
        "Natureza_da_Verba": "Irregularidade_Contratual"
      },
      {
        "Provento": "13º_Salário_Integral_(Ano_Corrente)",
        "Cálculo": {
          "Parametro": "Aplicável_se_Rescisão_em_Dezembro",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * 1.0"
        },
        "Memoria_de_Calculo": "Aplicável se a rescisão ocorrer em dezembro. Base: Salário Base Corrigido. Cálculo: Salário Base Corrigido * 1.0.",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Devido integralmente no ano da rescisão (se a rescisão ocorrer em Dezembro).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_Salário_Proporcional",
        "Cálculo": {
          "Parametro": "Meses_Trabalhados_no_Ano",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo variáveis). Cálculo: (Salário Base Corrigido / 12) * [Número de Meses Proporcionais (mês com 15 dias ou mais)].",
        "Legislação": "Lei 4.090/62",
        "Exemplos_Aplicaveis": "Avos do 13º devidos no ano da rescisão (exceto justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "13º_do_Aviso_(Projeção)",
        "Cálculo": {
          "Parametro": "Projeção_do_Aviso_Prévio",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * 1_Mês"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "1/12 avos do 13º Salário referente ao mês projetado pelo aviso prévio indenizado.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_Simples_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Não_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos não dobrados.",
        "Legislação": "CLT, Art. 146",
        "Exemplos_Aplicaveis": "Férias vencidas, mas que ainda não atingiram o período para pagamento em dobro (após 12 meses do período concessivo).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Vencidas_em_Dobro_(Indenizadas)",
        "Cálculo": {
          "Parametro": "Qtd_Períodos_Vencidos_Dobrados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Salário_Base_Corrigido * Qtd_Períodos * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: Salário Base Corrigido multiplicado pelo número de períodos vencidos dobrados (multiplicar por 2).",
        "Legislação": "CLT, Art. 137",
        "Exemplos_Aplicaveis": "Férias vencidas, não usufruídas, e que já ultrapassaram o período concessivo.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_Proporcionais",
        "Cálculo": {
          "Parametro": "Meses_Proporcionais_de_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Proporcionais"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido (incluindo médias). Cálculo: (Salário Base Corrigido / 12) multiplicado pelo número de meses proporcionais no último período aquisitivo.",
        "Legislação": "CLT, Art. 147",
        "Exemplos_Aplicaveis": "Meses trabalhados no último período aquisitivo (geralmente pago exceto em justa causa).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Férias_do_Aviso_Prévio",
        "Cálculo": {
          "Parametro": "Meses_Projetados_pelo_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 12) * Meses_Projetados"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 12) * 1 avo referente à projeção do aviso prévio indenizado.",
        "Legislação": "CLT, Art. 487, §1º",
        "Exemplos_Aplicaveis": "Projeção de férias referente ao período indenizado do Aviso Prévio.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Um_Terço_Constitucional_Geral",
        "Cálculo": {
          "Parametro": "Soma_de_Todas_as_Férias",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Férias_Vencidas_Simples + Férias_Dobro + Férias_Proporcionais + Férias_Aviso) * 1/3"
        },
        "Memoria_de_Calculo": "Base: Soma de todas as verbas de Férias (Vencidas, Dobradas, Proporcionais, Aviso). Cálculo: Soma da Base de Férias * 1/3 (0.3333).",
        "Legislação": "CF/88, Art. 7º, XVII",
        "Exemplos_Aplicaveis": "Adicional obrigatório de 1/3 incidente sobre a soma de todas as verbas de férias.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Aviso_Prévio_Indenizado_pelo_Empregador",
        "Cálculo": {
          "Parametro": "Dias_de_Aviso",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base_Corrigido / 30) * Dias_de_Aviso"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Aviso Prévio Devidos (30 dias + 3 dias/ano)].",
        "Legislação": "CLT, Art. 487 e Lei 12.506/11",
        "Exemplos_Aplicaveis": "Demissão sem justa causa, dispensa indireta. Base de cálculo deve incluir as médias das verbas variáveis.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_50_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_50%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.50 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.50 * [Total de Horas Extras a 50% Pendentes].",
        "Legislação": "CF/88, Art. 7º, XVI e CLT, Art. 59",
        "Exemplos_Aplicaveis": "Horas trabalhadas em dias úteis fora da jornada normal (acréscimo mínimo de 50%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_70_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_70%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 1.70 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 1.70 * [Total de Horas Extras a 70% Pendentes]. Aplicar se houver previsão em CCT.",
        "Legislação": "Norma Coletiva (CCT/ACT)",
        "Exemplos_Aplicaveis": "Horas trabalhadas que possuem um adicional majorado por previsão em Convenção Coletiva.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Horas_Extras_100_Por_Cento",
        "Cálculo": {
          "Parametro": "Total_Horas_Pendentes_100%",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Valor_Hora_Normal * 2.00 * Total_Horas"
        },
        "Memoria_de_Calculo": "Base: Valor da Hora Normal. Cálculo: Valor Hora Normal * 2.00 * [Total de Horas Extras a 100% Pendentes].",
        "Legislação": "Súmula 113 do TST e Lei 605/49",
        "Exemplos_Aplicaveis": "Horas trabalhadas em domingos e feriados não compensados (adicional de 100%).",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Folgas_DSR_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Folga_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Folga * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Folga Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "CLT, Art. 67 e Lei 605/49",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos Descansos Semanais Remunerados (DSRs) trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Feriado_Trabalhado_e_Não_Compensado",
        "Cálculo": {
          "Parametro": "Dias_de_Feriado_Trabalhados",
          "Valor": 0.00,
          "Fórmula_Sugerida": "(Salário_Base / 30) * Dias_de_Feriado * 2"
        },
        "Memoria_de_Calculo": "Base: Salário Base Corrigido. Cálculo: (Salário Base Corrigido / 30) * [Dias de Feriado Trabalhados] * 2 (Pagamento em dobro).",
        "Legislação": "Lei 605/49, Art. 9º",
        "Exemplos_Aplicaveis": "Pagamento em dobro dos feriados civis ou religiosos trabalhados e não usufruídos/compensados.",
        "Natureza_da_Verba": "Normal"
      },
      {
        "Provento": "Multa_FGTS_40_Por_Cento",
        "Cálculo": {
          "Parametro": "Saldo_do_FGTS_na_Rescisão",
          "Valor": 0.00,
          "Fórmula_Sugerida": "Saldo_FGTS * 0.40"
        },
        "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.40 (40%).",
        "Legislação": "Lei 8.036/90, Art. 18, §1º",
         "Exemplos_Aplicaveis": "**Verba de Irregularidade** \"Dispensa sem justa causa e Rescisão Indireta. somente se o funcionário estiver sem CTPS assinada\"",
            "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "FGTS_Não_Depositado_e_Devido",
    "Cálculo": {
      "Parametro": "Total_de_Depósitos_Faltantes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_8%_de_cada_mês_não_recolhido + Juros_e_Multa"
    },
    "Memoria_de_Calculo": "Base: Remuneração de cada mês não recolhido. Cálculo: Soma dos 8% de cada competência faltante, acrescida de juros e multa conforme legislação do FGTS.",
    "Legislação": "Lei 8.036/90",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Meses em que a empresa não recolheu o FGTS, ou todo o período em caso de **CTPS não assinada**.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Adicional_de_Periculosidade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base * 0.30"
    },
    "Memoria_de_Calculo": "Base: Salário Base (sem adicionais). Cálculo: Salário Base * 0.30 (30%). Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 193",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a risco (eletricidade, inflamáveis, explosivos).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_de_Insalubridade",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Mínimo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Mínimo * (0.10, 0.20 ou 0.40)"
    },
    "Memoria_de_Calculo": "Base: Salário Mínimo Vigente. Cálculo: Salário Mínimo * [Grau de Insalubridade (10%, 20% ou 40%)]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "CLT, Art. 192",
    "Exemplos_Aplicaveis": "Quando o empregado estava exposto a agentes nocivos à saúde em grau Mínimo, Médio ou Máximo.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_por_Tempo_de_Serviço_(Biênio, Triênio, Quinquênio)",
    "Cálculo": {
      "Parametro": "Anos_Completos_e_Percentual_Aplicável",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_sobre_Salário_Base * N_Períodos_Completos"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Período) * [Número de Períodos Completos]. Devido proporcionalmente ao saldo de salário.",
    "Legislação": "Convenção/Acordo_Coletivo_ou_Lei_Estadual/Municipal",
    "Exemplos_Aplicaveis": "Pagamento de percentual progressivo por tempo de serviço, conforme previsto em norma coletiva. (Inclui Biênio, Triênio, Quadriênio, etc.).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Saldo_Banco_de_Horas_Não_Compensado",
    "Cálculo": {
      "Parametro": "Total_Horas_Credoras_no_Banco",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Hora * Saldo_Banco_de_Horas"
    },
    "Memoria_de_Calculo": "Base: Valor da Hora Extra. Cálculo: [Valor da Hora Extra] multiplicado pelo Saldo de Horas Credoras (a favor do empregado).",
    "Legislação": "CLT, Art. 59, §3º",
    "Exemplos_Aplicaveis": "Horas positivas no banco de horas, pagas como extra na rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_FGTS_20_Por_Cento_(Acordo_Mútuo)",
    "Cálculo": {
      "Parametro": "Saldo_do_FGTS_na_Rescisão",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Saldo_FGTS * 0.20"
    },
    "Memoria_de_Calculo": "Base: Saldo total dos depósitos de FGTS na conta. Cálculo: Saldo de FGTS * 0.20 (20%). Aplicável apenas na rescisão por acordo mútuo.",
    "Legislação": "CLT, Art. 484-A",
    "Exemplos_Aplicaveis": "Rescisão por acordo entre empregado e empregador (demissão consensual).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Diárias_para_Viagem_Excedentes_a_50%",
    "Cálculo": {
      "Parametro": "Valor_Total_Diárias",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Diárias_que_excedem_50%_do_salário_mensal"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Valor das diárias de viagem que ultrapassam 50% do Salário Base. Este valor passa a ter natureza salarial.",
    "Legislação": "CLT, Art. 457, §2º",
    "Exemplos_Aplicaveis": "Diárias que, por seu valor excessivo, adquirem natureza salarial e devem integrar o cálculo rescisório.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Gorjetas_(Apuradas_e_Registradas)",
    "Cálculo": {
      "Parametro": "Média_das_Gorjetas_no_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Integram_a_base_de_cálculo_das_verbas_rescisórias"
    },
    "Memoria_de_Calculo": "Base: Média dos valores de gorjeta. Cálculo: Média do valor das gorjetas sobre o período de apuração. Este valor integra a base de cálculo.",
    "Legislação": "CLT, Art. 457, §3º",
    "Exemplos_Aplicaveis": "Gorjetas que integravam a remuneração média e precisam ser refletidas nas verbas rescisórias.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Adicional_Noturno_Devido",
    "Cálculo": {
      "Parametro": "Total_Adicional_Noturno_Pendentes",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_do_Adicional_Noturno_devido"
    },
    "Memoria_de_Calculo": "Base: Horas noturnas pendentes. Cálculo: Soma do valor do adicional noturno devido, calculado sobre as horas trabalhadas entre 22h e 5h.",
    "Legislação": "CLT, Art. 73",
    "Exemplos_Aplicaveis": "Horas trabalhadas no período noturno e não pagas.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Salário_Família_Proporcional",
    "Cálculo": {
      "Parametro": "Dias_Trabalhados_no_Mês",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Benefício / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor do Salário-Família. Cálculo: (Valor Benefício / 30) * [Dias Trabalhados no Mês da Rescisão].",
    "Legislação": "Lei 8.213/91",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês de rescisão.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Adicional_(Lei_6.708/79)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Dispensa_Próximo_Data_Base",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Geralmente_Equivalente_a_Um_Salário"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: Geralmente equivalente a 1 Salário Base. Aplicável se a dispensa sem justa causa ocorrer nos 30 dias que antecedem a data base.",
    "Legislação": "Lei 6.708/79 (Verificar CCT)",
    "Exemplos_Aplicaveis": "Dispensa nos 30 dias que antecedem a data base de correção salarial.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_Art_479_CLT_(Prazo_Determinado)",
    "Cálculo": {
      "Parametro": "Dias_Faltantes_para_Fim_do_Contrato",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Metade_da_Remuneração_a_que_teria_direito"
    },
    "Memoria_de_Calculo": "Base: Remuneração restante até o fim do contrato. Cálculo: Metade da remuneração que o empregado teria direito até o fim do contrato por prazo determinado.",
    "Legislação": "CLT, Art. 479",
    "Exemplos_Aplicaveis": "Contrato por prazo determinado (ex: experiência) rescindido antecipadamente e sem justa causa pelo empregador.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Indenização_por_Dispensa_Indireta",
    "Cálculo": {
      "Parametro": "Decisão_Judicial_ou_Acordo",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Definido_em_Sentença_ou_Acordo"
    },
    "Memoria_de_Calculo": "Base: Remuneração Devida. Cálculo: Conforme decisão judicial ou acordo. Verbas equivalentes à demissão sem justa causa.",
    "Legislação": "CLT, Art. 483",
    "Exemplos_Aplicaveis": "Empregado demite o empregador por falta grave (resulta em verbas de demissão sem justa causa).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Multa_Art_477_CLT_(Atraso_na_Quitação)",
    "Cálculo": {
      "Parametro": "Aplicável_se_Pagamento_Atrasado",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Salário_Base"
    },
    "Memoria_de_Calculo": "Base: Salário Base Mensal. Cálculo: Salário Base Integral. Aplicável se as verbas rescisórias não forem pagas no prazo legal (10 dias após o término do contrato).",
    "Legislação": "CLT, Art. 477, §8º",
    "Exemplos_Aplicaveis": "**Verba de Irregularidade** - Atraso no pagamento da rescisão.",
    "Natureza_da_Verba": "Irregularidade_Contratual"
  },
  {
    "Provento": "Quebra_de_Caixa_Devida",
    "Cálculo": {
      "Parametro": "Valor_mensal_conforme_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "(Valor_Mensal_CCT / 30) * Dias_Trabalhados"
    },
    "Memoria_de_Calculo": "Base: Valor estabelecido em norma coletiva ou contrato. Cálculo: Pagamento proporcional ao Saldo de Salário, caso o empregado tenha exercido a função no mês da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Contrato",
    "Exemplos_Aplicaveis": "Pagamento proporcional no mês da rescisão para empregados que lidam com numerário e têm a verba prevista em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Alimentação_ou_Refeição_Devido",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Soma_dos_valores_pendentes_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor do benefício estabelecido em norma coletiva. Cálculo: Pagamento dos valores de Auxílio Alimentação/Refeição devidos no mês da rescisão e não fornecidos/pagos. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou Lei 6.321/76",
    "Exemplos_Aplicaveis": "Valores pendentes de pagamento ou fornecimento no período trabalhado do mês da rescisão. Geralmente verba indenizatória.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Creche_ou_Babá_Indenizado",
    "Cálculo": {
      "Parametro": "Valores_pendentes_não_compensados_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_mensal_ou_proporcional_conforme_CCT"
    },
    "Memoria_de_Calculo": "Base: Valor e critérios estabelecidos em norma coletiva. Cálculo: Valores devidos e não pagos/indenizados até a data da rescisão. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT) ou CLT, Art. 389, §1º",
    "Exemplos_Aplicaveis": "Pagamento de valores devidos conforme as regras da CCT ou acordo (geralmente com natureza indenizatória).",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Auxílio_Funeral_Devido",
    "Cálculo": {
      "Parametro": "Valor_total_da_indenização_CCT",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Valor_Fixo_Definido_na_CCT_em_caso_de_óbito"
    },
    "Memoria_de_Calculo": "Base: Valor fixo ou critérios definidos em norma coletiva. Cálculo: Indenização devida aos dependentes em caso de óbito do empregado, conforme as regras da CCT. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Indenização paga aos dependentes em caso de falecimento do empregado.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Biênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Biênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Biênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Biênio) * [Número de Biênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 2 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Triênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Triênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Triênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Triênio) * [Número de Triênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 3 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  },
  {
    "Provento": "Quadriênio_(Adicional_por_Tempo_de_Serviço)",
    "Cálculo": {
      "Parametro": "Percentual_sobre_Salário_Base_por_Quadriênio",
      "Valor": 0.00,
      "Fórmula_Sugerida": "Percentual_CCT * N_Quadriênios"
    },
    "Memoria_de_Calculo": "Base: Salário Base. Cálculo: (Percentual por Quadriênio) * [Número de Quadriênios Completos]. Devido proporcionalmente no Saldo de Salário e integrando a Remuneração Média. **OBSERVAR NORMA DO SINDICATO/CCT**.",
    "Legislação": "Norma Coletiva (CCT/ACT)",
    "Exemplos_Aplicaveis": "Pagamento de adicional por cada período de 4 anos completos de serviço, se previsto em CCT.",
    "Natureza_da_Verba": "Normal"
  }
]`,
  instrucoes_entrada_dados_rescisao: `Estruture sempre em um formato .json válido som somente as contas que tiverem saldo maior que zero .
 O Agente deve incorporar esta hierarquia de leis ao justificar os campos Legislação e Memoria_de_Calculo no JSON de saída.
 Em Memoria_de_Calculo de Proventos e Descontos, Parametro e Fórmula_Sugerida,  estou lhe passando o exemplo do cálculo que demonstre como o calculo foi feito coloque  realmente a memória de cálculo.
Sempre Calcular o FGTS não recolhido caso o trabalhado não tenha a CTPS assinada (null)
Sempre Calcular a Multa de 40% do FGTS não recolhido caso o trabalhado não tenha a CTPS assinada (null)
Sempre usar a Base_de_Cálculo_Rescisória para realizar os calculos das verbas rescisorias onbservando a legislação.
Sempre mostre ( dias de trabalho , dias de tralho ultimo mes, dia de trabalho por tempo de serviço)
"ctpsAssinada": "true", ( informa que o trabalhador está de CTPS Assinada)
"ctpsAssinada": "null", ( informa que o trabalhador não está de CTPS Assinada)
Sempre usar o valor do salario profissional do sindicato para informar o Salário Praticado pelo Sindicato , mesmo que o usuario informe no campo Piso Salarial Sindicato (R$) , você sempre vai optar pelo que foi informado no campo <sindicato>
Usar sempre o valor do salario mínimo vigente legal do pais no momento do calculo para usar como base para calculo do inss ou salario paga a maior para o trabalhador para calculo do inss com referencia do salario mínimo do ano de 2025 no valor de R$1.518,00 reais
As alíquotas são de 7,5% para aqueles que ganham até R$ 1.518,00; de 9% para quem ganha entre R$ 1.518,01 até R$ 2.793,88; de 12% para os que ganham entre R$ 2.793,89 até R$ 4.190,83; e de 14% para quem ganha de R$ 4.190,84 até R$ 8.157,41.`
};

const AiPromptTemplateFormPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<AiPromptTemplateState>({
    title: '',
    identificacao: '',
    comportamento: '',
    restricoes: '',
    atribuicoes: '',
    leis: '',
    proventos: '',
    descontos: '',
    observacoes_base_legal: '',
    estrutura_json_modelo_saida: '',
    instrucoes_entrada_dados_rescisao: '',
  });
  const [loading, setLoading] = useState(false);
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing && user) {
      fetchTemplate();
    }
  }, [id, isEditing, user]);

  const fetchTemplate = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tbl_ai_prompt_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (error) {
      showError('Erro ao carregar modelo de prompt: ' + error.message);
      console.error('Error fetching AI prompt template:', error);
      navigate('/ai-templates');
    } else if (data) {
      setTemplate(data);
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTemplate((prev) => ({ ...prev, [name]: value }));
  };

  const handleFillWithTemplate = () => {
    setTemplate((prev) => ({
      ...prev,
      ...modelTemplate,
    }));
    showSuccess('Campos preenchidos com o modelo padrão!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showError('Usuário não autenticado.');
      return;
    }
    setLoading(true);

    const templateData = {
      ...template,
      user_id: user.id,
    };

    let response;
    if (isEditing) {
      response = await supabase
        .from('tbl_ai_prompt_templates')
        .update(templateData)
        .eq('id', id)
        .eq('user_id', user.id);
    } else {
      response = await supabase
        .from('tbl_ai_prompt_templates')
        .insert(templateData);
    }

    if (response.error) {
      showError('Erro ao salvar modelo de prompt: ' + response.error.message);
      console.error('Error saving AI prompt template:', response.error);
    } else {
      showSuccess(`Modelo de prompt ${isEditing ? 'atualizado' : 'criado'} com sucesso!`);
      navigate('/ai-templates');
    }
    setLoading(false);
  };

  if (loading && isEditing) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 text-center text-gray-400">Carregando modelo de prompt...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-auto px-1 sm:px-1 lg:px-3 min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/ai-templates')} className="text-orange-500 hover:text-orange-600 mb-4 sm:mb-0 sm:w-auto">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-orange-500 flex-grow text-center sm:text-center">
            {isEditing ? 'Editar Modelo de Prompt da IA' : 'Configurações de Prompt da IA'}
          </h1>
          <div className="w-full sm:w-24 h-0 sm:h-auto"></div> {/* Placeholder for alignment */}
        </div>
        <Card className="w-full sm:max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Configuração</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isEditing && ( // Mostrar o botão apenas ao criar um novo modelo
                <Button
                  type="button"
                  onClick={handleFillWithTemplate}
                  disabled={loading}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white mb-6"
                >
                  <Brain className="mr-2 h-4 w-4" /> Modelo Padrão
                </Button>
              )}
              <div>
                <Label htmlFor="title" className="text-gray-300">Título do Modelo</Label>
                <Input
                  id="title"
                  name="title"
                  value={template.title}
                  onChange={handleChange}
                  required
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="identificacao" className="text-gray-300">Identificação</Label>
                <Textarea
                  id="identificacao"
                  name="identificacao"
                  value={template.identificacao || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="comportamento" className="text-gray-300">Comportamento</Label>
                <Textarea
                  id="comportamento"
                  name="comportamento"
                  value={template.comportamento || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="restricoes" className="text-gray-300">Restrições</Label>
                <Textarea
                  id="restricoes"
                  name="restricoes"
                  value={template.restricoes || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="atribuicoes" className="text-gray-300">Atribuições</Label>
                <Textarea
                  id="atribuicoes"
                  name="atribuicoes"
                  value={template.atribuicoes || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="leis" className="text-gray-300">Leis</Label>
                <Textarea
                  id="leis"
                  name="leis"
                  value={template.leis || ''}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="proventos" className="text-gray-300">Proventos</Label>
                <Textarea
                  id="proventos"
                  name="proventos"
                  value={template.proventos || ''}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="descontos" className="text-gray-300">Descontos</Label>
                <Textarea
                  id="descontos"
                  name="descontos"
                  value={template.descontos || ''}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="observacoes_base_legal" className="text-gray-300">Observações e Base Legal</Label>
                <Textarea
                  id="observacoes_base_legal"
                  name="observacoes_base_legal"
                  value={template.observacoes_base_legal || ''}
                  onChange={handleChange}
                  rows={5}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <h3 className="text-xl font-semibold text-orange-400 mt-8 mb-4">Campos de Saída e Entrada (DB)</h3>
              <div>
                <Label htmlFor="estrutura_json_modelo_saida" className="text-gray-300">Estrutura JSON Modelo Saída</Label>
                <Textarea
                  id="estrutura_json_modelo_saida"
                  name="estrutura_json_modelo_saida"
                  value={template.estrutura_json_modelo_saida || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="instrucoes_entrada_dados_rescisao" className="text-gray-300">Instruções Entrada Dados Rescisão</Label>
                <Textarea
                  id="instrucoes_entrada_dados_rescisao"
                  name="instrucoes_entrada_dados_rescisao"
                  value={template.instrucoes_entrada_dados_rescisao || ''}
                  onChange={handleChange}
                  rows={3}
                  className="bg-gray-800 border-gray-700 text-white focus:border-orange-500"
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                {loading ? 'Salvando...' : (isEditing ? 'Atualizar Modelo' : 'Criar Modelo')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AiPromptTemplateFormPage;