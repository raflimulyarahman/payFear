import { BLOCKED_KEYWORDS, WARNING_KEYWORDS } from './constants';

export function detectRisk(text) {
  const lower = text.toLowerCase();
  for (const kw of BLOCKED_KEYWORDS) {
    if (lower.includes(kw)) return 'HIGH';
  }
  for (const kw of WARNING_KEYWORDS) {
    if (lower.includes(kw)) return 'MEDIUM';
  }
  return 'LOW';
}
