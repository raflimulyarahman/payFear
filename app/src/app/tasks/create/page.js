'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@/components/common/UIAtoms';
import SafetyChecklist from '@/components/task/SafetyChecklist';
import RiskPill from '@/components/task/RiskPill';
import { CATEGORIES, PROOF_TYPES, DEFAULT_PROOFS_BY_CATEGORY } from '@/utils/constants';
import { detectRisk } from '@/utils/riskDetector';
import { useToast } from '@/context/ToastContext';
import { tasks as tasksApi } from '@/lib/api';
import styles from './CreateTask.module.css';

const STEPS = [
  { id: 1, label: 'Definition' },
  { id: 2, label: 'Logistics' },
  { id: 3, label: 'Safety & Proof' },
  { id: 4, label: 'Escrow Lock' },
];

const PLATFORM_FEE_RATE = 0.05;
const URGENCY_FEE_RATE = 0.20;

export default function CreateTaskPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'PHONE_CALLS',
    location: 'online',
    address: '',
    deadline: '',
    budget: 20,
    urgency: 'normal',
    proofTypes: DEFAULT_PROOFS_BY_CATEGORY['PHONE_CALLS'],
    safetyAgreed: false,
  });
  
  const router = useRouter();
  const { addToast } = useToast();

  const risk = useMemo(() => {
    return detectRisk(formData.title + ' ' + formData.description);
  }, [formData.title, formData.description]);

  const updateForm = (updates) => setFormData(prev => ({ ...prev, ...updates }));

  // Smart defaults: update selected proof types when category changes
  useEffect(() => {
    const defaults = DEFAULT_PROOFS_BY_CATEGORY[formData.category] || ['SCREENSHOT'];
    setFormData(prev => ({ ...prev, proofTypes: defaults }));
  }, [formData.category]);

  const toggleProofType = (proofId) => {
    setFormData(prev => {
      const current = prev.proofTypes;
      if (current.includes(proofId)) {
        // Don't allow deselecting the last one
        if (current.length === 1) return prev;
        return { ...prev, proofTypes: current.filter(id => id !== proofId) };
      }
      return { ...prev, proofTypes: [...current, proofId] };
    });
  };

  const platformFee = Number(formData.budget) * PLATFORM_FEE_RATE;
  const urgencyFee = formData.urgency === 'urgent' ? Number(formData.budget) * URGENCY_FEE_RATE : 0;
  const totalCost = Number(formData.budget) + platformFee + urgencyFee;

  const next = () => {
    if (step === 1 && (!formData.title || !formData.description)) {
      return addToast('Please fill in all fields', 'error');
    }
    if (step === 2 && (!formData.deadline || !formData.budget)) {
      return addToast('Please set logistics', 'error');
    }
    if (step === 3 && !formData.safetyAgreed && risk !== 'LOW') {
      return addToast('Please agree to safety terms', 'error');
    }
    setStep(s => s + 1);
  };

  const back = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Create task as DRAFT
      const task = await tasksApi.create({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location: formData.location,
        address: formData.location === 'offline' ? formData.address : undefined,
        budget: Number(formData.budget),
        deadline: new Date(formData.deadline).toISOString(),
        urgency: formData.urgency,
        proofTypes: formData.proofTypes,
      });

      // Immediately publish (DRAFT → OPEN)
      await tasksApi.publish(task.id);

      addToast('Task created and published successfully!', 'success');
      router.push('/dashboard');
    } catch (err) {
      addToast(err.message || 'Failed to create task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.stepIndicator}>
          {STEPS.map(s => (
            <div key={s.id} className={`${styles.step} ${step >= s.id ? styles.stepActive : ''}`}>
              <div className={styles.stepCircle}>{s.id}</div>
              <span className={styles.stepLabel}>{s.label}</span>
              {s.id < 4 && <div className={styles.stepLine}></div>}
            </div>
          ))}
        </div>
      </header>

      <div className={styles.wizardContent}>
        {step === 1 && (
          <div className="fade-in">
            <h1 className={styles.title}>What do you need help with?</h1>
            <p className={styles.subtitle}>Be descriptive but keep it anonymous (no real names or phone numbers here).</p>
            
            <Card className={styles.formCard}>
              <div className={styles.field}>
                <label className="input-label">Task Title</label>
                <input 
                  className="input-field" 
                  placeholder="e.g. Call my ISP to cancel subscription"
                  value={formData.title}
                  onChange={e => updateForm({ title: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className="input-label">Description</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: 120, resize: 'none' }}
                  placeholder="Explain exactly what the executor needs to do..."
                  value={formData.description}
                  onChange={e => updateForm({ description: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className="input-label">Category</label>
                <div className={styles.categoryGrid}>
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat.id}
                      className={`${styles.catBtn} ${formData.category === cat.id ? styles.catBtnActive : ''}`}
                      onClick={() => updateForm({ category: cat.id })}
                    >
                      <span className="material-symbols-outlined">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h1 className={styles.title}>Logistics & Budget</h1>
            <p className={styles.subtitle}>Set where, when, and how much you're willing to pay for this hand-off.</p>
            
            <Card className={styles.formCard}>
              <div className={styles.field}>
                <label className="input-label">Location</label>
                <div className={styles.locationToggle}>
                  <button 
                    className={`${styles.toggleBtn} ${formData.location === 'online' ? styles.toggleActive : ''}`}
                    onClick={() => updateForm({ location: 'online' })}
                  >Remote / Phone</button>
                  <button 
                    className={`${styles.toggleBtn} ${formData.location === 'offline' ? styles.toggleActive : ''}`}
                    onClick={() => updateForm({ location: 'offline' })}
                  >In Person</button>
                </div>
              </div>
              
              {formData.location === 'offline' && (
                <div className={styles.field}>
                  <label className="input-label">Address / Meetup</label>
                  <input 
                    className="input-field" 
                    placeholder="City, Area or specific address"
                    value={formData.address}
                    onChange={e => updateForm({ address: e.target.value })}
                  />
                </div>
              )}

              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <label className="input-label">Deadline</label>
                  <input 
                    type="date"
                    className="input-field"
                    value={formData.deadline}
                    onChange={e => updateForm({ deadline: e.target.value })}
                  />
                </div>
                <div className={styles.field}>
                  <label className="input-label">Budget (USD)</label>
                  <div className={styles.priceInput}>
                    <span>$</span>
                    <input 
                      type="number"
                      className="input-field"
                      style={{ paddingLeft: '2rem' }}
                      min={5}
                      max={500}
                      value={formData.budget}
                      onChange={e => updateForm({ budget: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.field}>
                <label className="input-label">Urgency</label>
                <div className={styles.locationToggle}>
                  <button 
                    className={`${styles.toggleBtn} ${formData.urgency === 'normal' ? styles.toggleActive : ''}`}
                    onClick={() => updateForm({ urgency: 'normal' })}
                  >Normal</button>
                  <button 
                    className={`${styles.toggleBtn} ${formData.urgency === 'urgent' ? styles.toggleActive : ''}`}
                    onClick={() => updateForm({ urgency: 'urgent' })}
                  >Urgent (+20%)</button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h1 className={styles.title}>Safety & Proof</h1>
            <p className={styles.subtitle}>Our safety engine analyzes your task to ensure a secure transaction.</p>
            
            <div className={styles.safetyGrid}>
              <Card className={styles.riskCard}>
                <div className={styles.riskHeader}>
                  <RiskPill level={risk} />
                  <h3 className={styles.riskTitle}>
                    {risk === 'LOW' ? 'This looks safe' : 
                     risk === 'MEDIUM' ? 'Requires Review' : 'Blocked Task'}
                  </h3>
                </div>
                <p className={styles.riskDescription}>
                  {risk === 'LOW' && "Your task details are clear and meet our safety standards. No common risk patterns detected."}
                  {risk === 'MEDIUM' && "We detected potential sensitive keywords. Please ensure you are not asking for harassment or private info leak."}
                  {risk === 'HIGH' && "This task contains blocked keywords and cannot be posted for safety reasons."}
                </p>
                
                {risk !== 'HIGH' && (
                  <div className={styles.safetyChecks}>
                    <SafetyChecklist 
                      items={[
                        { id: 'anonymity', label: 'I kept the details anonymous', description: 'No real names, phone numbers, or private emails in description.' },
                        { id: 'respect', label: 'No harassment or illegal acts', description: 'This task follows PayFear safety guidelines.' },
                      ]}
                      onComplete={setFormData.bind(null, (prev) => ({ ...prev, safetyAgreed: true }))}
                    />
                  </div>
                )}
              </Card>

              <Card className={styles.proofCard}>
                <h3 className={styles.sectionTitle}>Required Proof</h3>
                <p className={styles.subtitle} style={{ marginBottom: '0.5rem' }}>How should the executor prove completion?</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>Select one or more formats. Smart defaults are based on your task category.</p>
                <div className={styles.proofOptions}>
                  {PROOF_TYPES.map(p => {
                    const isSelected = formData.proofTypes.includes(p.id);
                    return (
                      <label key={p.id} className={`${styles.proofItem} ${isSelected ? styles.proofActive : ''}`}>
                        <input 
                          type="checkbox" 
                          style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                          checked={isSelected}
                          onChange={() => toggleProofType(p.id)}
                        />
                        <div className={styles.proofCheckbox}>
                          {isSelected && <span className="material-symbols-outlined" style={{ fontSize: 16, fontWeight: 800 }}>check</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.6 }}>{p.icon}</span>
                            <span>{p.label}</span>
                          </div>
                          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: '2px' }}>{p.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="fade-in">
            <h1 className={styles.title}>Final Preview</h1>
            <Card className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <Badge variant="amber">Funds to be locked</Badge>
                <span className={styles.previewPrice}>${totalCost.toFixed(2)}</span>
              </div>
              <h2 className={styles.previewTitle}>{formData.title}</h2>
              <div className={styles.previewMeta}>
                <span>{formData.location === 'online' ? 'Remote' : formData.address}</span>
                <span>•</span>
                <span>Deadline: {formData.deadline}</span>
                {formData.urgency === 'urgent' && <Badge variant="danger">Urgent</Badge>}
              </div>
              <p className={styles.previewDesc}>{formData.description}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', margin: '1rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Task Budget</span><span>${Number(formData.budget).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Platform Fee (5%)</span><span>${platformFee.toFixed(2)}</span>
                </div>
                {urgencyFee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Urgency Fee (20%)</span><span>${urgencyFee.toFixed(2)}</span>
                  </div>
                )}
                <hr style={{ border: 'none', borderTop: '1px solid var(--border-primary)', margin: '0.25rem 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <span>Total</span><span>${totalCost.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.escrowNotice}>
                <span className="material-symbols-outlined">lock</span>
                <p>PayFear locks these funds in Escrow. Your money only leaves the platform when you approve the work.</p>
              </div>
            </Card>
          </div>
        )}

        <div className={styles.actions}>
          {step > 1 && <Button variant="secondary" onClick={back}>Back</Button>}
          {step < 4 ? (
            <Button onClick={next} disabled={risk === 'HIGH'}>Next Step <span className="material-symbols-outlined">arrow_forward</span></Button>
          ) : (
            <Button onClick={handleSubmit} variant="primary" disabled={submitting || risk === 'HIGH'} style={{ padding: '1rem 3rem' }}>
              {submitting ? 'Creating...' : 'Confirm & Publish Task'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
