// @ts-ignore
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calculationId, aiResponse } = await req.json(); // aiResponse é o JSON string

    if (!calculationId || !aiResponse) {
      return new Response(JSON.stringify({ error: 'Missing calculationId or aiResponse' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for server-side operations
    );

    // 1. Tenta parsear a resposta da IA como JSON.
    let isJson = false;
    try {
      JSON.parse(aiResponse);
      isJson = true;
    } catch (e) {
      console.warn(`AI response for calculationId ${calculationId} is not valid JSON. Skipping detailed processing.`);
    }

    // 2. Se for JSON, invoca a função para processar proventos/descontos.
    if (isJson) {
      console.log(`Invoking process-ai-calculation-json for calculationId: ${calculationId}`);
      const { data: invokeData, error: invokeError } = await supabaseClient.functions.invoke(
        'process-ai-calculation-json',
        {
          body: {
            calculationId: calculationId,
            aiResponseJson: aiResponse, // Passa a string JSON completa
          },
        }
      );

      if (invokeError) {
        console.error('Error invoking process-ai-calculation-json:', invokeError);
        // Continua, mas loga o erro de processamento secundário
      } else {
        console.log('process-ai-calculation-json invoked successfully:', invokeData);
      }
    }

    // 3. Armazena a resposta original (JSON string ou Markdown) na tabela tbl_calculos.
    const { error: updateCalculoError } = await supabaseClient
      .from('tbl_calculos')
      .update({
        resposta_ai: aiResponse, // Armazena a string JSON original
      })
      .eq('id', calculationId);

    if (updateCalculoError) {
      console.error('Error updating calculation with AI response:', updateCalculoError);
      return new Response(JSON.stringify({ error: 'Failed to update calculation with AI response', details: updateCalculoError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'AI response received, processed (if JSON), and updated successfully in tbl_calculos', calculationId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in store-calculation-result Edge Function:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});