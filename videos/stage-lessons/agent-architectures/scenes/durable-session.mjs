// Scene 31: durable-session - What reaches the next call?
// Three-plane Managed Agents architecture (Session Event Log -> Restarted Harness -> Sandbox):
// Selected active receipts (task, hours, bus timetable, op-IDs) project cleanly into next
// model context while the cancelled train stays archived in the durable event log!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  orbNode,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function durableSession(s, c) {
  const pulse = s.value(0);
  const archOn = s.value(0);
  const fetchOn = s.value(0);
  const ctxOn = s.value(0);

  const header = cinemaHeader(
    'DURABLE SESSION ARCHITECTURE',
    'What reaches the',
    'next model call?',
    {
      accent: ROLE.plan,
      size: 50,
    },
  );

  const stageAura = aura(160, 40, 620, '#60a5fa1e', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ar = archOn.value;
      const ft = fetchOn.value;
      const ct = ctxOn.value;
      const nodes = [];

      // Left column: Durable Session Event Log (4 events; cancelled train stays archived!)
      const lx = -820;
      const events = [
        { label: '1. Task (90m, 17:00)', y: -155, keep: true, col: ROLE.plan },
        { label: '2. History hours (13-18)', y: -55, keep: true, col: ROLE.ok },
        { label: '3. Cancelled train (log only)', y: 45, keep: false, col: ROLE.fail },
        { label: '4. Bus timetable (14:10)', y: 145, keep: true, col: ROLE.action },
      ];

      nodes.push(txt('SESSION EVENT LOG', lx, -220, 26, ROLE.host, 'mono', 'left'));
      const harPt = [90, -10];
      const modPt = [610, -125];
      const boxPt = [610, 120];

      events.forEach((ev, i) => {
        nodes.push(
          txt(ev.label, lx, ev.y, 26, ev.keep ? ev.col : COSMOS.dim, 'mono', 'left').opacity(
            ev.keep ? 1 : 0.55,
          ),
        );
        if (ev.keep) {
          nodes.push(
            beamWithPhotons(
              quadArcPts([-340, ev.y], [harPt[0] - 78, harPt[1]], (i - 1.5) * 16),
              ev.col,
              p * 1.1 + i * 0.25,
              {
                alpha: 0.4 + ft * 0.6,
                width: 3.2,
              },
            ),
          );
        }
      });

      // Center: Restarted Harness
      nodes.push(
        orbNode(harPt[0], harPt[1], 'HARNESS', ROLE.policy, {
          radius: 70,
          sub: ft > 0.35 ? 'Fetches session log' : 'Model loop + budget',
        }),
        // Harness -> Model Context (selected events only!)
        beamWithPhotons(
          quadArcPts([harPt[0] + 76, harPt[1] - 20], [modPt[0] - 68, modPt[1]], -22),
          ROLE.ok,
          p * 1.1 + 0.3,
          {
            alpha: 0.4 + ct * 0.6,
            width: 3.6,
          },
        ),
        orbNode(modPt[0], modPt[1], 'CONTEXT', ROLE.ok, {
          radius: 60,
          sub: 'Selected events only',
          opacity: 0.45 + ct * 0.55,
        }),
        // Harness -> Sandbox (tools + credentials kept inside service!)
        beamWithPhotons(
          quadArcPts([harPt[0] + 76, harPt[1] + 25], [boxPt[0] - 68, boxPt[1]], 22),
          ROLE.action,
          p * 1.1 + 0.7,
          {
            alpha: 0.35 + ar * 0.65,
            width: 3.4,
          },
        ),
        orbNode(boxPt[0], boxPt[1], 'SANDBOX', ROLE.action, {
          radius: 60,
          sub: 'Tools · service creds',
          opacity: 0.4 + ar * 0.6,
        }),
      );

      nodes.push(
        line([-840, 310], [840, 310], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'CARRY OVER: ALLOWED TOOLS + REMAINING BUDGET + OPEN OP-IDs · KEEP SECRETS IN SERVICE',
          0,
          368,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('aa-durable-session-0', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('aa-durable-session-0').start, 0.25) }));
  });
  c.on('aa-durable-session-1', () => {
    s.play(archOn.to(1, { duration: clampDur(c, c.cue('aa-durable-session-1').start, 0.35) }));
  });
  c.on('session-fetch', () => {
    s.play(fetchOn.to(1, { duration: clampDur(c, c.cue('session-fetch').start, 0.35) }));
  });
  c.on('session-context', () => {
    s.play(ctxOn.to(1, { duration: clampDur(c, c.cue('session-context').start, 0.35) }));
  });
}
