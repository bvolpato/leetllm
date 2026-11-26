// Scene 8: workflow-choice - Two readers, one closure notice
// Same Art notice splits into two living channels: coded workflow (left) rigidly routes
// to History, while model-directed agent (right) reads "east entrance open" (prediction
// pause!) and proposes checking east-entrance visiting hours before giving up on Art.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  orbNode,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function workflowChoice(s, c) {
  const pulse = s.value(0);
  const ruleOn = s.value(0);
  const detailOn = s.value(0);
  const followReveal = s.value(0);
  const compareOn = s.value(0);

  const header = cinemaHeader('WORKFLOW VS AGENT', 'Two readers,', 'one closure notice', {
    accent: ROLE.policy,
    size: 50,
  });

  const stageAura = aura(120, 40, 620, '#a78bfa1e', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const rl = ruleOn.value;
      const dt = detailOn.value;
      const fl = followReveal.value;
      const cm = compareOn.value;
      const nodes = [];

      // Shared Notice Source at top-center
      nodes.push(
        txt('ART MUSEUM NOTICE', 0, -255, 26, ROLE.action, 'mono', 'center'),
        txt('“Main gallery closed for repairs.”', 0, -205, 30, COSMOS.ink, 'serif', 'center'),
      );
      if (dt > 0.05) {
        nodes.push(
          txt(
            '“Other galleries open through the east entrance.”',
            0,
            -155,
            30,
            ROLE.focus,
            'serif',
            'center',
          )
            .glow(6, ROLE.focus)
            .opacity(dt),
        );
      }

      // Split beams left (Workflow) and right (Agent)
      const srcPt = [0, -110];
      const leftPt = [-460, 75];
      const rightPt = [460, 75];

      nodes.push(
        beamWithPhotons(quadArcPts(srcPt, [leftPt[0], leftPt[1] - 72], -18), ROLE.host, p * 1.1, {
          width: 3.4,
        }),
        beamWithPhotons(
          quadArcPts(srcPt, [rightPt[0], rightPt[1] - 72], -18),
          ROLE.policy,
          p * 1.1 + 0.5,
          {
            width: 3.4,
          },
        ),
        orbNode(leftPt[0], leftPt[1], 'CODE', ROLE.host, {
          radius: 62,
          sub: rl > 0.3 ? 'if closed -> check History' : 'Fixed fallback rule',
        }),
        orbNode(rightPt[0], rightPt[1], 'MODEL', ROLE.policy, {
          radius: 62,
          sub: fl > 0.3 ? 'Check east-entrance hours!' : 'Reads extra sentence...',
        }),
      );

      // Prediction prompt -> answer reveal -> comparison rail
      if (dt > 0.2 && fl < 0.05) {
        nodes.push(
          txt(
            'What can the agent usefully check before giving up on Art?',
            0,
            275,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (fl > 0.05) {
        nodes.push(
          txt(
            'AGENT PROPOSES: CHECK TODAY’S EAST-ENTRANCE HOURS',
            0,
            265,
            28,
            ROLE.ok,
            'mono',
            'center',
          )
            .glow(8, ROLE.ok)
            .opacity(fl),
        );
      }

      if (cm > 0.05) {
        nodes.push(
          line([-840, 320], [840, 320], { stroke: '#25355a', width: 2 }).opacity(cm),
          txt(
            'ENUMERABLE CASES -> WORKFLOW  ·  OPEN NOTICES -> COMPARE ON SAME TASKS & COST',
            0,
            372,
            26,
            ROLE.host,
            'mono',
            'center',
          ).opacity(cm),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('choice-notice', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('choice-notice').start, 0.25) }));
  });
  c.on('choice-rule', () => {
    s.play(ruleOn.to(1, { duration: clampDur(c, c.cue('choice-rule').start, 0.35) }));
  });
  c.on('choice-detail', () => {
    s.play(detailOn.to(1, { duration: clampDur(c, c.cue('choice-detail').start, 0.35) }));
  });
  c.on('choice-question', () => {
    s.play(detailOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding!
  c.after('choice-follow', () => {
    s.play(followReveal.to(1, { duration: clampDur(c, c.cue('choice-follow').end, 0.35) }));
  });
  c.on('choice-compare', () => {
    s.play(compareOn.to(1, { duration: clampDur(c, c.cue('choice-compare').start, 0.35) }));
  });
}
