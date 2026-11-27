// Scene 5: canonical-answer-vote - Five replies to one release request
// Luminous Best-of-N / Self-Consistency majority voting constellation:
//   5 raw sampled replies canonicalize onto 5 equal denominator seats (including the
//   rejected 'force' seat!). Prediction pause at 60% threshold (3/5), revealed on
//   vote-accept, then threshold laser slides from 60% -> 80% (4/5) -> controller abstains.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FIVE_REPLY_SAMPLES,
  ROLE,
  aura,
  beamWithPhotons,
  canonicalAction,
  canonicalVote,
  cinemaHeader,
  clampDur,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

const RAW_DISPLAY = [
  '1. "Merge release"',
  '2. "merge_release"',
  '3. "Auto merge approved"',
  '4. "manual_review"',
  '5. "force"',
];

export default function canonicalAnswerVote(s, c) {
  const pulse = s.value(0);
  const threeOn = s.value(0);
  const reviewOn = s.value(0);
  const invalidOn = s.value(0);
  const floorOn = s.value(0);
  const acceptOn = s.value(0);
  const raiseOn = s.value(0);
  const abstainOn = s.value(0);
  const ruleOn = s.value(0);
  const policyOn = s.value(0);

  const header = cinemaHeader('SELF-CONSISTENCY VOTING', 'Five replies to one', 'release request', {
    accent: ROLE.vote,
    size: 48,
  });

  const stageAura = aura(150, 40, 660, '#ffd1661c', '#5ce1e618');

  const voteEq = glowTex(
    String.raw`s = \frac{1}{N}\sum_{i=1}^{N}\mathbf{1}[c(y_i)=\hat{a}] \;\ge\; \tau,\quad \tau \in (0.5,\, 1]`,
    { x: 350, y: -330, size: 32, color: ROLE.vote, glow: 8 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const th = threeOn.value;
      const rv = reviewOn.value;
      const iv = invalidOn.value;
      const fl = floorOn.value;
      const ac = acceptOn.value;
      const rs = raiseOn.value;
      const ab = abstainOn.value;
      const rl = ruleOn.value;
      const pl = policyOn.value;
      const nodes = [];

      // Upper constellation: 5 reply rows mapping to canonical actions
      const rawX = -830;
      const normX = -150;
      const seatStartX = -620;
      const seatW = 248;
      const seatY = 175;
      const seatH = 74;

      nodes.push(
        txt('SAMPLED FINAL ACTIONS', rawX, -205, 26, COSMOS.muted, 'mono', 'left'),
        txt('CANONICAL MAP', normX, -205, 26, COSMOS.muted, 'mono', 'left'),
      );

      FIVE_REPLY_SAMPLES.forEach((raw, i) => {
        const y = -148 + i * 54;
        const canon = canonicalAction(raw);
        const visible = i < 3 ? th > 0.35 : i === 3 ? rv > 0.35 : iv > 0.35;
        const col =
          canon === 'merge_release'
            ? ROLE.path
            : canon === 'manual_review'
              ? ROLE.caution
              : ROLE.fail;
        const label =
          canon === 'merge_release'
            ? 'merge_release'
            : canon === 'manual_review'
              ? 'manual_review'
              : 'REJECTED (unlisted)';

        nodes.push(
          txt(RAW_DISPLAY[i], rawX, y, 26, visible ? COSMOS.ink : COSMOS.dim, 'mono', 'left'),
        );
        if (visible) {
          nodes.push(
            beamWithPhotons(
              [
                [-345, y],
                [normX - 24, y],
              ],
              col,
              p * 1.1 + i * 0.2,
              { width: 2.6, glow: 7, photonCount: 1 },
            ),
            txt(label, normX, y, 26, col, 'mono', 'left'),
          );
        }
      });

      // Right-hand live denominator & vote count readout
      const threshold = rs > 0.5 ? 0.8 : 0.6;
      const voteRes = canonicalVote(FIVE_REPLY_SAMPLES, threshold);
      nodes.push(
        txt('DENOMINATOR', 340, -145, 26, COSMOS.muted, 'mono', 'left'),
        txt(`N = ${voteRes.total} SEATS`, 340, -92, 36, COSMOS.ink, 'mono', 'left'),
        txt(
          iv > 0.35 ? '3 merge · 1 rev · 1 bad' : 'All 5 sampled paths',
          340,
          -34,
          26,
          ROLE.path,
          'mono',
          'left',
        ),
      );

      // Five equal denominator seats bar
      nodes.push(
        txt(
          'ALL 5 SAMPLED SEATS (INCLUDING REJECTED)',
          seatStartX,
          seatY - 66,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );
      FIVE_REPLY_SAMPLES.forEach((raw, i) => {
        const canon = canonicalAction(raw);
        const filled = i < 3 ? th > 0.35 : i === 3 ? rv > 0.35 : iv > 0.35;
        const col =
          canon === 'merge_release'
            ? ROLE.path
            : canon === 'manual_review'
              ? ROLE.caution
              : ROLE.fail;
        const seatLabel =
          canon === 'merge_release' ? 'MERGE' : canon === 'manual_review' ? 'REVIEW' : 'REJECTED';
        const cx = seatStartX + i * seatW + seatW * 0.5;
        nodes.push(
          rect(seatW - 10, seatH, {
            fill: '#0d152a',
            stroke: filled ? col : '#2c3d66',
            width: filled ? 3 : 2,
            radius: 10,
          }).at(cx, seatY),
          txt(
            filled ? seatLabel : `SEAT ${i + 1}`,
            cx,
            seatY,
            26,
            filled ? col : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      });

      // Sliding golden threshold laser ticks above & below seats (never crosses seat text!)
      if (fl > 0.05) {
        const frac = 0.6 + 0.2 * rs;
        const cutX = seatStartX + seatW * 5 * frac;
        const needCount = rs > 0.5 ? 4 : 3;
        const pct = rs > 0.5 ? '80%' : '60%';
        nodes.push(
          line([cutX, seatY - 62], [cutX, seatY - 40], { stroke: ROLE.vote, width: 5 })
            .glow(10, ROLE.vote)
            .opacity(fl),
          line([cutX, seatY + 40], [cutX, seatY + 62], { stroke: ROLE.vote, width: 5 })
            .glow(10, ROLE.vote)
            .opacity(fl),
          txt(`NEED ${needCount}/5 (${pct})`, cutX, seatY + 90, 26, ROLE.vote, 'mono', 'center')
            .glow(6, ROLE.vote)
            .opacity(fl),
        );
      }

      // Verdict / prediction prompt at bottom (strictly withheld until vote-accept / vote-abstain!)
      let verdictText = 'Canonicalize final actions before tallying votes';
      let verdictCol = COSMOS.muted;
      if (pl > 0.35) {
        verdictText = 'Vote picks a candidate; policy checks still validate the release record';
        verdictCol = ROLE.ok;
      } else if (rl > 0.35) {
        verdictText = 'Unique winner + finite threshold in (0.5, 1]; ties & empty batches abstain';
        verdictCol = ROLE.service;
      } else if (ab > 0.35) {
        verdictText = '3 / 5 = 60% < 80%  ->  ABSTAIN (not manual_review!)';
        verdictCol = ROLE.caution;
      } else if (rs > 0.35) {
        verdictText = 'Threshold raised to 80% (need 4 of 5): 3 / 5 falls short...';
        verdictCol = ROLE.vote;
      } else if (ac > 0.35) {
        verdictText = 'YES: 3 / 5 = 60% MEETS THE LINE  ->  MERGE_RELEASE';
        verdictCol = ROLE.ok;
      } else if (fl > 0.35) {
        verdictText = 'Threshold is 60% support. Does merge qualify?';
        verdictCol = ROLE.vote;
      }

      nodes.push(
        txt(verdictText, 0, 365, 30, verdictCol, 'mono', 'center').glow(
          ac > 0.35 || ab > 0.35 ? 8 : 0,
          verdictCol,
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('vote-three', () => {
    s.play(threeOn.to(1, { duration: clampDur(c, c.cue('vote-three').start, 0.35) }));
  });
  c.on('vote-review', () => {
    s.play(reviewOn.to(1, { duration: clampDur(c, c.cue('vote-review').start, 0.35) }));
  });
  c.on('vote-invalid', () => {
    s.play(invalidOn.to(1, { duration: clampDur(c, c.cue('vote-invalid').start, 0.35) }));
  });
  c.on('vote-floor', () => {
    s.play(floorOn.to(1, { duration: clampDur(c, c.cue('vote-floor').start, 0.4) }));
  });
  // Strict prediction withholding: revealed only when Beat 2 announces the 60% verdict
  c.on('vote-accept', () => {
    s.play(acceptOn.to(1, { duration: clampDur(c, c.cue('vote-accept').start, 0.3) }));
  });
  c.on('vote-raise', () => {
    s.play(raiseOn.to(1, { duration: clampDur(c, c.cue('vote-raise').start, 0.5) }));
  });
  c.after('vote-abstain', () => {
    s.play(abstainOn.to(1, { duration: clampDur(c, c.cue('vote-abstain').end, 0.3) }));
  });
  c.show('vote-rule', voteEq);
  c.on('vote-rule', () => {
    s.play(ruleOn.to(1, { duration: clampDur(c, c.cue('vote-rule').start, 0.35) }));
  });
  c.on('vote-policy', () => {
    s.play(policyOn.to(1, { duration: clampDur(c, c.cue('vote-policy').start, 0.35) }));
  });
}
