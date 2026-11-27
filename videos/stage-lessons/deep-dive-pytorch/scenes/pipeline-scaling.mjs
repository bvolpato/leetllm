// Scene 18: Scale the full-batch gradient once (microbatch grads [2,4,6,8] sum=20, /4 = 5 with scale_grads=True; manual /4 again = 1.25!).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function pipelineScaling(s, c) {
  const stage = s.value(0); // 0=policy, 1=microbatches, 2=sum 20, 3=mean 5, 4=double-scaled 1.25, 5=unequal weights

  const bgAura = aura(0, 20, 620, '#6ee7b718', '#fb71851c');
  const title = heroTitle(['Scale the Full-Batch', 'Gradient Once'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.good,
    eyebrow: 'SCALE_GRADS CONTRACT · NO DOUBLE DIVISION',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;
    const grads = [2, 4, 6, 8];

    const nodes = [
      txt('4 EQUAL MICROBATCHES (MEAN-REDUCED LOSSES)', 0, -220, 28, COSMOS.gold, 'mono'),
    ];

    grads.forEach((g, i) => {
      const gx = -540 + i * 360;
      nodes.push(
        glassCell(gx, -110, 300, 128, ROLE.orig, { fill: '#0f1d36', glow: st >= 1 ? 8 : 3 }),
        txt(`MB ${i}`, gx, -142, 26, COSMOS.muted, 'mono'),
        txt(`grad = ${g}`, gx, -84, 34, COSMOS.ink, 'mono'),
      );
    });

    // Bottom 3 result boxes: Sum=20, Mean=5 (correct), Double=1.25 (bug!)
    nodes.push(
      glassCell(-550, 125, 470, 180, st >= 2 ? COSMOS.gold : COSMOS.dim, {
        fill: st >= 2 ? '#241d0f' : '#0a0f1c',
        glow: st >= 2 ? 9 : 2,
      }),
      txt('ACCUMULATED SUM', -550, 68, 26, COSMOS.muted, 'mono'),
      txt(
        st >= 2 ? '2 + 4 + 6 + 8 = 20' : 'waiting...',
        -550,
        128,
        30,
        st >= 2 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),
      txt('scale_grads=False for sum loss', -550, 182, 26, COSMOS.muted, 'sans'),

      glassCell(0, 125, 470, 180, st >= 3 ? ROLE.good : COSMOS.dim, {
        fill: st >= 3 ? '#0d2924' : '#0a0f1c',
        glow: st >= 3 ? 10 : 2,
      }),
      txt('DIVIDE ONCE (/ 4)', 0, 68, 26, ROLE.good, 'mono'),
      txt(
        st >= 3 ? '20 / 4 = 5.0' : 'waiting...',
        0,
        128,
        36,
        st >= 3 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
      txt('scale_grads=True (exact mean)', 0, 182, 26, ROLE.good, 'sans'),

      glassCell(550, 125, 470, 180, st >= 4 ? ROLE.bad : COSMOS.dim, {
        fill: st >= 4 ? '#2d1222' : '#0a0f1c',
        glow: st >= 4 ? 10 : 2,
      }),
      txt('MANUAL /4 + SCHEDULE /4', 550, 68, 26, ROLE.bad, 'mono'),
      txt(
        st >= 4 ? '5 / 4 = 1.25!' : 'waiting...',
        550,
        128,
        36,
        st >= 4 ? ROLE.bad : COSMOS.dim,
        'mono',
      ),
      txt('Silent 4× update shrinkage!', 550, 182, 26, ROLE.bad, 'sans'),
    );

    nodes.push(
      txt(
        st >= 5
          ? 'Unequal microbatches must weight by sample count; verify against an unsplit full-batch step'
          : 'Declare sum vs mean loss once and match schedule scale_grads to that contract',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('pt-pipeline-scaling-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-pipeline-scaling-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-pipeline-scaling-1', 0.35) })),
  );
  c.on('pt-micro-sum', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-micro-sum', 0.4) })),
  );
  c.on('pt-micro-mean', () =>
    s.play(stage.to(3, { duration: remainDuration(c, 'pt-micro-mean', 0.4) })),
  );
  c.on('pt-micro-double', () =>
    s.play(stage.to(4, { duration: remainDuration(c, 'pt-micro-double', 0.4) })),
  );
  c.on('pt-pipeline-scaling-2', () =>
    s.play(stage.to(5, { duration: remainDuration(c, 'pt-pipeline-scaling-2', 0.4) })),
  );
}
