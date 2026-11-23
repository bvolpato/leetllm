import { PROPOSALS, VARIANTS } from '../fixtures.mjs';
import { expandQueries } from '../model.mjs';
import { spoken } from '../construction.mjs';

export function drawVocabularyExpansion(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const original = 'peak demand handling';
  focus.target('original-question', () => {
    label('Original query', 135, 260, 30, C.muted);
    label(original, 135, 343, 55, C.blue);
  });
  api.line(ctx, 135, 406, 1785, 406, C.muted, 2);
  if (state.beat === 0) {
    label('Wording in the runbooks', 135, 502, 34, C.muted);
    const rows = ['Burst quota limits', 'Queue backpressure', 'Autoscaling capacity'];
    rows.forEach((name, i) => {
      const p = spoken(state, 0, ['variant-burst', 'variant-queue', 'variant-capacity'][i]);
      focus.target('runbook-vocabulary', () =>
        label(p > 0 ? name : '·', 135, 619 + 141 * i, 48, C.ink),
      );
    });
    return;
  }
  label('Proposed search text', 135, 489, 32, C.muted);
  label('Additional search slots   ·   limit 3', 1070, 489, 32, C.muted);
  const accepted = expandQueries(original, PROPOSALS, 3).slice(1);
  const cueIds = [
    'variant-first',
    'variant-repeat',
    'variant-next',
    'variant-last',
    'variant-extra',
  ];
  const settled = cueIds.map((id) => spoken(state, 1, id) === 1);
  PROPOSALS.forEach((value, i) => {
    const y = 578 + 90 * i;
    const phrase = value.trim();
    focus.target('variant-proposals', () => label(phrase, 135, y, 36, C.ink));
    if (settled[i] && (i === 1 || i === 4))
      label(i === 1 ? 'duplicate' : 'cap reached', 722, y, 31, C.yellow);
  });
  accepted.forEach((q, i) => {
    const y = 602 + 134 * i;
    const visible = settled[PROPOSALS.indexOf(VARIANTS[i])];
    focus.target('variant-slots', () => {
      label(String(i + 1), 1070, y, 39, C.muted);
      label(visible ? q : '·', 1145, y, 36, C.cyan);
    });
    api.line(ctx, 1070, y + 32, 1785, y + 32, C.panel, 3);
  });
}

export default {
  id: 'vocabulary-expansion',
  draw: drawVocabularyExpansion,
  cues: [
    'variant-burst',
    'variant-queue',
    'variant-capacity',
    'variant-first',
    'variant-repeat',
    'variant-next',
    'variant-last',
    'variant-extra',
  ],
};
