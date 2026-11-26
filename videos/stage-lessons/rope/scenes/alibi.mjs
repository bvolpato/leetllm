// Scene 19: alibi: Query & self-key at 10 vs yellow key moving 9 -> 6: steep (1/2) vs gentle (1/16) head + future mask at 11.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAura,
  cinemaStars,
  glowDot,
  glowTex,
  heroTitle,
  playAfter,
  playOn,
  shareStrip,
  softmax,
  txt,
} from '../parts.mjs';

export default function alibi(s, c) {
  const keyPos = s.value(9); // starts 1 back from 10, moves to 6 (delta = 4)
  const revealShare = s.value(0);
  const showFuture = s.value(0);

  const stars = cinemaStars(125, 19, ROLE.alibi);
  const stageAura = cinemaAura(120, 20, 680, '#fb923c20', '#ff6b8b14');

  const title = heroTitle(['Four positions', 'back'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.alibi,
    eyebrow: 'ALiBi LINEAR DISTANCE BIAS',
  });

  const eq = glowTex(
    String.raw`\text{score}_{ij} = \frac{q_i^\top k_j}{\sqrt{d}} - m \cdot (i - j)`,
    {
      x: 340,
      y: -380,
      size: 38,
      color: ROLE.alibi,
      glow: 6,
    },
  );

  const live = dynamic(() => {
    const kp = keyPos.value;
    const rev = revealShare.value;
    const fut = showFuture.value;
    const dist = 10 - kp;
    const contentLogit = 4.0;

    // Position track (5 .. 12)
    const rx0 = -780;
    const rx1 = 780;
    const ry = -195;
    const mapX = (p) => rx0 + ((p - 5) / 7) * (rx1 - rx0);
    const qx = mapX(10);
    const kx = mapX(kp);
    const fx = mapX(11);

    const nodes = [
      line([rx0, ry], [rx1, ry], { stroke: '#3a4b73', width: 3 }),
      line([kx, ry - 26], [qx, ry - 26], { stroke: ROLE.alibi, width: 4.5 })
        .glow(8, ROLE.alibi)
        .set('blend', 'screen'),
      txt(`Δ = ${dist.toFixed(1)}`, (kx + qx) * 0.5, ry - 56, 28, ROLE.alibi, 'mono'),
      glowDot(kx, ry, { radius: 9, color: ROLE.key, glow: 12 }),
      txt(`key (${kp.toFixed(0)})`, kx, ry + 42, 26, ROLE.key, 'mono'),
      glowDot(qx, ry, { radius: 9, color: ROLE.query, glow: 12 }),
      txt('query / self (10)', qx, ry + 42, 26, ROLE.query, 'mono'),
    ];

    if (fut > 0.1) {
      nodes.push(
        glowDot(fx, ry, { radius: 9, color: ROLE.danger, glow: 12 }).opacity(fut),
        txt('11: −∞ (mask)', fx + 95, ry - 48, 26, ROLE.danger, 'mono').opacity(fut),
      );
    }

    // Two head rows: steep m = 1/2 vs gentle m = 1/16
    const heads = [
      { name: 'Head A (steep)', slopeStr: 'm = 1/2', slope: 0.5, y: 10, col: ROLE.alibi },
      { name: 'Head B (gentle)', slopeStr: 'm = 1/16', slope: 1 / 16, y: 210, col: ROLE.score },
    ];

    heads.forEach((h) => {
      const penalty = h.slope * dist;
      const oldLogit = contentLogit - penalty;
      const w = softmax([contentLogit, oldLogit]);
      const showNumbers = kp < 8.5 && rev > 0.15;

      nodes.push(
        txt(h.name, -855, h.y - 34, 28, h.col, 'mono', 'left'),
        txt(h.slopeStr, -855, h.y + 10, 30, COSMOS.ink, 'mono', 'left'),
        txt(
          kp < 8.5
            ? `4.00 − ${penalty.toFixed(2)} = ${oldLogit.toFixed(2)}`
            : `4.00 − ${penalty.toFixed(2)}`,
          -470,
          h.y - 12,
          28,
          h.col,
          'mono',
          'left',
        ),
        shareStrip({
          x: -20,
          y: h.y - 12,
          width: 620,
          height: 52,
          shares: showNumbers ? [w[0], w[1]] : [0.5, 0.5],
          colors: [ROLE.query, h.col],
          labels: showNumbers
            ? [`self ${(w[0] * 100).toFixed(0)}%`, `older ${(w[1] * 100).toFixed(1)}%`]
            : ['self ?', 'older ?'],
        }),
        txt(
          showNumbers ? `${(w[1] * 100).toFixed(1)}%` : '?',
          790,
          h.y - 12,
          36,
          h.col,
          'mono',
          'right',
        ).glow(showNumbers ? 8 : 0, h.col),
      );
    });

    nodes.push(
      txt(
        fut > 0.2
          ? 'RoPE rotates vectors; ALiBi adds a recency bias before softmax (future masked −∞)'
          : 'Both keys have content logit 4.0: compare how each slope penalizes Δ = 4',
        -855,
        375,
        27,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, eq, live);

  // Beat 0: prediction prompt: keep key at 9 & shares withheld
  playOn(s, c, 'compare-slopes', (d) => revealShare.to(0, { duration: d }), 0.25);
  // Beat 1: move key back to 6 -> reveal 43.8% share after spoken clause!
  playOn(s, c, 'move-key-back', (d) => keyPos.to(6, { duration: d }), 1.3);
  playAfter(s, c, 'read-shares', (d) => revealShare.to(1, { duration: d }), 0.45);
  // Beat 2: future key at 11 hard-masked to -infinity
  playOn(s, c, 'mask-future', (d) => showFuture.to(1, { duration: d }), 0.6);
}
