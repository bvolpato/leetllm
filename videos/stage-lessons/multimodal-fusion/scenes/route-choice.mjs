// Scene 24: route-choice: Match request -> architecture -> output contract (retrieval, VLM QA, grounding + OCR, composition).
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  txt,
} from '../parts.mjs';

export default function routeChoice(s, c) {
  const litSim = s.value(0);
  const litExp = s.value(0);
  const litLoc = s.value(0);
  const litOcr = s.value(0);
  const litComp = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#25184426');
  const title = heroTitle(['Match the Architecture', 'to the Evidence'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.bridge,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const s0 = litSim.value;
    const s1 = litExp.value;
    const s2 = litLoc.value;
    const ocr = litOcr.value;
    const cmp = litComp.value;

    const rows = [
      {
        req: '"Find similar dashboards"',
        arch: 'Pooled Late Fusion',
        out: 'Similarity Ranking',
        col: ROLE.text,
        active: Math.max(s0, cmp),
        y: -155,
      },
      {
        req: '"Explain the latency spike"',
        arch: 'Early / Cross-Attn VLM',
        out: 'Grounded Explanation',
        col: ROLE.ok,
        active: Math.max(s1, cmp),
        y: -25,
      },
      {
        req: '"Where is paging badge?"',
        arch: 'Grounding / Detector',
        out: 'Region Coordinates',
        col: ROLE.gold,
        active: Math.max(s2, cmp),
        y: 105,
      },
    ];

    const nodes = [
      txt('USER REQUEST', -575, -245, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('ARCHITECTURE ROUTE', 10, -245, 26, ROLE.vision, 'mono', 'center').opacity(alpha),
      txt('OUTPUT CONTRACT', 595, -245, 26, ROLE.ok, 'mono', 'center').opacity(alpha),
    ];

    rows.forEach((row) => {
      const a = row.active;
      const op = alpha * (0.55 + 0.45 * a);
      nodes.push(
        chipPill(row.req, -575, row.y, {
          w: 540,
          h: 76,
          color: a > 0.3 ? row.col : '#384c76',
          size: 26,
          glow: a > 0.3 ? 10 : 4,
          opacity: op,
        }),
        arrow([-290, row.y], [-210, row.y], { stroke: row.col, width: 3.2, head: 11 }).opacity(op),
        chipPill(row.arch, 10, row.y, {
          w: 410,
          h: 76,
          color: a > 0.3 ? row.col : '#384c76',
          fill: a > 0.3 ? '#14223d' : '#10182d',
          size: 26,
          glow: a > 0.3 ? 12 : 4,
          opacity: op,
        }),
        arrow([230, row.y], [315, row.y], { stroke: row.col, width: 3.2, head: 11 }).opacity(op),
        chipPill(row.out, 595, row.y, {
          w: 520,
          h: 76,
          color: a > 0.3 ? row.col : '#384c76',
          fill: a > 0.3 ? '#0f262a' : '#10182d',
          size: 26,
          glow: a > 0.3 ? 12 : 4,
          opacity: op,
        }),
      );
    });

    // OCR branch + system composition footer
    nodes.push(
      chipPill(
        ocr > 0.3
          ? '+ OCR Stage: required when answers depend on tiny printed labels'
          : 'Global embedding score alone cannot return a bounding-box coordinate',
        0,
        220,
        {
          w: 1320,
          h: 64,
          color: ocr > 0.3 ? ROLE.warn : '#384c76',
          fill: ocr > 0.3 ? '#2c1422' : '#10182d',
          size: 26,
          glow: ocr > 0.3 ? 12 : 4,
          opacity: alpha,
        },
      ),
      txt(
        cmp > 0.3
          ? 'Compose stages: Retrieval finds candidates -> VLM reads evidence -> Detector / OCR verifies'
          : 'Choose every stage by the exact information its output must return',
        0,
        320,
        26,
        cmp > 0.3 ? ROLE.vision : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'route-similarity-request', (d) => s.play(litSim.to(1, { duration: d })));
  playCue(s, c, 'route-chart-explanation', (d) => s.play(litExp.to(1, { duration: d })));
  playCue(s, c, 'route-localized-badge', (d) => s.play(litLoc.to(1, { duration: d })));
  playCue(s, c, 'route-ocr-labels', (d) => s.play(litOcr.to(1, { duration: d })));
  playCue(s, c, 'route-system-composition', (d) => s.play(litComp.to(1, { duration: d })));
}
