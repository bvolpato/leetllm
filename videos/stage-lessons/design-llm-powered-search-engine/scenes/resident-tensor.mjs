// Scene 22: resident-tensor - Convert the resident interval into actual cache bytes
// Signature orbiting 3D KV-Cache Tensor Slab Stack (`cinematic3d`, `addBox3D`, `wireframeSlab3d`)!
// Shows 0.37 + 1.93 + 0.20 = 2.50s -> 1,500 vs 1,158 -> 32-layer K & V stacks = 131,072 B/pos -> 220.52 GiB.
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  CAPACITY_DATA,
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  glowMeter,
  guardedDynamic,
  orbitScene,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function residentTensor(s, c) {
  const pulse = s.value(0);
  const startOn = s.value(0);
  const intervalOn = s.value(0);
  const beat1On = s.value(0);
  const countsOn = s.value(0);
  const beat2On = s.value(0);
  const bytesOn = s.value(0);
  const gibOn = s.value(0);

  const header = cinemaHeader(
    'KV TENSOR FOOTPRINT',
    'Convert resident time',
    'into cache gibibytes',
    {
      accent: ROLE.kv,
      size: 46,
    },
  );

  const stageAura = aura(390, 20, 600, '#5ce1e624', '#a78bfa1c');

  // Orbiting 3D K-Stack & V-Stack Tensor Monolith on right half
  const kv3d = cinematic3d({
    theta: -0.78,
    phi: 0.98,
    distance: 15.8,
    unit: 108,
    focus: [0, 0, 1.1],
  }).at(410, 20);

  kv3d.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.6, 2.6],
      z: 0,
      step: 1.1,
      color: '#223358',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // K tensor stack (left, blue/cyan layered slabs representing 32 attention layers)
  for (let l = 0; l < 6; l++) {
    addBox3D(kv3d, -2.35, -1.0, 0.1 + l * 0.36, 1.8, 2.0, 0.24, ROLE.policy, ROLE.kv, {
      faceOpacity: 0.78,
      edgeGlow: 7,
    });
  }
  // V tensor stack (right, violet/rose layered slabs representing 32 attention layers)
  for (let l = 0; l < 6; l++) {
    addBox3D(kv3d, 0.55, -1.0, 0.1 + l * 0.36, 1.8, 2.0, 0.24, ROLE.rewrite, ROLE.deny, {
      faceOpacity: 0.78,
      edgeGlow: 7,
    });
  }
  // Glowing outer VRAM allocation cage
  kv3d.add(
    ...wireframeSlab3d([0, 0, 1.18], 2.55, 1.2, 1.18, {
      color: ROLE.focus,
      width: 2.2,
      glow: 8,
    }),
  );

  addArc3D(kv3d, [-1.45, 0, 2.35], [1.45, 0, 2.35], ROLE.kv, {
    lift: 0.65,
    pulseVal: pulse,
    phaseOffset: 0.0,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const iv = intervalOn.value > 0.5;
      const b1 = beat1On.value > 0.5;
      const cnt = countsOn.value > 0.5;
      const b2 = beat2On.value > 0.5;
      const by = bytesOn.value > 0.5;
      const gb = gibOn.value > 0.5;
      const nodes = [
        txt('3D KV-CACHE TENSOR STACKS (32 LAYERS)', 410, -430, 26, ROLE.kv, 'mono', 'center'),
        txt(
          'LEFT: K TENSORS  ·  RIGHT: V TENSORS  ·  8 KV HEADS × 128 DIM × 2 B',
          410,
          435,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      ];

      if (b2) {
        // Beat 2: Exact bytes/position & 220.52 GiB derivation on left
        nodes.push(
          txt('FULL-HISTORY CACHE FACTORS', -855, -225, 26, ROLE.kv, 'mono', 'left'),
          txt('2 (K+V)  ×  32 layers  ×  8 KV heads', -855, -162, 30, COSMOS.ink, 'mono', 'left'),
          txt(
            '×  128 head width  ×  2 bytes (fp16/bf16)',
            -855,
            -108,
            30,
            COSMOS.ink,
            'mono',
            'left',
          ),

          rect(820, 126, {
            fill: '#0d1628',
            stroke: by ? ROLE.focus : '#2c3d66',
            width: 2.8,
            radius: 14,
          })
            .at(-445, 20)
            .glow(by ? 9 : 0, ROLE.focus),
          txt('PER-POSITION PAYLOAD', -815, -14, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            by
              ? `${CAPACITY_DATA.bytesPerPosition.toLocaleString()} bytes / position`
              : 'multiplying factors...',
            -815,
            42,
            34,
            by ? ROLE.focus : COSMOS.dim,
            'mono',
            'left',
          ),

          rect(820, 152, {
            fill: '#0d1a24',
            stroke: gb ? ROLE.ok : '#2c3d66',
            width: 2.8,
            radius: 14,
          })
            .at(-445, 205)
            .glow(gb ? 10 : 0, ROLE.ok),
          txt('1,158 RESIDENTS × 1,560 POSITIONS', -815, 162, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            gb ? `${CAPACITY_DATA.gib.toFixed(2)} GiB MEAN KV POOL` : 'computing total GiB...',
            -815,
            224,
            38,
            gb ? ROLE.ok : COSMOS.dim,
            'mono',
            'left',
          ),

          txt(
            'Excludes allocator fragmentation & weights.',
            -855,
            362,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else {
        // Beats 0 & 1: Residence intervals + Little's Law counts on left
        nodes.push(
          txt(
            'ARRIVAL RATE: 600 SYNTHESIS REQ / S',
            -855,
            -225,
            26,
            ROLE.policy,
            'mono',
            'left',
          ).opacity(0.6 + 0.4 * startOn.value),

          // Proportional 3-phase bar (0.37 + 1.93 + 0.20 = 2.50s)
          rect(120, 74, { fill: '#0d1528', stroke: ROLE.policy, width: 2.4, radius: 8 }).at(
            -795,
            -135,
          ),
          txt('0.37s', -795, -135, 26, ROLE.policy, 'mono', 'center'),

          rect(610, 74, { fill: '#0c1c2c', stroke: ROLE.kv, width: 3, radius: 8 })
            .at(-420, -135)
            .glow(8, ROLE.kv),
          txt('KV resident: 1.93s', -420, -135, 28, ROLE.kv, 'mono', 'center'),

          rect(82, 74, { fill: '#0d1924', stroke: ROLE.ok, width: 2.4, radius: 8 }).at(-65, -135),
          txt('0.2s', -65, -135, 26, ROLE.ok, 'mono', 'center'),

          txt(
            iv
              ? 'TOTAL RESIDENCE = 0.37 + 1.93 + 0.20 = 2.50 s'
              : 'Before admission · KV resident · After release',
            -855,
            -55,
            27,
            iv ? ROLE.focus : COSMOS.muted,
            'mono',
            'left',
          ),
        );

        if (b1 || cnt) {
          nodes.push(
            txt('IN FLIGHT (600 × 2.50s)', -855, 45, 26, ROLE.policy, 'mono', 'left'),
            glowMeter(-855, 96, 660, 40, cnt ? 1 : 0.35, { fill: ROLE.policy }),
            txt(cnt ? '1,500' : '...', -40, 96, 34, ROLE.policy, 'mono', 'right'),

            txt('KV RESIDENT (600 × 1.93s)', -855, 185, 26, ROLE.kv, 'mono', 'left'),
            glowMeter(-855, 236, 660, 40, cnt ? 1158 / 1500 : 0.25, { fill: ROLE.kv }),
            txt(cnt ? '1,158' : '...', -40, 236, 34, ROLE.kv, 'mono', 'right'),

            txt(
              'Retaining state for retries or sessions lengthens the KV interval.',
              -855,
              348,
              27,
              COSMOS.muted,
              'sans',
              'left',
            ),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, kv3d, header, overlay);
  orbitScene(s, c, kv3d, { theta: -0.18, phi: 0.86 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-resident-tensor-0', () => {
    s.play(startOn.to(1, { duration: clampDur(c, c.cue('se-resident-tensor-0').start, 0.35) }));
  });
  c.on('se-resident-tensor-interval', () => {
    s.play(
      intervalOn.to(1, { duration: clampDur(c, c.cue('se-resident-tensor-interval').start, 0.35) }),
    );
  });
  c.on('se-resident-tensor-1', () => {
    s.play(beat1On.to(1, { duration: clampDur(c, c.cue('se-resident-tensor-1').start, 0.3) }));
  });
  c.on('se-resident-tensor-counts', () => {
    s.play(
      countsOn.to(1, { duration: clampDur(c, c.cue('se-resident-tensor-counts').start, 0.45) }),
    );
  });
  c.on('se-resident-tensor-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-resident-tensor-2').start, 0.3) }));
  });
  c.on('se-resident-tensor-bytes', () => {
    s.play(bytesOn.to(1, { duration: clampDur(c, c.cue('se-resident-tensor-bytes').start, 0.35) }));
  });
  c.on('se-resident-tensor-gib', () => {
    s.play(gibOn.to(1, { duration: clampDur(c, c.cue('se-resident-tensor-gib').start, 0.35) }));
  });
}
