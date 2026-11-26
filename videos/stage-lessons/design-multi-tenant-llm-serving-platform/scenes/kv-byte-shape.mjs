// Scene 13: kv-byte-shape - Derive the memory hidden behind each token
// Signature orbiting 3D KV-Cache Tensor Slab Stack (`cinematic3d`, `addBox3D`, `wireframeSlab3d`)!
// Builds 2 (K+V) x 80 layers x 8 KV heads x 128 dim x 2 bytes = 327,680 B -> 0.3125 MiB -> 1.2207 GiB.
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  KV_4000_GIB,
  KV_BYTES_PER_TOKEN,
  KV_FACTORS,
  KV_MIB_PER_TOKEN,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  driftValue,
  guardedDynamic,
  orbitScene,
  stepAfter,
  stepOn,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function kvByteShape(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const bytesOn = s.value(0);
  const b1On = s.value(0);
  const mibOn = s.value(0);
  const gibOn = s.value(0);
  const b2On = s.value(0);

  const stageAura = aura(440, 10, 620, '#5ce1e624', '#a78bfa1c');
  const header = cinemaHeader(
    'PER-TOKEN KV FOOTPRINT',
    'Derive the memory hidden',
    'behind each token',
    { x: -860, y: -450, accent: ROLE.kv, size: 46 },
  );

  // Orbiting 3D K-Stack & V-Stack Tensor Monolith on right half
  const kv3d = cinematic3d({
    theta: -0.8,
    phi: 0.96,
    distance: 15.8,
    unit: 106,
    focus: [0, 0, 1.15],
  }).at(465, 10);

  kv3d.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.1,
      color: '#223358',
      width: 1.2,
      opacity: 0.45,
    }),
  );

  // K tensor stack (left, blue/cyan layered slabs representing 80 layers)
  for (let l = 0; l < 6; l++) {
    addBox3D(kv3d, -2.35, -1.0, 0.1 + l * 0.36, 1.8, 2.0, 0.24, ROLE.A, ROLE.kv, {
      faceOpacity: 0.78,
      edgeGlow: 7,
    });
  }
  // V tensor stack (right, violet/rose layered slabs representing 80 layers)
  for (let l = 0; l < 6; l++) {
    addBox3D(kv3d, 0.55, -1.0, 0.1 + l * 0.36, 1.8, 2.0, 0.24, ROLE.model, ROLE.B, {
      faceOpacity: 0.78,
      edgeGlow: 7,
    });
  }
  kv3d.add(
    ...wireframeSlab3d([0, 0, 1.18], 2.55, 1.2, 1.18, {
      color: ROLE.focus,
      width: 2.2,
      glow: 8,
    }),
  );

  addArc3D(kv3d, [-1.45, 0, 2.38], [1.45, 0, 2.38], ROLE.kv, {
    lift: 0.6,
    pulseVal: pulse,
    phaseOffset: 0,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const by = bytesOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const mb = mibOn.value > 0.5;
      const gb = gibOn.value > 0.5;
      const b2 = b2On.value > 0.5;

      const nodes = [
        txt('3D KV TENSOR STACKS (80 LAYERS)', 465, -430, 26, ROLE.kv, 'mono', 'center'),
        txt(
          'K (LEFT) · V (RIGHT) · 8 KV HEADS × 128 × 2 B',
          465,
          432,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      ];

      // Dimensional factors strip on left (always visible)
      nodes.push(
        txt('DIMENSIONAL PRODUCT PER CACHED TOKEN', -855, -245, 26, ROLE.kv, 'mono', 'left'),
      );
      KV_FACTORS.forEach(([label, val, col], idx) => {
        const fx = -780 + idx * 176;
        nodes.push(
          rect(132, 108, { fill: '#0b1426', stroke: col, width: 2.6, radius: 12 })
            .at(fx, -158)
            .glow(5, col),
          txt(String(val), fx, -172, 38, col, 'mono', 'center'),
          txt(label, fx, -124, 26, COSMOS.muted, 'sans', 'center'),
        );
        if (idx < 4) {
          nodes.push(txt('×', fx + 88, -158, 28, COSMOS.muted, 'mono', 'center'));
        }
      });

      // Exact byte payload box
      nodes.push(
        rect(860, 108, {
          fill: '#0c1628',
          stroke: by ? ROLE.focus : '#2c3d66',
          width: 2.8,
          radius: 14,
        })
          .at(-425, -20)
          .glow(by ? 9 : 0, ROLE.focus),
        txt('EXACT BYTES PER TOKEN', -825, -46, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          by
            ? `${KV_BYTES_PER_TOKEN.toLocaleString('en-US')} bytes / token`
            : '2 × 80 × 8 × 128 × 2 = ?',
          -825,
          4,
          36,
          by ? ROLE.focus : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // MiB & 4,000-token GiB boxes
      nodes.push(
        rect(418, 128, {
          fill: '#0b1926',
          stroke: mb ? ROLE.kv : '#2c3d66',
          width: 2.6,
          radius: 14,
        })
          .at(-646, 130)
          .glow(mb ? 8 : 0, ROLE.kv),
        txt('MEBIBYTES / TOKEN', -825, 96, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          mb ? `${KV_MIB_PER_TOKEN} MiB` : '÷ 2^20 ...',
          -825,
          152,
          38,
          mb ? ROLE.kv : COSMOS.dim,
          'mono',
          'left',
        ),

        rect(418, 128, {
          fill: '#0b1e1b',
          stroke: gb ? ROLE.ok : '#2c3d66',
          width: 2.8,
          radius: 14,
        })
          .at(-204, 130)
          .glow(gb ? 9 : 0, ROLE.ok),
        txt('4,000 TOKENS (AGG)', -383, 96, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          gb ? `${KV_4000_GIB.toFixed(4)} GiB` : '× 4,000 ...',
          -383,
          152,
          38,
          gb ? ROLE.ok : COSMOS.dim,
          'mono',
          'left',
        ),
      );

      // Excluded Query-Head box (Beat 1) or Per-device sharding reality (Beat 2)
      if (b2) {
        nodes.push(
          rect(860, 146, { fill: '#1a140b', stroke: ROLE.warn, width: 2.8, radius: 14 })
            .at(-425, 318)
            .glow(7, ROLE.warn),
          txt('VALIDATE PER-DEVICE PLACEMENT', -825, 282, 26, ROLE.warn, 'mono', 'left'),
          txt('Aggregate ÷ GPU count never proves fit:', -825, 326, 27, COSMOS.ink, 'sans', 'left'),
          txt(
            'Check head sharding, weights, adapters & headroom.',
            -825,
            364,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else {
        nodes.push(
          rect(860, 128, {
            fill: b1 ? '#24101a' : '#0c1424',
            stroke: b1 ? ROLE.fail : '#2c3d66',
            width: 2.6,
            radius: 14,
          })
            .at(-425, 315)
            .glow(b1 ? 8 : 0, ROLE.fail),
          txt(
            'EXCLUDED FROM KV CACHE FACTOR',
            -825,
            285,
            26,
            b1 ? ROLE.fail : COSMOS.muted,
            'mono',
            'left',
          ),
          txt(
            'Query heads (GQA) are not stored; using them overstates cache.',
            -825,
            336,
            26,
            b1 ? COSMOS.ink : COSMOS.dim,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, kv3d, header, view);
  orbitScene(s, c, kv3d, { theta: -0.2, phi: 0.84 });
  driftValue(s, c, pulse, 4.5);

  stepOn(s, c, 'mt-kv-byte-shape-b0', b0On, 1);
  stepAfter(s, c, 'mt-kv-byte-shape-s0-2', bytesOn, 1);
  stepOn(s, c, 'mt-kv-byte-shape-b1', b1On, 1);
  stepAfter(s, c, 'mt-kv-byte-shape-s1-0', mibOn, 1);
  stepAfter(s, c, 'mt-kv-byte-shape-s1-1', gibOn, 1);
  stepOn(s, c, 'mt-kv-byte-shape-b2', b2On, 1);
}
