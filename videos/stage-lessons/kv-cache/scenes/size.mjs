// Scene 4: size - So how big is it?
// Orbiting 3D KV memory prism building along its axes (2 x 32 layers x 8 KV heads x 128 x 2B = 128 KiB),
// extruding to 4,096 tokens (512 MiB, 80 in 40 GiB), then 70B prediction challenge (80 layers -> 320 KiB,
// 1.25 GiB, 160 GiB) with answer strictly withheld until spoken reveal.
import { gridPlane3d, group, par, rect } from 'vizmatic/stage';
import {
  BIG_LAYERS,
  BIG_PER_TOKEN,
  CONVERSATION,
  COSMOS,
  EIGHTY,
  GIB,
  HEADS,
  HEAD_SIZE,
  KIB,
  LAYERS,
  MIB,
  PER_TOKEN,
  ROLE,
  addBox3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeInNodes,
  fadeOutHalf,
  fmt,
  glowBar,
  glowTex,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function size(s, c) {
  const phase = s.value(0);
  const mode70B = s.value(0); // 0 = 8B, 1 = 70B challenge
  const factorStep = s.value(0); // 1..6 formula factors
  const shareVis = s.value(0);
  const bytesVis = s.value(0);
  const kibiVis = s.value(0);
  const perTokVis = s.value(0);
  const extraVis = s.value(0);
  const convoVis = s.value(0);
  const convoFrac = s.value(0);
  const halfGigVis = s.value(0);
  const budgetVis = s.value(0);
  const eightyVis = s.value(0);
  const ask70Vis = s.value(0);
  const mult70Vis = s.value(0);
  const ans70Vis = s.value(0);
  const quarterVis = s.value(0);
  const fleetVis = s.value(0);
  const capVis = s.value(0);

  const stageAura = aura(340, 20, 620, '#5ce1e626', '#ffd16618');

  // Orbiting 3D KV prism on the right side (shifted up cleanly above bottom readouts)
  const prismView = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 16.0,
    unit: 82,
    focus: [0, 0, 1.35],
  }).at(380, -34);

  prismView.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.6, 2.6],
      z: 0,
      step: 1.1,
      color: '#24385c',
      width: 1.2,
      opacity: 0.54,
    }),
  );

  // Base prism outline for 1 token (always present so frame is rich from t = 0)
  addWireBox3D(prismView, -2.6, -1.4, 0.06, 1.2, 2.8, 1.5, ROLE.key, {
    width: 1.8,
    opacity: 0.55,
    glow: 5,
  });

  // Key (cyan) & Value (violet) pair for token 1
  const kvBase = hideNodes([
    ...addBox3D(prismView, -2.55, -1.32, 0.08, 1.08, 1.18, 0.55, ROLE.key, ROLE.key, {
      faceOpacity: 0.82,
      edgeWidth: 2.1,
      edgeGlow: 7,
    }),
    ...addBox3D(prismView, -2.55, 0.14, 0.08, 1.08, 1.18, 0.55, ROLE.value, ROLE.value, {
      faceOpacity: 0.82,
      edgeWidth: 2.1,
      edgeGlow: 7,
    }),
  ]);

  // 32-layer vertical stack (represented as 2 additional glowing tiers up to z = 1.55)
  const layerStack32 = hideNodes([
    ...addBox3D(prismView, -2.55, -1.32, 0.68, 1.08, 1.18, 0.85, ROLE.key, ROLE.focus, {
      faceOpacity: 0.72,
      edgeWidth: 2.0,
      edgeGlow: 7,
    }),
    ...addBox3D(prismView, -2.55, 0.14, 0.68, 1.08, 1.18, 0.85, ROLE.value, ROLE.focus, {
      faceOpacity: 0.72,
      edgeWidth: 2.0,
      edgeGlow: 7,
    }),
  ]);

  // Extruded length slices showing growth to 4,096 tokens (4 additional translucent slabs along +X)
  const growSlabs = [];
  for (let i = 0; i < 4; i++) {
    const x = -1.25 + i * 1.18;
    growSlabs.push(
      ...addBox3D(prismView, x, -1.32, 0.08, 1.02, 1.18, 1.45, ROLE.key, ROLE.key, {
        faceOpacity: 0.55 + i * 0.06,
        edgeWidth: 1.8,
        edgeGlow: 6,
      }),
      ...addBox3D(prismView, x, 0.14, 0.08, 1.02, 1.18, 1.45, ROLE.value, ROLE.value, {
        faceOpacity: 0.55 + i * 0.06,
        edgeWidth: 1.8,
        edgeGlow: 6,
      }),
    );
  }
  hideNodes(growSlabs);

  // Overhead bookkeeping wireframe aura around crystal
  const extraShell = hideNodes(
    addWireBox3D(prismView, -2.85, -1.65, 0.02, 6.45, 3.3, 1.78, ROLE.link, {
      width: 1.6,
      opacity: 0.65,
      glow: 5,
    }),
  );

  // 70B 80-layer tall vertical extension (2.5x taller stack on z = 1.6..3.15!)
  const stack70B = hideNodes([
    ...addBox3D(prismView, -2.55, -1.32, 1.62, 1.08, 1.18, 1.48, ROLE.focus, ROLE.link, {
      faceOpacity: 0.78,
      edgeWidth: 2.4,
      edgeGlow: 9,
    }),
    ...addBox3D(prismView, -2.55, 0.14, 1.62, 1.08, 1.18, 1.48, ROLE.waste, ROLE.link, {
      faceOpacity: 0.74,
      edgeWidth: 2.4,
      edgeGlow: 9,
    }),
  ]);

  // Left-side 8B formula & progressive bill
  const header8B = cinemaHeader('LLAMA 3  ·  8B SHAPE', 'How big is', 'one token of KV?', {
    x: -860,
    y: -415,
    accent: ROLE.key,
    size: 54,
  });

  const eq8B = glowTex(String.raw`2 \times 32 \times 8 \times 128 \times 2`, {
    x: -560,
    y: -148,
    size: 40,
    color: ROLE.focus,
    glow: 6,
  });

  const eq70B = glowTex(String.raw`2 \times 80 \times 8 \times 128 \times 2`, {
    x: -560,
    y: -148,
    size: 40,
    color: ROLE.link,
    glow: 7,
  });

  // Dynamic left-side bill readouts for 8B (clean fadeOutHalf so 8B->70B never overlaps!)
  const left8BDyn = guardedDynamic(
    () => fadeOutHalf(mode70B.value),
    (a) => {
      const st = factorStep.value;
      const nodes = [];
      const rows = [
        [1, '2          Key + Value', ROLE.key],
        [2, `${LAYERS}         Layers`, ROLE.prefill],
        [3, `${HEADS}          KV heads (shared by 32 Q heads)`, ROLE.value],
        [4, `${HEAD_SIZE}        Head width`, ROLE.fresh],
        [5, `${2} B        FP16 precision`, ROLE.focus],
      ];
      rows.forEach(([thresh, label, col], idx) => {
        if (st >= thresh - 0.1) {
          const op = Math.min(1, st - thresh + 1);
          nodes.push(txt(label, -855, -72 + idx * 46, 26, col, 'mono', 'left').opacity(a * op));
        }
      });

      const shA = a * shareVis.value * fadeOutHalf(bytesVis.value);
      if (shA > 0.02) {
        nodes.push(
          txt('Only the 8 KV heads are stored', -855, 184, 26, ROLE.focus, 'sans', 'left').opacity(
            shA,
          ),
        );
      }

      const byA = a * fadeInHalf(bytesVis.value);
      if (byA > 0.02) {
        nodes.push(
          txt(`= ${fmt(PER_TOKEN)} bytes`, -855, 184, 30, COSMOS.ink, 'mono', 'left').opacity(byA),
        );
      }
      if (kibiVis.value > 0.05) {
        nodes.push(
          txt(
            '1 KiB = 1,024 B   ·   ×1,024 -> MiB -> GiB',
            -855,
            232,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(a * kibiVis.value),
        );
      }
      if (perTokVis.value > 0.05) {
        nodes.push(
          txt(`${PER_TOKEN / KIB} KiB / token`, -855, 294, 42, ROLE.focus, 'mono', 'left')
            .glow(8, ROLE.focus)
            .opacity(a * perTokVis.value),
        );
      }
      if (extraVis.value > 0.05) {
        nodes.push(
          txt(
            '+ reserve room for tables & buffers',
            -855,
            356,
            26,
            ROLE.link,
            'sans',
            'left',
          ).opacity(a * extraVis.value),
        );
      }

      // 4,096 token & 40 GiB pool readout well below 3D crystal (y = 352..460)
      if (convoVis.value > 0.05) {
        const cA = a * convoVis.value;
        const tokNow =
          convoFrac.value > 0.85 ? 4096 : Math.max(1, Math.round(convoFrac.value * 4096));
        const mibNow = Math.round((tokNow * PER_TOKEN) / MIB);
        nodes.push(
          txt(
            `${fmt(tokNow)} tokens  ->  ${fmt(mibNow)} MiB${halfGigVis.value > 0.5 ? ' (0.5 GiB)' : ''}`,
            380,
            352,
            30,
            ROLE.key,
            'mono',
          )
            .glow(6, ROLE.key)
            .opacity(cA),
        );
      }
      if (budgetVis.value > 0.05) {
        const gA = a * budgetVis.value;
        nodes.push(
          glowBar(40, 404, 680, 30, eightyVis.value > 0.5 ? 1.0 : 0.14, {
            fill: ROLE.fresh,
            glow: 8,
            opacity: gA,
          }),
          txt('40 GiB KV cache', 190, 456, 28, COSMOS.muted, 'mono').opacity(gA),
        );
        if (eightyVis.value > 0.05) {
          nodes.push(
            txt(`-> ${EIGHTY} max`, 545, 456, 30, ROLE.fresh, 'mono')
              .glow(7, ROLE.fresh)
              .opacity(a * eightyVis.value),
          );
        }
      }
      return group(...nodes);
    },
  );

  // Dynamic left-side 70B challenge & reveal (clean fadeInHalf so zero overlap with 8B!)
  const header70B = cinemaHeader(
    'YOUR TURN  ·  LLAMA 3 70B',
    '80 layers, same',
    'heads and width',
    {
      x: -860,
      y: -415,
      accent: ROLE.link,
      size: 54,
    },
  );

  const left70BDyn = guardedDynamic(
    () => fadeInHalf(mode70B.value),
    (a) => {
      const pulse = 0.72 + 0.28 * Math.sin(phase.value * 5.0);
      const nodes = [
        txt(
          `${BIG_LAYERS} layers  ·  ${HEADS} KV heads  ·  ${HEAD_SIZE} width  ·  2 B`,
          -855,
          -72,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      ];

      const askA = a * ask70Vis.value * fadeOutHalf(ans70Vis.value);
      if (askA > 0.02) {
        nodes.push(
          txt('CALCULATE', -855, 22, 26, ROLE.focus, 'mono', 'left').opacity(askA * pulse),
          txt('What does one token cost?', -855, 82, 38, COSMOS.ink, 'serif', 'left').opacity(askA),
          txt('2 × 80 × 8 × 128 × 2  =  ?', -855, 148, 32, ROLE.focus, 'mono', 'left')
            .glow(6, ROLE.focus)
            .opacity(askA),
        );
      }

      const multA = a * mult70Vis.value * fadeOutHalf(ans70Vis.value);
      if (multA > 0.02) {
        nodes.push(
          txt('2 × 80 × 8 × 128 × 2 ...', -855, 214, 28, ROLE.link, 'mono', 'left').opacity(multA),
        );
      }

      const rA = a * fadeInHalf(ans70Vis.value);
      if (rA > 0.02) {
        nodes.push(
          txt(`${BIG_PER_TOKEN / KIB} KiB / token`, -855, 58, 48, ROLE.focus, 'mono', 'left')
            .glow(10, ROLE.focus)
            .opacity(rA),
        );
      }
      if (quarterVis.value > 0.05) {
        nodes.push(
          txt(
            `4,096 tokens  ->  ${((BIG_PER_TOKEN * 4096) / GIB).toFixed(2)} GiB`,
            -855,
            136,
            30,
            ROLE.key,
            'mono',
            'left',
          ).opacity(a * quarterVis.value),
        );
      }
      if (fleetVis.value > 0.05) {
        nodes.push(
          txt(
            `128 conversations  ->  ${(128 * BIG_PER_TOKEN * 4096) / GIB} GiB`,
            -855,
            198,
            30,
            ROLE.waste,
            'mono',
            'left',
          )
            .glow(6, ROLE.waste)
            .opacity(a * fleetVis.value),
        );
      }
      if (capVis.value > 0.05) {
        nodes.push(
          txt(
            'Memory caps concurrency before compute does',
            -855,
            288,
            28,
            ROLE.link,
            'sans',
            'left',
          )
            .glow(6, ROLE.link)
            .opacity(a * capVis.value),
          rect(540, 26, { fill: '#2a1220', stroke: ROLE.waste, width: 2.2, radius: 8 })
            .at(-585, 344)
            .glow(8, ROLE.waste)
            .opacity(a * capVis.value),
        );
      }

      // Caption cleanly below 3D crystal in 70B mode
      nodes.push(
        txt('80 LAYERS = 2.5× TALLER KV STACK', 380, 446, 28, ROLE.link, 'mono')
          .glow(5, ROLE.link)
          .opacity(a),
      );
      return group(...nodes);
    },
  );

  const stageCaption = txt('3D KV CACHE PRISM', 380, -424, 26, COSMOS.muted, 'mono');

  // Initial picture
  s.add(stageAura, prismView, header8B, stageCaption, left8BDyn, left70BDyn);
  orbitScene(s, c, prismView, { theta: -0.34, phi: 0.94 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, phase, 9.0, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0 cues (8B shape)
  c.show('shape', eq8B);
  c.on('key-and-value', () => {
    const t = c.cue('key-and-value').start;
    s.play(factorStep.to(1, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, kvBase, 0.35);
  });
  c.on('layers', () => {
    const t = c.cue('layers').start;
    s.play(factorStep.to(2, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, layerStack32, 0.4);
  });
  c.on('heads', () => {
    s.play(factorStep.to(3, { duration: clampDur(c, c.cue('heads').start, 0.25) }));
  });
  c.on('share-heads', () => {
    s.play(shareVis.to(0.65, { duration: clampDur(c, c.cue('share-heads').start, 0.25) }));
  });
  c.on('stored', () => {
    s.play(shareVis.to(1, { duration: clampDur(c, c.cue('stored').start, 0.25) }));
  });
  c.on('numbers', () => {
    s.play(factorStep.to(4, { duration: clampDur(c, c.cue('numbers').start, 0.25) }));
  });
  c.on('two-bytes', () => {
    s.play(factorStep.to(5, { duration: clampDur(c, c.cue('two-bytes').start, 0.25) }));
  });

  // Beat 1 cues (131,072 B -> 128 KiB)
  c.after('bytes', () => {
    s.play(bytesVis.to(1, { duration: clampDur(c, c.cue('bytes').end, 0.3) }));
  });
  c.on('kibi', () => {
    s.play(kibiVis.to(1, { duration: clampDur(c, c.cue('kibi').start, 0.3) }));
  });
  c.after('per-token', () => {
    s.play(perTokVis.to(1, { duration: clampDur(c, c.cue('per-token').end, 0.3) }));
  });
  c.on('extra', () => {
    const t = c.cue('extra').start;
    s.play(extraVis.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, extraShell, 0.35);
  });

  // Beat 2 cues (4,096 tokens -> 512 MiB -> 80 in 40 GiB)
  c.on('grows', () => {
    const t = c.cue('grows').start;
    s.play(
      par(
        convoVis.to(1, { duration: clampDur(c, t, 0.3) }),
        convoFrac.to(1, { duration: clampDur(c, t, 1.4) }),
      ),
    );
    fadeInNodes(s, c, t, growSlabs, 0.55);
  });
  c.on('conversation-bytes', () => {
    s.play(convoFrac.to(1, { duration: clampDur(c, c.cue('conversation-bytes').start, 0.25) }));
  });
  c.on('half-gig', () => {
    s.play(halfGigVis.to(1, { duration: clampDur(c, c.cue('half-gig').start, 0.25) }));
  });
  c.on('budget', () => {
    s.play(budgetVis.to(1, { duration: clampDur(c, c.cue('budget').start, 0.3) }));
  });
  c.after('eighty', () => {
    s.play(eightyVis.to(1, { duration: clampDur(c, c.cue('eighty').end, 0.3) }));
  });

  // Beat 3 cues (70B prediction - answer strictly hidden!)
  c.swap('try', [header8B, eq8B], [header70B, eq70B]);
  c.on('try', () => {
    s.play(mode70B.to(1, { duration: clampDur(c, c.cue('try').start, 0.3) }));
  });
  c.on('eighty-layers', () => {
    fadeInNodes(s, c, c.cue('eighty-layers').start, stack70B, 0.45);
  });
  c.on('ask', () => {
    s.play(ask70Vis.to(1, { duration: clampDur(c, c.cue('ask').start, 0.3) }));
  });

  // Beat 4 cues (70B reveals - strictly AFTER spoken result phrases!)
  c.on('multiply', () => {
    s.play(mult70Vis.to(1, { duration: clampDur(c, c.cue('multiply').start, 0.25) }));
  });
  c.after('answer', () => {
    s.play(ans70Vis.to(1, { duration: clampDur(c, c.cue('answer').end, 0.3) }));
  });
  c.after('quarter', () => {
    s.play(quarterVis.to(1, { duration: clampDur(c, c.cue('quarter').end, 0.3) }));
  });
  c.after('fleet', () => {
    s.play(fleetVis.to(1, { duration: clampDur(c, c.cue('fleet').end, 0.3) }));
  });
  c.on('cap', () => {
    s.play(capVis.to(1, { duration: clampDur(c, c.cue('cap').start, 0.35) }));
  });
}
