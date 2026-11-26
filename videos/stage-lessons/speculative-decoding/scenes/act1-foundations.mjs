// Act 1: Core Speculative Decoding Mechanism (intro, draft, accept, residual, proof)
import { circle, dot, group, line, linear, par, rect } from 'vizmatic/stage';
import {
  CHAIN,
  COSMOS,
  P,
  Q,
  TWO_GAP_Q,
  WORDS,
  cinemaRails,
  clampDur,
  decomposition,
  glowDot,
  glowTex,
  glowingArc,
  glowingTrail,
  guardedDynamic,
  heroAura,
  heroTitle,
  onCue,
  probBarH,
  sampleProposal,
  startAmbient,
  tokenPill,
  txt,
  verifyBeam,
} from '../shared.mjs';

/**
 * Scene 1: intro ("Three words ahead")
 * Full-bleed dark cosmos: committed cursor separates "The bird" from three draft guesses
 * (sang, softly, today), glowing target verification wave pulses across all 3 in one pass,
 * causal arc traces softly -> today, keeps sang, rejects softly & dependent today.
 */
export function intro(s, c) {
  const amb = startAmbient(s, c);
  const draftCount = s.value(0); // 0 -> 1 -> 2 -> 3
  const verifyWave = s.value(0); // 0 -> 1 scan across 3 guesses
  const askToday = s.value(0);
  const traceSoftly = s.value(0);
  const keepSang = s.value(0);
  const rejectSoftly = s.value(0);
  const openSpace = s.value(0);
  const samplerQ = s.value(0);

  const title = heroTitle(['Three words', 'ahead'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'SPECULATIVE DECODING',
  });

  const sceneView = guardedDynamic(
    () => 1,
    () => {
      const t = amb.value;
      const dc = draftCount.value;
      const vw = verifyWave.value;
      const ask = askToday.value;
      const tr = traceSoftly.value;
      const ks = keepSang.value;
      const rs = rejectSoftly.value;
      const os = openSpace.value;
      const sq = samplerQ.value;

      const nodes = [];
      const rowY = -30;
      const pillW = 218;
      const pillH = 92;

      // Subtle timeline energy rail segments (broken cleanly behind pills so dimmed pills never cross stroke)
      nodes.push(
        line([-840, rowY], [-835, rowY], { stroke: '#2c3d66', width: 2.6 }),
        line([-605, rowY], [-575, rowY], { stroke: '#2c3d66', width: 2.6 }),
        line([-345, rowY], [-310, rowY], { stroke: '#2c3d66', width: 2.6 }),
        line([-80, rowY], [5, rowY], { stroke: '#2c3d66', width: 2.6 }),
        line([235, rowY], [320, rowY], { stroke: '#2c3d66', width: 2.6 }),
        line([550, rowY], [840, rowY], { stroke: '#2c3d66', width: 2.6 }),
      );

      // Committed prefix tokens ("The", "bird")
      const prefixTokens = [
        { word: 'The', x: -720 },
        { word: 'bird', x: -460 },
      ];
      for (const tok of prefixTokens) {
        nodes.push(
          tokenPill(tok.word, tok.x, rowY, {
            w: pillW,
            h: pillH,
            color: COSMOS.blue,
            glow: 8,
            topTag: 'COMMITTED',
            topColor: COSMOS.blue,
          }),
        );
      }

      // Glowing reader cursor (advances past "sang" when keepSang activates; bottom stays above "KEPT")
      const cursorX = -330 + ks * 270;
      const pulseR = 7 + 3 * Math.sin(t * Math.PI * 10);
      nodes.push(
        line([cursorX, rowY - 120], [cursorX, rowY + 38], {
          stroke: COSMOS.gold,
          width: 4.5,
        })
          .glow(14, COSMOS.gold)
          .set('blend', 'screen'),
        glowDot(cursorX, rowY - 124, { radius: pulseR, color: COSMOS.gold, glow: 14 }),
        txt('READER CURSOR', cursorX, rowY - 165, 26, COSMOS.gold, 'mono'),
      );

      // Three draft proposals: sang, softly, today (subtle empty slots visible before each guess lands)
      const drafts = [
        { word: 'sang', x: -195, idx: 1, dep: 'after "bird"' },
        { word: 'softly', x: 120, idx: 2, dep: 'after "sang"' },
        { word: 'today', x: 435, idx: 3, dep: 'after "softly"' },
      ];

      for (const d of drafts) {
        const vis = Math.max(0, Math.min(1, dc - (d.idx - 1)));
        if (vis < 0.04) {
          nodes.push(
            rect(pillW, pillH, {
              fill: '#0e1424',
              stroke: '#3a4b78',
              width: 2.0,
              dash: [8, 8],
              radius: 16,
            }).at(d.x, rowY),
            txt(`slot +${d.idx}`, d.x, rowY, 26, COSMOS.dim, 'mono'),
          );
          continue;
        }

        let col = COSMOS.cyan;
        let status = `DRAFT #${d.idx}`;
        let pillOp = vis;
        if (d.idx === 1 && ks > 0.3) {
          col = COSMOS.emerald;
          status = 'KEPT';
        } else if (d.idx === 2 && rs > 0.3) {
          col = COSMOS.rose;
          status = 'REJECTED';
          pillOp = vis * (1 - rs * 0.45);
        } else if (d.idx === 3 && rs > 0.3) {
          col = COSMOS.rose;
          status = 'DROPPED';
          pillOp = vis * (1 - rs * 0.55);
        } else if (d.idx === 3 && ask > 0.3) {
          col = COSMOS.gold;
          status = tr > 0.3 ? 'READS "softly"' : 'CHECK PREFIX';
        } else if (vw > 0.15 + (d.idx - 1) * 0.25) {
          col = COSMOS.gold;
          status = 'SCORED';
        }

        nodes.push(
          tokenPill(d.word, d.x, rowY, {
            w: pillW,
            h: pillH,
            color: col,
            glow: col === COSMOS.rose ? 6 : 12,
            sub: status,
            subColor: col,
            subYOffset: 78,
            opacity: pillOp,
          }),
        );
      }

      // Causal drafting arcs above draft tokens: bird -> sang -> softly -> today
      if (dc > 1.2) {
        const arcOp = Math.min(1, dc - 1.2);
        nodes.push(
          glowingArc(-195, rowY - 52, 120, rowY - 52, -72, {
            color: COSMOS.cyan,
            opacity: arcOp * (1 - rs * 0.65),
            glow: 8,
          }),
        );
      }
      if (dc > 2.2) {
        const arcOp = Math.min(1, dc - 2.2);
        const arcCol = tr > 0.2 ? COSMOS.gold : ask > 0.2 ? COSMOS.amber : COSMOS.cyan;
        nodes.push(
          glowingArc(120, rowY - 52, 435, rowY - 52, -88, {
            color: arcCol,
            width: tr > 0.2 ? 5.2 : 3.6,
            opacity: arcOp * (1 - rs * 0.55),
            glow: tr > 0.2 ? 16 : 8,
          }),
        );
      }

      // Target-model single-pass verification wave pulsing cleanly in the dedicated lower verification lane
      if (vw > 0.02 && vw < 0.98) {
        const beamX = -290 + vw * 840;
        const beamOp = Math.sin(vw * Math.PI);
        nodes.push(verifyBeam(beamX, 108, 168, beamOp, COSMOS.gold));
      }

      // Target parallel scoring ribbon beneath the guesses
      if (vw > 0.15) {
        const barOp = Math.min(1, (vw - 0.15) * 2.5);
        const barW = 840 * Math.min(1, vw * 1.15);
        nodes.push(
          rect(barW, 14, { fill: COSMOS.gold, stroke: null, radius: 7 })
            .at(-290 + barW * 0.5, 138)
            .glow(12, COSMOS.gold)
            .opacity(barOp * 0.85),
          txt(
            'ONE TARGET FORWARD PASS SCORES ALL THREE GUESSES',
            130,
            204,
            27,
            COSMOS.gold,
            'mono',
          ).opacity(barOp),
        );
      }

      // Open replacement slot after "sang" once softly is rejected
      if (os > 0.05) {
        const slotY = 278;
        nodes.push(
          tokenPill('?', 120, slotY, {
            w: 226,
            h: 82,
            color: COSMOS.violet,
            wordColor: COSMOS.gold,
            wordSize: 42,
            dash: [8, 6],
            glow: 14,
            opacity: os,
          }),
          txt('REPLACEMENT AFTER "sang"', 120, slotY + 66, 26, COSMOS.violet, 'mono').opacity(os),
        );
      }

      // Bottom left live narrative anchor (keeps A8 always true for current state!)
      let statusLine = 'Draft guesses ahead one token at a time';
      let statusCol = COSMOS.muted;
      if (sq > 0.2) {
        statusLine = 'Goal: fill the gap with exact target probabilities p(x)';
        statusCol = COSMOS.emerald;
      } else if (os > 0.2) {
        statusLine = 'Rejecting "softly" invalidates "today": need a word after "sang"';
        statusCol = COSMOS.violet;
      } else if (tr > 0.2) {
        statusLine = 'Target read "softly" immediately before scoring "today"';
        statusCol = COSMOS.gold;
      } else if (ask > 0.2) {
        statusLine = 'Which word did the target read right before scoring "today"?';
        statusCol = COSMOS.amber;
      } else if (vw > 0.15) {
        statusLine = 'Target scores sang, softly, and today together in parallel';
        statusCol = COSMOS.gold;
      }
      nodes.push(txt(statusLine, -855, 420, 30, statusCol, 'sans', 'left'));

      return group(...nodes);
    },
  );

  s.add(heroAura(120, -20, 520, '#5ce1e61c', '#ffd16612'), cinemaRails(), title, sceneView);

  onCue(s, c, 'draft-sang', (d) => draftCount.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'draft-softly', (d) => draftCount.to(2, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'draft-today', (d) => draftCount.to(3, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'verify-line', (d) => verifyWave.to(1, { duration: d, ease: linear }), {
    desired: 1.4,
  });
  onCue(s, c, 'ask-history', (d) => askToday.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'trace-history', (d) => traceSoftly.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'keep-sang', (d) => keepSang.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'old-history', (d) => rejectSoftly.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'open-space', (d) => openSpace.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sampler-question', (d) => samplerQ.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 2: draft ("The child saw a …")
 * Paired draft q(x) vs target p(x) columns for bird/dog/cat, cumulative [0,1] draft strip,
 * uniform draw u = 0.35 landing inside dog [0.20, 0.70], aligned served-law rule.
 */
export function draft(s, c) {
  const amb = startAmbient(s, c);
  const showDraft = s.value(0);
  const showTarget = s.value(0);
  const showStrip = s.value(0);
  const drawProg = s.value(0);
  const selectDog = s.value(0);
  const showServed = s.value(0);

  const chosenIdx = sampleProposal(Q, 0.35); // 1 -> 'dog'

  const title = heroTitle(['The child saw a …', 'Draft proposal vs Target law'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'PROPOSAL SAMPLING',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const t = amb.value;
      const sd = showDraft.value;
      const st = showTarget.value;
      const ss = showStrip.value;
      const dp = drawProg.value;
      const sel = selectDog.value;
      const sv = showServed.value;

      const nodes = [];
      const colXs = [-560, 0, 560];
      const baseY = 55;
      const scaleH = 420; // 0.50 -> 210 px tall

      // Baseline for the three word columns
      nodes.push(line([-780, baseY], [780, baseY], { stroke: '#3a4b78', width: 2.4 }));

      for (let i = 0; i < WORDS.length; i++) {
        const cx = colXs[i];
        const isDog = i === chosenIdx;
        const qH = Q[i] * scaleH * sd;
        const pH = P[i] * scaleH * st;

        // Subtle highlight halo behind selected "dog" column
        if (isDog && sel > 0.05) {
          nodes.push(
            rect(340, 260, {
              fill: '#ffd16612',
              stroke: COSMOS.gold,
              width: 2.4,
              radius: 18,
            })
              .at(cx, baseY - 142)
              .glow(10, COSMOS.gold)
              .opacity(sel),
          );
        }

        // Draft q(x) cyan bar (left of pair)
        if (qH > 2) {
          nodes.push(
            rect(86, qH, {
              fill: '#5ce1e644',
              stroke: COSMOS.cyan,
              width: 2.6,
              radius: 8,
            })
              .at(cx - 56, baseY - qH * 0.5)
              .glow(8, COSMOS.cyan),
            txt(`q=${Q[i].toFixed(2)}`, cx - 56, baseY - qH - 26, 26, COSMOS.cyan, 'mono'),
          );
        }

        // Target p(x) gold bar (right of pair)
        if (pH > 2) {
          nodes.push(
            rect(86, pH, {
              fill: '#ffd16640',
              stroke: COSMOS.gold,
              width: 2.6,
              radius: 8,
            })
              .at(cx + 56, baseY - pH * 0.5)
              .glow(8, COSMOS.gold),
            txt(`p=${P[i].toFixed(2)}`, cx + 56, baseY - pH - 26, 26, COSMOS.gold, 'mono'),
          );
        }

        // Word label below baseline
        nodes.push(
          txt(WORDS[i], cx, baseY + 42, 38, isDog && sel > 0.3 ? COSMOS.gold : COSMOS.ink, 'mono'),
        );
      }

      // Legend floating top-right
      nodes.push(
        rect(22, 22, { fill: '#5ce1e655', stroke: COSMOS.cyan, width: 2, radius: 4 }).at(450, -390),
        txt('Draft q(x)', 480, -390, 26, COSMOS.cyan, 'mono', 'left'),
        rect(22, 22, { fill: '#ffd16655', stroke: COSMOS.gold, width: 2, radius: 4 }).at(450, -345),
        txt('Target p(x)', 480, -345, 26, COSMOS.gold, 'mono', 'left'),
      );

      // Cumulative draft strip [0, 1] below
      if (ss > 0.04) {
        const stripX = -700;
        const stripW = 1400;
        const stripY = 235;
        const segColors = [COSMOS.blue, COSMOS.cyan, COSMOS.violet];
        let acc = 0;

        nodes.push(
          txt(
            'CUMULATIVE DRAFT STRIP  q(x)',
            stripX,
            stripY - 82,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(ss),
        );

        for (let i = 0; i < WORDS.length; i++) {
          const w = Q[i] * stripW * ss;
          const sx = stripX + acc * stripW;
          const isDog = i === chosenIdx;
          nodes.push(
            rect(w - 4, 56, {
              fill: isDog && sel > 0.3 ? '#ffd16638' : '#16203a',
              stroke: isDog && sel > 0.3 ? COSMOS.gold : segColors[i],
              width: isDog && sel > 0.3 ? 3.4 : 2.2,
              radius: 10,
            })
              .at(sx + w * 0.5, stripY)
              .opacity(ss),
            txt(
              `${WORDS[i]} (${Q[i].toFixed(2)})`,
              sx + w * 0.5,
              stripY,
              26,
              isDog && sel > 0.3 ? COSMOS.gold : COSMOS.ink,
              'mono',
            ).opacity(ss),
          );
          acc += Q[i];
        }

        // Endpoint ticks 0.0 and 1.0
        nodes.push(
          txt('0.00', stripX, stripY + 56, 26, COSMOS.dim, 'mono', 'left').opacity(ss),
          txt('1.00', stripX + stripW, stripY + 56, 26, COSMOS.dim, 'mono', 'right').opacity(ss),
        );

        // Animated uniform draw u = 0.35 photon riding cleanly above the strip (never crosses text!)
        if (dp > 0.04) {
          const uDraw = 0.35 * dp;
          const ux = stripX + uDraw * stripW;
          const pulse = 9 + 4 * Math.sin(t * Math.PI * 10);
          nodes.push(
            line([ux, stripY - 52], [ux, stripY - 30], { stroke: COSMOS.gold, width: 3.8 })
              .glow(12, COSMOS.gold)
              .set('blend', 'screen'),
            glowDot(ux, stripY - 40, { radius: 7, color: '#ffffff', glow: 14 }),
            circle(pulse, { fill: null, stroke: COSMOS.gold, width: 2.0 })
              .at(ux, stripY - 40)
              .opacity(0.6)
              .set('blend', 'screen'),
            txt(`uniform draw u = ${uDraw.toFixed(2)}`, 0, stripY + 98, 28, COSMOS.gold, 'mono'),
          );
        }
      }

      // Bottom served-law rule readout
      const footText =
        sv > 0.25
          ? 'Compare the actual served probabilities (after filters & temperature) on matching tokens'
          : sel > 0.25
            ? 'Proposal: dog   |   q(dog) = 0.50   |   p(dog) = 0.30'
            : 'Same prefix, same word event: measure both q(x) and p(x)';
      nodes.push(
        txt(footText, 0, 415, 29, sv > 0.25 ? COSMOS.emerald : COSMOS.muted, 'sans', 'center'),
      );

      return group(...nodes);
    },
  );

  s.add(heroAura(0, -40, 500, '#5ce1e61a', '#ffd16614'), cinemaRails(), title, view);

  onCue(s, c, 'dog-row', (d) => showDraft.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'target-row', (d) => showTarget.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'draw-source', (d) => showStrip.to(1, { duration: d }), { desired: 0.7 });
  onCue(s, c, 'sample-mark', (d) => drawProg.to(1, { duration: d }), { desired: 0.7 });
  onCue(s, c, 'select-dog', (d) => selectDog.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'served-laws', (d) => showServed.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 3: accept ("How often should dog get through?")
 * Glowing unit-interval acceptance gate alpha = min(1, p/q) = 0.60.
 * Prediction withheld during beat 0 (question) and beat 2 (u = 0.80 question)!
 */
export function accept(s, c) {
  const amb = startAmbient(s, c);
  const d0 = decomposition(P, Q);
  const qDog = Q[1]; // 0.5
  const pDog = P[1]; // 0.3
  const alphaDog = d0.acceptance[1]; // 0.6

  const showInputs = s.value(0);
  const askRatio = s.value(0);
  const revealRatio = s.value(0);
  const showCap = s.value(0);
  const drawU = s.value(0); // 0 -> 0.20 -> 0.80
  const drawVisible = s.value(0);
  const firstVerdict = s.value(0);
  const secondAsk = s.value(0);
  const secondVerdict = s.value(0);
  const showShare = s.value(0);

  const title = heroTitle(['Acceptance gate', 'min(1, p / q)'], {
    x: -855,
    y: -425,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.emerald,
    eyebrow: 'PROPOSAL: DOG',
  });

  const eq = glowTex(
    String.raw`\alpha(\text{dog}) = \min\!\left(1,\; \frac{p(\text{dog})}{q(\text{dog})}\right) = \frac{0.30}{0.50} = 0.60`,
    {
      x: 240,
      y: -365,
      size: 36,
      color: COSMOS.gold,
    },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const t = amb.value;
      const inp = showInputs.value;
      const askR = askRatio.value;
      const revR = revealRatio.value;
      const cap = showCap.value;
      const uVal = drawU.value;
      const uVis = drawVisible.value;
      const v1 = firstVerdict.value;
      const v2Ask = secondAsk.value;
      const v2 = secondVerdict.value;
      const sh = showShare.value;

      const nodes = [];

      // Upper comparison bars: Draft q(dog) = 0.50 vs Target p(dog) = 0.30
      const barX = -560;
      const barW = 860;
      nodes.push(
        txt('Draft q(dog)', -855, -185, 30, COSMOS.cyan, 'mono', 'left'),
        probBarH(barX, -185, barW, 40, qDog * inp, 0.6, { color: COSMOS.cyan }),
        txt(qDog.toFixed(2), barX + barW + 30, -185, 34, COSMOS.cyan, 'mono', 'left').opacity(inp),

        txt('Target p(dog)', -855, -108, 30, COSMOS.gold, 'mono', 'left'),
        probBarH(barX, -108, barW, 40, pDog * inp, 0.6, { color: COSMOS.gold }),
        txt(pDog.toFixed(2), barX + barW + 30, -108, 34, COSMOS.gold, 'mono', 'left').opacity(inp),
      );

      // Cap-at-1 note on right when active
      if (cap > 0.05) {
        nodes.push(
          txt(
            'p >= q  =>  keep 100% (cap at 1)',
            855,
            -248,
            26,
            COSMOS.emerald,
            'mono',
            'right',
          ).opacity(cap),
        );
      }

      // Main glowing [0, 1] acceptance gate ruler
      const rulerX = -700;
      const rulerW = 1400;
      const rulerY = 105;
      const gateX = rulerX + alphaDog * rulerW;

      nodes.push(
        rect(rulerW, 56, { fill: '#111626', stroke: '#3a4b78', width: 2.2, radius: 12 }).at(
          rulerX + rulerW * 0.5,
          rulerY,
        ),
        txt('0.0', rulerX, rulerY + 64, 26, COSMOS.dim, 'mono', 'left'),
        txt('1.0', rulerX + rulerW, rulerY + 64, 26, COSMOS.dim, 'mono', 'right'),
      );

      // Before reveal: question prompt; after reveal: emerald KEEP [0..0.6] & rose REJECT [0.6..1.0]
      if (revR > 0.04) {
        const keepW = alphaDog * rulerW * revR;
        const rejW = (1 - alphaDog) * rulerW * revR;
        nodes.push(
          rect(keepW, 50, { fill: '#6ee7b738', stroke: COSMOS.emerald, width: 2.8, radius: 10 })
            .at(rulerX + keepW * 0.5, rulerY)
            .glow(10, COSMOS.emerald)
            .opacity(revR),
          rect(rejW, 50, { fill: '#ff6b8b28', stroke: COSMOS.rose, width: 2.4, radius: 10 })
            .at(gateX + rejW * 0.5, rulerY)
            .opacity(revR),
          line([gateX, rulerY - 46], [gateX, rulerY + 46], { stroke: COSMOS.gold, width: 4.5 })
            .glow(12, COSMOS.gold)
            .opacity(revR),
          txt(
            'KEEP  [0, 0.60)',
            rulerX + keepW * 0.5,
            rulerY - 62,
            28,
            COSMOS.emerald,
            'mono',
          ).opacity(revR),
          txt(
            'REJECT  [0.60, 1)',
            gateX + rejW * 0.5,
            rulerY - 62,
            28,
            COSMOS.rose,
            'mono',
          ).opacity(revR),
          txt('cutoff 0.60', gateX, rulerY + 68, 28, COSMOS.gold, 'mono').opacity(revR),
        );
      } else if (askR > 0.04) {
        nodes.push(
          txt(
            'What fraction of proposed dogs should get through?',
            0,
            rulerY - 66,
            32,
            COSMOS.amber,
            'sans',
          ).opacity(askR),
        );
      }

      // Uniform draw photon marker on ruler (first u = 0.20 -> PASS, then u = 0.80 -> ?)
      if (uVis > 0.04) {
        const ux = rulerX + uVal * rulerW;
        const isSecond = v2Ask > 0.2 || v2 > 0.2;
        let markerCol = COSMOS.gold;
        let verdictTxt = '';
        if (!isSecond && v1 > 0.25) {
          markerCol = COSMOS.emerald;
          verdictTxt = 'u = 0.20 < 0.60  ->  PASS';
        } else if (v2 > 0.25) {
          markerCol = COSMOS.rose;
          verdictTxt = 'u = 0.80 >= 0.60  ->  REJECT';
        } else if (isSecond) {
          markerCol = COSMOS.amber;
          verdictTxt = 'u = 0.80  ->  Does this dog pass?';
        } else {
          verdictTxt = `u = ${uVal.toFixed(2)}`;
        }
        const ringR = 14 + 6 * Math.sin(t * Math.PI * 10);
        nodes.push(
          line([ux, rulerY - 38], [ux, rulerY + 38], { stroke: markerCol, width: 4.5 })
            .glow(12, markerCol)
            .set('blend', 'screen'),
          glowDot(ux, rulerY, { radius: 9, color: '#ffffff', glow: 16 }),
          circle(ringR, { fill: null, stroke: markerCol, width: 2.4 })
            .at(ux, rulerY)
            .opacity(0.75)
            .set('blend', 'screen'),
          txt(verdictTxt, 0, 245, 36, markerCol, 'mono'),
        );
      }

      // Final accepted-share identity
      if (sh > 0.04) {
        nodes.push(
          txt(
            'Accepted dog share:  q(dog) * alpha(dog) = 0.50 * 0.60 = 0.30 = p(dog)',
            0,
            365,
            30,
            COSMOS.emerald,
            'mono',
          )
            .glow(6, COSMOS.emerald)
            .opacity(sh),
        );
      }

      return group(...nodes);
    },
  );

  s.add(heroAura(0, 60, 520, '#6ee7b71a', '#ffd16614'), cinemaRails(), title, view);

  onCue(s, c, 'dog-inputs', (d) => showInputs.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'dog-question', (d) => askRatio.to(1, { duration: d }), { desired: 0.45 });
  c.show('acceptance-ratio', eq);
  onCue(s, c, 'acceptance-ratio', (d) => revealRatio.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'cap-one', (d) => showCap.to(1, { duration: d }), { desired: 0.45 });
  onCue(
    s,
    c,
    'first-draw',
    (d) => par(drawVisible.to(1, { duration: d * 0.5 }), drawU.to(0.2, { duration: d })),
    { desired: 0.65 },
  );
  onCue(s, c, 'first-result', (d) => firstVerdict.to(1, { duration: d }), { desired: 0.4 });
  onCue(s, c, 'second-draw', (d) => drawU.to(0.8, { duration: d }), { desired: 0.7 });
  onCue(s, c, 'draw-question', (d) => secondAsk.to(1, { duration: d }), { desired: 0.4 });
  onCue(s, c, 'second-result', (d) => secondVerdict.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'accepted-share', (d) => showShare.to(1, { duration: d }), { desired: 0.55 });
}

/**
 * Scene 4: residual ("A rejection supplies the target's missing mass")
 * Signature cinema visual: discrete probability columns with emerald min(p,q), luminous violet
 * residual max(0,p-q), normalized residual bars, AND live q -> p morph collapsing Z -> 0!
 */
export function residual(s, c) {
  const amb = startAmbient(s, c);
  const showDeficit = s.value(0);
  const showNorm = s.value(0);
  const focusBird = s.value(0);
  const showBirdOne = s.value(0);
  const showZ = s.value(0);
  const morphMatch = s.value(0); // 0 -> 1 morphs q smoothly onto p so deficit & Z -> 0!
  const showZeroGuard = s.value(0);

  const title = heroTitle(['Residual distribution', 'norm(max(0, p - q))'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.violet,
    eyebrow: 'EXACT REJECTION RESAMPLING',
  });

  const eq = glowTex(
    String.raw`r(x) = \frac{\max(0,\; p(x) - q(x))}{\sum_y \max(0,\; p(y) - q(y))}`,
    {
      x: 340,
      y: -368,
      size: 36,
      color: COSMOS.gold,
    },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const t = amb.value;
      const m = morphMatch.value;
      const def = showDeficit.value;
      const norm = showNorm.value;
      const fb = focusBird.value;
      const b1 = showBirdOne.value;
      const sz = showZ.value;
      const zg = showZeroGuard.value;

      // Interpolate q smoothly toward p when matching-laws triggers
      const curQ = Q.map((qv, i) => qv + (P[i] - qv) * m);
      const isMatched = m > 0.96;
      const effQ = isMatched ? [...P] : curQ;
      const dec = decomposition(P, effQ);

      const nodes = [];
      const baseY = 210;
      const scaleH = 520; // 0.50 -> 260 px
      const barW = 112;

      // Left side: Target p(x) vs Draft q(x) decomposition bars for bird / dog / cat
      const leftXs = [-660, -400, -140];
      nodes.push(
        line([-780, baseY], [-20, baseY], { stroke: '#3a4b78', width: 2.4 }),
        txt('OVERLAP min(p,q) & DEFICIT max(0,p-q)', -400, -185, 26, COSMOS.muted, 'mono'),
      );

      for (let i = 0; i < WORDS.length; i++) {
        const cx = leftXs[i];
        const accH = dec.overlap[i] * scaleH;
        const defH = dec.deficit[i] * scaleH * def;
        const overH = Math.max(0, effQ[i] - P[i]) * scaleH;
        const pY = baseY - P[i] * scaleH;
        const qY = baseY - effQ[i] * scaleH;

        // Emerald accepted overlap [0 .. min(p,q)]
        if (accH > 2) {
          nodes.push(
            rect(barW, accH, {
              fill: '#6ee7b738',
              stroke: COSMOS.emerald,
              width: 2.4,
              radius: 7,
            })
              .at(cx, baseY - accH * 0.5)
              .glow(6, COSMOS.emerald),
          );
        }

        // Luminous violet deficit [q .. p] when p > q
        if (defH > 2) {
          nodes.push(
            rect(barW, defH, {
              fill: i === 0 && fb > 0.2 ? '#a78bfa80' : '#a78bfa50',
              stroke: COSMOS.violet,
              width: i === 0 && fb > 0.2 ? 3.4 : 2.4,
              radius: 7,
            })
              .at(cx, qY - defH * 0.5)
              .glow(i === 0 ? 14 : 8, COSMOS.violet)
              .set('blend', 'screen'),
          );
        }

        // Translucent cyan draft excess [p .. q] when q > p
        if (overH > 2) {
          nodes.push(
            rect(barW, overH, {
              fill: '#5ce1e61c',
              stroke: COSMOS.cyan,
              width: 2.0,
              dash: [6, 5],
              radius: 7,
            }).at(cx, pY - overH * 0.5),
          );
        }

        // Gold target p(x) top cap & cyan draft q(x) marker
        nodes.push(
          line([cx - barW * 0.58, pY], [cx + barW * 0.58, pY], {
            stroke: COSMOS.gold,
            width: 4.2,
          })
            .glow(10, COSMOS.gold)
            .set('blend', 'screen'),
          glowDot(cx, pY, { radius: 6, color: COSMOS.gold, glow: 10 }),
          line([cx - barW * 0.45, qY], [cx + barW * 0.45, qY], {
            stroke: COSMOS.cyan,
            width: 3.0,
          }).glow(6, COSMOS.cyan),
          txt(
            WORDS[i],
            cx,
            baseY + 42,
            32,
            i === 0 && fb > 0.2 ? COSMOS.violet : COSMOS.ink,
            'mono',
          ),
          txt(
            `+${dec.deficit[i].toFixed(2)}`,
            cx,
            Math.min(pY, qY) - 46,
            26,
            dec.deficit[i] > 0.005 ? COSMOS.violet : COSMOS.dim,
            'mono',
          ).opacity(def),
        );
      }

      // Right side: Normalized Residual Distribution r(x)
      const rightXs = [220, 480, 740];
      const normScale = 270;
      nodes.push(
        line([100, baseY], [855, baseY], { stroke: '#3a4b78', width: 2.4 }),
        txt(
          isMatched ? 'RESIDUAL r(x): UNREACHABLE (Z = 0)' : 'NORMALIZED RESIDUAL r(x)',
          480,
          -185,
          26,
          isMatched ? COSMOS.amber : COSMOS.violet,
          'mono',
        ),
      );

      for (let i = 0; i < WORDS.length; i++) {
        const cx = rightXs[i];
        const rVal = dec.residual ? dec.residual[i] : 0;
        const rH = rVal * normScale * norm;
        if (rH > 2) {
          const glowPulse = 12 + 5 * Math.sin(t * Math.PI * 8);
          nodes.push(
            rect(barW, rH, {
              fill: '#a78bfa68',
              stroke: COSMOS.violet,
              width: 3.2,
              radius: 8,
            })
              .at(cx, baseY - rH * 0.5)
              .glow(glowPulse, COSMOS.violet)
              .set('blend', 'screen'),
          );
        }
        nodes.push(
          txt(WORDS[i], cx, baseY + 42, 32, COSMOS.ink, 'mono'),
          txt(
            isMatched ? 'n/a' : rVal.toFixed(2),
            cx,
            baseY - Math.max(0, rH) - 28,
            28,
            rVal > 0.01 ? COSMOS.gold : COSMOS.dim,
            'mono',
          ).opacity(Math.max(norm, isMatched ? 1 : 0)),
        );
      }

      // Glowing normalization flow bridge in the clean central corridor between left & right charts
      if (norm > 0.2 && !isMatched) {
        nodes.push(
          glowingTrail(
            [
              [-35, 35],
              [50, 35],
              [135, 35],
            ],
            {
              gradientColors: [COSMOS.violet, COSMOS.gold],
              width: 4.5,
              opacity: norm * (1 - m),
              glow: 12,
            },
          ),
          txt('/ Z', 50, -8, 28, COSMOS.gold, 'mono').opacity(norm * (1 - m)),
        );
      }

      // Bottom Z readout & zero-residual safety branch
      const zVal = dec.z;
      const bottomMsg =
        zg > 0.3 || isMatched
          ? `p = q  =>  total residual Z = ${zVal.toFixed(2)}  (rejection probability = 0, never divide by 0)`
          : sz > 0.25
            ? `Z = ${zVal.toFixed(2)} = rejection chance`
            : b1 > 0.25
              ? 'Only bird has a deficit (+0.30)  =>  r(bird) = 0.30 / 0.30 = 1.00'
              : 'On rejection, draw replacement from positive deficit (p - q)+';
      nodes.push(txt(bottomMsg, 0, 385, 29, isMatched ? COSMOS.emerald : COSMOS.gold, 'mono'));

      return group(...nodes);
    },
  );

  s.add(heroAura(220, 40, 480, '#a78bfa22', '#ffd16614'), cinemaRails(), title, eq, view);

  onCue(s, c, 'positive-deficit', (d) => showDeficit.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'normalize-residual', (d) => showNorm.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'bird-deficit', (d) => focusBird.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'bird-correction', (d) => showBirdOne.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'rejection-mass', (d) => showZ.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'matching-laws', (d) => morphMatch.to(1, { duration: d }), { desired: 1.1 });
  onCue(s, c, 'zero-residual', (d) => showZeroGuard.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 5: proof ("Where does the rejected probability go?")
 * Mass conservation ledger for [bird, dog, cat]:
 *   1. Original draft Q = [0.2, 0.5, 0.3] -> 0.20 from dog + 0.10 from cat flow into bird's 0.30 gap!
 *   2. Identity: P_spec(x) = min(p, q) + max(0, p - q) = p(x).
 *   3. New draft TWO_GAP_Q = [0.3, 0.2, 0.5] -> cat rejects 0.30, splitting 1/3 to dog, 2/3 to bird!
 */
export function proof(s, c) {
  const amb = startAmbient(s, c);
  const showAccepted = s.value(0);
  const askSpace = s.value(0);
  const flowOrig = s.value(0); // 0 -> 1 moves rejected 0.2+0.1 into bird
  const showOrigSum = s.value(0);
  const showIdentity = s.value(0);
  const useNewDraft = s.value(0); // 0 -> 1 switches to TWO_GAP_Q
  const askTwoGaps = s.value(0);
  const revealDogThird = s.value(0);
  const revealBirdTwoThirds = s.value(0);

  const origDec = decomposition(P, Q);
  const splitDec = decomposition(P, TWO_GAP_Q);

  const title = heroTitle(['Conserved probability', 'exact target equivalence'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'MASS CONSERVATION PROOF',
  });

  const idEq = glowTex(
    String.raw`P_{\text{out}}(x) = \min(p(x), q(x)) + \max(0,\, p(x) - q(x)) = p(x)`,
    {
      x: 245,
      y: -365,
      size: 31,
      color: COSMOS.emerald,
    },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const t = amb.value;
      const acc = showAccepted.value;
      const askS = askSpace.value;
      const fl = flowOrig.value;
      const sum1 = showOrigSum.value;
      const isNew = useNewDraft.value > 0.5;
      const ask2 = askTwoGaps.value;
      const rDog = revealDogThird.value;
      const rBird = revealBirdTwoThirds.value;

      const curQ = isNew ? TWO_GAP_Q : Q;
      const dec = isNew ? splitDec : origDec;

      const nodes = [];
      const rowXs = -520;
      const scaleW = 1480; // 0.60 -> 888 px
      const rowYs = [-145, 55, 255];

      // Division ruler guide (each division = 0.10): cleanly spaced between title and bird row
      nodes.push(
        txt('1 div = 0.10', 855, -242, 26, COSMOS.muted, 'mono', 'right'),
        rect(22, 22, { fill: '#6ee7b755', stroke: COSMOS.emerald, width: 2, radius: 4 }).at(
          -555,
          -242,
        ),
        txt('Accepted min(p,q)', -525, -242, 26, COSMOS.emerald, 'mono', 'left'),
        rect(22, 22, { fill: '#a78bfa66', stroke: COSMOS.violet, width: 2, radius: 4 }).at(
          -175,
          -242,
        ),
        txt('Correction', -145, -242, 26, COSMOS.violet, 'mono', 'left'),
        rect(22, 22, { fill: '#ff6b8b55', stroke: COSMOS.rose, width: 2, radius: 4 }).at(90, -242),
        txt('Rejected excess', 120, -242, 26, COSMOS.rose, 'mono', 'left'),
      );

      for (let i = 0; i < WORDS.length; i++) {
        const y = rowYs[i];
        const targetEdge = rowXs + P[i] * scaleW;
        const ovW = dec.overlap[i] * scaleW;
        const excess = Math.max(0, curQ[i] - P[i]);

        // How much correction has flowed into row i?
        let corrAmt = 0;
        let looseAmt = excess;
        if (!isNew) {
          corrAmt = dec.deficit[i] * fl;
          looseAmt = excess * (1 - fl);
        } else {
          if (i === 1) corrAmt = dec.deficit[1] * rDog;
          if (i === 0) corrAmt = dec.deficit[0] * rBird;
          const drain = Math.max(rDog * (1 / 3), rDog * (1 / 3) + rBird * (2 / 3));
          looseAmt = excess * Math.max(0, 1 - drain);
        }

        // Row label
        nodes.push(txt(WORDS[i], -785, y, 42, COSMOS.ink, 'mono', 'left'));

        // Target outline container [0 .. P[i]]
        nodes.push(
          rect(P[i] * scaleW, 56, {
            fill: '#111626',
            stroke: COSMOS.gold,
            width: 2.2,
            radius: 8,
          }).at(rowXs + P[i] * scaleW * 0.5, y),
        );

        // Accepted emerald segment [0 .. min(p,q)]
        if (ovW > 2) {
          nodes.push(
            rect(ovW * Math.max(0.2, acc), 48, {
              fill: '#6ee7b748',
              stroke: COSMOS.emerald,
              width: 2.4,
              radius: 6,
            })
              .at(rowXs + ovW * Math.max(0.2, acc) * 0.5, y)
              .glow(6, COSMOS.emerald),
          );
        }

        // Correction violet segment [min(p,q) .. min(p,q) + corrAmt]
        const corrW = corrAmt * scaleW;
        if (corrW > 2) {
          nodes.push(
            rect(corrW, 48, {
              fill: '#a78bfa70',
              stroke: COSMOS.violet,
              width: 2.6,
              radius: 6,
            })
              .at(rowXs + ovW + corrW * 0.5, y)
              .glow(10, COSMOS.violet)
              .set('blend', 'screen'),
          );
        }

        // Rejected excess rose segment beyond target mark
        const looseW = looseAmt * scaleW;
        if (looseW > 2) {
          nodes.push(
            rect(looseW, 48, {
              fill: '#ff6b8b55',
              stroke: COSMOS.rose,
              width: 2.4,
              radius: 6,
            })
              .at(rowXs + ovW + looseW * 0.5, y)
              .glow(8, COSMOS.rose),
          );
        }

        // Tenth ticks below bar
        for (let k = 0; k <= 5; k++) {
          const tx = rowXs + (k / 10) * scaleW;
          nodes.push(line([tx, y + 34], [tx, y + 48], { stroke: '#4c5f8a', width: 1.8 }));
        }

        // Glowing target vertical mark
        nodes.push(
          line([targetEdge, y - 34], [targetEdge, y + 34], {
            stroke: COSMOS.gold,
            width: 4.0,
          }).glow(10, COSMOS.gold),
          txt(`p=${P[i].toFixed(2)}`, targetEdge, y - 62, 26, COSMOS.gold, 'mono'),
        );

        // Right-side accounted total readout
        const total = dec.overlap[i] + corrAmt;
        let rightStr = `${total.toFixed(2)}`;
        let rightCol = COSMOS.ink;
        if (isNew && i === 1 && rDog > 0.3) {
          rightStr = '+1/3 of corr (=0.10)';
          rightCol = COSMOS.gold;
        } else if (isNew && i === 0 && rBird > 0.3) {
          rightStr = '+2/3 of corr (=0.20)';
          rightCol = COSMOS.violet;
        } else if (!isNew && i === 0 && sum1 > 0.3) {
          rightStr = '0.20 + 0.30 = 0.50';
          rightCol = COSMOS.emerald;
        }
        nodes.push(txt(rightStr, 855, y, 28, rightCol, 'mono', 'right'));
      }

      // Glowing conservation flow arcs from rejected excess into open deficit
      if (!isNew && fl > 0.05 && fl < 0.99) {
        const pulseOp = Math.sin(fl * Math.PI) * 0.9;
        nodes.push(
          glowingTrail(
            [
              [rowXs + 0.4 * scaleW, rowYs[1] - 28],
              [rowXs + 0.62 * scaleW, (rowYs[1] + rowYs[0]) * 0.5],
              [rowXs + 0.35 * scaleW, rowYs[0] + 28],
            ],
            { gradientColors: [COSMOS.rose, COSMOS.violet], width: 4.5, opacity: pulseOp },
          ),
        );
      }

      // Dynamic ambient photon sliding along the active conservation rail
      const px = rowXs + ((t * 1.4) % 1) * (0.5 * scaleW);
      nodes.push(
        glowDot(px, rowYs[0] + 42, { radius: 4.5, color: COSMOS.emerald, glow: 8, opacity: 0.7 }),
      );

      // Bottom narration-synced prompt / takeaway
      let foot = 'Excess rejected mass fills every target shortfall with zero waste';
      let footCol = COSMOS.muted;
      if (rBird > 0.25) {
        foot = 'Dog gets 1/3 of corrections (0.10/0.30), bird gets 2/3 (0.20/0.30)';
        footCol = COSMOS.emerald;
      } else if (rDog > 0.25) {
        foot = 'Dog needs 0.10 out of 0.30 rejected mass -> 1/3 of all corrections';
        footCol = COSMOS.gold;
      } else if (ask2 > 0.25) {
        foot =
          'New draft q = [0.30, 0.20, 0.50]: when cat is rejected, how often is correction dog?';
        footCol = COSMOS.amber;
      } else if (askS > 0.25 && fl < 0.1) {
        foot = 'Dog has +0.20 excess and cat has +0.10 excess. Where should those 0.30 go?';
        footCol = COSMOS.amber;
      }
      nodes.push(txt(foot, 0, 415, 29, footCol, 'sans'));

      return group(...nodes);
    },
  );

  s.add(heroAura(0, 60, 520, '#6ee7b71a', '#a78bfa16'), cinemaRails(), title, view);

  onCue(s, c, 'accepted-path', (d) => showAccepted.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'find-space', (d) => askSpace.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'correction-path', (d) => flowOrig.to(1, { duration: d }), { desired: 1.0 });
  onCue(s, c, 'add-contributions', (d) => showOrigSum.to(1, { duration: d }), { desired: 0.45 });
  c.show('target-law-identity', idEq);
  onCue(s, c, 'target-law-identity', (d) => showIdentity.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'new-shares', (d) => useNewDraft.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'two-gaps', (d) => askTwoGaps.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'dog-third', (d) => revealDogThird.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'split-correction', (d) => revealBirdTwoThirds.to(1, { duration: d }), {
    desired: 0.65,
  });
}
