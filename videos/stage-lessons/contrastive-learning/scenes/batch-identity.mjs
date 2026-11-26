// Scene 14: batch-identity - "Which passages did the query see?"
// Pure Cinema: glowing 6x6 InfoNCE similarity matrix building from 1x1 -> two 3x3 microbatches ->
// prediction hold on empty cross-batch corners -> full 30-negative gathered pool ignition!
import { rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  txt,
  verifyInvariant,
} from '../parts.mjs';

export default function batchIdentity(s, c) {
  const ids = ['A', 'B', 'C', 'D', 'E', 'F'];
  const half = 3;
  const onePool = half * (half - 1); // 6
  const separate = 2 * onePool; // 12
  const joined = ids.length * (ids.length - 1); // 30
  verifyInvariant(joined - separate === 18, '18 cross-batch off-diagonal comparisons');

  const showAlone = s.value(0);
  const showThree = s.value(0);
  const showSecond = s.value(0);
  const showPredict = s.value(0);
  const showSeparate = s.value(0);
  const showGather = s.value(0);
  const showTotal = s.value(0);
  const showAudit = s.value(0);

  const title = heroTitle(['Which passages did', 'the query actually see?'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.competitor,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const a1 = showAlone.value;
    const b1 = showThree.value;
    const b2 = showSecond.value;
    const pr = showPredict.value;
    const sp = showSeparate.value;
    const ga = showGather.value;
    const tot = showTotal.value;
    const au = showAudit.value;
    const nodes = [];

    // Left: 6x6 InfoNCE matrix centered around (-420, 65)
    const cell = 84;
    const gap = 12;
    const step = cell + gap;
    const leftX = -715;
    const topY = -205;

    for (let k = 0; k < 6; k++) {
      nodes.push(
        txt(
          `p${ids[k]}`,
          leftX + k * step + cell / 2,
          topY - 36,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt(
          `q${ids[k]}`,
          leftX - 42,
          topY + k * step + cell / 2,
          28,
          COSMOS.muted,
          'mono',
          'right',
        ),
      );
    }

    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const cx = leftX + j * step + cell / 2;
        const cy = topY + i * step + cell / 2;
        const isDiag = i === j;
        const sameBlock = Math.floor(i / half) === Math.floor(j / half);

        let vis = 0;
        if (i === 0 && j === 0) vis = Math.max(a1, b1);
        else if (sameBlock && i < half) vis = b1;
        else if (sameBlock && i >= half) vis = b2;
        else vis = ga;

        // Base empty dark-cosmos cell slot always visible
        nodes.push(
          lumBar(cx, cy, cell, cell, {
            color: '#344670',
            fillAlpha: 0.14,
            strokeWidth: 1.4,
            glow: 0,
            radius: 8,
          }),
        );

        if (vis > 0.05) {
          const col = isDiag ? ROLE.positive : ROLE.competitor;
          nodes.push(
            lumBar(cx, cy, cell - 4, cell - 4, {
              color: col,
              fillAlpha: isDiag ? 0.52 : 0.34,
              strokeWidth: isDiag ? 2.8 : 2.0,
              glow: isDiag ? 10 : 6,
              radius: 8,
              opacity: vis,
            }),
            txt(isDiag ? '+' : '−', cx, cy, 32, COSMOS.ink, 'mono', 'center').opacity(vis),
          );
        }
      }
    }

    // Highlight dashed gold frames around the empty cross-batch corners during prediction hold!
    if ((pr > 0.05 || sp > 0.05) && ga < 0.3) {
      const boxOp = Math.max(pr, sp) * (1 - ga * 3);
      const blkSize = 3 * cell + 2 * gap + 8;
      nodes.push(
        rect(blkSize, blkSize, {
          fill: null,
          stroke: ROLE.focus,
          width: 3.2,
          dash: [10, 8],
          radius: 10,
        })
          .at(leftX + 3 * step + 1.5 * cell + gap, topY + 1.5 * cell + gap)
          .glow(8, ROLE.focus)
          .opacity(boxOp),
        rect(blkSize, blkSize, {
          fill: null,
          stroke: ROLE.focus,
          width: 3.2,
          dash: [10, 8],
          radius: 10,
        })
          .at(leftX + 1.5 * cell + gap, topY + 3 * step + 1.5 * cell + gap)
          .glow(8, ROLE.focus)
          .opacity(boxOp),
      );
    }

    // Audit highlight ring on one off-diagonal pink cell (qA, pB)
    if (au > 0.05) {
      const ax = leftX + 1 * step + cell / 2;
      const ay = topY + 0 * step + cell / 2;
      nodes.push(
        rect(cell + 10, cell + 10, { fill: null, stroke: ROLE.focus, width: 4, radius: 10 })
          .at(ax, ay)
          .glow(12, ROLE.focus)
          .opacity(au),
      );
    }

    // Right side: Live comparison metrics & legend (clean floating typography)
    const rx = 125;
    nodes.push(
      rule(60, -320, 60, 415, COSMOS.rule, 1.8).opacity(0.55),
      txt('ONE ROW PER QUERY', rx, -280, 30, ROLE.anchor, 'mono', 'left').glow(5, ROLE.anchor),
      glowDot(rx + 12, -218, { radius: 8, color: ROLE.positive, glow: 10 }),
      txt('Diagonal (+): assigned positive pair', rx + 36, -218, 28, ROLE.positive, 'sans', 'left'),
      glowDot(rx + 12, -168, { radius: 8, color: ROLE.competitor, glow: 10 }),
      txt(
        'Off-diagonal (−): competing passage',
        rx + 36,
        -168,
        28,
        ROLE.competitor,
        'sans',
        'left',
      ),
      rule(rx, -122, 845, -122, COSMOS.rule, 1.4).opacity(0.5),
    );

    // Dynamic telemetry counters (always accurate for current stage!)
    const encCount = b2 > 0.3 ? 12 : b1 > 0.3 ? 6 : a1 > 0.3 ? 2 : 0;
    const negCount = tot > 0.3 ? joined : b2 > 0.3 ? separate : b1 > 0.3 ? onePool : 0;

    nodes.push(
      txt('TEXT ENCODINGS', rx, -62, 26, COSMOS.muted, 'mono', 'left'),
      txt(String(encCount), rx + 420, -62, 46, ROLE.anchor, 'mono', 'left').glow(7, ROLE.anchor),
      txt('OFF-DIAGONAL SCORES', rx, 32, 26, COSMOS.muted, 'mono', 'left'),
      txt(String(negCount), rx + 420, 32, 46, ROLE.competitor, 'mono', 'left').glow(
        7,
        ROLE.competitor,
      ),
    );

    // State-specific bottom right commentary (strictly mutually exclusive)
    if (au > 0.05) {
      nodes.push(
        txt('FALSE-NEGATIVE RISK', rx, 175, 28, ROLE.focus, 'mono', 'left')
          .glow(6, ROLE.focus)
          .opacity(au),
        txt(
          'Pink marks a competitor in the loss,',
          rx,
          226,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(au),
        txt(
          'even if two columns hold the same guide.',
          rx,
          268,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(au),
      );
    } else if (tot > 0.05) {
      nodes.push(
        txt('GATHERED POOL: N(N − 1) = 6 × 5 = 30', rx, 185, 30, ROLE.positive, 'mono', 'left')
          .glow(6, ROLE.positive)
          .opacity(tot),
        txt(
          'Same 12 encodings · quadratic score matrix',
          rx,
          240,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(tot),
      );
    } else if (sp > 0.05 && ga < 0.3) {
      const op = sp * (1 - ga * 3);
      nodes.push(
        txt('CORNERS STAY EMPTY', rx, 185, 32, ROLE.focus, 'mono', 'left')
          .glow(7, ROLE.focus)
          .opacity(op),
        txt(
          'Gradient accumulation adds gradients after',
          rx,
          238,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(op),
        txt(
          'each batch already used its own denominator.',
          rx,
          280,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(op),
      );
    } else if (pr > 0.05) {
      nodes.push(
        txt('Does accumulating gradients fill', rx, 195, 34, ROLE.focus, 'serif', 'left')
          .glow(7, ROLE.focus)
          .opacity(pr),
        txt('the two empty cross-batch corners?', rx, 245, 34, ROLE.focus, 'serif', 'left')
          .glow(7, ROLE.focus)
          .opacity(pr),
      );
    } else if (a1 > 0.05 && b1 < 0.3) {
      nodes.push(
        txt(
          'A alone: 1/1 probability -> loss = 0',
          rx,
          195,
          30,
          ROLE.focus,
          'mono',
          'left',
        ).opacity(a1 * (1 - b1 * 3)),
      );
    } else {
      nodes.push(
        txt(
          'Batch size B gives B(B − 1) in-batch negatives',
          rx,
          195,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.competitor), title, stageLayer);

  playOn(s, c, 'batch-alone', (d) => showAlone.to(1, { duration: d }), 0.45);
  playOn(s, c, 'batch-three', (d) => showThree.to(1, { duration: d }), 0.55);
  playOn(s, c, 'batch-second', (d) => showSecond.to(1, { duration: d }), 0.55);
  playOn(s, c, 'batch-predict', (d) => showPredict.to(1, { duration: d }), 0.45);
  playAfter(
    s,
    c,
    'batch-separate',
    (d) => [showPredict.to(0, { duration: d * 0.35 }), showSeparate.to(1, { duration: d })],
    0.45,
  );
  playOn(s, c, 'batch-gather', (d) => showGather.to(1, { duration: d }), 0.75);
  playAfter(s, c, 'batch-total', (d) => showTotal.to(1, { duration: d }), 0.45);
  playOn(s, c, 'batch-audit', (d) => showAudit.to(1, { duration: d }), 0.5);
}
