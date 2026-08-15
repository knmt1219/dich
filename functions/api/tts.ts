// Cloudflare Pages Serverless Edge Function for Vietnamese AI Voice Dubbing (TTS)
// This file is automatically executed by Cloudflare Pages on the edge network.

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const text = url.searchParams.get('text') || '';

  if (!text.trim()) {
    return new Response('Missing text parameter', { status: 400 });
  }

  const cleanText = text.trim().slice(0, 200);
  const candidateUrls = [
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=dict-chrome-ex&q=${encodeURIComponent(cleanText)}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=gtx&q=${encodeURIComponent(cleanText)}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(cleanText)}`
  ];

  for (const ttsUrl of candidateUrls) {
    try {
      const ttsResponse = await fetch(ttsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
          'Accept': '*/*'
        }
      });

      if (ttsResponse.ok && ttsResponse.status === 200) {
        return new Response(ttsResponse.body, {
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

  return new Response('Upstream TTS Error', { status: 502 });
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
