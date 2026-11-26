// Scene 15: Trace a candidate match into a versioned review: 4-tier decontamination beams, executable screen, and decide(False) indentation prediction.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  photonStream,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function decontamination(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const pinOn = s.value(0);
  const layersOn = s.value(0);

  const showPart2 = s.value(0);
  const flagsOn = s.value(0);
  const runbookOn = s.value(0);

  const showPart3 = s.value(0);
  const indentLit = s.value(0);
  const leftReveal = s.value(0);
  const falseReveal = s.value(0);
  const reviewReveal = s.value(0);

  const bgAura = aura(0, 0, 650, '#1a204a2a', '#ff6b8b16');

  // Part 1: Pinned benchmark -> 4-tier collision beams -> README vs Solution distinction
  const part1Live = guardedDynamic(showPart1, (a) => {
    const pn = pinOn.value;
    const ly = layersOn.value;
    const ph = phase.value;
    const tiers = [
      { label: 'Repo blocklist', sub: 'Tier 1', x: -645, color: COSMOS.blue },
      { label: 'Literal n-gram', sub: 'Tier 2', x: -215, color: COSMOS.cyan },
      { label: 'Code-aware', sub: 'Tier 3', x: 215, color: COSMOS.violet },
      { label: 'Semantic embed', sub: 'Tier 4', x: 645, color: COSMOS.gold },
    ];

    const nodes = [
      heroTitle(['Benchmark', 'Decontamination'], {
        x: -855,
        y: -435,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.rose,
        eyebrow: 'OVERLAP SCREENING · PINNED VERSIONS & SPLITS',
      }).opacity(a),

      glassCell(320, -345, 780, 92, COSMOS.gold, {
        fill: '#1b1824',
        glow: 6 + pn * 6,
        opacity: a,
      }),
      txt('PINNED BENCHMARK · VERSION · SPLIT', 320, -343, 28, COSMOS.gold, 'mono').opacity(a),
    ];

    tiers.forEach((t, i) => {
      nodes.push(
        ...photonStream([320, -298], [t.x, -128], -30, ph + i * 0.6, {
          color: t.color,
          count: 3,
          opacity: (0.4 + 0.6 * pn) * a,
        }),
        glassCell(t.x, -55, 380, 146, t.color, { fill: '#10182d', glow: 8, opacity: a }),
        txt(t.sub, t.x, -86, 26, COSMOS.muted, 'mono').opacity(a),
        txt(t.label, t.x, -30, 32, t.color, 'serif').opacity(a),
      );
    });

    const lyOp = (0.48 + 0.52 * ly) * a;
    nodes.push(
      glassCell(-420, 215, 700, 118, ly > 0.3 ? COSMOS.cyan : '#34496e', {
        fill: '#0e1d2c',
        glow: ly > 0.3 ? 8 : 3,
        opacity: lyOp,
      }),
      txt(
        'README quotes benchmark marker',
        -420,
        196,
        30,
        ly > 0.3 ? COSMOS.cyan : COSMOS.muted,
        'sans',
      ).opacity(lyOp),
      txt('Lineage note · no answer exposed', -420, 244, 26, COSMOS.muted, 'mono').opacity(lyOp),

      glassCell(420, 215, 700, 118, ly > 0.3 ? COSMOS.rose : '#503448', {
        fill: '#22101d',
        glow: ly > 0.3 ? 9 : 3,
        opacity: lyOp,
      }),
      txt(
        'Solution file contains the answer',
        420,
        196,
        30,
        ly > 0.3 ? COSMOS.rose : COSMOS.muted,
        'sans',
      ).opacity(lyOp),
      txt('Direct contamination · exclude', 420, 244, 26, COSMOS.amber, 'mono').opacity(lyOp),

      txt(
        'Inspect every matched passage and sample unflagged text for missed leaks',
        0,
        390,
        30,
        COSMOS.ink,
        'sans',
      ).opacity(lyOp),
    );

    return group(...nodes);
  });

  // Part 2: Executable screen results on 4 concrete records
  const part2Live = guardedDynamic(showPart2, (a) => {
    const fl = flagsOn.value;
    const rb = runbookOn.value;
    const ph = phase.value;
    const rows = [
      { name: 'Marker copy', rule: 'Canary GUID match', flag: true, color: COSMOS.amber },
      {
        name: 'Copied prompt',
        rule: 'Exact 4-word n-gram overlap',
        flag: true,
        color: COSMOS.rose,
      },
      {
        name: 'Renamed code',
        rule: 'Lexical code normalization',
        flag: true,
        color: COSMOS.violet,
      },
      {
        name: 'Runbook',
        rule: 'No implemented match -> residual audit',
        flag: false,
        color: COSMOS.emerald,
      },
    ];

    const nodes = [
      txt('EXECUTABLE DECONTAMINATION SCREEN', -855, -425, 26, COSMOS.rose, 'mono', 'left').opacity(
        a,
      ),
      txt('Three Flagged, One Residual Audit', -855, -350, 52, COSMOS.ink, 'serif', 'left').opacity(
        a,
      ),
    ];

    rows.forEach((row, i) => {
      const y = -165 + i * 136;
      const showVerdict = row.flag ? fl : rb;
      nodes.push(
        glassCell(-205, y, 1160, 96, showVerdict > 0.4 ? row.color : COSMOS.blue, {
          fill: '#10172b',
          glow: showVerdict > 0.4 ? 8 : 3,
          opacity: a,
        }),
        txt(row.name, -745, y + 2, 32, row.color, 'mono', 'left').opacity(a),
        txt(row.rule, -365, y + 2, 28, COSMOS.ink, 'sans', 'left').opacity(a),
        ...photonStream([385, y], [510, y], 0, ph + i, {
          color: row.color,
          count: 2,
          opacity: showVerdict * a,
        }),
        glassCell(675, y, 310, 82, row.color, {
          fill: row.flag ? '#26121d' : '#0f2422',
          glow: 8,
          opacity: showVerdict * a,
        }),
        txt(row.flag ? 'FLAGGED' : 'AUDIT', 675, y + 2, 30, row.color, 'mono').opacity(
          showVerdict * a,
        ),
      );
    });

    nodes.push(
      txt(
        'GPT-3 13-gram filtering also missed slight rewrites · layer methods and sample survivors',
        0,
        405,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 3: Indentation blind spot: Program A vs Program B under decide(False) with strict withholding!
  const part3Live = guardedDynamic(showPart3, (a) => {
    const ind = indentLit.value;
    const lr = leftReveal.value;
    const fr = falseReveal.value;
    const rv = reviewReveal.value;

    const codeA = ['def decide(flag):', '    if flag:', '        return 1', '    return 2'];
    const codeB = ['def decide(flag):', '    if flag:', '        return 1', '        return 2'];

    const nodes = [
      txt(
        'LEXICAL NORMALIZATION BLIND SPOT · INDENTATION STRIPPED',
        -855,
        -430,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
      txt(
        'Identical Tokens, Different Outputs',
        -855,
        -355,
        50,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(a),

      // Program A panel (left)
      glassCell(-440, -65, 720, 340, COSMOS.cyan, { fill: '#0e192d', glow: 8, opacity: a }),
      txt('PROGRAM A (LEFT)', -765, -200, 28, COSMOS.cyan, 'mono', 'left').opacity(a),
      // Program B panel (right)
      glassCell(440, -65, 720, 340, COSMOS.violet, { fill: '#15132d', glow: 8, opacity: a }),
      txt('PROGRAM B (RIGHT)', 115, -200, 28, COSMOS.violet, 'mono', 'left').opacity(a),
    ];

    codeA.forEach((ln, i) => {
      const col = i === 3 && ind > 0.4 ? COSMOS.gold : COSMOS.ink;
      nodes.push(
        txt(ln, -755, -125 + i * 68, 34, col, 'mono', 'left')
          .glow(i === 3 && ind > 0.4 ? 8 : 0, COSMOS.gold)
          .opacity(a),
      );
    });

    codeB.forEach((ln, i) => {
      const col = i === 3 && ind > 0.4 ? COSMOS.gold : COSMOS.ink;
      nodes.push(
        txt(ln, 125, -125 + i * 68, 34, col, 'mono', 'left')
          .glow(i === 3 && ind > 0.4 ? 8 : 0, COSMOS.gold)
          .opacity(a),
      );
    });

    // Center test call decide(False)
    nodes.push(
      glassCell(0, 185, 360, 82, COSMOS.gold, { fill: '#1e1a12', glow: 9, opacity: a }),
      txt('decide(False)', 0, 187, 34, COSMOS.gold, 'mono').opacity(a),
    );

    // Output A: withheld ("?") until c.after('pt-decontamination-left')
    nodes.push(
      txt(
        lr > 0.5 ? 'returns 2' : 'output: ?',
        -440,
        282,
        44,
        lr > 0.5 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      )
        .glow(lr > 0.5 ? 10 : 0, COSMOS.emerald)
        .opacity(a),
    );

    // Output B: withheld ("?") until c.after('pt-decontamination-false')
    nodes.push(
      txt(
        fr > 0.5 ? 'returns None' : 'output: ?',
        440,
        282,
        44,
        fr > 0.5 ? COSMOS.rose : COSMOS.muted,
        'mono',
      )
        .glow(fr > 0.5 ? 10 : 0, COSMOS.rose)
        .opacity(a),
    );

    // Bottom prompt / policy review
    const footer =
      rv > 0.5
        ? 'Route to policy review: save matched span, source ID, and benchmark revision'
        : lr > 0.5 || fr > 0.5
          ? 'Same normalized tokens, opposite runtime behavior for flag = False'
          : 'With flag = False, which function reaches its last return?';
    nodes.push(txt(footer, 0, 405, 32, rv > 0.5 ? COSMOS.gold : COSMOS.ink, 'sans').opacity(a));

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live, part3Live);
  runPhase(s, c, phase, 14);

  c.on('pt-decontamination-pin', () =>
    s.play(pinOn.to(1, { duration: remainDuration(c, 'pt-decontamination-pin', 0.6) })),
  );
  c.on('pt-decontamination-layers', () =>
    s.play(layersOn.to(1, { duration: remainDuration(c, 'pt-decontamination-layers', 0.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-decontamination-flags', () =>
    s.play(flagsOn.to(1, { duration: remainDuration(c, 'pt-decontamination-flags', 0.6) })),
  );
  c.on('pt-decontamination-runbook', () =>
    s.play(runbookOn.to(1, { duration: remainDuration(c, 'pt-decontamination-runbook', 0.5) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-decontamination-indent', () =>
    s.play(indentLit.to(1, { duration: remainDuration(c, 'pt-decontamination-indent', 0.6) })),
  );
  // Strict prediction withholding: reveal 2 and None only after their spoken clauses in Beat 3!
  c.after('pt-decontamination-left', () =>
    s.play(leftReveal.to(1, { duration: remainAfterDuration(c, 'pt-decontamination-left', 0.4) })),
  );
  c.after('pt-decontamination-false', () =>
    s.play(
      falseReveal.to(1, { duration: remainAfterDuration(c, 'pt-decontamination-false', 0.4) }),
    ),
  );
  c.on('pt-decontamination-review', () =>
    s.play(reviewReveal.to(1, { duration: remainDuration(c, 'pt-decontamination-review', 0.5) })),
  );
}
