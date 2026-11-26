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
  stopReason,
  txt,
} from '../parts.mjs';

export function buildRouterEvaluation(s, c) {
  s.add(aura(-460, -40, 560, ROLE.agent, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.focus, COSMOS.bg));

  s.add(
    cinemaHeader('ROUTING & PLATEAU EXIT', 'A route is a ceiling', 'chosen from measured need', {
      x: -860,
      y: -445,
      accent: ROLE.agent,
      size: 46,
    }),
  );

  const reqOn = s.value(0);
  const platOn = s.value(0);

  c.on('ra-router-evaluation-1-0', () =>
    s.play(reqOn.to(1, { duration: clampDur(c, c.cue('ra-router-evaluation-1-0').start, 0.5) })),
  );
  c.on('ra-router-evaluation-2-1', () =>
    s.play(platOn.to(1, { duration: clampDur(c, c.cue('ra-router-evaluation-2-1').start, 0.55) })),
  );

  const reason = stopReason({ scores: [0.72, 0.68, 0.71, 0.7] });

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const rq = reqOn.value;
        const pl = platOn.value;
        const nodes = [];

        // Top: 3 route ceilings
        const routes = [
          {
            x: -570,
            name: 'THRESHOLD LOOKUP',
            route: '1 PATH',
            sub: 'exact evidence stops now',
            col: ROLE.ok,
          },
          {
            x: 0,
            name: 'CANARY DEBUG',
            route: '3 CANDIDATES',
            sub: 'compare complete plans',
            col: ROLE.agent,
          },
          {
            x: 570,
            name: 'COMPAT REPAIR',
            route: 'BEAM TREE',
            sub: 'keep partial alternatives',
            col: ROLE.model,
          },
        ];
        routes.forEach((rt) => {
          nodes.push(
            rect(510, 138, { fill: '#0b1224', stroke: rt.col, width: 2.6, radius: 10 }).at(
              rt.x,
              -140,
            ),
            txt(rt.name, rt.x, -176, 26, COSMOS.muted, 'mono', 'center'),
            txt(rt.route, rt.x, -132, 32, rt.col, 'mono', 'center'),
            txt(rt.sub, rt.x, -92, 26, COSMOS.ink, 'mono', 'center'),
          );
        });

        nodes.push(
          txt(
            'SAME EVIDENCE BAR ACROSS EVERY ROUTE  |  NO VERIFIER -> TOOL OR AUTHORIZED REVIEWER',
            0,
            -26,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(0.45 + 0.55 * rq),
        );

        // Bottom: Plateau stop rule (first = 0.72, next 3 = [0.68, 0.71, 0.70] -> best 0.71 <= 0.72)
        nodes.push(line([-860, 38], [840, 38], { stroke: '#233152', width: 2 }));
        const pAlpha = 0.3 + 0.7 * pl;

        nodes.push(
          txt(
            'PROGRESS / PLATEAU RULE (WINDOW = 3 CALLS)',
            -840,
            96,
            26,
            ROLE.warn,
            'mono',
            'left',
          ).opacity(pAlpha),
        );

        const hist = [
          { label: 'CALL 1', v: 0.72, col: ROLE.ok },
          { label: 'CALL 2', v: 0.68, col: COSMOS.muted },
          { label: 'CALL 3', v: 0.71, col: ROLE.warn },
          { label: 'CALL 4', v: 0.7, col: COSMOS.muted },
        ];
        hist.forEach((h, idx) => {
          const x = -720 + idx * 230;
          nodes.push(
            rect(195, 76, { fill: '#0b1224', stroke: h.col, width: 2.5, radius: 8 })
              .at(x, 198)
              .opacity(pAlpha),
            txt(h.label, x, 178, 26, COSMOS.muted, 'mono', 'center').opacity(pAlpha),
            txt(`${h.v.toFixed(2)}`, x, 214, 30, h.col, 'mono', 'center').opacity(pAlpha),
          );
        });

        nodes.push(
          metricReadout('BEST OF LAST 3: 0.71 <= 0.72', reason, 490, 200, {
            color: ROLE.fail,
            size: 36,
            sub: 'stop expanding (tune on held-out tasks)',
          }).opacity(pAlpha),
          dotItem(
            -840,
            356,
            'OTHER HARD EXITS: REPEATED STATE · TOKEN CAP · WALL-CLOCK DEADLINE',
            COSMOS.muted,
            { opacity: pAlpha },
          ),
        );

        return group(...nodes);
      },
    ),
  );
}
