// Scene 21: capacity - Count residence inside the memory boundary
// Beat 0: Little's Law on request lifetime (2.50s -> 1,500 in-flight) vs KV lifetime (1.93s -> 1,158 KV-resident).
// Beat 1: 5 KV sizing factors -> 131,072 B/pos -> 220.52 GiB -> compare 19 memory vs 12 decode devices.
import { group, line, rect } from 'vizmatic/stage';
import {
  CAPACITY_DATA,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowMeter,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function capacity(s, c) {
  const traceProg = s.value(0);
  const countsOn = s.value(0);
  const factorsOn = s.value(0);
  const compareOn = s.value(0);

  const header = cinemaHeader('CAPACITY & MEMORY', 'Count residence inside', 'the KV boundary', {
    accent: ROLE.kv,
    size: 46,
  });

  const stageAura = aura(0, 40, 700, '#5ce1e61c', '#6ee7b716');

  const kvEq = glowTex(
    '2 \\cdot 32 \\cdot 8 \\cdot 128 \\cdot 2 = 131{,}072\\ \\mathrm{B/pos} \\;\\Rightarrow\\; 220.52\\ \\mathrm{GiB}',
    { x: 0, y: 12, size: 36, color: ROLE.focus, glow: 7 },
  ).hide();

  const view = guardedDynamic(
    () => 1,
    () => {
      const tr = traceProg.value;
      const cnt = countsOn.value > 0.5;
      const fac = factorsOn.value;
      const cmp = compareOn.value > 0.5;
      const nodes = [];

      if (fac > 0.25 || cmp) {
        // Beat 1: 5 KV sizing factors + dual lower-bound comparison
        nodes.push(
          txt(
            '1,158 MEAN KV RESIDENTS  ×  1,560 CACHED POSITIONS',
            0,
            -238,
            28,
            ROLE.kv,
            'mono',
            'center',
          ),
        );
        const factors = [
          ['K + V', '2'],
          ['Layers', '32'],
          ['KV heads', '8'],
          ['Head dim', '128'],
          ['Bytes', '2'],
        ];
        factors.forEach(([name, val], i) => {
          const x = -660 + i * 330;
          nodes.push(
            txt(name, x, -172, 26, COSMOS.muted, 'mono', 'center'),
            rect(276, 86, { fill: '#0c1629', stroke: ROLE.kv, width: 2.6, radius: 12 })
              .at(x, -104)
              .glow(6, ROLE.kv),
            txt(val, x, -104, 38, ROLE.kv, 'mono', 'center'),
          );
        });

        // Memory vs Output lower bounds side by side
        const memCol = cmp ? ROLE.kv : COSMOS.dim;
        const decCol = cmp ? ROLE.ok : COSMOS.dim;
        nodes.push(
          rect(760, 178, { fill: '#0c1628', stroke: memCol, width: cmp ? 3 : 2, radius: 14 })
            .at(-440, 215)
            .glow(cmp ? 9 : 0, memCol),
          txt('MEMORY LOWER BOUND', -785, 162, 26, memCol, 'mono', 'left'),
          txt(
            cmp ? `${CAPACITY_DATA.memory} devices` : 'computing...',
            -785,
            222,
            44,
            memCol,
            'mono',
            'left',
          ),
          txt('ceil(220.52 GiB / 12 GiB per device)', -785, 276, 26, COSMOS.muted, 'mono', 'left'),

          rect(760, 178, { fill: '#0d1924', stroke: decCol, width: cmp ? 3 : 2, radius: 14 })
            .at(440, 215)
            .glow(cmp ? 9 : 0, decCol),
          txt('OUTPUT-THROUGHPUT LOWER BOUND', 95, 162, 26, decCol, 'mono', 'left'),
          txt(
            cmp ? `${CAPACITY_DATA.decode} devices` : 'computing...',
            95,
            222,
            44,
            decCol,
            'mono',
            'left',
          ),
          txt(
            'ceil(600 × 120 tok/s / 6,000 per device)',
            95,
            276,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),

          txt(
            'Same worker fleet serves both -> max(19, 12) still omits prefill, bursts & headroom.',
            0,
            378,
            28,
            ROLE.focus,
            'serif',
            'center',
          ),
        );
      } else {
        // Beat 0: Request boundary vs KV boundary timeline + Little's Law meters
        const x0 = -520;
        const x1 = 820;
        const mapS = (sec) => x0 + (sec / 2.5) * (x1 - x0);
        const yReq = -165;
        const yKv = -60;

        nodes.push(
          txt('Request R1', -855, yReq, 28, COSMOS.ink, 'mono', 'left'),
          rect(x1 - x0, 62, { fill: '#0b1222', stroke: '#2c3d66', width: 2, radius: 8 }).at(
            (x0 + x1) * 0.5,
            yReq,
          ),
          rect(mapS(0.37) - x0, 52, { fill: ROLE.policy, stroke: null, radius: 6 }).at(
            (x0 + mapS(0.37)) * 0.5,
            yReq,
          ),
          rect(mapS(2.3) - mapS(0.37), 52, { fill: ROLE.kv, stroke: null, radius: 6 })
            .at((mapS(0.37) + mapS(2.3)) * 0.5, yReq)
            .glow(8, ROLE.kv),
          rect(x1 - mapS(2.3), 52, { fill: ROLE.ok, stroke: null, radius: 6 }).at(
            (mapS(2.3) + x1) * 0.5,
            yReq,
          ),
          txt(
            'Retrieve 0.37s',
            (x0 + mapS(0.37)) * 0.5,
            yReq - 52,
            26,
            ROLE.policy,
            'mono',
            'center',
          ),
          txt(
            'Synthesis 1.93s',
            (mapS(0.37) + mapS(2.3)) * 0.5,
            yReq,
            28,
            '#070910',
            'mono',
            'center',
          ),
          txt('Check 0.2s', (mapS(2.3) + x1) * 0.5, yReq - 52, 26, ROLE.ok, 'mono', 'center'),

          txt('KV History', -855, yKv, 28, ROLE.kv, 'mono', 'left'),
          rect(x1 - x0, 62, { fill: '#0b1222', stroke: '#2c3d66', width: 2, radius: 8 }).at(
            (x0 + x1) * 0.5,
            yKv,
          ),
          rect(mapS(2.3) - mapS(0.37), 52, {
            fill: ROLE.kv,
            stroke: '#ffffff',
            width: 1.5,
            radius: 6,
          })
            .at((mapS(0.37) + mapS(2.3)) * 0.5, yKv)
            .glow(9, ROLE.kv),
          txt(
            'Allocate -> KV resident -> Release',
            (mapS(0.37) + mapS(2.3)) * 0.5,
            yKv,
            26,
            '#070910',
            'mono',
            'center',
          ),
        );

        for (const sec of [0, 0.37, 2.3, 2.5]) {
          const sx = mapS(sec);
          nodes.push(
            line([sx, yKv + 36], [sx, yKv + 52], { stroke: '#4d6599', width: 2 }),
            txt(`${sec.toFixed(2)}s`, sx, yKv + 82, 26, COSMOS.dim, 'mono', 'center'),
          );
        }

        // Little's Law meters (600 req/s * residence)
        const fInflight = cnt ? 1 : 0.25 + 0.5 * tr;
        const fRes = cnt ? CAPACITY_DATA.resident / CAPACITY_DATA.inflight : 0.2;
        nodes.push(
          txt(
            'IN-FLIGHT SEARCH REQUESTS (600/s × 2.50s)',
            -855,
            118,
            28,
            ROLE.policy,
            'mono',
            'left',
          ),
          glowMeter(-855, 174, 1340, 44, fInflight, { fill: ROLE.policy }),
          txt(cnt ? '1,500' : '...', 820, 174, 36, ROLE.policy, 'mono', 'right').glow(
            cnt ? 6 : 0,
            ROLE.policy,
          ),

          txt('KV-RESIDENT REQUESTS (600/s × 1.93s)', -855, 258, 28, ROLE.kv, 'mono', 'left'),
          glowMeter(-855, 314, 1340, 44, fRes, { fill: ROLE.kv }),
          txt(cnt ? '1,158' : '...', 820, 314, 36, ROLE.kv, 'mono', 'right').glow(
            cnt ? 7 : 0,
            ROLE.kv,
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view, kvEq);
  c.on('capacity-beat-1-focus-1', () => {
    s.play(traceProg.to(1, { duration: clampDur(c, c.cue('capacity-beat-1-focus-1').start, 1.0) }));
  });
  c.on('capacity-beat-1-focus-2', () => {
    s.play(countsOn.to(1, { duration: clampDur(c, c.cue('capacity-beat-1-focus-2').start, 0.4) }));
  });
  c.on('capacity-beat-2-focus-2', () => {
    s.play(factorsOn.to(1, { duration: clampDur(c, c.cue('capacity-beat-2-focus-2').start, 0.2) }));
  });
  c.show('capacity-beat-2-focus-2', kvEq, { lead: -0.2 });
  c.on('capacity-beat-2-focus-1', () => {
    s.play(compareOn.to(1, { duration: clampDur(c, c.cue('capacity-beat-2-focus-1').start, 0.4) }));
  });
}
