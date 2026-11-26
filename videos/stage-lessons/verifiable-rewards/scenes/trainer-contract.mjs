// Scene 19: Changing the denominator changes what a token contributes (Equal response mean 1.0 vs DAPO token mean 2/3)
import {
  COSMOS,
  RED_RESP,
  RED_TOK,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  rlvrReduction,
  runPhase,
  txt,
} from '../parts.mjs';

export default function trainerContract(s, c) {
  const phase = s.value(0);
  const redProg = s.value(0); // 0 = response-equal (1.0), 1 = global active-token (2/3)
  const sAsym = s.value(0);
  const sBeta = s.value(0);

  const bgAura = aura(0, 20, 640, '#14365c26', '#331d5214');
  const title = heroTitle(['Changing the Denominator', 'Changes Token Weight'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'REDUCTION MODE · EQUAL RESPONSE vs GLOBAL ACTIVE-TOKEN (DAPO)',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const rp = redProg.value;
    const as = sAsym.value;
    const bt = sBeta.value;
    const cur = rlvrReduction(rp);

    const nodes = [
      txt(
        'TWO RESPONSES: 2 TOKENS (LOSS 2)  &  4 TOKENS (LOSS 0)',
        -830,
        -192,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),

      // Response 1: 2 tokens with loss 2 each
      txt('RESP 1 (2 tokens, term = 2)', -830, -108, 26, COSMOS.gold, 'mono', 'left'),
      rect(180, 74, { fill: '#2c220f', stroke: COSMOS.gold, width: 2.4, radius: 8 }).at(-740, -32),
      txt('w=' + cur.weights[0].toFixed(2), -740, -30, 28, COSMOS.gold, 'mono'),
      rect(180, 74, { fill: '#2c220f', stroke: COSMOS.gold, width: 2.4, radius: 8 }).at(-540, -32),
      txt('w=' + cur.weights[0].toFixed(2), -540, -30, 28, COSMOS.gold, 'mono'),

      // Response 2: 4 tokens with loss 0 each
      txt('RESP 2 (4 tokens, term = 0)', -830, 68, 26, COSMOS.cyan, 'mono', 'left'),
      ...[0, 1, 2, 3].flatMap((k) => {
        const cx = -740 + k * 200;
        return [
          rect(180, 74, { fill: '#102138', stroke: COSMOS.cyan, width: 2.2, radius: 8 }).at(
            cx,
            144,
          ),
          txt('w=' + cur.weights[1].toFixed(2), cx, 146, 28, COSMOS.cyan, 'mono'),
        ];
      }),

      // Right top: Live loss value morphing 1.000 -> 0.667
      glassCell(460, -82, 680, 152, rp > 0.5 ? COSMOS.emerald : COSMOS.gold, {
        fill: rp > 0.5 ? '#0e2824' : '#241e0e',
        glow: 9 * pulse,
      }),
      txt(
        rp > 0.5 ? 'GLOBAL TOKEN MEAN (DAPO: 4 / 6)' : 'EQUAL RESPONSE MEAN (1/2 * (2 + 0))',
        460,
        -122,
        26,
        rp > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),
      txt(
        `Loss = ${cur.loss.toFixed(3)}   (${rp > 0.5 ? '2/3' : RED_RESP.loss.toFixed(1)})`,
        460,
        -60,
        42,
        rp > 0.5 ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(7, rp > 0.5 ? COSMOS.emerald : COSMOS.gold),

      // Right lower: DAPO asymmetric clip & TRL beta=0 config notes
      glassCell(460, 118, 680, 168, bt > 0.3 ? COSMOS.cyan : COSMOS.violet, {
        fill: '#13192f',
        glow: as > 0.3 || bt > 0.3 ? 8 : 3,
      }),
      txt(
        bt > 0.3 ? 'TRL GRPO TRAINER DEFAULTS' : 'DAPO DESIGN CHOICES',
        460,
        66,
        26,
        bt > 0.3 ? COSMOS.cyan : COSMOS.violet,
        'mono',
      ),
      txt(
        bt > 0.3
          ? 'dapo loss · token ratios · beta = 0 (no ref loaded)'
          : 'Asymmetric clip rails · overlong penalties · beta = 0',
        460,
        122,
        26,
        COSMOS.ink,
        'sans',
      ),
      txt('Pin version, reduction, masks, clip & KL', 460, 168, 26, COSMOS.muted, 'sans'),

      txt(
        `Resp mean = ${RED_RESP.loss.toFixed(2)}  vs  Active-token mean = ${RED_TOK.loss.toFixed(3)} (truncation & masks change active set)`,
        0,
        355,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  const eqRed = glowTex('\\frac{2(2) + 4(0)}{6} = \\frac{2}{3} \\neq \\frac{2 + 0}{2} = 1', {
    x: -440,
    y: 268,
    size: 36,
    color: COSMOS.gold,
    glow: 6,
  });

  s.add(bgAura, title, live, eqRed);
  runPhase(s, c, phase, 14);

  c.on('vr-trainer-contract-b0', () => s.play(phase.to(1.5, { duration: 0.4 })));
  c.on('vr-equal-trainer-contract', () => s.play(redProg.to(0.05, { duration: 0.3 })));
  c.on('vr-global-trainer-contract', () => s.play(redProg.to(1, { duration: 0.8 })));
  c.on('vr-trainer-contract-b1', () => s.play(sAsym.to(0.6, { duration: 0.35 })));
  c.on('vr-asymmetric-trainer-contract', () => s.play(sAsym.to(1, { duration: 0.45 })));
  c.on('vr-trainer-contract-b2', () => s.play(sBeta.to(0.6, { duration: 0.35 })));
  c.on('vr-beta-trainer-contract', () =>
    s.play(sBeta.to(1, { duration: remainDuration(c, 'vr-beta-trainer-contract', 0.45) })),
  );
}
