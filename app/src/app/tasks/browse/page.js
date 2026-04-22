'use client';
import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge } from '@/components/common/UIAtoms';
import { CATEGORIES } from '@/utils/constants';
import { useToast } from '@/context/ToastContext';
import styles from './BrowseTasks.module.css';
import TaskCard from '@/components/task/TaskCard';
import { tasks as tasksApi } from '@/lib/api';

export default function BrowseTasksPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeRisk, setActiveRisk] = useState('all');
  const [taskList, setTaskList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        status: 'OPEN',
        limit: 50,
        sort: 'newest',
      };
      if (activeCategory !== 'all') params.category = activeCategory;
      if (activeRisk !== 'all') params.risk = activeRisk;
      if (search) params.search = search;

      const result = await tasksApi.list(params);
      setTaskList(result.data || []);
      setTotal(result.meta?.total || 0);
    } catch (err) {
      addToast('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeRisk, search, addToast]);

  useEffect(() => {
    const debounce = setTimeout(fetchTasks, 300);
    return () => clearTimeout(debounce);
  }, [fetchTasks]);

  // Map API task format to TaskCard expected format
  const mapTask = (task) => ({
    ...task,
    risk: task.riskLevel,
    requesterId: task.requester?.id,
    requesterName: task.requester?.name,
    requesterRating: task.requester?.rating,
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Browse Market</h1>
          <p className={styles.subtitle}>{total} opportunities available for you today</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.marketStatus}>
            <span className={styles.statusDot}></span>
            <span>Market Active</span>
          </div>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.filters}>
          <div className={styles.searchBox}>
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Search by keyword..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Task Category</h3>
            <div className={styles.filterList}>
              <button 
                className={`${styles.filterBtn} ${activeCategory === 'all' ? styles.btnActive : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                <span>All Categories</span>
                <span className={styles.count}>{total}</span>
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  className={`${styles.filterBtn} ${activeCategory === cat.id ? styles.btnActive : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.filterSection}>
            <h3 className={styles.filterTitle}>Severity Level</h3>
            <div className={styles.riskGroup}>
              {['all', 'LOW', 'MEDIUM'].map(level => (
                <button 
                  key={level}
                  className={`${styles.riskBtn} ${activeRisk === level ? styles.riskActive : ''}`}
                  onClick={() => setActiveRisk(level)}
                >
                  {level === 'all' ? 'All' : level}
                </button>
              ))}
            </div>
          </div>

          <Card className={styles.featuredCard}>
            <div className={styles.featuredBadge}>
              <span className={styles.featuredDot}></span>
              <span>Live Market</span>
            </div>
            <h4 className={styles.featuredTitle}>Tasks update in real-time</h4>
            <div className={styles.featuredFooter}>
              <span className={styles.featuredPrice}>{total} open</span>
              <span className="material-symbols-outlined">info</span>
            </div>
          </Card>
        </aside>

        <section className={styles.gridArea}>
          {loading ? (
            <div className={styles.empty}>
              <p style={{ color: 'var(--text-secondary)' }}>Loading tasks...</p>
            </div>
          ) : taskList.length > 0 ? (
            <div className={styles.grid}>
              {taskList.map(task => (
                <TaskCard key={task.id} task={mapTask(task)} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-tertiary)' }}>search_off</span>
              <h3>No tasks found</h3>
              <p>Try adjusting your search or filters to see more results.</p>
              <Button onClick={() => { setSearch(''); setActiveCategory('all'); setActiveRisk('all'); }}>Clear all filters</Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
