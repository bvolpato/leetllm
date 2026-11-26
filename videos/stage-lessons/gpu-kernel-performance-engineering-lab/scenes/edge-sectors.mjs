// Scene 06: Which sectors does this warp touch?
// Beat 0-1: Unaligned row 1 at N=33 (words 33..64 -> sectors 4..8, 128/160 = 80%), then 1-lane edge (4/32 = 12.5%).
// Beat 2: Scattered stores at N=4096 (stride 16,384 B -> 32 distinct sectors -> 128/1024 = 12.5%).
import {
  COSMOS,
  EDGE_SECTOR_N33,
  EDGE_SECTOR_ONE,
  ROLE,
  aura,
  delay,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  par,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function edgeSectors(s, c) {
  const phase = s.value(0);
  const showRuler = s.value(1);
  const showScatter = s.value(0);

  const lanesProg = s.value(0);
  const firstHit = s.value(0);
  const lastHit = s.value(0);
  const fiveShow = s.value(0);
  const ratio80 = s.value(0);
  const oneLane = s.value(0);
  const ratioEdge = s.value(0);

  const strideShow = s.value(0);
  const scatterProg = s.value(0);
  const fracShow = s.value(0);
  const scopeShow = s.value(0);

  const bgAura = aura(0, 10, 660, '#60a5fa1a', '#5ce1e618');
  const title = heroTitle(['Which Sectors Does', 'This Warp Touch?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.output,
    eyebrow: 'ALIGNMENT & MASKING · 32-BYTE SECTORS',
  });

  // Beats 0 & 1: 5-sector ruler for words 33..64, then switches to 1-lane edge
  const rulerView = guardedDynamic(showRuler, (a) => {
    const p = phase.value;
    const isOne = oneLane.value > 0.5;
    const mode = isOne ? EDGE_SECTOR_ONE : EDGE_SECTOR_N33;
    const lp = lanesProg.value;
    const fh = firstHit.value;
    const lh = lastHit.value;
    const fv = fiveShow.value;
    const r80 = ratio80.value;
    const r12 = ratioEdge.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const sectorIds = isOne ? [0, 1, 2, 3, 4] : [4, 5, 6, 7, 8];
    const activeVisible = isOne ? 1 : Math.floor(mode.words.length * lp);

    const nodes = [
      txt(
        isOne
          ? 'ONE-LANE EDGE REQUEST · MASKED LANES SEND NOTHING'
          : 'N = 33 · ROW 1 · WORDS 33..64 (8 FLOATS PER 32B SECTOR)',
        0,
        -225,
        28,
        isOne ? ROLE.warn : ROLE.input,
        'mono',
      ).opacity(a),
    ];

    sectorIds.forEach((secId, idx) => {
      const cx = -640 + idx * 320;
      const isTouched = mode.sectors.includes(secId);
      const isFirst = !isOne && secId === 4 && fh > 0.3;
      const isLast = !isOne && secId === 8 && lh > 0.3;
      const border = isFirst || isLast ? ROLE.gold : isTouched ? ROLE.output : COSMOS.rule;
      const startW = secId * 8;
      const endW = startW + 7;

      // Count how many words in this sector are active & visible
      let activeInSec = 0;
      for (let w = startW; w <= endW; w++) {
        const pos = mode.words.indexOf(w);
        if (pos >= 0 && pos < activeVisible) activeInSec++;
      }

      nodes.push(
        glassCell(cx, -10, 286, 260, border, {
          fill: isTouched ? '#0e1e33' : '#0b101d',
          glow: isFirst || isLast ? 10 * pulse : isTouched ? 5 : 0,
          opacity: a,
        }),
        txt(
          `Sector ${secId}`,
          cx,
          -100,
          30,
          isTouched ? ROLE.output : COSMOS.muted,
          'mono',
        ).opacity(a),
        txt(`words ${startW}..${endW}`, cx, -50, 26, COSMOS.muted, 'mono').opacity(a),
      );

      // Visual 8-slot bar inside each sector
      for (let slot = 0; slot < 8; slot++) {
        const w = startW + slot;
        const pos = mode.words.indexOf(w);
        const lit = pos >= 0 && pos < activeVisible;
        const sx = cx - 108 + slot * 31;
        nodes.push(
          rect(24, 54, {
            fill: lit ? (isOne ? ROLE.warn : ROLE.input) : '#182138',
            stroke: lit ? ROLE.gold : COSMOS.rule,
            width: 1.5,
            radius: 4,
          })
            .at(sx, 26)
            .opacity(a),
        );
      }

      nodes.push(
        txt(
          `${activeInSec}/8 words`,
          cx,
          90,
          26,
          activeInSec > 0 ? ROLE.gold : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
    });

    // Bottom computed readouts (keep both 80% and 12.5% compact so neither is brief)
    if (r80 > 0.3) {
      nodes.push(
        txt('N=33 row 1: 128/160 = 80%', -430, 222, 30, ROLE.good, 'mono')
          .glow(6, ROLE.good)
          .opacity(a),
      );
    } else if (fv > 0.3) {
      nodes.push(txt('5 sectors (4..8) · 128 B', -430, 222, 30, ROLE.output, 'mono').opacity(a));
    } else if (lh > 0.3) {
      nodes.push(txt('Words 33..64 → Sectors 4..8', 0, 222, 32, ROLE.gold, 'mono').opacity(a));
    } else {
      nodes.push(
        txt('Divide byte addresses by 32 → sector IDs', 0, 222, 30, COSMOS.muted, 'mono').opacity(
          a,
        ),
      );
    }

    if (isOne) {
      nodes.push(
        txt(
          r12 > 0.3 ? '1-lane edge: 4/32 = 12.5%' : '1-lane edge: 4 B in sector 0',
          430,
          222,
          30,
          r12 > 0.3 ? ROLE.warn : ROLE.output,
          'mono',
        )
          .glow(6, r12 > 0.3 ? ROLE.warn : ROLE.output)
          .opacity(a),
      );
    }

    nodes.push(
      txt(
        'Include alignment and active-lane masks before checking counters',
        0,
        340,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    const u = (p * 0.4) % 1;
    nodes.push(glowDot(-750 + u * 1500, 155, { radius: 6, color: ROLE.output, opacity: 0.7 * a }));

    return group(...nodes);
  });

  // Beat 2: 32 scattered sectors at stride 16,384 B (N=4096)
  const scatterView = guardedDynamic(showScatter, (a) => {
    const p = phase.value;
    const sp = scatterProg.value;
    const fr = fracShow.value;
    const sc = scopeShow.value;
    const litCount = Math.min(32, Math.max(4, Math.ceil(sp * 32)));

    const nodes = [
      txt(
        strideShow.value > 0.3
          ? 'SCATTERED STORES · N = 4096 · STRIDE = 16,384 B (512 SECTORS / LANE)'
          : 'SCATTERED NAIVE COLUMN STORES',
        0,
        -225,
        26,
        ROLE.bad,
        'mono',
      ).opacity(a),
    ];

    for (let i = 0; i < 32; i++) {
      const col = i % 8;
      const row = Math.floor(i / 8);
      const cx = -665 + col * 190;
      const cy = -115 + row * 94;
      const lit = i < litCount;
      nodes.push(
        glassCell(cx, cy, 168, 72, lit ? ROLE.bad : COSMOS.rule, {
          fill: lit ? '#2b101d' : '#0b101d',
          glow: lit ? 5 : 0,
          opacity: a,
        }),
        txt(`s${i * 512}`, cx, cy, 26, lit ? ROLE.bad : COSMOS.dim, 'mono').opacity(a),
      );
    }

    nodes.push(
      txt(
        fr > 0.3
          ? '32 sectors × 32 B = 1,024 B touched → 128 / 1,024 = 12.5%'
          : '32 distinct sectors carry the same 128 useful bytes',
        0,
        268,
        34,
        fr > 0.3 ? ROLE.bad : ROLE.gold,
        'mono',
      )
        .glow(7, fr > 0.3 ? ROLE.bad : ROLE.gold)
        .opacity(a),
      txt(
        sc > 0.3
          ? 'Hardware counters measure actual L2 & DRAM traffic'
          : 'Address coverage predicts access-stage demand',
        0,
        355,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    const u = (p * 0.45) % 1;
    nodes.push(glowDot(-700 + u * 1400, 212, { radius: 6, color: ROLE.bad, opacity: 0.75 * a }));

    return group(...nodes);
  });

  s.add(bgAura, title, rulerView, scatterView);
  runPhase(s, c, phase, 16);

  c.on('gpu-edge-sectors-lanes', () =>
    s.play(lanesProg.to(1, { duration: remainDuration(c, 'gpu-edge-sectors-lanes', 0.9) })),
  );
  c.on('gpu-edge-sectors-first', () =>
    s.play(firstHit.to(1, { duration: remainDuration(c, 'gpu-edge-sectors-first', 0.4) })),
  );
  c.on('gpu-edge-sectors-last', () =>
    s.play(lastHit.to(1, { duration: remainDuration(c, 'gpu-edge-sectors-last', 0.4) })),
  );
  c.on('gpu-edge-sectors-five', () =>
    s.play(fiveShow.to(1, { duration: remainDuration(c, 'gpu-edge-sectors-five', 0.4) })),
  );
  c.after('gpu-edge-sectors-ratio', () =>
    s.play(ratio80.to(1, { duration: remainAfterDuration(c, 'gpu-edge-sectors-ratio', 0.4) })),
  );
  c.on('gpu-edge-sectors-one', () =>
    s.play(oneLane.to(1, { duration: remainDuration(c, 'gpu-edge-sectors-one', 0.45) })),
  );
  c.after('gpu-edge-sectors-edge', () =>
    s.play(ratioEdge.to(1, { duration: remainAfterDuration(c, 'gpu-edge-sectors-edge', 0.4) })),
  );

  c.onBeat(2, () =>
    s.play(
      par(showRuler.to(0, { duration: 0.18 }), delay(showScatter.to(1, { duration: 0.24 }), 0.22)),
    ),
  );
  c.on('gpu-edge-sectors-stride', () =>
    s.play(strideShow.to(1, { duration: remainDuration(c, 'gpu-edge-sectors-stride', 0.4) })),
  );
  c.on('gpu-edge-sectors-scatter', () =>
    s.play(scatterProg.to(1, { duration: remainDuration(c, 'gpu-edge-sectors-scatter', 0.85) })),
  );
  c.after('gpu-edge-sectors-fraction', () =>
    s.play(fracShow.to(1, { duration: remainAfterDuration(c, 'gpu-edge-sectors-fraction', 0.45) })),
  );
  c.on('gpu-edge-sectors-scope', () =>
    s.play(scopeShow.to(1, { duration: remainDuration(c, 'gpu-edge-sectors-scope', 0.45) })),
  );
}
