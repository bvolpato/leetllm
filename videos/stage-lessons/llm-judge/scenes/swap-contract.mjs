// Scene 8: swap-contract - Reconcile identity while preserving ties and review
// Illuminated 4-channel switching router: pre-check gate (same case, same config,
// exact reversed order) feeds 4 distinct glowing conduits (same winner, stable tie,
// unresolved, review), followed by a rose correlated-error beam showing order
// consistency != accuracy.
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function swapContract(s, c) {
  const pulse = s.value(0);
  const gateOn = s.value(0);
  const mixedOn = s.value(0);
  const tieOn = s.value(0);
  const revOn = s.value(0);
  const mode2 = s.value(0); // 0 = 4-way router, 1 = stable mistake + versioned rule
  const verOn = s.value(0);

  const header = cinemaHeader(
    'SWAP RECONCILIATION ROUTER',
    'Preserve ties, conflicts,',
    'and human review',
    { accent: ROLE.stepwise, size: 48 },
  );

  const stageAura = aura(150, 40, 620, '#5ce1e61d', '#ff6b8b1a');

  const routerView = guardedDynamic(
    () => fadeOutHalf(mode2.value),
    (a) => {
      const p = 0;
      const g = gateOn.value;
      const mx = mixedOn.value;
      const ti = tieOn.value;
      const rv = revOn.value;
      const nodes = [];

      // Left Pre-check Gate
      const gatePt = [-140, 50];
      nodes.push(
        txt('PRE-CHECK GATE', -830, -155, 26, ROLE.policy, 'mono', 'left').opacity(a),
        txt('1. Same case_id', -830, -100, 28, COSMOS.ink, 'sans', 'left').opacity(
          a * (0.5 + g * 0.5),
        ),
        txt('2. Same judge config', -830, -48, 28, COSMOS.ink, 'sans', 'left').opacity(
          a * (0.5 + g * 0.5),
        ),
        txt('3. Exact reversed order', -830, 4, 28, ROLE.stepwise, 'sans', 'left').opacity(
          a * (0.5 + g * 0.5),
        ),
        txt(
          'Rejects: same-order · cross-case · cross-config',
          -830,
          215,
          26,
          ROLE.conflict,
          'mono',
          'left',
        ).opacity(a * (0.4 + g * 0.6)),
        circle(52, { fill: '#0b1224', stroke: ROLE.stepwise, width: 3.6 })
          .at(...gatePt)
          .glow(10, ROLE.stepwise)
          .opacity(a),
        txt('SWAP', gatePt[0], gatePt[1], 26, ROLE.stepwise, 'mono', 'center').opacity(a),
        beamWithPhotons(
          [
            [-400, 50],
            [gatePt[0] - 58, 50],
          ],
          ROLE.policy,
          p * 1.1,
          { alpha: a, width: 3.4 },
        ),
      );

      // 4 output conduits on right
      const tracks = [
        { y: -175, label: 'SAME WINNER   (B, A -> stepwise)', col: ROLE.ok, on: 0.45 + g * 0.55 },
        {
          y: -25,
          label: 'STABLE TIE    (tie, tie -> tie)',
          col: ROLE.stepwise,
          on: 0.25 + ti * 0.75,
        },
        {
          y: 125,
          label: 'UNRESOLVED    (winner + tie / flip)',
          col: ROLE.conflict,
          on: 0.25 + mx * 0.75,
        },
        {
          y: 275,
          label: 'HUMAN REVIEW  (either -> review)',
          col: ROLE.verdict,
          on: 0.25 + rv * 0.75,
        },
      ];

      tracks.forEach((tr, i) => {
        const endPt = [175, tr.y];
        nodes.push(
          beamWithPhotons(
            quadArcPts([gatePt[0] + 48, gatePt[1]], endPt, (i - 1.5) * 18),
            tr.col,
            p * 1.1 + i * 0.22,
            {
              alpha: a * tr.on,
              width: tr.on > 0.7 ? 3.8 : 2.2,
            },
          ),
          circle(11, { fill: tr.col, stroke: '#ffffff', width: 1.5 })
            .at(...endPt)
            .glow(tr.on > 0.7 ? 9 : 0, tr.col)
            .opacity(a * tr.on),
          txt(tr.label, 210, tr.y, 26, tr.col, 'mono', 'left').opacity(a * tr.on),
        );
      });

      return group(...nodes);
    },
  );

  const mistakeView = guardedDynamic(
    () => fadeInHalf(mode2.value),
    (a) => {
      const p = 0;
      const v = verOn.value;
      const nodes = [];

      // Left: Both swapped calls agree on the SAME WRONG claim
      const c1 = [-680, -60];
      const c2 = [-680, 140];
      const agreePt = [-120, 40];
      const polPt = [480, 40];

      nodes.push(
        txt('CONSISTENCY != ACCURACY', -840, -170, 28, ROLE.conflict, 'mono', 'left')
          .glow(6, ROLE.conflict)
          .opacity(a),
        circle(36, { fill: '#0b1224', stroke: ROLE.stepwise, width: 3 })
          .at(...c1)
          .opacity(a),
        txt('CALL 1', c1[0], c1[1] - 58, 26, ROLE.stepwise, 'mono', 'center').opacity(a),
        txt('B', c1[0], c1[1], 30, ROLE.verdict, 'mono', 'center').opacity(a),
        circle(36, { fill: '#0b1224', stroke: ROLE.stepwise, width: 3 })
          .at(...c2)
          .opacity(a),
        txt('CALL 2', c2[0], c2[1] + 58, 26, ROLE.stepwise, 'mono', 'center').opacity(a),
        txt('A', c2[0], c2[1], 30, ROLE.verdict, 'mono', 'center').opacity(a),
        beamWithPhotons(
          quadArcPts([c1[0] + 36, c1[1]], [agreePt[0] - 102, agreePt[1]], -28),
          ROLE.verdict,
          p * 1.1,
          {
            alpha: a,
            width: 3.4,
          },
        ),
        beamWithPhotons(
          quadArcPts([c2[0] + 36, c2[1]], [agreePt[0] - 102, agreePt[1]], 28),
          ROLE.verdict,
          p * 1.1 + 0.5,
          {
            alpha: a,
            width: 3.4,
          },
        ),
        circle(98, { fill: '#0b1224', stroke: ROLE.conflict, width: 4 })
          .at(...agreePt)
          .glow(10, ROLE.conflict)
          .opacity(a),
        txt('BOTH PICK', agreePt[0], agreePt[1] - 20, 26, ROLE.conflict, 'mono', 'center').opacity(
          a,
        ),
        txt('“OPTIONAL”', agreePt[0], agreePt[1] + 20, 26, COSMOS.ink, 'mono', 'center').opacity(a),
        line([agreePt[0] + 104, 40], [polPt[0] - 106, 40], {
          stroke: ROLE.conflict,
          width: 4,
          dash: [10, 8],
        })
          .glow(9, ROLE.conflict)
          .opacity(a),
        circle(98, { fill: '#0b1224', stroke: ROLE.policy, width: 4 })
          .at(...polPt)
          .glow(10, ROLE.policy)
          .opacity(a),
        txt('POLICY', polPt[0], polPt[1] - 20, 26, ROLE.policy, 'mono', 'center').opacity(a),
        txt('REQUIRED', polPt[0], polPt[1] + 20, 28, ROLE.ok, 'mono', 'center').opacity(a),
      );

      if (v > 0.05) {
        nodes.push(
          txt(
            'TRACK UNRESOLVED PAIRS BY TASK  ·  VERSION COMBINATION RULE WITH JUDGE',
            -840,
            345,
            26,
            ROLE.stepwise,
            'mono',
            'left',
          )
            .glow(6, ROLE.stepwise)
            .opacity(a * v),
        );
      }
      return group(...nodes);
    },
  );

  s.add(stageAura, header, routerView, mistakeView);

  c.on('same-case-contract', () => {
    s.play(gateOn.to(1, { duration: clampDur(c, c.cue('same-case-contract').start, 0.35) }));
  });
  c.on('mixed-swap', () => {
    s.play(mixedOn.to(1, { duration: clampDur(c, c.cue('mixed-swap').start, 0.35) }));
  });
  c.on('stable-tie', () => {
    s.play(tieOn.to(1, { duration: clampDur(c, c.cue('stable-tie').start, 0.35) }));
  });
  c.on('review-outcome', () => {
    s.play(revOn.to(1, { duration: clampDur(c, c.cue('review-outcome').start, 0.35) }));
  });
  c.on('stable-mistake', () => {
    s.play(mode2.to(1, { duration: clampDur(c, c.cue('stable-mistake').start, 0.35) }));
  });
  c.on('version-reconciliation', () => {
    s.play(verOn.to(1, { duration: clampDur(c, c.cue('version-reconciliation').start, 0.35) }));
  });
}
