// @ts-nocheck
// deno-lint-ignore-file
// @ts-ignore
/// <reference lib="deno.ns" />
/// <reference types="https://esm.sh/@supabase/supabase-js@2.45.0" />

import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { calculationId } = await req.json();

    if (!calculationId) {
      return new Response(JSON.stringify({ error: 'Missing calculationId' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // 1. Buscar a resposta da IA existente na tabela tbl_calculos
    const { data: calculationData, error: fetchError } = await supabaseClient
      .from('tbl_calculos')
      .select('resposta_ai')
      .eq('id', calculationId)
      .single();

    if (fetchError || !calculationData || !calculationData.resposta_ai) {
      return new Response(JSON.stringify({ error: 'Calculation not found or no AI response available to reprocess', details: fetchError?.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    const aiResponseJson = calculationData.resposta_ai;

    // 2. Tentar parsear a resposta como JSON
    let isJson = false;
    try {
      JSON.parse(aiResponseJson);
      isJson = true;
    } catch (e) {
      console.warn(`AI response for calculationId ${calculationId} is not valid JSON. Cannot reprocess detailed items.`);
      return new Response(JSON.stringify({ message: 'AI response is not valid JSON. Detailed processing skipped.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 3. Se for JSON, invocar a função process-ai-calculation-json
    if (isJson) {
      console.log(`Invoking process-ai-calculation-json for re-processing calculationId: ${calculationId}`);
      const { data: invokeData, error: invokeError } = await supabaseClient.functions.invoke(
        'process-ai-calculation-json',
        {
          body: {
            calculationId: calculationId,
            aiResponseJson: aiResponseJson,
          },
        }
      );

      if (invokeError) {
        console.error('Error invoking process-ai-calculation-json during re-processing:', invokeError);
        return new Response(JSON.stringify({ error: 'Failed to reprocess AI response', details: invokeError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      } else {
        console.log('process-ai-calculation-json invoked successfully for re-processing:', invokeData);
      }
    }

    return new Response(JSON.stringify({ message: 'AI response reprocessed successfully (if JSON)', calculationId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in reprocess-calculation-ai-response Edge Function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});