import type { AttractionCrowdData } from '../types';
import { buildCrowdLevelTone, formatNumber, formatPercent } from '../utils/format';
import styles from './CrowdCard.module.css';

interface CrowdCardProps {
  attractions: AttractionCrowdData[];
}

export function CrowdCard({ attractions }: CrowdCardProps) {
  const topAttractions = attractions.slice(0, 3);

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <div>
          <h3>热门景点人流排行</h3>
          <div className={styles.meta}>当前为 mock 人流数据，请勿视作真实实时客流</div>
        </div>
        <div className={styles.meta}>Top {topAttractions.length}</div>
      </div>
      {topAttractions.length ? (
        topAttractions.map((item) => {
          const toneClass = styles[buildCrowdLevelTone(item.level)];

          return (
            <article className={styles.item} key={item.id}>
              <div className={styles.row}>
                <h4>{item.attractionName}</h4>
                <span className={`${styles.tag} ${toneClass}`}>{item.level}</span>
              </div>
              <div className={styles.bar}>
                <span style={{ width: `${item.realtimeCongestion}%` }} />
              </div>
              <div className={styles.stats}>
                <span>拥挤度 {formatPercent(item.realtimeCongestion)}</span>
                <span>
                  {formatNumber(item.currentVisitors)} / {formatNumber(item.maxCapacity)} 人
                </span>
              </div>
            </article>
          );
        })
      ) : (
        <div className={styles.meta}>当前地区暂无景点 mock 数据。</div>
      )}
    </section>
  );
}
