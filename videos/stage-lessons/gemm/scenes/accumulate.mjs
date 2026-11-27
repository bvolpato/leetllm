// Scene 06: One inner position remains: k=2 headers [0,2] & [3,0] -> strict prediction hold -> only bottom-left 1 -> 7!
import { markDecoration } from '../../cinematic-kit.mjs';
import {
  A,
  B,
  COSMOS,
  FULL_C,
  PANEL_K01,
  ROLE,
  aura,
  buildSystolicGemm3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function accumulate(s, c) {
  const kCursor = s.value(1);
  const loadedLast = s.value(0);
  const located = s.value(0);
  const updated = s.value(0);

  const bgAura = aura(400, 20, 520, '#6ee7b71e', '#ffd16618');
  const { view: gemm3d } = buildSystolicGemm3d(kCursor, { x: 435, y: 20, unit: 98 });

  const title = heroTitle(['One Inner Position', 'Remains'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'FINAL PANEL · K = 2 PREDICTION',
  });

  const colXs = [-525, -280];
  const rowYs = [25, 205];

  const live = guardedDynamic(1, () => {
    const ll = loadedLast.value > 0.5;
    const loc = located.value > 0.5;
    const upd = updated.value > 0.5;

    const nodes = [
      txt('FINAL SLICE k = 2', 435, -405, 26, COSMOS.gold, 'mono').glow(5, COSMOS.gold),
      txt(
        upd ? 'All four C cells ready to store' : 'Which of the four sums will change?',
        435,
        420,
        26,
        upd ? ROLE.good : COSMOS.gold,
        'sans',
      ),
    ];

    // Row headers A[:, 2] = [0, 2]
    for (let r = 0; r < 2; r++) {
      const y = rowYs[r];
      const val = A[r][2];
      const isZero = val === 0;
      nodes.push(
        glassCell(-745, y, 132, 92, ll ? (isZero ? COSMOS.dim : ROLE.a) : COSMOS.dim, {
          fill: isZero ? '#111524' : '#10203b',
          glow: ll && !isZero ? 10 : 0,
        }),
        txt(`A[${r},2]`, -745, y - 72, 26, ROLE.a, 'mono'),
        txt(ll ? String(val) : '·', -745, y, 42, isZero ? COSMOS.muted : ROLE.a, 'mono'),
      );
      if (ll) {
        nodes.push(
          line([-676, y], [-635, y], {
            stroke: isZero ? COSMOS.dim : ROLE.a,
            width: 2.8,
          }).opacity(isZero ? 0.35 : 0.8),
        );
      }
    }

    // Col headers B[2, :] = [3, 0]
    for (let col = 0; col < 2; col++) {
      const x = colXs[col];
      const val = B[2][col];
      const isZero = val === 0;
      nodes.push(
        glassCell(x, -145, 132, 92, ll ? (isZero ? COSMOS.dim : ROLE.b) : COSMOS.dim, {
          fill: isZero ? '#111524' : '#281122',
          glow: ll && !isZero ? 10 : 0,
        }),
        txt(`B[2,${col}]`, x, -218, 26, ROLE.b, 'mono'),
        txt(ll ? String(val) : '·', x, -145, 42, isZero ? COSMOS.muted : ROLE.b, 'mono'),
      );
      if (ll) {
        nodes.push(
          line([x, -96], [x, -42], { stroke: isZero ? COSMOS.dim : ROLE.b, width: 2.8 }).opacity(
            isZero ? 0.35 : 0.8,
          ),
        );
      }
    }

    // Four C accumulator cells (withhold highlighting bottom-left & value 7 until cues!)
    for (let r = 0; r < 2; r++) {
      for (let col = 0; col < 2; col++) {
        const cx = colXs[col];
        const cy = rowYs[r];
        const isTarget = r === 1 && col === 0;
        const val = isTarget && upd ? FULL_C[1][0] : PANEL_K01[r][col];
        const colStroke = isTarget && upd ? ROLE.good : isTarget && loc ? COSMOS.gold : ROLE.c;
        const subText = upd
          ? isTarget
            ? '1 + 6 = 7'
            : '+ 0'
          : loc && isTarget
            ? '2 × 3 here'
            : 'held sum';
        nodes.push(
          glassCell(cx, cy, 212, 118, colStroke, {
            fill: isTarget && upd ? '#0d2925' : '#0d2030',
            glow: isTarget && (loc || upd) ? 12 : 4,
          }),
          txt(String(val), cx, cy - 12, 46, colStroke, 'mono').glow(6, colStroke),
          txt(
            subText,
            cx,
            cy + 36,
            26,
            isTarget && (loc || upd) ? colStroke : COSMOS.muted,
            'mono',
          ),
        );
      }
    }

    nodes.push(
      txt(
        upd
          ? 'Exact integer regrouping · FP rounding can shift last bits'
          : loc
            ? 'Only bottom-left changes: 2 meets 3'
            : 'Predict: which of the four sums changes?',
        -855,
        388,
        28,
        upd ? ROLE.good : COSMOS.gold,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, gemm3d, title, live);
  orbitScene(s, c, gemm3d, { theta: -0.18, phi: 0.9 });

  c.on('last-inputs', () => {
    s.play(kCursor.to(2, { duration: remainDuration(c, 'last-inputs', 0.55) }));
    s.play(loadedLast.to(1, { duration: remainDuration(c, 'last-inputs', 0.5) }));
  });
  c.after('locate-cell', () =>
    s.play(located.to(1, { duration: remainDuration(c, 'locate-cell', 0.4) })),
  );
  c.after('last-crossing', () =>
    s.play(updated.to(1, { duration: remainDuration(c, 'last-crossing', 0.45) })),
  );
}
