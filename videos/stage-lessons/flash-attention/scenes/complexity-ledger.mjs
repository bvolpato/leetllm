// Scene 17: Scale mathematical work, auxiliary state and IO on separate axes: 3 glowing scaling curves.
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const X0 = -300;
const X1 = 810;
const Y0 = 285;
const Y1 = -255;
// n in [1 .. 4] normalized sequence multiplier, y in [0 .. 16] normalized cost
const mapX = (n) => X0 + ((n - 1) / 3) * (X1 - X0);
const mapY = (v) => Y0 - (Math.min(16, v) / 16) * (Y0 - Y1);

export default function complexityLedger(s, c) {
  const phase = s.value(0);
  const drawCurves = s.value(0.35);
  const showIoFormula = s.value(0);
  const doubleN = s.value(0);
  const doubleM = s.value(0);

  const bgAura = aura(180, 10, 560, '#5ce1e622', '#ffd16614');
  const title = heroTitle(['Separate', 'Scaling Axes'], {
    x: -855,
    y: -410,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'COMPUTE · AUXILIARY STATE · HBM IO',
  });

  const eqIo = glowTex(String.raw`\Theta\!\left(\frac{N^2 d^2}{M}\right)\;\; (d \le M \le Nd)`, {
    x: -640,
    y: -140,
    size: 28,
    color: COSMOS.cyan,
  });

  const live = guardedDynamic(1, () => {
    const dc = drawCurves.value;
    const io = showIoFormula.value;
    const dn = doubleN.value;
    const dm = doubleM.value;

    const nCur = 1 + dn; // 1 -> 2
    const mCur = 1 + dm; // 1 -> 2
    const maxSample = Math.max(2, Math.floor(dc * 48));

    const pts = (fn) =>
      Array.from({ length: maxSample }, (_, i) => {
        const n = 1 + (3 * i) / 47;
        return [mapX(n), mapY(fn(n))];
      });

    const flopsPts = pts((n) => n * n);
    const ioPts = pts((n) => (n * n) / mCur);
    const lsePts = pts((n) => n);

    const nodes = [
      line([X0, Y0], [X1, Y0], { stroke: '#465885', width: 2.4 }),
      line([X0, Y0], [X0, Y1], { stroke: '#465885', width: 2.4 }),
      txt(
        'Sequence length multiplier (N / N₀)',
        (X0 + X1) * 0.5,
        Y0 + 78,
        28,
        COSMOS.muted,
        'sans',
      ),
      txt('Relative cost', X0 - 16, Y1 - 40, 26, COSMOS.muted, 'mono', 'right'),
    ];

    for (const n of [1, 2, 3, 4]) {
      const gx = mapX(n);
      nodes.push(
        line([gx, Y0], [gx, Y1], { stroke: '#1c2745', width: 1.2 }),
        txt(`${n}×`, gx, Y0 + 36, 26, n === 2 && dn > 0.5 ? COSMOS.gold : COSMOS.muted, 'mono'),
      );
    }
    for (const v of [2, 4, 8, 16]) {
      const gy = mapY(v);
      nodes.push(
        line([X0, gy], [X1, gy], { stroke: '#1c2745', width: 1.2 }),
        txt(`${v}×`, X0 - 20, gy, 26, COSMOS.muted, 'mono', 'right'),
      );
    }

    // Three luminous curves + clean top-left legend away from curve strokes
    nodes.push(
      glowingTrail(flopsPts, { color: COSMOS.gold, width: 4.5, glow: 10 }),
      glowingTrail(ioPts, { color: COSMOS.cyan, width: 4.5, glow: 10 }),
      glowingTrail(lsePts, { color: COSMOS.violet, width: 4.2, glow: 9 }),
      txt('Dense FLOPs: O(N² d)', X0 + 28, Y1 + 32, 26, COSMOS.gold, 'mono', 'left').glow(
        5,
        COSMOS.gold,
      ),
      txt(
        dm > 0.5 ? 'Tiled IO (2× M): O(N²d²/2M)' : 'Tiled IO: O(N² d² / M)',
        X0 + 28,
        Y1 + 76,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).glow(5, COSMOS.cyan),
      txt('Saved LSE: O(N)', X0 + 28, Y1 + 120, 26, COSMOS.violet, 'mono', 'left').glow(
        5,
        COSMOS.violet,
      ),
    );

    // Live markers at nCur (1 -> 2)
    const cx = mapX(nCur);
    const fVal = nCur * nCur;
    const ioVal = (nCur * nCur) / mCur;
    const lseVal = nCur;
    nodes.push(
      line([cx, Y0], [cx, mapY(fVal)], { stroke: COSMOS.gold, width: 1.8, dash: [6, 6] }).opacity(
        0.65,
      ),
      glowDot(cx, mapY(fVal), { radius: 8, color: COSMOS.gold }),
      glowDot(cx, mapY(ioVal), { radius: 8, color: COSMOS.cyan }),
      glowDot(cx, mapY(lseVal), { radius: 8, color: COSMOS.violet }),
    );

    // Left live ledger readout
    nodes.push(
      glassCell(-635, 115, 390, 290, dm > 0.5 ? COSMOS.emerald : COSMOS.cyan, {
        fill: '#0f172b',
        glow: 8,
      }),
      txt(
        dm > 0.5 ? '2× N AND 2× M' : dn > 0.5 ? '2× N (FIXED M)' : 'BASELINE (1× N)',
        -635,
        12,
        26,
        COSMOS.gold,
        'mono',
      ),
      txt(`FLOPs:  ${fVal.toFixed(1)}×`, -795, 76, 30, COSMOS.gold, 'mono', 'left'),
      txt(`HBM IO: ${ioVal.toFixed(1)}×`, -795, 134, 30, COSMOS.cyan, 'mono', 'left'),
      txt(`LSE:    ${lseVal.toFixed(1)}×`, -795, 192, 30, COSMOS.violet, 'mono', 'left'),
      txt(
        io > 0.5 ? 'M = fast mem scalars' : 'Workspace: O(Br·Bc)',
        -795,
        240,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqIo, live);
  runPhase(s, c, phase, 10);

  c.on('complexity-ledger-beat-1', () => s.play(drawCurves.to(1, { duration: 1.0 })));
  c.on('complexity-ledger-beat-2', () => s.play(showIoFormula.to(1, { duration: 0.5 })));
  c.on('complexity-ledger-beat-3', () => s.play(doubleN.to(1, { duration: 0.9 })));
  c.on('fa-scale-memory', () =>
    s.play(doubleM.to(1, { duration: remainDuration(c, 'fa-scale-memory', 0.9) })),
  );
}
