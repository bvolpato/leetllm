// Scene 21: cache - Authorize reuse and preserve live artifact references
// Beat 0: Request A-1 pins immutable adapter docs-v2, blocking eviction while live reference = 1,
//         then retires cleanly before eviction is permitted.
// Beat 1: ACL changes from v1 -> v2, causing a visible authorized-gate MISS against stored ACL-v1 prefix.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function cacheScene(s, c) {
  const pinnedOn = s.value(0);
  const evictBlockOn = s.value(0);
  const b1On = s.value(0);
  const aclMissOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#a78bfa1c', '#5ce1e618');
  const header = cinemaHeader(
    'ADAPTER PINS & PREFIX CACHE ACL',
    'Authorize reuse and preserve',
    'live artifact references',
    { x: -860, y: -450, accent: ROLE.adapter, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const pin = pinnedOn.value > 0.5;
      const evBlk = evictBlockOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const miss = aclMissOn.value > 0.5;

      const nodes = [];

      // Top row: Request A-1 (left) <-> Immutable adapter docs-v2 (right)
      nodes.push(
        rect(660, 136, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
          .at(-500, -155)
          .glow(7, ROLE.A),
        txt('REQUEST A-1  ·  ALICE / TENANT A', -500, -184, 26, ROLE.A, 'mono', 'center'),
        txt(
          b1 ? (miss ? 'Request ACL: v2' : 'Request ACL: v1') : 'Authorized immutable rev',
          -500,
          -132,
          30,
          COSMOS.ink,
          'mono',
          'center',
        ),

        rect(660, 136, { fill: '#15102a', stroke: ROLE.adapter, width: 2.8, radius: 16 })
          .at(500, -155)
          .glow(pin && !b1 ? 10 : 5, ROLE.adapter),
        txt('IMMUTABLE ADAPTER ARTIFACT', 500, -184, 26, ROLE.adapter, 'mono', 'center'),
        txt('docs-v2  (base-v3 compatible)', 500, -132, 30, COSMOS.ink, 'mono', 'center'),
      );

      if (!b1) {
        // Beat 0: Active pin & eviction block
        if (pin) {
          nodes.push(
            beamWithPhotons(
              [
                [-165, -155],
                [165, -155],
              ],
              ROLE.held,
              0,
              { width: 4.5, glow: 10 },
            ),
            txt('PINNED · refs = 1', 0, -258, 26, ROLE.held, 'mono', 'center'),
          );
        }

        // Eviction contention card below
        const col = evBlk ? ROLE.fail : ROLE.shared;
        nodes.push(
          rect(1660, 210, {
            fill: evBlk ? '#240f19' : '#0b1426',
            stroke: col,
            width: 3.0,
            radius: 18,
          })
            .at(0, 135)
            .glow(evBlk ? 10 : 4, col),
          txt(
            evBlk
              ? 'EVICTION REQUESTED BY ANOTHER TENANT  ->  BLOCKED'
              : 'IN-FLIGHT BATCH PIN LIFETIME',
            0,
            88,
            30,
            col,
            'mono',
            'center',
          ),
          txt(
            evBlk
              ? 'A-1 keeps its pin until completion; evict only at 0 refs.'
              : 'A hot adapter in GPU memory never proves authorization for an unapproved caller.',
            0,
            162,
            28,
            COSMOS.ink,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 1: Prefix & retrieval cache key + ACL v1 vs v2 revocation miss
        nodes.push(
          rect(660, 136, {
            fill: '#19150b',
            stroke: miss ? ROLE.focus : ROLE.A,
            width: 2.8,
            radius: 16,
          })
            .at(-500, 58)
            .glow(miss ? 9 : 4, ROLE.focus),
          txt('INCOMING CACHE LOOKUP KEY', -500, 28, 26, COSMOS.muted, 'mono', 'center'),
          txt(
            miss ? 'A / Alice / ACL-v2 / docs-v2' : 'A / Alice / ACL-v1 / docs-v2',
            -500,
            82,
            28,
            miss ? ROLE.focus : ROLE.A,
            'mono',
            'center',
          ),

          rect(660, 136, { fill: '#0b1a28', stroke: ROLE.kv, width: 2.8, radius: 16 })
            .at(500, 58)
            .glow(6, ROLE.kv),
          txt('STORED PREFIX ENTRY', 500, 28, 26, COSMOS.muted, 'mono', 'center'),
          txt('A / Alice / ACL-v1 / docs-v2', 500, 82, 28, ROLE.kv, 'mono', 'center'),
        );

        if (miss) {
          nodes.push(
            line([0, -18], [0, 136], { stroke: ROLE.fail, width: 8 }).glow(10, ROLE.fail),
            rect(1660, 128, { fill: '#240f19', stroke: ROLE.fail, width: 3.0, radius: 16 })
              .at(0, 285)
              .glow(9, ROLE.fail),
            txt(
              'AUTHORIZATION GATE:  ACL-v2 != ACL-v1  ->  CACHE MISS',
              0,
              258,
              30,
              ROLE.fail,
              'mono',
              'center',
            ),
            txt(
              'Stale prefix entry stays unreachable under policy change; recompute authorized context.',
              0,
              310,
              27,
              COSMOS.ink,
              'sans',
              'center',
            ),
          );
        } else {
          nodes.push(
            beamWithPhotons(
              [
                [-165, 58],
                [165, 58],
              ],
              ROLE.ok,
              0,
              { width: 4.2, glow: 9 },
            ),
            rect(1660, 128, { fill: '#0b201b', stroke: ROLE.ok, width: 2.8, radius: 16 }).at(
              0,
              285,
            ),
            txt(
              'CACHE IDENTITY:  Model + Adapter + Tokens + Permission Scope',
              0,
              258,
              28,
              ROLE.ok,
              'mono',
              'center',
            ),
            txt(
              'Every cache read still requires explicit caller authorization.',
              0,
              310,
              27,
              COSMOS.ink,
              'sans',
              'center',
            ),
          );
        }
      }

      nodes.push(
        txt(
          'Logical namespaces complement process, GPU-instance, and host isolation chosen from the threat model.',
          0,
          422,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  stepOn(s, c, 'cache-beat-1-focus-2', pinnedOn, 1);
  stepOn(s, c, 'cache-beat-1-focus-1', evictBlockOn, 1);
  stepOn(s, c, 'cache-beat-2-focus-1', b1On, 1);
  stepAfter(s, c, 'cache-beat-2-focus-2', aclMissOn, 1);
}
