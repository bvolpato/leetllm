// Scene 23: Keep a common reference while reducing exponential overhead: FA4 Blackwell conditional rescaling.
import {
  COSMOS,
  aura,
  glowDot,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  rule,
  txt,
} from '../parts.mjs';

const OLD_M = 2;
const OLD_L = 2;
const OLD_N = 10;
const NEW_S = 2.2;
const NEW_V = -3;
const KEEP_RATIO = (OLD_N + Math.exp(NEW_S - OLD_M) * NEW_V) / (OLD_L + Math.exp(NEW_S - OLD_M));
const RESCALE_RATIO =
  (OLD_N * Math.exp(OLD_M - NEW_S) + NEW_V) / (OLD_L * Math.exp(OLD_M - NEW_S) + 1);
const BAD_RATIO = (OLD_N + NEW_V) / (OLD_L + 1);

export default function blackwellReference(s, c) {
  const showDesign = s.value(0.5);
  const showCond = s.value(0);
  const showBad = s.value(0);
  const showCute = s.value(0);
  const showSweep = s.value(0);

  const bgAura = aura(0, 20, 560, '#5ce1e620', '#ffd16618');
  const title = heroTitle(['Blackwell &', 'Conditional Rescale'], {
    x: -855,
    y: -410,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'FLASHATTENTION-4 · COMMON REFERENCE RULE',
  });

  const eqKeep = glowTex(
    String.raw`m = 2 \;\Rightarrow\; \ell = 2 + e^{0.2},\quad N = 10 - 3e^{0.2}`,
    {
      x: 315,
      y: -355,
      size: 32,
      color: COSMOS.cyan,
    },
  );

  const live = guardedDynamic(1, () => {
    const ds = showDesign.value;
    const cd = showCond.value;
    const bd = showBad.value;
    const ct = showCute.value;
    const sw = showSweep.value;

    // Visual 3-branch flow from left state (m=2, ℓ=2, N=10 + new s=2.2, v=-3) -> right ratio ruler!
    const xStart = -470;
    const xEnd = 360;
    const yA = -180;
    const yB = -20;
    const yC = 135;

    const nodes = [
      // Left source state (floating mono, zero card border)
      txt('STATE + NEW KEY', -855, -145, 26, COSMOS.muted, 'mono', 'left').opacity(
        Math.max(0.5, ds),
      ),
      txt('m = 2 · ℓ = 2 · N = 10', -855, -88, 28, COSMOS.cyan, 'mono', 'left').opacity(
        Math.max(0.5, ds),
      ),
      txt('new s = 2.2 · v = −3', -855, -36, 28, COSMOS.gold, 'mono', 'left').opacity(
        Math.max(0.5, ds),
      ),
      glowDot(xStart, yB, { radius: 9, color: COSMOS.gold }),

      // Branch A: Keep m = 2 -> exp(+0.2) -> 1.9571
      glowingArc([xStart, yB], [xEnd, yA], -75, {
        color: COSMOS.emerald,
        width: 3.6,
        opacity: Math.max(0.45, cd),
      }),
      txt('A. Keep m = 2 · new wt = e⁺⁰·²', 20, yA - 36, 26, COSMOS.emerald, 'mono').opacity(
        Math.max(0.45, cd),
      ),
      glowDot(xEnd, yA, { radius: 9, color: COSMOS.emerald, opacity: Math.max(0.45, cd) }),
      txt(`${KEEP_RATIO.toFixed(4)}  (EXACT)`, xEnd + 28, yA, 34, COSMOS.emerald, 'mono', 'left')
        .glow(7, COSMOS.emerald)
        .opacity(Math.max(0.45, cd)),

      // Branch B: Move m -> 2.2, rescale old by exp(-0.2) -> 1.9571
      glowingArc([xStart, yB], [xEnd, yB], 0, {
        color: COSMOS.gold,
        width: 3.6,
        opacity: Math.max(0.45, cd),
      }),
      txt('B. Move m → 2.2 · rescale old × e⁻⁰·²', 50, yB - 38, 26, COSMOS.gold, 'mono').opacity(
        Math.max(0.45, cd),
      ),
      glowDot(xEnd, yB, { radius: 9, color: COSMOS.gold, opacity: Math.max(0.45, cd) }),
      txt(`${RESCALE_RATIO.toFixed(4)}  (SAME)`, xEnd + 28, yB, 34, COSMOS.gold, 'mono', 'left')
        .glow(7, COSMOS.gold)
        .opacity(Math.max(0.45, cd)),

      // Branch C: Broken mixed reference (switch m without rescaling old)
      glowingArc([xStart, yB], [xEnd, yC], 75, {
        color: COSMOS.rose,
        width: 3.6,
        opacity: Math.max(0.35, bd),
      }),
      txt('C. Switch m, skip old rescale (MIXED!)', 20, yC + 46, 26, COSMOS.rose, 'mono').opacity(
        Math.max(0.35, bd),
      ),
      glowDot(xEnd, yC, { radius: 9, color: COSMOS.rose, opacity: Math.max(0.35, bd) }),
      txt(`${BAD_RATIO.toFixed(4)}  (WRONG)`, xEnd + 28, yC, 34, COSMOS.rose, 'mono', 'left')
        .glow(7, COSMOS.rose)
        .opacity(Math.max(0.35, bd)),

      // Bottom B200 utilization bar (pure visual meter, zero card chrome)
      rule(-855, 224, 855, 224, '#2a385c', 2.0),
      txt(
        ct > 0.5
          ? 'BLACKWELL B200 BF16 · CUTE-DSL (PYTHON)'
          : 'BLACKWELL FA4 · ASYNC MMA · TENSOR MEMORY · SW EXP',
        -855,
        268,
        26,
        ct > 0.5 ? COSMOS.cyan : COSMOS.violet,
        'mono',
        'left',
      ),
      rect(1120, 30, { fill: '#11182c', stroke: '#33446c', width: 2, radius: 7 }).at(-295, 326),
      rect(1120 * 0.71, 22, {
        fill: ct > 0.5 ? COSMOS.cyan : COSMOS.violet,
        stroke: null,
        radius: 5,
      })
        .at(-855 + 1120 * 0.71 * 0.5, 326)
        .glow(8, ct > 0.5 ? COSMOS.cyan : COSMOS.violet)
        .opacity(0.88),
      txt(
        '1,613 TFLOP/s (71%)',
        300,
        326,
        32,
        ct > 0.5 ? COSMOS.cyan : COSMOS.muted,
        'mono',
        'left',
      ).glow(ct > 0.5 ? 6 : 0, COSMOS.cyan),
      txt(
        sw > 0.5
          ? 'Sweeps: N = 1k..32k at 32k total tokens · verify actual build & input contract'
          : 'Compares with cuDNN 9.13 & Triton · check package compatibility before deploying',
        -855,
        390,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    // Vertical parity link tying exact paths A and B together
    if (cd > 0.4) {
      nodes.push(
        line([xEnd, yA + 14], [xEnd, yB - 14], {
          stroke: COSMOS.emerald,
          width: 2.6,
          dash: [4, 4],
        }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eqKeep, live);

  c.on('blackwell-reference-beat-1', () => s.play(showDesign.to(1, { duration: 0.4 })));
  c.on('blackwell-reference-beat-2', () => s.play(showCond.to(0.6, { duration: 0.35 })));
  c.on('fa-keep-reference', () => s.play(showCond.to(1, { duration: 0.4 })));
  c.on('fa-bad-reference', () => s.play(showBad.to(1, { duration: 0.45 })));
  c.on('blackwell-reference-beat-3', () => s.play(showCute.to(1, { duration: 0.45 })));
  c.on('blackwell-reference-beat-4', () =>
    s.play(showSweep.to(1, { duration: remainDuration(c, 'blackwell-reference-beat-4', 0.45) })),
  );
}
