import { TOOL_RECEIPTS } from '../fixtures.mjs';
import { typedToolRelease } from '../model.mjs';
import { box, chapterText, footer, heading, table } from '../defaults.mjs';
export function drawTypedReleaseEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
    resultComplete = (id, beat = currentBeat) =>
      currentBeat > beat ||
      (currentBeat === beat &&
        (state.cues ? state.cues['tu-' + id]?.phase === 'after' : progress >= 0.9));
  api.focus.target('tu-typed-release-evidence-mechanism', () => {
    heading(ctx, api, 'Validate receipt types before measuring the complete cohort');
    const m = typedToolRelease(TOOL_RECEIPTS);
    if (currentBeat === 0) {
      table(
        ctx,
        api,
        ['field', 'valid type / boundary', 'invalid example'],
        [
          ['passed', 'exact Boolean', '1'],
          ['read/write violations', 'integer ≥ 0', '−1'],
          ['rounds', 'integer ≥ 1', 'true'],
          ['latency / cost', 'finite nonnegative number', 'NaN'],
        ],
        150,
        390,
        [460, 660, 480],
        115,
      );
      if (resultComplete('receipts-types', 0))
        chapterText(
          ctx,
          api,
          'Reject malformed evidence · aggregate remains unavailable',
          150,
          975,
          29,
          themeColors.pink,
        );
    } else if (currentBeat === 1) {
      table(
        ctx,
        api,
        ['run', 'passed / rounds', 'latency ms / cents'],
        TOOL_RECEIPTS.map((r, i) => [
          'R' + (i + 1),
          String(r.passed) + ' / ' + r.rounds,
          r.latency_ms + ' / ' + r.cost_cents,
        ]),
        150,
        380,
        [350, 600, 650],
        105,
      );
      const rate = resultComplete('receipts-75', 1),
        rounds = resultComplete('receipts-rounds', 1),
        latency = resultComplete('receipts-latency', 1),
        cost = resultComplete('receipts-cost', 1);
      chapterText(
        ctx,
        api,
        rate
          ? m.passed +
              ' / ' +
              m.total +
              ' = ' +
              100 * m.rate +
              '% · violations ' +
              (m.reads + m.writes)
          : 'cohort rate: pending',
        150,
        890,
        29,
        rate ? themeColors.green : themeColors.muted,
      );
      chapterText(
        ctx,
        api,
        rounds ? 'max rounds: ' + m.rounds : 'max rounds: pending',
        1050,
        890,
        29,
        themeColors.cyan,
      );
      chapterText(
        ctx,
        api,
        latency ? 'max latency: ' + m.latency + ' / 600 ms' : 'latency maximum: pending',
        150,
        960,
        29,
        latency ? themeColors.pink : themeColors.muted,
      );
      chapterText(
        ctx,
        api,
        cost ? 'max cost: ' + m.cost + ' / 3 cents' : 'cost maximum: pending',
        1050,
        960,
        29,
        cost ? themeColors.pink : themeColors.muted,
      );
      if (resultComplete('receipts-reject', 1))
        chapterText(ctx, api, 'HOLD', 1690, 280, 34, themeColors.pink, 'right');
    } else {
      box(
        ctx,
        api,
        'All four offered runs',
        'failed run still contributes latency and cost',
        150,
        410,
        720,
        themeColors.blue,
        150,
      );
      box(
        ctx,
        api,
        'Invalid incident accounting',
        ['negative counts cannot cancel violations', 'NaN is invalid, not an omitted measurement'],
        1050,
        410,
        680,
        themeColors.pink,
        150,
      );
      chapterText(
        ctx,
        api,
        'Task completion and policy adherence retain separate denominators',
        150,
        820,
        30,
        themeColors.cyan,
      );
      chapterText(
        ctx,
        api,
        'Actual held-out model/tool evidence is a later release requirement',
        150,
        950,
        29,
        themeColors.yellow,
      );
    }
    footer(
      ctx,
      api,
      'Four supplied measurements exercise arithmetic. They do not benchmark a real model or deployment.',
    );
  });
}
export default {
  id: 'typed-release-evidence',
  draw: drawTypedReleaseEvidence,
  cues: [
    'tu-typed-release-evidence-1',
    'tu-receipts-types',
    'tu-typed-release-evidence-2',
    'tu-receipts-75',
    'tu-receipts-rounds',
    'tu-receipts-latency',
    'tu-receipts-cost',
    'tu-receipts-reject',
    'tu-typed-release-evidence-3',
  ],
};
