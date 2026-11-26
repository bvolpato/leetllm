// Act 3 (Scenes 13-17): Chain-Rule Sequence Probability, Teacher Forcing & Masks,
// Label Shift & Pad/EOS Contract, Cross-Entropy Loss & Perplexity / Tokenization Trap,
// and Pooled Evaluation, Sliding Stride & Bits-per-Byte.
import { arrow, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  LOSS,
  ROLE,
  SENTENCE,
  SPLIT_CAT,
  TARGET_PROBS,
  cinemaGrid,
  clamp01,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  neonCurve,
  rule,
  scaleTrack,
  tokenChip,
  txt,
  voiceSpan,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 13. sequence: Score "The cat sat end" by the chain rule
// Cues: sequence-the, sequence-cat, sequence-sat, sequence-end*
// ---------------------------------------------------------------------------
export function sequence(s, c) {
  const pThe = s.value(0);
  const pCat = s.value(0);
  const pSat = s.value(0);
  const pEnd = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.prob, seed: 13 }));
  s.add(decorAura(-240, 20, 500, '#60a5fa1f', '#07091000'));
  s.add(decorAura(420, 40, 460, '#ffd16618', '#07091000'));

  const headline = heroTitle(['Chain Rule:', 'Multiply Every Step'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.target,
    eyebrow: 'EXACT SEQUENCE FACTORIZATION  P(w_1..w_n)',
  });

  const stepCols = [ROLE.prefix, ROLE.alt, ROLE.prob, ROLE.target];
  const stepNames = [
    'P(The | start) = 0.8',
    'P(cat | The) = 0.6',
    'P(sat | The cat) = 0.6',
    'P(end | The cat sat) = 0.8',
  ];

  const visual = dynamic(() => {
    const vals = [pThe.value, pCat.value, pSat.value, pEnd.value];
    const nodes = [];

    const sx = -810;
    const fullW = 720;
    const rowYs = [-190, -58, 74, 206];
    const cumProbs = [0.8, 0.48, 0.288, 0.2304];

    // Nested shrinking chain-rule probability cascade
    for (let i = 0; i < 4; i++) {
      const y = rowYs[i];
      const prevW = i === 0 ? fullW : fullW * cumProbs[i - 1];
      const curW = fullW * cumProbs[i];
      const act = vals[i];
      const col = stepCols[i];

      nodes.push(scaleTrack(sx, y, prevW, 56, { stroke: '#2c3d63', radius: 10 }));
      if (i < 3 || act > 0.04) {
        const w = mix(prevW, curW, act);
        nodes.push(
          glowBar(sx, y, Math.max(8, w), 50, col, {
            glow: 9 * mix(0.35, 1, act),
            radius: 9,
            opacity: i === 3 ? act : mix(0.45, 1, act),
          }),
          txt(
            act > 0.45 ? `${SENTENCE[i]}  (${(cumProbs[i] * 100).toFixed(1)}%)` : SENTENCE[i],
            sx + prevW + 24,
            y,
            28,
            col,
            'mono',
            'left',
          ).opacity(i === 3 ? act : 1),
        );
      } else {
        nodes.push(
          txt(
            'Does "The cat sat" stop here?',
            sx + prevW + 24,
            y,
            28,
            ROLE.target,
            'serif',
            'left',
          ),
        );
      }
      nodes.push(txt(stepNames[i], sx, y - 54, 26, act > 0.35 ? col : COSMOS.dim, 'mono', 'left'));
    }

    // Right readout: Prefix 28.8% vs Stopped Sentence 23.04%
    const rx = 250;
    const preEnd = fadeOut(vals[3]);
    if (preEnd > 0.02) {
      nodes.push(
        group(
          txt('PREFIX PROBABILITY', rx, -135, 26, ROLE.prob, 'mono', 'left'),
          txt(
            vals[2] > 0.4 ? '28.8%' : vals[1] > 0.4 ? '48.0%' : '80.0%',
            rx,
            -48,
            78,
            ROLE.prob,
            'mono',
            'left',
          ).glow(11, ROLE.prob),
          txt(
            vals[2] > 0.4
              ? '0.8 × 0.6 × 0.6 = 0.288'
              : vals[1] > 0.4
                ? '0.8 × 0.6 = 0.480'
                : 'P(The | start) = 0.800',
            rx,
            45,
            30,
            COSMOS.muted,
            'mono',
            'left',
          ),
          txt('Includes longer continuations!', rx, 115, 28, ROLE.warm, 'serif', 'left'),
        ).opacity(preEnd),
      );
    }

    const postEnd = fadeIn(vals[3]);
    if (postEnd > 0.02) {
      nodes.push(
        group(
          txt('FINISHED SENTENCE (WITH END)', rx, -155, 26, ROLE.target, 'mono', 'left'),
          txt('23.04%', rx, -68, 78, ROLE.target, 'mono', 'left').glow(13, ROLE.target),
          glowTex('0.8 \\times 0.6 \\times 0.6 \\times 0.8 = 0.2304', {
            x: rx + 275,
            y: 35,
            size: 34,
            color: ROLE.target,
          }),
          glowTex('P(w_{1..n}) = \\prod_{t=1}^{n} P(w_t \\mid w_{<t})', {
            x: rx + 275,
            y: 145,
            size: 36,
            color: ROLE.prefix,
          }),
        ).opacity(postEnd),
      );
    }

    nodes.push(
      txt(
        vals[3] > 0.5
          ? 'Exact chain rule: no independence assumption; explicit <eos> scores termination'
          : 'Each factor keeps only a slice of the probability that reached its prefix',
        0,
        365,
        28,
        COSMOS.muted,
        'serif',
      ),
    );
    return group(...nodes);
  });

  s.add(headline, visual);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'sequence-the', pThe, 1, { dur: 0.7 });
  cueTo(s, c, 'sequence-cat', pCat, 1, { dur: 0.7 });
  cueTo(s, c, 'sequence-sat', pSat, 1, { dur: 0.7 });
  cueTo(s, c, 'sequence-end', pEnd, 1, { after: true, dur: 0.75 });
}

// ---------------------------------------------------------------------------
// 14. teacher-forcing: Parallel Shifted Targets, Causal Mask & Loss Mask
// Cues: teacher-shift, teacher-first, teacher-second, teacher-third, teacher-fourth,
//       teacher-prefix, teacher-block, teacher-loss-mask
// ---------------------------------------------------------------------------
export function teacherForcing(s, c) {
  const shiftP = s.value(0);
  const focusIdx = s.value(-1);
  const blockP = s.value(0);
  const maskP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.prefix, seed: 14 }));
  s.add(decorAura(-280, 0, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(430, 0, 460, '#ff6b8b18', '#07091000'));

  const headline = heroTitle(['Teacher Forcing', '& Two Distinct Masks'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefix,
    eyebrow: 'SHIFTED RAILS  ·  CAUSAL ATTENTION MASK  vs  LOSS MASK',
  });

  const inputs = ['start', 'The', 'cat', 'sat'];
  const targets = SENTENCE;

  const visual = dynamic(() => {
    const sh = shiftP.value;
    const fi = Math.round(focusIdx.value);
    const bl = blockP.value;
    const mk = maskP.value;
    const nodes = [];

    // Left: Aligned Input rail -> Shifted Target rail
    const x0 = -760;
    const stepX = 215;
    const yIn = -95;
    const yOut = 115;

    nodes.push(
      txt('GROUND-TRUTH INPUTS', x0 - 70, yIn - 82, 26, ROLE.prefix, 'mono', 'left'),
      txt('SHIFTED TARGETS', x0 - 70, yOut + 82, 26, ROLE.alt, 'mono', 'left'),
    );

    for (let i = 0; i < 4; i++) {
      const cx = x0 + i * stepX;
      const isFocused = fi === i;
      const isVisiblePrefix = bl > 0.2 ? i <= 2 : true;
      const isBlockedInput = bl > 0.2 && i === 3;
      const isLossIgnored = mk > 0.3 && i < 2;

      const inCol = isBlockedInput
        ? ROLE.danger
        : isFocused
          ? ROLE.target
          : isVisiblePrefix
            ? ROLE.prefix
            : COSMOS.dim;
      const outCol = isLossIgnored ? COSMOS.dim : isFocused ? ROLE.target : ROLE.alt;

      nodes.push(
        tokenChip(inputs[i], cx, yIn, inCol, {
          w: 162,
          h: 66,
          size: 28,
          glow: isFocused ? 12 : isBlockedInput ? 8 : 5,
          opacity: isBlockedInput ? 0.55 : 1,
        }),
      );

      // Vertical arrow from input[i] to target[i]
      nodes.push(
        arrow([cx, yIn + 40], [cx, yOut - 40], {
          stroke: isLossIgnored ? '#334263' : isFocused ? ROLE.target : ROLE.alt,
          width: isFocused ? 4 : 2.6,
        }).opacity(mix(0.3, 1, sh)),
      );

      nodes.push(
        tokenChip(isLossIgnored ? '-100' : targets[i], cx, yOut, outCol, {
          w: 162,
          h: 66,
          size: 28,
          glow: isLossIgnored ? 0 : isFocused ? 12 : 6 * sh,
          dash: isLossIgnored || sh < 0.35 ? [7, 5] : null,
          opacity: mix(0.35, isLossIgnored ? 0.5 : 1, sh),
        }),
      );
    }

    // Causal wall between cat (i=2) and sat (i=3)
    if (bl > 0.05) {
      const wallX = x0 + 2.5 * stepX;
      nodes.push(
        line([wallX, yIn - 65], [wallX, yIn + 65], {
          stroke: ROLE.danger,
          width: 4.5,
        })
          .glow(12, ROLE.danger)
          .opacity(bl),
        txt('NO FUTURE READ', wallX, yIn - 86, 26, ROLE.danger, 'mono').opacity(bl),
      );
    }

    // Right: 4x4 Lower-Triangular Causal Attention Matrix
    const mx = 340;
    const my = -135;
    const cell = 84;
    nodes.push(txt('4×4 CAUSAL ATTENTION MASK', mx + 125, -210, 26, ROLE.prefix, 'mono'));
    for (let r = 0; r < 4; r++) {
      nodes.push(txt(inputs[r], mx - 68, my + r * cell, 26, COSMOS.muted, 'mono', 'right'));
      for (let colIdx = 0; colIdx < 4; colIdx++) {
        const cx = mx + colIdx * cell;
        const cy = my + r * cell;
        const allowed = colIdx <= r;
        const hiRow = (bl > 0.2 && r === 2) || (fi === r && bl < 0.2);
        const fill = allowed
          ? hiRow
            ? `${ROLE.prefix}bb`
            : `${ROLE.prefix}44`
          : bl > 0.2 && r === 2
            ? `${ROLE.danger}55`
            : '#11182c';
        const stroke = allowed ? ROLE.prefix : bl > 0.2 && r === 2 ? ROLE.danger : '#263354';
        nodes.push(
          rect(cell - 8, cell - 8, { fill, stroke, width: hiRow ? 2.4 : 1.4, radius: 8 }).at(
            cx,
            cy,
          ),
          txt(
            allowed ? '1' : '-inf',
            cx,
            cy + 2,
            26,
            allowed ? '#070910' : ROLE.danger,
            'mono',
          ).opacity(allowed ? 1 : mix(0.45, 1, bl)),
        );
      }
    }

    nodes.push(
      txt(
        mk > 0.4
          ? 'Loss mask (-100) ignores targets 0-1 while keeping their input tokens visible to attention!'
          : bl > 0.4
            ? 'Causal mask lets all 4 positions run in parallel while blocking future tokens'
            : 'Teacher forcing feeds ground-truth tokens at every step to align all shifted targets',
        0,
        365,
        28,
        COSMOS.muted,
        'serif',
      ),
    );
    return group(...nodes);
  });

  s.add(headline, visual);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'teacher-shift', shiftP, 1, { dur: 0.75 });
  cueTo(s, c, 'teacher-first', focusIdx, 0, { dur: 0.25 });
  cueTo(s, c, 'teacher-second', focusIdx, 1, { dur: 0.25 });
  cueTo(s, c, 'teacher-third', focusIdx, 2, { dur: 0.25 });
  cueTo(s, c, 'teacher-fourth', focusIdx, 3, { dur: 0.25 });
  cueTo(s, c, 'teacher-prefix', focusIdx, 2, { dur: 0.35 });
  cueTo(s, c, 'teacher-block', blockP, 1, { dur: 0.7 });
  cueTo(s, c, 'teacher-loss-mask', maskP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 15. shift-contract: Single Shift vs Double Shift & Pad==EOS Aliasing Bug
// Beat 0: [start, function, returns, value, end] -> double shift skips "function" -> repair
// Beat 1: pad_id == eos_id kills genuine <eos>; attention-mask position identity preserves it
// ---------------------------------------------------------------------------
export function shiftContract(s, c) {
  const b0Step = s.value(0);
  const shiftOffset = s.value(1); // 1 = correct, 2 = double-shift bug, back to 1 = repaired
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.danger, seed: 15 }));
  s.add(decorAura(-240, 20, 480, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(340, 20, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Shift Once &', 'Preserve Real <eos>'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.target,
    eyebrow: 'LABEL SHIFTING CONTRACT  ·  PAD / EOS ALIASING BUG',
  });

  const seq = ['start', 'function', 'returns', 'value', 'end'];

  // View 0: Single shift vs Double shift bug -> repair
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const sh = shiftOffset.value;
      const isBug = sh > 1.35;
      const x0 = -640;
      const stepX = 320;
      const yIn = -95;
      const yLbl = 115;
      const nodes = [];

      nodes.push(
        txt(
          isBug
            ? 'DOUBLE-SHIFT BUG:  start -> returns  ("function" SKIPPED!)'
            : 'SINGLE SHIFT CONTRACT:  input[t] -> label[t+1]',
          0,
          -225,
          30,
          isBug ? ROLE.danger : ROLE.alt,
          'mono',
        ),
      );

      for (let i = 0; i < 4; i++) {
        const cx = x0 + i * stepX;
        nodes.push(
          tokenChip(seq[i], cx, yIn, ROLE.prefix, { w: 220, h: 72, size: 30, glow: 8 }),
          txt(`idx ${i}`, cx, yIn - 58, 26, COSMOS.dim, 'mono'),
          arrow([cx, yIn + 44], [cx, yLbl - 44], {
            stroke: isBug ? ROLE.danger : ROLE.alt,
            width: 3.5,
          }),
        );

        const tgtIdx = i + Math.round(sh);
        const tgtWord = seq[tgtIdx] ?? '(none)';
        const lblCol = isBug ? ROLE.danger : ROLE.alt;
        nodes.push(
          tokenChip(tgtWord, cx, yLbl, lblCol, {
            w: 220,
            h: 72,
            size: 30,
            glow: 9,
            dash: tgtIdx >= seq.length ? [8, 6] : null,
          }),
          txt(tgtIdx < seq.length ? `idx ${tgtIdx}` : 'dropped', cx, yLbl + 62, 26, lblCol, 'mono'),
        );
      }

      nodes.push(
        txt(
          isBug
            ? 'Pre-shifting AND calling a loss that shifts internally skips "function" entirely!'
            : 'In Transformers, DataCollator copies input_ids; the causal loss performs the one shift',
          0,
          365,
          28,
          isBug ? ROLE.danger : COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1: pad_id == eos_id aliasing bug vs attention-mask position identity
  const view1 = guardedDynamic(
    () => fadeIn(b1P.value),
    (vis) => {
      const st = b1Step.value;
      const fixed = st >= 2.6;
      const x0 = -640;
      const stepX = 320;
      const ids = ['5', '7', '9', '2', '2'];
      const roles = ['function', 'returns', 'value', 'REAL end', 'PADDING'];
      const yId = -110;
      const yLbl = 110;
      const nodes = [];

      nodes.push(
        txt(
          fixed
            ? 'REPAIRED: POSITION MASK KEEPS REAL end (idx 3), MASKS ONLY PADDING (idx 4)'
            : 'BUG: MASKING BY TOKEN ID (id == 2) ERASES REAL end TOO!',
          0,
          -225,
          28,
          fixed ? ROLE.alt : ROLE.danger,
          'mono',
        ),
      );

      for (let i = 0; i < 5; i++) {
        const cx = x0 + i * stepX;
        const isEos = i === 3;
        const isPad = i === 4;
        const idCol = isPad ? COSMOS.dim : isEos ? ROLE.target : ROLE.prefix;
        const maskedLabel = isPad || (isEos && !fixed);
        const lblText = maskedLabel ? '-100' : ids[i];
        const lblCol = isEos ? (fixed ? ROLE.alt : ROLE.danger) : isPad ? COSMOS.dim : ROLE.prefix;

        nodes.push(
          txt(roles[i], cx, yId - 62, 26, idCol, 'mono'),
          tokenChip(`id ${ids[i]}`, cx, yId, idCol, {
            w: 190,
            h: 68,
            size: 30,
            glow: isEos ? 10 : 5,
          }),
          arrow([cx, yId + 40], [cx, yLbl - 40], { stroke: lblCol, width: 3 }),
          tokenChip(lblText, cx, yLbl, lblCol, {
            w: 190,
            h: 68,
            size: 30,
            glow: isEos ? 11 : 4,
            dash: maskedLabel ? [8, 6] : null,
          }),
          txt(
            isEos ? (fixed ? 'SUPERVISED' : 'KILLED!') : isPad ? 'IGNORED' : 'SCORED',
            cx,
            yLbl + 62,
            26,
            lblCol,
            'mono',
          ),
        );
      }

      nodes.push(
        txt(
          'Causal mask controls visible inputs; loss mask controls scored targets; packed docs need boundary rules',
          0,
          365,
          26,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1);
  cueTo(s, c, 'shift-contract-b1', b0Step, 0.3, { dur: 0.4 });
  voiceSpan(s, c, 'shift-contract-voice-1', vPhase, 1);
  cueTo(s, c, 'shift-contract-step-0-1', b0Step, 1, { dur: 0.45 });
  cueTo(s, c, 'shift-contract-step-0-2', b0Step, 2, { dur: 0.45 });
  cueTo(s, c, 'shift-contract-step-0-3', b0Step, 3, { dur: 0.45 });
  cueTo(s, c, 'shift-contract-step-0-4', shiftOffset, 2, { dur: 0.65 });
  cueTo(s, c, 'shift-contract-step-0-5', shiftOffset, 1, { dur: 0.65 });

  cueTo(s, c, 'shift-contract-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'shift-contract-voice-2', vPhase, 2);
  cueTo(s, c, 'shift-contract-step-1-1', b1Step, 1, { dur: 0.45 });
  cueTo(s, c, 'shift-contract-step-1-2', b1Step, 2, { dur: 0.45 });
  cueTo(s, c, 'shift-contract-step-1-3', b1Step, 3, { dur: 0.55 });
  cueTo(s, c, 'shift-contract-step-1-4', b1Step, 4, { dur: 0.45 });
  cueTo(s, c, 'shift-contract-step-1-5', b1Step, 5, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 16. loss: Cross-Entropy Nats, Perplexity & the Resegmentation Trap
// Cues: loss-terms, loss-mean*, loss-perplexity*, loss-resegment, loss-five*
// ---------------------------------------------------------------------------
export function loss(s, c) {
  const termsP = s.value(0);
  const meanP = s.value(0);
  const pplP = s.value(0);
  const splitP = s.value(0);
  const fiveP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.target, seed: 16 }));
  s.add(decorAura(-260, 0, 480, '#ffd1661c', '#07091000'));
  s.add(decorAura(380, 20, 460, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Negative Log Loss', '& Perplexity'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.target,
    eyebrow: 'SURPRISAL LENGTH IN NATS  ·  TOKENIZATION INVARIANCE TRAP',
  });

  const nlls = TARGET_PROBS.map((p) => -Math.log(p));
  const totalNats = nlls.reduce((a, b) => a + b, 0);
  const mean4 = totalNats / 4;
  const ppl4 = Math.exp(mean4);
  const mean5 = totalNats / 5;
  const ppl5 = Math.exp(mean5);
  const segCols = [ROLE.prefix, ROLE.alt, ROLE.prob, ROLE.target];

  const visual = dynamic(() => {
    const tm = termsP.value;
    const mn = meanP.value;
    const pp = pplP.value;
    const sp = splitP.value;
    const fv = fiveP.value;
    const nodes = [];

    // Ribbon 1: 4-token sentence total NLL length = 1.468 nats
    const sx = -810;
    const totalW = 1080;
    const y1 = -135;
    const pxPerNat = totalW / totalNats;

    nodes.push(
      txt(
        '4-TOKEN SENTENCE:  TOTAL SURPRISAL = 1.468 NATS',
        sx,
        y1 - 80,
        26,
        ROLE.prefix,
        'mono',
        'left',
      ),
      scaleTrack(sx, y1, totalW, 74, { radius: 12 }),
    );
    let curX = sx;
    SENTENCE.forEach((word, i) => {
      const w = nlls[i] * pxPerNat;
      nodes.push(
        glowBar(curX, y1, Math.max(8, w - 4), 68, segCols[i], {
          glow: 8 * mix(0.35, 1, tm),
          radius: 9,
          opacity: mix(0.5, 1, tm),
        }),
      );
      if (w > 95) {
        nodes.push(
          txt(`${word}`, curX + w / 2, y1 - 12, 26, '#070910', 'mono'),
          txt(`${nlls[i].toFixed(2)}`, curX + w / 2, y1 + 16, 26, '#070910', 'mono'),
        );
      }
      curX += w;
    });

    // Right readout for 4-token mean & perplexity
    const rx = 345;
    nodes.push(
      txt('4 TARGETS', rx, y1 - 80, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        mn > 0.3 ? `mean = ${mean4.toFixed(3)} nats` : 'mean = ? / 4',
        rx,
        y1 - 14,
        30,
        mn > 0.3 ? ROLE.target : COSMOS.dim,
        'mono',
        'left',
      ),
      txt(
        pp > 0.3 ? `PPL = e^L = ${ppl4.toFixed(2)}` : 'PPL = exp(mean)',
        rx,
        y1 + 34,
        34,
        pp > 0.3 ? ROLE.target : COSMOS.dim,
        'mono',
        'left',
      ).glow(pp > 0.3 ? 10 : 0, ROLE.target),
    );

    // Ribbon 2 (appears when splitP rises, ghost/curve beforehand)
    const y2 = 125;
    if (sp < 0.05) {
      // Surprisal curve -ln(p) in lower canvas so frame is richly filled from t=0
      const cx0 = -760;
      const cx1 = 180;
      const cyBot = 245;
      const cyTop = 25;
      const pts = [];
      for (let k = 0; k <= 40; k++) {
        const p = 0.25 + (k / 40) * 0.75;
        const x = mix(cx0, cx1, (p - 0.25) / 0.75);
        const y = mix(cyBot, cyTop, -Math.log(p) / 1.5);
        pts.push([x, y]);
      }
      nodes.push(
        txt('SURPRISAL FUNCTION  -ln(p)', cx0, cyTop - 42, 26, ROLE.warm, 'mono', 'left'),
        rule(cx0, cyBot, cx1, cyBot, '#3a4e7c', 2.4),
        neonCurve(pts, [ROLE.danger, ROLE.warm, ROLE.prefix], { width: 4, glow: 9 }),
        glowDot(mix(cx0, cx1, (0.6 - 0.25) / 0.75), mix(cyBot, cyTop, -Math.log(0.6) / 1.5), {
          radius: 10,
          color: ROLE.alt,
          glow: 12,
        }),
        txt(
          'p=0.6 -> 0.51 nats',
          mix(cx0, cx1, (0.6 - 0.25) / 0.75) + 15,
          mix(cyBot, cyTop, -Math.log(0.6) / 1.5) - 36,
          26,
          ROLE.alt,
          'mono',
          'left',
        ),
        glowDot(mix(cx0, cx1, (0.8 - 0.25) / 0.75), mix(cyBot, cyTop, -Math.log(0.8) / 1.5), {
          radius: 10,
          color: ROLE.prefix,
          glow: 12,
        }),
        txt(
          'p=0.8 -> 0.22 nats',
          mix(cx0, cx1, (0.8 - 0.25) / 0.75) - 10,
          mix(cyBot, cyTop, -Math.log(0.8) / 1.5) - 36,
          26,
          ROLE.prefix,
          'mono',
          'left',
        ),
        glowTex('\\text{PPL} = e^{\\mathcal{L}} = \\left(\\prod_{t=1}^{n} P_t\\right)^{-1/n}', {
          x: 565,
          y: 135,
          size: 36,
          color: ROLE.prefix,
        }),
      );
    } else {
      // Resegmented 5-token copy ("cat" split into "c" 0.75 + "at" 0.80 -> exact same total width!)
      const splitToks = ['The', 'c', 'at', 'sat', 'end'];
      const splitProbs = [
        TARGET_PROBS[0],
        SPLIT_CAT[0],
        SPLIT_CAT[1],
        TARGET_PROBS[2],
        TARGET_PROBS[3],
      ];
      const splitNlls = splitProbs.map((p) => -Math.log(p));
      const splitCols = [ROLE.prefix, ROLE.alt, '#34d399', ROLE.prob, ROLE.target];

      nodes.push(
        txt(
          'RESEGMENTED COPY ("c" 0.75 × "at" 0.80 = 0.60):  EXACT SAME TOTAL LENGTH!',
          sx,
          y2 - 80,
          26,
          ROLE.alt,
          'mono',
          'left',
        ),
        scaleTrack(sx, y2, totalW, 74, { stroke: ROLE.alt, radius: 12 }),
      );
      let cx2 = sx;
      splitToks.forEach((word, i) => {
        const w = splitNlls[i] * pxPerNat;
        nodes.push(glowBar(cx2, y2, Math.max(8, w - 4), 68, splitCols[i], { glow: 8, radius: 9 }));
        if (w > 82) {
          nodes.push(
            txt(word, cx2 + w / 2, y2 - 12, 26, '#070910', 'mono'),
            txt(splitNlls[i].toFixed(2), cx2 + w / 2, y2 + 16, 26, '#070910', 'mono'),
          );
        }
        cx2 += w;
      });

      // Right readout for 5-token mean & perplexity (withheld until loss-five!)
      nodes.push(
        txt('5 TARGETS (SAME TEXT)', rx, y2 - 80, 26, ROLE.alt, 'mono', 'left'),
        txt(
          fv > 0.35 ? `mean = ${mean5.toFixed(3)} nats` : 'Divide same total by 5...',
          rx,
          y2 - 14,
          30,
          fv > 0.35 ? ROLE.alt : ROLE.warm,
          'mono',
          'left',
        ),
        txt(
          fv > 0.35 ? `PPL = ${ppl5.toFixed(2)}  (LOWER!)` : 'Will PPL stay 1.44?',
          rx,
          y2 + 34,
          34,
          fv > 0.35 ? ROLE.alt : ROLE.warm,
          'mono',
          'left',
        ).glow(fv > 0.35 ? 10 : 0, ROLE.alt),
      );
    }

    nodes.push(
      txt(
        fv > 0.45
          ? 'Identical text probability (0.2304), lower token perplexity: never compare PPL across tokenizers!'
          : sp > 0.45
            ? 'Both strips end at 1.468 nats because 0.75 x 0.80 = 0.60 exactly'
            : 'Lower probability tokens stretch the surprisal bar further in nats',
        0,
        365,
        28,
        COSMOS.muted,
        'serif',
      ),
    );
    return group(...nodes);
  });

  s.add(headline, visual);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'loss-terms', termsP, 1, { dur: 0.85 });
  cueTo(s, c, 'loss-mean', meanP, 1, { after: true, dur: 0.6 });
  cueTo(s, c, 'loss-perplexity', pplP, 1, { after: true, dur: 0.65 });
  cueTo(s, c, 'loss-resegment', splitP, 1, { dur: 0.8 });
  cueTo(s, c, 'loss-five', fiveP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 17. pooled-evaluation: Batch Pooling, Strided Windows & UTF-8 Bits per Byte
// Cues: pool-batches, pool-bits, pool-mean*, pool-stride, pool-bytes, pool-bpb*
// ---------------------------------------------------------------------------
export function pooledEvaluation(s, c) {
  const batchP = s.value(0);
  const bitsP = s.value(0);
  const meanP = s.value(0);
  const strideP = s.value(0);
  const bytesP = s.value(0);
  const bpbP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.alt, seed: 17 }));
  s.add(decorAura(-320, 0, 480, '#6ee7b71a', '#07091000'));
  s.add(decorAura(340, 0, 480, '#ffd16618', '#07091000'));

  const headline = heroTitle(['Pool Targets,', 'Compare in Bits/Byte'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.alt,
    eyebrow: 'WEIGHTED BATCH POOLING  ·  STRIDED CONTEXT  ·  UTF-8 BPB',
  });

  // View 0 (Beats 0-1): Batch A (1 target + 2 pad) vs Batch B (3 targets) -> 10 bits / 4 = 2.5 -> PPL 5.66
  const view0 = guardedDynamic(
    () => fadeOut(strideP.value),
    (vis) => {
      const bt = batchP.value;
      const bi = bitsP.value;
      const mn = meanP.value;
      const nodes = [];

      // Left: Batch A & Batch B slot trays
      const bx = -760;
      const slotW = 175;
      const gap = 22;
      const drawTray = (label, y, slots) => {
        nodes.push(txt(label, bx, y - 62, 26, COSMOS.muted, 'mono', 'left'));
        slots.forEach((sl, i) => {
          const cx = bx + 90 + i * (slotW + gap);
          const col = sl.pad ? COSMOS.dim : sl.col;
          nodes.push(
            rect(slotW, 74, {
              fill: sl.pad ? '#0d1323' : `${col}22`,
              stroke: col,
              width: sl.pad ? 1.8 : 2.8,
              radius: 10,
              dash: sl.pad ? [8, 6] : null,
            })
              .at(cx, y)
              .opacity(mix(0.45, 1, bt)),
            txt(
              sl.pad ? 'PAD' : bi > 0.3 ? `${sl.bits} bit${sl.bits > 1 ? 's' : ''}` : sl.p,
              cx,
              y + 2,
              28,
              col,
              'mono',
            ),
          );
        });
      };

      drawTray('BATCH A  (1 SCORED TARGET, 2 PAD)', -115, [
        { p: 'p=1/2', bits: 1, col: ROLE.prefix },
        { pad: true },
        { pad: true },
      ]);
      drawTray('BATCH B  (3 SCORED TARGETS)', 75, [
        { p: 'p=1/8', bits: 3, col: ROLE.warm },
        { p: 'p=1/8', bits: 3, col: ROLE.warm },
        { p: 'p=1/8', bits: 3, col: ROLE.warm },
      ]);

      // Right: Pooled true perplexity (5.66) vs distorted averages (5.0 & 4.0)
      const rx = 140;
      const preMean = fadeOut(mn);
      if (preMean > 0.02) {
        nodes.push(
          group(
            txt('TOTAL SURPRISE', rx, -135, 26, ROLE.target, 'mono', 'left'),
            txt('1 + 3 + 3 + 3 = 10 bits', rx, -65, 40, ROLE.target, 'mono', 'left'),
            txt('Divided by how many targets?', rx, 25, 32, ROLE.warm, 'serif', 'left'),
            txt('Skip padding slots in the count!', rx, 85, 28, COSMOS.muted, 'sans', 'left'),
          ).opacity(preMean),
        );
      }

      const postMean = fadeIn(mn);
      if (postMean > 0.02) {
        const comp = [
          { label: 'Pooled (10 / 4 = 2.5)', val: 5.66, col: ROLE.alt },
          { label: 'Avg batch PPL (2+8)/2', val: 5.0, col: ROLE.danger },
          { label: 'Equal batch loss 2^2', val: 4.0, col: ROLE.danger },
        ];
        nodes.push(
          group(
            txt('POOLED vs DISTORTED PERPLEXITY', rx, -175, 26, ROLE.alt, 'mono', 'left'),
            ...comp.flatMap((it, i) => {
              const y = -85 + i * 105;
              return [
                txt(it.label, rx, y - 38, 26, it.col, 'mono', 'left'),
                scaleTrack(rx, y + 6, 520, 38, { radius: 8 }),
                glowBar(rx, y + 6, (it.val / 6.5) * 520, 38, it.col, { glow: 9, radius: 8 }),
                txt(it.val.toFixed(2), rx + 545, y + 6, 30, it.col, 'mono', 'left'),
              ];
            }),
          ).opacity(postMean),
        );
      }

      nodes.push(
        txt(
          mn > 0.5
            ? 'Batch B holds 3 of 4 targets, so pooling weights each scored token equally'
            : 'Each block = 1 bit of surprise: p = 1/2 costs 1 bit, p = 1/8 costs 3 bits',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 2): Strided sliding context window keeping overlap as context
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(strideP.value), fadeOut(bytesP.value)),
    (vis) => {
      const x0 = -540;
      const cell = 166;
      const nodes = [];

      nodes.push(
        txt(
          'STRIDED SLIDING WINDOW:  OVERLAP = CONTEXT ONLY, SCORE EACH TOKEN ONCE',
          0,
          -225,
          26,
          ROLE.prefix,
          'mono',
        ),
      );

      // Token tape positions 0..7
      for (let i = 0; i < 8; i++) {
        const cx = x0 + i * cell;
        const isPos3 = i === 3;
        nodes.push(
          tokenChip(`pos ${i}`, cx, -110, isPos3 ? ROLE.target : ROLE.prefix, {
            w: 145,
            h: 62,
            size: 26,
            glow: isPos3 ? 11 : 5,
          }),
        );
      }

      // Window 1 (positions 0..3 scored)
      nodes.push(
        txt('WINDOW 1', -845, 25, 26, ROLE.alt, 'mono', 'left'),
        rect(cell * 4 - 16, 56, {
          fill: `${ROLE.alt}33`,
          stroke: ROLE.alt,
          width: 2.6,
          radius: 10,
        }).at(x0 + 1.5 * cell, 25),
        txt('scored positions 0..3', x0 + 1.5 * cell, 25, 26, ROLE.alt, 'mono'),
      );

      // Window 2 (positions 2..3 context only, 4..7 scored)
      nodes.push(
        txt('WINDOW 2', -845, 130, 26, ROLE.prefix, 'mono', 'left'),
        rect(cell * 2 - 16, 56, {
          fill: `${ROLE.prefix}22`,
          stroke: ROLE.prefix,
          width: 2.2,
          dash: [8, 6],
          radius: 10,
        }).at(x0 + 2.5 * cell, 130),
        txt('context', x0 + 2.5 * cell, 130, 26, ROLE.prefix, 'mono'),
        rect(cell * 4 - 16, 56, {
          fill: `${ROLE.alt}33`,
          stroke: ROLE.alt,
          width: 2.6,
          radius: 10,
        }).at(x0 + 5.5 * cell, 130),
        txt('scored positions 4..7', x0 + 5.5 * cell, 130, 26, ROLE.alt, 'mono'),
      );

      nodes.push(
        txt(
          'Position 3 scores in Window 1 and supplies context in Window 2: keep one loss sum & one count',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 2 (Beat 3): UTF-8 11 bytes of "The cat sat" -> identical bits per byte
  const view2 = guardedDynamic(
    () => fadeIn(bytesP.value),
    (vis) => {
      const bp = bpbP.value;
      const chars = ['T', 'h', 'e', '_', 'c', 'a', 't', '_', 's', 'a', 't'];
      const x0 = -700;
      const step = 140;
      const nodes = [];

      nodes.push(
        txt(
          'COMMON UNIT ACROSS TOKENIZERS:  11 UTF-8 BYTES OF "The cat sat"',
          0,
          -210,
          26,
          ROLE.prefix,
          'mono',
        ),
      );
      chars.forEach((ch, i) => {
        const cx = x0 + i * step;
        const isSpace = ch === '_';
        nodes.push(
          tokenChip(isSpace ? 'spc' : ch, cx, -95, isSpace ? ROLE.target : ROLE.prefix, {
            w: 118,
            h: 66,
            size: 28,
            glow: 7,
          }),
          txt(`${i + 1}`, cx, -32, 26, COSMOS.dim, 'mono'),
        );
      });

      const bpbVal = (4 * LOSS) / Math.log(2) / 11;
      nodes.push(
        glowTex(
          bp > 0.4
            ? `\\text{BPB} = \\frac{1.468\\text{ nats} / \\ln 2}{11\\text{ bytes}} = ${bpbVal.toFixed(3)}\\text{ bits/byte}`
            : '\\text{bits} = \\frac{\\text{total nats}}{\\ln 2} \\quad \\text{(4-token and 5-token match!)}',
          { x: 0, y: 120, size: 42, color: bp > 0.4 ? ROLE.alt : ROLE.target },
        ),
        txt(
          '4-token PPL (1.44) and 5-token PPL (1.34) differ, yet both score the exact same 0.193 bits/byte',
          0,
          245,
          28,
          ROLE.alt,
          'sans',
        ).opacity(mix(0.35, 1, bp)),
        txt(
          'Keep encoding, boundaries & context fixed; calibration and factual accuracy still need separate checks',
          0,
          365,
          26,
          COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  s.add(headline, view0, view1, view2);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'pool-batches', batchP, 1, { dur: 0.7 });
  cueTo(s, c, 'pool-bits', bitsP, 1, { dur: 0.65 });
  cueTo(s, c, 'pool-mean', meanP, 1, { after: true, dur: 0.75 });
  cueTo(s, c, 'pool-stride', strideP, 1, { dur: 0.75 });
  cueTo(s, c, 'pool-bytes', bytesP, 1, { dur: 0.75 });
  cueTo(s, c, 'pool-bpb', bpbP, 1, { after: true, dur: 0.65 });
}
