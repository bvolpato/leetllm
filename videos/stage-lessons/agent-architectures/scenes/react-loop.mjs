// Scene 4: react-loop - One lookup, two next moves
// Dual living ReAct feedback channels: Run 1 receives OPEN -> requests journey to History;
// Run 2 sends identical request, receives CLOSED (prediction pause!) -> branches to
// find-alternative instead of wasting a train lookup.
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  nextAction,
  orbNode,
  txt,
} from '../parts.mjs';

export default function reactLoop(s, c) {
  const pulse = s.value(0);
  const routeOn = s.value(0);
  const run2On = s.value(0);
  const closedOn = s.value(0);
  const altReveal = s.value(0);
  const focusMain = s.value(0);

  const openNext = nextAction([{ status: 'open' }]);
  const closedNext = nextAction([{ status: 'closed' }]);

  const header = cinemaHeader('THE REACT FEEDBACK LOOP', 'One lookup,', 'two next moves', {
    accent: ROLE.action,
    size: 50,
  });

  const stageAura = aura(120, 40, 640, '#5ce1e61e', '#ff6b8b18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const rt = routeOn.value;
      const r2 = run2On.value;
      const cl = closedOn.value;
      const al = altReveal.value;
      const fm = focusMain.value;
      const nodes = [];

      const xReq = -620;
      const xObs = -40;
      const xAct = 560;
      const y1 = -95;
      const y2 = 185;

      // Run 1 (Top: History OPEN -> check-journey)
      const a1 = fm > 0.4 ? 1 : 0.92;
      nodes.push(
        txt('RUN 1', -840, y1, 26, ROLE.ok, 'mono', 'left').opacity(a1),
        orbNode(xReq, y1, 'REQ', ROLE.host, { radius: 48, sub: 'get_hours(History)', opacity: a1 }),
        beamWithPhotons(
          [
            [xReq + 56, y1],
            [xObs - 62, y1],
          ],
          ROLE.ok,
          p * 1.1,
          { alpha: a1, width: 3.4 },
        ),
        orbNode(xObs, y1, 'OPEN', ROLE.ok, { radius: 54, sub: '13:00 - 18:00', opacity: a1 }),
        beamWithPhotons(
          [
            [xObs + 62, y1],
            [xAct - 64, y1],
          ],
          ROLE.action,
          p * 1.1 + 0.5,
          { alpha: a1 * (0.3 + rt * 0.7), width: 3.6 },
        ),
        orbNode(xAct, y1, 'NEXT', ROLE.action, {
          radius: 56,
          sub: rt > 0.3 ? `${openNext} (History)` : '...',
          opacity: a1 * (0.35 + rt * 0.65),
        }),
      );

      // Run 2 (Bottom: Same request, CLOSED -> prediction pause -> find-alternative)
      const a2 = (0.25 + r2 * 0.75) * (fm > 0.4 ? 0.45 : 1);
      nodes.push(
        txt('RUN 2', -840, y2, 26, cl > 0.3 ? ROLE.fail : COSMOS.dim, 'mono', 'left').opacity(a2),
        orbNode(xReq, y2, 'REQ', ROLE.host, { radius: 48, sub: 'get_hours(History)', opacity: a2 }),
        beamWithPhotons(
          [
            [xReq + 56, y2],
            [xObs - 62, y2],
          ],
          cl > 0.3 ? ROLE.fail : '#31426b',
          p * 1.1 + 0.25,
          { alpha: a2, width: 3.4 },
        ),
        orbNode(xObs, y2, cl > 0.3 ? 'CLOSED' : '?', cl > 0.3 ? ROLE.fail : COSMOS.dim, {
          radius: 54,
          sub: cl > 0.3 ? 'closed all day' : 'same lookup',
          opacity: a2,
        }),
        beamWithPhotons(
          [
            [xObs + 62, y2],
            [xAct - 64, y2],
          ],
          al > 0.3 ? ROLE.focus : '#31426b',
          p * 1.1 + 0.75,
          { alpha: a2 * (al > 0.3 ? 1 : 0.45), width: 3.6 },
        ),
        orbNode(xAct, y2, al > 0.3 ? 'ALT' : '?', al > 0.3 ? ROLE.focus : ROLE.focus, {
          radius: 56,
          sub: al > 0.3 ? `${closedNext}` : 'Spend lookup on train?',
          opacity: a2,
        }),
      );

      // Bottom status line
      nodes.push(
        txt(
          al > 0.4
            ? 'ONE CHANGED OBSERVATION -> DIFFERENT NEXT ACTION  ·  FOLLOWING RUN 1'
            : cl > 0.4
              ? 'Would you spend the next lookup on a train to History?'
              : 'Choose lookup -> Host runs tool -> Observation drives next choice',
          0,
          375,
          28,
          al > 0.4 ? ROLE.ok : cl > 0.4 ? ROLE.focus : COSMOS.muted,
          al > 0.4 ? 'mono' : 'serif',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('loop-open', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('loop-open').start, 0.25) }));
  });
  c.on('loop-route', () => {
    s.play(routeOn.to(1, { duration: clampDur(c, c.cue('loop-route').start, 0.35) }));
  });
  c.on('loop-other', () => {
    s.play(run2On.to(1, { duration: clampDur(c, c.cue('loop-other').start, 0.35) }));
  });
  c.on('loop-closed', () => {
    s.play(closedOn.to(1, { duration: clampDur(c, c.cue('loop-closed').start, 0.35) }));
  });
  c.on('loop-question', () => {
    s.play(closedOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('loop-alternative', () => {
    s.play(altReveal.to(1, { duration: clampDur(c, c.cue('loop-alternative').end, 0.35) }));
  });
  c.on('loop-main', () => {
    s.play(focusMain.to(1, { duration: clampDur(c, c.cue('loop-main').start, 0.35) }));
  });
}
