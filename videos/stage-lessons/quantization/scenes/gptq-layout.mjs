// Scene 15: gptq-layout: Activation order (Hessian diag 2*sum(x^2)=50 vs 2, NOT variance), static groups (g_idx restore), GPTQModel vs legacy AutoGPTQ.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function gptqLayout(s, c) {
  const showOrder = s.value(0);
  const showCompat = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(
    ['Activation Order & Group Layout:', 'Diagonal Energy & Loader Contracts'],
    {
      x: -855,
      y: -430,
      size: 46,
      lineHeight: 54,
      accent: ROLE.grid,
    },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ord = showOrder.value;
    const cmp = showCompat.value;

    const nodes = [
      txt(
        'ACT-ORDER RANKS BY HESSIAN DIAGONAL (2 · SUM x^2), NOT VARIANCE!',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      rect(760, 175, { fill: '#10203a', stroke: ROLE.weight, width: 2.8, radius: 12 })
        .at(-430, -85)
        .opacity(alpha),
      txt('Channel A: x = [5, 5]', -430, -134, 28, ROLE.weight, 'mono', 'center').opacity(alpha),
      txt(
        'Variance = 0  |  Sum x^2 = 50 (RANK #1!)',
        -430,
        -80,
        26,
        ROLE.gold,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'High Hessian diagonal -> quantize first',
        -430,
        -30,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      rect(760, 175, { fill: '#102834', stroke: ROLE.grid, width: 2.6, radius: 12 })
        .at(430, -85)
        .opacity(alpha),
      txt('Channel B: x = [+1, -1]', 430, -134, 28, ROLE.grid, 'mono', 'center').opacity(alpha),
      txt(
        'Variance = 1  |  Sum x^2 = 2 (RANK #2)',
        430,
        -80,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        'Lower squared energy -> quantize later',
        430,
        -30,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),

      chipPill(
        'Static Groups: permute columns for GPTQ, keep original g_idx scale group, then restore column slot',
        0,
        95,
        {
          w: 1620,
          h: 76,
          color: ord > 0.35 ? ROLE.ok : ROLE.grid,
          fill: ord > 0.35 ? '#0f2d24' : '#10182d',
          size: 26,
          glow: ord > 0.35 ? 10 : 4,
          opacity: alpha * (0.5 + 0.5 * ord),
        },
      ),
      chipPill('Check GPTQModel vs legacy AutoGPTQ zero-point layout before loading!', 0, 215, {
        w: 1620,
        h: 76,
        color: cmp > 0.35 ? ROLE.err : ROLE.gold,
        fill: cmp > 0.35 ? '#321420' : '#10182d',
        size: 26,
        glow: cmp > 0.35 ? 10 : 4,
        opacity: alpha * (0.5 + 0.5 * cmp),
      }),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'gptq-layout-build-0', (d) => s.play(showOrder.to(0.2, { duration: d })));
  playCue(s, c, 'gptq-layout-build-1', (d) => s.play(showOrder.to(1, { duration: d })));
  playCue(s, c, 'gptq-layout-build-2', (d) => s.play(showCompat.to(1, { duration: d })));
}
