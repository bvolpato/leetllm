import { decomposition } from '../arithmetic.mjs';
import { heard, movement } from '../construction.mjs';
import { P, Q, WORDS, TWO_GAP_Q } from '../fixtures.mjs';
import { massLedger } from '../mass-ledger.mjs';

export function drawProof(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const deal = movement(state, 3, 'new-shares', 0.12, 0.32);
  const second = beat >= 3 && deal > 0;
  const q = second ? P.map((p, i) => p + (TWO_GAP_Q[i] - p) * deal) : Q;
  const d = decomposition(P, q);
  const cue = second ? 'split-correction' : 'correction-path';
  const progress = movement(state, second ? 4 : 1, cue, 0.12, 0.70);
  const settled = state.cues?.[cue] ? state.cues[cue].phase === 'after' : progress === 1;
  const question = second || beat >= 3 ? 'When cat is rejected, how often should the correction be dog?'
    : 'Where should the three extra tenths go?';
  const split = second && heard(state, 4, 'dog-third', 0.18);
  api.focus.target('mass-ledger', () => {
    massLedger(ctx, api, {
      words: WORDS, target: P, overlap: d.overlap, settled,
      loose: q.map((v, i) => (v - d.overlap[i]) * (1 - progress)),
      added: d.deficit.map((v) => v * progress),
      legend: [
        { text: 'Accepted', color: C.cyan },
        { text: 'Draft excess', color: C.pink },
        { text: 'Correction', color: C.yellow },
      ],
      emphasis: split ? 1 : undefined,
    });
  });
  api.focus.target('mass-identity', () => {
    let footer = question;
    if (!second && beat < 3 && progress > 0) footer = 'bird     0.20 accepted   +   0.30 × ' +
      d.residual[0].toFixed(2) + ' from rejection';
    if (beat === 2) footer = 'min(p, q)   +   max(p − q, 0)   =   p';
    if (split) footer = 'dog     ' + d.deficit[1].toFixed(2) + ' missing ÷ ' + d.z.toFixed(2) + ' rejected = ⅓ of corrections';
    api.text(ctx, footer, 960, 981, 38, split ? C.yellow : C.ink, 'center');
  });
}
export default {
  id: 'proof', draw: drawProof,
  cues: ['accepted-path', 'find-space', 'correction-path', 'add-contributions',
    'target-law-identity', 'new-shares', 'two-gaps', 'dog-third', 'split-correction'],
};
