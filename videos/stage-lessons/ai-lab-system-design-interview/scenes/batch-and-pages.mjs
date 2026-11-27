// Scene 13: batch-and-pages - Scheduling and storage repair different failures
// Left: Continuous iteration-level batching (refills finished slot immediately).
// Right: PagedAttention logical-to-physical block table (solves fragmentation).
// Bottom: Dual-resource scheduler gate (prefill wait + decode slots < max + free blocks >= need).
import { group, line, rect } from 'vizmatic/stage';
import {
  CLAIM_ADM,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function batchAndPages(s, c) {
  const pageOn = s.value(0);
  const dualOn = s.value(0);

  const header = cinemaHeader(
    'SCHEDULING VS STORAGE',
    'Batching and paging',
    'fix different failures',
    {
      x: -860,
      y: -445,
      accent: ROLE.worker,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#60a5fa1a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const pg = pageOn.value;
      const dl = dualOn.value;
      const nodes = [];

      // Left panel: Continuous Iteration-Level Batching
      const lx = -840;
      nodes.push(
        txt('1. CONTINUOUS BATCHING (WHEN IT RUNS)', lx, -195, 26, ROLE.req, 'mono', 'left'),
        rect(220, 44, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 6 }).at(
          lx + 110,
          -125,
        ),
        txt('R1 DONE', lx + 110, -125, 26, '#070910', 'mono', 'center'),
        rect(480, 44, { fill: ROLE.req, stroke: '#ffffff', width: 1.5, radius: 6 }).at(
          lx + 240 + 240,
          -125,
        ),
        txt('R3 JOINS SLOT IMMEDIATELY!', lx + 240 + 240, -125, 26, '#070910', 'mono', 'center'),
        rect(720, 44, { fill: ROLE.worker, stroke: '#ffffff', width: 1.5, radius: 6 }).at(
          lx + 360,
          -55,
        ),
        txt('R2 LONG SEQUENCE KEEPS STREAMING', lx + 360, -55, 26, '#070910', 'mono', 'center'),
        txt(
          'Removes idle padding bubbles between iterations',
          lx,
          15,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      // Right panel: Paged KV Block Table (WHERE IT LIVES)
      const rx = 100;
      const pgAlpha = 0.4 + pg * 0.6;
      nodes.push(
        line([45, -210], [45, 55], { stroke: '#2c3d66', width: 2.5 }),
        txt(
          '2. PAGED KV STORAGE (WHERE IT LIVES)',
          rx,
          -195,
          26,
          ROLE.policy,
          'mono',
          'left',
        ).opacity(pgAlpha),
        txt(
          'Logical pages -> non-contiguous physical blocks',
          rx,
          -128,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(pgAlpha),
        txt(
          'Allocated, shared & freed per block (no rigid slab)',
          rx,
          -74,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(pgAlpha),
        txt(
          'Does NOT choose which request runs next!',
          rx,
          -16,
          26,
          ROLE.warn,
          'mono',
          'left',
        ).opacity(pgAlpha),
      );

      // Bottom: Dual-Resource Admission Check (all 3 integers + atomic claim!)
      const dAlpha = 0.4 + dl * 0.6;
      nodes.push(
        line([-840, 100], [840, 100], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          'THREE-WAY SCHEDULER GATE (ALL REQUIRED)',
          0,
          155,
          26,
          ROLE.focus,
          'mono',
          'center',
        ).opacity(dAlpha),
        txt(
          `Prefill wait: ${Math.round(CLAIM_ADM.prefill.estimatedWait * 1000)} ms <= 250 ms   |   Decode: 48 < 64   |   KV blocks: 120 >= 16`,
          0,
          215,
          26,
          ROLE.ok,
          'mono',
          'center',
        ).opacity(dAlpha),
        txt(
          'Validate nonnegative integers (reject NaN / fractional slots); check STILL needs atomic claim + release!',
          0,
          285,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(dAlpha),
        txt('SEPARATE OBJECTS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Batch Slot != Physical Page Map', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('sd-batch-and-pages-1-operation', () => {
    s.play(
      pageOn.to(1, { duration: clampDur(c, c.cue('sd-batch-and-pages-1-operation').start, 0.35) }),
    );
  });
  c.on('sd-batch-and-pages-2-operation', () => {
    s.play(
      dualOn.to(1, { duration: clampDur(c, c.cue('sd-batch-and-pages-2-operation').start, 0.4) }),
    );
  });
}
