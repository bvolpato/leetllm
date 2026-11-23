import { canonicalFresh } from '../fixtures.mjs';
import { freshTracking } from '../model.mjs';
import { clause } from '../construction.mjs';
import { cueClock } from '../report-picture.mjs';

export function drawFreshContract(ctx, scene, state, api) {
  const { C } = api;
  const s = freshTracking(state, api);
  const at = cueClock(scene, state);
  const loadedShown = state.beat > 0 || clause(state, scene.id, 0, 2, api) > 0;
  const row = (target, label, items, y) =>
    api.focus.target(target, () => {
      api.text(ctx, label, 125, y + 58, 37, C.ink);
      items.forEach((item, i) => {
        const left = 690 + i * 180;
        const recovered = target === 'r-eight' && s.canonical && item.id === 'F';
        api.rect(ctx, left, y, 138, 81, C.panel, recovered ? C.green : C.muted, 8);
        api.text(ctx, item.id, left + 69, y + 58, 47, recovered ? C.green : C.ink, 'center');
      });
    });
  api.text(
    ctx,
    'Six-case review   /   reported score for each run: ' +
      s.exact +
      ' of ' +
      canonicalFresh.length +
      ' routes',
    125,
    238,
    37,
    C.cyan,
  );
  row('expected-ids', 'Frozen case IDs', canonicalFresh, 302);
  row('r-eight', 'R8   /   saved IDs', s.rows, 414);
  if (loadedShown) {
    row('r-nine', 'R9   /   saved IDs', s.workerRows, 526);
    api.focus.target('worker', () => {
      api.text(ctx, 'R9   /   temperature', 125, 731, 37, C.ink);
      api.text(ctx, 'Evaluated   ' + s.approvedTemperature.toFixed(1), 690, 731, 41, C.ink);
      api.text(
        ctx,
        'Loaded   ' + s.temperature.toFixed(1),
        1250,
        731,
        41,
        s.configMatches ? C.green : C.ink,
      );
    });
  }
  api.line(ctx, 125, 796, 1776, 796, C.muted, 2);
  api.focus.target('next-action', () => {
    if (!s.reveal) {
      api.text(
        ctx,
        loadedShown
          ? 'Which row does R8 need? Which setting must R9 reload?'
          : 'Compare each saved ID with the frozen suite.',
        125,
        913,
        43,
        loadedShown ? C.yellow : C.ink,
      );
    } else if (state.beat === 1) {
      api.text(
        ctx,
        s.canonical
          ? 'R8   /   six distinct cases verified'
          : 'R8   /   recover the original row for ' + s.missing.join(', '),
        125,
        877,
        39,
        s.canonical ? C.green : C.pink,
      );
      api.text(
        ctx,
        s.configMatches
          ? 'R9   /   loaded setting verified'
          : 'R9   /   reload the evaluated temperature, 0.0',
        125,
        966,
        39,
        s.configMatches ? C.green : C.pink,
      );
    } else if (at('tr-fresh-contract-2-3') > 0) {
      api.text(ctx, 'Optimizer selection', 125, 860, 32, C.cyan);
      api.text(ctx, 'Winning score', 125, 951, 48, C.ink);
      const run = at('follow-source-run');
      const program = at('open-program');
      if (run > 0) api.arrow(ctx, 510, 934, 510 + 162 * run, 934, C.cyan, 4);
      if (run === 1) api.text(ctx, 'Source run', 742, 951, 48, C.ink);
      if (program > 0) api.arrow(ctx, 1050, 934, 1050 + 162 * program, 934, C.cyan, 4);
      if (program === 1) api.text(ctx, 'Saved program', 1280, 951, 48, C.ink);
    } else {
      api.text(
        ctx,
        s.eligibleCount + ' eligible records   /   apply the selection rule',
        125,
        875,
        46,
        C.green,
      );
      api.text(ctx, 'Fresh cases   /   answer quality, latency and cost', 125, 966, 35, C.ink);
    }
  });
}
export default {
  id: 'fresh-contract',
  draw: drawFreshContract,
  cues: [
    'tr-fresh-contract-0-0',
    'tr-fresh-contract-0-1',
    'tr-fresh-contract-0-2',
    'tr-fresh-contract-0-3',
    'tr-fresh-contract-0-4',
    'tr-fresh-contract-0-5',
    'tr-fresh-contract-1-0',
    'tr-fresh-contract-1-1',
    'tr-fresh-contract-1-2',
    'tr-fresh-contract-1-3',
    'tr-fresh-contract-1-4',
    'tr-fresh-contract-2-0',
    'tr-fresh-contract-2-1',
    'tr-fresh-contract-2-2',
    'tr-fresh-contract-2-3',
    'follow-source-run',
    'open-program',
  ],
};
