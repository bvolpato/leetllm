// Scene 25: transfer: "Which trial goes on to the next check?"
// Luminous held-out loss ruler with cyan acceptance band [2.290, 2.330] around forecast 2.310.
// STRICT PREDICTION WITHHOLDING: Run A (2.350) and Run B (2.320) appear in neutral gold during
// Beat 1's 3.0s hold; green/rose pass-or-hold colors and verdicts appear strictly AFTER
// transfer-decision ("Run B goes on")!
import { line } from 'vizmatic/stage';
import { COSMOS, glowDot, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  lumBar,
  playCue,
  scenePulse,
  surfaceLoss,
} from '../parts.mjs';

export default function transfer(s, c) {
  const pred = surfaceLoss(10e9, 100e9); // 2.310
  const tol = 0.02;
  const lo = pred - tol; // 2.290
  const hi = pred + tol; // 2.330
  const obsA = 2.35;
  const obsB = 2.32;

  const title = heroTitle(['Which trial goes on', 'to the next check?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.tokens,
  });

  const bandGlow = s.value(0); // transfer-window
  const showA = s.value(0); // AFTER transfer-observations
  const showB = s.value(0); // AFTER transfer-second
  const decideVis = s.value(0); // AFTER transfer-decision
  const pulse = s.value(0);

  const stageLayer = guardedDynamic(s.value(1), (alpha) => {
    const nodes = [];
    const bg = bandGlow.value;
    const sa = showA.value;
    const sb = showB.value;
    const dv = decideVis.value;
    const p = pulse.value;

    // Map loss values [2.275 .. 2.365] onto [-660 .. +700]
    const toX = (val) => -660 + ((val - 2.275) / 0.09) * 1360;
    const xLo = toX(lo);
    const xPred = toX(pred);
    const xHi = toX(hi);

    nodes.push(
      txt(
        '10B parameters × 100B training tokens   ·   mid-scale acceptance band',
        0,
        -250,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      // Luminous cyan acceptance window
      lumBar((xLo + xHi) / 2, 15, xHi - xLo, 355, {
        color: ROLE.tokens,
        fillOpacity: 0.16 + 0.1 * bg,
        strokeWidth: 2.6,
        glow: 10 + 4 * bg,
        radius: 6,
        opacity: alpha,
      }),
      line([xPred, -162], [xPred, 192], { stroke: ROLE.tokens, width: 3.2 }).opacity(0.9 * alpha),
      txt('Allowed band (±0.020)', xPred, -198, 28, ROLE.tokens, 'mono', 'center')
        .glow(6, ROLE.tokens)
        .opacity(alpha),
    );

    // Tick readouts along ruler bottom
    for (const [val, col] of [
      [lo, COSMOS.muted],
      [pred, ROLE.tokens],
      [hi, COSMOS.muted],
    ]) {
      const tx = toX(val);
      nodes.push(txt(fmt(val, 3), tx, 232, 28, col, 'mono', 'center').opacity(alpha));
    }
    nodes.push(
      txt('Held-out loss (nats per token)', 0, 290, 28, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),
    );

    // Run A and Run B tracks
    const runs = [
      { id: 'Run A', val: obsA, y: -55, shown: sa, passes: false, miss: '+0.040' },
      { id: 'Run B', val: obsB, y: 105, shown: sb, passes: true, miss: '+0.010' },
    ];

    runs.forEach((run) => {
      const rx = toX(run.val);
      // STRICT NEUTRALITY until decideVis > 0.5!
      const col = dv > 0.5 ? (run.passes ? ROLE.optimal : ROLE.cap) : ROLE.compute;
      nodes.push(
        txt(run.id, -735, run.y, 34, COSMOS.ink, 'mono', 'right').opacity(alpha),
        line([-690, run.y], [730, run.y], { stroke: '#3c4d78', width: 2.4 }).opacity(0.8 * alpha),
      );

      if (run.shown > 0.05) {
        const ra = run.shown * alpha;
        nodes.push(
          glowDot(rx, run.y, { radius: 12, color: col, glow: 16, opacity: ra }),
          txt(fmt(run.val, 3), rx, run.y - 44, 34, col, 'mono', 'center')
            .glow(7, col)
            .opacity(ra),
        );
      }

      if (dv > 0.5) {
        const verdict = run.passes ? `Pass (${run.miss})` : `Hold (${run.miss})`;
        nodes.push(
          txt(verdict, rx, run.y + 44, 28, col, 'mono', 'center')
            .glow(8, col)
            .opacity(dv * alpha),
        );
      }
    });

    const footer =
      dv > 0.5
        ? 'Run B clears the loss gate -> now measure throughput (tok/GPU-s) and task quality'
        : sb > 0.5
          ? 'Which trial goes on to the throughput check?'
          : 'Two candidate results on the same forecast ruler';

    nodes.push(
      txt(footer, 0, 385, 30, dv > 0.5 ? ROLE.optimal : ROLE.compute, 'sans', 'center')
        .glow(7, dv > 0.5 ? ROLE.optimal : ROLE.compute)
        .opacity(alpha),
      glowDot(-480 + ((p * 1.9) % 1) * 960, 428, {
        radius: 4.5,
        color: ROLE.tokens,
        glow: 9,
        opacity: 0.7 * alpha,
      }),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.tokens, ROLE.compute), title, stageLayer);
  scenePulse(s, c, pulse);

  playCue(s, c, 'transfer-window', (d) => s.play(bandGlow.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'transfer-observations', (d) => s.play(showA.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'transfer-second', (d) => s.play(showB.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'transfer-decision', (d) => s.play(decideVis.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
