// Scene 34: speculative-contract - Count the whole draft cycle under the target generation rule
// Glowing draft-vs-target verification pipeline using greedyPrefixExample(['The','deploy','is','safe'], ['The','deploy','was','blocked']):
// accepts matching prefix ('The','deploy'), commits first correction ('was'), trims rejected KV, and budgets full-cycle cost.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function speculativeContract(s, c) {
  const step = s.value(0); // 1=provisional draft, 2=greedy mismatch verify, 3=compatibility & full-cycle cost

  const header = cinemaHeader(
    'SPECULATIVE DECODING CONTRACT',
    'Count the whole cycle',
    'under target rules',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(150, 40, 660, '#5ce1e61c', '#ffd16618');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const draft = DATA.specDraft;
      const target = DATA.specTarget;
      const res = DATA.specResult; // accepted=2, correction='was'
      const verified = st >= 1.5;

      const nodes = [
        txt('PROVISIONAL DRAFT TOKENS', -840, -188, 26, ROLE.cold, 'mono', 'left'),
        txt(
          verified
            ? 'TARGET VERIFICATION: ACCEPT PREFIX + FIRST CORRECTION'
            : 'TARGET VERIFICATION PENDING',
          -840,
          242,
          26,
          verified ? ROLE.warm : COSMOS.muted,
          'mono',
          'left',
        ),
      ];

      for (let i = 0; i < draft.length; i++) {
        const cx = -610 + i * 405;
        // Upper row: Draft token
        const isAccepted = verified && i < res.accepted;
        const isMismatch = verified && i === res.accepted;
        const dCol = !verified ? ROLE.cold : isAccepted ? ROLE.warm : ROLE.expired;

        nodes.push(
          rect(325, 86, { fill: '#101e36', stroke: dCol, width: 2.6, radius: 14 })
            .at(cx, -102)
            .glow(7, dCol),
          txt(draft[i], cx, -102, 32, dCol, 'mono'),
        );

        // Verification beam between draft & target
        if (verified && i <= res.accepted) {
          const bCol = isAccepted ? ROLE.warm : ROLE.focus;
          nodes.push(
            beamWithPhotons(
              [
                [cx, -54],
                [cx, 108],
              ],
              bCol,
              0,
              { width: 3.4, glow: 9, photonCount: 1 },
            ),
            txt(isAccepted ? 'MATCH' : 'MISMATCH', cx + 82, 24, 26, bCol, 'mono'),
          );
        }

        // Lower row: Target token
        const tVal = i < 3 ? target[i] : verified ? 'discarded' : 'pending';
        const tCol = !verified
          ? COSMOS.dim
          : isAccepted
            ? ROLE.warm
            : isMismatch
              ? ROLE.focus
              : COSMOS.dim;

        nodes.push(
          rect(325, 86, {
            fill: isMismatch ? '#292110' : isAccepted ? '#0e2b25' : '#0f1628',
            stroke: tCol,
            width: 2.6,
            radius: 14,
            ...(i > res.accepted && verified ? { dash: [6, 6] } : {}),
          })
            .at(cx, 158)
            .glow(isAccepted || isMismatch ? 8 : 0, tCol),
          txt(tVal, cx, 158, 30, tCol, 'mono'),
        );
      }

      // Bottom contract callout
      if (st >= 2.5) {
        nodes.push(
          txt(
            'COMPATIBILITY: algorithm · backend · tokenizer · supported draft module',
            0,
            295,
            26,
            ROLE.active,
            'mono',
          ),
          txt(
            'Budget draft compute, rejected KV & high-occupancy interference  ·  Measure on your workload',
            0,
            378,
            26,
            ROLE.focus,
            'sans',
          ).glow(6, ROLE.focus),
        );
      } else if (verified) {
        nodes.push(
          txt(
            `Committed: [ "${res.committed.join('", "')}" ]  ·  Sampled decoding needs probability-ratio acceptance`,
            0,
            335,
            26,
            ROLE.warm,
            'mono',
          ).glow(6, ROLE.warm),
        );
      } else {
        nodes.push(
          txt(
            'Proposals are provisional, never a second trusted answer',
            0,
            335,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'ga-speculative-contract-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-greedy-mismatch', step, 2, 0.35);
  tweenOn(s, c, 'ga-speculative-contract-b1', step, 3, 0.35);
}
