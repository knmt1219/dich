// Cloudflare Pages Serverless Edge Function for High-Quality Vietnamese AI Voice Dubbing (TTS)
// Runs on Cloudflare Edge globally with 0 CORS issues and multi-upstream resilience.

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const text = url.searchParams.get('text') || '';

  if (!text.trim()) {
    return new Response('Missing text parameter', {
      status: 400,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const cleanText = text.trim().slice(0, 200);
  const candidateClients = ['dict-chrome-ex', 'gtx', 'tw-ob'];

  for (const client of candidateClients) {
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=${client}&q=${encodeURIComponent(cleanText)}`;
    try {
      const ttsResponse = await fetch(ttsUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
          'Accept': '*/*'
        }
      });

      if (ttsResponse.ok && (ttsResponse.status === 200 || ttsResponse.status === 206)) {
        const audioBuffer = await ttsResponse.arrayBuffer();
        return new Response(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'public, max-age=604800, s-maxage=604800',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': '*'
          }
        });
      }
    } catch {}
  }

  return new Response('Upstream TTS Error', {
    status: 502,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  });
};

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  });
};
