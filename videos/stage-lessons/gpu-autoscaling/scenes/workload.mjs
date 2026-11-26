// Scene 14: workload - Can the fifth request still fit?
// Orbiting 3D 8-GiB KV cache chamber with 5 active request monoliths:
// 4k tokens -> 0.5 GiB each (2.5 GiB total, all 5 fit);
// 4x history (16k tokens) -> 2.0 GiB each -> strict prediction withholding until AFTER four-fit (5th breaches 8 GiB!).
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInNodes,
  fadeOutNodes,
  glowBar,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function workload(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=short 4k (0.5 GiB x5 = 2.5 GiB), 2=4x history prompt (predict!), 3=reveal 4 fit + 5th overflows (AFTER!)

  const header = cinemaHeader('KV CACHE PRESSURE', 'Can the fifth request', 'still fit?', {
    x: -860,
    y: -420,
    accent: ROLE.kv,
    size: 52,
  });

  const bgAura = aura(275, 25, 620, '#fb923c22', '#ff6b8b18');

  // 3D 8-GiB Cache Pool Chamber on right
  const poolView = cinematic3d({
    theta: -0.82,
    phi: 1.02,
    distance: 15.6,
    unit: 114,
    focus: [0, 0, 1.15],
  }).at(285, 28);

  poolView.add(
    gridPlane3d({
      x: [-3.6, 3.6],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  // Outer 8-GiB Pool Ceiling Cage (holds 4 tall 2-GiB slabs = z height 2.4)
  addWireBox3D(poolView, -2.75, -1.65, 0.04, 5.5, 3.3, 2.35, ROLE.deadline, {
    width: 2.6,
    opacity: 0.9,
    glow: 9,
  });

  // Short-history slabs: 5 low cyan slabs (0.5 GiB each -> z height 0.55) all comfortably inside
  const shortSlabs = [];
  for (let i = 0; i < 5; i++) {
    shortSlabs.push(
      ...addBox3D(
        poolView,
        -2.45 + i * 1.02,
        -1.2,
        0.08,
        0.84,
        2.4,
        0.58,
        ROLE.active,
        ROLE.active,
        {
          faceOpacity: 0.82,
          edgeWidth: 2.1,
          edgeGlow: 7,
        },
      ),
    );
  }

  // Long-history slabs (2.0 GiB each): 4 fit inside the 8 GiB boundary, 5th breaches outside in rose!
  const longFitSlabs = [];
  for (let i = 0; i < 4; i++) {
    longFitSlabs.push(
      ...addBox3D(poolView, -2.45 + i * 1.26, -1.2, 0.08, 1.06, 2.4, 2.22, ROLE.kv, ROLE.kv, {
        faceOpacity: 0.82,
        edgeWidth: 2.2,
        edgeGlow: 8,
      }),
    );
  }
  const fifthOverflow = addBox3D(
    poolView,
    3.15,
    -1.2,
    0.08,
    1.06,
    2.4,
    2.22,
    ROLE.expired,
    ROLE.expired,
    {
      faceOpacity: 0.86,
      edgeWidth: 2.8,
      edgeGlow: 11,
    },
  );
  hideNodes(longFitSlabs);
  hideNodes(fifthOverflow);

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const blink = 0.68 + 0.32 * Math.sin(p * 5.0);
      const nodes = [
        txt('FIXED 8 GiB KV CACHE CHAMBER', 285, -402, 26, ROLE.deadline, 'mono').glow(
          5,
          ROLE.deadline,
        ),
        txt('Model KV cost:  128 KiB / token', -860, -185, 28, ROLE.active, 'mono', 'left'),
        txt(
          'Short history:  4,096 tok -> 0.5 GiB / req',
          -860,
          -130,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
        txt(
          st >= 2.5
            ? 'Long history:  4 x 2.0 GiB = 8.0 GiB  (100% FULL)'
            : '5 short requests = 2.5 GiB  (fits 8 GiB)',
          -860,
          -76,
          26,
          st >= 2.5 ? ROLE.expired : ROLE.warm,
          'mono',
          'left',
        ),
        glowBar(-860, -16, 620, 38, st >= 2.5 ? 1.0 : 2.5 / 8, {
          fill: st >= 2.5 ? ROLE.expired : ROLE.warm,
          glow: 8,
        }),
      ];

      if (st >= 1.5 && st < 2.5) {
        nodes.push(
          txt('4x LONGER HISTORY (16,384 TOKENS EACH)', -860, 74, 26, ROLE.kv, 'mono', 'left').glow(
            6,
            ROLE.kv,
          ),
          txt('Same 5 callers  ·  Same 8 GiB pool', -860, 130, 28, COSMOS.ink, 'sans', 'left'),
          txt('PREDICT: How many of the 5 fit?', -860, 210, 32, ROLE.predict, 'sans', 'left')
            .glow(8, ROLE.predict)
            .opacity(blink),
        );
      }

      if (st >= 2.5) {
        nodes.push(
          txt('ONLY 4 FIT  (4 x 2 GiB = 8 GiB)', -860, 76, 34, ROLE.expired, 'mono', 'left').glow(
            9,
            ROLE.expired,
          ),
          txt(
            '5th caller needs 10 GiB -> blocked outside pool',
            -860,
            140,
            26,
            ROLE.expired,
            'sans',
            'left',
          ),
          txt(
            'Request count stayed 5, yet cache filled 100%',
            -860,
            216,
            28,
            ROLE.focus,
            'sans',
            'left',
          ),
          txt(
            'Scale on live KV allocation, queue age & rejects',
            -860,
            278,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, poolView, header, dyn);
  orbitScene(s, c, poolView, { theta: -0.2, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, phase, 6.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('kv-bytes', () => {
    s.play(step.to(1, { duration: clampDur(c, c.cue('kv-bytes').start, 0.3) }));
  });
  c.on('extend-history', () => {
    // Question beat: DO NOT show the 4-fit/5th-overflow slabs yet!
    s.play(step.to(2, { duration: clampDur(c, c.cue('extend-history').start, 0.3) }));
  });
  c.after('four-fit', () => {
    const t = c.cue('four-fit').end;
    s.play(step.to(3, { duration: clampDur(c, t, 0.3) }));
    fadeOutNodes(s, c, t, shortSlabs, 0.25);
    fadeInNodes(s, c, t, [...longFitSlabs, ...fifthOverflow], 0.38);
  });
}
