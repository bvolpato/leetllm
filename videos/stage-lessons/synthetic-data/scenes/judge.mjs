// Scene 10: Calibrate semantic review (Animated A/B order swap exposing slot-1 position bias + remapped probability)
import {
  COSMOS,
  JUDGE_AUDIT,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function judge(s, c) {
  const phase = s.value(0);
  const sDoc = s.value(0);
  const swapT = s.value(0);
  const sRemap = s.value(0);
  const sAgree = s.value(0);

  const bgAura = aura(0, 10, 680, '#2a184a2a', '#12385c18');

  const title = heroTitle(['Calibrate Semantic', 'Review Across Orders'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'LLM-AS-A-JUDGE · ORDER REVERSAL & IDENTITY REMAPPING',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const sw = swapT.value;
    const rm = sRemap.value;
    const ag = sAgree.value;

    const ax = -425 + 850 * sw;
    const bx = 425 - 850 * sw;
    const ay = -114;
    const by = 26;

    const nodes = [
      // Slot labels pinned above left & right chambers
      txt('SLOT 1 (LEFT POSITION)', -425, -206, 26, COSMOS.gold, 'mono'),
      txt('SLOT 2 (RIGHT POSITION)', 425, -206, 26, COSMOS.muted, 'mono'),

      // Candidate A capsule (follows documentation, upper lane so swap never collides)
      glassCell(ax, ay, 700, 112, COSMOS.emerald, {
        fill: '#0e2824',
        glow: sDoc.value > 0.2 ? 9 * pulse : 5,
      }),
      txt('RESPONSE A · follows documented limit', ax, ay - 20, 28, COSMOS.emerald, 'mono'),
      txt(
        sw < 0.5
          ? 'Order 1: left slot -> P(A) = 0.80'
          : rm > 0.5
            ? `Order 2: right slot -> P(A) = ${JUDGE_AUDIT.remappedA.toFixed(2)}`
            : 'Order 2: right slot -> P(A) = ?',
        ax,
        ay + 22,
        26,
        COSMOS.ink,
        'mono',
      ),

      // Candidate B capsule (oversized page, lower lane)
      glassCell(bx, by, 700, 112, COSMOS.rose, {
        fill: '#281119',
        glow: 6,
      }),
      txt('RESPONSE B · asks for oversized page', bx, by - 20, 28, COSMOS.rose, 'mono'),
      txt(
        sw < 0.5 ? 'Order 1: right slot -> P(B) = 0.20' : 'Order 2: left slot -> P(B) = 0.70',
        bx,
        by + 22,
        26,
        COSMOS.ink,
        'mono',
      ),

      // Verdict & calibration bar (strictly withholds remapped 0.30 / 0.55 / AUDIT until c.after('judge-remap-result')!)
      glassCell(0, 180, 1560, 126, rm > 0.5 ? COSMOS.rose : COSMOS.violet, {
        fill: rm > 0.5 ? '#261018' : '#14122b',
        glow: rm > 0.5 ? 9 * pulse : 5,
      }),
      txt(
        rm > 0.5
          ? `REMAPPED TO IDENTITY:  Order 1 A = ${JUDGE_AUDIT.forwardA.toFixed(2)}   ·   Order 2 A = ${JUDGE_AUDIT.remappedA.toFixed(2)}  (FLIP -> AUDIT)`
          : sw > 0.3
            ? 'Judge picked SLOT 1 in both orders  ->  remapping response identity...'
            : 'Order 1 (A, B):  P(A) = 0.80  ·  randomize order & keep original slot ID',
        0,
        152,
        28,
        rm > 0.5 ? COSMOS.rose : COSMOS.gold,
        'mono',
      ),
      txt(
        ag > 0.3
          ? 'Order agreement tests stability · independent contract & human review test correctness'
          : 'Accept a preference only when the same response identity wins in both orders',
        0,
        212,
        26,
        ag > 0.3 ? COSMOS.cyan : COSMOS.muted,
        'sans',
      ),
    ];

    if (rm > 0.5) {
      nodes.push(glowDot(-740, 152, { radius: 7, color: COSMOS.rose }));
    }

    return group(...nodes);
  });

  const eqRemap = glowTex(
    `\\bar{P}(A) = \\frac{${JUDGE_AUDIT.forwardA.toFixed(2)} + ${JUDGE_AUDIT.remappedA.toFixed(2)}}{2} = ${JUDGE_AUDIT.averageA.toFixed(2)}`,
    {
      x: 0,
      y: 356,
      size: 44,
      color: COSMOS.gold,
      glow: 7,
    },
  );

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('judge-b1-1', () => s.play(sDoc.to(1, { duration: 0.45 })));
  c.on('judge-b2-1', () => s.play(swapT.to(1, { duration: 0.9 })));
  c.show('judge-remap-result', eqRemap, { after: true });
  c.after('judge-remap-result', () =>
    s.play(sRemap.to(1, { duration: remainDuration(c, 'judge-remap-result', 0.45) })),
  );
  c.on('judge-b3-1', () =>
    s.play(sAgree.to(1, { duration: remainDuration(c, 'judge-b3-1', 0.45) })),
  );
}
