// supabase/functions/reprocess-calculation-ai-response/index.ts
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
    const { data: calculationData, error: fetchError } = await supabaseClient
      .from("tbl_calculos")
      .select("resposta_ai")
      .eq("id", calculationId)
      .single();
    if (fetchError || !calculationData || !calculationData.resposta_ai) {
      return new Response(
        JSON.stringify({
          error: "Calculation not found or no AI response available",
          details: fetchError?.message
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          },
          status: 404
        }
      );
    }
    const rawAiResponse = calculationData.resposta_ai;
    let jsonString = "";
    // ================== INÍCIO DA CORREÇÃO ==================
    // 2. CORREÇÃO: Verificar o tipo de 'resposta_ai'.
    // O campo é JSONB, então o Supabase pode já retorná-lo como um objeto.
    if (typeof rawAiResponse === "string") {
      // Se for uma string (caso legado), extraia o JSON.
      console.log("AI response is a string. Attempting to extract JSON.");
      const jsonMatch = rawAiResponse.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
      if (jsonMatch && jsonMatch[0]) {
        jsonString = jsonMatch[0];
      } else {
        return new Response(
          JSON.stringify({
            error: "Could not extract a valid JSON from the AI response string."
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
    } else if (typeof rawAiResponse === "object" && rawAiResponse !== null) {
      // Se já for um objeto, apenas o convertemos para string para uso posterior.
      console.log("AI response is already an object. Stringifying.");
      jsonString = JSON.stringify(rawAiResponse);
    } else {
      // Se for nulo, indefinido ou outro tipo, é um erro.
      return new Response(
        JSON.stringify({
          error: "AI response is null or an invalid type."
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
    // =================== FIM DA CORREÇÃO ====================
    // 3. Validar o JSON final (garantia extra)
    try {
      JSON.parse(jsonString);
    } catch (e) {
      return new Response(
        JSON.stringify({
          error: "Final AI response content is not valid JSON.",
          details: e.message
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
    // 4. Invocar a função 'process-ai-calculation-json'
    const { data: invokeData, error: invokeError } =
      await supabaseClient.functions.invoke("process-ai-calculation-json", {
        body: {
          calculationId: calculationId,
          aiResponseJson: jsonString
        }
      });
    if (invokeError) {
      throw new Error(`Failed to process AI response: ${invokeError.message}`);
    }
    return new Response(
      JSON.stringify({
        message: "AI response processed successfully.",
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
      "Error in reprocess-calculation-ai-response Edge Function:",
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
