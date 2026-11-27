// Scene 10: branch-state - What survives the first move?
// Dual parallel operand-lineage trees starting from identical [6, 4, 5, 7] trays:
//   Tray A (left): 6 * 4 -> 24, with 5 and 7 carried straight down.
//   Tray B (right): 5 + 7 -> 12, with 6 and 4 carried straight down.
// Strict prediction pause asks "Which two originals are inside that twelve?" -> highlighted
// golden lineage beams trace 12 back to 5 and 7 ONLY on branch-trace!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  combine,
  guardedDynamic,
  numberValue,
  orbNode,
  trimSeg,
  txt,
  valueLabel,
} from '../parts.mjs';

const INPUTS = [6, 4, 5, 7];
const PROD_A = valueLabel(combine(numberValue(6), numberValue(4), '×'));
const SUM_B = valueLabel(combine(numberValue(5), numberValue(7), '+'));

export default function branchState(s, c) {
  const pulse = s.value(0);
  const selA = s.value(0);
  const selB = s.value(0);
  const moveA = s.value(0);
  const resA = s.value(0);
  const carryA = s.value(0);
  const moveB = s.value(0);
  const resB = s.value(0);
  const carryB = s.value(0);
  const traceB = s.value(0);

  const header = cinemaHeader('BRANCHING STATES', 'What survives', 'the first move?', {
    accent: ROLE.path,
    size: 48,
  });

  const stageAura = aura(0, 40, 680, '#5ce1e61a', '#ffd16614');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const sa = selA.value;
      const sb = selB.value;
      const ma = moveA.value;
      const ra = resA.value;
      const ca = carryA.value;
      const mb = moveB.value;
      const rb = resB.value;
      const cb = carryB.value;
      const tr = traceB.value;
      const nodes = [];

      const topY = -125;
      const botY = 175;
      const stepX = 176;

      // Center vertical divider hairline between Tray A and Tray B
      nodes.push(line([0, -230], [0, 260], { stroke: '#25355a', width: 2 }).opacity(0.6));

      const specs = [
        {
          name: 'TRAY A',
          startX: -725,
          pair: [0, 1],
          op: '*',
          result: PROD_A,
          sel: sa,
          mov: ma,
          res: ra,
          car: ca,
          traced: 0,
        },
        {
          name: 'TRAY B',
          startX: 195,
          pair: [2, 3],
          op: '+',
          result: SUM_B,
          sel: sb,
          mov: mb,
          res: rb,
          car: cb,
          traced: tr,
        },
      ];

      for (const br of specs) {
        const xs = INPUTS.map((_, j) => br.startX + j * stepX);
        const joinX = (xs[br.pair[0]] + xs[br.pair[1]]) * 0.5;
        const activeCol = br.traced > 0.35 ? ROLE.focus : ROLE.path;

        nodes.push(
          txt(
            br.name,
            br.startX + stepX * 1.5,
            -220,
            30,
            br.traced > 0.35 ? ROLE.focus : COSMOS.ink,
            'mono',
            'center',
          ),
        );

        // Input orbs + vertical/converging lineage beams
        INPUTS.forEach((val, j) => {
          const isPair = br.pair.includes(j);
          const x = xs[j];
          const orbCol = isPair && br.sel > 0.35 ? activeCol : ROLE.service;

          if (isPair && br.mov > 0.05) {
            const [aPt, bPt] = trimSeg([x, topY], [joinX, botY], 44, 48);
            const curB = [aPt[0] + (bPt[0] - aPt[0]) * br.mov, aPt[1] + (bPt[1] - aPt[1]) * br.mov];
            nodes.push(
              beamWithPhotons([aPt, curB], activeCol, p * 1.1 + j * 0.25, {
                width: br.traced > 0.35 ? 4.4 : 3.2,
                glow: br.traced > 0.35 ? 12 : 8,
                photonCount: br.traced > 0.35 ? 2 : 1,
                alpha: br.mov,
              }),
            );
          }

          if (!isPair && br.car > 0.05) {
            const [aPt, bPt] = trimSeg([x, topY], [x, botY], 44, 44);
            const curB = [aPt[0], aPt[1] + (bPt[1] - aPt[1]) * br.car];
            nodes.push(
              line(aPt, curB, { stroke: '#4b618f', width: 2.8, dash: [8, 6] }).opacity(br.car),
            );
          }

          nodes.push(
            orbNode(x, topY, String(val), orbCol, {
              radius: 40,
              size: 32,
              glow: isPair && br.sel > 0.35 ? 11 : 6,
            }),
          );

          if (!isPair && br.car > 0.5) {
            nodes.push(
              orbNode(x, botY, String(val), ROLE.service, {
                radius: 40,
                size: 32,
                glow: 6,
                opacity: br.car,
              }),
            );
          }
        });

        // Operator symbol mid-stem
        if (br.mov > 0.25) {
          nodes.push(
            txt(br.op, joinX, (topY + botY) * 0.5 - 10, 36, activeCol, 'mono', 'center').opacity(
              br.mov,
            ),
          );
        }

        // Resulting subtotal orb
        if (br.res > 0.05) {
          nodes.push(
            orbNode(joinX, botY, br.result, activeCol, {
              radius: 46,
              size: 34,
              glow: 12,
              opacity: br.res,
            }),
          );
        }
      }

      // Bottom prediction question -> answer revealed ONLY on branch-trace!
      nodes.push(line([-820, 290], [820, 290], { stroke: '#25355a', width: 2 }).opacity(0.65));

      let footText = 'Two copies of [6, 4, 5, 7] explore different first moves';
      let footCol = COSMOS.muted;
      if (tr > 0.45) {
        footText = 'TRACE BACK: 5 AND 7 ARE INSIDE 12  ·  STORE STATE + PARENT + MOVE';
        footCol = ROLE.focus;
      } else if (cb > 0.45) {
        footText = 'Which two originals are inside Tray B’s 12?';
        footCol = ROLE.focus;
      }

      nodes.push(
        txt(footText, 0, 358, 30, footCol, tr > 0.45 ? 'mono' : 'serif', 'center').glow(
          cb > 0.45 ? 7 : 0,
          ROLE.focus,
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('branch-select-a', () => {
    s.play(selA.to(1, { duration: clampDur(c, c.cue('branch-select-a').start, 0.3) }));
  });
  c.on('branch-select-b', () => {
    s.play(selB.to(1, { duration: clampDur(c, c.cue('branch-select-b').start, 0.3) }));
  });
  c.on('branch-a-move', () => {
    s.play(moveA.to(1, { duration: clampDur(c, c.cue('branch-a-move').start, 0.4) }));
  });
  c.on('branch-a-result', () => {
    s.play(resA.to(1, { duration: clampDur(c, c.cue('branch-a-result').start, 0.3) }));
  });
  c.on('branch-a-carry', () => {
    s.play(carryA.to(1, { duration: clampDur(c, c.cue('branch-a-carry').start, 0.35) }));
  });
  c.on('branch-b-move', () => {
    s.play(moveB.to(1, { duration: clampDur(c, c.cue('branch-b-move').start, 0.4) }));
  });
  c.on('branch-b-result', () => {
    s.play(resB.to(1, { duration: clampDur(c, c.cue('branch-b-result').start, 0.3) }));
  });
  c.on('branch-b-carry', () => {
    s.play(carryB.to(1, { duration: clampDur(c, c.cue('branch-b-carry').start, 0.35) }));
  });
  // Strict prediction withholding!
  c.after('branch-trace', () => {
    s.play(traceB.to(1, { duration: clampDur(c, c.cue('branch-trace').end, 0.35) }));
  });
}
