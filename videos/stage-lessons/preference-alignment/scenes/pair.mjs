// Scene 02: What travels with the vote? (Replies swap on opposing arcs; preference travels with content, not column)
import {
  COSMOS,
  ROUTE_FIXTURE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  pairLayout,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function pair(s, c) {
  const phase = s.value(0);
  const showPrompt = s.value(0);
  const swapProg = s.value(0);

  const bgAura = aura(0, 40, 620, '#14385c26', '#2d1c4a18');
  const title = heroTitle(['What Travels', 'With the Vote?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'PAIRWISE DATA CONTRACT · ANSWER IDENTITY vs COLUMN ORDER',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const sp = Math.max(0.7, showPrompt.value);
    const sw = swapProg.value;

    // Map pairLayout(sw) into 1920x1080 centered coordinates with >= 80px clearance throughout crossing
    const lay = pairLayout(sw);
    const normX = (lay.preferredX - 680) / 400; // -1 -> +1
    const normLift = (600 - lay.preferredY) / 130; // 0 -> 1 -> 0
    const aX = normX * 510; // -510 -> +510
    const bX = -normX * 510; // +510 -> -510
    const aY = 110 - normLift * 168; // arcs UP to -58
    const bY = 110 + normLift * 168; // arcs DOWN to +278

    const nodes = [
      // Fixed prompt anchor at top right/center
      glassCell(320, -315, 920, 114, COSMOS.cyan, {
        fill: '#0f2138',
        glow: 7 * pulse,
        opacity: sp,
      }),
      txt('FIXED PROMPT x', 320, -342, 26, COSMOS.cyan, 'mono').opacity(sp),
      txt(`"${ROUTE_FIXTURE.request}"`, 320, -292, 30, COSMOS.ink, 'sans').opacity(sp),

      // Column position markers (fixed on canvas so viewer sees the swap)
      txt('LEFT COLUMN', -510, -182, 26, COSMOS.dim, 'mono'),
      txt('RIGHT COLUMN', 510, -182, 26, COSMOS.dim, 'mono'),
      line([-510, -152], [-510, -138], { stroke: COSMOS.rule, width: 2.2 }),
      line([510, -152], [510, -138], { stroke: COSMOS.rule, width: 2.2 }),

      // Moving Reply B (detour)
      glassCell(bX, bY, 520, 144, COSMOS.rose, {
        fill: '#28101a',
        glow: 6,
      }),
      txt('REPLY B (DETOUR)', bX, bY - 40, 26, COSMOS.rose, 'mono'),
      txt('Past park & river -> loop back', bX, bY + 4, 26, COSMOS.ink, 'sans'),
      txt('rejected y_l', bX, bY + 44, 26, COSMOS.muted, 'mono'),

      // Moving Reply A (preferred) with attached gold VOTE badge
      glassCell(aX, aY, 520, 144, COSMOS.emerald, {
        fill: '#0e2824',
        glow: 10 * pulse,
      }),
      txt('REPLY A (TWO TURNS)', aX, aY - 40, 26, COSMOS.emerald, 'mono'),
      txt('Left at entrance -> right at cafe', aX, aY + 4, 26, COSMOS.ink, 'sans'),
      txt('chosen y_w · VOTE FOLLOWS', aX, aY + 44, 26, COSMOS.gold, 'mono').glow(5, COSMOS.gold),
      glowDot(aX + 225, aY - 40, { radius: 8, color: COSMOS.gold, glow: 13 }),

      // Bottom invariant readout
      txt(
        sw > 0.75
          ? 'RECORD STILL READS (x, y_w = A, y_l = B)  ·  BLIND POSITION SWAPS PRESERVE TRUTH'
          : 'A preference tuple stores (prompt x, chosen y_w, rejected y_l), never column index',
        0,
        408,
        28,
        sw > 0.75 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('pair-prompt', () =>
    s.play(showPrompt.to(1, { duration: remainDuration(c, 'pair-prompt', 0.55) })),
  );
  c.on('pair-swap', () =>
    s.play(swapProg.to(1, { duration: remainDuration(c, 'pair-swap', 1.75) })),
  );
}
