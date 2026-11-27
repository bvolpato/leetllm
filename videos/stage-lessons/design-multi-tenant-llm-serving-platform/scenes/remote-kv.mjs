// Scene 16: remote-kv - Fetch the prefix or rebuild it here?
// Beat 0: Verify Alice's read access + execution shape (model, adapter, tokens, positions, layout).
// Beats 1-2: Compare Remote Fetch (18 lookup + 42 transfer = 60 ms) vs Local Rebuild (45 ms)
//            against a 70 ms deadline. Strictly withholds winner, 60 ms sum, and 25 ms margin until Beat 2!
// Beat 3: In-flight fetch timeout keeps Page 0 pinned until remote worker confirms last read finished.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  buildKvPageTile,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function remoteKv(s, c) {
  const b0On = s.value(0);
  const readerOk = s.value(0);
  const shapeOk = s.value(0);
  const compatOk = s.value(0);
  const b1On = s.value(0);
  const lookupP = s.value(0);
  const transferP = s.value(0);
  const rebuildP = s.value(0);
  const b2On = s.value(0);
  const totalOn = s.value(0);
  const spareOn = s.value(0);
  const b3On = s.value(0);
  const timeoutOn = s.value(0);
  const retireOn = s.value(0);
  const releaseOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#5ce1e61c', '#6ee7b716');
  const header = cinemaHeader('REMOTE KV PREFIX REUSE', 'Fetch the prefix', 'or rebuild it here?', {
    x: -860,
    y: -450,
    accent: ROLE.kv,
    size: 46,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const rOk = readerOk.value > 0.5;
      const sOk = shapeOk.value > 0.5;
      const cOk = compatOk.value > 0.5;
      const b1 = b1On.value > 0.5;
      const lp = lookupP.value;
      const tp = transferP.value;
      const rp = rebuildP.value;
      const b2 = b2On.value > 0.5;
      const tot = totalOn.value > 0.5;
      const spr = spareOn.value > 0.5;
      const b3 = b3On.value > 0.5;
      const tout = timeoutOn.value > 0.5;
      const ret = retireOn.value > 0.5;
      const rel = releaseOn.value > 0.5;

      const nodes = [];

      if (!b1 && !b3) {
        // Beat 0: Two-gate prefix compatibility check
        nodes.push(
          rect(1640, 520, {
            fill: '#0b1224',
            stroke: cOk ? ROLE.ok : '#344770',
            width: 2.8,
            radius: 18,
          })
            .at(0, 55)
            .glow(cOk ? 8 : 3, cOk ? ROLE.ok : ROLE.kv),
          txt('REMOTE CACHED PREFIX CANDIDATE', -760, -148, 28, ROLE.kv, 'mono', 'left'),
        );
        if (cOk) {
          nodes.push(
            rect(260, 58, { fill: '#0c241d', stroke: ROLE.ok, width: 2.6, radius: 12 })
              .at(630, -148)
              .glow(9, ROLE.ok),
            txt('APPROVED', 630, -148, 26, ROLE.ok, 'mono', 'center'),
          );
        }

        const checks = [
          ['1. AUTHORIZED READER', 'Alice may read entire prefix (Workspace A)', rOk, ROLE.A],
          ['2. MODEL & ADAPTER', 'base-v3  /  docs-v2', sOk, ROLE.kv],
          ['3. TOKENS & POSITIONS', '[1, 5, 9]  at  [0, 1, 2]', sOk, ROLE.kv],
          ['4. CACHE LAYOUT', 'kv-layout-v1', sOk, ROLE.kv],
        ];
        checks.forEach(([label, val, active, col], idx) => {
          const cy = -44 + idx * 96;
          nodes.push(
            rect(1520, 74, {
              fill: '#0d172c',
              stroke: active ? col : '#263354',
              width: active ? 2.6 : 1.6,
              radius: 12,
            })
              .at(0, cy)
              .glow(active ? 6 : 0, col),
            txt(label, -725, cy, 26, active ? col : COSMOS.muted, 'mono', 'left'),
            txt(val, 220, cy, 28, active ? COSMOS.ink : COSMOS.dim, 'mono', 'center'),
            txt(
              active ? 'MATCH' : '...',
              720,
              cy,
              26,
              active ? ROLE.ok : COSMOS.dim,
              'mono',
              'right',
            ),
          );
        });

        nodes.push(
          txt(
            'Both reader authorization and execution compatibility must match before timing even matters.',
            0,
            405,
            28,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      } else if (b1 && !b3) {
        // Beats 1 & 2: Racing Fetch (18 + 42) vs Rebuild (45) against 70 ms deadline
        const x0 = -500;
        const xMs = (ms) => x0 + (ms / 70) * 1240;
        const xDead = xMs(70);

        nodes.push(
          rect(900, 78, { fill: '#0d1528', stroke: ROLE.focus, width: 2.6, radius: 14 })
            .at(390, -395)
            .glow(6, ROLE.focus),
          txt(
            'DEADLINE BUDGET: 70 ms · FETCH vs REBUILD',
            390,
            -395,
            26,
            ROLE.focus,
            'mono',
            'center',
          ),
        );

        // Millisecond grid ticks across the racing ruler (placed behind tracks & bars)
        for (const tick of [0, 20, 40, 60]) {
          const tx = xMs(tick);
          nodes.push(
            line([tx, -172], [tx, 212], { stroke: '#1e2c4d', width: 2 }),
            txt(`${tick} ms`, tx, -206, 26, COSMOS.muted, 'mono', 'center'),
          );
        }

        nodes.push(
          txt('DEADLINE: 70 ms', xDead, -252, 28, ROLE.fail, 'mono', 'center'),
          line([xDead, -220], [xDead, 280], { stroke: ROLE.fail, width: 4 }).glow(7, ROLE.fail),

          // Fetch track (y = -85)
          txt('REMOTE FETCH', -835, -85, 30, ROLE.kv, 'mono', 'left'),
          rect(1240, 86, { fill: '#101a32', stroke: '#3a5182', width: 2.2, radius: 10 }).at(
            x0 + 620,
            -85,
          ),
        );

        if (lp > 0.02) {
          const w1 = (18 / 70) * 1240 * lp;
          nodes.push(
            rect(w1, 78, { fill: ROLE.A, stroke: null, radius: 8 })
              .at(x0 + w1 * 0.5, -85)
              .glow(6, ROLE.A),
          );
          if (lp > 0.85) {
            nodes.push(txt('Lookup 18 ms', xMs(9), -85, 26, COSMOS.bg, 'mono', 'center'));
          }
        }
        if (tp > 0.02) {
          const w2 = (42 / 70) * 1240 * tp;
          nodes.push(
            rect(w2, 78, { fill: ROLE.kv, stroke: null, radius: 8 })
              .at(xMs(18) + w2 * 0.5, -85)
              .glow(7, ROLE.kv),
          );
          if (tp > 0.85) {
            nodes.push(txt('Transfer 42 ms', xMs(39), -85, 28, COSMOS.bg, 'mono', 'center'));
          }
        }
        if (tot) {
          nodes.push(
            txt('18 + 42 = 60 ms', xMs(60) - 18, -10, 32, ROLE.kv, 'mono', 'right').glow(
              7,
              ROLE.kv,
            ),
          );
        }

        // Local Rebuild track (y = 145)
        nodes.push(
          txt('LOCAL REBUILD', -835, 145, 30, b2 ? ROLE.ok : COSMOS.ink, 'mono', 'left'),
          rect(1240, 86, { fill: '#101a32', stroke: '#3a5182', width: 2.2, radius: 10 }).at(
            x0 + 620,
            145,
          ),
        );
        if (rp > 0.02) {
          const wR = (45 / 70) * 1240 * rp;
          const rCol = b2 ? ROLE.ok : '#5b76a8';
          nodes.push(
            rect(wR, 78, { fill: rCol, stroke: null, radius: 8 })
              .at(x0 + wR * 0.5, 145)
              .glow(b2 ? 10 : 4, rCol),
          );
          if (rp > 0.85) {
            nodes.push(
              txt('Local compute: 45 ms', xMs(22.5), 145, 28, COSMOS.bg, 'mono', 'center'),
            );
          }
        }
        if (spr) {
          const x45 = xMs(45);
          nodes.push(
            line([x45, 224], [xDead, 224], { stroke: ROLE.ok, width: 4 }).glow(8, ROLE.ok),
            line([x45, 210], [x45, 238], { stroke: ROLE.ok, width: 3 }),
            line([xDead, 210], [xDead, 238], { stroke: ROLE.ok, width: 3 }),
            txt('25 ms to spare', (x45 + xDead) * 0.5, 266, 30, ROLE.ok, 'mono', 'center'),
          );
        }

        // Bottom prompt / verdict
        nodes.push(
          txt(
            b2
              ? 'Rebuild locally: 45 ms beats 60 ms serial lookup + transfer.'
              : 'Transfer starts only after lookup finishes. Which path finishes first?',
            0,
            405,
            32,
            b2 ? ROLE.ok : ROLE.focus,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 3: In-flight fetch timeout keeps remote Page 0 pinned until device read retires
        nodes.push(
          rect(620, 150, {
            fill: tout ? '#240f19' : '#0b1426',
            stroke: tout ? ROLE.fail : ROLE.shared,
            width: 2.8,
            radius: 16,
          })
            .at(-490, -110)
            .glow(tout ? 9 : 4, tout ? ROLE.fail : ROLE.shared),
          txt('CALLER FETCH REQUEST', -490, -142, 26, COSMOS.muted, 'mono', 'center'),
          txt(
            tout ? 'CALLER TIMED OUT' : 'Fetch in flight',
            -490,
            -86,
            34,
            tout ? ROLE.fail : COSMOS.ink,
            'mono',
            'center',
          ),

          rect(620, 150, {
            fill: '#0b1628',
            stroke: ret ? ROLE.ok : ROLE.kv,
            width: 2.8,
            radius: 16,
          })
            .at(-490, 145)
            .glow(ret ? 9 : 6, ret ? ROLE.ok : ROLE.kv),
          txt('REMOTE WORKER', -490, 113, 26, COSMOS.muted, 'mono', 'center'),
          txt(
            ret ? 'Last read finished' : 'Reading Page 0...',
            -490,
            169,
            34,
            ret ? ROLE.ok : ROLE.kv,
            'mono',
            'center',
          ),
        );

        if (!ret) {
          nodes.push(
            beamWithPhotons(
              [
                [-175, 145],
                [265, 65],
              ],
              ROLE.kv,
              0,
              { width: 4.5, glow: 9 },
            ),
          );
        }

        nodes.push(
          ...buildKvPageTile({
            id: 'Remote Page 0',
            cx: 465,
            cy: 35,
            used: rel ? 0 : 16,
            owner: rel ? null : 'Pinned',
            color: rel ? ROLE.free : ROLE.kv,
            borderColor: rel ? ROLE.free : ret ? ROLE.ok : ROLE.held,
            footerText: rel
              ? 'RELEASED · available for reuse'
              : ret
                ? '0 live refs · ready to release'
                : 'PINNED · 1 active remote reader',
          }),
          txt(
            rel
              ? 'Page 0 safely released.'
              : ret
                ? 'Last read finished: 0 live refs.'
                : tout
                  ? 'Caller timeout never unpins Page 0 while the remote worker still reads it.'
                  : 'A separate in-flight fetch holds a physical reference on the remote worker.',
            0,
            408,
            29,
            rel || ret ? ROLE.ok : ROLE.focus,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'mt-remote-kv-b0', b0On, 1);
  stepAfter(s, c, 'remote-reader', readerOk, 1);
  stepAfter(s, c, 'remote-shape', shapeOk, 1);
  stepAfter(s, c, 'remote-compatible', compatOk, 1);

  stepOn(s, c, 'mt-remote-kv-b1', b1On, 1);
  c.on('remote-lookup', () => {
    const q = c.cue('remote-lookup');
    s.play(lookupP.to(1, { duration: clampDur(c, q.start, Math.max(0.35, q.end - q.start)) }));
  });
  c.on('remote-transfer', () => {
    const q = c.cue('remote-transfer');
    s.play(transferP.to(1, { duration: clampDur(c, q.start, Math.max(0.35, q.end - q.start)) }));
  });
  c.on('remote-rebuild', () => {
    const q = c.cue('remote-rebuild');
    s.play(rebuildP.to(1, { duration: clampDur(c, q.start, Math.max(0.35, q.end - q.start)) }));
  });

  // Strict prediction withholding: reveal winner, sum, and spare margin ONLY after their Beat 2 cues!
  stepAfter(s, c, 'mt-remote-kv-b2', b2On, 1);
  stepAfter(s, c, 'remote-total', totalOn, 1);
  stepAfter(s, c, 'remote-spare', spareOn, 1);

  stepOn(s, c, 'mt-remote-kv-b3', b3On, 1);
  stepAfter(s, c, 'remote-timeout', timeoutOn, 1);
  stepAfter(s, c, 'remote-retire', retireOn, 1);
  stepAfter(s, c, 'remote-release', releaseOn, 1);
}
