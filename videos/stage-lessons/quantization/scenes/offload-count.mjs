// Scene 26: offload-count: llama.cpp trailing layer contract (40 blocks, -ngl 24 -> start 17, blocks 17..39 + output head) + 4-block 6000 MB GPU fit + boundary transfer.
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
  trailingPlacement,
  txt,
} from '../parts.mjs';

export default function offloadCount(s, c) {
  const showFit = s.value(0);
  const showTrace = s.value(0);

  const p40 = trailingPlacement(40, 24);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Trailing GPU Layer Offload:', 'How -ngl Counts Hidden Blocks + Head'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.grid,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const ft = showFit.value;
    const tr = showTrace.value;

    const nodes = [
      txt(
        `40 BLOCKS, -ngl 24  ->  START = 40 + 1 - 24 = ${p40.start}  (BLOCKS 17..39 + OUTPUT HEAD ON GPU)`,
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      // Top row: 40-block contract bar
      rect(640, 86, { fill: '#261e10', stroke: ROLE.gold, width: 2.6, radius: 10 })
        .at(-530, -125)
        .opacity(alpha),
      txt('CPU: Input + Blocks 0..16 (17)', -530, -125, 26, ROLE.gold, 'mono', 'center').opacity(
        alpha,
      ),

      arrow([-195, -125], [-125, -125], { stroke: ROLE.ok, width: 3.5, head: 11 }).opacity(alpha),

      rect(960, 86, { fill: '#0f2d24', stroke: ROLE.ok, width: 2.8, radius: 10 })
        .at(370, -125)
        .opacity(alpha),
      txt(
        'GPU: Blocks 17..39 (23 hidden) + Output Head = 24',
        370,
        -125,
        26,
        ROLE.ok,
        'mono',
        'center',
      ).opacity(alpha),

      // Bottom row: 4-block 6000 MB device (2000 reserved, 4000 free -> 2000 + 1500 + 500 = 4000)
      txt(
        '4-BLOCK WORKSHEET (6000 MB DEVICE - 2000 MB RESERVED = 4000 MB FREE -> LOAD FROM TRAILING END)',
        -855,
        -15,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha * (0.48 + 0.52 * ft)),

      rect(350, 100, { fill: '#261e10', stroke: ROLE.gold, width: 2.6, radius: 10 })
        .at(-665, 85)
        .opacity(alpha * (0.48 + 0.52 * ft)),
      txt('Block 0 (CPU)', -665, 65, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('stays on host', -665, 106, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),

      arrow([-475, 85], [-405, 85], { stroke: ROLE.err, width: 3.5, head: 11 }).opacity(
        alpha * (0.48 + 0.52 * Math.max(ft, tr)),
      ),

      rect(350, 100, { fill: '#0f2d24', stroke: ROLE.ok, width: 2.6, radius: 10 })
        .at(-220, 85)
        .opacity(alpha * (0.48 + 0.52 * ft)),
      txt('Block 1 (GPU)', -220, 65, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('500 MB', -220, 106, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),

      rect(350, 100, { fill: '#0f2d24', stroke: ROLE.ok, width: 2.6, radius: 10 })
        .at(215, 85)
        .opacity(alpha * (0.48 + 0.52 * ft)),
      txt('Block 2 (GPU)', 215, 65, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('1500 MB', 215, 106, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),

      rect(350, 100, { fill: '#0f2d24', stroke: ROLE.ok, width: 2.6, radius: 10 })
        .at(650, 85)
        .opacity(alpha * (0.48 + 0.52 * ft)),
      txt('Block 3 (GPU)', 650, 65, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('2000 MB (4000 total!)', 650, 106, 26, ROLE.gold, 'mono', 'center').opacity(alpha),

      chipPill(
        tr > 0.35
          ? 'Split runs add CPU compute + host-to-GPU activation transfer: always verify kernel traces!'
          : 'Trailing loading fills GPU from the final layers backward (500 + 1500 + 2000 = 4000 MB)',
        0,
        245,
        {
          w: 1600,
          h: 76,
          color: tr > 0.35 ? ROLE.err : ROLE.ok,
          size: 26,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'offload-count-build-0', (d) => s.play(showFit.to(0, { duration: d })));
  playCue(s, c, 'offload-count-build-1', (d) => s.play(showFit.to(1, { duration: d })));
  playCue(s, c, 'offload-count-build-2', (d) => s.play(showTrace.to(1, { duration: d })));
}
