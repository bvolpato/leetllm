// Scene 15: budget-and-claims - What can a stopped search report?
// Glowing 2D live frontier-size trajectory plot from real DEAD_END_TRACE & searchValues():
//   1. Root [4, 5, 6, 7] cap=1 -> 1 examined, 36 waiting.
//   2. Switch to Tray A [24, 5, 7] cap=1 -> 1 examined, 18 waiting. Prediction pause!
//      budget-limited reveals "budget_exhausted".
//   3. Lift cap -> glowing cyan curve rises then drains all 85 distinct states to 0 waiting.
//      Second prediction pause! budget-exhaustive reveals "no_solution".
import { group, line } from 'vizmatic/stage';
import {
  BRANCH_A_CAP_ONE,
  COSMOS,
  DEAD_END_TRACE,
  ROLE,
  ROOT_CAP_ONE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  glowingTrail,
  guardedDynamic,
  txt,
} from '../parts.mjs';

const HISTORY_A = [{ checked: 0, queued: 1 }, ...DEAD_END_TRACE];
const LAST_IDX = HISTORY_A.length - 1; // 85

export default function budgetAndClaims(s, c) {
  const pulse = s.value(0);
  const rootDone = s.value(0);
  const branchA = s.value(0);
  const eighteenDone = s.value(0);
  const limitedOn = s.value(0);
  const fullOn = s.value(0);
  const workT = s.value(0);
  const emptyT = s.value(0);
  const exhaustOn = s.value(0);

  const header = cinemaHeader('BUDGET & CLAIMS', 'What can a stopped', 'search report?', {
    accent: ROLE.path,
    size: 48,
  });

  const stageAura = aura(-60, 40, 680, '#5ce1e61a', '#ffd16614');

  const view = guardedDynamic(
    () => 1,
    () => {
      const rt = rootDone.value;
      const ba = branchA.value;
      const e18 = eighteenDone.value;
      const lm = limitedOn.value;
      const fl = fullOn.value;
      const wk = workT.value;
      const em = emptyT.value;
      const ex = exhaustOn.value;
      const nodes = [];

      const isBranchA = ba > 0.45;
      const isFull = fl > 0.45;
      const observed = isBranchA ? e18 > 0.45 : rt > 0.45;

      const data = isBranchA
        ? HISTORY_A
        : [HISTORY_A[0], { checked: ROOT_CAP_ONE.visited, queued: ROOT_CAP_ONE.frontier.length }];

      let idx = 0;
      if (observed) {
        if (!isFull) {
          idx = 1;
        } else if (em > 0.92) {
          idx = LAST_IDX;
        } else {
          idx = 1 + Math.floor((LAST_IDX - 1) * (0.72 * wk + 0.28 * em));
        }
      }
      const pt = data[Math.min(idx, data.length - 1)];

      // Coordinate frame: x in [-740..+240] (0..85 examined), y in [-140..+245] (70..0 waiting)
      const x0 = -740;
      const x1 = 240;
      const yTop = -140;
      const yBot = 245;
      const mapX = (n) => x0 + ((x1 - x0) * n) / LAST_IDX;
      const mapY = (q) => yBot - ((yBot - yTop) * q) / 70;

      nodes.push(
        txt(
          isBranchA ? 'TRAY A: [24, 5, 7]' : 'START TRAY: [4, 5, 6, 7]',
          -740,
          -215,
          30,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          isFull ? 'CAP LIFTED (EXHAUSTIVE)' : 'CAP: 1 DISTINCT STATE',
          240,
          -215,
          28,
          isFull ? ROLE.ok : ROLE.focus,
          'mono',
          'right',
        ),
        txt('STATES WAITING', x0, -172, 26, COSMOS.muted, 'mono', 'left'),
      );

      // Grid & axes
      for (const q of [0, 20, 40, 60]) {
        const gy = mapY(q);
        nodes.push(
          line([x0, gy], [x1, gy], {
            stroke: q === 0 ? '#3b4e7a' : '#1b2642',
            width: q === 0 ? 2.6 : 1.4,
          }),
          txt(String(q), x0 - 20, gy, 26, COSMOS.dim, 'mono', 'right'),
        );
      }
      for (const n of [0, 20, 40, 60, 80]) {
        const gx = mapX(n);
        nodes.push(
          line([gx, yTop], [gx, yBot], { stroke: '#1b2642', width: 1.4, dash: [4, 6] }),
          txt(String(n), gx, yBot + 36, 26, COSMOS.dim, 'mono', 'center'),
        );
      }
      nodes.push(
        txt(
          'DISTINCT STATES EXAMINED',
          (x0 + x1) * 0.5,
          yBot + 84,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Cap=1 vertical laser wall when capped
      if (!isFull) {
        const wallX = mapX(1);
        nodes.push(
          line([wallX, yTop - 10], [wallX, yBot], {
            stroke: ROLE.focus,
            width: 3,
            dash: [8, 6],
          }).glow(6, ROLE.focus),
        );
      }

      // Glowing frontier trajectory polyline
      if (idx >= 1) {
        const trailPts = [];
        for (let i = 0; i <= idx; i++) {
          trailPts.push([mapX(data[i].checked), mapY(data[i].queued)]);
        }
        nodes.push(
          glowingTrail(trailPts, {
            color: ex > 0.45 ? ROLE.ok : ROLE.path,
            width: 4.5,
            glow: 10,
          }),
        );
      }
      nodes.push(
        glowDot(mapX(pt.checked), mapY(pt.queued), {
          radius: 9,
          color: ROLE.focus,
          glow: 14,
        }),
      );

      // Right-side live counters & status verdict (strict prediction withholding!)
      const rx = 350;
      nodes.push(
        txt('EXAMINED', rx, -135, 26, COSMOS.muted, 'mono', 'left'),
        txt(`${pt.checked} STATES`, rx, -82, 40, COSMOS.ink, 'mono', 'left'),
        txt('FRONTIER WAITING', rx, 10, 26, COSMOS.muted, 'mono', 'left'),
        txt(`${pt.queued} WAITING`, rx, 62, 40, ROLE.path, 'mono', 'left'),
        line([rx, 130], [840, 130], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt('REPORTABLE STATUS', rx, 172, 26, COSMOS.muted, 'mono', 'left'),
      );

      let statusStr = 'PENDING';
      let statusCol = COSMOS.dim;
      if (ex > 0.45) {
        statusStr = 'no_solution';
        statusCol = ROLE.ok;
      } else if (isFull && em > 0.7) {
        statusStr = 'Which status now?';
        statusCol = ROLE.focus;
      } else if (isFull) {
        statusStr = 'SEARCHING...';
        statusCol = ROLE.path;
      } else if (lm > 0.45) {
        statusStr = 'budget_exhausted';
        statusCol = ROLE.focus;
      } else if (isBranchA && observed) {
        statusStr = 'Which status?';
        statusCol = ROLE.focus;
      } else if (!isBranchA && observed) {
        statusStr = `${ROOT_CAP_ONE.frontier.length} skipped`;
        statusCol = ROLE.caution;
      }

      nodes.push(
        txt(statusStr, rx, 228, 36, statusCol, 'mono', 'left').glow(
          ex > 0.45 || lm > 0.45 ? 9 : 0,
          statusCol,
        ),
      );

      const foot =
        ex > 0.45
          ? '85 distinct states examined, 0 waiting -> proven no solution under {+, -, *, /}'
          : lm > 0.45 && !isFull
            ? `Cap = 1 left ${BRANCH_A_CAP_ONE.frontier.length} states unexamined -> cannot claim no solution`
            : 'Distinguish running out of search budget from exhausting the state space';
      nodes.push(txt(foot, 0, 392, 26, COSMOS.muted, 'mono', 'center'));

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('budget-root', () => {
    s.play(rootDone.to(1, { duration: clampDur(c, c.cue('budget-root').start, 0.35) }));
  });
  c.on('budget-change', () => {
    s.play(branchA.to(1, { duration: clampDur(c, c.cue('budget-change').start, 0.35) }));
  });
  c.on('budget-eighteen', () => {
    s.play(eighteenDone.to(1, { duration: clampDur(c, c.cue('budget-eighteen').start, 0.35) }));
  });
  // Strict prediction withholding #1!
  c.after('budget-limited', () => {
    s.play(limitedOn.to(1, { duration: clampDur(c, c.cue('budget-limited').end, 0.35) }));
  });
  c.on('budget-restart', () => {
    s.play(fullOn.to(1, { duration: clampDur(c, c.cue('budget-restart').start, 0.35) }));
  });
  c.on('budget-work', () => {
    s.play(workT.to(1, { duration: clampDur(c, c.cue('budget-work').start, 1.3) }));
  });
  c.on('budget-empty', () => {
    s.play(emptyT.to(1, { duration: clampDur(c, c.cue('budget-empty').start, 0.7) }));
  });
  // Strict prediction withholding #2!
  c.after('budget-exhaustive', () => {
    s.play(exhaustOn.to(1, { duration: clampDur(c, c.cue('budget-exhaustive').end, 0.35) }));
  });
}
