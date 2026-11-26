// Scene 22: sdk-envelope - Inspect the completed envelope before parsed data
// 3-act SDK wire-envelope instrument:
//   Act 0: One local RunStatusUpdate schema mapping to OpenAI Responses (text.format) &
//          Claude Messages (output_config.format).
//   Act 1: 3 sequential return-path gates (completed -> no refusal -> parsed present), with
//          provisional streaming deltas blocked behind a non-commit barrier.
//   Act 2: Hosted reasoning token budget (internal reasoning + visible final response) feeding
//          the exact same completion + local validation gate.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function sdkEnvelope(s, c) {
  const pulse = s.value(0);
  const act = s.value(0); // 0 = wire placement, 1 = 3-gate envelope, 2 = reasoning budget
  const b0Hi = s.value(0);
  const respHi = s.value(0);
  const claudeHi = s.value(0);
  const gateComp = s.value(0);
  const gateRef = s.value(0);
  const gateParsed = s.value(0);
  const noDelta = s.value(0);
  const b2Hi = s.value(0);

  const header = cinemaHeader('HOSTED SDK ENVELOPES', 'Inspect the completed', 'envelope first', {
    accent: ROLE.envelope,
    size: 50,
  });

  const stageAura = aura(220, 40, 640, '#a78bfa20', '#5ce1e618');

  // Act 0: One local Pydantic model -> Responses text.format vs Claude output_config.format
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const p = pulse.value;
      const b0 = b0Hi.value;
      const rs = respHi.value;
      const cl = claudeHi.value;
      const nodes = [];

      nodes.push(
        txt(
          'ONE LOCAL PYDANTIC SCHEMA  ->  PROVIDER WIRE PLACEMENT',
          -840,
          -210,
          26,
          ROLE.envelope,
          'mono',
          'left',
        ).opacity(a),
        fsmNode(0, -110, 74, 'SCHEMA', { color: ROLE.schema, size: 26, opacity: a }),
        txt('RunStatusUpdate', 0, -15, 28, COSMOS.ink, 'mono', 'center').opacity(a),
      );

      // Left branch: OpenAI Responses
      nodes.push(
        beamWithPhotons(
          quadArcPts([-78, -95], [-430, 80], -35),
          rs > 0.3 ? ROLE.fsm : ROLE.schema,
          p * 1.1,
          {
            alpha: a * (0.45 + 0.55 * Math.max(b0, rs)),
            width: 3.4,
          },
        ),
        opticalRail(-840, 95, 255, rs > 0.3 ? ROLE.fsm : ROLE.schema, { opacity: a }),
        txt('OPENAI RESPONSES API', -805, 115, 26, ROLE.fsm, 'mono', 'left').opacity(a),
        txt(
          rs > 0.3 ? 'text.format  (strict schema)' : 'outgoing request field...',
          -805,
          178,
          34,
          rs > 0.3 ? ROLE.fsm : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(rs > 0.3 ? 8 : 0, ROLE.fsm)
          .opacity(a),
        txt(
          'responses.parse(..., text_format=...)',
          -805,
          232,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      );

      // Right branch: Claude Messages
      nodes.push(
        beamWithPhotons(
          quadArcPts([78, -95], [430, 80], -35),
          cl > 0.3 ? ROLE.prefix : ROLE.schema,
          p * 1.1 + 0.5,
          {
            alpha: a * (0.45 + 0.55 * Math.max(b0, cl)),
            width: 3.4,
          },
        ),
        opticalRail(90, 95, 255, cl > 0.3 ? ROLE.prefix : ROLE.schema, { opacity: a }),
        txt('CLAUDE MESSAGES API', 125, 115, 26, ROLE.prefix, 'mono', 'left').opacity(a),
        txt(
          cl > 0.3 ? 'output_config.format' : 'outgoing request field...',
          125,
          178,
          34,
          cl > 0.3 ? ROLE.prefix : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(cl > 0.3 ? 8 : 0, ROLE.prefix)
          .opacity(a),
        txt('supported strict JSON subset', 125, 232, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      );

      nodes.push(
        txt(
          'Inspect the actual outgoing request payload whenever adapting across providers',
          -840,
          365,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: 3-stage envelope verification gate + provisional stream barrier
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const g1 = gateComp.value;
      const g2 = gateRef.value;
      const g3 = gateParsed.value;
      const nd = noDelta.value;
      const nodes = [];

      nodes.push(
        txt(
          'RETURN-PATH VERIFICATION ORDER',
          -840,
          -210,
          26,
          ROLE.envelope,
          'mono',
          'left',
        ).opacity(a),
      );

      const gates = [
        {
          x: -570,
          num: '1',
          name: 'COMPLETED',
          sub: 'status == completed',
          val: g1,
          col: ROLE.legal,
        },
        {
          x: 0,
          num: '2',
          name: 'NO REFUSAL',
          sub: 'inspect refusal parts',
          val: g2,
          col: ROLE.prefix,
        },
        {
          x: 570,
          num: '3',
          name: 'PARSED DATA',
          sub: 'catch parse / transport',
          val: g3,
          col: ROLE.fsm,
        },
      ];

      gates.forEach((g, idx) => {
        const lit = g.val > 0.4;
        nodes.push(
          fsmNode(g.x, -30, 82, lit ? 'PASS' : `#${g.num}`, {
            color: lit ? g.col : COSMOS.dim,
            accepting: lit,
            size: 30,
            opacity: a,
          }),
          txt(g.name, g.x, 96, 30, lit ? g.col : COSMOS.muted, 'mono', 'center').opacity(a),
          txt(g.sub, g.x, 140, 26, COSMOS.muted, 'sans', 'center').opacity(a),
        );
        if (idx < 2) {
          nodes.push(
            beamWithPhotons(
              quadArcPts([g.x + 92, -30], [gates[idx + 1].x - 92, -30], -22),
              lit ? g.col : '#2a3960',
              p * 1.1 + idx * 0.4,
              {
                alpha: a * (lit ? 0.95 : 0.35),
                width: 3.4,
                photonCount: lit ? 2 : 0,
              },
            ),
          );
        }
      });

      // Provisional streaming delta barrier
      nodes.push(
        line([-840, 220], [840, 220], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          nd > 0.35
            ? 'STREAMED DELTA: PROVISIONAL · NO EARLY COMMIT'
            : 'Separate transport errors from parse exceptions',
          -840,
          312,
          30,
          nd > 0.35 ? ROLE.prune : COSMOS.muted,
          nd > 0.35 ? 'mono' : 'serif',
          'left',
        )
          .glow(nd > 0.35 ? 8 : 0, ROLE.prune)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 2: Hosted reasoning token budget + final visible schema commit
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const p = pulse.value;
      const b2 = b2Hi.value;
      const nodes = [];

      nodes.push(
        txt(
          'HOSTED REASONING MODELS  ·  TOKEN BUDGET SPLIT',
          -840,
          -205,
          26,
          ROLE.envelope,
          'mono',
          'left',
        ).opacity(a),
      );

      // Budget ribbon: internal reasoning tokens (violet) + visible final response (emerald)
      const yBar = -35;
      nodes.push(
        rect(680, 96, { fill: '#1e1638', stroke: ROLE.envelope, width: 3, radius: 10 })
          .at(-490, yBar)
          .glow(b2 > 0.3 ? 8 : 4, ROLE.envelope)
          .opacity(a),
        txt(
          'INTERNAL REASONING TOKENS',
          -490,
          yBar - 10,
          28,
          ROLE.envelope,
          'mono',
          'center',
        ).opacity(a),
        txt(
          'unconstrained · consumes output cap',
          -490,
          yBar + 26,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),

        rect(540, 96, { fill: '#10292b', stroke: ROLE.legal, width: 3, radius: 10 })
          .at(145, yBar)
          .glow(8, ROLE.legal)
          .opacity(a),
        txt('VISIBLE FINAL JSON', 145, yBar - 10, 28, ROLE.legal, 'mono', 'center').opacity(a),
        txt('schema mask applies here', 145, yBar + 26, 26, COSMOS.muted, 'sans', 'center').opacity(
          a,
        ),

        beamWithPhotons(quadArcPts([428, yBar], [600, yBar], -20), ROLE.legal, p * 1.1, {
          alpha: a,
          width: 3.6,
        }),
        fsmNode(695, yBar, 74, 'COMMIT', {
          color: ROLE.legal,
          accepting: true,
          size: 26,
          opacity: a,
        }),

        line([-840, 145], [840, 145], { stroke: '#25355a', width: 2 }).opacity(a),
        txt(
          'ALLOW FOR REASONING TOKENS IN MAX_OUTPUT_TOKENS',
          -840,
          232,
          30,
          ROLE.prefix,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'Apply the exact same completion, refusal, and local validation checks for raw text, typed SDKs, and streams',
          -840,
          318,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);
  driftValue(s, c, pulse, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('sg-sdk-envelope-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-sdk-envelope-0').start, 0.35) }));
  });
  c.on('sg-sdk-responses', () => {
    s.play(respHi.to(1, { duration: clampDur(c, c.cue('sg-sdk-responses').start, 0.4) }));
  });
  c.on('sg-sdk-claude', () => {
    s.play(claudeHi.to(1, { duration: clampDur(c, c.cue('sg-sdk-claude').start, 0.4) }));
  });
  c.on('sg-sdk-envelope-1', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('sg-sdk-envelope-1').start, 0.4) }));
  });
  c.on('sg-sdk-completed', () => {
    s.play(gateComp.to(1, { duration: clampDur(c, c.cue('sg-sdk-completed').start, 0.35) }));
  });
  c.on('sg-sdk-refusal', () => {
    s.play(gateRef.to(1, { duration: clampDur(c, c.cue('sg-sdk-refusal').start, 0.35) }));
  });
  c.on('sg-sdk-parsed', () => {
    s.play(gateParsed.to(1, { duration: clampDur(c, c.cue('sg-sdk-parsed').start, 0.35) }));
  });
  c.on('sg-sdk-no-delta-commit', () => {
    s.play(noDelta.to(1, { duration: clampDur(c, c.cue('sg-sdk-no-delta-commit').start, 0.4) }));
  });
  c.on('sg-sdk-envelope-2', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('sg-sdk-envelope-2').start, 0.4) }));
    s.play(b2Hi.to(1, { duration: clampDur(c, c.cue('sg-sdk-envelope-2').start, 0.4) }));
  });
}
