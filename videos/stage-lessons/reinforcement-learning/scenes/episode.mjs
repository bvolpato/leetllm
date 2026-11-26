// Scene 2: episode - "What each route is worth at nine"
// Continuation from intro's parallel luminous timelines: glowing reward photons arc backward
// across the gamma = 0.9 bridge, reveal exact discounted returns (59 vs 54), expose unsafe -120,
// and crown the episode return & geometric bound equations in glowing MathJax.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  REWARD,
  ROLE,
  cinemaAtmosphere,
  evalArc,
  gamma,
  glowArcArrow,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  returns,
  rule,
  txt,
} from '../parts.mjs';
import { sign } from '../desk.mjs';

export default function episode(s, c) {
  const title = heroTitle(['What each route is', 'worth at nine'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.evidence,
  });

  // Progressive backward-discount animations
  const askArcT = s.value(0);
  const askStage = s.value(0); // 0: ?, 1: -4 + 63, 2: 59
  const revArcT = s.value(0);
  const revStage = s.value(0); // 0: ?, 1: -18 + 72, 2: 54
  const showChoose = s.value(0);
  const showUnsafe = s.value(0);
  const showWait = s.value(0);

  // MathJax equations swapped cleanly below the timelines
  const eqSeries = glowTex('G_0 = r_1 + \\gamma r_2 + \\gamma^2 r_3 + \\dots', {
    x: 0,
    y: 345,
    size: 40,
    color: ROLE.gold,
    glow: 7,
  });
  const eqBound = glowTex(
    '|G_0| \\le \\frac{R_{\\max}}{1 - \\gamma} \\qquad (0 \\le \\gamma < 1)',
    {
      x: 0,
      y: 345,
      size: 40,
      color: ROLE.violet,
      glow: 7,
    },
  );

  const mainLayer = guardedDynamic(
    () => 1,
    (alpha) => {
      const nodes = [];
      const colNow = -290;
      const colLater = 80;
      const colTotal = 465;

      // Column headers
      nodes.push(
        txt('Route', -680, -255, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('Now', colNow, -255, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('1 step later', colLater, -255, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt('Return at 09:00', colTotal, -255, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
        rule(-845, -218, 845, -218, COSMOS.rule, 1.8).opacity(0.65 * alpha),
      );

      // Discount lens between Now and Later
      nodes.push(
        line([-105, -200], [-105, 195], { stroke: ROLE.violet, width: 2.8, dash: [9, 7] })
          .glow(7, ROLE.violet)
          .opacity(0.8 * alpha),
        txt(`× ${gamma}`, -105, -255, 28, ROLE.violet, 'mono', 'center').opacity(alpha),
      );

      const tracks = [
        {
          y: -110,
          name: 'Ask for proof',
          cost: REWARD.ask,
          later: REWARD.evidence,
          disc: gamma * REWARD.evidence,
          total: returns.evidence,
          col: ROLE.evidence,
          arcT: askArcT.value,
          stage: askStage.value,
          winner: showChoose.value > 0.5,
        },
        {
          y: 85,
          name: 'Human review',
          cost: REWARD.reviewCost,
          later: REWARD.review,
          disc: gamma * REWARD.review,
          total: returns.review,
          col: ROLE.review,
          arcT: revArcT.value,
          stage: revStage.value,
          winner: false,
        },
      ];

      tracks.forEach((tr) => {
        nodes.push(
          glowingTrail(
            [
              [-525, tr.y],
              [colNow - 58, tr.y],
            ],
            { color: tr.col, width: 3.2, glow: 6, opacity: 0.55 * alpha, core: false },
          ),
          glowingTrail(
            [
              [colNow + 58, tr.y],
              [colLater - 62, tr.y],
            ],
            { color: tr.col, width: 3.2, glow: 6, opacity: 0.55 * alpha, core: false },
          ),
          glowingTrail(
            [
              [colLater + 62, tr.y],
              [colTotal - 165, tr.y],
            ],
            { color: tr.col, width: 3.2, glow: 6, opacity: 0.55 * alpha, core: false },
          ),
          txt(tr.name, -695, tr.y, 36, tr.col, 'serif', 'center')
            .glow(tr.winner ? 10 : 5, tr.col)
            .opacity(alpha),
          glowRing(colNow, tr.y, 56, tr.col, { width: 3, glow: 8 }).opacity(alpha),
          txt(sign(tr.cost), colNow, tr.y, 38, tr.col, 'mono', 'center').opacity(alpha),
          glowRing(colLater, tr.y, 60, tr.col, { width: 3, glow: 8 }).opacity(alpha),
          txt(sign(tr.later), colLater, tr.y, 38, tr.col, 'mono', 'center').opacity(alpha),
        );

        // Animated backward discounting arc & traveling photon
        if (tr.arcT > 0.02) {
          const p0 = [colLater, tr.y - 58];
          const p1 = [colTotal - 115, tr.y - 58];
          nodes.push(
            glowArcArrow(p0, p1, -48, {
              color: ROLE.violet,
              width: 3,
              glow: 8,
              opacity: Math.min(1, tr.arcT * 2) * 0.85 * alpha,
              photonT: tr.arcT < 0.99 ? tr.arcT : null,
            }),
          );
          if (tr.arcT < 0.99) {
            const [px, py] = evalArc(p0, p1, -48, tr.arcT);
            nodes.push(glowDot(px, py, { radius: 9, color: tr.col, glow: 14, opacity: alpha }));
          }
        }

        // Return slot: '?' -> '-4 + 63' -> '59' + glowing bar
        if (tr.stage < 0.5) {
          nodes.push(
            glowRing(colTotal, tr.y, 54, COSMOS.dim, { width: 2.5, glow: 4, dash: [8, 6] }).opacity(
              alpha,
            ),
            txt('?', colTotal, tr.y, 46, COSMOS.dim, 'mono', 'center').opacity(alpha),
          );
        } else if (tr.stage < 1.5) {
          nodes.push(
            txt(`${sign(tr.cost)} + ${tr.disc}`, colTotal, tr.y, 40, tr.col, 'mono', 'center')
              .glow(7, tr.col)
              .opacity(alpha),
          );
        } else {
          const barW = (tr.total / 70) * 240;
          nodes.push(
            lumBar(colTotal + 80 + barW / 2, tr.y, barW, 38, {
              color: tr.col,
              fillOpacity: tr.winner ? 0.48 : 0.3,
              strokeWidth: tr.winner ? 3.2 : 2.2,
              glow: tr.winner ? 12 : 7,
              opacity: alpha,
            }),
            txt(String(tr.total), colTotal, tr.y, 52, tr.col, 'mono', 'center')
              .glow(tr.winner ? 12 : 7, tr.col)
              .opacity(alpha),
          );
          if (tr.winner) {
            nodes.push(
              txt('+5 lead', colTotal + 80 + barW + 76, tr.y, 28, ROLE.gold, 'mono', 'center')
                .glow(6, ROLE.gold)
                .opacity(showChoose.value * alpha),
            );
          }
        }
      });

      // Third row: Unsafe immediate approval (-120, simulator only, P-7 blocks live)
      const uOp = showUnsafe.value * alpha;
      if (uOp > 0.02) {
        const uy = 230;
        nodes.push(
          glowingTrail(
            [
              [-525, uy],
              [colNow - 56, uy],
            ],
            { color: ROLE.approve, width: 2.8, glow: 7, opacity: 0.55 * uOp, core: false },
          ),
          glowingTrail(
            [
              [colNow + 56, uy],
              [215, uy],
            ],
            { color: ROLE.approve, width: 2.8, glow: 7, opacity: 0.55 * uOp, core: false },
          ),
          txt('Approve now', -695, uy, 34, ROLE.approve, 'serif', 'center').opacity(uOp),
          glowRing(colNow, uy, 54, ROLE.approve, { width: 3, glow: 9 }).opacity(uOp),
          txt(String(REWARD.approve), colNow, uy, 30, ROLE.approve, 'mono', 'center').opacity(uOp),
          txt('Simulator only · P-7 blocks live', 475, uy, 28, ROLE.approve, 'sans', 'center')
            .glow(5, ROLE.approve)
            .opacity(uOp),
        );
      }

      // Bottom waiting note (replaces winner tag cleanly)
      const wOp = showWait.value * alpha;
      if (wOp > 0.02) {
        nodes.push(
          txt(
            'If waiting makes requesters leave, model that branch and its cost.',
            0,
            445,
            30,
            ROLE.state,
            'sans',
            'center',
          ).opacity(wOp),
        );
      } else if (showChoose.value > 0.02) {
        nodes.push(
          txt('Ask for proof wins at 59 vs 54.', 0, 445, 34, ROLE.evidence, 'serif', 'center')
            .glow(7, ROLE.evidence)
            .opacity(showChoose.value * alpha),
        );
      }

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.evidence, ROLE.violet), title, mainLayer);

  playCue(s, c, 'ask-back', (d) => s.play(askArcT.to(1, { duration: d })), { dur: 0.95 });
  playCue(s, c, 'ask-now', (d) => s.play(askStage.to(1, { duration: d })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'ask-total', (d) => s.play(askStage.to(2, { duration: d })), {
    after: true,
    dur: 0.35,
  });

  playCue(s, c, 'review-back', (d) => s.play(revArcT.to(1, { duration: d })), { dur: 0.95 });
  playCue(s, c, 'review-now', (d) => s.play(revStage.to(1, { duration: d })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'review-total', (d) => s.play(revStage.to(2, { duration: d })), {
    after: true,
    dur: 0.35,
  });

  playCue(s, c, 'choose', (d) => s.play(showChoose.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'unsafe', (d) => s.play(showUnsafe.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });

  c.show('return-rule', eqSeries);
  c.swap('bound', eqSeries, eqBound);
  playCue(s, c, 'wait', (d) => s.play(showWait.to(1, { duration: d })), { dur: 0.45 });
}
