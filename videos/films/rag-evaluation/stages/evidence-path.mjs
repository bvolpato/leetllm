import { evidenceSnapshot } from '../model.mjs';
import { card } from '../defaults.mjs';

export function drawEvidencePath(ctx, scene, state, api) {
  const { C, text } = api;
  const trace = evidenceSnapshot(state);
  const sources = [
    { id: 'A', label: 'Closure and return box', color: C.blue },
    { id: 'B', label: 'Next-day receipt', color: C.cyan },
    { id: 'C', label: 'Friday author event', color: C.muted },
  ];
  const x = [150, 742, 1334];
  text(ctx, 'This question needs notices A and B.', 150, 275, 42, C.ink);
  ['Available to this reader', 'Search returned', 'In the prompt'].forEach((name, col) =>
    text(ctx, name, x[col], 365, 33, C.muted),
  );
  const sets = [sources.map((s) => s.id), trace.candidateIds, trace.ids];
  sources.forEach(({ id, label, color }, row) => {
    const y = 415 + row * 128;
    sets.forEach((set, col) => {
      if (!set.includes(id)) return;
      api.focus.target(['source-records', 'search-result', 'packed-sources'][col], () =>
        card(ctx, api, id + '   ' + label, x[col], y, 445, color, 108),
      );
    });
  });
  if (trace.progress > 0 && trace.progress < 1) {
    const col = trace.progress < 0.5 ? 0 : 1;
    const p = (trace.progress * 2) % 1;
    const from = x[col] + 460;
    api.arrow(ctx, from, 590, from + 28 + 85 * p, 590, C.cyan, 4);
  }
  api.focus.target('source-recall', () => {
    text(ctx, 'Recall', x[0], 860, 34, C.muted);
    text(ctx, trace.candidateRecall * 2 + ' / 2 needed notices', x[1], 860, 36, C.ink);
    text(ctx, trace.recall * 2 + ' / 2 needed notices', x[2], 860, 36, C.ink);
  });
  api.focus.target('source-precision', () => {
    text(ctx, 'Selected-set precision', x[0], 951, 34, C.muted);
    text(
      ctx,
      trace.recall * 2 + ' useful / ' + trace.ids.length + ' selected',
      x[2],
      951,
      36,
      C.ink,
    );
  });
}

export default {
  id: 'evidence-path',
  draw: drawEvidencePath,
  cues: [
    'trace-sources',
    'recall-half',
    'both-sources',
    'precision-denominator',
    'permitted-collection',
  ],
};
