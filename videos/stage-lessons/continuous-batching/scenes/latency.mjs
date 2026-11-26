// Scene 14: latency: Client clock TTFT=1.0s, gaps 0.2s / 0.5s / 0.2s (mean 0.30s) & hidden 2.0s waiting arrival.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  txt,
} from '../parts.mjs';

export default function latency(s, c) {
  const step = s.value(0); // 0=TTFT, 1=gaps, 2=0.50s stall, 3=0.30s mean, 4=waiting 2.0s arrival, 5=admission control

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a182822');
  const title = heroTitle(['Where Did the Reply Stall?', 'TTFT, ITL & Unseen Queues'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.a,
  });

  // Token arrival timestamps: t = 1.0, 1.2, 1.7, 1.9 s (gaps: 0.20, 0.50, 0.20 -> mean 0.30 s)
  const arrivals = [
    { t: 1.0, word: '"The"' },
    { t: 1.2, word: '"seat"' },
    { t: 1.7, word: '"just"' },
    { t: 1.9, word: '"opened"' },
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = Math.round(step.value);
    const x0 = -780;
    const scale = 760; // 2.0s -> 1520px (-780 .. +740)
    const yRail = -105;

    const nodes = [
      txt('STREAM 1 CLIENT CLOCK (0.0 s -> 2.0 s)', -855, -220, 26, ROLE.a, 'mono', 'left').opacity(
        alpha,
      ),
      line([x0, yRail], [x0 + 2.0 * scale, yRail], { stroke: '#2c426e', width: 4 }).opacity(alpha),

      // TTFT span (0.0 -> 1.0s)
      line([x0, yRail], [x0 + 1.0 * scale, yRail], { stroke: ROLE.b, width: 8 })
        .glow(10, ROLE.b)
        .opacity(alpha),
      txt('TTFT = 1.0 s', x0 + 0.5 * scale, yRail - 45, 28, ROLE.b, 'mono', 'center').opacity(
        alpha,
      ),
    ];

    // 0.50 s stall highlight between 1.2s and 1.7s
    if (st >= 2) {
      nodes.push(
        line([x0 + 1.2 * scale, yRail], [x0 + 1.7 * scale, yRail], { stroke: ROLE.warn, width: 10 })
          .glow(12, ROLE.warn)
          .opacity(alpha),
        txt(
          '0.50 s STALL!',
          x0 + 1.45 * scale,
          yRail - 45,
          28,
          ROLE.warn,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    arrivals.forEach((a) => {
      const ax = x0 + a.t * scale;
      nodes.push(
        glowDot(ax, yRail, { radius: 10, color: ROLE.a, glow: 12, opacity: alpha }),
        txt(a.word, ax, yRail + 44, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt(`${a.t.toFixed(1)}s`, ax, yRail + 82, 26, COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
      );
    });

    // Second arrival still waiting at t = 2.0 s (contributes 0 gaps to mean ITL!)
    const waitOp = st >= 4 ? alpha : alpha * 0.32;
    nodes.push(
      txt(
        'STREAM 2 (ARRIVED AT t = 0.0 s)',
        -855,
        80,
        26,
        st >= 4 ? ROLE.warn : COSMOS.muted,
        'mono',
        'left',
      ).opacity(waitOp),
      line([x0, 140], [x0 + 2.0 * scale, 140], {
        stroke: st >= 4 ? ROLE.warn : COSMOS.rule,
        width: 8,
      })
        .glow(st >= 4 ? 10 : 0, ROLE.warn)
        .opacity(waitOp),
      txt(
        'STILL WAITING AT 2.0 s -> 0 TOKENS -> CONTRIBUTES 0 GAPS TO MEAN ITL!',
        0,
        185,
        28,
        st >= 4 ? ROLE.warn : COSMOS.dim,
        'mono',
        'center',
      ).opacity(waitOp),

      // Bottom summary chips
      chipPill('Mean Gap (ITL): 0.30 s', -440, 295, {
        w: 540,
        h: 72,
        color: st >= 3 ? ROLE.a : COSMOS.rule,
        size: 28,
        opacity: alpha * (st >= 3 ? 1 : 0.45),
      }),
      chipPill(
        st >= 5
          ? 'Count rejected/expired arrivals in offered load'
          : 'Max Gap: 0.50 s (hidden by mean)',
        320,
        295,
        {
          w: 780,
          h: 72,
          color: st >= 5 ? ROLE.d : ROLE.warn,
          size: 26,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'first-delay', (d) => s.play(step.to(0, { duration: d })));
  playCue(s, c, 'token-gaps', (d) => s.play(step.to(1, { duration: d })));
  playCue(s, c, 'long-gap', (d) => s.play(step.to(2, { duration: d })));
  playCue(s, c, 'mean-gap', (d) => s.play(step.to(3, { duration: d })));
  playCue(s, c, 'older-waiting', (d) => s.play(step.to(4, { duration: d })));
  playCue(s, c, 'admission-limit', (d) => s.play(step.to(5, { duration: d })));
}
