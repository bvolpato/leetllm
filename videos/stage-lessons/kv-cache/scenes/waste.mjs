// Scene 2: waste - Replay the same input
// Act 1: Cold empty cache (3 projections) vs Warm saved cache (1 projection), same 3-position read.
// Act 2: Twin Isometric 3D Stages - Growing Crimson O(N^2) Pyramid (21) vs Translucent VRAM Crystal (6).
import { delay, gridPlane3d, group, line3d, par, point3d, rect } from 'vizmatic/stage';
import {
  COSMOS,
  FOX_WORDS,
  ROLE,
  STEPS,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  dashedRule,
  driftValue,
  fadeInHalf,
  fadeInNodes,
  fadeOutHalf,
  glowDot,
  guardedDynamic,
  hideNodes,
  memCell,
  txt,
} from '../parts.mjs';

export default function waste(s, c) {
  const act1Vis = s.value(1);
  const coldCount = s.value(0);
  const warmState = s.value(0);
  const readSweep = s.value(0);
  const phase = s.value(0);

  // ── Act 1: Cold vs Warm on "The fox ran" ────────────────────────────────────
  const act1Header = cinemaHeader(
    'RECOMPUTE VS CACHE',
    'Same three tokens,',
    'different write work',
    {
      x: -860,
      y: -415,
      accent: ROLE.waste,
      size: 54,
    },
  );

  const act1Aura = group(
    aura(-440, 60, 440, '#ff6b8b22'),
    aura(440, 60, 440, '#5ce1e622'),
    dashedRule(0, -180, 0, 340),
  );

  const act1Dyn = guardedDynamic(act1Vis, (a) => {
    const cold = coldCount.value;
    const warm = warmState.value;
    const sweep = readSweep.value;
    const toks = ['The', 'fox', 'ran'];
    const nodes = [
      txt('EMPTY CACHE (COLD)', -450, -155, 28, ROLE.waste, 'mono').glow(5, ROLE.waste).opacity(a),
      txt('SAVED CACHE (WARM)', 450, -155, 28, ROLE.key, 'mono').glow(5, ROLE.key).opacity(a),
    ];

    // Left row: Empty cache rebuilds The, fox, then computes ran
    for (let i = 0; i < 3; i++) {
      const cx = -670 + i * 220;
      const built = cold >= i + 0.5;
      const stroke = built ? ROLE.waste : COSMOS.dim;
      const fill = built ? '#2a1220' : '#0d1324';
      nodes.push(
        memCell(toks[i], cx, -58, {
          w: 170,
          h: 68,
          fill: '#10182b',
          stroke: COSMOS.muted,
          textColor: COSMOS.ink,
          glow: 0,
          opacity: a,
        }),
        memCell(built ? 'K, V NEW' : 'empty', cx, 66, {
          w: 170,
          h: 74,
          fill,
          stroke,
          textColor: built ? ROLE.waste : COSMOS.dim,
          size: 26,
          dash: built ? null : [6, 6],
          glow: built ? 8 : 0,
          opacity: a,
        }),
      );
    }

    const coldProj = Math.min(3, Math.round(cold));
    nodes.push(
      txt(
        coldProj === 0 ? 'Cache empty' : `${coldProj} / 3 projections built`,
        -450,
        166,
        28,
        coldProj > 0 ? ROLE.waste : COSMOS.muted,
        'mono',
      ).opacity(a),
    );

    // Right row: Saved cache keeps The & fox, projects only ran
    for (let i = 0; i < 3; i++) {
      const cx = 230 + i * 220;
      const isSaved = i < 2 && warm >= 0.5;
      const isNew = i === 2 && warm >= 1.5;
      const stroke = isSaved ? ROLE.key : isNew ? ROLE.fresh : COSMOS.dim;
      const fill = isSaved ? '#0e2433' : isNew ? '#0e2922' : '#0d1324';
      const label = isSaved ? 'SAVED' : isNew ? 'K, V NEW' : 'waiting';
      nodes.push(
        memCell(toks[i], cx, -58, {
          w: 170,
          h: 68,
          fill: '#10182b',
          stroke: COSMOS.muted,
          textColor: COSMOS.ink,
          glow: 0,
          opacity: a,
        }),
        memCell(label, cx, 66, {
          w: 170,
          h: 74,
          fill,
          stroke,
          textColor: isSaved ? ROLE.key : isNew ? ROLE.fresh : COSMOS.dim,
          size: 26,
          dash: isSaved || isNew ? null : [6, 6],
          glow: isSaved || isNew ? 8 : 0,
          opacity: a,
        }),
      );
    }

    const warmCaption =
      warm < 0.5
        ? 'Waiting for warm run'
        : warm < 1.5
          ? '2 pairs reused from cache'
          : '1 projection built (saved 2)';
    nodes.push(
      txt(warmCaption, 450, 166, 28, warm >= 1.5 ? ROLE.fresh : ROLE.key, 'mono').opacity(a),
    );

    // Synchronized golden read-sweep bar across BOTH rows
    if (sweep > 0.02) {
      const leftX = -755 + sweep * 610;
      const rightX = 145 + sweep * 610;
      nodes.push(
        rect(610, 94, { fill: null, stroke: ROLE.focus, width: 2.6, radius: 14 })
          .at(-450, 66)
          .glow(8, ROLE.focus)
          .opacity(a * Math.min(1, sweep * 2.5)),
        rect(610, 94, { fill: null, stroke: ROLE.focus, width: 2.6, radius: 14 })
          .at(450, 66)
          .glow(8, ROLE.focus)
          .opacity(a * Math.min(1, sweep * 2.5)),
        glowDot(leftX, 114, { radius: 7, color: ROLE.focus, glow: 14, opacity: a }),
        glowDot(rightX, 114, { radius: 7, color: ROLE.focus, glow: 14, opacity: a }),
        txt(
          'Both queries still score all 3 keys and mix all 3 values',
          0,
          292,
          30,
          ROLE.focus,
          'sans',
        )
          .glow(6, ROLE.focus)
          .opacity(a * Math.min(1, sweep * 2)),
      );
    }

    return group(...nodes);
  });

  // ── Act 2: Twin Isometric 3D Stages - Crimson O(N^2) Pyramid vs VRAM Crystal ──
  const act2Vis = s.value(0);
  const stepShown = s.value(0);
  const colHighlight = s.value(0);
  const totalVis = s.value(0);
  const readRowVis = s.value(0);

  const act2Title = group(
    txt('SIX-STEP PROJECTION TRACE', 0, -425, 26, ROLE.key, 'mono'),
    txt('Discard every step  vs  Keep in cache', 0, -356, 48, COSMOS.ink, 'serif').glow(
      5,
      '#38bdf8',
    ),
  );

  const act2Auras = group(
    aura(-445, 35, 440, '#ff6b8b28'),
    aura(445, 35, 440, '#5ce1e626', '#ffd16618'),
    dashedRule(0, -270, 0, 340),
  );

  const pyramidView = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 16.4,
    unit: 78,
    focus: [0, 0, 1.2],
  }).at(-445, -4);

  pyramidView.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.8, 2.8],
      z: 0,
      step: 1.1,
      color: '#462138',
      width: 1.2,
      opacity: 0.56,
    }),
  );

  // 6 pyramid layers: step r adds (r + 1) recomputed crimson slabs (1+2+3+4+5+6 = 21)
  const pyramidLayers = [];
  for (let step = 0; step < STEPS; step++) {
    const nSlabs = step + 1;
    const z = 0.06 + step * 0.52;
    const totalW = nSlabs * 0.92;
    const xStart = -2.76;
    const layerObjs = [];
    for (let k = 0; k < nSlabs; k++) {
      const x = xStart + k * 0.92;
      const isNewest = k === nSlabs - 1;
      const col = isNewest ? '#ff4d79' : ROLE.waste;
      layerObjs.push(
        ...addBox3D(
          pyramidView,
          x,
          -0.62,
          z,
          0.76,
          1.24,
          0.36,
          col,
          isNewest ? ROLE.link : ROLE.waste,
          {
            faceOpacity: isNewest ? 0.85 : 0.64,
            edgeWidth: isNewest ? 2.3 : 1.6,
            edgeGlow: isNewest ? 9 : 5,
          },
        ),
      );
    }
    layerObjs.push(
      line3d([xStart - 0.1, 0, z + 0.42], [xStart + totalW + 0.02, 0, z + 0.42], {
        color: ROLE.link,
        width: 3.0,
        glow: 10,
        blend: 'screen',
        opacity: 0.88,
      }),
    );
    pyramidView.add(layerObjs.at(-1));
    pyramidLayers.push(hideNodes(layerObjs));
  }

  // Vertical amber laser highlighting Column 0 ("The") recomputed 3+ times
  const col0Laser = hideNodes([
    line3d([-2.38, -0.75, 0.05], [-2.38, -0.75, 3.3], {
      color: ROLE.focus,
      width: 4.2,
      glow: 14,
      blend: 'screen',
    }),
    line3d([-2.38, 0.75, 0.05], [-2.38, 0.75, 3.3], {
      color: ROLE.focus,
      width: 4.2,
      glow: 14,
      blend: 'screen',
    }),
    point3d([-2.38, 0, 3.35], { color: ROLE.focus, radius: 9, glow: 14, blend: 'screen' }),
  ]);
  pyramidView.add(...col0Laser);

  const crystalView = cinematic3d({
    theta: -0.78,
    phi: 1.04,
    distance: 16.4,
    unit: 78,
    focus: [0, 0, 1.05],
  }).at(445, -4);

  crystalView.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.8, 2.8],
      z: 0,
      step: 1.1,
      color: '#243a5e',
      width: 1.2,
      opacity: 0.56,
    }),
  );

  // Frosted VRAM crystal vessel holding 6 clean K (cyan) + V (violet) slices
  addBox3D(crystalView, -3.0, -1.65, 0.04, 6.0, 3.3, 1.95, '#1b3556', ROLE.key, {
    faceOpacity: 0.16,
    edgeWidth: 1.8,
    edgeGlow: 6,
  });

  const crystalSlices = [];
  for (let step = 0; step < STEPS; step++) {
    const x = -2.72 + step * 0.94;
    const kSlab = addBox3D(crystalView, x, -1.38, 0.18, 0.72, 1.24, 1.56, ROLE.key, ROLE.focus, {
      faceOpacity: 0.74,
      edgeWidth: 2.1,
      edgeGlow: 7,
    });
    const vSlab = addBox3D(crystalView, x, 0.14, 0.18, 0.72, 1.24, 1.56, ROLE.value, ROLE.focus, {
      faceOpacity: 0.74,
      edgeWidth: 2.1,
      edgeGlow: 7,
    });
    const beacon = point3d([x + 0.36, 0, 2.12], {
      color: ROLE.focus,
      radius: 7.2,
      glow: 13,
      blend: 'screen',
    });
    crystalView.add(beacon);
    crystalSlices.push(hideNodes([...kSlab, ...vSlab, beacon]));
  }

  // Golden read-row scan beam on crystal top
  const crystalReadBeam = hideNodes([
    line3d([-2.85, 0, 2.38], [2.85, 0, 2.38], {
      color: ROLE.focus,
      width: 4.0,
      glow: 14,
      blend: 'screen',
    }),
  ]);
  crystalView.add(...crystalReadBeam);

  const act2Overlay = guardedDynamic(act2Vis, (a) => {
    const n = Math.max(0, Math.min(STEPS, Math.round(stepShown.value)));
    const quad = (n * (n + 1)) / 2;
    const wordStr =
      n > 0 ? FOX_WORDS.slice(0, n).join(' · ') : '6 steps: The fox ran straight past us';
    const nodes = [
      txt('DISCARD EACH STEP  ·  O(N²)', -445, -296, 28, ROLE.waste, 'mono')
        .glow(5, ROLE.waste)
        .opacity(a),
      txt('KEEP IN KV CACHE  ·  O(N)', 445, -296, 28, ROLE.key, 'mono')
        .glow(5, ROLE.key)
        .opacity(a),
      txt(wordStr, 0, -244, 26, COSMOS.muted, 'mono').opacity(a),
      txt(
        n === 0 ? 'Waiting for step 1' : `Step ${n}  ->  ${quad} projections`,
        -445,
        348,
        28,
        ROLE.waste,
        'mono',
      ).opacity(a),
      txt(
        n === 0 ? 'Waiting for step 1' : `Step ${n}  ->  ${n} projections`,
        445,
        348,
        28,
        ROLE.fresh,
        'mono',
      ).opacity(a),
    ];
    const colA = a * colHighlight.value * fadeOutHalf(totalVis.value);
    if (colA > 0.02) {
      nodes.push(
        txt('"The" recomputed 3× in column 1', -445, 404, 26, ROLE.focus, 'sans')
          .glow(6, ROLE.focus)
          .opacity(colA),
      );
    }
    const totA = a * fadeInHalf(totalVis.value);
    if (totA > 0.02) {
      nodes.push(
        txt('21 total writes  vs  6 writes', 0, 404, 32, ROLE.fresh, 'mono')
          .glow(8, ROLE.fresh)
          .opacity(totA),
      );
    }
    if (readRowVis.value > 0.02) {
      nodes.push(
        txt('History reads still cover all 6 positions on step 6', 0, 458, 28, ROLE.focus, 'sans')
          .glow(6, ROLE.focus)
          .opacity(a * readRowVis.value),
      );
    }
    return group(...nodes);
  });

  // Initial picture (Act 1)
  s.add(act1Aura, act1Header, act1Dyn, act2Overlay);
  driftValue(s, c, phase, 6, { startOffset: 0.1, endMargin: 0.5 });

  // Act 1 cues
  c.on('cold', () => {
    s.play(coldCount.to(0.1, { duration: clampDur(c, c.cue('cold').start, 0.25) }));
  });
  c.on('rebuild', () => {
    s.play(coldCount.to(2, { duration: clampDur(c, c.cue('rebuild').start, 0.65) }));
  });
  c.on('third', () => {
    s.play(coldCount.to(3, { duration: clampDur(c, c.cue('third').start, 0.45) }));
  });
  c.on('warm', () => {
    s.play(warmState.to(1, { duration: clampDur(c, c.cue('warm').start, 0.4) }));
  });
  c.on('one', () => {
    s.play(warmState.to(2, { duration: clampDur(c, c.cue('one').start, 0.45) }));
  });
  c.on('same-read', () => {
    s.play(readSweep.to(1, { duration: clampDur(c, c.cue('same-read').start, 0.9) }));
  });

  // Transition to Act 2 at "six successive steps"
  c.swap('six-steps', [act1Aura, act1Header], [act2Auras, pyramidView, crystalView, act2Title]);
  c.on('six-steps', () => {
    const t = c.cue('six-steps').start;
    const orbDur = clampDur(c, t, c.end - t - 0.55, 0.5);
    s.play(
      par(
        act1Vis.to(0, { duration: 0.16 }),
        delay(act2Vis.to(1, { duration: 0.28 }), 0.22),
        pyramidView.orbit({ theta: -0.4, phi: 0.96 }, { duration: orbDur }),
        crystalView.orbit({ theta: -0.4, phi: 0.96 }, { duration: orbDur }),
      ),
    );
  });

  // Reveal all 6 layers on r1..r6
  const stepCues = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
  stepCues.forEach((id, idx) => {
    c.on(id, () => {
      const t = c.cue(id).start;
      s.play(stepShown.to(idx + 1, { duration: clampDur(c, t, 0.25) }));
      fadeInNodes(s, c, t, [...pyramidLayers[idx], ...crystalSlices[idx]], 0.32);
    });
  });

  c.on('column', () => {
    const t = c.cue('column').start;
    s.play(colHighlight.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, col0Laser, 0.35);
  });

  c.after('total', () => {
    const t = c.cue('total').end;
    s.play(totalVis.to(1, { duration: clampDur(c, t, 0.3) }));
  });

  c.on('read-row', () => {
    const t = c.cue('read-row').start;
    s.play(readRowVis.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, crystalReadBeam, 0.35);
  });
}
