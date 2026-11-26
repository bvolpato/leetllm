// Scene 22: bridge: Token-wise widening (4x2 -> 4x4) vs 2x2 raster pack (1x8 reversible) -> learned projection (1 slot).
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function bridge(s, c) {
  const showWiden = s.value(0);
  const showPack = s.value(0);
  const showProject = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#25184422');
  const title = heroTitle(['Where Did the Four', 'Patch States Go?'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.bridge,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const wd = showWiden.value;
    const pk = showPack.value;
    const pr = showProject.value;

    const nodes = [
      // Left: 2x2 patch neighborhood [A, B; C, D]
      txt('2 x 2 PATCH STATES', -740, -205, 26, ROLE.patch, 'mono', 'center').opacity(alpha),
      rect(115, 95, { fill: '#12304c', stroke: ROLE.patch, width: 2.6, radius: 10 })
        .at(-800, -90)
        .opacity(alpha),
      txt('A (2d)', -800, -90, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      rect(115, 95, { fill: '#12304c', stroke: ROLE.patch, width: 2.6, radius: 10 })
        .at(-675, -90)
        .opacity(alpha),
      txt('B (2d)', -675, -90, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      rect(115, 95, { fill: '#12304c', stroke: ROLE.patch, width: 2.6, radius: 10 })
        .at(-800, 15)
        .opacity(alpha),
      txt('C (2d)', -800, 15, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      rect(115, 95, { fill: '#12304c', stroke: ROLE.patch, width: 2.6, radius: 10 })
        .at(-675, 15)
        .opacity(alpha),
      txt('D (2d)', -675, 15, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),

      // Top lane: Token-wise linear widening (4 slots x 2 -> 4 slots x 4)
      txt(
        '1. TOKEN-WISE BRIDGE: 4 SLOTS PRESERVED',
        -475,
        -205,
        26,
        ROLE.patch,
        'mono',
        'left',
      ).opacity(alpha * (0.45 + 0.55 * wd)),
      arrow([-605, -105], [-495, -125], { stroke: ROLE.patch, width: 3.2, head: 12 }).opacity(
        alpha * (0.4 + 0.6 * wd),
      ),
      chipPill('A -> 4 coords', -340, -145, {
        w: 280,
        h: 52,
        color: ROLE.patch,
        size: 26,
        opacity: alpha * (0.35 + 0.65 * wd),
      }),
      chipPill('B -> 4 coords', -40, -145, {
        w: 280,
        h: 52,
        color: ROLE.patch,
        size: 26,
        opacity: alpha * (0.35 + 0.65 * wd),
      }),
      chipPill('C -> 4 coords', 260, -145, {
        w: 280,
        h: 52,
        color: ROLE.patch,
        size: 26,
        opacity: alpha * (0.35 + 0.65 * wd),
      }),
      chipPill('D -> 4 coords', 560, -145, {
        w: 280,
        h: 52,
        color: ROLE.patch,
        size: 26,
        opacity: alpha * (0.35 + 0.65 * wd),
      }),
      txt('Still 4 rows in the LLM prefix', -475, -78, 26, COSMOS.muted, 'sans', 'left').opacity(
        alpha * (0.35 + 0.65 * wd),
      ),

      // Bottom lane: 2x2 raster packing (reversible) -> Learned projection (1 slot)
      txt(
        '2. SPATIAL PACKING (REVERSIBLE) -> PROJECT TO 1 SLOT',
        -475,
        15,
        26,
        ROLE.pos,
        'mono',
        'left',
      ).opacity(alpha * (0.35 + 0.65 * pk)),
      arrow([-605, 40], [-485, 100], { stroke: ROLE.pos, width: 3.2, head: 12 }).opacity(
        alpha * (0.35 + 0.65 * pk),
      ),
      chipPill('[ A | B | C | D ]  (1x8)', -190, 100, {
        w: 520,
        h: 72,
        color: pk > 0.3 ? ROLE.pos : COSMOS.rule,
        size: 28,
        glow: pk > 0.3 ? 8 : 0,
        opacity: alpha * (0.3 + 0.7 * pk),
      }),
      arrow([95, 100], [190, 100], { stroke: ROLE.ok, width: 3.5, head: 12 }).opacity(
        alpha * (0.28 + 0.72 * pr),
      ),
      chipPill('1 Language Slot (projected)', 490, 100, {
        w: 560,
        h: 76,
        color: pr > 0.3 ? ROLE.ok : COSMOS.rule,
        fill: pr > 0.3 ? '#0f2d24' : '#10182d',
        size: 28,
        glow: pr > 0.3 ? 12 : 0,
        opacity: alpha * (0.28 + 0.72 * pr),
      }),

      txt(
        pr > 0.3
          ? 'Packing rearranges losslessly; compare values on BOTH sides of projection to find where detail disappeared'
          : 'Packing keeps all 8 coordinates side-by-side before the learned projection runs',
        0,
        285,
        26,
        pr > 0.3 ? ROLE.ok : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'bridge-width', (d) => s.play(showWiden.to(1, { duration: d })));
  playCue(s, c, 'bridge-pack', (d) => s.play(showPack.to(1, { duration: d })));
  playCue(s, c, 'bridge-project', (d) => s.play(showProject.to(1, { duration: d })));
}
