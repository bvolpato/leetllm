// Scene 5: strict-receipt - Can this receipt enter the comparison?
// Glowing JSON decoding circuit: clean 2-field payload passes shape gate ->
// duplicate "verdict" key enters (prediction pause!) -> default decoder silently
// keeps B while strict object_pairs_hook trips rose circuit breaker (catching \u0076erdict) ->
// clean receipt's evidence claim collides with Reply B's actual first sentence.
import { circle, group, line } from 'vizmatic/stage';
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
  glowDot,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function strictReceipt(s, c) {
  const pulse = s.value(0);
  const hostOn = s.value(0);
  const fieldsOn = s.value(0);
  const validOn = s.value(0);
  const dupOn = s.value(0);
  const defaultAns = s.value(0);
  const strictReject = s.value(0);
  const unicodeOn = s.value(0);
  const providerOn = s.value(0);
  const auditMode = s.value(0); // 0 = parser circuit, 1 = evidence audit
  const checkBOn = s.value(0);
  const misquoteOn = s.value(0);

  const header = cinemaHeader(
    'STRICT RECEIPT PARSING',
    'Can this receipt enter',
    'the comparison?',
    {
      accent: ROLE.verdict,
      size: 50,
    },
  );

  const stageAura = aura(180, 40, 620, '#5ce1e61c', '#ff6b8b1a');

  // Mode 0: JSON Parsing Circuit (Beats 0-3)
  const mode0 = guardedDynamic(
    () => fadeOutHalf(auditMode.value),
    (a) => {
      const p = pulse.value;
      const hs = hostOn.value;
      const fl = fieldsOn.value;
      const vl = validOn.value;
      const dp = dupOn.value;
      const da = defaultAns.value;
      const sr = strictReject.value;
      const uc = unicodeOn.value;
      const pr = providerOn.value;
      const nodes = [];

      // Host-bound metadata rail (top left)
      nodes.push(
        txt('HOST-OWNED BINDING', -840, -175, 26, ROLE.host, 'mono', 'left').opacity(
          a * (0.4 + hs * 0.6),
        ),
        txt(
          'case_id · replies · order=(compact, stepwise)',
          -840,
          -128,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a * (0.4 + hs * 0.6)),
      );

      // Model payload token stream (mid-left)
      const pY = 10;
      nodes.push(
        line([-840, pY - 58], [-840, pY + 115], {
          stroke: dp > 0.3 ? ROLE.conflict : ROLE.stepwise,
          width: 5,
        })
          .glow(8, dp > 0.3 ? ROLE.conflict : ROLE.stepwise)
          .opacity(a),
        txt(
          'MODEL PAYLOAD (2 FIELDS ONLY)',
          -810,
          pY - 40,
          26,
          ROLE.stepwise,
          'mono',
          'left',
        ).opacity(a * (0.45 + fl * 0.55)),
      );

      if (dp < 0.35) {
        nodes.push(
          txt('{ "verdict": "B",', -810, pY + 14, 30, ROLE.verdict, 'mono', 'left').opacity(a),
          txt(
            '  "evidence": ["B leads with action."] }',
            -810,
            pY + 62,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(a),
        );
      } else if (uc < 0.35) {
        nodes.push(
          txt('{ "verdict": "A",', -810, pY + 8, 30, ROLE.conflict, 'mono', 'left')
            .glow(6, ROLE.conflict)
            .opacity(a),
          txt('  "verdict": "B",', -810, pY + 52, 30, ROLE.verdict, 'mono', 'left').opacity(a),
          txt('  "evidence": ["..."] }', -810, pY + 96, 28, COSMOS.muted, 'mono', 'left').opacity(
            a,
          ),
        );
      } else {
        nodes.push(
          txt('{ "verdict": "A",', -810, pY + 8, 30, ROLE.conflict, 'mono', 'left').opacity(a),
          txt(
            '  "\\u0076erdict": "B",   // == verdict',
            -810,
            pY + 52,
            28,
            ROLE.stepwise,
            'mono',
            'left',
          )
            .glow(6, ROLE.stepwise)
            .opacity(a),
          txt('  "evidence": ["..."] }', -810, pY + 96, 28, COSMOS.muted, 'mono', 'left').opacity(
            a,
          ),
        );
      }

      // Dual decoder conduits on the right: Top = Default Python json.loads, Bottom = Strict Hook
      const srcPt = [-45, pY + 35];
      const defGate = [225, -110];
      const strGate = [225, 155];

      nodes.push(
        beamWithPhotons(quadArcPts(srcPt, defGate, -35), ROLE.verdict, p * 1.1, {
          alpha: a * (dp > 0.3 ? 0.95 : 0.35),
          width: 3.2,
        }),
        beamWithPhotons(
          quadArcPts(srcPt, strGate, 35),
          sr > 0.3 ? ROLE.conflict : vl > 0.3 ? ROLE.ok : ROLE.stepwise,
          p * 1.1 + 0.5,
          { alpha: a, width: 3.4 },
        ),
        circle(34, { fill: '#0b1224', stroke: ROLE.verdict, width: 3.2 })
          .at(...defGate)
          .opacity(a * (dp > 0.3 ? 1 : 0.4)),
        txt(
          'DEFAULT json.loads',
          defGate[0],
          defGate[1] - 64,
          26,
          ROLE.verdict,
          'mono',
          'center',
        ).opacity(a * (dp > 0.3 ? 1 : 0.4)),
        circle(34, {
          fill: '#0b1224',
          stroke: sr > 0.3 ? ROLE.conflict : vl > 0.3 ? ROLE.ok : ROLE.stepwise,
          width: 3.4,
        })
          .at(...strGate)
          .glow(8, sr > 0.3 ? ROLE.conflict : ROLE.ok)
          .opacity(a),
        txt(
          'STRICT DECODER',
          strGate[0],
          strGate[1] - 64,
          26,
          ROLE.stepwise,
          'mono',
          'center',
        ).opacity(a),
      );

      // Status readouts to the right of gates (strictly respecting prediction withholding!)
      if (dp < 0.35 && vl > 0.05) {
        nodes.push(
          txt('SHAPE PASS  (A|B|tie|review)', 285, strGate[1], 28, ROLE.ok, 'mono', 'left')
            .glow(7, ROLE.ok)
            .opacity(a * vl),
        );
      }
      if (dp >= 0.35 && da < 0.05) {
        // Prediction pause: hide answers!
        nodes.push(
          txt('?  What does json.loads keep?', 285, defGate[1], 28, ROLE.verdict, 'serif', 'left')
            .glow(6, ROLE.verdict)
            .opacity(a),
          txt(
            '?  Safe to count as a vote?',
            285,
            strGate[1],
            28,
            ROLE.conflict,
            'serif',
            'left',
          ).opacity(a),
        );
      }
      if (da > 0.05) {
        nodes.push(
          txt('KEEPS "B" (LAST WINS · A LOST)', 285, defGate[1], 28, ROLE.verdict, 'mono', 'left')
            .glow(6, ROLE.verdict)
            .opacity(a * da),
        );
      }
      if (sr > 0.05) {
        nodes.push(
          txt('REJECTS DUPLICATE · NO VOTE', 285, strGate[1], 28, ROLE.conflict, 'mono', 'left')
            .glow(8, ROLE.conflict)
            .opacity(a * sr),
        );
      }

      // Bottom bar: provider & malformed rejections (4 bad JSON, 6 bad structured)
      if (pr > 0.05) {
        nodes.push(
          txt(
            'REJECTED: 4 BAD JSON (NaN, Inf, trailing ,)  +  6 BAD SCHEMA  ·  LOG REFUSALS SEPARATELY',
            -840,
            375,
            26,
            ROLE.host,
            'mono',
            'left',
          )
            .glow(5, ROLE.host)
            .opacity(a * pr),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: Beat 4 Evidence vs Actual Reply Audit
  const mode1 = guardedDynamic(
    () => fadeInHalf(auditMode.value),
    (a) => {
      const p = pulse.value;
      const cb = checkBOn.value;
      const mq = misquoteOn.value;
      const nodes = [];

      nodes.push(
        txt('VALID JSON != TRUE EVIDENCE', -840, -165, 28, ROLE.stepwise, 'mono', 'left').opacity(
          a,
        ),
        // Top track: Receipt claim
        line([-840, -90], [-840, 15], { stroke: ROLE.ok, width: 5 }).glow(7, ROLE.ok).opacity(a),
        txt('CLEAN RECEIPT CLAIM  (SHAPE: PASS)', -805, -72, 26, ROLE.ok, 'mono', 'left').opacity(
          a,
        ),
        txt('“B leads with the action.”', -805, -20, 34, COSMOS.ink, 'serif', 'left').opacity(a),
      );

      if (cb > 0.05) {
        nodes.push(
          // Bottom track: Actual Reply B first sentence
          line([-840, 105], [-840, 215], { stroke: ROLE.stepwise, width: 5 })
            .glow(7, ROLE.stepwise)
            .opacity(a * cb),
          txt(
            'ACTUAL REPLY B · FIRST SENTENCE',
            -805,
            122,
            26,
            ROLE.stepwise,
            'mono',
            'left',
          ).opacity(a * cb),
          txt(
            '“Payment-service has crossed its rollback threshold.”',
            -805,
            174,
            32,
            mq > 0.3 ? ROLE.conflict : COSMOS.ink,
            'serif',
            'left',
          ).opacity(a * cb),
        );
      }

      // Collision reticle on the right
      const cx = 480;
      const cy = 50;
      const col = mq > 0.3 ? ROLE.conflict : ROLE.stepwise;
      nodes.push(
        beamWithPhotons(quadArcPts([180, -25], [cx - 90, cy], -35), ROLE.ok, p * 1.1, {
          alpha: a,
          width: 3.2,
        }),
        beamWithPhotons(quadArcPts([180, 165], [cx - 90, cy], 35), col, p * 1.1 + 0.5, {
          alpha: a * (0.3 + cb * 0.7),
          width: 3.2,
        }),
        circle(84, { fill: '#0b1224', stroke: col, width: 3.8 })
          .at(cx, cy)
          .glow(10, col)
          .opacity(a),
        txt(mq > 0.3 ? 'MISQUOTE' : 'COMPARE', cx, cy, 28, col, 'mono', 'center').opacity(a),
      );

      if (mq > 0.05) {
        nodes.push(
          glowDot(cx, cy, { radius: 10, color: ROLE.conflict, glow: 16, opacity: a * mq * 0.45 }),
          txt(
            'LEADS WITH THRESHOLD WARNING  ·  VERIFY EVIDENCE AGAINST SOURCE TEXT',
            -840,
            345,
            26,
            ROLE.conflict,
            'mono',
            'left',
          )
            .glow(6, ROLE.conflict)
            .opacity(a * mq),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('host-binding', () => {
    s.play(hostOn.to(1, { duration: clampDur(c, c.cue('host-binding').start, 0.35) }));
  });
  c.on('strict-fields', () => {
    s.play(fieldsOn.to(1, { duration: clampDur(c, c.cue('strict-fields').start, 0.35) }));
  });
  c.after('valid-receipt', () => {
    s.play(validOn.to(1, { duration: clampDur(c, c.cue('valid-receipt').end, 0.35) }));
  });
  c.on('duplicate-keys', () => {
    s.play(dupOn.to(1, { duration: clampDur(c, c.cue('duplicate-keys').start, 0.35) }));
  });
  c.on('decode-question', () => {
    s.play(dupOn.to(1, { duration: 0.15 }));
  });
  // Strict prediction withholding: reveal default "B" & strict rejection AFTER spoken clauses!
  c.after('default-last-wins', () => {
    s.play(defaultAns.to(1, { duration: clampDur(c, c.cue('default-last-wins').end, 0.35) }));
  });
  c.after('strict-decode', () => {
    s.play(strictReject.to(1, { duration: clampDur(c, c.cue('strict-decode').end, 0.35) }));
  });
  c.on('decoded-name', () => {
    s.play(unicodeOn.to(1, { duration: clampDur(c, c.cue('decoded-name').start, 0.35) }));
  });
  c.on('provider-boundary', () => {
    s.play(providerOn.to(1, { duration: clampDur(c, c.cue('provider-boundary').start, 0.35) }));
  });
  c.on('audit-clean', () => {
    s.play(auditMode.to(1, { duration: clampDur(c, c.cue('audit-clean').start, 0.35) }));
  });
  c.on('check-b', () => {
    s.play(checkBOn.to(1, { duration: clampDur(c, c.cue('check-b').start, 0.35) }));
  });
  c.after('misquote', () => {
    s.play(misquoteOn.to(1, { duration: clampDur(c, c.cue('misquote').end, 0.35) }));
  });
}
