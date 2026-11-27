// Scene 12: Compiled backward needs the precision context it assumed (DDP/FSDP2 compile boundary + backward_pass_autocast="off" for BF16 fwd / FP32 bwd).
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

export default function autocastBoundary(s, c) {
  const stage = s.value(0); // 0=compile inner module / FSDP2 hooks, 1=fwd autocast vs bwd outside, 2=patch off -> exact match

  const bgAura = aura(0, 20, 620, '#a78bfa1e', '#6ee7b718');
  const title = heroTitle(['Match Backward Precision', 'to Compiler Assumptions'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.grad,
    eyebrow: 'BF16 AUTOCAST FORWARD · FP32 BACKWARD',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;

    const nodes = [
      // Top: Forward inside autocast vs Backward outside autocast
      glassCell(-430, -110, 740, 180, ROLE.orig, { fill: '#0f1d36', glow: 8 }),
      txt('FORWARD + LOSS', -430, -164, 28, ROLE.orig, 'mono'),
      txt('with torch.autocast("cpu", bfloat16):', -430, -108, 26, COSMOS.ink, 'mono'),
      txt('Matmul runs in BF16', -430, -56, 26, COSMOS.gold, 'mono'),

      line([-52, -110], [52, -110], { stroke: COSMOS.gold, width: 3.4 }),

      glassCell(430, -110, 740, 180, st >= 1.5 ? ROLE.good : ROLE.bad, {
        fill: st >= 1.5 ? '#0e2824' : '#2b1220',
        glow: 10,
      }),
      txt('BACKWARD PASS', 430, -164, 28, st >= 1.5 ? ROLE.good : ROLE.bad, 'mono'),
      txt('loss.backward()  OUTSIDE autocast', 430, -108, 26, COSMOS.ink, 'mono'),
      txt(
        st >= 1.5
          ? 'backward_pass_autocast = "off"  (MATCHES!)'
          : 'Default assumes "same_as_forward" (DRIFT!)',
        430,
        -56,
        26,
        st >= 1.5 ? ROLE.good : ROLE.bad,
        'mono',
      ),

      // Bottom: Distributed compile placement & verification receipt
      glassCell(-430, 148, 740, 178, st < 0.5 ? ROLE.compile : ROLE.copy, {
        fill: '#111b31',
        glow: st < 0.5 ? 10 : 4,
      }),
      txt('WHERE TO WRAP torch.compile', -430, 94, 28, ROLE.compile, 'mono'),
      txt('DDP: compile inner module BEFORE DDP()', -430, 148, 26, COSMOS.ink, 'mono'),
      txt('FSDP2: gather hooks run BEFORE compiled block', -430, 198, 26, COSMOS.muted, 'mono'),

      glassCell(430, 148, 740, 178, st >= 1.5 ? ROLE.good : COSMOS.dim, {
        fill: st >= 1.5 ? '#0d2624' : '#0a0f1c',
        glow: st >= 1.5 ? 10 : 2,
      }),
      txt('AOT_EAGER PARITY RECEIPT', 430, 94, 28, st >= 1.5 ? ROLE.good : COSMOS.dim, 'mono'),
      txt(
        'Loss & weight.grad match eager bit-for-bit',
        430,
        148,
        26,
        st >= 1.5 ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
      txt(
        'Repeat check on CUDA + grad scaler + parallel',
        430,
        198,
        26,
        st >= 1.5 ? ROLE.good : COSMOS.dim,
        'mono',
      ),
    ];

    nodes.push(
      txt(
        'Keep backward_pass_autocast="off" active through compilation AND backward when backward exits autocast',
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

  c.on('pt-autocast-boundary-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('pt-autocast-boundary-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-autocast-boundary-1', 0.45) })),
  );
  c.on('pt-autocast-boundary-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-autocast-boundary-2', 0.45) })),
  );
}
