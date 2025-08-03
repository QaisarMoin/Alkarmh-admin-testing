import React from 'react';
import styles from './FancyLoader.module.css';

const FancyLoader = () => (
  <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className={styles.loaderCon}>
      <div style={{ '--i': 0 }} className={styles.pfile}></div>
      <div style={{ '--i': 1 }} className={styles.pfile}></div>
      <div style={{ '--i': 2 }} className={styles.pfile}></div>
      <div style={{ '--i': 3 }} className={styles.pfile}></div>
      <div style={{ '--i': 4 }} className={styles.pfile}></div>
      <div style={{ '--i': 5 }} className={styles.pfile}></div>
    </div>
  </div>
);

export default FancyLoader; 