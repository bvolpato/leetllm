// Scene 10: score-work: 2,360^2 (5,569,600) mixed-prefix matrix vs 2,200^2 (4,840,000) text + 2,200x160 (352,000) cross strip.
import {
  COSMOS,
  CROSS_SCORES,
  MIXED_SCORES,
  ROLE,
  TEXT_SCORES,
  aura,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function scoreWork(s, c) {
  const showMixed = s.value(0);
  const showMixedNum = s.value(0);
  const showSplit = s.value(0);
  const showCrossNum = s.value(0);
  const showTextNum = s.value(0);
  const showDecode = s.value(0);

  const bgAura = aura(0, 0, 760, '#14325c28', '#2a184824');
  const title = heroTitle(['Construct Each Attention Matrix', 'Before Comparing Costs'], {
    x: -855,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.vision,
  });

  const eq = glowTex(String.raw`(2200 + 160)^2 = 5{,}569{,}600`, {
    x: 425,
    y: -395,
    size: 34,
    color: ROLE.gold,
    glow: 7,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const mx = showMixed.value;
    const mn = showMixedNum.value;
    const sp = showSplit.value;
    const cn = showCrossNum.value;
    const tn = showTextNum.value;
    const dc = showDecode.value;

    const sqSize = 370; // Represents 2,360
    const txtSize = (2200 / 2360) * sqSize; // ~344.9
    const visStrip = sqSize - txtSize; // ~25.1

    const lx = -675;
    const topY = -175;
    const rx = 145;

    const nodes = [
      // Left: Mixed-prefix 2,360 x 2,360 score square
      txt(
        'EARLY FUSION: 2,360 x 2,360',
        lx + sqSize * 0.5,
        topY - 40,
        28,
        ROLE.vision,
        'mono',
        'center',
      ).opacity(alpha),
      // Full square outline
      rect(sqSize, sqSize, {
        fill: '#10243d',
        stroke: mx > 0.3 ? ROLE.vision : '#36507d',
        width: mx > 0.3 ? 3 : 2,
        radius: 6,
      })
        .at(lx + sqSize * 0.5, topY + sqSize * 0.5)
        .glow(mx > 0.3 ? 10 : 0, ROLE.vision)
        .opacity(alpha),
      // Text sub-block inside mixed square
      rect(txtSize, txtSize, {
        fill: '#17345e',
        stroke: ROLE.text,
        width: 2,
        radius: 4,
      })
        .at(lx + txtSize * 0.5, topY + txtSize * 0.5)
        .opacity(alpha),
      // Visual band on right & bottom edges
      rect(visStrip, sqSize, { fill: ROLE.vision, stroke: null, radius: 2 })
        .at(lx + txtSize + visStrip * 0.5, topY + sqSize * 0.5)
        .opacity(alpha * 0.85),
      rect(txtSize, visStrip, { fill: ROLE.vision, stroke: null, radius: 2 })
        .at(lx + txtSize * 0.5, topY + txtSize + visStrip * 0.5)
        .opacity(alpha * 0.85),
      txt(
        '2,200 text',
        lx + txtSize * 0.5,
        topY + txtSize * 0.5 - 16,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        '+ 160 vis',
        lx + txtSize * 0.5,
        topY + txtSize * 0.5 + 26,
        26,
        ROLE.vision,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        mn > 0.3 ? `${MIXED_SCORES.toLocaleString()} scores / head` : '2,360 x 2,360 dense shape',
        lx + sqSize * 0.5,
        topY + sqSize + 44,
        28,
        mn > 0.3 ? ROLE.gold : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(mn > 0.3 ? 8 : 0, ROLE.gold)
        .opacity(alpha),

      // Right: Cross-attention split = 2,200x2,200 text square + 2,200x160 cross strip
      txt(
        'CROSS-ATTENTION: TEXT SQUARE + CROSS STRIP',
        rx + 235,
        topY - 40,
        28,
        sp > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha * (0.55 + 0.45 * sp)),

      // Text self-attention square (2,200 x 2,200)
      rect(txtSize, txtSize, {
        fill: '#17345e',
        stroke: tn > 0.3 ? ROLE.text : '#36507d',
        width: tn > 0.3 ? 3 : 2,
        radius: 6,
      })
        .at(rx + txtSize * 0.5, topY + txtSize * 0.5)
        .glow(tn > 0.3 ? 10 : 0, ROLE.text)
        .opacity(alpha * (0.58 + 0.42 * Math.max(sp, tn))),
      txt(
        '2,200 x 2,200',
        rx + txtSize * 0.5,
        topY + txtSize * 0.5 - 18,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha * (0.6 + 0.4 * Math.max(sp, tn))),
      txt(
        tn > 0.3 ? TEXT_SCORES.toLocaleString() : 'text self-attn',
        rx + txtSize * 0.5,
        topY + txtSize * 0.5 + 28,
        28,
        ROLE.text,
        'mono',
        'center',
      ).opacity(alpha * (0.6 + 0.4 * Math.max(sp, tn))),

      // Plus symbol
      txt('+', rx + txtSize + 38, topY + txtSize * 0.5, 40, ROLE.gold, 'mono', 'center').opacity(
        alpha * (0.55 + 0.45 * sp),
      ),

      // Narrow cross-attention rectangle (2,200 x 160 -> exaggerated slightly to 44px width for visibility)
      rect(52, txtSize, {
        fill: '#133a30',
        stroke: cn > 0.3 ? ROLE.ok : ROLE.vision,
        width: 3,
        radius: 6,
      })
        .at(rx + txtSize + 104, topY + txtSize * 0.5)
        .glow(cn > 0.3 ? 12 : 5, ROLE.ok)
        .opacity(alpha * (0.58 + 0.42 * Math.max(sp, cn))),
      txt(
        cn > 0.3 ? `+${CROSS_SCORES.toLocaleString()}` : '2200x160',
        rx + txtSize + 104,
        topY + txtSize + 44,
        28,
        ROLE.ok,
        'mono',
        'center',
      )
        .glow(cn > 0.3 ? 8 : 0, ROLE.ok)
        .opacity(alpha * (0.58 + 0.42 * Math.max(sp, cn))),
      txt(
        'per fusion layer',
        rx + txtSize * 0.5,
        topY + txtSize + 44,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha * (0.55 + 0.45 * sp)),

      // Bottom decode caveat bar
      chipPill(
        dc > 0.3
          ? 'Cached decode: reads text KV + projected visual KV at fusion layers'
          : 'Causal masks, fused kernels, widths & batching shape real latency',
        0,
        325,
        {
          w: 1360,
          h: 66,
          color: dc > 0.3 ? ROLE.gold : '#364d78',
          size: 26,
          glow: dc > 0.3 ? 10 : 4,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'mm-score-work-0', (d) => s.play(showMixed.to(1, { duration: d })));
  playCue(s, c, 'mm-mixed-count', (d) => s.play(showMixedNum.to(1, { duration: d })));
  playCue(s, c, 'mm-score-work-1', (d) => s.play(showSplit.to(1, { duration: d })));
  playCue(s, c, 'mm-cross-count', (d) => s.play(showCrossNum.to(1, { duration: d })));
  playCue(s, c, 'mm-text-count', (d) => s.play(showTextNum.to(1, { duration: d })));
  playCue(s, c, 'mm-score-work-2', (d) => s.play(showDecode.to(1, { duration: d })));
}
