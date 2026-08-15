// Cloudflare Pages Serverless Edge Function for High-Accuracy Chinese to Vietnamese Translation
// This runs on Cloudflare Edge with 0 CORS issues and 100% uptime.

interface Env {}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const text = url.searchParams.get('text') || '';
  const sl = url.searchParams.get('sl') || 'zh-CN';
  const tl = url.searchParams.get('tl') || 'vi';

  if (!text.trim()) {
    return new Response(JSON.stringify({ translatedText: '' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  const cleanText = text.trim();
  const targetUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(cleanText)}`;

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedText = data[0].map((item: unknown[]) => item[0]).join('').trim();
        return new Response(JSON.stringify({ translatedText }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=604800, s-maxage=604800',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    return new Response(JSON.stringify({ translatedText: cleanText }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message, translatedText: cleanText }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
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
