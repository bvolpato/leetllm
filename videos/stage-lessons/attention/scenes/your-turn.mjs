// Scene 18: your-turn: "Change the reader"
// Interactive worked transfer with new reader state [1, 3] -> q_new = [2.5, 3.5].
// Strictly withholds dot products (2.7, 3.9), gap leads (0.45 -> 1.20), shares (30%/70%),
// and output totals (1.30, 1.70) until their exact spoken reveal cues ({ after: true })!
import { line } from 'vizmatic/stage';
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  K,
  NEW_OUTPUT,
  NEW_QUERY,
  NEW_SCORES,
  NEW_STATE,
  NEW_WEIGHTS,
  Q,
  ROLE,
  ROOT,
  SCORES,
  V,
  cinemaAtmosphere,
  fmt,
  lumBar,
  pct,
  playCue,
  shareRibbon,
  swapVis,
  vecTrim,
} from '../parts.mjs';

export default function yourTurn(s, c) {
  const oldLead = SCORES[1][1] - SCORES[1][0]; // 0.45
  const newLead = NEW_SCORES[1] - NEW_SCORES[0]; // 1.20
  const scaledNew = NEW_SCORES.map((x) => x / ROOT); // [1.91, 2.76]
  const wB = NEW_WEIGHTS[0]; // ~0.30
  const wS = NEW_WEIGHTS[1]; // ~0.70

  const title = heroTitle(['Your turn:', 'change the reader'], {
    x: -850,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.query,
  });

  // Two spacious views: 1) Project [1,3] -> dot products -> score gaps -> shares, 2) Value stacks -> output [1.30, 1.70]
  const vScore = s.value(1);
  const vMix = s.value(0);

  // View 1 state (strictly gated by spoken reveals!)
  const showReader = s.value(0);
  const showNewQ = s.value(0);
  const showPredictQ = s.value(0);
  const showScoreB = s.value(0); // AFTER birds-score
  const showScoreS = s.value(0); // AFTER sing-score
  const showGapBar = s.value(0);
  const showOldLead = s.value(0); // AFTER old-lead
  const showNewLead = s.value(0); // AFTER new-lead
  const showScaled = s.value(0);
  const showShares = s.value(0); // AFTER new-shares
  const showGains = s.value(0); // AFTER gains

  // View 2 state (stacked coordinate contributions -> withheld totals [1.30, 1.70]!)
  const showStacks = s.value(0);
  const showSumQ = s.value(0);
  const showTotals = s.value(0); // AFTER sum!

  const scoreLayer = guardedDynamic(vScore, (alpha) => {
    const nodes = [];

    // Top row: New reader state x_new = [1, 3] × W_Q -> q_new = [2.5, 3.5]
    nodes.push(
      lumBar(-565, -205, 490, 96, {
        color: ROLE.query,
        fillOpacity: 0.2,
        strokeWidth: 2.4,
        glow: 8,
        opacity: (0.35 + 0.65 * showReader.value) * alpha,
      }),
      txt(
        `reader state  x = ${vecTrim(NEW_STATE)}`,
        -565,
        -205,
        28,
        ROLE.query,
        'mono',
        'center',
      ).opacity((0.35 + 0.65 * showReader.value) * alpha),

      lumBar(0, -205, 450, 96, {
        color: ROLE.head,
        fillOpacity: 0.16,
        strokeWidth: 2,
        glow: 5,
        opacity: (0.35 + 0.65 * showReader.value) * alpha,
      }),
      txt(
        `W_Q = [[${Q[0].join(', ')}], [${Q[1].join(', ')}]]`,
        0,
        -205,
        26,
        ROLE.head,
        'mono',
        'center',
      ).opacity((0.35 + 0.65 * showReader.value) * alpha),

      lumBar(565, -205, 480, 96, {
        color: ROLE.query,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 10,
        opacity: (0.2 + 0.8 * showNewQ.value) * alpha,
      }),
      txt(
        showNewQ.value > 0.4 ? `q_new = ${vecTrim(NEW_QUERY)}` : 'q_new = x · W_Q',
        565,
        -205,
        30,
        ROLE.query,
        'mono',
        'center',
      )
        .glow(showNewQ.value > 0.4 ? 7 : 0, ROLE.query)
        .opacity((0.25 + 0.75 * showNewQ.value) * alpha),
    );

    // Middle left: Two source columns (Birds & sing) with fixed keys & dot products
    const colB = -540;
    const colS = -130;
    const cardY = 25;

    nodes.push(
      lumBar(colB, cardY, 370, 235, {
        color: ROLE.birds,
        fillOpacity: 0.16,
        strokeWidth: 2.4,
        glow: 7,
        opacity: alpha,
      }),
      txt('Birds  (fixed key)', colB, cardY - 76, 28, ROLE.birds, 'sans', 'center').opacity(alpha),
      txt(`k = ${vecTrim(K[0])}`, colB, cardY - 26, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt('old score: 0.60', colB, cardY + 24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        showScoreB.value > 0.5 ? `new score: ${fmt(NEW_SCORES[0], 2)}` : 'new score: ?',
        colB,
        cardY + 76,
        32,
        showScoreB.value > 0.5 ? ROLE.birds : ROLE.query,
        'mono',
        'center',
      )
        .glow(showScoreB.value > 0.5 ? 7 : 0, ROLE.birds)
        .opacity(alpha),

      lumBar(colS, cardY, 370, 235, {
        color: ROLE.sing,
        fillOpacity: 0.16,
        strokeWidth: 2.4,
        glow: 7,
        opacity: alpha,
      }),
      txt('sing  (fixed key)', colS, cardY - 76, 28, ROLE.sing, 'sans', 'center').opacity(alpha),
      txt(`k = ${vecTrim(K[1])}`, colS, cardY - 26, 28, COSMOS.ink, 'mono', 'center').opacity(
        alpha,
      ),
      txt('old score: 1.05', colS, cardY + 24, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        showScoreS.value > 0.5 ? `new score: ${fmt(NEW_SCORES[1], 2)}` : 'new score: ?',
        colS,
        cardY + 76,
        32,
        showScoreS.value > 0.5 ? ROLE.sing : ROLE.query,
        'mono',
        'center',
      )
        .glow(showScoreS.value > 0.5 ? 7 : 0, ROLE.sing)
        .opacity(alpha),
    );

    // Middle right: Gap comparison bars (old lead 0.45 vs new lead 1.20)
    const gx = 450;
    nodes.push(
      txt(
        showPredictQ.value > 0.4 && showScoreB.value < 0.5
          ? 'Which source gains share?'
          : 'Sing lead over Birds (gap)',
        gx,
        -75,
        32,
        ROLE.query,
        'serif',
        'center',
      )
        .glow(6, ROLE.query)
        .opacity(alpha),
    );

    if (showOldLead.value > 0.05) {
      const wOld = oldLead * 260;
      nodes.push(
        txt('old gap:', gx - 270, 5, 28, COSMOS.muted, 'mono', 'left').opacity(
          showOldLead.value * alpha,
        ),
        lumBar(gx - 80 + wOld / 2, 5, wOld, 44, {
          color: COSMOS.muted,
          fillOpacity: 0.3,
          strokeWidth: 2,
          glow: 5,
          opacity: showOldLead.value * alpha,
        }),
        txt(`+${fmt(oldLead, 2)}`, gx - 80 + wOld + 24, 5, 30, COSMOS.ink, 'mono', 'left').opacity(
          showOldLead.value * alpha,
        ),
      );
    }

    if (showNewLead.value > 0.05) {
      const wNew = newLead * 260;
      nodes.push(
        txt('new gap:', gx - 270, 88, 28, ROLE.sing, 'mono', 'left').opacity(
          showNewLead.value * alpha,
        ),
        lumBar(gx - 80 + wNew / 2, 88, wNew, 44, {
          color: ROLE.sing,
          fillOpacity: 0.45,
          strokeWidth: 2.6,
          glow: 10,
          opacity: showNewLead.value * alpha,
        }),
        txt(`+${fmt(newLead, 2)}`, gx - 80 + wNew + 24, 88, 32, ROLE.sing, 'mono', 'left')
          .glow(7, ROLE.sing)
          .opacity(showNewLead.value * alpha),
      );
    }

    if (showScaled.value > 0.05 && showShares.value < 0.05) {
      nodes.push(
        txt(
          `÷ √2  →  [${fmt(scaledNew[0], 2)}, ${fmt(scaledNew[1], 2)}]`,
          gx,
          175,
          28,
          ROLE.amber,
          'mono',
          'center',
        ).opacity(showScaled.value * alpha),
      );
    }

    // Bottom conserved share ribbon (STRICTLY after new-shares!)
    if (showShares.value > 0.05) {
      nodes.push(
        shareRibbon({
          x: 0,
          y: 295,
          width: 1120,
          height: 66,
          shares: NEW_WEIGHTS,
          colors: [ROLE.birds, ROLE.sing],
          labels: ['Birds', 'sing'],
          opacity: showShares.value * alpha,
        }),
      );
      if (showGains.value > 0.05) {
        nodes.push(
          txt('Sing gains share: 58% → 70%', 0, 395, 32, ROLE.sing, 'mono', 'center')
            .glow(8, ROLE.sing)
            .opacity(showGains.value * alpha),
        );
      }
    }

    return nodes;
  });

  // VIEW 2: Coordinate Contribution Stacks -> Withheld Output [1.30, 1.70]
  const mixLayer = guardedDynamic(vMix, (alpha) => {
    const st = showStacks.value;
    const sq = showSumQ.value;
    const tot = showTotals.value;
    const nodes = [];

    // Top share & value summary
    nodes.push(
      shareRibbon({
        x: 0,
        y: -240,
        width: 960,
        height: 56,
        shares: NEW_WEIGHTS,
        colors: [ROLE.birds, ROLE.sing],
        labels: ['Birds', 'sing'],
        opacity: alpha,
      }),
      txt(
        `v_Birds = ${vecTrim(V[0])}   ·   v_sing = ${vecTrim(V[1])}`,
        0,
        -150,
        30,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Two vertical coordinate stacks: x_1 (left) and x_2 (right)
    const baseY = 275;
    const pxPerUnit = 190;
    const x1 = -280;
    const x2 = 280;

    const b0 = wB * V[0][0]; // ~0.60
    const s0 = wS * V[1][0]; // ~0.70
    const b1 = wB * V[0][1]; // ~0.30
    const s1 = wS * V[1][1]; // ~1.40

    nodes.push(
      line([-520, baseY], [520, baseY], { stroke: '#556894', width: 2.5 }).opacity(alpha),
      txt('1st coordinate', x1, baseY + 42, 30, COSMOS.ink, 'sans', 'center').opacity(alpha),
      txt('2nd coordinate', x2, baseY + 42, 30, COSMOS.ink, 'sans', 'center').opacity(alpha),
    );

    // Stack 1 (x_1): Birds 0.60 + sing 0.70 = 1.30
    const hB0 = b0 * pxPerUnit * Math.max(0.05, st);
    const hS0 = s0 * pxPerUnit * Math.max(0.05, st);
    nodes.push(
      lumBar(x1, baseY - hB0 / 2, 175, hB0, {
        color: ROLE.birds,
        fillOpacity: 0.45,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
      lumBar(x1, baseY - hB0 - hS0 / 2, 175, hS0, {
        color: ROLE.sing,
        fillOpacity: 0.45,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
    );

    // Stack 2 (x_2): Birds 0.30 + sing 1.40 = 1.70
    const hB1 = b1 * pxPerUnit * Math.max(0.05, st);
    const hS1 = s1 * pxPerUnit * Math.max(0.05, st);
    nodes.push(
      lumBar(x2, baseY - hB1 / 2, 175, hB1, {
        color: ROLE.birds,
        fillOpacity: 0.45,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
      lumBar(x2, baseY - hB1 - hS1 / 2, 175, hS1, {
        color: ROLE.sing,
        fillOpacity: 0.45,
        strokeWidth: 2.5,
        glow: 9,
        opacity: alpha,
      }),
    );

    if (st > 0.7) {
      nodes.push(
        txt(
          `Birds: ${fmt(b0, 2)}`,
          x1 - 115,
          baseY - hB0 / 2,
          26,
          ROLE.birds,
          'mono',
          'right',
        ).opacity(alpha),
        txt(
          `sing: ${fmt(s0, 2)}`,
          x1 - 115,
          baseY - hB0 - hS0 / 2,
          26,
          ROLE.sing,
          'mono',
          'right',
        ).opacity(alpha),
        txt(
          `Birds: ${fmt(b1, 2)}`,
          x2 + 115,
          baseY - hB1 / 2,
          26,
          ROLE.birds,
          'mono',
          'left',
        ).opacity(alpha),
        txt(
          `sing: ${fmt(s1, 2)}`,
          x2 + 115,
          baseY - hB1 - hS1 / 2,
          26,
          ROLE.sing,
          'mono',
          'left',
        ).opacity(alpha),
      );
    }

    // Top of stacks: '?' while predicting, then exact totals 1.30 / 1.70 AFTER sum!
    if (tot > 0.2) {
      nodes.push(
        txt(fmt(NEW_OUTPUT[0], 2), x1, baseY - hB0 - hS0 - 38, 42, ROLE.query, 'mono', 'center')
          .glow(10, ROLE.query)
          .opacity(tot * alpha),
        txt(fmt(NEW_OUTPUT[1], 2), x2, baseY - hB1 - hS1 - 38, 42, ROLE.query, 'mono', 'center')
          .glow(10, ROLE.query)
          .opacity(tot * alpha),
        txt(
          `output = [${fmt(NEW_OUTPUT[0], 2)}, ${fmt(NEW_OUTPUT[1], 2)}]`,
          0,
          395,
          36,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(8, ROLE.query)
          .opacity(tot * alpha),
      );
    } else if (sq > 0.2) {
      nodes.push(
        txt('?', x1, baseY - hB0 - hS0 - 38, 44, ROLE.query, 'mono', 'center')
          .glow(8, ROLE.query)
          .opacity(sq * alpha),
        txt('?', x2, baseY - hB1 - hS1 - 38, 44, ROLE.query, 'mono', 'center')
          .glow(8, ROLE.query)
          .opacity(sq * alpha),
        txt('What are the two totals?', 0, 395, 32, ROLE.query, 'serif', 'center')
          .glow(6, ROLE.query)
          .opacity(sq * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.sing), title, scoreLayer, mixLayer);

  // Beat 0: New reader [1, 3] -> q_new = [2.5, 3.5] -> prediction prompt (WITHHOLD scores/shares!)
  playCue(s, c, 'reader', (d) => s.play(showReader.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'new-query', (d) => s.play(showNewQ.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'predict', (d) => s.play(showPredictQ.to(1, { duration: d })), { dur: 0.45 });

  // Beat 1: Reveal dot products & gap leads AFTER each result clause!
  playCue(s, c, 'score-it', (d) => s.play(showGapBar.to(0.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'birds-score', (d) => s.play(showScoreB.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'sing-score', (d) => s.play(showScoreS.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'compare-leads', (d) => s.play(showGapBar.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'old-lead', (d) => s.play(showOldLead.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'new-lead', (d) => s.play(showNewLead.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'scale', (d) => s.play(showScaled.to(1, { duration: d })), { dur: 0.45 });

  // Beat 2: Shares (30%/70%) & Sing gains -> switch to value stacks -> withhold totals!
  playCue(s, c, 'new-shares', (d) => s.play(showShares.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'gains', (d) => s.play(showGains.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'mix', (d) => s.play(swapVis(vScore, vMix, d)), { dur: 0.65 });
  playCue(s, c, 'stack', (d) => s.play(showStacks.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'predict-sums', (d) => s.play(showSumQ.to(1, { duration: d })), { dur: 0.45 });

  // Beat 3: Reveal [1.30, 1.70] AFTER sum!
  playCue(s, c, 'sum', (d) => s.play(showTotals.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
}
