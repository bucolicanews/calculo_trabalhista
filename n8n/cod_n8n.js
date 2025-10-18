// Nó: Code in JavaScript (n8n)

// 1. Obter os dados de entrada
const idCalculo = $json.IdCalculo; // Variável de entrada do ID do Cálculo
const aiResponseString = $("AI Agent").item.json.output; // Resposta JSON bruta da IA

let parsedJson;

try {
  // --- ETAPA 1: EXTRAÇÃO E LIMPEZA DO BLOCO JSON ---
  const firstBracket = aiResponseString.indexOf("{");
  const lastBracket = aiResponseString.lastIndexOf("}");

  if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
    throw new Error(
      "Não foi possível encontrar um objeto JSON válido (chaves '{' e '}') na resposta da IA."
    );
  }

  let jsonString = aiResponseString.substring(firstBracket, lastBracket + 1);

  // Remove quebras de linha para evitar erros de 'bad control character'
  jsonString = jsonString.replace(/(\r\n|\n|\r)/gm, "");

  // PARSE DO JSON LIMPO
  parsedJson = JSON.parse(jsonString);
} catch (e) {
  // Retorna o erro em caso de falha de extração ou parsing
  console.error("Falha ao extrair ou fazer o parse do JSON. Erro:", e.message);
  return [
    {
      json: {
        calculationId: idCalculo,
        error: "JSON_EXTRACTION_OR_PARSE_FAILED",
        details: e.message,
        original_string_snippet: aiResponseString.substring(0, 300) + "..."
      }
    }
  ];
}

// --- ETAPA 2: NORMALIZAÇÃO E CONSOLIDAÇÃO DA ESTRUTURA ---
if (parsedJson && parsedJson.Verbas_Rescisorias) {
  const verbasRescisorias = parsedJson.Verbas_Rescisorias;
  const allProventos = [];
  const allDescontos = [];

  // Itera sobre todas as chaves de categoria na estrutura INCORRETA (Verbas_Aviso_Previo, etc.)
  for (const key in verbasRescisorias) {
    if (Array.isArray(verbasRescisorias[key])) {
      verbasRescisorias[key].forEach((item) => {
        // Checa se é um item válido com valor de cálculo
        if (item.Cálculo && typeof item.Cálculo.Valor === "number") {
          // --- ETAPA 3: FILTRAGEM (Remove itens com Valor: 0) ---
          // IMPORTANTE: Algumas verbas de cálculo (como Base_de_Cálculo_Rescisória)
          // podem ter Natureza_da_Verba: "Informativa" e precisam ser mantidas mesmo com valor zero.
          const isInformative = item.Natureza_da_Verba === "Informativa";

          if (item.Cálculo.Valor > 0 || isInformative) {
            // Classifica como PROVENTO (se tiver 'Provento') ou DESCONTO (se tiver 'Desconto')
            if (item.Provento) {
              allProventos.push(item);
            } else if (item.Desconto) {
              allDescontos.push(item);
            }
          }
        }
      });
    }
  }

  // --- ETAPA 4: RECONSTRUÇÃO DA ESTRUTURA FINAL NA ORDEM CORRETA (Descontos -> Remuneracao) ---
  const finalVerbasRescisorias = {};

  // 1. Adiciona a lista de DESCONTOS na chave 'Descontos' (Prioridade 1)
  if (allDescontos.length > 0) {
    // Normaliza a chave do Desconto, se necessário (geralmente não precisa, mas mantido por segurança)
    const normalizedDescontos = allDescontos.map((item) => {
      // Apenas garante que a estrutura de descontos seja padronizada se o item vier de Descontos_Autorizados_ou_Indenizacao_do_Empregado
      if (item.Desconto && !item.Provento) {
        return {
          Cálculo: item.Cálculo,
          Desconto: item.Desconto,
          Legislação: item.Legislação,
          Natureza_da_Verba: item.Natureza_da_Verba,
          Memoria_de_Calculo: item.Memoria_de_Calculo,
          Exemplos_Aplicaveis: item.Exemplos_Aplicaveis
        };
      }
      return item;
    });

    finalVerbasRescisorias.Descontos = normalizedDescontos;
  }

  // 2. Adiciona a lista de PROVENTOS na chave 'Remuneracao' (Prioridade 2)
  if (allProventos.length > 0) {
    finalVerbasRescisorias.Remuneracao = allProventos;
  }

  // Atualiza o JSON principal com a estrutura normalizada e ordenada
  parsedJson.Verbas_Rescisorias = finalVerbasRescisorias;
}

// --- ETAPA 5: CONSTRUÇÃO DO PAYLOAD FINAL ---
const finalPayload = {
  calculationId: idCalculo,
  aiResponse: parsedJson // Objeto JSON normalizado e filtrado
};

// Retorna o payload final e correto.
return [{ json: finalPayload }];
