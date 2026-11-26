// Scene 04: convolution-equivalence: Conv2D (stride=P) vs flattened dot product (730) -> channels-last mismatch (650)!
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function convolutionEquivalence(s, c) {
  const showMatch = s.value(0);
  const showPermute = s.value(0);
  const revealWrong = s.value(0); // strictly withheld until AFTER `convolution-wrong`!

  const bgAura = aura(0, 0, 740, '#16355e28', '#3c1a3618');
  const title = heroTitle(['Conv2D vs Patch Linear:', 'channel order matters'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.patch,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const mt = showMatch.value;
    const pm = showPermute.value;
    const wr = revealWrong.value;
    const nodes = [
      txt(
        'TWO-CHANNEL 2×2 PATCH  (ZERO BIAS)',
        -855,
        -220,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('Ch 1 · Filter 1 = 30', -615, -130, {
        w: 460,
        h: 74,
        color: ROLE.patch,
        size: 30,
        opacity: alpha,
      }),
      chipPill('Ch 2 · Filter 2 = 700', -105, -130, {
        w: 460,
        h: 74,
        color: ROLE.attn,
        size: 30,
        opacity: alpha,
      }),
      txt('= 730', 260, -130, 42, ROLE.ok, 'mono', 'left').glow(8, ROLE.ok).opacity(alpha),

      // Matched channel-first flatten
      txt(
        'CHANNELS-FIRST FLATTEN (MATCHED TO FILTER):',
        -855,
        -15,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('[1, 2, 3, 4  |  10, 20, 30, 40] · w', -410, 60, {
        w: 760,
        h: 72,
        color: ROLE.ok,
        size: 28,
        glow: mt > 0.3 ? 10 : 4,
        opacity: alpha,
      }),
      txt('= 730 (EXACT)', 50, 60, 34, ROLE.ok, 'mono', 'left')
        .glow(8, ROLE.ok)
        .opacity((0.35 + 0.65 * mt) * alpha),

      // Interleaved channels-last flatten (prediction withheld!)
      txt(
        'INTERLEAVED CHANNELS-LAST AGAINST SAME FILTER:',
        -855,
        175,
        26,
        pm > 0.2 ? ROLE.pos : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('[1, 10, 2, 20, 3, 30, 4, 40] · w', -410, 250, {
        w: 760,
        h: 72,
        color: wr > 0.2 ? ROLE.warn : pm > 0.2 ? ROLE.pos : COSMOS.rule,
        size: 28,
        glow: pm > 0.2 ? 10 : 0,
        opacity: (0.28 + 0.72 * pm) * alpha,
      }),
    ];

    if (pm > 0.2 && wr < 0.2) {
      nodes.push(
        txt('Will this pass the check?', 50, 250, 34, ROLE.pos, 'serif', 'left')
          .glow(8, ROLE.pos)
          .opacity(pm * (1 - wr * 5) * alpha),
      );
    }

    if (wr > 0.2) {
      nodes.push(
        txt('= 650 (MISMATCH!)', 50, 250, 34, ROLE.warn, 'mono', 'left')
          .glow(10, ROLE.warn)
          .opacity(wr * alpha),
        txt(
          'Same tensor shape, silent wrong value (10 multiplied weight 2): verify element order!',
          -855,
          365,
          28,
          ROLE.warn,
          'sans',
          'left',
        ).opacity(wr * alpha),
      );
    }
    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'convolution-correct', (d) => s.play(showMatch.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'convolution-permute', (d) => s.play(showPermute.to(1, { duration: d })), {
    dur: 0.5,
  });
  // Strictly withhold 650 mismatch until AFTER `convolution-wrong`!
  playCue(s, c, 'convolution-wrong', (d) => s.play(revealWrong.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
  bindCueBeat(s, c, s.value(0), ['convolution-channels']);
}
