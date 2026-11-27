// Scene 2: control-contract - Who sends the request?
// Living 3-stage dispatch pipeline (Policy -> Host Gate -> Hours Service) with an empty
// receipt slot filling via task-state return arc, plus workflow-vs-agent chooser contrast.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  orbNode,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function controlContract(s, c) {
  const pulse = s.value(0);
  const valOn = s.value(0);
  const dispOn = s.value(0);
  const codeOn = s.value(0);
  const polOn = s.value(0);
  const stateOn = s.value(0);

  const header = cinemaHeader('THE CONTROL BOUNDARY', 'Who actually sends', 'the tool request?', {
    accent: ROLE.host,
    size: 50,
  });

  const stageAura = aura(120, 40, 620, '#60a5fa1e', '#a78bfa18');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const vl = valOn.value;
      const ds = dispOn.value;
      const cd = codeOn.value;
      const pl = polOn.value;
      const st = stateOn.value;
      const nodes = [];

      const pPt = [-580, 10];
      const hPt = [0, 10];
      const sPt = [580, 10];

      // Forward conduits
      nodes.push(
        beamWithPhotons(
          [
            [pPt[0] + 76, pPt[1]],
            [hPt[0] - 80, hPt[1]],
          ],
          ROLE.policy,
          p * 1.1,
          { width: 3.6 },
        ),
        beamWithPhotons(
          [
            [hPt[0] + 80, hPt[1]],
            [sPt[0] - 76, sPt[1]],
          ],
          ds > 0.3 ? ROLE.action : '#2d3f6b',
          p * 1.1 + 0.4,
          { alpha: 0.35 + ds * 0.65, width: 3.6 },
        ),
        orbNode(pPt[0], pPt[1], 'POLICY', ROLE.policy, {
          radius: 70,
          sub: 'Proposes arguments',
        }),
        orbNode(hPt[0], hPt[1], 'HOST', vl > 0.3 ? ROLE.ok : ROLE.host, {
          radius: 74,
          sub: vl > 0.3 ? 'Checks venue, date, auth' : 'Validates & dispatches',
        }),
        orbNode(sPt[0], sPt[1], 'HOURS', ds > 0.3 ? ROLE.action : COSMOS.dim, {
          radius: 70,
          sub: st > 0.3 ? 'Receipt saved in state' : 'Receipt slot: [empty]',
        }),
      );

      // Return state arc cleanly below node sub labels
      if (st > 0.05) {
        const retArc = quadArcPts([sPt[0] - 20, 175], [pPt[0] + 20, 175], 70);
        nodes.push(
          beamWithPhotons(retArc, ROLE.ok, p * 1.2, { alpha: st, width: 3.6 }),
          txt(
            'TASK STATE: REQUEST + RESULT (ENOUGH TO CHOOSE AGAIN)',
            0,
            275,
            26,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(6, ROLE.ok)
            .opacity(st),
        );
      }

      // Workflow vs Agent chooser contrast at bottom
      if (cd > 0.05 || pl > 0.05) {
        nodes.push(
          line([-840, 325], [840, 325], { stroke: '#25355a', width: 2 }).opacity(0.65),
          txt(
            'WORKFLOW: code chooses next branch',
            -440,
            378,
            28,
            ROLE.host,
            'mono',
            'center',
          ).opacity(cd),
          txt('AGENT: model chooses next tool/work', 440, 378, 28, ROLE.policy, 'mono', 'center')
            .glow(6, ROLE.policy)
            .opacity(pl),
        );
      } else {
        nodes.push(
          txt(
            'Model proposes lookup  ·  Application code executes tool',
            0,
            365,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('control-propose', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('control-propose').start, 0.25) }));
  });
  c.on('control-validate', () => {
    s.play(valOn.to(1, { duration: clampDur(c, c.cue('control-validate').start, 0.35) }));
  });
  c.on('control-dispatch', () => {
    s.play(dispOn.to(1, { duration: clampDur(c, c.cue('control-dispatch').start, 0.35) }));
  });
  c.on('control-code', () => {
    s.play(codeOn.to(1, { duration: clampDur(c, c.cue('control-code').start, 0.35) }));
  });
  c.on('control-policy', () => {
    s.play(polOn.to(1, { duration: clampDur(c, c.cue('control-policy').start, 0.35) }));
  });
  c.on('control-state', () => {
    s.play(stateOn.to(1, { duration: clampDur(c, c.cue('control-state').start, 0.4) }));
  });
}
