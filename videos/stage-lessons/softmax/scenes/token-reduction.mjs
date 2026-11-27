// Scene 17 (token-reduction): "Remove ignored positions from both sums"
// ignore_index=-100 drops row 3 from numerator & denominator -> token-pooled (0.5) vs seq-mean (1.0) -> all-ignored NaN guard.
import {
  COSMOS,
  DANGER_COLOR,
  DOG_TRACE,
  FRESH_TRACE,
  MARK_COLOR,
  MODEL,
  TARGET_COLOR,
  WORD_COLOR,
  aura,
  crossSwap,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function tokenReduction(s, c) {
  const vIgnore = s.value(1);
  const vPool = s.value(0);
  const vEmpty = s.value(0);

  // View 1 state
  const showZeroLoss = s.value(0);
  const showLossSum = s.value(0);
  const showDenom = s.value(0);
  const mutateIgnored = s.value(0);

  // View 2 state
  const showPooled = s.value(0);
  const showSeqGroup = s.value(0);
  const showSeqMeans = s.value(0);

  // View 3 state
  const showNan = s.value(0);
  const showSkip = s.value(0);
  const showContext = s.value(0);

  const bgAura = aura(0, 20, 620, '#14384430', '#3a193218');
  const title = heroTitle(['Ignored Targets', '& Reduction Divisors'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.cyan,
    eyebrow: 'MASKED TOKEN REDUCTION',
  });

  // View 1: 3-row batch with row 3 = ignore_index (-100)
  const viewIgnore = guardedDynamic(vIgnore, (a) => {
    const mut = mutateIgnored.value;
    const z3 = mut > 0.5 ? '[999, -999, 42]' : '[100, -100, 0]';

    const nodes = [
      txt('BATCH WITH ignore_index = −100', -855, -240, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('ROW', -855, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('LOGITS', -650, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('TARGET', -160, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('LOSS', 175, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('COUNTED?', 500, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      rule(-855, -135, 855, -135, COSMOS.rule, 2).opacity(a),
    ];

    const rows = [
      {
        y: -70,
        id: 'pos 1',
        z: '[3.0, 1.0, 0.0]',
        t: 'docs (1)',
        l: `${DOG_TRACE.loss.toFixed(3)}`,
        cnt: '+1',
        col: TARGET_COLOR,
      },
      {
        y: 15,
        id: 'pos 2',
        z: '[0.5, 0.0, 2.0]',
        t: 'today (2)',
        l: `${FRESH_TRACE.loss.toFixed(3)}`,
        cnt: '+1',
        col: WORD_COLOR[2],
      },
      {
        y: 100,
        id: 'pos 3',
        z: z3,
        t: '−100 (ignore)',
        l: '0.000 (grad 0)',
        cnt: '+0',
        col: COSMOS.dim,
      },
    ];

    rows.forEach((r, idx) => {
      const isIgn = idx === 2;
      nodes.push(
        txt(r.id, -855, r.y, 28, isIgn ? COSMOS.dim : COSMOS.ink, 'mono', 'left').opacity(a),
        txt(
          r.z,
          -650,
          r.y,
          28,
          isIgn && mut > 0.5 ? MARK_COLOR : isIgn ? COSMOS.dim : COSMOS.cyan,
          'mono',
          'left',
        ).opacity(a),
        txt(r.t, -160, r.y, 28, r.col, 'mono', 'left').opacity(a),
        txt(r.l, 175, r.y, 28, isIgn ? COSMOS.dim : MARK_COLOR, 'mono', 'left').opacity(
          isIgn ? Math.max(0.35, showZeroLoss.value) * a : a,
        ),
        txt(r.cnt, 550, r.y, 28, isIgn ? COSMOS.dim : TARGET_COLOR, 'mono', 'left').opacity(a),
      );
    });

    if (showLossSum.value > 0.02) {
      nodes.push(
        rule(-855, 168, 855, 168, COSMOS.rule, 2).opacity(showLossSum.value * a),
        txt(
          `Numerator = ${MODEL.sequence.numerator.toFixed(3)} nats`,
          -855,
          232,
          32,
          MARK_COLOR,
          'mono',
          'left',
        ).opacity(showLossSum.value * a),
      );
    }
    if (showDenom.value > 0.02) {
      nodes.push(
        txt(
          `Divisor = ${MODEL.sequence.count} scored tokens  →  mean = ${MODEL.sequence.mean.toFixed(3)} nats`,
          -200,
          232,
          32,
          TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(7, TARGET_COLOR)
          .opacity(showDenom.value * a),
      );
    }
    if (mut > 0.2) {
      nodes.push(
        txt(
          'Changing row 3 logits leaves numerator, divisor, and mean completely untouched',
          -855,
          325,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(mut * a),
      );
    }

    return nodes;
  });

  // View 2: Token-pooled mean (2/4 = 0.5) vs Sequence-equal mean ((2+0)/2 = 1.0)
  const viewPool = guardedDynamic(vPool, (a) => {
    const nodes = [
      txt(
        'TWO SEQUENCES OF DIFFERENT LENGTHS',
        -855,
        -240,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Seq A (1 token):', -855, -140, 30, WORD_COLOR[0], 'sans', 'left').opacity(a),
      lumBar(-430, -140, 210, 64, { color: WORD_COLOR[0], fillOpacity: 0.45, glow: 8, opacity: a }),
      txt('loss = 2.0', -430, -140, 28, COSMOS.ink, 'mono').opacity(a),

      txt('Seq B (3 tokens):', -855, -35, 30, TARGET_COLOR, 'sans', 'left').opacity(a),
      ...[0, 1, 2].flatMap((k) => [
        lumBar(-430 + k * 235, -35, 210, 64, {
          color: TARGET_COLOR,
          fillOpacity: 0.28,
          glow: 6,
          opacity: a,
        }),
        txt('loss = 0.0', -430 + k * 235, -35, 28, COSMOS.ink, 'mono').opacity(a),
      ]),
      // Persistent summary footer bar keeping lower canvas balanced before pooled/mean reveal
      rule(-855, 58, 855, 58, COSMOS.cyan, 2.2).opacity(0.6 * a),
      txt(
        '4 total scored tokens across 2 sequences (total loss = 2.0)',
        -855,
        240,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Pool tokens (÷4)  vs  Equal sequence weight (÷2)',
        855,
        385,
        26,
        COSMOS.cyan,
        'mono',
        'right',
      ).opacity(a),
    ];

    if (showPooled.value > 0.02) {
      nodes.push(
        txt('PYTORCH DEFAULT (TOKEN-POOLED):', -855, 105, 26, COSMOS.cyan, 'mono', 'left').opacity(
          showPooled.value * a,
        ),
        txt('(2 + 0 + 0 + 0) / 4 = 0.500', -855, 158, 38, COSMOS.cyan, 'mono', 'left')
          .glow(8, COSMOS.cyan)
          .opacity(showPooled.value * a),
      );
    }

    if (showSeqGroup.value > 0.02) {
      nodes.push(
        rule(40, 85, 40, 235, COSMOS.rule, 2).opacity(showSeqGroup.value * a),
        txt('SEQUENCE-EQUAL WEIGHTING:', 105, 105, 26, MARK_COLOR, 'mono', 'left').opacity(
          showSeqGroup.value * a,
        ),
      );
    }

    if (showSeqMeans.value > 0.02) {
      nodes.push(
        txt('(mean 2.0 + mean 0.0) / 2 = 1.000', 105, 158, 36, MARK_COLOR, 'mono', 'left')
          .glow(8, MARK_COLOR)
          .opacity(showSeqMeans.value * a),
        txt(
          'Microbatch accumulation: sum(losses) / sum(scored_tokens) matches pooled mean',
          -855,
          310,
          28,
          TARGET_COLOR,
          'sans',
          'left',
        ).opacity(showSeqMeans.value * a),
      );
    }

    return nodes;
  });

  // View 3: All-ignored batch -> 0 / 0 = NaN -> guard before optimizer.step()
  const viewEmpty = guardedDynamic(vEmpty, (a) => {
    const nodes = [
      txt('ALL-IGNORED BATCH (0 SUPERVISED TOKENS)', -855, -235, 28, DANGER_COLOR, 'mono', 'left')
        .glow(6, DANGER_COLOR)
        .opacity(a),
      ...[0, 1, 2].flatMap((k) => [
        lumBar(-560 + k * 405, -110, 370, 78, {
          color: COSMOS.dim,
          fillOpacity: 0.14,
          dash: [8, 6],
          glow: 3,
          opacity: a,
        }),
        txt(`pos ${k + 1}: target = −100`, -560 + k * 405, -110, 26, COSMOS.muted, 'mono').opacity(
          a,
        ),
      ]),
      rule(-855, 198, 855, 198, COSMOS.cyan, 2.2).opacity(0.6 * a),
      txt(
        'SUPERVISED COUNT: 0 / 3   ·   LOSS NUMERATOR: 0.000   ·   DIVISOR: 0',
        -855,
        365,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
    ];

    if (showNan.value > 0.02) {
      nodes.push(
        txt(
          'sum = 0,  count = 0   ⇒   mean cross-entropy = 0 / 0 = NaN',
          -855,
          30,
          34,
          DANGER_COLOR,
          'mono',
          'left',
        )
          .glow(8, DANGER_COLOR)
          .opacity(showNan.value * a),
      );
    }
    if (showSkip.value > 0.02) {
      nodes.push(
        txt(
          'GUARD:  if supervised_count == 0: skip backward & optimizer.step()',
          -855,
          145,
          30,
          TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(7, TARGET_COLOR)
          .opacity(showSkip.value * a),
      );
    }
    if (showContext.value > 0.02) {
      nodes.push(
        txt(
          'Remember: ignored loss tokens still serve as input context (loss mask ≠ attention mask)',
          -855,
          265,
          28,
          COSMOS.cyan,
          'sans',
          'left',
        ).opacity(showContext.value * a),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, viewIgnore, viewPool, viewEmpty);

  // Beat 0
  c.on('token-reduction-0', () => {
    s.play(showZeroLoss.to(0.3, { duration: 0.3 }));
  });
  tweenCue(s, c, 'ignore-zero-loss', showZeroLoss, 1, { duration: 0.4 });
  tweenCue(s, c, 'ignore-loss-sum', showLossSum, 1, { duration: 0.45 });
  tweenCue(s, c, 'ignore-denominator', showDenom, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ignore-row-change', mutateIgnored, 1, { duration: 0.55 });

  // Beat 1
  crossSwap(s, c, 'token-reduction-1', vIgnore, vPool, { duration: 0.55 });
  tweenCue(s, c, 'ignore-pooled', showPooled, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ignore-sequence-group', showSeqGroup, 1, { duration: 0.4 });
  tweenCue(s, c, 'ignore-means', showSeqMeans, 1, { duration: 0.45, after: true });

  // Beat 2
  crossSwap(s, c, 'token-reduction-2', vPool, vEmpty, { duration: 0.55 });
  c.on('ignore-empty', () => {
    s.play(showNan.to(0.15, { duration: 0.25 }));
  });
  tweenCue(s, c, 'ignore-empty-nan', showNan, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ignore-empty-decision', showSkip, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'ignore-input-context', showContext, 1, { duration: 0.45 });
}
