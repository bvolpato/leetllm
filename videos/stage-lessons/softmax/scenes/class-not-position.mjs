// Scene 18 (class-not-position): "Which mask changes the candidates?"
// High-logit padding class [0, 1, 10] still competes when ignore_index=2 -> candidate mask pad=-inf drops loss 9.0 -> 0.313 -> 3 distinct mask roles.
import {
  CLASS_WORDS,
  COSMOS,
  DANGER_COLOR,
  MARK_COLOR,
  MODEL,
  TARGET_COLOR,
  WORD_COLOR,
  aura,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function classNotPosition(s, c) {
  const phase = s.value(0);
  const showUnmaskedLoss = s.value(0);
  const maskPad = s.value(0);
  const showMaskedLoss = s.value(0);
  const showSoftSupport = s.value(0);
  const showInf = s.value(0);
  const showTargetMask = s.value(0);
  const showAttnMask = s.value(0);
  const showCandMask = s.value(0);

  const bgAura = aura(0, 20, 620, '#3a193230', '#133a3d18');
  const title = heroTitle(['Which Mask Changes', 'the Candidates?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: MARK_COLOR,
    eyebrow: 'TARGET VS ATTENTION VS CANDIDATE MASKS',
  });

  const live = guardedDynamic(s.value(1), () => {
    const mp = maskPad.value;
    const isMasked = mp > 0.5;
    const probs = isMasked ? MODEL.excluded.probabilities : MODEL.pad.probabilities;
    const lossVal = isMasked ? MODEL.excluded.loss : MODEL.pad.loss;
    const softConf = showSoftSupport.value > 0.5;

    const baseY = 120;
    const maxH = 290;
    const xs = [-690, -455, -220];
    const zLabels = ['0.0', '1.0', isMasked ? '−∞' : '10.0'];

    const nodes = [
      txt(
        'target = docs (1)   ·   ignore_index = 2 (pad)',
        -855,
        -245,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      rule(-815, baseY, -95, baseY, COSMOS.muted, 2.5).opacity(0.8),
    ];

    CLASS_WORDS.forEach((w, i) => {
      const ph = Math.max(5, probs[i] * maxH);
      const isPad = i === 2;
      const col = isPad ? (isMasked ? DANGER_COLOR : COSMOS.amber) : WORD_COLOR[i];
      nodes.push(
        lumBar(xs[i], baseY - ph / 2, 118, ph, {
          color: col,
          fillOpacity: isPad && isMasked ? 0.12 : 0.74,
          dash: isPad && isMasked ? [8, 6] : undefined,
          glow: isPad && isMasked ? 4 : 9,
        }),
        txt(w, xs[i], baseY + 42, 30, col, 'sans'),
        txt(`z=${zLabels[i]}`, xs[i], baseY + 84, 26, COSMOS.muted, 'mono'),
        txt(
          isPad && isMasked ? '0.0%' : `${(probs[i] * 100).toFixed(1)}%`,
          xs[i],
          baseY - ph - 28,
          26,
          col,
          'mono',
        ),
      );
    });

    // Right side: live loss & support conflict
    const rx = 50;
    if (showUnmaskedLoss.value > 0.02 && !isMasked) {
      nodes.push(
        txt('ignore_index=2 DOES NOT REMOVE CLASS 2!', rx, -210, 26, DANGER_COLOR, 'mono', 'left')
          .glow(6, DANGER_COLOR)
          .opacity(showUnmaskedLoss.value),
        txt(
          `L(docs) = ${MODEL.pad.loss.toFixed(3)} nats`,
          rx,
          -142,
          36,
          DANGER_COLOR,
          'mono',
          'left',
        ).opacity(showUnmaskedLoss.value),
        txt(
          'pad steals 99.99% mass; grad on z_pad ≈ +1.00',
          rx,
          -84,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(showUnmaskedLoss.value),
      );
    }

    if (showMaskedLoss.value > 0.02 && isMasked) {
      nodes.push(
        txt('CANDIDATE MASK:  z_pad ← −∞', rx, -210, 28, TARGET_COLOR, 'mono', 'left')
          .glow(6, TARGET_COLOR)
          .opacity(showMaskedLoss.value),
        txt(
          `L(docs) drops  9.000 → ${lossVal.toFixed(3)} nats`,
          rx,
          -142,
          34,
          TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(8, TARGET_COLOR)
          .opacity(showMaskedLoss.value),
        txt(
          'docs now competes only against bug',
          rx,
          -84,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showMaskedLoss.value),
      );
    }

    if (softConf) {
      nodes.push(
        txt(
          'Label smoothing gives pad weight > 0 while p(pad) = 0',
          rx,
          10,
          26,
          COSMOS.amber,
          'mono',
          'left',
        ).opacity(showSoftSupport.value),
      );
    }
    if (showInf.value > 0.02) {
      nodes.push(
        txt('⇒  Support mismatch: loss = +∞!', rx, 68, 32, DANGER_COLOR, 'mono', 'left')
          .glow(8, DANGER_COLOR)
          .opacity(showInf.value),
      );
    }

    // Bottom: 3 clean floating mask definitions anchored with glowing orbital beacons (zero bullet cards!)
    nodes.push(
      rule(-855, 275, 855, 275, COSMOS.cyan, 2.2).opacity(0.55),
      txt('MASK ROLES: TARGET · ATTENTION · CANDIDATE', 0, 248, 26, COSMOS.muted, 'mono').opacity(
        0.85,
      ),
    );
    const masks = [
      {
        x: -620,
        label: '1. TARGET MASK',
        desc: 'Which positions count in loss',
        col: COSMOS.cyan,
        vis: showTargetMask.value,
      },
      {
        x: -15,
        label: '2. ATTENTION MASK',
        desc: 'Which inputs each position reads',
        col: MARK_COLOR,
        vis: showAttnMask.value,
      },
      {
        x: 590,
        label: '3. CANDIDATE MASK',
        desc: 'Which classes can be predicted',
        col: TARGET_COLOR,
        vis: showCandMask.value,
      },
    ];
    masks.forEach((m) => {
      if (m.vis > 0.02) {
        nodes.push(
          glowRing(m.x - 210, 340, 14, m.col, { width: 3, glow: 8, opacity: m.vis }),
          txt(m.label, m.x - 178, 320, 26, m.col, 'mono', 'left').opacity(m.vis),
          txt(m.desc, m.x - 178, 362, 26, COSMOS.ink, 'sans', 'left').opacity(m.vis),
        );
      }
    });

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  c.on('class-not-position-0', () => {
    s.play(showUnmaskedLoss.to(0.25, { duration: 0.3 }));
  });
  tweenCue(s, c, 'class-loss', showUnmaskedLoss, 1, { duration: 0.45, after: true });
  c.on('class-not-position-1', () => {
    s.play(maskPad.to(0.3, { duration: 0.3 }));
  });
  tweenCue(s, c, 'class-exclude', maskPad, 1, { duration: 0.5 });
  tweenCue(s, c, 'class-excluded-result', showMaskedLoss, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'class-soft-support', showSoftSupport, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'class-support-result', showInf, 1, { duration: 0.45 });
  tweenCue(s, c, 'class-not-position-2', showTargetMask, 1, { duration: 0.4 });
  tweenCue(s, c, 'class-masks', showAttnMask, 1, { duration: 0.4 });
  tweenCue(s, c, 'class-candidate-mask', showCandMask, 1, { duration: 0.4 });
}
