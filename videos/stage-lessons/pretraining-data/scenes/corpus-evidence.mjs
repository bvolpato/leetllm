// Scene 08: Separate corpus inventory from evidence of value: Open corpora progression, language filter pitfall, organic vs synthetic accounting.
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
  photonStream,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function corpusEvidence(s, c) {
  const phase = s.value(0);
  const showPart1 = s.value(1);
  const sourcesOn = s.value(0);
  const evalOn = s.value(0);

  const showPart2 = s.value(0);
  const langOn = s.value(0);
  const copyOn = s.value(0);

  const showPart3 = s.value(0);
  const sepOn = s.value(0);
  const presOn = s.value(0);

  const bgAura = aura(0, 0, 660, '#16274f28', '#5ce1e614');

  // Part 1: Open corpora lineage stream (C4 -> Pile -> Dolma -> FineWeb -> DCLM)
  const part1Live = guardedDynamic(showPart1, (a) => {
    const so = sourcesOn.value;
    const ev = evalOn.value;
    const ph = phase.value;
    const items = [
      { name: 'C4', detail: 'Heuristic clean', x: -720, color: COSMOS.blue },
      { name: 'The Pile', detail: '22 domains', x: -360, color: COSMOS.cyan },
      { name: 'Dolma', detail: 'Inspectable 3T', x: 0, color: COSMOS.violet },
      { name: 'FineWeb', detail: 'Ablated 15T', x: 360, color: COSMOS.emerald },
      { name: 'DCLM', detail: '240T -> selected', x: 720, color: COSMOS.gold },
    ];

    const nodes = [
      heroTitle(['Open Corpora', '& Matched Evidence'], {
        x: -855,
        y: -430,
        size: 56,
        lineHeight: 66,
        accent: COSMOS.cyan,
        eyebrow: 'CORPUS DESIGN · FROM RAW VOLUME TO ABLATION',
      }).opacity(a),
      glowingTrail(
        [
          [-720, 10],
          [720, 10],
        ],
        { color: COSMOS.blue, width: 3.5, glow: 8, opacity: 0.65 * a },
      ),
      ...photonStream([-720, 10], [720, 10], 0, ph, {
        color: COSMOS.cyan,
        count: 6,
        opacity: a,
        trail: false,
      }),
    ];

    items.forEach((it, idx) => {
      const y = idx % 2 === 0 ? -95 : 135;
      const lit = so > 0.2 || idx < 2;
      nodes.push(
        glowDot(it.x, 10, { radius: 9, color: it.color, glow: 12, opacity: a }),
        glowingTrail(
          [
            [it.x, 10],
            [it.x, y > 0 ? y - 55 : y + 55],
          ],
          { color: it.color, width: 2.5, glow: 6, opacity: 0.8 * a },
        ),
        glassCell(it.x, y, 310, 110, it.color, {
          fill: '#0f172b',
          glow: lit ? 8 : 2,
          opacity: a,
        }),
        txt(it.name, it.x, y - 18, 34, it.color, 'serif').opacity(a),
        txt(it.detail, it.x, y + 26, 26, COSMOS.ink, 'mono').opacity(a),
      );
    });

    if (ev > 0.02) {
      nodes.push(
        txt(
          'Judge every source by its contribution under a matched evaluation, not raw size',
          0,
          375,
          32,
          COSMOS.gold,
          'sans',
        )
          .glow(6, COSMOS.gold)
          .opacity(ev * a),
      );
    }

    return group(...nodes);
  });

  // Part 2: FineWeb2 1,000+ languages vs English stopword gate pitfall
  const part2Live = guardedDynamic(showPart2, (a) => {
    const lg = langOn.value;
    const cp = copyOn.value;
    const cases = [
      {
        title: 'English prose',
        sample: 'the key and the lock',
        stops: '2 stopwords ("the", "and")',
        pass: true,
        x: -570,
        color: COSMOS.emerald,
      },
      {
        title: 'Code syntax',
        sample: 'return a + b',
        stops: '0 English stopwords',
        pass: false,
        x: 0,
        color: COSMOS.violet,
      },
      {
        title: 'Spanish prose',
        sample: 'gira las llaves',
        stops: '0 English stopwords',
        pass: false,
        x: 570,
        color: COSMOS.cyan,
      },
    ];

    const nodes = [
      txt(
        'FINEWEB2 · 1,000+ LANGUAGES ADAPTED SEPARATELY',
        -855,
        -425,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity((0.4 + 0.6 * lg) * a),
      txt('One English Gate Breaks Coverage', -855, -350, 54, COSMOS.ink, 'serif', 'left').opacity(
        a,
      ),
      txt(
        'Applying a single English stopword rule across domains and languages:',
        -855,
        -275,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(a),
    ];

    cases.forEach((row) => {
      const col = cp > 0.5 ? (row.pass ? COSMOS.emerald : COSMOS.rose) : row.color;
      nodes.push(
        glassCell(row.x, -45, 510, 260, col, {
          fill: cp > 0.5 && !row.pass ? '#1b0f1b' : '#10182d',
          glow: 8,
          opacity: a,
          dash: cp > 0.5 && !row.pass ? [10, 6] : undefined,
        }),
        txt(row.title, row.x, -125, 34, row.color, 'serif').opacity(a),
        txt(row.sample, row.x, -45, 32, COSMOS.ink, 'mono').opacity(a),
        txt(row.stops, row.x, 28, 26, col, 'mono').opacity(a),
      );
      if (cp > 0.5) {
        nodes.push(
          txt(row.pass ? 'SURVIVES GATE' : 'ERASED BY GATE', row.x, 162, 30, col, 'mono')
            .glow(6, col)
            .opacity(cp * a),
        );
      }
    });

    nodes.push(
      txt(
        'Tune language processing & thresholds per language and domain',
        0,
        365,
        32,
        COSMOS.gold,
        'sans',
      ).opacity((0.35 + 0.65 * cp) * a),
    );
    return group(...nodes);
  });

  // Part 3: Nemotron-CC v2.1 separate lanes (Organic / Translated / Synthetic) vs Presentations
  const part3Live = guardedDynamic(showPart3, (a) => {
    const sp = sepOn.value;
    const pr = presOn.value;
    const ph = phase.value;
    const lanes = [
      { label: 'Organic web text', color: COSMOS.blue, x: -570 },
      { label: 'Translated text', color: COSMOS.cyan, x: 0 },
      { label: 'Synthetic rephrasing', color: COSMOS.amber, x: 570 },
    ];

    const nodes = [
      txt(
        'NEMOTRON-CC v2.1 · 2.5T ADDED ENGLISH TOKENS',
        -855,
        -425,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ).opacity(a),
      txt('Track Each Category Separately', -855, -350, 56, COSMOS.ink, 'serif', 'left').opacity(a),
    ];

    lanes.forEach((lane, i) => {
      nodes.push(
        glassCell(lane.x, -85, 500, 175, lane.color, {
          fill: '#0f172b',
          glow: sp > 0.3 ? 9 : 3,
          opacity: a,
        }),
        txt(lane.label, lane.x, -108, 34, lane.color, 'serif').opacity(a),
        txt('Distinct provenance & terms', lane.x, -45, 26, COSMOS.muted, 'sans').opacity(
          (0.3 + 0.7 * sp) * a,
        ),
        ...photonStream([lane.x, 12], [i < 2 ? -340 : 340, 175], 20, ph + i, {
          color: lane.color,
          count: 3,
          opacity: (0.4 + 0.6 * pr) * a,
        }),
      );
    });

    const prOp = (0.48 + 0.52 * pr) * a;
    nodes.push(
      glassCell(-370, 235, 640, 118, pr > 0.3 ? COSMOS.emerald : '#34496e', {
        fill: '#0d2224',
        glow: pr > 0.3 ? 8 : 3,
        opacity: prOp,
      }),
      txt(
        'UNIQUE HUMAN INVENTORY',
        -370,
        212,
        26,
        pr > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'mono',
      ).opacity(prOp),
      txt('Original distinct tokens', -370, 262, 30, COSMOS.ink, 'sans').opacity(prOp),

      glassCell(370, 235, 640, 118, pr > 0.3 ? COSMOS.gold : '#4a435a', {
        fill: '#1c1824',
        glow: pr > 0.3 ? 8 : 3,
        opacity: prOp,
      }),
      txt(
        'SYNTHETIC + REPEATED PASSES',
        370,
        212,
        26,
        pr > 0.3 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ).opacity(prOp),
      txt('Scheduled training presentations', 370, 262, 30, COSMOS.ink, 'sans').opacity(prOp),

      txt(
        'Track unique human stock separately from repeats & synthetic rewrites',
        0,
        400,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(prOp),
    );

    return group(...nodes);
  });

  s.add(bgAura, part1Live, part2Live, part3Live);
  runPhase(s, c, phase, 14);

  c.on('pt-corpus-evidence-sources', () =>
    s.play(sourcesOn.to(1, { duration: remainDuration(c, 'pt-corpus-evidence-sources', 0.6) })),
  );
  c.on('pt-corpus-evidence-evaluate', () =>
    s.play(evalOn.to(1, { duration: remainDuration(c, 'pt-corpus-evidence-evaluate', 0.6) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-corpus-evidence-languages', () =>
    s.play(langOn.to(1, { duration: remainDuration(c, 'pt-corpus-evidence-languages', 0.5) })),
  );
  c.after('pt-corpus-evidence-copy', () =>
    s.play(copyOn.to(1, { duration: remainAfterDuration(c, 'pt-corpus-evidence-copy', 0.5) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.on('pt-corpus-evidence-separate', () =>
    s.play(sepOn.to(1, { duration: remainDuration(c, 'pt-corpus-evidence-separate', 0.6) })),
  );
  c.on('pt-corpus-evidence-presentations', () =>
    s.play(presOn.to(1, { duration: remainDuration(c, 'pt-corpus-evidence-presentations', 0.6) })),
  );
}
