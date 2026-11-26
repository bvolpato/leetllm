// Scene 5: eligible - Two retrieval slots for Alice's question
// Prediction beat: top-2 of 4 candidates are unauthorized/stale; strictly withholds "0 usable passages"
// until `c.after('eligible-discard')`, then pre-filters eligibility and fills both slots with policy@2 & exception@1.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function eligible(s, c) {
  const pulse = s.value(0);
  const orderOn = s.value(0);
  const takeProg = s.value(0);
  const askOn = s.value(0);
  const discardProg = s.value(0);
  const filterProg = s.value(0);
  const refillProg = s.value(0);

  const header = cinemaHeader(
    'PRE-FILTER VS POST-FILTER',
    'Two retrieval slots',
    "for Alice's question",
    {
      accent: ROLE.query,
      size: 46,
    },
  );

  const stageAura = aura(120, 40, 680, '#ff6b8b18', '#6ee7b718');

  const candidates = [
    { id: 'roadmap@1', tag: 'workspace-b (other tenant)', col: ROLE.deny, ok: false },
    { id: 'policy@1', tag: 'obsolete 90-day rule', col: ROLE.deny, ok: false },
    { id: 'policy@2', tag: 'current · allowed', col: ROLE.policy, ok: true },
    { id: 'exception@1', tag: 'current · allowed', col: ROLE.exception, ok: true },
  ];

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const tk = takeProg.value;
      const ask = askOn.value > 0.5;
      const ds = discardProg.value;
      const fl = filterProg.value;
      const rf = refillProg.value;
      const nodes = [];

      nodes.push(
        txt('ALICE: workspace-a / engineering', 855, -400, 28, ROLE.query, 'mono', 'right'),
        txt('CANDIDATE ORDER INSIDE TRUSTED SERVICE', -855, -245, 26, COSMOS.muted, 'mono', 'left'),
        txt('TWO RETRIEVAL SLOTS (K = 2)', 165, -245, 26, COSMOS.ink, 'mono', 'left'),
      );

      // Left column: 4 ranked candidates
      candidates.forEach((cand, i) => {
        const y = -165 + i * 114;
        const struck = !cand.ok && fl > 0.45;
        const strokeCol = struck ? '#3b2434' : cand.col;
        const labelCol = struck ? COSMOS.dim : cand.col;
        nodes.push(
          rect(820, 86, {
            fill: '#0d1426',
            stroke: strokeCol,
            width: struck ? 1.8 : 2.6,
            radius: 12,
          })
            .at(-445, y)
            .opacity(struck ? 0.55 : 0.96),
          txt(`#${i + 1}`, -825, y, 28, COSMOS.dim, 'mono', 'left'),
          txt(cand.id, -750, y, 32, labelCol, 'mono', 'left'),
          txt(cand.tag, -50, y, 26, struck ? COSMOS.dim : COSMOS.muted, 'sans', 'right'),
        );
        if (!cand.ok && fl > 0.05) {
          const sx1 = -830;
          const sx2 = -830 + 770 * fl;
          nodes.push(
            line([sx1, y + 36], [sx2, y + 36], { stroke: ROLE.deny, width: 3.5 }).glow(
              6,
              ROLE.deny,
            ),
          );
        }
      });

      // Right column: 2 fixed retrieval slots
      const slotYs = [-115, 65];
      slotYs.forEach((sy, sIdx) => {
        const refilled = rf > 0.55;
        const emptied = ds > 0.55 && !refilled;
        const initialFilled = tk > 0.55 && !emptied && !refilled;
        const borderCol = refilled
          ? candidates[sIdx + 2].col
          : emptied
            ? ROLE.deny
            : initialFilled
              ? ROLE.deny
              : '#364a75';

        nodes.push(
          rect(690, 128, { fill: '#0c1425', stroke: borderCol, width: 3, radius: 14 })
            .at(510, sy)
            .glow(refilled || emptied ? 9 : 4, borderCol),
          txt(`SLOT ${sIdx + 1}`, 200, sy - 26, 26, COSMOS.dim, 'mono', 'left'),
        );

        if (refilled) {
          const item = candidates[sIdx + 2];
          nodes.push(
            txt(item.id, 200, sy + 22, 34, item.col, 'mono', 'left').glow(6, item.col),
            txt('ELIGIBLE', 815, sy + 22, 26, ROLE.ok, 'mono', 'right'),
          );
        } else if (emptied) {
          nodes.push(txt('EMPTY  (discarded)', 200, sy + 22, 32, ROLE.deny, 'mono', 'left'));
        } else if (initialFilled) {
          const item = candidates[sIdx];
          nodes.push(
            txt(item.id, 200, sy + 22, 34, item.col, 'mono', 'left'),
            txt('UNCHECKED', 815, sy + 22, 26, ROLE.pending, 'mono', 'right'),
          );
        } else {
          nodes.push(txt('awaiting top-2', 200, sy + 22, 28, COSMOS.dim, 'mono', 'left'));
        }
      });

      // Flowing beams connecting selected candidates to slots
      if (rf > 0.15) {
        nodes.push(
          beamWithPhotons(quadArcPts([-35, 63], [165, -115], -30), ROLE.policy, p, {
            width: 3.4,
            glow: 9,
            photonCount: 1,
          }),
          beamWithPhotons(quadArcPts([-35, 177], [165, 65], 25), ROLE.exception, p + 0.5, {
            width: 3.4,
            glow: 9,
            photonCount: 1,
          }),
        );
      } else if (tk > 0.15 && ds < 0.5) {
        nodes.push(
          beamWithPhotons(quadArcPts([-35, -165], [165, -115], -18), ROLE.deny, p, {
            width: 3.2,
            glow: 7,
            photonCount: 1,
          }),
          beamWithPhotons(quadArcPts([-35, -51], [165, 65], 18), ROLE.deny, p + 0.4, {
            width: 3.2,
            glow: 7,
            photonCount: 1,
          }),
        );
      }

      // Slot readout counter strictly withheld until after discard reveal
      if (rf > 0.55) {
        nodes.push(
          txt('2 USABLE PASSAGES IN THE TWO SLOTS', 165, 225, 30, ROLE.ok, 'mono', 'left').glow(
            8,
            ROLE.ok,
          ),
        );
      } else if (ds > 0.55) {
        nodes.push(
          txt('0 USABLE PASSAGES IN THE TWO SLOTS', 165, 225, 30, ROLE.deny, 'mono', 'left').glow(
            8,
            ROLE.deny,
          ),
        );
      }

      // Bottom prompt / takeaway
      let footer = 'Take top 2 from the global list, then check access and revision.';
      let footerCol = COSMOS.muted;
      if (rf > 0.55) {
        footer = 'Pre-filter eligibility first -> both required rules fill the 2 slots.';
        footerCol = ROLE.ok;
      } else if (fl > 0.45) {
        footer = 'Filter eligibility before taking top 2.';
        footerCol = ROLE.query;
      } else if (ds > 0.55) {
        footer = 'Post-filtering emptied both slots: the generator gets zero evidence.';
        footerCol = ROLE.deny;
      } else if (ask) {
        footer = 'After access and current-revision checks, how many usable passages remain?';
        footerCol = ROLE.focus;
      }

      nodes.push(
        txt(footer, -855, 385, 34, footerCol, 'serif', 'left')
          .glow(ask || ds > 0.55 || rf > 0.55 ? 6 : 0, footerCol)
          .opacity(0.65 + 0.35 * orderOn.value),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('eligible-order', () => {
    s.play(orderOn.to(1, { duration: clampDur(c, c.cue('eligible-order').start, 0.35) }));
  });
  c.on('eligible-take', () => {
    s.play(takeProg.to(1, { duration: clampDur(c, c.cue('eligible-take').start, 0.65) }));
  });
  c.on('eligible-predict', () => {
    s.play(askOn.to(1, { duration: clampDur(c, c.cue('eligible-predict').start, 0.25) }));
  });
  // Strict prediction withholding: reveal 0 usable passages ONLY after "Both slots empty out" finishes.
  c.after('eligible-discard', () => {
    s.play(discardProg.to(1, { duration: clampDur(c, c.cue('eligible-discard').end, 0.35) }));
  });
  c.on('eligible-before', () => {
    s.play(filterProg.to(1, { duration: clampDur(c, c.cue('eligible-before').start, 0.65) }));
  });
  c.on('eligible-refill', () => {
    s.play(refillProg.to(1, { duration: clampDur(c, c.cue('eligible-refill').start, 0.65) }));
  });
}
