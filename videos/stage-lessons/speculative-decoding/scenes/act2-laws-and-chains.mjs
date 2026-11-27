// Act 2: Correctness Boundaries & Causal Chains
// (wrong-correction, serving-laws, event-mapping, chain, row-alignment)
import { group, line, linear, par, rect } from 'vizmatic/stage';
import {
  CHAIN,
  COSMOS,
  SEQUENCE_WORDS,
  cinemaRails,
  correctionCounterexample,
  crossPhase,
  decomposition,
  glowTex,
  glowingArc,
  guardedDynamic,
  heroAura,
  heroTitle,
  onCue,
  prefixStates,
  probBarH,
  tokenPill,
  transformedLaw,
  txt,
  verifyBeam,
  verifyChain,
} from '../shared.mjs';

/**
 * Scene 6: wrong-correction ("What if we redraw from the whole target?")
 * Timetable example (noon, dawn, dusk): compares ordinary target redraw (48%/40%/12% -> bias!)
 * against exact residual replacement (40%/50%/10% -> repaired!).
 */
export function wrongCorrection(s, c) {
  const cx = correctionCounterexample(); // p=[0.4,0.5,0.1], q=[0.6,0.3,0.1], z=0.2

  const showOverlap = s.value(0);
  const askQuestion = s.value(0);
  const showWrongNoon = s.value(0);
  const showWrongDawn = s.value(0);
  const repairRule = s.value(0);
  const repairFlow = s.value(0);
  const repairDone = s.value(0);

  const title = heroTitle(['Why not redraw', 'from the whole target?'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.rose,
    eyebrow: 'REPLACEMENT RULE COUNTEREXAMPLE',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const ov = showOverlap.value;
      const ask = askQuestion.value;
      const wNoon = showWrongNoon.value;
      const wDawn = showWrongDawn.value;
      const repR = repairRule.value;
      const repF = repairFlow.value;
      const repD = repairDone.value;

      const nodes = [];
      const rowX = -510;
      const scaleW = 1480; // 0.60 -> 888 px
      const rowYs = [-145, 55, 255];

      // Mode status top right
      const modeTxt =
        repR > 0.2
          ? 'EXACT RESIDUAL RULE: norm(max(0, p - q))'
          : wNoon > 0.2
            ? 'BROKEN RULE: redraw from full target p(x)'
            : 'ACCEPTED SHARES + 20% REJECTION MASS';
      const modeCol = repR > 0.2 ? COSMOS.emerald : wNoon > 0.2 ? COSMOS.rose : COSMOS.cyan;
      nodes.push(txt(modeTxt, 855, -365, 28, modeCol, 'mono', 'right'));

      for (let i = 0; i < SEQUENCE_WORDS.length; i++) {
        const y = rowYs[i];
        const targetEdge = rowX + cx.p[i] * scaleW;
        const baseW = cx.overlap[i] * scaleW * Math.max(0.2, ov);

        // Interpolate added replacement mass from wrong -> repaired
        const wrongAdd = i === 1 ? cx.wrongExtra[i] * wDawn : cx.wrongExtra[i] * wNoon;
        const rightAdd = cx.deficit[i] * repF;
        const added = wrongAdd * (1 - repF) + rightAdd;
        const addedW = added * scaleW;
        const total = cx.overlap[i] + added;

        // Word label
        nodes.push(txt(SEQUENCE_WORDS[i], -820, y, 42, COSMOS.ink, 'mono', 'left'));

        // Target container
        nodes.push(
          rect(cx.p[i] * scaleW, 56, {
            fill: '#111626',
            stroke: COSMOS.gold,
            width: 2.2,
            radius: 8,
          }).at(rowX + cx.p[i] * scaleW * 0.5, y),
        );

        // Accepted overlap (emerald)
        if (baseW > 2) {
          nodes.push(
            rect(baseW, 48, {
              fill: '#6ee7b744',
              stroke: COSMOS.emerald,
              width: 2.4,
              radius: 6,
            }).at(rowX + baseW * 0.5, y),
          );
        }

        // Added replacement share (rose if overshooting/wrong, violet if exact repair)
        if (addedW > 2) {
          const isBad = repF < 0.5 && (i === 0 || i === 2);
          const col = repF > 0.5 ? COSMOS.violet : isBad ? COSMOS.rose : COSMOS.amber;
          nodes.push(
            rect(addedW, 48, {
              fill: repF > 0.5 ? '#a78bfa70' : isBad ? '#ff6b8b68' : '#fb923c58',
              stroke: col,
              width: 2.8,
              radius: 6,
            })
              .at(rowX + baseW + addedW * 0.5, y)
              .glow(10, col)
              .set('blend', 'screen'),
          );
        }

        // Target reference line
        nodes.push(
          line([targetEdge, y - 34], [targetEdge, y + 34], { stroke: COSMOS.gold, width: 4 }).glow(
            10,
            COSMOS.gold,
          ),
          txt(`target ${(cx.p[i] * 100).toFixed(0)}%`, targetEdge, y - 62, 26, COSMOS.gold, 'mono'),
        );

        // Percentage readout on right
        const pct = Math.round(total * 100);
        const matches = Math.abs(total - cx.p[i]) < 0.005;
        const readoutCol =
          repD > 0.25 && matches
            ? COSMOS.emerald
            : wNoon > 0.25 && !matches
              ? COSMOS.rose
              : COSMOS.ink;
        nodes.push(txt(`${pct}%`, 855, y, 38, readoutCol, 'mono', 'right'));
      }

      // Bottom status line
      let foot = 'Noon already has its full 40%; dawn is missing 20 percentage points';
      let footCol = COSMOS.muted;
      if (repD > 0.25) {
        foot = 'Repaired: noon 40%, dawn 50%, dusk 10%: exact target distribution restored';
        footCol = COSMOS.emerald;
      } else if (repF > 0.25) {
        foot = 'Route the entire 20% rejected mass into dawn’s 20% deficit';
        footCol = COSMOS.violet;
      } else if (wNoon > 0.25) {
        foot = 'Redrawing from p(x) double-feeds noon (48%) and dusk (12%), starving dawn (40%)';
        footCol = COSMOS.rose;
      } else if (ask > 0.25) {
        foot = 'If rejections redraw from p(x), will noon stay at 40%?';
        footCol = COSMOS.amber;
      }
      nodes.push(txt(foot, 0, 415, 29, footCol, 'sans'));

      return group(...nodes);
    },
  );

  s.add(heroAura(0, 60, 520, '#ff6b8b18', '#6ee7b716'), cinemaRails(), title, view);

  onCue(s, c, 'train-overlap', (d) => showOverlap.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'redraw-question', (d) => askQuestion.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'wrong-allocation', (d) => showWrongNoon.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'wrong-dawn', (d) => showWrongDawn.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'repair-rule', (d) => repairRule.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'repair-flow', (d) => repairFlow.to(1, { duration: d }), { desired: 0.85 });
  onCue(s, c, 'repair-result', (d) => repairDone.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 7: serving-laws ("Which odds does the target use?")
 * Top-2 target filtering drops dusk (0.15), renormalizes noon (11/17) and dawn (6/17),
 * flips dawn acceptance from ~0.86 to 1.00 and dusk acceptance from 0.60 to 0.00!
 */
export function servingLaws(s, c) {
  const law = transformedLaw(); // raw=[0.55,0.30,0.15], target=[11/17,6/17,0], proposal=[0.40,0.35,0.25]

  const showTopK = s.value(0);
  const dropDusk = s.value(0);
  const normalizeP = s.value(0);
  const inspectDawn = s.value(0);
  const keepDawn = s.value(0);
  const zeroDusk = s.value(0);

  const title = heroTitle(['Served distributions', 'top-2 renormalization'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'FILTERED TARGET LAW',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const dd = dropDusk.value;
      const np = normalizeP.value;
      const iDawn = inspectDawn.value;
      const kDawn = keepDawn.value;
      const zDusk = zeroDusk.value;

      const nodes = [];
      const rowYs = [-145, 55, 255];
      const barX = -515;
      const barW = 720;

      // Legend header
      nodes.push(
        txt('DRAFT q(x)', barX, -245, 26, COSMOS.cyan, 'mono', 'left'),
        txt(
          np > 0.4 ? 'SERVED TARGET p(x)  (/ 0.85)' : 'RAW TARGET p_raw(x)',
          barX + 260,
          -245,
          26,
          COSMOS.gold,
          'mono',
          'left',
        ),
        txt('ACCEPTANCE alpha', 555, -245, 26, COSMOS.emerald, 'mono', 'center'),
      );

      for (let i = 0; i < SEQUENCE_WORDS.length; i++) {
        const y = rowYs[i];
        const rawP = law.raw[i];
        const servedP = law.target[i];
        const curP = i === 2 ? rawP * (1 - dd) : rawP + (servedP - rawP) * np;
        const qVal = law.proposal[i];
        const rawAlpha = Math.min(1, rawP / qVal);
        const servedAlpha = law.acceptance[i];

        const rowHighlight = (i === 1 && iDawn > 0.25) || (i === 2 && (dd > 0.25 || zDusk > 0.25));
        nodes.push(
          txt(
            SEQUENCE_WORDS[i],
            -835,
            y,
            40,
            i === 2 && dd > 0.4 ? COSMOS.rose : rowHighlight ? COSMOS.gold : COSMOS.ink,
            'mono',
            'left',
          ),
          // Draft bar (upper)
          probBarH(barX, y - 22, barW, 24, qVal, 0.72, { color: COSMOS.cyan, glow: 5 }),
          txt(`q=${qVal.toFixed(2)}`, barX + barW + 24, y - 22, 26, COSMOS.cyan, 'mono', 'left'),
          // Target bar (lower)
          probBarH(barX, y + 22, barW, 24, curP, 0.72, {
            color: i === 2 && dd > 0.4 ? COSMOS.rose : COSMOS.gold,
            glow: 6,
          }),
          txt(
            i === 0 && np > 0.5
              ? '11/17 (0.647)'
              : i === 1 && np > 0.5
                ? '6/17 (0.353)'
                : i === 2 && dd > 0.5
                  ? '0.000 (filtered)'
                  : `p=${curP.toFixed(2)}`,
            barX + barW + 24,
            y + 22,
            26,
            i === 2 && dd > 0.5 ? COSMOS.rose : COSMOS.gold,
            'mono',
            'left',
          ),
        );

        // Acceptance badge on far right
        let aStr = `raw ${rawAlpha.toFixed(2)}`;
        let aCol = COSMOS.muted;
        if (i === 0 && np > 0.5) {
          aStr = '1.00';
          aCol = COSMOS.emerald;
        } else if (i === 1 && kDawn > 0.3) {
          aStr = '0.86 -> 1.00';
          aCol = COSMOS.emerald;
        } else if (i === 2 && zDusk > 0.3) {
          aStr = '0.60 -> 0.00';
          aCol = COSMOS.rose;
        }
        nodes.push(
          tokenPill(aStr, 690, y, {
            w: 280,
            h: 64,
            color: aCol,
            wordColor: aCol,
            wordSize: 28,
            glow: aCol === COSMOS.muted ? 4 : 10,
          }),
        );
      }

      nodes.push(
        txt(
          'Apply temperature, top-k / top-p filters, and penalties BEFORE computing p(x) / q(x)',
          0,
          415,
          29,
          COSMOS.emerald,
          'sans',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(heroAura(0, 40, 500, '#5ce1e61a', '#ffd16614'), cinemaRails(), title, view);

  onCue(s, c, 'sd-serving-laws-b0', (d) => showTopK.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'drop-dusk', (d) => dropDusk.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'sd-target-law', (d) => normalizeP.to(1, { duration: d }), { desired: 0.75 });
  onCue(s, c, 'sd-serving-laws-b1', (d) => inspectDawn.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-policy-one', (d) => keepDawn.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-policy-zero', (d) => zeroDusk.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 8: event-mapping ("Map common token events before comparing probabilities")
 * Visualizes ID 4012 collision ("cat" vs "house") and Token-Level Intersection translation (cat -> ID 17).
 */
export function eventMapping(s, c) {
  const showCollision = s.value(0);
  const showIntersect = s.value(0);

  const title = heroTitle(['Token event alignment', 'IDs are not strings'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.rose,
    eyebrow: 'HETEROGENEOUS VOCABULARIES',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const sc = showCollision.value;
      const si = showIntersect.value;

      const nodes = [];

      // Column headers
      nodes.push(
        txt('DRAFT VOCABULARY', -470, -235, 30, COSMOS.cyan, 'mono'),
        txt('TARGET VOCABULARY', 470, -235, 30, COSMOS.gold, 'mono'),
      );

      // Top lane: ID 4012 mismatch
      const topY = -105;
      nodes.push(
        tokenPill('ID 4012 -> "cat"', -470, topY, {
          w: 470,
          h: 96,
          color: COSMOS.cyan,
          glow: 10,
          opacity: Math.max(0.3, sc),
        }),
        tokenPill('ID 4012 -> "house"', 470, topY, {
          w: 470,
          h: 96,
          color: COSMOS.rose,
          glow: 10,
          opacity: Math.max(0.3, sc),
        }),
        line([-225, topY], [-60, topY], { stroke: COSMOS.rose, width: 3.4, dash: [8, 6] }).opacity(
          sc,
        ),
        line([60, topY], [225, topY], { stroke: COSMOS.rose, width: 3.4, dash: [8, 6] }).opacity(
          sc,
        ),
        txt('!=', 0, topY, 44, COSMOS.rose, 'mono').glow(8, COSMOS.rose).opacity(sc),
        txt(
          'SAME NUMERIC ID, DIFFERENT TOKEN EVENTS',
          0,
          topY + 86,
          26,
          COSMOS.rose,
          'mono',
        ).opacity(sc),
      );

      // Lower lane: Token-Level Intersection translation bridge
      if (si > 0.04) {
        const botY = 145;
        nodes.push(
          tokenPill('shared: "cat" (4012)', -470, botY, {
            w: 470,
            h: 96,
            color: COSMOS.emerald,
            glow: 10,
            opacity: si,
          }),
          tokenPill('translated: "cat" (17)', 470, botY, {
            w: 470,
            h: 96,
            color: COSMOS.emerald,
            glow: 10,
            opacity: si,
          }),
          line([-225, botY], [225, botY], { stroke: COSMOS.emerald, width: 3.8 })
            .glow(10, COSMOS.emerald)
            .opacity(si),
          txt(
            'NORMALIZE -> SHARED SET -> TRANSLATE ID',
            0,
            botY + 88,
            27,
            COSMOS.emerald,
            'mono',
          ).opacity(si),
        );
      }

      nodes.push(
        txt(
          si > 0.3
            ? 'Token-Level Intersection handles greedy drafting; stochastic drafts need exact event laws'
            : 'Shared tokenizer guarantees aligned events; mismatched IDs break p(x) / q(x)',
          0,
          415,
          28,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(heroAura(0, 20, 500, '#ff6b8b16', '#6ee7b716'), cinemaRails(), title, view);

  onCue(s, c, 'sd-event-mapping-b0', (d) => showCollision.to(1, { duration: d }), {
    desired: 0.65,
  });
  onCue(s, c, 'sd-event-mapping-b1', (d) => showIntersect.to(1, { duration: d }), {
    desired: 0.75,
  });
}

/**
 * Scene 9: chain ("One target pass, three conditional scores")
 * Exact CHAIN fixture: sang (p=0.6, q=0.4 -> accept), softly (p=0.3, q=0.6, alpha=0.5, u=0.8 -> reject!),
 * today (computed after softly -> SKIP!), residual correction -> nearby!
 */
export function chain(s, c) {
  const res = verifyChain();

  const showDrafts = s.value(0);
  const scanTarget = s.value(0);
  const acceptSang = s.value(0);
  const rejectSoftly = s.value(0);
  const askToday = s.value(0);
  const skipToday = s.value(0);
  const showDep = s.value(0);
  const showNearby = s.value(0);
  const showHistory = s.value(0);

  const title = heroTitle(['One causal pass,', 'three conditional rows'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'MULTI-TOKEN CHAIN VERIFICATION',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const sd = showDrafts.value;
      const sc = scanTarget.value;
      const a1 = acceptSang.value;
      const r2 = rejectSoftly.value;
      const ask3 = askToday.value;
      const sk3 = skipToday.value;
      const dep = showDep.value;
      const near = showNearby.value;
      const hist = showHistory.value;

      const nodes = [];
      const colXs = [-430, 80, 590];
      const draftY = -175;
      const rowY = 40;

      // Committed prefix pill on far left
      nodes.push(
        tokenPill('The bird', -785, draftY, {
          w: 220,
          h: 88,
          color: COSMOS.blue,
          glow: 8,
          topTag: 'PREFIX',
          topColor: COSMOS.blue,
        }),
      );

      // Three draft proposals + their conditional target rows directly below
      const rowMeta = [
        {
          word: CHAIN[0].words[0],
          prefix: 'after "bird"',
          p: CHAIN[0].p[0],
          q: CHAIN[0].q[0],
          alpha: Math.min(1, CHAIN[0].p[0] / CHAIN[0].q[0]),
          u: CHAIN[0].uniform,
        },
        {
          word: CHAIN[1].words[0],
          prefix: 'after "sang"',
          p: CHAIN[1].p[0],
          q: CHAIN[1].q[0],
          alpha: Math.min(1, CHAIN[1].p[0] / CHAIN[1].q[0]),
          u: CHAIN[1].uniform,
        },
        {
          word: CHAIN[2].words[0],
          prefix: 'after "softly"',
          p: CHAIN[2].p[0],
          q: CHAIN[2].q[0],
          alpha: Math.min(1, CHAIN[2].p[0] / CHAIN[2].q[0]),
          u: CHAIN[2].uniform,
        },
      ];

      for (let i = 0; i < 3; i++) {
        const m = rowMeta[i];
        const x = colXs[i];
        let col = COSMOS.cyan;
        let status = `q=${m.q.toFixed(2)}`;
        if (i === 0 && a1 > 0.3) {
          col = COSMOS.emerald;
          status = 'KEEP (p > q)';
        } else if (i === 1 && r2 > 0.3) {
          col = COSMOS.rose;
          status = 'REJECT (0.8 > 0.5)';
        } else if (i === 2 && sk3 > 0.3) {
          col = COSMOS.rose;
          status = 'SKIPPED';
        } else if (i === 2 && ask3 > 0.3) {
          col = COSMOS.amber;
          status = 'TEST THIS?';
        }

        const pillOp = i === 2 && sk3 > 0.3 ? 0.45 : Math.max(0.2, sd);
        nodes.push(
          tokenPill(m.word, x, draftY, {
            w: 240,
            h: 88,
            color: col,
            glow: col === COSMOS.rose ? 5 : 10,
            topTag: `DRAFT #${i + 1}`,
            topColor: col,
            sub: status,
            subColor: col,
            subYOffset: 72,
            opacity: pillOp,
          }),
        );

        // Conditional target row card below
        if (sc > 0.08) {
          const rowCol =
            i === 2 && (dep > 0.3 || sk3 > 0.3)
              ? COSMOS.rose
              : i === 1 && near > 0.3
                ? COSMOS.violet
                : COSMOS.gold;
          const rowOp = sc * (i === 2 && sk3 > 0.3 ? 0.48 : 1);
          nodes.push(
            rect(410, 150, {
              fill: '#111626',
              stroke: rowCol,
              width: 2.4,
              radius: 14,
            })
              .at(x, rowY + 35)
              .opacity(rowOp),
            txt(m.prefix, x, rowY - 12, 26, rowCol, 'mono').opacity(rowOp),
            txt(
              `p=${m.p.toFixed(2)}  q=${m.q.toFixed(2)}  a=${m.alpha.toFixed(2)}`,
              x,
              rowY + 34,
              26,
              COSMOS.ink,
              'mono',
            ).opacity(rowOp),
            txt(
              i === 1 && near > 0.3
                ? `residual -> "${res.correction}"`
                : i === 2 && dep > 0.3
                  ? 'prefix "softly" gone'
                  : `draw u=${m.u.toFixed(2)}`,
              x,
              rowY + 78,
              26,
              i === 1 && near > 0.3 ? COSMOS.emerald : rowCol,
              'mono',
            ).opacity(rowOp),
          );
        }
      }

      // Parallel verification beam pulsing cleanly in the open corridor between draft & target rows
      if (sc > 0.02 && sc < 0.98) {
        const bx = -580 + sc * 1340;
        nodes.push(verifyBeam(bx, rowY - 82, rowY - 46, Math.sin(sc * Math.PI), COSMOS.gold));
      }

      // Glowing dependency arc showing today depends on softly (cleanly above DRAFT tags)
      if (dep > 0.1 || ask3 > 0.2) {
        nodes.push(
          glowingArc(colXs[1], draftY - 102, colXs[2], draftY - 102, -52, {
            color: sk3 > 0.3 ? COSMOS.rose : COSMOS.amber,
            width: 3.8,
            opacity: Math.max(dep, ask3),
            glow: 10,
          }),
        );
      }

      // Reader output line at bottom
      const outY = 275;
      const committedWords =
        near > 0.3
          ? ['The', 'bird', 'sang', res.correction]
          : a1 > 0.3
            ? ['The', 'bird', 'sang']
            : ['The', 'bird'];
      nodes.push(txt('READER LINE:', -835, outY, 28, COSMOS.muted, 'mono', 'left'));
      committedWords.forEach((w, idx) => {
        const isCorr = idx === 3;
        const isSang = idx === 2;
        const col = isCorr ? COSMOS.violet : isSang ? COSMOS.emerald : COSMOS.blue;
        nodes.push(
          tokenPill(w, -460 + idx * 255, outY, {
            w: 215,
            h: 74,
            color: col,
            wordSize: 30,
            glow: isCorr ? 14 : 8,
          }),
        );
      });

      nodes.push(
        txt(
          hist > 0.25
            ? 'Sync masks, positions, scoring rows, and KV cache to: "The bird sang nearby"'
            : near > 0.25
              ? 'Missing mass after "sang" is all on "nearby" (p=0.50, q=0.20)'
              : 'Each target output row scores the next token conditioned on its preceding input',
          0,
          415,
          28,
          hist > 0.25 ? COSMOS.emerald : COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(heroAura(80, 0, 520, '#ffd16618', '#5ce1e618'), cinemaRails(), title, view);

  onCue(s, c, 'conditional-prefixes', (d) => showDrafts.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'target-rows', (d) => scanTarget.to(1, { duration: d, ease: linear }), {
    desired: 1.2,
  });
  onCue(s, c, 'accept-first', (d) => acceptSang.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'reject-second', (d) => rejectSoftly.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'look-at-today', (d) => askToday.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'discard-suffix', (d) => skipToday.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'dependent-suffix', (d) => showDep.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'residual-correction', (d) => showNearby.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'corrected-prefix', (d) => showHistory.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 10: row-alignment ("Attach every distribution to its preceding input")
 * Phase 1: Causal shift u->p1(x1), x1->p2(x2), x2->p3(x3), x3->p4(bonus), trim x2/x3, pending corr.
 * Phase 2: Decimal KV cache ledger 1 -> 12 -> 123, rollback to 12, forward 4 -> 124!
 */
export function rowAlignment(s, c) {
  const phase1 = s.value(1);
  const phase2 = s.value(0);

  const showShift = s.value(0);
  const hlU = s.value(0);
  const hlX1 = s.value(0);
  const hlBonus = s.value(0);
  const keepPrefix = s.value(0);
  const trimSuffix = s.value(0);
  const showPending = s.value(0);
  const show124 = s.value(0);

  const states123 = prefixStates([1, 2, 3]); // [0, 1, 12, 123]
  const states124 = prefixStates([1, 2, 4]); // [0, 1, 12, 124]

  const title = heroTitle(['Causal row alignment', 'inputs predict what follows'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'LOGIT & KV CACHE ALIGNMENT',
  });

  // Phase 1: Causal rows u, x1, x2, x3 -> p1..p4
  const p1View = guardedDynamic(phase1, (a) => {
    const hU = hlU.value;
    const hX1 = hlX1.value;
    const hB = hlBonus.value;
    const kp = keepPrefix.value;
    const tr = trimSuffix.value;
    const pend = showPending.value;

    const nodes = [];
    const xs = [-690, -390, -90, 210, 510];
    const inY = -120;
    const outY = 125;

    // Cached prefix C + 4 inputs [u, x1, x2, x3]
    const inputs = [
      { label: 'C (cached)', col: COSMOS.blue, keep: true },
      { label: 'u (pending)', col: hU > 0.3 ? COSMOS.gold : COSMOS.cyan, keep: true },
      {
        label: 'x1',
        col: kp > 0.3 ? COSMOS.emerald : hX1 > 0.3 ? COSMOS.gold : COSMOS.cyan,
        keep: true,
      },
      { label: 'x2', col: tr > 0.3 ? COSMOS.rose : COSMOS.cyan, keep: false },
      { label: 'x3', col: tr > 0.3 ? COSMOS.rose : COSMOS.cyan, keep: false },
    ];

    inputs.forEach((item, idx) => {
      const x = xs[idx];
      const op = a * (!item.keep && tr > 0.3 ? 0.38 : 1);
      nodes.push(
        tokenPill(item.label, x, inY, {
          w: 225,
          h: 82,
          color: item.col,
          wordSize: 28,
          topTag: idx === 0 ? 'KV READY' : !item.keep && tr > 0.3 ? 'TRIMMED' : 'INPUT',
          topColor: item.col,
          opacity: op,
          glow: !item.keep && tr > 0.3 ? 4 : 10,
        }),
      );
    });

    // Causal output rows p1..p4 shifted diagonally (+1 column)
    const rows = [
      { label: 'p1 -> scores x1', fromIdx: 1, col: hU > 0.3 ? COSMOS.gold : COSMOS.blue },
      { label: 'p2 -> scores x2', fromIdx: 2, col: hX1 > 0.3 ? COSMOS.gold : COSMOS.blue },
      { label: 'p3 -> scores x3', fromIdx: 3, col: tr > 0.3 ? COSMOS.rose : COSMOS.blue },
      { label: 'p4 -> bonus', fromIdx: 4, col: hB > 0.3 ? COSMOS.violet : COSMOS.blue },
    ];

    rows.forEach((r, idx) => {
      const x = xs[r.fromIdx];
      const op = a * Math.max(0.2, showShift.value) * (idx >= 2 && tr > 0.3 ? 0.38 : 1);
      nodes.push(
        line([x, inY + 46], [x, outY - 46], { stroke: r.col, width: 3.0 })
          .glow(8, r.col)
          .opacity(op),
        tokenPill(r.label, x, outY, {
          w: 245,
          h: 76,
          color: r.col,
          wordSize: 26,
          opacity: op,
          glow: 8,
        }),
      );
    });

    // Pending correction pill at x2 slot
    if (pend > 0.05) {
      nodes.push(
        tokenPill('correction (KV pending)', xs[3] + 90, 290, {
          w: 440,
          h: 78,
          color: COSMOS.amber,
          wordColor: COSMOS.gold,
          wordSize: 28,
          dash: [8, 6],
          opacity: pend * a,
          glow: 12,
        }),
      );
    }

    nodes.push(
      txt(
        pend > 0.25
          ? 'Retain KV through C, u, x1; trim x2 & x3; correction KV stays pending'
          : 'A token’s output row predicts the token that follows it',
        0,
        415,
        29,
        pend > 0.25 ? COSMOS.amber : COSMOS.muted,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  // Phase 2: Decimal cache analogy (1 -> 12 -> 123, rollback to 12, process 4 -> 124)
  const p2View = guardedDynamic(phase2, (a) => {
    const s124 = show124.value;
    const nodes = [];

    // Top rejected path: 1 -> 12 -> 123
    const topY = -100;
    const botY = 145;
    const steps = [
      { tok: 'read 1', val: String(states123[1]), x: -580, col: COSMOS.emerald },
      { tok: 'read 2', val: String(states123[2]), x: -160, col: COSMOS.emerald },
      { tok: 'read 3 (rejected)', val: String(states123[3]), x: 320, col: COSMOS.rose },
    ];
    steps.forEach((st, i) => {
      nodes.push(
        tokenPill(`cache = ${st.val}`, st.x, topY, {
          w: 280,
          h: 92,
          color: st.col,
          wordSize: 32,
          topTag: st.tok,
          topColor: st.col,
          opacity: a * (i === 2 ? 0.55 : 1),
        }),
      );
      if (i < 2) {
        nodes.push(
          line([st.x + 145, topY], [steps[i + 1].x - 145, topY], {
            stroke: i === 1 ? COSMOS.rose : COSMOS.emerald,
            width: 3.4,
          }).opacity(a),
        );
      }
    });

    // Reusable state 12 -> process 4 -> 124
    nodes.push(
      line([25, botY], [210, botY], { stroke: COSMOS.gold, width: 4.0 })
        .glow(12, COSMOS.gold)
        .opacity(a),
      tokenPill('reusable cache = 12', -160, botY, {
        w: 360,
        h: 88,
        color: COSMOS.emerald,
        wordSize: 30,
        sub: 'READER HAS 1, 2, 4',
        subColor: COSMOS.amber,
        opacity: a,
      }),
    );

    if (s124 > 0.05) {
      nodes.push(
        tokenPill(`cache = ${states124[3]}`, 380, botY, {
          w: 320,
          h: 92,
          color: COSMOS.gold,
          wordColor: COSMOS.gold,
          wordSize: 36,
          topTag: 'PROCESS CORRECTION 4',
          topColor: COSMOS.gold,
          opacity: s124 * a,
          glow: 14,
        }),
      );
    }

    nodes.push(
      txt(
        s124 > 0.25
          ? 'Rollback 123 -> 12, then forward correction 4 to compute clean state 124'
          : 'Each processed token appends its digit to the cached state',
        0,
        415,
        29,
        COSMOS.emerald,
        'sans',
      ).opacity(a),
    );

    return group(...nodes);
  });

  s.add(heroAura(0, 20, 520, '#5ce1e61a', '#ffd16614'), cinemaRails(), title, p1View, p2View);

  onCue(s, c, 'sd-row-alignment-b0', (d) => showShift.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-row-u', (d) => hlU.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-row-x1', (d) => hlX1.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-row-bonus', (d) => hlBonus.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-row-alignment-b1', (d) => keepPrefix.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-row-trim', (d) => trimSuffix.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-row-pending', (d) => showPending.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-row-alignment-b2', (d) => crossPhase(phase1, phase2, d), { desired: 0.48 });
  onCue(s, c, 'sd-row-124', (d) => show124.to(1, { duration: d }), { desired: 0.6 });
}
