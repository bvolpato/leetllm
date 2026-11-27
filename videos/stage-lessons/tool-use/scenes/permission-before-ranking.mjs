// Scene 21: permission-before-ranking - Which tools reach this model turn?
// 3-Act Routing Pipeline:
//   Act 0 (Beat 0): Role Sieve filtering 4-tool catalog down to 2 `triage` tools BEFORE scoring
//   Act 1 (Beat 1): Overflow-safe Vector Normalization + Dot Product + Zero-Vector rejection
//   Act 2 (Beats 2-3): Live Cosine Projection Plane (A=[0.6,0.8]->0.6, B=[0.8,0.6]->0.8 on q=[1,0])
//                      with strict prediction withholding on Beat 2 -> Beat 3!
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  RANKING_CATALOG,
  RANKING_QUERY,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  glowDot,
  glowTex,
  guardedDynamic,
  safeToolCosine,
  txt,
} from '../parts.mjs';

export default function permissionBeforeRanking(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = role filter, 1 = cosine normalization, 2 = projection plane
  const filterOn = s.value(0);
  const dotOn = s.value(0);
  const normOn = s.value(0);
  const zeroOn = s.value(0);
  const queryOn = s.value(0);
  const projA = s.value(0);
  const scoreA = s.value(0);
  const projB = s.value(0);
  const scoreB = s.value(0);
  const askSlotOn = s.value(0);
  const top1Reveal = s.value(0);
  const missingReveal = s.value(0);

  const cosA = safeToolCosine(RANKING_QUERY, RANKING_CATALOG[0].vector);
  const cosB = safeToolCosine(RANKING_QUERY, RANKING_CATALOG[1].vector);

  const header = cinemaHeader(
    'PERMISSION-FIRST TOOL ROUTING',
    'Which tools reach',
    'this model turn?',
    { accent: ROLE.runtime, size: 48 },
  );

  const stageAura = aura(150, 40, 620, '#5ce1e622', '#60a5fa1a');

  // Act 0: Role Sieve (4 tools -> 2 triage tools)
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const p = 0;
      const fl = filterOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'HOST CATALOG (4 TOOLS)  ·  CALLER ROLE: triage',
          -855,
          -210,
          26,
          ROLE.session,
          'mono',
          'left',
        ).opacity(a),
      );

      RANKING_CATALOG.forEach((tool, i) => {
        const y = -125 + i * 115;
        const allowed = tool.role === 'triage';
        const col = fl > 0.35 ? (allowed ? ROLE.ok : ROLE.denied) : ROLE.proposal;
        nodes.push(
          energyRail(-855, y - 30, y + 32, col, { opacity: a }),
          txt(
            `${tool.name} · ${tool.fullName}`,
            -825,
            y - 4,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(a),
          txt(
            `role: ${tool.role}`,
            -210,
            y - 4,
            26,
            allowed ? ROLE.runtime : ROLE.caution,
            'mono',
            'left',
          ).opacity(a),
          beamWithPhotons(
            [
              [45, y],
              [210, y],
            ],
            col,
            p * 1.1 + i * 0.25,
            { alpha: a, width: 3.2 },
          ),
          circuitBreaker(290, y, 100, fl > 0.35 && !allowed ? 1 : 0, ROLE.ok, { opacity: a }),
          txt(
            fl > 0.35
              ? allowed
                ? 'ELIGIBLE FOR RANKING'
                : 'REMOVED BEFORE SCORING'
              : 'TRUSTED INVENTORY',
            395,
            y,
            26,
            col,
            'mono',
            'left',
          )
            .glow(fl > 0.35 ? 6 : 0, col)
            .opacity(a),
        );
      });

      nodes.push(
        txt(
          'Even tool descriptions can disclose private capabilities · Recheck permission on call return',
          0,
          385,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: Overflow-Safe Cosine Normalization + Zero-Vector Guard
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const dt = dotOn.value;
      const nm = normOn.value;
      const zr = zeroOn.value;
      const nodes = [];

      nodes.push(
        glowTex(
          '\\cos(\\mathbf{q}, \\mathbf{v}) = \\frac{\\mathbf{q} \\cdot \\mathbf{v}}{\\|\\mathbf{q}\\|_2 \\|\\mathbf{v}\\|_2}',
          {
            x: -280,
            y: -145,
            size: 46,
            color: ROLE.key,
            glow: 7,
          },
        ).opacity(a),
        energyRail(-855, -20, 295, ROLE.runtime, { opacity: a }),
        txt(
          'SAFE NORMALIZATION  (v = [0.6, 0.8, 0.0])',
          -825,
          0,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
        txt(
          '1. Rescale by max |coord| = 0.8 -> [0.75, 1, 0]',
          -825,
          62,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a * (0.4 + nm * 0.6)),
        txt(
          '2. Divide by length 1.25 -> unit [0.6, 0.8, 0]',
          -825,
          122,
          26,
          ROLE.ok,
          'mono',
          'left',
        )
          .glow(nm > 0.35 ? 6 : 0, ROLE.ok)
          .opacity(a * (0.4 + nm * 0.6)),
        txt(
          '3. Dot product: multiply matching coords & sum',
          -825,
          184,
          26,
          ROLE.proposal,
          'sans',
          'left',
        )
          .glow(dt > 0.35 ? 5 : 0, ROLE.proposal)
          .opacity(a * (0.4 + dt * 0.6)),
        txt(
          '4. Clamp final cosine to [-1, +1]',
          -825,
          244,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );

      // Right side: Zero-vector rejection breaker
      const zOp = 0.35 + zr * 0.65;
      nodes.push(
        energyRail(230, -165, 165, ROLE.denied, { opacity: a * zOp }),
        txt('ZERO VECTOR GUARD', 260, -145, 28, ROLE.denied, 'mono', 'left').opacity(a * zOp),
        txt('v = [0, 0, 0]', 260, -82, 34, COSMOS.ink, 'mono', 'left').opacity(a * zOp),
        txt('No direction -> REJECT', 260, -16, 28, ROLE.denied, 'mono', 'left')
          .glow(zr > 0.35 ? 7 : 0, ROLE.denied)
          .opacity(a * zOp),
        circuitBreaker(440, 115, 120, zr > 0.35 ? 1 : 0.3, ROLE.ok, { opacity: a * zOp }),
      );

      return group(...nodes);
    },
  );

  // Act 2: Live Cosine Projection Plane (strict prediction withholding on Beat 2 -> Beat 3!)
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = 0;
      const qr = queryOn.value;
      const pA = projA.value;
      const sA = scoreA.value;
      const pB = projB.value;
      const sB = scoreB.value;
      const as = askSlotOn.value;
      const t1 = top1Reveal.value;
      const ms = missingReveal.value;
      const nodes = [];

      // Left Coordinate Plane: Origin at (-780, 280), unit = 470px
      const ox = -780;
      const oy = 275;
      const u = 470;

      // Axes + unit quarter-circle arc
      nodes.push(
        line([ox, oy], [ox + u + 75, oy], { stroke: ROLE.key, width: 4 })
          .glow(qr > 0.3 ? 9 : 4, ROLE.key)
          .opacity(a),
        line([ox, oy], [ox, oy - u], { stroke: '#3c4f7d', width: 2.4 }).opacity(a),
        txt('Query q = [1, 0, 0]', ox + u * 0.5, oy + 104, 26, ROLE.key, 'mono', 'center').opacity(
          a,
        ),
        circle(7, { fill: ROLE.denied, stroke: null })
          .at(ox + u, oy)
          .opacity(a * 0.45),
        txt('C (filtered)', ox + u + 12, oy - 40, 26, ROLE.denied, 'mono', 'left').opacity(
          a * 0.72,
        ),
      );

      // Vector A [0.6, 0.8] (blue) & Vector B [0.8, 0.6] (cyan)
      const ax = ox + u * 0.6;
      const ay = oy - u * 0.8;
      const bx = ox + u * 0.8;
      const by = oy - u * 0.6;

      nodes.push(
        beamWithPhotons(
          [
            [ox, oy],
            [ax, ay],
          ],
          ROLE.proposal,
          p * 1.1,
          { alpha: a, width: 4.2, photonCount: 1 },
        ),
        glowDot(ax, ay, { radius: 8, color: ROLE.proposal, glow: 12, opacity: a }),
        txt('A  [0.6, 0.8]', ax + 24, ay - 12, 28, ROLE.proposal, 'mono', 'left').opacity(a),
        beamWithPhotons(
          [
            [ox, oy],
            [bx, by],
          ],
          ROLE.runtime,
          p * 1.1 + 0.5,
          { alpha: a, width: 4.2, photonCount: 1 },
        ),
        glowDot(bx, by, { radius: 8, color: ROLE.runtime, glow: 12, opacity: a }),
        txt('B  [0.8, 0.6]', bx + 24, by - 12, 28, ROLE.runtime, 'mono', 'left').opacity(a),
      );

      // Projection drop line for A -> 0.6
      if (pA > 0.02) {
        const yEndA = ay + (oy - ay) * pA;
        nodes.push(
          line([ax, ay], [ax, yEndA], { stroke: ROLE.proposal, width: 3, dash: [7, 7] })
            .glow(6, ROLE.proposal)
            .opacity(a),
        );
      }
      if (sA > 0.35) {
        nodes.push(
          glowDot(ax, oy, { radius: 8, color: ROLE.proposal, glow: 12, opacity: a }),
          txt(cosA.toFixed(1), ax, oy + 46, 32, ROLE.proposal, 'mono', 'center')
            .glow(7, ROLE.proposal)
            .opacity(a),
        );
      }

      // Projection drop line for B -> 0.8
      if (pB > 0.02) {
        const yEndB = by + (oy - by) * pB;
        nodes.push(
          line([bx, by], [bx, yEndB], { stroke: ROLE.runtime, width: 3, dash: [7, 7] })
            .glow(6, ROLE.runtime)
            .opacity(a),
        );
      }
      if (sB > 0.35) {
        nodes.push(
          glowDot(bx, oy, { radius: 8, color: ROLE.runtime, glow: 12, opacity: a }),
          txt(cosB.toFixed(1), bx, oy + 46, 32, ROLE.runtime, 'mono', 'center')
            .glow(7, ROLE.runtime)
            .opacity(a),
        );
      }

      // Right Panel: Required Tools & 1-Slot Decision (withheld until Beat 3!)
      const rx = 140;
      nodes.push(
        energyRail(rx, -205, 325, t1 > 0.5 ? ROLE.runtime : ROLE.focus, { opacity: a }),
        txt('JOB REQUIRES BOTH READS:', rx + 28, -185, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(
          sA > 0.35 ? `A  Status read   (cos = ${cosA.toFixed(1)})` : 'A  Status read   [0.6, 0.8]',
          rx + 28,
          -125,
          28,
          ROLE.proposal,
          'mono',
          'left',
        ).opacity(a),
        txt(
          sB > 0.35 ? `B  Policy read   (cos = ${cosB.toFixed(1)})` : 'B  Policy read   [0.8, 0.6]',
          rx + 28,
          -70,
          28,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
        line([rx + 28, -15], [820, -15], { stroke: '#25355a', width: 2 }).opacity(a),
        txt('BUDGET: 1 MODEL SLOT', rx + 28, 35, 26, ROLE.focus, 'mono', 'left').opacity(a),
        txt(
          t1 > 0.5 ? 'FILLED BY:  B  (Policy read)' : as > 0.35 ? 'FILLED BY:  ?' : 'RANKING...',
          rx + 28,
          108,
          36,
          t1 > 0.5 ? ROLE.runtime : ROLE.focus,
          'mono',
          'left',
        )
          .glow(8, t1 > 0.5 ? ROLE.runtime : ROLE.focus)
          .opacity(a),
        txt(
          ms > 0.5
            ? 'A MISSING -> JOB CANNOT FINISH!'
            : as > 0.35
              ? 'Can the job finish with 1 slot?  ?'
              : 'Evaluate tool recall + task completion',
          rx + 28,
          195,
          28,
          ms > 0.5 ? ROLE.denied : ROLE.focus,
          'mono',
          'left',
        )
          .glow(ms > 0.5 ? 7 : 4, ms > 0.5 ? ROLE.denied : ROLE.focus)
          .opacity(a),
        txt(
          'Measure required-tool recall alongside relevance',
          rx + 28,
          275,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);

  c.on('tu-permission-before-ranking-1', () => {
    s.play(
      pulse.to(0.3, { duration: clampDur(c, c.cue('tu-permission-before-ranking-1').start, 0.25) }),
    );
  });
  c.on('tu-rank-permission', () => {
    s.play(filterOn.to(1, { duration: clampDur(c, c.cue('tu-rank-permission').start, 0.35) }));
  });
  c.on('tu-permission-before-ranking-2', () => {
    s.play(
      act.to(1, { duration: clampDur(c, c.cue('tu-permission-before-ranking-2').start, 0.35) }),
    );
  });
  c.on('tu-rank-dot', () => {
    s.play(dotOn.to(1, { duration: clampDur(c, c.cue('tu-rank-dot').start, 0.3) }));
  });
  c.on('tu-rank-norm', () => {
    s.play(normOn.to(1, { duration: clampDur(c, c.cue('tu-rank-norm').start, 0.35) }));
  });
  c.on('tu-rank-zero', () => {
    s.play(zeroOn.to(1, { duration: clampDur(c, c.cue('tu-rank-zero').start, 0.35) }));
  });
  c.on('rank-query', () => {
    const t = c.cue('rank-query').start;
    s.play(act.to(2, { duration: clampDur(c, t, 0.35) }));
    s.play(queryOn.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('rank-project-a', () => {
    s.play(projA.to(1, { duration: clampDur(c, c.cue('rank-project-a').start, 0.5) }));
  });
  c.on('rank-score-a', () => {
    s.play(scoreA.to(1, { duration: clampDur(c, c.cue('rank-score-a').start, 0.3) }));
  });
  c.on('rank-project-b', () => {
    s.play(projB.to(1, { duration: clampDur(c, c.cue('rank-project-b').start, 0.5) }));
  });
  c.on('rank-score-b', () => {
    s.play(scoreB.to(1, { duration: clampDur(c, c.cue('rank-score-b').start, 0.3) }));
  });
  c.on('rank-slot', () => {
    s.play(askSlotOn.to(1, { duration: clampDur(c, c.cue('rank-slot').start, 0.3) }));
  });
  // Strict prediction withholding: reveal B fills slot & job cannot finish AFTER spoken clauses!
  c.after('tu-rank-top-one', () => {
    s.play(top1Reveal.to(1, { duration: clampDur(c, c.cue('tu-rank-top-one').end, 0.3) }));
  });
  c.after('tu-rank-missing-tool', () => {
    s.play(missingReveal.to(1, { duration: clampDur(c, c.cue('tu-rank-missing-tool').end, 0.3) }));
  });
}
