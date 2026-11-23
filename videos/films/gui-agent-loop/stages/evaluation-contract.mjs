import { readoutCell, taskHeader, text } from '../defaults.mjs';
import { evaluationEpisode } from '../model.mjs';
export function drawEvaluationContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api,
    q = (i, a = 0.1, z = 0.85) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const body = () => {
    taskHeader(ctx, api);
    if (currentBeat === 0) {
      const e = evaluationEpisode();
      text(
        ctx,
        api,
        'Authored local episode E1 · distinguish target hit from goal',
        960,
        365,
        34,
        themeColors.yellow,
        'center',
      );
      readoutCell(ctx, api, 'annotated target rectangle', 180, 470, 650, themeColors.blue, 160);
      api.circle(ctx, 505, 550, 11, themeColors.yellow);
      readoutCell(
        ctx,
        api,
        'local draft: ' + (e.goal ? 'exact traceback saved' : 'pending'),
        1090,
        470,
        650,
        themeColors.green,
        160,
      );
      text(
        ctx,
        api,
        'Modeled dispatched hits' +
          e.targetHits +
          '/' +
          e.dispatchedClicks +
          ' · proposed steps' +
          e.steps,
        960,
        835,
        37,
        themeColors.cyan,
        'center',
      );
      text(
        ctx,
        api,
        'Actual pixel grounding, calls, latency and reviewer load need runtime evidence',
        960,
        1010,
        31,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      text(
        ctx,
        api,
        'Keep forbidden-action denominators explicit',
        960,
        365,
        37,
        themeColors.yellow,
        'center',
      );
      [
        ['proposed actions', 'forbidden1 / proposed5'],
        ['forbidden attempts', 'blocked1 / forbidden1'],
        ['forbidden attempts', 'executed violations0 / forbidden1'],
      ].forEach(([den, v], i) => {
        readoutCell(ctx, api, den, 180, 465 + i * 170, 650, themeColors.blue);
        readoutCell(
          ctx,
          api,
          v,
          1090,
          465 + i * 170,
          650,
          i === 2 ? themeColors.green : themeColors.pink,
        );
      });
    } else if (currentBeat === 2) {
      const rows = [
          ['WebArena', 'functional web final state'],
          ['OSWorld', 'desktop / cross-app state'],
          ['Mind2Web', 'original recorded-page evaluation'],
          ['GAIA', 'assistant answers'],
          ['AgentDojo', 'tool-injection testing'],
        ],
        n = Math.max(1, Math.ceil(q(2) * 5));
      rows.slice(0, n).forEach(([v, task], i) => {
        const y = 395 + i * 116;
        text(ctx, api, v, 180, y + 40, 32, themeColors.blue);
        readoutCell(ctx, api, task, 720, y, 1020, themeColors.cyan, 85);
      });
      text(
        ctx,
        api,
        'Version, validator, task scope and success denominator stay attached',
        960,
        1040,
        30,
        themeColors.yellow,
        'center',
      );
    } else {
      readoutCell(
        ctx,
        api,
        'local model: frame / session / target transitions',
        180,
        410,
        1560,
        themeColors.blue,
      );
      readoutCell(
        ctx,
        api,
        'real release: actual dashboard + timing + injection + final state',
        180,
        650,
        1560,
        themeColors.yellow,
      );
      text(
        ctx,
        api,
        'Local transitions do not establish browser effects, authentication or model quality',
        960,
        970,
        31,
        themeColors.pink,
        'center',
      );
    }
  };
  api.focus.target('evaluation-contract-construction', body);
}
export default {
  id: 'evaluation-contract',
  draw: drawEvaluationContract,
  cues: [
    'evaluation-contract-construct-0',
    'evaluation-contract-construct-1',
    'evaluation-contract-construct-2',
    'evaluation-contract-construct-3',
  ],
};
