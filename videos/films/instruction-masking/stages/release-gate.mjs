import { typedGate } from '../arithmetic.mjs';
import { CONSTRUCTION_TARGETS } from '../fixtures.mjs';
import { done } from '../construction.mjs';
import { instructionCell, instructionF, instructionFoot, instructionT } from '../defaults.mjs';
export function drawReleaseGate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0,
    resultComplete = (id, b = 0) => done(state, id, b);
  const aliases = (ids, paint) =>
    ids.reduceRight((next, id) => () => instructionF(ctx, api, id, next), paint)();
  aliases(CONSTRUCTION_TARGETS['release-gate'] ?? [], () =>
    instructionF(ctx, api, 'release-gate-construction', () => {
      drawExtended();
    }),
  );
  function drawExtended() {
    const rows =
      beat === 1
        ? [
            ['NaN', NaN, 0, 620],
            ['boolean', true, 0, 620],
            ['string', '0.99', 0, 620],
          ]
        : [
            ['A', 0.99, 0, 620],
            ['B', 0.94, 1, 410],
          ];
    instructionT(
      ctx,
      api,
      'Illustrative 100-case gate · rate ≥ .98, critical = 0, p95 ≤ 700 ms',
      180,
      305,
      33,
      themeColors.ink,
    );
    rows.forEach(([name, rate, critical, latency], i) => {
      const y = 420 + i * 160;
      instructionCell(ctx, api, name, 180, y, 230, 85, themeColors.blue, 35);
      instructionT(ctx, api, String(rate), 540, y + 55, 38, themeColors.yellow);
      instructionT(ctx, api, critical, 890, y + 55, 38, themeColors.yellow);
      instructionT(ctx, api, latency + ' ms', 1190, y + 55, 38, themeColors.yellow);
      const show =
          beat === 1
            ? resultComplete('im-invalid-types', 1)
            : resultComplete(i ? 'im-fast-fail' : 'im-good-candidate', 0),
        decision = typedGate({
          parity: true,
          rate,
          critical,
          latency,
        });
      instructionT(
        ctx,
        api,
        show ? (decision.pass ? 'PASS' : 'HOLD') : '?',
        1640,
        y + 55,
        36,
        show && decision.pass ? themeColors.green : show ? themeColors.pink : themeColors.muted,
      );
    });
    instructionT(ctx, api, 'rate', 540, 370, 29, themeColors.muted);
    instructionT(ctx, api, 'critical', 890, 370, 29, themeColors.muted);
    instructionT(ctx, api, 'p95 latency', 1190, 370, 29, themeColors.muted);
    if (beat === 2)
      instructionT(
        ctx,
        api,
        'Sample gate passed → slice review + human review + monitoring',
        180,
        900,
        34,
        themeColors.yellow,
      );
    instructionFoot(
      ctx,
      api,
      'Finite numeric rates; nonnegative integer errors; nonnegative finite latency; literal Boolean parity',
    );
  }
}
export default {
  id: 'release-gate',
  draw: drawReleaseGate,
  cues: [
    'release-gate-b1',
    'im-good-candidate',
    'im-fast-fail',
    'release-gate-b2',
    'im-invalid-types',
    'release-gate-b3',
  ],
};
