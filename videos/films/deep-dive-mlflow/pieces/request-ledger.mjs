import { mix } from '../arithmetic.mjs';
import { chip } from '../defaults.mjs';

export const requests = [
  { id: 'T103', prompt: 16, index: 'I7', citation: '[DOC-12]' },
  { id: 'T104', prompt: 17, index: 'I8', citation: '[]' },
];

export function requestLedger(
  ctx,
  api,
  { earlier, later, common, prompts, indices, replay, missing },
) {
  const { C } = api;
  const x = [175, 420, 755, 1040, 1300];
  api.text(ctx, '“What is the return window?”', 145, 270, 52, C.ink);
  if (common)
    api.text(ctx, 'Both requests   ·   commit 8b2f9e1   ·   model M3', 154, 335, 32, C.cyan);
  ['Request', 'Reply', 'Citations', 'Prompt', 'Search index'].forEach((s, i) =>
    api.text(ctx, s, x[i], 420, 29, C.muted),
  );
  function row(y, values, color, active = 1) {
    api.line(ctx, 145, y + 40, 1770, y + 40, C.muted, 1);
    values.forEach((v, i) => {
      const ink = i === 2 && v === '[]' && missing ? C.pink : i === 0 ? color : C.ink;
      api.text(ctx, v, x[i] + (i === 0 ? mix(34, 0, active) : 0), y, 40, ink);
    });
  }
  for (const [i, r] of requests.entries()) {
    const p = i === 0 ? earlier : later;
    if (p > 0)
      row(
        520 + 123 * i,
        [r.id, '30 days', r.citation, prompts ? 'v' + r.prompt : '·', indices ? r.index : '·'],
        C.blue,
        p,
      );
  }
  if (replay) {
    row(
      787,
      [replay.id, 'to measure', 'to score', 'v' + replay.prompt, replay.index ?? '?'],
      C.yellow,
    );
    if (!replay.index) api.line(ctx, 1300, 806, 1430, 806, C.yellow, 4);
  }
}
export function frozenCase(ctx, api, { caseProgress, candidate, index, linked }) {
  const { C } = api;
  api.text(ctx, '“What is the return window?”', 145, 270, 52, C.ink);
  api.text(ctx, 'Request T104', 155, 415, 34, C.blue);
  api.text(ctx, '30 days', 155, 512, 56, C.ink);
  api.text(ctx, 'Citations   []', 155, 585, 36, C.pink);
  api.text(ctx, 'v17   ·   I8   ·   M3', 155, 665, 34, C.muted);
  if (caseProgress > 0) {
    const y = mix(485, 390, caseProgress);
    api.line(ctx, 560, 375, 560, 730, C.muted, 2);
    api.text(ctx, 'Case RET-104', 645, y + 25, 36, C.yellow);
    api.text(ctx, 'Return-window question', 645, y + 125, 34, C.ink);
    api.text(ctx, 'Allowed source', 645, y + 212, 29, C.muted);
    chip(ctx, api, 'DOC-12', 645, y + 242, 250, C.yellow, 65, 32);
  }
  if (candidate) {
    api.line(ctx, 1175, 375, 1175, 730, C.muted, 2);
    api.text(ctx, linked ? 'Replay T105' : 'Candidate replay', 1250, 415, 36, C.cyan);
    api.text(ctx, 'Prompt v18', 1250, 515, 43, C.ink);
    api.text(ctx, index ? 'I8   ·   M3' : 'Index   ?', 1250, 597, 35, C.ink);
    if (linked) api.text(ctx, 'Case   RET-104', 1250, 681, 34, C.yellow);
  }
}
