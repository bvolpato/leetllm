// Scene 27: What did the CPU checks establish? (CPU lookup helper 4 vs 0, lifetime check, 21.47 ms bound -> live serving replay on warm worker).
import {
  COSMOS,
  KV_TRANSFER_MS,
  NS_DIFF,
  NS_SAME,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function serviceReplay(s, c) {
  // step:
  // 0 = CPU helper same ns A
  // 1 = returns 4
  // 2 = change requested ns -> B
  // 3 = returns 0 (RadixKey.match raises ValueError)
  // 4 = CPU lifetime check: eviction blocked while 2nd owner holds
  // 5 = CPU transfer bound: 21.47 ms payload-only
  // 6 = Live warm-worker replay: repeat prompt, then change 1 early token
  // 7 = Observe matched vs fresh prefill positions in batch trace
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61a', '#60a5fa18');
  const title = heroTitle(['CPU Helpers vs Live', 'Warm-Worker Replay'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'VERIFICATION SCOPE · HELPER PREDICTIONS -> WORKER TRACE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [];

    if (st <= 3) {
      // Beat 0: CPU lookup helper calls
      nodes.push(
        txt(
          'CPU ARTICLE HELPER: ids = ["A", "B", "C", "D", "E"]  ·  page_size = 4',
          0,
          -200,
          28,
          ROLE.prefill,
          'mono',
        ),

        glassCell(-230, -75, 980, 118, ROLE.radix, { fill: '#0e2436', glow: 8 }),
        txt('match_len(ids, ids, "A", "A", page=4)', -230, -75, 32, COSMOS.ink, 'mono'),
        line([270, -75], [345, -75], { color: ROLE.radix, width: 3 }),
        glassCell(560, -75, 400, 118, st >= 1 ? ROLE.decode : COSMOS.dim, {
          fill: st >= 1 ? '#0d2922' : '#0b101d',
          glow: st >= 1 ? 10 : 2,
        }),
        txt(
          st >= 1 ? `${NS_SAME.reusable} positions` : '?',
          560,
          -75,
          36,
          st >= 1 ? ROLE.decode : COSMOS.gold,
          'mono',
        ),

        glassCell(-230, 95, 980, 118, st >= 2 ? COSMOS.gold : COSMOS.dim, {
          fill: st >= 2 ? '#201c10' : '#0b101d',
          glow: st >= 2 ? 9 : 2,
        }),
        txt(
          st >= 2 ? 'match_len(ids, ids, "A", "B", page=4)' : 'Second lookup (pending)',
          -230,
          95,
          32,
          st >= 2 ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
        line([270, 95], [345, 95], { color: st >= 3 ? ROLE.fail : COSMOS.dim, width: 3 }),
        glassCell(560, 95, 400, 118, st >= 3 ? ROLE.fail : COSMOS.dim, {
          fill: st >= 3 ? '#2c1120' : '#0b101d',
          glow: st >= 3 ? 10 : 2,
        }),
        txt(
          st >= 3 ? `${NS_DIFF.reusable} positions` : '?',
          560,
          95,
          36,
          st >= 3 ? ROLE.fail : COSMOS.gold,
          'mono',
        ),

        glassCell(0, 240, 1520, 76, ROLE.prefill, { fill: '#101f3a', glow: 6 }),
        txt(
          'Pinned RadixKey.match on mismatched namespaces raises ValueError',
          0,
          240,
          26,
          ROLE.prefill,
          'mono',
        ),
      );
    } else {
      // Beat 1: CPU checks summary (top) -> Live serving replay steps (bottom)
      nodes.push(
        glassCell(-420, -145, 740, 160, ROLE.radix, { fill: '#0e2436', glow: 8 }),
        txt('CPU OWNERSHIP CHECK', -420, -188, 26, COSMOS.muted, 'mono'),
        txt('2nd owner holds KV -> eviction blocked', -420, -130, 26, ROLE.radix, 'mono'),
        txt('No model weights loaded', -420, -86, 26, COSMOS.dim, 'sans'),

        glassCell(420, -145, 740, 160, st >= 5 ? COSMOS.gold : COSMOS.dim, {
          fill: st >= 5 ? '#201c10' : '#0b101d',
          glow: st >= 5 ? 8 : 2,
        }),
        txt('CPU TRANSFER CALCULATION', 420, -188, 26, COSMOS.muted, 'mono'),
        txt(
          `512 MiB / 25 GB/s = ${KV_TRANSFER_MS.toFixed(2)} ms bound`,
          420,
          -130,
          26,
          COSMOS.gold,
          'mono',
        ),
        txt('Payload-only arithmetic lower bound', 420, -86, 26, COSMOS.dim, 'sans'),

        txt('LIVE SERVING REPLAY (SUPPORTED MODEL + BACKEND)', 0, 10, 28, ROLE.decode, 'mono'),
      );

      const replaySteps = [
        { k: '1. Warm Worker', v: 'Send baseline prompt', active: true, col: ROLE.prefill },
        { k: '2. Repeat Prompt', v: 'Verify warm prefix hit', active: st >= 6, col: ROLE.decode },
        { k: '3. Edit Early Token', v: 'Watch hit drop in trace', active: st >= 6, col: ROLE.fail },
      ];
      replaySteps.forEach((rs, i) => {
        const cx = -520 + i * 520;
        nodes.push(
          glassCell(cx, 125, 480, 126, rs.active ? rs.col : COSMOS.dim, {
            fill: rs.active ? '#101f36' : '#0b101d',
            glow: rs.active ? 9 : 2,
          }),
          txt(rs.k, cx, 98, 28, rs.active ? rs.col : COSMOS.dim, 'mono'),
          txt(rs.v, cx, 152, 26, rs.active ? COSMOS.ink : COSMOS.dim, 'sans'),
        );
      });

      nodes.push(
        glassCell(0, 260, 1520, 74, st >= 7 ? COSMOS.gold : COSMOS.dim, {
          fill: st >= 7 ? '#201c10' : '#0b101d',
          glow: st >= 7 ? 9 : 2,
        }),
        txt(
          st >= 7
            ? 'Batch trace: compare matched positions vs fresh prefill positions skipped by GPU'
            : 'Requires real loaded weights and configured attention backend',
          0,
          260,
          26,
          st >= 7 ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
      );
    }

    nodes.push(
      txt(
        st >= 7
          ? 'A mock checks call order; the live worker batch trace proves which GPU prefill was skipped.'
          : st >= 4
            ? 'CPU scripts verify logic and bounds; live worker replays verify actual GPU savings.'
            : 'CPU helpers confirm page-alignment and namespace rules before touching GPU servers.',
        0,
        360,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['replay-base', 0],
    ['replay-four', 1, true],
    ['replay-key', 2],
    ['replay-zero', 3, true],
    ['replay-evidence', 4],
    ['replay-bound', 5],
    ['replay-live', 6],
    ['replay-observe', 7, true],
  ]);
}
