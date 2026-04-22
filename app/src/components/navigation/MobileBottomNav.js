'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './MobileBottomNav.module.css';

const items = [
  { href: '/dashboard', icon: 'grid_view', label: 'Home' },
  { href: '/tasks/browse', icon: 'search', label: 'Browse' },
  { href: '/tasks/create', icon: 'add_circle', label: 'Create', fab: true },
  { href: '/my-tasks', icon: 'list_alt', label: 'Tasks' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <nav className={styles.nav}>
      {items.map(item => {
        if (item.href === '/tasks/create' && user?.role === 'executor') return null;
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.item} ${isActive ? styles.active : ''} ${item.fab ? styles.fab : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: item.fab ? 28 : 24 }}>
              {item.icon}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
