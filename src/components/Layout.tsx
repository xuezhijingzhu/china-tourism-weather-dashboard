import type { PropsWithChildren, ReactNode } from 'react';
import styles from './Layout.module.css';

interface LayoutProps extends PropsWithChildren {
  headerExtras?: ReactNode;
}

export function Layout({ children, headerExtras }: LayoutProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.topbar}>
          <div className={styles.titleWrap}>
            <div className={styles.badge}>China Tourism Weather Dashboard</div>
            <h1>中国旅游天气与景区人流可视化大屏</h1>
            <p>
              面向大屏展示与移动访问的前端 demo。地图、天气与景区人流均已解耦，当前显式使用 mock
              数据，方便后续接入真实 API。
            </p>
          </div>
          {headerExtras}
        </div>
        {children}
      </div>
    </div>
  );
}
