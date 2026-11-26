// Scene 04: unseen: Replay saved merges on "rainly" -> competing rule-order prediction on "rain".
import { linear } from 'vizmatic/stage';
import {
  COSMOS,
  ORDER_A,
  ORDER_B,
  ROLE,
  RULES,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function unseen(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const replayStep = s.value(0); // 0: r a i n l y -> 1: ra -> 2: rai -> 3: rain l y
  const showExamples = s.value(0);
  const upperDone = s.value(0); // r a i n -> ra i n
  const showLowerPrompt = s.value(0);
  const revealLower = s.value(0); // strictly withheld until AFTER `lower-merge`!
  const showLowerSkip = s.value(0);
  const pulse = s.value(0);
  const cueEnergy = s.value(0);

  const bgAura = aura(0, 0, 720, '#1e3a6e24', '#311a5c18');
  const title = heroTitle(['Replay the', 'saved merges'], {
    x: -855,
    y: -430,
    size: 56,
    lineHeight: 64,
    accent: ROLE.piece,
  });

  const rainlyStages = [
    ['r', 'a', 'i', 'n', 'l', 'y'],
    ['ra', 'i', 'n', 'l', 'y'],
    ['rai', 'n', 'l', 'y'],
    ['rain', 'l', 'y'],
  ];

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const step = Math.max(0, Math.min(3, Math.round(replayStep.value)));
    const ex = showExamples.value;
    const p = 0.65 + 0.35 * Math.sin(pulse.value * Math.PI * 2);
    const pieces = rainlyStages[step];
    const nodes = [
      txt('UNSEEN WORD: "rainly"', -855, -210, 28, ROLE.piece, 'mono', 'left').opacity(alpha),
    ];

    let cx = -760;
    pieces.forEach((piece) => {
      const w = Math.max(92, piece.length * 42 + 44);
      const col = piece.length > 1 ? ROLE.merge : step === 3 ? ROLE.piece : ROLE.token;
      nodes.push(
        tokenPill(piece, cx + w * 0.5, -100, {
          w,
          h: 84,
          color: col,
          size: 40,
          glow: piece.length > 1 ? 12 * p : 6,
          opacity: alpha,
        }),
      );
      cx += w + 22;
    });

    // Saved rule list on right
    nodes.push(
      txt('SAVED MERGE RULES (NO COUNTING)', 260, -210, 26, ROLE.merge, 'mono', 'left').opacity(
        alpha,
      ),
    );
    RULES.forEach(([l, r], idx) => {
      const active = step === idx + 1;
      const done = step > idx;
      const col = active ? ROLE.merge : done ? ROLE.ok : COSMOS.muted;
      nodes.push(
        txt(`${idx + 1}. ${l} + ${r} → ${l + r}`, 260, -140 + idx * 66, 34, col, 'mono', 'left')
          .glow(active ? 10 : 0, col)
          .opacity(alpha),
      );
    });

    if (step === 3) {
      nodes.push(
        txt('3 pieces for an unseen word: rain | l | y', -855, 45, 32, ROLE.ok, 'mono', 'left')
          .glow(6, ROLE.ok)
          .opacity(alpha),
      );
    }

    if (ex > 0.05) {
      nodes.push(
        txt('rainy  →  rain  |  y', -855, 190, 36, ROLE.piece, 'mono', 'left').opacity(ex * alpha),
        txt('rail   →  rai   |  l', -855, 265, 36, ROLE.piece, 'mono', 'left').opacity(ex * alpha),
      );
    } else {
      // Quiet persistent rule-replay progress rail across bottom (zero empty space!)
      nodes.push(
        txt(
          'REPLAY PROGRESS (FIXED ORDERED MERGES)',
          -855,
          210,
          26,
          COSMOS.dim,
          'mono',
          'left',
        ).opacity(alpha),
        tokenPill('1. r+a', -700, 295, {
          w: 220,
          h: 64,
          color: step >= 1 ? ROLE.merge : COSMOS.rule,
          size: 28,
          opacity: alpha,
        }),
        tokenPill('2. ra+i', -430, 295, {
          w: 220,
          h: 64,
          color: step >= 2 ? ROLE.merge : COSMOS.rule,
          size: 28,
          opacity: alpha,
        }),
        tokenPill('3. rai+n', -160, 295, {
          w: 220,
          h: 64,
          color: step >= 3 ? ROLE.ok : COSMOS.rule,
          size: 28,
          opacity: alpha,
        }),
      );
    }
    return group(...nodes);
  });

  // View 2: Competing rules order on "rain" (prediction withheld!)
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const up = upperDone.value;
    const lp = showLowerPrompt.value;
    const lo = revealLower.value;
    const sk = showLowerSkip.value;
    const nodes = [];

    // Upper run: [r+a, a+i] -> ra | i | n
    nodes.push(
      txt('RUN A:  1. r + a   2. a + i', -855, -210, 30, ROLE.merge, 'mono', 'left').opacity(alpha),
    );
    const upperPieces = up > 0.5 ? ORDER_A : ['r', 'a', 'i', 'n'];
    let ux = -800;
    upperPieces.forEach((piece) => {
      const w = piece.length > 1 ? 150 : 96;
      nodes.push(
        tokenPill(piece, ux + w * 0.5, -110, {
          w,
          h: 78,
          color: piece.length > 1 ? ROLE.merge : ROLE.token,
          size: 38,
          opacity: alpha,
        }),
      );
      ux += w + 22;
    });
    if (up > 0.5) {
      nodes.push(
        txt(
          'rule 2 skipped: "a" is locked inside "ra"',
          40,
          -110,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          'Applying rules top-to-bottom on "r a i n"',
          40,
          -110,
          28,
          COSMOS.dim,
          'sans',
          'left',
        ).opacity(alpha),
      );
    }

    // Lower run: reversed [a+i, r+a] -> answer withheld until `lower-merge`!
    nodes.push(
      txt(
        'RUN B (REVERSED):  1. a + i   2. r + a',
        -855,
        65,
        30,
        ROLE.piece,
        'mono',
        'left',
      ).opacity(alpha),
    );
    const lowerPieces = lo > 0.5 ? ORDER_B : ['r', 'a', 'i', 'n'];
    let lx = -800;
    lowerPieces.forEach((piece) => {
      const w = piece.length > 1 ? 150 : 96;
      nodes.push(
        tokenPill(piece, lx + w * 0.5, 165, {
          w,
          h: 78,
          color: piece.length > 1 ? ROLE.ok : ROLE.piece,
          size: 38,
          opacity: alpha,
        }),
      );
      lx += w + 22;
    });

    if (lp > 0.05 && lo < 0.2) {
      nodes.push(
        txt('Which letters join in Run B?', 40, 165, 36, ROLE.merge, 'serif', 'left')
          .glow(8, ROLE.merge)
          .opacity(lp * (1 - lo * 5) * alpha),
      );
    }
    if (lo > 0.5) {
      nodes.push(
        txt(
          sk > 0.5
            ? 'a + i joins first; r + a skipped ("a" is inside "ai")'
            : 'a + i joins first → r | ai | n',
          40,
          165,
          28,
          ROLE.ok,
          'sans',
          'left',
        )
          .glow(6, ROLE.ok)
          .opacity(alpha),
      );
    }

    nodes.push(
      txt(
        'Saved rule order fixes which pieces reach the model',
        -855,
        345,
        32,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  const totalDur = Math.max(1, c.end - c.start - 0.5);
  c.at(0.1, () => {
    s.play(pulse.to(6, { duration: totalDur, ease: linear }));
  });

  playCue(s, c, 'replay-1', (d) => s.play(replayStep.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'replay-2', (d) => s.play(replayStep.to(2, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'replay-3', (d) => s.play(replayStep.to(3, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'rainy-result', (d) => s.play(showExamples.to(1, { duration: d })), { dur: 0.45 });

  playCue(s, c, 'order', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.65 });
  playCue(s, c, 'upper-merge', (d) => s.play(upperDone.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'ask-order', (d) => s.play(showLowerPrompt.to(1, { duration: d })), { dur: 0.4 });
  // Strictly withhold Run B merge until AFTER `lower-merge`!
  playCue(s, c, 'lower-merge', (d) => s.play(revealLower.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'lower-skip', (d) => s.play(showLowerSkip.to(1, { duration: d })), { dur: 0.4 });
  bindCueBeat(s, c, cueEnergy, [
    'rainly',
    'leftovers',
    'no-count',
    'rail-result',
    'upper-skip',
    'reverse',
    'no-row',
  ]);
}
