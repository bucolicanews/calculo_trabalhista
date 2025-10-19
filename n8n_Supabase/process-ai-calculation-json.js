// @ts-nocheck
// deno-lint-ignore-file
// @ts-ignore
/// <reference lib="deno.ns" />
/// <reference types="https://deno.land/std@0.190.0/http/server.ts" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2.45.0" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type"
};
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { calculationId, aiResponseJson } = await req.json();
    if (!calculationId || !aiResponseJson) {
      return new Response(
        JSON.stringify({
          error: "Missing calculationId or aiResponseJson"
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 400
        }
      );
    }
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    let parsedAiResponse;
    try {
      parsedAiResponse = JSON.parse(aiResponseJson);
    } catch (parseError) {
      console.error("Error parsing aiResponseJson:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid aiResponseJson format",
          details: parseError.message
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 400
        }
      );
    }
    const { Verbas_Rescisorias } = parsedAiResponse;
    if (!Verbas_Rescisorias) {
      console.warn(
        "aiResponseJson does not contain Verbas_Rescisorias. Skipping proventos/descontos insertion."
      );
      return new Response(
        JSON.stringify({
          message:
            "No Verbas_Rescisorias found in AI response, skipping detailed insertion."
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 200
        }
      );
    }
    // Limpar proventos e descontos existentes para este cálculo antes de inserir novos
    const { error: deleteProventosError } = await supabaseClient
      .from("tbl_proventos")
      .delete()
      .eq("id_calculo", calculationId);
    if (deleteProventosError) {
      console.error("Error deleting existing proventos:", deleteProventosError);
    }
    const { error: deleteDescontosError } = await supabaseClient
      .from("tbl_descontos")
      .delete()
      .eq("id_calculo", calculationId);
    if (deleteDescontosError) {
      console.error("Error deleting existing descontos:", deleteDescontosError);
    }
    // Process Proventos
    if (
      Verbas_Rescisorias.Remuneracao &&
      Array.isArray(Verbas_Rescisorias.Remuneracao)
    ) {
      for (const proventoItem of Verbas_Rescisorias.Remuneracao) {
        const valorCalculado = parseFloat(proventoItem.Cálculo?.Valor || 0);
        // Inserir apenas se o valor for maior que zero ou se for uma verba de irregularidade (para registrar a ausência)
        if (
          valorCalculado > 0 ||
          proventoItem.Natureza_da_Verba === "Irregularidade_Contratual"
        ) {
          const { error: insertError } = await supabaseClient
            .from("tbl_proventos")
            .insert({
              id_calculo: calculationId,
              nome_provento: proventoItem.Provento,
              valor_calculado: valorCalculado,
              natureza_da_verba: proventoItem.Natureza_da_Verba,
              legislacao: proventoItem.Legislação,
              exemplo_aplicavel: proventoItem.Exemplos_Aplicaveis,
              formula_sugerida: proventoItem.Cálculo?.Fórmula_Sugerida,
              parametro_calculo: proventoItem.Cálculo?.Parametro,
              json_completo: proventoItem,
              memoria_calculo: proventoItem.Memoria_de_Calculo
            });
          if (insertError) {
            console.error(
              "Error inserting provento:",
              proventoItem.Provento,
              insertError
            );
          }
        }
      }
    }
    // Process Descontos
    if (
      Verbas_Rescisorias.Descontos &&
      Array.isArray(Verbas_Rescisorias.Descontos)
    ) {
      for (const descontoItem of Verbas_Rescisorias.Descontos) {
        const valorCalculado = parseFloat(descontoItem.Cálculo?.Valor || 0);
        // Inserir apenas se o valor for maior que zero ou se for uma verba de irregularidade
        if (
          valorCalculado > 0 ||
          descontoItem.Natureza_da_Verba === "Irregularidade_Contratual"
        ) {
          const { error: insertError } = await supabaseClient
            .from("tbl_descontos")
            .insert({
              id_calculo: calculationId,
              nome_desconto: descontoItem.Desconto,
              valor_calculado: valorCalculado,
              natureza_da_verba: descontoItem.Natureza_da_Verba,
              legislacao: descontoItem.Legislação,
              exemplo_aplicavel: descontoItem.Exemplos_Aplicaveis,
              formula_sugerida: descontoItem.Cálculo?.Fórmula_Sugerida,
              parametro_calculo: descontoItem.Cálculo?.Parametro,
              json_completo: descontoItem,
              memoria_calculo: descontoItem.Memoria_de_Calculo
            });
          if (insertError) {
            console.error(
              "Error inserting desconto:",
              descontoItem.Desconto,
              insertError
            );
          }
        }
      }
    }
    return new Response(
      JSON.stringify({
        message: "Proventos and descontos processed and stored successfully."
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in process-ai-calculation-json Edge Function:", error);
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        },
        status: 500
      }
    );
  }
});
