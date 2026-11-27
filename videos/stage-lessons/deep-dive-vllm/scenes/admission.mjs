// Scene 16: Does this particular slice fit? (4 step places, 1 cell left in current block: 2 inputs + 0 free blocks -> WAIT; 2 inputs + 1 free block -> ADMITTED; 5 inputs + 1 free block -> WAIT on step budget!).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  sampleModel,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function admission(s, c) {
  // step:
  // 0 = admission-two (propose 2 inputs, 0 free blocks -> 2nd lacks block -> WAIT)
  // 1 = admission-release (release 1 block -> 2 inputs fit both step & KV -> ADMITTED)
  // 2 = admission-bigger (propose 5 inputs, keep 1 free block)
  // 3 = admission-five (place all 5 -> fits KV, overflows 4-slot step -> WAIT)
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1a', '#5ce1e61a');
  const title = heroTitle(['Does This Particular', 'Slice Fit Both Gates?'], {
    x: -855,
    y: -446,
    size: 52,
    lineHeight: 60,
    accent: ROLE.kv,
    eyebrow: 'DUAL-GATE ADMISSION · STEP BUDGET (4) + KV BLOCK STORAGE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const modeIdx = st >= 2 ? 2 : st === 1 ? 1 : 0;
    const m = sampleModel('admission', { beat: modeIdx, beatP: 0 });
    const placed = st >= 3 ? 5 : st === 2 ? 0 : 2;
    const nodes = [];

    // Header summary
    nodes.push(
      glassCell(0, -228, 1710, 68, COSMOS.gold, { fill: '#1c1810', glow: 6 }),
      txt(
        `PROPOSAL: ${m.requestedTokens} INPUTS  |  STEP ROOM: ${m.remainingTokens}  |  FREE BLOCKS: ${m.freeBlocks}  (1 CELL LEFT IN CURRENT BLOCK)`,
        0,
        -228,
        26,
        COSMOS.gold,
        'mono',
      ),
    );

    // Gate 1: Step Token Budget (4 available slots + overflow slot if 5 placed)
    nodes.push(
      txt(
        'GATE 1: STEP TOKEN BUDGET (4 PLACES AVAILABLE)',
        -855,
        -154,
        26,
        ROLE.r0,
        'mono',
        'left',
      ),
    );
    const sw = 260;
    const sg = 22;
    const slotCount = placed > 4 ? 5 : 4;
    for (let i = 0; i < slotCount; i++) {
      const cx = -855 + sw * 0.5 + i * (sw + sg);
      const overflow = i >= 4;
      const filled = i < placed;
      const col = overflow ? ROLE.bad : filled ? ROLE.r0 : COSMOS.dim;
      nodes.push(
        glassCell(cx, -80, sw, 86, col, {
          fill: overflow ? '#2d1220' : filled ? '#112440' : '#0b101d',
          glow: overflow || filled ? 8 : 2,
        }),
        txt(
          overflow ? '+5 (OVER CAP)' : filled ? `input +${i + 1}` : `slot ${i + 1}`,
          cx,
          -80,
          26,
          overflow ? ROLE.bad : filled ? COSMOS.ink : COSMOS.dim,
          'mono',
        ),
      );
    }

    // Gate 2: KV Storage (Current block: 3 used + 1 free; New block: 4 cells backed only if freeBlocks > 0)
    nodes.push(
      txt('GATE 2: KV BLOCK STORAGE', -855, 22, 26, ROLE.kv, 'mono', 'left'),
      txt('EXISTING BLOCK (1 FREE)', -500, 62, 26, ROLE.kv, 'mono'),
      txt(
        m.freeBlocks > 0 ? 'NEW FREE BLOCK (4 CELLS READY)' : 'NO FREE BLOCK AVAILABLE (0 FREE)',
        365,
        62,
        26,
        m.freeBlocks > 0 ? ROLE.good : ROLE.bad,
        'mono',
      ),
    );
    const kw = 178;
    const kg = 14;
    for (let i = 0; i < 8; i++) {
      const blockGap = i >= 4 ? 85 : 0;
      const cx = -855 + kw * 0.5 + i * (kw + kg) + blockGap;
      const isExistingUsed = i < 3;
      const newIdx = i - 3; // 0..4
      const assigned = !isExistingUsed && newIdx < placed;
      const backed = i < 4 || m.freeBlocks > 0;
      const blockedCell = assigned && !backed;

      let label = 'empty';
      if (isExistingUsed) label = 'used';
      else if (assigned) label = blockedCell ? `+${newIdx + 1} (NO BLK)` : `+${newIdx + 1}`;
      else if (!backed) label = 'locked';

      const col = blockedCell
        ? ROLE.bad
        : isExistingUsed
          ? ROLE.r0
          : assigned
            ? ROLE.good
            : backed
              ? ROLE.kv
              : COSMOS.dim;
      const fill = blockedCell
        ? '#2d1220'
        : assigned
          ? '#0e2922'
          : isExistingUsed
            ? '#101f38'
            : '#0b101d';
      nodes.push(
        glassCell(cx, 134, kw, 84, col, { fill, glow: blockedCell || assigned ? 9 : 3 }),
        txt(label, cx, 134, 26, blockedCell ? ROLE.bad : assigned ? ROLE.good : COSMOS.ink, 'mono'),
      );
    }

    // Verdict banner
    const vCol = st === 2 ? COSMOS.gold : m.admitted ? ROLE.good : ROLE.bad;
    const vText =
      st === 0
        ? 'WAIT: 2 inputs fit the step, but input +2 has no backing KV block!'
        : st === 1
          ? 'ADMITTED: Releasing 1 block backs input +2 -> both step & KV gates pass!'
          : st === 2
            ? 'Testing 5-input proposal with 1 free block available...'
            : 'WAIT: All 5 fit in KV (1 + 4), but input +5 exceeds the 4-slot step budget!';

    nodes.push(
      glassCell(0, 264, 1710, 88, vCol, {
        fill: m.admitted && st === 1 ? '#0d2922' : st === 2 ? '#231c0e' : '#2a1220',
        glow: 10,
      }),
      txt(vText, 0, 264, 28, vCol, 'mono'),
    );

    nodes.push(
      txt(
        'Compare proposal demand against BOTH step budget & KV blocks at the exact same attempt',
        0,
        388,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['admission-two', 0, true],
    ['admission-release', 1, true],
    ['admission-bigger', 2],
    ['admission-five', 3, true],
  ]);
}
