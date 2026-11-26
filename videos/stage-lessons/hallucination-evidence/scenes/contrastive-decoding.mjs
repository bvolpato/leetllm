// Scene 13: Which next token gains probability? (DoLa layer contrast 84%/16% vs CAD logit contrast 97%)
import {
  CAD_RESULT,
  COSMOS,
  DOLA_RESULT,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  meterBar,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function contrastiveDecoding(s, c) {
  const phase = s.value(0);
  const showDola = s.value(0);
  const showMask = s.value(0);
  const showDolaProb = s.value(0);
  const showCad = s.value(0);
  const showCadProb = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1a5216');
  const title = heroTitle(['Which Next Token', 'Gains Probability?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'CONTRASTIVE DECODING · DoLa (LAYER CONTRAST) vs CAD (CONTEXT CONTRAST)',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sd = showDola.value;
    const sm = showMask.value;
    const sdp = showDolaProb.value;
    const sc = showCad.value;
    const scp = showCadProb.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: DoLa (Final [0.7, 0.2, 0.1] vs Early Layer 2 [0.2, 0.3, 0.5], beta = 0.2 -> cutoff 0.14)
      txt('DoLa · FINAL vs EARLY LAYER 2 (beta=0.2)', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -96, 820, 148, sd > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10213b',
        glow: sd > 0.3 ? 8 : 3,
      }),
      txt(
        'Max JSD layer L2 | cutoff = 0.2*0.7 = 0.14',
        -850,
        -138,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt('inv: 0.7/0.2 = 3.50 | res: 0.2/0.3 = 0.67', -850, -92, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        sm > 0.3 ? 'unk: 0.1 < 0.14 -> MASKED TO 0!' : 'unk: final 0.10 vs cutoff 0.14',
        -850,
        -52,
        26,
        sm > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),

      glassCell(-465, 134, 820, 238, sdp > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: sdp > 0.3 ? 9 * pulse : 2,
      }),
      txt('DoLa NORMALIZED DISTRIBUTION', -850, 52, 26, COSMOS.emerald, 'mono', 'left'),
      txt(
        `inv: ${(DOLA_RESULT.probabilities[0] * 100).toFixed(0)}%`,
        -850,
        102,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      meterBar(-650, 102, 540, 26, DOLA_RESULT.probabilities[0], COSMOS.emerald),
      txt(
        `res: ${(DOLA_RESULT.probabilities[1] * 100).toFixed(0)}%`,
        -850,
        154,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      meterBar(-650, 154, 540, 26, DOLA_RESULT.probabilities[1], COSMOS.amber),
      txt('unk:  0% (masked)', -850, 206, 26, COSMOS.rose, 'mono', 'left'),

      // Right: Context-Aware Decoding (CAD, alpha = 1: context [0.7,0.2,0.1] vs prior [0.1,0.8,0.1])
      txt('CAD · WITH RECORD vs WITHOUT RECORD', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -96, 780, 148, sc > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sc > 0.3 ? '#26111a' : '#12182b',
        glow: sc > 0.3 ? 8 * pulse : 2,
      }),
      txt('Raw diff: 0.2 - 0.8 = -0.6 (NEGATIVE!)', 130, -138, 26, COSMOS.rose, 'mono', 'left'),
      txt('(1+a) logit_ctx - a logit_prior -> softmax', 130, -92, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        `At a=1: w_inv = 4.90 | sum = ${CAD_RESULT.sum.toFixed(2)}`,
        130,
        -52,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(495, 134, 780, 238, scp > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#1e1b10',
        glow: scp > 0.3 ? 10 * pulse : 2,
      }),
      txt('CAD RESULT (alpha = 1)', 130, 52, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        `inv: ${(CAD_RESULT.probabilities[0] * 100).toFixed(1)}%`,
        130,
        102,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      meterBar(340, 102, 510, 26, CAD_RESULT.probabilities[0], COSMOS.emerald),
      txt(
        `res:  ${(CAD_RESULT.probabilities[1] * 100).toFixed(1)}%`,
        130,
        154,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      meterBar(340, 154, 510, 26, CAD_RESULT.probabilities[1], COSMOS.amber),
      txt(
        'WARNING: stale runbook boosts stale status too!',
        145,
        210,
        26,
        COSMOS.rose,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Contrastive decoding amplifies context over prior -> verify snapshot freshness BEFORE boosting it',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('layer-input', () => s.play(showDola.to(0.5, { duration: 0.35 })));
  c.on('choose-layer', () => s.play(showDola.to(1, { duration: 0.4 })));
  c.on('apply-mask', () => s.play(showMask.to(1, { duration: 0.4 })));
  c.on('layer-weights', () => s.play(showDolaProb.to(0.5, { duration: 0.35 })));
  c.on('layer-normalize', () => s.play(showDolaProb.to(1, { duration: 0.4 })));
  c.on('context-input', () => s.play(showCad.to(0.5, { duration: 0.35 })));
  c.on('negative-weight', () => s.play(showCad.to(1, { duration: 0.4 })));
  c.on('context-weights', () => s.play(showCadProb.to(0.5, { duration: 0.35 })));
  c.on('context-normalize', () =>
    s.play(showCadProb.to(1, { duration: remainDuration(c, 'context-normalize', 0.45) })),
  );
}
