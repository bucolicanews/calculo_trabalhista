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
    const { dissidioId, pdfUrl } = await req.json();

    if (!dissidioId || !pdfUrl) {
      return new Response(JSON.stringify({ error: 'Missing dissidioId or pdfUrl' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for server-side operations
    );

    // --- SIMULAÇÃO DE EXTRAÇÃO DE TEXTO DO PDF ---
    // Em um cenário real, você usaria uma biblioteca como pdfjs-dist (se compatível com Deno)
    // ou um serviço externo para extrair o texto do PDF da `pdfUrl`.
    // Por exemplo:
    // const pdfResponse = await fetch(pdfUrl);
    // const pdfBuffer = await pdfResponse.arrayBuffer();
    // const text = await extractTextFromPdf(pdfBuffer); // Função imaginária de extração

    const simulatedText = `Este é um texto simulado extraído do PDF na URL: ${pdfUrl}.
    Em uma implementação real, o conteúdo completo do PDF seria processado aqui.
    O dissídio ID é: ${dissidioId}.`;
    // --- FIM DA SIMULAÇÃO ---

    const { data, error } = await supabaseClient
      .from('tbl_dissidios')
      .update({ texto_extraido: simulatedText })
      .eq('id', dissidioId);

    if (error) {
      console.error('Error updating dissidio with extracted text:', error);
      return new Response(JSON.stringify({ error: 'Failed to update dissidio', details: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ message: 'PDF text extraction (simulated) and update successful', dissidioId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in extract-pdf-text Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});