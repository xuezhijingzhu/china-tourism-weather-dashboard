import { useState } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  statusText?: string;
  isEmptyState?: boolean;
}

export function SearchBar({ onSearch, statusText, isEmptyState = false }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');

  return (
    <div className={styles.panel}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          onSearch(keyword);
        }}
      >
        <input
          className={styles.input}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索省份、城市或景点，例如：杭州 / 西湖 / 广东"
        />
        <button className={styles.button} type="submit">
          搜索
        </button>
      </form>
      <p className={styles.hint}>支持按省份、城市、景点名称检索并高亮定位，未接入真实 API 前均为 mock 演示数据。</p>
      <div className={`${styles.status} ${isEmptyState ? styles.empty : ''}`}>{statusText}</div>
    </div>
  );
}
