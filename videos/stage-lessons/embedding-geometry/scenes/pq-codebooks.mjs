// Scene 13: pq-codebooks: "Store one ID for each pair"
// Product Quantization subspace cinema: glowing 8D vector splitting into 4 2D subspaces,
// live Voronoi centroid plane matching each pair to its nearest centroid, and launching ID photons
// into a 4-byte storage register.
import { dynamic, group, line, seq } from 'vizmatic/stage';
import {
  COSMOS,
  PQ_PAIRS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  glowingBezier,
  heroTitle,
  lumBar,
  playCue,
  runPhase,
  txt,
} from '../parts.mjs';

export default function pqCodebooks(s, c) {
  const books = PQ_PAIRS.map((pair) => [[0, 0], pair]);
  const slotCols = [ROLE.code, ROLE.A, ROLE.B, ROLE.violet];

  const phase = s.value(0);
  const splitMix = s.value(0);
  const bookOpen = s.value(0);
  const activeBook = s.value(0); // 0..3
  const filledCount = s.value(0); // 0..4
  const storeBytes = s.value(0);

  const title = heroTitle(['Store one ID', 'for each pair'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.code,
    eyebrow: 'PRODUCT QUANTIZATION · CODEBOOKS',
  });

  const stageLayer = dynamic(() => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const sp = splitMix.value;
    const bo = bookOpen.value;
    const idx = Math.max(0, Math.min(3, Math.round(activeBook.value)));
    const filled = Math.round(filledCount.value);
    const pairXs = [-435, -135, 165, 465];
    const inputY = -245;
    const slotY = 365;

    const nodes = [
      txt('8D INPUT', -845, inputY, 30, COSMOS.muted, 'mono', 'left'),
      txt(
        storeBytes.value > 0.5 ? '4 BYTES' : 'STORED IDs',
        -845,
        slotY,
        30,
        ROLE.code,
        'mono',
        'left',
      ),
    ];

    // Top 4 subspace pairs
    PQ_PAIRS.forEach((pair, i) => {
      const px = pairXs[i];
      const isCur = bo > 0.4 && i === idx;
      const col = isCur ? ROLE.gold : slotCols[i];
      if (sp > 0.02) {
        nodes.push(
          lumBar(px, inputY, 240, 74, {
            color: col,
            fillAlpha: isCur ? 0.26 : 0.12,
            strokeWidth: isCur ? 3.2 : 1.8,
            glow: isCur ? 11 * pulse : 4,
            opacity: sp,
          }),
        );
      }
      nodes.push(
        txt(`[${pair[0]}, ${pair[1]}]`, px, inputY, 34, isCur ? ROLE.gold : COSMOS.ink, 'mono'),
        txt(
          `subspace ${i + 1}`,
          px,
          inputY - 62,
          26,
          isCur ? ROLE.gold : COSMOS.dim,
          'mono',
        ).opacity(0.35 + 0.65 * sp),
      );
    });

    // Center-Left: Live 2D Voronoi subspace plane for current book
    const vx0 = -640;
    const vy0 = 205;
    const vScale = 64;
    const mapV = ([x, y]) => [vx0 + x * vScale, vy0 - y * vScale];
    const curPair = PQ_PAIRS[idx];
    const c0Pt = mapV([0, 0]);
    const c1Pt = mapV(curPair);
    const matched = filled > idx;

    nodes.push(
      txt(
        bo > 0.4 ? `SUBSPACE ${idx + 1} VORONOI PLANE` : 'SUBSPACE GEOMETRY',
        -445,
        -125,
        26,
        ROLE.code,
        'mono',
      ),
      line([vx0 - 20, vy0], [vx0 + 385, vy0], { stroke: '#3c507c', width: 2.2 }),
      line([vx0, vy0 + 20], [vx0, vy0 - 270], { stroke: '#3c507c', width: 2.2 }),
    );

    if (bo > 0.02) {
      // Centroid 0 at origin & Centroid 1 at curPair
      nodes.push(
        glowRing(c0Pt[0], c0Pt[1], 14, ROLE.query, { width: 2.6, glow: 7, opacity: bo }),
        txt('ID 0', c0Pt[0] + 46, c0Pt[1] + 24, 26, ROLE.query, 'mono').opacity(bo),
        line(c0Pt, c1Pt, { stroke: '#4d608e', width: 2, dash: [6, 6] }).opacity(0.65 * bo),
        glowRing(c1Pt[0], c1Pt[1], matched ? 24 : 16, matched ? ROLE.gold : ROLE.A, {
          width: matched ? 3.6 : 2.6,
          glow: matched ? 12 * pulse : 8,
          opacity: bo,
        }),
        glowDot(c1Pt[0], c1Pt[1], {
          radius: 8,
          color: matched ? ROLE.gold : ROLE.A,
          glow: 11,
          opacity: bo,
        }),
        txt('ID 1', c1Pt[0] + 68, c1Pt[1] - 26, 28, matched ? ROLE.gold : ROLE.A, 'mono').opacity(
          bo,
        ),
      );
    }

    // Center-Right: Open Codebook Inspector (ID 0 vs ID 1 entries, floating cinema style!)
    const bx = 250;
    nodes.push(
      txt(
        bo > 0.4 ? `BOOK ${idx + 1}  (2 CENTERS)` : 'SHARED CODEBOOK',
        bx,
        -142,
        32,
        ROLE.code,
        'mono',
      ).glow(6, ROLE.code),
      lumBar(bx - 165, 55, 290, 210, {
        color: ROLE.query,
        fillAlpha: 0.12,
        strokeWidth: 2,
        glow: 5,
      }),
      txt('ID 0', bx - 165, -2, 34, ROLE.query, 'mono'),
      line([bx - 275, 38], [bx - 55, 38], { stroke: '#2c3d63', width: 1.8 }),
      txt(bo > 0.4 ? '[0, 0]' : '?', bx - 165, 96, 38, COSMOS.muted, 'mono'),

      lumBar(bx + 165, 55, 290, 210, {
        color: matched ? ROLE.gold : ROLE.A,
        fillAlpha: matched ? 0.24 : 0.14,
        strokeWidth: matched ? 3.2 : 2.2,
        glow: matched ? 12 * pulse : 6,
      }),
      txt('ID 1', bx + 165, -2, 34, matched ? ROLE.gold : ROLE.A, 'mono'),
      line([bx + 55, 38], [bx + 275, 38], { stroke: '#2c3d63', width: 1.8 }),
      txt(
        bo > 0.4 ? `[${curPair[0]}, ${curPair[1]}]` : '?',
        bx + 165,
        96,
        38,
        matched ? ROLE.gold : COSMOS.ink,
        'mono',
      ),
    );

    if (filled >= 1) {
      nodes.push(txt('nearest match → ID 1', bx, -84, 28, ROLE.gold, 'mono').glow(7, ROLE.gold));
    }

    // Bottom 4-byte storage slots + glowing routing arcs from Book ID 1
    pairXs.forEach((px, i) => {
      const hasId = i < filled;
      nodes.push(
        lumBar(px, slotY, 190, 74, {
          color: hasId ? ROLE.gold : '#3c507c',
          fillAlpha: hasId ? 0.24 : 0.1,
          strokeWidth: hasId ? 2.8 : 2,
          glow: hasId ? 9 * pulse : 3,
        }),
      );
      if (hasId) {
        nodes.push(
          txt('1', px, slotY, 44, ROLE.gold, 'mono').glow(8, ROLE.gold),
          txt('1 B', px + 62, slotY + 18, 26, COSMOS.dim, 'mono').opacity(storeBytes.value),
        );
      }
      if (hasId && i === idx) {
        nodes.push(
          glowingBezier([bx + 165, 162], [px, slotY - 40], 45, {
            color: ROLE.gold,
            width: 3.2,
            glow: 8,
            opacity: 0.85,
          }),
        );
      }
    });

    // Right-side summary badge when all 4 bytes stored
    if (storeBytes.value > 0.02) {
      nodes.push(
        txt('256 centers = 1 byte', 588, 342, 26, ROLE.code, 'mono', 'left').opacity(
          storeBytes.value,
        ),
        txt('version books w/ index', 588, 384, 26, COSMOS.muted, 'sans', 'left').opacity(
          storeBytes.value,
        ),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.code, ROLE.gold), title, stageLayer);

  runPhase(s, c, phase, 8);

  playCue(s, c, 'split', (d) => s.play(splitMix.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'nearest', (d) => s.play(bookOpen.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'ids', (d) => s.play(filledCount.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(
    s,
    c,
    'repeat',
    (d) => {
      const step = Math.max(0.25, d / 3);
      s.play(
        seq(
          activeBook.to(1, { duration: step * 0.4 }),
          filledCount.to(2, { duration: step * 0.6 }),
          activeBook.to(2, { duration: step * 0.4 }),
          filledCount.to(3, { duration: step * 0.6 }),
          activeBook.to(3, { duration: step * 0.4 }),
          filledCount.to(4, { duration: step * 0.6 }),
        ),
      );
    },
    { dur: 2.6 },
  );
  playCue(s, c, 'store', (d) => s.play(storeBytes.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
