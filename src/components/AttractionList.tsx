import type { AttractionCandidate, AttractionCrowdData } from '../types';
import { formatNumber } from '../utils/format';
import styles from './AttractionList.module.css';

interface AttractionListProps {
  attractions: AttractionCrowdData[];
  candidates?: AttractionCandidate[];
}

export function AttractionList({ attractions, candidates = [] }: AttractionListProps) {
  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <div>
          <h3>{attractions.length ? '景点列表' : '候选景点'}</h3>
          <div className={styles.caption}>
            {attractions.length ? '点击城市后展示当前城市的主要景点' : '已联网整理部分地级市候选景点，方便后续接入人流量'}
          </div>
        </div>
        <div className={styles.caption}>{attractions.length ? `${attractions.length} 个样例景点` : `${candidates.length} 个候选景点`}</div>
      </div>
      <div className={styles.list}>
        {attractions.length ? (
          attractions.map((item) => (
            <article className={styles.item} key={item.id}>
              <h4>{item.attractionName}</h4>
              <div className={styles.meta}>
                <span>{item.city}</span>
                <span>估算人数 {formatNumber(item.currentVisitors)}</span>
                <span>更新时间 {item.updatedAt}</span>
              </div>
            </article>
          ))
        ) : candidates.length ? (
          candidates.map((item) => (
            <article className={styles.item} key={item.id}>
              <h4>{item.attractionName}</h4>
              <div className={styles.meta}>
                <span>
                  {item.province} · {item.city}
                </span>
                <a className={styles.link} href={item.sourceUrl} target="_blank" rel="noreferrer">
                  {item.sourceName}
                </a>
              </div>
              {item.note ? <div className={styles.note}>{item.note}</div> : null}
            </article>
          ))
        ) : (
          <div className={styles.caption}>当前地区暂无景点样例，可后续接入景区官方接口或文旅平台数据。</div>
        )}
      </div>
    </section>
  );
}
