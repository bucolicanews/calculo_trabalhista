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
    const { calculationId, aiResponse } = await req.json(); // aiResponse é o JSON string
    // NOVO LOG PARA DEPURAR O PAYLOAD RECEBIDO
    console.log(
      `[store-calculation-result] Received payload: calculationId=${calculationId}, aiResponse length=${
        aiResponse?.length || 0
      }`
    );
    if (!calculationId || !aiResponse) {
      console.error(
        `[store-calculation-result] Missing calculationId or aiResponse. calculationId: ${calculationId}, aiResponse present: ${!!aiResponse}`
      );
      return new Response(
        JSON.stringify({
          error: "Missing calculationId or aiResponse"
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
    // 1. Tenta parsear a resposta da IA como JSON.
    let isJson = false;
    try {
      JSON.parse(aiResponse);
      isJson = true;
    } catch (e) {
      console.warn(
        `[store-calculation-result] AI response for calculationId ${calculationId} is not valid JSON. Skipping detailed processing.`
      );
    }
    // 2. Se for JSON, invoca a função para processar proventos/descontos.
    if (isJson) {
      console.log(
        `[store-calculation-result] Invoking process-ai-calculation-json for calculationId: ${calculationId}`
      );
      const { data: invokeData, error: invokeError } =
        await supabaseClient.functions.invoke("process-ai-calculation-json", {
          body: {
            calculationId: calculationId,
            aiResponseJson: aiResponse
          }
        });
      if (invokeError) {
        console.error(
          "[store-calculation-result] Error invoking process-ai-calculation-json:",
          invokeError
        );
        // Continua, mas loga o erro de processamento secundário
      } else {
        console.log(
          "[store-calculation-result] process-ai-calculation-json invoked successfully:",
          invokeData
        );
      }
    }
    // 3. Armazena a resposta original (JSON string ou Markdown) na tabela tbl_calculos.
    console.log(
      `[store-calculation-result] Attempting to update tbl_calculos for calculationId: ${calculationId}`
    );
    const { error: updateCalculoError } = await supabaseClient
      .from("tbl_calculos")
      .update({
        resposta_ai: aiResponse
      })
      .eq("id", calculationId);
    if (updateCalculoError) {
      console.error(
        "[store-calculation-result] Error updating calculation with AI response:",
        updateCalculoError
      );
      return new Response(
        JSON.stringify({
          error: "Failed to update calculation with AI response",
          details: updateCalculoError.message
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
    console.log(
      `[store-calculation-result] Successfully updated tbl_calculos for calculationId: ${calculationId}`
    );
    return new Response(
      JSON.stringify({
        message:
          "AI response received, processed (if JSON), and updated successfully in tbl_calculos",
        calculationId
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
    console.error(
      "[store-calculation-result] Error in store-calculation-result Edge Function:",
      error
    );
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
