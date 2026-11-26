// Scene 14: joint-and-posttraining: Unfrozen 3-path joint training, 3D contrastive modality gap, and DPO vs input boundary.
import {
  COSMOS,
  ROLE,
  aura,
  buildModalityGap3d,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  playCue,
  txt,
} from '../parts.mjs';

export default function jointAndPosttraining(s, c) {
  const showJoint = s.value(0);
  const gapVal = s.value(0.2);
  const showPost = s.value(0);

  const bgAura = aura(350, 20, 760, '#14335c2a', '#2c184c26');
  const title = heroTitle(['Separate Feature Learning', 'from Answer Behavior'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.bridge,
  });

  // Signature orbiting 3D contrastive modality-gap embedding surface on the right
  const gap3d = buildModalityGap3d(gapVal, { x: 465, y: 20 });
  orbitScene(s, c, gap3d, { theta: -0.3, phi: 0.94 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const jn = showJoint.value;
    const gp = gapVal.value;
    const ps = showPost.value;

    const nodes = [
      // Section 1: Fully unfrozen joint multimodal stage
      txt(
        '1. JOINT UNFREEZING (ALL 3 BACKWARD PATHS)',
        -855,
        -230,
        26,
        ROLE.gold,
        'mono',
        'left',
      ).opacity(alpha),
      chipPill('Vision [UNFROZEN]', -715, -145, {
        w: 275,
        h: 66,
        color: jn > 0.3 ? ROLE.vision : '#384c76',
        fill: jn > 0.3 ? '#0e283c' : '#10182d',
        size: 26,
        glow: jn > 0.3 ? 12 : 4,
        opacity: alpha,
      }),
      chipPill('Bridge [UNFROZEN]', -420, -145, {
        w: 280,
        h: 66,
        color: jn > 0.3 ? ROLE.bridge : '#384c76',
        fill: jn > 0.3 ? '#211842' : '#10182d',
        size: 26,
        glow: jn > 0.3 ? 12 : 4,
        opacity: alpha,
      }),
      chipPill('LLM [UNFROZEN]', -135, -145, {
        w: 255,
        h: 66,
        color: jn > 0.3 ? ROLE.text : '#384c76',
        fill: jn > 0.3 ? '#122548' : '#10182d',
        size: 26,
        glow: jn > 0.3 ? 12 : 4,
        opacity: alpha,
      }),
      txt(
        'Track per-modality LRs, text-only regressions & grounded slices',
        -855,
        -75,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),

      // Section 2: Contrastive modality gap diagnosis
      txt(
        '2. CONTRASTIVE MODALITY GAP != BROKEN PROJECTOR',
        -855,
        10,
        26,
        gp > 0.5 ? ROLE.vision : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        'Init + temperature separate image & text cones in shared space',
        -855,
        62,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(alpha * (0.6 + 0.4 * gp)),

      // Section 3: Post-training (DPO / RL) vs input representation boundary
      txt(
        '3. DPO / RL IMPROVES ABSTENTION, NOT ERASED PIXELS',
        -855,
        155,
        26,
        ps > 0.3 ? ROLE.ok : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (0.55 + 0.45 * ps)),
      chipPill('Tiny Label Erased', -680, 235, {
        w: 350,
        h: 66,
        color: ROLE.warn,
        fill: '#2c1422',
        size: 26,
        glow: ps > 0.3 ? 10 : 4,
        opacity: alpha * (0.55 + 0.45 * ps),
      }),
      chipPill('Fix Crop / Bridge 1st', -270, 235, {
        w: 420,
        h: 66,
        color: ps > 0.3 ? ROLE.ok : '#384c76',
        fill: ps > 0.3 ? '#0f2d24' : '#10182d',
        size: 26,
        glow: ps > 0.3 ? 12 : 4,
        opacity: alpha * (0.55 + 0.45 * ps),
      }),
      txt(
        'Hold artifact fixed: isolate crop, connector, and decoder one by one',
        -855,
        320,
        26,
        ps > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),

      // 3D caption on right
      txt(
        gp > 0.5 ? 'Image Cone vs Text Cone (Modality Gap)' : 'Contrastive Embedding Manifold',
        465,
        340,
        26,
        gp > 0.5 ? ROLE.gold : ROLE.bridge,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, gap3d, layer);
  playCue(s, c, 'mm-joint-and-posttraining-0', (d) => s.play(showJoint.to(1, { duration: d })));
  playCue(s, c, 'mm-joint-and-posttraining-1', (d) => s.play(gapVal.to(1, { duration: d })), {
    dur: 0.9,
  });
  playCue(s, c, 'mm-joint-and-posttraining-2', (d) => s.play(showPost.to(1, { duration: d })));
}
