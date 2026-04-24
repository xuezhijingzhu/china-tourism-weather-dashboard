import ReactECharts from 'echarts-for-react';
import type { TrendPoint } from '../types';
import styles from './TrendChart.module.css';

interface TrendChartProps {
  data: TrendPoint[];
  title?: string;
}

export function TrendChart({ data, title = '今日拥挤趋势' }: TrendChartProps) {
  const option = {
    backgroundColor: 'transparent',
    grid: { top: 34, left: 28, right: 18, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(5, 16, 27, 0.92)',
      borderColor: 'rgba(99, 196, 255, 0.28)',
      textStyle: { color: '#d9f1ff' },
    },
    xAxis: {
      type: 'category',
      data: data.map((item) => item.time),
      axisLabel: { color: 'rgba(211, 228, 248, 0.76)' },
      axisLine: { lineStyle: { color: 'rgba(120, 180, 235, 0.26)' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: 'rgba(211, 228, 248, 0.76)', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(120, 180, 235, 0.12)' } },
    },
    series: [
      {
        type: 'line',
        smooth: true,
        data: data.map((item) => item.value),
        lineStyle: {
          width: 3,
          color: '#72d8ff',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(114, 216, 255, 0.45)' },
              { offset: 1, color: 'rgba(114, 216, 255, 0.03)' },
            ],
          },
        },
        showSymbol: true,
        symbolSize: 7,
        itemStyle: {
          color: '#7cf3ff',
        },
      },
    ],
  };

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <div>
          <h3>{title}</h3>
          <div className={styles.caption}>基于当前筛选景点聚合生成的 mock 趋势</div>
        </div>
      </div>
      <ReactECharts style={{ height: 260, width: '100%' }} option={option} />
    </section>
  );
}
