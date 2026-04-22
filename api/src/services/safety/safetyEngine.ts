/**
 * PayFear Safety Engine
 * 
 * Scans task content for prohibited and risky keywords.
 * Returns risk level and specific flags for moderation.
 */

import type { RiskLevel } from '@prisma/client';

const BLOCKED_KEYWORDS = [
  'kill', 'attack', 'stalk', 'hack', 'steal', 'threaten',
  'blackmail', 'impersonate', 'spy', 'dox', 'revenge',
  'catfish', 'fake identity', 'break into', 'assault',
  'kidnap', 'murder', 'arson', 'extort', 'bribe',
  'smuggle', 'counterfeit', 'child', 'minor', 'underage',
  'trafficking', 'terrorism', 'bomb', 'weapon', 'drug deal',
];

const WARNING_KEYWORDS = [
  'confront', 'argue', 'angry', 'ex-partner', 'boss',
  'personal info', 'private', 'pressure', 'demand',
  'intimate', 'relationship', 'follow', 'watch', 'track',
  'workplace', 'school', 'hospital', 'court', 'police',
  'lawyer', 'restraining', 'custody', 'divorce',
];

export interface SafetyCheckResult {
  passed: boolean;
  riskLevel: RiskLevel;
  flags: string[];
  blockedReasons: string[];
}

/**
 * Run a safety check against task title + description.
 * Returns whether the task is safe, its risk level, and any flags.
 */
export function runSafetyCheck(input: {
  title: string;
  description: string;
  category?: string;
}): SafetyCheckResult {
  const text = `${input.title} ${input.description}`.toLowerCase();
  const flags: string[] = [];
  const blockedReasons: string[] = [];

  // 1. Scan blocked keywords
  for (const keyword of BLOCKED_KEYWORDS) {
    if (text.includes(keyword)) {
      blockedReasons.push(`Contains prohibited term: "${keyword}"`);
    }
  }

  // 2. Scan warning keywords
  for (const keyword of WARNING_KEYWORDS) {
    if (text.includes(keyword)) {
      flags.push(`Contains sensitive term: "${keyword}"`);
    }
  }

  // 3. Category-specific checks
  if (input.category === 'SOCIAL') {
    const surveillanceTerms = ['follow', 'watch', 'track', 'monitor', 'spy on'];
    for (const term of surveillanceTerms) {
      if (text.includes(term) && !blockedReasons.some(r => r.includes(term))) {
        flags.push(`Social task with surveillance-like language: "${term}"`);
      }
    }
  }

  // 4. Determine risk level
  let riskLevel: RiskLevel = 'LOW';
  if (blockedReasons.length > 0) {
    riskLevel = 'HIGH';
  } else if (flags.length > 0) {
    riskLevel = 'MEDIUM';
  }

  return {
    passed: blockedReasons.length === 0,
    riskLevel,
    flags,
    blockedReasons,
  };
}

/**
 * Quick risk check — returns just the risk level.
 */
export function quickRiskCheck(text: string): RiskLevel {
  const lower = text.toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (lower.includes(kw)) return 'HIGH';
  }
  for (const kw of WARNING_KEYWORDS) {
    if (lower.includes(kw)) return 'MEDIUM';
  }
  return 'LOW';
}
