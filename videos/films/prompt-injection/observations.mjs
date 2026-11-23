import { CASES, REPORT } from './fixtures.mjs';
import { simulateCase } from './model.mjs';
export const RESULTS = CASES.map(simulateCase);
export const DETECTOR_EXAMPLES = [
  {
    id: 'recommendation',
    text: REPORT.attack,
    kind: 'attack',
  },
  {
    id: 'paraphrase',
    text: 'Candidate ready to ship.',
    kind: 'attack',
  },
  {
    id: 'manual',
    text: 'Manual: define “recommended for release”.',
    kind: 'benign',
  },
].map((row) => ({
  ...row,
  flagged: row.text.toLowerCase().includes('recommended for release'),
}));
