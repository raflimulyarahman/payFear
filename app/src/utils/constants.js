export const CATEGORIES = [
  { id: 'PHONE_CALLS', label: 'Phone Calls', icon: 'call' },
  { id: 'SOCIAL', label: 'Social Interaction', icon: 'groups' },
  { id: 'RETURN_REFUND', label: 'Return / Refund', icon: 'assignment_return' },
  { id: 'NEGOTIATION', label: 'Negotiation', icon: 'handshake' },
  { id: 'ADMIN_TASK', label: 'Administrative', icon: 'description' },
  { id: 'OTHER', label: 'Other', icon: 'more_horiz' },
];

export const TASK_STATUSES = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  PROOF_SUBMITTED: 'Proof Submitted',
  UNDER_REVIEW: 'Under Review',
  COMPLETED: 'Completed',
  DISPUTED: 'Disputed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  BLOCKED: 'Blocked',
};

export const RISK_LEVELS = {
  LOW: { label: 'Low Risk', color: 'low', icon: 'check_circle' },
  MEDIUM: { label: 'Medium Risk', color: 'medium', icon: 'warning' },
  HIGH: { label: 'Blocked', color: 'high', icon: 'block' },
};

export const BLOCKED_KEYWORDS = [
  'kill', 'attack', 'stalk', 'hack', 'steal', 'threaten',
  'blackmail', 'impersonate', 'spy', 'dox', 'revenge',
  'catfish', 'fake identity', 'break into',
];

export const WARNING_KEYWORDS = [
  'confront', 'argue', 'angry', 'ex-partner', 'boss',
  'personal info', 'private', 'pressure', 'demand',
  'intimate', 'relationship',
];

export const PROOF_TYPES = [
  { id: 'SCREENSHOT', label: 'Screenshot', icon: 'screenshot_monitor', description: 'Best for digital tasks — call logs, confirmation screens' },
  { id: 'PHOTO', label: 'Photo', icon: 'photo_camera', description: 'Best for physical tasks — receipts, in-person proof' },
  { id: 'TEXT', label: 'Text Confirmation', icon: 'chat', description: 'Quick validation — chat transcript, email reply' },
  { id: 'VIDEO', label: 'Video', icon: 'videocam', description: 'When you need process or step-by-step evidence' },
];

/**
 * Smart defaults: pre-select the most relevant proof types based on category.
 */
export const DEFAULT_PROOFS_BY_CATEGORY = {
  PHONE_CALLS:   ['SCREENSHOT', 'TEXT'],        // call log screenshot + text confirmation
  SOCIAL:        ['PHOTO', 'TEXT'],              // photo of interaction + text confirmation
  RETURN_REFUND: ['PHOTO', 'SCREENSHOT'],        // receipt photo + refund confirmation
  NEGOTIATION:   ['SCREENSHOT', 'TEXT'],          // result screenshot + summary text
  ADMIN_TASK:    ['SCREENSHOT', 'TEXT'],           // task completion screenshot + confirmation
  OTHER:         ['SCREENSHOT'],                   // safe default
};

/**
 * Format a status string for display.
 */
export function formatStatus(status) {
  return TASK_STATUSES[status] || status.replace(/_/g, ' ');
}
