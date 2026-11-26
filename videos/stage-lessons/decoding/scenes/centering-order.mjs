// Scene 22: centering-order: "Centering is safe for softmax but can change a penalty"
// View 1 (Beats 0-1): Forks raw [2.4, 2.1, 1.2, 0.3] (seen A) into Penalty-First (B wins at 2.1,
//   AFTER dec-penalty-first) vs Center-First (A stays 0.0 and still wins, AFTER dec-center-first).
// View 2 (Beat 2): Seen A (2 -> 1) and stronger seen B (10 -> 5) with unseen C (0): A's raw logit
//   drops yet P(A) jumps from 0.00034 to 0.01799 AFTER dec-probability-rise!
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  decodeRepetition,
  decodeSoftmax,
  fmt,
  glowVector,
  lumBar,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function centeringOrder(s, c) {
  const title = heroTitle(['Centering preserves softmax,', 'not sign-aware penalties'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.pruned,
  });

  const vFork = s.value(1);
  const vRise = s.value(0);

  const penFirstDone = s.value(0);
  const showCenterRoute = s.value(0);
  const cenFirstDone = s.value(0);
  const riseDone = s.value(0);

  const raw = [2.4, 2.1, 1.2, 0.3];
  const penOut = decodeRepetition(raw, [0], 1.2); // [2.0, 2.1, 1.2, 0.3]
  const centered = raw.map((v) => v - 2.4); // [0, -0.3, -1.2, -2.1]
  const cenOut = decodeRepetition(centered, [0], 1.2); // [0, -0.3, -1.2, -2.1]

  // VIEW 1: Penalty-first vs Center-first fork
  const forkLayer = guardedDynamic(vFork, (alpha) => {
    const nodes = [];
    const pf = penFirstDone.value > 0.4;
    const cr = showCenterRoute.value;
    const cf = cenFirstDone.value > 0.4;
    const names = ['seen A', 'B', 'C', 'D'];

    // Shared raw logits along top
    nodes.push(
      txt('Raw logits (only A seen, θ = 1.2)', 0, -285, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
    );
    raw.forEach((z, i) => {
      const x = -435 + i * 290;
      nodes.push(
        lumBar(x, -210, 220, 66, {
          color: i === 0 ? ROLE.alt : ROLE.base,
          fillOpacity: 0.24,
          strokeWidth: 2.2,
          glow: 7,
          radius: 10,
          opacity: alpha,
        }),
        txt(`${names[i]}: ${fmt(z, 1)}`, x, -210, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
    });

    // Left lane: Penalty first (CORRECT)
    nodes.push(
      glowVector([-220, -162], [-435, -80], {
        color: ROLE.valid,
        width: 4,
        glow: 9,
        opacity: alpha,
      }),
      txt('1. Penalty first, then center', -435, -35, 30, ROLE.valid, 'mono', 'center').opacity(
        alpha,
      ),
    );
    penOut.forEach((z, i) => {
      const x = -720 + i * 190;
      const isWin = pf && i === 1;
      nodes.push(
        lumBar(x, 85, 162, 86, {
          color: isWin ? ROLE.winner : pf ? ROLE.valid : COSMOS.dim,
          fillOpacity: isWin ? 0.36 : 0.16,
          strokeWidth: isWin ? 3 : 1.8,
          glow: isWin ? 12 : 4,
          radius: 10,
          opacity: alpha,
        }),
        txt(names[i].replace('seen ', ''), x, 64, 26, COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
        txt(
          pf ? fmt(z, 1) : '?',
          x,
          104,
          30,
          isWin ? ROLE.winner : COSMOS.ink,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });
    nodes.push(
      txt(
        pf ? 'Winner: B (2.1 > 2.0)' : 'A drops from 2.4 -> ?',
        -435,
        210,
        32,
        pf ? ROLE.winner : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(pf ? 7 : 0, ROLE.winner)
        .opacity(alpha),
    );

    // Right lane: Center first (BUG)
    const rA = Math.max(0.22, cr) * alpha;
    nodes.push(
      glowVector([220, -162], [435, -80], { color: ROLE.pruned, width: 4, glow: 9, opacity: rA }),
      txt('2. Center first (subtract 2.4)', 435, -35, 30, ROLE.pruned, 'mono', 'center').opacity(
        rA,
      ),
    );
    cenOut.forEach((z, i) => {
      const x = 150 + i * 190;
      const isWin = cf && i === 0;
      nodes.push(
        lumBar(x, 85, 162, 86, {
          color: isWin ? ROLE.pruned : cf ? ROLE.base : COSMOS.dim,
          fillOpacity: isWin ? 0.34 : 0.14,
          strokeWidth: isWin ? 3 : 1.8,
          glow: isWin ? 11 : 4,
          radius: 10,
          opacity: rA,
        }),
        txt(names[i].replace('seen ', ''), x, 64, 26, COSMOS.muted, 'mono', 'center').opacity(rA),
        txt(
          cf ? fmt(z, 1) : '?',
          x,
          104,
          30,
          isWin ? ROLE.pruned : COSMOS.ink,
          'mono',
          'center',
        ).opacity(rA),
      );
    });
    nodes.push(
      txt(
        cf ? 'Winner stays A (0.0 >= -0.3)!' : 'A becomes 0.0 -> 0.0 / 1.2 = ?',
        435,
        210,
        32,
        cf ? ROLE.pruned : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(cf ? 7 : 0, ROLE.pruned)
        .opacity(rA),
    );

    nodes.push(
      txt(
        'Always subtract max(z) AFTER sign-aware repetition penalties.',
        0,
        375,
        30,
        ROLE.winner,
        'serif',
        'center',
      )
        .glow(6, ROLE.winner)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Penalized token A's normalized probability RISES because B fell more!
  const riseLayer = guardedDynamic(vRise, (alpha) => {
    const nodes = [];
    const rd = riseDone.value > 0.4;
    const z0 = [2, 10, 0];
    const z1 = decodeRepetition(z0, [0, 1], 2); // [1, 5, 0]
    const p0 = decodeSoftmax(z0);
    const p1 = decodeSoftmax(z1);
    const lbls = ['seen A', 'seen B', 'unseen C'];
    const cols = [ROLE.winner, ROLE.pruned, ROLE.base];

    nodes.push(
      txt(
        'Both A and B are seen  |  θ = 2.0  |  A drops 2 -> 1, B drops 10 -> 5',
        0,
        -245,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );

    lbls.forEach((lbl, i) => {
      const cx = -500 + i * 500;
      nodes.push(
        txt(lbl, cx, -155, 32, cols[i], 'mono', 'center').opacity(alpha),
        lumBar(cx, -55, 340, 82, {
          color: ROLE.base,
          fillOpacity: 0.2,
          strokeWidth: 2.2,
          glow: 7,
          radius: 10,
          opacity: alpha,
        }),
        txt(`raw z = ${z0[i]}`, cx, -55, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),
        glowVector([cx, 0], [cx, 75], { color: cols[i], width: 3.8, glow: 8, opacity: alpha }),
        lumBar(cx, 130, 340, 82, {
          color: cols[i],
          fillOpacity: 0.26,
          strokeWidth: 2.4,
          glow: 9,
          radius: 10,
          opacity: alpha,
        }),
        txt(`penalized z = ${z1[i]}`, cx, 130, 32, cols[i], 'mono', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        rd
          ? `P(A): ${fmt(p0[0], 4)} -> ${fmt(p1[0], 4)}  (54× higher!)`
          : 'Compare normalized P(A) before and after...',
        0,
        310,
        32,
        rd ? ROLE.winner : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(rd ? 8 : 0, ROLE.winner)
        .opacity(alpha),
      txt(
        'Softmax normalizes across the whole row, so cutting B harder lifts A.',
        0,
        395,
        28,
        COSMOS.muted,
        'serif',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.pruned, ROLE.valid), title, forkLayer, riseLayer);

  playCue(s, c, 'dec-centering-order-1', (d) => s.play(penFirstDone.to(0.1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-penalty-first', (d) => s.play(penFirstDone.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  playCue(s, c, 'dec-centering-order-2', (d) => s.play(showCenterRoute.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'dec-center-first', (d) => s.play(cenFirstDone.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  c.onBeat(2, () => s.play(swapVis(vFork, vRise, 0.55)));
  playCue(s, c, 'dec-centering-order-3', (d) => s.play(riseDone.to(0.1, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'dec-probability-rise', (d) => s.play(riseDone.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
}
