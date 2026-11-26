// Scene 10: attention: Banner query q=[1,0] accumulating banner/panel/Retry values, then causal mask replay.
import {
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
  weights,
} from '../parts.mjs';

export default function attention(s, c) {
  const showWeights = s.value(0);
  const addBanner = s.value(0);
  const addPanel = s.value(0);
  const addButton = s.value(0);
  const causalMask = s.value(0);

  const bgAura = aura(0, 0, 740, '#14325c28', '#26142e20');
  const title = heroTitle(['What Can the Banner', 'Read in One Layer?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.attn,
  });

  // Exact weights from model.mjs: weights = softmax([1, 0, 1] / sqrt(2))
  const w0 = weights[0];
  const w1 = weights[1];
  const w2 = weights[2];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const swVis = showWeights.value;
    const b1 = addBanner.value;
    const b2 = addPanel.value;
    const b3 = addButton.value;
    const mask = causalMask.value;

    const effW0 = w0 * (1 - mask) + 1.0 * mask;
    const effW1 = w1 * (1 - mask);
    const effW2 = w2 * (1 - mask);

    // Values: Banner=[1,0], Panel=[0,1], Retry=[1,1]
    const c1 = effW0 * b1 + effW2 * b3;
    const c2 = effW1 * b2 + effW2 * b3;
    const anyContrib = b1 > 0.1 || b2 > 0.1 || b3 > 0.1;

    const nodes = [
      // Left: Three marked regions & attention weights
      txt('QUERY AT BANNER: q = [1, 0]', -855, -225, 28, ROLE.patch, 'mono', 'left').opacity(alpha),
      txt('PATCH (K = V)', -855, -155, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('WEIGHT', -330, -155, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
    ];

    const rows = [
      { label: '0: Banner [1, 0]', w: effW0, color: ROLE.warn, y: -70, masked: false },
      { label: '1: Panel  [0, 1]', w: effW1, color: ROLE.pos, y: 40, masked: mask > 0.5 },
      { label: '2: Retry  [1, 1]', w: effW2, color: ROLE.attn, y: 150, masked: mask > 0.5 },
    ];

    rows.forEach((row) => {
      const rowOp = row.masked ? 0.32 : 1;
      nodes.push(
        chipPill(row.label, -635, row.y, {
          w: 440,
          h: 74,
          color: row.masked ? COSMOS.rule : row.color,
          fill: '#10182d',
          size: 28,
          glow: row.masked ? 0 : 6,
          opacity: alpha * rowOp,
        }),
        lumBar(-330, row.y, Math.max(8, row.w * 260 * swVis), 30, row.color, {
          opacity: alpha * (0.28 + 0.72 * swVis) * rowOp,
          maxTrackW: 260,
        }),
        txt(
          swVis > 0.2 ? (row.masked ? 'MASKED' : row.w.toFixed(2)) : '?',
          -45,
          row.y,
          28,
          row.masked ? ROLE.warn : row.color,
          'mono',
          'left',
        ).opacity(alpha * (0.4 + 0.6 * swVis)),
      );
    });

    // Right: Banner output coordinates (withheld until attention-banner / panel / button!)
    const barX = 210;
    const barScale = 520;
    nodes.push(
      txt(
        mask > 0.5 ? 'CAUSAL MASK OUTPUT (ONLY SELF)' : 'BANNER OUTPUT COORDINATES',
        barX,
        -155,
        26,
        mask > 0.5 ? ROLE.warn : ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha),

      // Coord 1 bar
      txt('Coord 1', barX, -65, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
      lumBar(barX, -10, Math.max(8, c1 * barScale), 36, ROLE.warn, {
        opacity: alpha * (anyContrib ? 0.95 : 0.25),
        maxTrackW: barScale,
      }),
      txt(
        anyContrib ? c1.toFixed(2) : '?',
        barX + barScale + 26,
        -10,
        32,
        ROLE.warn,
        'mono',
        'left',
      ).opacity(alpha),

      // Coord 2 bar
      txt('Coord 2 (starts at 0)', barX, 100, 28, COSMOS.ink, 'mono', 'left').opacity(alpha),
      lumBar(barX, 155, Math.max(8, c2 * barScale), 36, ROLE.attn, {
        opacity: alpha * (anyContrib ? 0.95 : 0.25),
        maxTrackW: barScale,
      }),
      txt(
        anyContrib ? c2.toFixed(2) : '?',
        barX + barScale + 26,
        155,
        32,
        ROLE.attn,
        'mono',
        'left',
      ).opacity(alpha),

      // Footer
      txt(
        mask > 0.5
          ? 'Causal mask blocks future patches: coord 2 drops back to 0.00'
          : b3 > 0.3
            ? 'Bidirectional ViT: Retry [1, 1] supplies +0.40 to coord 2!'
            : anyContrib
              ? 'Accumulating weighted value contributions across patches...'
              : 'Can Retry contribute to the banner second coordinate?',
        0,
        320,
        30,
        mask > 0.5 ? ROLE.warn : b3 > 0.3 ? ROLE.ok : ROLE.pos,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'attention-locations', (d) => s.play(showWeights.to(0.35, { duration: d })));
  playCue(s, c, 'attention-softmax', (d) => s.play(showWeights.to(1, { duration: d })));
  // Strict prediction withholding: contributions appear only in Beat 2 cues!
  playCue(s, c, 'attention-banner', (d) => s.play(addBanner.to(1, { duration: d })));
  playCue(s, c, 'attention-panel', (d) => s.play(addPanel.to(1, { duration: d })));
  playCue(s, c, 'attention-button', (d) => s.play(addButton.to(1, { duration: d })));
  playCue(s, c, 'attention-mask', (d) => s.play(causalMask.to(1, { duration: d })));
}
