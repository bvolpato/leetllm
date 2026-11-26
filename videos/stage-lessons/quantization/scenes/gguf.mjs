// Scene 23: gguf: GGUF container (typed tensors + metadata), Q4_K 4.5 bpw mixed encodings, compatible runtime, mmap -> page read -> GPU transfer.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function gguf(s, c) {
  const step = s.value(0); // 0=artifact, 1=q4k 4.5bpw, 2=mixed runtime, 3=mmap->gpu

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['GGUF Container & Runtime Flow:', 'From Stored Tensor to Device'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.grid,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = step.value;

    const nodes = [
      txt(
        'ALGORITHM CHOOSES VALUES; TENSOR ENCODING & CONTAINER TELL THE RUNTIME HOW TO READ THEM',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // 4-stage pipeline across canvas
      rect(360, 170, { fill: '#10203a', stroke: ROLE.weight, width: 2.8, radius: 12 })
        .at(-665, -40)
        .opacity(alpha),
      txt('1. GGUF FILE', -665, -88, 26, ROLE.weight, 'mono', 'center').opacity(alpha),
      txt('Metadata + Tokenizer', -665, -36, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Typed Tensor Table', -665, 14, 26, ROLE.grid, 'mono', 'center').opacity(alpha),

      arrow([-470, -40], [-405, -40], { stroke: ROLE.grid, width: 3.5, head: 11 }).opacity(alpha),

      rect(360, 170, {
        fill: st >= 0.7 ? '#261e10' : '#10182d',
        stroke: st >= 0.7 ? ROLE.gold : ROLE.grid,
        width: 2.8,
        radius: 12,
      })
        .at(-220, -40)
        .opacity(alpha * (0.5 + 0.5 * Math.min(1, st))),
      txt('2. Q4_K BLOCKS', -220, -88, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('4-bit codes + scale/min', -220, -36, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('4.5 bits / weight', -220, 14, 28, ROLE.gold, 'mono', 'center').opacity(alpha),

      arrow([-25, -40], [40, -40], { stroke: ROLE.gold, width: 3.5, head: 11 }).opacity(alpha),

      rect(360, 170, {
        fill: st >= 1.7 ? '#181434' : '#10182d',
        stroke: st >= 1.7 ? ROLE.code : ROLE.grid,
        width: 2.8,
        radius: 12,
      })
        .at(225, -40)
        .opacity(alpha * (0.5 + 0.5 * Math.min(1, st / 2))),
      txt('3. MIXED PRECISION', 225, -88, 26, ROLE.code, 'mono', 'center').opacity(alpha),
      txt('Key tensors stay higher', 225, -36, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('Compatible runtime', 225, 14, 26, ROLE.code, 'mono', 'center').opacity(alpha),

      arrow([420, -40], [485, -40], { stroke: ROLE.ok, width: 3.5, head: 11 }).opacity(alpha),

      rect(360, 170, {
        fill: st >= 2.6 ? '#0f2d24' : '#10182d',
        stroke: st >= 2.6 ? ROLE.ok : ROLE.grid,
        width: 2.8,
        radius: 12,
      })
        .at(670, -40)
        .opacity(alpha * (0.5 + 0.5 * Math.min(1, st / 3))),
      txt('4. PLACEMENT', 670, -88, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('mmap -> OS page read', 670, -36, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('-> CPU or GPU transfer', 670, 14, 26, ROLE.ok, 'mono', 'center').opacity(alpha),

      chipPill(
        st >= 2.6
          ? 'mmap maps file pages; discrete GPUs still read pages and copy to VRAM'
          : 'One GGUF file can mix Q4_K blocks with higher-precision embeddings or output tensors cleanly',
        0,
        205,
        {
          w: 1620,
          h: 78,
          color: st >= 2.6 ? ROLE.ok : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'choose-method', (d) => s.play(step.to(0.2, { duration: d })));
  playCue(s, c, 'stored-artifact', (d) => s.play(step.to(0.4, { duration: d })));
  playCue(s, c, 'typed-encodings', (d) => s.play(step.to(1.0, { duration: d })));
  playCue(s, c, 'metadata-bits', (d) => s.play(step.to(1.3, { duration: d })));
  playCue(s, c, 'mixed-encodings', (d) => s.play(step.to(2.0, { duration: d })));
  playCue(s, c, 'compatible-runtime', (d) => s.play(step.to(2.3, { duration: d })));
  playCue(s, c, 'layer-placement', (d) => s.play(step.to(2.8, { duration: d })));
  playCue(s, c, 'cpu-gpu', (d) => s.play(step.to(3.0, { duration: d })));
}
