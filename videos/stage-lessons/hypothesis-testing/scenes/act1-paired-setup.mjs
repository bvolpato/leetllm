// Act 1 (Scenes 1-5): Intro, Paired Design, Protocol Identity, Forty Tasks, and Null Model.
import { arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  BINOMIAL_13,
  COSMOS,
  DISAGREEMENTS,
  NULL_WIN_COUNTS,
  ROLE,
  beatTo,
  cinemaGrid,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowCol,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  joinTaskResults,
  mix,
  neonCurve,
  paired,
  rule,
  smooth,
  studies,
  taskRows,
  txt,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: Would you switch coding assistants?
// Cues: opening-current, opening-pairs, opening-predict, intro-permission,
//       intro-pass, intro-denial, intro-receipt*
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const curP = s.value(0);
  const pairP = s.value(0);
  const predP = s.value(0);
  const permP = s.value(0);
  const passP = s.value(0);
  const denyP = s.value(0);
  const recP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lift, seed: 1 }));
  s.add(decorAura(-380, -40, 460, '#60a5fa22', '#07091000'));
  s.add(decorAura(380, -40, 480, '#6ee7b722', '#07091000'));

  const headline = heroTitle(['Would You Switch', 'the Coding Assistant?'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.modelB,
    eyebrow: 'PAIRED EVALUATION  ·  ONE ATTEMPT EACH',
  });

  const live = dynamic(() => {
    const cu = curP.value;
    const pr = pairP.value;
    const pd = predP.value;
    const pm = permP.value;
    const ps = passP.value;
    const dn = denyP.value;
    const rc = recP.value;

    const nodes = [];
    const revealed = ps > 0.5;
    const bScore = revealed ? 4 : 3;

    // Top scoreboard (right half, cleanly clear of heroTitle)
    const axX = 140;
    const bxX = 600;
    const scoreY = -280;
    nodes.push(
      txt('CURRENT A', axX, scoreY - 90, 26, ROLE.modelA, 'mono'),
      txt('CHALLENGER B', bxX, scoreY - 90, 26, ROLE.modelB, 'mono'),
      txt('3', axX, scoreY, 130, ROLE.modelA, 'mono').glow(10 + cu * 6, ROLE.modelA),
      txt(String(bScore), bxX, scoreY, 130, ROLE.modelB, 'mono').glow(
        10 + (revealed ? 10 : cu * 6),
        ROLE.modelB,
      ),
      txt('vs', (axX + bxX) / 2, scoreY, 34, COSMOS.dim, 'serif'),
      txt('passes of 6', (axX + bxX) / 2, scoreY + 78, 26, COSMOS.muted, 'mono'),
    );

    // Subtle horizontal divider above the 6 paired task constellations
    nodes.push(rule(-840, -100, 840, -100, '#273558', 1.8));
    nodes.push(
      txt('A', -820, 42, 34, ROLE.modelA, 'mono'),
      txt('B', -820, 154, 34, ROLE.modelB, 'mono'),
    );

    const colStart = -660;
    const colStep = 278;
    paired.forEach((row, i) => {
      const cx = colStart + i * colStep;
      const isPerm = row.task === 'permission';
      const titleCol = isPerm
        ? revealed
          ? ROLE.modelB
          : pr > 0.2
            ? ROLE.threshold
            : COSMOS.ink
        : COSMOS.muted;

      nodes.push(txt(row.task, cx, -45, isPerm ? 29 : 26, titleCol, 'sans'));

      // Model A node (sleek rounded pill with generous padding around pass/fail)
      const aPass = row.a === 1;
      const aCol = isPerm ? ROLE.danger : aPass ? ROLE.modelA : COSMOS.dim;
      nodes.push(
        rect(isPerm ? 148 : 132, isPerm ? 62 : 54, {
          fill: isPerm ? '#241222' : '#10182b',
          stroke: aCol,
          width: isPerm ? 3.2 : 2.2,
          radius: 28,
        })
          .at(cx, 42)
          .glow(isPerm ? 10 : 4, aCol),
        txt(aPass ? 'pass' : 'fail', cx, 42, 26, aCol, 'mono'),
      );

      // Model B node
      const bPending = isPerm && !revealed;
      const bPass = row.b === 1;
      const bCol = bPending
        ? ROLE.threshold
        : isPerm
          ? ROLE.modelB
          : bPass
            ? ROLE.modelB
            : COSMOS.dim;
      const bScale = isPerm ? (bPending ? 1 : 1 + 0.04 * pm) : 1;
      nodes.push(
        rect((isPerm ? 148 : 132) * bScale, (isPerm ? 62 : 54) * bScale, {
          fill: isPerm ? (bPending ? '#251e10' : '#0f2820') : '#10182b',
          stroke: bCol,
          width: isPerm ? 3.4 : 2.2,
          radius: 28,
        })
          .at(cx, 154)
          .glow(isPerm ? 12 : 4, bCol),
        txt(
          bPending ? '?' : bPass ? 'pass' : 'fail',
          cx,
          154,
          isPerm && bPending ? 36 : 26,
          bCol,
          'mono',
        ),
      );

      if (isPerm) {
        // Subtle vertical focus connector for the deciding permission pair
        nodes.push(
          line([cx, 78], [cx, 118], {
            stroke: revealed ? ROLE.modelB : ROLE.threshold,
            width: 3,
            dash: [5, 5],
          }),
        );
      }
    });

    // Bottom prompt/verdict band with strict non-overlapping crossfade
    const preVerdict = fadeOut(rc);
    const postVerdict = fadeIn(rc);

    if (preVerdict > 0.02) {
      const promptMsg =
        dn > 0.3
          ? 'B kept the denied request blocked  ·  one extra pass'
          : pd > 0.25
            ? 'If B passes the permission test, would you switch?'
            : 'Five tasks tied  ·  permission test is the last open cell';
      const promptCol = dn > 0.3 ? ROLE.modelB : pd > 0.25 ? ROLE.threshold : COSMOS.muted;
      nodes.push(txt(promptMsg, 0, 325, 36, promptCol, 'serif').opacity(preVerdict));
    }

    if (postVerdict > 0.02) {
      nodes.push(
        group(
          txt(
            'B WINS 4 TO 3  ·  NET GAIN +1 PASS IN 6 TASKS',
            0,
            295,
            34,
            ROLE.modelB,
            'mono',
          ).glow(9, ROLE.modelB),
          txt(
            'Five ties, one deciding task  ·  how surprising is that lead?',
            0,
            360,
            30,
            COSMOS.ink,
            'serif',
          ),
        ).opacity(postVerdict),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'opening-current', curP, 1, { dur: 0.65 });
  cueTo(s, c, 'opening-pairs', pairP, 1, { dur: 0.7 });
  cueTo(s, c, 'opening-predict', predP, 1, { dur: 0.6 });
  cueTo(s, c, 'intro-permission', permP, 1, { dur: 0.55 });
  cueTo(s, c, 'intro-pass', passP, 1, { dur: 0.55 });
  cueTo(s, c, 'intro-denial', denyP, 1, { dur: 0.55 });
  cueTo(s, c, 'intro-receipt', recP, 1, { after: true, dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 2. paired-design: Keep the task attached to both answers
// Cues: pair-prompt, pair-results, pair-table, pair-lift, pair-differences,
//       pair-ties, pair-permission
// ---------------------------------------------------------------------------
export function pairedDesign(s, c) {
  const promptP = s.value(0);
  const resP = s.value(0);
  const view2P = s.value(0);
  const tableP = s.value(0);
  const liftP = s.value(0);
  const diffP = s.value(0);
  const tiesP = s.value(0);
  const permP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.modelB, seed: 2 }));
  s.add(decorAura(-420, 40, 460, '#60a5fa1c', '#07091000'));
  s.add(decorAura(420, 40, 460, '#6ee7b71e', '#07091000'));

  const headline = heroTitle(['Pair Both Models', 'on the Same Task'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.lift,
    eyebrow: 'SHARED DIFFICULTY  ·  SIGNED DIFFERENCES',
  });

  // View 1 (Beat 0): Single permission prompt -> A & B -> same hidden tests -> one paired row
  const view1 = guardedDynamic(
    () => fadeOut(view2P.value),
    (vis) => {
      const pr = promptP.value;
      const rs = smooth(resP.value);
      const nodes = [];

      // Left source prompt (sleek pill wide enough for 'permission')
      const srcX = -635;
      const srcY = 20;
      nodes.push(
        rect(228, 114, {
          fill: '#191d34',
          stroke: ROLE.threshold,
          width: 3.2,
          radius: 22,
        })
          .at(srcX, srcY)
          .glow(10 + pr * 6, ROLE.threshold),
        txt('PROMPT', srcX, srcY - 20, 26, ROLE.threshold, 'mono'),
        txt('permission', srcX, srcY + 22, 26, COSMOS.ink, 'sans'),
        txt('Same prompt & hidden tests', srcX, srcY + 125, 28, COSMOS.muted, 'sans'),
      );

      // Twin beams to A and B
      const midX = -150;
      const ay = -110;
      const by = 150;
      nodes.push(
        arrow([srcX + 128, srcY - 24], [midX - 115, ay], { stroke: ROLE.modelA, width: 3.4 }).glow(
          6,
          ROLE.modelA,
        ),
        arrow([srcX + 128, srcY + 24], [midX - 115, by], { stroke: ROLE.modelB, width: 3.4 }).glow(
          6,
          ROLE.modelB,
        ),
        rect(200, 82, { fill: '#101a30', stroke: ROLE.modelA, width: 3, radius: 22 })
          .at(midX, ay)
          .glow(8, ROLE.modelA),
        txt('A: fail', midX, ay, 28, ROLE.modelA, 'mono'),
        rect(200, 82, { fill: '#0f2620', stroke: ROLE.modelB, width: 3, radius: 22 })
          .at(midX, by)
          .glow(8, ROLE.modelB),
        txt('B: pass', midX, by, 28, ROLE.modelB, 'mono'),
      );

      // Twin beams converge into one paired row on the right (cleanly clear of midX)
      const rowX = 485;
      const rowY = 20;
      nodes.push(
        arrow([midX + 116, ay], [rowX - 275, rowY - 22], { stroke: ROLE.modelA, width: 3.2 })
          .opacity(0.35 + 0.65 * rs)
          .glow(6, ROLE.modelA),
        arrow([midX + 116, by], [rowX - 275, rowY + 22], { stroke: ROLE.modelB, width: 3.2 })
          .opacity(0.35 + 0.65 * rs)
          .glow(6, ROLE.modelB),
        txt('ONE PAIRED ROW', rowX, rowY - 125, 26, ROLE.lift, 'mono'),
        rect(520, 124, { fill: '#10172b', stroke: ROLE.lift, width: 2.6, radius: 18 })
          .at(rowX, rowY)
          .opacity(0.45 + 0.55 * rs),
        txt('A = 0', rowX - 120, rowY, 34, ROLE.danger, 'mono')
          .glow(6, ROLE.danger)
          .opacity(0.35 + 0.65 * rs),
        txt('B = 1', rowX + 120, rowY, 34, ROLE.modelB, 'mono')
          .glow(8, ROLE.modelB)
          .opacity(0.35 + 0.65 * rs),
        txt(
          rs > 0.7
            ? 'Task identity keeps shared difficulty locked'
            : 'Attach both outcomes to one ID',
          rowX,
          rowY + 125,
          28,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beats 1-2): All 6 paired rows + observed lift + signed differences B - A
  const view2 = guardedDynamic(
    () => fadeIn(view2P.value),
    (vis) => {
      const tb = tableP.value;
      const lf = liftP.value;
      const df = diffP.value;
      const ti = tiesP.value;
      const pm = permP.value;
      const nodes = [];

      const xTask = -790;
      const xA = -190;
      const xB = 75;
      const xDiff = 370;
      const yHead = -220;

      nodes.push(
        txt('MATCHED TASK', xTask, yHead, 26, COSMOS.muted, 'mono', 'left'),
        txt('MODEL A', xA, yHead, 26, ROLE.modelA, 'mono'),
        txt('MODEL B', xB, yHead, 26, ROLE.modelB, 'mono'),
        txt('B − A', xDiff, yHead, 26, ROLE.threshold, 'mono'),
        rule(-810, yHead + 28, 490, yHead + 28, '#2b3b60', 2),
      );

      paired.forEach((row, i) => {
        const y = -140 + i * 82;
        const diff = row.b - row.a;
        const isPerm = diff > 0;
        const rowVis = Math.max(0.3, Math.min(1, tb * 1.4 - i * 0.06));
        const showZero = diff === 0 && ti > 0.5;
        const showPlus = isPerm && pm > 0.5;

        nodes.push(
          group(
            rule(-810, y + 40, 490, y + 40, '#19233d', 1.2),
            txt(
              row.task,
              xTask,
              y,
              isPerm ? 30 : 28,
              isPerm && showPlus ? ROLE.modelB : COSMOS.ink,
              'sans',
              'left',
            ),
            glowDot(xA - 58, y, {
              radius: 9,
              color: row.a ? ROLE.modelA : COSMOS.dim,
              glow: row.a ? 8 : 0,
            }),
            txt(
              row.a ? '1  pass' : '0  fail',
              xA + 12,
              y,
              26,
              row.a ? ROLE.modelA : COSMOS.dim,
              'mono',
            ),
            glowDot(xB - 58, y, {
              radius: 9,
              color: row.b ? ROLE.modelB : COSMOS.dim,
              glow: row.b ? 8 : 0,
            }),
            txt(
              row.b ? '1  pass' : '0  fail',
              xB + 12,
              y,
              26,
              row.b ? ROLE.modelB : COSMOS.dim,
              'mono',
            ),
            df > 0.05
              ? txt(
                  showPlus ? '+1' : showZero ? '0' : '?',
                  xDiff,
                  y,
                  showPlus ? 36 : 30,
                  showPlus ? ROLE.modelB : showZero ? COSMOS.muted : COSMOS.dim,
                  'mono',
                ).glow(showPlus ? 10 : 0, ROLE.modelB)
              : txt('·', xDiff, y, 28, COSMOS.dim, 'mono'),
          ).opacity(rowVis),
        );
      });

      // Right summary column (cleanly separated from table at x = 695)
      const preLift = fadeOut(lf);
      const postLift = fadeIn(lf);
      if (preLift > 0.02) {
        nodes.push(
          group(
            txt('PASS TOTALS', 720, -140, 26, COSMOS.muted, 'mono'),
            txt('A: 3 / 6', 720, -68, 34, ROLE.modelA, 'mono'),
            txt('B: 4 / 6', 720, 4, 34, ROLE.modelB, 'mono'),
            txt('6 matched rows', 720, 88, 26, COSMOS.dim, 'sans'),
          ).opacity(preLift),
        );
      }
      if (postLift > 0.02) {
        nodes.push(
          group(
            txt('OBSERVED LIFT', 720, -150, 26, ROLE.threshold, 'mono'),
            glowTex('+\\frac{1}{6}', { x: 720, y: -48, size: 58, color: ROLE.threshold }),
            txt('+16.7 pp', 720, 56, 36, ROLE.modelB, 'mono').glow(8, ROLE.modelB),
            txt(
              pm > 0.5 ? '5 ties stay in denominator' : '1 extra pass / 6 tasks',
              720,
              130,
              26,
              COSMOS.muted,
              'sans',
            ),
          ).opacity(postLift),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2);
  cueTo(s, c, 'pair-prompt', promptP, 1, { dur: 0.7 });
  cueTo(s, c, 'pair-results', resP, 1, { dur: 0.85 });
  beatTo(s, c, 1, view2P, 1, { dur: 0.72 });
  cueTo(s, c, 'pair-table', tableP, 1, { dur: 0.75 });
  cueTo(s, c, 'pair-lift', liftP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'pair-differences', diffP, 1, { dur: 0.6 });
  cueTo(s, c, 'pair-ties', tiesP, 1, { dur: 0.55 });
  cueTo(s, c, 'pair-permission', permP, 1, { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// 3. protocol-identity: Which answer belongs to which task?
// Cues: protocol-identity-0, identity-order, hyp-identity-join*,
//       hyp-identity-missing*, protocol-identity-1, identity-cost-rule,
//       protocol-identity-2, hyp-identity-cluster
// ---------------------------------------------------------------------------
export function protocolIdentity(s, c) {
  const id0P = s.value(0);
  const orderP = s.value(0);
  const joinP = s.value(0);
  const missP = s.value(0);
  const v2P = s.value(0);
  const costP = s.value(0);
  const v3P = s.value(0);
  const clustP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.lift, seed: 3 }));
  s.add(decorAura(0, 20, 520, '#5ce1e61a', '#ffd16610'));

  const headline = heroTitle(['Match by Task ID,', 'Freeze the Protocol'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 60,
    accent: ROLE.lift,
    eyebrow: 'JOIN INTEGRITY  ·  CLUSTERS  ·  COST BAR',
  });

  // View 1 (Beat 0): Finish-time misalignment -> join by task ID -> timeout policy
  const view1 = guardedDynamic(
    () => fadeOut(v2P.value),
    (vis) => {
      const ord = orderP.value;
      const jn = smooth(joinP.value);
      const ms = missP.value;
      const nodes = [];

      const aRows = [
        { id: 'timestamp', pass: 1 },
        { id: 'cache expiry', pass: 0 },
      ];
      const arrivals = [aRows[1], aRows[0]];
      const joined = joinTaskResults(aRows, ms > 0.5 ? arrivals.slice(0, 1) : arrivals);

      const xA = -470;
      const xMid = 0;
      const xB = 470;
      const yTop = -85;
      const yGap = 210;

      nodes.push(
        txt('CURRENT A', xA, -210, 28, ROLE.modelA, 'mono'),
        txt('CHALLENGER B', xB, -210, 28, ROLE.modelB, 'mono'),
        txt(
          ms > 0.5
            ? 'MISSING RESULT POLICY'
            : jn > 0.5
              ? 'JOINED BY TASK ID'
              : 'ALIGNED BY FINISH TIME',
          xMid,
          -210,
          26,
          ms > 0.5 ? ROLE.warning : jn > 0.5 ? ROLE.modelB : ROLE.danger,
          'mono',
        ),
      );

      aRows.forEach((row, i) => {
        const y = yTop + i * yGap;
        nodes.push(
          rect(420, 92, { fill: '#101a30', stroke: ROLE.modelA, width: 2.6, radius: 14 }).at(xA, y),
          txt(`${row.id}  ·  ${row.pass ? 'pass' : 'fail'}`, xA, y, 28, ROLE.modelA, 'mono'),
        );
        const pair = joined.rows[i];
        const rawDiff = arrivals[i].pass - row.pass;
        const diff = jn > 0.9 ? pair.difference : rawDiff;
        if (ord > 0.2 && (jn < 0.08 || jn > 0.92)) {
          const dLabel =
            diff === null
              ? 'timeout → fail'
              : diff === 0
                ? '0  (tie)'
                : diff > 0
                  ? '+1  (fake B)'
                  : '−1  (fake A)';
          const dCol = diff === null ? ROLE.warning : diff === 0 ? ROLE.modelB : ROLE.danger;
          nodes.push(
            line([xA + 220, y], [xB - 220, y], { stroke: dCol, width: 2.6, dash: [7, 6] }),
            txt(dLabel, xMid, y - 34, 26, dCol, 'mono'),
          );
        }
      });

      // Challenger B rows arc into matching ID slots
      arrivals.forEach((row, i) => {
        const targetIdx = aRows.findIndex((item) => item.id === row.id);
        const y = yTop + yGap * mix(i, targetIdx, jn);
        const x = xB + (i === 0 ? 150 : -150) * Math.sin(Math.PI * jn);
        const isTimeout = ms > 0.5 && row.id === 'timestamp';
        const col = isTimeout ? ROLE.warning : ROLE.modelB;
        nodes.push(
          rect(420, 92, {
            fill: isTimeout ? '#241a0f' : '#0f2620',
            stroke: col,
            width: 2.8,
            radius: 14,
          })
            .at(x, y)
            .glow(isTimeout ? 10 : 6, col),
          txt(
            `${row.id}  ·  ${isTimeout ? 'timeout' : row.pass ? 'pass' : 'fail'}`,
            x,
            y,
            28,
            col,
            'mono',
          ),
        );
      });

      // Bottom explanation with clean non-overlapping phases
      const preJoin = fadeOut(joinP.value);
      const midJoin = fadeIn(joinP.value) * fadeOut(ms);
      const postMiss = fadeIn(ms);
      if (preJoin > 0.02) {
        nodes.push(
          txt(
            ord > 0.25
              ? 'Finish-time alignment invents two fake wins'
              : 'Two tasks from the same six  ·  check arrival order',
            0,
            290,
            34,
            ord > 0.25 ? ROLE.danger : COSMOS.muted,
            'serif',
          ).opacity(preJoin),
        );
      }
      if (midJoin > 0.02) {
        nodes.push(
          txt(
            'Match every result to its task ID  ·  both apparent wins vanish',
            0,
            290,
            34,
            ROLE.modelB,
            'serif',
          ).opacity(midJoin),
        );
      }
      if (postMiss > 0.02) {
        nodes.push(
          txt(
            'Keep timed-out rows in the denominator and apply the declared timeout policy',
            0,
            290,
            32,
            ROLE.warning,
            'serif',
          ).opacity(postMiss),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 1): Frozen experimental protocol manifest + +2 pp cost threshold
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value) * fadeOut(v3P.value),
    (vis) => {
      const cs = costP.value;
      const items = [
        ['CHECKPOINT HASHES', 'Exact weights for A and B'],
        ['PROMPT & HIDDEN TESTS', 'Identical suite and harness'],
        ['DECODING & SEEDS', 'Matched temperature & seeds'],
        ['LIMITS & BUDGET', 'Same tokens, timeout & attempts'],
        ['SELECTION RULE', 'Fix how one answer is chosen'],
        ['PREPLANNED TEST', 'Direction, count & stop rule'],
        ['RESERVE HOLDOUT', 'Fresh tasks for the winner'],
        ['COST THRESHOLD', 'Lower lift bound > +2.0 pp'],
      ];
      const nodes = [];
      items.forEach(([title, sub], i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col === 0 ? -780 : 60;
        const y = -195 + row * 124;
        const isCost = i === 7;
        const accent = isCost ? (cs > 0.3 ? ROLE.threshold : COSMOS.dim) : ROLE.lift;
        nodes.push(
          glowDot(x, y, {
            radius: isCost && cs > 0.3 ? 11 : 7,
            color: accent,
            glow: isCost ? 12 : 6,
          }),
          txt(title, x + 32, y - 14, 26, accent, 'mono', 'left'),
          txt(
            sub,
            x + 32,
            y + 24,
            26,
            isCost && cs > 0.3 ? COSMOS.ink : COSMOS.muted,
            'sans',
            'left',
          ),
        );
      });

      if (cs > 0.05) {
        nodes.push(
          txt(
            'Switch only if lower 95% lift bound clears +2 percentage points',
            0,
            345,
            34,
            ROLE.threshold,
            'serif',
          )
            .glow(8, ROLE.threshold)
            .opacity(cs),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 2): 20 variants inside 1 repository cluster R1
  const view3 = guardedDynamic(
    () => fadeIn(v3P.value),
    (vis) => {
      const cl = clustP.value;
      const count = Math.max(2, Math.round(20 * cl));
      const nodes = [
        rect(1440, 410, { fill: '#0c1528', stroke: ROLE.lift, width: 2.8, radius: 22 })
          .at(0, 40)
          .glow(8, ROLE.lift),
        txt('REPOSITORY CLUSTER R1  ·  SHARED FAILURE MODES', 0, -125, 28, ROLE.lift, 'mono'),
      ];

      for (let i = 0; i < 20; i++) {
        const col = i % 10;
        const row = Math.floor(i / 10);
        const cx = -585 + col * 130;
        const cy = -18 + row * 138;
        const active = i < count;
        nodes.push(
          circle(36, {
            fill: active ? '#132645' : '#0d1424',
            stroke: active ? ROLE.modelA : '#2c3a5c',
            width: active ? 2.6 : 1.5,
          })
            .at(cx, cy)
            .glow(active ? 7 : 0, ROLE.modelA),
          txt(`V${i + 1}`, cx, cy, 26, active ? COSMOS.ink : COSMOS.dim, 'mono'),
        );
      }

      nodes.push(
        txt(
          '20 variants from 1 repo ≠ 20 independent tasks  ·  resample whole clusters',
          0,
          325,
          32,
          ROLE.threshold,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  cueTo(s, c, 'protocol-identity-0', id0P, 1, { dur: 0.5 });
  cueTo(s, c, 'identity-order', orderP, 1, { dur: 0.6 });
  cueTo(s, c, 'hyp-identity-join', joinP, 1, { after: true, dur: 0.9 });
  cueTo(s, c, 'hyp-identity-missing', missP, 1, { after: true, dur: 0.65 });
  beatTo(s, c, 1, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'protocol-identity-1', id0P, 1, { dur: 0.4 });
  cueTo(s, c, 'identity-cost-rule', costP, 1, { dur: 0.7 });
  beatTo(s, c, 2, v3P, 1, { dur: 0.72 });
  cueTo(s, c, 'protocol-identity-2', id0P, 1, { dur: 0.4 });
  cueTo(s, c, 'hyp-identity-cluster', clustP, 1, { dur: 1.1 });
}

// ---------------------------------------------------------------------------
// 4. forty-tasks: Finish the planned forty-task experiment
// Cues: forty-arrive, forty-sort, forty-lift, direction-plan
// ---------------------------------------------------------------------------
export function fortyTasks(s, c) {
  const arrP = s.value(0);
  const sortP = s.value(0);
  const liftP = s.value(0);
  const dirP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.modelB, seed: 4 }));
  s.add(decorAura(-380, 40, 480, '#60a5fa1a', '#07091000'));
  s.add(decorAura(340, 40, 480, '#6ee7b71e', '#ff6b8b14'));

  const headline = heroTitle(['Finish the Planned', 'Forty-Task Run'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.modelB,
    eyebrow: '40 MATCHED TASKS  ·  ONE ATTEMPT EACH',
  });

  // Precompute unsorted (10x4 grid) and sorted (3 semantic clusters) positions for all 40 rows
  const unsortedPos = taskRows.map((_, i) => [
    -720 + (i % 10) * 160,
    -175 + Math.floor(i / 10) * 92,
  ]);
  const ranks = [0, 0, 0];
  const sortedPos = taskRows.map((row) => {
    const g = row.difference === 0 ? 0 : row.difference > 0 ? 1 : 2;
    const k = ranks[g]++;
    if (g === 0) {
      // 27 agreements: 5 columns x 6 rows on left
      return [-760 + (k % 5) * 124, -145 + Math.floor(k / 5) * 68];
    }
    if (g === 1) {
      // 8 B-only passes: 2 columns x 4 rows in center-right
      return [95 + (k % 2) * 145, -145 + Math.floor(k / 2) * 84];
    }
    // 5 A-only passes: 2 columns x 3 rows on far right
    return [550 + (k % 2) * 145, -145 + Math.floor(k / 2) * 84];
  });

  const live = dynamic(() => {
    const ar = arrP.value;
    const sr = sortP.value;
    const lf = liftP.value;
    const dr = dirP.value;
    const visibleCount = Math.min(40, Math.floor(6 + 34 * ar));
    const nodes = [];

    const drawTile = (row, i, x, y, shown) => {
      const isPerm = row.id === 'T02';
      const col =
        row.difference > 0 ? ROLE.modelB : row.difference < 0 ? ROLE.danger : COSMOS.muted;
      if (shown) {
        return group(
          rect(104, 48, {
            fill: row.difference > 0 ? '#0e271f' : row.difference < 0 ? '#27121e' : '#121a2f',
            stroke: isPerm ? ROLE.threshold : col,
            width: isPerm ? 2.8 : 1.8,
            radius: 10,
          })
            .at(x, y)
            .glow(row.difference !== 0 ? 7 : 0, isPerm ? ROLE.threshold : col),
          txt(row.id, x, y, 26, isPerm ? ROLE.threshold : col, 'mono'),
        );
      }
      return rect(104, 48, { fill: '#0b1120', stroke: '#233050', width: 1.2, radius: 10 })
        .at(x, y)
        .opacity(0.45);
    };

    // Non-overlapping crossfade from 10x4 unsorted grid to 3 sorted semantic clusters
    const preSort = fadeOut(sr);
    const postSort = fadeIn(sr);

    if (preSort > 0.02) {
      const uNodes = [
        txt(`${visibleCount} of 40 matched tasks scored`, 160, -340, 30, ROLE.lift, 'mono', 'left'),
      ];
      for (let i = 0; i < 40; i++) {
        uNodes.push(
          drawTile(taskRows[i], i, unsortedPos[i][0], unsortedPos[i][1], i < visibleCount),
        );
      }
      nodes.push(group(...uNodes).opacity(preSort));
    }

    if (postSort > 0.02) {
      const sNodes = [
        txt('27 AGREEMENTS', -512, -225, 28, COSMOS.muted, 'mono'),
        txt('8 B-ONLY', 168, -225, 28, ROLE.modelB, 'mono'),
        txt('5 A-ONLY', 622, -225, 28, ROLE.danger, 'mono'),
      ];
      for (let i = 0; i < 40; i++) {
        sNodes.push(drawTile(taskRows[i], i, sortedPos[i][0], sortedPos[i][1], true));
      }
      nodes.push(group(...sNodes).opacity(postSort));
    }

    // Bottom formula & preplanned direction band
    const preLift = fadeOut(lf);
    const postLift = fadeIn(lf);
    if (preLift > 0.02) {
      nodes.push(
        txt(
          'Same one-attempt protocol  ·  sort ties, B wins, and A wins',
          0,
          330,
          32,
          COSMOS.muted,
          'serif',
        ).opacity(preLift),
      );
    }
    if (postLift > 0.02) {
      nodes.push(
        group(
          glowTex('\\hat{\\Delta} = \\frac{8 - 5}{40} = +7.5\\text{ pp}', {
            x: -250,
            y: 330,
            size: 46,
            color: ROLE.threshold,
          }),
          dr > 0.05
            ? txt(
                'Preplanned one-sided test: does B improve pass rate?',
                390,
                330,
                28,
                ROLE.lift,
                'serif',
              ).opacity(dr)
            : txt('Net gain: +3 passes across 40 tasks', 390, 330, 28, COSMOS.muted, 'sans'),
        ).opacity(postLift),
      );
    }

    return group(...nodes);
  });

  s.add(headline, live);
  cueTo(s, c, 'forty-arrive', arrP, 1, { dur: 1.0 });
  cueTo(s, c, 'forty-sort', sortP, 1, { dur: 1.1 });
  cueTo(s, c, 'forty-lift', liftP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'direction-plan', dirP, 1, { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 5. null-model: What would a fair contest produce?
// Cues: null-single, null-half*, null-signs, null-count, null-enumerate,
//       null-bar-share
// ---------------------------------------------------------------------------
export function nullModel(s, c) {
  const singleP = s.value(0);
  const halfP = s.value(0);
  const v2P = s.value(0);
  const signsP = s.value(0);
  const countP = s.value(0);
  const v3P = s.value(0);
  const enumP = s.value(0);
  const shareP = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.modelA, seed: 5 }));
  s.add(decorAura(0, 60, 560, '#60a5fa1e', '#ffd16610'));

  const headline = heroTitle(['What a Fair Coin', 'Would Produce'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 62,
    accent: ROLE.modelA,
    eyebrow: 'EXACT SIGN-TEST NULL  ·  BINOMIAL(13, 0.5)',
  });

  // View 1 (Beat 0): Single disagreement forks into A wins / B wins (1/2)
  const view1 = guardedDynamic(
    () => fadeOut(v2P.value),
    (vis) => {
      const sg = smooth(singleP.value);
      const hf = halfP.value;
      const nodes = [];

      // Left list of 6 observed tasks
      nodes.push(txt('SIX INITIAL TASKS', -790, -210, 26, COSMOS.muted, 'mono', 'left'));
      taskRows.slice(0, 6).forEach((row, i) => {
        const y = -135 + i * 74;
        const isPerm = row.difference !== 0;
        nodes.push(
          txt(
            row.task,
            -790,
            y,
            isPerm ? 30 : 27,
            isPerm ? ROLE.threshold : COSMOS.muted,
            'sans',
            'left',
          ),
          txt(
            isPerm ? 'B won' : 'tie',
            -420,
            y,
            isPerm ? 30 : 27,
            isPerm ? ROLE.threshold : COSMOS.dim,
            'mono',
            'left',
          ),
        );
      });

      // Right fair-coin fork from permission row
      const originX = -140;
      const originY = -30;
      const endX = mix(originX + 120, 410, sg);
      const topY = mix(originY, -170, sg);
      const botY = mix(originY, 110, sg);

      nodes.push(
        txt('EQUAL-WIN BOUNDARY  (q = 0.5)', 280, -250, 28, ROLE.lift, 'mono'),
        glowDot(originX, originY, { radius: 13, color: ROLE.threshold, glow: 14 }),
        arrow([originX + 18, originY - 8], [endX - 18, topY], {
          stroke: ROLE.danger,
          width: 4,
        }).glow(8, ROLE.danger),
        arrow([originX + 18, originY + 8], [endX - 18, botY], {
          stroke: ROLE.modelB,
          width: 4,
        }).glow(8, ROLE.modelB),
      );

      if (sg > 0.65) {
        const op = (sg - 0.65) / 0.35;
        nodes.push(
          group(
            circle(48, { fill: '#261220', stroke: ROLE.danger, width: 3 })
              .at(510, -170)
              .glow(10, ROLE.danger),
            txt('A wins', 655, -170, 32, ROLE.danger, 'mono'),
            txt('50%', 510, -170, 26, ROLE.danger, 'mono'),
            circle(48, { fill: '#0f2720', stroke: ROLE.modelB, width: 3 })
              .at(510, 110)
              .glow(10, ROLE.modelB),
            txt('B wins', 655, 110, 32, ROLE.modelB, 'mono'),
            txt('50%', 510, 110, 26, ROLE.modelB, 'mono'),
          ).opacity(op),
        );
      }

      const preHalf = fadeOut(hf);
      const postHalf = fadeIn(hf);
      if (preHalf > 0.02) {
        nodes.push(
          txt(
            'One disagreement  ·  two equally likely directions',
            280,
            285,
            32,
            COSMOS.muted,
            'serif',
          ).opacity(preHalf),
        );
      }
      if (postHalf > 0.02) {
        nodes.push(
          glowTex('P_0 = \\frac{1}{2}', {
            x: 280,
            y: 285,
            size: 52,
            color: ROLE.modelB,
          }).opacity(postHalf),
        );
      }

      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 1): 13 fixed disagreement IDs receive fair coin signs
  const view2 = guardedDynamic(
    () => fadeIn(v2P.value) * fadeOut(v3P.value),
    (vis) => {
      const sg = signsP.value;
      const cn = countP.value;
      const firstSigns = studies.null[0].signs;
      const drawn = Math.min(13, Math.floor(13.99 * sg));
      const bWins = firstSigns.slice(0, drawn).reduce((a, b) => a + b, 0);
      const nodes = [
        txt('KEEP THE 13 DISAGREEMENTS  ·  ASSIGN FAIR COINS', 0, -225, 28, ROLE.lift, 'mono'),
      ];

      DISAGREEMENTS.forEach((row, i) => {
        const col = i % 7;
        const r = Math.floor(i / 7);
        const cx = (r === 0 ? -660 : -550) + col * 220;
        const cy = -75 + r * 195;
        const isDrawn = i < drawn;
        const isB = firstSigns[i] === 1;
        const colStroke = !isDrawn ? '#3a4b73' : isB ? ROLE.modelB : ROLE.danger;

        nodes.push(
          txt(row.id, cx, cy - 68, 26, COSMOS.muted, 'mono'),
          circle(38, {
            fill: !isDrawn ? '#10182b' : isB ? '#0f2720' : '#261220',
            stroke: colStroke,
            width: isDrawn ? 3 : 2,
          })
            .at(cx, cy)
            .glow(isDrawn ? 9 : 0, colStroke),
          txt(!isDrawn ? '?' : isB ? 'B' : 'A', cx, cy, 34, colStroke, 'mono'),
        );
      });

      nodes.push(
        txt(
          `${bWins} B wins   ·   ${drawn} of 13 fair directions drawn`,
          0,
          265,
          36,
          cn > 0.3 ? ROLE.modelB : COSMOS.ink,
          'mono',
        ).glow(cn > 0.3 ? 8 : 0, ROLE.modelB),
        txt('27 ties remain parked out of this count', 0, 340, 28, COSMOS.muted, 'serif'),
      );

      return group(...nodes).opacity(vis);
    },
  );

  // View 3 (Beat 2): All 8,192 assignments build Binomial(13, 0.5) histogram + smooth spline
  const view3 = guardedDynamic(
    () => fadeIn(v3P.value),
    (vis) => {
      const en = enumP.value;
      const sh = shareP.value;
      const total = NULL_WIN_COUNTS.length;
      const nShown = Math.max(1, Math.min(total, 1 + Math.floor((total - 1) * en)));
      const counts = new Array(14).fill(0);
      for (let i = 0; i < nShown; i++) counts[NULL_WIN_COUNTS[i]]++;

      const x0 = -760;
      const barSpan = 1520;
      const baseY = 210;
      const maxH = 385;
      const maxMass = 0.23;
      const step = barSpan / 14;
      const barW = step - 22;

      const nodes = [
        txt(
          `${nShown.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} equally likely assignments`,
          0,
          -240,
          34,
          COSMOS.ink,
          'mono',
        ),
        line([x0 - 20, baseY], [x0 + barSpan + 20, baseY], { stroke: '#4d6499', width: 2.8 }),
      ];

      const splinePts = [];
      for (let k = 0; k <= 13; k++) {
        const cx = x0 + (k + 0.5) * step;
        const share = counts[k] / total;
        const h = (share / maxMass) * maxH;
        const highlight = sh > 0.5 ? k === 8 : k === NULL_WIN_COUNTS[0];
        const col = highlight ? (sh > 0.5 ? ROLE.threshold : ROLE.lift) : ROLE.modelA;

        if (h > 1.5) {
          nodes.push(glowCol(cx, baseY, barW, h, col, { glow: highlight ? 12 : 5, radius: 6 }));
        }
        nodes.push(txt(String(k), cx, baseY + 38, 26, highlight ? col : COSMOS.muted, 'mono'));
        splinePts.push([cx, baseY - (BINOMIAL_13[k] / maxMass) * maxH]);
      }

      if (en > 0.7) {
        nodes.push(
          neonCurve(splinePts, [ROLE.modelA, ROLE.lift, ROLE.modelA], {
            width: 3.2,
            glow: 8,
            opacity: Math.min(0.85, (en - 0.7) / 0.3),
          }),
        );
      }

      nodes.push(
        txt('B wins among 13 fair disagreements', 0, baseY + 86, 28, COSMOS.muted, 'sans'),
        txt(
          sh > 0.5 ? 'Observed 8: which bars favor B?' : 'Bar height = share of 8,192 assignments',
          0,
          365,
          34,
          sh > 0.5 ? ROLE.threshold : ROLE.lift,
          'serif',
        ),
      );

      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view1, view2, view3);
  cueTo(s, c, 'null-single', singleP, 1, { dur: 0.9 });
  cueTo(s, c, 'null-half', halfP, 1, { after: true, dur: 0.2 });
  beatTo(s, c, 1, v2P, 1, { dur: 0.72 });
  cueTo(s, c, 'null-signs', signsP, 1, { dur: 1.5 });
  cueTo(s, c, 'null-count', countP, 1, { dur: 0.5 });
  beatTo(s, c, 2, v3P, 1, { dur: 0.72 });
  cueTo(s, c, 'null-enumerate', enumP, 1, { dur: 2.0 });
  cueTo(s, c, 'null-bar-share', shareP, 1, { dur: 0.3 });
}
