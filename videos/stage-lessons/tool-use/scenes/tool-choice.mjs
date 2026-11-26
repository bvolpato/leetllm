// Scene 8: tool-choice - Let a required call finish as an answer on a later turn
// Orbital Turn-State Controller (`auto`, `required`, `none`, `forced`) contrasting a clean
// Turn 1 (required) -> Turn 2 (auto -> answer) exit with a stuck `required` loop orbit.
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeOutHalf,
  gateNode,
  glowDot,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function toolChoice(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = turn modes & loop trap, 1 = provider envelopes, 2 = parallel_tool_calls & FT
  const reqTurnOn = s.value(0);
  const loopTrapOn = s.value(0);
  const oneCallOn = s.value(0);
  const ftLimitOn = s.value(0);

  const header = cinemaHeader(
    'GENERATION CONTROL MODES',
    'Let a required call',
    'finish as an answer',
    { accent: ROLE.proposal, size: 48 },
  );

  const stageAura = aura(240, 30, 620, '#60a5fa20', '#ffd16618');

  // Act 0: Orbital Turn-State Controller
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const p = pulse.value;
      const rq = reqTurnOn.value;
      const lp = loopTrapOn.value;
      const nodes = [];

      // Left column: 4 generation modes along rails
      const modes = [
        ['auto', 'Answer OR 1+ calls', ROLE.runtime],
        ['required', 'Demand 1+ calls', ROLE.focus],
        ['none', 'Disable all calls', COSMOS.muted],
        ['forced', 'Name exact function', ROLE.mcp],
      ];
      nodes.push(
        txt('TURN-LEVEL GENERATION MODES', -855, -210, 26, ROLE.proposal, 'mono', 'left').opacity(
          a,
        ),
      );
      modes.forEach(([m, desc, col], i) => {
        const y = -140 + i * 92;
        nodes.push(
          energyRail(-855, y - 24, y + 24, col, { opacity: a }),
          txt(m, -825, y, 30, col, 'mono', 'left').glow(5, col).opacity(a),
          txt(desc, -595, y, 26, COSMOS.ink, 'sans', 'left').opacity(a),
        );
      });

      // Right side: Two turn trajectories (top = clean exit, bottom = stuck required loop)
      // Clean exit (y = -110)
      const cleanOp = 0.4 + rq * 0.6;
      nodes.push(
        txt('CLEAN EXIT: SWITCH BACK TO AUTO', 360, -230, 26, ROLE.ok, 'mono', 'center').opacity(
          a * cleanOp,
        ),
        gateNode(60, -110, 'TURN 1', ROLE.focus, {
          radius: 48,
          sub: 'required',
          opacity: a * cleanOp,
        }),
        gateNode(360, -110, 'TOOL', ROLE.runtime, {
          radius: 48,
          sub: 'observation',
          opacity: a * cleanOp,
        }),
        gateNode(660, -110, 'TURN 2', ROLE.ok, {
          radius: 48,
          sub: 'auto -> answer',
          opacity: a * cleanOp,
          glow: 12,
        }),
        beamWithPhotons(
          [
            [118, -110],
            [302, -110],
          ],
          ROLE.focus,
          p * 1.1,
          { alpha: a * cleanOp, width: 3.4 },
        ),
        beamWithPhotons(
          [
            [418, -110],
            [602, -110],
          ],
          ROLE.ok,
          p * 1.1 + 0.4,
          { alpha: a * cleanOp, width: 3.6 },
        ),
      );

      // Loop trap (y = 235)
      const trapOp = 0.3 + lp * 0.7;
      const orbX = 185;
      const orbY = 235;
      const orbR = 72;
      const ang = p * Math.PI * 2.4;
      nodes.push(
        line([0, 45], [760, 45], { stroke: '#25355a', width: 2 }).opacity(a),
        txt('TRAP: LEAVING REQUIRED ACTIVE', 380, 95, 26, ROLE.fail, 'mono', 'center').opacity(
          a * trapOp,
        ),
        circle(orbR, { fill: null, stroke: ROLE.fail, width: 3.2, dash: [8, 8] })
          .at(orbX, orbY)
          .glow(8, ROLE.fail)
          .opacity(a * trapOp),
        glowDot(orbX + Math.cos(ang) * orbR, orbY + Math.sin(ang) * orbR, {
          radius: 7.5,
          color: ROLE.fail,
          glow: 14,
          opacity: a * trapOp,
        }),
        txt('STUCK CALL LOOP', 310, orbY - 22, 28, ROLE.fail, 'mono', 'left')
          .glow(6, ROLE.fail)
          .opacity(a * trapOp),
        txt(
          'Model cannot complete answer',
          310,
          orbY + 30,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a * trapOp),
      );

      return group(...nodes);
    },
  );

  // Act 1: Provider-Specific Envelopes (Responses vs Chat vs Claude)
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const nodes = [];

      const rows = [
        [
          'OPENAI RESPONSES',
          '{"type":"function","name":"..."}',
          'Endpoint-specific forced object',
          ROLE.proposal,
        ],
        [
          'CHAT COMPLETIONS',
          '{"type":"function","function":{"name":"..."}}',
          'Nested function wrapper',
          ROLE.runtime,
        ],
        [
          'CLAUDE MESSAGES',
          'type: auto | any | tool | none',
          'Some thinking modes reject forcing',
          ROLE.mcp,
        ],
      ];

      nodes.push(
        txt(
          'PROVIDER ENVELOPES DIFFER · PERMISSION STAYS ON HOST',
          -855,
          -210,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
      );

      rows.forEach(([prov, shape, note, col], i) => {
        const y = -110 + i * 145;
        nodes.push(
          energyRail(-855, y - 42, y + 48, col, { opacity: a }),
          txt(prov, -825, y - 22, 28, col, 'mono', 'left')
            .glow(6, col)
            .opacity(a),
          txt(shape, -825, y + 26, 26, COSMOS.ink, 'mono', 'left').opacity(a),
          beamWithPhotons(
            [
              [140, y + 2],
              [310, y + 2],
            ],
            col,
            p * 1.1 + i * 0.3,
            { alpha: a, width: 3 },
          ),
          txt(note, 340, y + 2, 26, COSMOS.muted, 'sans', 'left').opacity(a),
        );
      });

      nodes.push(
        line([-855, 325], [840, 325], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'A generation setting neither dispatches the tool nor grants permission',
          0,
          385,
          28,
          ROLE.focus,
          'serif',
          'center',
        )
          .glow(6, ROLE.focus)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 2: parallel_tool_calls: false & Fine-tuned strict-mode caveat
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const oc = oneCallOn.value;
      const ft = ftLimitOn.value;
      const nodes = [];

      // Left channel: parallel_tool_calls: false
      nodes.push(
        energyRail(-855, -185, 65, ROLE.proposal, { opacity: a }),
        txt('parallel_tool_calls: false', -825, -165, 32, ROLE.proposal, 'mono', 'left')
          .glow(6, ROLE.proposal)
          .opacity(a),
        txt(
          'Limits OpenAI generation to 0 or 1 call',
          -825,
          -100,
          28,
          ROLE.ok,
          'sans',
          'left',
        ).opacity(a * (0.4 + oc * 0.6)),
        txt(
          'Does NOT make a batch safe to execute',
          -825,
          -45,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
        txt(
          'Runtime still validates & authorizes',
          -825,
          10,
          26,
          ROLE.runtime,
          'mono',
          'left',
        ).opacity(a),
      );

      // Right channel: Fine-tuned multi-call caveat
      const ftOp = 0.35 + ft * 0.65;
      nodes.push(
        energyRail(45, -185, 65, ROLE.caution, { opacity: a * ftOp }),
        txt('FINE-TUNED MULTI-CALL CAVEAT', 75, -165, 28, ROLE.caution, 'mono', 'left').opacity(
          a * ftOp,
        ),
        txt('Multiple calls in one turn ->', 75, -100, 28, COSMOS.ink, 'sans', 'left').opacity(
          a * ftOp,
        ),
        txt('strict mode DISABLED for those calls', 75, -42, 28, ROLE.fail, 'mono', 'left')
          .glow(ft > 0.35 ? 7 : 0, ROLE.fail)
          .opacity(a * ftOp),
        txt(
          'Keep quirks inside provider adapters',
          75,
          14,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a * ftOp),
      );

      // Bottom host enforcement backbone
      const stations = [
        [-680, 'REGISTER'],
        [-340, 'PARSE'],
        [0, 'SCOPE'],
        [340, 'EXECUTE'],
        [680, 'BUDGET'],
      ];
      const bY = 265;
      nodes.push(
        txt('APPLICATION ENFORCES INDEPENDENTLY', 0, 155, 26, ROLE.ok, 'mono', 'center').opacity(a),
      );
      for (let i = 0; i < stations.length - 1; i++) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([stations[i][0] + 62, bY], [stations[i + 1][0] - 62, bY], 0),
            ROLE.ok,
            p * 1.1 + i * 0.2,
            { alpha: a, width: 3.4 },
          ),
        );
      }
      stations.forEach(([x, label]) => {
        nodes.push(gateNode(x, bY, label, ROLE.ok, { radius: 52, opacity: a, size: 26 }));
      });

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-tool-choice-1', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('tu-tool-choice-1').start, 0.25) }));
  });
  c.on('tu-choice-required-turn', () => {
    s.play(
      reqTurnOn.to(1, { duration: clampDur(c, c.cue('tu-choice-required-turn').start, 0.35) }),
    );
  });
  c.on('tu-choice-loop', () => {
    s.play(loopTrapOn.to(1, { duration: clampDur(c, c.cue('tu-choice-loop').start, 0.35) }));
  });
  c.on('tu-tool-choice-2', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('tu-tool-choice-2').start, 0.35) }));
  });
  c.on('tu-tool-choice-3', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('tu-tool-choice-3').start, 0.35) }));
  });
  c.on('tu-choice-one-call', () => {
    s.play(oneCallOn.to(1, { duration: clampDur(c, c.cue('tu-choice-one-call').start, 0.3) }));
  });
  c.on('tu-choice-ft-limit', () => {
    s.play(ftLimitOn.to(1, { duration: clampDur(c, c.cue('tu-choice-ft-limit').start, 0.35) }));
  });
}
