// Scene 20: fresh-duplicate-puzzle - Four tiles, two threes and two eights
// Exact-fraction operand-occurrence tree for [8A, 3A, 3B, 8B]:
//   Phase 1: (8A - 3A) * (8B - 3B) = 5 * 5 = 25 (spends all 4 tiles, misses 24 by 1).
//   Phase 2: Exact rational branch: 8A / 3A = 8/3 -> 3B - 8/3 = 1/3 -> prediction pause!
//            fresh-finish reveals Division -> 8B / (1/3) = 24 (all 4 occurrences used once).
//   Phase 3: Forged trace reuses 8A (leaving 8B at 0 uses) -> prediction pause!
//            fresh-reject rejects it -> fresh-repair swaps in 8B -> passes both checks!
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  FRESH_FRACTION_TREE,
  FRESH_LEAVES,
  FRESH_WRONG_TREE,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  fadeInHalf,
  fadeOutHalf,
  glowTex,
  guardedDynamic,
  occurrenceExpressionCheck,
  orbNode,
  trimSeg,
  txt,
} from '../parts.mjs';

const [THREE_A, THREE_B, EIGHT_A, EIGHT_B] = FRESH_LEAVES;
const ORDERED_LEAVES = [EIGHT_A, THREE_A, THREE_B, EIGHT_B];
const TILE_LABELS = ['8A', '3A', '3B', '8B'];
const WRONG_CHECK = occurrenceExpressionCheck(FRESH_WRONG_TREE);
const RIGHT_CHECK = occurrenceExpressionCheck(FRESH_FRACTION_TREE);
const STOLEN_CHECK = occurrenceExpressionCheck({ ...FRESH_FRACTION_TREE, left: EIGHT_A });

export default function freshDuplicatePuzzle(s, c) {
  const pulse = s.value(0);
  const pairsOn = s.value(0);
  const fivesOn = s.value(0);
  const wrongOn = s.value(0);
  const resetOn = s.value(0);
  const divOn = s.value(0);
  const eightThirdsOn = s.value(0);
  const subOn = s.value(0);
  const thirdOn = s.value(0);
  const finishOn = s.value(0);
  const goalOn = s.value(0);
  const copyOn = s.value(0);
  const rejectOn = s.value(0);
  const repairOn = s.value(0);
  const verifiedOn = s.value(0);

  const header = cinemaHeader(
    'EXACT RATIONALS & OCCURRENCES',
    'Four tiles, two threes',
    'and two eights',
    { accent: ROLE.focus, size: 46 },
  );

  const stageAura = aura(-120, 40, 680, '#ffd1661c', '#5ce1e618');

  const exactEq = glowTex(String.raw`\frac{8_B}{3_B - \frac{8_A}{3_A}} = \frac{8}{1/3} = 24`, {
    x: 540,
    y: 235,
    size: 36,
    color: ROLE.ok,
    glow: 9,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = 0;
      const pr = pairsOn.value;
      const fv = fivesOn.value;
      const wr = wrongOn.value;
      const rs = resetOn.value;
      const dv = divOn.value;
      const e3 = eightThirdsOn.value;
      const sb = subOn.value;
      const t3 = thirdOn.value;
      const fn = finishOn.value;
      const gl = goalOn.value;
      const cp = copyOn.value;
      const rj = rejectOn.value;
      const rp = repairOn.value;
      const vf = verifiedOn.value;

      const vis1 = fadeOutHalf(rs);
      const vis2 = fadeInHalf(rs);
      const nodes = [];

      // Left tree geometry: 4 tile roots across [-700, -450, -190, +70] at y=-160
      const xs = [-700, -450, -190, 70];
      const topY = -160;
      const isStolen = cp > 0.45 && rp < 0.45;

      // Phase 1: (8A - 3A) * (8B - 3B) = 25
      if (vis1 > 0.02) {
        const left5 = [-575, 45];
        const right5 = [-60, 45];
        const prod25 = [-318, 225];

        ORDERED_LEAVES.forEach((_, i) => {
          nodes.push(
            orbNode(xs[i], topY, TILE_LABELS[i], pr > 0.35 ? ROLE.path : ROLE.service, {
              radius: 42,
              size: 30,
              opacity: vis1,
            }),
          );
        });

        if (pr > 0.05) {
          for (const [i, target] of [
            [0, left5],
            [1, left5],
            [2, right5],
            [3, right5],
          ]) {
            const [aPt, bPt] = trimSeg([xs[i], topY], target, 46, 46);
            nodes.push(
              beamWithPhotons([aPt, bPt], ROLE.path, p * 1.1 + i * 0.2, {
                alpha: pr * vis1,
                width: 3.0,
                photonCount: 1,
              }),
            );
          }
        }
        if (fv > 0.05) {
          nodes.push(
            orbNode(left5[0], left5[1], '8-3=5', ROLE.path, {
              radius: 44,
              size: 26,
              opacity: fv * vis1,
            }),
            orbNode(right5[0], right5[1], '8-3=5', ROLE.path, {
              radius: 44,
              size: 26,
              opacity: fv * vis1,
            }),
          );
        }
        if (wr > 0.05) {
          const [lA, lB] = trimSeg(left5, prod25, 48, 52);
          const [rA, rB] = trimSeg(right5, prod25, 48, 52);
          nodes.push(
            beamWithPhotons([lA, lB], ROLE.fail, p * 1.1, { alpha: wr * vis1, width: 3.4 }),
            beamWithPhotons([rA, rB], ROLE.fail, p * 1.1 + 0.5, { alpha: wr * vis1, width: 3.4 }),
            orbNode(prod25[0], prod25[1], WRONG_CHECK.result, ROLE.fail, {
              radius: 50,
              size: 36,
              sub: 'Missed 24 by 1',
              opacity: wr * vis1,
            }),
          );
        }
      }

      // Phase 2 & 3: Exact rational tree 8B / (3B - 8A/3A) = 24 (and stolen 8A check!)
      if (vis2 > 0.02) {
        const n83 = [-575, 10];
        const n13 = [-330, 145];
        const n24 = [-85, 275];

        ORDERED_LEAVES.forEach((_, i) => {
          const tileCol =
            isStolen && i === 0 ? ROLE.fail : isStolen && i === 3 ? ROLE.caution : ROLE.service;
          nodes.push(
            orbNode(xs[i], topY, TILE_LABELS[i], tileCol, {
              radius: 42,
              size: 30,
              opacity: vis2,
            }),
          );
        });

        // Step 1: 8A / 3A = 8/3
        if (dv > 0.05) {
          const [a1, b1] = trimSeg([xs[0], topY], n83, 46, 48);
          const [a2, b2] = trimSeg([xs[1], topY], n83, 46, 48);
          nodes.push(
            beamWithPhotons([a1, b1], ROLE.path, p * 1.1, {
              alpha: dv * vis2,
              width: 3.2,
              photonCount: 1,
            }),
            beamWithPhotons([a2, b2], ROLE.path, p * 1.1 + 0.3, {
              alpha: dv * vis2,
              width: 3.2,
              photonCount: 1,
            }),
          );
        }
        if (e3 > 0.05) {
          nodes.push(
            orbNode(n83[0], n83[1], '8/3', ROLE.path, {
              radius: 44,
              size: 30,
              opacity: e3 * vis2,
            }),
          );
        }

        // Step 2: 3B - 8/3 = 1/3
        if (sb > 0.05) {
          const [a1, b1] = trimSeg([xs[2], topY], n13, 46, 48);
          const [a2, b2] = trimSeg(n83, n13, 48, 48);
          nodes.push(
            beamWithPhotons([a1, b1], ROLE.focus, p * 1.1 + 0.2, {
              alpha: sb * vis2,
              width: 3.2,
              photonCount: 1,
            }),
            beamWithPhotons([a2, b2], ROLE.focus, p * 1.1 + 0.5, {
              alpha: sb * vis2,
              width: 3.2,
              photonCount: 1,
            }),
          );
        }
        if (t3 > 0.05) {
          nodes.push(
            orbNode(n13[0], n13[1], '1/3', ROLE.focus, {
              radius: 44,
              size: 30,
              opacity: t3 * vis2,
            }),
          );
        }

        // Step 3: 8B (or forged 8A!) / (1/3) = 24
        if (fn > 0.05) {
          const srcIdx = isStolen ? 0 : 3;
          const beamCol = isStolen ? ROLE.fail : ROLE.ok;
          const [a1, b1] = trimSeg([xs[srcIdx], topY], n24, 46, 52);
          const [a2, b2] = trimSeg(n13, n24, 48, 52);
          nodes.push(
            beamWithPhotons([a1, b1], beamCol, p * 1.1 + 0.4, { alpha: fn * vis2, width: 3.8 }),
            beamWithPhotons([a2, b2], beamCol, p * 1.1 + 0.8, { alpha: fn * vis2, width: 3.8 }),
          );
        }
        if (gl > 0.05) {
          const goalCol = isStolen ? ROLE.fail : ROLE.ok;
          nodes.push(
            orbNode(n24[0], n24[1], '24', goalCol, {
              radius: 50,
              size: 38,
              glow: 12,
              opacity: gl * vis2,
            }),
          );
        }
      }

      // Right-hand live Tile Occurrence Ledger (tracks 0 / 1 / 2 uses per tile!)
      const activeUses =
        rs < 0.5
          ? fv > 0.45
            ? WRONG_CHECK.occurrences
            : []
          : gl > 0.45
            ? (isStolen ? STOLEN_CHECK : RIGHT_CHECK).occurrences
            : t3 > 0.45
              ? ['8a', '3a', '3b']
              : e3 > 0.45
                ? ['8a', '3a']
                : [];

      nodes.push(
        line([260, -220], [260, 320], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt('TILE', 350, -200, 26, COSMOS.muted, 'mono', 'left'),
        txt('USES', 580, -200, 26, COSMOS.muted, 'mono', 'center'),
        txt('STATUS', 750, -200, 26, COSMOS.muted, 'mono', 'center'),
      );

      ORDERED_LEAVES.forEach((leaf, i) => {
        const y = -125 + i * 74;
        const count = activeUses.filter((id) => id === leaf.occurrence).length;
        const bad = count > 1 || (isStolen && count === 0);
        const col = bad ? ROLE.fail : count === 1 ? ROLE.ok : COSMOS.dim;
        const status =
          count > 1 ? 'REUSED!' : isStolen && count === 0 ? 'UNUSED' : count === 1 ? 'OK' : 'READY';
        nodes.push(
          txt(TILE_LABELS[i], 350, y, 30, COSMOS.ink, 'mono', 'left'),
          txt(String(count), 580, y, 34, col, 'mono', 'center'),
          txt(status, 750, y, 26, col, 'mono', 'center'),
        );
      });

      // Bottom prediction prompt / verdict (strict withholding on BOTH prediction pauses!)
      let foot = 'Distinct occurrence tags (8A, 8B, 3A, 3B) track duplicate values';
      let footCol = COSMOS.muted;
      if (vf > 0.45) {
        foot = 'PASSES BOTH CHECKS: exact value 24 AND every occurrence used once';
        footCol = ROLE.ok;
      } else if (rp > 0.45) {
        foot = 'Swapped final dividend to 8B -> each tile used exactly once';
        footCol = ROLE.ok;
      } else if (rj > 0.45) {
        foot = 'REJECT: 8A used twice while 8B was left on the table!';
        footCol = ROLE.fail;
      } else if (cp > 0.45) {
        foot = 'Value stays 24, yet trace reused 8A. Accept or reject?';
        footCol = ROLE.focus;
      } else if (gl > 0.45) {
        foot = 'DIVIDE: 8 / (1/3) = 24  ·  Rounding 8/3 to 2.67 breaks exactness!';
        footCol = ROLE.ok;
      } else if (t3 > 0.45) {
        foot = '8B and 1/3 remain. Which operation between them makes 24?';
        footCol = ROLE.focus;
      } else if (wr > 0.45 && rs < 0.5) {
        foot = '(8 - 3) * (8 - 3) = 25 spends all four tiles and misses by one';
        footCol = ROLE.caution;
      }

      nodes.push(
        txt(
          foot,
          0,
          392,
          28,
          footCol,
          (t3 > 0.45 && fn < 0.45) || (cp > 0.45 && rj < 0.45) ? 'serif' : 'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('fresh-pairs', () => {
    s.play(pairsOn.to(1, { duration: clampDur(c, c.cue('fresh-pairs').start, 0.35) }));
  });
  c.on('fresh-fives', () => {
    s.play(fivesOn.to(1, { duration: clampDur(c, c.cue('fresh-fives').start, 0.35) }));
  });
  c.on('fresh-wrong', () => {
    s.play(wrongOn.to(1, { duration: clampDur(c, c.cue('fresh-wrong').start, 0.35) }));
  });
  c.on('fresh-reset', () => {
    s.play(resetOn.to(1, { duration: clampDur(c, c.cue('fresh-reset').start, 0.5) }));
  });
  c.on('fresh-divide', () => {
    s.play(divOn.to(1, { duration: clampDur(c, c.cue('fresh-divide').start, 0.35) }));
  });
  c.on('fresh-eight-thirds', () => {
    s.play(eightThirdsOn.to(1, { duration: clampDur(c, c.cue('fresh-eight-thirds').start, 0.35) }));
  });
  c.on('fresh-subtract', () => {
    s.play(subOn.to(1, { duration: clampDur(c, c.cue('fresh-subtract').start, 0.35) }));
  });
  c.on('fresh-third', () => {
    s.play(thirdOn.to(1, { duration: clampDur(c, c.cue('fresh-third').start, 0.35) }));
  });
  // Strict prediction withholding #1!
  c.after('fresh-finish', () => {
    s.play(finishOn.to(1, { duration: clampDur(c, c.cue('fresh-finish').end, 0.35) }));
  });
  c.show('fresh-goal', exactEq);
  c.on('fresh-goal', () => {
    s.play(goalOn.to(1, { duration: clampDur(c, c.cue('fresh-goal').start, 0.35) }));
  });
  c.hide('fresh-copy', exactEq);
  c.on('fresh-copy', () => {
    s.play(copyOn.to(1, { duration: clampDur(c, c.cue('fresh-copy').start, 0.35) }));
  });
  // Strict prediction withholding #2!
  c.after('fresh-reject', () => {
    s.play(rejectOn.to(1, { duration: clampDur(c, c.cue('fresh-reject').end, 0.35) }));
  });
  c.show('fresh-repair', exactEq);
  c.on('fresh-repair', () => {
    s.play(repairOn.to(1, { duration: clampDur(c, c.cue('fresh-repair').start, 0.35) }));
  });
  c.on('fresh-verified', () => {
    s.play(verifiedOn.to(1, { duration: clampDur(c, c.cue('fresh-verified').start, 0.35) }));
  });
}
