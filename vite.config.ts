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
      name: 'vietnamese-tts-proxy',
      configureServer(server) {
        server.middlewares.use('/api/tts', (req, res) => {
          const parsedUrl = url.parse(req.url || '', true);
          const text = (parsedUrl.query.text as string) || '';

          if (!text.trim()) {
            res.statusCode = 400;
            res.end('Missing text query parameter');
            return;
          }

          const safeText = text.trim().slice(0, 200);
          const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(safeText)}`;

          const ttsReq = https.get(
            ttsUrl,
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
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
      }
    }
  ]
});
