// Scene 18: artifact-lineage: Feature hash/version lineage, valid IoU box hitting CPU% instead of Latency, partial claim scope.
import {
  COSMOS,
  ROLE,
  arrow,
  aura,
  chipPill,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function artifactLineage(s, c) {
  const showLineage = s.value(0);
  const showWrongMetric = s.value(0);
  const showLatencyFix = s.value(0);

  const bgAura = aura(0, 0, 760, '#14335c28', '#2a163224');
  const title = heroTitle(['Does the Cited Region', 'Show Latency?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.vision,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const lin = showLineage.value;
    const wrg = showWrongMetric.value;
    const fix = showLatencyFix.value;

    const nodes = [
      // Left: Immutable artifact I17 -> Derived Feature Lineage Record
      txt('FEATURE LINEAGE (IMMUTABLE I17)', -545, -245, 26, ROLE.vision, 'mono', 'center').opacity(
        alpha,
      ),
      chipPill('Source Hash + Original Coords', -545, -160, {
        w: 580,
        h: 64,
        color: lin > 0.3 ? ROLE.vision : '#384c76',
        size: 26,
        glow: lin > 0.3 ? 10 : 4,
        opacity: alpha,
      }),
      chipPill('Preprocess + Encoder + Bridge Rev', -545, -75, {
        w: 580,
        h: 64,
        color: lin > 0.3 ? ROLE.bridge : '#384c76',
        size: 26,
        glow: lin > 0.3 ? 10 : 4,
        opacity: alpha,
      }),
      chipPill('Dtype + Route + Word Time Map', -545, 10, {
        w: 580,
        h: 64,
        color: lin > 0.3 ? ROLE.text : '#384c76',
        size: 26,
        glow: lin > 0.3 ? 10 : 4,
        opacity: alpha,
      }),
      txt('Inspect exact inputs & test', -545, 92, 26, COSMOS.muted, 'sans', 'center').opacity(
        alpha,
      ),
      txt('one component at a time', -545, 134, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),

      arrow([-240, -75], [-110, -75], { stroke: ROLE.vision, width: 3.2, head: 12 }).opacity(alpha),

      // Right: Screenshot I17 with two metric sub-panels (CPU % vs Latency ms)
      txt('SCREENSHOT I17: CITED BOX CHECK', 375, -245, 26, ROLE.gold, 'mono', 'center').opacity(
        alpha,
      ),
      rect(890, 385, {
        fill: '#0b1224',
        stroke: '#2b3f6b',
        width: 2.4,
        radius: 14,
      })
        .at(375, -25)
        .opacity(alpha),

      // Sub-panel A: CPU % (valid box, wrong metric!)
      rect(395, 280, {
        fill: '#10182d',
        stroke: wrg > 0.4 && fix < 0.4 ? ROLE.warn : '#33486e',
        width: wrg > 0.4 && fix < 0.4 ? 4 : 2,
        radius: 10,
      })
        .at(160, -25)
        .glow(wrg > 0.4 && fix < 0.4 ? 14 : 0, ROLE.warn)
        .opacity(alpha),
      txt('CPU %', 160, -125, 32, wrg > 0.4 ? ROLE.warn : COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      glowingTrail(
        [
          [0, 30],
          [85, 20],
          [170, 35],
          [255, 22],
          [320, 28],
        ],
        { color: ROLE.text, width: 3.8, glow: 6, opacity: alpha, core: false },
      ),
      txt(
        wrg > 0.4 ? 'IoU 1.0: WRONG!' : 'Box A (in I17)',
        160,
        85,
        26,
        wrg > 0.4 ? ROLE.warn : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),

      // Sub-panel B: Latency ms (actual rising trace!)
      rect(395, 280, {
        fill: '#10182d',
        stroke: fix > 0.4 ? ROLE.ok : '#33486e',
        width: fix > 0.4 ? 4 : 2,
        radius: 10,
      })
        .at(590, -25)
        .glow(fix > 0.4 ? 14 : 0, ROLE.ok)
        .opacity(alpha),
      txt(
        'Latency (ms)',
        590,
        -125,
        32,
        fix > 0.4 ? ROLE.ok : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      glowingTrail(
        [
          [430, 50],
          [510, 46],
          [590, 12],
          [670, -24],
          [750, -52],
        ],
        { color: ROLE.ok, width: 4.5, glow: 10, opacity: alpha },
      ),
      txt(
        fix > 0.4 ? 'RISE ok (need time)' : 'Box B (in I17)',
        590,
        85,
        26,
        fix > 0.4 ? ROLE.ok : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),

      // Bottom verdict
      chipPill(
        fix > 0.4
          ? 'Partial answer: cite latency rise + name missing deploy timing (else abstain/review)'
          : wrg > 0.4
            ? 'Perfect box overlap checks location only; verifier must check metric contents!'
            : 'Claim: "Latency rose after deploy" -> inspect cited region contents',
        0,
        285,
        {
          w: 1580,
          h: 72,
          color: fix > 0.4 ? ROLE.ok : wrg > 0.4 ? ROLE.warn : ROLE.gold,
          fill: fix > 0.4 ? '#0f2d24' : wrg > 0.4 ? '#2c1422' : '#10182d',
          size: 26,
          glow: 8,
          opacity: alpha,
        },
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'mm-artifact-lineage-0', (d) => s.play(showLineage.to(1, { duration: d })));
  // Gate wrong-metric reveal cleanly on cue
  playCue(s, c, 'mm-artifact-lineage-1', (d) => s.play(showWrongMetric.to(1, { duration: d })), {
    after: true,
  });
  playCue(s, c, 'mm-artifact-lineage-2', (d) => s.play(showLatencyFix.to(1, { duration: d })));
}
