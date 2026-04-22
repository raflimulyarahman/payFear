'use client';
import { useState } from 'react';
import { Card } from '../common/UIAtoms';
import styles from './SafetyChecklist.module.css';

export default function SafetyChecklist({ items = [], onComplete }) {
  const [checked, setChecked] = useState({});

  const toggle = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    
    // If all required items are checked
    const allDone = items.every(item => next[item.id]);
    if (allDone && onComplete) onComplete(true);
    else if (onComplete) onComplete(false);
  };

  return (
    <div className={styles.container}>
      {items.map(item => (
        <label key={item.id} className={`${styles.item} ${checked[item.id] ? styles.active : ''}`}>
          <input 
            type="checkbox" 
            checked={!!checked[item.id]} 
            onChange={() => toggle(item.id)} 
            className="hidden"
          />
          <div className={styles.checkbox}>
            {checked[item.id] && <span className="material-symbols-outlined">check</span>}
          </div>
          <div className={styles.content}>
            <p className={styles.label}>{item.label}</p>
            {item.description && <p className={styles.description}>{item.description}</p>}
          </div>
        </label>
      ))}
    </div>
  );
}
