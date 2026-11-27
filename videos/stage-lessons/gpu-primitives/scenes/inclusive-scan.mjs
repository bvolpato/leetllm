// Scene 09: Which plays has this register counted? Hillis-Steele 4-lane stride cascade with 4-bit coverage pip bars.
import {
  COSMOS,
  SCAN,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  number,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function inclusiveScan(s, c) {
  const showMarks = s.value(0);
  const stride1 = s.value(0);
  const askMissing = s.value(0);
  const revealPeer = s.value(0);
  const stride2 = s.value(0);
  const revealSeven = s.value(0);
  const revealSix = s.value(0);

  const bgAura = aura(120, 20, 620, '#60a5fa20', '#ffd16618');
  const title = heroTitle(['Hillis-Steele', 'Inclusive Scan'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'STEP-EFFICIENT · DOUBLING STRIDES 1 → 2',
  });

  const laneX = (lane) => -330 + lane * 360;
  const roundY = (round) => -165 + round * 215;

  const live = guardedDynamic(1, () => {
    const mk = showMarks.value;
    const s1 = stride1.value;
    const ask = askMissing.value;
    const peer = revealPeer.value;
    const s2 = stride2.value;
    const sev = revealSeven.value;
    const six = revealSix.value;

    const nodes = [
      // Lane column headers
      ...[0, 1, 2, 3].map((lane) =>
        txt(`LANE ${lane}`, laneX(lane), -268, 26, COSMOS.muted, 'mono'),
      ),
    ];

    const rowLabels = ['INPUT', 'STRIDE 1', 'STRIDE 2'];
    const rowShown = [1, s1, s2];

    for (let r = 0; r < 3; r++) {
      const a = rowShown[r];
      if (a < 0.02) continue;
      const y = roundY(r);
      const span = 2 ** r;

      nodes.push(txt(rowLabels[r], -840, y, 28, COSMOS.cyan, 'mono', 'left').opacity(a));

      for (let lane = 0; lane < 4; lane++) {
        const cx = laneX(lane);
        const ready =
          r === 0 || (r === 1 ? s1 > 0.5 : lane < 2 ? true : lane === 2 ? six > 0.5 : sev > 0.5);
        const isPeerHighlight = r === 1 && lane === 1 && peer > 0.5;
        const isTargetL3 = (r === 1 && lane === 3 && ask > 0.5) || (r === 2 && lane === 3);
        const col = isPeerHighlight
          ? COSMOS.gold
          : isTargetL3
            ? COSMOS.gold
            : r === 2 && ready
              ? COSMOS.emerald
              : r === 1
                ? COSMOS.cyan
                : COSMOS.blue;

        nodes.push(
          glassCell(cx, y, 250, 114, col, {
            fill:
              isPeerHighlight || isTargetL3 ? '#241c10' : r === 2 && ready ? '#0d2624' : '#101a30',
            glow: isPeerHighlight || isTargetL3 ? 11 : 6,
            opacity: a,
          }),
          txt(ready ? number(SCAN.levels[r][lane]) : '?', cx, y - 14, 48, col, 'mono')
            .glow(isPeerHighlight || isTargetL3 ? 8 : 0, col)
            .opacity(a),
        );

        // 4 coverage pips showing which original plays [0..3] this register has counted
        if (mk > 0.02 || r > 0) {
          const pipA = r === 0 ? mk : a;
          for (let bit = 0; bit < 4; bit++) {
            const covered = ready && bit <= lane && bit > lane - span;
            const px = cx - 72 + bit * 48;
            nodes.push(
              rect(36, 12, {
                fill: covered ? col : '#25304d',
                stroke: null,
                radius: 3,
              })
                .at(px, y + 36)
                .glow(covered ? 6 : 0, col)
                .opacity(pipA),
            );
          }
        }
      }
    }

    // Stride 1 glowing arrows (left neighbor -> lane)
    if (s1 > 0.02) {
      for (let lane = 1; lane < 4; lane++) {
        const p0 = [laneX(lane - 1), roundY(0) + 64];
        const p1 = [laneX(lane), roundY(1) - 64];
        nodes.push(
          glowingArc(p0, p1, 0, {
            color: lane === 3 ? COSMOS.gold : COSMOS.cyan,
            width: lane === 3 ? 4.2 : 2.8,
            opacity: (lane === 3 ? 0.95 : 0.55) * s1,
            core: false,
          }),
        );
      }
    }

    // Stride 2 glowing arcs (reach back 2 lanes: 1->3 and 0->2)
    if (s2 > 0.02) {
      const pairs = [
        [1, 3, COSMOS.gold],
        [0, 2, COSMOS.emerald],
      ];
      for (const [src, dst, col] of pairs) {
        const p0 = [laneX(src), roundY(1) + 64];
        const p1 = [laneX(dst), roundY(2) - 64];
        nodes.push(
          glowingArc(p0, p1, 14, { color: col, width: 4.2, opacity: 0.92 * s2, core: false }),
        );
      }
    }

    // Bottom interactive teaching readout (prediction-safe!)
    const msgCol = six > 0.5 ? COSMOS.emerald : peer > 0.5 ? COSMOS.gold : COSMOS.cyan;
    const msg =
      six > 0.5
        ? 'All 4 inclusive prefixes [3, 2, 6, 7]  ·  3 + 2 = 5 additions in 2 parallel rounds'
        : sev > 0.5
          ? 'Lane 3 joins disjoint ranges: 2 + 5 = 7  ·  Lane 2 reaches back 2 lanes'
          : peer > 0.5
            ? 'Lane 1 holds 2 (plays 0 & 1)  ·  reach back 2 lanes: 2 + 5 = ?'
            : ask > 0.5
              ? 'Lane 3 holds 5 (plays 2 & 3)  ·  Which register holds the missing first two?'
              : s1 > 0.5
                ? 'Stride 1: each lane adds its left neighbor from the previous row'
                : 'Lit pips below each register track which plays it has counted';

    nodes.push(
      glassCell(0, 398, 1580, 82, msgCol, { fill: '#101829', glow: 9 }),
      txt(msg, 0, 398, 28, msgCol, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('scan-input', () => s.play(showMarks.to(1, { duration: 0.45 })));
  c.on('scan-first-stride', () => s.play(stride1.to(1, { duration: 0.55 })));
  c.on('scan-ask', () => s.play(askMissing.to(1, { duration: 0.35 })));
  c.after('scan-peer', () => s.play(revealPeer.to(1, { duration: 0.35 })));
  c.on('scan-second-stride', () => s.play(stride2.to(1, { duration: 0.5 })));
  c.after('scan-last-answer', () => s.play(revealSeven.to(1, { duration: 0.35 })));
  c.after('scan-third-answer', () =>
    s.play(revealSix.to(1, { duration: remainDuration(c, 'scan-third-answer', 0.4) })),
  );
}
