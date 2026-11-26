// Scene 15: One shared word, two warps
// Missing __syncthreads(): Warp 0 reads tile[1,0] early (register = ?) -> Warp 1 writes 65 ->
// strict prediction hold before revealing B[32,1] = ? -> replay WITH barrier -> Warp 1 writes 65 ->
// 256 threads arrive -> Warp 0 reads 65 -> B[32,1] = 65.
import {
  COSMOS,
  EDGE_33_PAIR65,
  ROLE,
  aura,
  dot,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function barrier(s, c) {
  const phase = s.value(0);
  const earlyRead = s.value(0);
  const lateWrite = s.value(0);
  const earlyStore = s.value(0);
  const restarted = s.value(0);
  const ordWrite = s.value(0);
  const allArrive = s.value(0);
  const ordRead = s.value(0);
  const ordStore = s.value(0);

  const bgAura = aura(0, 10, 650, '#ff6b8b1c', '#6ee7b716');
  const title = heroTitle(['One Shared Word,', 'Two Warps'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'BARRIER RACE · HAPPENS-BEFORE ORDER',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const rep = restarted.value > 0.5;
    const er = earlyRead.value > 0.5;
    const lw = lateWrite.value > 0.5;
    const es = earlyStore.value > 0.05;
    const ow = ordWrite.value > 0.5;
    const aa = allArrive.value > 0.5;
    const or = ordRead.value > 0.5;
    const os = ordStore.value > 0.5;

    const val65 = String(EDGE_33_PAIR65.producer.value); // "65"
    let sharedState = 'unwritten';
    let regState = 'empty';
    let outState = 'pending';

    if (!rep) {
      if (er) regState = '?';
      if (lw) sharedState = val65;
      if (es) outState = '?';
    } else {
      if (ow) sharedState = val65;
      if (or) regState = val65;
      if (os) outState = val65;
    }

    const steps = rep
      ? [
          { label: 'Warp 1 writes 65', done: ow, col: ROLE.input },
          { label: '256 hit barrier', done: aa, col: ROLE.good },
          { label: 'Warp 0 reads 65', done: or, col: ROLE.gold },
          { label: 'Warp 0 stores 65', done: os, col: ROLE.output },
        ]
      : [
          { label: 'Warp 0 reads early', done: er, col: ROLE.bad },
          { label: 'Warp 1 writes 65', done: lw, col: ROLE.input },
          { label: es ? 'Warp 0 stores ?' : 'Warp 0 stores', done: es, col: ROLE.bad },
        ];

    const nodes = [
      txt(
        rep
          ? 'REPLAY WITH __syncthreads() RESTORED'
          : 'NO BARRIER · ONE POSSIBLE INTER-WARP SCHEDULE',
        155,
        -355,
        26,
        rep ? ROLE.good : ROLE.bad,
        'mono',
      ),
      glowingTrail(
        [
          [-680, -180],
          [680, -180],
        ],
        { color: rep ? ROLE.good : ROLE.bad, width: 3.4, glow: 6, opacity: 0.65 },
      ),
    ];

    // Event timeline markers
    steps.forEach((st, i) => {
      const sx = -620 + (i / (steps.length - 1)) * 1240;
      nodes.push(
        dot(st.done ? 14 : 9, st.done ? st.col : COSMOS.rule)
          .at(sx, -180)
          .glow(st.done ? 10 : 0, st.col),
        txt(st.label, sx, -120, 26, st.done ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
    });

    // 3 state containers: Shared tile[1,0] | Warp 0 register | Output B[32,1]
    const boxes = [
      { label: 'SHARED tile[1, 0]', val: sharedState, x: -575, col: ROLE.input },
      { label: 'WARP 0 REGISTER', val: regState, x: 0, col: ROLE.gold },
      { label: 'OUTPUT B[32, 1]', val: outState, x: 575, col: ROLE.output },
    ];

    boxes.forEach((b) => {
      const isBad = b.val === '?';
      const is65 = b.val === val65;
      const stroke = isBad ? ROLE.bad : is65 ? ROLE.good : b.col;
      nodes.push(
        txt(b.label, b.x, -8, 28, b.col, 'mono'),
        glassCell(b.x, 118, 460, 176, stroke, {
          fill: isBad ? '#32101e' : is65 ? '#0d2b24' : '#0f1a30',
          glow: isBad || is65 ? 11 * pulse : 4,
        }),
        txt(
          b.val,
          b.x,
          118,
          isBad || is65 ? 84 : 38,
          isBad ? ROLE.bad : is65 ? ROLE.good : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Prediction / outcome caption at bottom
    let caption = 'At tile entry, shared slot [1, 0] has no producer value yet';
    let capCol = COSMOS.muted;
    if (!rep) {
      if (es) {
        caption = 'Stores the undefined earlier read (?) · later write cannot update register';
        capCol = ROLE.bad;
      } else if (lw) {
        caption = 'Look at Warp 0 register · what value will Warp 0 store?';
        capCol = ROLE.gold;
      } else if (er) {
        caption = '? = undefined bits read before Warp 1 wrote 65';
        capCol = ROLE.bad;
      }
    } else if (os) {
      caption = 'B[32, 1] receives 65 · verify repairs with racecheck, not just output';
      capCol = ROLE.good;
    } else if (or) {
      caption = 'Warp 0 safely reads 65 after all 256 threads clear the barrier';
      capCol = ROLE.good;
    } else if (aa) {
      caption = 'All 256 threads arrive (even masked loaders) → barrier releases';
      capCol = ROLE.good;
    } else if (ow) {
      caption = 'Warp 1 writes 65 to tile[1, 0]';
      capCol = ROLE.input;
    } else {
      caption = 'Restarting tile with unconditional __syncthreads() in place';
      capCol = ROLE.output;
    }

    const u = (p * 0.42) % 1;
    nodes.push(
      glowDot(-675 + u * 1350, -180, { radius: 6.5, color: rep ? ROLE.good : ROLE.bad }),
      txt(caption, 0, 325, 30, capCol, 'sans').glow(5, capCol),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 16);

  c.on('early-read', () =>
    s.play(earlyRead.to(1, { duration: remainDuration(c, 'early-read', 0.4) })),
  );
  c.on('late-write', () =>
    s.play(lateWrite.to(1, { duration: remainDuration(c, 'late-write', 0.4) })),
  );
  c.after('early-store', () =>
    s.play(earlyStore.to(1, { duration: remainAfterDuration(c, 'early-store', 0.4) })),
  );
  c.on('restart-slot', () =>
    s.play(restarted.to(1, { duration: remainDuration(c, 'restart-slot', 0.4) })),
  );
  c.on('ordered-write', () =>
    s.play(ordWrite.to(1, { duration: remainDuration(c, 'ordered-write', 0.4) })),
  );
  c.on('all-arrive', () =>
    s.play(allArrive.to(1, { duration: remainDuration(c, 'all-arrive', 0.4) })),
  );
  c.on('ordered-read', () =>
    s.play(ordRead.to(1, { duration: remainDuration(c, 'ordered-read', 0.4) })),
  );
  c.on('ordered-store', () =>
    s.play(ordStore.to(1, { duration: remainDuration(c, 'ordered-store', 0.4) })),
  );
}
