// Scene 23: Choose the signal and preserve its checked property: ORM/GRPO, PRM step error (11), GenRM, Verifier hidden test (4+4=8).
import {
  COSMOS,
  aura,
  circle,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function signalSpectrum(s, c) {
  const phase = s.value(0);
  const showTerminal = s.value(0.45);
  const showPrm = s.value(0);
  const markError = s.value(0);
  const showVerifier = s.value(0);
  const hiddenFail = s.value(0);

  const bgAura = aura(150, 15, 580, '#5ce1e61e', '#a78bfa18');
  const title = heroTitle(['The Reward', 'Signal Spectrum'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'ORM · PRM · GENERATIVE JUDGE · VERIFIER · DPO',
  });

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const st = showTerminal.value;
    const sp = showPrm.value;
    const me = markError.value;
    const sv = showVerifier.value;
    const hf = hiddenFail.value;
    const pulse = 0.65 + 0.35 * Math.sin(p * 3.5);

    const nodes = [
      // Left-center: Reasoning trace inspected by ORM & PRM
      txt('REASONING TRACE', -640, -185, 26, COSMOS.cyan, 'mono'),
      tokenCell(-640, -100, 400, 76, COSMOS.emerald, { fill: '#0d2224', glow: 6 }),
      txt('Step 1:  2 + 3 = 5   ✓', -640, -100, 28, COSMOS.emerald, 'mono'),

      tokenCell(-640, 2, 400, 76, me > 0.4 ? COSMOS.rose : COSMOS.cyan, {
        fill: me > 0.4 ? '#281020' : '#0f182c',
        glow: me > 0.4 ? 12 * pulse : 4,
      }),
      txt('Step 2: 2 × 5 = 11 (ERR)', -640, 2, 26, me > 0.4 ? COSMOS.rose : COSMOS.ink, 'mono'),

      // Terminal ORM / GRPO / Best-of-N callout on upper-right
      glowingArc([-435, 2], [-158, -135], -35, {
        color: COSMOS.gold,
        width: 3.4,
        opacity: Math.max(0.45, st),
      }),
      circle(78, { fill: '#1b1812', stroke: COSMOS.gold, width: 3 })
        .at(-75, -135)
        .glow(8, COSMOS.gold)
        .opacity(Math.max(0.45, st)),
      txt('ORM', -75, -154, 28, COSMOS.gold, 'mono'),
      txt('final r', -75, -114, 26, COSMOS.muted, 'mono'),
      txt(
        'PPO (value baseline) · GRPO (group relative) · Best-of-N',
        385,
        -135,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(Math.max(0.45, st)),

      // Stepwise PRM & Generative Judge callout on middle-right
      glowingArc([-435, 2], [-158, 2], 0, {
        color: COSMOS.rose,
        width: 3.8,
        opacity: Math.max(0.4, sp),
      }),
      circle(78, { fill: '#221120', stroke: COSMOS.rose, width: 3 })
        .at(-75, 2)
        .glow(me > 0.4 ? 11 : 5, COSMOS.rose)
        .opacity(Math.max(0.4, sp)),
      txt('PRM', -75, -17, 28, COSMOS.rose, 'mono'),
      txt('step 2!', -75, 23, 26, COSMOS.rose, 'mono'),
      txt(
        'Locates first error (Lightman et al.) · GenRM verdict probs',
        395,
        2,
        26,
        COSMOS.ink,
        'sans',
      ).opacity(Math.max(0.4, sp)),

      // Lower section: Executable Verifier loophole (`return 5`)
      line([-855, 118], [810, 118], { stroke: '#253355', width: 2 }),
      txt('EXECUTABLE VERIFIER TEST', -855, 175, 26, COSMOS.violet, 'mono', 'left'),
      tokenCell(-640, 255, 400, 82, COSMOS.amber, {
        fill: '#1f1612',
        glow: 6,
        opacity: Math.max(0.5, sv),
      }),
      txt('def add(a, b): return 5', -640, 255, 28, COSMOS.amber, 'mono').opacity(
        Math.max(0.5, sv),
      ),

      // Public test passes
      glowingArc([-435, 240], [-115, 215], -18, {
        color: COSMOS.emerald,
        width: 3.2,
        opacity: Math.max(0.45, sv),
      }),
      txt('Public:  add(2, 3) == 5   PASS ✓', 180, 215, 28, COSMOS.emerald, 'mono', 'left').opacity(
        Math.max(0.45, sv),
      ),

      // Hidden test fails
      glowingArc([-435, 270], [-115, 295], 18, {
        color: COSMOS.rose,
        width: 3.6,
        opacity: Math.max(0.4, hf),
      }),
      txt('Hidden:  add(4, 4) == 8   FAIL (got 5)', 180, 295, 28, COSMOS.rose, 'mono', 'left')
        .glow(hf > 0.4 ? 7 : 0, COSMOS.rose)
        .opacity(Math.max(0.4, hf)),

      // Bottom offline DPO contrast
      txt(
        'Verifiers only check what tests cover · Offline DPO compares log π / π_ref directly',
        0,
        402,
        28,
        COSMOS.muted,
        'sans',
      ),
    ];

    // Live scanner dot on step 2 when error marked
    if (me > 0.3) {
      nodes.push(glowDot(-435, 2, { radius: 8, color: COSMOS.rose, opacity: pulse }));
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('signal-spectrum-step-1', () => s.play(showTerminal.to(1, { duration: 0.45 })));
  c.on('process-location', () => s.play(showPrm.to(1, { duration: 0.45 })));
  c.on('signal-spectrum-step-2', () => s.play(markError.to(1, { duration: 0.45 })));
  c.on('signal-spectrum-step-3', () => s.play(showVerifier.to(1, { duration: 0.45 })));
  c.on('verifier-hidden', () =>
    s.play(hiddenFail.to(1, { duration: remainDuration(c, 'verifier-hidden', 0.45) })),
  );
}
