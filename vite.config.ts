import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';
import url from 'url';

// https://vite.dev/config/
export default defineConfig({
  server: {
    open: true,
    host: true,
    port: 5173
  },
  plugins: [
    react(),
    {
      name: 'bilingual-studio-api-proxy',
      configureServer(server) {
        // 1. Text-to-Speech Edge Audio Proxy
        server.middlewares.use('/api/tts', (req, res) => {
          const parsedUrl = url.parse(req.url || '', true);
          const text = (parsedUrl.query.text as string) || '';

          if (!text.trim()) {
            res.statusCode = 400;
            res.end('Missing text query parameter');
            return;
          }

          const safeText = text.trim().slice(0, 200);
          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=dict-chrome-ex&q=${encodeURIComponent(safeText)}`;

          const ttsReq = https.get(
            ttsUrl,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/',
                'Accept': '*/*'
              }
            },
            (ttsRes) => {
              res.writeHead(ttsRes.statusCode || 200, {
                'Content-Type': 'audio/mpeg',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400'
              });
              ttsRes.pipe(res);
            }
          );

          ttsReq.on('error', (err) => {
            console.error('Error fetching TTS audio:', err);
            res.statusCode = 500;
            res.end(err.message);
          });
        });

        // 2. High-Accuracy Translation Proxy (No CORS block)
        server.middlewares.use('/api/translate', (req, res) => {
          const parsedUrl = url.parse(req.url || '', true);
          const text = (parsedUrl.query.text as string) || '';

          if (!text.trim()) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ translatedText: '' }));
            return;
          }

          const cleanText = text.trim();
          const targetUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(cleanText)}`;

          const translateReq = https.get(
            targetUrl,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/'
              }
            },
            (transRes) => {
              let body = '';
              transRes.on('data', (chunk) => { body += chunk; });
              transRes.on('end', () => {
                try {
                  const data = JSON.parse(body);
                  if (Array.isArray(data) && Array.isArray(data[0])) {
                    const translatedText = data[0].map((item: unknown[]) => item[0]).join('').trim();
                    res.writeHead(200, {
                      'Content-Type': 'application/json',
                      'Access-Control-Allow-Origin': '*'
                    });
                    res.end(JSON.stringify({ translatedText }));
                    return;
                  }
                } catch {}
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ translatedText: cleanText }));
              });
            }
          );

          translateReq.on('error', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ translatedText: cleanText }));
          });
        });
      },
      configurePreviewServer(server) {
        // Text-to-Speech Edge Audio Proxy for Preview Mode
        server.middlewares.use('/api/tts', (req, res) => {
          const parsedUrl = url.parse(req.url || '', true);
          const text = (parsedUrl.query.text as string) || '';

          if (!text.trim()) {
            res.statusCode = 400;
            res.end('Missing text query parameter');
            return;
          }

          const safeText = text.trim().slice(0, 200);
          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=dict-chrome-ex&q=${encodeURIComponent(safeText)}`;

          const ttsReq = https.get(
            ttsUrl,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Referer': 'https://translate.google.com/',
                'Accept': '*/*'
              }
            },
            (ttsRes) => {
              res.writeHead(ttsRes.statusCode || 200, {
                'Content-Type': 'audio/mpeg',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400'
              });
              ttsRes.pipe(res);
            }
          );

          ttsReq.on('error', (err) => {
            res.statusCode = 500;
            res.end(err.message);
          });
        });
      }
    }
  ]
});
