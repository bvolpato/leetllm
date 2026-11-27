// Scene 11: Separate capture, staging and generated execution (Dynamo bytecode + guards -> graph break -> AOTAutograd -> Inductor; counting backend vs aot_eager vs Inductor timing).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function compilerRegions(s, c) {
  const stage = s.value(0); // 0=pipeline stages, 1=graph break vs guard failure, 2=counting backend / aot_eager / Inductor warmup

  const bgAura = aura(0, 20, 620, '#f59e0b1e', '#6ee7b718');
  const title = heroTitle(['Separate Capture, Staging,', 'and Code Generation'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.compile,
    eyebrow: 'DYNAMO · AOTAUTOGRAD · INDUCTOR BOUNDARIES',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;

    const stages = [
      { title: '1. Dynamo', sub: 'Bytecode + Guards', x: -640, col: ROLE.compile },
      { title: '2. Functionalize', sub: 'Pure core ATen ops', x: -215, col: ROLE.orig },
      { title: '3. AOTAutograd', sub: 'Joint Fwd + Bwd', x: 215, col: ROLE.grad },
      { title: '4. Inductor', sub: 'Triton / C++ codegen', x: 640, col: ROLE.good },
    ];

    const nodes = [txt('COMPILER LOWERING PIPELINE', 0, -225, 28, ROLE.compile, 'mono')];

    stages.forEach((sg, i) => {
      nodes.push(
        glassCell(sg.x, -110, 360, 148, sg.col, { fill: '#111b31', glow: st < 0.5 ? 9 : 4 }),
        txt(sg.title, sg.x, -142, 28, sg.col, 'mono'),
        txt(sg.sub, sg.x, -82, 26, COSMOS.ink, 'mono'),
      );
      if (i < stages.length - 1) {
        nodes.push(
          line([sg.x + 186, -110], [stages[i + 1].x - 186, -110], {
            stroke: COSMOS.gold,
            width: 3.0,
          }),
        );
      }
    });

    if (st >= 1.5) {
      // Beat 2: Counting backend vs aot_eager vs Inductor warmup
      const tests = [
        {
          title: 'counting_backend',
          body: '2 graphs for scales (2, 2, 3)',
          sub: 'Runs FX eagerly (capture proof)',
          col: ROLE.compile,
          x: -560,
        },
        {
          title: 'aot_eager',
          body: 'Stages backward graph',
          sub: 'Checks loss + grad vs eager',
          col: ROLE.grad,
          x: 0,
        },
        {
          title: 'inductor',
          body: 'Warmup + steady timing',
          sub: 'Record compile startup separately',
          col: ROLE.good,
          x: 560,
        },
      ];
      tests.forEach((t) => {
        nodes.push(
          glassCell(t.x, 148, 510, 200, t.col, { fill: '#111b31', glow: 9 }),
          txt(t.title, t.x, 86, 28, t.col, 'mono'),
          txt(t.body, t.x, 146, 26, COSMOS.ink, 'mono'),
          txt(t.sub, t.x, 200, 26, COSMOS.muted, 'sans'),
        );
      });
    } else {
      // Beat 1: Graph break vs Guard failure
      nodes.push(
        glassCell(-430, 148, 760, 200, st >= 0.5 ? ROLE.bad : COSMOS.dim, {
          fill: st >= 0.5 ? '#2b1220' : '#0a0f1c',
          glow: st >= 0.5 ? 9 : 2,
        }),
        txt('GRAPH BREAK', -430, 86, 28, st >= 0.5 ? ROLE.bad : COSMOS.dim, 'mono'),
        txt(
          'Unsupported op drops back to eager Python',
          -430,
          146,
          26,
          st >= 0.5 ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
        txt(
          'Use fullgraph=True to pinpoint exact line',
          -430,
          200,
          26,
          st >= 0.5 ? COSMOS.muted : COSMOS.dim,
          'sans',
        ),

        glassCell(430, 148, 760, 200, st >= 0.5 ? ROLE.compile : COSMOS.dim, {
          fill: st >= 0.5 ? '#241a0f' : '#0a0f1c',
          glow: st >= 0.5 ? 9 : 2,
        }),
        txt('FAILED GUARD (RECOMPILE)', 430, 86, 28, st >= 0.5 ? ROLE.compile : COSMOS.dim, 'mono'),
        txt(
          'Key: (dtype, stride, Python scalar)',
          430,
          146,
          26,
          st >= 0.5 ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
        txt(
          'Changing tensor VALUES does NOT recompile',
          430,
          200,
          26,
          st >= 0.5 ? ROLE.good : COSMOS.dim,
          'sans',
        ),
      );
    }

    nodes.push(
      txt(
        'Keep capture count, staged grad parity, and steady-state Inductor speed as separate measurements',
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

  c.on('pt-compiler-regions-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-compiler-regions-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-compiler-regions-1', 0.45) })),
  );
  c.on('pt-compiler-regions-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-compiler-regions-2', 0.45) })),
  );
}
