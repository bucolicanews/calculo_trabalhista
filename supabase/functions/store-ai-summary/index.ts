/// <reference lib="deno.ns" />
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
    const { dissidioId, resumo, url_documento, texto_extraido } = await req.json();

    if (!dissidioId || !resumo) {
      return new Response(JSON.stringify({ error: 'Missing dissidioId or resumo' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for server-side operations
    );

    const updatePayload: { resumo_ai: string; url_documento?: string; texto_extraido?: string } = {
      resumo_ai: resumo,
    };

    if (url_documento) {
      updatePayload.url_documento = url_documento;
    }
    if (texto_extraido) {
      updatePayload.texto_extraido = texto_extraido;
    }

    const { data, error } = await supabaseClient
      .from('tbl_dissidios')
      .update(updatePayload)
      .eq('id', dissidioId);

    if (error) {
      console.error('Error updating dissidio with AI summary/extracted text:', error);
      return new Response(JSON.stringify({ error: 'Failed to update dissidio with AI summary/extracted text', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'AI summary and other fields received and updated successfully', dissidioId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in store-ai-summary Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});