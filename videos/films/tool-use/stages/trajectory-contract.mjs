import { cueProgress } from '../arithmetic.mjs';
import { TOOL_GOOD_TRACE } from '../fixtures.mjs';
import { scoreToolTrajectory } from '../model.mjs';
import { box, chapterText, footer, heading } from '../defaults.mjs';
export function drawTrajectoryContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    cueProgress2 = (id, beat = currentBeat) =>
      currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : cueProgress(state.cues, 'tu-' + id, Math.max(0, Math.min(1, (progress - 0.08) / 0.8))),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-trajectory-contract-mechanism', () => {
    heading(ctx, api, 'Retain the same call, observation and rendered answer');
    const rows = structuredClone(TOOL_GOOD_TRACE),
      renderBad = currentBeat === 1 && resultComplete('trace-render-fail', 1),
      okBad = currentBeat === 1 && resultComplete('trace-ok-fail', 1);
    if (renderBad) rows[2].text = 'Release reranker-v16: succeeded.';
    if (okBad) {
      rows[2].text = TOOL_GOOD_TRACE[2].text;
      rows[1].ok = false;
    }
    const build = currentBeat > 0 ? 1 : cueProgress2('trajectory-contract-1', 0);
    box(
      ctx,
      api,
      '1 · call',
      ['id: status-1', 'name: get_release_status', 'release_id: reranker-v16'],
      150,
      365,
      1580,
      themeColors.blue,
      170,
    );
    if (build > 1 / 3)
      box(
        ctx,
        api,
        '2 · observation',
        ['call_id: ' + rows[1].call_id, 'ok: ' + rows[1].ok + ' · status: canary_failed'],
        150,
        590,
        1580,
        okBad ? themeColors.pink : themeColors.cyan,
        135,
      );
    if (build > 2 / 3)
      box(
        ctx,
        api,
        '3 · answer',
        rows[2].text,
        150,
        780,
        1580,
        renderBad && !okBad ? themeColors.pink : themeColors.green,
        100,
      );
    const result = scoreToolTrajectory(rows);
    if (currentBeat === 1)
      chapterText(
        ctx,
        api,
        result.reason,
        150,
        970,
        31,
        result.ok ? themeColors.green : themeColors.pink,
      );
    if (currentBeat === 2)
      chapterText(
        ctx,
        api,
        'Trusted runtime events ≠ authenticated arbitrary log or free-form proof',
        150,
        970,
        28,
        themeColors.yellow,
      );
    footer(
      ctx,
      api,
      'Fixed deterministic renderer contract; full authorization and actual effects need independent evidence.',
    );
  });
}
export default {
  id: 'trajectory-contract',
  draw: drawTrajectoryContract,
  cues: [
    'tu-trajectory-contract-1',
    'tu-trace-link',
    'tu-trace-true',
    'tu-trajectory-contract-2',
    'tu-trace-render-fail',
    'tu-trace-ok-fail',
    'tu-trajectory-contract-3',
  ],
};
