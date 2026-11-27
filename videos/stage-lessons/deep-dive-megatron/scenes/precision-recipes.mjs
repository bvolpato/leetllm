// Scene 24: Choosing a precision recipe (Delayed amax=4 vs Current amax=32 outlier jump; MXFP8 per-32-element block scale & NVFP4; BF16 fixed-batch parity check).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function precisionRecipes(s, c) {
  // step: 0=amax 4 -> 32 outlier, 1=current scaling sees 32, 2=MXFP8 32-value blocks & NVFP4, 3=block scale highlight, 4=BF16 parity & validation
  const step = s.value(0);

  const bgAura = aura(0, 15, 620, '#f59e0b1c', '#5ce1e618');
  const title = heroTitle(['Choosing a', 'Precision Recipe'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.ep,
    eyebrow: 'DELAYED VS CURRENT SCALING · MXFP8 / NVFP4 · BF16 PARITY',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 1) {
      // Outlier jump: previous amax = 4, current last value = 32
      const vals = [1.5, 2.0, 3.5, 4.0, 2.5, 3.0, 3.8, 32.0];
      nodes.push(
        txt(
          'PREVIOUS TENSOR AMAX = 4.0   |   CURRENT TENSOR SPIKES TO 32.0',
          0,
          -232,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
      vals.forEach((v, i) => {
        const x = -665 + i * 190;
        const isOutlier = i === 7;
        const h = isOutlier ? 210 : Math.round(v * 22);
        const col = isOutlier ? ROLE.bad : ROLE.tp;
        nodes.push(
          glassCell(x, 70 - h / 2, 130, h, col, {
            fill: isOutlier ? '#311322' : '#101f38',
            glow: isOutlier ? 12 : 4,
          }),
          txt(`${v}`, x, 70 - h - 26, 26, isOutlier ? ROLE.bad : COSMOS.ink, 'mono'),
        );
      });
      nodes.push(
        glassCell(-400, 185, 720, 118, ROLE.warn, { fill: '#1f1a10', glow: 6 }),
        txt('DELAYED SCALING: uses history (4.0)', -400, 162, 26, ROLE.warn, 'mono'),
        txt(
          'Can clip the 32.0 outlier before history updates',
          -400,
          210,
          26,
          COSMOS.muted,
          'sans',
        ),

        glassCell(400, 185, 720, 118, st >= 1 ? ROLE.good : ROLE.dim, {
          fill: st >= 1 ? '#0e2524' : '#0d1322',
          glow: st >= 1 ? 10 : 3,
        }),
        txt('CURRENT SCALING: sees 32.0 now', 400, 162, 26, ROLE.good, 'mono'),
        txt('Computes scale from this tensor immediately', 400, 210, 26, COSMOS.ink, 'sans'),
      );
    } else if (st <= 3) {
      // MXFP8 32-value blocks & NVFP4 smaller blocks
      nodes.push(
        txt(
          'BLOCK-SCALED RECIPES: LOCAL SCALE PER BLOCK ISOLATES OUTLIERS',
          0,
          -230,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
      for (let b = 0; b < 4; b++) {
        const x = -540 + b * 360;
        const col = b === 3 ? ROLE.ep : ROLE.tp;
        nodes.push(
          glassCell(x, -65, 315, 200, col, { fill: '#101f38', glow: st >= 3 ? 10 : 5 }),
          txt(`Block ${b} (32 vals)`, x, -120, 26, col, 'mono'),
          txt(`own scale s_${b}`, x, -58, 28, COSMOS.ink, 'mono'),
          txt(
            b === 3 ? 'outlier stays local' : 'full dynamic range',
            x,
            0,
            26,
            COSMOS.muted,
            'sans',
          ),
        );
      }
      nodes.push(
        glassCell(0, 165, 1460, 130, ROLE.cp, { fill: '#0f2034', glow: 7 }),
        txt(
          'MXFP8: 1 scale / 32 values   |   NVFP4: smaller blocks + safeguards',
          0,
          138,
          28,
          ROLE.cp,
          'mono',
        ),
        txt(
          'Count optimizer master weights, grads & Adam moments at their actual stored dtype',
          0,
          192,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    } else {
      // Beat 2: BF16 fixed-batch parity check -> validation -> checkpoint reload -> target GPU speed
      const gates = [
        { k: '1. BF16 Reference', d: 'Fixed-batch logits & loss', col: ROLE.tp },
        { k: '2. Recipe Tol', d: 'Check update vs BF16', col: ROLE.cp },
        { k: '3. Val + Reload', d: 'Val slice & ckpt reload', col: ROLE.dp },
        { k: '4. Target GPUs', d: 'Time only after pass', col: ROLE.ep },
      ];
      gates.forEach((g, i) => {
        const x = -630 + i * 420;
        nodes.push(
          glassCell(x, -15, 390, 280, g.col, { fill: '#101b30', glow: 9 }),
          txt(g.k, x, -80, 28, g.col, 'mono'),
          txt(g.d, x, 20, 26, COSMOS.ink, 'sans'),
        );
      });
    }

    nodes.push(
      txt(
        'A precision recipe specifies scaling policy, supported ops, hardware, and accumulation dtype',
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
  wireStepCues(s, c, step, [
    ['mg-precision-recipes-b0', 0],
    ['mg-current-amax', 1],
    ['mg-precision-recipes-b1', 2],
    ['mg-block-scales', 3],
    ['mg-precision-recipes-b2', 4],
  ]);
}
