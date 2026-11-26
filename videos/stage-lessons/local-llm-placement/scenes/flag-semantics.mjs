// Scene 12: flag-semantics: llama.cpp -ngl 24 on 40 blocks -> Input on CPU, 17 blocks CPU, 23 trailing hidden blocks + output head on GPU!
import {
  COSMOS,
  FLAG_40_24,
  ROLE,
  aura,
  bindCueBeat,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function flagSemantics(s, c) {
  const showFlag = s.value(0);
  const accent = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a162422');
  const title = heroTitle(['Which Slot Does -ngl Count?', 'Trailing Blocks + Output Head'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.work,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const fl = showFlag.value;
    const nodes = [
      txt(
        '40 TRANSFORMER BLOCKS + INPUT + OUTPUT  |  -ngl 24 COUNTS BACK FROM OUTPUT',
        -855,
        -220,
        26,
        ROLE.work,
        'mono',
        'left',
      ).opacity(alpha),

      chipPill('Input Emb (CPU)', -720, -100, {
        w: 270,
        h: 76,
        color: ROLE.gold,
        size: 26,
        opacity: alpha,
      }),
      chipPill('Blocks 0..16 (17 on CPU)', -265, -100, {
        w: 540,
        h: 76,
        color: ROLE.gold,
        size: 26,
        opacity: alpha,
      }),
      chipPill(`Blocks 17..39 (${FLAG_40_24.hiddenGpu} on GPU)`, 320, -100, {
        w: 540,
        h: 76,
        color: fl > 0.3 ? ROLE.vram : COSMOS.rule,
        fill: fl > 0.3 ? '#102a42' : '#10182d',
        size: 26,
        glow: fl > 0.3 ? 10 : 0,
        opacity: alpha,
      }),
      chipPill('Output (GPU)', 735, -100, {
        w: 230,
        h: 76,
        color: fl > 0.3 ? ROLE.ok : COSMOS.rule,
        fill: fl > 0.3 ? '#0f2d24' : '#10182d',
        size: 26,
        glow: fl > 0.3 ? 12 : 0,
        opacity: alpha,
      }),

      // Visual 40-block bar strip
      txt(
        'SLOT INDEX MAP (0..39 + OUT = 41 SLOTS)',
        -855,
        25,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    for (let i = 0; i < 41; i++) {
      const cx = -820 + i * 40.5;
      const isOut = i === 40;
      const onGpu = isOut || i >= 17;
      const col = isOut ? ROLE.ok : onGpu ? ROLE.vram : ROLE.gold;
      nodes.push(
        rect(34, 72, {
          fill: onGpu && fl > 0.3 ? '#122c44' : '#1a1828',
          stroke: onGpu && fl > 0.3 ? col : ROLE.gold,
          width: 1.8,
          radius: 4,
        })
          .at(cx, 105)
          .opacity(alpha),
      );
    }

    nodes.push(
      txt(
        'Count back 24 from end = Output (1) + 23 trailing blocks; always verify exact tensor placement in runner logs!',
        0,
        265,
        28,
        fl > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'pl-flag-semantics-1-0', (d) => s.play(showFlag.to(1, { duration: d })));
  bindCueBeat(s, c, accent, [
    'pl-flag-semantics-0-0',
    'pl-flag-semantics-0-1',
    'pl-flag-semantics-0-2',
    'pl-flag-semantics-1-1',
    'pl-flag-semantics-1-2',
    'pl-flag-semantics-1-3',
  ]);
}
