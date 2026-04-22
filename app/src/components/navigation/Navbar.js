'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>PayFear</Link>
        <div className={styles.links}>
          <a href="#how-it-works" className={styles.link}>How It Works</a>
          <Link href="/tasks/browse" className={styles.link}>Browse</Link>
          {user ? (
            <Link href="/dashboard" className="btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className={styles.link}>Log In</Link>
              <Link href="/signup" className="btn-primary">Post a Task</Link>
            </>
          )}
        </div>
        <button className={styles.hamburger} aria-label="Menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
}
