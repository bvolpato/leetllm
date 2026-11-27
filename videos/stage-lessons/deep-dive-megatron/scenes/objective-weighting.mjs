// Scene 19: How much should each replica contribute? (10/4=2.5 vs 5.0; equal-weight SGD on owned slices: w=[1,2,3,4], g_mean=[2,4,6,8], lr=0.1 -> [0.8, 1.6, 2.4, 3.2]).
import {
  COSMOS,
  OWNED_SGD,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function objectiveWeighting(s, c) {
  const step = s.value(0); // 0=token count 10/4, 1=2.5 vs 5, 2=equal weight col0 1->0.8, 3=all 4 slices [0.8,1.6,2.4,3.2]

  const bgAura = aura(0, 15, 620, '#34d3991c', '#f472b618');
  const title = heroTitle(['How Much Should Each', 'Replica Contribute?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.dp,
    eyebrow: 'GLOBAL TOKEN NORMALIZATION · OWNED-SLICE SGD',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 1) {
      // Token-count weighting: 1 blue (10) + 3 pink (0,0,0) = 4 tokens -> 2.5 vs rank average 5.0
      const tokens = [
        { label: 'Tok 0 (Blue)', g: '10', col: ROLE.tp },
        { label: 'Tok 1 (Pink)', g: '0', col: COSMOS.magenta },
        { label: 'Tok 2 (Pink)', g: '0', col: COSMOS.magenta },
        { label: 'Tok 3 (Pink)', g: '0', col: COSMOS.magenta },
      ];
      tokens.forEach((tk, i) => {
        const x = -540 + i * 360;
        nodes.push(
          glassCell(x, -135, 310, 130, tk.col, { fill: '#101b30', glow: 7 }),
          txt(tk.label, x, -166, 26, tk.col, 'mono'),
          txt(`grad = ${tk.g}`, x, -108, 30, COSMOS.ink, 'mono'),
        );
      });

      nodes.push(
        glassCell(-390, 95, 680, 170, ROLE.good, { fill: '#0e2624', glow: st >= 1 ? 10 : 5 }),
        txt('COUNT EVERY VALID TOKEN ONCE', -390, 48, 26, ROLE.good, 'mono'),
        txt('10 / 4  =  2.5', -390, 120, 38, ROLE.good, 'mono'),

        glassCell(390, 95, 680, 170, ROLE.bad, { fill: '#2d1222', glow: 6 }),
        txt('EQUAL HALF-VOTE PER REPLICA', 390, 48, 26, ROLE.bad, 'mono'),
        txt('(10 + 0) / 2  =  5.0', 390, 120, 38, ROLE.bad, 'mono'),
      );
    } else {
      // Equal-weight SGD across 2 owners: cols 0,1 on Owner 0; cols 2,3 on Owner 1
      const initW = OWNED_SGD.weights ?? [1, 2, 3, 4];
      const meanG = OWNED_SGD.meanGrad ?? [2, 4, 6, 8];
      const updW = OWNED_SGD.updated;
      nodes.push(
        txt(
          'EQUAL-WEIGHT REPLICAS · LR = 0.1 · OWNED-SLICE SGD UPDATE',
          0,
          -238,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
      initW.forEach((w0, i) => {
        const x = -540 + i * 360;
        const ownerCol = i < 2 ? ROLE.tp : ROLE.dp;
        const showUpdated = i === 0 || st >= 3;
        nodes.push(
          glassCell(x, -15, 315, 310, showUpdated ? ownerCol : ROLE.dim, {
            fill: showUpdated ? '#101e34' : '#0c1220',
            glow: showUpdated ? 9 : 3,
          }),
          txt(`Col ${i} (Owner ${i < 2 ? 0 : 1})`, x, -128, 26, ownerCol, 'mono'),
          txt(`w = ${w0.toFixed(1)}`, x, -64, 28, COSMOS.ink, 'mono'),
          txt(`g_mean = ${meanG[i].toFixed(1)}`, x, -4, 26, COSMOS.muted, 'mono'),
          txt(
            showUpdated ? `w' = ${updW[i].toFixed(1)}` : "w' = ?",
            x,
            78,
            34,
            showUpdated ? ROLE.good : COSMOS.gold,
            'mono',
          ),
        );
      });
    }

    nodes.push(
      txt(
        st >= 2
          ? `Joined updated vector across owners: [${OWNED_SGD.updated.map((v) => v.toFixed(1)).join(', ')}]`
          : 'When CP peers hold pieces of one sample, normalize by total valid tokens',
        0,
        345,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['mg-objective-weighting-b0', 0],
    ['mg-objective-normalize', 1],
    ['mg-objective-weighting-b1', 2],
    ['mg-sgd-updated', 3],
  ]);
}
