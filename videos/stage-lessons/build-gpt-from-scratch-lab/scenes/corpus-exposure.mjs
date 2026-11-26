// Scene 06: How many predictions did training score? (Corpus split, exposure, loss references)
import {
  CORPUS,
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function corpusExposure(s, c) {
  const phase = s.value(0);
  const tokenized = s.value(0);
  const splitShown = s.value(0);
  const batchShown = s.value(0);
  const exposureFill = s.value(0);
  const valShown = s.value(0);
  const refUniform = s.value(0);
  const refConst = s.value(0);

  const bgAura = aura(0, 0, 660, '#19306626', '#2a1d5414');
  const title = heroTitle(['How Many Predictions', 'Did Training Score?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'SHAKESPEARE CORPUS · EXPOSURE & LOSS BASELINES',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const tok = tokenized.value;
    const spl = splitShown.value;
    const bat = batchShown.value;
    const exp = exposureFill.value;
    const val = valShown.value;
    const uni = refUniform.value;
    const cst = refConst.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);

    const barW = 1660;
    const barX = -830;
    const barY = -125;
    const barH = 66;
    const trainW = barW * 0.9;
    const valW = barW * 0.1;

    const nodes = [
      txt(
        tok > 0.3
          ? `ORDERED TOKEN STREAM · ${CORPUS.tokens.toLocaleString('en-US')} TOKENS (4.54 MB)`
          : 'BUNDLED SHAKESPEARE FILE (4.54 MB)',
        barX,
        barY - 66,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      // Full stream track
      rect(barW, barH, { fill: '#111626', stroke: COSMOS.rule, width: 2, radius: 10 }).at(0, barY),
    ];

    if (tok > 0.05) {
      if (spl < 0.05) {
        nodes.push(
          rect(barW * tok, barH - 4, { fill: '#183a5c', stroke: COSMOS.cyan, width: 2, radius: 8 })
            .at(barX + barW * tok * 0.5, barY)
            .glow(6, COSMOS.cyan),
        );
      } else {
        // Contiguous 90% train prefix + 10% validation suffix
        nodes.push(
          rect(trainW - 4, barH - 4, { fill: '#143356', stroke: COSMOS.cyan, width: 2, radius: 8 })
            .at(barX + trainW * 0.5, barY)
            .glow(6, COSMOS.cyan),
          rect(valW - 4, barH - 4, { fill: '#352910', stroke: COSMOS.gold, width: 2, radius: 8 })
            .at(barX + trainW + valW * 0.5, barY)
            .glow(7, COSMOS.gold),
          txt(
            `90% TRAIN · ${CORPUS.train.toLocaleString('en-US')}`,
            barX + trainW * 0.5,
            barY + 2,
            28,
            COSMOS.ink,
            'mono',
          ),
          txt('10% VAL', barX + trainW + valW * 0.5, barY + 2, 26, COSMOS.gold, 'mono'),
        );
      }
    }

    // Sampled exposure overlay inside train prefix (16.4%)
    if (exp > 0.05) {
      const scoredW = trainW * CORPUS.fraction * exp;
      nodes.push(
        rect(scoredW, barH - 12, { fill: COSMOS.emerald, stroke: null, radius: 6 })
          .at(barX + 4 + scoredW * 0.5, barY)
          .glow(9 * pulse, COSMOS.emerald)
          .opacity(0.85),
      );
    }

    // Middle left: batch and update exposure telemetry (show corpus stats from Beat 1 so lower canvas is balanced)
    const expAlpha = Math.max(0.45, bat);
    const curSteps = bat > 0.1 ? Math.round(1 + 320 * exp) : 0;
    const curScored = curSteps * CORPUS.targetsPerUpdate;
    nodes.push(
      txt('TRAINING EXPOSURE', -830, 12, 26, COSMOS.cyan, 'mono', 'left').opacity(expAlpha),
      txt(
        bat > 0.1
          ? '12 windows x 48 targets = 576 / update'
          : 'Random init · bundled Shakespeare (1,255,253 tokens)',
        -830,
        62,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(expAlpha),
      txt(
        bat > 0.1
          ? `${curSteps} updates -> ${curScored.toLocaleString('en-US')} scored predictions`
          : `90% Train: ${CORPUS.train.toLocaleString('en-US')}  ·  10% Val: ${CORPUS.validation.toLocaleString('en-US')}`,
        -830,
        122,
        32,
        bat > 0.1 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      )
        .glow(6, bat > 0.1 ? COSMOS.emerald : COSMOS.gold)
        .opacity(expAlpha),
      txt(
        bat > 0.1 && exp > 0.05
          ? `= ${(CORPUS.fraction * 100 * exp).toFixed(1)}% of train length (with replacement)`
          : 'File-order split preserves authentic neighbors inside each slice',
        -830,
        174,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(expAlpha),
    );

    if (val > 0.05) {
      nodes.push(
        txt(
          `Validation check: 8 batches = ${CORPUS.validationScored.toLocaleString('en-US')} targets`,
          -830,
          248,
          28,
          COSMOS.gold,
          'mono',
          'left',
        ).opacity(val),
      );
    }

    // Right side: Two loss references (show baseline ruler early at low emphasis, illuminate on cue)
    const gx = 120;
    const maxBar = 620;
    const uniW = maxBar;
    const cstW = Math.max(16, maxBar * (CORPUS.constantLoss / CORPUS.uniformLoss));
    const uniAlpha = Math.max(0.32, uni);
    nodes.push(
      txt('LOSS SANITY REFERENCES (NATS / TOKEN)', gx, 12, 26, COSMOS.gold, 'mono', 'left').opacity(
        uniAlpha,
      ),
      txt(
        'Uniform over 17,485 active IDs:  ln(17,485)',
        gx,
        72,
        28,
        COSMOS.ink,
        'sans',
        'left',
      ).opacity(uniAlpha),
      rect(uniW * Math.max(0.25, uni), 42, { fill: COSMOS.cyan, stroke: null, radius: 7 })
        .at(gx + uniW * Math.max(0.25, uni) * 0.5, 124)
        .glow(uni > 0.3 ? 8 : 2, COSMOS.cyan)
        .opacity(uniAlpha),
      txt(
        `${CORPUS.uniformLoss.toFixed(2)} nats`,
        gx + uniW + 18,
        126,
        30,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(uniAlpha),
    );

    if (cst > 0.05) {
      nodes.push(
        txt(
          'Blind 90% constant predictor (4-token skew)',
          gx,
          206,
          28,
          COSMOS.rose,
          'sans',
          'left',
        ).opacity(cst),
        rect(cstW, 42, { fill: COSMOS.rose, stroke: null, radius: 7 })
          .at(gx + cstW * 0.5, 258)
          .glow(8, COSMOS.rose)
          .opacity(cst),
        txt(
          `~${CORPUS.constantLoss.toFixed(2)} nats (low loss without reading inputs!)`,
          gx + cstW + 24,
          260,
          28,
          COSMOS.rose,
          'mono',
          'left',
        ).opacity(cst),
        glowDot(gx + 10, 342, { radius: 6, color: COSMOS.emerald, opacity: cst }),
        txt(
          'Test leakage: perturb a future input & compare earlier logits',
          gx + 36,
          344,
          26,
          COSMOS.emerald,
          'sans',
          'left',
        ).opacity(cst),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('corpus-exposure-1', () => s.play(tokenized.to(0.25, { duration: 0.4 })));
  c.on('corpus-tokenize', () => s.play(tokenized.to(1, { duration: 0.6 })));
  c.on('corpus-split', () => s.play(splitShown.to(1, { duration: 0.55 })));
  c.on('corpus-exposure-2', () => s.play(batchShown.to(1, { duration: 0.45 })));
  c.on('score-exposure', () => s.play(exposureFill.to(0.65, { duration: 0.65 })));
  c.on('sampled-fraction', () => s.play(exposureFill.to(1, { duration: 0.55 })));
  c.on('validation-exposure', () => s.play(valShown.to(1, { duration: 0.45 })));
  c.on('corpus-exposure-3', () => s.play(refUniform.to(0.6, { duration: 0.45 })));
  c.on('uniform-reference', () => s.play(refUniform.to(1, { duration: 0.45 })));
  c.on('constant-reference', () =>
    s.play(refConst.to(1, { duration: remainDuration(c, 'constant-reference', 0.6) })),
  );
}
