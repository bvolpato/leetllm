// Scene 18: quality-and-latency-gate - Which strategy fits the service?
// Luminous 2D Accuracy vs p95 Latency Pareto frontier from STRATEGY_RECEIPTS:
//   1. Plot Direct (76%, 190ms), Single Trace (84%, 360ms), Vote 5 (94%, 740ms),
//      Tree Search (96%, 1840ms). Apply 90% floor & 900ms cap -> prediction pause #1!
//   2. gate-select highlights Vote 5 (94%, 740ms, 5 calls).
//   3. gate-tighten slides latency laser from 900ms down to 100ms -> prediction pause #2!
//   4. gate-none reveals NONE qualify; gate-invalid shows rejection of (Inf, -1ms).
import { group, line, rect } from 'vizmatic/stage';
import { markDecoration } from '../../cinematic-kit.mjs';
import {
  COSMOS,
  ROLE,
  STRATEGY_RECEIPTS,
  aura,
  chooseReasoningStrategy,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

const FLOOR = 0.9;
const NAMES = {
  direct: 'Direct (1 call)',
  single_trace: 'Single trace (1 call)',
  vote_5: 'Vote five (5 calls)',
  tree_search: 'Tree search (14 calls)',
};

export default function qualityAndLatencyGate(s, c) {
  const pulse = s.value(0);
  const limitsOn = s.value(0);
  const selectOn = s.value(0);
  const tightenT = s.value(0);
  const noneOn = s.value(0);
  const invalidOn = s.value(0);

  const header = cinemaHeader('QUALITY & LATENCY GATE', 'Which strategy fits', 'the service?', {
    accent: ROLE.ok,
    size: 48,
  });

  const stageAura = aura(-60, 40, 680, '#6ee7b71a', '#ffd16614');

  const view = guardedDynamic(
    () => 1,
    () => {
      const lm = limitsOn.value;
      const sl = selectOn.value;
      const tg = tightenT.value;
      const nn = noneOn.value;
      const iv = invalidOn.value;
      const nodes = [];

      const cap = Math.round(900 - tg * 800);
      const chosen = chooseReasoningStrategy(STRATEGY_RECEIPTS, FLOOR, cap);
      const graded = tg < 0.05 ? sl > 0.45 : nn > 0.45;

      // Coordinate frame: x in [-720..+680] (0..2000ms), y in [-175..+245] (100%..70%)
      const x0 = -720;
      const x1 = 680;
      const yTop = -175;
      const yBot = 245;
      const mapX = (ms) => x0 + ((x1 - x0) * ms) / 2000;
      const mapY = (acc) => yBot - ((yBot - yTop) * (acc - 0.7)) / 0.3;

      nodes.push(
        txt('TASK ACCURACY', x0, -215, 26, COSMOS.muted, 'mono', 'left'),
        txt('INVENTED MEASUREMENTS', x1, -215, 26, COSMOS.dim, 'mono', 'right'),
      );

      // Feasible quadrant shading (non-occluding plot decoration) + clean top/bottom cap ticks
      if (lm > 0.05) {
        const fx0 = mapX(0);
        const fx1 = mapX(cap);
        const fy0 = mapY(1.0);
        const fy1 = mapY(FLOOR);
        const fw = Math.max(4, fx1 - fx0);
        const fh = fy1 - fy0;
        nodes.push(
          markDecoration(
            rect(fw, fh, { fill: ROLE.ok, stroke: null, radius: 4 })
              .at(fx0 + fw * 0.5, fy0 + fh * 0.5)
              .opacity(0.16 * lm),
          ),
          line([fx1, yTop - 18], [fx1, yTop - 2], { stroke: ROLE.focus, width: 5 })
            .glow(10, ROLE.focus)
            .opacity(lm),
          line([fx1, yBot + 2], [fx1, yBot + 18], { stroke: ROLE.focus, width: 5 })
            .glow(10, ROLE.focus)
            .opacity(lm),
          txt(`LATENCY CAP: ${cap} ms`, 0, -238, 28, ROLE.focus, 'mono', 'center')
            .glow(6, ROLE.focus)
            .opacity(lm),
        );
      }

      // Horizontal accuracy gridlines
      for (const acc of [0.7, 0.8, 0.9, 1.0]) {
        const gy = mapY(acc);
        const isFloor = acc === FLOOR && lm > 0.05;
        nodes.push(
          markDecoration(
            line([x0, gy], [x1, gy], {
              stroke: isFloor ? ROLE.path : acc === 0.7 ? '#3b4e7a' : '#1b2642',
              width: isFloor ? 3 : acc === 0.7 ? 2.4 : 1.4,
            }),
          ),
          txt(
            `${Math.round(acc * 100)}%`,
            x0 - 20,
            gy,
            26,
            isFloor ? ROLE.path : COSMOS.dim,
            'mono',
            'right',
          ),
        );
      }

      // Vertical latency ticks
      for (const ms of [0, 500, 1000, 1500, 2000]) {
        const gx = mapX(ms);
        nodes.push(
          markDecoration(
            line([gx, yTop], [gx, yBot], { stroke: '#1b2642', width: 1.4, dash: [4, 6] }),
          ),
          txt(`${ms}`, gx, yBot + 42, 26, COSMOS.dim, 'mono', 'center'),
        );
      }
      nodes.push(txt('p95 LATENCY (ms)', x1, yBot + 84, 26, COSMOS.muted, 'mono', 'right'));

      // Four strategy dots + clean non-overlapping labels
      STRATEGY_RECEIPTS.forEach((row, i) => {
        const px = mapX(row.p95_ms);
        const py = mapY(row.accuracy);
        const isWinner = graded && chosen?.strategy === row.strategy;
        const col = isWinner ? ROLE.ok : row.strategy === 'tree_search' ? ROLE.model : COSMOS.ink;
        const align = i === 3 ? 'right' : 'left';
        const lx = px + (i === 3 ? -26 : 26);
        nodes.push(
          glowDot(px, py, {
            radius: isWinner ? 13 : 9,
            color: col,
            glow: isWinner ? 16 : 8,
          }),
          txt(NAMES[row.strategy], lx, py - 16, 28, col, 'mono', align),
          txt(
            `${Math.round(row.accuracy * 100)}% · ${row.p95_ms} ms`,
            lx,
            py + 22,
            26,
            COSMOS.muted,
            'mono',
            align,
          ),
        );
      });

      // Bottom verdict / prediction prompt / schema validation guard
      let foot = 'Farther left = faster p95 latency  ·  Higher = higher task accuracy';
      let footCol = COSMOS.muted;
      if (iv > 0.45) {
        foot = 'VALIDATE FIRST: accuracy = ∞ and p95 = -1 ms FAIL strict schema check';
        footCol = ROLE.fail;
      } else if (nn > 0.45) {
        foot = 'NONE QUALIFY AT 100 ms (fastest is 190 ms)  ->  REPORT NO ELIGIBLE STRATEGY';
        footCol = ROLE.caution;
      } else if (tg > 0.45) {
        foot = 'Deadline tightened to 100 ms. Which strategy qualifies now?';
        footCol = ROLE.focus;
      } else if (sl > 0.45) {
        foot = 'VOTE FIVE QUALIFIES (94%, 740 ms)  ·  Tie-break: fewest calls, then lower p95';
        footCol = ROLE.ok;
      } else if (lm > 0.45) {
        foot = 'Need >= 90% accuracy AND p95 <= 900 ms. Which dot meets both?';
        footCol = ROLE.focus;
      }

      nodes.push(
        txt(
          foot,
          0,
          388,
          28,
          footCol,
          (lm > 0.45 && sl < 0.45) || (tg > 0.45 && nn < 0.45) ? 'serif' : 'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);

  c.on('gate-limits', () => {
    s.play(limitsOn.to(1, { duration: clampDur(c, c.cue('gate-limits').start, 0.45) }));
  });
  // Strict prediction withholding #1!
  c.after('gate-select', () => {
    s.play(selectOn.to(1, { duration: clampDur(c, c.cue('gate-select').end, 0.35) }));
  });
  c.on('gate-tighten', () => {
    s.play(tightenT.to(1, { duration: clampDur(c, c.cue('gate-tighten').start, 0.75) }));
  });
  // Strict prediction withholding #2!
  c.after('gate-none', () => {
    s.play(noneOn.to(1, { duration: clampDur(c, c.cue('gate-none').end, 0.35) }));
  });
  c.on('gate-invalid', () => {
    s.play(invalidOn.to(1, { duration: clampDur(c, c.cue('gate-invalid').start, 0.35) }));
  });
}
