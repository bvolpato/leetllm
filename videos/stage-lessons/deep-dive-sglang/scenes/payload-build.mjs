// Scene 24: Build the transferred KV bytes from one actual tensor slice (1 MiB K -> 2 MiB K+V -> 16 MiB/layer -> 512 MiB -> 21.47 ms vs 10 ms budget).
import {
  COSMOS,
  KV_PAYLOAD,
  KV_TRANSFER_MS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function payloadBuild(s, c) {
  // step:
  // 0 = 4096 x 128 x 2 bytes (1 head K)
  // 1 = 1 MiB for K
  // 2 = + V tensor -> 2 MiB / head
  // 3 = x 8 KV heads -> 16 MiB / layer
  // 4 = x 32 layers -> 512 MiB total
  // 5 = full product formula = 536,870,912 B / 25 decimal GB/s
  // 6 = 21.47 ms payload-only lower bound
  // 7 = handoff allowance = 10 ms
  // 8 = bytes alone take > 2x budget (FAIL!)
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61a', '#ff6b8b18');
  const title = heroTitle(['Size the KV Payload', 'From One Tensor Slice'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'KV TRANSFER PHYSICS · 1 MIB -> 512 MIB -> 21.47 MS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 4) {
      // Step-by-step multiplicative build ladder
      const steps = [
        {
          k: '1 Head Key (K)',
          eq: '4096 pos x 128 dim x 2 B',
          res: st >= 1 ? '= 1 MiB' : '= ?',
          col: ROLE.radix,
          show: true,
        },
        {
          k: 'Key + Value (K, V)',
          eq: '2 tensors x 1 MiB',
          res: '= 2 MiB',
          col: ROLE.prefill,
          show: st >= 2,
        },
        {
          k: '8 KV Heads / Layer',
          eq: '8 heads x 2 MiB',
          res: '= 16 MiB / layer',
          col: ROLE.grammar,
          show: st >= 3,
        },
        {
          k: '32 Layers Total',
          eq: '32 layers x 16 MiB',
          res: '= 512 MiB',
          col: ROLE.decode,
          show: st >= 4,
        },
      ];
      steps.forEach((row, i) => {
        const y = -165 + i * 124;
        nodes.push(
          glassCell(0, y, 1520, 102, row.show ? row.col : COSMOS.dim, {
            fill: row.show ? '#101d34' : '#0b101d',
            glow: row.show ? 9 : 2,
          }),
          txt(row.k, -710, y, 28, row.show ? row.col : COSMOS.dim, 'mono', 'left'),
          txt(
            row.show ? row.eq : '...',
            -180,
            y,
            28,
            row.show ? COSMOS.ink : COSMOS.dim,
            'mono',
            'left',
          ),
          txt(
            row.show ? row.res : '',
            710,
            y,
            32,
            row.show ? COSMOS.gold : COSMOS.dim,
            'mono',
            'right',
          ),
        );
      });
    } else {
      // Exact byte product + 25 GB/s division + 10 ms allowance bar comparison
      nodes.push(
        glassCell(0, -170, 1520, 108, ROLE.radix, { fill: '#0e2436', glow: 9 }),
        txt(
          `2 x 32 x 8 x 128 x 4096 x 2  =  ${KV_PAYLOAD.toLocaleString()} bytes (512 MiB)`,
          0,
          -170,
          30,
          ROLE.radix,
          'mono',
        ),

        glassCell(0, -32, 1520, 96, st >= 6 ? COSMOS.gold : ROLE.prefill, {
          fill: st >= 6 ? '#201c10' : '#10213d',
          glow: 9,
        }),
        txt(
          st >= 6
            ? `512 MiB / 25 decimal GB/s  =  ${KV_TRANSFER_MS.toFixed(2)} ms wire lower bound`
            : 'Dividing 512 MiB by sustained 25 decimal GB/s link...',
          0,
          -32,
          30,
          st >= 6 ? COSMOS.gold : COSMOS.ink,
          'mono',
        ),
      );

      // Visual comparison bars: 10 ms budget vs 21.47 ms payload alone
      if (st >= 7) {
        const maxMs = 25;
        const barW = 900;
        const xLeft = -500;
        const w10 = (10 / maxMs) * barW;
        const w21 = (KV_TRANSFER_MS / maxMs) * barW;
        const over = st >= 8;

        nodes.push(
          txt('Handoff budget', -760, 102, 26, ROLE.decode, 'mono', 'left'),
          rect(barW, 38, { fill: '#0b1220', stroke: '#334155', width: 2, radius: 6 }).at(
            xLeft + barW / 2,
            102,
          ),
          rect(w10, 34, { fill: ROLE.decode, stroke: null, radius: 5 }).at(xLeft + w10 / 2, 102),
          txt('10.0 ms', xLeft + barW + 24, 102, 28, ROLE.decode, 'mono', 'left'),

          txt('Payload alone', -760, 198, 26, over ? ROLE.fail : ROLE.radix, 'mono', 'left'),
          rect(barW, 38, { fill: '#0b1220', stroke: '#334155', width: 2, radius: 6 }).at(
            xLeft + barW / 2,
            198,
          ),
          rect(w21, 34, { fill: over ? ROLE.fail : ROLE.radix, stroke: null, radius: 5 }).at(
            xLeft + w21 / 2,
            198,
          ),
          txt(
            `${KV_TRANSFER_MS.toFixed(2)} ms (> 2x!)`,
            xLeft + barW + 24,
            198,
            28,
            over ? ROLE.fail : ROLE.radix,
            'mono',
            'left',
          ),
        );
      }
    }

    nodes.push(
      txt(
        st >= 8
          ? 'Wire bytes alone exceed 2x the 10 ms budget before setup, queues, or contention.'
          : st >= 5
            ? 'Size P/D links using achieved sustained bandwidth while concurrent transfers run.'
            : 'Full-attention unsharded KV scales linearly with layers, heads, positions, and bytes/scalar.',
        0,
        355,
        28,
        st >= 8 ? ROLE.fail : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['sg-payload-build-beat-0', 0],
    ['sg-payload-one', 1, true],
    ['sg-payload-value', 2, true],
    ['sg-payload-heads', 3, true],
    ['sg-payload-layers', 4],
    ['sg-payload-build-beat-1', 5],
    ['sg-payload-time', 6, true],
    ['sg-payload-build-beat-2', 7],
    ['sg-payload-fail', 8, true],
  ]);
}
