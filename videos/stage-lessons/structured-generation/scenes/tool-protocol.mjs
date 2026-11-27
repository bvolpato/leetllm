// Scene 21: tool-protocol - Follow one named call and its returned result
// Animated circular request -> host gate -> CI observation -> dashboard record loop!
// Model proposes get_run_status("RUN-842") -> Host verifies argument schema & project-alpha
// read scope -> returns failed snapshot into model's next turn -> Model emits dashboard JSON.
import { group } from 'vizmatic/stage';
import {
  CI_RUN,
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

const FINAL_RECORD = JSON.stringify({ run_id: CI_RUN.run_id, status: CI_RUN.status });

export default function toolProtocol(s, c) {
  const callOut = s.value(0);
  const hostReceive = s.value(0);
  const gateCheck = s.value(0);
  const resultBack = s.value(0);
  const nextTurn = s.value(0);
  const finalRecord = s.value(0);

  const header = cinemaHeader(
    'FUNCTION CALLING LOOP',
    'Follow one named call',
    'and its returned result',
    { accent: ROLE.fsm, size: 48 },
  );

  const stageAura = aura(180, 40, 640, '#5ce1e61f', '#6ee7b718');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const co = callOut.value;
      const hr = hostReceive.value;
      const gc = gateCheck.value;
      const rb = resultBack.value;
      const nt = nextTurn.value;
      const fr = finalRecord.value;
      const nodes = [];

      const modelPos = [-540, 10];
      const hostPos = [470, 10];

      // Central circular protocol loop: Model <-> Trusted Host
      const reqArc = quadArcPts(
        [modelPos[0] + 92, modelPos[1] - 48],
        [hostPos[0] - 92, hostPos[1] - 48],
        -125,
      );
      const resArc = quadArcPts(
        [hostPos[0] - 92, hostPos[1] + 48],
        [modelPos[0] + 92, modelPos[1] + 48],
        125,
      );

      nodes.push(
        // Request beam (top)
        beamWithPhotons(reqArc, ROLE.fsm, 0, {
          alpha: 0.45 + 0.55 * Math.max(co, hr),
          width: 3.8,
        }),
        txt('get_run_status(run_id="RUN-842")', -35, -206, 32, ROLE.fsm, 'mono', 'center').glow(
          co > 0.3 ? 8 : 0,
          ROLE.fsm,
        ),
        txt(
          'strict tool schema · extra keys forbidden',
          -35,
          -162,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),

        // Left hub: Model
        fsmNode(modelPos[0], modelPos[1], 88, 'MODEL', {
          color: nt > 0.4 ? ROLE.legal : ROLE.fsm,
          accepting: fr > 0.4,
          size: 30,
        }),
        txt(
          'Next observation',
          modelPos[0],
          modelPos[1] + 128,
          26,
          rb > 0.4 ? ROLE.legal : COSMOS.dim,
          'mono',
          'center',
        ),

        // Right hub: Trusted Host
        fsmNode(hostPos[0], hostPos[1], 88, 'HOST', {
          color: gc > 0.4 ? ROLE.prefix : ROLE.schema,
          size: 30,
        }),
        txt(
          '1. Arg schema OK',
          hostPos[0] + 120,
          hostPos[1] - 42,
          26,
          hr > 0.3 ? ROLE.legal : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          '2. Read scope:',
          hostPos[0] + 120,
          hostPos[1] + 6,
          26,
          gc > 0.3 ? ROLE.prefix : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          'project-alpha',
          hostPos[0] + 120,
          hostPos[1] + 46,
          26,
          gc > 0.3 ? ROLE.prefix : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Return observation beam (bottom)
      if (rb > 0.05) {
        nodes.push(
          beamWithPhotons(resArc, ROLE.legal, 0, { alpha: rb, width: 3.8 }),
          txt('OBSERVATION:  RUN-842 -> "failed"', -35, 204, 32, ROLE.legal, 'mono', 'center')
            .glow(9, ROLE.legal)
            .opacity(rb),
        );
      } else {
        nodes.push(
          txt(
            'Host executes permitted CI lookup and returns snapshot',
            -35,
            190,
            26,
            COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      // Bottom dashboard record emission
      if (fr > 0.05) {
        nodes.push(
          opticalRail(-840, 290, 390, ROLE.legal, { opacity: fr }),
          txt(
            'FINAL STRUCTURED RECORD -> DASHBOARD',
            -805,
            308,
            26,
            ROLE.legal,
            'mono',
            'left',
          ).opacity(fr),
          txt(FINAL_RECORD, -805, 366, 40, COSMOS.ink, 'mono', 'left')
            .glow(7, ROLE.legal)
            .opacity(fr),
          txt(
            'Read grant != deploy write grant',
            270,
            366,
            28,
            ROLE.review,
            'mono',
            'left',
          ).opacity(fr),
        );
      } else {
        nodes.push(
          txt(
            'Tool call gathers live state; structured output delivers the final dashboard record',
            -840,
            358,
            28,
            COSMOS.muted,
            'serif',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);

  c.on('sg-tool-protocol-0', () => {
    s.play(callOut.to(1, { duration: clampDur(c, c.cue('sg-tool-protocol-0').start, 0.4) }));
  });
  c.on('sg-tool-protocol-1', () => {
    s.play(gateCheck.to(1, { duration: clampDur(c, c.cue('sg-tool-protocol-1').start, 0.4) }));
  });
  c.on('sg-tool-receive', () => {
    s.play(hostReceive.to(1, { duration: clampDur(c, c.cue('sg-tool-receive').start, 0.35) }));
  });
  c.on('sg-tool-result', () => {
    s.play(resultBack.to(1, { duration: clampDur(c, c.cue('sg-tool-result').start, 0.45) }));
  });
  c.on('sg-tool-protocol-2', () => {
    s.play(nextTurn.to(1, { duration: clampDur(c, c.cue('sg-tool-protocol-2').start, 0.4) }));
  });
  c.on('sg-tool-record', () => {
    s.play(finalRecord.to(1, { duration: clampDur(c, c.cue('sg-tool-record').start, 0.45) }));
  });
}
