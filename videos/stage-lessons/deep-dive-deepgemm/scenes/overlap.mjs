// Scene 18: When can the next chunk use the wire?
// PREDICTION SCENE: Beat 1 pauses at t=1 (Slot 0 = A, Slot 1 = FREE, Comm = FREE).
// STRICT WITHHOLDING: DO NOT show B dispatching, Slot 1 occupied by B, or t=6 before Beat 2 cues!
import {
  COSMOS,
  ROLE,
  aura,
  buildMegaMoeRing3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  parallel,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  serial,
  txt,
} from '../parts.mjs';

export default function overlap(s, c) {
  const phase = s.value(0);
  const overlap3d = s.value(0);
  // mode: 0 = serial (0..8), 1 = 2-slot replay paused at t=1, 2 = 2-slot overlap (1..6), 3 = 1-slot replay (1..8)
  const mode = s.value(0);
  const clockT = s.value(0);
  const showAsk = s.value(0);
  const revealSix = s.value(0); // STRICT: c.after('dg-overlap-2-2')

  const bgAura = aura(445, 20, 520, '#5ce1e622', '#6ee7b71a');
  const { view: ring3d } = buildMegaMoeRing3d(overlap3d, phase, { x: 455, y: 15, unit: 94 });

  const title = heroTitle(['When Can the Next', 'Chunk Use the Wire?'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.c,
    eyebrow: 'MEGA MOE · NVLINK / COMPUTE OVERLAP',
    subtitle: 'Dispatch (1) -> Compute (2) -> Combine (1) across two chunks',
  });

  const live = guardedDynamic(1, () => {
    const m = Math.round(mode.value);
    const tNow = clockT.value;
    const events = m === 1 || m === 2 ? parallel : serial;

    const railLeft = -700;
    const pxPerUnit = 78; // 8 units = 624 px (-700 to -76)
    const toX = (t) => railLeft + t * pxPerUnit;
    const commY = -88;
    const compY = 18;
    const barH = 54;

    // Determine visible slot owners strictly respecting prediction withholding!
    const slot0Owner =
      tNow >= 0.05 && tNow < 4.0 ? 'A' : m === 3 && tNow >= 4.0 && tNow < 8.0 ? 'B' : 'FREE';
    const slot1Owner =
      m === 3 ? 'NONE (1 slot)' : m === 2 && tNow >= 1.05 && tNow < 6.0 ? 'B' : 'FREE';

    const nodes = [
      txt('3D SYMMETRIC RING & NVLINK TRACKS', 455, -415, 26, COSMOS.cyan, 'mono').glow(
        5,
        COSMOS.cyan,
      ),
      txt(
        m === 2
          ? '2 ring slots: NVLink overlaps Tensor Core compute'
          : m === 3
            ? '1 ring slot: B stalls until A releases at t = 4'
            : 'Upper track: NVLink dispatch/combine · Core: L1+SwiGLU+L2',
        455,
        435,
        26,
        COSMOS.muted,
        'sans',
      ),
      // Time axis 0..8
      line([toX(0), -150], [toX(8), -150], { stroke: COSMOS.dim, width: 2 }),
      txt('COMM', -845, commY, 26, ROLE.scale, 'mono', 'left'),
      txt('COMP', -845, compY, 26, ROLE.c, 'mono', 'left'),
    ];

    for (let tick = 0; tick <= 8; tick++) {
      const tx = toX(tick);
      nodes.push(
        line([tx, -158], [tx, -142], { stroke: COSMOS.dim, width: 2 }),
        txt(String(tick), tx, -180, 26, COSMOS.muted, 'mono'),
      );
    }

    // Draw events up to tNow (strictly clipping B in mode 1!)
    for (const ev of events) {
      if (m === 1 && ev.id.startsWith('B')) continue;
      if (tNow <= ev.start + 0.01) continue;
      const drawEnd = Math.min(ev.end, tNow);
      const w = Math.max(4, (drawEnd - ev.start) * pxPerUnit);
      const cx = toX(ev.start) + w * 0.5;
      const cy = ev.lane === 0 ? commY : compY;
      const isA = ev.id.startsWith('A');
      const shortTag = ev.id.includes('dispatch')
        ? `${isA ? 'A' : 'B'} D`
        : ev.id.includes('compute')
          ? `${isA ? 'A' : 'B'} Comp`
          : `${isA ? 'A' : 'B'} C`;
      const fill = isA ? '#15345e' : '#104637';
      const stroke = isA ? ROLE.a : ROLE.good;
      nodes.push(
        rect(w - 3, barH, { fill, stroke, width: 2.2, radius: 6 })
          .at(cx, cy)
          .glow(6, stroke),
      );
      const minLabelW = ev.id.includes('compute') ? 128 : 68;
      if (w >= minLabelW) {
        nodes.push(txt(shortTag, cx, cy, 26, COSMOS.ink, 'mono'));
      }
    }

    // Playhead vertical line
    const playX = toX(Math.max(0, Math.min(8, tNow)));
    nodes.push(
      line([playX, -144], [playX, 62], { stroke: ROLE.gold, width: 3.5 }).glow(8, ROLE.gold),
    );

    // Ring Buffer Slot Cards (Slot 0 and Slot 1)
    nodes.push(
      glassCell(
        -665,
        148,
        360,
        96,
        slot0Owner === 'A' ? ROLE.a : slot0Owner === 'B' ? ROLE.good : COSMOS.dim,
        {
          fill: '#0e172a',
          glow: 7,
        },
      ),
      txt('RING SLOT 0', -665, 126, 26, COSMOS.muted, 'mono'),
      txt(`Owner: ${slot0Owner}`, -665, 168, 28, slot0Owner === 'A' ? ROLE.a : ROLE.good, 'mono'),

      glassCell(
        -260,
        148,
        380,
        96,
        m === 3 ? ROLE.bad : slot1Owner === 'B' ? ROLE.good : ROLE.gold,
        {
          fill: m === 3 ? '#26121f' : '#0e172a',
          dash: m === 3 ? [7, 5] : undefined,
          glow: m === 1 || slot1Owner === 'B' ? 8 : 3,
        },
      ),
      txt('RING SLOT 1', -260, 126, 26, COSMOS.muted, 'mono'),
      txt(
        `Owner: ${slot1Owner}`,
        -260,
        168,
        28,
        m === 3 ? ROLE.bad : slot1Owner === 'B' ? ROLE.good : ROLE.gold,
        'mono',
      ),
    );

    // Prediction prompt during Beat 1 hold
    if (m === 1 && showAsk.value > 0.5) {
      nodes.push(
        glassCell(-460, 290, 780, 88, ROLE.gold, { fill: '#221c10', glow: 9 }),
        txt(
          't = 1: Comm is free, Slot 1 is empty. Can B dispatch now?',
          -460,
          290,
          26,
          ROLE.gold,
          'serif',
        ),
      );
    } else {
      const verdictText =
        m === 3 && tNow >= 7.5
          ? '1 slot only: B waits for A combine at t = 4 -> done at t = 8'
          : m === 3
            ? '1 slot replay at t = 1: A holds the only slot -> B blocked!'
            : revealSix.value > 0.5
              ? '2 slots overlapped: B finishes combine at t = 6 (saved 2)'
              : m === 2
                ? 'B dispatches in Slot 1 while A runs; A combines while B runs'
                : tNow >= 7.5
                  ? 'Serial A then B: both chunks finish at t = 8'
                  : '1 dispatch + 2 compute + 1 combine = 4 slots per chunk';
      const vCol = m === 3 ? ROLE.warn : revealSix.value > 0.5 ? ROLE.good : ROLE.c;
      nodes.push(
        glassCell(-460, 290, 800, 88, vCol, { fill: '#0e1d2c', glow: 7 }),
        txt(verdictText, -460, 290, 26, vCol, 'sans'),
      );
    }

    nodes.push(
      txt(
        'Keep each ring slot leased until its chunk finishes combining',
        -860,
        392,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.94 });

  // Beat 0: Serial 0 -> 8
  c.on('dg-overlap-0-1', () =>
    s.play(clockT.to(4, { duration: remainDuration(c, 'dg-overlap-0-1', 1.2) })),
  );
  c.on('dg-overlap-0-2', () =>
    s.play(clockT.to(8, { duration: remainDuration(c, 'dg-overlap-0-2', 1.2) })),
  );

  // Beat 1: Replay with 2 slots, stop cleanly at t=1 (STRICT WITHHOLDING!)
  c.on('dg-overlap-1-0', () => {
    mode.set(1);
    clockT.set(0);
    s.play(overlap3d.to(0.45, { duration: remainDuration(c, 'dg-overlap-1-0', 0.45) }));
  });
  c.on('dg-overlap-1-1', () =>
    s.play(clockT.to(1, { duration: remainDuration(c, 'dg-overlap-1-1', 0.65) })),
  );
  c.on('dg-overlap-1-2', () =>
    s.play(showAsk.to(1, { duration: remainDuration(c, 'dg-overlap-1-2', 0.35) })),
  );

  // Beat 2: Reveal 2-slot overlap -> t=6
  c.on('dg-overlap-2-0', () => {
    mode.set(2);
    showAsk.set(0);
    const dur = remainDuration(c, 'dg-overlap-2-0', 0.85);
    s.play(clockT.to(3, { duration: dur }));
    s.play(overlap3d.to(1, { duration: dur }));
  });
  c.on('dg-overlap-2-1', () =>
    s.play(clockT.to(5, { duration: remainDuration(c, 'dg-overlap-2-1', 0.85) })),
  );
  c.after('dg-overlap-2-2', () => {
    const dur = remainAfterDuration(c, 'dg-overlap-2-2', 0.4);
    s.play(clockT.to(6, { duration: dur }));
    s.play(revealSix.to(1, { duration: dur }));
  });

  // Beat 3: Replay with 1 slot -> stall until t=4 -> finish at t=8
  c.on('dg-overlap-3-0', () => {
    mode.set(3);
    revealSix.set(0);
    clockT.set(1);
    s.play(overlap3d.to(0.15, { duration: remainDuration(c, 'dg-overlap-3-0', 0.45) }));
  });
  c.on('dg-overlap-3-1', () =>
    s.play(clockT.to(4, { duration: remainDuration(c, 'dg-overlap-3-1', 0.8) })),
  );
  c.on('dg-overlap-3-2', () =>
    s.play(clockT.to(8, { duration: remainDuration(c, 'dg-overlap-3-2', 0.9) })),
  );
}
