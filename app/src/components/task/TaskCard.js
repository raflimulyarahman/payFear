import Link from 'next/link';
import { Card, Badge } from '../common/UIAtoms';
import RiskPill from './RiskPill';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import styles from './TaskCard.module.css';

export default function TaskCard({ task }) {
  return (
    <Card hover className={styles.card}>
      <div className={styles.header}>
        <RiskPill level={task.risk} showLabel={false} />
        <span className={styles.price}>{formatCurrency(task.budget)}</span>
      </div>
      
      <h3 className={styles.title}>{task.title}</h3>
      <p className={styles.description}>{task.description}</p>
      
      <div className={styles.footer}>
        <div className={styles.info}>
          <span className="material-symbols-outlined">schedule</span>
          <span>{formatDate(task.deadline)}</span>
        </div>
        <Link href={`/tasks/${task.id}`} className={styles.action}>
          View Details
        </Link>
      </div>
    </Card>
  );
}
