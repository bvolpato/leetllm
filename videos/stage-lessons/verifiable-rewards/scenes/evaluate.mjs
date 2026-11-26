// Scene 29: Did the policy learn to count slots? (Train 14x12=168 pass vs held-out 13x12=156 & 14x11=154 fail)
import {
  COSMOS,
  EVAL_DATA,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function evaluate(s, c) {
  const phase = s.value(0);
  const sTrain = s.value(0);
  const sHeld = s.value(0);
  const sRow1 = s.value(0);
  const sRow2 = s.value(0);
  const sTrans = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3c1b4a14');
  const title = heroTitle(['Did the Policy Learn', 'to Count Slots?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.rose,
    eyebrow: 'TRAINING REWARD vs HELD-OUT TRANSFER · CONSTANT POLICY "168"',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const tr = Math.max(0.65, sTrain.value);
    const hl = Math.max(0.65, sHeld.value);
    const r1 = sRow1.value;
    const r2 = sRow2.value;
    const tf = sTrans.value;

    const h0 = EVAL_DATA.heldOut[0]; // 13x12 = 156
    const h1 = EVAL_DATA.heldOut[1]; // 14x11 = 154

    const nodes = [
      // Left: Training prompt (14x12 = 168 -> PASS)
      glassCell(-520, -25, 620, 320, COSMOS.emerald, {
        fill: '#0e2524',
        glow: tr > 0.7 ? 9 : 4,
        opacity: tr,
      }),
      txt('TRAINING EXAMPLE', -520, -135, 26, COSMOS.emerald, 'mono').opacity(tr),
      txt('14 workers x 12 slots', -520, -70, 32, COSMOS.ink, 'mono').opacity(tr),
      txt(`Expected: ${EVAL_DATA.training.expected}`, -520, -10, 30, COSMOS.cyan, 'mono').opacity(
        tr,
      ),
      txt(
        `Policy prints: ${EVAL_DATA.training.policyAnswer}`,
        -520,
        48,
        30,
        COSMOS.gold,
        'mono',
      ).opacity(tr),
      txt('TRAIN REWARD: 1.0 (PASS)', -520, 108, 30, COSMOS.emerald, 'mono')
        .glow(7, COSMOS.emerald)
        .opacity(tr),

      // Right top: Held-out rack 1 (13x12 = 156 -> MISS)
      glassCell(370, -110, 860, 152, r1 > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: r1 > 0.3 ? '#291018' : '#12182b',
        glow: r1 > 0.3 ? 10 * pulse : 3,
        opacity: hl,
      }),
      txt(
        'HELD-OUT #1: 13 workers x 12 slots  (-1 worker)',
        370,
        -148,
        26,
        COSMOS.amber,
        'mono',
      ).opacity(hl),
      txt(
        `True = ${h0.expected}   ·   Policy = ${h0.policyAnswer}   ->   r = ${h0.reward}`,
        370,
        -86,
        32,
        r1 > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ).opacity(hl),

      // Right bottom: Held-out rack 2 (14x11 = 154 -> MISS)
      glassCell(370, 74, 860, 152, r2 > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: r2 > 0.3 ? '#291018' : '#12182b',
        glow: r2 > 0.3 ? 10 * pulse : 3,
        opacity: hl,
      }),
      txt(
        'HELD-OUT #2: 14 workers x 11 slots  (-1 slot/worker)',
        370,
        36,
        26,
        COSMOS.amber,
        'mono',
      ).opacity(hl),
      txt(
        `True = ${h1.expected}   ·   Policy = ${h1.policyAnswer}   ->   r = ${h1.reward}`,
        370,
        98,
        32,
        r2 > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ).opacity(hl),

      // Bottom transfer summary
      txt(
        `HELD-OUT ACCURACY: ${(EVAL_DATA.heldOutAccuracy * 100).toFixed(0)}% (0 / 2)`,
        370,
        215,
        34,
        COSMOS.rose,
        'mono',
      )
        .glow(r2 > 0.3 ? 8 : 2, COSMOS.rose)
        .opacity(Math.max(0.65, r2)),
      glowDot(-820, 325, { radius: 6, color: COSMOS.gold }),
      txt(
        tf > 0.3
          ? 'Reserve unseen prompts · limit test reuse · track malformed outputs & audit the checker itself'
          : 'A constant policy that memorizes 168 gets 100% training reward and 0% generalization',
        -790,
        327,
        26,
        tf > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('evaluate-b1-1', () => s.play(sTrain.to(1, { duration: 0.45 })));
  c.on('evaluate-b1-2', () => s.play(sHeld.to(1, { duration: 0.45 })));
  c.on('evaluate-b2-1', () => s.play(sRow1.to(1, { duration: 0.45 })));
  c.on('evaluate-b2-2', () => s.play(sRow2.to(1, { duration: 0.45 })));
  c.on('evaluate-b3-1', () =>
    s.play(sTrans.to(1, { duration: remainDuration(c, 'evaluate-b3-1', 0.45) })),
  );
}
