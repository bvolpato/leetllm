// Scene 10: A guarded graph can be reused until its assumptions change (3 calls: scale 2 -> capture #1, scale 2 -> reuse #1, scale 3 -> capture #2).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function compile(s, c) {
  const phase = s.value(0);
  const stage = s.value(0); // 0=call 1 (scale 2), 1=call 2 reuse + call 3 scale 3, 2=Dynamo->AOT->Inductor
  const focus = s.value(0);

  const bgAura = aura(0, 20, 620, '#f59e0b1e', '#5ce1e618');
  const title = heroTitle(['Guarded Graphs Reuse', 'Until Guards Fail'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.compile,
    eyebrow: 'TORCH.COMPILE · GUARD SPECIALIZATION CACHE',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;
    const p = phase.value;

    const calls = [
      {
        id: 'CALL 1',
        scale: 2,
        out: '[2, 8]',
        tag: 'CAPTURE -> Graph #1',
        col: ROLE.orig,
        on: true,
      },
      {
        id: 'CALL 2',
        scale: 2,
        out: '[2, 8]',
        tag: 'GUARD HIT -> Reuse #1',
        col: ROLE.good,
        on: st >= 0.5,
      },
      {
        id: 'CALL 3',
        scale: 3,
        out: '[3, 12]',
        tag: 'GUARD MISS -> Graph #2',
        col: ROLE.compile,
        on: st >= 0.5,
      },
    ];

    const nodes = [
      txt('x = [1, 2]   ·   f(x, scale) = x² × scale', 0, -225, 28, COSMOS.gold, 'mono'),
    ];

    calls.forEach((cl, i) => {
      const cx = -560 + i * 560;
      nodes.push(
        glassCell(cx, -72, 490, 206, cl.on ? cl.col : COSMOS.dim, {
          fill: cl.on ? '#111b31' : '#0a0f1c',
          glow: cl.on ? 9 : 2,
        }),
        txt(`${cl.id}  (scale = ${cl.scale})`, cx, -138, 28, cl.on ? cl.col : COSMOS.dim, 'mono'),
        txt(`output = ${cl.out}`, cx, -78, 34, cl.on ? COSMOS.ink : COSMOS.dim, 'mono'),
        txt(cl.tag, cx, -16, 26, cl.on ? cl.col : COSMOS.dim, 'mono'),
      );
    });

    // Bottom 3-stage compiler stack (lights up on beat 2)
    const pipe = [
      { name: 'TorchDynamo', desc: 'Bytecode + Guards', col: ROLE.compile, x: -560 },
      { name: 'AOTAutograd', desc: 'Joint Fwd + Bwd', col: ROLE.grad, x: 0 },
      { name: 'TorchInductor', desc: 'Fused Triton / C++', col: ROLE.good, x: 560 },
    ];
    pipe.forEach((stItem) => {
      const active = st >= 1.5;
      nodes.push(
        glassCell(stItem.x, 175, 490, 152, active ? stItem.col : COSMOS.dim, {
          fill: active ? '#111b31' : '#0a0f1c',
          glow: active ? 9 : 2,
        }),
        txt(stItem.name, stItem.x, 140, 28, active ? stItem.col : COSMOS.dim, 'mono'),
        txt(stItem.desc, stItem.x, 198, 26, active ? COSMOS.ink : COSMOS.dim, 'mono'),
      );
    });

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 296, { radius: 6, color: ROLE.compile }),
      txt(
        st >= 1.5
          ? 'Inspect graph breaks and guard recompiles separately; check grads under real precision'
          : '3 calls with scales (2, 2, 3) -> 2 captured graphs',
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
  runPhase(s, c, phase, 14);

  c.on('compile-beat-1-focus-1', () => s.play(focus.to(1, { duration: 0.3 })));
  c.on('pt-compile-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('compile-beat-2-focus-1', () => s.play(focus.to(2, { duration: 0.3 })));
  c.on('pt-compile-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-compile-1', 0.45) })),
  );
  c.on('compile-beat-3-focus-1', () => s.play(focus.to(3, { duration: 0.3 })));
  c.on('pt-compile-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-compile-2', 0.45) })),
  );
}
