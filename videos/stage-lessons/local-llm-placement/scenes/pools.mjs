// Scene 09: pools: Discrete GPU 24 GB VRAM (28 GB OOM!) vs 32 GB Host RAM (8 GB fits) vs 32 GB Unified pool (10 OS + 24 model = 34 GB!).
import {
  COSMOS,
  ROLE,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  txt,
} from '../parts.mjs';

export default function pools(s, c) {
  const showHost = s.value(0);
  const showUnified = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Which Memory Pool', 'Has to Grant the Request?'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.work,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const hs = showHost.value;
    const un = showUnified.value;
    const barX = -420;
    const maxW = 920;
    const maxGb = 36;

    const nodes = [
      txt(
        'DISCRETE GPU vs HOST RAM vs UNIFIED PHYSICAL POOL (GB)',
        -855,
        -220,
        26,
        ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),

      // Pool 1: Discrete GPU VRAM (24 GB cap, 28 GB requested -> OOM +4 GB!)
      txt('GPU VRAM (24 GB cap)', -855, -125, 28, ROLE.work, 'mono', 'left').opacity(alpha),
      lumBar(barX, -125, (28 / maxGb) * maxW, 38, ROLE.work, {
        opacity: alpha,
        maxTrackW: (24 / maxGb) * maxW,
      }),
      txt(
        '28 GB req (+4 OOM!)',
        barX + (28 / maxGb) * maxW + 24,
        -125,
        28,
        ROLE.work,
        'mono',
        'left',
      ).opacity(alpha),

      // Pool 2: Discrete Host RAM (32 GB cap, 8 GB host buffer -> FITS!)
      txt('Host RAM (32 GB cap)', -855, 5, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * hs),
      ),
      lumBar(barX, 5, (8 / maxGb) * maxW, 38, ROLE.ok, {
        opacity: alpha * (0.45 + 0.55 * hs),
        maxTrackW: (32 / maxGb) * maxW,
      }),
      txt(
        '8 GB host buf (OK)',
        barX + (32 / maxGb) * maxW + 24,
        5,
        26,
        ROLE.ok,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * hs)),

      // Pool 3: Unified Shared Pool (32 GB cap, 10 OS + 24 model = 34 GB -> EXCEEDS!)
      txt('Unified Pool (32 GB)', -855, 135, 28, ROLE.gold, 'mono', 'left').opacity(
        alpha * (0.45 + 0.55 * un),
      ),
      lumBar(barX, 135, (34 / maxGb) * maxW, 38, ROLE.work, {
        opacity: alpha * (0.45 + 0.55 * un),
        maxTrackW: (32 / maxGb) * maxW,
      }),
      txt(
        '10 OS + 24 = 34 GB!',
        barX + (34 / maxGb) * maxW + 20,
        135,
        26,
        ROLE.work,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * un)),

      txt(
        un > 0.3
          ? 'Shared physical memory puts OS + apps + model on one rail; check Metal working-set limit'
          : 'Free host RAM does NOT satisfy an ordinary CUDA device allocation without explicit placement',
        0,
        285,
        28,
        un > 0.3 ? ROLE.gold : ROLE.vram,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'device-demand', (d) => s.play(showHost.to(0, { duration: d })));
  playCue(s, c, 'host-buffer', (d) => s.play(showHost.to(1, { duration: d })));
  playCue(s, c, 'host-does-fit', (d) => s.play(showHost.to(1, { duration: d })));
  playCue(s, c, 'shared-request', (d) => s.play(showUnified.to(1, { duration: d })));
}
