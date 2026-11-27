// Scene 12: agreement - How often do the labels agree?
// Signature Cohen's Kappa Geometric Construction:
//   Mode 0 (Beats 0-2): 8 paired human-vs-judge tracks (strict prediction pause on Beat 0!),
//   lighting up 6/8 = 75% observed agreement, 23/64 = 35.9% expected baseline, kappa = 0.61,
//   and highlighting the 2 distinct off-diagonal misses (Case 6 & Case 7).
//   Mode 1 (Beat 3): Live 8x8 = 64-square glowing Cartesian product grid illuminating
//   3x4=12 compact (emerald), 3x3=9 stepwise (cyan), 2x1=2 tie (gold) = 23/64, then
//   projecting earned gain (48 - 23) / (64 - 23) = 25/41 ~ 0.6098 with glowing MathJax!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  expected,
  fadeInHalf,
  fadeOutHalf,
  glowMeter,
  glowTex,
  guardedDynamic,
  human,
  humanCounts,
  judge,
  judgeCounts,
  kappa,
  matches,
  observed,
  txt,
} from '../parts.mjs';

const SHORT = { compact: 'C', stepwise: 'S', tie: 'T' };
const COL = { compact: ROLE.compact, stepwise: ROLE.stepwise, tie: ROLE.tie };

export default function agreement(s, c) {
  const pulse = s.value(0);
  const sampleRowHi = s.value(0);
  const obsReveal = s.value(0);
  const expReveal = s.value(0);
  const kapReveal = s.value(0);
  const confHi = s.value(0);
  const gridMode = s.value(0); // 0 = 8 paired rows, 1 = 8x8 = 64-square chance product lattice
  const blockCompact = s.value(0);
  const blockStep = s.value(0);
  const blockTie = s.value(0);
  const baseFracOn = s.value(0);
  const obsFracOn = s.value(0);
  const earnedOn = s.value(0);

  const header = cinemaHeader('COHEN’S KAPPA GEOMETRY', 'How often do the', 'labels agree?', {
    accent: ROLE.ok,
    size: 50,
  });

  const stageAura = aura(240, 40, 650, '#6ee7b71e', '#ffd16618');

  const kappaEq = glowTex(
    String.raw`\kappa = \frac{48 - 23}{64 - 23} = \frac{25}{41} \approx 0.6098`,
    { x: -505, y: 270, size: 36, color: ROLE.ok, glow: 8 },
  );

  // Mode 0: 8 paired rows + agreement bars
  const mode0 = guardedDynamic(
    () => fadeOutHalf(gridMode.value),
    (a) => {
      const sr = sampleRowHi.value;
      const ob = obsReveal.value;
      const ex = expReveal.value;
      const kp = kapReveal.value;
      const cf = confHi.value;
      const nodes = [];

      nodes.push(
        txt('CASE', -840, -185, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt('HUMAN', -660, -185, 26, ROLE.human, 'mono', 'center').opacity(a),
        txt('JUDGE', -410, -185, 26, ROLE.stepwise, 'mono', 'center').opacity(a),
        line([-850, -155], [-230, -155], { stroke: '#2a3a62', width: 2 }).opacity(a),
      );

      for (let i = 0; i < human.length; i++) {
        const y = -112 + i * 68;
        const hL = human[i];
        const jL = judge[i];
        const isMatch = hL === jL;
        const isMiss = !isMatch;
        const hiSample = (i === 5 || i === 7) && sr > 0.3 && ob < 0.3;
        const hiMiss = isMiss && cf > 0.3;

        nodes.push(
          txt(
            `#${i + 1}`,
            -830,
            y,
            26,
            hiMiss ? ROLE.conflict : hiSample ? ROLE.verdict : COSMOS.muted,
            'mono',
            'left',
          ).opacity(a),
          txt(hL, -660, y, 28, COL[hL], 'mono', 'center').opacity(a),
          txt(jL, -410, y, 28, COL[jL], 'mono', 'center').opacity(a),
        );

        // Withhold match markers until `observed-matches`!
        if (ob > 0.05) {
          nodes.push(
            txt(
              isMatch ? 'MATCH' : 'MISS',
              -240,
              y,
              26,
              isMatch ? ROLE.ok : ROLE.conflict,
              'mono',
              'left',
            )
              .glow(hiMiss ? 9 : 0, ROLE.conflict)
              .opacity(a * ob),
          );
        }
      }

      // Right side: prediction prompt -> 3 precision meters (p_o, p_e, kappa)
      const rx = 120;
      if (ob < 0.05) {
        nodes.push(
          txt('How many of the 8 rows match', rx, -40, 34, ROLE.verdict, 'serif', 'left')
            .glow(6, ROLE.verdict)
            .opacity(a),
          txt('when you include Case 8’s tie?', rx, 16, 34, ROLE.verdict, 'serif', 'left')
            .glow(6, ROLE.verdict)
            .opacity(a),
        );
      }
      if (ob > 0.05) {
        nodes.push(
          txt(
            `RAW AGREEMENT p_o = ${matches}/${human.length} = ${(observed * 100).toFixed(0)}%`,
            rx,
            -145,
            28,
            ROLE.ok,
            'mono',
            'left',
          )
            .glow(6, ROLE.ok)
            .opacity(a * ob),
          glowMeter(rx, -98, 660, 28, observed, { fill: ROLE.ok, opacity: a * ob }),
        );
      }
      if (ex > 0.05) {
        nodes.push(
          txt(
            `CHANCE BASELINE p_e = 23/64 ≈ ${(expected * 100).toFixed(1)}%`,
            rx,
            -8,
            28,
            ROLE.verdict,
            'mono',
            'left',
          )
            .glow(6, ROLE.verdict)
            .opacity(a * ex),
          glowMeter(rx, 40, 660, 28, expected, { fill: ROLE.verdict, opacity: a * ex }),
        );
      }
      if (kp > 0.05) {
        nodes.push(
          txt(`COHEN’S KAPPA κ ≈ ${kappa.toFixed(2)}`, rx, 132, 32, ROLE.stepwise, 'mono', 'left')
            .glow(8, ROLE.stepwise)
            .opacity(a * kp),
          glowMeter(rx, 184, 660, 28, kappa, { fill: ROLE.stepwise, opacity: a * kp }),
        );
      }
      if (cf > 0.05) {
        nodes.push(
          txt('CONFUSION DETAIL:', rx, 278, 26, ROLE.policy, 'mono', 'left').opacity(a * cf),
          txt(
            'Case 6: human stepwise -> judge compact',
            rx,
            322,
            26,
            ROLE.conflict,
            'sans',
            'left',
          ).opacity(a * cf),
          txt(
            'Case 7: human tie -> judge stepwise',
            rx,
            366,
            26,
            ROLE.conflict,
            'sans',
            'left',
          ).opacity(a * cf),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: 8x8 = 64-square Cartesian product lattice
  // Order human rows: [C, C, C, S, S, S, T, T] (3, 3, 2)
  // Order judge cols: [C, C, C, C, S, S, S, T] (4, 3, 1)
  const hOrder = [
    'compact',
    'compact',
    'compact',
    'stepwise',
    'stepwise',
    'stepwise',
    'tie',
    'tie',
  ];
  const jOrder = [
    'compact',
    'compact',
    'compact',
    'compact',
    'stepwise',
    'stepwise',
    'stepwise',
    'tie',
  ];

  const mode1 = guardedDynamic(
    () => fadeInHalf(gridMode.value),
    (a) => {
      const bc = blockCompact.value;
      const bs = blockStep.value;
      const bt = blockTie.value;
      const bf = baseFracOn.value;
      const of = obsFracOn.value;
      const ea = earnedOn.value;
      const nodes = [];

      const cell = 72;
      const gap = 8;
      const step = cell + gap;
      const gX0 = 160;
      const gY0 = -315;

      nodes.push(
        txt(
          'JUDGE MARGINALS  (4C · 3S · 1T)',
          gX0 + 3.5 * step,
          gY0 - 82,
          26,
          ROLE.stepwise,
          'mono',
          'center',
        ).opacity(a),
        txt('HUMAN', gX0 - 148, gY0 + 3.5 * step - 20, 26, ROLE.human, 'mono', 'center').opacity(a),
        txt('3C·3S·2T', gX0 - 148, gY0 + 3.5 * step + 16, 26, ROLE.human, 'mono', 'center').opacity(
          a,
        ),
      );

      for (let r = 0; r < 8; r++) {
        const hl = hOrder[r];
        nodes.push(
          txt(
            SHORT[hl],
            gX0 - 44,
            gY0 + r * step + cell * 0.5,
            26,
            COL[hl],
            'mono',
            'center',
          ).opacity(a),
        );
        for (let col = 0; col < 8; col++) {
          const jl = jOrder[col];
          if (r === 0) {
            nodes.push(
              txt(
                SHORT[jl],
                gX0 + col * step + cell * 0.5,
                gY0 - 34,
                26,
                COL[jl],
                'mono',
                'center',
              ).opacity(a),
            );
          }
          const same = hl === jl;
          let lit = 0;
          if (same && hl === 'compact') lit = bc;
          if (same && hl === 'stepwise') lit = bs;
          if (same && hl === 'tie') lit = bt;
          const fill = lit > 0.2 ? COL[hl] : '#0e1529';
          const stroke = lit > 0.2 ? COL[hl] : '#233154';
          const sq = rect(cell, cell, { fill, stroke, width: lit > 0.2 ? 2.6 : 1.4, radius: 7 })
            .at(gX0 + col * step + cell * 0.5, gY0 + r * step + cell * 0.5)
            .opacity(a * (lit > 0.2 ? 0.85 : 0.65));
          if (lit > 0.4) sq.glow(7, COL[hl]);
          nodes.push(sq);
        }
      }

      // Left arithmetic breakdown (64 total cells -> 12 + 9 + 2 = 23 -> 48 - 23 = 25 / 41)
      nodes.push(
        txt(
          '8 × 8 = 64 EQUALLY WEIGHTED PAIRS',
          -840,
          -185,
          26,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(a),
      );
      if (bc > 0.05) {
        nodes.push(
          txt(
            `compact:  ${humanCounts.compact} × ${judgeCounts.compact} = 12 squares`,
            -840,
            -120,
            28,
            ROLE.compact,
            'mono',
            'left',
          ).opacity(a * bc),
        );
      }
      if (bs > 0.05) {
        nodes.push(
          txt(
            `stepwise: ${humanCounts.stepwise} × ${judgeCounts.stepwise} =  9 squares`,
            -840,
            -70,
            28,
            ROLE.stepwise,
            'mono',
            'left',
          ).opacity(a * bs),
        );
      }
      if (bt > 0.05) {
        nodes.push(
          txt(
            `tie:      ${humanCounts.tie} × ${judgeCounts.tie} =  2 squares`,
            -840,
            -20,
            28,
            ROLE.tie,
            'mono',
            'left',
          ).opacity(a * bt),
        );
      }
      if (bf > 0.05) {
        nodes.push(
          txt('CHANCE BASELINE:  23 / 64', -840, 56, 30, ROLE.verdict, 'mono', 'left')
            .glow(6, ROLE.verdict)
            .opacity(a * bf),
        );
      }
      if (of > 0.05) {
        nodes.push(
          txt('OBSERVED (6/8):   48 / 64', -840, 112, 30, ROLE.ok, 'mono', 'left')
            .glow(6, ROLE.ok)
            .opacity(a * of),
        );
      }
      if (ea > 0.05) {
        nodes.push(
          txt(
            'GAINED 25 OF 41 POSSIBLE ABOVE CHANCE',
            -840,
            180,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(a * ea),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, mode0, mode1);

  c.on('human-labels', () => {
    s.play(pulse.to(0.3, { duration: clampDur(c, c.cue('human-labels').start, 0.25) }));
  });
  c.on('sample-rows', () => {
    s.play(sampleRowHi.to(1, { duration: clampDur(c, c.cue('sample-rows').start, 0.35) }));
  });
  c.on('count-rows', () => {
    s.play(sampleRowHi.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding: reveal 6/8, 36%, and 0.61 AFTER their spoken clauses!
  c.after('observed-matches', () => {
    s.play(obsReveal.to(1, { duration: clampDur(c, c.cue('observed-matches').end, 0.35) }));
  });
  c.after('expected-matches', () => {
    s.play(expReveal.to(1, { duration: clampDur(c, c.cue('expected-matches').end, 0.35) }));
  });
  c.after('adjust-agreement', () => {
    s.play(kapReveal.to(1, { duration: clampDur(c, c.cue('adjust-agreement').end, 0.35) }));
  });
  c.on('report-confusion', () => {
    s.play(confHi.to(1, { duration: clampDur(c, c.cue('report-confusion').start, 0.35) }));
  });

  // Beat 3: Morph into 8x8 = 64-square lattice
  c.on('chance-products', () => {
    s.play(gridMode.to(1, { duration: clampDur(c, c.cue('chance-products').start, 0.35) }));
  });
  c.on('compact-product', () => {
    s.play(blockCompact.to(1, { duration: clampDur(c, c.cue('compact-product').start, 0.35) }));
  });
  c.on('step-product', () => {
    s.play(blockStep.to(1, { duration: clampDur(c, c.cue('step-product').start, 0.35) }));
  });
  c.on('tie-product', () => {
    s.play(blockTie.to(1, { duration: clampDur(c, c.cue('tie-product').start, 0.35) }));
  });
  c.after('chance-baseline', () => {
    s.play(baseFracOn.to(1, { duration: clampDur(c, c.cue('chance-baseline').end, 0.35) }));
  });
  c.after('chance-observed', () => {
    s.play(obsFracOn.to(1, { duration: clampDur(c, c.cue('chance-observed').end, 0.35) }));
  });
  c.show('earned-kappa', kappaEq, { after: true });
  c.after('earned-kappa', () => {
    s.play(earnedOn.to(1, { duration: clampDur(c, c.cue('earned-kappa').end, 0.35) }));
  });
}
