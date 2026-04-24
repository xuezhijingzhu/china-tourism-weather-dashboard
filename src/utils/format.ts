import type { AttractionCrowdData, CrowdLevel, TrendPoint } from '../types';

export const normalizeRegionName = (value: string) =>
  value.trim().replace(/(省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区)$/u, '');

export const formatPercent = (value: number) => `${value}%`;

export const formatNumber = (value: number) => new Intl.NumberFormat('zh-CN').format(value);

export const buildCrowdLevelTone = (level: CrowdLevel) => {
  switch (level) {
    case '舒适':
      return 'comfort';
    case '正常':
      return 'normal';
    case '较拥挤':
      return 'busy';
    case '拥挤':
      return 'crowded';
    case '严重拥挤':
      return 'serious';
    default:
      return 'normal';
  }
};

export const averageTrend = (items: AttractionCrowdData[]): TrendPoint[] =>
  (items[0]?.trend ?? []).map((point, index) => {
    const total = items.reduce((sum, item) => sum + item.trend[index].value, 0);
    return {
      time: point.time,
      value: Math.round(total / items.length),
    };
  });

export const buildTravelTips = ({
  temperature,
  condition,
  topCongestion,
}: {
  temperature?: number;
  condition?: string;
  topCongestion?: number;
}) => {
  const tips: string[] = [];

  if (condition && /(雨|雪)/u.test(condition)) {
    tips.push('天气存在降水，建议携带雨具并预留更多通行时间。');
  }

  if (typeof topCongestion === 'number' && topCongestion >= 80) {
    tips.push('热门景区拥挤度较高，建议错峰出行并优先预约。');
  }

  if (typeof temperature === 'number' && temperature >= 30) {
    tips.push('气温偏高，注意防晒补水，优先选择早晚时段出行。');
  }

  if (typeof temperature === 'number' && temperature <= 10) {
    tips.push('气温较低，建议增加保暖层并关注室外停留时间。');
  }

  if (tips.length === 0) {
    tips.push('当前天气与景区压力较平稳，适合常规出行节奏。');
  }

  return tips;
};
