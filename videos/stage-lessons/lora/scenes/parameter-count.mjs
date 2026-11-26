// Scene 10: A narrow passage changes the budget: 4096x4096 monolith vs razor-thin r=16 strips + magnified inset + general formula.
import {
  COSMOS,
  PARAM_4096,
  aura,
  glassCell,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function parameterCount(s, c) {
  const phase = s.value(0);
  const hlBase = s.value(0);
  const showBaseNum = s.value(0);
  const hlAdapter = s.value(0);
  const showAdapterNum = s.value(0);
  const showPercent = s.value(0);
  const showFormula = s.value(0);

  const bgAura = aura(150, 0, 620, '#60a5fa22', '#ffd16618');
  const title = heroTitle(['A Narrow Passage', 'Changes the Budget'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'PARAMETER BUDGET · 4096 × 4096 PROJECTION',
  });

  const eq = glowTex(String.raw`\text{Adapter params} = r(d_{\text{in}} + d_{\text{out}})`, {
    x: 420,
    y: -365,
    size: 38,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const hb = hlBase.value;
    const sbn = showBaseNum.value;
    const ha = hlAdapter.value;
    const san = showAdapterNum.value;
    const sp = showPercent.value;
    const sf = showFormula.value;

    // Proportional 4096x4096 square = 420x420 px; r=16 strip width = 420*(16/4096) ≈ 1.64px (true ratio!)
    const sqSize = 420;
    const sqX = -515;
    const sqY = 75;

    const nodes = [
      // True-scale 4096x4096 base weight square
      rect(sqSize, sqSize, {
        fill: '#13264d',
        stroke: hb > 0.2 ? COSMOS.blue : '#4b669e',
        width: 3,
        radius: 8,
      })
        .at(sqX, sqY)
        .glow(hb > 0.2 ? 12 : 5, COSMOS.blue),
      txt('W_0  (4096 × 4096)', sqX, sqY - 40, 30, COSMOS.blue, 'mono'),
      txt(
        sbn > 0.5 ? `${PARAM_4096.base.toLocaleString('en-US')}` : '4096² weights',
        sqX,
        sqY + 18,
        36,
        COSMOS.ink,
        'mono',
      ).glow(sbn > 0.5 ? 7 : 0, COSMOS.blue),
      txt(
        sbn > 0.5 ? '~16.78M parameters' : 'Full fine-tuning updates all',
        sqX,
        sqY + 72,
        26,
        COSMOS.muted,
        'sans',
      ),

      // True-ratio r=16 razor strips right beside the 4096x4096 monolith
      rect(6, sqSize, { fill: COSMOS.cyan, stroke: null })
        .at(sqX + sqSize * 0.5 + 34, sqY)
        .glow(10, COSMOS.cyan),
      rect(sqSize, 6, { fill: COSMOS.gold, stroke: null })
        .at(sqX, sqY + sqSize * 0.5 + 34)
        .glow(10, COSMOS.gold),
      txt('True scale r = 16', sqX, sqY + sqSize * 0.5 + 72, 26, COSMOS.gold, 'mono'),

      // Magnified inset of thin factors A (16 x 4096) and B (4096 x 16) on right
      glassCell(345, -18, 910, 385, ha > 0.2 ? COSMOS.gold : '#3a4c78', {
        fill: '#111930',
        glow: ha > 0.2 ? 10 : 4,
      }),
      txt('MAGNIFIED ADAPTER INSET (r = 16)', 345, -172, 26, COSMOS.gold, 'mono'),

      // Magnified A strip
      rect(340, 44, { fill: '#2c2210', stroke: COSMOS.gold, width: 2.6, radius: 6 })
        .at(120, -45)
        .glow(8, COSMOS.gold),
      txt('A : 16 × 4096', 120, -45, 26, COSMOS.gold, 'mono'),
      txt('65,536', 120, 12, 28, COSMOS.ink, 'mono'),

      // Magnified B strip
      rect(340, 44, { fill: '#102736', stroke: COSMOS.cyan, width: 2.6, radius: 6 })
        .at(560, -45)
        .glow(8, COSMOS.cyan),
      txt('B : 4096 × 16', 560, -45, 26, COSMOS.cyan, 'mono'),
      txt('65,536', 560, 12, 28, COSMOS.ink, 'mono'),

      // Combined count & ratio inside inset
      txt(
        san > 0.5
          ? `Total = ${PARAM_4096.adapter.toLocaleString('en-US')} trainable values`
          : 'Total = 16 × 4096 + 4096 × 16',
        345,
        84,
        32,
        COSMOS.ink,
        'mono',
      ),
      txt(
        sp > 0.5
          ? `${(PARAM_4096.ratio * 100).toFixed(4)}% of W_0  (< 1% · 128× smaller)`
          : 'Linearly proportional to rank r',
        345,
        136,
        30,
        sp > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).glow(sp > 0.5 ? 7 : 0, COSMOS.emerald),

      glowingArc([sqX + sqSize * 0.5 + 38, sqY - 30], [-110, -18], -35, {
        color: COSMOS.gold,
        width: 3,
        opacity: 0.78,
      }),

      // Bottom linear scaling bar (r=8, 16, 64)
      glassCell(345, 310, 910, 165, sf > 0.2 ? COSMOS.cyan : '#334268', {
        fill: '#10182d',
        glow: sf > 0.2 ? 9 : 3,
      }),
      txt('LINEAR GROWTH WITH RANK r', 345, 258, 26, COSMOS.muted, 'mono'),
      txt('r=8: 65.5K · r=16: 131K · r=64: 524K', 345, 316, 26, COSMOS.cyan, 'mono'),
      txt(
        'Rectangular layer: r · d_in + d_out · r = r(d_in + d_out)',
        345,
        362,
        26,
        COSMOS.gold,
        'mono',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, live);
  runPhase(s, c, phase, 12);

  c.on('parameter-count-b1-1', () => s.play(hlBase.to(1, { duration: 0.4 })));
  c.on('parameter-base-result', () => s.play(showBaseNum.to(1, { duration: 0.35 })));
  c.on('parameter-count-b2-1', () => s.play(hlAdapter.to(1, { duration: 0.4 })));
  c.on('parameter-adapter-result', () => s.play(showAdapterNum.to(1, { duration: 0.35 })));
  c.on('parameter-percent-result', () => s.play(showPercent.to(1, { duration: 0.35 })));
  c.on('parameter-count-b3-1', () =>
    s.play(showFormula.to(1, { duration: remainDuration(c, 'parameter-count-b3-1', 0.45) })),
  );
}
