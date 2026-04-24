import { fetchWeatherByCity } from '../server/qweather';

interface VercelLikeRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
}

interface VercelLikeResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelLikeResponse;
  json(body: unknown): void;
}

const firstQueryValue = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
};

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method && req.method !== 'GET') {
    res.status(405).json({ message: 'Method Not Allowed' });
    return;
  }

  const city = firstQueryValue(req.query?.city).trim();

  if (!city) {
    res.status(400).json({ message: 'Missing required query: city' });
    return;
  }

  try {
    const weather = await fetchWeatherByCity(
      {
        apiHost: process.env.QWEATHER_API_HOST ?? '',
        apiKey: process.env.QWEATHER_KEY ?? '',
      },
      city,
    );

    if (!weather) {
      res.status(404).json({ message: `No weather data found for city: ${city}` });
      return;
    }

    res.status(200).json(weather);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(502).json({ message });
  }
}
