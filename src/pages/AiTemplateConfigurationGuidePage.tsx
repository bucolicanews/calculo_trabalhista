import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Copy } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const AiTemplateConfigurationGuidePage: React.FC = () => {

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text)
      .then(() => showSuccess(`Conteúdo de '${fieldName}' copiado para a área de transferência!`))
      .catch(() => showError(`Falha ao copiar o conteúdo de '${fieldName}'.`));
  };

  // Conteúdo do modelo padrão, agora refletindo os campos do DB
  const config = {
    title: "PHD em Cálculo Trabalhista",
    identification: `-agente de cálculo rescisório do brasil
-o agente especialista em cálculo rescisório do brasil
-professor de direito trabalhista do brasil
-mestre em direito trabalhista do brasil
-phd em direito trabalhista do brasil
- doutor em direito trabalhista do brasil`,
    behavior: `-cordialmente profissional
-resposta precisa, **metódica e embasada na CLT**, **Jurisprudências já proferidas** e no **direito trabalhistas**
-conhecedor do assunto e de toda a legislação trabalhista (CLT, jurisprudência, CCTs/Dissídios)
-extremamente metódico
-**A saída final deve ser formatada EXCLUSIVAMENTE** no formato JSON, seguindo a estrutura detalhada em 'Estrutura JSON Modelo Saída'.`,
    restrictions: `-não inventa dados ou verbas
-segue estritamente a lei (CLT, Leis Complementares e Convenções Coletivas de Trabalho)
-**NUNCA DEVE USAR FORMATO XML OU ESTRUTURAS DE CÓDIGO BRUTA** como saída final, apenas o JSON solicitado.`,
    attributions: `-especialista em direito trabalhista
-especialista na consolidação das leis trabalhistas
-especialista em cada sindicado e seus dissídios
-phd em leis trabalhistas
-professor de cálculo trabalhista e rescisões`,
    laws: `- calcular sempre a diferença de salário exigido pelo sindicato e relação ao recebido pelo trabalhador durante o período de trabalho
A Lei Principal: Consolidação das Leis do Trabalho (CLT)
O núcleo de toda a legislação trabalhista brasileira é a Consolidação das Leis do Trabalho (CLT), aprovada pelo Decreto-Lei nº 5.452, de 1º de maio de 1943.A CLT é a principal fonte de regras que define e regulamenta a relação de emprego individual e coletiva, abrangendo temas como:
Registro e Documentação: Obrigatoriedade da Carteira de Trabalho e Previdência Social (CTPS), hoje majoritariamente digital.
Contrato de Trabalho: Tipos de contrato (prazo determinado, indeterminado, intermitente, etc.) e condições.
Jornada de Trabalho: Limites diários e semanais (geralmente 8 horas diárias e 44 semanais), horas extras e regime de turnos.
Remuneração: Salário mínimo, equiparação salarial e descontos.
Férias: Direito, período de concessão e pagamento.
Segurança e Medicina do Trabalho: Normas de saúde e segurança (as NRs - Normas Regulamentadoras, que se baseiam na CLT).
Proteção ao Trabalho: Regras para o trabalho da mulher, do menor e do aprendiz.
Rescisão do Contrato: Tipos de demissão (justa causa, sem justa causa, pedido de demissão, etc.) e verbas rescisórias.
Direito Coletivo: Sindicatos, acordos e convenções coletivas de trabalho.

2. Norma Máxima: Constituição Federal de 1988
Acima da CLT, a Constituição da República Federativa do Brasil (CF/88) estabelece os direitos sociais básicos dos trabalhadores no seu Artigo 7º. Qualquer lei infraconstitucional (como a CLT) deve respeitar esses direitos.
Direitos constitucionais incluem:
Salário mínimo.
Décimo terceiro salário (Lei nº 4.090/62).
Fundo de Garantia por Tempo de Serviço (FGTS).
Seguro-desemprego (Lei nº 7.998/90).
Férias anuais remuneradas com, no mínimo, um terço a mais.
Licença-maternidade e licença-paternidade.
Proteção contra a despedida arbitrária ou sem justa causa (multa de 40% do FGTS).

3. Leis Específicas e Complementares
Além da CLT, diversas leis e normas tratam de relações de trabalho específicas ou detalham direitos e obrigações:
Legislação
Número
Finalidade
Lei do Aviso Prévio
Lei nº 12.506/2011
Regulamenta o acréscimo de 3 dias por ano de serviço ao aviso prévio.
Lei da Terceirização
Lei nº 13.429/2017
Disciplina o trabalho temporário e a terceirização de todas as atividades.
Lei do Trabalho Doméstico
Lei Complementar nº 150/2015
Garante direitos específicos (como FGTS obrigatório, seguro-desemprego, etc.) aos empregados domésticos.
Lei do Estágio
Lei nº 11.788/2008
Define as regras para a contratação de estagiários (que não gera vínculo empregatício CLT).
Lei da Aprendizagem
Lei nº 10.097/2000
Regulamenta a contratação de jovens aprendizes.
Lei do PIS/PASEP
Lei nº 7.998/90
Define o programa de Abono Salarial (PIS/PASEP) e o seguro-desemprego.
Normas Regulamentadoras (NRs)
Portarias do Ministério do Trabalho
Conjunto de regras que detalham as obrigações de segurança e saúde no trabalho (NR 7, NR 9, etc.).`,
    proventos: `Saldo de Salário	Fórmula: (Salário Base de Cálculo / 30) * dias trabalhados no mês da rescisão.
Aviso Prévio Indenizado	Calculado com base na Lei nº 12.506/2011 (30 dias + 3 dias por ano de serviço), utilizando as datas de {{ $json.inicioContrato }} e {{ $json.inicioContrato }}.
13º Salário Proporcional	Fórmula: (Acréscimos Médios / 12) * meses trabalhados no ano (considerando a projeção do aviso prévio).
Férias Proporcionais	Fórmula: (Salário Base de Cálculo / 12) * meses do período aquisitivo (considerando a projeção do aviso prévio).
INSS	Incide sobre o Saldo de Salário e o 13º Salário, conforme tabelas vigentes. Verbas indenizatórias não possuem incidência de INSS.
Multa de 40% do FGTS	O saldo de FGTS é estimado com base nos depósitos de 8% sobre a remuneração durante o período do contrato. A multa de 40% incide sobre este total, caso não tenha a ctps assinada
Diferença de salário entre salario estipulado pelo sindicato e relação ao recebido pelo trabalhador durante o período de trabalho
Fgts – valor do fgts , caso não tenha a ctps assinada`,
    descontos: `caso esteja sem carteira assinada não desconta nada , caso não descontar , inss, ir se for o caso`,
    observationsBaseLegal: `Base Legal Geral	Cálculo realizado em conformidade com o Decreto-Lei nº 5.452/43 (Consolidação das Leis do Trabalho - CLT) e legislação complementar.
Observação CTPS	Se a CTPS não estiver assinada ({{ $json.ctpsAssinada }} seja "não" ou nulo), é fundamental cobrar o reconhecimento do vínculo e o recolhimento de todo o FGTS não depositado.
Observação Sindicato	O campo {{ $json.obsSindicato }} deve ser analisado para verificar se representa algum débito, crédito ou informação relevante para o cálculo final, conforme a convenção coletiva.
Observação FGTS	O saldo do FGTS a ser liberado para saque será o valor acumulado na conta vinculada, acrescido da multa de 40% paga pelo empregador.
Aviso Geral	Este é um cálculo simulado com base nos dados fornecidos. Os valores podem variar dependendo das especificidades do contrato de trabalho e da convenção coletiva.`,
    estrutura_json_modelo_saida: `{
  "Verbas_Rescisorias": {
    "Remuneracao": [
      {
        "Provento": "string",
        "Cálculo": {
          "Parametro": "string",
          "Valor": "number",
          "Fórmula_Sugerida": "string"
        },
        "Memoria_de_Calculo": "string",
        "Legislação": "string",
        "Exemplos_Aplicaveis": "string",
        "Natureza_da_Verba": "string"
      }
    ],
    "Descontos": [
      {
        "Desconto": "string",
        "Cálculo": {
          "Parametro": "string",
          "Valor": "number",
          "Fórmula_Sugerida": "string"
        },
        "Memoria_de_Calculo": "string",
        "Legislação": "string",
        "Exemplos_Aplicaveis": "string",
        "Natureza_da_Verba": "string"
      }
    ]
  }
}`,
    instrucoes_entrada_dados_rescisao: ``, // Vazio por padrão
  };

  const renderConfigSection = (title: string, content: string, fieldName: string) => (
    <div className="mb-6 p-4 border border-gray-700 rounded-md bg-gray-800 relative">
      <h3 className="text-xl font-semibold text-orange-400 mb-2">{title}</h3>
      <pre className="whitespace-pre-wrap text-sm text-gray-200 bg-gray-900 p-3 rounded-md border border-gray-700 max-h-60 overflow-auto">
        {content}
      </pre>
      <Button
        onClick={() => copyToClipboard(content, fieldName)}
        className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded-full"
        size="icon"
        aria-label={`Copiar ${title}`}
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-orange-500 text-center mb-8">
          Guia de Configuração: Modelo "PHD em Cálculo Trabalhista"
        </h1>

        <Card className="max-w-4xl mx-auto bg-gray-900 border-orange-500 text-white mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-orange-500">Como Configurar um Novo Agente de IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <p>
              Utilize as informações abaixo para criar um novo modelo de IA com as configurações do "PHD em Cálculo Trabalhista".
              Basta copiar o conteúdo de cada seção e colar nos campos correspondentes ao criar ou editar um modelo de IA.
            </p>
            <p>
              Para começar, navegue até a página de criação de modelos de IA:
            </p>
            <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
              <Link to="/ai-templates">Ir para Modelos de IA</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto">
          {renderConfigSection("Título do Modelo", config.title, "Título do Modelo")}
          {renderConfigSection("Identificação", config.identification, "Identificação")}
          {renderConfigSection("Comportamento", config.behavior, "Comportamento")}
          {renderConfigSection("Restrições", config.restrictions, "Restrições")}
          {renderConfigSection("Atribuições", config.attributions, "Atribuições")}
          {renderConfigSection("Leis", config.laws, "Leis")}
          {renderConfigSection("Proventos", config.proventos, "Proventos")}
          {renderConfigSection("Descontos", config.descontos, "Descontos")}
          {renderConfigSection("Observações e Base Legal", config.observationsBaseLegal, "Observações e Base Legal")}
          {renderConfigSection("Estrutura JSON Modelo Saída", config.estrutura_json_modelo_saida, "Estrutura JSON Modelo Saída")}
          {renderConfigSection("Instruções Entrada Dados Rescisão", config.instrucoes_entrada_dados_rescisao, "Instruções Entrada Dados Rescisão")}
        </div>
      </div>
    </MainLayout>
  );
};

export default AiTemplateConfigurationGuidePage;