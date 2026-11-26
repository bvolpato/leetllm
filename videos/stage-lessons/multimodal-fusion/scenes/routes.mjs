// Scene 08: routes: Late fusion vs Early fusion vs Cross-attention with orbiting 3D cross-modal fusion bridge.
import {
  COSMOS,
  FUSION_SCORE,
  ROLE,
  aura,
  buildFusionBridge3d,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function routes(s, c) {
  const mode = s.value(0); // 0 = late, 1 = early, 2 = cross
  const litLate = s.value(0);
  const litEarly = s.value(0);
  const litCross = s.value(0);

  const bgAura = aura(340, 20, 760, '#14335c2c', '#2c184e28');
  const title = heroTitle(['Choose Where Image', 'and Text Meet'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.bridge,
  });

  // Signature orbiting 3D cross-modal fusion bridge on the right
  const bridge3d = buildFusionBridge3d(mode, { x: 455, y: 20 });
  orbitScene(s, c, bridge3d, { theta: -0.28, phi: 0.92 });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const l0 = litLate.value;
    const l1 = litEarly.value;
    const l2 = litCross.value;

    const lanes = [
      {
        title: '1. LATE FUSION (CLIP / SigLIP)',
        detail: `Pooled vectors -> dot score ${FUSION_SCORE.score.toFixed(2)}`,
        note: 'Fast retrieval; no patch tokens for decoder',
        color: ROLE.text,
        active: l0,
        y: -140,
      },
      {
        title: '2. EARLY FUSION (Shared Prefix)',
        detail: 'Projected visual tokens join text prefix',
        note: 'Deep self-attention; longer shared KV sequence',
        color: ROLE.ok,
        active: l1,
        y: 35,
      },
      {
        title: '3. CROSS-ATTENTION (Visual Memory)',
        detail: 'Text queries read separate visual K/V bank',
        note: 'Keeps text stream short; extra fusion layers',
        color: ROLE.gold,
        active: l2,
        y: 210,
      },
    ];

    const nodes = lanes.flatMap((lane) => {
      const a = lane.active;
      const op = alpha * (0.55 + 0.45 * a);
      return [
        rect(860, 146, {
          fill: a > 0.3 ? '#111b35' : '#0b1122',
          stroke: a > 0.3 ? lane.color : '#2c3d68',
          width: a > 0.3 ? 3.2 : 2,
          radius: 14,
        })
          .at(-425, lane.y)
          .glow(a > 0.3 ? 12 : 0, lane.color)
          .opacity(op),
        txt(lane.title, -825, lane.y - 38, 28, lane.color, 'mono', 'left').opacity(op),
        txt(lane.detail, -825, lane.y + 4, 26, COSMOS.ink, 'sans', 'left').opacity(op),
        txt(lane.note, -825, lane.y + 44, 26, COSMOS.muted, 'sans', 'left').opacity(op),
      ];
    });

    const activeLabel =
      l2 > 0.4
        ? 'Cross-Attention Bridge (Side K/V)'
        : l1 > 0.4
          ? 'Early-Fusion Shared Prefix Manifold'
          : 'Dual-Tower Late Fusion (Score Only)';

    nodes.push(
      chipPill(activeLabel, 455, 340, {
        w: 690,
        h: 64,
        color: l2 > 0.4 ? ROLE.gold : l1 > 0.4 ? ROLE.ok : ROLE.text,
        size: 26,
        opacity: alpha,
      }),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, bridge3d, layer);
  playCue(s, c, 'routes-read-0', (d) => s.play(litLate.to(1, { duration: d })));
  playCue(s, c, 'routes-read-1', (d) => {
    s.play(litEarly.to(1, { duration: d }));
    s.play(mode.to(1, { duration: d }));
  });
  playCue(s, c, 'routes-read-2', (d) => {
    s.play(litCross.to(1, { duration: d }));
    s.play(mode.to(2, { duration: d }));
  });
}
