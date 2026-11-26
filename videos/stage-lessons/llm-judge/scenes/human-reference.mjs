// Scene 11: human-reference - Where do two reviewers disagree?
// Dual independent on-call reviewer tracks across Cases 1, 2, 3 opening side by side
// (prediction pause on Beat 0!), Case 2 flaring rose with opposing rays, 2/3 agreement
// gauge glowing emerald, and a frozen-rubric horizon splitting tuning from held-out eval.
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  calibrationDial,
  cinemaHeader,
  clampDur,
  driftValue,
  glowMeter,
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

const CASES = [
  { id: 'Case 1', e1: 'compact', e2: 'compact', agree: true },
  { id: 'Case 2', e1: 'stepwise', e2: 'compact', agree: false },
  { id: 'Case 3', e1: 'stepwise', e2: 'stepwise', agree: true },
];

export default function humanReference(s, c) {
  const pulse = s.value(0);
  const openOn = s.value(0);
  const adjReveal = s.value(0);
  const countReveal = s.value(0);
  const reasonsOn = s.value(0);
  const freezeOn = s.value(0);

  const header = cinemaHeader('HUMAN REFERENCE BASELINE', 'Where do two reviewers', 'disagree?', {
    accent: ROLE.human,
    size: 50,
  });

  const stageAura = aura(160, 40, 620, '#a78bfa22', '#ff6b8b1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const op = openOn.value;
      const ad = adjReveal.value;
      const ct = countReveal.value;
      const rs = reasonsOn.value;
      const fr = freezeOn.value;
      const nodes = [];

      // Column headers (floating typography, zero box frames)
      const xCase = -810;
      const xE1 = -490;
      const xE2 = -100;
      const xMid = -295;

      nodes.push(
        txt('CASE', xCase, -170, 26, COSMOS.muted, 'mono', 'left'),
        txt('ENGINEER 1 (BLIND)', xE1, -170, 26, ROLE.human, 'mono', 'center'),
        txt('ENGINEER 2 (BLIND)', xE2, -170, 26, ROLE.stepwise, 'mono', 'center'),
        line([-820, -135], [75, -135], { stroke: '#293961', width: 2 }),
      );

      CASES.forEach((row, i) => {
        const y = -55 + i * 135;
        const isDisputed = !row.agree;
        const showAlert = isDisputed && ad > 0.35;
        const showMatch = row.agree && ct > 0.35;
        const col1 = row.e1 === 'compact' ? ROLE.compact : ROLE.stepwise;
        const col2 = row.e2 === 'compact' ? ROLE.compact : ROLE.stepwise;

        nodes.push(
          txt(row.id, xCase, y, 30, showAlert ? ROLE.conflict : COSMOS.ink, 'mono', 'left'),
        );

        if (op > 0.05) {
          nodes.push(
            circle(14, { fill: col1, stroke: '#ffffff', width: 1.5 })
              .at(xE1 - 115, y)
              .glow(showAlert ? 10 : 5, col1)
              .opacity(op),
            txt(row.e1, xE1 - 85, y, 28, col1, 'mono', 'left').opacity(op),
            circle(14, { fill: col2, stroke: '#ffffff', width: 1.5 })
              .at(xE2 - 115, y)
              .glow(showAlert ? 10 : 5, col2)
              .opacity(op),
            txt(row.e2, xE2 - 85, y, 28, col2, 'mono', 'left').opacity(op),
          );
        } else {
          nodes.push(
            txt('SEALED', xE1, y, 26, COSMOS.dim, 'mono', 'center'),
            txt('SEALED', xE2, y, 26, COSMOS.dim, 'mono', 'center'),
          );
        }

        // Only reveal match/disagreement indicators AFTER prediction!
        if (showAlert) {
          nodes.push(
            beamWithPhotons(
              quadArcPts([xE1 + 90, y], [xE2 - 135, y], -32),
              ROLE.conflict,
              p * 1.4,
              {
                alpha: ad,
                width: 3.6,
              },
            ),
            txt('DISAGREE', 115, y, 28, ROLE.conflict, 'mono', 'left')
              .glow(8, ROLE.conflict)
              .opacity(ad),
          );
        } else if (showMatch) {
          nodes.push(
            txt('MATCH', 115, y, 28, ROLE.ok, 'mono', 'left').glow(6, ROLE.ok).opacity(ct),
          );
        }
      });

      // Right-hand side: always-alive Reviewer Calibration Dial -> 2/3 gauge -> adjudication
      const rx = 505;
      if (ct < 0.05) {
        const dialAng = -Math.PI * 0.5 + Math.sin(p * Math.PI * 2.5) * 0.25;
        nodes.push(
          calibrationDial(rx, -10, 155, dialAng, {
            color: ROLE.human,
            needleColor: op > 0.3 ? ROLE.verdict : ROLE.human,
          }),
          txt(
            op > 0.3 ? 'Which case needs a talk?' : 'INDEPENDENT BLIND BALLOTS',
            rx,
            195,
            28,
            op > 0.3 ? ROLE.verdict : ROLE.human,
            op > 0.3 ? 'serif' : 'mono',
            'center',
          ).glow(6, op > 0.3 ? ROLE.verdict : ROLE.human),
        );
      }

      if (ct > 0.05) {
        nodes.push(
          txt('PRE-DISCUSSION AGREEMENT', rx, -120, 26, ROLE.ok, 'mono', 'center').opacity(ct),
          txt('2 / 3', rx, -42, 68, ROLE.ok, 'mono', 'center').glow(10, ROLE.ok).opacity(ct),
          glowMeter(rx - 220, 32, 440, 26, 2 / 3, { fill: ROLE.ok, opacity: ct }),
        );
      }

      if (rs > 0.05) {
        nodes.push(
          txt(
            'Case 2: settle facts from evidence,',
            rx,
            120,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(rs),
          txt(
            'or leave open preference unresolved',
            rx,
            164,
            26,
            ROLE.conflict,
            'sans',
            'center',
          ).opacity(rs),
        );
      }

      // Bottom freeze horizon
      const fY = 345;
      if (fr > 0.05) {
        nodes.push(
          line([-840, fY], [840, fY], { stroke: ROLE.policy, width: 3.5, dash: [10, 8] })
            .glow(8, ROLE.policy)
            .opacity(fr),
          txt('RUBRIC TUNING SET', -480, fY + 46, 26, ROLE.human, 'mono', 'center').opacity(fr),
          txt('FREEZE RUBRIC', 0, fY - 30, 26, ROLE.policy, 'mono', 'center')
            .glow(7, ROLE.policy)
            .opacity(fr),
          txt(
            'HELD-OUT VALIDATION (8 PAIRS NEXT)',
            480,
            fY + 46,
            26,
            ROLE.ok,
            'mono',
            'center',
          ).opacity(fr),
        );
      } else {
        nodes.push(
          txt(
            'Same rubric & evidence · Authors & judge picks hidden',
            -840,
            370,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );
      }

      // Quiet connector orbit so right side is alive even at beat 0
      const orbX = xMid + Math.cos(p * Math.PI * 2) * 14;
      const orbY = 305 + Math.sin(p * Math.PI * 2) * 8;
      nodes.push(circle(4, { fill: ROLE.human, stroke: null }).at(orbX, orbY).opacity(0.65));

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('blind-humans', () => {
    s.play(pulse.to(0.35, { duration: clampDur(c, c.cue('blind-humans').start, 0.25) }));
  });
  c.on('open-ballots', () => {
    s.play(openOn.to(1, { duration: clampDur(c, c.cue('open-ballots').start, 0.4) }));
  });
  c.on('ask-reviewers', () => {
    s.play(openOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding: reveal Case 2 & 2/3 AFTER spoken phrases!
  c.after('adjudication', () => {
    s.play(adjReveal.to(1, { duration: clampDur(c, c.cue('adjudication').end, 0.35) }));
  });
  c.after('count-ballots', () => {
    s.play(countReveal.to(1, { duration: clampDur(c, c.cue('count-ballots').end, 0.35) }));
  });
  c.on('review-reasons', () => {
    s.play(reasonsOn.to(1, { duration: clampDur(c, c.cue('review-reasons').start, 0.4) }));
  });
  c.on('label-split', () => {
    s.play(freezeOn.to(1, { duration: clampDur(c, c.cue('label-split').start, 0.4) }));
  });
}
