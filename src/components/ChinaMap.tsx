import { useEffect, useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { CanvasRenderer } from 'echarts/renderers';
import { EffectScatterChart, MapChart } from 'echarts/charts';
import { GeoComponent, TooltipComponent, type TooltipComponentOption } from 'echarts/components';
import { init, registerMap, use as registerEChartsModules, type ComposeOption } from 'echarts/core';
import chinaGeo from '../data/chinaGeo.json';
import { cityDirectory } from '../data/regionDirectory';
import type { SearchResult } from '../types';
import { normalizeRegionName } from '../utils/format';
import styles from './ChinaMap.module.css';

registerEChartsModules([CanvasRenderer, GeoComponent, TooltipComponent, MapChart, EffectScatterChart]);
registerMap('china-dashboard', chinaGeo as never);

type ChinaMapOption = ComposeOption<TooltipComponentOption>;

interface ChinaMapProps {
  selectedProvince: string;
  selectedCity?: string;
  focusResult?: SearchResult | null;
  onProvinceSelect: (province: string) => void;
  onCitySelect: (province: string, city: string) => void;
  onResetView: () => void;
}

interface ProvinceMeta {
  adcode: string;
  center: [number, number];
}

interface GeoFeatureProperties {
  adcode?: number | string;
  name?: string;
  center?: [number, number];
}

interface GeoFeature {
  properties?: GeoFeatureProperties;
}

interface GeoJsonLike {
  features?: GeoFeature[];
}

interface DrilldownState {
  mapName: string;
  cityNames: string[];
}

const nationalGeo = chinaGeo as GeoJsonLike;

const provinceMetaMap = (nationalGeo.features ?? []).reduce<Record<string, ProvinceMeta>>((accumulator, feature) => {
  const properties = feature.properties ?? {};
  const name = normalizeRegionName(String(properties.name ?? ''));
  const center = properties.center;
  const adcode = properties.adcode;

  if (name && center && adcode) {
    accumulator[name] = {
      adcode: String(adcode),
      center,
    };
  }

  return accumulator;
}, {});

const cityMarkers = cityDirectory.map((item, index) => ({
  name: item.city,
  value: [item.center[0], item.center[1], 18 + (index % 12)],
  province: item.province,
}));

const drilldownCache = new Map<string, DrilldownState>();

const extractCityNames = (geoJson: GeoJsonLike) =>
  (geoJson.features ?? [])
    .map((feature) => normalizeRegionName(String(feature.properties?.name ?? '')))
    .filter(Boolean);

export function ChinaMap({
  selectedProvince,
  selectedCity,
  focusResult,
  onProvinceSelect,
  onCitySelect,
  onResetView,
}: ChinaMapProps) {
  const [drilldown, setDrilldown] = useState<DrilldownState | null>(null);

  const shouldDrillDown = Boolean(focusResult?.type && selectedProvince);
  const activeProvinceMeta = provinceMetaMap[selectedProvince];
  const cachedDrilldown =
    shouldDrillDown && activeProvinceMeta ? drilldownCache.get(activeProvinceMeta.adcode) ?? null : null;
  const activeDrilldown = shouldDrillDown ? drilldown ?? cachedDrilldown : null;

  useEffect(() => {
    if (!shouldDrillDown) {
      return;
    }

    if (!activeProvinceMeta) {
      return;
    }

    if (drilldownCache.has(activeProvinceMeta.adcode)) {
      return;
    }

    const controller = new AbortController();

    const loadProvinceMap = async () => {
      try {
        const response = await fetch(`https://geo.datav.aliyun.com/areas_v3/bound/${activeProvinceMeta.adcode}_full.json`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load province geojson: ${response.status}`);
        }

        const geoJson = (await response.json()) as GeoJsonLike;
        const mapName = `china-dashboard-${activeProvinceMeta.adcode}`;
        registerMap(mapName, geoJson as never);

        const nextDrilldown: DrilldownState = {
          mapName,
          cityNames: extractCityNames(geoJson),
        };

        drilldownCache.set(activeProvinceMeta.adcode, nextDrilldown);
        setDrilldown(nextDrilldown);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.warn('[ChinaMap] failed to load province drilldown map:', error);
        }
      }
    };

    void loadProvinceMap();

    return () => controller.abort();
  }, [activeProvinceMeta, shouldDrillDown]);

  const mapName = activeDrilldown?.mapName ?? 'china-dashboard';

  const mapCenter: [number, number] = useMemo(() => {
    if (focusResult?.center) {
      return focusResult.center;
    }

    if (activeDrilldown && activeProvinceMeta) {
      return activeProvinceMeta.center;
    }

    return [104.114129, 37.550339];
  }, [activeDrilldown, activeProvinceMeta, focusResult]);

  const zoom = activeDrilldown
    ? focusResult?.type === 'city' || focusResult?.type === 'attraction'
      ? 1.95
      : 1.55
    : 1.16;

  const visibleMarkers = activeDrilldown
    ? cityMarkers.filter((item) => item.province === selectedProvince || activeDrilldown.cityNames.includes(item.name))
    : cityMarkers;

  const option: ChinaMapOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(5, 16, 27, 0.92)',
      borderColor: 'rgba(99, 196, 255, 0.28)',
      textStyle: { color: '#d9f1ff' },
      formatter: (params: { name?: string; seriesName?: string } | Array<{ name?: string }>) => {
        if (Array.isArray(params)) {
          return params[0]?.name ?? '';
        }

        if (params.seriesName === '城市热点') {
          return `${params.name ?? ''}<br />点击查看城市天气与景区详情`;
        }

        return `${normalizeRegionName(params.name ?? '')}<br />点击查看区域详情`;
      },
    },
    geo: {
      map: mapName,
      roam: true,
      center: mapCenter,
      zoom,
      layoutCenter: ['50%', '54%'],
      layoutSize: activeDrilldown ? '122%' : '108%',
      itemStyle: {
        areaColor: '#102b45',
        borderColor: 'rgba(123, 211, 255, 0.74)',
        borderWidth: activeDrilldown ? 0.8 : 1.05,
        shadowColor: 'rgba(0, 0, 0, 0.38)',
        shadowBlur: 16,
        shadowOffsetY: 8,
      },
      emphasis: {
        label: { show: false },
        itemStyle: {
          areaColor: '#1e527f',
          borderColor: '#b8f4ff',
          shadowColor: 'rgba(74, 190, 255, 0.36)',
          shadowBlur: 24,
        },
      },
      regions: !activeDrilldown
        ? Object.entries(provinceMetaMap).map(([province]) => ({
            name: province,
            itemStyle:
              province === selectedProvince && focusResult
                ? {
                    areaColor: '#26628d',
                    borderColor: '#89eeff',
                    shadowColor: 'rgba(103, 220, 255, 0.32)',
                    shadowBlur: 28,
                  }
                : undefined,
          }))
        : undefined,
    },
    series: [
      ...(activeDrilldown
        ? [
            {
              name: '城市边界',
              type: 'map',
              map: mapName,
              geoIndex: 0,
              z: 4,
              selectedMode: false,
              label: {
                show: true,
                color: 'rgba(220, 243, 255, 0.85)',
                fontSize: 10,
                formatter: '{b}',
              },
              itemStyle: {
                areaColor: 'rgba(17, 49, 77, 0.22)',
                borderColor: 'rgba(125, 210, 255, 0.6)',
                borderWidth: 0.9,
              },
              emphasis: {
                label: {
                  show: true,
                },
                itemStyle: {
                  areaColor: 'rgba(45, 103, 150, 0.42)',
                  borderColor: '#b7f3ff',
                },
              },
              data: activeDrilldown.cityNames.map((city) => ({ name: city })),
            },
          ]
        : []),
      {
        name: '城市热点',
        type: 'effectScatter',
        coordinateSystem: 'geo',
        z: 12,
        data: visibleMarkers,
        symbolSize: (value: number[]) => {
          const cityName = visibleMarkers.find((item) => item.value[0] === value[0] && item.value[1] === value[1])?.name;
          return cityName === selectedCity ? 16 : activeDrilldown ? 10 : 8;
        },
        rippleEffect: {
          brushType: 'stroke',
          scale: 3,
        },
        label: {
          show: true,
          position: 'right',
          distance: 8,
          formatter: (params: { name?: string; value?: number[] }) => {
            if (activeDrilldown) {
              return params.name ?? '';
            }

            const longitude = Array.isArray(params.value) ? params.value[0] : 0;
            return longitude <= 112 ? params.name ?? '' : '';
          },
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
          {activeDrilldown ? '地级市边界' : '城市热点'}
        </div>
        <div>{activeDrilldown ? '当前为省级下钻视图，可直接点地级市边界或城市热点' : '点击省份下钻，再点击城市查看天气与景区详情'}</div>
      </div>
      {activeDrilldown ? (
        <div className={styles.toolbar}>
          <button className={styles.button} type="button" onClick={onResetView}>
            返回全国
          </button>
        </div>
      ) : null}
      <ReactECharts
        className={styles.chart}
        style={{ height: '100%', width: '100%' }}
        option={option}
        opts={{ renderer: 'canvas' }}
        lazyUpdate
        echarts={init as never}
        onEvents={{
          click: (params: { name: string; seriesName?: string; data?: { province?: string } }) => {
            if (params.seriesName === '城市热点') {
              const province = params.data?.province ?? selectedProvince;
              onCitySelect(province, normalizeRegionName(params.name));
              return;
            }

            if (activeDrilldown) {
              onCitySelect(selectedProvince, normalizeRegionName(params.name));
              return;
            }

            onProvinceSelect(normalizeRegionName(params.name));
          },
        }}
      />
    </div>
  );
}
