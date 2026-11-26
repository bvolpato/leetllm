// Scene 1: hook - What does the next token need?
// Orbiting 3D causal KV crystal pairs for "The" and "fox", empty wireframe slots for "ran"
// throughout the prediction hold, then filled K/V + glowing Query->Keys->Values attention arcs.
import { gridPlane3d, group, line3d, par, point3d } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addPointerArc3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInNodes,
  fadeOutNodes,
  glowDot,
  guardedDynamic,
  hideNodes,
  memCell,
  orbitScene,
  quadArcPoint,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function hook(s, c) {
  const phase = s.value(0);
  const showAsk = s.value(0);
  const showQuery = s.value(0);
  const showKeys = s.value(0);
  const showMix = s.value(0);
  const showCache = s.value(0);

  const header = cinemaHeader(
    'KV CACHE  ·  CAUSAL ATTENTION',
    'What does the',
    'next token need?',
    {
      x: -860,
      y: -415,
      accent: ROLE.key,
      size: 54,
    },
  );

  const stageAura = aura(240, 20, 620, '#5ce1e626', '#a78bfa16');

  // Orbiting 3D isometric KV memory stage on the right-center
  const view3d = cinematic3d({
    theta: -0.76,
    phi: 1.04,
    distance: 15.2,
    unit: 106,
    focus: [0, 0, 0.95],
  }).at(245, 6);

  view3d.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.6, 2.6],
      z: 0,
      step: 1.1,
      color: '#26385c',
      width: 1.2,
      opacity: 0.56,
    }),
  );

  // Saved K (cyan) & V (violet) 3D crystal pairs for position 0 ("The") and position 1 ("fox")
  const colX = [-2.55, -0.55, 1.45];
  for (let i = 0; i < 2; i++) {
    const x = colX[i];
    addBox3D(view3d, x, -1.45, 0.06, 1.15, 1.18, 1.55, ROLE.key, ROLE.key, {
      faceOpacity: 0.78,
      edgeWidth: 2.2,
      edgeGlow: 7,
    });
    addBox3D(view3d, x, 0.28, 0.06, 1.15, 1.18, 1.55, ROLE.value, ROLE.value, {
      faceOpacity: 0.78,
      edgeWidth: 2.2,
      edgeGlow: 7,
    });
  }

  // Empty wireframe K/V slots for position 2 ("ran") - visible through feed-back & ask!
  const ranEmptyWire = hideNodes([
    ...addWireBox3D(view3d, colX[2], -1.45, 0.06, 1.15, 1.18, 1.55, ROLE.focus, {
      width: 2.2,
      opacity: 0.85,
      glow: 7,
    }),
    ...addWireBox3D(view3d, colX[2], 0.28, 0.06, 1.15, 1.18, 1.55, ROLE.focus, {
      width: 2.2,
      opacity: 0.85,
      glow: 7,
    }),
  ]);

  // Filled K/V 3D crystals for "ran" - hidden until AFTER "Only ran needs a new pair"
  const ranFilled = hideNodes([
    ...addBox3D(view3d, colX[2], -1.45, 0.06, 1.15, 1.18, 1.55, ROLE.key, ROLE.focus, {
      faceOpacity: 0.86,
      edgeWidth: 2.6,
      edgeGlow: 10,
    }),
    ...addBox3D(view3d, colX[2], 0.28, 0.06, 1.15, 1.18, 1.55, ROLE.value, ROLE.focus, {
      faceOpacity: 0.86,
      edgeWidth: 2.6,
      edgeGlow: 10,
    }),
    line3d([colX[2] + 0.58, -1.5, 1.92], [colX[2] + 0.58, 1.5, 1.92], {
      color: ROLE.focus,
      width: 3.4,
      glow: 12,
      blend: 'screen',
    }),
  ]);

  // 3D Query orb above "ran" + glowing Bezier scoring arcs to all 3 Keys
  const qOrigin = [colX[2] + 0.58, -0.86, 2.72];
  const queryOrb3d = hideNodes([
    point3d(qOrigin, { color: '#ffffff', radius: 11, glow: 16, blend: 'screen' }),
    point3d(qOrigin, { color: ROLE.query, radius: 16, glow: 14, blend: 'screen', opacity: 0.72 }),
  ]);

  const keyArcs3d = hideNodes([
    ...addPointerArc3D(view3d, qOrigin, [colX[0] + 0.58, -0.86, 1.66], ROLE.query, {
      lift: 0.85,
      pulseVal: phase,
      phaseOffset: 0,
    }),
    ...addPointerArc3D(view3d, qOrigin, [colX[1] + 0.58, -0.86, 1.66], ROLE.query, {
      lift: 0.55,
      pulseVal: phase,
      phaseOffset: 0.33,
    }),
    ...addPointerArc3D(view3d, qOrigin, [colX[2] + 0.58, -0.86, 1.66], ROLE.query, {
      lift: 0.35,
      pulseVal: phase,
      phaseOffset: 0.66,
    }),
  ]);

  // Value mixing arcs converging into a glowing next-token blend beacon
  const mixTarget = [colX[2] + 1.85, 0.88, 2.45];
  const mixArcs3d = hideNodes([
    ...addPointerArc3D(view3d, [colX[0] + 0.58, 0.88, 1.66], mixTarget, ROLE.value, {
      lift: 0.9,
      pulseVal: phase,
      phaseOffset: 0.1,
    }),
    ...addPointerArc3D(view3d, [colX[1] + 0.58, 0.88, 1.66], mixTarget, ROLE.value, {
      lift: 0.65,
      pulseVal: phase,
      phaseOffset: 0.42,
    }),
    ...addPointerArc3D(view3d, [colX[2] + 0.58, 0.88, 1.66], mixTarget, ROLE.fresh, {
      lift: 0.45,
      pulseVal: phase,
      phaseOffset: 0.75,
    }),
    point3d(mixTarget, { color: ROLE.fresh, radius: 13, glow: 16, blend: 'screen' }),
    point3d(mixTarget, { color: '#ffffff', radius: 7, glow: 12, blend: 'screen' }),
  ]);

  // Left-side clean floating legend & live token row (generously spaced, zero box cards)
  const tokThe = memCell('The', -760, -135, {
    w: 150,
    h: 66,
    stroke: ROLE.key,
    textColor: ROLE.key,
  });
  const tokFox = memCell('fox', -575, -135, {
    w: 150,
    h: 66,
    stroke: ROLE.key,
    textColor: ROLE.key,
  });
  const tokBlank = memCell('next ?', -390, -135, {
    w: 156,
    h: 66,
    stroke: COSMOS.dim,
    textColor: COSMOS.muted,
    dash: [6, 6],
    glow: 0,
  });

  const savedTags = group(
    txt('K, V saved', -760, -68, 26, ROLE.key, 'mono'),
    txt('K, V saved', -575, -68, 26, ROLE.key, 'mono'),
    txt('Cyan = Keys (K)', -855, 365, 26, ROLE.key, 'mono', 'left'),
    txt('Violet = Values (V)', -560, 365, 26, ROLE.value, 'mono', 'left'),
  );

  // Picked output "ran" pedestal before feeding back in
  const pickedRan = memCell('ran', -668, 52, {
    w: 164,
    h: 68,
    fill: '#191a2e',
    stroke: ROLE.focus,
    textColor: ROLE.focus,
    glow: 10,
  });
  const pickedLabel = txt('MODEL PICKS', -668, -6, 26, ROLE.focus, 'mono');

  // Fed-back "ran" in position 3 with empty K/V status
  const tokRanIn = memCell('ran', -390, -135, {
    w: 156,
    h: 66,
    fill: '#13242c',
    stroke: ROLE.focus,
    textColor: ROLE.focus,
    glow: 10,
  });
  const emptyPairTag = txt('K, V empty', -390, -68, 26, ROLE.focus, 'mono');
  const filledPairTag = txt('1 new K, V', -390, -68, 26, ROLE.fresh, 'mono').glow(6, ROLE.fresh);

  // Right-side 3D framing captions cleanly outside 3D prism bounds
  const stageCaptions = group(
    txt('3D CAUSAL KV MEMORY STAGE', 245, -420, 26, COSMOS.muted, 'mono'),
    txt('Saved pairs stay fixed  ·  append on right', 245, 464, 26, COSMOS.muted, 'sans'),
  );

  // Dynamic interactive prompts & causal state readouts in left-middle zone (y = 50..290)
  const askDyn = guardedDynamic(showAsk, (a) => {
    const pulse = 0.72 + 0.28 * Math.sin(phase.value * 5.2);
    return group(
      txt('PREDICT', -855, 58, 26, ROLE.focus, 'mono', 'left').opacity(a * pulse),
      txt('Which tokens need a fresh', -855, 110, 34, COSMOS.ink, 'sans', 'left').opacity(a),
      txt('K and V on this step?', -855, 158, 34, ROLE.focus, 'sans', 'left')
        .glow(6, ROLE.focus)
        .opacity(a),
      txt('The   ·   fox   ·   ran', -855, 224, 28, COSMOS.muted, 'mono', 'left').opacity(a),
    );
  });

  const causalDyn = guardedDynamic(
    () => Math.max(showQuery.value, showKeys.value, showMix.value, showCache.value),
    () => {
      const nodes = [];
      const qA = showQuery.value;
      const kA = showKeys.value;
      const mA = showMix.value;
      const cA = showCache.value;
      if (qA > 0.02) {
        nodes.push(
          txt('1. Query from ran', -855, 54, 28, ROLE.query, 'mono', 'left')
            .glow(5, ROLE.query)
            .opacity(qA),
        );
      }
      if (kA > 0.02) {
        nodes.push(
          txt(
            '2. Scores all 3 Keys (The, fox, ran)',
            -855,
            112,
            28,
            ROLE.key,
            'sans',
            'left',
          ).opacity(kA),
        );
      }
      if (mA > 0.02) {
        nodes.push(
          txt(
            '3. Mixes all 3 Values -> next token',
            -855,
            170,
            28,
            ROLE.value,
            'sans',
            'left',
          ).opacity(mA),
        );
        // Subtle glowing photon connecting left readout toward 3D crystal
        const arcPts = quadArcPts([-345, 170], [-140, 120], -28, 16);
        const pt = quadArcPoint([-345, 170], [-140, 120], -28, phase.value % 1);
        nodes.push(
          glowDot(pt[0], pt[1], { radius: 5.5, color: ROLE.fresh, glow: 10, opacity: mA }),
          glowDot(arcPts[0][0], arcPts[0][1], {
            radius: 4,
            color: ROLE.value,
            glow: 6,
            opacity: mA * 0.7,
          }),
        );
      }
      if (cA > 0.02) {
        nodes.push(
          txt('KV CACHE', -855, 242, 42, ROLE.fresh, 'mono', 'left')
            .glow(8, ROLE.fresh)
            .opacity(cA),
          txt('3 saved pairs ready for token 4', -855, 296, 28, COSMOS.ink, 'sans', 'left').opacity(
            cA,
          ),
        );
      }
      return group(...nodes);
    },
  );

  // Initial picture on screen immediately
  s.add(
    stageAura,
    view3d,
    header,
    tokThe,
    tokFox,
    tokBlank,
    savedTags,
    stageCaptions,
    askDyn,
    causalDyn,
  );

  // Continuous orbit & photon drift
  orbitScene(s, c, view3d, { theta: -0.34, phi: 0.96 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, phase, 4.5, { startOffset: 0.1, endMargin: 0.5 });

  // Cue 1: "the model picks ran"
  c.show('ran', [pickedLabel, pickedRan]);

  // Cue 2: "feed ran back in"
  c.swap('feed-back', [pickedLabel, pickedRan, tokBlank], [tokRanIn, emptyPairTag]);
  c.on('feed-back', () => {
    fadeInNodes(s, c, c.cue('feed-back').start, ranEmptyWire, 0.35);
  });

  // Cue 3: "Which tokens need a fresh key and value on this step" (hold 2.8s - NO answer shown!)
  c.on('ask', () => {
    s.play(showAsk.to(1, { duration: clampDur(c, c.cue('ask').start, 0.3) }));
  });

  // Cue 4: "Only ran needs a new pair" - reveal AFTER phrase ends!
  c.swap('new-pair', emptyPairTag, filledPairTag, { after: true });
  c.after('new-pair', () => {
    const t = c.cue('new-pair').end;
    s.play(showAsk.to(0, { duration: clampDur(c, t, 0.22) }));
    fadeOutNodes(s, c, t, ranEmptyWire, 0.2);
    fadeInNodes(s, c, t, ranFilled, 0.4);
  });

  // Cue 5: "Follow the query from ran"
  c.on('query', () => {
    const t = c.cue('query').start;
    s.play(showQuery.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, queryOrb3d, 0.35);
  });

  // Cue 6: "scores all three keys"
  c.on('keys', () => {
    const t = c.cue('keys').start;
    s.play(showKeys.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, keyArcs3d, 0.4);
  });

  // Cue 7: "mixing all three values"
  c.on('mix', () => {
    const t = c.cue('mix').start;
    s.play(showMix.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, mixArcs3d, 0.4);
  });

  // Cue 8: "the key value cache"
  c.on('cache', () => {
    const t = c.cue('cache').start;
    s.play(showCache.to(1, { duration: clampDur(c, t, 0.35) }));
  });
}
