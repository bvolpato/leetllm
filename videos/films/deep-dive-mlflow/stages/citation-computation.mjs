import { citationPass } from '../model.mjs';
import { chip } from '../defaults.mjs';
import { mix } from '../arithmetic.mjs';
import { spokenScene } from '../pieces/scene.mjs';

const allowed = ['DOC-12'];
const lab = [[], ['DOC-99'], ['DOC-12']];

export default spokenScene('citation-computation', (ctx, scene, state, api, g) => {
  const { C } = api;
  api.text(ctx, 'Answer   “30 days”', 150, 282, 46, C.ink);
  api.text(ctx, 'Allowed sources    { DOC-12 }', 1030, 282, 37, C.cyan);
  api.line(ctx, 145, 330, 1775, 330, C.muted, 2);
  if (state.beat === 0) {
    api.text(ctx, 'Citations returned', 150, 422, 32, C.muted);
    api.text(ctx, 'Code score', 1060, 422, 32, C.muted);
    lab.forEach((citations, i) => {
      const p = g(0, i + 1);
      if (p <= 0) return;
      const y = 529 + i * 135,
        pass = citationPass(citations, allowed);
      api.text(ctx, JSON.stringify(citations), 155, y, 44, C.ink, 'left', 'mono');
      if (p >= 0.85) api.text(ctx, pass ? 'TRUE' : 'FALSE', 1060, y, 44, pass ? C.green : C.pink);
    });
    if (g(0, 3) >= 1)
      api.text(ctx, '1 passing response / 3 scored responses', 150, 955, 38, C.yellow);
    return;
  }
  if (state.beat === 3) {
    api.text(ctx, 'Cited in reply', 155, 462, 32, C.muted);
    chip(ctx, api, 'DOC-12', 155, 507, 320, C.green, 98, 43);
    api.text(ctx, '✓ Allowed ID', 155, 723, 38, C.green);
    if (g(3, 1) > 0) {
      api.text(ctx, 'Check against the cited revision', 805, 462, 36, C.ink);
      api.text(ctx, 'Does the policy support “30 days”?', 805, 588, 41, C.yellow);
    }
    if (g(3, 2) > 0)
      api.text(
        ctx,
        'Same examples   /   compare human labels with judge scores',
        155,
        915,
        39,
        C.cyan,
      );
    return;
  }
  const append = g(1, 1);
  const revealFirst = g(2, 0) >= 0.78,
    revealSecond = g(2, 1) >= 0.5;
  api.text(ctx, 'Citations in this reply', 155, 431, 32, C.muted);
  chip(ctx, api, 'DOC-12', 155, 485, 415, revealFirst ? C.green : C.blue, 109, 47);
  if (append > 0)
    chip(
      ctx,
      api,
      'DOC-99',
      mix(775, 632, append),
      485,
      415,
      revealSecond ? C.pink : C.blue,
      109,
      47,
    );
  if (revealFirst) api.text(ctx, '✓ in allowed set', 158, 679, 38, C.green);
  if (revealSecond) api.text(ctx, '× outside set', 635, 679, 38, C.pink);
  if (revealSecond) {
    const pass = citationPass(['DOC-12', 'DOC-99'], allowed);
    api.text(ctx, 'List score', 1340, 439, 32, C.muted);
    api.text(ctx, pass ? 'TRUE' : 'FALSE', 1340, 566, 72, pass ? C.green : C.pink);
  }
  if (state.beat === 1 && g(1, 2) > 0)
    api.text(
      ctx,
      'One allowed member and one unknown member. Does the list pass?',
      155,
      911,
      39,
      C.yellow,
    );
  if (state.beat === 2 && g(2, 2) > 0) {
    const single = 'DOC-12';
    api.text(ctx, JSON.stringify(single) + '   (bare string)', 155, 893, 39, C.ink, 'left', 'mono');
    api.text(
      ctx,
      citationPass(single, allowed) ? 'TRUE' : 'FALSE: expected a list',
      915,
      893,
      40,
      C.pink,
    );
  }
});
