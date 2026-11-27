// Scene 24: bounded-recovery - Which stop gets a second call?
// 2-act optical recovery router:
//   Act 0 (Beats 0-1): 3 outcome lanes:
//     - 120-token limit -> 1 same-schema retry (400 tokens) -> Validate reply (or Fail after 2 calls!)
//     - Refusal -> No retry -> Stop after 1 call
//     - Content filter -> No retry -> Stop after 1 call
//   Act 1 (Beat 2): Provider wire stop-reason anatomy (Responses vs Chat Completions) +
//     Unsupported schema -> Fix config vs Recoverable data error -> Bounded correction.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function boundedRecovery(s, c) {
  const act = s.value(0); // 0 = 3-row retry matrix, 1 = wire stop reasons & repair paths
  const firstLim = s.value(0);
  const lengthRetry = s.value(0);
  const compCheck = s.value(0);
  const refusalRow = s.value(0);
  const refusalStop = s.value(0);
  const filterStop = s.value(0);
  const secondLim = s.value(0);
  const secondFail = s.value(0);
  const respReason = s.value(0);
  const chatReason = s.value(0);
  const cfgRepair = s.value(0);
  const dataRepair = s.value(0);

  const header = cinemaHeader('BOUNDED RECOVERY ROUTING', 'Which stop gets', 'a second call?', {
    accent: ROLE.retry,
    size: 50,
  });

  const stageAura = aura(220, 40, 640, '#fb923c1f', '#ff6b8b16');

  // Act 0: 3-lane bounded recovery router
  const act0 = guardedDynamic(
    () => fadeOutHalf(act.value),
    (a) => {
      const fl = firstLim.value;
      const lr = lengthRetry.value;
      const cc = compCheck.value;
      const rr = refusalRow.value;
      const rs = refusalStop.value;
      const fs = filterStop.value;
      const sl = secondLim.value;
      const sf = secondFail.value;
      const nodes = [];

      nodes.push(
        txt('FIRST CALL STOP', -830, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('SECOND CALL', -195, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('FINAL ROUTE', 350, -210, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        line([-840, -178], [840, -178], { stroke: '#25355a', width: 2 }).opacity(a),
      );

      // Row 0: 120-token limit -> 400-token same-schema retry -> Validate OR Fail after 2 calls
      const y0 = -85;
      const hitTwice = sl > 0.4;
      const failedTwice = sf > 0.4;
      nodes.push(
        opticalRail(-840, y0 - 48, y0 + 48, ROLE.prefix, { opacity: a }),
        txt('120-TOKEN LIMIT', -805, y0, 38, ROLE.prefix, 'mono', 'left')
          .glow(fl > 0.3 ? 8 : 0, ROLE.prefix)
          .opacity(a),
      );

      if (lr > 0.1) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([-370, y0], [-210, y0], -16),
            hitTwice ? ROLE.retry : ROLE.fsm,
            0,
            {
              alpha: a * lr,
              width: 3.4,
              photonCount: 1,
            },
          ),
          txt(
            hitTwice ? '400-TOKEN LIMIT!' : 'RETRY: 400 TOKENS',
            -195,
            y0 - 12,
            34,
            hitTwice ? ROLE.retry : ROLE.fsm,
            'mono',
            'left',
          )
            .glow(8, hitTwice ? ROLE.retry : ROLE.fsm)
            .opacity(a * lr),
          txt('same strict schema', -195, y0 + 34, 26, COSMOS.muted, 'mono', 'left').opacity(
            a * lr,
          ),
        );
      }

      if (failedTwice) {
        nodes.push(
          beamWithPhotons(quadArcPts([215, y0], [335, y0], -16), ROLE.prune, 0, {
            alpha: a * sf,
            width: 3.4,
            photonCount: 1,
          }),
          txt('FAIL AFTER 2 CALLS', 350, y0, 36, ROLE.prune, 'mono', 'left')
            .glow(10, ROLE.prune)
            .opacity(a * sf),
        );
      } else if (cc > 0.1 && !hitTwice) {
        nodes.push(
          beamWithPhotons(quadArcPts([215, y0], [335, y0], -16), ROLE.legal, 0, {
            alpha: a * cc,
            width: 3.4,
            photonCount: 1,
          }),
          txt('PARSE & VALIDATE', 350, y0, 36, ROLE.legal, 'mono', 'left')
            .glow(9, ROLE.legal)
            .opacity(a * cc),
        );
      }

      // Row 1: Refusal -> No retry -> Stop after 1 call
      const y1 = 88;
      const r1Alpha = a * (0.25 + 0.75 * rr);
      nodes.push(
        opticalRail(-840, y1 - 44, y1 + 44, rr > 0.3 ? ROLE.prune : COSMOS.dim, {
          opacity: r1Alpha,
        }),
        txt('REFUSAL', -805, y1, 38, rr > 0.3 ? COSMOS.ink : COSMOS.dim, 'mono', 'left').opacity(
          r1Alpha,
        ),
      );
      if (rs > 0.1) {
        nodes.push(
          txt('NO RETRY', -195, y1, 34, COSMOS.muted, 'mono', 'left').opacity(a * rs),
          txt('STOP AFTER 1 CALL', 350, y1, 36, ROLE.prune, 'mono', 'left')
            .glow(9, ROLE.prune)
            .opacity(a * rs),
        );
      }

      // Row 2: Content filter -> No retry -> Stop after 1 call
      const y2 = 242;
      const r2Alpha = a * (0.25 + 0.75 * fs);
      nodes.push(
        opticalRail(-840, y2 - 44, y2 + 44, fs > 0.3 ? ROLE.prune : COSMOS.dim, {
          opacity: r2Alpha,
        }),
        txt(
          'CONTENT FILTER',
          -805,
          y2,
          38,
          fs > 0.3 ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        ).opacity(r2Alpha),
      );
      if (fs > 0.1) {
        nodes.push(
          txt('NO RETRY', -195, y2, 34, COSMOS.muted, 'mono', 'left').opacity(a * fs),
          txt('STOP AFTER 1 CALL', 350, y2, 36, ROLE.prune, 'mono', 'left')
            .glow(9, ROLE.prune)
            .opacity(a * fs),
        );
      }

      nodes.push(
        txt(
          'Only a length stop inside budget qualifies for one bounded same-schema retry',
          -840,
          375,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: Provider wire stop reasons & distinct repair paths
  const act1 = guardedDynamic(
    () => fadeInHalf(act.value),
    (a) => {
      const rr = respReason.value;
      const cr = chatReason.value;
      const cf = cfgRepair.value;
      const dr = dataRepair.value;
      const nodes = [];

      nodes.push(
        txt(
          'LOCATE THE LENGTH STOP ON THE WIRE',
          -840,
          -210,
          26,
          ROLE.prefix,
          'mono',
          'left',
        ).opacity(a),

        // Responses API
        opticalRail(-840, -145, -25, ROLE.fsm, { opacity: a }),
        txt('RESPONSES API', -805, -120, 32, ROLE.fsm, 'mono', 'left').opacity(a),
        txt(
          rr > 0.3 ? 'status: "incomplete"' : 'inspect envelope...',
          -340,
          -125,
          34,
          rr > 0.3 ? COSMOS.ink : COSMOS.dim,
          'mono',
          'left',
        ).opacity(a),
        txt(
          rr > 0.3 ? 'incomplete_details.reason: "max_output_tokens"' : '',
          -340,
          -62,
          30,
          ROLE.prefix,
          'mono',
          'left',
        )
          .glow(7, ROLE.prefix)
          .opacity(a * rr),

        // Chat Completions API
        opticalRail(-840, 20, 110, ROLE.schema, { opacity: a }),
        txt('CHAT COMPLETIONS', -805, 62, 32, ROLE.schema, 'mono', 'left').opacity(a),
        txt(
          cr > 0.3 ? 'finish_reason: "length"' : 'inspect finish_reason...',
          -340,
          62,
          34,
          cr > 0.3 ? ROLE.prefix : COSMOS.dim,
          'mono',
          'left',
        )
          .glow(cr > 0.3 ? 7 : 0, ROLE.prefix)
          .opacity(a),

        line([-840, 152], [840, 152], { stroke: '#25355a', width: 2 }).opacity(a),
      );

      // Two distinct bottom repair paths
      nodes.push(
        fsmNode(-750, 240, 44, 'CFG', {
          color: cf > 0.3 ? ROLE.prune : COSMOS.dim,
          size: 26,
          opacity: a,
        }),
        txt(
          cf > 0.3
            ? 'UNSUPPORTED SCHEMA  ->  FIX ADAPTER IN CODE'
            : 'Unsupported schema? Do not retry same payload',
          -670,
          240,
          30,
          cf > 0.3 ? ROLE.prune : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(cf > 0.3 ? 7 : 0, ROLE.prune)
          .opacity(a),

        fsmNode(-750, 345, 44, 'FIX', {
          color: dr > 0.3 ? ROLE.legal : COSMOS.dim,
          size: 26,
          opacity: a,
        }),
        txt(
          dr > 0.3
            ? 'RECOVERABLE DATA ERROR  ->  BOUNDED CORRECTION (NO BRACKET GUESSING)'
            : 'Recoverable data error? Never patch missing brackets blindly',
          -670,
          345,
          28,
          dr > 0.3 ? ROLE.legal : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(dr > 0.3 ? 7 : 0, ROLE.legal)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1);

  c.on('sg-first-limit', () => {
    s.play(firstLim.to(1, { duration: clampDur(c, c.cue('sg-first-limit').start, 0.35) }));
  });
  c.on('sg-length-retry', () => {
    s.play(lengthRetry.to(1, { duration: clampDur(c, c.cue('sg-length-retry').start, 0.4) }));
  });
  c.on('sg-complete-check', () => {
    s.play(compCheck.to(1, { duration: clampDur(c, c.cue('sg-complete-check').start, 0.4) }));
  });
  c.on('sg-refusal', () => {
    s.play(refusalRow.to(1, { duration: clampDur(c, c.cue('sg-refusal').start, 0.35) }));
  });
  c.on('sg-refusal-stop', () => {
    s.play(refusalStop.to(1, { duration: clampDur(c, c.cue('sg-refusal-stop').start, 0.35) }));
  });
  c.on('sg-filter-stop', () => {
    s.play(filterStop.to(1, { duration: clampDur(c, c.cue('sg-filter-stop').start, 0.4) }));
  });
  c.on('sg-second-limit', () => {
    s.play(secondLim.to(1, { duration: clampDur(c, c.cue('sg-second-limit').start, 0.35) }));
  });
  c.on('sg-second-length', () => {
    s.play(secondFail.to(1, { duration: clampDur(c, c.cue('sg-second-length').start, 0.4) }));
  });
  c.onBeat(2, () => {
    s.play(act.to(1, { duration: clampDur(c, c.beats[2].start, 0.4) }));
  });
  c.on('sg-responses-reason', () => {
    s.play(respReason.to(1, { duration: clampDur(c, c.cue('sg-responses-reason').start, 0.35) }));
  });
  c.on('sg-chat-reason', () => {
    s.play(chatReason.to(1, { duration: clampDur(c, c.cue('sg-chat-reason').start, 0.35) }));
  });
  c.on('sg-config-repair', () => {
    s.play(cfgRepair.to(1, { duration: clampDur(c, c.cue('sg-config-repair').start, 0.35) }));
  });
  c.on('sg-data-repair', () => {
    s.play(dataRepair.to(1, { duration: clampDur(c, c.cue('sg-data-repair').start, 0.35) }));
  });
}
