// Scene 05: cadence: Stopwatch from T1 to T4 (3 gaps = 108ms -> TPOT 36ms, 27.8 tok/s) vs full-request (9.35 tok/s) vs harmonic mean trap (55 vs 18).
import {
  COSMOS,
  METRICS_A,
  ROLE,
  aura,
  bindCueBeat,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  tokenTimes,
  txt,
} from '../parts.mjs';

export default function cadence(s, c) {
  const revealThree = s.value(0); // strictly withheld until AFTER `count-later`!
  const showRate = s.value(0);
  const extendToZero = s.value(0); // 0 = window starts at 320ms, 1 = slides back to 0ms
  const showHarmonic = s.value(0);

  const bgAura = aura(0, 0, 740, '#103c3626', '#16355e18');
  const title = heroTitle(['TPOT & Decode Rate:', 'a stopwatch on Reply A'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.clockA,
  });

  const xOf = (ms) => -760 + (ms / 445) * 1520;
  const railY = -105;

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const r3 = revealThree.value;
    const rt = showRate.value;
    const ext = extendToZero.value;
    const hm = showHarmonic.value;

    const startMs = 320 * (1 - ext);
    const nodes = [
      // Full axis 0 .. 428ms
      glowingTrail(
        [
          [xOf(0), railY],
          [xOf(432), railY],
        ],
        { color: '#273a64', width: 3.5, core: false, opacity: alpha },
      ),
      // Active stopwatch span
      glowingTrail(
        [
          [xOf(startMs), railY],
          [xOf(428), railY],
        ],
        { color: ext > 0.5 ? ROLE.wait : ROLE.clockA, width: 6.5, glow: 12, opacity: alpha },
      ),
      txt('0 ms', xOf(0), railY + 42, 26, COSMOS.dim, 'mono', 'center').opacity(alpha),
    ];

    tokenTimes.forEach((ms, idx) => {
      const px = xOf(ms);
      nodes.push(
        glowDot(px, railY, { radius: 10, color: ROLE.clockA, glow: 14, opacity: alpha }),
        txt(`T${idx + 1}`, px, railY - 42, 28, ROLE.clockA, 'mono', 'center').opacity(alpha),
        txt(`${ms}`, px, railY + 42, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    });

    if (r3 < 0.2) {
      nodes.push(
        txt(
          'Start stopwatch at T1, stop at T4: how many new tokens arrive?',
          -855,
          65,
          36,
          ROLE.wait,
          'serif',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity((1 - r3 * 5) * alpha),
      );
    }

    if (r3 > 0.2) {
      nodes.push(
        txt(
          `3 later tokens across 3 gaps (35 + 37 + 36 = 108 ms)  →  TPOT = ${METRICS_A.tpot} ms/tok`,
          -855,
          35,
          30,
          ROLE.clockA,
          'mono',
          'left',
        )
          .glow(8, ROLE.clockA)
          .opacity(r3 * alpha),
      );
    }

    if (rt > 0.05) {
      nodes.push(
        txt(
          `Decode rate = 3 / 0.108 s = ${METRICS_A.decodeTps.toFixed(1)} tok/s`,
          -855,
          110,
          32,
          ROLE.decode,
          'mono',
          'left',
        )
          .glow(8, ROLE.decode)
          .opacity(rt * alpha),
      );
    }

    if (ext > 0.5) {
      nodes.push(
        txt(
          `Full-request window (0 → 428 ms): 4 / 0.428 s = ${METRICS_A.endToEndTps.toFixed(2)} tok/s`,
          -855,
          185,
          32,
          ROLE.wait,
          'mono',
          'left',
        )
          .glow(8, ROLE.wait)
          .opacity((ext - 0.5) * 2 * alpha),
      );
    }

    if (hm > 0.05) {
      nodes.push(
        txt(
          'Rate averaging trap: mean(100, 10) = 55 tok/s   ≠   1000 / mean(10ms, 100ms) = 18.2 tok/s',
          -855,
          295,
          28,
          ROLE.stall,
          'mono',
          'left',
        )
          .glow(6, ROLE.stall)
          .opacity(hm * alpha),
      );
    }
    nodes.push(
      txt(
        'TPOT = (T_N − T_1) / (N − 1)    ·    Decode TPS = 1000 / TPOT    ·    End-to-End = N / T_N',
        -855,
        375,
        26,
        COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  // Strictly withhold "3 more tokens" until AFTER `count-later`!
  playCue(s, c, 'count-later', (d) => s.play(revealThree.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'decode-rate', (d) => s.play(showRate.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'extend-window', (d) => s.play(extendToZero.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'average-rates', (d) => s.play(showHarmonic.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  bindCueBeat(s, c, s.value(0), [
    'clip-watch',
    'stop-watch',
    'walk-gaps',
    'mean-gap',
    'full-rate',
    'invert-mean',
  ]);
}
