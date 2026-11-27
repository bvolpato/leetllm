// Scene 16: hybrid-budget - Count full-attention and recurrent layers with their real shapes
// Qwen3.6-27B 64-block architectural ribbon: 16 groups x (3 Gated DeltaNet + 1 Full Attention)
// building 54.0 GB weights + 2.0 GiB KV + 144 MiB/req (0.604 GB for 4) + 15% = 65.3 GB.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  GiB,
  ROLE,
  aura,
  cinemaHeader,
  glowBar,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function hybridBudget(s, c) {
  const step = s.value(0); // 1=64-block ribbon, 2=2 GiB KV, 3=144 MiB/req recurrent, 4=54 GB + 15%, 5=65.3 GB total

  const header = cinemaHeader(
    'HYBRID ARCHITECTURE SIZING',
    'Qwen3.6-27B: full attn',
    '& recurrent state',
    {
      x: -860,
      y: -420,
      accent: ROLE.hybrid,
      size: 52,
    },
  );

  const bgAura = aura(150, 40, 660, '#a78bfa22', '#5ce1e618');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const kvGib = DATA.memHybrid.kv / GiB;
      const recMib = DATA.memHybrid.recurrentPerRequest / (1024 * 1024);
      const recGb = DATA.memHybrid.recurrent / 1e9;
      const totalGb = DATA.memHybrid.total / 1e9;

      const nodes = [];

      // 64-layer ribbon across upper-middle (16 repeating groups of [3 Linear violet + 1 Full cyan])
      const ribY = -165;
      const x0 = -840;
      const blockW = 22;
      const gap = 4.2;
      nodes.push(
        txt(
          '64 LANGUAGE BLOCKS:  16 x [ 3 Gated DeltaNet (48)  +  1 Full Attention (16) ]',
          -840,
          ribY - 76,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ),
      );
      for (let i = 0; i < 64; i++) {
        const isFull = i % 4 === 3;
        const col = isFull ? ROLE.active : ROLE.hybrid;
        const bx = x0 + i * (blockW + gap) + blockW * 0.5;
        nodes.push(
          rect(blockW, isFull ? 76 : 56, {
            fill: isFull ? '#122b44' : '#23173a',
            stroke: col,
            width: 1.8,
            radius: 4,
          })
            .at(bx, ribY)
            .glow(isFull ? 6 : 3, col),
        );
      }

      // Layer legend
      nodes.push(
        txt(
          'Full Attn (16): 4 KV heads · dim 256 -> grows with length',
          -840,
          -70,
          26,
          ROLE.active,
          'mono',
          'left',
        ),
        txt(
          'DeltaNet (48): 16 K / 48 V heads · dim 128 -> fixed per req',
          -840,
          -20,
          26,
          ROLE.hybrid,
          'mono',
          'left',
        ),
      );

      // Horizontal budget bars for 4 active 8,192-token histories against 76 GB usable H100
      const bLeft = -470;
      const bW = 1040;
      const maxGb = 76;

      if (st >= 1.5) {
        nodes.push(
          txt('Full-Attn KV (x4)', -860, 70, 26, ROLE.active, 'mono', 'left'),
          glowBar(bLeft, 70, bW, 38, DATA.memHybrid.kv / 1e9 / maxGb, {
            fill: ROLE.active,
            glow: 8,
          }),
          txt(`${kvGib.toFixed(0)} GiB (2.15 GB)`, 595, 70, 26, ROLE.active, 'mono', 'left'),
        );
      }
      if (st >= 2.5) {
        nodes.push(
          txt('Recurrent FP32', -860, 138, 26, ROLE.hybrid, 'mono', 'left'),
          glowBar(bLeft, 138, bW, 38, Math.max(0.03, recGb / maxGb), {
            fill: ROLE.hybrid,
            glow: 8,
          }),
          txt(
            `${recMib.toFixed(0)} MiB/req (${recGb.toFixed(3)} GB)`,
            595,
            138,
            26,
            ROLE.hybrid,
            'mono',
            'left',
          ),
        );
      }
      if (st >= 3.5) {
        nodes.push(
          txt('BF16 Weights', -860, 206, 26, ROLE.cold, 'mono', 'left'),
          glowBar(bLeft, 206, bW, 38, 54 / maxGb, { fill: ROLE.cold, glow: 8 }),
          txt('54.0 GB', 595, 206, 26, ROLE.cold, 'mono', 'left'),
        );
      }
      if (st >= 4.5) {
        nodes.push(
          txt('TOTAL (+15%)', -860, 286, 28, ROLE.warm, 'mono', 'left').glow(6, ROLE.warm),
          glowBar(bLeft, 286, bW, 46, totalGb / maxGb, { fill: ROLE.warm, glow: 10 }),
          txt(`~${totalGb.toFixed(1)} GB / 76 GB`, 595, 286, 28, ROLE.warm, 'mono', 'left').glow(
            7,
            ROLE.warm,
          ),
          txt(
            'Text-only mode skips vision encoder  ·  Add loaded vision, MTP & conv state separately',
            0,
            395,
            26,
            ROLE.focus,
            'sans',
          ),
        );
      } else {
        nodes.push(
          txt(
            '4 active histories x 8,192 tokens on H100 (76 GB usable)',
            0,
            395,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'ga-hybrid-budget-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-hybrid-budget-b1', step, 2, 0.3);
  tweenOn(s, c, 'ga-recurrent-bytes', step, 3, 0.3);
  tweenOn(s, c, 'ga-hybrid-budget-b2', step, 4, 0.3);
  tweenOn(s, c, 'ga-hybrid-total', step, 5, 0.3);
}
