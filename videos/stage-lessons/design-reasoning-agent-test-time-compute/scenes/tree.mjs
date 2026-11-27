import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TREE_RUN,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  pillNode,
  scores,
  txt,
} from '../parts.mjs';

export function buildTree(s, c) {
  s.add(aura(-460, -40, 560, ROLE.model, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader(
      'BEAM SEARCH & PRUNING',
      'Keep feasible alternatives',
      'and prune exact failures',
      {
        x: -860,
        y: -445,
        accent: ROLE.model,
        size: 46,
      },
    ),
  );

  const d1On = s.value(0);
  const failOn = s.value(0);
  const compOn = s.value(0);
  const winOn = s.value(0);

  c.on('tree-beat-1-focus-1', () =>
    s.play(d1On.to(1, { duration: clampDur(c, c.cue('tree-beat-1-focus-1').start, 0.5) })),
  );
  c.on('tree-failed-leaves', () =>
    s.play(failOn.to(1, { duration: clampDur(c, c.cue('tree-failed-leaves').start, 0.5) })),
  );
  c.on('tree-complete-plans', () =>
    s.play(compOn.to(1, { duration: clampDur(c, c.cue('tree-complete-plans').start, 0.5) })),
  );
  c.on('tree-completed-winner', () =>
    s.play(winOn.to(1, { duration: clampDur(c, c.cue('tree-completed-winner').start, 0.5) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const d1 = d1On.value;
        const fl = failOn.value;
        const cp = compOn.value;
        const wn = winOn.value;
        const nodes = [];

        // Root -> Depth 1 -> Depth 2
        const rootPt = [120, -295];
        const d1Pts = [
          [-480, -108],
          [120, -108],
          [600, -108],
        ];
        const d2Pts = [
          [-680, 175],
          [-260, 175],
          [220, 175],
          [660, 175],
        ];

        // Depth 1 beams
        nodes.push(
          beamWithPhotons(
            [
              [rootPt[0] - 80, rootPt[1] + 32],
              [d1Pts[0][0] + 40, d1Pts[0][1] - 32],
            ],
            ROLE.agent,
            0,
          ),
          beamWithPhotons(
            [
              [rootPt[0], rootPt[1] + 32],
              [d1Pts[1][0], d1Pts[1][1] - 32],
            ],
            ROLE.fail,
            0,
            { alpha: 0.42 },
          ),
          beamWithPhotons(
            [
              [rootPt[0] + 80, rootPt[1] + 32],
              [d1Pts[2][0] - 40, d1Pts[2][1] - 32],
            ],
            ROLE.ok,
            0,
          ),
        );

        // Depth 2 beams (start cleanly below sub-labels at y + 82!)
        const d2Alpha = 0.25 + 0.75 * Math.max(fl, cp);
        nodes.push(
          beamWithPhotons(
            [
              [d1Pts[0][0] - 60, d1Pts[0][1] + 82],
              [d2Pts[0][0] + 20, d2Pts[0][1] - 32],
            ],
            ROLE.ok,
            0,
            { alpha: d2Alpha },
          ),
          beamWithPhotons(
            [
              [d1Pts[0][0] + 60, d1Pts[0][1] + 82],
              [d2Pts[1][0] - 20, d2Pts[1][1] - 32],
            ],
            ROLE.fail,
            0,
            { alpha: 0.4 * d2Alpha },
          ),
          beamWithPhotons(
            [
              [d1Pts[2][0] - 60, d1Pts[2][1] + 82],
              [d2Pts[2][0] + 20, d2Pts[2][1] - 32],
            ],
            wn > 0.5 ? ROLE.focus : ROLE.ok,
            0,
            { alpha: d2Alpha },
          ),
          beamWithPhotons(
            [
              [d1Pts[2][0] + 40, d1Pts[2][1] + 82],
              [d2Pts[3][0] - 20, d2Pts[3][1] - 32],
            ],
            ROLE.fail,
            0,
            { alpha: 0.4 * d2Alpha },
          ),
        );

        // Nodes
        nodes.push(pillNode(rootPt[0], rootPt[1], 240, 'START', ROLE.model));

        nodes.push(
          pillNode(d1Pts[0][0], d1Pts[0][1], 320, 'PIN PARSER v2', ROLE.agent, {
            sub: `score ${scores['Pin parser v2']} · KEEP`,
          }),
          pillNode(d1Pts[1][0], d1Pts[1][1], 310, 'PIN NIGHTLY', ROLE.fail, {
            sub: `score ${scores['Pin parser nightly']} · FLOOR FAIL`,
            opacity: d1 > 0.5 ? 0.45 : 0.85,
          }),
          pillNode(d1Pts[2][0], d1Pts[2][1], 320, 'KEEP PARSER v1', ROLE.ok, {
            sub: `score ${scores['Keep parser v1']} · KEEP`,
          }),
        );

        // Depth 2 leaves
        nodes.push(
          pillNode(d2Pts[0][0], d2Pts[0][1], 310, 'ADD SHIM (0.70)', ROLE.ok, {
            sub: 'COMPLETE · PASS',
            opacity: d2Alpha,
          }),
          pillNode(d2Pts[1][0], d2Pts[1][1], 320, 'REMOVED API (0.18)', ROLE.fail, {
            sub: 'PRUNED: EXACT FAIL',
            opacity: d2Alpha * 0.6,
          }),
          pillNode(
            d2Pts[2][0],
            d2Pts[2][1],
            360,
            'PATCH SANITIZER (0.96)',
            wn > 0.5 ? ROLE.focus : ROLE.ok,
            {
              sub: wn > 0.5 ? 'WINNER (COMPLETED VAULT)' : 'COMPLETE · PASS',
              opacity: d2Alpha,
              glow: wn > 0.5 ? 12 : 7,
            },
          ),
          pillNode(d2Pts[3][0], d2Pts[3][1], 330, 'DEFER FIX (0.39)', ROLE.fail, {
            sub: 'PRUNED: ADVISORY',
            opacity: d2Alpha * 0.6,
          }),
        );

        nodes.push(line([-860, 326], [840, 326], { stroke: '#233152', width: 2 }));
        nodes.push(
          txt(
            `COMPLETED WINNER: ${TREE_RUN.winner.name.toUpperCase()} (${TREE_RUN.winner.score})  |  STORE COMPLETED PLANS SEPARATELY FROM BEAM`,
            0,
            396,
            26,
            wn > 0.5 ? ROLE.focus : COSMOS.muted,
            'mono',
            'center',
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
