// Act 4 (Scenes 18-23): Autoregressive Generation & Exposure Bias, Greedy Branching Trap,
// KV Cache Lifecycle & Replay, Causal Cache Parity & Upper-Left Mask Bug,
// Compute Work & Memory Bandwidth, and 3D KV Cache Memory Budget.
import { arrow, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  CACHE_PARITY_FIXTURE,
  COSMOS,
  ROLE,
  WORK_3_3,
  cinemaGrid,
  cinematic3d,
  clamp01,
  conditionalDistribution,
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
  line3d,
  livingDrift,
  mix,
  neonCurve,
  orbitScene,
  rawKvBytes,
  rule,
  scaleTrack,
  surface,
  tokenChip,
  txt,
  voiceSpan,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 18. generation: Autoregressive Rollout & Exposure Bias
// Cues: generation-sample, generation-append, generation-next, generation-stop
// ---------------------------------------------------------------------------
export function generation(s, c) {
  const sampP = s.value(0);
  const appP = s.value(0);
  const nextP = s.value(0);
  const stopP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.alt, seed: 18 }));
  s.add(decorAura(-300, 0, 480, '#6ee7b71a', '#07091000'));
  s.add(decorAura(340, 20, 480, '#ffd16618', '#07091000'));

  const headline = heroTitle(['Autoregressive', 'Self-Feeding Loop'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.alt,
    eyebrow: 'EXPOSURE BIAS  ·  SAMPLED ROLLOUT vs RECORDED TRAINING',
  });

  const row1 = conditionalDistribution('The cat');
  const row2 = conditionalDistribution('The cat slept');

  const visual = dynamic(() => {
    const sp = sampP.value;
    const ap = appP.value;
    const nx = nextP.value;
    const st = stopP.value;
    const nodes = [];

    // Top-right growing generated sequence
    const seqY = -360;
    nodes.push(
      txt('GENERATED PREFIX', 75, seqY - 62, 26, COSMOS.muted, 'mono', 'left'),
      tokenChip('The', 145, seqY, ROLE.prefix, { w: 120, h: 56, size: 28 }),
      tokenChip('cat', 282, seqY, ROLE.prefix, { w: 120, h: 56, size: 28 }),
    );
    if (ap > 0.05) {
      nodes.push(
        tokenChip('slept', 435, seqY, ROLE.alt, {
          w: 152,
          h: 56,
          size: 28,
          glow: 11 * ap,
          opacity: clamp01(ap * 1.4),
        }),
      );
    }
    if (st > 0.05) {
      nodes.push(
        tokenChip('end', 602, seqY, ROLE.target, {
          w: 128,
          h: 56,
          size: 28,
          glow: 11,
          opacity: st,
        }),
      );
    }

    // Step 1 interval sampling bar for "The cat" (u = 0.75 lands in slept [0.60, 0.90))
    const sx = -760;
    const sw = 1520;
    const y1 = -115;
    const wSat = sw * row1[0].probability;
    const wSlept = sw * row1[1].probability;
    const wAte = sw * row1[2].probability;
    const needle1X = sx + sw * mix(0.05, 0.75, sp);

    nodes.push(
      txt('DRAW 1:  P(next | The cat)   u = 0.75', sx, y1 - 88, 26, ROLE.prefix, 'mono', 'left'),
      scaleTrack(sx, y1, sw, 74, { radius: 12 }),
      glowBar(sx, y1, wSat, 68, ROLE.prob, { glow: 7, radius: 10, opacity: mix(0.85, 0.45, sp) }),
      glowBar(sx + wSat + 4, y1, wSlept - 4, 68, ROLE.alt, {
        glow: 12 * mix(0.4, 1, sp),
        radius: 10,
      }),
      glowBar(sx + wSat + wSlept + 8, y1, wAte - 8, 68, ROLE.rare, {
        glow: 6,
        radius: 8,
        opacity: 0.65,
      }),
      txt('sat  [0.0, 0.6)', sx + wSat / 2, y1, 30, '#070910', 'mono'),
      txt('slept  [0.6, 0.9)', sx + wSat + wSlept / 2, y1, 28, '#070910', 'mono'),
      txt('ate', sx + wSat + wSlept + wAte / 2, y1, 26, '#070910', 'mono'),
    );
    if (sp > 0.05) {
      nodes.push(
        line([needle1X, y1 - 56], [needle1X, y1 - 38], { stroke: ROLE.target, width: 4.5 }).glow(
          10,
          ROLE.target,
        ),
        glowDot(needle1X, y1 - 38, { radius: 7, color: ROLE.target, glow: 10 }),
        line([needle1X, y1 + 38], [needle1X, y1 + 56], { stroke: ROLE.target, width: 4.5 }).glow(
          10,
          ROLE.target,
        ),
        txt('u = 0.75 -> slept', needle1X, y1 + 82, 26, ROLE.target, 'mono'),
      );
    }

    // Step 2 distribution after "The cat slept" (on 0.90, end 0.10; u = 0.95 lands in end)
    const y2 = 135;
    const wOn = sw * row2[0].probability;
    const wEnd = sw * row2[1].probability;
    const needle2X = sx + sw * mix(0.15, 0.95, st);

    nodes.push(
      txt(
        nx > 0.25
          ? 'DRAW 2:  P(next | The cat slept)   NEW CONTEXT!'
          : 'DRAW 2:  WAITING FOR APPENDED TOKEN',
        sx,
        y2 - 88,
        26,
        nx > 0.25 ? ROLE.alt : COSMOS.dim,
        'mono',
        'left',
      ),
      scaleTrack(sx, y2, sw, 74, { stroke: nx > 0.25 ? ROLE.alt : '#2a385c', radius: 12 }),
    );
    if (nx > 0.05) {
      nodes.push(
        glowBar(sx, y2, wOn, 68, ROLE.prefix, { glow: 8, radius: 10, opacity: nx }),
        glowBar(sx + wOn + 4, y2, wEnd - 4, 68, ROLE.target, {
          glow: 11,
          radius: 10,
          opacity: nx,
        }),
        txt('on  [0.0, 0.9)', sx + wOn / 2, y2, 32, '#070910', 'mono').opacity(nx),
        txt('end', sx + wOn + wEnd / 2, y2, 26, '#070910', 'mono').opacity(nx),
      );
    } else {
      nodes.push(
        txt(
          'Appending "slept" changes the next row entirely from training\'s "sat"...',
          0,
          y2,
          28,
          COSMOS.muted,
          'serif',
        ),
      );
    }
    if (st > 0.05) {
      nodes.push(
        line([needle2X, y2 - 56], [needle2X, y2 - 38], { stroke: ROLE.target, width: 4.5 }).glow(
          10,
          ROLE.target,
        ),
        glowDot(needle2X, y2 - 38, { radius: 7, color: ROLE.target, glow: 10 }),
        line([needle2X, y2 + 38], [needle2X, y2 + 56], { stroke: ROLE.target, width: 4.5 }).glow(
          10,
          ROLE.target,
        ),
        txt('u = 0.95 -> STOP!', needle2X - 45, y2 + 82, 26, ROLE.target, 'mono', 'right'),
      );
    }

    nodes.push(
      txt(
        st > 0.45
          ? 'Training saw "The cat sat"; rollout produced "The cat slept" -> evaluate rollouts too'
          : 'Sampling follows a real continuation and feeds its own output back as the next prefix',
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
  cueTo(s, c, 'generation-sample', sampP, 1, { dur: 0.7 });
  cueTo(s, c, 'generation-append', appP, 1, { dur: 0.7 });
  cueTo(s, c, 'generation-next', nextP, 1, { dur: 0.7 });
  cueTo(s, c, 'generation-stop', stopP, 1, { dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 19. greedy-branch: Locally Greedy Picks Can Miss Higher-Probability Paths
// Cues: greedy-split-a, greedy-split-b, greedy-pick, greedy-compare*
// ---------------------------------------------------------------------------
export function greedyBranch(s, c) {
  const spA = s.value(0);
  const spB = s.value(0);
  const pickP = s.value(0);
  const cmpP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warm, seed: 19 }));
  s.add(decorAura(-320, 0, 480, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(340, 20, 480, '#6ee7b71c', '#07091000'));

  const headline = heroTitle(['Why Greedy', 'Misses the Best Path'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warm,
    eyebrow: 'LOCAL GREEDY PICK  vs  FULL 2-TOKEN PATH',
  });

  const visual = dynamic(() => {
    const sa = spA.value;
    const sb = spB.value;
    const pk = pickP.value;
    const cm = cmpP.value;
    const nodes = [];

    // Row 1: Step 1 split (A = 60%, B = 40%)
    const sx = -760;
    const sw = 1520;
    const y1 = -160;
    const wA = sw * 0.6;
    const wB = sw * 0.4;

    nodes.push(
      txt(
        'STEP 1:  GREEDY PICKS WIDEST FIRST TOKEN (A = 60%)',
        sx,
        y1 - 74,
        26,
        ROLE.prefix,
        'mono',
        'left',
      ),
      scaleTrack(sx, y1, sw, 72, { radius: 12 }),
      glowBar(sx, y1, wA, 66, ROLE.prob, { glow: 9, radius: 10 }),
      glowBar(sx + wA + 4, y1, wB - 4, 66, ROLE.alt, { glow: 9, radius: 10 }),
      txt('A   60%  (greedy choice)', sx + wA / 2, y1, 30, '#070910', 'mono'),
      txt('B   40%', sx + wA + wB / 2, y1, 30, '#070910', 'mono'),
    );

    // Row 2: Step 2 continuations inside A (10 tiny slices) and inside B (1 huge 9/10 slice)
    const y2 = 45;
    nodes.push(
      txt(
        'STEP 2:  A SPLITS 10 WAYS (1/10 EA)  |  B CONCENTRATES (9/10)',
        sx,
        y2 - 74,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      scaleTrack(sx, y2, wA, 72, { stroke: ROLE.prob, radius: 10 }),
      scaleTrack(sx + wA + 4, y2, wB - 4, 72, { stroke: ROLE.alt, radius: 10 }),
    );

    // 10 equal slices inside A
    const sliceW = wA / 10;
    for (let k = 0; k < 10; k++) {
      const col = k === 0 && pk > 0.3 ? ROLE.danger : ROLE.prob;
      nodes.push(
        glowBar(sx + k * sliceW + 2, y2, Math.max(4, sliceW - 5), 64, col, {
          glow: k === 0 && pk > 0.3 ? 12 : 4,
          radius: 5,
          opacity: mix(0.4, k === 0 && pk > 0.3 ? 1 : 0.72, sa),
        }),
      );
    }

    // 9/10 + 1/10 inside B
    const wB9 = (wB - 4) * 0.9;
    const wB1 = (wB - 4) * 0.1;
    nodes.push(
      glowBar(sx + wA + 6, y2, Math.max(8, wB9 * mix(0.4, 1, sb)), 64, ROLE.alt, {
        glow: pk > 0.3 ? 14 : 8,
        radius: 9,
      }),
      glowBar(sx + wA + 6 + wB9 + 4, y2, Math.max(6, (wB1 - 4) * mix(0.4, 1, sb)), 64, COSMOS.dim, {
        glow: 0,
        radius: 6,
      }),
    );
    if (sb > 0.45) {
      nodes.push(txt('9/10 of B', sx + wA + 6 + wB9 / 2, y2, 30, '#070910', 'mono'));
    }

    // Row 3: Direct comparison of one slice from A (6%) vs one slice from B (36%)
    // Strictly withhold 6% vs 36% comparison until greedy-compare completes!
    const y3 = 225;
    const preCmp = fadeOut(cm);
    if (preCmp > 0.02) {
      nodes.push(
        group(
          txt(
            'PREDICTION: WHICH 2-TOKEN PATH CARRIES MORE PROBABILITY?',
            0,
            y3 - 10,
            32,
            ROLE.target,
            'serif',
          ),
          txt(
            'One slice of A  (0.60 × 0.10)   vs   Top slice of B  (0.40 × 0.90)',
            0,
            y3 + 46,
            28,
            COSMOS.muted,
            'mono',
          ),
        ).opacity(preCmp),
      );
    }

    const postCmp = fadeIn(cm);
    if (postCmp > 0.02) {
      const compX = -520;
      const compScale = 1600;
      nodes.push(
        group(
          txt('PATH A (GREEDY):', compX - 24, y3 - 26, 28, ROLE.danger, 'mono', 'right'),
          glowBar(compX, y3 - 26, compScale * 0.06, 36, ROLE.danger, { glow: 10, radius: 8 }),
          txt(
            '0.60 × 0.10 = 6%',
            compX + compScale * 0.06 + 24,
            y3 - 26,
            30,
            ROLE.danger,
            'mono',
            'left',
          ),

          txt('PATH B (6× WIDER):', compX - 24, y3 + 34, 28, ROLE.alt, 'mono', 'right'),
          glowBar(compX, y3 + 34, compScale * 0.36, 36, ROLE.alt, { glow: 13, radius: 8 }),
          txt(
            '0.40 × 0.90 = 36%',
            compX + compScale * 0.36 + 24,
            y3 + 34,
            34,
            ROLE.alt,
            'mono',
            'left',
          ).glow(10, ROLE.alt),
        ).opacity(postCmp),
      );
    }

    nodes.push(
      txt(
        cm > 0.5
          ? 'Greedy commits to A before seeing step 2; close ties can still flip across hardware kernels'
          : 'Compare the width of one branch inside A against the single dominant branch inside B',
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
  cueTo(s, c, 'greedy-split-a', spA, 1, { dur: 0.75 });
  cueTo(s, c, 'greedy-split-b', spB, 1, { dur: 0.75 });
  cueTo(s, c, 'greedy-pick', pickP, 1, { dur: 0.6 });
  cueTo(s, c, 'greedy-compare', cmpP, 1, { after: true, dur: 0.7 });
}

// ---------------------------------------------------------------------------
// 20. cache-lifecycle: Prefill, Decode Append, Stop, and Cache Drop + Replay
// Beat 0: Prefill caches The, cat (2 slots); samples & delivers slept (cache STILL has 2)
// Beat 1: Feed slept back (cache -> 3 slots); sample end & stop (2 outputs, 3 cached)
// Beat 2: Drop resident cache -> replay The, cat, slept without duplicating output
// ---------------------------------------------------------------------------
export function cacheLifecycle(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const consumeP = s.value(0);
  const endResP = s.value(0);
  const b2P = s.value(0);
  const b2Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.prefix, seed: 20 }));
  s.add(decorAura(-280, 0, 480, '#5ce1e61c', '#07091000'));
  s.add(decorAura(380, 0, 460, '#ffd16618', '#07091000'));

  const headline = heroTitle(['KV Cache Lifecycle:', 'Prefill, Append, Replay'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefix,
    eyebrow: '3 SYNCHRONIZED LANES:  KV CACHE  ·  ACCEPTED OUTPUT  ·  DELIVERED',
  });

  const visual = dynamic(() => {
    const s0 = b0Step.value;
    const isB1 = b1P.value > 0.5;
    const cn = consumeP.value;
    const er = endResP.value;
    const isB2 = b2P.value > 0.5;
    const s2 = b2Step.value;
    const nodes = [];

    // Compute exact token state across the 3 lanes
    const cachedCount = isB2 ? (s2 >= 0.9 ? 3 : 0) : isB1 ? (cn > 0.35 ? 3 : 2) : s0 >= 0.8 ? 2 : 0;
    const cacheDropped = isB2 && s2 < 0.9;
    const replaying = isB2 && s2 >= 0.5 && s2 < 1.2;
    const acceptedCount = isB1 || isB2 ? (er > 0.35 || isB2 ? 2 : 1) : s0 >= 1.8 ? 1 : 0;
    const deliveredCount = s0 >= 2.6 || isB1 || isB2 ? 1 : 0;

    const x0 = -360;
    const stepX = 250;
    const yCache = -135;
    const yAcc = 55;
    const yDel = 215;

    // Lane 1: Resident KV Cache (processed positions)
    nodes.push(
      txt(
        'RESIDENT KV CACHE',
        -845,
        yCache - 16,
        28,
        cacheDropped ? ROLE.danger : ROLE.prefix,
        'mono',
        'left',
      ),
      txt(
        cacheDropped ? 'DROPPED (0/3)' : `${cachedCount} processed pos`,
        -845,
        yCache + 24,
        26,
        cacheDropped ? ROLE.danger : COSMOS.muted,
        'mono',
        'left',
      ),
    );
    const cacheWords = ['The', 'cat', 'slept'];
    for (let i = 0; i < 3; i++) {
      const cx = x0 + i * stepX;
      const filled = i < cachedCount;
      const col = cacheDropped
        ? ROLE.danger
        : replaying
          ? ROLE.warm
          : filled
            ? i === 2
              ? ROLE.alt
              : ROLE.prefix
            : COSMOS.dim;
      nodes.push(
        tokenChip(filled ? `KV[${cacheWords[i]}]` : `slot ${i}`, cx, yCache, col, {
          w: 210,
          h: 72,
          size: 28,
          glow: filled ? 10 : 0,
          dash: filled ? null : [8, 6],
          opacity: filled ? 1 : 0.55,
        }),
      );
    }

    // Lane 2: Accepted Output Tokens
    nodes.push(
      txt('ACCEPTED OUTPUT', -845, yAcc - 16, 28, ROLE.target, 'mono', 'left'),
      txt(
        `${acceptedCount} token${acceptedCount === 1 ? '' : 's'}`,
        -845,
        yAcc + 24,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    );
    const accWords = ['slept', 'end'];
    for (let i = 0; i < 2; i++) {
      const cx = x0 + (i + 2) * stepX;
      const filled = i < acceptedCount;
      const col = i === 0 ? ROLE.alt : ROLE.target;
      nodes.push(
        tokenChip(filled ? accWords[i] : 'waiting', cx, yAcc, filled ? col : COSMOS.dim, {
          w: 210,
          h: 68,
          size: 28,
          glow: filled ? 10 : 0,
          dash: filled ? null : [8, 6],
          opacity: filled ? 1 : 0.45,
        }),
      );
    }
    // Feedback arrow from accepted "slept" up into KV[slept]
    if (isB1 && cn > 0.1 && !isB2) {
      nodes.push(
        arrow([x0 + 2 * stepX, yAcc - 40], [x0 + 2 * stepX, yCache + 42], {
          stroke: ROLE.alt,
          width: 4,
        }).opacity(cn),
        txt(
          'feed back',
          x0 + 2 * stepX + 125,
          (yAcc + yCache) / 2,
          26,
          ROLE.alt,
          'mono',
          'left',
        ).opacity(cn),
      );
    }

    // Lane 3: Delivered to Reader (never duplicated on replay!)
    nodes.push(
      txt('DELIVERED STREAM', -845, yDel - 16, 28, ROLE.prob, 'mono', 'left'),
      txt(
        isB2 ? 'UNCHANGED ON REPLAY' : 'sent to user',
        -845,
        yDel + 24,
        26,
        isB2 ? ROLE.alt : COSMOS.muted,
        'mono',
        'left',
      ),
      tokenChip(
        deliveredCount > 0 ? 'The cat slept' : 'The cat ...',
        x0 + 1 * stepX,
        yDel,
        deliveredCount > 0 ? ROLE.prob : COSMOS.dim,
        { w: 460, h: 66, size: 30, glow: deliveredCount > 0 ? 9 : 0 },
      ),
    );

    // Status caption at bottom (stable across beats -> zero text_brief flashes)
    nodes.push(
      txt(
        'Track Resident KV Cache (processed inputs), Accepted Output, and Delivered Stream separately',
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
  // Beat 0
  cueTo(s, c, 'cache-lifecycle-b1', b0Step, 0.3, { dur: 0.4 });
  voiceSpan(s, c, 'cache-lifecycle-voice-1', vPhase, 1);
  cueTo(s, c, 'cache-lifecycle-step-0-1', b0Step, 1, { dur: 0.5 });
  cueTo(s, c, 'cache-lifecycle-step-0-2', b0Step, 2, { dur: 0.5 });
  cueTo(s, c, 'cache-lifecycle-step-0-3', b0Step, 3, { dur: 0.45 });
  cueTo(s, c, 'cache-lifecycle-step-0-4', b0Step, 4, { dur: 0.45 });

  // Beat 1
  cueTo(s, c, 'cache-lifecycle-b2', b1P, 1, { dur: 0.4 });
  voiceSpan(s, c, 'cache-lifecycle-voice-2', vPhase, 2);
  cueTo(s, c, 'cache-consume', consumeP, 1, { dur: 0.65 });
  cueTo(s, c, 'cache-lifecycle-step-1-1', b1Step, 1, { dur: 0.4 });
  cueTo(s, c, 'cache-lifecycle-step-1-2', b1Step, 2, { dur: 0.4 });
  cueTo(s, c, 'cache-lifecycle-step-1-3', b1Step, 3, { dur: 0.4 });
  cueTo(s, c, 'cache-lifecycle-step-1-4', b1Step, 4, { dur: 0.4 });
  cueTo(s, c, 'cache-lifecycle-step-1-5', b1Step, 5, { dur: 0.4 });
  cueTo(s, c, 'cache-end-result', endResP, 1, { after: true, dur: 0.55 });

  // Beat 2
  cueTo(s, c, 'cache-lifecycle-b3', b2P, 1, { dur: 0.45 });
  voiceSpan(s, c, 'cache-lifecycle-voice-3', vPhase, 3);
  cueTo(s, c, 'cache-lifecycle-step-2-1', b2Step, 1, { dur: 0.9 });
  cueTo(s, c, 'cache-lifecycle-step-2-2', b2Step, 2, { dur: 0.45 });
  cueTo(s, c, 'cache-lifecycle-step-2-3', b2Step, 3, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 21. cached-parity: Causal Invariance & Upper-Left Mask Alignment Bug
// Beat 0: Prefill 3 + decode 4,5 matches full causal pass (CACHE_PARITY_FIXTURE)
// Beat 1: 1-row decode query at pos 5: upper-left mask hides keys 1..4 vs explicit all-allowed row
// ---------------------------------------------------------------------------
export function cachedParity(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.alt, seed: 21 }));
  s.add(decorAura(-320, 20, 480, '#6ee7b71a', '#07091000'));
  s.add(decorAura(340, 20, 480, '#ff6b8b18', '#07091000'));

  const headline = heroTitle(['Cached Parity &', 'Decode Mask Alignment'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.alt,
    eyebrow: 'CAUSAL INVARIANCE  ·  FULL PASS vs PREFILL(3) + DECODE(4,5)',
  });

  // View 0: Full 5-pos causal output vs Cached 3+1+1 output (4-dim vectors from fixture)
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const st = b0Step.value;
      const full5 = CACHE_PARITY_FIXTURE.full[4];
      const cached5 = CACHE_PARITY_FIXTURE.cached[4];
      const nodes = [];

      // Left: 5-step causal timeline (Prefill 0,1,2 -> Append 3 -> Append 4)
      const lx = -760;
      nodes.push(txt('PREFIX INVARIANCE (EVAL MODE)', lx, -210, 26, ROLE.prefix, 'mono', 'left'));
      const steps = [
        { lbl: 'Prefill 0..2', len: 3, col: ROLE.prefix },
        { lbl: 'Decode pos 3', len: 4, col: ROLE.prob },
        { lbl: 'Decode pos 4', len: 5, col: ROLE.alt },
      ];
      steps.forEach((row, rIdx) => {
        const y = -115 + rIdx * 105;
        nodes.push(txt(row.lbl, lx, y - 42, 26, row.col, 'mono', 'left'));
        for (let k = 0; k < row.len; k++) {
          const isNew = rIdx === 0 || k === row.len - 1;
          nodes.push(
            tokenChip(`K${k}`, lx + 56 + k * 124, y + 6, isNew ? row.col : ROLE.prefix, {
              w: 108,
              h: 52,
              size: 26,
              glow: isNew ? 10 : 3,
              opacity: st >= 2.2 || rIdx === 0 ? 1 : 0.45,
            }),
          );
        }
      });

      // Right: Side-by-side 4-coordinate vector comparison (full vs cached)
      const rx = 120;
      const zeroX = 395;
      const scale = 180;
      nodes.push(
        txt('POS 4 OUTPUT:  FULL vs CACHED', rx, -210, 26, ROLE.alt, 'mono', 'left'),
        line([zeroX, -165], [zeroX, 200], { stroke: '#4d6496', width: 2.2 }),
      );
      for (let d = 0; d < 4; d++) {
        const y = -115 + d * 88;
        const fv = full5[d];
        const cv = cached5[d];
        const fw = Math.abs(fv) * scale;
        const cw = Math.abs(cv) * scale;
        nodes.push(
          txt(`d${d}`, rx, y, 26, COSMOS.muted, 'mono', 'left'),
          glowBar(fv >= 0 ? zeroX : zeroX - fw, y - 12, Math.max(4, fw), 16, ROLE.prefix, {
            glow: 6,
            radius: 4,
          }),
          glowBar(cv >= 0 ? zeroX : zeroX - cw, y + 12, Math.max(4, cw), 16, ROLE.alt, {
            glow: 8,
            radius: 4,
          }),
          txt(fv.toFixed(3), 655, y, 26, ROLE.alt, 'mono', 'left'),
        );
      }
      nodes.push(
        txt(
          st >= 3.5
            ? 'max |full - cached| < 1e-6  (EXACT MATCH)'
            : 'Future tokens cannot alter earlier K, V states',
          rx,
          245,
          26,
          ROLE.alt,
          'mono',
          'left',
        ),
        txt(
          'Fixed weights + causal mask guarantee mathematically identical earlier Keys and Values',
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

  // View 1: 1-row decode query at pos 4: upper-left mask bug vs explicit all-allowed Boolean row
  const view1 = guardedDynamic(
    () => fadeIn(b1P.value),
    (vis) => {
      const st = b1Step.value;
      const fixed = st >= 2.6;
      const x0 = -480;
      const step = 215;
      const yMask = -115;
      const nodes = [];

      nodes.push(
        txt(
          fixed
            ? 'EXPLICIT BOOLEAN ROW:  [True, True, True, True, True]  (ALL 5 KEYS ALLOWED)'
            : 'UPPER-LEFT NONSQUARE CAUSAL MASK BUG:  [True, False, False, False, False]',
          0,
          -225,
          28,
          fixed ? ROLE.alt : ROLE.danger,
          'mono',
        ),
        txt('QUERY q4', -820, yMask, 28, ROLE.target, 'mono', 'left'),
      );

      for (let k = 0; k < 5; k++) {
        const cx = x0 + k * step;
        const allowed = fixed || k === 0;
        const col = allowed ? ROLE.alt : ROLE.danger;
        nodes.push(
          txt(`K${k}`, cx, yMask - 62, 26, COSMOS.muted, 'mono'),
          tokenChip(allowed ? 'ALLOW' : 'BLOCK', cx, yMask, col, {
            w: 158,
            h: 70,
            size: 26,
            glow: allowed ? 9 : 7,
            dash: allowed ? null : [8, 6],
          }),
        );
      }

      // Output vector comparison: wrongUpperLeftOutput vs allowedOutput
      const wrongV = CACHE_PARITY_FIXTURE.wrongUpperLeftOutput;
      const goodV = CACHE_PARITY_FIXTURE.allowedOutput;
      const yOut = 105;
      nodes.push(
        txt('WRONG UPPER-LEFT OUTPUT:', -810, yOut - 34, 26, ROLE.danger, 'mono', 'left'),
        txt(
          `[${wrongV.map((v) => v.toFixed(3)).join(', ')}]`,
          -340,
          yOut - 34,
          28,
          ROLE.danger,
          'mono',
          'left',
        ),
        txt('ALL-ALLOWED DECODE OUTPUT:', -810, yOut + 36, 26, ROLE.alt, 'mono', 'left'),
        txt(
          `[${goodV.map((v) => v.toFixed(3)).join(', ')}]`,
          -340,
          yOut + 36,
          28,
          ROLE.alt,
          'mono',
          'left',
        ).glow(fixed ? 8 : 0, ROLE.alt),
        txt(
          st >= 4.2
            ? 'Every layer keeps its own cache; position IDs & RoPE rotations must continue cleanly'
            : 'A 1-row decode query sits at the end of key history, never at column 0',
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
  cueTo(s, c, 'cached-parity-b1', b0Step, 0.3, { dur: 0.4 });
  voiceSpan(s, c, 'cached-parity-voice-1', vPhase, 1);
  cueTo(s, c, 'cached-parity-step-0-1', b0Step, 1, { dur: 0.45 });
  cueTo(s, c, 'cached-parity-step-0-2', b0Step, 2, { dur: 0.45 });
  cueTo(s, c, 'cached-parity-step-0-3', b0Step, 3, { dur: 0.5 });
  cueTo(s, c, 'cached-parity-step-0-4', b0Step, 4, { dur: 0.5 });

  cueTo(s, c, 'cached-parity-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'cached-parity-voice-2', vPhase, 2);
  cueTo(s, c, 'cached-parity-step-1-1', b1Step, 1, { dur: 0.45 });
  cueTo(s, c, 'cached-parity-step-1-2', b1Step, 2, { dur: 0.5 });
  cueTo(s, c, 'cached-parity-step-1-3', b1Step, 3, { dur: 0.5 });
  cueTo(s, c, 'cached-parity-step-1-4', b1Step, 4, { dur: 0.45 });
  cueTo(s, c, 'cached-parity-step-1-5', b1Step, 5, { dur: 0.45 });
  cueTo(s, c, 'cached-parity-step-1-6', b1Step, 6, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 22. work-and-bandwidth: Uncached vs Cached Work & Prefill vs Decode Bandwidth
// Beat 0: Prompt 3 + 3 gen -> Uncached (12 pos, 50 cells) vs Cached (5 pos, 18 cells)
// Beat 1: Growth curves O(m^2)/O(m^3) uncached vs O(m)/O(m^2) cached
// Beat 2: Arithmetic intensity (Prefill reuse vs Batch-1 decode ~1 op/weight byte)
// ---------------------------------------------------------------------------
export function workAndBandwidth(s, c) {
  const b0Step = s.value(0);
  const b1P = s.value(0);
  const b1Step = s.value(0);
  const b2P = s.value(0);
  const b2Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.warm, seed: 22 }));
  s.add(decorAura(-320, 0, 480, '#ff6b8b1a', '#07091000'));
  s.add(decorAura(340, 0, 480, '#6ee7b71a', '#07091000'));

  const headline = heroTitle(['Count Work Before', 'Calling It Speed'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.warm,
    eyebrow: 'UNCACHED vs CACHED OPERATIONS  ·  MEMORY BANDWIDTH REGIME',
  });

  // View 0: 3+4+5=12 pos (50 cells) vs 3+1+1=5 pos (18 cells)
  const view0 = guardedDynamic(
    () => fadeOut(b1P.value),
    (vis) => {
      const st = b0Step.value;
      const cacheVis = mix(0.45, 1, clamp01(st - 3.2));
      const nodes = [];

      // Left: Uncached recompute squares (3x3, 4x4, 5x5 -> 50 cells; 3+4+5=12 pos)
      nodes.push(
        txt('UNCACHED RECOMPUTE  (P=3, GEN=3)', -835, -210, 26, ROLE.danger, 'mono', 'left'),
      );
      const drawSq = (cx, cy, n, cell, col) => {
        const w = n * cell;
        for (let r = 0; r < n; r++) {
          for (let k = 0; k < n; k++) {
            nodes.push(
              rect(cell - 3, cell - 3, {
                fill: k <= r ? `${col}77` : `${col}22`,
                stroke: col,
                width: 1.2,
                radius: 3,
              }).at(cx - w / 2 + (k + 0.5) * cell, cy - w / 2 + (r + 0.5) * cell),
            );
          }
        }
      };
      drawSq(-740, -55, 3, 28, ROLE.danger);
      drawSq(-545, -40, 4, 28, ROLE.danger);
      drawSq(-305, -26, 5, 28, ROLE.danger);
      nodes.push(
        txt('3²=9', -740, 88, 26, ROLE.danger, 'mono'),
        txt('4²=16', -545, 88, 26, ROLE.danger, 'mono'),
        txt('5²=25', -305, 88, 26, ROLE.danger, 'mono'),
        txt(
          `Positions: 3+4+5 = ${WORK_3_3.uncachedPositions}`,
          -835,
          170,
          30,
          ROLE.danger,
          'mono',
          'left',
        ),
        txt(
          `Dense cells: 9+16+25 = ${WORK_3_3.uncachedCells}`,
          -835,
          224,
          30,
          ROLE.danger,
          'mono',
          'left',
        ),
      );

      nodes.push(rule(0, -210, 0, 250, '#2a3759', 2));

      // Right: Cached incremental (3x3 + 1x4 + 1x5 = 18 cells; 3+1+1 = 5 pos)
      nodes.push(
        txt(
          'WITH KV CACHE  (PREFILL + 1-ROW DECODE)',
          85,
          -210,
          26,
          ROLE.alt,
          'mono',
          'left',
        ).opacity(cacheVis),
      );
      drawSq(165, -55, 3, 28, ROLE.alt);
      // 1x4 and 1x5 decode rows
      for (let k = 0; k < 4; k++) {
        nodes.push(
          rect(25, 25, { fill: `${ROLE.alt}99`, stroke: ROLE.alt, width: 1.4, radius: 4 })
            .at(330 + k * 28, -55)
            .opacity(cacheVis),
        );
      }
      for (let k = 0; k < 5; k++) {
        nodes.push(
          rect(25, 25, { fill: `${ROLE.alt}99`, stroke: ROLE.alt, width: 1.4, radius: 4 })
            .at(525 + k * 28, -55)
            .opacity(cacheVis),
        );
      }
      nodes.push(
        txt('3²=9', 165, 88, 26, ROLE.alt, 'mono').opacity(cacheVis),
        txt('1×4=4', 372, 88, 26, ROLE.alt, 'mono').opacity(cacheVis),
        txt('1×5=5', 581, 88, 26, ROLE.alt, 'mono').opacity(cacheVis),
        txt(
          `Positions: 3+1+1 = ${WORK_3_3.cachedPositions}`,
          85,
          170,
          30,
          ROLE.alt,
          'mono',
          'left',
        ).opacity(cacheVis),
        txt(
          `Score cells: 9+4+5 = ${WORK_3_3.cachedCells}`,
          85,
          224,
          30,
          ROLE.alt,
          'mono',
          'left',
        ).opacity(cacheVis),
        txt(
          'Caching cuts this 3-token rollout from 12 -> 5 projections and 50 -> 18 attention cells',
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

  // View 1: Asymptotic scaling curves O(m^3) vs O(m^2) vs O(m)
  const view1 = guardedDynamic(
    () => Math.min(fadeIn(b1P.value), fadeOut(b2P.value)),
    (vis) => {
      const x0 = -740;
      const x1 = 160;
      const yBot = 240;
      const yTop = -175;
      const ptsCubic = [];
      const ptsQuad = [];
      const ptsLin = [];
      for (let k = 0; k <= 36; k++) {
        const t = k / 36;
        const x = mix(x0, x1, t);
        ptsCubic.push([x, mix(yBot, yTop, t ** 3)]);
        ptsQuad.push([x, mix(yBot, yTop, 0.58 * t ** 2)]);
        ptsLin.push([x, mix(yBot, yTop, 0.24 * t)]);
      }
      const nodes = [
        txt('CUMULATIVE WORK vs GENERATED TOKENS m', x0, -215, 26, ROLE.prefix, 'mono', 'left'),
        rule(x0, yBot, x1, yBot, '#4a5f8e', 2.6),
        rule(x0, yBot, x0, yTop, '#4a5f8e', 2.6),
        neonCurve(ptsCubic, [ROLE.warm, ROLE.danger], { width: 4.5, glow: 10 }),
        neonCurve(ptsQuad, [ROLE.prob, ROLE.target], { width: 4.2, glow: 9 }),
        neonCurve(ptsLin, [ROLE.prefix, ROLE.alt], { width: 4.2, glow: 9 }),

        // Right-side floating legend & formulas (zero overlap with curves!)
        txt('UNCACHED ATTENTION', 240, -145, 26, ROLE.danger, 'mono', 'left'),
        txt('O(m³)  cubic explosion', 240, -100, 32, ROLE.danger, 'mono', 'left'),
        txt('CACHED ATTENTION / UNCACHED FFN', 240, -10, 26, ROLE.target, 'mono', 'left'),
        txt('O(m²)  still reads growing KV', 240, 35, 32, ROLE.target, 'mono', 'left'),
        txt('CACHED PROJECTIONS / FFN', 240, 125, 26, ROLE.alt, 'mono', 'left'),
        txt('O(m)   1 new token per step', 240, 170, 32, ROLE.alt, 'mono', 'left'),
        txt(
          'Fused causal kernels skip masked cells, but full attention over a growing KV history stays O(m²)',
          0,
          365,
          28,
          COSMOS.muted,
          'serif',
        ),
      ];
      return group(...nodes).opacity(vis);
    },
  );

  // View 2: Weight reuse & Arithmetic Intensity (Prefill vs Batch-1 Decode vs Batched Decode)
  const view2 = guardedDynamic(
    () => fadeIn(b2P.value),
    (vis) => {
      const st = b2Step.value;
      const barX = -320;
      const barW = 920;
      const regimes = [
        {
          lbl: 'PREFILL (128 prompt tok)',
          reuse: 1.0,
          note: 'High weight reuse (compute-heavy)',
          col: ROLE.prefix,
        },
        {
          lbl: 'DECODE (batch = 1)',
          reuse: 0.08,
          note: '~2 ops / 2B weight = 1 op/byte (BW-bound)',
          col: ROLE.danger,
        },
        {
          lbl: 'DECODE (batch = 32)',
          reuse: 0.45,
          note: '32 requests share each loaded weight',
          col: ROLE.alt,
        },
      ];
      const nodes = [
        txt(
          'ARITHMETIC INTENSITY:  WEIGHT REUSE PER LOAD',
          -820,
          -210,
          28,
          ROLE.warm,
          'mono',
          'left',
        ),
      ];
      regimes.forEach((rg, i) => {
        const y = -95 + i * 135;
        const lit = i === 2 ? mix(0.45, 1, clamp01(st - 2.2)) : 1;
        nodes.push(
          txt(rg.lbl, -820, y - 6, 28, rg.col, 'mono', 'left').opacity(lit),
          scaleTrack(barX, y, barW, 48, { radius: 10 }).opacity(lit),
          glowBar(barX, y, Math.max(18, barW * rg.reuse), 48, rg.col, {
            glow: 10,
            radius: 10,
            opacity: lit,
          }),
          txt(rg.note, barX, y + 54, 26, COSMOS.muted, 'sans', 'left').opacity(lit),
        );
      });
      nodes.push(
        txt(
          'Storage arithmetic alone cannot prove speed: always benchmark real latency and throughput',
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
  cueTo(s, c, 'work-and-bandwidth-b1', b0Step, 0.3, { dur: 0.4 });
  voiceSpan(s, c, 'work-and-bandwidth-voice-1', vPhase, 1);
  cueTo(s, c, 'work-and-bandwidth-step-0-1', b0Step, 1, { dur: 0.45 });
  cueTo(s, c, 'work-and-bandwidth-step-0-2', b0Step, 2, { dur: 0.45 });
  cueTo(s, c, 'work-and-bandwidth-step-0-3', b0Step, 3, { dur: 0.5 });
  cueTo(s, c, 'work-and-bandwidth-step-0-4', b0Step, 4, { dur: 0.5 });
  cueTo(s, c, 'work-and-bandwidth-step-0-5', b0Step, 5, { dur: 0.45 });

  cueTo(s, c, 'work-and-bandwidth-b2', b1P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'work-and-bandwidth-voice-2', vPhase, 2);
  cueTo(s, c, 'work-and-bandwidth-step-1-1', b1Step, 1, { dur: 0.45 });
  cueTo(s, c, 'work-and-bandwidth-step-1-2', b1Step, 2, { dur: 0.45 });
  cueTo(s, c, 'work-and-bandwidth-step-1-3', b1Step, 3, { dur: 0.45 });
  cueTo(s, c, 'work-and-bandwidth-step-1-4', b1Step, 4, { dur: 0.45 });

  cueTo(s, c, 'work-and-bandwidth-b3', b2P, 1, { dur: 0.7 });
  voiceSpan(s, c, 'work-and-bandwidth-voice-3', vPhase, 3);
  cueTo(s, c, 'work-and-bandwidth-step-2-1', b2Step, 1, { dur: 0.45 });
  cueTo(s, c, 'work-and-bandwidth-step-2-2', b2Step, 2, { dur: 0.45 });
  cueTo(s, c, 'work-and-bandwidth-step-2-3', b2Step, 3, { dur: 0.45 });
  cueTo(s, c, 'work-and-bandwidth-step-2-4', b2Step, 4, { dur: 0.45 });
  cueTo(s, c, 'work-and-bandwidth-step-2-5', b2Step, 5, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 23. cache-budget: 3D Orbiting KV Cache Tensor Volume (1 GiB -> 16 GiB -> 128 GiB)
// Beat 0: 2 x 32L x 8H x 128d x 2B x 4 req: 2048 pos = 1 GiB -> 32768 pos = 16 GiB
// Beat 1: 32 requests -> 128 GiB; unequal lengths & runtime memory exclusions
// ---------------------------------------------------------------------------
export function cacheBudget(s, c) {
  const scalePos = s.value(0); // 0 = 2048 (1 GiB), 1 = 32768 (16 GiB)
  const scaleReq = s.value(0); // 0 = 4 req, 1 = 32 req (128 GiB)
  const b0Step = s.value(0);
  const b1Step = s.value(0);
  const vPhase = s.value(0);

  s.add(cinemaGrid({ accent: ROLE.prefix, seed: 23 }));
  s.add(decorAura(-340, 40, 500, '#5ce1e61c', '#07091000'));

  const headline = heroTitle(['KV Cache', 'Memory Budget'], {
    x: -855,
    y: -435,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefix,
    eyebrow: '3D KV TENSOR VOLUME  ·  1 GiB  ->  16 GiB  ->  128 GiB',
  });

  // 3D Orbiting KV Tensor Slabs + live scaling wireframe boxes (context T x batch B x layers L)
  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 15.8,
    unit: 102,
    focus: [0, 0, 0.45],
  }).at(-420, -10);

  const dynamicSlab = (cySign, color) => {
    const pt = (sx, sy, sz) => () => {
      const hx = mix(0.75, 2.25, scalePos.value);
      const hy = mix(0.46, 0.88, scaleReq.value);
      const hz = mix(0.55, 0.88, scaleReq.value);
      const cy = cySign * (hy + 0.38);
      return [sx * hx, cy + sy * hy, 0.5 + sz * hz];
    };
    const topStyle = { color, width: 3.2, glow: 10, blend: 'screen', onTop: true };
    const botStyle = { ...topStyle, width: 2.2, opacity: 0.78 };
    return [
      line3d(pt(-1, -1, 1), pt(1, -1, 1), topStyle),
      line3d(pt(1, -1, 1), pt(1, 1, 1), topStyle),
      line3d(pt(1, 1, 1), pt(-1, 1, 1), topStyle),
      line3d(pt(-1, 1, 1), pt(-1, -1, 1), topStyle),
      line3d(pt(-1, -1, -1), pt(1, -1, -1), botStyle),
      line3d(pt(1, -1, -1), pt(1, 1, -1), botStyle),
      line3d(pt(1, 1, -1), pt(-1, 1, -1), botStyle),
      line3d(pt(-1, 1, -1), pt(-1, -1, -1), botStyle),
      line3d(pt(-1, -1, -1), pt(-1, -1, 1), botStyle),
      line3d(pt(1, -1, -1), pt(1, -1, 1), botStyle),
      line3d(pt(1, 1, -1), pt(1, 1, 1), botStyle),
      line3d(pt(-1, 1, -1), pt(-1, 1, 1), botStyle),
    ];
  };

  const floorSurf = surface((x, y) => 0.08 * Math.cos(x * 0.7) * Math.cos(y * 0.7) - 0.45, {
    x: [-2.35, 2.35],
    y: [-2.15, 2.15],
    steps: 14,
    colors: ['#101c38', '#1a2f5c', '#24457d'],
    wire: true,
  });
  view3d.add(floorSurf, ...dynamicSlab(-1, ROLE.prefix), ...dynamicSlab(1, ROLE.target));

  const overlay = dynamic(() => {
    const sp = scalePos.value;
    const sr = scaleReq.value;
    const st1 = b1Step.value;

    const positions = Math.round(mix(2048, 32768, sp));
    const requests = Math.round(mix(4, 32, sr));
    const gib =
      rawKvBytes({
        layers: 32,
        heads: 8,
        width: 128,
        positions: positions * requests,
        bytes: 2,
      }) /
      1024 ** 3;
    const col = sr > 0.4 ? ROLE.danger : sp > 0.4 ? ROLE.target : ROLE.prefix;

    const rx = 140;
    const nodes = [
      txt('RAW KV PAYLOAD FORMULA', rx, -245, 26, COSMOS.muted, 'mono', 'left'),
      glowTex('2 \\times L \\times H_{kv} \\times d \\times T \\times B \\times \\text{bytes}', {
        x: rx + 350,
        y: -175,
        size: 36,
        color: ROLE.prefix,
      }),
      txt(
        '32 layers · 8 KV heads · 128 dim · 2 B (FP16)',
        rx,
        -100,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),

      // Live scaling readout
      txt(
        `Positions / req:  ${positions.toLocaleString()}`,
        rx,
        -15,
        32,
        ROLE.prefix,
        'mono',
        'left',
      ),
      txt(`Concurrent reqs:  ${requests}`, rx, 38, 32, ROLE.target, 'mono', 'left'),
      txt(
        `${gib < 10 ? gib.toFixed(1) : Math.round(gib)} GiB`,
        rx,
        145,
        92,
        col,
        'mono',
        'left',
      ).glow(14, col),

      // 3-tier proportional reference scale bar
      scaleTrack(rx, 245, 680, 32, { radius: 8 }),
      glowBar(rx, 245, Math.max(10, (gib / 128) * 680), 32, col, { glow: 10, radius: 8 }),
      txt('1 GiB', rx, 290, 26, COSMOS.dim, 'mono', 'left'),
      txt('16 GiB', rx + 260, 290, 26, COSMOS.dim, 'mono'),
      txt('128 GiB', rx + 680, 290, 26, ROLE.danger, 'mono', 'right'),

      txt(
        st1 >= 1.5
          ? 'Excludes weights, workspace & reserves; for unequal lengths sum processed positions first'
          : '1 GiB = 1024³ bytes; 16x context -> 16 GiB; 8x batch -> 128 GiB raw KV payload',
        0,
        420,
        28,
        COSMOS.muted,
        'serif',
      ),
    ];
    return group(...nodes);
  });

  s.add(view3d, headline, overlay);
  orbitScene(s, c, view3d, { theta: -0.74 + 0.55, phi: 0.96 });

  cueTo(s, c, 'cache-budget-b1', b0Step, 0.3, { dur: 0.4 });
  voiceSpan(s, c, 'cache-budget-voice-1', vPhase, 1);
  cueTo(s, c, 'cache-budget-step-0-1', b0Step, 1, { dur: 0.45 });
  cueTo(s, c, 'cache-budget-step-0-2', b0Step, 2, { dur: 0.45 });
  cueTo(s, c, 'cache-budget-step-0-3', scalePos, 1, { dur: 0.95 });
  cueTo(s, c, 'cache-budget-step-0-4', b0Step, 4, { dur: 0.45 });
  cueTo(s, c, 'cache-budget-step-0-5', b0Step, 5, { dur: 0.45 });

  cueTo(s, c, 'cache-budget-b2', scaleReq, 1, { dur: 0.95 });
  voiceSpan(s, c, 'cache-budget-voice-2', vPhase, 2);
  cueTo(s, c, 'cache-budget-step-1-1', b1Step, 1, { dur: 0.45 });
  cueTo(s, c, 'cache-budget-step-1-2', b1Step, 2, { dur: 0.45 });
  cueTo(s, c, 'cache-budget-step-1-3', b1Step, 3, { dur: 0.45 });
  cueTo(s, c, 'cache-budget-step-1-4', b1Step, 4, { dur: 0.45 });
}
