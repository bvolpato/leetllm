// Scene 03: workspace-contract: Prefill peak (14.0 GB) vs Decode peak (12.4 GB) -> take max, never sum!
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

export default function workspaceContract(s, c) {
  const showMax = s.value(0);
  const showWorksheet = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Which Allocations Coexist?', 'Take the Max Phase Peak'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.work,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const mx = showMax.value;
    const ws = showWorksheet.value;
    const barX = -420;
    const maxW = 920;
    const maxGb = 24;

    const nodes = [
      txt(
        'ONE DEVICE, TWO PHASES: WEIGHTS & KV STAY RESIDENT ACROSS BOTH',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      txt('Prefill Peak', -855, -110, 30, ROLE.work, 'mono', 'left').opacity(alpha),
      lumBar(barX, -110, (14.0 / maxGb) * maxW, 42, ROLE.work, { opacity: alpha, maxTrackW: maxW }),
      txt('14.0 GB  (MAX!)', barX + maxW + 26, -110, 30, ROLE.work, 'mono', 'left')
        .glow(mx > 0.3 ? 10 : 0, ROLE.work)
        .opacity(alpha),

      txt('Decode Peak', -855, 10, 30, ROLE.vram, 'mono', 'left').opacity(alpha),
      lumBar(barX, 10, (12.4 / maxGb) * maxW, 42, ROLE.vram, { opacity: alpha, maxTrackW: maxW }),
      txt('12.4 GB', barX + maxW + 26, 10, 30, ROLE.vram, 'mono', 'left').opacity(alpha),

      txt('Naive Sum (WRONG!)', -855, 130, 28, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * mx),
      ),
      lumBar(barX, 130, maxW, 38, '#542034', {
        opacity: alpha * (0.45 + 0.55 * mx),
        maxTrackW: maxW,
      }),
      txt('26.4 GB (double-counts!)', barX + maxW + 26, 130, 26, ROLE.work, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * mx),
      ),

      txt(
        ws > 0.3
          ? 'Worksheet assumption: 2.0 GB workspace + 20% reserve (4.8 GB) -> measure real peak before setting admission'
          : 'Memory-efficient attention still needs workspace for chunks, logits, CUDA graphs & concurrent batches',
        0,
        290,
        28,
        ws > 0.3 ? ROLE.ok : ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-workspace-contract-0-1', (d) => s.play(showMax.to(1, { duration: d })));
  playCue(s, c, 'pl-workspace-contract-1-2', (d) => s.play(showWorksheet.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-workspace-contract-0-0',
    'pl-workspace-contract-0-2',
    'pl-workspace-contract-0-3',
    'pl-workspace-contract-1-0',
    'pl-workspace-contract-1-1',
    'pl-workspace-contract-1-3',
  ]);
}
