// Scene 19 (weighted-reduction): "Carry the denominator with a weighted loss"
// Same predictions & weighted numerator 6*ln(2), yet integer target divides by sum(w)=6 -> ln(2), while float one-hot divides by N=2 -> 3*ln(2)!
import {
  COSMOS,
  DANGER_COLOR,
  MARK_COLOR,
  MODEL,
  TARGET_COLOR,
  WORD_COLOR,
  aura,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function weightedReduction(s, c) {
  const showIntRule = s.value(0);
  const showFloatRule = s.value(0);
  const showUniform = s.value(0);
  const showWeights = s.value(0);
  const showNum = s.value(0);
  const showIntMean = s.value(0);
  const showFloatMean = s.value(0);
  const showCombine = s.value(0);

  const bgAura = aura(0, 20, 620, '#14384430', '#2b1b4a18');
  const title = heroTitle(['Carry the Denominator', 'in Weighted Losses'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: MARK_COLOR,
    eyebrow: 'CLASS-WEIGHTED REDUCTION CONTRACT',
  });

  const eqCombine = glowTex(
    'L_{\\text{global}} = \\frac{\\sum_{\\text{shards}} N_s}{\\sum_{\\text{shards}} D_s}',
    { x: 525, y: 375, size: 40, color: TARGET_COLOR, glow: 8 },
  );

  const live = guardedDynamic(s.value(1), () => {
    const nodes = [
      txt('TWO UNIFORM PREDICTIONS (2 CLASSES EACH)', -855, -245, 26, COSMOS.cyan, 'mono', 'left'),
    ];

    // Two example rows
    const ex = [
      {
        y: -165,
        label: 'Ex 1:  p = [0.5, 0.5]',
        loss: 'L₁ = ln 2 ≈ 0.693',
        w: 'w₁ = 2',
        prod: '2 · ln 2',
        col: WORD_COLOR[0],
      },
      {
        y: -95,
        label: 'Ex 2:  p = [0.5, 0.5]',
        loss: 'L₂ = ln 2 ≈ 0.693',
        w: 'w₂ = 4',
        prod: '4 · ln 2',
        col: WORD_COLOR[2],
      },
    ];
    ex.forEach((e) => {
      nodes.push(
        txt(e.label, -855, e.y, 28, COSMOS.ink, 'mono', 'left').opacity(
          0.4 + 0.6 * showUniform.value,
        ),
        txt(e.loss, -415, e.y, 28, e.col, 'mono', 'left').opacity(showUniform.value),
        txt(e.w, -45, e.y, 28, MARK_COLOR, 'mono', 'left').opacity(showWeights.value),
        txt(`⇒  ${e.prod}`, 185, e.y, 28, TARGET_COLOR, 'mono', 'left').opacity(showWeights.value),
      );
    });

    // Shared numerator bar
    if (showNum.value > 0.02) {
      nodes.push(
        rule(-855, -35, 855, -35, COSMOS.rule, 2).opacity(showNum.value),
        txt(
          `IDENTICAL WEIGHTED NUMERATOR:   2 ln 2 + 4 ln 2 = 6 ln 2 ≈ ${MODEL.weightNumerator.toFixed(3)}`,
          -855,
          18,
          30,
          MARK_COLOR,
          'mono',
          'left',
        )
          .glow(7, MARK_COLOR)
          .opacity(showNum.value),
      );
    }

    // Side-by-side divisor contrast (quiet skeleton visible from t=0, brightening on cue!)
    const intOp = 0.55 + 0.45 * Math.max(showIntRule.value, showIntMean.value);
    nodes.push(
      txt('INTEGER CLASS INDICES (Long)', -855, 112, 26, TARGET_COLOR, 'mono', 'left').opacity(
        intOp,
      ),
      txt(
        'Divisor = sum of target weights = 2 + 4 = 6',
        -855,
        158,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(intOp),
    );
    if (showIntMean.value > 0.02) {
      const bw = 180;
      nodes.push(
        lumBar(-855 + bw / 2, 214, bw, 42, {
          color: TARGET_COLOR,
          fillOpacity: 0.78,
          glow: 9,
          opacity: showIntMean.value,
        }),
        txt(
          `6 ln 2 ÷ 6 = ln 2 ≈ ${MODEL.integerWeighted.toFixed(3)}`,
          -855,
          274,
          30,
          TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(7, TARGET_COLOR)
          .opacity(showIntMean.value),
      );
    }

    const fltOp = 0.55 + 0.45 * Math.max(showFloatRule.value, showFloatMean.value);
    nodes.push(
      rule(20, 95, 20, 295, COSMOS.cyan, 2.2).opacity(fltOp * 0.7),
      txt('FLOAT ONE-HOT TARGETS (Float)', 70, 112, 26, DANGER_COLOR, 'mono', 'left').opacity(
        fltOp,
      ),
      txt('Divisor = position count N = 2', 70, 158, 26, COSMOS.muted, 'sans', 'left').opacity(
        fltOp,
      ),
    );
    if (showFloatMean.value > 0.02) {
      const bw = 540;
      nodes.push(
        lumBar(70 + bw / 2, 214, bw, 42, {
          color: DANGER_COLOR,
          fillOpacity: 0.78,
          glow: 9,
          opacity: showFloatMean.value,
        }),
        txt(
          `6 ln 2 ÷ 2 = 3 ln 2 ≈ ${MODEL.floatWeighted.toFixed(3)} (3× larger!)`,
          70,
          274,
          28,
          DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(7, DANGER_COLOR)
          .opacity(showFloatMean.value),
      );
    }

    nodes.push(
      rule(-855, 322, 180, 322, COSMOS.cyan, 2.2).opacity(0.6),
      txt(
        'Shards / microbatches: sum numerators & denominators, divide ONCE',
        -855,
        365,
        28,
        COSMOS.cyan,
        'sans',
        'left',
      ).opacity(0.55 + 0.45 * showCombine.value),
    );

    return nodes;
  });

  s.add(bgAura, title, live);

  c.on('weighted-reduction-0', () => {
    s.play(showIntRule.to(0.4, { duration: 0.3 }));
  });
  tweenCue(s, c, 'weighted-contract', showIntRule, 1, { duration: 0.45 });
  tweenCue(s, c, 'weighted-count', showFloatRule, 1, { duration: 0.45 });

  c.on('weighted-reduction-1', () => {
    s.play(showUniform.to(0.4, { duration: 0.3 }));
  });
  tweenCue(s, c, 'weighted-uniform', showUniform, 1, { duration: 0.45 });
  tweenCue(s, c, 'weighted-weights', showWeights, 1, { duration: 0.45 });
  tweenCue(s, c, 'weighted-numerator', showNum, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'weighted-integer', showIntMean, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'weighted-float', showFloatMean, 1, { duration: 0.45, after: true });

  tweenCue(s, c, 'weighted-reduction-2', showCombine, 0.5, { duration: 0.35 });
  tweenCue(s, c, 'weighted-combine', showCombine, 1, { duration: 0.45 });
  c.show('weighted-combine', eqCombine);
}
