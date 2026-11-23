import { assertEqual } from 'vizmatic/stage';
import { area, heading } from '../kit-narrated.mjs';
import { catalog, ORDERING_PRODUCTS } from '../../films/capstone-product-ranking-recommendation/fixtures.mjs';
import { dcg } from '../../films/capstone-product-ranking-recommendation/arithmetic.mjs';
export { catalog, ORDERING_PRODUCTS, dcg };

// Product colors retain their identity. Cyan is evidence, yellow is focus, and red is rejection.
export const COLOR = { P4: 'blue', P5: 'green', P6: 'pink', P8: 'red', P11: 'red', J1: 'blue', J2: 'green', J3: 'pink', J5: 'cyan' };
export const STATE = {
  intro: 'P8 policy block; P11 region mismatch; P5/P6/P4 eligible.',
  'funnel-contract': 'MMR worksheet selects P5 then P4.',
  eligibility: 'Required rules exclude P8 and P11.',
  'slate-recheck': 'Current P5 stock is false; historical snapshot stays separate.',
  ordering: 'P5/P6/P4 ideal order.',
  'metric-contracts': 'Fixed authored judgments; binary relevance starts at grade 2.',
  recall: 'Hold the judgments fixed. Omit P6, then restore it and demote only its ranking score.',
  'offline-gates': 'Two-query author fixture and synthetic latency stay separate.',
  pairwise: 'Twelve-update illustration ends at rankingResponse(12).',
  'pairwise-objective': 'Independent zero-weight, one-pair update.',
  'training-matrix': 'Independent first nine-pair average update.',
  time: 'Move PENDING-4 labels before the freeze, then move a feature past serving.',
  'temporal-protocol': 'Three training, two validation, two test requests.',
  'trained-model': 'fitPairwise(0.1), selected on validation.',
  exposure: 'Ten comparable impressions per product; rates remain observational.',
  'click-model': 'Clipped toy expectation is biased at position three.',
  'propensity-contract': 'Evaluation-only fixture has unset propensity fields.',
  synthesis: 'Separate twelve-update illustration saved as R42.',
  'response-lineage': 'Separate hand-entered REQ500 and REQ501 returned rows.',
  'outcome-join': 'EVT900 click and EVT901 purchase join REQ501/P5.',
  'experiment-contract': 'Stable shopper assignment and separately declared stops.',
  'probability-value': 'Probability worksheet is separate from ordering scores.',
  'online-guardrails': 'Independent authored worksheet stops treatment.',
  'receipt-boundary': 'Fixture checks pass; live readiness remains false.',
  'fresh-ranking': 'A seller cap holds J5 in reserve. Stock loss brings it into slot two of L17.',
};

export function open(s, c) {
  s.add(heading(c.title));
  return area;
}

// An assertion with rounding tolerance, used for the narrated worksheet arithmetic.
export function near(actual, expected, description) { assertEqual(Math.abs(actual - expected) < 0.00001, true, description); }
