declare const Deno: any; // Adicionado para resolver 'Cannot find name Deno'

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
    const { calculationId, aiResponse } = await req.json();

    if (!calculationId || !aiResponse) {
      return new Response(JSON.stringify({ error: 'Missing calculationId or aiResponse' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for server-side operations
    );

    // Atualiza diretamente a tabela tbl_calculos com a resposta da IA
    const { error: updateCalculoError } = await supabaseClient
      .from('tbl_calculos')
      .update({
        resposta_ai: aiResponse,
      })
      .eq('id', calculationId);

    if (updateCalculoError) {
      console.error('Error updating calculation with AI response:', updateCalculoError);
      return new Response(JSON.stringify({ error: 'Failed to update calculation with AI response', details: updateCalculoError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Tenta parsear a resposta da IA como JSON. Se for JSON, invoca a nova função Edge.
    let isJson = false;
    try {
      JSON.parse(aiResponse);
      isJson = true;
    } catch (e) {
      // Not a valid JSON, proceed as Markdown
    }

    if (isJson) {
      console.log(`Invoking process-ai-calculation-json for calculationId: ${calculationId}`);
      const { data: invokeData, error: invokeError } = await supabaseClient.functions.invoke(
        'process-ai-calculation-json',
        {
          body: {
            calculationId: calculationId,
            aiResponseJson: aiResponse,
          },
          // headers: { 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` }, // Não é necessário para invocações internas
        }
      );

      if (invokeError) {
        console.error('Error invoking process-ai-calculation-json:', invokeError);
        // Não falha a requisição principal, apenas loga o erro de processamento secundário
      } else {
        console.log('process-ai-calculation-json invoked successfully:', invokeData);
      }
    }

    return new Response(JSON.stringify({ message: 'AI response received and updated successfully in tbl_calculos', calculationId }), {
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