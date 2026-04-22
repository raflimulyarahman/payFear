'use client';
import Link from 'next/link';
import Navbar from '@/components/navigation/Navbar';
import styles from './Landing.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <Navbar />
      
      <main style={{ paddingTop: '64px' }}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <span className={styles.heroBadge}>
            A simple market for hard tasks
          </span>
          <h1 className={styles.heroTitle}>
            Delegate Your <span className="gradient-text">Fears</span>, Flawlessly
          </h1>
          <p className={styles.heroSubtitle}>
            Pay someone to handle the things you don't want to do.
          </p>
          <div className={styles.heroActions}>
            <Link href="/tasks/create" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
              Post a Task
            </Link>
            <Link href="/signup" className="btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.125rem' }}>
              Become an Executor
            </Link>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className={styles.helpSection}>
          <div className={styles.helpContainer}>
            <div className={styles.sectionHeaderLeft}>
              <h2 className={styles.sectionTitle}>How we can help</h2>
              <p className={styles.sectionSubtitle}>Real people ready to take the weight off your shoulders.</p>
            </div>
            <div className={styles.useCaseGrid}>
              
              <div className={`flat-card ${styles.useCaseCard} hover-lift`}>
                <div className={styles.iconBoxPrimary}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>chat</span>
                </div>
                <div>
                  <h3 className={styles.useCaseTitle}>Tough Conversations</h3>
                  <p className={styles.useCaseDesc}>Let an expert handle difficult breakups, job resignations, or service cancellations. We speak so you don't have to.</p>
                </div>
              </div>

              <div className={`flat-card ${styles.useCaseCard} hover-lift`}>
                <div className={styles.iconBoxSecondary}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>description</span>
                </div>
                <div>
                  <h3 className={styles.useCaseTitle}>Difficult Paperwork</h3>
                  <p className={styles.useCaseDesc}>Dealing with insurance claims, tax forms, or long phone queues? Our specialists navigate the bureaucracy for you.</p>
                </div>
              </div>

              <div className={`flat-card ${styles.useCaseCard} hover-lift`}>
                <div className={styles.iconBoxPrimary}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>pest_control</span>
                </div>
                <div>
                  <h3 className={styles.useCaseTitle}>Home Emergencies</h3>
                  <p className={styles.useCaseDesc}>From spiders to strange noises in the attic, get someone on-site in minutes to handle the things that scare you.</p>
                </div>
              </div>

              <div className={`flat-card ${styles.useCaseCard} hover-lift`}>
                <div className={styles.iconBoxSecondary}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>handshake</span>
                </div>
                <div>
                  <h3 className={styles.useCaseTitle}>Polite Disagreement</h3>
                  <p className={styles.useCaseDesc}>Handling neighbor disputes or returning faulty items. We provide professional mediation to resolve conflict calmly.</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className={styles.stepsSection}>
          <div className={styles.stepsContainer}>
            <div className={styles.sectionHeaderCenter}>
              <h2 className={styles.sectionTitle}>How it works</h2>
              <p className={styles.sectionSubtitle}>Four simple steps to peace of mind.</p>
            </div>
            
            <div className={styles.stepsGrid}>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>1</div>
                <h4 className={styles.stepTitle}>Tell us the task</h4>
                <p className={styles.stepDesc}>Describe exactly what you need help with and what you're avoiding.</p>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>2</div>
                <h4 className={styles.stepTitle}>Pick a helper</h4>
                <p className={styles.stepDesc}>Choose a vetted person based on their experience and verified reviews.</p>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>3</div>
                <h4 className={styles.stepTitle}>Safe payment</h4>
                <p className={styles.stepDesc}>Your money is held securely and only released when you're happy with the result.</p>
              </div>
              <div className={styles.stepItem}>
                <div className={styles.stepNumber}>4</div>
                <h4 className={styles.stepTitle}>It's done</h4>
                <p className={styles.stepDesc}>Get confirmation the task is finished and get back to your day.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety Focus Section */}
        <section className={styles.safetySection}>
          <div className={styles.safetyFlex}>
            <div className={styles.safetyContent}>
              <h2 className={styles.sectionTitle}>You're in safe hands</h2>
              <p className={styles.sectionSubtitle}>
                We know it's hard to ask for help with sensitive things. That's why we've built a system based on honesty and security.
              </p>
              
              <div className={styles.safetyList}>
                <div className={styles.safetyItem}>
                  <span className={`material-symbols-outlined ${styles.safetyItemIcon}`}>lock</span>
                  <div>
                    <h4 className={styles.safetyItemTitle}>Secure Payments</h4>
                    <p className={styles.safetyItemDesc}>We use standard bank-level encryption. Your money stays with us until the job is done.</p>
                  </div>
                </div>
                <div className={styles.safetyItem}>
                  <span className={`material-symbols-outlined ${styles.safetyItemIcon}`}>person_check</span>
                  <div>
                    <h4 className={styles.safetyItemTitle}>Vetted Helpers</h4>
                    <p className={styles.safetyItemDesc}>Every person on our platform goes through an identity check before they can help you.</p>
                  </div>
                </div>
                <div className={styles.safetyItem}>
                  <span className={`material-symbols-outlined ${styles.safetyItemIcon}`}>shield_lock</span>
                  <div>
                    <h4 className={styles.safetyItemTitle}>Dispute Resolution</h4>
                    <p className={styles.safetyItemDesc}>If things go sideways, our dedicated moderators will mediate and resolve the issue fairly.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.safetyCardWrapper}>
              <div className={`flat-card ${styles.safetyBadgeCard}`}>
                <div className={styles.safetyBadgeIcon}>
                  <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--purple-400)' }}>shield</span>
                </div>
                <h3 className={styles.useCaseTitle}>Protected by PayFear</h3>
                <p className={styles.useCaseDesc} style={{ marginBottom: '0' }}>We handle the mediation so you don't have to worry about anything going wrong.</p>
                <div className={styles.safetyBadgeIndicator}>
                  Escrow Protection Active
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaContainer}>
            <h2 className={styles.sectionTitle} style={{ fontSize: 'var(--text-4xl)' }}>Ready to let go of the stress?</h2>
            <p className={styles.sectionSubtitle} style={{ marginBottom: '40px' }}>Join thousands of people who have found a simpler way to handle life's difficult moments.</p>
            <Link href="/tasks/create" className="btn-primary" style={{ padding: '1.25rem 3rem', fontSize: '1.25rem' }}>
              Post Your First Task
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>PayFear</div>
            <p className={styles.useCaseDesc}>Helping you manage the tasks that cause anxiety, safely and professionally.</p>
          </div>
          
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <p>Company</p>
              <Link href="#">About Us</Link>
              <Link href="#">Safety</Link>
            </div>
            <div className={styles.footerCol}>
              <p>Legal</p>
              <Link href="#">Privacy</Link>
              <Link href="#">Terms</Link>
            </div>
            <div className={styles.footerCol}>
              <p>Contact</p>
              <Link href="#">Support</Link>
              <Link href="#">Help Center</Link>
            </div>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p>© 2026 PayFear Inc. All rights reserved.</p>
          <div className={styles.socialIcons}>
            <span className="material-symbols-outlined hover-lift" style={{ cursor: 'pointer' }}>public</span>
            <span className="material-symbols-outlined hover-lift" style={{ cursor: 'pointer' }}>alternate_email</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
