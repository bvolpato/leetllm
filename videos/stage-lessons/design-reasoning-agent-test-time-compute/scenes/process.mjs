import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  metricReadout,
  steps,
  txt,
} from '../parts.mjs';

export function buildProcess(s, c) {
  s.add(aura(-460, -40, 560, ROLE.agent, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.fail, COSMOS.bg));

  s.add(
    cinemaHeader('PROCESS VERIFICATION', 'When do you check', 'the third step?', {
      x: -860,
      y: -445,
      accent: ROLE.agent,
      size: 46,
    }),
  );

  const checkOn = s.value(0);
  const fourthRev = s.value(0);
  const malOn = s.value(0);

  c.on('process-check', () =>
    s.play(checkOn.to(1, { duration: clampDur(c, c.cue('process-check').start, 0.5) })),
  );
  // Strict prediction withholding: call-4 outcome revealed ONLY after process-fourth!
  c.after('process-fourth', () =>
    s.play(fourthRev.to(1, { duration: clampDur(c, c.cue('process-fourth').end, 0.5) })),
  );
  c.on('process-malformed', () =>
    s.play(malOn.to(1, { duration: clampDur(c, c.cue('process-malformed').start, 0.5) })),
  );

  const colXs = [-380, -40, 300, 640];
  const shortNames = ['1. MANIFEST', '2. PIN v2', '3. REMOVED API', '4. RECOMMEND'];

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const ch = checkOn.value;
        const f4 = fourthRev.value;
        const ml = malOn.value;
        const nodes = [];

        // Column headers
        shortNames.forEach((nm, i) => {
          nodes.push(txt(nm, colXs[i], -215, 26, COSMOS.muted, 'mono', 'center'));
        });

        // Track 1: Late-Check (Outcome) Controller
        const yTop = -125;
        nodes.push(txt('LATE CHECK', -840, yTop - 16, 28, ROLE.warn, 'mono', 'left'));
        nodes.push(txt('(after draft)', -840, yTop + 22, 26, COSMOS.muted, 'mono', 'left'));

        for (let i = 0; i < 4; i++) {
          const isFourth = i === 3;
          const active = !isFourth || f4 > 0.5;
          const col = isFourth ? (f4 > 0.5 ? ROLE.fail : COSMOS.muted) : ROLE.agent;
          nodes.push(
            rect(270, 56, {
              fill: active ? '#0c182e' : '#080e1c',
              stroke: col,
              width: active ? 2.8 : 2,
              radius: 8,
              dash: active ? null : [8, 6],
            }).at(colXs[i], yTop),
            txt(
              isFourth ? (f4 > 0.5 ? 'PAID CALL 4!' : '[ ? ]') : `CALL ${i + 1} PAID`,
              colXs[i],
              yTop,
              26,
              col,
              'mono',
              'center',
            ),
          );
        }

        // Track 2: Step-Check Controller
        const yBot = 28;
        nodes.push(txt('STEP CHECK', -840, yBot - 16, 28, ROLE.ok, 'mono', 'left'));
        nodes.push(txt('(each step)', -840, yBot + 22, 26, COSMOS.muted, 'mono', 'left'));

        for (let i = 0; i < 4; i++) {
          const isThird = i === 2;
          const isFourth = i === 3;
          let col = ROLE.ok;
          let label = `CALL ${i + 1} OK`;
          let dash = null;
          if (isThird) {
            col = ch > 0.5 ? ROLE.fail : ROLE.agent;
            label = ch > 0.5 ? 'EXACT FAIL!' : 'CALL 3';
          } else if (isFourth) {
            col = f4 > 0.5 ? ROLE.ok : COSMOS.muted;
            label = f4 > 0.5 ? 'SAVED (0 COST)' : '[ ? ]';
            dash = [8, 6];
          }
          nodes.push(
            rect(270, 56, {
              fill: isFourth ? '#080e1c' : '#0c182e',
              stroke: col,
              width: 2.8,
              radius: 8,
              dash,
            }).at(colXs[i], yBot),
            txt(label, colXs[i], yBot, 26, col, 'mono', 'center'),
          );
        }

        // Bottom verdict or malformed-record rule
        nodes.push(line([-860, 152], [840, 152], { stroke: '#233152', width: 2 }));

        if (ml > 0.5) {
          nodes.push(
            metricReadout('STRICT VERIFIER TYPE CONTRACT', 'REJECT "false" STRING & NaN', 0, 286, {
              color: ROLE.fail,
              size: 42,
              sub: 'REQUIRE BOOLEAN exact AND FINITE score IN [0, 1] BEFORE RANKING',
            }),
          );
        } else if (f4 > 0.5) {
          nodes.push(
            metricReadout(
              `inspect(steps): PRUNE AT STEP 3 (${steps[2].label})`,
              'ONLY TOP PAYS CALL 4',
              0,
              286,
              {
                color: ROLE.ok,
                size: 44,
                sub: 'STEP CHECK STOPS AT 3; STILL BUDGET CHECKER TOKENS & LATENCY',
              },
            ),
          );
        } else if (ch > 0.5) {
          nodes.push(
            metricReadout(
              'STEP 3 FAILS: RUNTIME REMOVED THIS API',
              'WHICH PAYS FOR CALL 4?',
              0,
              286,
              {
                color: ROLE.focus,
                size: 44,
                sub: 'COMPARE LATE-CHECK DRAFTING VS STEP-BY-STEP PRUNING',
              },
            ),
          );
        } else {
          nodes.push(
            metricReadout(
              'BOTH TRACKS ISSUE CALLS 1, 2, 3',
              'INSPECT STEP 3 COMPATIBILITY',
              0,
              286,
              {
                color: ROLE.agent,
                size: 40,
              },
            ),
          );
        }

        return group(...nodes);
      },
    ),
  );
}
