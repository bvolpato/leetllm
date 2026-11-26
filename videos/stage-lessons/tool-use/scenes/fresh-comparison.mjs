// Scene 28: fresh-comparison - Which release scored higher on Q1?
// Finale Synthesis: 2x2 Suite/Release Optical Matrix (Q1/Q2 x A/B) paired with a live
// Read-Only Session Promotion Circuit Breaker.
// Strict prediction withholding on BOTH:
//   1. Which release & suite to fetch next (Beat 0 -> Beat 1: B on Q1, +0.03)
//   2. Can read-only session send shape-valid promote A? (Beat 2 -> Beat 3: NO, stops at role check, 0 effects!)
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_COMPARE_GOOD,
  FRESH_DATA,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  driftValue,
  energyRail,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function freshComparison(s, c) {
  const pulse = s.value(0);
  const aOn = s.value(0);
  const bQ2On = s.value(0);
  const askReadOn = s.value(0);
  const suiteGapReveal = s.value(0);
  const repairReadOn = s.value(0);
  const newScoreReveal = s.value(0);
  const subtractOn = s.value(0);
  const deltaReveal = s.value(0);
  const promoPropOn = s.value(0);
  const denyExtraReveal = s.value(0);
  const removeExtraOn = s.value(0);
  const askWriteOn = s.value(0);
  const denyRoleReveal = s.value(0);
  const reportSweepOn = s.value(0);

  const deltaStr = `+${FRESH_COMPARE_GOOD.delta.toFixed(2)}`;

  const header = cinemaHeader(
    'FINAL DESK SYNTHESIS',
    'Which release scored',
    'higher on suite Q1?',
    { accent: ROLE.ok, size: 48 },
  );

  const stageAura = aura(100, 40, 640, '#6ee7b71e', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const aV = aOn.value;
      const b2 = bQ2On.value;
      const aq = askReadOn.value;
      const sg = suiteGapReveal.value;
      const rr = repairReadOn.value;
      const ns = newScoreReveal.value;
      const sb = subtractOn.value;
      const dl = deltaReveal.value;
      const pp = promoPropOn.value;
      const de = denyExtraReveal.value;
      const re = removeExtraOn.value;
      const aw = askWriteOn.value;
      const dr = denyRoleReveal.value;
      const rp = reportSweepOn.value;
      const nodes = [];

      // LEFT HALF: 2x2 Suite/Release Optical Matrix (x: -855..135)
      const colA = -540;
      const colB = -100;
      const rowQ1 = -85;
      const rowQ2 = 115;

      nodes.push(
        txt('RELEASE A', colA, -190, 28, ROLE.proposal, 'mono', 'center'),
        txt('RELEASE B', colB, -190, 28, ROLE.runtime, 'mono', 'center'),
        txt('Q1', -820, rowQ1, 34, ROLE.ok, 'mono', 'center'),
        txt('Q2', -820, rowQ2, 34, COSMOS.muted, 'mono', 'center'),
        line([-760, 15], [140, 15], { stroke: '#25355a', width: 2 }),
        line([-320, -165], [-320, 200], { stroke: '#25355a', width: 2 }),
      );

      // Cell (A, Q1): c31 = 0.86
      nodes.push(
        energyRail(colA - 180, rowQ1 - 52, rowQ1 + 52, aV > 0.35 ? ROLE.ok : '#2b3b64'),
        txt(
          aV > 0.35 ? `${FRESH_DATA.a.call_id}  ·  Q1` : 'awaiting read',
          colA - 154,
          rowQ1 - 24,
          26,
          aV > 0.35 ? ROLE.key : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          aV > 0.35 ? FRESH_DATA.a.score.toFixed(2) : '?',
          colA - 154,
          rowQ1 + 26,
          44,
          aV > 0.35 ? ROLE.ok : COSMOS.dim,
          'mono',
          'left',
        ).glow(aV > 0.35 ? 8 : 0, ROLE.ok),
      );

      // Cell (B, Q1): empty hole -> fresh authorized read c33 -> 0.83 (passed)
      const b1Col =
        ns > 0.5 ? ROLE.ok : rr > 0.35 ? ROLE.proposal : sg > 0.5 ? ROLE.caution : '#33456f';
      nodes.push(
        energyRail(colB - 180, rowQ1 - 52, rowQ1 + 52, b1Col),
        txt(
          ns > 0.5
            ? `${FRESH_DATA.bQ1.call_id}  ·  gate passed`
            : rr > 0.35
              ? `${FRESH_DATA.bQ1.call_id}  ·  reading B/Q1...`
              : sg > 0.5
                ? 'MISSING Q1 HOLE!'
                : 'EMPTY SLOT',
          colB - 154,
          rowQ1 - 24,
          26,
          b1Col,
          'mono',
          'left',
        ),
        txt(
          ns > 0.5 ? FRESH_DATA.bQ1.score.toFixed(2) : '?',
          colB - 154,
          rowQ1 + 26,
          44,
          ns > 0.5 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        ).glow(8, ns > 0.5 ? ROLE.ok : ROLE.focus),
      );

      // Cell (A, Q2): empty
      nodes.push(txt('not requested', colA, rowQ2, 26, COSMOS.dim, 'mono', 'center'));

      // Cell (B, Q2): c32 = 0.89 (different suite, left untouched!)
      nodes.push(
        energyRail(colB - 180, rowQ2 - 52, rowQ2 + 52, b2 > 0.35 ? ROLE.caution : '#2b3b64'),
        txt(
          b2 > 0.35 ? `${FRESH_DATA.bQ2.call_id}  ·  Q2 (kept)` : 'awaiting read',
          colB - 154,
          rowQ2 - 24,
          26,
          b2 > 0.35 ? ROLE.caution : COSMOS.dim,
          'mono',
          'left',
        ),
        txt(
          b2 > 0.35 ? FRESH_DATA.bQ2.score.toFixed(2) : '?',
          colB - 154,
          rowQ2 + 26,
          44,
          b2 > 0.35 ? ROLE.caution : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Q1 Comparison beam & delta readout (strictly withheld until tu-fresh-delta!)
      if (sb > 0.35 || dl > 0.5 || rp > 0.35) {
        nodes.push(
          beamWithPhotons(
            [
              [colA, rowQ1 + 78],
              [colB, rowQ1 + 78],
            ],
            ROLE.ok,
            p * 1.2,
            { alpha: 1, width: 3.8 },
          ),
        );
        if (rp > 0.35) {
          const sx = colA + (colB - colA) * ((p * 0.9) % 1);
          nodes.push(glowDot(sx, rowQ1 + 78, { radius: 9, color: '#ffffff', glow: 14 }));
        }
      }

      // Bottom-left Q1 arithmetic & status
      nodes.push(
        line([-855, 225], [140, 225], { stroke: '#25355a', width: 2 }),
        txt(
          dl > 0.5
            ? `Q1:  0.86 - 0.83 = ${deltaStr}   (A leads on Q1)`
            : ns > 0.5
              ? 'Q1:  0.86 - 0.83 = ?'
              : sg > 0.5
                ? 'Q2 cannot compare with Q1 -> read B on Q1'
                : aq > 0.35
                  ? '1 read left: Which release & suite?  ?'
                  : 'File immutable receipts by release & suite',
          -855,
          290,
          30,
          dl > 0.5 ? ROLE.ok : ROLE.focus,
          'mono',
          'left',
        ).glow(7, dl > 0.5 ? ROLE.ok : ROLE.focus),
        txt(
          rp > 0.35
            ? 'c31 -> c33 support the answer · Another app can reuse via MCP with its own perms'
            : 'Immutable receipts stay filed under their original call IDs',
          -855,
          362,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      // RIGHT HALF: Trusted Read-Only Session & Promotion Gate (x: 230..855)
      const rx = 240;
      const inPromo = pp > 0.35 || de > 0.5 || re > 0.35 || aw > 0.35 || dr > 0.5;
      const pCol = dr > 0.5 || de > 0.5 ? ROLE.denied : inPromo ? ROLE.proposal : ROLE.session;

      nodes.push(
        energyRail(rx, -205, 390, pCol),
        txt('TRUSTED SESSION', rx + 28, -185, 26, ROLE.session, 'mono', 'left'),
        txt('role: evaluation_reader', rx + 28, -132, 28, ROLE.focus, 'mono', 'left'),
        txt('can_promote: false', rx + 28, -82, 26, ROLE.denied, 'mono', 'left'),
        line([rx + 28, -32], [840, -32], { stroke: '#25355a', width: 2 }),
      );

      if (!inPromo) {
        nodes.push(
          txt('READ DESK STATUS', rx + 28, 22, 26, ROLE.runtime, 'mono', 'left'),
          txt(
            ns > 0.5
              ? 'Filed c33 (B / Q1)'
              : rr > 0.35
                ? 'Dispatching B on Q1'
                : '1 read available',
            rx + 28,
            82,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
          txt('Authorized for A & B evals', rx + 28, 144, 26, COSMOS.muted, 'sans', 'left'),
        );
      } else {
        const cleaned = re > 0.35 || aw > 0.35 || dr > 0.5;
        nodes.push(
          txt('PROMOTE PROPOSAL (A)', rx + 28, 16, 26, ROLE.proposal, 'mono', 'left'),
          txt(
            cleaned ? '{release_id: "A"}' : '{release_id: "A", approved: true}',
            rx + 28,
            72,
            26,
            cleaned ? ROLE.ok : ROLE.caution,
            'mono',
            'left',
          ),
          circuitBreaker(
            rx + 185,
            182,
            115,
            dr > 0.5 || (de > 0.5 && !cleaned) ? 1 : 0.25,
            ROLE.ok,
          ),
          txt(
            dr > 0.5
              ? 'BLOCKED AT ROLE CHECK!'
              : aw > 0.35
                ? 'CAN HOST SEND WRITE?  ?'
                : cleaned
                  ? 'Shape valid · Checking role...'
                  : de > 0.5
                    ? 'EXTRA FIELD REJECTED!'
                    : 'Validating shape...',
            rx + 28,
            258,
            28,
            dr > 0.5 || (de > 0.5 && !cleaned) ? ROLE.denied : ROLE.focus,
            'mono',
            'left',
          ).glow(7, dr > 0.5 || (de > 0.5 && !cleaned) ? ROLE.denied : ROLE.focus),
          txt(
            dr > 0.5
              ? 'PROMOTION COUNT: 0'
              : de > 0.5 && !cleaned
                ? 'Model field grants zero role'
                : 'Shape != execution authority',
            rx + 28,
            326,
            28,
            dr > 0.5 ? ROLE.ok : COSMOS.muted,
            'mono',
            'left',
          ).glow(dr > 0.5 ? 6 : 0, ROLE.ok),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('fresh-a', () => {
    s.play(aOn.to(1, { duration: clampDur(c, c.cue('fresh-a').start, 0.3) }));
  });
  c.on('fresh-b', () => {
    s.play(bQ2On.to(1, { duration: clampDur(c, c.cue('fresh-b').start, 0.3) }));
  });
  c.on('fresh-ask', () => {
    s.play(askReadOn.to(1, { duration: clampDur(c, c.cue('fresh-ask').start, 0.3) }));
  });
  // Strict prediction withholding #1: Q1 hole, fresh read, score & delta revealed AFTER cues!
  c.after('tu-fresh-suite-denial', () => {
    s.play(
      suiteGapReveal.to(1, { duration: clampDur(c, c.cue('tu-fresh-suite-denial').end, 0.3) }),
    );
  });
  c.on('tu-fresh-read-repair', () => {
    s.play(
      repairReadOn.to(1, { duration: clampDur(c, c.cue('tu-fresh-read-repair').start, 0.35) }),
    );
  });
  c.after('tu-fresh-new-score', () => {
    s.play(newScoreReveal.to(1, { duration: clampDur(c, c.cue('tu-fresh-new-score').end, 0.3) }));
  });
  c.on('fresh-subtract', () => {
    s.play(subtractOn.to(1, { duration: clampDur(c, c.cue('fresh-subtract').start, 0.3) }));
  });
  c.after('tu-fresh-delta', () => {
    s.play(deltaReveal.to(1, { duration: clampDur(c, c.cue('tu-fresh-delta').end, 0.3) }));
  });
  c.on('fresh-proposal', () => {
    s.play(promoPropOn.to(1, { duration: clampDur(c, c.cue('fresh-proposal').start, 0.3) }));
  });
  c.after('tu-fresh-deny-extra', () => {
    s.play(denyExtraReveal.to(1, { duration: clampDur(c, c.cue('tu-fresh-deny-extra').end, 0.3) }));
  });
  c.on('fresh-remove-extra', () => {
    s.play(removeExtraOn.to(1, { duration: clampDur(c, c.cue('fresh-remove-extra').start, 0.3) }));
  });
  c.on('fresh-write-question', () => {
    s.play(askWriteOn.to(1, { duration: clampDur(c, c.cue('fresh-write-question').start, 0.3) }));
  });
  // Strict prediction withholding #2: reveal role-check block AFTER fresh-deny-role!
  c.after('fresh-deny-role', () => {
    s.play(denyRoleReveal.to(1, { duration: clampDur(c, c.cue('fresh-deny-role').end, 0.3) }));
  });
  c.on('fresh-report', () => {
    s.play(reportSweepOn.to(1, { duration: clampDur(c, c.cue('fresh-report').start, 0.35) }));
  });
}
