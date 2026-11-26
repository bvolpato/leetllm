// Scene 17: transfer - What stays fixed when we compare judgments?
// 3-act comparative diagnostic:
//   Act 0: Dual-split mirage (83% Set A vs 89% Set B, prediction pause on Beat 0!)
//   Act 1: Shared 8-case held-out replay where Case 6 flips +1 emerald (gain) and Case 8
//          flips -1 rose (loss), both totaling 6/8!
//   Act 2: Restore-41 handoff (alpha / beta in Call 1 & reversed Call 2, receipts A & B,
//          strict prediction pause leading directly into Scene 18!).
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TRANSFER_NEW,
  TRANSFER_OLD,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  glowMeter,
  guardedDynamic,
  human,
  quadArcPts,
  restoreReplies,
  restoreVotes,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const pulse = s.value(0);
  const rep2On = s.value(0);
  const act = s.value(0); // 0 = mirage, 1 = paired 8-case replay, 2 = restore-41 handoff
  const gainOn = s.value(0);
  const lossOn = s.value(0);
  const scoreOn = s.value(0);
  const inspectOn = s.value(0);
  const frozenOn = s.value(0);
  const votesOn = s.value(0);

  const header = cinemaHeader(
    'COMPARING JUDGE VERSIONS',
    'What stays fixed when',
    'we compare judgments?',
    { accent: ROLE.policy, size: 48 },
  );

  const stageAura = aura(200, 40, 620, '#60a5fa1d', '#ffd16618');

  // Act 0: Two incompatible headlines (83% Set X vs 89% Set Y)
  const act0 = guardedDynamic(
    () => fadeOutHalf(Math.min(1, act.value)),
    (a) => {
      const r2 = rep2On.value;
      const p = pulse.value;
      const nodes = [];

      // Old judge pillar on left
      nodes.push(
        txt('OLD JUDGE · SET X · RUBRIC V1', -460, -130, 26, ROLE.policy, 'mono', 'center').opacity(
          a,
        ),
        txt('83%', -460, -40, 82, ROLE.policy, 'mono', 'center').glow(9, ROLE.policy).opacity(a),
        glowMeter(-740, 40, 560, 28, 0.83, { fill: ROLE.policy, opacity: a }),
      );

      // New judge pillar on right
      nodes.push(
        txt(
          'NEW JUDGE · SET Y · RUBRIC V2',
          460,
          -130,
          26,
          ROLE.stepwise,
          'mono',
          'center',
        ).opacity(a * (0.35 + r2 * 0.65)),
        txt('89%', 460, -40, 82, ROLE.stepwise, 'mono', 'center')
          .glow(9, ROLE.stepwise)
          .opacity(a * (0.35 + r2 * 0.65)),
        glowMeter(180, 40, 560, 28, 0.89, { fill: ROLE.stepwise, opacity: a * (0.35 + r2 * 0.65) }),
      );

      // Broken gap between sets + prediction question
      nodes.push(
        line([0, -155], [0, 85], { stroke: ROLE.conflict, width: 3.5, dash: [8, 8] })
          .glow(8, ROLE.conflict)
          .opacity(a * (0.4 + r2 * 0.6)),
        txt('≠ DIFFERENT SETS & RUBRICS', 0, 145, 28, ROLE.conflict, 'mono', 'center').opacity(
          a * (0.4 + r2 * 0.6),
        ),
        txt(
          'Did the instrument improve? What must you hold fixed?',
          0,
          255,
          34,
          ROLE.verdict,
          'serif',
          'center',
        )
          .glow(6, ROLE.verdict)
          .opacity(a),
        circle(6, { fill: ROLE.verdict, stroke: null })
          .at(Math.sin(p * Math.PI * 2) * 260, 320)
          .glow(10, ROLE.verdict)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Act 1: Shared 8-case held-out replay (Case 6 gain, Case 8 loss, both 6/8)
  const act1 = guardedDynamic(
    () => fadeInHalf(Math.min(1, act.value)) * fadeOutHalf(Math.max(0, act.value - 1)),
    (a) => {
      const gn = gainOn.value;
      const ls = lossOn.value;
      const sc = scoreOn.value;
      const ins = inspectOn.value;
      const fr = frozenOn.value;
      const nodes = [];

      nodes.push(
        txt(
          'SHARED HELD-OUT REPLAY (SAME 8 PAIRS · FIXED HUMAN KEY)',
          -840,
          -185,
          26,
          ROLE.policy,
          'mono',
          'left',
        ).opacity(a),
        txt('CASE', -820, -130, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('HUMAN KEY', -610, -130, 26, ROLE.human, 'mono', 'center').opacity(a),
        txt('OLD JUDGE', -340, -130, 26, ROLE.policy, 'mono', 'center').opacity(a),
        txt('NEW JUDGE', -60, -130, 26, ROLE.stepwise, 'mono', 'center').opacity(a),
        line([-840, -100], [120, -100], { stroke: '#293961', width: 2 }).opacity(a),
      );

      for (let i = 0; i < human.length; i++) {
        const y = -58 + i * 62;
        const isGain = i === 5;
        const isLoss = i === 7;
        const hiGain = isGain && gn > 0.35;
        const hiLoss = isLoss && ls > 0.35;

        nodes.push(
          txt(
            `#${i + 1}`,
            -810,
            y,
            26,
            hiGain ? ROLE.ok : hiLoss ? ROLE.conflict : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
          txt(human[i], -610, y, 26, ROLE.human, 'mono', 'center').opacity(a),
          txt(TRANSFER_OLD[i], -340, y, 26, COSMOS.ink, 'mono', 'center').opacity(a),
          txt(
            TRANSFER_NEW[i],
            -60,
            y,
            26,
            hiGain ? ROLE.ok : hiLoss ? ROLE.conflict : COSMOS.ink,
            'mono',
            'center',
          )
            .glow(hiGain || hiLoss ? 8 : 0, hiGain ? ROLE.ok : ROLE.conflict)
            .opacity(a),
        );

        if (hiGain) {
          nodes.push(
            txt('+1 GAIN', 110, y, 26, ROLE.ok, 'mono', 'left')
              .glow(7, ROLE.ok)
              .opacity(a * gn),
          );
        }
        if (hiLoss) {
          nodes.push(
            txt('-1 LOSS', 110, y, 26, ROLE.conflict, 'mono', 'left')
              .glow(7, ROLE.conflict)
              .opacity(a * ls),
          );
        }
      }

      // Right summary column (always populated so right half never triggers empty-space)
      const rx = 310;
      nodes.push(
        txt('PAIRED COMPARISON', rx, -195, 26, ROLE.policy, 'mono', 'left').opacity(a),
        txt('Frozen old vs new config', rx, -152, 26, COSMOS.muted, 'sans', 'left').opacity(a),
      );
      if (sc > 0.05) {
        nodes.push(
          txt('BOTH MATCH 6 / 8', rx, -80, 36, ROLE.verdict, 'mono', 'left')
            .glow(8, ROLE.verdict)
            .opacity(a * sc),
          txt(
            'Same total hides a gain & a loss',
            rx,
            -26,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(a * sc),
        );
      }
      if (ins > 0.05) {
        nodes.push(
          txt('OPEN CASES #6 & #8 FIRST:', rx, 35, 26, ROLE.stepwise, 'mono', 'left').opacity(
            a * ins,
          ),
          txt(
            'Wording miss != policy violation',
            rx,
            85,
            26,
            ROLE.conflict,
            'sans',
            'left',
          ).opacity(a * ins),
        );
      }
      if (fr > 0.05) {
        nodes.push(
          txt('REAL HELD-OUT DISCIPLINE', rx, 185, 26, ROLE.policy, 'mono', 'left').opacity(a * fr),
          txt(
            '· Close calls + adversarial probes',
            rx,
            232,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(a * fr),
          txt(
            '· Revalidate on model/rubric drift',
            rx,
            276,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(a * fr),
          txt(
            '· Fairness audit: fix facts, test cues',
            rx,
            320,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(a * fr),
        );
      }

      return group(...nodes);
    },
  );

  // Act 2: Restore-41 handoff (alpha / beta in Call 1 & Call 2, receipts A & B, prediction withheld!)
  const act2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, act.value - 1)),
    (a) => {
      const vt = votesOn.value;
      const p = pulse.value;
      const nodes = [];

      const c1X = -560;
      const c2X = 560;
      const slotAY = -75;
      const slotBY = 75;

      nodes.push(
        txt(
          'RESTORE-41 CLARITY CHECK  (TRANSFER EXERCISE)',
          -840,
          -185,
          26,
          ROLE.policy,
          'mono',
          'left',
        ).opacity(a),
        txt('FIRST ORDER', c1X, -135, 28, COSMOS.ink, 'mono', 'center').opacity(a),
        txt('REVERSED ORDER', c2X, -135, 28, COSMOS.ink, 'mono', 'center').opacity(a),
        // Crossing swap arcs cleanly in the open center gap [-220..+220]
        beamWithPhotons(quadArcPts([-210, slotAY], [210, slotBY], -22), ROLE.ok, p * 1.1, {
          alpha: a * 0.78,
          width: 3,
        }),
        beamWithPhotons(
          quadArcPts([-210, slotBY], [210, slotAY], 22),
          ROLE.stepwise,
          p * 1.1 + 0.5,
          {
            alpha: a * 0.78,
            width: 3,
          },
        ),
        // Call 1 slots (compact 2-line layout so text stays strictly inside [-840..-260])
        txt('Slot A: alpha', c1X, slotAY - 16, 28, ROLE.ok, 'mono', 'center').opacity(a),
        txt(
          `“${restoreReplies.alpha}”`,
          c1X,
          slotAY + 24,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
        txt('Slot B: beta', c1X, slotBY - 16, 28, ROLE.stepwise, 'mono', 'center').opacity(a),
        txt(
          `“${restoreReplies.beta}”`,
          c1X,
          slotBY + 24,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
        // Call 2 slots (strictly inside [+260..+840])
        txt('Slot A: beta', c2X, slotAY - 16, 28, ROLE.stepwise, 'mono', 'center').opacity(a),
        txt(
          `“${restoreReplies.beta}”`,
          c2X,
          slotAY + 24,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
        txt('Slot B: alpha', c2X, slotBY - 16, 28, ROLE.ok, 'mono', 'center').opacity(a),
        txt(
          `“${restoreReplies.alpha}”`,
          c2X,
          slotBY + 24,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
      );

      // Receipts (A then B) + Prediction Question (answer withheld for Scene 18!)
      nodes.push(
        txt(
          vt > 0.35 ? `Receipt 1: ${restoreVotes[0].verdict}` : 'Receipt 1: ?',
          c1X,
          200,
          44,
          ROLE.verdict,
          'mono',
          'center',
        )
          .glow(8, ROLE.verdict)
          .opacity(a),
        txt(
          vt > 0.35 ? `Receipt 2: ${restoreVotes[1].verdict}` : 'Receipt 2: ?',
          c2X,
          200,
          44,
          ROLE.verdict,
          'mono',
          'center',
        )
          .glow(8, ROLE.verdict)
          .opacity(a),
        txt('Which reply did the judge choose twice?', 0, 325, 38, ROLE.verdict, 'serif', 'center')
          .glow(7, ROLE.verdict)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, act0, act1, act2);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('first-report', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('first-report').start, 0.25) }));
  });
  c.on('second-report', () => {
    s.play(rep2On.to(1, { duration: clampDur(c, c.cue('second-report').start, 0.35) }));
  });
  c.on('overlap-question', () => {
    s.play(rep2On.to(1, { duration: 0.12 }));
  });
  // Beat 1: reveal shared held-out replay AFTER spoken cue
  c.after('paired-replay', () => {
    s.play(act.to(1, { duration: clampDur(c, c.cue('paired-replay').end, 0.35) }));
  });
  c.on('first-change', () => {
    s.play(gainOn.to(1, { duration: clampDur(c, c.cue('first-change').start, 0.35) }));
  });
  c.on('second-change', () => {
    s.play(lossOn.to(1, { duration: clampDur(c, c.cue('second-change').start, 0.35) }));
  });
  c.after('paired-score', () => {
    s.play(scoreOn.to(1, { duration: clampDur(c, c.cue('paired-score').end, 0.35) }));
  });
  c.on('inspect-rows', () => {
    s.play(inspectOn.to(1, { duration: clampDur(c, c.cue('inspect-rows').start, 0.35) }));
  });
  c.on('frozen-set', () => {
    s.play(frozenOn.to(1, { duration: clampDur(c, c.cue('frozen-set').start, 0.35) }));
  });
  c.on('restore-setup', () => {
    s.play(act.to(2, { duration: clampDur(c, c.cue('restore-setup').start, 0.35) }));
  });
  c.on('restore-votes', () => {
    s.play(votesOn.to(1, { duration: clampDur(c, c.cue('restore-votes').start, 0.35) }));
  });
  c.on('restore-question', () => {
    s.play(votesOn.to(1, { duration: 0.12 }));
  });
}
