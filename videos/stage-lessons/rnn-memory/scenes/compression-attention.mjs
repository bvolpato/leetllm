// Scene 7: compression-attention: "What can the decoder read?"
// Stage 1: Fixed-width compression bottleneck & 4-bit pigeonhole collision (16 codes, 17th history).
// Stage 2: Serial recurrent relay chain (8 positions = 7 hops; 4,096 = 4,095 hops).
// Stage 3: 8x8 causal self-attention matrix, direct q8->k1 arc, O(T^2 d) vs O(Td^2) curves,
//          and Mamba parallel selective scan tree.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  EVENTS,
  ROLE,
  cinemaAtmosphere,
  glowArc,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  states,
  swapVis,
  tokenPill,
  txt,
  vecStr,
} from '../parts.mjs';

export default function compressionAttention(s, c) {
  const title = heroTitle(['What can the', 'decoder read?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.state,
  });

  // 4 clean mutually-exclusive views via swapVis (zero overlaps!)
  const vIntro = s.value(1);
  const vPigeon = s.value(0);
  const vSerial = s.value(0);
  const vAttn = s.value(0);

  // Stage 1 (Pigeonhole) state
  const occFill = s.value(0); // 0 -> 16
  const showH17 = s.value(0);
  const collideProg = s.value(0); // 0 = outside, 1 = landed on code 0101
  const showCollText = s.value(0);

  // Stage 2 (Serial relay) state
  const relayPos = s.value(0); // 0..7
  const show4096 = s.value(0);

  // Stage 3 (Attention + Complexity + Mamba scan) state
  const showDirect = s.value(0);
  const showPairs = s.value(0);
  const showCost = s.value(0);
  const showScan = s.value(0);

  // VIEW 0: Fixed-width summary funnel (3 events -> [0.390, 0.655] -> Decoder)
  const introView = guardedDynamic(vIntro, (alpha) => {
    const nodes = [
      txt('Fixed-Width Encoder Summary', 0, -245, 34, COSMOS.ink, 'serif', 'center').opacity(alpha),
    ];
    const evYs = [-120, 40, 200];
    const evCols = [ROLE.input, ROLE.grad, ROLE.cell];
    EVENTS.forEach((ev, i) => {
      nodes.push(
        tokenPill(ev, -590, evYs[i], evCols[i], { w: 230, h: 58, size: 30, opacity: alpha }),
        glowArc([-470, evYs[i]], [-135, 40], (i - 1) * -22, {
          color: evCols[i],
          width: 3.4,
          glow: 8,
          opacity: 0.85 * alpha,
        }),
      );
    });
    nodes.push(
      glowRing(0, 40, 126, ROLE.state, { width: 4, glow: 14, opacity: alpha }),
      txt('h₃', 0, 12, 38, ROLE.state, 'mono', 'center').opacity(alpha),
      txt(vecStr(states[3], 3), 0, 58, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      arrow([136, 40], [385, 40], { stroke: ROLE.gold, width: 4.5, tip: 16 }).opacity(alpha),
      glowRing(560, 40, 108, ROLE.gold, { width: 3.5, glow: 12, opacity: alpha }),
      txt('Decoder', 560, 40, 34, ROLE.gold, 'serif', 'center').opacity(alpha),
      txt(
        'Every earlier token passes through this fixed-size bottleneck',
        0,
        345,
        30,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 1: 4x4 grid of 16 4-bit codes + 17th history collision
  const pigeonView = guardedDynamic(vPigeon, (alpha) => {
    const nodes = [
      txt(
        '2 coordinates × 2 bits = 16 distinct 4-bit codes',
        310,
        -390,
        30,
        ROLE.state,
        'mono',
        'center',
      ).opacity(alpha),
    ];
    const startX = -650;
    const startY = -170;
    const dx = 215;
    const dy = 138;
    const targetIdx = 7; // code 0111 (rightmost column -> arc never crosses other codes)
    let targetPos = [0, 0];

    for (let i = 0; i < 16; i++) {
      const r = Math.floor(i / 4);
      const col = i % 4;
      const cx = startX + col * dx;
      const cy = startY + r * dy;
      const isColl = i === targetIdx && collideProg.value > 0.88;
      if (i === targetIdx) targetPos = [cx, cy];
      nodes.push(
        lumBar(cx, cy, 174, 92, {
          color: isColl ? ROLE.warn : ROLE.state,
          fillOpacity: isColl ? 0.36 : 0.16,
          strokeWidth: isColl ? 3.2 : 1.8,
          glow: isColl ? 12 : 5,
          opacity: alpha,
        }),
        txt(
          i.toString(2).padStart(4, '0'),
          cx,
          cy - 12,
          32,
          isColl ? ROLE.warn : ROLE.state,
          'mono',
          'center',
        ).opacity(alpha),
      );
      if (occFill.value > i + 0.05) {
        const dA = Math.min(1, occFill.value - i) * alpha;
        nodes.push(
          glowDot(cx - 24, cy + 24, { radius: 8, color: ROLE.input, glow: 10, opacity: dA }),
        );
      }
    }

    // Right side: Decoder + History 17 orb
    const h17Start = [545, 70];
    const h17End = [targetPos[0] + 24, targetPos[1] + 24];
    const p = collideProg.value;
    const curX = h17Start[0] + (h17End[0] - h17Start[0]) * p;
    const curY = h17Start[1] + (h17End[1] - h17Start[1]) * p - Math.sin(p * Math.PI) * 140;

    nodes.push(
      glowRing(545, -135, 92, ROLE.gold, { width: 3.2, glow: 10, opacity: alpha }),
      txt('Decoder', 545, -148, 30, ROLE.gold, 'serif', 'center').opacity(alpha),
      txt('1 code in', 545, -110, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    if (showH17.value > 0.02) {
      const hA = showH17.value * alpha;
      if (p < 0.05) {
        nodes.push(
          tokenPill('history 17', h17Start[0], h17Start[1], ROLE.gold, {
            w: 220,
            h: 62,
            size: 30,
            opacity: hA,
          }),
          txt(
            'Where can it go?',
            h17Start[0],
            h17Start[1] + 74,
            30,
            ROLE.gold,
            'serif',
            'center',
          ).opacity(hA),
        );
      } else {
        nodes.push(
          glowArc(h17Start, h17End, -140, {
            color: ROLE.gold,
            width: 3,
            glow: 8,
            opacity: 0.7 * alpha,
          }),
          glowDot(curX, curY, { radius: 10, color: ROLE.gold, glow: 14, opacity: alpha }),
        );
        if (p > 0.88) {
          nodes.push(
            glowRing(targetPos[0], targetPos[1], 68, ROLE.warn, {
              width: 3.2,
              glow: 12,
              fillOpacity: 0.06,
              opacity: alpha,
            }),
          );
        }
      }
    }

    if (showCollText.value > 0.02) {
      nodes.push(
        txt(
          'Two different histories map to the exact same 4-bit code (0111)',
          0,
          380,
          32,
          ROLE.warn,
          'sans',
          'center',
        ).opacity(showCollText.value * alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Serial recurrent relay chain (8 tokens = 7 hops; 4,096 = 4,095 hops)
  const serialView = guardedDynamic(vSerial, (alpha) => {
    const nodes = [
      txt(
        'Serial Time Chain: Each State Waits for the Previous Step',
        0,
        -245,
        34,
        COSMOS.ink,
        'serif',
        'center',
      ).opacity(alpha),
    ];
    const xs = Array.from({ length: 8 }, (_, i) => -735 + i * 210);
    const y = -85;
    xs.forEach((x, i) => {
      const reached = relayPos.value >= i - 0.1;
      nodes.push(
        glowRing(x, y, 42, reached ? ROLE.gold : ROLE.state, {
          width: reached ? 3.4 : 2.2,
          glow: reached ? 10 : 5,
          opacity: alpha,
        }),
        txt(String(i + 1), x, y, 30, reached ? ROLE.gold : ROLE.state, 'mono', 'center').opacity(
          alpha,
        ),
      );
      if (i < 7) {
        nodes.push(
          arrow([x + 48, y], [xs[i + 1] - 48, y], {
            stroke: relayPos.value > i + 0.5 ? ROLE.gold : ROLE.state,
            width: 3.6,
            tip: 12,
          }).opacity(alpha),
        );
      }
    });

    // Moving signal orb along the relay
    const rp = Math.max(0, Math.min(7, relayPos.value));
    const i0 = Math.floor(rp);
    const i1 = Math.min(7, i0 + 1);
    const px = xs[i0] + (xs[i1] - xs[i0]) * (rp - i0);
    nodes.push(
      glowDot(px, y + 66, { radius: 10, color: ROLE.gold, glow: 14, opacity: alpha }),
      txt(`hop ${Math.round(rp)} of 7`, px, y + 108, 28, ROLE.gold, 'mono', 'center').opacity(
        alpha,
      ),
    );

    // 8-position baseline visible immediately (zero empty space), 4,096 reveals at serial-relay
    const barLeft = -760;
    nodes.push(
      txt(
        '8 positions  ->  7 serial handoffs',
        barLeft,
        128,
        28,
        ROLE.state,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barLeft + 26, 174, 52, 24, {
        color: ROLE.state,
        fillOpacity: 0.42,
        glow: 6,
        opacity: alpha,
      }),
      line([barLeft, 174], [760, 174], { stroke: '#4e6396', width: 2.2, dash: [8, 8] }).opacity(
        0.75 * alpha,
      ),
      txt(
        'Input projections parallelize, but each nonlinear hidden update waits in line',
        0,
        370,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    if (show4096.value > 0.02) {
      const sA = show4096.value * alpha;
      const longW = Math.max(16, 1520 * show4096.value);
      nodes.push(
        txt(
          '4,096 positions  ->  4,095 serial handoffs',
          barLeft,
          234,
          30,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(sA),
        lumBar(barLeft + longW / 2, 282, longW, 28, {
          color: ROLE.warn,
          fillOpacity: 0.42,
          glow: 10,
          opacity: sA,
        }),
      );
    }

    return nodes;
  });

  // VIEW 3: 8x8 Causal Self-Attention Matrix + Direct q8->k1 Hop + Complexity + Mamba Scan
  const attnView = guardedDynamic(vAttn, (alpha) => {
    const nodes = [];

    // Left: 8x8 Causal attention grid
    const gridX = -710;
    const gridY = -205;
    const cell = 64;
    const gap = 6;
    nodes.push(
      txt(
        'Keys (1 to 8)',
        gridX + 4 * (cell + gap) - 24,
        gridY - 56,
        28,
        ROLE.state,
        'mono',
        'center',
      ).opacity(alpha),
    );
    for (let j = 0; j < 8; j++) {
      nodes.push(
        txt(
          String(j + 1),
          gridX + j * (cell + gap) + cell / 2,
          gridY - 20,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }
    for (let r = 0; r < 8; r++) {
      const cy = gridY + r * (cell + gap) + cell / 2;
      nodes.push(
        txt(`q${r + 1}`, gridX - 30, cy, 26, COSMOS.muted, 'mono', 'right').opacity(alpha),
      );
      for (let k = 0; k < 8; k++) {
        const cx = gridX + k * (cell + gap) + cell / 2;
        const allowed = k <= r;
        const isDirect = r === 7 && k === 0 && showDirect.value > 0.5;
        nodes.push(
          lumBar(cx, cy, cell, cell, {
            color: isDirect ? ROLE.gold : allowed ? ROLE.state : COSMOS.dim,
            fillOpacity: isDirect ? 0.52 : allowed ? 0.28 : 0.06,
            strokeWidth: isDirect ? 3.2 : 1.4,
            glow: isDirect ? 12 : allowed ? 4 : 0,
            radius: 6,
            opacity: (allowed ? 1 : 0.35) * alpha,
          }),
        );
      }
    }

    // Direct q8 -> k1 photon marker
    if (showDirect.value > 0.02) {
      const dA = showDirect.value * alpha;
      const cx = gridX + cell / 2;
      const cy = gridY + 7 * (cell + gap) + cell / 2;
      nodes.push(
        glowDot(cx, cy, { radius: 10, color: ROLE.gold, glow: 14, opacity: dA }),
        glowRing(cx, cy, 22, ROLE.gold, { width: 3, glow: 10, opacity: dA }),
      );
    }

    // Right side: Formula + direct hop / Mamba scan / complexity curves
    const rx = 380;
    nodes.push(
      glowTex('\\operatorname{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d_k}} + M\\right)V', {
        x: rx,
        y: -245,
        size: 40,
        color: ROLE.state,
        glow: 7,
      }).opacity(alpha),
      txt(
        'Row i reads keys 1 through i in 1 layer',
        rx,
        -135,
        28,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
    );

    if (showDirect.value > 0.02 && showScan.value < 0.02) {
      nodes.push(
        txt('Query 8 reads key 1 directly: O(1) hop', rx, -75, 30, ROLE.gold, 'mono', 'center')
          .glow(7, ROLE.gold)
          .opacity(showDirect.value * alpha),
      );
    }

    if (showPairs.value > 0.02) {
      nodes.push(
        txt(
          '1 + 2 + ... + 8 = 36 allowed pairs',
          rx,
          -10,
          30,
          ROLE.state,
          'mono',
          'center',
        ).opacity(showPairs.value * alpha),
      );
    }

    // Complexity curves (linear O(Td^2) vs quadratic O(T^2 d))
    if (showCost.value > 0.02 && showScan.value < 0.02) {
      const cA = showCost.value * alpha;
      const cx0 = 135;
      const cy0 = 285;
      const cw = 490;
      const ch = 185;
      const linPts = Array.from({ length: 18 }, (_, i) => {
        const u = i / 17;
        return [cx0 + u * cw, cy0 - u * ch * 0.42];
      });
      const quadPts = Array.from({ length: 18 }, (_, i) => {
        const u = i / 17;
        return [cx0 + u * cw, cy0 - u * u * ch];
      });
      nodes.push(
        line([cx0, cy0], [cx0 + cw + 12, cy0], { stroke: '#556894', width: 2.2 }).opacity(cA),
        line([cx0, cy0], [cx0, cy0 - ch - 12], { stroke: '#556894', width: 2.2 }).opacity(cA),
        glowingTrail(linPts, { color: ROLE.cell, width: 4, glow: 8, opacity: cA }),
        glowingTrail(quadPts, { color: ROLE.warn, width: 4.5, glow: 10, opacity: cA }),
        txt(
          'Recurrence  O(T d²)',
          cx0 + cw + 18,
          cy0 - ch * 0.42,
          26,
          ROLE.cell,
          'mono',
          'left',
        ).opacity(cA),
        txt('Attention  O(T² d)', cx0 + cw + 18, cy0 - ch, 26, ROLE.warn, 'mono', 'left').opacity(
          cA,
        ),
        txt(
          'Sequence length T',
          cx0 + cw / 2,
          cy0 + 36,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(cA),
      );
    }

    // Mamba Parallel Selective Scan binary reduction tree
    if (showScan.value > 0.02) {
      const scA = showScan.value * alpha;
      nodes.push(
        txt(
          'Mamba Parallel Selective Scan (constant state)',
          rx,
          75,
          30,
          ROLE.cell,
          'mono',
          'center',
        )
          .glow(7, ROLE.cell)
          .opacity(scA),
      );
      const leaves = [-240, -160, -80, 0, 80, 160, 240, 320].map((dx) => rx - 40 + dx);
      const yL0 = 285;
      const yL1 = 215;
      const yL2 = 145;
      leaves.forEach((lx) => {
        nodes.push(glowDot(lx, yL0, { radius: 7, color: ROLE.input, glow: 8, opacity: scA }));
      });
      for (let i = 0; i < 4; i++) {
        const mx = (leaves[2 * i] + leaves[2 * i + 1]) / 2;
        nodes.push(
          line([leaves[2 * i], yL0], [mx, yL1], { stroke: ROLE.cell, width: 2.6 }).opacity(scA),
          line([leaves[2 * i + 1], yL0], [mx, yL1], { stroke: ROLE.cell, width: 2.6 }).opacity(scA),
          glowDot(mx, yL1, { radius: 7.5, color: ROLE.cell, glow: 10, opacity: scA }),
        );
      }
      for (let i = 0; i < 2; i++) {
        const ax = (leaves[4 * i] + leaves[4 * i + 1]) / 2;
        const bx = (leaves[4 * i + 2] + leaves[4 * i + 3]) / 2;
        const mx = (ax + bx) / 2;
        nodes.push(
          line([ax, yL1], [mx, yL2], { stroke: ROLE.gold, width: 3 }).opacity(scA),
          line([bx, yL1], [mx, yL2], { stroke: ROLE.gold, width: 3 }).opacity(scA),
          glowDot(mx, yL2, { radius: 8.5, color: ROLE.gold, glow: 12, opacity: scA }),
        );
      }
      nodes.push(
        txt(
          'Segments combine in parallel during training',
          rx,
          340,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(scA),
      );
    }

    return nodes;
  });

  s.add(
    cinemaAtmosphere(ROLE.state, ROLE.gold),
    title,
    introView,
    pigeonView,
    serialView,
    attnView,
  );

  playCue(s, c, 'quantize-context', (d) => s.play(swapVis(vIntro, vPigeon, d)), { dur: 0.65 });
  playCue(s, c, 'codes-occupied', (d) => s.play(occFill.to(16, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'compression-question', (d) => s.play(showH17.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'compression-collision', (d) => s.play(collideProg.to(1, { duration: d })), {
    dur: 0.85,
  });
  playCue(s, c, 'collision-result', (d) => s.play(showCollText.to(1, { duration: d })), {
    dur: 0.45,
  });

  playCue(s, c, 'compression-attention-1', (d) => s.play(swapVis(vPigeon, vSerial, d)), {
    dur: 0.65,
  });
  playCue(s, c, 'trace-relays', (d) => s.play(relayPos.to(7, { duration: d })), { dur: 1.8 });
  playCue(s, c, 'serial-relay', (d) => s.play(show4096.to(1, { duration: d })), { dur: 0.55 });

  playCue(s, c, 'attention-mask', (d) => s.play(swapVis(vSerial, vAttn, d)), { dur: 0.65 });
  playCue(s, c, 'attention-direct', (d) => s.play(showDirect.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'attention-pairs', (d) => s.play(showPairs.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'complexity-curves', (d) => s.play(showCost.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'scan-recurrence', (d) => s.play(showScan.to(1, { duration: d })), { dur: 0.55 });
}
