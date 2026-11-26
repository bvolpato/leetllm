// Scene 27: artifact-lineage: Convert source -> high-precision GGUF -> quantize preset (never chain-quantize), reload saved artifact before eval, budget multimodal encoders.
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

export default function artifactLineage(s, c) {
  const showReload = s.value(0);
  const showMulti = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#14383222');
  const title = heroTitle(['Artifact Lineage & Reload Rule:', 'Test the Exact Saved File'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.ok,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const rl = showReload.value;
    const mm = showMulti.value;

    const nodes = [
      txt(
        'SEPARATE CONVERSION FROM QUANTIZATION; RETAIN HIGH-PRECISION GGUF FOR NEW PRESETS',
        -855,
        -220,
        26,
        ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),

      rect(440, 150, { fill: '#10203a', stroke: ROLE.weight, width: 2.8, radius: 12 })
        .at(-610, -55)
        .opacity(alpha),
      txt('1. SOURCE -> FP16 GGUF', -610, -90, 26, ROLE.weight, 'mono', 'center').opacity(alpha),
      txt('Convert once; keep master', -610, -34, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),

      arrow([-375, -55], [-290, -55], { stroke: ROLE.grid, width: 3.5, head: 11 }).opacity(alpha),

      rect(440, 150, { fill: '#261e10', stroke: ROLE.gold, width: 2.8, radius: 12 })
        .at(-55, -55)
        .opacity(alpha),
      txt('2. QUANTIZE PRESET', -55, -90, 26, ROLE.gold, 'mono', 'center').opacity(alpha),
      txt('Emit saved Q4_K_M file', -55, -34, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),

      arrow([180, -55], [265, -55], { stroke: ROLE.ok, width: 3.5, head: 11 }).opacity(
        alpha * (0.48 + 0.52 * rl),
      ),

      rect(520, 150, {
        fill: rl > 0.35 ? '#0f2d24' : '#10182d',
        stroke: rl > 0.35 ? ROLE.ok : ROLE.grid,
        width: 2.8,
        radius: 12,
      })
        .at(540, -55)
        .opacity(alpha * (0.48 + 0.52 * rl)),
      txt('3. RELOAD & EVALUATE', 540, -90, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
      txt('Never test in-memory object!', 540, -34, 26, COSMOS.ink, 'sans', 'center').opacity(
        alpha,
      ),

      chipPill(
        'Match tokenizer, chat template, prompts, decoding policy & log exact backend + kernel dispatch',
        0,
        115,
        {
          w: 1620,
          h: 74,
          color: rl > 0.35 ? ROLE.ok : ROLE.grid,
          size: 26,
          opacity: alpha * (0.5 + 0.5 * rl),
        },
      ),
      chipPill(
        'Multimodal: budget vision/audio encoders & test every modality from saved file!',
        0,
        225,
        {
          w: 1620,
          h: 74,
          color: mm > 0.35 ? ROLE.code : ROLE.gold,
          fill: mm > 0.35 ? '#181434' : '#10182d',
          size: 26,
          glow: mm > 0.35 ? 10 : 4,
          opacity: alpha * (0.5 + 0.5 * mm),
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'artifact-lineage-build-0', (d) => s.play(showReload.to(0, { duration: d })));
  playCue(s, c, 'artifact-lineage-build-1', (d) => s.play(showReload.to(1, { duration: d })));
  playCue(s, c, 'artifact-lineage-build-2', (d) => s.play(showMulti.to(1, { duration: d })));
}
