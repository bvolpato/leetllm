// Scene 09: allocation-slack - Compute reserved slots from each current sequence
// Glowing 4-sequence paged block meters (320->20, 75->5, 900->57, 250->16 = 98 blocks / 1568 slots / 23 slack)
// contrasted against fixed 2048-slot reservations (512 blocks / 8192 slots, saving 6624 slots).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  aura,
  cinemaHeader,
  glowBar,
  glowTex,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function allocationSlack(s, c) {
  const step = s.value(0); // 1=four sequences, 2=23 slack, 3=fixed 512 blocks, 4=saving 6624

  const header = cinemaHeader(
    'PAGED MEMORY ACCOUNTING',
    'Reserved slots from',
    'each live sequence',
    {
      x: -860,
      y: -420,
      accent: ROLE.warm,
      size: 52,
    },
  );

  const bgAura = aura(200, 40, 640, '#6ee7b71c', '#5ce1e61a');

  const formula = glowTex(String.raw`\sum_i \lceil L_i / 16 \rceil = 98\;\text{blocks}`, {
    x: 470,
    y: -330,
    size: 40,
    color: ROLE.focus,
    glow: 7,
  });

  const seqColors = [ROLE.active, ROLE.decode, ROLE.cold, ROLE.warm];

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const rows = DATA.pagedSlack.rows;
      const nodes = [];

      // Four sequence bars on left-to-center
      nodes.push(
        txt('4 LIVE SEQUENCES (BLOCK SIZE = 16)', -860, -182, 26, ROLE.active, 'mono', 'left'),
      );
      rows.forEach((r, i) => {
        const y = -112 + i * 92;
        const slack = r.blocks * 16 - r.tokens;
        const col = seqColors[i];
        nodes.push(
          txt(`Seq ${i + 1}: ${r.tokens} tok`, -860, y, 28, COSMOS.ink, 'mono', 'left'),
          glowBar(-560, y, 520, 40, r.tokens / 960, { fill: col, glow: 8 }),
          txt(`${r.blocks} blk`, 10, y, 28, col, 'mono', 'left'),
          txt(`slack ${slack}`, 155, y, 26, slack === 0 ? ROLE.warm : ROLE.warmup, 'mono', 'left'),
        );
      });

      // Totals readout under sequences
      if (st >= 1.5) {
        nodes.push(
          txt(
            `Paged total: ${DATA.pagedSlack.blocks} blocks = ${DATA.pagedSlack.slots} slots (${DATA.pagedSlack.tokens} used · ${DATA.pagedSlack.slack} slack)`,
            -860,
            264,
            28,
            ROLE.warm,
            'mono',
            'left',
          ).glow(7, ROLE.warm),
        );
      }

      // Fixed reservation contrast bar on right / lower
      if (st >= 2.5) {
        const fA = Math.min(1, (st - 2.5) * 2.5);
        nodes.push(
          txt(
            'FIXED 2,048-SLOT RESERVATION (x4)',
            355,
            -182,
            26,
            ROLE.expired,
            'mono',
            'left',
          ).opacity(fA),
          txt(`${DATA.fixedBlocks} blocks`, 355, -112, 38, ROLE.expired, 'mono', 'left')
            .glow(7, ROLE.expired)
            .opacity(fA),
          txt(
            `${DATA.fixedSlots} slots reserved`,
            355,
            -52,
            28,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(fA),
          glowBar(355, 22, 480, 46, 1.0, { fill: ROLE.expired, glow: 8, opacity: fA }),
          txt('PAGED FOOTPRINT (19%)', 355, 114, 26, ROLE.warm, 'mono', 'left').opacity(fA),
          glowBar(355, 166, 480, 46, DATA.pagedSlack.slots / DATA.fixedSlots, {
            fill: ROLE.warm,
            glow: 9,
            opacity: fA,
          }),
        );
      }

      if (st >= 3.5) {
        const saved = DATA.fixedSlots - DATA.pagedSlack.slots;
        nodes.push(
          txt(
            `Paging avoids ${saved.toLocaleString()} reserved slots  (81% reclaimed)`,
            -860,
            378,
            32,
            ROLE.focus,
            'mono',
            'left',
          ).glow(8, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Each sequence allocates ceiling(tokens / 16) blocks',
            -860,
            378,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, formula, dyn);

  tweenOn(s, c, 'ga-allocation-slack-b0', step, 1, 0.3);
  tweenOn(s, c, 'ga-slack-total', step, 2, 0.3);
  tweenOn(s, c, 'ga-allocation-slack-b1', step, 3, 0.35);
  tweenOn(s, c, 'ga-fixed-saving', step, 4, 0.35);
}
