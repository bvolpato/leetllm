// Scene 09 (objective-ties): "Equal inertia can support different stories"
// Four-corner square split left/right (J=4) vs bottom/top (J=4) + product meaning vs geometry + outlier trap.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  GROUP_COLOR,
  QUERY_COLOR,
  aura,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function objectiveTies(s, c) {
  const showLeft = s.value(0);
  const showBottom = s.value(0);
  const showMeaning = s.value(0);
  const showOutlier = s.value(0);

  const bgAura = aura(0, 20, 620, '#133a4a30', '#2a1c4f18');
  const title = heroTitle(['Equal Inertia Can Tell', 'Different Stories'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: QUERY_COLOR,
    eyebrow: 'EXACT OBJECTIVE TIES & GEOMETRY LIMITS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const out = showOutlier.value;
    const nodes = [];

    const drawSquare = (cx, cy, mode, labelTop, op) => {
      const s2 = 125;
      const pts = [
        [cx - s2, cy + s2], // BL
        [cx - s2, cy - s2], // TL
        [cx + s2, cy + s2], // BR
        [cx + s2, cy - s2], // TR
      ];
      const names = ['P1', 'P2', 'P3', 'P4'];
      const grp = mode === 'lr' ? [0, 0, 1, 1] : [0, 1, 0, 1];
      const ctrs =
        mode === 'lr'
          ? [
              [cx - s2, cy],
              [cx + s2, cy],
            ]
          : [
              [cx, cy + s2],
              [cx, cy - s2],
            ];

      nodes.push(txt(labelTop, cx, cy - 210, 28, QUERY_COLOR, 'mono').opacity(op));
      // Dividing boundary
      if (mode === 'lr') {
        nodes.push(
          line([cx, cy - 165], [cx, cy + 165], {
            stroke: COSMOS.muted,
            width: 2.5,
            dash: [8, 6],
          }).opacity(op),
        );
      } else {
        nodes.push(
          line([cx - 165, cy], [cx + 165, cy], {
            stroke: COSMOS.muted,
            width: 2.5,
            dash: [8, 6],
          }).opacity(op),
        );
      }
      pts.forEach((p, i) => {
        const col = GROUP_COLOR[grp[i]];
        nodes.push(
          line(p, ctrs[grp[i]], { stroke: col, width: 3.5 }).opacity(op),
          glowDot(p[0], p[1], { radius: 9, color: col, glow: 11, opacity: op }),
          txt(names[i], p[0], p[1] + (i % 2 === 0 ? 36 : -36), 26, col, 'mono').opacity(op),
        );
      });
      ctrs.forEach((ct, k) => {
        nodes.push(glowRing(ct[0], ct[1], 16, GROUP_COLOR[k], { width: 3, glow: 9, opacity: op }));
      });
      nodes.push(
        txt('Inertia  J = 1² + 1² + 1² + 1² = 4.0', cx, cy + 215, 28, COSMOS.emerald, 'mono')
          .glow(6, COSMOS.emerald)
          .opacity(op),
      );
    };

    drawSquare(-465, -20, 'lr', 'SPLIT LEFT vs RIGHT', Math.max(0.45, showLeft.value));
    drawSquare(355, -20, 'bt', 'SPLIT BOTTOM vs TOP', Math.max(0.35, showBottom.value));

    if (showMeaning.value > 0.02) {
      nodes.push(
        txt(
          'Axis X = User Tier   ·   Axis Y = Severity',
          -465,
          255,
          26,
          COSMOS.cyan,
          'mono',
        ).opacity(showMeaning.value),
        txt(
          'Geometry ties at J = 4; workflow decides meaning',
          355,
          255,
          26,
          QUERY_COLOR,
          'sans',
        ).opacity(showMeaning.value),
      );
    }

    if (out > 0.02) {
      nodes.push(
        rule(-855, 315, 855, 315, COSMOS.rule, 2).opacity(out),
        txt(
          'Convex cells can split long clusters or isolate outliers',
          0,
          375,
          28,
          DANGER_COLOR,
          'sans',
        )
          .glow(6, DANGER_COLOR)
          .opacity(out),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);

  tweenCue(s, c, 'left', showLeft, 1, { duration: 0.45 });
  tweenCue(s, c, 'bottom', showBottom, 1, { duration: 0.55 });
  tweenCue(s, c, 'meaning', showMeaning, 1, { duration: 0.45 });
  tweenCue(s, c, 'outlier', showOutlier, 1, { duration: 0.5 });
}
