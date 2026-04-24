import { cityDirectory } from '../src/data/regionDirectory';
import { normalizeRegionName } from '../src/utils/format';

export interface ServerWeatherData {
  city: string;
  province: string;
  temperature: number;
  condition: string;
  humidity: number;
  windDirection: string;
  windPower: string;
  updatedAt: string;
  isMock: false;
}

interface QWeatherLocationItem {
  id: string;
  name: string;
  adm1: string;
  country: string;
}

interface QWeatherCityLookupResponse {
  code: string;
  location?: QWeatherLocationItem[];
}

interface QWeatherNowResponse {
  code: string;
  now?: {
    temp: string;
    text: string;
    humidity: string;
    windDir: string;
    windScale: string;
    obsTime: string;
  };
}

export interface QWeatherRuntimeConfig {
  apiHost: string;
  apiKey: string;
}

const cityLookupCache = new Map<string, QWeatherLocationItem | null>();

function assertReady(config: QWeatherRuntimeConfig) {
  if (!config.apiHost || !config.apiKey) {
    throw new Error('QWEATHER_API_HOST 或 QWEATHER_KEY 未配置。');
  }
}

async function fetchJson<T>(
  config: QWeatherRuntimeConfig,
  path: string,
  searchParams: Record<string, string>,
): Promise<T> {
  assertReady(config);

  const url = new URL(path, `https://${config.apiHost}`);
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'X-QW-Api-Key': config.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`QWeather request failed with HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

function pickBestLocation(city: string, locations: QWeatherLocationItem[]) {
  const cityMeta = cityDirectory.find((item) => item.city === city);
  const normalizedCity = normalizeRegionName(city);
  const normalizedProvince = normalizeRegionName(cityMeta?.province ?? '');

  const exactByProvince = locations.find((item) => {
    const nameMatched = normalizeRegionName(item.name) === normalizedCity;
    const provinceMatched = normalizeRegionName(item.adm1) === normalizedProvince;
    return item.country === '中国' && nameMatched && provinceMatched;
  });

  if (exactByProvince) {
    return exactByProvince;
  }

  const exactCity = locations.find(
    (item) => item.country === '中国' && normalizeRegionName(item.name) === normalizedCity,
  );
  if (exactCity) {
    return exactCity;
  }

  const chinaMatch = locations.find((item) => item.country === '中国');
  return chinaMatch ?? locations[0] ?? null;
}

async function lookupCity(config: QWeatherRuntimeConfig, city: string): Promise<QWeatherLocationItem | null> {
  const cacheKey = `${config.apiHost}:${city}`;

  if (cityLookupCache.has(cacheKey)) {
    return cityLookupCache.get(cacheKey) ?? null;
  }

  const data = await fetchJson<QWeatherCityLookupResponse>(config, '/geo/v2/city/lookup', {
    location: city,
    range: 'cn',
    number: '10',
    lang: 'zh',
  });

  if (data.code !== '200' || !data.location?.length) {
    cityLookupCache.set(cacheKey, null);
    return null;
  }

  const bestLocation = pickBestLocation(city, data.location);
  cityLookupCache.set(cacheKey, bestLocation);
  return bestLocation;
}

export async function fetchWeatherByCity(
  config: QWeatherRuntimeConfig,
  city: string,
): Promise<ServerWeatherData | null> {
  const location = await lookupCity(config, city);

  if (!location) {
    return null;
  }

  const data = await fetchJson<QWeatherNowResponse>(config, '/v7/weather/now', {
    location: location.id,
    lang: 'zh',
    unit: 'm',
  });

  if (data.code !== '200' || !data.now) {
    return null;
  }

  return {
    city: location.name,
    province: normalizeRegionName(location.adm1),
    temperature: Number(data.now.temp),
    condition: data.now.text,
    humidity: Number(data.now.humidity),
    windDirection: data.now.windDir,
    windPower: `${data.now.windScale}级`,
    updatedAt: data.now.obsTime,
    isMock: false,
  };
}
