// Scene 27: Keep the source pin, executed wheel and documentation distinct (Governance/BSD-3, source vs wheel vs docs, codebase reading map).
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

export default function projectSource(s, c) {
  const stage = s.value(0); // 0=foundation/BSD-3, 1=source pin vs wheel vs docs, 2=source reading map

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#a78bfa18');
  const title = heroTitle(['Source Pin, Wheel, and', 'Docs Stay Distinct'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.orig,
    eyebrow: 'GOVERNANCE · VERSION RECORDS · CODEBASE MAP',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;

    const nodes = [];
    if (st >= 1.5) {
      nodes.push(txt('WHERE TO OPEN THE PYTORCH SOURCE', 0, -225, 28, ROLE.good, 'mono'));
      const paths = [
        { q: 'Strides & Storage', f: 'TensorImpl.h', col: ROLE.orig, x: -560, y: -70 },
        {
          q: 'Kernels & Dispatch',
          f: 'native_functions.yaml -> Dispatcher',
          col: ROLE.copy,
          x: 200,
          y: -70,
        },
        {
          q: 'Backward Errors',
          f: 'autograd/engine.cpp & saved_variable',
          col: ROLE.grad,
          x: -560,
          y: 125,
        },
        {
          q: 'Compile & Distributed',
          f: 'Dynamo / Inductor · DeviceMesh / DCP',
          col: ROLE.good,
          x: 200,
          y: 125,
        },
      ];
      paths.forEach((pt, idx) => {
        const w = idx % 2 === 0 ? 640 : 820;
        const cx = idx % 2 === 0 ? -450 : 390;
        nodes.push(
          glassCell(cx, pt.y, w, 152, pt.col, { fill: '#111b31', glow: 8 }),
          txt(pt.q, cx, pt.y - 34, 28, pt.col, 'mono'),
          txt(pt.f, cx, pt.y + 24, 26, COSMOS.ink, 'mono'),
        );
      });
    } else {
      const cards = [
        {
          title: 'FOUNDATION & LICENSE',
          l1: 'Linux & PyTorch Foundation',
          l2: 'BSD 3-Clause (not weights)',
          col: ROLE.orig,
          x: -570,
          active: st < 0.5,
        },
        {
          title: 'PINNED SOURCE & WHEEL',
          l1: 'Aug 2 src != 2.13 wheel',
          l2: 'Wheel + backend run code',
          col: ROLE.compile,
          x: 0,
          active: st >= 0.5,
        },
        {
          title: 'DOCS & 2019 PAPER',
          l1: '2.14 API & compile guides',
          l2: 'Paper = history, not API',
          col: ROLE.copy,
          x: 570,
          active: st >= 0.5,
        },
      ];
      nodes.push(txt('THREE SEPARATE EVIDENCE RECORDS', 0, -225, 28, COSMOS.gold, 'mono'));
      cards.forEach((cd) => {
        nodes.push(
          glassCell(cd.x, 10, 530, 290, cd.active ? cd.col : COSMOS.dim, {
            fill: cd.active ? '#111b31' : '#0a0f1c',
            glow: cd.active ? 10 : 2,
          }),
          txt(cd.title, cd.x, -86, 26, cd.active ? cd.col : COSMOS.dim, 'mono'),
          txt(cd.l1, cd.x, -4, 26, cd.active ? COSMOS.ink : COSMOS.dim, 'sans'),
          txt(cd.l2, cd.x, 78, 26, cd.active ? COSMOS.muted : COSMOS.dim, 'sans'),
        );
      });
    }

    nodes.push(
      txt(
        'Trace every bug from Python API down to TensorImpl, Dispatcher, Autograd, Inductor, or c10d',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('pt-project-source-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-project-source-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-project-source-1', 0.45) })),
  );
  c.on('pt-project-source-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-project-source-2', 0.45) })),
  );
}
