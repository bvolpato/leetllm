// Scene 20: authorized-funnel: "Who gets the single shortlist slot?"
// Luminous 3-lane optical candidate funnel: post-filter K=1 starvation (Private grabs slot & gets
// vaporized -> empty!), K=2 recovery, and native pre-filter sliding the gold permission laser gate
// ahead of shortlist selection so Rotation wins at K=1.
import { dynamic, group, line, seq } from 'vizmatic/stage';
import {
  AUTH,
  COSMOS,
  ROLE,
  authorizedSearch,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function authorizedFunnel(s, c) {
  const ordered = authorizedSearch(3).rows;
  const bits = (v) => v.map((x) => Number(x > 0)).join('');
  const qBits = bits(AUTH.query); // "1010"

  const showTie = s.value(0);
  const gatePos = s.value(2); // column index: 2 (post-filter) -> 1 (native pre-filter)
  const privCol = s.value(0); // 0 -> 1 (shortlist) -> 2 (permission gate)
  const privAlive = s.value(1);
  const privRejected = s.value(0);
  const rotCol = s.value(0); // 0 -> 1 -> 2 -> 3 (originals)
  const slotRing = s.value(0);
  // Footer mode: 0=unfiltered K=1, 1=ask, 2=empty, 3=widen K=2, 4=K=2 survives, 5=native K=1, 6=K=1 prefilter Rotation
  const footMode = s.value(0);

  const title = heroTitle(['Who gets the single', 'shortlist slot?'], {
    x: -855,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.gold,
    eyebrow: 'AUTHORIZATION & POST-FILTER STARVATION',
  });

  const colXs = [-500, -70, 325, 725];
  const rowYs = [-135, 35, 205];
  const laneCols = [ROLE.danger, ROLE.A, ROLE.B];
  const laneStatus = ['denied', 'allowed', 'allowed'];

  const funnelLayer = dynamic(() => {
    const gp = gatePos.value; // 2 -> 1
    const gateX = colXs[1] + (gp - 1) * (colXs[2] - colXs[1]);
    const isPre = gp < 1.5;
    const fm = Math.round(footMode.value);

    const colAt = (cVal) => {
      const clamped = Math.max(0, Math.min(3, cVal));
      const i0 = Math.floor(clamped);
      const i1 = Math.min(3, i0 + 1);
      return colXs[i0] + (colXs[i1] - colXs[i0]) * (clamped - i0);
    };

    const nodes = [
      txt(`QUERY SIGNS  ${qBits}`, 855, -395, 30, ROLE.query, 'mono', 'right').glow(6, ROLE.query),
      // Stage column headers
      txt('POOL', colXs[0], -248, 28, COSMOS.muted, 'mono'),
      txt(
        isPre ? 'PERMISSION' : 'SHORTLIST',
        colXs[1],
        -248,
        28,
        isPre ? ROLE.gold : ROLE.code,
        'mono',
      ),
      txt(
        isPre ? 'SHORTLIST' : 'PERMISSION',
        colXs[2],
        -248,
        28,
        isPre ? ROLE.code : ROLE.gold,
        'mono',
      ),
      txt('ORIGINALS', colXs[3], -248, 28, ROLE.query, 'mono'),
    ];

    // Optical conduit rails & lane labels
    ordered.forEach((row, i) => {
      const ry = rowYs[i];
      const col = laneCols[i];
      const cutLastRail = i === 0 && privRejected.value > 0.01 && !isPre;
      nodes.push(
        line([colXs[0], ry], [cutLastRail ? colXs[2] : colXs[3], ry], {
          stroke: '#2c3d63',
          width: 3.5,
        }),
        txt(row.id, -845, ry - 16, 34, col, 'serif', 'left').glow(5, col),
        txt(laneStatus[i], -845, ry + 26, 26, col, 'mono', 'left'),
      );
      if (showTie.value > 0.02) {
        nodes.push(
          txt(
            `${bits(row.vector)}  H=${row.hamming}`,
            -635,
            ry + 48,
            26,
            row.hamming === 0 ? ROLE.gold : COSMOS.dim,
            'mono',
            'left',
          ).opacity(showTie.value),
        );
      }
    });

    // Moving glowing gold permission laser barrier
    nodes.push(
      line([gateX, -210], [gateX, 275], { stroke: ROLE.gold, width: 5.5 }).glow(12, ROLE.gold),
      txt('ACCESS GATE', gateX, 308, 26, ROLE.gold, 'mono').glow(6, ROLE.gold),
    );

    // Shortlist slot ring (at colXs[1] when post-filter, colXs[2] when pre-filter)
    if (slotRing.value > 0.02 && privAlive.value > 0.2) {
      nodes.push(
        lumBar(colXs[1], rowYs[0], 96, 96, {
          color: ROLE.gold,
          fillAlpha: 0.14,
          strokeWidth: 3.2,
          glow: 9,
          opacity: slotRing.value * privAlive.value,
        }),
      );
    }

    // Candidate 0: Private (denied)
    if (privAlive.value > 0.02) {
      const px = colAt(privCol.value);
      nodes.push(
        glowRing(px, rowYs[0], 20, ROLE.danger, {
          width: 3.5,
          glow: 11,
          opacity: privAlive.value,
        }),
        glowDot(px, rowYs[0], {
          radius: 9,
          color: ROLE.danger,
          glow: 12,
          opacity: privAlive.value,
        }),
      );
    }
    if (privRejected.value > 0.02 && !isPre) {
      nodes.push(
        txt('REJECTED', colXs[2] + 34, rowYs[0] - 42, 30, ROLE.danger, 'mono', 'left')
          .glow(8, ROLE.danger)
          .opacity(privRejected.value),
      );
    }

    // Candidate 1: Rotation (allowed)
    const rx = colAt(rotCol.value);
    nodes.push(
      glowRing(rx, rowYs[1], 20, ROLE.A, { width: 3.5, glow: 11 }),
      glowDot(rx, rowYs[1], { radius: 9, color: ROLE.A, glow: 12 }),
    );

    // Candidate 2: Lifecycle (allowed, stays in pool because H=2)
    nodes.push(
      glowRing(colXs[0], rowYs[2], 18, ROLE.B, { width: 3, glow: 7 }),
      glowDot(colXs[0], rowYs[2], { radius: 8, color: ROLE.B, glow: 9 }),
    );

    // Retained full-precision shelf caption on right
    nodes.push(txt('retained FP32 vectors', colXs[3], 308, 26, COSMOS.muted, 'sans'));

    // Sequential bottom verdict / prompt (strictly one visible at a time -> zero overlap!)
    const footTexts = [
      { text: 'Unfiltered shortlist  K = 1   (ties break in storage order)', col: COSMOS.muted },
      { text: 'Who can we fetch from this one unfiltered slot?', col: ROLE.gold },
      { text: 'K = 1 post-filter:  EMPTY  (no eligible evidence left)', col: ROLE.danger },
      { text: 'Widen unfiltered shortlist to K = 2', col: ROLE.code },
      { text: 'K = 2 post-filter:  Rotation survives to FP32 rescore', col: ROLE.A },
      { text: 'Filter during search (native pre-filter)  ·  K = 1', col: ROLE.gold },
      {
        text: 'K = 1 + pre-filter:  Rotation takes first place (recheck access on fetch)',
        col: ROLE.A,
      },
    ];
    const ft = footTexts[Math.max(0, Math.min(footTexts.length - 1, fm))];
    nodes.push(
      txt(ft.text, -845, 405, 34, ft.col, fm === 1 ? 'serif' : 'mono', 'left').glow(
        fm === 1 || fm === 2 || fm === 4 || fm === 6 ? 8 : 0,
        ft.col,
      ),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.A), title, funnelLayer);

  playCue(s, c, 'tie', (d) => s.play(showTie.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'ask', (d) => s.play(footMode.to(1, { duration: 0.05 })), { dur: 0.1 });

  playCue(s, c, 'select', (d) => s.play(privCol.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'select', (d) => s.play(slotRing.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });

  playCue(s, c, 'denied', (d) => s.play(privCol.to(2, { duration: d })), { dur: 1.0 });
  playCue(
    s,
    c,
    'denied',
    (d) => s.play(privAlive.to(0, { duration: d }), privRejected.to(1, { duration: d })),
    { after: true, dur: 0.4 },
  );
  playCue(s, c, 'empty', () => s.play(footMode.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  playCue(
    s,
    c,
    'widen',
    (d) => s.play(footMode.to(3, { duration: 0.05 }), rotCol.to(1, { duration: d })),
    { dur: 0.9 },
  );
  playCue(s, c, 'survive', (d) => s.play(rotCol.to(2, { duration: d })), { dur: 0.9 });
  playCue(s, c, 'survive', () => s.play(footMode.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'rescore', (d) => s.play(rotCol.to(3, { duration: d })), { dur: 1.2 });

  playCue(
    s,
    c,
    'native',
    (d) =>
      s.play(
        footMode.to(5, { duration: 0.05 }),
        privRejected.to(0, { duration: 0.25 }),
        seq(
          gatePos.to(1, { duration: Math.min(0.85, d * 0.4) }),
          rotCol.to(0, { duration: 0.12 }),
          rotCol.to(1, { duration: Math.min(0.75, d * 0.25) }),
          rotCol.to(2, { duration: Math.min(0.75, d * 0.25) }),
        ),
      ),
    { dur: 2.6 },
  );
  playCue(s, c, 'kept', () => s.play(footMode.to(6, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'access', (d) => s.play(rotCol.to(3, { duration: d })), { dur: 1.2 });
}
