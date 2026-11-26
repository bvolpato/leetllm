// Scene 04: An operator contract survives several dispatch layers (Schema -> DispatchKeySet -> Autograd -> Backend; Functionalization & FakeTensor).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function dispatchLayers(s, c) {
  const phase = s.value(0);
  const stage = s.value(0); // 0=schema contract, 1=DispatchKeySet stack, 2=functionalization & fake tensor

  const bgAura = aura(0, 20, 640, '#a78bfa1e', '#5ce1e618');
  const title = heroTitle(['One Operator,', 'Many Dispatch Layers'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.grad,
    eyebrow: 'ATEN SCHEMA · DISPATCHKEYSET ROUTING',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;
    const p = phase.value;

    const layers = [
      {
        label: '1. ATen Operator Schema',
        desc: 'types · overloads · aliases · mutation',
        col: ROLE.orig,
        y: -150,
      },
      {
        label: '2. DispatchKeySet Priority',
        desc: 'Autograd · Functionalize · Fake · Batch',
        col: ROLE.grad,
        y: -12,
      },
      {
        label: '3. Concrete Backend Kernel',
        desc: 'CPU · CUDA · MPS (check profiler!)',
        col: ROLE.good,
        y: 126,
      },
    ];

    const nodes = [txt('DISPATCH CASCADE', -350, -238, 28, ROLE.grad, 'mono')];

    layers.forEach((L, idx) => {
      const active = (st < 0.5 && idx === 0) || (st >= 0.5 && st < 1.5 && idx >= 1) || st >= 1.5;
      nodes.push(
        glassCell(-350, L.y, 960, 108, active ? L.col : COSMOS.dim, {
          fill: active ? '#131d33' : '#0a0f1c',
          glow: active ? 9 : 2,
        }),
        txt(L.label, -350, L.y - 22, 28, active ? L.col : COSMOS.dim, 'mono'),
        txt(L.desc, -350, L.y + 24, 26, active ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
      if (idx < layers.length - 1) {
        nodes.push(line([-350, L.y + 58], [-350, L.y + 80], { stroke: COSMOS.gold, width: 3.0 }));
      }
    });

    // Right column: Mode cards (Functionalize / FakeTensor / Alias hazard)
    nodes.push(
      glassCell(510, -110, 640, 184, st >= 1.5 ? ROLE.compile : ROLE.bad, {
        fill: st >= 1.5 ? '#241a0f' : '#291220',
        glow: 9,
      }),
      txt(
        st >= 1.5 ? 'FUNCTIONALIZATION' : 'ALIAS & STRIDE CONTRACT',
        510,
        -164,
        28,
        st >= 1.5 ? ROLE.compile : ROLE.bad,
        'mono',
      ),
      txt(
        st >= 1.5 ? 'Rewrites in-place -> pure ops' : 'Right math + wrong stride',
        510,
        -108,
        26,
        COSMOS.ink,
        'mono',
      ),
      txt(
        st >= 1.5 ? 'Safe for graph transforms' : 'breaks next view or compile!',
        510,
        -56,
        26,
        st >= 1.5 ? ROLE.compile : ROLE.bad,
        'mono',
      ),

      glassCell(510, 118, 640, 184, st >= 1.5 ? ROLE.copy : COSMOS.dim, {
        fill: st >= 1.5 ? '#0e222e' : '#0a0f1c',
        glow: st >= 1.5 ? 9 : 2,
      }),
      txt('FAKE TENSOR MODE', 510, 64, 28, st >= 1.5 ? ROLE.copy : COSMOS.dim, 'mono'),
      txt(
        'Propagates shape, dtype, device',
        510,
        120,
        26,
        st >= 1.5 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
      txt(
        'Zero data allocation (Py + C++)',
        510,
        172,
        26,
        st >= 1.5 ? ROLE.copy : COSMOS.dim,
        'mono',
      ),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-820 + u * 1640, 275, { radius: 6, color: ROLE.grad }),
      txt(
        'Every custom op or mode must return the exact dtype, stride, and alias metadata promised',
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
  runPhase(s, c, phase, 14);

  c.on('pt-dispatch-layers-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-dispatch-layers-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-dispatch-layers-1', 0.45) })),
  );
  c.on('pt-dispatch-layers-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-dispatch-layers-2', 0.45) })),
  );
}
