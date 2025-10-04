/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const { calculationId, aiResponse, urlDocumentoCalculo, textoExtraido } = await req.json();

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

    // 1. Atualiza diretamente a tabela tbl_calculos com a resposta da IA
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

    // 2. Insere ou atualiza (UPSERT) a tabela tbl_resposta_calculo com os detalhes adicionais
    const { data: _respostaData, error: upsertRespostaError } = await supabaseClient
      .from('tbl_resposta_calculo')
      .upsert(
        {
          calculo_id: calculationId,
          url_documento_calculo: urlDocumentoCalculo || null,
          texto_extraido: textoExtraido || null,
          data_hora: new Date().toISOString(), // Atualiza a data/hora da resposta
        },
        { onConflict: 'calculo_id' } // Usa a restrição UNIQUE para o UPSERT
      );

    if (upsertRespostaError) {
      console.error('Error upserting tbl_resposta_calculo:', upsertRespostaError);
      return new Response(JSON.stringify({ error: 'Failed to upsert tbl_resposta_calculo', details: upsertRespostaError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'AI response and additional details received and updated successfully', calculationId }), {
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