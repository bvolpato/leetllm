// Scene 01: One weight in slot 2: 3 + 30 + 300 + 3000 = 3333 -> All-Reduce (all 4 ranks) vs Reduce-Scatter (Rank 2 owns slot 2).
import {
  COSMOS,
  RANK_INPUTS,
  REDUCED_VEC,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function intro(s, c) {
  // step: 1=col2, 2=terms, 3=sum 3333, 4=dest question (hold!), 5=all-reduce all 4, 6=full vec, 7=sharded question (hold!), 8=which copy, 9=rank 2 keeps 3333, 10=diagonal shards
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61e', '#ffd16618');
  const title = heroTitle(['One Weight', 'in Slot 2'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.r2,
    eyebrow: 'ALL-REDUCE VS REDUCE-SCATTER OWNERSHIP',
  });

  const live = guardedDynamic(1, () => {
    const st = step.value;
    const rankCols = [ROLE.r0, ROLE.r1, ROLE.r2, ROLE.r3];

    const nodes = [
      txt('4 GPU RANKS · LOCAL GRADIENT VECTORS', -460, -225, 26, COSMOS.muted, 'mono'),
      txt(
        st >= 9
          ? 'REDUCE-SCATTER (OWNED SHARDS)'
          : st >= 7
            ? 'SHARDED OPTIMIZER OUTPUT?'
            : st >= 5
              ? 'ALL-REDUCE OUTPUT (ALL RANKS)'
              : 'OUTPUT BUFFERS',
        455,
        -225,
        26,
        st >= 9 ? ROLE.good : st >= 5 ? ROLE.comm : COSMOS.muted,
        'mono',
      ),
    ];

    for (let r = 0; r < 4; r++) {
      const y = -125 + r * 92;
      nodes.push(txt(`R${r}`, -825, y, 28, rankCols[r], 'mono'));
      for (let col = 0; col < 4; col++) {
        const lx = -695 + col * 155;
        const isSlot2 = col === 2;
        const hiIn = isSlot2 && st >= 1;
        nodes.push(
          glassCell(lx, y, 138, 72, hiIn ? COSMOS.gold : COSMOS.dim, {
            fill: hiIn ? '#261e0e' : '#0f182a',
            glow: hiIn ? 8 : 1,
          }),
          txt(String(RANK_INPUTS[r][col]), lx, y, 28, hiIn ? COSMOS.gold : COSMOS.ink, 'mono'),
        );

        // Right output buffer matrix
        const rx = 225 + col * 155;
        let outTxt = '...';
        let outCol = COSMOS.dim;
        let outFill = '#0a0f1c';
        if (st >= 10) {
          if (r === col) {
            outTxt = String(REDUCED_VEC[col]);
            outCol = r === 2 ? ROLE.good : ROLE.comm;
            outFill = '#0d2624';
          }
        } else if (st >= 9) {
          if (r === 2 && col === 2) {
            outTxt = '3333';
            outCol = ROLE.good;
            outFill = '#0d2924';
          } else if (col === 2) {
            outTxt = '-';
          }
        } else if (st >= 7) {
          if (col === 2) {
            outTxt = '3333?';
            outCol = COSMOS.gold;
            outFill = '#1f1a0f';
          }
        } else if (st >= 6) {
          outTxt = String(REDUCED_VEC[col]);
          outCol = col === 2 ? ROLE.good : ROLE.comm;
          outFill = '#0e222e';
        } else if (st >= 5) {
          if (col === 2) {
            outTxt = '3333';
            outCol = ROLE.good;
            outFill = '#0d2924';
          }
        }
        nodes.push(
          glassCell(rx, y, 138, 72, outCol, { fill: outFill, glow: outCol !== COSMOS.dim ? 7 : 0 }),
          txt(outTxt, rx, y, 26, outCol !== COSMOS.dim ? outCol : COSMOS.dim, 'mono'),
        );
      }
    }

    // Center sum pill
    nodes.push(
      glassCell(-5, 14, 240, 146, st >= 3 ? COSMOS.gold : COSMOS.dim, {
        fill: st >= 3 ? '#261e0e' : '#0b101d',
        glow: st >= 3 ? 10 : 2,
      }),
      txt('SLOT 2 SUM', -5, -24, 26, COSMOS.muted, 'mono'),
      txt(
        st >= 3 ? '3,333' : st >= 2 ? '3+30+300+3k' : '?',
        -5,
        32,
        34,
        st >= 3 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),
    );

    nodes.push(
      txt(
        st >= 9
          ? 'Reduce-Scatter gives Rank 2 slot 2 (3333) and each rank its own slot'
          : st >= 7
            ? 'Predict: if each rank updates only its own numbered slot, which copy of 3333 is needed?'
            : st >= 5
              ? 'All-Reduce delivers 3333 (and all 4 sums) to every replica rank'
              : 'Predict: when every GPU updates a full replica, which ranks need 3333?',
        0,
        352,
        28,
        st >= 9 ? ROLE.good : COSMOS.gold,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['intro-column', 1],
    ['intro-terms', 2],
    ['intro-sum', 3, true],
    ['intro-destination', 4],
    ['intro-all-reduce', 5, true],
    ['nc-intro-b1-s1', 6, true],
    ['intro-sharded', 7],
    ['intro-which-copy', 8],
    ['intro-owner', 9, true],
    ['intro-shards', 10],
  ]);
}
