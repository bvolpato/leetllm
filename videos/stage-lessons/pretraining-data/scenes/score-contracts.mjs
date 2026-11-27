// Scene 07: Follow the labels behind a quality score: DCLM / FineWeb-Edu / CCNet + 5-record token yield strip.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  SCORE_CONTRACT_RECORDS,
  SCORE_CONTRACT_TOTAL,
  aura,
  buildSieveChamber3d,
  glassCell,
  glowBar,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  photonStream,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function scoreContracts(s, c) {
  const phase = s.value(0);
  const sieveCut = s.value(0.25);
  const showPart1 = s.value(1);
  const dclmOn = s.value(0);

  const showPart2 = s.value(0);
  const labelsOn = s.value(0);
  const ccnetOn = s.value(0);

  const showPart3 = s.value(0);
  const recordsOn = s.value(0);
  const cutVal = s.value(0);
  const yieldOn = s.value(0);
  const qualityOn = s.value(0);

  const { view: sieve3d } = buildSieveChamber3d(phase, sieveCut, { x: 380, y: -18 });
  const bgAura = aura(380, -18, 500, '#182b592c', '#ffd16614');

  const part1Live = guardedDynamic(showPart1, (a) => {
    const dc = dclmOn.value;
    const nodes = [
      heroTitle(['Model Scorers', '& Label Sources'], {
        x: -855,
        y: -430,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'STAGE 2 SCORING · DATACOMP-LM FASTTEXT',
      }).opacity(a),
      txt('3D DOCUMENT SIEVE · TOP 10% CUT', 380, -405, 26, COSMOS.gold, 'mono').opacity(a),
      txt('Gold plane = document-level cutoff', 380, 442, 26, COSMOS.muted, 'sans').opacity(a),

      txt('POSITIVE TRAINING LABELS', -855, -165, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      glassCell(-555, -75, 590, 96, COSMOS.blue, { fill: '#101a32', glow: 8, opacity: a }),
      txt('OpenHermes 2.5 + High-rated ELI5', -555, -73, 30, COSMOS.cyan, 'sans').opacity(a),

      txt('DOCUMENT-LEVEL RETENTION', -855, 45, 26, COSMOS.gold, 'mono', 'left').opacity(
        (0.35 + 0.65 * dc) * a,
      ),
      ...glowBar(-855, 118, 600, 0.1 + 0.001, {
        height: 46,
        color: COSMOS.gold,
        opacity: (0.35 + 0.65 * dc) * a,
      }),
      txt('Top 10% whole documents', -855, 195, 34, COSMOS.gold, 'mono', 'left')
        .glow(6, COSMOS.gold)
        .opacity((0.35 + 0.65 * dc) * a),
      txt(
        'Document lengths decide how many tokens actually survive',
        -855,
        280,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity((0.35 + 0.65 * dc) * a),
    ];
    return group(...nodes);
  });

  // Part 2: FineWeb-Edu 460k teacher labels + CCNet Wikipedia perplexity
  const part2Live = guardedDynamic(showPart2, (a) => {
    const lb = labelsOn.value;
    const cc = ccnetOn.value;
    const nodes = [
      txt('EDUCATIONAL & PERPLEXITY SCORERS', -855, -425, 26, COSMOS.cyan, 'mono', 'left').opacity(
        a,
      ),
      txt('FineWeb-Edu & CCNet', -855, -350, 58, COSMOS.ink, 'serif', 'left').opacity(a),

      txt(
        'FINEWEB-EDU · 460,000 TEACHER RATINGS (0 TO 5)',
        -760,
        -180,
        28,
        COSMOS.blue,
        'mono',
        'left',
      ).opacity(a),
      txt('Training split: 410,000', -760, -110, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
      ...glowBar(-760, -55, 1480, (410000 / 460000) * Math.max(0.15, lb), {
        height: 44,
        color: COSMOS.cyan,
        opacity: a,
      }),
      txt('Validation split: 50,000', -760, 42, 28, COSMOS.violet, 'mono', 'left').opacity(a),
      ...glowBar(-760, 97, 1480, (50000 / 460000) * Math.max(0.15, lb), {
        height: 44,
        color: COSMOS.violet,
        opacity: a,
      }),

      ...photonStream([-720, 195], [720, 195], -12, 0, {
        color: COSMOS.gold,
        count: 5,
        opacity: (0.4 + 0.6 * cc) * a,
      }),
      glassCell(0, 275, 1460, 114, cc > 0.3 ? COSMOS.gold : '#3a4a70', {
        fill: '#141828',
        glow: cc > 0.3 ? 9 : 3,
        opacity: (0.48 + 0.52 * cc) * a,
      }),
      txt(
        'CCNet: Lower Wikipedia-LM perplexity -> closer to reference prose',
        0,
        277,
        32,
        cc > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity((0.55 + 0.45 * cc) * a),
      txt(
        'Proxy scores rank style, not factual truth · verify facts or run code',
        0,
        405,
        28,
        COSMOS.muted,
        'sans',
      ).opacity((0.5 + 0.5 * cc) * a),
    ];

    return group(...nodes);
  });

  // Part 3: Five-record proportional token strip with moving 0.90 cutoff
  const part3Live = guardedDynamic(showPart3, (a) => {
    const recOn = recordsOn.value;
    const cut = cutVal.value;
    const yd = yieldOn.value;
    const ql = qualityOn.value;

    const totalW = 1520;
    let cursorX = -760;

    const keptList = SCORE_CONTRACT_RECORDS.filter((r) => r.score >= cut - 1e-9);
    const keptTokens = keptList.reduce((acc, r) => acc + r.tokens, 0);
    const meanScore =
      keptTokens > 0 ? keptList.reduce((acc, r) => acc + r.tokens * r.score, 0) / keptTokens : 0;

    const nodes = [
      txt(
        'PROPORTIONAL TOKEN STRIP · 1,000 TOKENS TOTAL',
        -855,
        -425,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Yield vs Mean Score', -855, -350, 56, COSMOS.ink, 'serif', 'left').opacity(a),
      txt(`CUTOFF ${cut.toFixed(2)}`, 855, -360, 44, COSMOS.gold, 'mono', 'right')
        .glow(8, COSMOS.gold)
        .opacity(a),
      txt(`MEAN ${meanScore.toFixed(3)}`, 855, -295, 30, COSMOS.cyan, 'mono', 'right').opacity(a),
    ];

    SCORE_CONTRACT_RECORDS.forEach((rec) => {
      const w = (rec.tokens / SCORE_CONTRACT_TOTAL) * totalW;
      const cx = cursorX + w * 0.5;
      const alive = rec.score >= cut - 1e-9;
      const cy = alive ? -65 : 120;
      const col = alive ? rec.color : COSMOS.dim;

      nodes.push(
        glassCell(cx, cy, w - 12, 160, col, {
          fill: alive ? '#101c31' : '#0b0e18',
          glow: alive ? 8 : 0,
          opacity: (alive ? 0.96 : 0.4) * Math.max(0.3, recOn) * a,
          dash: alive ? undefined : [8, 6],
        }),
        txt(rec.id, cx, cy - 42, 28, col, 'mono').opacity(a),
        txt(`${rec.tokens}`, cx, cy + 4, 34, alive ? COSMOS.ink : COSMOS.dim, 'mono').opacity(a),
        txt(
          rec.score.toFixed(2),
          cx,
          cy + 48,
          28,
          alive ? COSMOS.gold : COSMOS.dim,
          'mono',
        ).opacity(a),
      );
      cursorX += w;
    });

    // Divider between retained (top) and dropped (bottom) + persistent drop zone silhouette
    nodes.push(
      glowingTrail(
        [
          [-780, 28],
          [780, 28],
        ],
        {
          color: COSMOS.gold,
          width: 3.0,
          glow: 8,
          opacity: (0.45 + 0.55 * Math.min(1, cut * 4)) * a,
        },
      ),
    );
    if (cut < 0.15) {
      nodes.push(
        glassCell(0, 145, 1500, 140, '#3a4a70', {
          fill: '#0b1020',
          glow: 2,
          opacity: (1 - cut / 0.15) * 0.72 * a,
          dash: [12, 8],
        }),
        txt(
          'Records below the cutoff drop into this excluded zone',
          0,
          147,
          28,
          COSMOS.dim,
          'mono',
        ).opacity((1 - cut / 0.15) * 0.85 * a),
      );
    }

    nodes.push(
      txt(
        yd > 0.5
          ? `${keptTokens} / ${SCORE_CONTRACT_TOTAL} tokens retained = ${Math.round((100 * keptTokens) / SCORE_CONTRACT_TOTAL)}%`
          : 'Batch total: 1,000 tokens across 5 scored records',
        0,
        292,
        yd > 0.5 ? 44 : 34,
        yd > 0.5 ? COSMOS.cyan : COSMOS.muted,
        'mono',
      )
        .glow(yd > 0.5 ? 8 : 0, COSMOS.cyan)
        .opacity(a),
    );
    if (ql > 0.02) {
      nodes.push(
        txt(
          'Higher cutoffs cut yield · test target tasks',
          0,
          390,
          30,
          COSMOS.emerald,
          'sans',
        ).opacity(ql * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, sieve3d, part1Live, part2Live, part3Live);
  runPhase(s, c, phase, 16);
  orbitScene(
    s,
    c,
    sieve3d,
    { theta: -0.15, phi: 0.94 },
    { startOffset: 0.1, endMargin: Math.max(0.55, c.end - c.beats[1].start + 0.4) },
  );

  c.on('pt-score-contracts-dclm', () => {
    const dur = remainDuration(c, 'pt-score-contracts-dclm', 0.8);
    s.play(dclmOn.to(1, { duration: dur }));
    s.play(sieveCut.to(0.85, { duration: dur }));
  });

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide(1, [sieve3d], { fade: 0.2 });

  c.on('pt-score-contracts-labels', () =>
    s.play(labelsOn.to(1, { duration: remainDuration(c, 'pt-score-contracts-labels', 0.9) })),
  );
  c.on('pt-score-contracts-ccnet', () =>
    s.play(ccnetOn.to(1, { duration: remainDuration(c, 'pt-score-contracts-ccnet', 0.6) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-score-contracts-records', () =>
    s.play(recordsOn.to(1, { duration: remainDuration(c, 'pt-score-contracts-records', 0.5) })),
  );
  c.on('pt-score-contracts-cut', () =>
    s.play(cutVal.to(0.9, { duration: remainDuration(c, 'pt-score-contracts-cut', 0.9) })),
  );
  c.after('pt-score-contracts-yield', () =>
    s.play(yieldOn.to(1, { duration: remainAfterDuration(c, 'pt-score-contracts-yield', 0.45) })),
  );
  c.on('pt-score-contracts-quality', () =>
    s.play(qualityOn.to(1, { duration: remainDuration(c, 'pt-score-contracts-quality', 0.5) })),
  );
}
