'use client';
import { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, Button, Badge } from '@/components/common/UIAtoms';
import RiskPill from '@/components/task/RiskPill';
import SettlementBadge from '@/components/escrow/SettlementBadge';
import ConnectWallet from '@/components/escrow/ConnectWallet';
import FundEscrow from '@/components/escrow/FundEscrow';
import { tasks as tasksApi, proofs as proofsApi, reviews as reviewsApi, escrow as escrowApi } from '@/lib/api';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatStatus } from '@/utils/constants';
import { useToast } from '@/context/ToastContext';
import styles from './TaskDetail.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TaskDetailPage({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofText, setProofText] = useState('');
  const [disputeReason, setDisputeReason] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showDispute, setShowDispute] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [escrowStatus, setEscrowStatus] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);

  const fetchEscrowStatus = useCallback(async () => {
    try {
      const data = await escrowApi.getStatus(id);
      setEscrowStatus(data);
    } catch {
      // Escrow status is optional — don't block UI
    }
  }, [id]);

  useEffect(() => {
    async function fetchTask() {
      try {
        const data = await tasksApi.get(id);
        setTask(data);
      } catch (err) {
        addToast('Failed to load task', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchTask();
    fetchEscrowStatus();
  }, [id, addToast, fetchEscrowStatus]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading task...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <h1>Task not found</h1>
          <Link href="/tasks/browse">Back to Market</Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === task.requester?.id;
  const isExecutor = user?.id === task.executor?.id;

  // Accept task
  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const updated = await tasksApi.accept(id);
      // Then start immediately
      const started = await tasksApi.start(id);
      setTask({ ...task, status: started.status, executor: { id: user.id, name: user.name } });
      addToast('Task accepted and started!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to accept task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel task
  const handleCancel = async () => {
    setIsSubmitting(true);
    try {
      await tasksApi.cancel(id);
      setTask({ ...task, status: 'CANCELLED' });
      addToast('Task cancelled', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to cancel task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit proof
  const handleSubmitProof = async () => {
    if (!proofText || proofText.length < 10) {
      return addToast('Please provide a detailed proof (at least 10 characters)', 'error');
    }
    setIsSubmitting(true);
    try {
      await proofsApi.submit(id, {
        proofType: task.proofType || 'TEXT',
        textContent: proofText,
      });
      const updated = await tasksApi.get(id);
      setTask(updated);
      setProofText('');
      addToast('Proof submitted for review!', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to submit proof', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Approve task
  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const result = await reviewsApi.approve(id);
      const updated = await tasksApi.get(id);
      setTask(updated);
      setShowReview(true);

      // Update escrow status from approval response
      if (result?.settlement) {
        const outcome = result.settlement.outcome;
        if (outcome === 'confirmed') {
          addToast('Task approved! Payment released on-chain.', 'success');
        } else if (outcome === 'already_settled') {
          addToast('Task approved! (already settled on-chain)', 'success');
        } else {
          addToast('Task approved! Payment released.', 'success');
        }
      } else {
        addToast('Task approved! Payment released.', 'success');
      }

      // Refresh escrow status
      fetchEscrowStatus();
    } catch (err) {
      addToast(err.message || 'Failed to approve', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dispute task
  const handleDispute = async () => {
    if (!disputeReason || disputeReason.length < 20) {
      return addToast('Please provide a detailed reason (at least 20 characters)', 'error');
    }
    setIsSubmitting(true);
    try {
      await reviewsApi.dispute(id, { reason: disputeReason });
      const updated = await tasksApi.get(id);
      setTask(updated);
      setShowDispute(false);
      addToast('Dispute opened. A moderator will review this.', 'info');
    } catch (err) {
      addToast(err.message || 'Failed to open dispute', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit review
  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    try {
      await reviewsApi.submit(id, { rating: reviewRating, comment: reviewComment });
      setShowReview(false);
      addToast('Review submitted! Thank you.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const badgeVariant = () => {
    if (task.status === 'COMPLETED') return 'success';
    if (['DISPUTED', 'CANCELLED', 'BLOCKED', 'REFUNDED'].includes(task.status)) return 'danger';
    return 'purple';
  };

  return (
    <div className={styles.container}>
      <Link href="/tasks/browse" className={styles.backLink}>
        <span className="material-symbols-outlined">arrow_back</span>
        Back to Market
      </Link>

      <div className={styles.layout}>
        <div className={styles.contentArea}>
          <header className={styles.header}>
            <div className={styles.metaRow}>
              <Badge variant={badgeVariant()} className={styles.statusBadge}>
                {formatStatus(task.status)}
              </Badge>
              <RiskPill level={task.riskLevel} />
            </div>
            <h1 className={styles.title}>{task.title}</h1>
            <div className={styles.requesterInfo}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-secondary)' }}>person</span>
              </div>
              <span>Posted by {task.requester?.name}</span>
              {task.requester?.rating > 0 && (
                <span style={{ color: 'var(--amber-400)' }}>★ {task.requester.rating}</span>
              )}
            </div>
          </header>

          <Card className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>Task Description</h2>
            <p className={styles.description}>{task.description}</p>
            {task.specialInstructions && (
              <>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginTop: '1rem', color: 'var(--amber-400)' }}>Special Instructions</h3>
                <p className={styles.description} style={{ fontSize: '0.875rem' }}>{task.specialInstructions}</p>
              </>
            )}
          </Card>

          {/* Proofs section */}
          {task.proofs?.length > 0 && (
            <Card className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Submitted Proofs</h2>
              {task.proofs.map((proof) => (
                <div key={proof.id} style={{ padding: '1rem', background: 'var(--surface-1)', borderRadius: 12, marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <Badge variant="purple">{proof.proofType}</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatDate(proof.createdAt)}</span>
                  </div>
                  {proof.textContent && <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{proof.textContent}</p>}
                  {proof.notes && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>Note: {proof.notes}</p>}
                </div>
              ))}
            </Card>
          )}

          {/* Reviews section */}
          {task.reviews?.length > 0 && (
            <Card className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Reviews</h2>
              {task.reviews.map((review) => (
                <div key={review.id} style={{ padding: '1rem', background: 'var(--surface-1)', borderRadius: 12, marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600 }}>{review.reviewer?.name}</span>
                    <span style={{ color: 'var(--amber-400)' }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                  </div>
                  {review.comment && <p style={{ fontSize: '0.875rem' }}>{review.comment}</p>}
                </div>
              ))}
            </Card>
          )}

          {/* Disputes section */}
          {task.disputes?.length > 0 && (
            <Card className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>Disputes</h2>
              {task.disputes.map((dispute) => (
                <div key={dispute.id} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--danger)', borderRadius: 12, marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <Badge variant="danger">{dispute.status.replace(/_/g, ' ')}</Badge>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{formatDate(dispute.createdAt)}</span>
                  </div>
                  <p style={{ fontSize: '0.875rem' }}>{dispute.reason}</p>
                  {dispute.resolution && <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.5rem' }}>Resolution: {dispute.resolution}</p>}
                </div>
              ))}
            </Card>
          )}
        </div>

        <aside className={styles.actionPanel}>
          <Card className={styles.stickyCard}>
            <div className={styles.budgetBox}>
              <span className={styles.label}>Total Reward</span>
              <span className={styles.value}>{formatCurrency(task.budget)}</span>
            </div>
            
            <div className={styles.detailsList}>
              <div className={styles.detailItem}>
                <span className="material-symbols-outlined">schedule</span>
                <div>
                  <p className={styles.label}>Deadline</p>
                  <p className={styles.val}>{formatDate(task.deadline)}</p>
                </div>
              </div>
              <div className={styles.detailItem}>
                <span className="material-symbols-outlined">location_on</span>
                <div>
                  <p className={styles.label}>Location</p>
                  <p className={styles.val}>{task.location === 'online' ? 'Remote' : task.address}</p>
                </div>
              </div>
              {task.executor && (
                <div className={styles.detailItem}>
                  <span className="material-symbols-outlined">person</span>
                  <div>
                    <p className={styles.label}>Executor</p>
                    <p className={styles.val}>{task.executor.name} {task.executor.rating > 0 && `★ ${task.executor.rating}`}</p>
                  </div>
                </div>
              )}
              {task.payment && (
                <div className={styles.detailItem}>
                  <span className="material-symbols-outlined">lock</span>
                  <div>
                    <p className={styles.label}>Escrow</p>
                    <p className={styles.val}>{task.payment.escrowStatus.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              )}
            </div>

            <hr className={styles.divider} />

            {/* State: OPEN */}
            {task.status === 'OPEN' && (
              <div className={styles.actionBlock}>
                {isOwner ? (
                  <>
                    <p className={styles.statusMessage}>Waiting for an executor to accept your task.</p>

                    {/* Escrow fund UX for requester */}
                    {escrowStatus?.escrowEnabled && escrowStatus?.settlementState === 'not_funded' && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        {!walletConnected ? (
                          <ConnectWallet onConnected={() => setWalletConnected(true)} />
                        ) : (
                          <FundEscrow
                            contractAddress={process.env.NEXT_PUBLIC_ESCROW_ADDRESS || ''}
                            taskIdBytes32={escrowStatus.bytes32Id}
                            amountEth={(task.totalCost * 0.00025).toFixed(6)}
                            onFunded={() => fetchEscrowStatus()}
                          />
                        )}
                      </div>
                    )}

                    <Button variant="danger" className={styles.mainBtn} onClick={handleCancel} disabled={isSubmitting}>
                      Cancel Task
                    </Button>
                  </>
                ) : (
                  <>
                    <p className={styles.statusMessage}>This task is available to be claimed.</p>
                    <Button variant="primary" className={styles.mainBtn} onClick={handleAccept} disabled={isSubmitting}>
                      {isSubmitting ? 'Accepting...' : 'Accept This Task'}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* State: IN_PROGRESS */}
            {task.status === 'IN_PROGRESS' && (
              <div className={styles.actionBlock}>
                {isOwner ? (
                  <div className={styles.statusBox}>
                    <span className="material-symbols-outlined" style={{color: 'var(--amber-400)'}}>hourglass_top</span>
                    <p>Task is currently in progress. Wait for the executor to submit proof.</p>
                  </div>
                ) : isExecutor ? (
                  <div className={styles.uploadBox}>
                    <h4 className={styles.uploadTitle}>Submit Proof of Completion</h4>
                    <textarea 
                      className={styles.proofTextarea} 
                      placeholder="Describe what you did and the results..."
                      value={proofText}
                      onChange={e => setProofText(e.target.value)}
                    />
                    <Button variant="primary" className={styles.mainBtn} onClick={handleSubmitProof} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Proof'}
                    </Button>
                  </div>
                ) : (
                  <div className={styles.statusBox}>
                    <p>This task is already being handled by someone else.</p>
                  </div>
                )}
              </div>
            )}

            {/* State: UNDER_REVIEW */}
            {task.status === 'UNDER_REVIEW' && (
              <div className={styles.actionBlock}>
                {isOwner ? (
                  <div className={styles.reviewBox}>
                    <h4 className={styles.uploadTitle}>Proof Available for Review</h4>
                    {!showDispute ? (
                      <div className={styles.actionRow}>
                        <Button variant="primary" onClick={handleApprove} disabled={isSubmitting} style={{background: 'var(--success)'}}>
                          Approve ✓
                        </Button>
                        <Button variant="danger" onClick={() => setShowDispute(true)} disabled={isSubmitting}>
                          Dispute ✗
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <textarea 
                          className={styles.proofTextarea}
                          placeholder="Explain why you are disputing this task (min 20 chars)..."
                          value={disputeReason}
                          onChange={e => setDisputeReason(e.target.value)}
                        />
                        <div className={styles.actionRow}>
                          <Button variant="danger" onClick={handleDispute} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Dispute'}
                          </Button>
                          <Button variant="secondary" onClick={() => setShowDispute(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : isExecutor ? (
                  <div className={styles.statusBox}>
                    <span className="material-symbols-outlined" style={{color: 'var(--amber-400)'}}>schedule</span>
                    <p>Proof submitted! Waiting for the requester to approve.</p>
                  </div>
                ) : null}
              </div>
            )}

            {/* State: COMPLETED */}
            {task.status === 'COMPLETED' && (
              <div className={styles.actionBlock}>
                <div className={styles.statusBox} style={{borderColor: 'var(--success)', background: 'rgba(34, 197, 94, 0.05)'}}>
                  <span className="material-symbols-outlined" style={{color: 'var(--success)'}}>check_circle</span>
                  <p style={{color: 'var(--success)'}}>Task completed successfully! Funds released.</p>
                </div>
                {(isOwner || isExecutor) && showReview && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Leave a review</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <button key={n} onClick={() => setReviewRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: n <= reviewRating ? 'var(--amber-400)' : 'var(--text-tertiary)' }}>
                          ★
                        </button>
                      ))}
                    </div>
                    <textarea 
                      className={styles.proofTextarea}
                      placeholder="How was your experience?"
                      value={reviewComment}
                      onChange={e => setReviewComment(e.target.value)}
                    />
                    <Button variant="primary" onClick={handleSubmitReview} disabled={isSubmitting} style={{ width: '100%' }}>
                      {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* State: DISPUTED */}
            {task.status === 'DISPUTED' && (
              <div className={styles.actionBlock}>
                <div className={styles.statusBox} style={{borderColor: 'var(--danger)', background: 'rgba(239, 68, 68, 0.05)'}}>
                  <span className="material-symbols-outlined" style={{color: 'var(--danger)'}}>warning</span>
                  <p style={{color: 'var(--danger)'}}>This task is under dispute. A moderator will reach out shortly.</p>
                </div>
              </div>
            )}

            {/* State: CANCELLED */}
            {task.status === 'CANCELLED' && (
              <div className={styles.actionBlock}>
                <div className={styles.statusBox} style={{borderColor: 'var(--text-tertiary)'}}>
                  <span className="material-symbols-outlined" style={{color: 'var(--text-tertiary)'}}>cancel</span>
                  <p>This task has been cancelled.</p>
                </div>
              </div>
            )}

            {/* Wallet connection for any logged-in user */}
            {user && !walletConnected && (
              <div style={{ marginTop: '0.5rem' }}>
                <ConnectWallet onConnected={() => setWalletConnected(true)} />
              </div>
            )}

            {/* Settlement Badge — always shows escrow state */}
            {escrowStatus && (
              <SettlementBadge
                settlementState={escrowStatus.settlementState}
                txHash={escrowStatus.offchain?.txHash}
              />
            )}

            <p className={styles.notice}>
              This task is secured by PayFear Escrow. Funds are locked until work is approved.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
