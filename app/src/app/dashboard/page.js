'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Badge } from '@/components/common/UIAtoms';
import { tasks as tasksApi } from '@/lib/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { timeAgo } from '@/utils/formatDate';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchTasks() {
      try {
        // Fetch tasks across relevant statuses
        const statuses = ['OPEN', 'ACCEPTED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'UNDER_REVIEW', 'COMPLETED', 'DISPUTED'];
        const results = await Promise.all(
          statuses.map(status => 
            tasksApi.list({ status, limit: 50 }).catch(() => ({ data: [] }))
          )
        );

        const allTasks = results.flatMap(r => r.data || []);
        
        // Filter to tasks the user is involved in
        const relevant = allTasks.filter(t => 
          t.requester?.id === user.id || t.executor?.id === user.id
        );

        setMyTasks(relevant);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [user]);

  const activeTasks = myTasks.filter(t => 
    ['ACCEPTED', 'IN_PROGRESS', 'PROOF_SUBMITTED', 'UNDER_REVIEW'].includes(t.status)
  );
  const completedTasks = myTasks.filter(t => t.status === 'COMPLETED');

  const isRequester = user?.role === 'REQUESTER';

  const stats = isRequester ? [
    { label: 'Total Spent', value: formatCurrency(user?.totalSpent || 0), icon: 'payments', color: 'var(--amber-400)' },
    { label: 'Active Tasks', value: activeTasks.length, icon: 'assignment', color: 'var(--purple-400)' },
    { label: 'Completed', value: completedTasks.length, icon: 'task_alt', color: 'var(--success)' },
  ] : [
    { label: 'Total Earned', value: formatCurrency(user?.totalEarned || 0), icon: 'account_balance_wallet', color: 'var(--amber-400)' },
    { label: 'Active Jobs', value: activeTasks.length, icon: 'work', color: 'var(--purple-400)' },
    { label: 'Rating', value: `${user?.rating || 0} / 5`, icon: 'star', color: 'var(--purple-400)' },
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className={styles.subtitle}>Here is what's happening with your tasks today.</p>
        </div>
        {isRequester && (
          <Button href="/tasks/create" icon="add">Post New Task</Button>
        )}
      </header>

      <section className={styles.statsGrid}>
        {stats.map((stat, i) => (
          <Card key={i} className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: `${stat.color}15`, color: stat.color }}>
              <span className="material-symbols-outlined">{stat.icon}</span>
            </div>
            <div>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>{stat.value}</p>
            </div>
          </Card>
        ))}
      </section>

      <div className={styles.mainGrid}>
        <section className={styles.activeSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Active {isRequester ? 'Tasks' : 'Jobs'}</h2>
            <Link href="/my-tasks" className={styles.viewAll}>View all</Link>
          </div>
          <div className={styles.activeList}>
            {activeTasks.length > 0 ? activeTasks.slice(0, 3).map(task => (
              <Card key={task.id} className={styles.activeCard} hover>
                <div className={styles.activeCardHeader}>
                  <Badge variant={
                    task.status === 'IN_PROGRESS' ? 'purple' : 
                    task.status === 'PROOF_SUBMITTED' || task.status === 'UNDER_REVIEW' ? 'amber' : 'purple'
                  }>{task.status.replace(/_/g, ' ')}</Badge>
                  <span className={styles.activePrice}>{formatCurrency(task.budget)}</span>
                </div>
                <h3 className={styles.activeTitle}>{task.title}</h3>
                <div className={styles.activeFooter}>
                  <p className={styles.activeTime}>Created {timeAgo(task.createdAt)}</p>
                  <Link href={`/tasks/${task.id}`} className={styles.detailsBtn}>Details</Link>
                </div>
              </Card>
            )) : (
              <div className={styles.empty}>
                <p>No active {isRequester ? 'tasks' : 'jobs'} at the moment.</p>
                {isRequester ? (
                  <Link href="/tasks/create" style={{ color: 'var(--purple-400)', fontWeight: 600 }}>Create your first task</Link>
                ) : (
                  <Link href="/tasks/browse" style={{ color: 'var(--purple-400)', fontWeight: 600 }}>Browse the market</Link>
                )}
              </div>
            )}
          </div>
        </section>

        <section className={styles.activitySection}>
          <h2 className={styles.sectionTitle}>Recently Completed</h2>
          <div className={styles.activityList}>
            {completedTasks.length > 0 ? completedTasks.slice(0, 5).map(task => (
              <div key={task.id} className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityContent}>
                  <div className={styles.activityHeader}>
                    <p className={styles.activityEvent}>{task.title}</p>
                    <span className={styles.activityTime}>{formatCurrency(task.budget)}</span>
                  </div>
                  <p className={styles.activityTask}>
                    {isRequester ? `Executor: ${task.executor?.name || 'N/A'}` : `Requester: ${task.requester?.name || 'N/A'}`}
                  </p>
                </div>
              </div>
            )) : (
              <div className={styles.empty}>
                <p>No completed tasks yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
