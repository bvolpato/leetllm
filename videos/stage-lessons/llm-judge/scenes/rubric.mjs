// Scene 4: rubric - Write criteria a reviewer can apply
// Glowing DEP-27 policy spine projecting two action beams onto compact & stepwise,
// feeding an anchored 0 / 1 / 2 calibration ladder tethered to immutable version rings.
import { circle, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  anchors,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  policy,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function rubric(s, c) {
  const pulse = s.value(0);
  const policyOn = s.value(0);
  const factsOn = s.value(0);
  const levelsOn = s.value(0);
  const bindOn = s.value(0);

  const header = cinemaHeader(
    'ANCHORED RUBRIC DESIGN',
    'Write criteria a reviewer',
    'can apply consistently',
    {
      accent: ROLE.policy,
      size: 48,
    },
  );

  const stageAura = aura(240, 40, 620, '#60a5fa1f', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const po = policyOn.value;
      const fa = factsOn.value;
      const lv = levelsOn.value;
      const bd = bindOn.value;
      const nodes = [];

      // Left column: DEP-27 Policy Spine + 2 required action emitters
      const px = -790;
      nodes.push(
        txt(`POLICY ${policy.version}`, px, -175, 28, ROLE.policy, 'mono', 'left').glow(
          6,
          ROLE.policy,
        ),
        line([px + 14, -135], [px + 14, 15], { stroke: ROLE.policy, width: 4 })
          .glow(8, ROLE.policy)
          .opacity(0.45 + po * 0.55),
        circle(12, { fill: ROLE.policy, stroke: '#ffffff', width: 1.5 })
          .at(px + 14, -110)
          .glow(8, ROLE.policy),
        txt('1. stop_rollout', px + 44, -110, 28, COSMOS.ink, 'mono', 'left').opacity(
          0.55 + po * 0.45,
        ),
        circle(12, { fill: ROLE.policy, stroke: '#ffffff', width: 1.5 })
          .at(px + 14, -15)
          .glow(8, ROLE.policy),
        txt('2. run_rollback', px + 44, -15, 28, COSMOS.ink, 'mono', 'left').opacity(
          0.55 + po * 0.45,
        ),
      );

      // Middle: Compact & Stepwise projections receiving identical facts
      const midX = -240;
      const cY = -110;
      const sY = 10;
      if (fa > 0.05) {
        nodes.push(
          beamWithPhotons(
            quadArcPts([px + 305, -110], [midX - 24, cY], -20),
            ROLE.compact,
            p * 1.1,
            {
              alpha: fa,
              width: 3,
            },
          ),
          beamWithPhotons(
            quadArcPts([px + 305, -15], [midX - 24, sY], 20),
            ROLE.stepwise,
            p * 1.1 + 0.5,
            {
              alpha: fa,
              width: 3,
            },
          ),
          txt('compact', midX, cY - 22, 28, ROLE.compact, 'mono', 'left').opacity(fa),
          txt('1 sentence · both facts', midX, cY + 18, 26, COSMOS.muted, 'sans', 'left').opacity(
            fa,
          ),
          txt('stepwise', midX, sY + 2, 28, ROLE.stepwise, 'mono', 'left').opacity(fa),
          txt(
            '2 numbered steps · both facts',
            midX,
            sY + 42,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(fa),
        );
      }

      // Right column: 3-rung glowing vertical calibration ladder (0 / 1 / 2)
      const ladX = 330;
      const ys = [220, 40, -140];
      const cols = [ROLE.conflict, ROLE.verdict, ROLE.ok];

      nodes.push(
        txt('ANCHORED CLARITY LADDER', ladX - 30, -245, 26, ROLE.verdict, 'mono', 'left').opacity(
          0.35 + lv * 0.65,
        ),
        line([ladX, ys[0] - 28], [ladX, ys[1] + 28], { stroke: '#2d3f6b', width: 5 }).opacity(
          0.45 + lv * 0.55,
        ),
        line([ladX, ys[1] - 28], [ladX, ys[2] + 28], { stroke: '#2d3f6b', width: 5 }).opacity(
          0.45 + lv * 0.55,
        ),
      );

      anchors.forEach((anc, i) => {
        const y = ys[i];
        const col = cols[i];
        const la = 0.25 + lv * 0.75;
        nodes.push(
          circle(24, { fill: '#0b1224', stroke: col, width: 3.4 })
            .at(ladX, y)
            .glow(lv > 0.4 ? 10 : 0, col)
            .opacity(la),
          txt(String(anc.level), ladX, y, 28, col, 'mono', 'center').opacity(la),
          txt(anc.description, ladX + 46, y - 16, 26, COSMOS.ink, 'sans', 'left').opacity(la),
          txt(anc.example, ladX + 46, y + 22, 26, COSMOS.muted, 'serif', 'left').opacity(la * 0.9),
        );
      });

      // Bottom version-binding tether (Policy + Answer + Rubric + Judge Config)
      const tY = 355;
      const ringLabels = ['Policy v27', 'Answer Text', 'Rubric v1', 'Judge Config'];
      const ringXs = [-680, -260, 160, 580];
      if (bd > 0.05) {
        nodes.push(
          beamWithPhotons(
            [
              [ringXs[0], tY],
              [ringXs[3], tY],
            ],
            ROLE.policy,
            p * 1.1,
            { alpha: bd, width: 3.4, photonCount: 3 },
          ),
        );
        ringLabels.forEach((label, i) => {
          nodes.push(
            circle(14, { fill: '#0b1224', stroke: ROLE.policy, width: 3 })
              .at(ringXs[i], tY)
              .glow(9, ROLE.policy)
              .opacity(bd),
            txt(label, ringXs[i], tY + 46, 26, COSMOS.ink, 'mono', 'center').opacity(bd),
          );
        });
      } else {
        nodes.push(
          txt(
            'BIND CASE RECORD TO EXACT VERSIONS',
            -840,
            355,
            26,
            COSMOS.dim,
            'mono',
            'left',
          ).opacity(0.7),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('policy-actions', () => {
    s.play(policyOn.to(1, { duration: clampDur(c, c.cue('policy-actions').start, 0.4) }));
  });
  c.on('same-facts', () => {
    s.play(factsOn.to(1, { duration: clampDur(c, c.cue('same-facts').start, 0.45) }));
  });
  c.on('score-levels', () => {
    s.play(levelsOn.to(1, { duration: clampDur(c, c.cue('score-levels').start, 0.5) }));
  });
  c.on('bound-case', () => {
    s.play(bindOn.to(1, { duration: clampDur(c, c.cue('bound-case').start, 0.45) }));
  });
}
