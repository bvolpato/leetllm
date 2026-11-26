// Scene 23: capacity-bounds - Compute separate resource lower bounds
// 19 physical memory-bound devices (cyan) + 12 output-throughput roles (emerald) sliding onto the
// same 19 workers to show why 19 + 12 double-counts; Beat 3 shows +50 evidence tokens lengthening prompt.
import { group, rect } from 'vizmatic/stage';
import {
  CAPACITY_DATA,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  mix,
  txt,
} from '../parts.mjs';

export default function capacityBounds(s, c) {
  const pulse = s.value(0);
  const memStart = s.value(0);
  const memProg = s.value(0);
  const decStart = s.value(0);
  const decProg = s.value(0);
  const jointStart = s.value(0);
  const mergeProg = s.value(0);
  const beat3On = s.value(0);
  const addTokensProg = s.value(0);

  const header = cinemaHeader(
    'RESOURCE LOWER BOUNDS',
    'Two bounds share one',
    'physical worker fleet',
    {
      accent: ROLE.kv,
      size: 46,
    },
  );

  const stageAura = aura(0, 50, 700, '#5ce1e61a', '#6ee7b71a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const mp = memProg.value;
      const dp = decProg.value;
      const mg = mergeProg.value;
      const b3 = beat3On.value > 0.5;
      const addT = addTokensProg.value;
      const nodes = [];

      if (b3) {
        // Beat 3: Hypothetical +50 evidence tokens on one request (250 -> 300 in + 120 out)
        const extra = Math.round(50 * addT);
        const rows = [
          { label: 'Original prompt', inp: 250, out: 120, y: -95 },
          { label: 'With +50 evidence', inp: 250 + extra, out: 120, y: 115 },
        ];
        const xLeft = -350;
        const scale = 2.65;

        nodes.push(
          txt('ONE HYPOTHETICAL SYNTHESIS REQUEST', -840, -225, 28, ROLE.focus, 'mono', 'left'),
        );
        rows.forEach((r) => {
          const wIn = r.inp * scale;
          const wOut = r.out * scale;
          nodes.push(
            txt(r.label, -840, r.y, 30, COSMOS.ink, 'mono', 'left'),
            rect(wIn, 88, { fill: '#0d162a', stroke: ROLE.policy, width: 2.8, radius: 10 })
              .at(xLeft + wIn * 0.5, r.y)
              .glow(7, ROLE.policy),
            txt(`${r.inp} input tokens`, xLeft + wIn * 0.5, r.y, 28, ROLE.policy, 'mono', 'center'),

            rect(wOut, 88, { fill: '#0d1a24', stroke: ROLE.ok, width: 2.8, radius: 10 })
              .at(xLeft + wIn + 14 + wOut * 0.5, r.y)
              .glow(7, ROLE.ok),
            txt(`${r.out} out`, xLeft + wIn + 14 + wOut * 0.5, r.y, 28, ROLE.ok, 'mono', 'center'),
          );
        });

        nodes.push(
          txt(
            'Remeasure prefill time, mean cached positions, KV residence, and joint throughput.',
            -840,
            325,
            30,
            ROLE.focus,
            'serif',
            'left',
          ),
        );
      } else {
        // Beats 0-2: 19 memory GPUs + 12 output roles converging onto the same workers
        const nMem = Math.max(1, Math.round(CAPACITY_DATA.memory * Math.max(0.06, mp)));
        const nDec =
          decStart.value > 0.3 || dp > 0.05
            ? Math.round(CAPACITY_DATA.decode * Math.max(0.08, dp))
            : 0;

        nodes.push(
          txt('MEMORY BOUND (220.52 / 12 GiB)', -840, -220, 26, ROLE.kv, 'mono', 'left').opacity(
            0.6 + 0.4 * memStart.value,
          ),
          txt(
            mg > 0.45
              ? '12 DECODE ROLES RIDE ON THOSE 19 GPUS'
              : 'OUTPUT BOUND (72,000 / 6,000 tok/s)',
            80,
            -220,
            26,
            ROLE.ok,
            'mono',
            'left',
          ),
        );

        // 19 physical worker tiles on left grid (5 cols x 4 rows)
        for (let i = 0; i < nMem; i++) {
          const wx = -775 + (i % 5) * 145;
          const wy = -125 + Math.floor(i / 5) * 95;
          nodes.push(
            rect(118, 68, { fill: '#0c1628', stroke: ROLE.kv, width: 2.6, radius: 10 })
              .at(wx, wy)
              .glow(6, ROLE.kv),
          );
        }

        // 12 output-throughput role tiles sliding from right grid directly onto first 12 workers!
        for (let i = 0; i < nDec; i++) {
          const targetX = -775 + (i % 5) * 145;
          const targetY = -125 + Math.floor(i / 5) * 95;
          const startX = 145 + (i % 5) * 145;
          const rx = mix(startX, targetX, mg);
          const rw = mix(118, 92, mg);
          const rh = mix(68, 44, mg);
          nodes.push(
            rect(rw, rh, { fill: '#0d1c24', stroke: ROLE.ok, width: 2.8, radius: 8 })
              .at(rx, targetY)
              .glow(7, ROLE.ok),
          );
        }

        nodes.push(
          txt(
            mp > 0.7
              ? `ceil(220.52 / 12) = ${CAPACITY_DATA.memory} memory devices`
              : '12 GiB net cache budget / device',
            -840,
            278,
            30,
            ROLE.kv,
            'mono',
            'left',
          ),
          txt(
            dp > 0.7
              ? `ceil(72,000 / 6,000) = ${CAPACITY_DATA.decode} output devices`
              : '600 req/s × 120 tok/req = 72,000 tok/s',
            80,
            278,
            30,
            ROLE.ok,
            'mono',
            'left',
          ),
          txt(
            mg > 0.7
              ? 'DO NOT ADD 19 + 12 (= 31)! 19 physical workers satisfy both lower bounds -> benchmark joint load.'
              : jointStart.value > 0.5
                ? 'Same workers can satisfy both constraints without double-counting.'
                : 'Separate mean lower bounds omit prefill, batching, bursts, failures & headroom.',
            -840,
            372,
            28,
            mg > 0.7 ? ROLE.focus : COSMOS.muted,
            'serif',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-capacity-bounds-0', () => {
    s.play(memStart.to(1, { duration: clampDur(c, c.cue('se-capacity-bounds-0').start, 0.35) }));
  });
  c.on('se-capacity-bounds-memory', () => {
    s.play(
      memProg.to(1, { duration: clampDur(c, c.cue('se-capacity-bounds-memory').start, 0.75) }),
    );
  });
  c.on('se-capacity-bounds-1', () => {
    s.play(decStart.to(1, { duration: clampDur(c, c.cue('se-capacity-bounds-1').start, 0.3) }));
  });
  c.on('se-capacity-bounds-decode', () => {
    s.play(
      decProg.to(1, { duration: clampDur(c, c.cue('se-capacity-bounds-decode').start, 0.75) }),
    );
  });
  c.on('se-capacity-bounds-2', () => {
    s.play(jointStart.to(1, { duration: clampDur(c, c.cue('se-capacity-bounds-2').start, 0.3) }));
  });
  c.on('se-capacity-bounds-joint', () => {
    s.play(
      mergeProg.to(1, { duration: clampDur(c, c.cue('se-capacity-bounds-joint').start, 0.9) }),
    );
  });
  c.on('se-capacity-bounds-length', () => {
    s.play(
      beat3On.to(1, { duration: clampDur(c, c.cue('se-capacity-bounds-length').start, 0.25) }),
    );
    s.play(
      addTokensProg.to(1, {
        duration: clampDur(c, c.cue('se-capacity-bounds-length').start, 0.85),
      }),
    );
  });
}
