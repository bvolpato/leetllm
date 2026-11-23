import { releaseAction } from '../model.mjs';
import { mechanismBox, mechanismFocus, mechanismText } from '../defaults.mjs';
export function drawEarnedTransfer(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const { C: themeColors } = api;
  mechanismFocus(ctx, api, 'earned-transfer-mechanism', () => {
    const removal =
      currentBeat === 0 ? 0 : currentBeat > 1 ? 1 : api.focus.progress('earned-transfer-b2', 0);
    const report = removal === 0,
      verdictShown =
        currentBeat === 0 ||
        currentBeat > 1 ||
        api.focus.progress('earned-evidence-verdict', 0) >= 1;
    const decision = verdictShown
      ? releaseAction('promote', 0.97, new Set(report ? ['eval_report'] : []))
      : null;
    mechanismText(
      ctx,
      api,
      'Same new proposal · promote · supplied score 0.97',
      960,
      275,
      38,
      themeColors.cyan,
      'center',
    );
    mechanismText(
      ctx,
      api,
      'Illustrative cutoff 0.95 · score stays fixed',
      960,
      400,
      35,
      themeColors.muted,
      'center',
    );
    const x = 400 + 600 * removal,
      markerColor = report ? themeColors.blue : themeColors.muted;
    mechanismBox(ctx, api, x, 520, 420, 105, markerColor);
    mechanismText(
      ctx,
      api,
      report
        ? 'Report marker present'
        : removal < 1
          ? 'Moving report marker'
          : 'Report marker removed',
      x + 210,
      585,
      30,
      markerColor,
      'center',
    );
    const verdict =
      decision === null
        ? 'Predict the permitted next action'
        : decision === 'promote'
          ? 'Local numeric gate: promote'
          : 'REQUEST EVIDENCE';
    mechanismText(
      ctx,
      api,
      verdict,
      960,
      820,
      43,
      decision === null
        ? themeColors.ink
        : decision === 'promote'
          ? themeColors.green
          : themeColors.yellow,
      'center',
    );
    mechanismText(
      ctx,
      api,
      'Real execution still binds report identity, artifact, cohort and caller authority',
      960,
      1010,
      29,
      themeColors.muted,
      'center',
    );
  });
  return;
}
export default {
  id: 'earned-transfer',
  draw: drawEarnedTransfer,
  cues: [
    'earned-transfer-b1',
    'earned-transfer-b2',
    'earned-evidence-verdict',
    'earned-transfer-b3',
  ],
};
