// Scene 4: provider-linkage - Attach each observation to its real provider call identity
// 3-Act Provider Linkage Showcase with 3D Orbiting OpenAI Responses Prisms (fc_item_1 vs status-1),
// Chat Completions + Claude Messages alignment, and Gemini Interactions thought-preserving history.
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  RELEASE_OBS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  energyRail,
  fadeInHalf,
  fadeInNodes,
  fadeOutHalf,
  fadeOutNodes,
  gateNode,
  guardedDynamic,
  hideNodes,
  orbitScene,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function providerLinkage(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = OpenAI Responses 3D, 1 = Chat + Claude, 2 = Gemini Interactions
  const callLinkOn = s.value(0);
  const wrongIdOn = s.value(0);
  const chatLinkOn = s.value(0);
  const claudeLinkOn = s.value(0);
  const geminiLinkOn = s.value(0);
  const geminiHistOn = s.value(0);

  const header = cinemaHeader(
    'PROVIDER CALL CORRELATION',
    'Attach each observation',
    'to its real call identity',
    { accent: ROLE.runtime, size: 46 },
  );

  const stageAura = aura(240, 30, 620, '#5ce1e622', '#a78bfa18');

  // 3D Rig for Act 0 (OpenAI Responses: Item Prism fc_item_1 vs Call Prism status-1 -> Output Prism)
  const rig3d = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 15.0,
    unit: 112,
    focus: [0, 0, 0.7],
  }).at(310, 35);

  rig3d.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.45,
    }),
  );

  const rigBase = [
    // Proposal side: item_id prism (amber) & call_id prism (gold)
    ...addBox3D(rig3d, -2.6, -1.65, 0.04, 1.45, 1.15, 0.9, ROLE.caution, ROLE.caution),
    ...addBox3D(rig3d, -2.6, 0.55, 0.04, 1.45, 1.15, 1.15, ROLE.key, ROLE.key),
    // Output prism on right (cyan)
    ...addBox3D(rig3d, 1.2, -0.65, 0.04, 1.55, 1.35, 1.1, ROLE.runtime, ROLE.runtime),
  ];

  const goodArc3d = hideNodes([
    ...addArc3D(rig3d, [-1.15, 1.12, 1.18], [1.95, 0.02, 1.16], ROLE.ok, {
      lift: 0.9,
      pulseVal: pulse,
      phaseOffset: 0.1,
      width: 3.6,
    }),
  ]);

  const badArc3d = hideNodes([
    ...addArc3D(rig3d, [-1.15, -1.08, 0.95], [1.95, 0.02, 1.16], ROLE.fail, {
      lift: 0.55,
      pulseVal: pulse,
      phaseOffset: 0.55,
      width: 3.6,
    }),
  ]);

  // Act 0 overlay: OpenAI Responses
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const cl = callLinkOn.value;
      const wi = wrongIdOn.value;
      const nodes = [];

      nodes.push(
        txt('OPENAI RESPONSES API', -855, -210, 28, ROLE.proposal, 'mono', 'left').opacity(a),
        energyRail(-855, -160, 145, ROLE.proposal, { opacity: a }),
        txt('function_call item:', -825, -145, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('name: "get_release_status"', -825, -92, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt('arguments: JSON string', -825, -42, 28, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(
          `id      : "${RELEASE_OBS.itemId}"  (item ID)`,
          -825,
          14,
          28,
          ROLE.caution,
          'mono',
          'left',
        ).opacity(a),
        txt(`call_id : "${RELEASE_OBS.callId}"   (call ID)`, -825, 68, 28, ROLE.key, 'mono', 'left')
          .glow(6, ROLE.key)
          .opacity(a),
        txt(
          'AMBER = ITEM ID   ·   GOLD = CALL ID   ·   CYAN = OUTPUT',
          310,
          -425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(a),
      );

      if (cl > 0.05) {
        nodes.push(
          txt('function_call_output -> call_id: "status-1"', -855, 215, 28, ROLE.ok, 'mono', 'left')
            .glow(7, ROLE.ok)
            .opacity(a * cl),
        );
      }
      if (wi > 0.05) {
        nodes.push(
          txt(
            'Linking to fc_item_1 -> WRONG LINK (REJECTED)',
            -855,
            285,
            28,
            ROLE.fail,
            'mono',
            'left',
          )
            .glow(7, ROLE.fail)
            .opacity(a * wi),
        );
      }

      return group(...nodes);
    },
  );

  // Act 1: Chat Completions & Claude Messages
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const ch = chatLinkOn.value;
      const cl = claudeLinkOn.value;
      const nodes = [];

      // Upper channel: OpenAI Chat Completions
      const y1 = -110;
      nodes.push(
        energyRail(-855, y1 - 65, y1 + 85, ROLE.proposal, { opacity: a }),
        txt('OPENAI CHAT COMPLETIONS', -825, y1 - 50, 28, ROLE.proposal, 'mono', 'left').opacity(a),
        txt('assistant.tool_calls[0]', -825, y1 + 4, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          'id: "status-1"  ·  function.arguments (JSON str)',
          -825,
          y1 + 54,
          26,
          ROLE.key,
          'mono',
          'left',
        ).opacity(a),
        beamWithPhotons(
          [
            [-40, y1 + 10],
            [135, y1 + 10],
          ],
          ch > 0.35 ? ROLE.ok : ROLE.proposal,
          p * 1.2,
          { alpha: a * (0.35 + ch * 0.65), width: 3.6 },
        ),
        gateNode(195, y1 + 10, 'MATCH', ch > 0.35 ? ROLE.ok : COSMOS.dim, {
          radius: 46,
          opacity: a,
        }),
        energyRail(290, y1 - 65, y1 + 85, ch > 0.35 ? ROLE.ok : '#2b3b64', { opacity: a }),
        txt('role: "tool"', 320, y1 - 40, 28, ROLE.ok, 'mono', 'left').opacity(
          a * (0.4 + ch * 0.6),
        ),
        txt('tool_call_id: "status-1"', 320, y1 + 16, 28, ROLE.key, 'mono', 'left')
          .glow(ch > 0.35 ? 6 : 0, ROLE.key)
          .opacity(a * (0.4 + ch * 0.6)),
        txt(
          'content: serialized observation',
          320,
          y1 + 66,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a * (0.4 + ch * 0.6)),
      );

      // Divider
      nodes.push(line([-855, 45], [840, 45], { stroke: '#25355a', width: 2 }).opacity(a));

      // Lower channel: Claude Messages
      const y2 = 215;
      nodes.push(
        energyRail(-855, y2 - 65, y2 + 95, ROLE.mcp, { opacity: a }),
        txt('CLAUDE MESSAGES API', -825, y2 - 50, 28, ROLE.mcp, 'mono', 'left').opacity(a),
        txt('tool_use block', -825, y2 + 4, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          'id: "toolu_01"  ·  input: { object }',
          -825,
          y2 + 54,
          26,
          ROLE.key,
          'mono',
          'left',
        ).opacity(a),
        beamWithPhotons(
          [
            [-40, y2 + 10],
            [135, y2 + 10],
          ],
          cl > 0.35 ? ROLE.ok : ROLE.mcp,
          p * 1.2 + 0.5,
          { alpha: a * (0.35 + cl * 0.65), width: 3.6 },
        ),
        gateNode(195, y2 + 10, 'ORDER', cl > 0.35 ? ROLE.ok : COSMOS.dim, {
          radius: 46,
          opacity: a,
        }),
        energyRail(290, y2 - 65, y2 + 95, cl > 0.35 ? ROLE.ok : '#2b3b64', { opacity: a }),
        txt('next role: "user"', 320, y2 - 44, 28, ROLE.ok, 'mono', 'left').opacity(
          a * (0.4 + cl * 0.6),
        ),
        txt('tool_result (tool_use_id: "toolu_01")', 320, y2 + 10, 26, ROLE.key, 'mono', 'left')
          .glow(cl > 0.35 ? 6 : 0, ROLE.key)
          .opacity(a * (0.4 + cl * 0.6)),
        txt(
          'Placed BEFORE any new user text',
          320,
          y2 + 64,
          26,
          ROLE.runtime,
          'sans',
          'left',
        ).opacity(a * (0.4 + cl * 0.6)),
      );

      return group(...nodes);
    },
  );

  // Act 2: Gemini Interactions + stateful vs stateless continuation
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const gl = geminiLinkOn.value;
      const gh = geminiHistOn.value;
      const nodes = [];

      const y = -85;
      nodes.push(
        txt('GEMINI INTERACTIONS API', -855, -210, 28, ROLE.ok, 'mono', 'left').opacity(a),
        energyRail(-855, y - 55, y + 85, ROLE.ok, { opacity: a }),
        txt('function_call step', -825, y - 35, 28, COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          'id: "step-1"  ·  arguments: { object }',
          -825,
          y + 20,
          26,
          ROLE.key,
          'mono',
          'left',
        ).opacity(a),
        beamWithPhotons(
          [
            [-140, y + 10],
            [110, y + 10],
          ],
          ROLE.ok,
          p * 1.2,
          { alpha: a * (0.4 + gl * 0.6), width: 3.6 },
        ),
        energyRail(145, y - 55, y + 85, ROLE.runtime, { opacity: a }),
        txt('function_result step', 175, y - 35, 28, ROLE.runtime, 'mono', 'left').opacity(a),
        txt('name + call_id == step.id + result blocks', 175, y + 20, 26, ROLE.key, 'mono', 'left')
          .glow(gl > 0.35 ? 6 : 0, ROLE.key)
          .opacity(a * (0.4 + gl * 0.6)),
      );

      // Stateful vs Stateless history preservation
      const hy = 185;
      nodes.push(
        line([-855, 70], [840, 70], { stroke: '#25355a', width: 2 }).opacity(a),
        energyRail(-855, hy - 45, hy + 80, ROLE.proposal, { opacity: a }),
        txt('STATEFUL CONTINUATION', -825, hy - 28, 26, ROLE.proposal, 'mono', 'left').opacity(a),
        txt('Pass previous_interaction_id', -825, hy + 28, 28, COSMOS.ink, 'mono', 'left').opacity(
          a,
        ),
        energyRail(50, hy - 45, hy + 80, gh > 0.35 ? ROLE.mcp : '#2b3b64', { opacity: a }),
        txt('STATELESS CONTINUATION', 80, hy - 28, 26, ROLE.mcp, 'mono', 'left').opacity(a),
        txt('Preserve returned steps INCLUDING thoughts', 80, hy + 28, 28, ROLE.mcp, 'sans', 'left')
          .glow(gh > 0.35 ? 6 : 0, ROLE.mcp)
          .opacity(a * (0.4 + gh * 0.6)),
        beamWithPhotons(quadArcPts([180, hy + 95], [700, hy + 95], 45), ROLE.mcp, p * 1.1, {
          alpha: a * gh,
          width: 3,
        }),
        txt(
          'Never flatten every API into one generic tool-message shape',
          0,
          375,
          30,
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

  s.add(stageAura, rig3d, header, act0, act1, act2);
  orbitScene(s, c, rig3d, { theta: -0.25, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('tu-provider-linkage-1', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('tu-provider-linkage-1').start, 0.25) }));
  });
  c.on('tu-response-call-link', () => {
    const t = c.cue('tu-response-call-link').start;
    s.play(callLinkOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, goodArc3d, 0.35);
  });
  c.on('tu-response-wrong-id', () => {
    const t = c.cue('tu-response-wrong-id').start;
    s.play(wrongIdOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, badArc3d, 0.35);
  });
  c.on('tu-provider-linkage-2', () => {
    const t = c.cue('tu-provider-linkage-2').start;
    fadeOutNodes(s, c, t, [...rigBase, ...goodArc3d, ...badArc3d, rig3d], 0.14);
    s.play(act.to(1, { duration: clampDur(c, t, 0.55) }));
  });
  c.on('tu-chat-call-link', () => {
    s.play(chatLinkOn.to(1, { duration: clampDur(c, c.cue('tu-chat-call-link').start, 0.35) }));
  });
  c.on('tu-claude-result-link', () => {
    s.play(
      claudeLinkOn.to(1, { duration: clampDur(c, c.cue('tu-claude-result-link').start, 0.35) }),
    );
  });
  c.on('tu-provider-linkage-3', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('tu-provider-linkage-3').start, 0.35) }));
  });
  c.on('tu-gemini-result-link', () => {
    s.play(
      geminiLinkOn.to(1, { duration: clampDur(c, c.cue('tu-gemini-result-link').start, 0.35) }),
    );
  });
  c.on('tu-gemini-history', () => {
    s.play(geminiHistOn.to(1, { duration: clampDur(c, c.cue('tu-gemini-history').start, 0.35) }));
  });
}
