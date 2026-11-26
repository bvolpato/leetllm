// Scene 10: Keep live ownership separate from cached content (BlockPool: immutable IDs, refcounts, hash map, intrusive doubly-linked free queue; touch unlinks before allocate; toy [71,55,9] -> touch 9 -> alloc 71 -> [55]).
import {
  COSMOS,
  ROLE,
  aura,
  buildBlockPoolRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  runPhase,
  txt,
  vvTouchAllocate,
  wireStepCues,
} from '../parts.mjs';

export default function poolStructures(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = op-0 preconstructed pool (12,41,73,90,55)
  // 1 = op-1 touch vs allocate intro
  // 2 = touch (unlink zero-ref 55 -> ref 1)
  // 3 = allocate (pop head 88 -> evict hash, ref 1)
  // 4 = op-2 toy queue [71, 55, 9]
  // 5 = touch-nine (9 leaves queue -> [71, 55], ref[9]=1)
  // 6 = allocate-head (pop 71 -> [55], ref[71]=1, old hash evicted)
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#5ce1e61e', '#6ee7b718');
  const rig3d = buildBlockPoolRig3d(step, phase, { x: 475, y: 20, unit: 90 });

  const title = heroTitle(['Separate Live Ownership', 'From Cached Content'], {
    x: -855,
    y: -425,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'BLOCK POOL · REFCOUNTS · HASH MAP · FREE QUEUE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const nodes = [
      txt('3D POOL + DOUBLY-LINKED FREE QUEUE', 475, -395, 26, ROLE.kv, 'mono').glow(5, ROLE.kv),
      txt('Zero refcount can still hold a cached hash', 475, 400, 26, COSMOS.gold, 'mono'),
    ];

    if (st === 0) {
      const slots = [
        ['Slot 12', 'ref = 2', 'hash: shared prefix', ROLE.good],
        ['Slot 41', 'ref = 1', 'hash: R0 suffix', ROLE.r0],
        ['Slot 73', 'ref = 1', 'hash: R1 suffix', ROLE.r1],
        ['Slot 90', 'ref = 1', 'no hash (partial)', COSMOS.gold],
        ['Slot 55', 'ref = 0', 'cached + IN FREE QUEUE', ROLE.kv],
      ];
      slots.forEach(([id, ref, desc, col], i) => {
        const cy = -210 + i * 102;
        nodes.push(
          glassCell(-420, cy, 860, 84, col, {
            fill: i === 4 ? '#0d2530' : '#10192b',
            glow: i === 4 ? 9 : 4,
          }),
          txt(id, -815, cy, 26, col, 'mono', 'left'),
          txt(ref, -590, cy, 26, COSMOS.ink, 'mono', 'left'),
          txt(desc, -20, cy, 26, COSMOS.muted, 'mono', 'right'),
        );
      });
    } else if (st <= 3) {
      const touched = st >= 2;
      const alloc = st >= 3;
      const qStr = alloc ? '[ empty ]' : touched ? '[ 88 ]' : '[ 55,  88 ]';
      nodes.push(
        glassCell(-420, -170, 860, 128, touched ? ROLE.good : ROLE.kv, {
          fill: touched ? '#0d2922' : '#101d30',
          glow: 8,
        }),
        txt(
          'PHYSICAL SLOT 55  (CACHE HIT)',
          -815,
          -200,
          26,
          touched ? ROLE.good : ROLE.kv,
          'mono',
          'left',
        ),
        txt(touched ? 'ref: 0 -> 1' : 'ref: 0', -20, -200, 28, COSMOS.gold, 'mono', 'right'),
        txt(
          touched
            ? 'Unlinked from free queue BEFORE allocation!'
            : 'Cached hash H55 · sitting in free queue',
          -815,
          -144,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),

        glassCell(-420, -10, 860, 128, alloc ? COSMOS.gold : ROLE.r0, {
          fill: alloc ? '#251e0e' : '#101d30',
          glow: 8,
        }),
        txt(
          'PHYSICAL SLOT 88  (QUEUE HEAD)',
          -815,
          -40,
          26,
          alloc ? COSMOS.gold : ROLE.r0,
          'mono',
          'left',
        ),
        txt(alloc ? 'ref: 0 -> 1' : 'ref: 0', -20, -40, 28, COSMOS.gold, 'mono', 'right'),
        txt(
          alloc ? 'Popped from head · old hash H88 evicted!' : 'Cached hash H88 · next to evict',
          -815,
          16,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ),

        glassCell(-420, 160, 860, 128, ROLE.kv, { fill: '#0d222e', glow: 9 }),
        txt('INTRUSIVE FREE QUEUE (HEAD -> TAIL)', -420, 128, 26, ROLE.kv, 'mono'),
        txt(qStr, -420, 184, 34, COSMOS.gold, 'mono'),
      );
    } else {
      const touch9 = st >= 5;
      const alloc71 = st >= 6;
      const stepRes = alloc71
        ? vvTouchAllocate([71, 55, 9], { 71: 0, 55: 0, 9: 0 }, 9, true)
        : touch9
          ? vvTouchAllocate([71, 55, 9], { 71: 0, 55: 0, 9: 0 }, 9, false)
          : { free: [71, 55, 9], refs: { 71: 0, 55: 0, 9: 0 } };

      const blocks = [71, 55, 9];
      blocks.forEach((id, i) => {
        const cx = -710 + i * 290;
        const r = stepRes.refs[id];
        const col = id === 9 && touch9 ? ROLE.good : id === 71 && alloc71 ? COSMOS.gold : ROLE.kv;
        nodes.push(
          glassCell(cx, -140, 265, 162, col, {
            fill: r > 0 ? '#12282a' : '#0f1a2c',
            glow: r > 0 ? 10 : 4,
          }),
          txt(`Block ${id}`, cx, -188, 28, col, 'mono'),
          txt(`ref = ${r}`, cx, -138, 30, COSMOS.ink, 'mono'),
          txt(
            id === 9
              ? touch9
                ? 'HIT (live)'
                : 'cached'
              : id === 71
                ? alloc71
                  ? 'ALLOCATED'
                  : 'head'
                : 'free',
            cx,
            -92,
            26,
            COSMOS.muted,
            'mono',
          ),
        );
      });

      nodes.push(
        glassCell(-420, 48, 860, 128, ROLE.good, { fill: '#0d2522', glow: 9 }),
        txt('FREE QUEUE (HEAD -> TAIL)', -420, 18, 26, ROLE.good, 'mono'),
        txt(`[ ${stepRes.free.join('  ,  ')} ]`, -420, 74, 36, COSMOS.gold, 'mono'),

        glassCell(-420, 212, 860, 118, COSMOS.gold, { fill: '#1f1a0f', glow: 7 }),
        txt(
          alloc71
            ? 'Alloc pops head 71 (evicts old hash) -> only 55 stays free!'
            : touch9
              ? 'Touch 9 unlinks it from queue -> [71, 55] left, ref[9] = 1'
              : 'Initial toy queue: [71, 55, 9] (all ref=0; slot 9 cached)',
          -420,
          212,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    }

    nodes.push(
      txt(
        'Request tables, refcounts, free queue & hash map must agree after every op',
        -855,
        368,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, rig3d.view, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d.view, { theta: -0.22, phi: 0.88 });
  wireStepCues(s, c, step, [
    ['vv-pool-structures-op-0', 0],
    ['vv-pool-structures-op-1', 1],
    ['vv-pool-structures-touch', 2, true],
    ['vv-pool-structures-allocate', 3, true],
    ['vv-pool-structures-op-2', 4],
    ['vv-pool-structures-touch-nine', 5, true],
    ['vv-pool-structures-allocate-head', 6, true],
  ]);
}
