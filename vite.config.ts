import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

import {createSiteApi} from './server/site-api';

export default defineConfig(({command}) => ({
  plugins: [
    react(),
    command === 'serve'
      ? {
          name: 'teti-site-local-api',
          configureServer(server) {
            const handle = createSiteApi();
            server.middlewares.use(async (request, response, next) => {
              const localRequest = request as unknown as {
                headers: Record<string, string | string[] | undefined>;
                method?: string;
                url?: string;
              };
              if (!localRequest.url?.startsWith('/api/')) {
                next();
                return;
              }
              const siteResponse = await handle(
                new Request(`http://127.0.0.1${localRequest.url}`, {
                  method: localRequest.method,
                  headers: localRequest.headers as HeadersInit,
                }),
                {TETI_NETWORK_ORIGIN: 'http://127.0.0.1:8788'},
              );
              response.statusCode = siteResponse.status;
              siteResponse.headers.forEach((value, name) => response.setHeader(name, value));
              response.end(await siteResponse.text());
            });
          },
        }
      : null,
  ],
}));
