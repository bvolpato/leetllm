// Scene 11: placement: 32 blocks (0.3 GB each + 3.2 GB fixed): 16 GB -> all 32 GPU; 8 GB -> 16 CPU + 16 GPU -> activation [2 nums] crosses link!
import {
  COSMOS,
  PLACE_16,
  PLACE_8,
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

export default function placement(s, c) {
  const splitMode = s.value(0); // 0=all 32 GPU (16 GB), 1=16 CPU + 16 GPU (8 GB)
  const revealAct = s.value(0); // strictly withheld until AFTER cross-vector!
  const showMatch = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Split Layer Placement:', 'What Crosses the Link?'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vram,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sp = splitMode.value;
    const rev = revealAct.value;
    const mat = showMatch.value;
    const isSplit = sp > 0.35;

    const nodes = [
      txt(
        isSplit
          ? '8 GB BUDGET: floor((8.0 - 3.2) / 0.3) = 16 GPU BLOCKS (1..16 CPU, 17..32 GPU)'
          : '16 GB BUDGET: ALL 32 BLOCKS (0.3 GB EACH) + 3.2 GB FIXED FIT ON GPU',
        -855,
        -220,
        26,
        isSplit ? ROLE.gold : ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    // 32 block tiles in two 16-block banks
    for (let i = 0; i < 32; i++) {
      const isSecondHalf = i >= 16;
      const cx = -815 + (i % 16) * 106;
      const y = isSecondHalf ? 54 : -106;
      const onCpu = isSplit && !isSecondHalf;
      const col = onCpu ? ROLE.gold : ROLE.vram;
      nodes.push(
        rect(90, 62, {
          fill: onCpu ? '#2c2210' : '#10273e',
          stroke: col,
          width: 2.2,
          radius: 8,
        })
          .at(cx, y)
          .opacity(alpha),
        txt(`B${i + 1}`, cx, y, 26, col, 'mono', 'center').opacity(alpha),
      );
    }

    nodes.push(
      txt(
        isSplit ? 'HOST CPU RAM (Blocks 1..16)' : 'GPU VRAM (Blocks 1..16)',
        -855,
        -168,
        26,
        isSplit ? ROLE.gold : ROLE.vram,
        'mono',
        'left',
      ).opacity(alpha),
      txt('GPU VRAM (Blocks 17..32)', -855, -8, 26, ROLE.vram, 'mono', 'left').opacity(alpha),

      // Boundary transfer readout between B16 and B17 (strictly withheld until cross-vector!)
      arrow([0, -68], [0, 12], {
        stroke: rev > 0.4 ? ROLE.ok : ROLE.gold,
        width: 4,
        head: 12,
      }).opacity(alpha * (isSplit ? 1 : 0.25)),
      chipPill(
        rev > 0.4
          ? `CROSSES LINK: Activation [${PLACE_8.blocks[15].output[0].toFixed(2)}, ${PLACE_8.blocks[15].output[1].toFixed(2)}] (weights stay put!)`
          : isSplit
            ? 'CPU ran Blocks 1..16 -> What crosses PCIe to Block 17?'
            : `Reference output: [${PLACE_16.output[0].toFixed(2)}, ${PLACE_16.output[1].toFixed(2)}]`,
        0,
        195,
        {
          w: 1380,
          h: 78,
          color: rev > 0.4 ? ROLE.ok : ROLE.gold,
          fill: rev > 0.4 ? '#0f2d24' : '#10182d',
          size: 28,
          glow: rev > 0.4 ? 12 : 6,
          opacity: alpha,
        },
      ),
      txt(
        mat > 0.3
          ? `Split output [${PLACE_8.output[0].toFixed(2)}, ${PLACE_8.output[1].toFixed(2)}] matches all-GPU reference exactly!`
          : 'Same operations in the same order produce the exact same numerical output',
        0,
        305,
        28,
        mat > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'fixed-blocks', (d) => s.play(splitMode.to(0, { duration: d })));
  playCue(s, c, 'run-reference', (d) => s.play(splitMode.to(0, { duration: d })));
  playCue(s, c, 'smaller-budget', (d) => s.play(splitMode.to(0.5, { duration: d })));
  playCue(s, c, 'place-prefix', (d) => s.play(splitMode.to(1, { duration: d })));
  playCue(s, c, 'run-prefix', (d) => s.play(splitMode.to(1, { duration: d })));
  playCue(s, c, 'ask-boundary', (d) => s.play(splitMode.to(1, { duration: d })));
  // Strict prediction withholding: reveal activation crossing link only after cross-vector!
  playCue(s, c, 'cross-vector', (d) => s.play(revealAct.to(1, { duration: d })), { after: true });
  playCue(s, c, 'run-suffix', (d) => s.play(showMatch.to(0.5, { duration: d })));
  playCue(s, c, 'inspect-placement', (d) => s.play(showMatch.to(1, { duration: d })));
}
