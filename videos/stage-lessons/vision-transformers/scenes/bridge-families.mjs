// Scene 20: bridge-families: LLaVA (256 prefix), Flamingo (64 cross-attn latents) & Qwen2.5-VL (2x2 merger -> 64).
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
  txt,
} from '../parts.mjs';

export default function bridgeFamilies(s, c) {
  const activeLane = s.value(0); // 0=LLaVA, 1=Flamingo, 2=Qwen2.5-VL

  const bgAura = aura(0, 0, 740, '#14335c28', '#25184422');
  const title = heroTitle(['VLM Bridge Families:', 'Different Slot Boundaries'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.bridge,
  });

  const lanes = [
    {
      idx: 0,
      y: -150,
      name: 'LLaVA (CLIP ViT-L/14)',
      enc: '256 x 1024 patches',
      bridge: 'Linear MLP bridge',
      out: '256 prefix slots',
      note: 'LLaVA 1.5 @ 336px -> 576 slots',
      color: ROLE.patch,
    },
    {
      idx: 1,
      y: 45,
      name: 'Flamingo (NFNet)',
      enc: 'NFNet feature grid',
      bridge: 'Perceiver Resampler',
      out: '64 cross-attn latents',
      note: 'Visual memory, NOT self-attn prefix',
      color: ROLE.pos,
    },
    {
      idx: 2,
      y: 240,
      name: 'Qwen2.5-VL (1280 ViT)',
      enc: '256 patches (224px)',
      bridge: '2x2 pack + MLP merge',
      out: '64 prefix slots',
      note: '28 window + 4 full-attn ViT layers',
      color: ROLE.bridge,
    },
  ];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const lane = Math.round(activeLane.value);
    const nodes = [];

    lanes.forEach((L) => {
      const isActive = lane === L.idx;
      const op = isActive ? 1 : 0.42;
      nodes.push(
        txt(L.name, -855, L.y - 52, 28, L.color, 'mono', 'left').opacity(alpha * op),
        txt(L.note, 855, L.y - 52, 26, COSMOS.muted, 'sans', 'right').opacity(alpha * op),
        chipPill(L.enc, -625, L.y + 12, {
          w: 440,
          h: 68,
          color: isActive ? L.color : COSMOS.rule,
          size: 26,
          glow: isActive ? 10 : 0,
          opacity: alpha * op,
        }),
        arrow([-390, L.y + 12], [-275, L.y + 12], { stroke: L.color, width: 3, head: 10 }).opacity(
          alpha * op,
        ),
        chipPill(L.bridge, -30, L.y + 12, {
          w: 450,
          h: 68,
          color: isActive ? L.color : COSMOS.rule,
          size: 26,
          glow: isActive ? 10 : 0,
          opacity: alpha * op,
        }),
        arrow([210, L.y + 12], [325, L.y + 12], { stroke: L.color, width: 3, head: 10 }).opacity(
          alpha * op,
        ),
        chipPill(L.out, 585, L.y + 12, {
          w: 480,
          h: 68,
          color: isActive ? ROLE.ok : COSMOS.rule,
          fill: isActive ? '#0f2d24' : '#10182d',
          size: 26,
          glow: isActive ? 12 : 0,
          opacity: alpha * op,
        }),
      );
    });

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'bridge-families-beat-0', (d) => s.play(activeLane.to(0, { duration: d })));
  playCue(s, c, 'bridge-families-beat-1', (d) => s.play(activeLane.to(1, { duration: d })));
  playCue(s, c, 'bridge-families-beat-2', (d) => s.play(activeLane.to(2, { duration: d })));
}
