// Scene 6: sampling-cost-ledger - What changes when each case gets five samples?
// Three non-overlapping stages:
//   1. Five authored cases from VOTING_CASES: glowing M/R/? orbs per row, highlighting the
//      unanimously wrong shared mistake and the weak-support abstention; 2/5 (40%, 5 samples)
//      vs 3/5 (60%, 25 samples) revealed on reason-result-sample-summary.
//   2. Wang et al. PaLM 540B GSM8K (40 paths: 56.5% greedy -> 74.4% self-consistency).
//   3. Production evaluation protocol: same held-out split, repeat stochastic trials,
//      parallel wall-time vs 5x token billing.
import { circle, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  VOTING_CASES,
  aura,
  canonicalAction,
  canonicalVote,
  cinemaHeader,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  orbNode,
  txt,
} from '../parts.mjs';

const CASE_LABELS = [
  '1. Clean approved',
  '2. Scan failed',
  '3. Review missing',
  '4. Shared mistake',
  '5. Weak support',
];

export default function samplingCostLedger(s, c) {
  const pulse = s.value(0);
  const sharedHi = s.value(0);
  const summaryOn = s.value(0);
  const stage2 = s.value(0);
  const stage3 = s.value(0);

  const header = cinemaHeader(
    'SAMPLING COST LEDGER',
    'What changes when each case',
    'gets five samples?',
    { accent: ROLE.vote, size: 46 },
  );

  const stageAura = aura(100, 40, 660, '#ffd16618', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const sh = sharedHi.value;
      const sm = summaryOn.value;
      const s2 = stage2.value;
      const s3 = stage3.value;

      const a1 = fadeOutHalf(s2);
      const a2 = fadeInHalf(s2) * fadeOutHalf(s3);
      const a3 = fadeInHalf(s3);
      const nodes = [];

      // Stage 1: 5 authored release cases
      if (a1 > 0.02) {
        nodes.push(
          txt('CASE', -840, -215, 26, COSMOS.muted, 'mono', 'left').opacity(a1),
          txt('EXPECTED', -340, -215, 26, COSMOS.muted, 'mono', 'center').opacity(a1),
          txt('FIVE SAMPLED REPLIES', 120, -215, 26, COSMOS.muted, 'mono', 'center').opacity(a1),
          txt('1ST / VOTE', 660, -215, 26, COSMOS.muted, 'mono', 'center').opacity(a1),
        );

        VOTING_CASES.forEach((vc, i) => {
          const y = -135 + i * 96;
          const firstOk = canonicalAction(vc.samples[0]) === vc.expected;
          const winner = canonicalVote(vc.samples).decision;
          const isShared = i === 3;
          const isAbstain = winner === 'abstain';
          const rowCol = isShared && sh > 0.35 ? ROLE.fail : COSMOS.ink;

          nodes.push(
            txt(CASE_LABELS[i], -840, y, 26, rowCol, 'mono', 'left').opacity(a1),
            txt(
              vc.expected === 'merge_release' ? 'MERGE' : 'REVIEW',
              -340,
              y,
              26,
              ROLE.service,
              'mono',
              'center',
            ).opacity(a1),
          );

          vc.samples.forEach((sample, j) => {
            const act = canonicalAction(sample);
            const sx = -100 + j * 110;
            const sym = act === 'merge_release' ? 'M' : act === 'manual_review' ? 'R' : '?';
            const col =
              isShared && sh > 0.35
                ? ROLE.fail
                : act === 'merge_release'
                  ? ROLE.path
                  : act === 'manual_review'
                    ? ROLE.ok
                    : ROLE.fail;
            nodes.push(
              circle(30, { fill: '#0b1224', stroke: col, width: 3 })
                .at(sx, y)
                .glow(isShared && sh > 0.35 ? 10 : 5, col)
                .opacity(a1),
              txt(sym, sx, y, 26, col, 'mono', 'center').opacity(a1),
            );
          });

          const outText = `${firstOk ? 'OK' : 'NO'} / ${
            isAbstain ? 'ABSTAIN' : winner === vc.expected ? 'OK' : 'WRONG'
          }`;
          const outCol = isAbstain ? ROLE.caution : winner === vc.expected ? ROLE.ok : ROLE.fail;
          nodes.push(txt(outText, 660, y, 26, outCol, 'mono', 'center').opacity(a1));
        });

        nodes.push(
          line([-840, 315], [840, 315], { stroke: '#25355a', width: 2 }).opacity(0.65 * a1),
          txt(
            sm > 0.35
              ? 'FIRST: 2/5 (40%, 5 SAMPLES)   ·   VOTE-5: 3/5 (60%, 25 SAMPLES, 1 ABSTAIN)'
              : 'All 5 votes can still repeat the same mistake (row 4)',
            0,
            375,
            26,
            sm > 0.35 ? ROLE.vote : ROLE.fail,
            'mono',
            'center',
          ).opacity(a1),
        );
      }

      // Stage 2: Wang et al. PaLM 540B GSM8K (40 paths)
      if (a2 > 0.02) {
        const baseY = 235;
        const maxH = 340;
        const hGreedy = (56.5 / 80) * maxH;
        const hSC = (74.4 / 80) * maxH;
        const xL = -300;
        const xR = 240;

        nodes.push(
          txt(
            'WANG ET AL. · PaLM 540B · GSM8K (40 SAMPLED PATHS)',
            0,
            -210,
            28,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(a2),
          line([-640, baseY], [640, baseY], { stroke: '#344770', width: 2.6 }).opacity(a2),
          rect(220, hGreedy, { fill: ROLE.service, stroke: '#93c5fd', width: 2, radius: 8 })
            .at(xL, baseY - hGreedy * 0.5)
            .opacity(0.9 * a2),
          txt('56.5%', xL, baseY - hGreedy - 34, 42, ROLE.service, 'mono', 'center').opacity(a2),
          txt('GREEDY CoT', xL, baseY + 46, 26, COSMOS.ink, 'mono', 'center').opacity(a2),

          rect(220, hSC, { fill: ROLE.ok, stroke: '#ffffff', width: 2, radius: 8 })
            .at(xR, baseY - hSC * 0.5)
            .glow(10, ROLE.ok)
            .opacity(0.92 * a2),
          txt('74.4%', xR, baseY - hSC - 34, 42, ROLE.ok, 'mono', 'center')
            .glow(8, ROLE.ok)
            .opacity(a2),
          txt('SELF-CONSISTENCY (40)', xR, baseY + 46, 26, ROLE.ok, 'mono', 'center').opacity(a2),

          txt(
            '3 of 5 votes is agreement, NOT a calibrated probability of correctness',
            0,
            355,
            26,
            ROLE.vote,
            'mono',
            'center',
          ).opacity(a2),
        );
      }

      // Stage 3: Production service measurement
      if (a3 > 0.02) {
        const items = [
          [-560, 'HELD-OUT', 'Same requests · repeat trials', ROLE.service],
          [0, 'FAILURES', 'Abstains · invalid · unsafe merges', ROLE.fail],
          [560, 'TOKEN BILL', 'Parallel cuts latency, not 5x tokens', ROLE.vote],
        ];
        nodes.push(
          txt(
            'PRODUCTION MEASUREMENT DISCIPLINE',
            0,
            -210,
            28,
            ROLE.path,
            'mono',
            'center',
          ).opacity(a3),
        );
        for (const [cx, label, sub, col] of items) {
          nodes.push(orbNode(cx, 10, label, col, { radius: 74, sub, opacity: a3 }));
        }
        nodes.push(
          txt(
            'Longer replies raise cost even when the sample count stays fixed',
            0,
            345,
            28,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(a3),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('sampling-cost-ledger-b1', () => {
    s.play(sharedHi.to(1, { duration: clampDur(c, c.cue('sampling-cost-ledger-b1').start, 0.35) }));
  });
  c.on('reason-result-sample-summary', () => {
    s.play(
      summaryOn.to(1, {
        duration: clampDur(c, c.cue('reason-result-sample-summary').start, 0.35),
      }),
    );
  });
  c.on('sampling-cost-ledger-b2', () => {
    s.play(stage2.to(1, { duration: clampDur(c, c.cue('sampling-cost-ledger-b2').start, 0.55) }));
  });
  c.on('sampling-cost-ledger-b3', () => {
    s.play(stage3.to(1, { duration: clampDur(c, c.cue('sampling-cost-ledger-b3').start, 0.55) }));
  });
}
