// Scene 01: intro: Dual server clocks (Reply A [320..428] vs Reply B [80..428]): same finish, opposite TTFT/TPOT!
import {
  COSMOS,
  METRICS_A,
  METRICS_B,
  ROLE,
  aura,
  bindCueBeat,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  outputs,
  playCue,
  replyBTimes,
  tokenTimes,
  txt,
} from '../parts.mjs';

export default function intro(s, c) {
  const clockMs = s.value(312); // starts at 312ms (B has emitted 3 words, A still silent!) -> 428ms on `run-both`
  const showFirstWaits = s.value(0);
  const showGapPrompt = s.value(0);
  const revealGaps = s.value(0); // strictly withheld until AFTER `b-gaps`!
  const showSameRate = s.value(0);

  const bgAura = aura(0, 0, 740, '#12385e28', '#2a1b5418');
  const title = heroTitle(['The Two Clocks', 'of a Generated Answer'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.clockA,
  });

  const xOf = (ms) => -680 + (ms / 460) * 1440;
  const yA = -75;
  const yB = 115;

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const t = clockMs.value;
    const fw = showFirstWaits.value;
    const gp = showGapPrompt.value;
    const rg = revealGaps.value;
    const sr = showSameRate.value;
    const nodes = [];

    // Axis ticks (0, 100, 200, 300, 400 ms)
    [0, 100, 200, 300, 400].forEach((ms) => {
      const tx = xOf(ms);
      nodes.push(txt(`${ms} ms`, tx, 220, 26, COSMOS.dim, 'mono', 'center').opacity(alpha));
    });

    // Moving vertical clock sweep indicator centered strictly between Reply A (-75) and Reply B (+115)
    const cx = xOf(t);
    nodes.push(
      glowingTrail(
        [
          [cx, -25],
          [cx, 55],
        ],
        { color: ROLE.wait, width: 3.5, glow: 10, opacity: 0.9 * alpha },
      ),
      glowDot(cx, 15, { radius: 6, color: ROLE.wait, glow: 12, opacity: alpha }),
    );

    // Reply A track (cyan)
    nodes.push(
      txt('REPLY A', -855, yA, 30, ROLE.clockA, 'mono', 'left').opacity(alpha),
      glowingTrail(
        [
          [xOf(0), yA],
          [xOf(440), yA],
        ],
        { color: '#24365e', width: 3, core: false, opacity: alpha },
      ),
    );
    tokenTimes.forEach((ms, idx) => {
      if (t >= ms - 1) {
        const px = xOf(ms);
        nodes.push(
          glowDot(px, yA, { radius: 10, color: ROLE.clockA, glow: 14, opacity: alpha }),
          txt(outputs[idx], px, yA - 42, 28, ROLE.clockA, 'mono', 'center').opacity(alpha),
        );
      }
    });

    // Reply B track (violet)
    nodes.push(
      txt('REPLY B', -855, yB, 30, ROLE.clockB, 'mono', 'left').opacity(alpha),
      glowingTrail(
        [
          [xOf(0), yB],
          [xOf(440), yB],
        ],
        { color: '#2b2452', width: 3, core: false, opacity: alpha },
      ),
    );
    replyBTimes.forEach((ms, idx) => {
      if (t >= ms - 1) {
        const px = xOf(ms);
        nodes.push(
          glowDot(px, yB, { radius: 10, color: ROLE.clockB, glow: 14, opacity: alpha }),
          txt(outputs[idx], px, yB - 42, 28, ROLE.clockB, 'mono', 'center').opacity(alpha),
        );
      }
    });

    // Prediction 1 prompt (before A catches up!)
    if (t < 325) {
      nodes.push(
        txt(
          'B has sent 3 words while A is silent: which reply finishes first?',
          -855,
          325,
          34,
          ROLE.wait,
          'serif',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity(alpha),
      );
    }

    // First waits (TTFT)
    if (fw > 0.05) {
      nodes.push(
        txt(
          `TTFT:  A = ${METRICS_A.ttft} ms   ·   B = ${METRICS_B.ttft} ms`,
          -855,
          -210,
          32,
          ROLE.wait,
          'mono',
          'left',
        )
          .glow(6, ROLE.wait)
          .opacity(fw * alpha),
      );
    }

    // Prediction 2 prompt (strictly withheld before `b-gaps`!)
    if (gp > 0.05 && rg < 0.2) {
      nodes.push(
        txt(
          'Both finished at 428 ms: which reply has the longer gaps between tokens?',
          -855,
          325,
          32,
          ROLE.wait,
          'serif',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity(gp * (1 - rg * 5) * alpha),
      );
    }

    if (rg > 0.2) {
      nodes.push(
        txt(
          `Gaps (TPOT):  B = ${METRICS_B.tpot} ms/tok   ·   A = ${METRICS_A.tpot} ms/tok`,
          -855,
          315,
          32,
          ROLE.clockA,
          'mono',
          'left',
        )
          .glow(8, ROLE.clockA)
          .opacity(rg * alpha),
      );
    }

    if (sr > 0.05) {
      nodes.push(
        txt(
          `Full-request rate is identical (${METRICS_A.endToEndTps.toFixed(2)} tok/s), hiding opposite UX`,
          -855,
          380,
          28,
          ROLE.wait,
          'sans',
          'left',
        ).opacity(sr * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'run-both', (d) => s.play(clockMs.to(428, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'first-waits', (d) => s.play(showFirstWaits.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'compare-gaps', (d) => s.play(showGapPrompt.to(1, { duration: d })), { dur: 0.4 });
  // Strictly withhold gap comparison until AFTER `b-gaps`!
  playCue(s, c, 'b-gaps', (d) => s.play(revealGaps.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'same-finish', (d) => s.play(showSameRate.to(1, { duration: d })), { dur: 0.45 });
  bindCueBeat(s, c, s.value(0), ['head-start', 'a-gaps']);
}
