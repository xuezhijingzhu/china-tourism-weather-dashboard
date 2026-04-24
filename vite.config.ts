import { loadEnv, type Plugin, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fetchWeatherByCity } from './server/qweather';

const qweatherDevApiPlugin = (env: Record<string, string>): Plugin => ({
  name: 'qweather-dev-api',
  configureServer(server) {
    server.middlewares.use('/api/weather', async (req, res) => {
      if (req.method !== 'GET') {
        res.statusCode = 405;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ message: 'Method Not Allowed' }));
        return;
      }

      const requestUrl = new URL(req.url ?? '/', 'http://localhost');
      const city = requestUrl.searchParams.get('city')?.trim() ?? '';

      if (!city) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ message: 'Missing required query: city' }));
        return;
      }

      try {
        const weather = await fetchWeatherByCity(
          {
            apiHost: env.QWEATHER_API_HOST ?? '',
            apiKey: env.QWEATHER_KEY ?? '',
          },
          city,
        );

        if (!weather) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ message: `No weather data found for city: ${city}` }));
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(weather));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ message }));
      }
    });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), qweatherDevApiPlugin(env)],
  };
});
