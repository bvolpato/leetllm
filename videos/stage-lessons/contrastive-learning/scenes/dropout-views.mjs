// Scene 12: dropout-views - "Two stochastic views preserve one sentence identity"
// Pure Cinema: one sentence splitting into two glowing stochastic hidden-state grids with animated
// dropout masks, switching to deterministic eval mode, STS benchmark bars, and token-deletion hazards.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowMatrix,
  guardedDynamic,
  heroTitle,
  lumBar,
  playAfter,
  playOn,
  rule,
  txt,
} from '../parts.mjs';

export default function dropoutViews(s, c) {
  const dropOn = s.value(0); // 0 = all 1s, 1 = masks active
  const evalMode = s.value(0); // 1 = eval mode deterministic
  const showHist = s.value(0);
  const showNot = s.value(0);
  const strikeNot = s.value(0);

  const title = heroTitle(['Unsupervised SimCSE:', 'two dropout views of one sentence'], {
    x: -860,
    y: -450,
    size: 44,
    lineHeight: 52,
    accent: ROLE.anchor,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const dp = dropOn.value;
    const ev = evalMode.value;
    const hs = showHist.value;
    const sn = showNot.value;
    const st = strikeNot.value;
    const nodes = [];

    // Top focal sentence pill + branching arrows into Pass 1 and Pass 2
    nodes.push(
      lumBar(0, -295, 440, 62, { color: ROLE.anchor, fillAlpha: 0.22, glow: 8, radius: 12 }),
      txt('"A dog is running"', 0, -295, 34, COSMOS.ink, 'serif', 'center'),
      arrow([-225, -278], [-395, -205], { stroke: ROLE.anchor, width: 3, tip: 12 }),
      arrow([225, -278], [395, -205], { stroke: ROLE.positive, width: 3, tip: 12 }),
    );

    const isMasked = dp > 0.4 && ev < 0.5;
    const modeTag =
      ev > 0.5
        ? 'EVAL MODE: DROPOUT OFF  (REPEATABLE VECTOR)'
        : isMasked
          ? 'TRAIN MODE: INDEPENDENT DROPOUT MASKS  ->  POSITIVE PAIR'
          : 'SHARED ENCODER WEIGHTS  (TWO PASSES)';
    const modeCol = ev > 0.5 ? ROLE.focus : isMasked ? ROLE.positive : COSMOS.muted;
    nodes.push(
      txt(modeTag, 0, 66, 26, modeCol, 'mono', 'center').glow(
        ev > 0.5 || isMasked ? 5 : 0,
        modeCol,
      ),
    );

    // Left Grid: Pass 1 (mask z1 zeros row 0, col 1)
    const vals1 = [
      ['1', isMasked ? '0' : '1', '1', '1'],
      ['1', '1', '1', '1'],
    ];
    const vals2 = [
      ['1', '1', '1', '1'],
      ['1', '1', isMasked ? '0' : '1', '1'],
    ];
    nodes.push(
      glowMatrix({
        cx: -430,
        cy: -40,
        rows: 2,
        cols: 4,
        cellW: 108,
        cellH: 66,
        gap: 12,
        values: vals1,
        colLabels: ['Pass 1', isMasked ? 'mask z₁' : 'all on', '', ''],
        colors: vals1.map((r) => r.map((v) => (v === '0' ? ROLE.competitor : ROLE.anchor))),
        highlight: (r, k) => isMasked && r === 0 && k === 1,
        dim: (r, k) => isMasked && r === 0 && k === 1,
        fontSize: 32,
      }),
      glowMatrix({
        cx: 430,
        cy: -40,
        rows: 2,
        cols: 4,
        cellW: 108,
        cellH: 66,
        gap: 12,
        values: vals2,
        colLabels: ['Pass 2', isMasked ? 'mask z₂' : 'all on', '', ''],
        colors: vals2.map((r) => r.map((v) => (v === '0' ? ROLE.competitor : ROLE.positive))),
        highlight: (r, k) => isMasked && r === 1 && k === 2,
        dim: (r, k) => isMasked && r === 1 && k === 2,
        fontSize: 32,
      }),
    );

    // Center pairing indicator between the two grids
    nodes.push(
      txt(
        ev > 0.5 ? 'z₁ = z₂' : 'z₁ ≠ z₂',
        0,
        -40,
        34,
        ev > 0.5 ? ROLE.focus : ROLE.positive,
        'mono',
        'center',
      ).glow(6, ev > 0.5 ? ROLE.focus : ROLE.positive),
    );

    // Horizontal hairline separator before bottom section
    nodes.push(rule(-850, 100, 850, 100, COSMOS.rule, 1.8).opacity(0.55));

    // Bottom region: STS benchmark bars -> swaps cleanly to meaning-flipping deletion hazard
    if (sn < 0.5) {
      const bOp = 1 - sn * 2;
      nodes.push(
        txt(
          'SimCSE BERT-base STS  (Spearman × 100, historical benchmark)',
          0,
          148,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(bOp),
      );
      if (hs > 0.05) {
        const bars = [
          { lbl: 'Unsupervised SimCSE', val: 76.3, col: ROLE.anchor, y: 222 },
          { lbl: 'Supervised SimCSE', val: 81.6, col: ROLE.positive, y: 298 },
        ];
        bars.forEach((b) => {
          const bw = (b.val / 100) * 760 * hs;
          nodes.push(
            txt(b.lbl, -790, b.y, 28, b.col, 'sans', 'left').opacity(hs * bOp),
            lumBar(-340 + bw / 2, b.y, Math.max(8, bw), 36, {
              color: b.col,
              fillAlpha: 0.44,
              glow: 8,
              radius: 7,
              opacity: hs * bOp,
            }),
            txt(b.val.toFixed(1), -340 + bw + 24, b.y, 32, b.col, 'mono', 'left')
              .glow(5, b.col)
              .opacity(hs * bOp),
          );
        });
      } else {
        nodes.push(
          txt(
            'Other sentences in the batch supply negatives (still audit for false negatives)',
            0,
            250,
            28,
            COSMOS.dim,
            'sans',
            'center',
          ).opacity(bOp),
        );
      }
    } else {
      const op = (sn - 0.5) * 2;
      nodes.push(
        txt(
          'AUGMENTATION HAZARD: DELETING ONE TOKEN FLIPS MEANING',
          0,
          150,
          28,
          ROLE.competitor,
          'mono',
          'center',
        )
          .glow(6, ROLE.competitor)
          .opacity(op),
      );
      const toks = ['must', 'not', 'rotate'];
      toks.forEach((tk, idx) => {
        const tx = -260 + idx * 260;
        const isBad = idx === 1 && st > 0.2;
        nodes.push(
          lumBar(tx, 250, 210, 74, {
            color: isBad ? ROLE.competitor : ROLE.anchor,
            fillAlpha: isBad ? 0.34 : 0.2,
            strokeWidth: isBad ? 3.2 : 2.2,
            glow: isBad ? 11 : 6,
            radius: 10,
            opacity: op,
          }),
          txt(tk, tx, 250, 36, isBad ? ROLE.competitor : COSMOS.ink, 'mono', 'center').opacity(op),
        );
        if (isBad) {
          nodes.push(
            txt('deleted', tx, 320, 26, ROLE.competitor, 'mono', 'center')
              .glow(6, ROLE.competitor)
              .opacity(st * op),
          );
        }
      });
      nodes.push(
        txt(
          'Verify paraphrases, negations, version rules, and cross-encoder labels independently',
          0,
          402,
          28,
          ROLE.focus,
          'sans',
          'center',
        ).opacity(op),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.positive), title, stageLayer);

  playOn(s, c, 'cl-dropout-views-masks', (d) => dropOn.to(1, { duration: d }), 0.6);
  playOn(s, c, 'cl-dropout-views-off', (d) => evalMode.to(1, { duration: d }), 0.75);
  playAfter(s, c, 'cl-dropout-views-historical', (d) => showHist.to(1, { duration: d }), 0.65);
  playOn(
    s,
    c,
    'cl-dropout-views-not',
    (d) => [showNot.to(1, { duration: d * 0.55 }), strikeNot.to(1, { duration: d })],
    0.85,
  );
}
