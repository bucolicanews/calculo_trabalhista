import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { calculationId, aiResponse, pdfUrl, extractedText } = await req.json();

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

    const upsertPayload: {
      calculo_id: string;
      resposta_ai: string;
      url_documento_calculo?: string;
      texto_extraido?: string;
      data_hora: string;
    } = {
      calculo_id: calculationId,
      resposta_ai: aiResponse,
      data_hora: new Date().toISOString(),
    };

    if (pdfUrl) {
      upsertPayload.url_documento_calculo = pdfUrl;
    }
    if (extractedText) {
      upsertPayload.texto_extraido = extractedText;
    }

    // Upsert (insert or update) the calculation result
    const { data, error } = await supabaseClient
      .from('tbl_resposta_calculo')
      .upsert(upsertPayload, { onConflict: 'calculo_id' });

    if (error) {
      console.error('Error upserting calculation result:', error);
      return new Response(JSON.stringify({ error: 'Failed to update calculation result', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'Calculation result received and updated successfully', calculationId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in store-calculation-result Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});