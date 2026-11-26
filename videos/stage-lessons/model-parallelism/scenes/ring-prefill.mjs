// Scene 19: Bring the keys and values to the query (Ring Attention prefill). Q0 stays put as KV0->KV3->KV2->KV1 orbit, then overlap timeline (prompt 3 vs 2 hides transfer; decode 1 vs 2 waits 1 tick - strict hold!).
import {
  COSMOS,
  ROLE,
  aura,
  buildCluster3d,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  swapViews,
  txt,
} from '../parts.mjs';

export default function ringPrefill(s, c) {
  const phase = s.value(0);
  const showRing = s.value(1);
  const showOverlap = s.value(0);

  const p0 = s.value(0);
  const pLocal = s.value(0);
  const pShift = s.value(0);
  const pB1 = s.value(0);
  const pVisits = s.value(0);
  const pMerge = s.value(0);
  const pOver = s.value(0);
  const pDec = s.value(0);
  const pWait = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61c', '#ffd16614');
  const { view: ring3d } = buildCluster3d(() => 0.58, phase, {
    x: 525,
    y: 40,
    unit: 86,
    gpus: 4,
    radius: 1.85,
    ringColor: ROLE.gpu1,
  });

  const title = heroTitle(['Bring Keys and Values', 'to the Query'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.gpu1,
    eyebrow: 'RING ATTENTION PREFILL · DOUBLE-BUFFERED OVERLAP',
  });

  const kvCols = [ROLE.gpu0, ROLE.gpu1, ROLE.expert, COSMOS.gold];
  const kvFills = ['#11284a', '#0e2d3b', '#22163c', '#2b220f'];

  const ringView = guardedDynamic(showRing, (a) => {
    const turns = pShift.value + 2 * pVisits.value;
    const whole = Math.min(3, Math.floor(turns));
    const frac = turns - whole;
    const mg = pMerge.value > 0.5;

    const nodes = [
      txt('3D RING KV ORBIT', 525, -395, 26, ROLE.gpu1, 'mono').glow(5, ROLE.gpu1).opacity(a),
      txt('C-1 neighbor hops per query', 525, 420, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        pLocal.value > 0.3
          ? 'QUERY 0 PINNED ON GPU 0 · KV BLOCKS ROTATE CLOCKWISE'
          : '4 PROMPT BLOCKS ACROSS 4 GPUS',
        -350,
        -205,
        26,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    // 4 stationary GPU query cards on left 2/3
    for (let r = 0; r < 4; r++) {
      const cx = -720 + r * 246;
      const isQ0 = r === 0 && (pLocal.value > 0.2 || p0.value > 0.2);
      nodes.push(
        glassCell(cx, -80, 214, 128, isQ0 ? COSMOS.gold : '#33466d', {
          fill: isQ0 ? '#1f1c0e' : '#0d1528',
          glow: isQ0 ? 9 : 3,
          opacity: a,
        }),
        txt(`GPU ${r}`, cx, -112, 26, COSMOS.muted, 'mono').opacity(a),
        txt(`Query ${r}`, cx, -58, 30, isQ0 ? COSMOS.gold : COSMOS.ink, 'mono').opacity(a),
      );
    }

    // 4 circulating KV tiles below
    for (let id = 0; id < 4; id++) {
      const src = (id + whole) % 4;
      let kx = -720 + src * 246;
      let ky = 72;
      if (src < 3) {
        kx += 246 * frac;
      } else if (frac < 0.25) {
        ky += 96 * (frac / 0.25);
      } else if (frac < 0.75) {
        kx -= 738 * ((frac - 0.25) / 0.5);
        ky = 168;
      } else {
        kx = -720;
        ky = 168 - 96 * ((frac - 0.75) / 0.25);
      }
      nodes.push(
        rect(172, 68, { fill: kvFills[id], stroke: kvCols[id], width: 2.6, radius: 10 })
          .at(kx, ky)
          .glow(8, kvCols[id])
          .opacity(a),
        txt(`KV ${id}`, kx, ky, 30, kvCols[id], 'mono').opacity(a),
      );
    }

    // Blocks seen by Q0 ledger
    nodes.push(txt('SEEN BY Q0:', -830, 272, 26, COSMOS.ink, 'mono', 'left').opacity(a));
    for (let v = 0; v <= whole; v++) {
      const blk = (4 - v) % 4;
      const vx = -545 + v * 176;
      nodes.push(
        rect(144, 58, { fill: kvFills[blk], stroke: kvCols[blk], width: 2.2, radius: 8 })
          .at(vx, 272)
          .opacity(a),
        txt(`KV ${blk}`, vx, 272, 26, kvCols[blk], 'mono').opacity(a),
      );
    }

    nodes.push(
      txt(
        mg
          ? 'Online softmax merges all 4 blocks · causal masks can skip future blocks (creating imbalance)'
          : pB1.value > 0.3
            ? 'After 3 neighbor hops (C - 1), every query has seen every KV block'
            : 'Double buffering receives the next KV block while local attention runs',
        -350,
        355,
        26,
        mg ? ROLE.good : COSMOS.muted,
        'sans',
      ).opacity(a),
      glowDot(-820 + ((phase.value * 0.55) % 1) * 960, 415, {
        radius: 6,
        color: ROLE.gpu1,
        opacity: a,
      }),
    );
    return group(...nodes);
  });

  const overlapView = guardedDynamic(showOverlap, (a) => {
    const ov = pOver.value;
    const dc = pDec.value;
    const wt = pWait.value > 0.5;

    const x0 = -340;
    const tickW = 350;
    const transfer = 2;
    const prompt = 3;
    const decode = 1;

    const nodes = [
      txt(
        'DOUBLE-BUFFERED OVERLAP: PROMPT (3 TICKS) vs DECODE (1 TICK)',
        0,
        -210,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    ];

    for (let t = 0; t <= 3; t++) {
      const tx = x0 + t * tickW;
      nodes.push(
        txt(`t = ${t}`, tx, -155, 28, COSMOS.muted, 'mono').opacity(a),
        line([tx, -130], [tx, -112], { stroke: COSMOS.muted, width: 2.5 }).opacity(a),
      );
    }

    const drawLane = (topY, label, compTicks, prog) => {
      const elapsed = Math.max(compTicks, transfer) * prog;
      nodes.push(txt(label, -815, topY + 26, 30, COSMOS.ink, 'mono', 'left').opacity(a));

      // Attention compute bar
      const cw = Math.min(elapsed, compTicks) * tickW;
      nodes.push(txt('Attention', x0 - 44, topY, 26, ROLE.gpu0, 'mono', 'right').opacity(a));
      if (cw > 4) {
        nodes.push(
          rect(cw, 54, { fill: '#122c52', stroke: ROLE.gpu0, width: 2.4, radius: 8 })
            .at(x0 + cw * 0.5, topY)
            .glow(7, ROLE.gpu0)
            .opacity(a),
        );
        if (cw > 180) {
          nodes.push(
            txt(
              `${compTicks} tick${compTicks > 1 ? 's' : ''}`,
              x0 + cw * 0.5,
              topY,
              26,
              COSMOS.ink,
              'mono',
            ).opacity(a),
          );
        }
      }

      // Transfer bar
      const tw = Math.min(elapsed, transfer) * tickW;
      nodes.push(txt('Recv KV', x0 - 44, topY + 72, 26, ROLE.gpu1, 'mono', 'right').opacity(a));
      if (tw > 4) {
        nodes.push(
          rect(tw, 54, { fill: '#0e3240', stroke: ROLE.gpu1, width: 2.4, radius: 8 })
            .at(x0 + tw * 0.5, topY + 72)
            .glow(7, ROLE.gpu1)
            .opacity(a),
        );
        if (tw > 290) {
          nodes.push(
            txt('2 ticks transfer', x0 + tw * 0.5, topY + 72, 26, COSMOS.ink, 'mono').opacity(a),
          );
        }
      }
    };

    drawLane(-55, 'Prompt block', prompt, Math.max(0.15, ov));
    if (dc > 0.02) {
      drawLane(140, 'Decode query', decode, dc);
      if (wt) {
        const sw = (transfer - decode) * tickW;
        nodes.push(
          rect(sw, 54, { fill: '#351324', stroke: ROLE.bad, width: 2.8, radius: 8 })
            .at(x0 + decode * tickW + sw * 0.5, 140)
            .glow(10, ROLE.bad)
            .opacity(a),
          txt('WAIT 1 TICK', x0 + decode * tickW + sw * 0.5, 140, 28, ROLE.bad, 'mono').opacity(a),
        );
      }
    }

    const foot = wt
      ? 'Decode finishes in 1 tick and waits 1 full tick for the 2-tick KV transfer'
      : dc > 0.4
        ? 'Predict: how long does a 1-tick decode query wait for a 2-tick KV transfer?'
        : '3 ticks of prompt compute completely hide the 2-tick KV transfer';

    nodes.push(
      glassCell(0, 325, 1420, 82, wt ? ROLE.bad : dc > 0.4 ? COSMOS.gold : ROLE.good, {
        fill: '#10182b',
        glow: 8,
        opacity: a,
      }),
      txt(foot, 0, 325, 28, wt ? ROLE.bad : dc > 0.4 ? COSMOS.gold : ROLE.good, 'sans').opacity(a),
      glowDot(-740 + ((phase.value * 0.55) % 1) * 1480, 415, {
        radius: 6,
        color: wt ? ROLE.bad : ROLE.gpu1,
        opacity: a,
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, ring3d, title, ringView, overlapView);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, ring3d, { theta: -0.2, phi: 0.92 });

  c.on('mp-ring-prefill-0', () =>
    s.play(p0.to(1, { duration: remainDuration(c, 'mp-ring-prefill-0', 0.35) })),
  );
  c.on('mp-ring-prefill-local', () =>
    s.play(pLocal.to(1, { duration: remainDuration(c, 'mp-ring-prefill-local', 0.4) })),
  );
  c.on('mp-ring-prefill-shift', () =>
    s.play(pShift.to(1, { duration: remainDuration(c, 'mp-ring-prefill-shift', 0.95) })),
  );
  c.on('mp-ring-prefill-1', () =>
    s.play(pB1.to(1, { duration: remainDuration(c, 'mp-ring-prefill-1', 0.35) })),
  );
  c.on('mp-ring-prefill-visits', () =>
    s.play(pVisits.to(1, { duration: remainDuration(c, 'mp-ring-prefill-visits', 1.4) })),
  );
  c.on('mp-ring-prefill-merge', () =>
    s.play(pMerge.to(1, { duration: remainDuration(c, 'mp-ring-prefill-merge', 0.45) })),
  );
  c.hide('mp-ring-prefill-2', [ring3d], { fade: 0.16 });
  c.on('mp-ring-prefill-2', () => {
    const d = Math.min(0.16, remainDuration(c, 'mp-ring-prefill-2', 0.16));
    swapViews(s, showRing, showOverlap, d, d);
  });
  c.on('mp-ring-prefill-overlap', () =>
    s.play(pOver.to(1, { duration: remainDuration(c, 'mp-ring-prefill-overlap', 0.75) })),
  );
  c.on('mp-ring-prefill-decode', () =>
    s.play(pDec.to(1, { duration: remainDuration(c, 'mp-ring-prefill-decode', 0.65) })),
  );
  c.after('mp-ring-prefill-wait', () =>
    s.play(pWait.to(1, { duration: remainAfterDuration(c, 'mp-ring-prefill-wait', 0.4) })),
  );
}
