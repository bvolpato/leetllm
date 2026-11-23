import { routes } from '../fixtures.mjs';
import { drawRouteBoard } from '../route-board.mjs';

export function drawComplexityAndChoice(ctx, scene, state, api) {
  const { C, focus } = api;
  if (state.beat === 0) {
    const next = focus.progress('pair-growth', api.phase(state.beatP, 0.35, 0.65));
    const n = 4 + Math.floor(4 * next);
    const size = 58;
    const left = 370,
      top = 330;
    focus.target('pair-grid', () => {
      api.text(ctx, 'Record', 220, 278, 33, C.muted);
      for (let i = 0; i < n; i++) {
        api.text(ctx, String(i + 1), left - 49, top + i * size + 34, 29, C.blue, 'center');
        api.text(ctx, String(i + 1), left + i * size + 20, top - 24, 29, C.blue, 'center');
        for (let j = 0; j < n; j++) {
          api.rect(
            ctx,
            left + j * size,
            top + i * size,
            42,
            42,
            j > i ? C.cyan : C.panel,
            undefined,
            5,
          );
        }
      }
      api.text(ctx, 'One lit square per unordered pair', 535, 884, 35, C.cyan, 'center');
    });
    focus.target('work-count', () => {
      api.text(ctx, n + ' records', 1070, 405, 53, C.blue);
      api.text(ctx, n + ' × ' + (n - 1) + ' ÷ 2 = ' + (n * (n - 1)) / 2, 1070, 547, 54, C.cyan);
      api.text(ctx, 'possible pairs to check', 1070, 629, 38, C.ink);
      api.text(ctx, 'One full scan visits ' + n + ' records.', 1070, 754, 33, C.muted);
    });
    return;
  }
  const checked = ['direct-recall-result', 'eligible-route', 'recursive-limit-result'].map(
    (id, i) =>
      focus.progress(
        id,
        state.beat > 1 ? api.phase(state.beatP, [0.02, 0.53, 0.29][i], [0.25, 0.8, 0.5][i]) : 0,
      ) >= 1,
  );
  drawRouteBoard(ctx, api, {
    rows: routes,
    cap: 0.3,
    inspected: checked,
    reveal: checked.every(Boolean),
    question: 'Which route clears all three limits?',
  });
}
export default {
  id: 'complexity-and-choice',
  draw: drawComplexityAndChoice,
  cues: [
    'scan-records',
    'pair-growth',
    'count-pairs',
    'direct-recall-result',
    'recursive-limit-result',
    'eligible-route',
  ],
};
