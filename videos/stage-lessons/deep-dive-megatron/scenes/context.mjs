// Scene 13: Which keys can the query at six read? (Context parallelism: 4 local blue [0,1,2,6]=21 + 3 remote pink [3,4,5]=8 -> 29/7=4.14; pos 7=90 masked; weighted 4/7 & 3/7 vs equal 3.96).
import {
  COSMOS,
  CTX_SPLITS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function context(s, c) {
  const phase = s.value(0);
  // step: 0=query6, 1=local 21/4=5.25, 2=remote options (HOLD!), 3=recv3, 4=recv4, 5=recv5, 6=29/7=4.14, 7=pos7=90 masked, 8=equal 3.96, 9=weighted 4/7 & 3/7
  const step = s.value(0);

  const bgAura = aura(0, 15, 640, '#5ce1e61c', '#f472b618');
  const title = heroTitle(['Which Keys Can', 'Query 6 Read?'], {
    x: -855,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.cp,
    eyebrow: 'CONTEXT PARALLELISM · GLOBAL POSITIONS & CAUSAL MASK',
  });

  const positions = [
    { pos: 0, val: CTX_SPLITS[0][0], owner: 'local' },
    { pos: 1, val: CTX_SPLITS[0][1], owner: 'local' },
    { pos: 2, val: CTX_SPLITS[0][2], owner: 'local' },
    { pos: 3, val: CTX_SPLITS[1][0], owner: 'remote' },
    { pos: 4, val: CTX_SPLITS[1][1], owner: 'remote' },
    { pos: 5, val: CTX_SPLITS[1][2], owner: 'remote' },
    { pos: 6, val: CTX_SPLITS[0][3], owner: 'local', isQuery: true },
    { pos: 7, val: 90, owner: 'remote', future: true },
  ];

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    nodes.push(
      txt(
        'GLOBAL SEQUENCE (CP0 blue: pos 0,1,2,6 | CP1 pink: pos 3,4,5,7)',
        0,
        -245,
        26,
        COSMOS.muted,
        'mono',
      ),
    );

    // 8 global position slots
    positions.forEach((slot, i) => {
      const x = -700 + i * 200;
      const y = -115;
      const arrived =
        slot.owner === 'local' ||
        (slot.pos === 3 && st >= 3) ||
        (slot.pos === 4 && st >= 4) ||
        (slot.pos === 5 && st >= 5);
      const isFutureBlocked = slot.future && st >= 7;
      const col = slot.isQuery
        ? COSMOS.gold
        : isFutureBlocked
          ? ROLE.bad
          : slot.owner === 'local'
            ? ROLE.tp
            : arrived
              ? COSMOS.magenta
              : ROLE.dim;

      nodes.push(
        txt(`pos ${slot.pos}${slot.isQuery ? ' (Q)' : ''}`, x, y - 78, 26, col, 'mono'),
        glassCell(x, y, 168, 96, col, {
          fill: isFutureBlocked
            ? '#2d1222'
            : arrived
              ? slot.owner === 'local'
                ? '#11213a'
                : '#2a1428'
              : '#0c111e',
          glow: arrived || isFutureBlocked ? 8 : 2,
        }),
        txt(
          arrived ? `${slot.val}` : isFutureBlocked ? '90 (X)' : st >= 2 ? '?' : 'empty',
          x,
          y,
          30,
          isFutureBlocked ? ROLE.bad : arrived ? COSMOS.ink : COSMOS.muted,
          'mono',
        ),
      );
    });

    // Remote peer shelf (CP1 values waiting to cross)
    if (st >= 2 && st < 8) {
      const remoteVals = [
        { pos: 3, val: 2, sent: st >= 3 },
        { pos: 4, val: 4, sent: st >= 4 },
        { pos: 5, val: 2, sent: st >= 5 },
        { pos: 7, val: 90, sent: false, blocked: st >= 7 },
      ];
      nodes.push(txt('CP1 REMOTE:', -790, 48, 26, COSMOS.magenta, 'mono', 'left'));
      remoteVals.forEach((rv, idx) => {
        const rx = -340 + idx * 255;
        const col = rv.blocked ? ROLE.bad : rv.sent ? ROLE.good : COSMOS.magenta;
        nodes.push(
          glassCell(rx, 48, 220, 68, col, {
            fill: rv.blocked ? '#2d1222' : '#1f1224',
            glow: 6,
          }),
          txt(`p${rv.pos}: ${rv.val}`, rx, 48, 26, col, 'mono'),
        );
      });
    }

    // Running sum / mean ledger OR weighted-vs-equal comparison
    if (st < 8) {
      let runningSum = 21;
      let count = 4;
      if (st >= 3) {
        runningSum += 2;
        count += 1;
      }
      if (st >= 4) {
        runningSum += 4;
        count += 1;
      }
      if (st >= 5) {
        runningSum += 2;
        count += 1;
      }
      const avg = (runningSum / count).toFixed(2);
      const statusText =
        st === 0
          ? 'Local CP0 keys: positions 0, 1, 2, 6 (sum = 21)'
          : st === 1
            ? 'Local running mean: 21 / 4 = 5.25'
            : st === 2
              ? 'Predict: Which CP1 positions (3, 4, 5, 7) may cross to Query 6?'
              : st === 3
                ? 'Receive pos 3 (+2) -> running 23 / 5 = 4.60'
                : st === 4
                  ? 'Receive pos 4 (+4) -> running 27 / 6 = 4.50'
                  : st === 5
                    ? 'Receive pos 5 (+2) -> running 29 / 7 = 4.14'
                    : st === 6
                      ? 'Exact causal mean: 29 / 7 = 4.14 (4 local + 3 remote)'
                      : 'Pos 7 (90) stays behind causal boundary (7 > 6)';

      nodes.push(
        glassCell(0, 190, 1460, 102, st === 2 ? COSMOS.gold : ROLE.cp, {
          fill: '#101d32',
          glow: 9,
        }),
        txt(
          st === 2
            ? `Sum = ${runningSum} / ${count} (awaiting remote selection)`
            : `Sum = ${runningSum} / ${count} = ${avg}`,
          0,
          170,
          28,
          st === 2 ? COSMOS.gold : ROLE.good,
          'mono',
        ),
        txt(statusText, 0, 214, 26, COSMOS.ink, 'sans'),
      );
    } else {
      // Beat 3: Equal peer vote (3.96) vs Weighted mass (4/7 and 3/7 -> 4.14)
      nodes.push(
        glassCell(-410, 145, 720, 195, ROLE.bad, { fill: '#2a1220', glow: 8 }),
        txt('EQUAL PEER VOTE (WRONG)', -410, 82, 26, ROLE.bad, 'mono'),
        txt('0.5 x (21/4) + 0.5 x (8/3)', -410, 140, 28, COSMOS.ink, 'mono'),
        txt('= 3.96 (ignores 4 vs 3 key count)', -410, 200, 26, ROLE.bad, 'mono'),
        glassCell(410, 145, 720, 195, st >= 9 ? ROLE.good : ROLE.dim, {
          fill: st >= 9 ? '#0e2624' : '#0f1628',
          glow: st >= 9 ? 10 : 3,
        }),
        txt('MASS-WEIGHTED MERGE (EXACT)', 410, 82, 26, ROLE.good, 'mono'),
        txt('(4/7) x 5.25 + (3/7) x 2.67', 410, 140, 28, COSMOS.ink, 'mono'),
        txt('= 29 / 7 = 4.14 (softmax mass)', 410, 200, 26, ROLE.good, 'mono'),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-740 + u * 1480, 310, { radius: 6, color: ROLE.cp }),
      txt(
        'Context parallelism moves where keys live; global positions still decide causal visibility',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['ctx-find-query', 0],
    ['ctx-local-sum', 1],
    ['ctx-remote-options', 2],
    ['ctx-receive-three', 3, true],
    ['ctx-receive-four', 4, true],
    ['ctx-receive-five', 5, true],
    ['ctx-full-mean', 6, true],
    ['ctx-mask', 7, true],
    ['ctx-equal-peers', 8],
    ['ctx-masses', 9],
  ]);
}
