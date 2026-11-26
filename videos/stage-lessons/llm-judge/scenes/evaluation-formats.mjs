// Scene 3: evaluation-formats - How many judgments will this comparison take?
// 3-act living geometry:
//   Act 0: Glowing 0 / 1 / 2 ordinal calibration rail (N calls)
//   Act 1: 6-node hexagonal complete graph (15 pairs -> 30 swapped calls) collapsing to
//          5-ray baseline star (5 pairs -> 10 calls) + dynamic 2,000 -> 8,000 token flux +
//          A -> B -> C -> A cycle
//   Act 2: Reference-guided optical beacon linking candidate & policy source
import { circle, group, line } from 'vizmatic/stage';
import {
  BASELINE_CALLS,
  BASELINE_PAIRS,
  COSMOS,
  LONG_INPUT_TOKENS,
  PAIRWISE_CALLS,
  PAIRWISE_N,
  PAIRWISE_PAIRS,
  ROLE,
  SHORT_INPUT_TOKENS,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowMeter,
  glowTex,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function evaluationFormats(s, c) {
  const pulse = s.value(0);
  const ordLevel = s.value(0); // 0 -> 1 -> 2
  const ordWarn = s.value(0);
  const actMode = s.value(0); // 0 = pointwise, 1 = pairwise lattice, 2 = reference
  const pairStage = s.value(0); // 0=dots, 1=15 pairs, 2=30 calls, 3=baseline 5/10, 4=8k tokens, 5=cycle
  const refStage = s.value(0); // 0 -> 1 (ref), 2 (teacher boundary)

  const header = cinemaHeader('EVALUATION FORMATS', 'How many judgments', 'will it take?', {
    accent: ROLE.verdict,
    size: 50,
  });

  const stageAura = aura(260, 40, 620, '#ffd1661c', '#5ce1e61a');

  // Precompute 6 hexagonal nodes around (280, 10) radius 235
  const hexCx = 280;
  const hexCy = 10;
  const hexR = 235;
  const hexPts = Array.from({ length: PAIRWISE_N }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / PAIRWISE_N;
    return [hexCx + Math.cos(a) * hexR, hexCy + Math.sin(a) * hexR];
  });
  const hexNames = ['R0 (Base)', 'R1', 'R2', 'R3', 'R4', 'R5'];

  // MathJax pairwise formula shown cleanly during Act 1
  const pairFormula = glowTex(
    String.raw`\binom{6}{2} = 15\;\text{pairs}\;\Rightarrow\;30\;\text{calls}`,
    {
      x: -510,
      y: -90,
      size: 38,
      color: ROLE.verdict,
      glow: 7,
    },
  );

  // Act 0: Pointwise ordinal calibration rail
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, actMode.value)),
    (a) => {
      const lv = ordLevel.value;
      const w = ordWarn.value;
      const p = pulse.value;
      const nodes = [];

      const railY = 30;
      const x0 = -560;
      const x1 = 40;
      const x2 = 640;

      nodes.push(
        txt(
          'POINTWISE ORDINAL SCALE  (N CALLS FOR N ANSWERS)',
          -840,
          -165,
          26,
          ROLE.stepwise,
          'mono',
          'left',
        ).opacity(a),
        line([x0 + 30, railY], [x1 - 30, railY], { stroke: '#2d3f6b', width: 6 }).opacity(a),
        line([x1 + 30, railY], [x2 - 30, railY], { stroke: '#2d3f6b', width: 6 }).opacity(a),
      );

      // Active progress beam along the rail segments (never crossing rung circles!)
      const markerX = x0 + Math.min(2, lv) * ((x2 - x0) / 2);
      if (lv > 0.05) {
        const seg1End = Math.min(x1 - 30, x0 + 30 + Math.min(1, lv) * (x1 - x0 - 60));
        if (seg1End > x0 + 32) {
          nodes.push(
            line([x0 + 30, railY], [seg1End, railY], { stroke: ROLE.stepwise, width: 6 })
              .glow(10, ROLE.stepwise)
              .opacity(a),
          );
        }
      }
      if (lv > 1.05) {
        const seg2End = Math.min(x2 - 30, x1 + 30 + Math.min(1, lv - 1) * (x2 - x1 - 60));
        if (seg2End > x1 + 32) {
          nodes.push(
            line([x1 + 30, railY], [seg2End, railY], { stroke: ROLE.stepwise, width: 6 })
              .glow(10, ROLE.stepwise)
              .opacity(a),
          );
        }
      }

      const rungs = [
        { x: x0, n: '0', label: 'Action missing', col: ROLE.conflict, on: true },
        { x: x1, n: '1', label: 'Both, order unclear', col: ROLE.verdict, on: lv >= 0.8 },
        { x: x2, n: '2', label: 'Both + order clear', col: ROLE.ok, on: lv >= 1.8 },
      ];
      for (const r of rungs) {
        const ra = a * (r.on ? 1 : 0.32);
        nodes.push(
          circle(24, { fill: '#0c1224', stroke: r.col, width: 3.5 })
            .at(r.x, railY)
            .glow(r.on ? 10 : 0, r.col)
            .opacity(ra),
          txt(r.n, r.x, railY, 30, r.col, 'mono', 'center').opacity(ra),
          txt(
            r.label,
            r.x,
            railY + 78,
            28,
            r.on ? COSMOS.ink : COSMOS.dim,
            'sans',
            'center',
          ).opacity(ra),
        );
      }

      // Orbiting marker dot on current level
      nodes.push(
        glowDot(markerX, railY - 46 + Math.sin(p * Math.PI * 3) * 6, {
          radius: 7,
          color: ROLE.verdict,
          glow: 12,
          opacity: a,
        }),
      );

      if (w > 0.05) {
        nodes.push(
          txt(
            'ORDINAL LEVELS: ORDER ONLY, NOT EQUAL INTERVALS FOR AVERAGING',
            -840,
            275,
            26,
            ROLE.verdict,
            'mono',
            'left',
          )
            .glow(6, ROLE.verdict)
            .opacity(a * w),
        );
      }
      return group(...nodes);
    },
  );

  // Act 1: 6-node pairwise lattice -> 5-ray baseline star -> token budget & cycle
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, actMode.value)) * fadeOutHalf(Math.max(0, actMode.value - 1)),
    (a) => {
      const st = pairStage.value;
      const p = pulse.value;
      const nodes = [];

      const isBaseline = st >= 3;
      const isCycle = st >= 5;

      // Helper to trim edge endpoints outside node circles so no stroke ever crosses labels
      const trimSeg = (u, v, pad = 28) => {
        const dx = v[0] - u[0];
        const dy = v[1] - u[1];
        const len = Math.hypot(dx, dy) || 1;
        return [
          [u[0] + (dx / len) * pad, u[1] + (dy / len) * pad],
          [v[0] - (dx / len) * pad, v[1] - (dy / len) * pad],
        ];
      };

      // Edges of K_6 or baseline star
      for (let i = 0; i < PAIRWISE_N; i++) {
        for (let j = i + 1; j < PAIRWISE_N; j++) {
          const isBaseEdge = i === 0;
          if (st < 0.8) continue;
          const [pA, pB] = trimSeg(hexPts[i], hexPts[j], 30);
          if (isBaseline && !isBaseEdge) {
            // Faint ghost of pruned edges
            nodes.push(
              line(pA, pB, { stroke: '#233052', width: 1.4, dash: [4, 6] }).opacity(a * 0.28),
            );
            continue;
          }
          const col = isBaseline ? ROLE.ok : st >= 2 ? ROLE.verdict : ROLE.stepwise;
          nodes.push(
            line(pA, pB, { stroke: col, width: isBaseline ? 3.2 : 2.1 })
              .glow(isBaseline ? 8 : 4, col)
              .opacity(a * (isBaseline ? 0.92 : 0.68)),
          );
        }
      }

      // Traveling swap photons on active edges
      if (st >= 1.8 && !isCycle) {
        const edgePts = isBaseline
          ? [trimSeg(hexPts[0], hexPts[2], 30), trimSeg(hexPts[0], hexPts[4], 30)]
          : [trimSeg(hexPts[0], hexPts[3], 30), trimSeg(hexPts[1], hexPts[4], 30)];
        for (const [u, v] of edgePts) {
          nodes.push(
            beamWithPhotons([u, v], isBaseline ? ROLE.ok : ROLE.verdict, p * 1.2, {
              alpha: a,
              width: 3.4,
              photonCount: 2,
            }),
          );
        }
      }

      // Preference cycle A -> B -> C -> A on nodes 0, 1, 2
      if (isCycle) {
        const cyc = [
          trimSeg(hexPts[0], hexPts[1], 30),
          trimSeg(hexPts[1], hexPts[2], 30),
          trimSeg(hexPts[2], hexPts[0], 30),
        ];
        for (let k = 0; k < cyc.length; k++) {
          nodes.push(
            beamWithPhotons(cyc[k], ROLE.conflict, p * 1.4 + k * 0.33, {
              alpha: a,
              width: 4.0,
              photonCount: 1,
            }),
          );
        }
      }

      // 6 nodes
      hexPts.forEach(([x, y], i) => {
        const col = i === 0 && isBaseline ? ROLE.ok : ROLE.stepwise;
        nodes.push(
          circle(22, { fill: '#0b1226', stroke: col, width: 3.2 }).at(x, y).glow(8, col).opacity(a),
          txt(i === 0 ? 'B' : String(i), x, y, 26, col, 'mono', 'center').opacity(a),
        );
        const lx = hexCx + (x - hexCx) * 1.24;
        const ly = hexCy + (y - hexCy) * 1.22;
        if (i === 0) {
          nodes.push(txt(hexNames[0], lx, ly - 10, 26, col, 'mono', 'center').opacity(a));
        }
      });

      // Left-side dynamic readouts (zero boxes, generous vertical separation)
      if (st >= 1 && st < 3) {
        nodes.push(
          txt(
            `ALL PAIRS: ${PAIRWISE_PAIRS} UNORDERED`,
            -840,
            28,
            28,
            ROLE.stepwise,
            'mono',
            'left',
          ).opacity(a),
        );
      }
      if (st >= 2 && st < 3) {
        nodes.push(
          txt(
            `BOTH ORDERS: ${PAIRWISE_CALLS} CALLS / TASK`,
            -840,
            82,
            28,
            ROLE.verdict,
            'mono',
            'left',
          )
            .glow(6, ROLE.verdict)
            .opacity(a),
        );
      }
      if (st >= 3) {
        nodes.push(
          txt(
            `FIXED BASELINE: N - 1 = ${BASELINE_PAIRS} PAIRS`,
            -840,
            24,
            28,
            ROLE.ok,
            'mono',
            'left',
          )
            .glow(6, ROLE.ok)
            .opacity(a),
          txt(
            `SWAPPED CALLS: ${BASELINE_CALLS} CALLS / TASK`,
            -840,
            74,
            28,
            ROLE.ok,
            'mono',
            'left',
          ).opacity(a),
        );
      }
      if (st >= 4) {
        const frac = st >= 4.4 ? 1 : 0.25;
        nodes.push(
          txt('INPUT BUDGET (10 CALLS)', -840, 166, 26, COSMOS.muted, 'mono', 'left').opacity(a),
          glowMeter(-840, 214, 520, 26, frac, {
            fill: frac > 0.5 ? ROLE.verdict : ROLE.stepwise,
            opacity: a,
          }),
          txt(
            frac > 0.5
              ? `${SHORT_INPUT_TOKENS.toLocaleString()} -> ${LONG_INPUT_TOKENS.toLocaleString()} TOKENS (800 / CALL)`
              : `${SHORT_INPUT_TOKENS.toLocaleString()} TOKENS (200 / CALL)`,
            -840,
            262,
            26,
            ROLE.verdict,
            'mono',
            'left',
          ).opacity(a),
        );
      }
      if (isCycle) {
        nodes.push(
          txt('CYCLE RISK: A > B > C > A', -840, 355, 28, ROLE.conflict, 'mono', 'left')
            .glow(7, ROLE.conflict)
            .opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Act 2: Reference-guided optical beacon
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, actMode.value - 1)),
    (a) => {
      const rs = refStage.value;
      const p = pulse.value;
      const nodes = [];

      const srcPos = [-520, 40];
      const judgePos = [60, 40];
      const candPos = [560, 40];

      nodes.push(
        txt('REFERENCE-GUIDED EVALUATION', -840, -165, 26, ROLE.stepwise, 'mono', 'left').opacity(
          a,
        ),
        beamWithPhotons(
          quadArcPts([srcPos[0] + 68, srcPos[1]], [judgePos[0] - 78, judgePos[1]], -70),
          ROLE.policy,
          p * 1.1,
          { alpha: a, width: 3.4 },
        ),
        beamWithPhotons(
          quadArcPts([candPos[0] - 68, candPos[1]], [judgePos[0] + 78, judgePos[1]], -70),
          ROLE.stepwise,
          p * 1.1 + 0.5,
          { alpha: a, width: 3.4 },
        ),
        circle(64, { fill: '#0b1224', stroke: ROLE.policy, width: 3.5 })
          .at(...srcPos)
          .glow(10, ROLE.policy)
          .opacity(a),
        txt('POLICY', srcPos[0], srcPos[1], 26, ROLE.policy, 'mono', 'center').opacity(a),
        circle(72, { fill: '#0b1224', stroke: ROLE.verdict, width: 3.8 })
          .at(...judgePos)
          .glow(10, ROLE.verdict)
          .opacity(a),
        txt('JUDGE', judgePos[0], judgePos[1], 28, ROLE.verdict, 'mono', 'center').opacity(a),
        circle(64, { fill: '#0b1224', stroke: ROLE.stepwise, width: 3.5 })
          .at(...candPos)
          .glow(10, ROLE.stepwise)
          .opacity(a),
        txt('REPLY', candPos[0], candPos[1], 26, ROLE.stepwise, 'mono', 'center').opacity(a),
        txt('Prometheus · G-Eval · JudgeLM', 60, 210, 28, COSMOS.muted, 'sans', 'center').opacity(
          a,
        ),
      );

      if (rs >= 1.5) {
        nodes.push(
          txt(
            'FACTUAL CHECK -> OPEN THE CITED POLICY DIRECTLY',
            60,
            310,
            28,
            ROLE.verdict,
            'mono',
            'center',
          )
            .glow(7, ROLE.verdict)
            .opacity(a),
        );
      }
      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0 cues (Pointwise)
  c.on('pointwise-anchors', () => {
    s.play(ordLevel.to(0.15, { duration: clampDur(c, c.cue('pointwise-anchors').start, 0.25) }));
  });
  c.on('pointwise-one', () => {
    s.play(ordLevel.to(1, { duration: clampDur(c, c.cue('pointwise-one').start, 0.35) }));
  });
  c.on('pointwise-two', () => {
    s.play(ordLevel.to(2, { duration: clampDur(c, c.cue('pointwise-two').start, 0.35) }));
  });
  c.on('ordinal-limit', () => {
    s.play(ordWarn.to(1, { duration: clampDur(c, c.cue('ordinal-limit').start, 0.35) }));
  });

  // Beat 1 cues (Pairwise)
  c.on('pair-lattice', () => {
    const t = c.cue('pair-lattice').start;
    s.play(actMode.to(1, { duration: clampDur(c, t, 0.35) }));
    s.play(pairStage.to(0.5, { duration: clampDur(c, t, 0.3) }));
  });
  c.show('pair-count', pairFormula);
  c.on('pair-count', () => {
    s.play(pairStage.to(1.2, { duration: clampDur(c, c.cue('pair-count').start, 0.35) }));
  });
  c.on('pair-calls', () => {
    s.play(pairStage.to(2.2, { duration: clampDur(c, c.cue('pair-calls').start, 0.35) }));
  });
  c.on('baseline-count', () => {
    s.play(pairStage.to(3.0, { duration: clampDur(c, c.cue('baseline-count').start, 0.35) }));
  });
  c.on('baseline-result', () => {
    s.play(pairStage.to(3.4, { duration: clampDur(c, c.cue('baseline-result').start, 0.3) }));
  });
  c.on('longer-input', () => {
    s.play(pairStage.to(4.1, { duration: clampDur(c, c.cue('longer-input').start, 0.35) }));
  });
  c.on('input-total', () => {
    s.play(pairStage.to(4.6, { duration: clampDur(c, c.cue('input-total').start, 0.35) }));
  });
  c.on('preference-cycle', () => {
    s.play(pairStage.to(5.2, { duration: clampDur(c, c.cue('preference-cycle').start, 0.35) }));
  });

  // Beat 2 cues (Reference guidance)
  c.hide('reference-guidance', pairFormula);
  c.on('reference-guidance', () => {
    const t = c.cue('reference-guidance').start;
    s.play(actMode.to(2, { duration: clampDur(c, t, 0.35) }));
    s.play(refStage.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('teacher-boundary', () => {
    s.play(refStage.to(2, { duration: clampDur(c, c.cue('teacher-boundary').start, 0.35) }));
  });
}
