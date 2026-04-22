'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button } from '@/components/common/UIAtoms';
import { tasks as tasksApi } from '@/lib/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import styles from './MyTasks.module.css';
import Link from 'next/link';

const STATUS_MAP = {
  Active: ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'UNDER_REVIEW'],
  Completed: ['COMPLETED'],
  'Disputed': ['DISPUTED', 'CANCELLED', 'REFUNDED', 'BLOCKED'],
};

export default function MyTasksPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'All', label: 'All Tasks', icon: 'list_alt' },
    { id: 'Active', label: 'Active', icon: 'hourglass_top' },
    { id: 'Completed', label: 'Completed', icon: 'check_circle' },
    { id: 'Disputed', label: 'Disputed / Cancelled', icon: 'gavel' },
  ];

  useEffect(() => {
    if (!user) return;

    async function fetchMyTasks() {
      try {
        const statuses = [
          'DRAFT', 'OPEN', 'ACCEPTED', 'IN_PROGRESS', 'PROOF_SUBMITTED',
          'UNDER_REVIEW', 'COMPLETED', 'DISPUTED', 'CANCELLED', 'REFUNDED',
        ];
        const results = await Promise.all(
          statuses.map(status =>
            tasksApi.list({ status, limit: 50 }).catch(() => ({ data: [] }))
          )
        );

        const all = results.flatMap(r => r.data || []);
        const mine = all.filter(t =>
          t.requester?.id === user.id || t.executor?.id === user.id
        );

        setAllTasks(mine);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMyTasks();
  }, [user]);

  const filteredTasks = allTasks.filter(task => {
    if (activeTab === 'All') return true;
    const statusGroup = STATUS_MAP[activeTab];
    return statusGroup?.includes(task.status);
  });

  const badgeVariant = (status) => {
    if (status === 'COMPLETED') return 'success';
    if (['DISPUTED', 'CANCELLED', 'BLOCKED', 'REFUNDED'].includes(status)) return 'danger';
    return 'purple';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>My Tasks</h1>
        <p className={styles.subtitle}>Manage your active and past delegations.</p>
      </header>

      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="material-symbols-outlined">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {filteredTasks.length > 0 ? (
          <div className={styles.grid}>
            {filteredTasks.map(task => (
              <Card key={task.id} className={styles.taskItem} hover>
                <div className={styles.itemHeader}>
                  <Badge variant={badgeVariant(task.status)}>
                    {task.status.replace(/_/g, ' ')}
                  </Badge>
                  <span className={styles.price}>{formatCurrency(task.budget)}</span>
                </div>
                
                <h3 className={styles.taskTitle}>{task.title}</h3>
                
                <div className={styles.itemBody}>
                  <div className={styles.meta}>
                    <span className="material-symbols-outlined">schedule</span>
                    <span>Due {formatDate(task.deadline)}</span>
                  </div>
                  <div className={styles.meta}>
                    <span className="material-symbols-outlined">person</span>
                    <span>Role: {task.requester?.id === user?.id ? 'Requester' : 'Executor'}</span>
                  </div>
                </div>

                <div className={styles.itemActions}>
                  <Button variant="secondary" href={`/tasks/${task.id}`} style={{ width: '100%' }}>
                    Manage Task
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-tertiary)' }}>
              {activeTab === 'Completed' ? 'done_all' : 
               activeTab === 'Disputed' ? 'gavel' : 'search_off'}
            </span>
            <h3>No tasks found</h3>
            <p>
              You don't have any {activeTab === 'All' ? '' : activeTab.toLowerCase()} tasks right now.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'center' }}>
              <Button href="/tasks/create">Post a Task</Button>
              <Button variant="secondary" href="/tasks/browse">Browse Market</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
