export type SearchTargetType = 'province' | 'city' | 'attraction';

export interface WeatherData {
  city: string;
  province: string;
  temperature: number;
  condition: string;
  humidity: number;
  windDirection: string;
  windPower: string;
  updatedAt: string;
  isMock: boolean;
}

export interface TrendPoint {
  time: string;
  value: number;
}

export type CrowdLevel = '舒适' | '正常' | '较拥挤' | '拥挤' | '严重拥挤';

export interface AttractionCrowdData {
  id: string;
  attractionName: string;
  city: string;
  province: string;
  realtimeCongestion: number;
  currentVisitors: number;
  maxCapacity: number;
  level: CrowdLevel;
  updatedAt: string;
  trend: TrendPoint[];
  isMock: boolean;
}

export interface CityDirectoryItem {
  city: string;
  province: string;
  center: [number, number];
  aliases?: string[];
}

export interface AttractionCandidate {
  id: string;
  attractionName: string;
  city: string;
  province: string;
  sourceName: string;
  sourceUrl: string;
  note?: string;
}

export interface ProvinceWeatherOverview {
  province: string;
  cities: string[];
  averageTemperature: number | null;
  weatherSummary: string;
  updatedAt: string | null;
  isMock: boolean;
}

export interface SearchResult {
  type: SearchTargetType;
  label: string;
  province: string;
  city?: string;
  attractionId?: string;
  center?: [number, number];
}
