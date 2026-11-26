// Scene 17: resident-v-active - Use resident bytes for fit and active traffic for decode
// Orbiting 3D 8-expert MoE HBM Vault: all 8 experts stay resident in blue while only 2 routed
// experts fire bright gold/cyan decode beams per token, plus precision & dequant overhead budget.
import { gridPlane3d, group } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addPointerArc3D,
  aura,
  cinemaHeader,
  cinematic3d,
  driftValue,
  guardedDynamic,
  orbitScene,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function residentVActive(s, c) {
  const pulse = s.value(0);
  const step = s.value(0); // 1=4 budgets + MoE residency, 2=packed scales / FP8 / INT4 / separate KV precision

  const header = cinemaHeader(
    'MOE & QUANTIZATION BUDGETS',
    'Resident bytes for fit,',
    'active for decode',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(285, 20, 620, '#60a5fa24', '#5ce1e61c');

  // 3D 4x2 Expert Vault on right
  const moeView = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 15.6,
    unit: 114,
    focus: [0, 0, 1.0],
  }).at(295, 25);

  moeView.add(
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

  // Router gate floating above experts
  addBox3D(moeView, -0.7, -0.5, 2.55, 1.4, 1.0, 0.36, ROLE.focus, ROLE.focus, {
    faceOpacity: 0.86,
    edgeWidth: 2.2,
    edgeGlow: 9,
  });

  const routed = [2, 5];
  for (let r = 0; r < 2; r++) {
    for (let col = 0; col < 4; col++) {
      const idx = r * 4 + col;
      const x = -2.95 + col * 1.52;
      const y = -1.45 + r * 1.75;
      const isSelected = routed.includes(idx);
      const cCol = isSelected ? ROLE.active : ROLE.cold;
      addBox3D(moeView, x, y, 0.05, 1.18, 1.18, isSelected ? 1.25 : 0.85, cCol, cCol, {
        faceOpacity: isSelected ? 0.88 : 0.45,
        edgeWidth: isSelected ? 2.6 : 1.7,
        edgeGlow: isSelected ? 10 : 4,
      });
      if (isSelected) {
        addPointerArc3D(moeView, [0, 0, 2.54], [x + 0.59, y + 0.59, 1.32], ROLE.focus, {
          lift: 0.55,
          pulseVal: pulse,
          phaseOffset: idx === 2 ? 0.0 : 0.5,
        });
      }
    }
  }

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const nodes = [
        txt('TOKEN ROUTER -> 2 OF 8 EXPERTS ACTIVE', 295, -402, 26, ROLE.focus, 'mono').glow(
          5,
          ROLE.focus,
        ),
        txt('ALL 8 EXPERTS RESIDENT IN HBM', 295, 438, 26, ROLE.cold, 'mono'),
      ];

      if (st < 1.5) {
        nodes.push(
          txt('FOUR SEPARATE BUDGETS', -860, -185, 26, ROLE.focus, 'mono', 'left'),
          txt('1. Checkpoint residency (ALL experts)', -860, -120, 28, ROLE.cold, 'sans', 'left'),
          txt('2. Active weight bytes read / token', -860, -60, 28, ROLE.active, 'sans', 'left'),
          txt('3. Attention KV or recurrent state', -860, 0, 28, ROLE.kv, 'sans', 'left'),
          txt('4. Inter-GPU communication traffic', -860, 60, 28, ROLE.hybrid, 'sans', 'left'),
          txt(
            '3B active != 6 GB BF16 HBM footprint',
            -860,
            165,
            28,
            ROLE.expired,
            'mono',
            'left',
          ).glow(7, ROLE.expired),
          txt(
            'Offloading trades HBM for transfer latency',
            -860,
            228,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else {
        nodes.push(
          txt('WEIGHT PACKING & PRECISION', -860, -185, 26, ROLE.active, 'mono', 'left'),
          txt('BF16:  2.0 B / param', -860, -120, 28, ROLE.cold, 'mono', 'left'),
          txt('FP8 / INT8:  1.0 B + scales & metadata', -860, -60, 28, ROLE.active, 'mono', 'left'),
          txt('4-bit:  0.5 B + dequant scratch buffers', -860, 0, 28, ROLE.warm, 'mono', 'left'),
          txt(
            'Weight & KV precision are separate choices',
            -860,
            105,
            28,
            ROLE.focus,
            'sans',
            'left',
          ).glow(6, ROLE.focus),
          txt(
            'Measure loaded bytes, kernels & quality',
            -860,
            168,
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

  s.add(bgAura, moeView, header, dyn);
  orbitScene(s, c, moeView, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.5, { startOffset: 0.1, endMargin: 0.5 });

  tweenOn(s, c, 'ga-resident-v-active-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-resident-v-active-b1', step, 2, 0.35);
}
