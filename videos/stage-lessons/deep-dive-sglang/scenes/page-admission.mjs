// Scene 07: Check capacity and page alignment beyond the arithmetic budget (5 prompt tokens need 2 four-token pages; 1 free page blocks).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function pageAdmission(s, c) {
  const phase = s.value(0);
  // step: 0=PrefillAdder reserves decode -> 5 places pass arithmetic, 1=1 free page holds 4, 2=5th needs page 2 -> WAITS!
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#ff6b8b1a', '#5ce1e618');
  const title = heroTitle(['Budget Fits, Yet', 'Page Allocation Blocks'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.fail,
    eyebrow: 'PREFILL ADDER · KV PAGE ALIGNMENT & RESERVATIONS',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const blocked = st >= 2;
    const nodes = [];

    // Top row: Arithmetic budget PASS
    nodes.push(
      txt(
        '1. ARITHMETIC TOKEN BUDGET: 1 DECODE + 5 PROMPT = 6 (PASS)',
        0,
        -210,
        26,
        ROLE.decode,
        'mono',
      ),
    );
    ['dec', 'p0', 'p1', 'p2', 'p3', 'p4'].forEach((lbl, i) => {
      const cx = -575 + i * 230;
      nodes.push(
        glassCell(cx, -135, 204, 86, i === 0 ? ROLE.decode : ROLE.radix, {
          fill: i === 0 ? '#0d2922' : '#0f2336',
          glow: 8,
        }),
        txt(lbl, cx, -135, 30, COSMOS.ink, 'mono'),
      );
    });

    // Bottom row: Physical 4-token KV pages
    nodes.push(txt('2. PHYSICAL KV PAGES (4 POSITIONS / PAGE)', 0, -10, 26, COSMOS.gold, 'mono'));

    // Page 1 (free: 4 slots)
    nodes.push(
      glassCell(-420, 105, 760, 150, ROLE.radix, { fill: '#0e2234', glow: 8 }),
      txt('PAGE 1 (FREE · 4 SLOTS)', -420, 56, 26, ROLE.radix, 'mono'),
    );
    ['p0', 'p1', 'p2', 'p3'].forEach((lbl, i) => {
      const cx = -690 + i * 180;
      nodes.push(
        glassCell(cx, 128, 156, 70, ROLE.decode, { fill: '#0d2922', glow: 6 }),
        txt(lbl, cx, 128, 28, COSMOS.ink, 'mono'),
      );
    });

    // Page 2 (missing: p4 needs a second page!)
    nodes.push(
      glassCell(420, 105, 760, 150, blocked ? ROLE.fail : COSMOS.dim, {
        fill: blocked ? '#2b1020' : '#0b101d',
        glow: blocked ? 12 : 3,
      }),
      txt(
        blocked ? 'PAGE 2 NEEDED (0 FREE -> CHUNK WAITS!)' : 'PAGE 2 (UNAVAILABLE)',
        420,
        56,
        26,
        blocked ? ROLE.fail : COSMOS.muted,
        'mono',
      ),
    );
    ['p4', 'slack', 'slack', 'slack'].forEach((lbl, i) => {
      const cx = 150 + i * 180;
      const isP4 = i === 0;
      nodes.push(
        glassCell(cx, 128, 156, 70, blocked && isP4 ? ROLE.fail : COSMOS.dim, {
          fill: blocked && isP4 ? '#381326' : '#0a0f1c',
          glow: blocked && isP4 ? 10 : 1,
        }),
        txt(lbl, cx, 128, 26, blocked && isP4 ? ROLE.fail : COSMOS.dim, 'mono'),
      );
    });

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 255, { radius: 6, color: blocked ? ROLE.fail : ROLE.radix }),
      txt(
        blocked
          ? 'In an idle queue, check free KV pages, alignment, running-request caps, and output reservations.'
          : st >= 1
            ? 'One free KV page holds 4 positions; 5 prompt tokens require 2 pages (8 slots).'
            : 'In the pinned revision, mixed chunking starts disabled by default.',
        0,
        345,
        28,
        blocked ? ROLE.fail : COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['sg-page-admission-beat-0', 0],
    ['sg-page-admission-beat-1', 1],
    ['sg-budget-memory', 2, true],
  ]);
}
