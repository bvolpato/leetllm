// Scene 06: Apply a prose rule to the actual record: Gopher English heuristic gates + 4 live cases + n-gram caps.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  glassCell,
  glowBar,
  group,
  guardedDynamic,
  heroTitle,
  photonStream,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function proseGates(s, c) {
  const showPart1 = s.value(1);
  const wordsGate = s.value(0);
  const symbolsGate = s.value(0);

  const showPart2 = s.value(0);
  const stopwordsOn = s.value(0);
  const verdictsOn = s.value(0);

  const showPart3 = s.value(0);
  const ngramsP = s.value(0);
  const subsetOn = s.value(0);

  const bgAura = aura(0, 0, 620, '#13244528', '#5ce1e614');

  const part1Live = guardedDynamic(showPart1, (a) => {
    const wg = wordsGate.value;
    const sg = symbolsGate.value;

    const gates = [
      { label: 'Word count', range: '50 .. 100,000 words', color: COSMOS.cyan, on: wg, y: -120 },
      { label: 'Mean word length', range: '3.0 .. 10.0 chars', color: COSMOS.blue, on: wg, y: 10 },
      { label: 'Hash ratio (# / words)', range: '<= 0.10', color: COSMOS.gold, on: sg, y: 140 },
      { label: 'Ellipsis (... / words)', range: '<= 0.10', color: COSMOS.amber, on: sg, y: 270 },
    ];

    const nodes = [
      heroTitle(['Executable English', 'Prose Heuristics'], {
        x: -855,
        y: -435,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'GOPHER MASSIVEWEB SUBSET · STAGE 1 GATES',
      }).opacity(a),
      ...photonStream([-850, 75], [-660, 75], 0, 0, {
        color: COSMOS.cyan,
        count: 4,
        opacity: a * 0.7,
      }),
    ];

    gates.forEach((g) => {
      const op = (0.3 + 0.7 * g.on) * a;
      nodes.push(
        glassCell(80, g.y, 1340, 96, g.color, {
          fill: '#0e162a',
          glow: g.on > 0.5 ? 8 : 2,
          opacity: op,
        }),
        txt(g.label, -540, g.y + 2, 32, COSMOS.ink, 'sans', 'left').opacity(op),
        txt(g.range, 700, g.y + 2, 34, g.color, 'mono', 'right')
          .glow(6, g.color)
          .opacity(op),
      );
    });

    nodes.push(
      txt(
        'Fast lexical checks run before any neural quality scorer',
        0,
        410,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Part 2: Four concrete records tested against the executable filter
  const part2Live = guardedDynamic(showPart2, (a) => {
    const sw = stopwordsOn.value;
    const vd = verdictsOn.value;

    const cases = [
      {
        name: 'Runbook',
        check: '71 words · "the", "and" · >=80% letters',
        keep: true,
        color: COSMOS.emerald,
      },
      { name: 'Short note', check: '4 words  <  50 minimum', keep: false, color: COSMOS.rose },
      {
        name: 'sale x 80',
        check: '0 listed English stopwords  <  2',
        keep: false,
        color: COSMOS.rose,
      },
      {
        name: 'CSS dump',
        check: '25 "#" / 125 words = 0.20  >  0.10',
        keep: false,
        color: COSMOS.rose,
      },
    ];

    const nodes = [
      txt(
        'FOUR RECORDS THROUGH THE PROSE FILTER',
        -855,
        -425,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('First Failing Gate Decides', -855, -350, 56, COSMOS.ink, 'serif', 'left').opacity(a),
      txt(
        'Requires >= 80% alphabetic words and >= 2 distinct English stopwords',
        -855,
        -275,
        28,
        COSMOS.gold,
        'sans',
        'left',
      ).opacity((0.35 + 0.65 * sw) * a),
    ];

    cases.forEach((row, i) => {
      const y = -135 + i * 132;
      const stroke = vd > 0.5 ? row.color : COSMOS.blue;
      nodes.push(
        glassCell(-150, y, 1340, 96, stroke, {
          fill: vd > 0.5 && row.keep ? '#0d2224' : '#0f1629',
          glow: vd > 0.5 ? 8 : 3,
          opacity: a,
        }),
        txt(row.name, -780, y + 2, 34, vd > 0.5 ? row.color : COSMOS.cyan, 'mono', 'left').opacity(
          a,
        ),
        txt(row.check, -460, y + 2, 28, COSMOS.ink, 'sans', 'left').opacity((0.3 + 0.7 * sw) * a),
        ...photonStream([530, y], [665, y], 0, 0, {
          color: stroke,
          count: 2,
          opacity: vd * a,
        }),
      );
      if (vd > 0.02) {
        nodes.push(
          glassCell(750, y, 210, 76, row.color, {
            fill: row.keep ? '#0d2b24' : '#26101c',
            glow: 9,
            opacity: vd * a,
          }),
          txt(row.keep ? 'KEEP' : 'DROP', 750, y + 2, 32, row.color, 'mono').opacity(vd * a),
        );
      }
    });

    return group(...nodes);
  });

  // Part 3: Published repetition caps (top 2-, 3-, 4-gram character fractions)
  const part3Live = guardedDynamic(showPart3, (a) => {
    const ng = ngramsP.value;
    const sub = subsetOn.value;
    const caps = [
      { label: 'Top 2-gram cap', val: 0.2, color: COSMOS.cyan, x: -560 },
      { label: 'Top 3-gram cap', val: 0.18, color: COSMOS.blue, x: 0 },
      { label: 'Top 4-gram cap', val: 0.16, color: COSMOS.violet, x: 560 },
    ];

    const nodes = [
      txt('BEYOND THE TEACHING SUBSET', -855, -425, 26, COSMOS.gold, 'mono', 'left').opacity(a),
      txt('Published Repetition Caps', -855, -350, 56, COSMOS.ink, 'serif', 'left').opacity(a),
      txt(
        'Character fraction limits in the full Gopher suite',
        -855,
        -275,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    ];

    caps.forEach((cap) => {
      nodes.push(
        txt(cap.label, cap.x, -110, 32, cap.color, 'mono').opacity(a),
        ...glowBar(cap.x - 210, -25, 420, (cap.val / 0.25) * ng, {
          height: 44,
          color: cap.color,
          opacity: a,
        }),
        txt((cap.val * ng).toFixed(2), cap.x, 65, 58, cap.color, 'mono')
          .glow(8, cap.color)
          .opacity(Math.max(0.15, ng) * a),
      );
    });

    if (sub > 0.02) {
      nodes.push(
        glassCell(0, 235, 1380, 102, COSMOS.gold, {
          fill: '#191822',
          glow: 9,
          opacity: sub * a,
        }),
        txt(
          'Runbook passed core checks -> next run repetition gates on lines & n-grams',
          0,
          237,
          30,
          COSMOS.gold,
          'sans',
        ).opacity(sub * a),
        txt(
          'Use separate rules for code, mathematics, and non-English corpora',
          0,
          380,
          30,
          COSMOS.emerald,
          'sans',
        ).opacity(sub * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live, part3Live);

  c.on('pt-prose-gates-words', () =>
    s.play(wordsGate.to(1, { duration: remainDuration(c, 'pt-prose-gates-words', 0.6) })),
  );
  c.on('pt-prose-gates-symbols', () =>
    s.play(symbolsGate.to(1, { duration: remainDuration(c, 'pt-prose-gates-symbols', 0.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-prose-gates-stopwords', () =>
    s.play(stopwordsOn.to(1, { duration: remainDuration(c, 'pt-prose-gates-stopwords', 0.6) })),
  );
  c.after('pt-prose-gates-outputs', () =>
    s.play(verdictsOn.to(1, { duration: remainAfterDuration(c, 'pt-prose-gates-outputs', 0.45) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-prose-gates-ngrams', () =>
    s.play(ngramsP.to(1, { duration: remainDuration(c, 'pt-prose-gates-ngrams', 1.1) })),
  );
  c.on('pt-prose-gates-subset', () =>
    s.play(subsetOn.to(1, { duration: remainDuration(c, 'pt-prose-gates-subset', 0.6) })),
  );
}
