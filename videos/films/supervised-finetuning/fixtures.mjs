// The labels stand for spans of the approved T102 conversation, not real subword IDs.
export const TOKENS = Object.freeze([
  'SYSTEM',
  'policy',
  'USER',
  '18 days',
  'ASSIST',
  'open',
  'ticket',
  'END',
]);
export const MASK = Object.freeze([0, 0, 0, 0, 0, 1, 1, 1]);
export const REPLY_PROBS = Object.freeze([0.6, 0.7, 0.8]);
export const PACKED_TOKENS = Object.freeze([
  'A:prompt',
  'A:answer',
  'A:EOS',
  'B:prompt',
  'B:answer',
  'B:EOS',
]);
export const SFT_CHECKPOINTS = Object.freeze([
  { step: 200, format: 0.99, policy: 0.93, loss: 1.91 },
  { step: 400, format: 1, policy: 0.91, loss: 1.77 },
  { step: 600, format: 0.98, policy: 0.97, loss: 1.79 },
]);
