import { mockWeatherMap } from '../data/mockWeather';
import { cityDirectory } from '../data/regionDirectory';
import type { ProvinceWeatherOverview, WeatherData } from '../types';

export interface WeatherService {
  getCityWeather(city: string): Promise<WeatherData | null>;
  getProvinceOverview(province: string): Promise<ProvinceWeatherOverview>;
}

class MockWeatherService implements WeatherService {
  async getCityWeather(city: string): Promise<WeatherData | null> {
    return mockWeatherMap[city] ?? null;
  }

  async getProvinceOverview(province: string): Promise<ProvinceWeatherOverview> {
    const provinceCities = cityDirectory
      .filter((item) => item.province === province)
      .map((item) => item.city);
    const cityWeather = provinceCities
      .map((city) => mockWeatherMap[city])
      .filter((item): item is WeatherData => Boolean(item));

    if (!cityWeather.length) {
      return {
        province,
        cities: provinceCities,
        averageTemperature: null,
        weatherSummary: '该省份暂无 mock 天气样例，可通过真实天气 API 扩展。',
        updatedAt: null,
        isMock: true,
      };
    }

    const averageTemperature = Math.round(
      cityWeather.reduce((sum, item) => sum + item.temperature, 0) / cityWeather.length,
    );
    const summary = Array.from(new Set(cityWeather.map((item) => item.condition))).join(' / ');

    return {
      province,
      cities: provinceCities,
      averageTemperature,
      weatherSummary: summary,
      updatedAt: cityWeather[0].updatedAt,
      isMock: true,
    };
  }
}

class ProxyWeatherService implements WeatherService {
  private apiBaseUrl = import.meta.env.VITE_WEATHER_API_BASE_URL?.trim() ?? '';
  private cache = new Map<string, WeatherData>();

  private async requestCityWeather(city: string): Promise<WeatherData | null> {
    const cached = this.cache.get(city);
    if (cached) {
      return cached;
    }

    const url = new URL('/api/weather', this.apiBaseUrl || window.location.origin);
    url.searchParams.set('city', city);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Weather proxy request failed with HTTP ${response.status}`);
    }

    const weather = (await response.json()) as WeatherData;
    this.cache.set(city, weather);
    return weather;
  }

  async getCityWeather(city: string): Promise<WeatherData | null> {
    return this.requestCityWeather(city);
  }

  async getProvinceOverview(province: string): Promise<ProvinceWeatherOverview> {
    const provinceCities = cityDirectory
      .filter((item) => item.province === province)
      .map((item) => item.city);

    const weatherList = (
      await Promise.all(
        provinceCities.map(async (city) => {
          try {
            return await this.requestCityWeather(city);
          } catch {
            return null;
          }
        }),
      )
    ).filter((item): item is WeatherData => Boolean(item));

    if (!weatherList.length) {
      return {
        province,
        cities: provinceCities,
        averageTemperature: null,
        weatherSummary: '暂无实时天气数据，已可回退至 mock 模式。',
        updatedAt: null,
        isMock: false,
      };
    }

    const averageTemperature = Math.round(
      weatherList.reduce((sum, item) => sum + item.temperature, 0) / weatherList.length,
    );

    return {
      province,
      cities: provinceCities,
      averageTemperature,
      weatherSummary: Array.from(new Set(weatherList.map((item) => item.condition))).join(' / '),
      updatedAt: weatherList[0].updatedAt,
      isMock: false,
    };
  }
}

class FallbackWeatherService implements WeatherService {
  private readonly primary: WeatherService;
  private readonly fallback: WeatherService;

  constructor(primary: WeatherService, fallback: WeatherService) {
    this.primary = primary;
    this.fallback = fallback;
  }

  async getCityWeather(city: string): Promise<WeatherData | null> {
    try {
      const data = await this.primary.getCityWeather(city);
      return data ?? this.fallback.getCityWeather(city);
    } catch (error) {
      console.warn('[weatherService] primary provider failed, fallback to mock:', error);
      return this.fallback.getCityWeather(city);
    }
  }

  async getProvinceOverview(province: string): Promise<ProvinceWeatherOverview> {
    try {
      return await this.primary.getProvinceOverview(province);
    } catch (error) {
      console.warn('[weatherService] primary provider failed, fallback to mock:', error);
      return this.fallback.getProvinceOverview(province);
    }
  }
}

const createWeatherService = (): WeatherService => {
  const provider = import.meta.env.VITE_WEATHER_PROVIDER ?? 'mock';
  const mockService = new MockWeatherService();

  if (provider === 'qweather_proxy') {
    return new FallbackWeatherService(new ProxyWeatherService(), mockService);
  }

  return mockService;
};

export const weatherService = createWeatherService();
