// @ts-nocheck
// deno-lint-ignore-file
// @ts-ignore
/// <reference lib="deno.ns" />
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
    const { calculationId } = await req.json();
    if (!calculationId) {
      return new Response(
        JSON.stringify({
          error: "Missing calculationId"
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
    // Deletar proventos associados ao cálculo
    const { error: deleteProventosError } = await supabaseClient
      .from("tbl_proventos")
      .delete()
      .eq("id_calculo", calculationId);
    if (deleteProventosError) {
      console.error("Error deleting proventos:", deleteProventosError);
      throw new Error(
        `Failed to delete proventos: ${deleteProventosError.message}`
      );
    }
    // Deletar descontos associados ao cálculo
    const { error: deleteDescontosError } = await supabaseClient
      .from("tbl_descontos")
      .delete()
      .eq("id_calculo", calculationId);
    if (deleteDescontosError) {
      console.error("Error deleting descontos:", deleteDescontosError);
      throw new Error(
        `Failed to delete descontos: ${deleteDescontosError.message}`
      );
    }
    // Opcional: Limpar a resposta_ai da tabela tbl_calculos se desejar resetar completamente
    const { error: updateCalculoError } = await supabaseClient
      .from("tbl_calculos")
      .update({
        resposta_ai: null
      })
      .eq("id", calculationId);
    if (updateCalculoError) {
      console.error(
        "Error clearing resposta_ai in tbl_calculos:",
        updateCalculoError
      );
      // Não lançar erro fatal aqui, pois a limpeza dos itens já é o principal
    }
    return new Response(
      JSON.stringify({
        message: "Calculation entries cleared successfully."
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
    console.error("Error in clear-calculation-entries Edge Function:", error);
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
