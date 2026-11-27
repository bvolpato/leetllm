// Scene 22 (audit-labels): "A reviewed name belongs to evidence and a run"
// Audit samples (nearest, boundary, centroid) + run-scoped labels + purity=1.0 fragmentation trap (singletons) + untouched benchmark.
import {
  COSMOS,
  DANGER_COLOR,
  GROUP_COLOR,
  LETTERS,
  QUERY_COLOR,
  aura,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  labels,
  lumBar,
  makePlot,
  rule,
  tweenCue,
  txt,
  xy,
} from '../parts.mjs';

export default function auditLabels(s, c) {
  const showSamples = s.value(0);
  const showMeta = s.value(0);
  const showRun = s.value(0);
  const showPurity = s.value(0);
  const showClean = s.value(0);
  const showSingletons = s.value(0);
  const showSizes = s.value(0);
  const showFinal = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#3a183b18');
  const title = heroTitle(['Audit Evidence,', 'Run IDs & Purity Traps'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'REPRESENTATION AUDIT PROTOCOL',
  });

  const live = guardedDynamic(s.value(1), () => {
    const isSing = showSingletons.value > 0.5;
    const plot = makePlot(-820, -235, 760, 460, { x: [0, 10], y: [0, 5.2] });

    const nodes = [
      ...plot.axesNodes(0.8),
      txt(
        isSing
          ? '6 SINGLETON CLUSTERS → PURITY = 1.00 (USELESS!)'
          : '3 REVIEWED GROUPS → PURITY = 1.00',
        -820,
        -272,
        26,
        isSing ? DANGER_COLOR : COSMOS.emerald,
        'mono',
        'left',
      ),
    ];

    xy.forEach((p, i) => {
      const [px, py] = plot.pt(p);
      const col = isSing ? GROUP_COLOR[i % 4] : GROUP_COLOR[labels[i]];
      nodes.push(
        glowDot(px, py, { radius: 8.5, color: col, glow: 10 }),
        txt(LETTERS[i], px, py + (i === 0 ? 48 : -48), 26, col, 'mono'),
      );
      if (isSing) {
        nodes.push(glowRing(px, py, 24, DANGER_COLOR, { width: 2.2, dash: [6, 5], glow: 6 }));
      }
    });

    // Right side: floating audit ledger & purity comparison bars (zero bullet cards!)
    const rx = 65;
    nodes.push(
      txt('REPRESENTATION AUDIT CHECKS', rx, -235, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        '• Inspect nearest pairs, centroids & boundaries',
        rx,
        -165,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(0.45 + 0.55 * showSamples.value),
      txt(
        '• Check axis correlation vs length / formatting',
        rx,
        -108,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(0.35 + 0.65 * showMeta.value),
      txt(
        '• Cluster IDs are run-local: bind run_id + label',
        rx,
        -50,
        26,
        QUERY_COLOR,
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * showRun.value),
      rule(rx, 8, 845, 8, COSMOS.rule, 2),
      txt(
        'PURITY = dominant topic / cluster size',
        rx,
        56,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(0.35 + 0.65 * showPurity.value),
    );

    const pOp = Math.max(0.3, showClean.value);
    nodes.push(
      txt('k = 3 clean groups:', rx, 128, 26, COSMOS.emerald, 'mono', 'left').opacity(pOp),
      lumBar(rx + 430, 128, 190, 34, {
        color: COSMOS.emerald,
        fillOpacity: 0.78,
        glow: 8,
        opacity: pOp,
      }),
      txt('1.00', rx + 545, 128, 28, COSMOS.emerald, 'mono', 'left').opacity(pOp),

      txt('k = 6 singletons:', rx, 188, 26, DANGER_COLOR, 'mono', 'left').opacity(
        Math.max(0.25, showSingletons.value),
      ),
      lumBar(rx + 430, 188, 190, 34, {
        color: DANGER_COLOR,
        fillOpacity: 0.72,
        glow: 8,
        opacity: Math.max(0.25, showSingletons.value),
      }),
      txt('1.00 (fragmented!)', rx + 545, 188, 26, DANGER_COLOR, 'mono', 'left').opacity(
        Math.max(0.25, showSingletons.value),
      ),
    );

    if (showSizes.value > 0.02) {
      nodes.push(
        txt(
          'Report sizes, topic coverage & boundary samples',
          rx,
          268,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showSizes.value),
      );
    }
    if (showFinal.value > 0.02) {
      nodes.push(
        txt(
          'Keep an UNTOUCHED final benchmark (tuned audits are dev)',
          -855,
          355,
          28,
          QUERY_COLOR,
          'mono',
          'left',
        )
          .glow(6, QUERY_COLOR)
          .opacity(showFinal.value),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'samples', showSamples, 1, { duration: 0.45 });
  tweenCue(s, c, 'metadata', showMeta, 1, { duration: 0.45 });
  tweenCue(s, c, 'run', showRun, 1, { duration: 0.45 });
  tweenCue(s, c, 'purity', showPurity, 1, { duration: 0.45 });
  tweenCue(s, c, 'clean', showClean, 1, { duration: 0.45 });
  tweenCue(s, c, 'singletons', showSingletons, 1, { duration: 0.55 });
  tweenCue(s, c, 'sizes', showSizes, 1, { duration: 0.45 });
  tweenCue(s, c, 'final', showFinal, 1, { duration: 0.5 });
}
