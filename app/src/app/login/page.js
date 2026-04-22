'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Card } from '@/components/common/UIAtoms';
import styles from './Auth.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData.entries());
    
    try {
      await login(email, password);
      addToast('Welcome back!', 'success');
      router.push('/dashboard');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.leftSide}>
        <div className={styles.branding}>
          <Link href="/" className={styles.logo}>PayFear</Link>
          <h1 className={styles.heroText}>
            Welcome <span className="gradient-text">Back.</span>
          </h1>
          <p className={styles.subtext}>
            Log in to continue delegating or executing tasks with confidence.
          </p>
        </div>
      </div>

      <div className={styles.rightSide}>
        <Card className={styles.authCard}>
          <div className={styles.authHeader}>
            <h2>Log In</h2>
            <p>Enter your credentials to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label className="input-label">Email Address</label>
              <input name="email" type="email" className="input-field" placeholder="alex@example.com" required />
            </div>

            <div className={styles.field}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="input-label">Password</label>
                <a href="#" className={styles.forgot}>Forgot?</a>
              </div>
              <input name="password" type="password" className="input-field" placeholder="••••••••" required />
            </div>

            <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Logging in...' : 'Enter Dashboard'}
              {!loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>}
            </Button>

            <p className={styles.switchAuth}>
              Don't have an account? <Link href="/signup">Sign Up</Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
