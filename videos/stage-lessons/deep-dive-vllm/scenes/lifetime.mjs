// Scene 14: Four physical slots, three requests (Slots 12,41,73,90; HOLD prediction on lifetime-choice -> R0 finishes -> 12 ref 2->1, 41 ref 1->0 joins free queue with hash intact -> pop 41, clear hash, write R2 "Rain").
import {
  COSMOS,
  R0_WORDS,
  R1_WORDS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  references,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

const SLOTS = [
  { id: 12, words: R0_WORDS.slice(0, 4) },
  { id: 41, words: R0_WORDS.slice(4, 8) },
  { id: 73, words: R1_WORDS.slice(4, 8) },
  { id: 90, words: R1_WORDS.slice(8, 9) },
];

export default function lifetime(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = lifetime-readers (slot 12 has R0+R1 = ref 2; 41=R0; 73,90=R1; free queue empty)
  // 1 = lifetime-choice (PREDICTION HOLD: When R0 finishes, which slot can R2 take?)
  // 2 = lifetime-retire-r0 (AFTER: R0 retired -> 12 ref=1, 41 ref=0 joins free queue!)
  // 3 = lifetime-retained (AFTER: words & prefix index in 41 still intact!)
  // 4 = lifetime-pop (AFTER: pop 41 off free queue)
  // 5 = lifetime-remove-old-hash (AFTER: remove 41's old entry from prefix index)
  // 6 = lifetime-assign-live-reference (AFTER: give R2 slot 41, write "Rain", ref=1)
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#5ce1e61c', '#6ee7b716');
  const title = heroTitle(['Four Physical Slots,', 'Three Requests'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.kv,
    eyebrow: 'BLOCK LIFECYCLE · REFCOUNTS · FREE QUEUE · HASH EVICTION',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const retired = st >= 2;
    const popped = st >= 4;
    const hashCleared = st >= 5;
    const r2Owned = st >= 6;
    const inFreeQueue = retired && !popped;

    const tables = {
      ...(retired ? {} : { R0: [12, 41] }),
      R1: [12, 73, 90],
      ...(r2Owned ? { R2: [41] } : {}),
    };
    const refs = references(tables);

    const nodes = [
      txt('SLOT', -820, -270, 26, COSMOS.muted, 'mono', 'left'),
      txt('CACHED TOKENS (4 CELLS)', -390, -270, 26, COSMOS.muted, 'mono'),
      txt('LIVE READERS', 340, -270, 26, COSMOS.muted, 'mono'),
      txt('REFS', 770, -270, 26, COSMOS.muted, 'mono'),
    ];

    SLOTS.forEach(({ id, words }, idx) => {
      const cy = -190 + idx * 112;
      const refCount = refs.get(id) ?? 0;
      const is41 = id === 41;
      const payload = is41 && r2Owned ? ['Rain'] : words;
      const isGhost41 = is41 && retired && !r2Owned;

      nodes.push(
        glassCell(-790, cy, 130, 86, is41 && retired ? COSMOS.gold : ROLE.kv, {
          fill: is41 && retired ? '#261e0e' : '#0f1c30',
          glow: is41 && retired ? 10 : 4,
        }),
        txt(String(id), -790, cy, 34, is41 && retired ? COSMOS.gold : COSMOS.ink, 'mono'),
      );

      // 4 token cells
      for (let j = 0; j < 4; j++) {
        const cx = -610 + j * 164;
        const w = payload[j] ?? '';
        const stroke = is41 && r2Owned && j === 0 ? ROLE.good : isGhost41 ? COSMOS.dim : ROLE.kv;
        const fill = is41 && r2Owned && j === 0 ? '#0d2b24' : isGhost41 ? '#0c111e' : '#0e202c';
        nodes.push(
          glassCell(cx, cy, 152, 82, stroke, { fill, glow: is41 && r2Owned && j === 0 ? 10 : 3 }),
          txt(
            w,
            cx,
            cy,
            26,
            isGhost41 ? COSMOS.muted : is41 && r2Owned ? ROLE.good : COSMOS.ink,
            'mono',
          ),
        );
      }

      // Live reader chips
      const readers = Object.entries(tables)
        .filter(([, t]) => t.includes(id))
        .map(([who]) => who);
      if (readers.length === 0) {
        nodes.push(
          glassCell(340, cy, 340, 76, COSMOS.gold, { fill: '#221b0e', glow: 7 }),
          txt(inFreeQueue ? 'IN FREE QUEUE' : 'ALLOCATING -> R2', 340, cy, 26, COSMOS.gold, 'mono'),
        );
      } else {
        readers.forEach((who, ri) => {
          const rx = readers.length === 1 ? 340 : 250 + ri * 180;
          const rCol = who === 'R0' ? ROLE.r0 : who === 'R1' ? ROLE.r1 : ROLE.good;
          nodes.push(
            glassCell(rx, cy, 150, 72, rCol, { fill: '#121f36', glow: 7 }),
            txt(who, rx, cy, 28, rCol, 'mono'),
          );
        });
      }

      // Refcount
      nodes.push(
        glassCell(770, cy, 120, 82, refCount === 0 ? ROLE.good : ROLE.kv, {
          fill: refCount === 0 ? '#0e2922' : '#0f1c30',
          glow: refCount === 0 ? 10 : 4,
        }),
        txt(String(refCount), 770, cy, 36, refCount === 0 ? ROLE.good : COSMOS.ink, 'mono'),
      );
    });

    // Bottom pool status strip: Free Queue + Prefix Index + R2 Status
    nodes.push(
      glassCell(-555, 255, 570, 86, inFreeQueue ? ROLE.good : COSMOS.dim, {
        fill: inFreeQueue ? '#0e2824' : '#0b101d',
        glow: inFreeQueue ? 9 : 3,
      }),
      txt(
        `FREE QUEUE:  ${inFreeQueue ? '[ 41 ]' : '[ empty ]'}`,
        -555,
        255,
        28,
        inFreeQueue ? ROLE.good : COSMOS.muted,
        'mono',
      ),

      glassCell(35, 255, 550, 86, hashCleared ? COSMOS.gold : ROLE.kv, {
        fill: hashCleared ? '#241c0e' : '#0e202c',
        glow: 7,
      }),
      txt(
        `SLOT 41 PREFIX INDEX:  ${hashCleared ? 'EVICTED' : 'ACTIVE'}`,
        35,
        255,
        28,
        hashCleared ? COSMOS.gold : ROLE.kv,
        'mono',
      ),

      glassCell(595, 255, 510, 86, r2Owned ? ROLE.good : ROLE.r1, {
        fill: r2Owned ? '#0e2924' : '#18142c',
        glow: r2Owned ? 10 : 4,
      }),
      txt(
        r2Owned ? 'R2 OWNS SLOT 41 ("Rain")' : 'R2 NEEDS 1 BLOCK',
        595,
        255,
        28,
        r2Owned ? ROLE.good : COSMOS.ink,
        'mono',
      ),
    );

    const caption =
      st >= 6
        ? 'Slot 41 keeps its address while its words ("Rain") & owner (R2) change; R1 still reads 12, 73, 90'
        : st === 5
          ? 'Old prefix-index entry for slot 41 removed before overwrite'
          : st === 4
            ? 'Allocator pops slot 41 off the free queue for R2'
            : st === 3
              ? 'Slot 41 still holds its words & prefix-index entry until an allocator overwrites it'
              : st === 2
                ? 'R0 retired: slot 12 drops 2 -> 1 (R1 still live); slot 41 drops 1 -> 0 & joins free queue'
                : st === 1
                  ? 'Predict: Free queue is empty now. When R0 finishes, which physical slot can R2 take?'
                  : 'Slot 12 has 2 live readers (R0 & R1); slot 41 has only R0; slots 73 & 90 serve R1';

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-780 + u * 1560, 330, { radius: 6, color: st >= 6 ? ROLE.good : COSMOS.gold }),
      txt(caption, 0, 385, 26, st === 1 ? COSMOS.gold : st >= 6 ? ROLE.good : COSMOS.ink, 'sans'),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['lifetime-readers', 0],
    ['lifetime-choice', 1],
    ['lifetime-retire-r0', 2, true],
    ['lifetime-retained', 3, true],
    ['lifetime-pop', 4, true],
    ['lifetime-remove-old-hash', 5, true],
    ['lifetime-assign-live-reference', 6, true],
  ]);
}
