// Scene 12: Release a live KV owner after its last reader (Client cancels during forward pass -> wait for pending GPU reader -> release -> reclaim).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function cacheReclamation(s, c) {
  const phase = s.value(0);
  // step: 0=insert suffix & lock ancestors, 1=R0 done & R1 GPU reader pending (blocked),
  // 2=R1 GPU reader completes, 3=R1 releases reference (eligible), 4=policy reclaims segment
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#ffd16618', '#6ee7b71a');
  const title = heroTitle(['Wait for the Last', 'GPU Reader Before Free'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.decode,
    eyebrow: 'GPU LIFETIME SAFETY · CANCELLATION VS DEVICE READ',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const readerDone = st >= 2;
    const released = st >= 3;
    const reclaimed = st >= 4;
    const nodes = [];

    // Owner status row
    nodes.push(
      glassCell(-430, -170, 660, 96, st >= 1 ? COSMOS.dim : ROLE.radix, {
        fill: st >= 1 ? '#0b101d' : '#0f2336',
        glow: st >= 1 ? 2 : 7,
      }),
      txt(
        st >= 1 ? 'R0 · completed & released' : 'R0 · active prefix owner',
        -430,
        -170,
        28,
        st >= 1 ? COSMOS.muted : ROLE.radix,
        'mono',
      ),

      glassCell(430, -170, 660, 96, released ? COSMOS.dim : COSMOS.gold, {
        fill: released ? '#0b101d' : '#221c10',
        glow: released ? 2 : 10,
      }),
      txt(
        released ? 'R1 · reference released' : 'R1 · client cancelled (lock held)',
        430,
        -170,
        28,
        released ? COSMOS.muted : COSMOS.gold,
        'mono',
      ),
    );

    // Physical KV locations [12, 13, 14, 15] -> free
    const labels = reclaimed
      ? ['free', 'free', 'free', 'free']
      : ['KV 12', 'KV 13', 'KV 14', 'KV 15'];
    labels.forEach((lbl, i) => {
      const cx = -495 + i * 330;
      const col = reclaimed ? ROLE.decode : released ? ROLE.radix : COSMOS.gold;
      nodes.push(
        glassCell(cx, -20, 290, 108, col, {
          fill: reclaimed ? '#0d2922' : released ? '#0e2436' : '#1b1a14',
          glow: 9,
        }),
        txt(lbl, cx, -20, 34, reclaimed ? ROLE.decode : COSMOS.ink, 'mono'),
      );
    });

    // GPU reader progress bar
    const barW = 1320;
    const fillW = readerDone ? barW : st >= 1 ? barW * 0.58 : barW * 0.25;
    nodes.push(
      txt('R1 OUTSTANDING GPU KERNEL READER', -660, 92, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        readerDone ? 'COMPLETED' : 'IN FLIGHT ON GPU',
        660,
        92,
        26,
        readerDone ? ROLE.decode : COSMOS.gold,
        'mono',
        'right',
      ),
      rect(barW, 32, { fill: '#0b1220', stroke: '#334155', width: 2, radius: 8 }).at(0, 136),
      rect(fillW, 28, {
        fill: readerDone ? ROLE.decode : COSMOS.gold,
        stroke: null,
        radius: 6,
      }).at(-barW / 2 + fillW / 2, 136),
    );

    // Eviction gate state
    const gateCol = reclaimed ? ROLE.decode : released ? ROLE.radix : ROLE.fail;
    const gateTxt = reclaimed
      ? 'RECLAIMED BY EVICTION POLICY (SAFE)'
      : released
        ? 'ELIGIBLE FOR EVICTION (REFCOUNT = 0)'
        : 'EVICTION BLOCKED: GPU READER STILL PENDING';
    nodes.push(
      glassCell(0, 238, 1320, 88, gateCol, {
        fill: reclaimed ? '#0d2922' : released ? '#0e2436' : '#2a1220',
        glow: 10,
      }),
      txt(gateTxt, 0, 238, 28, gateCol, 'mono'),
    );

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-660 + u * 1320, 136, { radius: 6, color: readerDone ? ROLE.decode : COSMOS.gold }),
      txt(
        reclaimed
          ? 'Release early -> corrupts live KV. Forget to release -> starves KV while GPU sits idle.'
          : released
            ? 'Reader done + R1 released -> eligible now.'
            : 'Client cancellation cannot free slots while a GPU forward pass is still reading them.',
        0,
        355,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['sg-cache-reclamation-beat-0', 0],
    ['sg-cache-reclamation-beat-1', 1],
    ['sg-reader-pending', 1],
    ['sg-reader-complete', 2, true],
    ['sg-owner-release', 3, true],
    ['sg-reclaim', 4, true],
  ]);
}
