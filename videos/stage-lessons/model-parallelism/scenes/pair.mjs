// Scene 07: Follow one output through both GPUs. Hidden slices [1,4] & [6,5] * B -> GPU 1 output 2 = 6*1 + 5*(-1) = 1 (strict hold!) -> [1,4]+[16,1]=[17,5] all-reduce.
import {
  B,
  COSMOS,
  ROLE,
  SHARDS,
  aura,
  circle,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainAfterDuration,
  remainBeatDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

const slices = [SHARDS.left, SHARDS.right];
const partials = [SHARDS.first, SHARDS.second];

function dotExpr(rank, col) {
  return slices[rank]
    .map((val, i) => {
      const w = B[rank * 2 + i][col];
      return `${val} × ${w < 0 ? '(−' + Math.abs(w) + ')' : w}`;
    })
    .join(' + ');
}

export default function pair(s, c) {
  const pFeat = s.value(0);
  const pMatch = s.value(0);
  const pPos = s.value(0);
  const pSigned = s.value(0);
  const pContract = s.value(0);
  const pOther = s.value(0);
  const pSum = s.value(0);
  const pCopyBeat = s.value(0);
  const pRecv = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#ffd16616');
  const title = heroTitle(['Follow One Output', 'Through Both GPUs'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'COL → RELU → ROW PROJECTION · SUM ALL-REDUCE',
  });

  const live = guardedDynamic(1, () => {
    const feat = pFeat.value > 0.2;
    const match = pMatch.value;
    const pos = pPos.value;
    const sig = pSigned.value;
    const cont = pContract.value > 0.5;
    const oth = pOther.value > 0.5;
    const sm = pSum.value > 0.5;
    const copyBeat = pCopyBeat.value > 0.5;
    const recv = pRecv.value;

    const colCenters = [-60, 500];
    const rowY = [-85, 115];

    const nodes = [
      txt('OUTPUT 1', colCenters[0], -200, 28, COSMOS.ink, 'mono'),
      txt('OUTPUT 2', colCenters[1], -200, 28, COSMOS.ink, 'mono'),
    ];

    slices.forEach((sl, rank) => {
      const col = rank === 0 ? ROLE.gpu0 : ROLE.gpu1;
      const y = rowY[rank];
      nodes.push(
        txt(`GPU ${rank}`, -815, y - 34, 30, col, 'mono', 'left'),
        txt(
          copyBeat ? 'Next layer input' : feat ? `h${rank} = [${sl.join(', ')}]` : 'hidden slice',
          -815,
          y + 18,
          28,
          copyBeat ? ROLE.good : COSMOS.ink,
          'mono',
          'left',
        ),
      );

      if (!copyBeat) {
        colCenters.forEach((cx, j) => {
          const showExpr = match > (rank * 2 + j) * 0.22;
          const isTarget = rank === 1 && j === 1 && match > 0.85 && !cont;
          const border = isTarget ? COSMOS.gold : col;
          nodes.push(
            glassCell(cx, y - 10, 440, 80, border, {
              fill: isTarget ? '#28200f' : rank === 0 ? '#10213d' : '#0e2b38',
              glow: isTarget ? 10 : 6,
            }),
            txt(
              showExpr ? dotExpr(rank, j) : '·',
              cx,
              y - 10,
              30,
              isTarget ? COSMOS.gold : COSMOS.ink,
              'mono',
            ),
          );

          const revOne = rank === 1 && j === 1 && sig > 0.85;
          const revCol = j === 0 ? oth : cont;
          if (revOne || revCol) {
            nodes.push(txt(`= ${partials[rank][j]}`, cx, y + 58, 34, col, 'mono').glow(6, col));
          }
        });
      }
    });

    if (copyBeat) {
      const midY = (rowY[0] + rowY[1]) * 0.5;
      const up = Math.min(1, recv * 2);
      const down = Math.max(0, recv * 2 - 1);
      colCenters.forEach((cx, j) => {
        const valStr = String(SHARDS.total[j]);
        const yUp = midY + (rowY[0] - midY) * up;
        nodes.push(
          glassCell(cx, yUp, 220, 82, COSMOS.gold, { fill: '#261f0e', glow: 10 }),
          txt(valStr, cx, yUp, 42, COSMOS.gold, 'mono'),
        );
        if (recv >= 0.45) {
          const yDn = midY + (rowY[1] - midY) * down;
          nodes.push(
            glassCell(cx, yDn, 220, 82, COSMOS.gold, { fill: '#261f0e', glow: 10 }),
            txt(valStr, cx, yDn, 42, COSMOS.gold, 'mono'),
          );
        }
      });
    }

    // Bottom region: signed number line during GPU 1 output 2 prediction, then summed equation
    if (sm || copyBeat) {
      nodes.push(
        glassCell(0, 325, 1140, 84, ROLE.good, { fill: '#0d2622', glow: 10 }),
        txt(
          copyBeat
            ? `Sum All-Reduce delivers [${SHARDS.total.join(', ')}] to both GPUs`
            : `[${SHARDS.first.join(', ')}] + [${SHARDS.second.join(', ')}] = [${SHARDS.total.join(', ')}]`,
          0,
          325,
          34,
          copyBeat ? ROLE.good : COSMOS.gold,
          'mono',
        ),
      );
    } else if (match > 0.85 && !cont) {
      const fwd = SHARDS.right[0] * B[2][1]; // +6
      const bwd = SHARDS.right[1] * B[3][1]; // -5
      const acc = fwd * pos + bwd * sig;
      const xStart = -180;
      const unit = 148;
      const yLine = 328;
      nodes.push(
        txt('GPU 1 · OUTPUT 2', -815, 295, 28, COSMOS.gold, 'mono', 'left'),
        txt(
          sig > 0.85 ? 'Lands at +1 (6 − 5)' : 'Predict: where does 6 + (−5) land?',
          -815,
          345,
          28,
          sig > 0.85 ? ROLE.good : COSMOS.ink,
          'sans',
          'left',
        ),
        line([xStart, yLine], [xStart + fwd * unit, yLine], { stroke: COSMOS.muted, width: 3.0 }),
      );
      for (let tick = 0; tick <= fwd; tick++) {
        const tx = xStart + tick * unit;
        nodes.push(
          line([tx, yLine - 8], [tx, yLine + 10], { stroke: COSMOS.muted, width: 2.5 }),
          txt(String(tick), tx, yLine + 44, 28, COSMOS.ink, 'mono'),
        );
      }
      nodes.push(
        circle(14, { fill: COSMOS.gold, stroke: COSMOS.ink, width: 2 })
          .at(xStart + acc * unit, yLine - 24)
          .glow(10, COSMOS.gold),
      );
    } else {
      nodes.push(
        txt(
          cont
            ? 'Add down each output column to reconstruct the hidden vector'
            : 'Each GPU multiplies its local hidden slice by its matching rows of B',
          0,
          325,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    nodes.push();
    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('complete-features', () =>
    s.play(pFeat.to(1, { duration: remainDuration(c, 'complete-features', 0.4) })),
  );
  c.on('matching-rows', () =>
    s.play(pMatch.to(1, { duration: remainDuration(c, 'matching-rows', 0.85) })),
  );
  c.on('positive-term', () =>
    s.play(pPos.to(1, { duration: remainDuration(c, 'positive-term', 0.6) })),
  );
  c.on('signed-one', () =>
    s.play(pSigned.to(1, { duration: remainDuration(c, 'signed-one', 0.75) })),
  );
  c.after('contracted-contributions', () =>
    s.play(pContract.to(1, { duration: remainAfterDuration(c, 'contracted-contributions', 0.4) })),
  );
  c.after('other-column', () =>
    s.play(pOther.to(1, { duration: remainAfterDuration(c, 'other-column', 0.4) })),
  );
  c.on('sum-contraction', () =>
    s.play(pSum.to(1, { duration: remainDuration(c, 'sum-contraction', 0.45) })),
  );
  c.onBeat(2, () => s.play(pCopyBeat.to(1, { duration: remainBeatDuration(c, 2, 0.3) })));
  c.on('both-receive', () =>
    s.play(pRecv.to(1, { duration: remainDuration(c, 'both-receive', 0.8) })),
  );
}
