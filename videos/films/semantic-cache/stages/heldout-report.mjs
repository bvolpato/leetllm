import { wilsonLower } from '../arithmetic.mjs';
import {
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsLine,
  drawSemanticConstructionsTable,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintHeldoutReport(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  if (currentBeat === 2) {
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Same held-out contract · inspect the denominator and review coverage',
      245,
    );
    drawSemanticConstructionsTable(
      ctx,
      api,
      themeColors,
      [
        ['Report', 'Proposals', 'Reviewed', 'Precision'],
        ['Complete sample', '5,714', '5,714', 'derive from labels'],
        ['Incomplete review', '5,714', '5,713', 'hold report'],
        ['No proposal', '0', '0', 'undefined'],
      ],
      160,
      360,
      1600,
      120,
    );
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      'No proposals → quality lower bound 0 → keep shadow only',
      250,
      860,
      1420,
      themeColors.yellow,
      100,
      31,
    );
    drawSemanticConstructionsFoot(
      ctx,
      api,
      themeColors,
      'Fresh-output review and representative coverage remain separate from cache-pair precision',
    );
  } else {
    const n = currentBeat === 0 ? 5714 : 4,
      lower = wilsonLower(n, n),
      ready = currentBeat === 0 ? done(0, 'sc-report-bound') : done(1, 'sc-report-four');
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      currentBeat === 0
        ? 'Separate frozen held-out policy · 10,000 eligible exact misses'
        : 'Same four distinct cases · independence does not grow by copying',
      245,
    );
    if (currentBeat === 0) {
      const w = 1500,
        hit = (w * 5714) / 10000;
      api.rect(ctx, 210, 370, hit, 125, themeColors.blue);
      api.rect(ctx, 210 + hit, 370, w - hit, 125, themeColors.panel, themeColors.muted, 2);
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        '5,714 proposed + reviewed',
        210 + hit / 2,
        445,
        30,
        themeColors.ink,
        'center',
      );
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        '4,286 fresh',
        210 + hit + (w - hit) / 2,
        445,
        30,
        themeColors.ink,
        'center',
      );
    } else {
      for (let i = 0; i < 4; i++) {
        drawSemanticConstructionsBox(
          ctx,
          api,
          themeColors,
          c,
          'case ' + (i + 1),
          240 + i * 390,
          355,
          300,
          themeColors.cyan,
          90,
        );
        if (done(1, 'sc-report-clones'))
          for (let copy = 1; copy < 4; copy++)
            drawSemanticConstructionsBox(
              ctx,
              api,
              themeColors,
              c,
              'same ' + (i + 1),
              240 + i * 390 + copy * 5,
              475 + copy * 70,
              300,
              themeColors.muted,
              60,
              25,
            );
      }
    }
    const X = (v) => 220 + v * 1480;
    drawSemanticConstructionsLine(
      ctx,
      api,
      themeColors,
      X(0),
      805,
      X(1),
      805,
      themeColors.muted,
      3,
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      '0%',
      X(0),
      865,
      26,
      themeColors.muted,
      'center',
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      '100%',
      X(1),
      865,
      26,
      themeColors.muted,
      'center',
    );
    if (ready) {
      drawSemanticConstructionsLine(
        ctx,
        api,
        themeColors,
        X(lower),
        805,
        X(1),
        805,
        themeColors.green,
        10,
      );
      api.circle(ctx, X(lower), 805, 11, themeColors.yellow);
      drawSemanticConstructionsCenter(
        ctx,
        api,
        themeColors,
        'Wilson lower = ' + n + ' / (' + n + ' + 1.96²) = ' + (lower * 100).toFixed(2) + '%',
        955,
        themeColors.yellow,
        34,
      );
    }
    drawSemanticConstructionsFoot(
      ctx,
      api,
      themeColors,
      currentBeat === 2
        ? 'No proposals: precision is undefined; this gate uses a zero lower bound'
        : 'Binomial interpretation needs representative, suitably independent reviewed cases',
    );
  }
}
export function drawHeldoutReport(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintHeldoutReport);
}
export default {
  id: 'heldout-report',
  draw: drawHeldoutReport,
  cues: [
    'sc-heldout-report-b0',
    'sc-report-bound',
    'sc-heldout-report-b1',
    'sc-report-four',
    'sc-report-clones',
    'sc-heldout-report-b2',
  ],
};
