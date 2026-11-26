import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dotItem,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export function buildTrainedPolicy(s, c) {
  s.add(aura(-460, -40, 560, ROLE.ok, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.agent, COSMOS.bg));

  s.add(
    cinemaHeader(
      'GRPO TRAINING VS LIVE RUN',
      'Group-relative advantage',
      'then frozen live checks',
      {
        x: -860,
        y: -445,
        accent: ROLE.ok,
        size: 46,
      },
    ),
  );

  const meanOn = s.value(0);
  const liveOn = s.value(0);

  c.on('ra-trained-policy-0-2', () =>
    s.play(meanOn.to(1, { duration: clampDur(c, c.cue('ra-trained-policy-0-2').start, 0.5) })),
  );
  c.on('ra-trained-policy-1-0', () =>
    s.play(liveOn.to(1, { duration: clampDur(c, c.cue('ra-trained-policy-1-0').start, 0.55) })),
  );

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const mn = meanOn.value;
        const lv = liveOn.value;
        const nodes = [];

        // Left: 4 repairs relative to group mean 0.5 (DeepSeek-R1 GRPO)
        const yMean = -40;
        const barScale = 180; // 0.5 -> 90 px up or down
        nodes.push(
          txt(
            '4 REPAIRS FOR 1 FAILING TEST  (GROUP MEAN = 0.5)',
            -840,
            -225,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
          line([-840, yMean], [120, yMean], {
            stroke: ROLE.focus,
            width: 3,
            dash: [10, 7],
          }).opacity(0.35 + 0.65 * mn),
          txt('MEAN 0.5', 150, yMean, 26, ROLE.focus, 'mono', 'left').opacity(0.35 + 0.65 * mn),
        );

        const reps = [
          { x: -720, r: 1, adv: '+0.5', label: 'R1: PASS (1)', col: ROLE.ok },
          { x: -490, r: 1, adv: '+0.5', label: 'R2: PASS (1)', col: ROLE.ok },
          { x: -260, r: 0, adv: '-0.5', label: 'R3: FAIL (0)', col: ROLE.fail },
          { x: -30, r: 0, adv: '-0.5', label: 'R4: FAIL (0)', col: ROLE.fail },
        ];
        reps.forEach((rp) => {
          const h = 0.5 * barScale;
          const cy = rp.r === 1 ? yMean - h * 0.5 : yMean + h * 0.5;
          nodes.push(
            rect(150, h, { fill: rp.col, stroke: null, radius: 6 })
              .at(rp.x, cy)
              .glow(7, rp.col)
              .opacity(0.88),
            txt(rp.adv, rp.x, cy, 28, '#050811', 'mono', 'center'),
            txt(
              rp.label,
              rp.x,
              rp.r === 1 ? yMean - h - 32 : yMean + h + 32,
              26,
              rp.col,
              'mono',
              'center',
            ),
          );
        });

        // Right: Frozen weights on live request
        const lAlpha = 0.3 + 0.7 * lv;
        nodes.push(
          line([310, -235], [310, 145], { stroke: '#233152', width: 2 }).opacity(lAlpha),
          txt('LIVE DEPLOYMENT (FROZEN)', 355, -210, 26, ROLE.agent, 'mono', 'left').opacity(
            lAlpha,
          ),
          dotItem(370, -135, 'TRAINING SHIFTS SAMPLING ODDS', ROLE.ok, { opacity: lAlpha }),
          dotItem(370, -68, 'CONTROLLER BUDGETS CALLS', ROLE.focus, { opacity: lAlpha }),
          dotItem(370, -1, 'METRICS TOOL STILL REQUIRED', ROLE.tool, { opacity: lAlpha }),
          dotItem(370, 66, 'CHECK RECEIPT BEFORE ADVICE', ROLE.agent, { opacity: lAlpha }),
        );

        // Bottom takeaway
        nodes.push(line([-860, 212], [840, 212], { stroke: '#233152', width: 2 }));
        nodes.push(
          txt(
            'GRPO (DeepSeek-R1): GROUP SUPPLIES COMPARISON WITHOUT A SEPARATE CRITIC MODEL',
            0,
            286,
            26,
            ROLE.focus,
            'mono',
            'center',
          ),
          txt(
            'WEIGHTS ALONE NEVER KNOW TODAY’S LATENCY  |  QUERY LIVE TOOLS FOR CURRENT FACTS',
            0,
            346,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(lAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
