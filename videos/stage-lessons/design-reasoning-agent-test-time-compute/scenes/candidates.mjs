import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  candidates,
  cinemaHeader,
  clampDur,
  eligible,
  guardedDynamic,
  metricReadout,
  pillNode,
  txt,
} from '../parts.mjs';

export function buildCandidates(s, c) {
  s.add(aura(-460, -40, 560, ROLE.agent, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader('BEST-OF-N FILTERING', 'Which repair path', 'reaches the database?', {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    }),
  );

  const scoreOn = s.value(0);
  const blockOn = s.value(0);
  const selectRev = s.value(0);

  c.on('paths-scores', () =>
    s.play(scoreOn.to(1, { duration: clampDur(c, c.cue('paths-scores').start, 0.45) })),
  );
  c.on('paths-block', () =>
    s.play(blockOn.to(1, { duration: clampDur(c, c.cue('paths-block').start, 0.45) })),
  );
  // Strict prediction withholding: SEND B revealed ONLY after paths-select!
  c.after('paths-select', () =>
    s.play(selectRev.to(1, { duration: clampDur(c, c.cue('paths-select').end, 0.5) })),
  );

  const okA = eligible(candidates[0].path); // false
  const okB = eligible(candidates[1].path); // true

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const sc = scoreOn.value;
        const bl = blockOn.value;
        const sl = selectRev.value;
        const nodes = [];

        const apiPt = [-640, 10];
        const legPt = [0, -135];
        const flagPt = [0, 145];
        const dbPt = [640, 10];

        const aCol = bl > 0.5 ? ROLE.fail : ROLE.model;
        const bCol = sl > 0.5 ? ROLE.ok : ROLE.agent;

        // Edges for Path A
        nodes.push(
          beamWithPhotons(
            [
              [apiPt[0] + 120, apiPt[1] - 20],
              [legPt[0] - 180, legPt[1] + 10],
            ],
            aCol,
            0,
            { alpha: sl > 0.5 ? 0.35 : 0.9 },
          ),
          beamWithPhotons(
            [
              [legPt[0] + 180, legPt[1] + 10],
              [dbPt[0] - 140, dbPt[1] - 20],
            ],
            ROLE.model,
            0,
            { alpha: bl > 0.5 ? 0.32 : 0.85 },
          ),
        );

        // Edges for Path B
        nodes.push(
          beamWithPhotons(
            [
              [apiPt[0] + 120, apiPt[1] + 20],
              [flagPt[0] - 180, flagPt[1] - 10],
            ],
            bCol,
            0,
            { alpha: 0.95 },
          ),
          beamWithPhotons(
            [
              [flagPt[0] + 180, flagPt[1] - 10],
              [dbPt[0] - 140, dbPt[1] + 20],
            ],
            bCol,
            0,
            { alpha: 0.95 },
          ),
        );

        // Nodes
        nodes.push(
          pillNode(apiPt[0], apiPt[1], 210, 'API', ROLE.agent),
          pillNode(legPt[0], legPt[1], 340, 'A: LEGACY ADAPTER', aCol, {
            sub:
              bl > 0.5
                ? `score ${candidates[0].score}  ·  HOP 1 BLOCKED`
                : sc > 0.5
                  ? `learned score: ${candidates[0].score} (HIGHER)`
                  : 'candidate path A',
            opacity: sl > 0.5 ? 0.42 : 1,
          }),
          pillNode(flagPt[0], flagPt[1], 340, 'B: FEATURE FLAG', bCol, {
            sub:
              sl > 0.5
                ? `score ${candidates[1].score}  ·  BOTH HOPS PASS`
                : sc > 0.5
                  ? `learned score: ${candidates[1].score}`
                  : 'candidate path B',
            glow: sl > 0.5 ? 11 : 6,
          }),
          pillNode(dbPt[0], dbPt[1], 240, 'DATABASE', sl > 0.5 ? ROLE.ok : ROLE.tool),
        );

        // Blocked edge callout cleanly above the first hop
        if (bl > 0.5) {
          nodes.push(
            txt('X  BLOCKED HOP', -370, -135, 26, ROLE.fail, 'mono', 'center').glow(8, ROLE.fail),
          );
        }

        // Bottom verdict strip
        nodes.push(line([-860, 268], [840, 268], { stroke: '#233152', width: 2 }));
        let cap = 'CANDIDATE SELECTION';
        let val = 'GENERATE -> CHECK ELIGIBILITY -> RANK SURVIVORS';
        let col = COSMOS.muted;
        let sub = '';

        if (sl > 0.5) {
          cap = `eligible(A)=${okA}  |  eligible(B)=${okB}`;
          val = 'SEND B FOR REVIEW';
          col = ROLE.ok;
          sub = 'EXACT COMPATIBILITY FILTER BEATS HIGHER LEARNED SCORE ON BLOCKED A';
        } else if (bl > 0.5) {
          cap = 'A SCORES 0.96 (BLOCKED)  |  B SCORES 0.82';
          val = 'WHICH CANDIDATE CAN YOU SEND?';
          col = ROLE.focus;
          sub = 'EXACT COMPATIBILITY RECORD BLOCKS API -> LEGACY ADAPTER';
        }

        nodes.push(metricReadout(cap, val, 0, 368, { color: col, size: 42, sub }));
        return group(...nodes);
      },
    ),
  );
}
