// @ts-nocheck
// deno-lint-ignore-file
// @ts-ignore
/// <reference lib="deno.ns" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2.45.0" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { format, getDate } from 'https://esm.sh/date-fns@3.6.0';
import { ptBR } from 'https://esm.sh/date-fns@3.6.0/locale';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função auxiliar para parsear datas de forma segura
const parseDateSafely = (dateString: string): Date | null => {
  if (!dateString) return null;

  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 1 && month <= 12) {
        const date = new Date(year, month - 1, day, 12, 0, 0);
        if (date.getFullYear() === year && date.getMonth() === month - 1) {
          return date;
        }
      }
    }
  }

  if (dateString.includes('-')) {
    const date = new Date(dateString + 'T12:00:00');
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  return null;
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calculoId } = await req.json();

    if (!calculoId) {
      return new Response(JSON.stringify({ error: 'Missing calculoId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: calculation, error: fetchError } = await supabaseClient
      .from('tbl_calculos')
      .select(`
        *, resposta_ai, tbl_clientes(nome), tbl_sindicatos(nome),
        tbl_ai_prompt_templates(title, estrutura_json_modelo_saida, instrucoes_entrada_dados_rescisao),
        tbl_resposta_calculo(url_documento_calculo, texto_extraido, data_hora),
        tbl_proventos(*), tbl_descontos(*)
      `)
      .eq('id', calculoId)
      .single();

    if (fetchError || !calculation) {
      console.error('Error fetching calculation for PDF:', fetchError);
      return new Response(JSON.stringify({ error: 'Calculation not found or error fetching data', details: fetchError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // --- Extração e formatação de dados ---
    const inicio = parseDateSafely(calculation.inicio_contrato);
    const fim = parseDateSafely(calculation.fim_contrato);

    let diasTrabalhadosNoVinculo = 0;
    let anosCompletos = 0;
    let diaDoMesDaRescisao = 0;

    if (inicio && fim) {
      const diffTime = Math.abs(fim.getTime() - inicio.getTime());
      diasTrabalhadosNoVinculo = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      anosCompletos = Math.floor(diasTrabalhadosNoVinculo / 365);
      diaDoMesDaRescisao = getDate(fim);
    }

    const formatDisplayDate = (date: Date | null) =>
      date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'Data Inválida';

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const totalProventos = (calculation.tbl_proventos || []).reduce((sum, p) => sum + p.valor_calculado, 0);
    const totalDescontos = (calculation.tbl_descontos || []).reduce((sum, d) => sum + d.valor_calculado, 0);
    const valorLiquido = totalProventos - totalDescontos;

    const allLegislations = new Set<string>();
    (calculation.tbl_proventos || []).forEach(p => {
      if (p.legislacao) allLegislations.add(p.legislacao);
    });
    (calculation.tbl_descontos || []).forEach(d => {
      if (d.legislacao) allLegislations.add(d.legislacao);
    });
    const uniqueLegislations = Array.from(allLegislations);

    // --- Geração do HTML ---
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Demonstrativo de Rescisão - ${calculation.nome_funcionario}</title>
          <style>
              body { font-family: 'Arial', sans-serif; margin: 20px; color: #333; background-color: #f4f4f4; }
              .container { max-width: 800px; margin: 0 auto; background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              h1, h2, h3, h4 { color: #FF4500; }
              h1 { text-align: center; margin-bottom: 20px; }
              .section-title { border-bottom: 2px solid #FF4500; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; font-size: 1.5em; }
              .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
              .detail-grid p { margin: 0; padding: 5px 0; }
              .detail-grid strong { color: #555; }
              .table-container { margin-top: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; color: #FF4500; }
              .total-row { font-weight: bold; background-color: #ffe0b2; }
              .total-proventos { color: #28a745; }
              .total-descontos { color: #dc3545; }
              .valor-liquido { text-align: center; margin-top: 30px; padding: 15px; background-color: #e0ffe0; border: 1px solid #28a745; border-radius: 5px; }
              .valor-liquido h5 { margin: 0 0 10px 0; color: #28a745; }
              .valor-liquido p { margin: 0; font-size: 1.8em; font-weight: bold; color: #28a745; }
              .base-legal ul { list-style-type: disc; margin-left: 20px; }
              .base-legal li { margin-bottom: 5px; }
              .ai-response pre { background-color: #eee; padding: 15px; border-radius: 5px; white-space: pre-wrap; word-break: break-word; }
              .item-details { background-color: #f9f9f9; border-top: 1px dashed #ccc; padding: 10px; margin-top: 5px; font-size: 0.9em; }
              .item-details strong { color: #666; }
              .item-details p { margin: 3px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>Demonstrativo de Rescisão</h1>
              <p style="text-align: center; color: #666;">Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>

              <h2 class="section-title">Detalhes do Cálculo</h2>
              <div class="detail-grid">
                  <p><strong>Funcionário:</strong> ${calculation.nome_funcionario}</p>
                  <p><strong>Cliente:</strong> ${calculation.tbl_clientes?.nome || 'N/A'}</p>
                  <p><strong>Sindicato:</strong> ${calculation.tbl_sindicatos?.nome || 'N/A'}</p>
                  ${calculation.tbl_ai_prompt_templates?.title ? `<p><strong>Modelo IA:</strong> ${calculation.tbl_ai_prompt_templates.title}</p>` : ''}
                  <p><strong>Início Contrato:</strong> ${formatDisplayDate(inicio)}</p>
                  <p><strong>Fim Contrato:</strong> ${formatDisplayDate(fim)}</p>
                  <p><strong>Dias Trabalhados no Vínculo:</strong> ${diasTrabalhadosNoVinculo} dias (${anosCompletos} anos completos)</p>
                  <p><strong>Dias Trabalhados no Mês da Rescisão:</strong> ${diaDoMesDaRescisao} dias</p>
                  <p><strong>Salário Base Contratual:</strong> ${formatCurrency(calculation.salario_trabalhador)}</p>
                  ${calculation.media_remuneracoes > 0 ? `<p><strong>Média Remunerações Variáveis:</strong> ${formatCurrency(calculation.media_remuneracoes)}</p>` : ''}
                  <p><strong>Tipo de Rescisão:</strong> ${calculation.tipo_aviso.replace(/_/g, ' ')}</p>
                  <p><strong>CTPS Assinada:</strong> ${calculation.ctps_assinada ? 'Sim' : 'Não'}</p>
                  ${calculation.cpf_funcionario ? `<p><strong>CPF Funcionário:</strong> ${calculation.cpf_funcionario}</p>` : ''}
                  ${calculation.funcao_funcionario ? `<p><strong>Função:</strong> ${calculation.funcao_funcionario}</p>` : ''}
                  ${calculation.salario_sindicato > 0 ? `<p><strong>Piso Salarial Sindicato:</strong> ${formatCurrency(calculation.salario_sindicato)}</p>` : ''}
                  ${calculation.media_descontos > 0 ? `<p><strong>Média Descontos Informados:</strong> ${formatCurrency(calculation.media_descontos)}</p>` : ''}
                  ${calculation.carga_horaria ? `<p><strong>Carga Horária:</strong> ${calculation.carga_horaria}</p>` : ''}
                  ${calculation.obs_sindicato ? `<p class="col-span-2"><strong>Obs. Sindicato:</strong> ${calculation.obs_sindicato}</p>` : ''}
                  ${calculation.historia ? `<p class="col-span-2"><strong>Histórico:</strong> ${calculation.historia}</p>` : ''}
              </div>

              ${(calculation.tbl_proventos && calculation.tbl_proventos.length > 0) ? `
              <h2 class="section-title">Proventos</h2>
              <div class="table-container">
                  <table>
                      <thead>
                          <tr>
                              <th>Verba</th>
                              <th>Natureza</th>
                              <th style="text-align: right;">Valor</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${(calculation.tbl_proventos || []).map(p => `
                              <tr>
                                  <td>${p.nome_provento.replace(/_/g, ' ')}
                                      <div class="item-details">
                                          ${p.memoria_calculo ? `<p><strong>Memória de Cálculo:</strong> ${p.memoria_calculo}</p>` : ''}
                                          ${p.formula_sugerida ? `<p><strong>Fórmula Sugerida:</strong> ${p.formula_sugerida.replace(/_/g, ' ')}</p>` : ''}
                                          ${p.parametro_calculo ? `<p><strong>Parâmetro de Cálculo:</strong> ${p.parametro_calculo.replace(/_/g, ' ')}</p>` : ''}
                                          ${p.exemplo_aplicavel ? `<p><strong>Exemplo Aplicável:</strong> ${p.exemplo_aplicavel}</p>` : ''}
                                          ${p.legislacao ? `<p><strong>Legislação Específica:</strong> ${p.legislacao}</p>` : ''}
                                      </div>
                                  </td>
                                  <td>${p.natureza_da_verba.replace(/_/g, ' ')}</td>
                                  <td style="text-align: right;" class="total-proventos">${formatCurrency(p.valor_calculado)}</td>
                              </tr>
                          `).join('')}
                          <tr class="total-row">
                              <td colspan="2">Total Proventos</td>
                              <td style="text-align: right;" class="total-proventos">${formatCurrency(totalProventos)}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
              ` : ''}

              ${(calculation.tbl_descontos && calculation.tbl_descontos.length > 0) ? `
              <h2 class="section-title">Descontos</h2>
              <div class="table-container">
                  <table>
                      <thead>
                          <tr>
                              <th>Verba</th>
                              <th>Natureza</th>
                              <th style="text-align: right;">Valor</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${(calculation.tbl_descontos || []).map(d => `
                              <tr>
                                  <td>${d.nome_desconto.replace(/_/g, ' ')}
                                      <div class="item-details">
                                          ${d.memoria_calculo ? `<p><strong>Memória de Cálculo:</strong> ${d.memoria_calculo}</p>` : ''}
                                          ${d.formula_sugerida ? `<p><strong>Fórmula Sugerida:</strong> ${d.formula_sugerida.replace(/_/g, ' ')}</p>` : ''}
                                          ${d.parametro_calculo ? `<p><strong>Parâmetro de Cálculo:</strong> ${d.parametro_calculo.replace(/_/g, ' ')}</p>` : ''}
                                          ${d.exemplo_aplicavel ? `<p><strong>Exemplo Aplicável:</strong> ${d.exemplo_aplicavel}</p>` : ''}
                                          ${d.legislacao ? `<p><strong>Legislação Específica:</strong> ${d.legislacao}</p>` : ''}
                                      </div>
                                  </td>
                                  <td>${d.natureza_da_verba.replace(/_/g, ' ')}</td>
                                  <td style="text-align: right;" class="total-descontos">-${formatCurrency(d.valor_calculado)}</td>
                              </tr>
                          `).join('')}
                          <tr class="total-row">
                              <td colspan="2">Total Descontos</td>
                              <td style="text-align: right;" class="total-descontos">-${formatCurrency(totalDescontos)}</td>
                          </tr>
                      </tbody>
                  </table>
              </div>
              ` : ''}

              ${((calculation.tbl_proventos && calculation.tbl_proventos.length > 0) || (calculation.tbl_descontos && calculation.tbl_descontos.length > 0)) ? `
              <div class="valor-liquido">
                  <h5>Valor Líquido a Receber</h5>
                  <p>${formatCurrency(valorLiquido)}</p>
              </div>
              ` : ''}

              ${uniqueLegislations.length > 0 ? `
              <h2 class="section-title base-legal">Base Legal Aplicada</h2>
              <ul>
                  ${uniqueLegislations.map(leg => `<li>${leg.replace(/_/g, ' ')}</li>`).join('')}
              </ul>
              ` : ''}

              ${calculation.resposta_ai ? `
              <h2 class="section-title ai-response">Resposta JSON da IA (Texto Puro)</h2>
              <pre>${JSON.stringify(calculation.resposta_ai, null, 2)}</pre>
              ` : ''}

              ${calculation.tbl_resposta_calculo?.texto_extraido ? `
              <h2 class="section-title ai-response">Texto Extraído do Documento</h2>
              <pre>${calculation.tbl_resposta_calculo.texto_extraido}</pre>
              ` : ''}

          </div>
      </body>
      </html>
    `;

    return new Response(htmlContent, {
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in gerar-pdf-rescisao Edge Function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});