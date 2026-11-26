// Scene 10: bandwidth-batch: 2 channels (89.6 GB/s) vs 8 channels (358.4 GB/s) & 1 weight read (5 GB @ 80 GB/s = 16 steps/s) serving B=1 vs B=8 (128 tok/s).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function bandwidthBatch(s, c) {
  const show8ch = s.value(0);
  const showBatch = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Memory Channels &', 'Batched Weight Reuse'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ch8 = show8ch.value;
    const bt = showBatch.value;
    const barX = -420;
    const maxW = 860;

    const nodes = [
      txt(
        'HYPOTHETICAL CPU CHANNELS (5.6 GT/s x 8 B/transfer = 44.8 GB/s PER CHANNEL)',
        -855,
        -225,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      txt('2 Channels', -855, -135, 28, ROLE.weights, 'mono', 'left').opacity(alpha),
      lumBar(barX, -135, (89.6 / 380) * maxW, 34, ROLE.weights, {
        opacity: alpha,
        maxTrackW: maxW,
      }),
      txt('89.6 GB/s', barX + maxW + 24, -135, 28, ROLE.weights, 'mono', 'left').opacity(alpha),

      txt('8 Channels', -855, -45, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * ch8),
      ),
      lumBar(barX, -45, (358.4 / 380) * maxW, 34, ROLE.ok, {
        opacity: alpha * (0.45 + 0.55 * ch8),
        maxTrackW: maxW,
      }),
      txt('358.4 GB/s (4x)', barX + maxW + 24, -45, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * ch8),
      ),

      // Lower section: Weight-read reuse across B=1 vs B=8 (5 GB weights @ 80 GB/s = 16 steps/s)
      txt(
        '5 GB WEIGHTS @ 80 GB/s = 16 DECODE STEPS / SEC',
        -855,
        65,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * bt)),

      txt('Batch B = 1', -855, 145, 28, ROLE.vram, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * bt),
      ),
      lumBar(barX, 145, (16 / 128) * maxW, 34, ROLE.vram, {
        opacity: alpha * (0.45 + 0.55 * bt),
        maxTrackW: maxW,
      }),
      txt('16 tok/s total', barX + maxW + 24, 145, 28, ROLE.vram, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * bt),
      ),

      txt('Batch B = 8', -855, 235, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * bt),
      ),
      lumBar(barX, 235, maxW, 34, ROLE.ok, {
        opacity: alpha * (0.45 + 0.55 * bt),
        maxTrackW: maxW,
      }),
      txt('128 tok/s agg!', barX + maxW + 24, 235, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * bt),
      ),

      txt(
        'Test NUMA locality & thread counts; larger batches can shift the bottleneck to compute or KV',
        0,
        345,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-bandwidth-batch-0-2', (d) => s.play(show8ch.to(1, { duration: d })));
  playCue(s, c, 'pl-bandwidth-batch-1-0', (d) => s.play(showBatch.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-bandwidth-batch-0-0',
    'pl-bandwidth-batch-0-1',
    'pl-bandwidth-batch-0-3',
    'pl-bandwidth-batch-0-4',
    'pl-bandwidth-batch-1-1',
    'pl-bandwidth-batch-1-2',
    'pl-bandwidth-batch-1-3',
    'pl-bandwidth-batch-1-4',
  ]);
}
