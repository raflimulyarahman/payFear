/**
 * PayFear Task State Machine
 * 
 * Enforces all valid state transitions and who can trigger them.
 * This is the single source of truth for task lifecycle rules.
 */

export type TaskStatus =
  | 'DRAFT' | 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS'
  | 'PROOF_SUBMITTED' | 'UNDER_REVIEW' | 'COMPLETED'
  | 'DISPUTED' | 'CANCELLED' | 'REFUNDED' | 'BLOCKED';

export type ActorRole = 'requester' | 'executor' | 'admin' | 'system';

interface TransitionRule {
  to: TaskStatus;
  actors: ActorRole[];
  onchain: boolean;     // Requires on-chain action
  atomic: boolean;      // Must succeed completely or not at all
}

const TRANSITIONS: Record<TaskStatus, TransitionRule[]> = {
  DRAFT: [
    { to: 'OPEN', actors: ['requester'], onchain: false, atomic: true },
    { to: 'CANCELLED', actors: ['requester'], onchain: false, atomic: false },
  ],
  OPEN: [
    { to: 'ACCEPTED', actors: ['executor'], onchain: false, atomic: true },
    { to: 'CANCELLED', actors: ['requester'], onchain: false, atomic: true },
    { to: 'BLOCKED', actors: ['admin'], onchain: false, atomic: true },
  ],
  ACCEPTED: [
    { to: 'IN_PROGRESS', actors: ['executor'], onchain: false, atomic: false },
    { to: 'CANCELLED', actors: ['requester', 'executor'], onchain: false, atomic: true },
    { to: 'OPEN', actors: ['executor'], onchain: false, atomic: true },
  ],
  IN_PROGRESS: [
    { to: 'PROOF_SUBMITTED', actors: ['executor'], onchain: false, atomic: true },
    { to: 'DISPUTED', actors: ['system'], onchain: false, atomic: true },
  ],
  PROOF_SUBMITTED: [
    { to: 'UNDER_REVIEW', actors: ['system'], onchain: false, atomic: false },
  ],
  UNDER_REVIEW: [
    { to: 'COMPLETED', actors: ['requester', 'system'], onchain: true, atomic: true },
    { to: 'DISPUTED', actors: ['requester'], onchain: true, atomic: true },
  ],
  COMPLETED: [],   // Terminal
  DISPUTED: [
    { to: 'COMPLETED', actors: ['admin'], onchain: true, atomic: true },
    { to: 'REFUNDED', actors: ['admin'], onchain: true, atomic: true },
  ],
  CANCELLED: [
    { to: 'REFUNDED', actors: ['system'], onchain: true, atomic: true },
  ],
  REFUNDED: [],    // Terminal
  BLOCKED: [],     // Terminal
};

/**
 * Check if a transition from one state to another is valid.
 */
export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from]?.some((rule) => rule.to === to) ?? false;
}

/**
 * Check if a specific actor can trigger a transition.
 */
export function canActorTransition(
  from: TaskStatus,
  to: TaskStatus,
  actor: ActorRole
): boolean {
  const rule = TRANSITIONS[from]?.find((r) => r.to === to);
  if (!rule) return false;
  return rule.actors.includes(actor);
}

/**
 * Get the transition rule for a specific state change.
 */
export function getTransitionRule(
  from: TaskStatus,
  to: TaskStatus
): TransitionRule | null {
  return TRANSITIONS[from]?.find((r) => r.to === to) ?? null;
}

/**
 * Get all valid next states from a given state.
 */
export function getValidNextStates(from: TaskStatus): TaskStatus[] {
  return TRANSITIONS[from]?.map((r) => r.to) ?? [];
}

/**
 * Get all valid next states for a specific actor.
 */
export function getActorNextStates(from: TaskStatus, actor: ActorRole): TaskStatus[] {
  return TRANSITIONS[from]
    ?.filter((r) => r.actors.includes(actor))
    .map((r) => r.to) ?? [];
}

/**
 * Check if a state is terminal (no further transitions possible).
 */
export function isTerminal(status: TaskStatus): boolean {
  return (TRANSITIONS[status]?.length ?? 0) === 0;
}

/**
 * Determine the actor role of a user relative to a task.
 */
export function determineActorRole(
  userId: string,
  task: { requesterId: string; executorId: string | null },
  userRole: string
): ActorRole {
  if (userRole === 'ADMIN') return 'admin';
  if (task.requesterId === userId) return 'requester';
  if (task.executorId === userId) return 'executor';
  // If they're an executor role but not assigned to this task, they can still accept
  if (userRole === 'EXECUTOR') return 'executor';
  return 'requester';
}
