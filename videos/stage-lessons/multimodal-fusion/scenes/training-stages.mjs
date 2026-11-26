// Scene 13: training-stages: Red bus Stage 1 projector alignment vs Stage 2 instruction tuning + LLaVA vs LLaVA-1.5 recipes.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  circle,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function trainingStages(s, c) {
  const showCap = s.value(0);
  const showGrad1 = s.value(0);
  const showAns = s.value(0);
  const showStage2 = s.value(0);
  const showRecipes = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#33142626');
  const title = heroTitle(['Which Weights Learn', 'from the Image?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.warn,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const cap = showCap.value;
    const g1 = showGrad1.value;
    const ans = showAns.value;
    const st2 = showStage2.value;
    const rec = showRecipes.value;

    const nodes = [
      // Left: Minimal glowing vector red bus icon
      rect(250, 150, { fill: '#12182d', stroke: ROLE.warn, width: 2.6, radius: 14 })
        .at(-730, -135)
        .opacity(alpha),
      rect(155, 62, { fill: ROLE.warn, stroke: '#ff9cb0', width: 2, radius: 10 })
        .at(-730, -148)
        .glow(8, ROLE.warn)
        .opacity(alpha),
      rect(34, 22, { fill: '#0b1224', stroke: null, radius: 3 }).at(-776, -158).opacity(alpha),
      rect(34, 22, { fill: '#0b1224', stroke: null, radius: 3 }).at(-730, -158).opacity(alpha),
      rect(34, 22, { fill: '#0b1224', stroke: null, radius: 3 }).at(-684, -158).opacity(alpha),
      circle(15, { fill: '#1e293b', stroke: COSMOS.ink, width: 2.2 }).at(-775, -114).opacity(alpha),
      circle(15, { fill: '#1e293b', stroke: COSMOS.ink, width: 2.2 }).at(-685, -114).opacity(alpha),
      txt(
        ans > 0.35 ? 'QA: "Color?" -> "red"' : 'Caption: "a red" -> "bus"',
        -730,
        -25,
        26,
        ans > 0.35 ? ROLE.ok : ROLE.vision,
        'mono',
        'center',
      ).opacity(alpha),

      // Top pipeline: Vision Encoder -> Projector -> Language Decoder -> Target
      arrow([-595, -135], [-510, -135], { stroke: ROLE.vision, width: 3, head: 11 }).opacity(alpha),
      chipPill('Vision [FROZEN]', -355, -135, {
        w: 290,
        h: 76,
        color: ROLE.vision,
        fill: '#0e2038',
        size: 26,
        opacity: alpha,
      }),
      arrow([-195, -135], [-105, -135], { stroke: ROLE.gold, width: 3, head: 11 }).opacity(alpha),
      chipPill('Projector [TRAIN]', 60, -135, {
        w: 310,
        h: 76,
        color: ROLE.gold,
        fill: '#2c2210',
        size: 26,
        glow: 12,
        opacity: alpha,
      }),
      arrow([230, -135], [320, -135], {
        stroke: st2 > 0.35 ? ROLE.ok : ROLE.text,
        width: 3,
        head: 11,
      }).opacity(alpha),
      chipPill(st2 > 0.35 ? 'LLM [TRAIN / LoRA]' : 'LLM [FROZEN W]', 515, -135, {
        w: 365,
        h: 76,
        color: st2 > 0.35 ? ROLE.ok : ROLE.text,
        fill: st2 > 0.35 ? '#0f2d24' : '#0f1d38',
        size: 26,
        glow: st2 > 0.35 ? 14 : 6,
        opacity: alpha,
      }),

      // Backward activation-gradient path (Stage 1 -> through frozen LLM to Projector!)
      arrow([515, -75], [60, -75], {
        stroke: st2 > 0.35 ? ROLE.ok : ROLE.gold,
        width: 3.6,
        head: 13,
      })
        .glow(10, st2 > 0.35 ? ROLE.ok : ROLE.gold)
        .opacity(alpha * (0.42 + 0.58 * Math.max(g1, st2))),
      txt(
        st2 > 0.35
          ? 'Stage 2: gradients update BOTH LLM (or LoRA) and Projector'
          : g1 > 0.35 || cap > 0.35
            ? 'Stage 1: activation gradient passes THROUGH frozen LLM to update Projector'
            : 'Follow where the loss gradient updates weights',
        260,
        -25,
        26,
        st2 > 0.35 ? ROLE.ok : ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),

      // Bottom side-by-side comparison: LLaVA vs LLaVA-1.5
      txt('LLaVA (ORIGINAL)', -855, 95, 28, ROLE.vision, 'mono', 'left').opacity(
        alpha * (0.55 + 0.45 * rec),
      ),
      txt('Captions > Instructions', -855, 152, 26, COSMOS.ink, 'sans', 'left').opacity(
        alpha * (0.55 + 0.45 * rec),
      ),
      lumBar(-855, 206, 560, 28, ROLE.vision, {
        opacity: alpha * (0.55 + 0.45 * rec),
        maxTrackW: 720,
      }),
      txt('Captions (Stage 1)', -855, 255, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.55 + 0.45 * rec),
      ),
      lumBar(-855, 302, 220, 28, ROLE.bridge, {
        opacity: alpha * (0.55 + 0.45 * rec),
        maxTrackW: 720,
      }),
      txt('Instructions (Stage 2)', -855, 348, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.55 + 0.45 * rec),
      ),

      txt('LLaVA-1.5 (HIGHER RES + MLP)', 80, 95, 28, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.52 + 0.48 * rec),
      ),
      txt(
        'Instructions > Captions  |  ~1 day on 8x A100',
        80,
        152,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(alpha * (0.52 + 0.48 * rec)),
      lumBar(80, 206, 480, 28, ROLE.vision, {
        opacity: alpha * (0.52 + 0.48 * rec),
        maxTrackW: 720,
      }),
      txt('558K Captions', 80, 255, 26, COSMOS.muted, 'mono', 'left').opacity(
        alpha * (0.52 + 0.48 * rec),
      ),
      lumBar(80, 302, 640, 28, ROLE.ok, {
        opacity: alpha * (0.52 + 0.48 * rec),
        maxTrackW: 720,
      }),
      txt('665K Instructions + 2-layer MLP', 80, 348, 26, ROLE.ok, 'mono', 'left').opacity(
        alpha * (0.52 + 0.48 * rec),
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'training-caption-target', (d) => s.play(showCap.to(1, { duration: d })));
  playCue(s, c, 'mm-training-stages-0', (d) => s.play(showGrad1.to(1, { duration: d })));
  playCue(s, c, 'training-answer-target', (d) => s.play(showAns.to(1, { duration: d })));
  playCue(s, c, 'mm-training-stages-1', (d) => s.play(showStage2.to(1, { duration: d })));
  playCue(s, c, 'mm-training-stages-2', (d) => s.play(showRecipes.to(1, { duration: d })));
}
