import { Suspense, lazy, useEffect, useState } from 'react';
import { AttractionList } from './components/AttractionList';
import { CrowdCard } from './components/CrowdCard';
import { Layout } from './components/Layout';
import { SearchBar } from './components/SearchBar';
import { WeatherCard } from './components/WeatherCard';
import { getAttractionCandidatesByCity } from './data/attractionCandidates';
import { mockCrowdData } from './data/mockCrowd';
import { cityDirectory } from './data/regionDirectory';
import { crowdService } from './services/crowdService';
import { weatherService } from './services/weatherService';
import type { AttractionCrowdData, ProvinceWeatherOverview, SearchResult, WeatherData } from './types';
import { averageTrend, buildTravelTips, normalizeRegionName } from './utils/format';
import styles from './App.module.css';

const ChinaMap = lazy(async () => {
  const module = await import('./components/ChinaMap');
  return { default: module.ChinaMap };
});

const TrendChart = lazy(async () => {
  const module = await import('./components/TrendChart');
  return { default: module.TrendChart };
});

function App() {
  const [selectedProvince, setSelectedProvince] = useState('北京');
  const [selectedCity, setSelectedCity] = useState<string | undefined>('北京');
  const [selectedAttractionId, setSelectedAttractionId] = useState<string | undefined>();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [provinceOverview, setProvinceOverview] = useState<ProvinceWeatherOverview | null>(null);
  const [attractions, setAttractions] = useState<AttractionCrowdData[]>([]);
  const [searchStatus, setSearchStatus] = useState('默认展示北京样例，可搜索其他省份、城市或景点。');
  const [isSearchEmpty, setIsSearchEmpty] = useState(false);
  const [focusResult, setFocusResult] = useState<SearchResult | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const nextProvinceOverview = await weatherService.getProvinceOverview(selectedProvince);
      setProvinceOverview(nextProvinceOverview);

      if (selectedCity) {
        const [nextWeather, nextCrowd] = await Promise.all([
          weatherService.getCityWeather(selectedCity),
          crowdService.getByCity(selectedCity),
        ]);
        setWeather(nextWeather);
        setAttractions([...nextCrowd].sort((left, right) => right.realtimeCongestion - left.realtimeCongestion));
        return;
      }

      const provinceCrowd = await crowdService.getByProvince(selectedProvince);
      setWeather(null);
      setAttractions([...provinceCrowd].sort((left, right) => right.realtimeCongestion - left.realtimeCongestion));
    };

    void loadData();
  }, [selectedCity, selectedProvince]);

  const activeAttraction =
    attractions.find((item) => item.id === selectedAttractionId) ??
    mockCrowdData.find((item) => item.id === selectedAttractionId) ??
    null;

  const trendData = activeAttraction ? activeAttraction.trend : attractions.length ? averageTrend(attractions) : [];
  const attractionCandidates = selectedCity ? getAttractionCandidatesByCity(selectedCity) : [];
  const tips = buildTravelTips({
    temperature: weather?.temperature ?? provinceOverview?.averageTemperature ?? undefined,
    condition: weather?.condition ?? provinceOverview?.weatherSummary,
    topCongestion: attractions[0]?.realtimeCongestion,
  });

  const selectProvince = (province: string) => {
    setSelectedProvince(province);
    setSelectedCity(undefined);
    setSelectedAttractionId(undefined);
    setFocusResult({
      type: 'province',
      label: province,
      province,
    });
    setSearchStatus(`已切换到 ${province} 省级视图。`);
    setIsSearchEmpty(false);
  };

  const selectCity = (province: string, city: string) => {
    setSelectedProvince(province);
    setSelectedCity(city);
    setSelectedAttractionId(undefined);
    const cityMeta = cityDirectory.find((item) => item.city === city);
    setFocusResult({
      type: 'city',
      label: city,
      province,
      city,
      center: cityMeta?.center,
    });
    setSearchStatus(`已定位到 ${province} · ${city}。`);
    setIsSearchEmpty(false);
  };

  const resetMapView = () => {
    setFocusResult(null);
    setSearchStatus('已返回全国视图，右侧数据保持当前选中地区。');
    setIsSearchEmpty(false);
  };

  const handleSearch = (keyword: string) => {
    const trimmed = keyword.trim();

    if (!trimmed) {
      setSearchStatus('请输入省份、城市或景点名称。');
      setIsSearchEmpty(true);
      return;
    }

    const normalized = normalizeRegionName(trimmed);
    const cityMatch = cityDirectory.find((item) => {
      const aliases = item.aliases ?? [];
      return [item.city, ...aliases].some((name) => name.includes(trimmed) || normalizeRegionName(name).includes(normalized));
    });

    if (cityMatch) {
      selectCity(cityMatch.province, cityMatch.city);
      return;
    }

    const attractionMatch = mockCrowdData.find((item) => item.attractionName.includes(trimmed));
    if (attractionMatch) {
      setSelectedProvince(attractionMatch.province);
      setSelectedCity(attractionMatch.city);
      setSelectedAttractionId(attractionMatch.id);
      const cityMeta = cityDirectory.find((item) => item.city === attractionMatch.city);
      setFocusResult({
        type: 'attraction',
        label: attractionMatch.attractionName,
        province: attractionMatch.province,
        city: attractionMatch.city,
        attractionId: attractionMatch.id,
        center: cityMeta?.center,
      });
      setSearchStatus(`已定位到景点 ${attractionMatch.attractionName}。`);
      setIsSearchEmpty(false);
      return;
    }

    const provinceMatch = Array.from(new Set(cityDirectory.map((item) => item.province))).find(
      (province) => province.includes(trimmed) || province.includes(normalized),
    );

    if (provinceMatch) {
      selectProvince(provinceMatch);
      return;
    }

    setSearchStatus(`没有找到 “${trimmed}” 对应的省份、城市或景点。可以试试 “大连”“营口”“千山风景区”。`);
    setIsSearchEmpty(true);
  };

  return (
    <Layout headerExtras={<SearchBar onSearch={handleSearch} statusText={searchStatus} isEmptyState={isSearchEmpty} />}>
      <div className={styles.dashboard}>
        <div className={styles.mapColumn}>
          <Suspense fallback={<section className={styles.glassCard}>地图加载中…</section>}>
            <ChinaMap
              selectedProvince={selectedProvince}
              selectedCity={selectedCity}
              focusResult={focusResult}
              onProvinceSelect={selectProvince}
              onCitySelect={selectCity}
              onResetView={resetMapView}
            />
          </Suspense>
        </div>
        <div className={styles.panelColumn}>
          <WeatherCard weather={weather} provinceOverview={provinceOverview} />
          <CrowdCard attractions={attractions} />
          <AttractionList attractions={attractions} candidates={attractionCandidates} />
          <section className={styles.glassCard}>
            <div className={styles.panelHead}>
              <div>
                <h3>推荐出行提示</h3>
                <div className={styles.caption}>依据当前天气和最高拥挤度自动生成</div>
              </div>
            </div>
            <div className={styles.tips}>
              {tips.map((tip) => (
                <div className={styles.tip} key={tip}>
                  {tip}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      <div className={styles.trendRow}>
        <Suspense fallback={<section className={styles.glassCard}>趋势图加载中…</section>}>
          <TrendChart
            data={trendData}
            title={activeAttraction ? `${activeAttraction.attractionName} 拥挤趋势` : '今日拥挤趋势'}
          />
        </Suspense>
      </div>
    </Layout>
  );
}

export default App;
