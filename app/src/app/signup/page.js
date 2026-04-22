'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button, Card } from '@/components/common/UIAtoms';
import styles from './Auth.module.css';

export default function SignupPage() {
  const [role, setRole] = useState('requester');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await signup({ ...data, role });
      addToast('Welcome to PayFear!', 'success');
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
            Get help with something you <span className="gradient-text">don't want to do.</span>
          </h1>
          <p className={styles.subtext}>
            We connect people who need a hand with friendly helpers ready to get the job done safely.
          </p>
        </div>
        <div className={styles.authStats}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--amber-400)' }}>shield</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Simple Safety</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Payment held until you're happy.</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--purple-400)' }}>payments</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Easy Payouts</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Get paid quickly once finished.</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightSide}>
        <Card className={styles.authCard}>
          <div className={styles.authHeader}>
            <h2>Create Account</h2>
            <p>Tell us what you're looking for to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.roleSelection}>
              <button 
                type="button" 
                onClick={() => setRole('requester')}
                className={`${styles.roleBtn} ${role === 'requester' ? styles.activeRole : ''}`}
              >
                <span className="material-symbols-outlined">person_search</span>
                <span>I need help</span>
              </button>
              <button 
                type="button" 
                onClick={() => setRole('executor')}
                className={`${styles.roleBtn} ${role === 'executor' ? styles.activeRole : ''}`}
              >
                <span className="material-symbols-outlined">handshake</span>
                <span>I can help</span>
              </button>
            </div>

            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <label className="input-label">First Name</label>
                <input name="firstName" className="input-field" placeholder="Aiden" required />
              </div>
              <div className={styles.field}>
                <label className="input-label">Last Name</label>
                <input name="lastName" className="input-field" placeholder="Vance" required />
              </div>
            </div>

            <div className={styles.field}>
              <label className="input-label">Email Address</label>
              <input name="email" type="email" className="input-field" placeholder="name@email.com" required />
            </div>

            <div className={styles.field}>
              <label className="input-label">Password</label>
              <input name="password" type="password" className="input-field" placeholder="••••••••" required />
            </div>

            <div className={styles.terms}>
              <input type="checkbox" required />
              <span>I agree to the <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.</span>
            </div>

            <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
              {loading ? 'Creating Account...' : 'Start using PayFear'}
              {!loading && <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>}
            </Button>

            <p className={styles.switchAuth}>
              Already have an account? <Link href="/login">Log In</Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
