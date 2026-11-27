// Scene 04: Choose which archived evidence reaches extraction: WARC / WAT / WET 3D layers & source verification.
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  aura,
  cinematic3d,
  glassCell,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  markDecoration,
  orbitScene,
  photonStream,
  prism3d,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function archives(s, c) {
  const showPart1 = s.value(1);
  const warcOn = s.value(0);
  const watOn = s.value(0);
  const wetOn = s.value(0);

  const showPart2 = s.value(0);
  const identityOn = s.value(0);

  const showPart3 = s.value(0);
  const inspectOn = s.value(0);

  // 3D stacked archive strata (WARC bottom raw foundation, WAT middle metadata, WET top extracted text)
  const view3d = cinematic3d({
    theta: -0.74,
    phi: 1.04,
    distance: 14.8,
    unit: 112,
    focus: [0, 0, 0.2],
  }).at(390, 20);

  view3d.add(
    ...prism3d(-2.3, -1.6, -1.5, 4.6, 3.2, 0.55, '#132854', COSMOS.blue, 0.78),
    ...prism3d(-2.0, -1.4, -0.2, 4.0, 2.8, 0.45, '#2b2410', COSMOS.gold, 0.72),
    ...prism3d(-1.7, -1.2, 1.0, 3.4, 2.4, 0.42, '#0e2c36', COSMOS.cyan, 0.72),
  );

  const bgAura = aura(390, 20, 500, '#1c356e28', '#5ce1e614');

  const title1 = heroTitle(['Common Crawl', 'Archive Strata'], {
    x: -855,
    y: -430,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'RAW EVIDENCE · WARC / WAT / WET',
  });

  const part1Live = guardedDynamic(showPart1, (a) => {
    const w1 = warcOn.value;
    const w2 = watOn.value;
    const w3 = wetOn.value;
    const rows = [
      { key: 'WARC', desc: 'Raw HTTP response + page HTML', color: COSMOS.blue, v: w1, y: -120 },
      { key: 'WAT', desc: 'Computed crawl metadata', color: COSMOS.gold, v: w2, y: 25 },
      { key: 'WET', desc: 'Pre-extracted plain text', color: COSMOS.cyan, v: w3, y: 170 },
    ];
    const nodes = [
      txt('3D CRAWL ARTIFACT STACK', 390, -395, 26, COSMOS.cyan, 'mono').opacity(a),
      txt('WARC (base) · WAT (mid) · WET (top)', 390, 410, 26, COSMOS.muted, 'mono').opacity(a),
    ];
    rows.forEach((r) => {
      const op = (0.3 + 0.7 * r.v) * a;
      nodes.push(
        glassCell(-470, r.y, 740, 106, r.color, {
          fill: '#0f162a',
          glow: r.v > 0.3 ? 9 : 2,
          opacity: op,
        }),
        txt(r.key, -785, r.y + 2, 38, r.color, 'mono', 'left')
          .glow(6, r.color)
          .opacity(op),
        txt(r.desc, -625, r.y + 2, 28, COSMOS.ink, 'sans', 'left').opacity(op),
      );
    });
    nodes.push(
      txt(
        'Reading WET inherits an earlier extractor · WARC keeps raw bytes',
        -855,
        345,
        28,
        COSMOS.emerald,
        'sans',
        'left',
      ).opacity((0.3 + 0.7 * w3) * a),
    );
    return group(...nodes);
  });

  // Part 2: Diverse source streams with attached lineage constellation
  const part2Live = guardedDynamic(showPart2, (a) => {
    const idOn = identityOn.value;
    const sources = [
      { label: 'Web prose', sub: 'Crawl snapshot', color: COSMOS.blue, x: -640 },
      { label: 'Books', sub: 'Long argument', color: COSMOS.cyan, x: -215 },
      { label: 'Code repos', sub: 'Programs + tests', color: COSMOS.violet, x: 215 },
      { label: 'Forums', sub: 'Worked solutions', color: COSMOS.emerald, x: 640 },
    ];
    const nodes = [
      txt('MULTI-DOMAIN CORPUS SOURCES', -855, -415, 26, COSMOS.cyan, 'mono', 'left').opacity(a),
      txt('Keep Lineage Attached', -855, -340, 56, COSMOS.ink, 'serif', 'left').opacity(a),
    ];

    sources.forEach((src, i) => {
      nodes.push(
        glassCell(src.x, -85, 370, 210, src.color, {
          fill: '#10182d',
          glow: 8,
          opacity: a,
        }),
        txt(src.label, src.x, -130, 34, src.color, 'serif').opacity(a),
        txt(src.sub, src.x, -72, 26, COSMOS.muted, 'sans').opacity(a),
        txt('License & format', src.x, -18, 26, COSMOS.dim, 'mono').opacity(a),
        ...photonStream([src.x, 26], [src.x * 0.45, 162], -10, 0, {
          color: src.color,
          count: 3,
          opacity: (0.35 + 0.65 * idOn) * a,
        }),
      );
    });

    if (idOn > 0.02) {
      nodes.push(
        glassCell(0, 225, 1460, 110, COSMOS.gold, {
          fill: '#171926',
          glow: 10,
          opacity: idOn * a,
        }),
        txt(
          'LINEAGE: snapshot_id · source_identity · extracted_spans',
          0,
          227,
          28,
          COSMOS.gold,
          'mono',
        ).opacity(idOn * a),
        txt(
          'Repo stars measure popularity · run tests to judge code quality',
          0,
          380,
          30,
          COSMOS.ink,
          'sans',
        ).opacity(idOn * a),
      );
    }

    return group(...nodes);
  });

  // Part 3: Side-by-side WARC vs Extracted code inspection
  const part3Live = guardedDynamic(showPart3, (a) => {
    const ins = inspectOn.value;
    const lines = ['def add(a, b):', '    return a + b', 'The cat sat on the mat.'];
    const nodes = [
      txt('WARC EXTRACTION VERIFICATION', -855, -415, 26, COSMOS.emerald, 'mono', 'left').opacity(
        a,
      ),
      txt('Inspect Against the Raw Source', -855, -340, 56, COSMOS.ink, 'serif', 'left').opacity(a),
      txt('RAW WARC SOURCE', -450, -210, 28, COSMOS.blue, 'mono').opacity(a),
      txt('EXTRACTED OUTPUT', 450, -210, 28, COSMOS.cyan, 'mono').opacity(a),
    ];

    lines.forEach((textLine, i) => {
      const y = -95 + i * 125;
      const isReturn = i === 1;
      const col = isReturn ? COSMOS.violet : COSMOS.ink;
      nodes.push(
        glassCell(-450, y, 710, 88, isReturn ? COSMOS.violet : COSMOS.blue, {
          fill: '#10182c',
          glow: isReturn ? 8 : 3,
          opacity: a,
        }),
        txt(textLine, -765, y + 2, 34, col, 'mono', 'left').opacity(a),
      );

      if (ins > 0.02) {
        nodes.push(
          ...photonStream([-85, y], [85, y], 0, 0, {
            color: isReturn ? COSMOS.gold : COSMOS.cyan,
            count: 2,
            opacity: ins * a,
          }),
          glassCell(450, y, 710, 88, isReturn ? COSMOS.emerald : COSMOS.cyan, {
            fill: '#0e1d2a',
            glow: 8,
            opacity: ins * a,
          }),
          txt(
            textLine,
            135,
            y + 2,
            34,
            isReturn ? COSMOS.emerald : COSMOS.ink,
            'mono',
            'left',
          ).opacity(ins * a),
        );
      }
    });

    if (ins > 0.5) {
      const retY = -95 + 125;
      for (let sp = 0; sp < 4; sp++) {
        nodes.push(
          markDecoration(
            rect(15, 6, { fill: COSMOS.gold, stroke: null, radius: 3 })
              .at(144 + sp * 20, retY + 26)
              .glow(6, COSMOS.gold)
              .opacity(ins * a),
          ),
        );
      }
      nodes.push(
        glowingTrail(
          [
            [135, retY + 34],
            [218, retY + 34],
          ],
          { color: COSMOS.gold, width: 4, glow: 8, opacity: ins * a },
        ),
        txt(
          '4 leading spaces preserved · final prose period intact',
          0,
          345,
          34,
          COSMOS.gold,
          'sans',
        )
          .glow(6, COSMOS.gold)
          .opacity(ins * a),
        txt(
          'FineWeb & DCLM both beat WET baselines by extracting directly from WARC',
          0,
          415,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(ins * a),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, view3d, title1, part1Live, part2Live, part3Live);
  orbitScene(
    s,
    c,
    view3d,
    { theta: -0.22, phi: 0.94 },
    { startOffset: 0.1, endMargin: Math.max(0.55, c.end - c.beats[1].start + 0.4) },
  );

  c.on('pt-archives-warc', () =>
    s.play(warcOn.to(1, { duration: remainDuration(c, 'pt-archives-warc', 0.5) })),
  );
  c.on('pt-archives-wat', () =>
    s.play(watOn.to(1, { duration: remainDuration(c, 'pt-archives-wat', 0.5) })),
  );
  c.on('pt-archives-wet', () =>
    s.play(wetOn.to(1, { duration: remainDuration(c, 'pt-archives-wet', 0.5) })),
  );

  c.onBeat(1, () => {
    s.play(
      par(showPart1.to(0, { duration: 0.2 }), delay(showPart2.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.hide(1, [view3d, title1], { fade: 0.2 });

  c.on('pt-archives-identity', () =>
    s.play(identityOn.to(1, { duration: remainDuration(c, 'pt-archives-identity', 0.6) })),
  );

  c.onBeat(2, () => {
    s.play(
      par(showPart2.to(0, { duration: 0.2 }), delay(showPart3.to(1, { duration: 0.25 }), 0.22)),
    );
  });

  c.on('pt-archives-inspect', () =>
    s.play(inspectOn.to(1, { duration: remainDuration(c, 'pt-archives-inspect', 0.7) })),
  );
}
