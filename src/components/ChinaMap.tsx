import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import chinaGeo from '../data/chinaGeo.json';
import type { SearchResult } from '../types';
import { normalizeRegionName } from '../utils/format';
import styles from './ChinaMap.module.css';

echarts.registerMap('china-dashboard', chinaGeo as never);

interface ChinaMapProps {
  selectedProvince: string;
  selectedCity?: string;
  focusResult?: SearchResult | null;
  onProvinceSelect: (province: string) => void;
  onCitySelect: (province: string, city: string) => void;
}

const getProvinceCenterMap = () => {
  const features = (chinaGeo as { features?: Array<{ properties?: Record<string, unknown> }> }).features ?? [];
  return features.reduce<Record<string, [number, number]>>((accumulator, feature) => {
    const properties = feature.properties ?? {};
    const name = normalizeRegionName(String(properties.name ?? ''));
    const center = properties.center as [number, number] | undefined;

    if (name && center) {
      accumulator[name] = center;
    }

    return accumulator;
  }, {});
};

const provinceCenters = getProvinceCenterMap();

const cityMarkers = [
  { name: '北京', value: [116.4074, 39.9042, 24], province: '北京' },
  { name: '上海', value: [121.4737, 31.2304, 23], province: '上海' },
  { name: '广州', value: [113.2644, 23.1291, 29], province: '广东' },
  { name: '西安', value: [108.9398, 34.3416, 27], province: '陕西' },
  { name: '成都', value: [104.0665, 30.5723, 22], province: '四川' },
  { name: '杭州', value: [120.1551, 30.2741, 25], province: '浙江' },
  { name: '重庆', value: [106.5516, 29.563, 28], province: '重庆' },
  { name: '哈尔滨', value: [126.535, 45.8038, 15], province: '黑龙江' },
  { name: '沈阳', value: [123.4315, 41.8057, 19], province: '辽宁' },
  { name: '南京', value: [118.7969, 32.0603, 26], province: '江苏' },
];

export function ChinaMap({
  selectedProvince,
  selectedCity,
  focusResult,
  onProvinceSelect,
  onCitySelect,
}: ChinaMapProps) {
  let mapCenter: [number, number] = provinceCenters[selectedProvince] ?? [104.114129, 37.550339];

  if (focusResult?.center) {
    mapCenter = focusResult.center;
  } else if (selectedCity) {
    const city = cityMarkers.find((item) => item.name === selectedCity);
    if (city) {
      mapCenter = [city.value[0], city.value[1]];
    }
  }

  const zoom = focusResult?.type === 'city' || focusResult?.type === 'attraction' || selectedCity ? 1.8 : 1.18;

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(5, 16, 27, 0.92)',
      borderColor: 'rgba(99, 196, 255, 0.28)',
      textStyle: { color: '#d9f1ff' },
      formatter: (params: { seriesName: string; name: string; data?: { province?: string } }) => {
        if (params.seriesName === '城市') {
          return `${params.name}<br />点击查看城市天气与景区数据`;
        }

        return `${normalizeRegionName(params.name)}<br />点击查看省级概览`;
      },
    },
    geo: {
      map: 'china-dashboard',
      roam: true,
      center: mapCenter,
      zoom,
      layoutCenter: ['50%', '54%'],
      layoutSize: '108%',
      itemStyle: {
        opacity: 0,
      },
      emphasis: {
        itemStyle: {
          opacity: 0,
        },
      },
    },
    series: [
      {
        name: 'shadow',
        type: 'map',
        map: 'china-dashboard',
        geoIndex: 0,
        silent: true,
        z: 1,
        itemStyle: {
          areaColor: '#071322',
          borderColor: 'rgba(15, 49, 84, 0.7)',
          shadowColor: 'rgba(0, 0, 0, 0.55)',
          shadowBlur: 28,
          shadowOffsetY: 18,
        },
        emphasis: {
          disabled: true,
        },
      },
      {
        name: '省份',
        type: 'map',
        map: 'china-dashboard',
        geoIndex: 0,
        z: 5,
        selectedMode: false,
        label: {
          show: false,
        },
        data: Object.entries(provinceCenters).map(([province]) => ({
          name: province,
          itemStyle:
            province === selectedProvince
              ? {
                  areaColor: '#1d5c8f',
                  borderColor: '#87edff',
                }
              : undefined,
        })),
        itemStyle: {
          areaColor: '#0d2740',
          borderColor: 'rgba(119, 205, 255, 0.62)',
          borderWidth: 1.1,
        },
        emphasis: {
          label: {
            show: false,
          },
          itemStyle: {
            areaColor: '#1b4a72',
            borderColor: '#abf2ff',
            shadowColor: 'rgba(53, 181, 255, 0.35)',
            shadowBlur: 24,
          },
        },
      },
      {
        name: '城市',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        z: 12,
        data: cityMarkers,
        symbolSize: (value: number[]) => {
          const cityName = cityMarkers.find((item) => item.value[0] === value[0] && item.value[1] === value[1])?.name;
          return cityName === selectedCity ? 16 : 11;
        },
        rippleEffect: {
          brushType: 'stroke',
          scale: 3,
        },
        label: {
          show: true,
          position: 'right',
          distance: 8,
          formatter: '{b}',
          color: '#d9f7ff',
          fontSize: 11,
        },
        itemStyle: {
          color: '#75ecff',
          shadowBlur: 20,
          shadowColor: 'rgba(108, 231, 255, 0.7)',
        },
        emphasis: {
          scale: true,
        },
      },
    ],
  };

  return (
    <div className={styles.card}>
      <div className={styles.legend}>
        <div>
          <span className={styles.legendDot} />
          城市热点
        </div>
        <div>点击省份查看概览，点击城市查看天气与景区详情</div>
      </div>
      <ReactECharts
        className={styles.chart}
        style={{ height: '100%', width: '100%' }}
        option={option}
        onEvents={{
          click: (params: { seriesName: string; name: string; data?: { province?: string } }) => {
            if (params.seriesName === '城市') {
              const province = params.data?.province ?? selectedProvince;
              onCitySelect(province, params.name);
              return;
            }

            onProvinceSelect(normalizeRegionName(params.name));
          },
        }}
      />
    </div>
  );
}
