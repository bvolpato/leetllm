// Scene 13: held-out: Same codes (1,1) vs (1,2) on fresh inputs (1,0) and (0,1) -> predict winner? -> AFTER fresh-score reveal Nearest wins (0.1921 vs 1.9721!).
import {
  COSMOS,
  HELD_OUT,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  squaredOutputError,
  txt,
} from '../parts.mjs';

export default function heldOut(s, c) {
  const showRows = s.value(0);
  const revealWinner = s.value(0); // strictly withheld until AFTER fresh-score!

  const nearHeld = squaredOutputError([1, 1], HELD_OUT);
  const compHeld = squaredOutputError([1, 2], HELD_OUT);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Calibration Overfitting:', 'Same Codes on Held-Out Inputs'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.err,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rw = showRows.value;
    const win = revealWinner.value;

    const barX = -440;
    const maxW = 900;
    const px = maxW / 2.2;

    const nodes = [
      txt(
        'FRESH INPUTS:  x1 = (1, 0) [SOURCE 1.20],   x2 = (0, 1) [SOURCE 0.61]',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('Row 1 (1,0): both return 1.00 (gap -0.20)', -440, -110, {
        w: 790,
        h: 72,
        color: ROLE.weight,
        size: 26,
        opacity: alpha * (0.48 + 0.52 * rw),
      }),
      chipPill('Row 2 (0,1): Near 1.0 vs GPTQ 2.0 (src 0.61)', 440, -110, {
        w: 820,
        h: 72,
        color: ROLE.err,
        size: 26,
        opacity: alpha * (0.48 + 0.52 * rw),
      }),

      txt('Nearest (1, 1)', -855, 45, 28, ROLE.ok, 'mono', 'left').opacity(alpha),
      lumBar(barX, 45, win > 0.35 ? nearHeld * px : 24, 44, ROLE.ok, {
        opacity: alpha * (0.48 + 0.52 * win),
        maxTrackW: maxW,
      }),
      txt(
        win > 0.35 ? `${nearHeld.toFixed(2)}  (WINS!)` : '? (predict)',
        barX + maxW + 24,
        45,
        28,
        win > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Compensated (1, 2)', -855, 145, 28, ROLE.err, 'mono', 'left').opacity(alpha),
      lumBar(barX, 145, win > 0.35 ? compHeld * px : 24, 44, ROLE.err, {
        opacity: alpha * (0.48 + 0.52 * win),
        maxTrackW: maxW,
      }),
      txt(
        win > 0.35 ? `${compHeld.toFixed(2)}  (10x worse!)` : '? (predict)',
        barX + maxW + 24,
        145,
        28,
        win > 0.35 ? ROLE.err : ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill(
        win > 0.35
          ? 'Nearest wins on isolated channels! Calibration data MUST resemble real serving traffic.'
          : 'With inputs (1, 0) and (0, 1) firing separately, which pair stays closer to source?',
        0,
        280,
        {
          w: 1600,
          h: 76,
          color: win > 0.35 ? ROLE.ok : ROLE.gold,
          fill: win > 0.35 ? '#0f2d24' : '#261e10',
          size: 26,
          glow: 10,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'keep-codes', (d) => s.play(showRows.to(0, { duration: d })));
  playCue(s, c, 'isolate-channels', (d) => s.play(showRows.to(0.35, { duration: d })));
  playCue(s, c, 'first-alone', (d) => s.play(showRows.to(0.7, { duration: d })));
  playCue(s, c, 'second-alone', (d) => s.play(showRows.to(1, { duration: d })));
  // Strict prediction withholding: reveal Nearest winner only after fresh-score!
  playCue(s, c, 'fresh-score', (d) => s.play(revealWinner.to(1, { duration: d })), { after: true });
}
