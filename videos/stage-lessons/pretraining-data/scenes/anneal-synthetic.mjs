// Scene 24: Control both the late mixture and its evidence: LR cooldown annealing, synthetic lineage tree, and replacement collapse vs accumulation preserving rare tails.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  photonStream,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function annealSynthetic(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const fortyP = s.value(0);
  const compareOn = s.value(0);

  const showPart2 = s.value(0);
  const genOn = s.value(0);
  const provOn = s.value(0);

  const showPart3 = s.value(0);
  const retainOn = s.value(0);
  const floorOn = s.value(0);

  const bgAura = aura(0, 0, 650, '#16284f2a', '#6ee7b714');

  // Part 1: Learning-rate linear cooldown to zero over final 40M tokens + matched probe comparison
  const part1Live = guardedDynamic(showPart1, (a) => {
    const fp = fortyP.value;
    const cm = compareOn.value;

    const gx0 = -720;
    const gx1 = 720;
    const gyBase = 175;
    const gyTop = -120;
    const curX = gx0 + (gx1 - gx0) * Math.max(0.08, fp);
    const curY = gyTop + (gyBase - gyTop) * Math.max(0.08, fp);

    const nodes = [
      heroTitle(['Late-Stage Annealing', '& Cooldown Probes'], {
        x: -855,
        y: -435,
        size: 54,
        lineHeight: 64,
        accent: COSMOS.cyan,
        eyebrow: 'DATA ANNEALING · FINAL 40M TOKENS + UPSAMPLED MIX',
      }).opacity(a),

      // Axes
      line([gx0, gyBase], [gx1, gyBase], { stroke: '#4d6088', width: 3 }).opacity(a),
      line([gx0, gyBase], [gx0, gyTop - 40], { stroke: '#4d6088', width: 3 }).opacity(a),
      txt('LR', gx0 - 24, gyTop - 20, 26, COSMOS.muted, 'mono', 'right').opacity(a),
      txt('0', gx0 - 24, gyBase + 4, 26, COSMOS.muted, 'mono', 'right').opacity(a),
      txt('Start checkpoint', gx0, gyBase + 48, 26, COSMOS.blue, 'mono', 'left').opacity(a),
      txt('Final 40M tokens (LR -> 0)', gx1, gyBase + 48, 28, COSMOS.gold, 'mono', 'right')
        .glow(6, COSMOS.gold)
        .opacity((0.3 + 0.7 * fp) * a),

      // Glowing linear cooldown ramp
      glowingTrail(
        [
          [gx0, gyTop],
          [curX, curY],
        ],
        {
          gradientColors: [
            [0, COSMOS.blue],
            [0.5, COSMOS.cyan],
            [1, COSMOS.gold],
          ],
          width: 6,
          glow: 12,
          opacity: a,
        },
      ),
      glowDot(curX, curY, { radius: 10, color: COSMOS.gold, glow: 14, opacity: a }),
    ];

    if (cm > 0.02) {
      nodes.push(
        glassCell(0, 325, 1360, 108, COSMOS.emerald, { fill: '#0e2226', glow: 9, opacity: cm * a }),
        txt(
          'Compare candidate mixtures A vs B from the SAME checkpoint · check target gains & lost coverage',
          0,
          327,
          28,
          COSMOS.emerald,
          'sans',
        ).opacity(cm * a),
      );
    }

    return group(...nodes);
  });

  // Part 2: Synthetic data branching from retained human source R1 -> G1, G2 with provenance & test validation
  const part2Live = guardedDynamic(showPart2, (a) => {
    const gn = genOn.value;
    const pr = provOn.value;
    const ph = phase.value;

    const nodes = [
      txt(
        'TARGETED SYNTHETIC SUPPLEMENTATION · PHI-1 PATTERN',
        -855,
        -425,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Count Human & Synthetic Separately',
        -855,
        -350,
        52,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(a),

      glassCell(-490, -25, 620, 175, COSMOS.blue, { fill: '#0f1b33', glow: 9, opacity: a }),
      txt('HUMAN SOURCE · R1', -490, -68, 28, COSMOS.blue, 'mono').opacity(a),
      txt('Filtered real program', -490, -14, 34, COSMOS.ink, 'serif').opacity(a),
      txt('Original provenance + license', -490, 36, 26, COSMOS.muted, 'mono').opacity(a),

      ...photonStream([-175, -55], [175, -135], -25, ph, {
        color: COSMOS.cyan,
        count: 3,
        opacity: (0.4 + 0.6 * gn) * a,
      }),
      ...photonStream([-175, 15], [175, 105], 25, ph + 0.7, {
        color: COSMOS.amber,
        count: 3,
        opacity: (0.4 + 0.6 * gn) * a,
      }),

      glassCell(490, -135, 620, 148, gn > 0.3 ? COSMOS.cyan : '#364a6e', {
        fill: '#0e2030',
        glow: gn > 0.3 ? 8 : 3,
        opacity: (0.48 + 0.52 * gn) * a,
      }),
      txt('GENERATED EXERCISE · G1', 490, -165, 28, COSMOS.cyan, 'mono').opacity(
        (0.55 + 0.45 * gn) * a,
      ),
      txt('Verified via executable unit tests', 490, -110, 28, COSMOS.ink, 'sans').opacity(
        (0.5 + 0.5 * gn) * a,
      ),

      glassCell(490, 105, 620, 148, gn > 0.3 ? COSMOS.amber : '#4c3f30', {
        fill: '#201812',
        glow: gn > 0.3 ? 8 : 3,
        opacity: (0.48 + 0.52 * gn) * a,
      }),
      txt('GENERATED EXPLANATION · G2', 490, 75, 28, COSMOS.amber, 'mono').opacity(
        (0.55 + 0.45 * gn) * a,
      ),
      txt('Checked against source support', 490, 130, 28, COSMOS.ink, 'sans').opacity(
        (0.5 + 0.5 * gn) * a,
      ),

      glassCell(0, 325, 1420, 104, pr > 0.3 ? COSMOS.gold : '#3c4560', {
        fill: '#1b1822',
        glow: pr > 0.3 ? 9 : 2,
        opacity: (0.45 + 0.55 * pr) * a,
      }),
      txt(
        'Preserve parent lineage, privacy decisions, teacher terms & executable validation',
        0,
        327,
        30,
        pr > 0.3 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ).opacity((0.52 + 0.48 * pr) * a),
    ];

    return group(...nodes);
  });

  // Part 3: Replacement (tail collapse, rare R3 lost) vs Accumulation (R1, R2, rare R3 + G1, G2, G3)
  const part3Live = guardedDynamic(showPart3, (a) => {
    const rt = retainOn.value;
    const fl = floorOn.value;
    const nodes = [
      txt(
        'MODEL COLLAPSE VS ACCUMULATION · GERSTGRASSER ET AL.',
        -855,
        -425,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ).opacity(a),
      txt('Accumulate, Do Not Replace', -855, -350, 54, COSMOS.ink, 'serif', 'left').opacity(a),

      // Left column: Replacement (loses rare tail R3)
      txt('RECURSIVE REPLACEMENT', -460, -235, 30, COSMOS.rose, 'mono').opacity(a),
      ...['G1', 'G2', 'G3'].flatMap((lbl, i) => [
        glassCell(-460, -135 + i * 112, 430, 82, COSMOS.rose, {
          fill: '#23101c',
          glow: 7,
          opacity: a,
        }),
        txt(`Synthetic ${lbl}`, -460, -133 + i * 112, 30, COSMOS.rose, 'mono').opacity(a),
      ]),
      txt('Rare human tail R3 lost!', -460, 210, 30, COSMOS.rose, 'sans').opacity(a),

      // Right column: Accumulate real + generated (visible from start, lights up at retain cue)
      txt('RETAIN + ACCUMULATE', 420, -235, 30, COSMOS.emerald, 'mono').opacity(a),
    ];

    const rtOp = (0.45 + 0.55 * rt) * a;
    const realItems = ['Real R1', 'Real R2', 'Rare tail R3'];
    const synItems = ['Synthetic G1', 'Synthetic G2', 'Synthetic G3'];
    realItems.forEach((lbl, i) => {
      const isRare = i === 2;
      const col = isRare ? COSMOS.gold : COSMOS.blue;
      nodes.push(
        glassCell(195, -135 + i * 112, 360, 82, col, {
          fill: isRare ? '#241e12' : '#0f1b32',
          glow: rt > 0.3 ? (isRare ? 10 : 6) : 2,
          opacity: rtOp,
        }),
        txt(lbl, 195, -133 + i * 112, 28, col, 'mono').opacity(rtOp),
      );
    });
    synItems.forEach((lbl, i) => {
      nodes.push(
        glassCell(605, -135 + i * 112, 360, 82, COSMOS.cyan, {
          fill: '#0e2030',
          glow: rt > 0.3 ? 6 : 2,
          opacity: rtOp,
        }),
        txt(lbl, 605, -133 + i * 112, 28, COSMOS.cyan, 'mono').opacity(rtOp),
      );
    });
    nodes.push(
      txt('Original rare tail R3 preserved', 400, 210, 30, COSMOS.emerald, 'sans').opacity(rtOp),
    );

    if (fl > 0.02) {
      nodes.push(
        txt(
          'Check rare cases separately · averages hide floor drops',
          0,
          365,
          32,
          COSMOS.gold,
          'sans',
        )
          .glow(6, COSMOS.gold)
          .opacity(fl * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live, part3Live);
  runPhase(s, c, phase, 14);

  c.on('pt-anneal-synthetic-forty', () =>
    s.play(fortyP.to(1, { duration: remainDuration(c, 'pt-anneal-synthetic-forty', 1.1) })),
  );
  c.on('pt-anneal-synthetic-compare', () =>
    s.play(compareOn.to(1, { duration: remainDuration(c, 'pt-anneal-synthetic-compare', 0.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-anneal-synthetic-generated', () =>
    s.play(genOn.to(1, { duration: remainDuration(c, 'pt-anneal-synthetic-generated', 0.7) })),
  );
  c.on('pt-anneal-synthetic-provenance', () =>
    s.play(provOn.to(1, { duration: remainDuration(c, 'pt-anneal-synthetic-provenance', 0.6) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-anneal-synthetic-retain', () =>
    s.play(retainOn.to(1, { duration: remainDuration(c, 'pt-anneal-synthetic-retain', 0.7) })),
  );
  c.on('pt-anneal-synthetic-floor', () =>
    s.play(floorOn.to(1, { duration: remainDuration(c, 'pt-anneal-synthetic-floor', 0.6) })),
  );
}
