// Scene 08: memory-realization - An allocation estimate leaves work and ownership to explain
// Fixed 16 GB weights shared by 4 growing requests, physical KV realizations (prefix share,
// sliding window, quantization, sharding, paged rounding), plus explicit unfilled workspace reserve.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  MEM_BUDGET,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function memoryRealization(s, c) {
  const condOn = s.value(0);
  const quantOn = s.value(0);

  const header = cinemaHeader(
    'PHYSICAL MEMORY REALIZATION',
    'Allocation formulas need',
    'physical conditions',
    {
      x: -860,
      y: -445,
      accent: ROLE.worker,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#60a5fa1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const cn = condOn.value;
      const qn = quantOn.value;
      const nodes = [];

      // Top bar: Fixed 16 GB weights + 4 growing independent request KV bars + explicit Workspace Reserve
      const x0 = -820;
      const yW = -150;
      nodes.push(
        txt(
          `SHARED WEIGHTS (${MEM_BUDGET.weightsGb} GB BF16, FIXED FOR ALL 4 REQUESTS)`,
          x0,
          yW - 56,
          26,
          ROLE.worker,
          'mono',
          'left',
        ),
        rect(620, 44, { fill: ROLE.worker, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at(x0 + 310, yW)
          .opacity(0.88),
        txt('16 GB WEIGHTS (1 COPY)', x0 + 310, yW, 26, '#070910', 'mono', 'center'),
        rect(480, 44, { fill: '#121c33', stroke: ROLE.focus, width: 2.8, radius: 6 }).at(
          x0 + 620 + 20 + 240,
          yW,
        ),
        txt('ACTIVATIONS + WORKSPACE', x0 + 620 + 20 + 240, yW, 26, ROLE.focus, 'mono', 'center'),
      );

      // 4 independent growing KV strips
      const yKv = -40;
      const reqLens = [140, 210, 175, 250];
      let cx = x0;
      reqLens.forEach((w, i) => {
        nodes.push(
          rect(w, 42, { fill: ROLE.req, stroke: '#ffffff', width: 1.2, radius: 6 })
            .at(cx + w * 0.5, yKv)
            .glow(6, ROLE.req)
            .opacity(0.85),
          txt(`R${i + 1}`, cx + w * 0.5, yKv, 26, '#070910', 'mono', 'center'),
        );
        cx += w + 16;
      });
      nodes.push(
        txt(
          '4 INDEPENDENT HISTORIES (PAGED TO WHOLE BLOCKS)',
          x0,
          yKv - 52,
          26,
          ROLE.req,
          'mono',
          'left',
        ),
      );

      // Physical realizations column (left) vs Quantization & Checkpoint column (right)
      const lx = -820;
      const rx = 100;
      const cAlpha = 0.4 + cn * 0.6;
      const qAlpha = 0.35 + qn * 0.65;
      nodes.push(
        line([-840, 26], [840, 26], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt('WHAT CHANGES PHYSICAL KV', lx, 75, 26, ROLE.ok, 'mono', 'left').opacity(cAlpha),
        txt('· Shared prefix blocks avoid copies', lx, 128, 26, COSMOS.ink, 'mono', 'left').opacity(
          cAlpha,
        ),
        txt(
          '· Sliding window caps retained tokens',
          lx,
          178,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(cAlpha),
        txt('· Sharding shifts rank ownership', lx, 228, 26, COSMOS.ink, 'mono', 'left').opacity(
          cAlpha,
        ),
        txt('· Paged blocks round up tail slots', lx, 278, 26, COSMOS.ink, 'mono', 'left').opacity(
          cAlpha,
        ),

        txt('WEIGHTS & QUANTIZATION', rx, 75, 26, ROLE.policy, 'mono', 'left').opacity(qAlpha),
        txt('· Changing KV heads needs new ckpt', rx, 128, 26, COSMOS.ink, 'mono', 'left').opacity(
          qAlpha,
        ),
        txt('· 8-bit ~ 1/2 of BF16 before scales', rx, 178, 26, ROLE.ok, 'mono', 'left').opacity(
          qAlpha,
        ),
        txt(
          '· Count metadata + FP16 kept tensors',
          rx,
          228,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(qAlpha),
        txt('· Benchmark real quality + kernel!', rx, 278, 26, ROLE.focus, 'mono', 'left').opacity(
          qAlpha,
        ),
      );

      nodes.push(
        txt('FIT != THROUGHPUT', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('Measure peak GB & tok/s under load', 480, -378, 26, COSMOS.muted, 'mono', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('sd-memory-realization-1-operation', () => {
    s.play(
      condOn.to(1, {
        duration: clampDur(c, c.cue('sd-memory-realization-1-operation').start, 0.35),
      }),
    );
  });
  c.on('sd-memory-realization-2-operation', () => {
    s.play(
      quantOn.to(1, {
        duration: clampDur(c, c.cue('sd-memory-realization-2-operation').start, 0.35),
      }),
    );
  });
}
