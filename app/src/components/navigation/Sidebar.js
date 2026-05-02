'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { href: '/dashboard', icon: 'grid_view', label: 'Dashboard' },
  { href: '/tasks/browse', icon: 'search', label: 'Browse Market' },
  { href: '/tasks/create', icon: 'add_circle', label: 'Create Task' },
  { href: '/my-tasks', icon: 'list_alt', label: 'My Tasks' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <Link href="/dashboard" className={styles.logo}>PayFear</Link>
        {user && (
          <span className={styles.roleBadge}>
            {user.role === 'REQUESTER' ? 'Requester' : 'Executor'}
          </span>
        )}
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          // Hide "Create Task" for executor, de-emphasize "Browse" for requester
          if (item.href === '/tasks/create' && user?.role === 'EXECUTOR') return null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.bottom}>
        {user && (
          <>
            <div className={styles.userInfo}>
              <img 
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=6c3baa&color=fff&size=80`} 
                alt={user.name} 
                className={styles.avatar} 
              />
              <div>
                <p className={styles.userName}>{user.name}</p>
                <p className={styles.userRole}>{user.role}</p>
              </div>
            </div>
            <button onClick={switchRole} className={styles.switchBtn}>
              Switch to {user.role === 'REQUESTER' ? 'Executor' : 'Requester'}
            </button>
            <button onClick={logout} className={styles.logoutBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
              Log Out
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
