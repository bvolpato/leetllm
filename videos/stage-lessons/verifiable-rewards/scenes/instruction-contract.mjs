// Scene 10: Count the whole response under the declared constraint (Weak bullet counter vs strict 3-line check)
import {
  COSMOS,
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

export default function instructionContract(s, c) {
  const phase = s.value(0);
  const sWeak = s.value(0);
  const sStrict = s.value(0);
  const sBound = s.value(0);
  const sRepair = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#3d1c4c14');
  const title = heroTitle(['Count the Whole Response', 'Under the Constraint'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'FORMAT VERIFIER · EXACTLY 3 NONEMPTY "- " LINES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sw = Math.max(0.55, sWeak.value);
    const ss = sStrict.value;
    const sb = sBound.value;
    const sr = sRepair.value;

    const nodes = [
      // Left: Candidate response with 3 bullets + 1 extra prose line
      glassCell(-440, -25, 760, 290, ss > 0.3 ? COSMOS.rose : COSMOS.cyan, {
        fill: '#101d34',
        glow: 7,
      }),
      txt('CANDIDATE RESPONSE (4 NONEMPTY LINES)', -790, -135, 26, COSMOS.cyan, 'mono', 'left'),
      txt('1.  - First checked item', -790, -75, 28, COSMOS.emerald, 'mono', 'left'),
      txt('2.  - Second checked item', -790, -25, 28, COSMOS.emerald, 'mono', 'left'),
      txt('3.  - Third checked item', -790, 25, 28, COSMOS.emerald, 'mono', 'left'),
      txt(
        '4.  Extra unbulleted summary line!',
        -790,
        78,
        28,
        ss > 0.3 ? COSMOS.rose : COSMOS.amber,
        'mono',
        'left',
      ),

      // Right top: Weak counter
      glassCell(440, -100, 740, 126, COSMOS.amber, {
        fill: '#241a0f',
        glow: sw > 0.7 ? 9 : 3,
        opacity: sw,
      }),
      txt('WEAK COUNTER (COUNTS "- " PREFIXES)', 440, -132, 26, COSMOS.amber, 'mono').opacity(sw),
      txt('Sees 3 bullets -> PASS (r = 1)  [BUG]', 440, -78, 30, COSMOS.amber, 'mono').opacity(sw),

      // Right bottom: Strict whole-response checker
      glassCell(440, 56, 740, 126, ss > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: ss > 0.3 ? '#0e2824' : '#12182b',
        glow: ss > 0.3 ? 10 * pulse : 3,
        opacity: Math.max(0.7, ss),
      }),
      txt('STRICT WHOLE-RESPONSE CHECKER', 440, 24, 26, COSMOS.emerald, 'mono').opacity(
        Math.max(0.7, ss),
      ),
      txt(
        ss > 0.3
          ? '4 nonempty lines != 3 -> REJECT (r=0)'
          : 'Checks full line count + every prefix',
        440,
        78,
        28,
        ss > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
      ).opacity(Math.max(0.7, ss)),

      // Bottom guidance
      glowDot(-820, 215, { radius: 6, color: COSMOS.gold }),
      txt(
        'Scope: checks explicit format & schema subcontracts, NOT story quality or judgment',
        -790,
        217,
        28,
        sb > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
        'left',
      ).opacity(Math.max(0.75, sb)),
      glowDot(-820, 286, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Fix parser/gold defects BEFORE training · cold-start SFT helps if base outputs unreadable syntax',
        -790,
        288,
        28,
        sr > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ).opacity(Math.max(0.75, sr)),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('vr-instruction-contract-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-weak-instruction-contract', () => s.play(sWeak.to(1, { duration: 0.45 })));
  c.on('vr-strict-instruction-contract', () => s.play(sStrict.to(1, { duration: 0.5 })));
  c.on('vr-instruction-contract-b1', () => s.play(sBound.to(0.6, { duration: 0.35 })));
  c.on('vr-boundary-instruction-contract', () => s.play(sBound.to(1, { duration: 0.45 })));
  c.on('vr-instruction-contract-b2', () => s.play(sRepair.to(0.6, { duration: 0.35 })));
  c.on('vr-repair-instruction-contract', () =>
    s.play(sRepair.to(1, { duration: remainDuration(c, 'vr-repair-instruction-contract', 0.45) })),
  );
}
