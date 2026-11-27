// Scene 19: Parameter shards gather around module execution (FSDP2: 2/8 shard at rest -> gather 8 compute copy -> reshard back to 2 vs retain 8).
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

export default function residency(s, c) {
  const stage = s.value(0); // 0=2/8 shard at rest, 1=gather 8 compute copy (2+8=10 live), 2=reshard to 2 vs retain 8
  const focus = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#6ee7b718');
  const title = heroTitle(['Parameter Shards Gather', 'Around Execution'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.orig,
    eyebrow: 'FSDP2 LIFECYCLE · GATHER & RESHARD POLICY',
  });

  const live = guardedDynamic(1, () => {
    const st = stage.value;
    const fc = focus.value;
    const gathered = st >= 0.5 && st < 1.5;
    const resharded = st >= 1.5;

    const nodes = [
      // Top row: Owned shard (always 2 elements on Rank 0)
      glassCell(-470, -110, 740, 176, ROLE.orig, { fill: '#0f1d36', glow: 9 }),
      txt('RANK 0 OWNED SHARD (AT REST)', -470, -162, 26, ROLE.orig, 'mono'),
      txt('[ p0 | p1 ]   ->   2 of 8 elements', -470, -104, 32, COSMOS.ink, 'mono'),
      txt('Persistent DTensor local shard', -470, -50, 26, COSMOS.muted, 'sans'),

      // Top right: Compute parameter buffer (0 -> 8 -> released)
      glassCell(410, -110, 820, 176, gathered ? ROLE.bad : resharded ? ROLE.good : COSMOS.dim, {
        fill: gathered ? '#2b1220' : resharded ? '#0d2624' : '#0a0f1c',
        glow: gathered ? 10 : resharded ? 8 : 2,
      }),
      txt(
        'GATHERED COMPUTE PARAMETER',
        410,
        -162,
        26,
        gathered ? ROLE.bad : resharded ? ROLE.good : COSMOS.dim,
        'mono',
      ),
      txt(
        gathered
          ? '[ p0 p1 p2 p3 p4 p5 p6 p7 ]  (8 elems)'
          : resharded
            ? 'RELEASED (reshard_after_forward=True)'
            : 'Pre-forward hook gathers all 8 elements',
        410,
        -104,
        26,
        gathered ? COSMOS.gold : resharded ? ROLE.good : COSMOS.dim,
        'mono',
      ),
      txt(
        gathered
          ? 'Peak includes shard + compute + acts + prefetch!'
          : 'Back to 2 owned elements until backward',
        410,
        -50,
        26,
        COSMOS.muted,
        'sans',
      ),

      // Bottom comparison: Reshard=True vs Reshard=False
      glassCell(-470, 142, 740, 176, resharded ? ROLE.good : COSMOS.dim, {
        fill: resharded ? '#0d2624' : '#0a0f1c',
        glow: resharded ? 9 : 2,
      }),
      txt('reshard_after_forward = True', -470, 88, 28, resharded ? ROLE.good : COSMOS.dim, 'mono'),
      txt(
        'Live params after fwd: 2 elems',
        -470,
        144,
        28,
        resharded ? COSMOS.ink : COSMOS.dim,
        'mono',
      ),
      txt('Frees full buffer · gathers again in bwd', -470, 198, 26, COSMOS.muted, 'sans'),

      glassCell(410, 142, 820, 176, fc >= 4 ? ROLE.trans : COSMOS.dim, {
        fill: fc >= 4 ? '#241b0f' : '#0a0f1c',
        glow: fc >= 4 ? 9 : 2,
      }),
      txt('reshard_after_forward = False', 410, 88, 28, fc >= 4 ? ROLE.trans : COSMOS.dim, 'mono'),
      txt(
        'Live params retained: 2 + 8 = 10 elems',
        410,
        144,
        28,
        fc >= 4 ? COSMOS.gold : COSMOS.dim,
        'mono',
      ),
      txt('Spends VRAM to skip the backward all-gather', 410, 198, 26, COSMOS.muted, 'sans'),
    ];

    nodes.push(
      txt(
        'Dividing total weights by rank count misses the full compute copy, activations, and prefetch buffers',
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

  c.on('residency-beat-1-focus-1', () => s.play(focus.to(1, { duration: 0.3 })));
  c.on('pt-residency-0', () => s.play(stage.to(0, { duration: 0.25 })));
  c.on('residency-beat-2-focus-1', () => s.play(focus.to(2, { duration: 0.3 })));
  c.on('residency-beat-2-focus-2', () => s.play(focus.to(3, { duration: 0.3 })));
  c.on('pt-residency-1', () =>
    s.play(stage.to(1, { duration: remainDuration(c, 'pt-residency-1', 0.45) })),
  );
  c.on('residency-beat-3-focus-1', () => s.play(focus.to(4, { duration: 0.3 })));
  c.on('residency-beat-3-focus-2', () => s.play(focus.to(5, { duration: 0.3 })));
  c.on('pt-residency-2', () =>
    s.play(stage.to(2, { duration: remainDuration(c, 'pt-residency-2', 0.45) })),
  );
}
