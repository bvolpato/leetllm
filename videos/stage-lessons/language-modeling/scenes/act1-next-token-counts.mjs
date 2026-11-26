// Act 1 (Scenes 1-6): Intro Next-Token Branching, Token Prefix/Target Curtain,
// Bigram Counts & Smoothing, Full-Vocabulary Smoothing, Sparse History & Backoff,
// and Context-Sensitive Tiny Neural Head.
import { arrow, circle, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  CODE_COMMENTS,
  CORPUS,
  COSMOS,
  ROLE,
  VERBS,
  cinemaGrid,
  clamp01,
  conditionalDistribution,
  counts,
  cueTo,
  decorAura,
  fadeIn,
  fadeOut,
  glowBar,
  glowDot,
  glowTex,
  glowVBar,
  guardedDynamic,
  heroTitle,
  livingDrift,
  mix,
  rule,
  scaleTrack,
  stableSoftmax,
  tokenChip,
  txt,
  voiceSpan,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 1. intro: What follows "The cat"?
// Cues: intro-distribution, intro-slept, intro-ate, intro-append, intro-next, intro-path*
// ---------------------------------------------------------------------------
export function intro(s, c) {
  const satP = s.value(0);
  const sleptP = s.value(0);
  const ateP = s.value(0);
  const appP = s.value(0);
  const nextP = s.value(0);
  const pathP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.target, seed: 1 }));
  s.add(decorAura(-380, -20, 480, '#60a5fa22', '#07091000'));
  s.add(decorAura(340, 120, 460, '#ffd1661c', '#07091000'));

  const headline = heroTitle(['One More Word', 'Changes the Question'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.target,
    eyebrow: 'NEXT-TOKEN PROBABILITY TREE',
  });

  const row1 = conditionalDistribution('The cat');
  const row2 = conditionalDistribution('The cat sat');
  const pSat = row1[0].probability;
  const pSlept = row1[1].probability;
  const pAte = row1[2].probability;
  const pEnd = row2[0].probability;

  const visual = dynamic(() => {
    const sp = satP.value;
    const sl = sleptP.value;
    const at = ateP.value;
    const ap = appP.value;
    const nx = nextP.value;
    const pt = pathP.value;
    const ph = drift.value;
    const nodes = [];

    // Prefix stream at top-right (balanced with top-left headline from t=0)
    const tokY = -360;
    nodes.push(
      txt('ACTIVE PREFIX', 120, tokY - 62, 26, COSMOS.muted, 'mono', 'left'),
      tokenChip('The', 190, tokY, ROLE.prefix, { w: 126, h: 58 }),
      tokenChip('cat', 334, tokY, ROLE.prefix, { w: 126, h: 58 }),
    );
    const cursorPulse = 0.5 + 0.5 * Math.sin(ph * Math.PI * 16);
    if (ap > 0.05) {
      const satX = mix(490, 478, ap);
      const satY = mix(-80, tokY, ap);
      nodes.push(
        tokenChip('sat', satX, satY, ROLE.target, {
          w: 126,
          h: 58,
          glow: 10,
          opacity: clamp01(ap * 1.4),
        }),
        rect(6, 52, { fill: ROLE.target })
          .at(574, tokY)
          .opacity(0.35 + 0.65 * cursorPulse * clamp01(ap)),
      );
    } else {
      nodes.push(
        rect(6, 52, { fill: ROLE.target })
          .at(426, tokY)
          .opacity(0.35 + 0.65 * cursorPulse),
        txt('?', 466, tokY + 2, 38, ROLE.target, 'mono'),
      );
    }

    // Row 1: Probability strip after "The cat"
    const sX = -760;
    const sW = 1520;
    const y1 = -115;
    const h1 = 84;
    const wSat = sW * pSat;
    const wSlept = sW * pSlept;
    const wAte = sW * pAte;

    nodes.push(
      txt('STEP 1: P(next | The cat)', sX, y1 - 74, 26, ROLE.prefix, 'mono', 'left'),
      scaleTrack(sX, y1, sW, h1, { stroke: '#334670', radius: 14 }),
      glowBar(sX, y1, wSat, h1 - 6, ROLE.prob, {
        glow: 10 * mix(0.35, 1, sp),
        radius: 12,
        opacity: mix(0.5, 1, sp),
      }),
      glowBar(sX + wSat + 4, y1, wSlept - 4, h1 - 6, ROLE.alt, {
        glow: 8 * mix(0.3, 1, sl),
        radius: 10,
        opacity: mix(0.45, 1, sl),
      }),
      glowBar(sX + wSat + wSlept + 8, y1, wAte - 8, h1 - 6, ROLE.rare, {
        glow: 8 * mix(0.3, 1, at),
        radius: 10,
        opacity: mix(0.45, 1, at),
      }),
      txt('sat  60%', sX + wSat / 2, y1, 34, '#070910', 'mono').opacity(mix(0.65, 1, sp)),
      txt('slept  30%', sX + wSat + wSlept / 2, y1, 30, '#070910', 'mono').opacity(
        mix(0.55, 1, sl),
      ),
      txt('ate 10%', sX + wSat + wSlept + wAte / 2, y1 - 74, 26, ROLE.rare, 'mono').opacity(
        mix(0.55, 1, at),
      ),
    );

    // Connector funnel from sat's 60% strip down to Step 2 strip
    const y2 = 135;
    const h2 = 84;
    const branchAlpha = mix(0.22, 0.85, nx);
    nodes.push(
      line([sX, y1 + h1 / 2 + 6], [sX, y2 - h2 / 2 - 6], {
        stroke: ROLE.prob,
        width: 2.5,
        dash: [8, 6],
      }).opacity(branchAlpha),
      line([sX + wSat, y1 + h1 / 2 + 6], [sX + wSat, y2 - h2 / 2 - 6], {
        stroke: ROLE.prob,
        width: 2.5,
        dash: [8, 6],
      }).opacity(branchAlpha),
    );

    // Row 2: Sub-divided 60% strip after "The cat sat" (ghost outline before intro-next)
    nodes.push(
      txt(
        nx > 0.2
          ? 'STEP 2: P(next | The cat sat) INSIDE SAT SHARE'
          : 'STEP 2: WAITING FOR CHOSEN WORD',
        sX + 24,
        y2 - 74,
        26,
        nx > 0.2 ? ROLE.target : COSMOS.dim,
        'mono',
        'left',
      ),
      scaleTrack(sX, y2, wSat, h2, {
        stroke: nx > 0.2 ? ROLE.target : '#2b395c',
        radius: 14,
      }),
    );

    if (nx > 0.04) {
      const wEnd = wSat * pEnd;
      const wBeside = wSat * (1 - pEnd);
      nodes.push(
        glowBar(sX, y2, wEnd * nx, h2 - 6, ROLE.target, {
          glow: 12,
          radius: 12,
          opacity: nx,
        }),
        glowBar(sX + wEnd + 4, y2, Math.max(6, (wBeside - 4) * nx), h2 - 6, COSMOS.dim, {
          glow: 4,
          radius: 10,
          opacity: nx * 0.85,
        }),
      );
      if (nx > 0.5) {
        nodes.push(
          txt('end  4/5 of sat', sX + wEnd / 2, y2, 32, '#070910', 'mono'),
          txt('beside  1/5', sX + wEnd + wBeside / 2, y2 + 78, 26, COSMOS.muted, 'mono'),
        );
      }
    } else {
      nodes.push(
        txt(
          'Pick the widest strip to extend the prefix...',
          sX + wSat / 2,
          y2,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
    }

    // Right side summary panel area (floating, no box!)
    // Strictly withholds 48% until intro-path completes (after: true)
    const prePath = fadeOut(pt);
    if (prePath > 0.02) {
      nodes.push(
        group(
          txt('CONDITIONAL STEP', 235, 92, 26, COSMOS.muted, 'mono', 'left'),
          txt(
            nx > 0.35 ? '4/5  of  60%  =  ?' : '0.60 + 0.30 + 0.10 = 1.00',
            235,
            152,
            38,
            nx > 0.35 ? ROLE.target : ROLE.prefix,
            'mono',
            'left',
          ),
          txt(
            nx > 0.35
              ? 'What share goes through sat and stops?'
              : 'Every prefix yields a fresh row summing to 1',
            235,
            215,
            28,
            COSMOS.muted,
            'serif',
            'left',
          ),
        ).opacity(prePath),
      );
    }

    const postPath = fadeIn(pt);
    if (postPath > 0.02) {
      nodes.push(
        group(
          txt('JOINT PATH SHARE', 235, 62, 26, ROLE.target, 'mono', 'left'),
          txt('48%', 235, 148, 84, ROLE.target, 'mono', 'left').glow(14, ROLE.target),
          glowTex('0.60 \\times \\tfrac{4}{5} = 0.48', {
            x: 470,
            y: 238,
            size: 40,
            color: ROLE.target,
          }),
        ).opacity(postPath),
      );
    }

    // Floating bottom anchor caption
    nodes.push(
      txt(
        pt > 0.55
          ? 'Each added word creates a new prefix and a new next-token distribution'
          : nx > 0.35
            ? 'Only the blue 60% branch ever reaches "The cat sat"'
            : 'Model assigns probabilities across candidate next words',
        0,
        365,
        30,
        COSMOS.muted,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, visual);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'intro-distribution', satP, 1, { dur: 0.65 });
  cueTo(s, c, 'intro-slept', sleptP, 1, { dur: 0.55 });
  cueTo(s, c, 'intro-ate', ateP, 1, { dur: 0.55 });
  cueTo(s, c, 'intro-append', appP, 1, { dur: 0.7 });
  cueTo(s, c, 'intro-next', nextP, 1, { dur: 0.75 });
  cueTo(s, c, 'intro-path', pathP, 1, { after: true, dur: 0.65 });
}

// ---------------------------------------------------------------------------
// 2. tokens: Keep the prefix on this side
// Cues: token-ids, token-target*
// ---------------------------------------------------------------------------
export function tokens(s, c) {
  const idP = s.value(0);
  const tgtP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.prefix, seed: 2 }));
  s.add(decorAura(-280, 0, 500, '#5ce1e61f', '#07091000'));
  s.add(decorAura(420, 0, 460, '#6ee7b71c', '#07091000'));

  const headline = heroTitle(['Prefix vs', 'Covered Target'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.prefix,
    eyebrow: 'TOKENS, VOCABULARY IDS & CAUSAL BOUNDARY',
  });

  const tokList = [
    { word: 'The', id: 'ID 42', x: -540 },
    { word: 'cat', id: 'ID 109', x: -240 },
    { word: 'sat', id: 'ID 731', x: 240 },
  ];

  const visual = dynamic(() => {
    const idv = idP.value;
    const tg = tgtP.value;
    const ph = drift.value;
    const nodes = [];

    const rowY = -45;
    const wallX = 0;

    // Causal boundary laser line between prefix and target
    const wallPulse = 7 + 4 * Math.sin(ph * Math.PI * 10);
    nodes.push(
      txt('VISIBLE PREFIX', -390, -210, 28, ROLE.prefix, 'mono'),
      txt('CAUSAL CUT', wallX, -248, 26, ROLE.target, 'mono'),
      line([wallX, -210], [wallX, 195], {
        stroke: ROLE.target,
        width: 4,
        dash: [12, 8],
      }).glow(wallPulse, ROLE.target),
      txt(
        tg > 0.5 ? 'OBSERVED TARGET (REVEALED)' : 'NEXT WORD (COVERED)',
        390,
        -210,
        28,
        tg > 0.5 ? ROLE.alt : ROLE.danger,
        'mono',
      ),
    );

    // Prefix tokens + vocabulary IDs
    for (let i = 0; i < 2; i++) {
      const t = tokList[i];
      nodes.push(
        tokenChip(t.word, t.x, rowY, ROLE.prefix, { w: 205, h: 92, size: 42, glow: 9 }),
        txt(t.id, t.x, rowY + 95, 30, ROLE.prob, 'mono').opacity(mix(0.45, 1, idv)),
      );
    }

    // Covered target curtain lifts smoothly on token-target
    const t2 = tokList[2];
    const curtainLift = tg * 145;
    const coverAlpha = fadeOut(tg);
    const revealAlpha = fadeIn(tg);

    if (coverAlpha > 0.02) {
      nodes.push(
        group(
          rect(225, 102, {
            fill: '#1e1326',
            stroke: ROLE.danger,
            width: 3,
            radius: 14,
            dash: [10, 6],
          })
            .at(t2.x, rowY - curtainLift * 0.4)
            .glow(8, ROLE.danger),
          txt('COVERED', t2.x, rowY - curtainLift * 0.4, 30, ROLE.danger, 'mono'),
        ).opacity(coverAlpha),
      );
    }

    if (revealAlpha > 0.02) {
      nodes.push(
        group(
          tokenChip(t2.word, t2.x, rowY, ROLE.alt, { w: 205, h: 92, size: 42, glow: 12 }),
          txt(t2.id, t2.x, rowY + 95, 30, ROLE.alt, 'mono'),
        ).opacity(revealAlpha),
      );
    }

    // Right-side vocabulary lookup visual strip
    nodes.push(
      txt('VOCABULARY TABLE', 575, -130, 26, COSMOS.muted, 'mono', 'left'),
      txt('42   ->  "The"', 575, -75, 28, ROLE.prefix, 'mono', 'left').opacity(mix(0.5, 1, idv)),
      txt('109  ->  "cat"', 575, -25, 28, ROLE.prefix, 'mono', 'left').opacity(mix(0.5, 1, idv)),
      txt(
        tg > 0.5 ? '731  ->  "sat"' : '???  ->  hidden',
        575,
        25,
        28,
        tg > 0.5 ? ROLE.alt : COSMOS.dim,
        'mono',
        'left',
      ),
    );

    // Bottom subword note (floating)
    nodes.push(
      txt(
        'Whole words here for clarity  |  Production tokenizers split text into subword pieces',
        0,
        345,
        28,
        COSMOS.muted,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, visual);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'token-ids', idP, 1, { dur: 0.7 });
  cueTo(s, c, 'token-target', tgtP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 3. counts: Build a predictor from three observations
// Cues: count-first, count-second, count-third, count-normalize, count-unseen, count-smooth
// ---------------------------------------------------------------------------
export function countsScene(s, c) {
  const c1 = s.value(0);
  const c2 = s.value(0);
  const c3 = s.value(0);
  const normP = s.value(0);
  const unsP = s.value(0);
  const smP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.prob, seed: 3 }));
  s.add(decorAura(260, 40, 520, '#60a5fa1e', '#07091000'));

  const headline = heroTitle(['Bigram Counts', 'to Probabilities'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.prob,
    eyebrow: 'MARKOV COUNT TABLE  ·  AFTER "cat"',
  });

  const finalCounts = counts(CORPUS);
  const verbColors = [ROLE.prob, ROLE.alt, ROLE.rare];

  const visual = dynamic(() => {
    const p1 = c1.value;
    const p2 = c2.value;
    const p3 = c3.value;
    const nm = normP.value;
    const un = unsP.value;
    const sm = smP.value;
    const nodes = [];

    // Left: Three observed sentences streaming adjacent pairs after "cat"
    nodes.push(txt('THREE RECORDED OBSERVATIONS', -855, -215, 26, COSMOS.muted, 'mono', 'left'));
    const obsP = [p1, p2, p3];
    CORPUS.forEach((sent, idx) => {
      const y = -125 + idx * 120;
      const act = obsP[idx];
      const parts = sent.split(' ');
      const verbCol = idx < 2 ? ROLE.prob : ROLE.alt;
      nodes.push(
        txt(`#${idx + 1}`, -840, y, 28, act > 0.3 ? ROLE.target : COSMOS.dim, 'mono'),
        tokenChip(parts[0], -715, y, COSMOS.muted, {
          w: 112,
          h: 56,
          size: 28,
          glow: 0,
          opacity: mix(0.45, 0.9, act),
        }),
        tokenChip(parts[1], -580, y, ROLE.prefix, {
          w: 112,
          h: 56,
          size: 28,
          glow: act > 0.3 ? 8 : 2,
          opacity: mix(0.5, 1, act),
        }),
        arrow([-515, y], [-465, y], { stroke: verbCol, width: 3 }).opacity(mix(0.35, 1, act)),
        tokenChip(parts[2], -375, y, verbCol, {
          w: 148,
          h: 56,
          size: 28,
          glow: act > 0.3 ? 10 : 2,
          opacity: mix(0.45, 1, act),
        }),
      );
    });

    // Right: Vertical glowing count -> probability -> add-one smoothed bars
    const baseLineY = 215;
    const barXs = [90, 380, 670];
    const barW = 148;
    const maxH = 330;

    const rawSat = p1 + p2;
    const rawSlept = p3;
    const rawAte = 0;
    const rawVals = [rawSat, rawSlept, rawAte];
    const alpha = sm;
    const denom = 3 + 3 * alpha;

    const modeTitle =
      sm > 0.3
        ? 'ADD-ONE SMOOTHED  (COUNT + 1) / 6'
        : nm > 0.3
          ? 'NORMALIZED BIGRAM  COUNT / 3'
          : 'RAW ADJACENT COUNTS AFTER "cat"';
    nodes.push(
      txt(modeTitle, 380, -215, 28, sm > 0.3 ? ROLE.target : ROLE.prefix, 'mono'),
      rule(-30, baseLineY, 800, baseLineY, '#3a4e7c', 3),
    );

    VERBS.forEach((word, i) => {
      const cx = barXs[i];
      const col = verbColors[i];
      const rawCount = rawVals[i];
      const countH = (rawCount / 3) * maxH;
      const probH = ((rawCount + alpha) / Math.max(1, denom)) * maxH;
      const h = mix(countH, probH, nm);
      const isUnseenFocus = i === 2 && un > 0.25 && sm < 0.2;

      if (h > 4) {
        nodes.push(
          glowVBar(cx, baseLineY, barW, h, col, {
            glow: isUnseenFocus ? 14 : 9,
            radius: 10,
          }),
        );
      } else {
        // Zero-height dashed baseline slot for unseen "ate"
        nodes.push(
          rect(barW, 10, {
            fill: isUnseenFocus ? ROLE.danger : '#1a2540',
            stroke: isUnseenFocus ? ROLE.danger : ROLE.rare,
            width: 2,
            radius: 4,
          }).at(cx, baseLineY - 5),
        );
      }

      // Pseudo-count +1 cap shown during smoothing
      if (sm > 0.08) {
        const capH = (alpha / denom) * maxH;
        nodes.push(
          rect(barW, Math.max(6, capH), {
            fill: `${ROLE.target}55`,
            stroke: ROLE.target,
            width: 2.5,
            radius: 6,
          })
            .at(cx, baseLineY - h + capH / 2)
            .opacity(sm),
        );
      }

      // Numeric label cleanly above bar
      let valLabel;
      if (sm > 0.5) {
        const num = finalCounts[word] + 1;
        valLabel = `${num}/6`;
      } else if (nm > 0.5) {
        const num = finalCounts[word];
        valLabel = num === 0 ? '0/3' : `${num}/3`;
      } else {
        valLabel = `${Math.round(rawCount)}`;
      }
      const labelColor = isUnseenFocus ? ROLE.danger : sm > 0.5 ? ROLE.target : col;
      nodes.push(
        txt(valLabel, cx, baseLineY - Math.max(24, h) - 34, 34, labelColor, 'mono'),
        txt(word, cx, baseLineY + 46, 32, COSMOS.ink, 'mono'),
      );
    });

    // Bottom equation / denominator readout
    nodes.push(
      txt(
        sm > 0.5
          ? '3-verb exercise: add 1 to each -> denominator 3 + 3 = 6; ate gets 1/6'
          : nm > 0.5
            ? 'Divide by 3 observed transitions: sat 2/3, slept 1/3, ate 0'
            : 'Counting only the word immediately after cat',
        0,
        365,
        30,
        COSMOS.muted,
        'serif',
      ),
    );

    return group(...nodes);
  });

  s.add(headline, visual);
  livingDrift(s, c, drift, 1);
  cueTo(s, c, 'count-first', c1, 1, { dur: 0.55 });
  cueTo(s, c, 'count-second', c2, 1, { dur: 0.55 });
  cueTo(s, c, 'count-third', c3, 1, { dur: 0.55 });
  cueTo(s, c, 'count-normalize', normP, 1, { dur: 0.8 });
  cueTo(s, c, 'count-unseen', unsP, 1, { dur: 0.55 });
  cueTo(s, c, 'count-smooth', smP, 1, { dur: 0.85 });
}

// ---------------------------------------------------------------------------
// 4. full-vocabulary: Count every eligible outcome
// Beat 0: 6 code comments -> returns counts (3,2,1,0) & infinite loss for unseen exception
// Beat 1: Compare 4-output (1/10) vs full 10-output (1/16) add-one smoothing
// Beat 2: Add 7th observation "function returns exception" -> value 3/7, exception 1/7
// ---------------------------------------------------------------------------
export function fullVocabulary(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const sm4P = s.value(0);
  const smFullP = s.value(0);
  const b2P = s.value(0);
  const b2Step = s.value(0);
  const newRecP = s.value(0);
  const sevenP = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.prefix, seed: 4 }));
  s.add(decorAura(-350, 20, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(380, 40, 460, '#ffd16618', '#07091000'));

  const headline = heroTitle(['Count Every', 'Eligible Outcome'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefix,
    eyebrow: 'FULL VOCABULARY SMOOTHING  ·  AFTER "returns"',
  });

  // View 0 (Beat 0): 6 code comments + unsmoothed counts + unseen exception = infinity loss
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const st = b0Step.value;
      const nodes = [];

      nodes.push(txt('SIX CODE COMMENTS', -855, -210, 26, COSMOS.muted, 'mono', 'left'));
      const colMap = { value: ROLE.prefix, result: ROLE.prob, error: ROLE.rare };
      CODE_COMMENTS.forEach((row, idx) => {
        const y = -135 + idx * 72;
        const lit = st >= 1 ? clamp01((st - 1) * 6 - idx + 1) : 0.45;
        nodes.push(
          txt(`${idx + 1}.`, -840, y, 26, COSMOS.dim, 'mono'),
          txt(row[0], -795, y, 28, COSMOS.muted, 'mono', 'left').opacity(mix(0.45, 1, lit)),
          txt(row[1], -615, y, 28, ROLE.target, 'mono', 'left').opacity(mix(0.5, 1, lit)),
          txt(row[2], -455, y, 30, colMap[row[2]], 'mono', 'left').opacity(mix(0.5, 1, lit)),
        );
      });

      // Right: Bar chart of counts after "returns" + unseen exception
      const items = [
        { word: 'value', count: 3, col: ROLE.prefix },
        { word: 'result', count: 2, col: ROLE.prob },
        { word: 'error', count: 1, col: ROLE.rare },
        { word: 'exception', count: 0, col: ROLE.danger },
      ];
      const barX = 115;
      const maxW = 540;
      nodes.push(
        txt('UNSMOOTHED ROW AFTER "returns"  (N = 6)', barX, -210, 26, ROLE.prefix, 'mono', 'left'),
      );
      items.forEach((it, i) => {
        const y = -115 + i * 95;
        const reveal = st >= 2 ? 1 : 0.55;
        const w = (it.count / 3) * maxW * reveal;
        nodes.push(
          txt(it.word, barX - 24, y, 28, it.col, 'mono', 'right'),
          scaleTrack(barX, y, maxW, 44, { radius: 8 }),
        );
        if (it.count > 0) {
          nodes.push(glowBar(barX, y, w, 44, it.col, { glow: 8, radius: 8 }));
          nodes.push(txt(`${it.count}/6`, barX + maxW + 48, y, 30, it.col, 'mono'));
        } else {
          const dangerOn = st >= 4.5;
          nodes.push(
            txt(
              dangerOn ? '0/6  ->  -ln(0) = +inf' : '0/6  (unseen)',
              barX + 26,
              y,
              28,
              dangerOn ? ROLE.danger : COSMOS.dim,
              'mono',
              'left',
            ),
          );
        }
      });

      nodes.push(
        txt(
          st >= 4.5
            ? 'Zero probability on unseen "exception" sends sequence NLL to +infinity'
            : st >= 3.5
              ? '<eos> gives final words a successor; we never predict after <eos>'
              : 'Denominator counts 6 adjacent transitions with a following target',
          0,
          365,
          28,
          st >= 4.5 ? ROLE.danger : COSMOS.muted,
          'serif',
        ),
      );
      return group(...nodes).opacity(vis);
    },
  );

  // View 1 (Beat 1): 4-output (denom 10 -> 1/10) vs full 10-output (denom 16 -> 1/16)
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(b1P.value), fadeOut(b2P.value)),
    (vis) => {
      const s4 = sm4P.value;
      const sf = smFullP.value;
      const st = b1Step.value;
      const nodes = [];

      // Left strip: Restricted 4-output vocabulary (4 + 3 + 2 + 1 = 10)
      const lx = -820;
      const stripW = 720;
      const yTop = -80;
      nodes.push(
        txt('RESTRICTED 4-WORD VOCABULARY', lx, yTop - 112, 28, ROLE.prob, 'mono', 'left'),
        txt(
          'Add 1 to 4 entries:  4 + 3 + 2 + 1 = 10',
          lx,
          yTop - 68,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
        scaleTrack(lx, yTop, stripW, 74, { stroke: ROLE.prob, radius: 12 }),
      );
      const fourShares = [
        { label: 'val 4', n: 4, col: ROLE.prefix },
        { label: 'res 3', n: 3, col: ROLE.prob },
        { label: 'err 2', n: 2, col: ROLE.rare },
        { label: 'exc 1', n: 1, col: ROLE.target },
      ];
      let curX = lx;
      fourShares.forEach((seg) => {
        const w = (seg.n / 10) * stripW;
        nodes.push(
          glowBar(curX, yTop, w - 4, 68, seg.col, {
            glow: 7 * mix(0.4, 1, s4),
            radius: 8,
            opacity: mix(0.55, 1, s4),
          }),
        );
        if (w > 110) {
          nodes.push(txt(seg.label, curX + w / 2, yTop, 26, '#070910', 'mono'));
        }
        curX += w;
      });
      nodes.push(
        txt(
          'P(exception | returns) = 1 / 10 = 10.0%',
          lx,
          yTop + 82,
          30,
          ROLE.target,
          'mono',
          'left',
        ).opacity(mix(0.45, 1, s4)),
      );

      // Right strip: Full 10-output vocabulary (6 + 10 = 16 -> exception = 1/16)
      const rx = 40;
      nodes.push(
        txt('FULL 10-WORD PREDICTION VOCAB', rx, yTop - 112, 28, ROLE.target, 'mono', 'left'),
        txt(
          'Add 1 to all 10 entries:  6 + 10 = 16',
          rx,
          yTop - 68,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
        scaleTrack(rx, yTop, stripW, 74, { stroke: ROLE.target, radius: 12 }),
      );
      const fullSegs = [
        { label: 'val 4', n: 4, col: ROLE.prefix },
        { label: 'res 3', n: 3, col: ROLE.prob },
        { label: 'err 2', n: 2, col: ROLE.rare },
        { label: 'exc 1', n: 1, col: ROLE.target },
        { label: '6 other unseen (+1 ea)', n: 6, col: '#475982' },
      ];
      let curR = rx;
      fullSegs.forEach((seg) => {
        const w = (seg.n / 16) * stripW * mix(0.4, 1, sf);
        nodes.push(glowBar(curR, yTop, Math.max(6, w - 3), 68, seg.col, { glow: 7, radius: 8 }));
        curR += w;
      });
      nodes.push(
        txt(
          'P(exception | returns) = 1 / 16 = 6.25%',
          rx,
          yTop + 82,
          30,
          ROLE.alt,
          'mono',
          'left',
        ).opacity(mix(0.4, 1, sf)),
      );

      // Visual comparison bars below
      const cmpY = 175;
      nodes.push(
        txt('EXCEPTION SHARE:', -820, cmpY, 28, COSMOS.muted, 'mono', 'left'),
        glowBar(-470, cmpY - 22, 420 * (1 / 10) * 6, 30, ROLE.target, { glow: 8 }),
        txt('1/10 (restricted)', -470 + 420 * 0.6 + 24, cmpY - 22, 26, ROLE.target, 'mono', 'left'),
        glowBar(-470, cmpY + 26, 420 * (1 / 16) * 6 * mix(0.4, 1, sf), 30, ROLE.alt, { glow: 8 }),
        txt(
          '1/16 (full 10-word vocab)',
          -470 + 420 * 0.375 + 24,
          cmpY + 26,
          26,
          ROLE.alt,
          'mono',
          'left',
        ),
        txt(
          st >= 5.5
            ? 'Smoothing covers declared vocab only; out-of-vocab words need <unk> or subwords'
            : 'Denominator depends on every eligible token in the declared vocabulary',
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

  // View 2 (Beat 2): Add 7th observation "function returns exception" -> raw counts / 7
  const view2 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const nr = newRecP.value;
      const sv = sevenP.value;
      const st = b2Step.value;
      const nodes = [];

      // Left: 6 old records + 7th arriving record
      nodes.push(
        txt('OBSERVED RECORDS', -840, -210, 26, COSMOS.muted, 'mono', 'left'),
        txt(
          '6 earlier comments  (3 val, 2 res, 1 err)',
          -840,
          -140,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ),
        tokenChip('function', -760, -25, ROLE.target, { w: 162, h: 64, size: 26, glow: 8 * nr }),
        tokenChip('returns', -578, -25, ROLE.target, { w: 152, h: 64, size: 26, glow: 8 * nr }),
        tokenChip('exception', -378, -25, ROLE.alt, { w: 192, h: 64, size: 26, glow: 12 * nr }),
        txt('+1 NEW RECORD (#7)', -840, 58, 28, ROLE.alt, 'mono', 'left').opacity(mix(0.4, 1, nr)),
        txt(
          st >= 2
            ? 'Raw total:  6 -> 7 transitions'
            : 'Keep raw counting rule and all older records',
          -840,
          145,
          30,
          ROLE.target,
          'mono',
          'left',
        ),
      );

      // Right: Bars rescaling smoothly from /6 to /7
      const rows = [
        { word: 'value', c0: 3 / 6, c1: 3 / 7, frac: '3/7 (42.9%)', col: ROLE.prefix },
        { word: 'result', c0: 2 / 6, c1: 2 / 7, frac: '2/7 (28.6%)', col: ROLE.prob },
        { word: 'error', c0: 1 / 6, c1: 1 / 7, frac: '1/7 (14.3%)', col: ROLE.rare },
        { word: 'exception', c0: 0, c1: 1 / 7, frac: '1/7 (14.3%)', col: ROLE.alt },
      ];
      const barX = 115;
      const barW = 540;
      nodes.push(txt('RAW SHARES RECOMPUTED (N = 7)', barX, -210, 26, ROLE.alt, 'mono', 'left'));
      rows.forEach((r, i) => {
        const y = -115 + i * 95;
        const share = mix(r.c0, r.c1, sv);
        nodes.push(
          txt(r.word, barX - 24, y, 28, r.col, 'mono', 'right'),
          scaleTrack(barX, y, barW, 44, { radius: 8 }),
        );
        if (share > 0.01) {
          nodes.push(glowBar(barX, y, barW * share * 1.6, 44, r.col, { glow: 9, radius: 8 }));
        }
        nodes.push(
          txt(
            sv > 0.5 ? r.frac : `${Math.round(r.c0 * 6)}/6`,
            barX + barW + 24,
            y,
            26,
            r.col,
            'mono',
            'left',
          ),
        );
      });

      nodes.push(
        txt(
          st >= 4.5
            ? 'Add-one is a baseline; discounting, interpolation & backoff use evidence better'
            : 'One new record shifts every normalized share without erasing old observations',
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

  s.add(headline, view0, view1, view2);

  // Beat 0 cues
  cueTo(s, c, 'full-vocabulary-b1', b0Step, 0.5, { dur: 0.4 });
  voiceSpan(s, c, 'full-vocabulary-voice-1', vPhase, 1);
  cueTo(s, c, 'full-vocabulary-step-0-1', b0Step, 1, { dur: 0.45 });
  cueTo(s, c, 'full-vocabulary-step-0-2', b0Step, 2, { dur: 0.6 });
  cueTo(s, c, 'full-vocabulary-step-0-3', b0Step, 3, { dur: 0.45 });
  cueTo(s, c, 'full-vocabulary-step-0-4', b0Step, 4, { dur: 0.45 });
  cueTo(s, c, 'full-vocabulary-step-0-5', b0Step, 5, { dur: 0.5 });

  // Beat 1 cues
  cueTo(s, c, 'full-vocabulary-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'full-vocabulary-voice-2', vPhase, 2);
  cueTo(s, c, 'full-vocabulary-step-1-1', b1Step, 1, { dur: 0.4 });
  cueTo(s, c, 'full-vocabulary-step-1-2', b1Step, 2, { dur: 0.4 });
  cueTo(s, c, 'smooth-four', sm4P, 1, { dur: 0.65 });
  cueTo(s, c, 'full-vocabulary-step-1-3', b1Step, 3, { dur: 0.4 });
  cueTo(s, c, 'full-vocabulary-step-1-4', b1Step, 4, { dur: 0.4 });
  cueTo(s, c, 'smooth-full', smFullP, 1, { dur: 0.7 });
  cueTo(s, c, 'full-vocabulary-step-1-5', b1Step, 5, { dur: 0.4 });
  cueTo(s, c, 'full-vocabulary-step-1-6', b1Step, 6, { dur: 0.4 });

  // Beat 2 cues
  cueTo(s, c, 'full-vocabulary-b3', b2P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'full-vocabulary-voice-3', vPhase, 3);
  cueTo(s, c, 'count-new-record', newRecP, 1, { dur: 0.65 });
  cueTo(s, c, 'full-vocabulary-step-2-1', b2Step, 1, { dur: 0.4 });
  cueTo(s, c, 'full-vocabulary-step-2-2', b2Step, 2, { dur: 0.45 });
  cueTo(s, c, 'full-vocabulary-step-2-3', b2Step, 3, { dur: 0.45 });
  cueTo(s, c, 'count-seven', sevenP, 1, { dur: 0.7 });
  cueTo(s, c, 'full-vocabulary-step-2-4', b2Step, 4, { dur: 0.4 });
  cueTo(s, c, 'full-vocabulary-step-2-5', b2Step, 5, { dur: 0.4 });
}

// ---------------------------------------------------------------------------
// 5. sparse-history: A longer history needs evidence
// Beat 0: Bigram "returns" splits into trigram rows + 50,000^4 = 6.25e18 sparsity explosion
// Beat 1: Unseen "error returns" backs off to "returns" (6 obs) vs neural shared embeddings
// ---------------------------------------------------------------------------
export function sparseHistory(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.rare, seed: 5 }));
  s.add(decorAura(-320, 20, 480, '#a78bfa1c', '#07091000'));
  s.add(decorAura(400, 20, 460, '#5ce1e61a', '#07091000'));

  const headline = heroTitle(['Longer History,', 'Sparser Tables'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.rare,
    eyebrow: 'N-GRAM COMBINATORIAL WALL & BACKOFF',
  });

  // View 0: Bigram -> Trigram branch + 50,000^4 combinatorial scale
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const st = b0Step.value;
      const nodes = [];

      // Left: Bigram node branching into trigram rows
      nodes.push(
        txt('BIGRAM POOLS ALL "returns"', -850, -210, 26, ROLE.prefix, 'mono', 'left'),
        tokenChip('returns (6)', -735, -10, ROLE.prefix, { w: 210, h: 72, size: 28, glow: 9 }),
      );

      const triAlpha = mix(0.45, 1, clamp01(st));
      const branches = [
        { label: 'function returns', out: 'value × 2', y: -120, col: ROLE.prefix },
        { label: 'test returns', out: 'res × 1, err × 1', y: 20, col: ROLE.prob },
        { label: 'method / handler', out: 'res × 1, val × 1', y: 160, col: COSMOS.muted },
      ];
      branches.forEach((br) => {
        nodes.push(
          line([-620, -10], [-485, br.y], { stroke: br.col, width: 2.8 }).opacity(triAlpha),
          tokenChip(br.label, -315, br.y, br.col, {
            w: 310,
            h: 58,
            size: 26,
            glow: 6 * triAlpha,
            opacity: triAlpha,
          }),
          txt(br.out, -135, br.y, 26, br.col, 'mono', 'left').opacity(triAlpha),
        );
      });

      // Right: Combinatorial growth staircase |V|^1 .. |V|^4
      const gx = 290;
      nodes.push(
        txt('POSSIBLE SEQUENCES (|V| = 50,000)', gx, -210, 26, ROLE.danger, 'mono', 'left'),
      );
      const pows = [
        { k: 'n=1', txtVal: '5.0 × 10^4', frac: 0.14, col: ROLE.prefix },
        { k: 'n=2', txtVal: '2.5 × 10^9', frac: 0.34, col: ROLE.prob },
        { k: 'n=3', txtVal: '1.25 × 10^14', frac: 0.62, col: ROLE.rare },
        { k: 'n=4', txtVal: '6.25 × 10^18', frac: 1.0, col: ROLE.danger },
      ];
      pows.forEach((pw, idx) => {
        const y = -120 + idx * 92;
        const lit = st >= 2.5 ? 1 : 0.45;
        const bw = 250 * pw.frac * lit;
        nodes.push(
          txt(pw.k, gx, y, 26, pw.col, 'mono', 'left'),
          glowBar(gx + 78, y, bw, 36, pw.col, { glow: 8 * lit, radius: 8 }),
          txt(pw.txtVal, gx + 78 + bw + 20, y, 26, pw.col, 'mono', 'left'),
        );
      });

      nodes.push(
        txt(
          st >= 3.5
            ? 'Sparse hash tables store only seen n-grams, leaving unseen combinations empty'
            : st >= 2.5
              ? '50,000 choices over 4 positions yield 6.25 x 10^18 possible sequences'
              : 'An n-gram looks back n - 1 tokens, splitting counts into thinner buckets',
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

  // View 1: Unseen "error returns" -> backoff arc to "returns" vs shared neural embeddings
  const view1 = guardedDynamic(
    () => fadeIn(b1P.value),
    (vis) => {
      const st = b1Step.value;
      const nodes = [];

      // Left: Backoff mechanism
      nodes.push(
        txt('QUERY UNSEEN TRIGRAM', -830, -210, 26, ROLE.danger, 'mono', 'left'),
        tokenChip('error', -725, -105, ROLE.danger, { w: 165, h: 62, size: 28, glow: 9 }),
        tokenChip('returns', -535, -105, ROLE.prefix, { w: 175, h: 62, size: 28, glow: 9 }),
        txt('ROW: EMPTY (0 obs)', -390, -105, 28, ROLE.danger, 'mono', 'left'),
      );

      // Backoff arrow down to 1-word "returns" row
      const bo = clamp01(st);
      nodes.push(
        arrow([-670, -62], [-670, 65], { stroke: ROLE.target, width: 4 }).opacity(mix(0.35, 1, bo)),
        txt('back off 1 word', -635, 5, 26, ROLE.target, 'mono', 'left').opacity(mix(0.35, 1, bo)),
        tokenChip('returns', -670, 118, ROLE.prefix, { w: 175, h: 64, size: 28, glow: 10 }),
        txt('6 obs: val 3, res 2, err 1', -555, 118, 26, ROLE.prefix, 'mono', 'left').opacity(
          mix(0.45, 1, bo),
        ),
        txt(
          'Interpolation blends long + short contexts',
          -830,
          225,
          28,
          COSMOS.muted,
          'serif',
          'left',
        ).opacity(mix(0.35, 1, bo)),
      );

      // Right: Shared neural embedding space constellation
      const nn = clamp01(st - 1.5);
      nodes.push(
        rule(65, -210, 65, 250, '#2a3759', 2),
        txt('NEURAL EMBEDDING SHARING', 145, -210, 26, ROLE.alt, 'mono', 'left'),
      );
      const pts = [
        { w: 'function', x: 265, y: -65, lx: 265, ly: -108, col: ROLE.prefix },
        { w: 'method', x: 565, y: -95, lx: 565, ly: -138, col: ROLE.prefix },
        { w: 'handler', x: 355, y: 75, lx: 255, ly: 118, col: ROLE.prefix },
        { w: 'test', x: 715, y: 40, lx: 715, ly: -4, col: ROLE.prob },
        { w: 'error', x: 645, y: 185, lx: 645, ly: 228, col: ROLE.rare },
      ];
      // Connecting shared-weight lines between nearby embeddings
      const edges = [
        [0, 1],
        [0, 2],
        [1, 2],
        [2, 3],
        [3, 4],
      ];
      edges.forEach(([a, b]) => {
        nodes.push(
          line([pts[a].x, pts[a].y], [pts[b].x, pts[b].y], {
            stroke: ROLE.alt,
            width: 2.2,
            dash: [6, 6],
          }).opacity(mix(0.25, 0.85, nn)),
        );
      });
      pts.forEach((p) => {
        nodes.push(
          glowDot(p.x, p.y, { radius: 11, color: p.col, glow: 12 * mix(0.4, 1, nn) }),
          txt(p.w, p.lx, p.ly, 26, p.col, 'mono'),
        );
      });

      nodes.push(
        txt(
          st >= 3.5
            ? 'Judge backoff vs neural sharing by scoring held-out words that actually followed'
            : 'Shared embeddings let training on one prefix shift scores for related prefixes',
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

  s.add(headline, view0, view1);
  cueTo(s, c, 'sparse-history-b1', b0Step, 0.3, { dur: 0.4 });
  voiceSpan(s, c, 'sparse-history-voice-1', vPhase, 1);
  cueTo(s, c, 'sparse-history-step-0-1', b0Step, 1, { dur: 0.6 });
  cueTo(s, c, 'sparse-history-step-0-2', b0Step, 2, { dur: 0.45 });
  cueTo(s, c, 'sparse-history-step-0-3', b0Step, 3, { dur: 0.65 });
  cueTo(s, c, 'sparse-history-step-0-4', b0Step, 4, { dur: 0.45 });

  cueTo(s, c, 'sparse-history-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'sparse-history-voice-2', vPhase, 2);
  cueTo(s, c, 'sparse-history-step-1-1', b1Step, 1, { dur: 0.6 });
  cueTo(s, c, 'sparse-history-step-1-2', b1Step, 2, { dur: 0.6 });
  cueTo(s, c, 'sparse-history-step-1-3', b1Step, 3, { dur: 0.5 });
  cueTo(s, c, 'sparse-history-step-1-4', b1Step, 4, { dur: 0.5 });
}

// ---------------------------------------------------------------------------
// 6. context: Earlier words can change the scores
// Cues: context-head, context-hungry
// ---------------------------------------------------------------------------
export function context(s, c) {
  const headP = s.value(0);
  const hungP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.alt, seed: 6 }));
  s.add(decorAura(340, 20, 500, '#6ee7b71e', '#07091000'));

  const headline = heroTitle(['Earlier Words', 'Shift the Scores'], {
    x: -855,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.alt,
    eyebrow: 'TINY NEURAL HEAD  ·  SHARED WEIGHTS [0, -1, +1]',
  });

  const weights = [0, -1, 1];
  const verbCols = [ROLE.prob, ROLE.alt, ROLE.rare];

  const visual = dynamic(() => {
    const hd = headP.value;
    const hg = hungP.value;
    const h = mix(-2, 2, hg);
    const logits = weights.map((w) => w * h);
    const probs = stableSoftmax(logits);
    const nodes = [];

    // Left: Prefix "The [tired / hungry] cat" with scalar embedding dial
    const adjCol = hg > 0.5 ? ROLE.rare : ROLE.alt;
    const adjWord = hg > 0.5 ? 'hungry' : 'tired';
    nodes.push(
      txt('CONTEXT PREFIX', -835, -205, 26, COSMOS.muted, 'mono', 'left'),
      tokenChip('The', -760, -105, COSMOS.muted, { w: 120, h: 64, size: 28, glow: 0 }),
      tokenChip(adjWord, -585, -105, adjCol, { w: 192, h: 68, size: 32, glow: 11 }),
      tokenChip('cat', -405, -105, ROLE.prefix, { w: 126, h: 64, size: 28, glow: 6 }),
      txt('SCALAR EMBEDDING  h', -835, 35, 26, COSMOS.muted, 'mono', 'left'),
      rule(-835, 115, -355, 115, '#3b4e78', 3),
      txt('-2', -815, 162, 26, ROLE.alt, 'mono'),
      txt('0', -595, 162, 26, COSMOS.muted, 'mono'),
      txt('+2', -375, 162, 26, ROLE.rare, 'mono'),
    );
    const dotX = mix(-815, -375, (h + 2) / 4);
    nodes.push(
      glowDot(dotX, 115, { radius: 14, color: adjCol, glow: 14 }),
      txt(`h = ${h >= 0 ? '+' : ''}${h.toFixed(1)}`, dotX, 72, 30, adjCol, 'mono'),
    );

    // Center -> Right: Shared score weights -> logits -> softmax probability bars
    const rowX = -150;
    const barX = 275;
    const maxBarW = 470;
    nodes.push(
      txt('WEIGHT w', rowX, -205, 26, COSMOS.muted, 'mono'),
      txt('LOGIT w·h', rowX + 215, -205, 26, ROLE.target, 'mono'),
      txt('SOFTMAX PROBABILITY', barX, -205, 26, ROLE.prefix, 'mono', 'left'),
    );

    VERBS.forEach((word, i) => {
      const y = -95 + i * 118;
      const col = verbCols[i];
      const wStr = weights[i] > 0 ? '+1' : `${weights[i]}`;
      const z = logits[i];
      const p = probs[i];
      const activeW = maxBarW * p * mix(0.35, 1, hd);
      nodes.push(
        txt(word, rowX - 105, y, 30, col, 'mono', 'right'),
        txt(wStr, rowX, y, 32, COSMOS.ink, 'mono'),
        txt(
          hd > 0.2 ? `${z >= 0 ? '+' : ''}${z.toFixed(1)}` : '...',
          rowX + 215,
          y,
          32,
          hd > 0.2 ? ROLE.target : COSMOS.dim,
          'mono',
        ),
        scaleTrack(barX, y, maxBarW, 48, { radius: 10 }),
        glowBar(barX, y, Math.max(8, activeW), 48, col, { glow: 10 * mix(0.3, 1, hd), radius: 10 }),
        txt(hd > 0.2 ? `${(p * 100).toFixed(1)}%` : '?', barX + maxBarW + 66, y, 30, col, 'mono'),
      );
    });

    nodes.push(
      txt(
        hg > 0.5
          ? 'Same "cat" + same shared table -> flipping adjective swings mass to "ate"'
          : 'A bigram sees only "cat"; reading the adjective lets one shared table separate contexts',
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
  cueTo(s, c, 'context-head', headP, 1, { dur: 0.75 });
  cueTo(s, c, 'context-hungry', hungP, 1, { dur: 0.9 });
}
