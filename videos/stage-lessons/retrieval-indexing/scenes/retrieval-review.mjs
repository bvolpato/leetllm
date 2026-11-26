// Scene 24: Where did the credential guide disappear? (End-to-end diagnostic pipeline trace)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function retrievalReview(s, c) {
  const phase = s.value(0);
  const showLanes = s.value(0);
  const showAsk = s.value(0);
  const showCut = s.value(0);
  const showThree = s.value(0);
  const showBack = s.value(0);
  const showSave = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['Where Did the Credential', 'Guide Disappear?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.rose,
    eyebrow: 'FAILURE TRACE · FOLLOW PASSAGE d2 FORWARD FROM THE WINNING LANE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sl = showLanes.value;
    const sa = showAsk.value;
    const sc = showCut.value;
    const s3 = showThree.value;
    const sb = showBack.value;
    const ss = showSave.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const fixed = s3 > 0.4;
    const revealed = sc > 0.4 || fixed;

    const nodes = [
      // Stage 1: Two retrieval lanes
      glassCell(-645, -108, 410, 104, COSMOS.rose, { fill: '#28111a', glow: 4 }),
      txt('SPARSE LANE', -645, -130, 26, COSMOS.rose, 'mono'),
      txt('[ d1, d4 ]  (d2 absent)', -645, -86, 26, COSMOS.ink, 'mono'),

      glassCell(-645, 58, 410, 104, COSMOS.emerald, {
        fill: '#0e2824',
        glow: sl > 0.3 ? 9 * pulse : 5,
      }),
      txt('DENSE LANE (FOUND d2!)', -645, 36, 26, COSMOS.emerald, 'mono'),
      txt('[ d2, d1, d4 ]', -645, 80, 28, COSMOS.emerald, 'mono'),

      glowingArc([-432, -92], [-240, -35], -16, { color: COSMOS.rose, width: 3.2 }),
      glowingArc([-432, 58], [-240, 12], 16, { color: COSMOS.emerald, width: 3.8 }),

      // Stage 2: Fusion Cutoff (THE BOTTLENECK!)
      glassCell(
        -30,
        -18,
        440,
        188,
        fixed ? COSMOS.emerald : revealed ? COSMOS.amber : COSMOS.gold,
        {
          fill: fixed ? '#0e2824' : revealed ? '#281c10' : '#181e34',
          glow: revealed ? 11 * pulse : 6,
        },
      ),
      txt('FUSION CUTOFF', -30, -72, 26, fixed ? COSMOS.emerald : COSMOS.gold, 'mono'),
      txt(
        fixed ? 'TOP-3: [d1, d4, d2]' : revealed ? 'TOP-2: [d1, d4] DROP' : 'TOP-2: [d1, d4]',
        -30,
        -24,
        26,
        fixed ? COSMOS.emerald : revealed ? COSMOS.rose : COSMOS.ink,
        'mono',
      ),
      txt(
        fixed ? 'd2 survives into rerank!' : revealed ? 'TRY THIS STAGE FIRST!' : 'Check stage?',
        -30,
        32,
        26,
        fixed ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ),

      glowingArc([196, -18], [320, -18], -14, {
        color: fixed ? COSMOS.emerald : COSMOS.muted,
        width: 3.8,
      }),

      // Stage 3: Cross-Encoder Reranker
      glassCell(580, -18, 520, 188, sb > 0.4 ? COSMOS.emerald : COSMOS.muted, {
        fill: sb > 0.4 ? '#0e2824' : '#12182b',
        glow: sb > 0.4 ? 10 * pulse : 3,
      }),
      txt('RERANKER -> MODEL', 580, -72, 26, sb > 0.4 ? COSMOS.emerald : COSMOS.cyan, 'mono'),
      txt(
        sb > 0.4 ? '#1 d2 (0.96) -> WINNER!' : 'Receives fused shortlist',
        580,
        -24,
        27,
        sb > 0.4 ? COSMOS.emerald : COSMOS.ink,
        'mono',
      ),
      txt(
        sb > 0.4 ? 'Check truncation / LLM use next' : 'Cannot promote unseen d2',
        580,
        32,
        26,
        COSMOS.muted,
        'sans',
      ),

      // Bottom: Replay manifest box
      glassCell(0, 214, 1680, 128, ss > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10182d',
        glow: ss > 0.3 ? 8 * pulse : 2,
      }),
      txt('REPLAYABLE EVALUATION RECORD', -810, 182, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'Save ranked IDs + query + judgments + source version + encoder + tokenizer + metric + norm + index + filters + tie rule',
        -810,
        228,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: fixed ? COSMOS.emerald : COSMOS.gold }),
      txt(
        fixed
          ? 'Allowing 1 more fused slot delivers d2 to the reranker where it jumps straight to #1!'
          : revealed
            ? 'Change the fused cutoff first: dense already found d2, so widening depth fixes the drop'
            : sa > 0.3
              ? 'Follow d2 forward from the dense lane: at which stage would you try a change first?'
              : 'Trace a missing passage forward from the last stage that still held it',
        -812,
        357,
        28,
        fixed ? COSMOS.emerald : COSMOS.gold,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('review-lanes', () => s.play(showLanes.to(1, { duration: 0.45 })));
  c.on('review-ask', () => s.play(showAsk.to(1, { duration: 0.4 })));
  c.after('review-cut', () => s.play(showCut.to(1, { duration: 0.45 })));
  c.on('review-three', () => s.play(showThree.to(1, { duration: 0.45 })));
  c.on('review-back', () => s.play(showBack.to(1, { duration: 0.45 })));
  c.on('review-save', () =>
    s.play(showSave.to(1, { duration: remainDuration(c, 'review-save', 0.45) })),
  );
}
