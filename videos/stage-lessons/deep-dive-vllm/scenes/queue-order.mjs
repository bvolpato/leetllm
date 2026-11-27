// Scene 15: Which block gets used next? (R1 retires in reverse order [90, 73, 12]; partial 90 -> head, cached 73 & 12 -> tail; HOLD prediction -> pop 90, pop 73 & remove suffix hash, prefix 12 survives!).
import {
  COSMOS,
  QUEUE_RELEASE_RESULT,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

const BLOCK_META = {
  90: { tag: 'PARTIAL (NO HASH)', col: COSMOS.gold, origin: 'Head (recycle first)' },
  73: { tag: 'CACHED SUFFIX', col: ROLE.r1, origin: 'Tail (arrived 1st)' },
  12: { tag: 'CACHED PREFIX', col: ROLE.good, origin: 'Tail (arrived 2nd)' },
};

export default function queueOrder(s, c) {
  // step:
  // 0 = release-backward (R1 releases 90, 73, 12 in reverse order into free queue)
  // 1 = free-order (PREDICTION HOLD: Free queue = [90, 73, 12]; new request needs 2 blocks -> Which cached block is taken?)
  // 2 = take-partial (AFTER: take 90 first from head)
  // 3 = take-suffix (AFTER: take 73 next)
  // 4 = remove-hash (AFTER: evict 73's old suffix hash before writing)
  // 5 = prefix (AFTER: slot 12 stays in free queue with prefix hash intact!)
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61c', '#6ee7b716');
  const title = heroTitle(['Reverse Release &', 'Suffix-First LRU Eviction'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'FREE QUEUE ORDER · PARTIAL AT HEAD · CACHED AT TAIL',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const queue = QUEUE_RELEASE_RESULT.free; // [90, 73, 12]
    const took90 = st >= 2;
    const took73 = st >= 3;
    const hash73Gone = st >= 4;
    const nodes = [];

    // Top row: R1 retired table + R2 still live on 41
    nodes.push(
      glassCell(-430, -210, 820, 108, ROLE.r1, { fill: '#19142e', glow: 6 }),
      txt('R1 RETIRED (RELEASED REVERSE: 90 -> 73 -> 12)', -430, -234, 26, ROLE.r1, 'mono'),
      txt('Original table: [ 12, 73, 90 ]  ->  all refs = 0', -430, -184, 26, COSMOS.muted, 'mono'),

      glassCell(430, -210, 820, 108, ROLE.r0, { fill: '#101f38', glow: 6 }),
      txt('R2 LIVE REQUEST (PROTECTED)', 430, -234, 26, ROLE.r0, 'mono'),
      txt('Slot 41 | ref = 1 (stays out of free queue)', 430, -184, 26, COSMOS.ink, 'mono'),
    );

    // Middle row: Doubly-linked Free Queue (HEAD -> TAIL)
    nodes.push(
      txt('FREE QUEUE (HEAD -> TAIL)', -855, -88, 26, ROLE.kv, 'mono', 'left'),
      txt(
        took73
          ? 'REMAINING IN QUEUE: [ 12 ]'
          : took90
            ? 'REMAINING IN QUEUE: [ 73, 12 ]'
            : 'QUEUE ORDER: [ 90, 73, 12 ]',
        855,
        -88,
        26,
        COSMOS.gold,
        'mono',
        'right',
      ),
    );

    queue.forEach((slotId, i) => {
      const cx = -570 + i * 570;
      const meta = BLOCK_META[slotId];
      const taken = (slotId === 90 && took90) || (slotId === 73 && took73);
      const isSurviving12 = slotId === 12 && st >= 5;
      const cy = taken ? 210 : 12;
      const stroke = isSurviving12 ? ROLE.good : taken ? ROLE.good : meta.col;
      const fill = isSurviving12 ? '#0d2c24' : taken ? '#0f2822' : '#101b2e';

      let status = meta.origin;
      if (slotId === 90 && took90) status = 'ALLOCATED #1 (fresh space)';
      if (slotId === 73 && took73)
        status = hash73Gone ? 'ALLOCATED #2 (hash evicted)' : 'ALLOCATED #2 (popped)';
      if (slotId === 12 && st >= 5) status = 'SURVIVES · prefix hash intact!';

      nodes.push(
        glassCell(cx, cy, 520, 124, stroke, { fill, glow: taken || isSurviving12 ? 10 : 6 }),
        txt(`SLOT ${slotId}   (${meta.tag})`, cx, cy - 28, 26, stroke, 'mono'),
        txt(status, cx, cy + 22, 26, COSMOS.ink, 'sans'),
      );
    });

    // Label for New Request allocation row
    if (st >= 2) {
      nodes.push(
        txt(
          'NEW REQUEST ALLOCATED BLOCKS (2 FRESH BLOCKS)',
          -855,
          114,
          26,
          ROLE.good,
          'mono',
          'left',
        ),
      );
    } else {
      nodes.push(
        glassCell(0, 205, 1660, 106, st === 1 ? COSMOS.gold : COSMOS.dim, {
          fill: st === 1 ? '#241d0e' : '#0b101d',
          glow: st === 1 ? 8 : 2,
        }),
        txt(
          st === 1
            ? 'NEW REQUEST NEEDS 2 FRESH BLOCKS: Partial 90 goes first. Which cached block is taken second?'
            : 'Partial block (no hash) prepends to HEAD; cached blocks append to TAIL (suffix before prefix)',
          0,
          205,
          26,
          st === 1 ? COSMOS.gold : COSMOS.muted,
          'sans',
        ),
      );
    }

    const caption =
      st >= 5
        ? 'Slot 12 stays at the tail with its prefix hash intact for future prompts!'
        : st === 4
          ? 'Evict slot 73 hash'
          : st === 3
            ? 'Pop next: slot 73'
            : st === 2
              ? 'Pop head: slot 90'
              : st === 1
                ? 'Predict: Which cached block (73 or 12) will the new request take?'
                : 'R1 releases blocks backward: 90 -> head, then 73 -> tail, then 12 -> tail';

    nodes.push(
      txt(caption, 0, 378, 26, st === 1 ? COSMOS.gold : st >= 5 ? ROLE.good : COSMOS.ink, 'sans'),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['vv-queue-order-release-backward', 0],
    ['vv-queue-order-free-order', 1],
    ['vv-queue-order-take-partial', 2, true],
    ['vv-queue-order-take-suffix', 3, true],
    ['vv-queue-order-remove-hash', 4, true],
    ['vv-queue-order-prefix', 5, true],
  ]);
}
