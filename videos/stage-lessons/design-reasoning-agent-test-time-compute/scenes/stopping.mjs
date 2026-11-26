import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dotItem,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildStopping(s, c) {
  s.add(aura(-460, -40, 560, ROLE.ok, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.warn, COSMOS.bg));

  s.add(
    cinemaHeader('STOPPING & EXITS', 'Let completion and progress', 'choose the next action', {
      x: -860,
      y: -445,
      accent: ROLE.ok,
      size: 46,
    }),
  );

  const histOn = s.value(0);
  const platOn = s.value(0);

  c.on('stopping-progress-history', () =>
    s.play(histOn.to(1, { duration: clampDur(c, c.cue('stopping-progress-history').start, 0.5) })),
  );
  c.on('stopping-plateau', () =>
    s.play(platOn.to(1, { duration: clampDur(c, c.cue('stopping-plateau').start, 0.5) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const hs = histOn.value;
        const pl = platOn.value;
        const nodes = [];

        // Top: 3 routing exit categories
        const rows = [
          {
            q: '1. THRESHOLD QUESTION',
            a: 'EXACT EVIDENCE COMPLETES TASK -> STOP IMMEDIATELY',
            col: ROLE.ok,
            y: -190,
          },
          {
            q: '2. PARSER REPAIR',
            a: 'PARTIAL CHOICES MATTER -> JUSTIFY BOUNDED SEARCH',
            col: ROLE.agent,
            y: -108,
          },
          {
            q: '3. UNSUPPORTED CLAIM',
            a: 'NO VERIFIER -> REQUIRE TOOL OR AUTHORIZED REVIEWER',
            col: ROLE.warn,
            y: -26,
          },
        ];
        rows.forEach((r) => {
          nodes.push(
            txt(r.q, -840, r.y, 26, r.col, 'mono', 'left'),
            txt(r.a, -360, r.y, 26, COSMOS.ink, 'mono', 'left'),
          );
        });

        // Bottom: Score history curve & plateau exit
        nodes.push(line([-860, 48], [840, 48], { stroke: '#233152', width: 2 }));
        const hAlpha = 0.3 + 0.7 * hs;

        nodes.push(
          txt(
            'PROGRESS RULE BEFORE NEXT EXPANSION',
            -840,
            108,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(hAlpha),
        );

        const pts = [
          { x: -690, lbl: 'STEP 1', sc: '0.72', col: ROLE.ok },
          { x: -450, lbl: 'STEP 2', sc: '0.68', col: COSMOS.muted },
          { x: -210, lbl: 'STEP 3', sc: '0.71', col: ROLE.warn },
          { x: 30, lbl: 'STEP 4', sc: '0.70', col: ROLE.fail },
        ];
        pts.forEach((pt) => {
          nodes.push(
            rect(200, 74, { fill: '#0b1224', stroke: pt.col, width: 2.5, radius: 8 })
              .at(pt.x, 208)
              .opacity(hAlpha),
            txt(pt.lbl, pt.x, 188, 26, COSMOS.muted, 'mono', 'center').opacity(hAlpha),
            txt(pt.sc, pt.x, 224, 30, pt.col, 'mono', 'center').opacity(hAlpha),
          );
        });

        nodes.push(
          metricReadout('PLATEAU HEURISTIC', pl > 0.5 ? 'STOP BRANCH' : 'CHECK GAIN', 510, 208, {
            color: pl > 0.5 ? ROLE.warn : ROLE.focus,
            size: 40,
            sub: 'tune on held-out tasks (can drop good paths)',
          }).opacity(hAlpha),
          dotItem(
            -840,
            366,
            'RETURN ELIGIBLE COMPLETED RESULT OR CLEAR ABSTENTION WHEN BUDGET OR CLOCK ENDS',
            ROLE.ok,
            { opacity: hAlpha },
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
