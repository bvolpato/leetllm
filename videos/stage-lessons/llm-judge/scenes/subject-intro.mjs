// Scene 1: subject-intro - Two replies to Maya's rollback alert
// Dual optical reply channels starting as 3-word previews (prediction withheld!),
// expanding to reveal identical actions in both layouts, then swinging a live
// calibration dial to stepwise with glowing swap-and-verify arcs.
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
  guardedDynamic,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function subjectIntro(s, c) {
  const pulse = s.value(0);
  const expandCompact = s.value(0);
  const expandStep = s.value(0);
  const matchBeam = s.value(0);
  const dialPick = s.value(0);
  const swapPhase = s.value(0);

  const header = cinemaHeader(
    'LLM-AS-A-JUDGE CALIBRATION',
    'Two replies to Maya’s',
    'rollback alert',
    { accent: ROLE.stepwise, size: 52 },
  );

  const stageAura = aura(320, 40, 620, '#5ce1e622', '#ffd16618');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ec = expandCompact.value;
      const es = expandStep.value;
      const mb = matchBeam.value;
      const dp = dialPick.value;
      const sp = swapPhase.value;
      const nodes = [];

      // Left channel rails (zero rectangular bullet boxes; pure glowing optical rails)
      const cY = -120;
      const sY = 170;

      // Compact channel rail
      nodes.push(
        line([-840, cY - 56], [-840, cY + 86], { stroke: ROLE.compact, width: 5 }).glow(
          8,
          ROLE.compact,
        ),
        txt('COMPACT REPLY', -810, cY - 40, 26, ROLE.compact, 'mono', 'left'),
      );
      if (ec < 0.45) {
        nodes.push(
          txt('“Stop the rollout...”', -810, cY + 14, 34, COSMOS.ink, 'serif', 'left').opacity(
            1 - ec * 2,
          ),
          txt('first 3 words visible', -810, cY + 62, 26, COSMOS.dim, 'mono', 'left').opacity(
            1 - ec * 2,
          ),
        );
      } else {
        const a = Math.min(1, (ec - 0.45) * 2);
        nodes.push(
          txt(
            '“Stop the rollout and run the DEP-27',
            -810,
            cY + 4,
            30,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(a),
          line([-810, cY + 34], [-255, cY + 34], { stroke: ROLE.compact, width: 3.2 })
            .glow(8, ROLE.compact)
            .opacity(a),
          txt(
            'rollback procedure: threshold crossed.”',
            -810,
            cY + 64,
            30,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(a),
        );
      }

      // Stepwise channel rail
      nodes.push(
        line([-840, sY - 56], [-840, sY + 114], { stroke: ROLE.stepwise, width: 5 }).glow(
          8,
          ROLE.stepwise,
        ),
        txt('STEPWISE REPLY', -810, sY - 40, 26, ROLE.stepwise, 'mono', 'left'),
      );
      if (es < 0.45) {
        nodes.push(
          txt(
            '“Payment-service has crossed...”',
            -810,
            sY + 14,
            34,
            COSMOS.ink,
            'serif',
            'left',
          ).opacity(1 - es * 2),
          txt('first 3 words visible', -810, sY + 62, 26, COSMOS.dim, 'mono', 'left').opacity(
            1 - es * 2,
          ),
        );
      } else {
        const a = Math.min(1, (es - 0.45) * 2);
        nodes.push(
          txt('“Threshold crossed. Next:', -810, sY + 4, 28, COSMOS.muted, 'sans', 'left').opacity(
            a,
          ),
          txt(
            '1. Stop the rollout.  2. Run rollback.”',
            -810,
            sY + 48,
            30,
            ROLE.stepwise,
            'sans',
            'left',
          )
            .glow(5, ROLE.stepwise)
            .opacity(a),
          line([-810, sY + 84], [-255, sY + 84], { stroke: ROLE.stepwise, width: 3.2 })
            .glow(8, ROLE.stepwise)
            .opacity(a),
        );
      }

      // Prediction prompt while hidden, replaced by shared-action equivalence once revealed
      if (ec < 0.1 && es < 0.1) {
        nodes.push(
          txt(
            'Which 3-word preview tells Maya what to do?',
            -840,
            395,
            30,
            ROLE.verdict,
            'serif',
            'left',
          ).glow(6, ROLE.verdict),
        );
      } else if (mb > 0.05) {
        const arc = quadArcPts([-220, cY + 25], [-220, sY + 45], 0, 24).map(([x, y], i) => [
          x + Math.sin((i / 24) * Math.PI) * 56,
          y,
        ]);
        nodes.push(
          beamWithPhotons(arc, ROLE.stepwise, p * 0.9, { alpha: mb, width: 3.2 }),
          txt('SAME TWO ACTIONS · DIFFERENT LAYOUT', -840, 395, 28, ROLE.ok, 'mono', 'left')
            .glow(6, ROLE.ok)
            .opacity(mb),
        );
      }

      // Right-hand living calibration dial instrument (always alive on frame 0!)
      const dialCx = 420;
      const dialCy = 10;
      const dialR = 225;
      // Needle breathes gently around neutral (-PI/2) until judge picks stepwise (+0.55 rad)
      const idleWobble = Math.sin(p * Math.PI * 3) * 0.12 * (1 - dp);
      const needleAngle = -Math.PI * 0.5 + idleWobble + dp * 0.62;
      const dialColor = dp > 0.5 ? ROLE.verdict : ROLE.stepwise;

      nodes.push(
        calibrationDial(dialCx, dialCy, dialR, needleAngle, {
          color: dialColor,
          needleColor: dp > 0.5 ? ROLE.verdict : COSMOS.muted,
        }),
        txt('COMPACT', dialCx - 210, dialCy - 255, 26, ROLE.compact, 'mono', 'center'),
        txt('STEPWISE', dialCx + 210, dialCy - 255, 26, ROLE.stepwise, 'mono', 'center'),
        txt(
          dp > 0.5 ? 'LLM JUDGE PICK: STEPWISE' : 'RUBRIC CLARITY DIAL',
          dialCx,
          dialCy + 286,
          28,
          dp > 0.5 ? ROLE.verdict : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Calibration ring around dial
      nodes.push(
        circle(dialR + 36, { fill: null, stroke: '#1e2c4f', width: 1.8 }).at(dialCx, dialCy),
      );

      // Swap & human-verify orbital arcs when `test-pick` fires
      if (sp > 0.05) {
        const topArc = quadArcPts([dialCx - 165, dialCy - 215], [dialCx + 165, dialCy - 215], -78);
        const botArc = quadArcPts([dialCx + 165, dialCy + 215], [dialCx - 165, dialCy + 215], 78);
        nodes.push(
          beamWithPhotons(topArc, ROLE.verdict, p * 1.4, { alpha: sp, width: 3.0 }),
          beamWithPhotons(botArc, ROLE.human, p * 1.4 + 0.5, { alpha: sp, width: 3.0 }),
          txt(
            'SWAP ORDER  +  CHECK ENGINEERS',
            dialCx,
            dialCy + 344,
            26,
            ROLE.human,
            'mono',
            'center',
          )
            .glow(6, ROLE.human)
            .opacity(sp),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 3.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('find-action', () => {
    s.play(pulse.to(0.6, { duration: clampDur(c, c.cue('find-action').start, 0.35) }));
  });
  // Strict prediction withholding: reveal compact answer AFTER its spoken reveal clause!
  c.after('compact-mark', () => {
    s.play(expandCompact.to(1, { duration: clampDur(c, c.cue('compact-mark').end, 0.45) }));
  });
  c.on('step-mark', () => {
    s.play(expandStep.to(1, { duration: clampDur(c, c.cue('step-mark').start, 0.45) }));
  });
  c.on('both-actions', () => {
    s.play(matchBeam.to(1, { duration: clampDur(c, c.cue('both-actions').start, 0.4) }));
  });
  c.on('judge-pick', () => {
    s.play(dialPick.to(1, { duration: clampDur(c, c.cue('judge-pick').start, 0.55) }));
  });
  c.on('test-pick', () => {
    s.play(swapPhase.to(1, { duration: clampDur(c, c.cue('test-pick').start, 0.45) }));
  });
}
