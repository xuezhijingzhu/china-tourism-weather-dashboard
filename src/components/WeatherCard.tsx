import type { ProvinceWeatherOverview, WeatherData } from '../types';
import styles from './WeatherCard.module.css';

interface WeatherCardProps {
  weather: WeatherData | null;
  provinceOverview: ProvinceWeatherOverview | null;
}

export function WeatherCard({ weather, provinceOverview }: WeatherCardProps) {
  if (weather) {
    const isLive = !weather.isMock;

    return (
      <section className={styles.card}>
        <p className={styles.eyebrow}>Weather Overview</p>
        <div className={styles.titleRow}>
          <div>
            <h2 className={styles.city}>{weather.city}</h2>
            <p className={styles.condition}>
              {weather.province} · {weather.condition}
            </p>
          </div>
          <div className={styles.temp}>{weather.temperature}°C</div>
        </div>
        <div className={styles.grid}>
          <div className={styles.metric}>
            <span>湿度</span>
            <strong>{weather.humidity}%</strong>
          </div>
          <div className={styles.metric}>
            <span>风向</span>
            <strong>{weather.windDirection}</strong>
          </div>
          <div className={styles.metric}>
            <span>风力</span>
            <strong>{weather.windPower}</strong>
          </div>
        </div>
        <p className={styles.footnote}>
          更新时间：{weather.updatedAt} · 数据来源：{isLive ? '和风天气实时接口（经服务端代理）' : 'Mock 演示数据'}。
          天气实况通常可能存在数分钟延迟。
        </p>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Province Snapshot</p>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.city}>{provinceOverview?.province ?? '未选择地区'}</h2>
          <p className={styles.condition}>{provinceOverview?.weatherSummary ?? '请选择地图上的省份或城市查看天气概览。'}</p>
        </div>
        <div className={styles.temp}>
          {provinceOverview?.averageTemperature !== null && provinceOverview?.averageTemperature !== undefined
            ? `${provinceOverview.averageTemperature}°C`
            : '--'}
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.metric}>
          <span>重点城市</span>
          <strong>{provinceOverview?.cities.length ? provinceOverview.cities.join(' / ') : '暂无'}</strong>
        </div>
        <div className={styles.metric}>
          <span>更新时间</span>
          <strong>{provinceOverview?.updatedAt ?? '未生成'}</strong>
        </div>
        <div className={styles.metric}>
          <span>数据模式</span>
          <strong>{provinceOverview?.isMock ? 'Mock' : 'Live'}</strong>
        </div>
      </div>
      <p className={styles.footnote}>
        提示：省级概览由当前收录城市聚合生成。
        {provinceOverview?.isMock ? ' 当前未命中实时天气，已自动回退到 mock 数据。' : ' 当前天气已通过服务端代理接入真实接口。'}
      </p>
    </section>
  );
}
