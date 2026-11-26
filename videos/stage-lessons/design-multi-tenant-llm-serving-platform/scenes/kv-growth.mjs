// Scene 14: kv-growth - Reserve the next block before promising the next token
// Beats 0-1: 16 input + 1 output cap = 17 positions on 16-slot pages -> 2 pages (32 slots), 5 MiB/page.
// Beat 2: Exact BigInt integer ceiling on 2^54 + 1 vs floating-point underreservation, plus context cap rejection.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  KV_PAGE_MIB,
  ROLE,
  aura,
  beamWithPhotons,
  buildKvPageTile,
  cinemaHeader,
  driftValue,
  guardedDynamic,
  reserveWholePages,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

const HUGE_POS = 2n ** 54n + 1n;
const EXACT_PAGES = reserveWholePages(HUGE_POS, 0n);
const FLOAT_PAGES = BigInt(Math.ceil(Number(HUGE_POS) / 16));

export default function kvGrowth(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const crossOn = s.value(0);
  const twoPagesOn = s.value(0);
  const b1On = s.value(0);
  const fiveMibOn = s.value(0);
  const b2On = s.value(0);
  const intDiffOn = s.value(0);
  const rejectOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#ffd1661a', '#60a5fa18');
  const header = cinemaHeader(
    'BLOCK CEILING & INTEGER ARITHMETIC',
    'Reserve the next block before',
    'promising the next token',
    { x: -860, y: -450, accent: ROLE.held, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const cross = crossOn.value > 0.5;
      const twoP = twoPagesOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const fiveMib = fiveMibOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const intDiff = intDiffOn.value > 0.5;
      const rej = rejectOn.value > 0.5;

      const nodes = [];

      if (!b2) {
        // Beats 0 & 1: 16 input + 1 output = 17 positions crossing 16-slot boundary
        nodes.push(
          rect(900, 78, { fill: '#0d1528', stroke: ROLE.focus, width: 2.6, radius: 14 })
            .at(395, -395)
            .glow(6, ROLE.focus),
          txt(
            'GROWTH CASE:  16 input  +  1 output cap  =  17 positions',
            395,
            -395,
            26,
            ROLE.focus,
            'mono',
            'center',
          ),
        );

        // P0: full 16/16 input page
        nodes.push(
          ...buildKvPageTile({
            id: 'P0  (input)',
            cx: -500,
            cy: -10,
            used: 16,
            owner: 'Input',
            color: ROLE.A,
            footerText: '16 / 16 input slots full',
          }),
        );

        // Crossing arrow for token #17
        if (cross) {
          nodes.push(
            beamWithPhotons(
              [
                [-340, -10],
                [180, -10],
              ],
              ROLE.held,
              p,
              { width: 4.5, glow: 10, photonCount: 2 },
            ),
            rect(420, 68, { fill: '#221c0c', stroke: ROLE.held, width: 2.6, radius: 12 })
              .at(-80, -78)
              .glow(8, ROLE.held),
            txt('Position 17 overflows!', -80, -78, 26, ROLE.held, 'mono', 'center'),
          );
        }

        // P1: reserved second page (strictly revealed after s0-3)
        if (twoP) {
          nodes.push(
            ...buildKvPageTile({
              id: 'P1  (reserved)',
              cx: 350,
              cy: -10,
              used: 0,
              owner: 'Reserved',
              color: ROLE.held,
              markedSlot: 0,
              markedLabel: '17',
              reservedEmpty: true,
              footerText: '1 needed + 15 spare slots',
            }),
          );
        } else {
          nodes.push(
            rect(296, 264, { fill: '#0b1224', stroke: '#3a4e7a', width: 2.4, radius: 14 }).at(
              350,
              -10,
            ),
            txt('P1 ?', 350, -32, 42, COSMOS.muted, 'mono', 'center'),
            txt('Needs whole block', 350, 32, 26, COSMOS.dim, 'sans', 'center'),
          );
        }

        // Right-side summary metrics
        nodes.push(
          rect(310, 128, {
            fill: '#0b1e1b',
            stroke: twoP ? ROLE.ok : '#2c3d66',
            width: 2.8,
            radius: 14,
          })
            .at(705, -78)
            .glow(twoP ? 8 : 0, ROLE.ok),
          txt('CEIL(17 / 16)', 705, -106, 26, COSMOS.muted, 'mono', 'center'),
          txt(twoP ? '2 PAGES' : '?', 705, -52, 38, twoP ? ROLE.ok : COSMOS.dim, 'mono', 'center'),

          rect(310, 128, {
            fill: '#0b1926',
            stroke: fiveMib ? ROLE.kv : '#2c3d66',
            width: 2.8,
            radius: 14,
          })
            .at(705, 86)
            .glow(fiveMib ? 8 : 0, ROLE.kv),
          txt('16 × 0.3125 MiB', 705, 58, 26, COSMOS.muted, 'mono', 'center'),
          txt(
            fiveMib ? `${KV_PAGE_MIB} MiB / page` : '---',
            705,
            112,
            34,
            fiveMib ? ROLE.kv : COSMOS.dim,
            'mono',
            'center',
          ),
        );

        // Bottom policy strip
        nodes.push(
          rect(1680, 120, {
            fill: '#0d1528',
            stroke: b1 ? ROLE.warn : ROLE.shared,
            width: 2.6,
            radius: 14,
          }).at(0, 340),
          txt(
            twoP
              ? 'ceil((input + max_output) / 16) = 2 pages  =  32 allocated token positions'
              : 'Full-cap admission reserves ceil((input + max_output) / block_size) whole pages.',
            0,
            312,
            28,
            twoP ? ROLE.ok : ROLE.shared,
            'mono',
            'center',
          ),
          txt(
            b1
              ? 'Incremental allocation needs an explicit policy: queue, preempt, swap, recompute, or terminate.'
              : 'Whole-block allocation avoids cross-tenant sharing inside a single physical page.',
            0,
            364,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 2: Exact BigInt ceiling vs IEEE-754 float loss at 2^54 + 1
        nodes.push(
          rect(900, 78, { fill: '#19140b', stroke: ROLE.focus, width: 2.8, radius: 14 })
            .at(395, -395)
            .glow(7, ROLE.focus),
          txt(
            'REGRESSION TEST INPUT  (NOT AN ADMITTED CONTEXT)',
            395,
            -395,
            26,
            ROLE.focus,
            'mono',
            'center',
          ),

          rect(1660, 122, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
            .at(0, -172)
            .glow(6, ROLE.A),
          txt('REGRESSION TOKEN COUNT:   2^54 + 1', 0, -198, 26, ROLE.A, 'mono', 'center'),
          txt(HUGE_POS.toString(), 0, -144, 40, COSMOS.ink, 'mono', 'center'),

          // Left: Exact BigInt integer ceiling
          rect(790, 210, {
            fill: '#0b1e1b',
            stroke: intDiff ? ROLE.ok : '#2c3d66',
            width: 3.0,
            radius: 16,
          })
            .at(-435, 65)
            .glow(intDiff ? 9 : 0, ROLE.ok),
          txt('EXACT INTEGER CEILING  (BigInt)', -435, 12, 26, ROLE.ok, 'mono', 'center'),
          txt(
            intDiff ? `${EXACT_PAGES.toString()} pages` : 'computing exact...',
            -435,
            72,
            34,
            intDiff ? COSMOS.ink : COSMOS.dim,
            'mono',
            'center',
          ),
          txt('(n + 15n) / 16n  preserves the +1 token', -435, 126, 26, ROLE.ok, 'sans', 'center'),

          // Right: Floating-point underreservation
          rect(790, 210, {
            fill: '#240f19',
            stroke: intDiff ? ROLE.fail : '#2c3d66',
            width: 3.0,
            radius: 16,
          })
            .at(435, 65)
            .glow(intDiff ? 9 : 0, ROLE.fail),
          txt('FLOAT64 CONVERSION  (Math.ceil)', 435, 12, 26, ROLE.fail, 'mono', 'center'),
          txt(
            intDiff ? `${FLOAT_PAGES.toString()} pages` : 'converting float...',
            435,
            72,
            34,
            intDiff ? ROLE.fail : COSMOS.dim,
            'mono',
            'center',
          ),
          txt(
            'Rounds 2^54 + 1 down to 2^54: loses 1 page!',
            435,
            126,
            26,
            ROLE.fail,
            'sans',
            'center',
          ),

          // Context cap guard
          rect(1660, 108, {
            fill: rej ? '#26101a' : '#0d1528',
            stroke: rej ? ROLE.fail : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(0, 320)
            .glow(rej ? 8 : 0, ROLE.fail),
          txt(
            rej
              ? 'REAL CONTEXT LIMIT REJECTS IMPOSSIBLE SIZES BEFORE ALLOCATION'
              : 'Exact arithmetic protects math; policy caps still bound request size.',
            0,
            320,
            29,
            rej ? ROLE.fail : COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  stepOn(s, c, 'mt-kv-growth-b0', b0On, 1);
  stepAfter(s, c, 'mt-kv-growth-s0-2', crossOn, 1);
  stepAfter(s, c, 'mt-kv-growth-s0-3', twoPagesOn, 1);
  stepOn(s, c, 'mt-kv-growth-b1', b1On, 1);
  stepAfter(s, c, 'mt-kv-growth-s1-0', fiveMibOn, 1);
  stepOn(s, c, 'mt-kv-growth-b2', b2On, 1);
  stepAfter(s, c, 'mt-kv-growth-s2-1', intDiffOn, 1);
  stepAfter(s, c, 'mt-kv-growth-s2-2', rejectOn, 1);
}
