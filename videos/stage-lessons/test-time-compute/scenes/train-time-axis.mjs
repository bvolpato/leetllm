// Scene 12: train-time-axis: Dense 6*N*D (3B * 20B * 2 epochs = 40B processed -> 7.2e20 FLOPs) vs MoE 2/8 active experts vs frozen weights varying test-time policy.
import {
  COSMOS,
  ROLE,
  TRAIN_FRAME,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function trainTimeAxis(s, c) {
  const showProduct = s.value(0);
  const showMoe = s.value(0);
  const showFreeze = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(
    ['Train-Time vs Test-Time Axis:', 'Changing Weights vs Spending Per Request'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.draft,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const pr = showProduct.value;
    const mo = showMoe.value;
    const fr = showFreeze.value;

    const nodes = [
      txt(
        'DENSE TRAIN ESTIMATE: C ~ 6 · N · D_processed (INCLUDE REPEATED EPOCHS!)',
        -855,
        -220,
        26,
        ROLE.search,
        'mono',
        'left',
      ).opacity(alpha),

      rect(760, 195, { fill: '#10203a', stroke: ROLE.draft, width: 2.8, radius: 14 })
        .at(-430, -60)
        .opacity(alpha),
      txt('DENSE 3B x 20B x 2 EPOCHS', -430, -116, 26, ROLE.draft, 'mono', 'center').opacity(alpha),
      txt('Processed D = 40B tokens', -430, -62, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt(
        pr > 0.35
          ? `6 x 3B x 40B = ${(TRAIN_FRAME.flops / 1e20).toFixed(1)} x 10^20 FLOPs`
          : '6 x N x D = ?',
        -430,
        -6,
        28,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),

      rect(760, 195, {
        fill: mo > 0.35 ? '#181434' : '#10182d',
        stroke: mo > 0.35 ? ROLE.score : ROLE.search,
        width: 2.8,
        radius: 14,
      })
        .at(430, -60)
        .opacity(alpha * (0.5 + 0.5 * mo)),
      txt('SPARSE MoE (2 / 8 ACTIVE)', 430, -116, 26, ROLE.score, 'mono', 'center').opacity(alpha),
      txt(
        '[E1*] [E2*] [E3] [E4] [E5] [E6] [E7] [E8]',
        430,
        -62,
        26,
        ROLE.ok,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Count active params, not total 8!', 430, -6, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),

      chipPill(
        fr > 0.35
          ? 'Freeze one trained checkpoint -> compare single-pass vs longer trace vs parallel vs revision!'
          : 'Training updates weights once across epochs; test-time compute scales work on each request',
        0,
        165,
        {
          w: 1620,
          h: 78,
          color: fr > 0.35 ? ROLE.ok : ROLE.gold,
          fill: fr > 0.35 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: fr > 0.35 ? 10 : 4,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'tt-train-time-axis-0', (d) => s.play(showProduct.to(0, { duration: d })));
  playCue(s, c, 'tt-training-epochs', (d) => s.play(showProduct.to(0.5, { duration: d })));
  playCue(s, c, 'tt-training-product', (d) => s.play(showProduct.to(1, { duration: d })));
  playCue(s, c, 'tt-train-time-axis-1', (d) => s.play(showMoe.to(0.5, { duration: d })));
  playCue(s, c, 'tt-active-experts', (d) => s.play(showMoe.to(1, { duration: d })));
  playCue(s, c, 'tt-train-time-axis-2', (d) => s.play(showFreeze.to(1, { duration: d })));
}
