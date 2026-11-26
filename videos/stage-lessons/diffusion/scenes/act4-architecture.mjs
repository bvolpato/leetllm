// Act 4: U-Net / DiT / MM-DiT Architectures, Timestep Modulation, Flow Matching Paths,
// Spatial Cross-Attention Conditioning, Exact Cross-Attention Read, and CFG Vector Extrapolation.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  SHADOW_PIXEL,
  TOP_PIXEL,
  aura,
  cinemaGrid,
  crossReadFixture,
  cueTo,
  decimal,
  glassPlate,
  glowTex,
  guardedDynamic,
  image,
  livingDrift,
  photonWire,
  pixelGrid,
  polyPath,
  pulseCue,
  txt,
  vecLabel,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 14. architectures: One denoiser uses all of its layers at each selected level
// Cues: df-architectures-0, df-architectures-1, df-architectures-2
// ---------------------------------------------------------------------------
export function architectures(s, c) {
  const mode = s.value(0); // 0 = U-Net, 1 = DiT, 2 = MM-DiT
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45 }));
  s.add(aura(0, 0, 560, '#2a588a24', '#16203e12'));

  const liveArch = dynamic(() => {
    const m = mode.value;
    const ph = drift.value;

    if (m < 0.5) {
      // Beat 0: U-Net spatial pyramid with luminous skip-connection bridges
      const stages = [
        { label: 'Down 1', res: '64 × 64', x: -640, y: -130, w: 280, h: 110, col: COSMOS.blue },
        { label: 'Down 2', res: '32 × 32', x: -245, y: 15, w: 280, h: 110, col: COSMOS.cyan },
        { label: 'Bottleneck', res: '16 × 16', x: 150, y: 155, w: 290, h: 110, col: COSMOS.violet },
        { label: 'Up + Skip', res: '64 × 64', x: 580, y: -130, w: 300, h: 110, col: COSMOS.gold },
      ];
      const nodes = [
        txt('DIFFUSION U-NET  ·  SAME-RESOLUTION SKIPS', 0, -372, 32, COSMOS.cyan, 'mono'),
        ...stages.flatMap((st) => [
          glassPlate(st.x, st.y, st.w, st.h, { stroke: st.col, glow: 9 }),
          txt(st.label, st.x, st.y - 16, 32, st.col, 'serif'),
          txt(st.res, st.x, st.y + 24, 26, COSMOS.muted, 'mono'),
        ]),
        // Main U-path photon wires
        photonWire(
          [
            [-495, -130],
            [-420, -130],
            [-420, 15],
            [-390, 15],
          ],
          ph * 3,
          { color: COSMOS.cyan, width: 3.4 },
        ),
        photonWire(
          [
            [-100, 15],
            [-25, 15],
            [-25, 155],
            [0, 155],
          ],
          ph * 3 + 0.25,
          { color: COSMOS.violet, width: 3.4 },
        ),
        photonWire(
          [
            [300, 155],
            [380, 155],
            [380, -130],
            [425, -130],
          ],
          ph * 3 + 0.5,
          { color: COSMOS.gold, width: 3.4 },
        ),
        // High-altitude glowing skip bridge directly from Down 1 to Up + Skip
        photonWire(
          [
            [-640, -190],
            [-640, -270],
            [580, -270],
            [580, -190],
          ],
          ph * 2.4,
          { color: COSMOS.rose, width: 4 },
        ),
        txt('skip connection  (same spatial scale)', -30, -306, 28, COSMOS.rose, 'mono'),
        txt(
          'All layers run per evaluation · 50 sampler steps ≠ 50 layers',
          0,
          365,
          30,
          COSMOS.muted,
          'sans',
        ),
      ];
      return group(...nodes);
    }

    if (m < 1.5) {
      // Beat 1: DiT patchify -> transformer stack -> unpatchify
      const nodes = [txt('DIFFUSION TRANSFORMER (DiT)', 0, -372, 32, COSMOS.gold, 'mono')];
      for (let i = 0; i < 6; i++) {
        const px = -600 + i * 240;
        nodes.push(
          glassPlate(px, -215, 190, 92, { stroke: COSMOS.blue, glow: 6 }),
          txt(`Patch ${i}`, px, -215, 28, COSMOS.cyan, 'mono'),
          photonWire(
            [
              [px, -165],
              [px, -95],
            ],
            ph * 3 + i * 0.14,
            { color: COSMOS.cyan, width: 2.6 },
          ),
          photonWire(
            [
              [px, 95],
              [px, 165],
            ],
            ph * 3 + i * 0.14 + 0.5,
            { color: COSMOS.violet, width: 2.6 },
          ),
          glassPlate(px, 215, 190, 92, { stroke: COSMOS.violet, glow: 6 }),
          txt(`Out ${i}`, px, 215, 28, COSMOS.gold, 'mono'),
        );
      }
      nodes.push(
        glassPlate(0, 0, 1440, 175, { stroke: COSMOS.gold, glow: 10 }),
        txt(
          'DiT Transformer Blocks  (shared weights at every timestep)',
          0,
          -24,
          34,
          COSMOS.ink,
          'serif',
        ),
        txt(
          'Smaller patches → more tokens → more attention & projection work',
          0,
          32,
          28,
          COSMOS.gold,
          'sans',
        ),
        txt(
          'Original DiT paper: class-conditioned ImageNet scope',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes);
    }

    // Beat 2: MM-DiT dual modality projections + joint attention + 16-ch latent
    return group(
      txt(
        'MULTIMODAL DiT (SD3)  ·  SEPARATE WEIGHTS, JOINT ATTENTION',
        0,
        -372,
        30,
        COSMOS.cyan,
        'mono',
      ),
      glassPlate(-460, -175, 680, 150, { stroke: COSMOS.cyan, glow: 9 }),
      txt('Image Tokens', -460, -204, 36, COSMOS.cyan, 'serif'),
      txt('Dedicated image weights · 16-ch VAE', -460, -144, 26, COSMOS.muted, 'sans'),

      glassPlate(460, -175, 680, 150, { stroke: COSMOS.violet, glow: 9 }),
      txt('Text Tokens', 460, -204, 36, COSMOS.violet, 'serif'),
      txt('Dedicated text projection weights', 460, -144, 26, COSMOS.muted, 'sans'),

      photonWire(
        [
          [-470, -95],
          [-240, 55],
        ],
        ph * 3,
        { color: COSMOS.cyan, width: 4 },
      ),
      photonWire(
        [
          [470, -95],
          [240, 55],
        ],
        ph * 3 + 0.5,
        { color: COSMOS.violet, width: 4 },
      ),

      glassPlate(0, 145, 960, 165, { stroke: COSMOS.gold, glow: 12 }),
      txt('Joint Bidirectional Attention', 0, 114, 40, COSMOS.gold, 'serif').glow(8, COSMOS.gold),
      txt(
        'Image and text attend to each other directly · Rectified-flow training',
        0,
        174,
        26,
        COSMOS.ink,
        'sans',
      ),

      txt(
        'DiT label alone does not guarantee faster latency · measure matched workload',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
  });

  s.add(liveArch);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-architectures-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-architectures-1', mode, 1, { dur: 0.45 });
  cueTo(s, c, 'df-architectures-2', mode, 2, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 15. time-conditioning: The noise-level input changes the computation inside a block
// Cues: df-time-conditioning-0, df-time-conditioning-1, df-mod-first, df-mod-second
// ---------------------------------------------------------------------------
export function timeConditioning(s, c) {
  const mode = s.value(0); // 0 = circuit, 1 = live modulation rows
  const row1Rev = s.value(0);
  const row2Rev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.44 }));
  s.add(aura(0, 0, 540, '#ffd16620', '#18244a12'));

  const modEq = glowTex(String.raw`h' = (1 + s)\,h + b`, {
    x: 0,
    y: -342,
    size: 54,
    color: COSMOS.gold,
    glow: 8,
  });

  const baseH = [0.2, -0.1, 0.5];
  const highOut = baseH.map((h) => (1 + 0.5) * h - 0.05); // [0.25, -0.20, 0.70]
  const lowOut = baseH.map((h) => (1 + 0.05) * h + 0.02); // [0.23, -0.085, 0.545]

  const liveMod = dynamic(() => {
    const m = mode.value;
    const r1 = row1Rev.value > 0.5;
    const r2 = row2Rev.value > 0.5;
    const ph = drift.value;

    if (m < 0.5) {
      // Beat 0: Sinusoid timestep embedding -> Scale/Shift/Gate -> Modulated Block
      const wavePts = Array.from({ length: 48 }, (_, i) => {
        const u = i / 47;
        return [-700 + u * 300, -40 + Math.sin(u * Math.PI * 6 + ph * 12) * 34];
      });
      return group(
        glassPlate(-550, -40, 420, 210, { stroke: COSMOS.gold, glow: 9 }),
        txt('TIMESTEP EMBEDDING', -550, -108, 26, COSMOS.gold, 'mono'),
        new Node(polyPath(wavePts)).stroke(COSMOS.gold, 3.2, 0.9).glow(6, COSMOS.gold),
        txt('noise level t', -550, 32, 26, COSMOS.muted, 'mono'),

        photonWire(
          [
            [-335, -40],
            [-215, -40],
          ],
          ph * 3.4,
          { color: COSMOS.gold, width: 4 },
        ),

        glassPlate(0, -40, 420, 210, { stroke: COSMOS.violet, glow: 9 }),
        txt('SCALE  ·  SHIFT  ·  GATE', 0, -90, 26, COSMOS.violet, 'mono'),
        txt('(s, b, gate)', 0, -24, 42, COSMOS.ink, 'mono'),
        txt('AdaLN / FiLM controls', 0, 36, 26, COSMOS.muted, 'sans'),

        photonWire(
          [
            [215, -40],
            [335, -40],
          ],
          ph * 3.4 + 0.5,
          { color: COSMOS.cyan, width: 4 },
        ),

        glassPlate(550, -40, 420, 210, { stroke: COSMOS.cyan, glow: 9 }),
        txt('SHARED BLOCK', 550, -90, 26, COSMOS.cyan, 'mono'),
        txt('h  →  h′', 550, -24, 44, COSMOS.cyan, 'mono').glow(8, COSMOS.cyan),
        txt('Same weights, new regime', 550, 36, 26, COSMOS.muted, 'sans'),

        txt(
          'Same observed coordinate means different things at high vs low noise',
          0,
          290,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    // Beat 1: Live numeric modulation comparison for feature h = [0.2, -0.1, 0.5]
    const cols = [-380, 120, 520];
    const rows = [
      {
        label: 'Feature h',
        sub: 'fixed input',
        vals: baseH,
        digits: 2,
        shown: true,
        col: COSMOS.cyan,
        y: -145,
      },
      {
        label: 'High noise',
        sub: 's = 0.50 · b = −0.05',
        vals: highOut,
        digits: 2,
        shown: r1,
        col: COSMOS.gold,
        y: 35,
      },
      {
        label: 'Low noise',
        sub: 's = 0.05 · b = +0.02',
        vals: lowOut,
        digits: 3,
        shown: r2,
        col: COSMOS.emerald,
        y: 215,
      },
    ];

    const nodes = [
      txt('Coord 0', cols[0], -238, 26, COSMOS.muted, 'mono'),
      txt('Coord 1', cols[1], -238, 26, COSMOS.muted, 'mono'),
      txt('Coord 2', cols[2], -238, 26, COSMOS.muted, 'mono'),
    ];
    for (const row of rows) {
      nodes.push(
        glassPlate(0, row.y, 1660, 136, {
          stroke: row.shown ? row.col : '#33446b',
          glow: row.shown ? 8 : 2,
        }),
        txt(row.label, -790, row.y - 20, 32, row.col, 'serif', 'left'),
        txt(row.sub, -790, row.y + 26, 26, COSMOS.muted, 'mono', 'left'),
      );
      row.vals.forEach((v, i) => {
        const barW = Math.min(180, Math.abs(v) * 210);
        nodes.push(
          txt(
            row.shown ? decimal(v, i === 0 ? 2 : row.digits) : '?',
            cols[i],
            row.y - 12,
            38,
            row.shown ? row.col : COSMOS.muted,
            'mono',
          ).glow(row.shown && i === 0 ? 8 : 0, row.col),
          row.shown
            ? rect(barW, 10, { fill: row.col, stroke: null, radius: 5 })
                .at(cols[i], row.y + 34)
                .opacity(0.75)
            : group(),
        );
      });
    }
    nodes.push(txt('First feature:  0.20 × (1 + scale) + shift', 0, 365, 30, COSMOS.muted, 'mono'));
    return group(...nodes);
  });

  s.add(liveMod, modEq);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-time-conditioning-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-time-conditioning-1', mode, 1, { dur: 0.45 });
  cueTo(s, c, 'df-mod-first', row1Rev, 1, { after: true, dur: 0.3 });
  cueTo(s, c, 'df-mod-second', row2Rev, 1, { after: true, dur: 0.3 });
}

// ---------------------------------------------------------------------------
// 16. flow-paths: A straight training pair differs from the learned sampling field
// Cues: df-flow-paths-0, df-flow-paths-1, df-flow-velocity, df-flow-step, df-flow-paths-2
// ---------------------------------------------------------------------------
export function flowPaths(s, c) {
  const mode = s.value(0); // 0 = pair, 1 = Euler step, 2 = crossing pairs vs curved marginal
  const velRev = s.value(0);
  const stepRev = s.value(0);
  const curveP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.46 }));
  s.add(aura(-420, 40, 460, '#5ce1e622', '#17203d12'));
  s.add(aura(420, 40, 460, '#ffd16622', '#18244a12'));

  const interpEq = glowTex(
    String.raw`x_\tau = (1 - \tau)\,x_{\mathrm{data}} + \tau\,x_{\mathrm{noise}}`,
    { x: 0, y: -355, size: 48, color: COSMOS.gold, glow: 8 },
  );

  const liveFlow = dynamic(() => {
    const m = mode.value;
    const vR = velRev.value > 0.5;
    const sR = stepRev.value > 0.5;
    const cp = curveP.value;
    const ph = drift.value;

    if (m < 1.5) {
      // Beats 0 & 1: Exact 1D flow number line from Data (+1, tau=0) to Noise (-1, tau=1)
      const mapX = (val) => -val * 460; // +1 on left (tau=0), -1 on right (tau=1)
      const axisY = -80;
      const uPair = (ph * 1.6) % 1;
      const curPairX = mapX(1) + (mapX(-1) - mapX(1)) * uPair;

      const nodes = [
        txt(
          'CONVENTION:   τ = 0 IS DATA (+1)   ·   τ = 1 IS NOISE (−1)',
          0,
          -252,
          26,
          COSMOS.cyan,
          'mono',
        ),
        line([mapX(1.15), axisY], [mapX(-1.15), axisY], { stroke: '#556a96', width: 3.4 }),
        // Data endpoint (+1) on left
        dot(18, COSMOS.cyan).at(mapX(1), axisY).glow(14, COSMOS.cyan),
        txt('Data  x₀ = +1', mapX(1), axisY - 58, 32, COSMOS.cyan, 'mono'),
        txt('τ = 0', mapX(1), axisY + 52, 26, COSMOS.muted, 'mono'),
        // Noise endpoint (-1) on right
        dot(18, COSMOS.violet).at(mapX(-1), axisY).glow(14, COSMOS.violet),
        txt('Noise  x₁ = −1', mapX(-1), axisY - 58, 32, COSMOS.violet, 'mono'),
        txt('τ = 1', mapX(-1), axisY + 52, 26, COSMOS.muted, 'mono'),
        // Live sliding point on pair line
        dot(9, '#ffffff').at(curPairX, axisY).glow(12, COSMOS.gold),
      ];

      if (m < 0.5) {
        nodes.push(
          arrow([mapX(0.75), axisY - 12], [mapX(-0.75), axisY - 12], {
            stroke: COSMOS.gold,
            width: 5,
            tip: 15,
          }).glow(8, COSMOS.gold),
          txt('Pair velocity target  =  x_noise − x_data', 0, 125, 36, COSMOS.gold, 'sans'),
          txt(
            'Straight flow path differs from rotational diffusion v-prediction',
            0,
            215,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      } else {
        // Beat 1: Exact Euler step from -1 with dt = -0.25 and v = -2 -> -0.5
        if (sR) {
          nodes.push(
            arrow([mapX(-1), axisY + 12], [mapX(-0.5), axisY + 12], {
              stroke: COSMOS.emerald,
              width: 6.5,
              tip: 16,
            }).glow(10, COSMOS.emerald),
            dot(14, COSMOS.emerald).at(mapX(-0.5), axisY).glow(14, COSMOS.emerald),
            txt('x = −0.5', mapX(-0.5), axisY - 54, 34, COSMOS.emerald, 'mono').glow(
              8,
              COSMOS.emerald,
            ),
          );
        }
        nodes.push(
          glassPlate(-490, 210, 460, 160, { stroke: COSMOS.gold, glow: 7 }),
          txt('PAIR VELOCITY', -490, 168, 26, COSMOS.muted, 'mono'),
          txt(vR ? '−1 − 1 = −2' : '?', -490, 228, 42, COSMOS.gold, 'mono').glow(
            vR ? 8 : 0,
            COSMOS.gold,
          ),

          glassPlate(0, 210, 420, 160, { stroke: COSMOS.cyan, glow: 6 }),
          txt('SAMPLING Δτ', 0, 168, 26, COSMOS.muted, 'mono'),
          txt('−0.25', 0, 228, 42, COSMOS.cyan, 'mono'),

          glassPlate(490, 210, 460, 160, { stroke: COSMOS.emerald, glow: 8 }),
          txt('EULER STEP', 490, 168, 26, COSMOS.muted, 'mono'),
          txt(sR ? '−1 + (−0.25)(−2) = −0.5' : '?', 490, 228, 30, COSMOS.emerald, 'mono').glow(
            sR ? 8 : 0,
            COSMOS.emerald,
          ),
        );
      }
      return group(...nodes);
    }

    // Beat 2: Left intersecting straight training pairs vs Right curved conditional-mean flow
    const lx0 = -760;
    const lx1 = -120;
    const rx0 = 120;
    const rx1 = 760;

    const straightPairs = [
      [
        [lx0, -140],
        [lx1, 140],
      ],
      [
        [lx0, 140],
        [lx1, -140],
      ],
      [
        [lx0, -40],
        [lx1, 55],
      ],
      [
        [lx0, 40],
        [lx1, -55],
      ],
    ];

    const curvedA = Array.from({ length: 48 }, (_, i) => {
      const u = (i / 47) * Math.max(0.15, cp);
      const x = rx0 + u * (rx1 - rx0);
      const y = -135 + 270 * (0.5 - 0.5 * Math.cos(u * Math.PI)) - Math.sin(u * Math.PI) * 95;
      return [x, y];
    });
    const curvedB = Array.from({ length: 48 }, (_, i) => {
      const u = (i / 47) * Math.max(0.15, cp);
      const x = rx0 + u * (rx1 - rx0);
      const y = 135 - 270 * (0.5 - 0.5 * Math.cos(u * Math.PI)) + Math.sin(u * Math.PI) * 95;
      return [x, y];
    });

    return group(
      line([0, -245], [0, 260], { stroke: '#2c3d66', width: 2, dash: [8, 8] }),
      txt('INDIVIDUAL TRAINING PAIRS', -440, -222, 28, COSMOS.violet, 'mono'),
      txt('Straight, but pairs cross!', -440, 232, 28, COSMOS.muted, 'sans'),
      ...straightPairs.map(([a, b], i) =>
        line(a, b, { stroke: i < 2 ? COSMOS.violet : COSMOS.cyan, width: 3.4 })
          .glow(6, COSMOS.violet)
          .opacity(0.82),
      ),
      dot(12, COSMOS.rose).at(-440, 0).glow(14, COSMOS.rose),
      txt('crossing point', -440, -158, 26, COSMOS.rose, 'mono'),

      txt('CONDITIONAL-MEAN FIELD', 440, -222, 28, COSMOS.gold, 'mono'),
      txt('Average velocity bends paths', 440, 232, 28, COSMOS.gold, 'sans'),
      new Node(polyPath(curvedA)).stroke(COSMOS.gold, 4.8, 0.95).glow(10, COSMOS.gold),
      new Node(polyPath(curvedB)).stroke(COSMOS.cyan, 4.8, 0.95).glow(10, COSMOS.cyan),
      dot(9, '#ffffff').at(curvedA.at(-1)[0], curvedA.at(-1)[1]).glow(12, COSMOS.gold),
      dot(9, '#ffffff').at(curvedB.at(-1)[0], curvedB.at(-1)[1]).glow(12, COSMOS.cyan),

      txt(
        'Match model target, time convention, and solver · illustrative curved average',
        0,
        355,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
  });

  s.add(liveFlow, interpEq);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-flow-paths-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-flow-paths-1', mode, 1, { dur: 0.4 });
  cueTo(s, c, 'df-flow-velocity', velRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-flow-step', stepRev, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-flow-paths-2', mode, 2, { dur: 0.45 });
  c.onBeat(2, () => s.play(curveP.to(1, { duration: 1.8 })));
}

// ---------------------------------------------------------------------------
// 17. conditioning: Which words matter here?
// Cues: conditioning-prompt, conditioning-query, conditioning-weights, conditioning-next-step
// ---------------------------------------------------------------------------
export function conditioning(s, c) {
  const promptVis = s.value(0.2);
  const queryPulse = s.value(0);
  const moveP = s.value(0);
  const nextStepP = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45 }));
  s.add(aura(-430, 0, 460, '#2a588a24', '#151e3d12'));
  s.add(aura(390, 0, 480, '#ffd16620', '#18244a12'));

  const words = ['wooden', 'table', 'soft', 'light'];
  const topCol = TOP_PIXEL % 16;
  const topRow = Math.floor(TOP_PIXEL / 16);
  const shCol = SHADOW_PIXEL % 16;
  const shRow = Math.floor(SHADOW_PIXEL / 16);

  const liveCond = dynamic(() => {
    const mv = moveP.value;
    const nxt = nextStepP.value;
    const col = Math.round(topCol + (shCol - topCol) * mv);
    const row = Math.round(topRow + (shRow - topRow) * mv);
    const sel = row * 16 + col;
    const transfer = Math.round(40 * mv - 8 * nxt);
    const shares = [55 - transfer, 25, 15, 5 + transfer];

    const gridCx = -465;
    const gridCy = -10;
    const gridSize = 510;
    const pitch = (gridSize - 12) / 16;
    const qx = gridCx - gridSize / 2 + 6 + (col + 0.5) * pitch;
    const qy = gridCy - gridSize / 2 + 6 + (row + 0.5) * pitch;

    const locText =
      mv < 0.05 ? 'Query on tabletop' : mv < 0.95 ? 'Moving into shadow' : 'Query in shadow';
    const nodes = [
      txt('IMAGE QUERY LOCATION', gridCx, -340, 28, COSMOS.cyan, 'mono'),
      pixelGrid(image, {
        cx: gridCx,
        cy: gridCy,
        size: gridSize,
        selected: sel,
        frameColor: COSMOS.cyan,
        markColor: COSMOS.gold,
      }),
      txt(locText, gridCx, 310, 34, COSMOS.gold, 'serif').glow(6, COSMOS.gold),

      txt('PROMPT TOKENS', 95, -340, 26, COSMOS.cyan, 'mono', 'left'),
      txt('CROSS-ATTENTION SHARES', 345, -340, 26, COSMOS.gold, 'mono', 'left'),
    ];

    words.forEach((word, i) => {
      const y = -190 + i * 136;
      const sh = shares[i];
      const barW = 410;
      const fillW = Math.max(10, (barW * sh) / 100);
      const colBar = sh >= 35 ? COSMOS.gold : COSMOS.cyan;

      // Glowing cross-attention energy beam from query pixel to each prompt token!
      nodes.push(
        line([qx + 18, qy], [65, y], {
          stroke: colBar,
          width: 1.4 + (sh / 55) * 4.5,
        })
          .glow(6, colBar)
          .opacity(0.2 + (sh / 60) * 0.65),
        txt(word, 95, y, 42, COSMOS.cyan, 'serif', 'left').opacity(0.5 + 0.5 * promptVis.value),
        rect(barW, 30, { fill: '#15203b', stroke: '#2d3f69', width: 1.5, radius: 8 }).at(
          345 + barW / 2,
          y,
        ),
        rect(fillW, 30, { fill: colBar, stroke: null, radius: 8 })
          .at(345 + fillW / 2, y)
          .glow(8, colBar),
        txt(`${sh}%`, 780, y, 36, colBar, 'mono', 'left'),
      );
    });

    nodes.push(
      txt(
        nxt > 0.3
          ? 'Next denoising step: text vectors fixed, image queries evolve'
          : 'Current denoising step: prompt keys & values stay fixed',
        410,
        310,
        28,
        nxt > 0.3 ? COSMOS.emerald : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(liveCond);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'conditioning-prompt', promptVis, 1, { dur: 0.6 });
  pulseCue(s, c, 'conditioning-query', queryPulse, 1, { dur: 0.5 });
  cueTo(s, c, 'conditioning-weights', moveP, 1, { dur: 1.8 });
  cueTo(s, c, 'conditioning-next-step', nextStepP, 1, { dur: 1.4 });
}

// ---------------------------------------------------------------------------
// 18. cross-read: How does one query mix three words?
// Cues: df-cross-read-0, df-cross-read-1, df-cross-shares, df-cross-output, df-cross-read-2
// ---------------------------------------------------------------------------
export function crossRead(s, c) {
  const stepP = s.value(0);
  const sharesRev = s.value(0);
  const outputRev = s.value(0);
  const queryMove = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45 }));
  s.add(aura(0, 0, 560, '#5ce1e622', '#17203d12'));

  const words = ['oak', 'dining', 'table'];

  const liveCross = dynamic(() => {
    const mv = queryMove.value;
    const query = [0.25 + 0.2 * mv, 0.1, 0.7 - 0.3 * mv];
    const fx = crossReadFixture(query);
    const shRev = sharesRev.value > 0.5 || mv > 0.05;
    const outRev = outputRev.value > 0.5 || mv > 0.05;
    const ph = drift.value;

    const nodes = [
      txt('SINGLE CROSS-ATTENTION HEAD  ·  KEY DIM d = 3', 0, -395, 28, COSMOS.cyan, 'mono'),
      glassPlate(-390, -305, 760, 86, { stroke: COSMOS.gold, glow: 8 }),
      txt(`Image query   q = ${vecLabel(query, 2)}`, -390, -305, 34, COSMOS.gold, 'mono'),
      txt('score = (q · k) / √3', 440, -305, 34, COSMOS.ink, 'mono'),

      // Column headings
      txt('Word', -715, -205, 26, COSMOS.muted, 'mono', 'left'),
      txt('Key  k_i', -410, -205, 26, COSMOS.muted, 'mono'),
      txt('Value  v_i', -30, -205, 26, COSMOS.muted, 'mono'),
      txt('Softmax Share', 470, -205, 26, COSMOS.muted, 'mono'),
    ];

    words.forEach((word, i) => {
      const y = -110 + i * 125;
      const share = fx.shares[i];
      const barW = 280;
      const fillW = Math.max(8, barW * share);
      const col = i === 0 ? COSMOS.cyan : i === 1 ? COSMOS.violet : COSMOS.gold;

      nodes.push(
        glassPlate(0, y, 1620, 96, { stroke: col, glow: 5 }),
        txt(word, -715, y, 38, col, 'serif', 'left'),
        txt(vecLabel(fx.keys[i], 2), -410, y, 30, COSMOS.ink, 'mono'),
        txt(vecLabel(fx.values[i], 2), -30, y, 30, COSMOS.cyan, 'mono'),
        shRev
          ? group(
              rect(barW, 20, { fill: '#15203b', stroke: null, radius: 6 }).at(390, y),
              rect(fillW, 20, { fill: col, stroke: null, radius: 6 })
                .at(390 - barW / 2 + fillW / 2, y)
                .glow(8, col),
              txt(`${(share * 100).toFixed(1)}%`, 615, y, 34, col, 'mono'),
            )
          : txt('?', 470, y, 42, COSMOS.muted, 'mono'),
      );
    });

    // Weighted output vessel at bottom
    nodes.push(
      photonWire(
        [
          [0, 195],
          [0, 262],
        ],
        ph * 3.2,
        { color: outRev ? COSMOS.emerald : COSMOS.gold, width: 4 },
      ),
      glassPlate(0, 330, 1020, 118, {
        stroke: outRev ? COSMOS.emerald : COSMOS.gold,
        glow: 10,
      }),
      txt(
        outRev
          ? `Weighted value mixture   =   ${vecLabel(fx.output, 3)}`
          : 'Weighted value mixture   =   ?',
        0,
        330,
        38,
        outRev ? COSMOS.emerald : COSMOS.gold,
        'mono',
      ).glow(outRev ? 8 : 0, COSMOS.emerald),
    );

    return group(...nodes);
  });

  s.add(liveCross);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-cross-read-0', stepP, 0.3, { dur: 0.4 });
  pulseCue(s, c, 'df-cross-read-1', stepP, 0.6, { dur: 0.4 });
  cueTo(s, c, 'df-cross-shares', sharesRev, 1, { after: true, dur: 0.3 });
  cueTo(s, c, 'df-cross-output', outputRev, 1, { after: true, dur: 0.3 });
  cueTo(s, c, 'df-cross-read-2', queryMove, 1, { dur: 2.2 });
}

// ---------------------------------------------------------------------------
// 19. guidance: Guidance extrapolates between predictions
// Cues: guidance-beat-1-focus-1, df-guidance-0,
//       guidance-difference, guidance-add-scaled, guidance-unit-scale,
//       guidance-extrapolate, df-guidance-1,
//       guidance-beat-3-focus-1, df-guidance-2
// ---------------------------------------------------------------------------
export function guidance(s, c) {
  const wVal = s.value(0);
  const diffVis = s.value(0);
  const evalVis = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.gold, opacity: 0.46 }));
  s.add(aura(-280, 40, 520, '#ffd16622', '#18244a12'));
  s.add(aura(500, -40, 420, '#5ce1e61f', '#17203d12'));

  const cfgEq = glowTex(String.raw`\hat\epsilon = \epsilon_u + w\,(\epsilon_c - \epsilon_u)`, {
    x: 0,
    y: -380,
    size: 50,
    color: COSMOS.gold,
    glow: 8,
  });

  const u = [0.2, -0.1];
  const cond = [0.05, -0.35];
  const ox = -350;
  const oy = -150;
  const scale = 520;
  const mapPt = ([vx, vy]) => [ox + vx * scale, oy - vy * scale];

  const liveVec = dynamic(() => {
    const w = wVal.value;
    const g = [u[0] + w * (cond[0] - u[0]), u[1] + w * (cond[1] - u[1])];
    const pU = mapPt(u);
    const pC = mapPt(cond);
    const pG = mapPt(g);
    const pEnd = mapPt([u[0] + 3.2 * (cond[0] - u[0]), u[1] + 3.2 * (cond[1] - u[1])]);
    const pulse = 1 + 0.14 * Math.sin(drift.value * Math.PI * 10);

    const nodes = [
      // Coordinate axes
      line([-780, oy], [120, oy], { stroke: '#4d6089', width: 2.2 }),
      line([ox, -295], [ox, 375], { stroke: '#4d6089', width: 2.2 }),
      txt('noise coord 1', 15, oy - 28, 26, COSMOS.muted, 'mono'),
      txt('two noise-prediction coordinates', -330, 406, 26, COSMOS.muted, 'sans'),

      // Dashed extrapolation ray
      line(pU, pEnd, { stroke: COSMOS.gold, width: 2, dash: [8, 8] }).opacity(
        0.2 + 0.55 * diffVis.value,
      ),

      // Unconditional vector (blue)
      arrow([ox, oy], pU, { stroke: COSMOS.blue, width: 5.5, tip: 15 }).glow(8, COSMOS.blue),
      dot(9, COSMOS.blue).at(pU[0], pU[1]).glow(10, COSMOS.blue),
      txt('ε_u', pU[0] + 64, pU[1] - 28, 30, COSMOS.blue, 'mono'),

      // Conditional vector (cyan)
      arrow([ox, oy], pC, { stroke: COSMOS.cyan, width: 5.5, tip: 15 }).glow(8, COSMOS.cyan),
      dot(9, COSMOS.cyan).at(pC[0], pC[1]).glow(10, COSMOS.cyan),
      txt('ε_c (w=1)', pC[0] + 128, pC[1] + 20, 28, COSMOS.cyan, 'mono'),

      // Difference vector u -> c
      diffVis.value > 0.05
        ? arrow(pU, pC, { stroke: COSMOS.violet, width: 4.2, tip: 13 })
            .glow(8, COSMOS.violet)
            .opacity(diffVis.value)
        : group(),

      // Guided vector from u -> g (gold)
      w > 0.02
        ? arrow(pU, pG, { stroke: COSMOS.gold, width: 6.5, tip: 16 }).glow(12, COSMOS.gold)
        : group(),
      dot(12 * pulse, COSMOS.gold)
        .at(pG[0], pG[1])
        .glow(16, COSMOS.gold),
      dot(5, '#ffffff').at(pG[0], pG[1]),

      // Right-hand live readout panel
      glassPlate(520, -45, 620, 490, { stroke: '#3c5080', glow: 6 }),
      txt('Unconditional  ε_u', 250, -225, 28, COSMOS.blue, 'sans', 'left'),
      txt('(0.20, −0.10)', 790, -225, 28, COSMOS.blue, 'mono', 'right'),

      txt('Conditional  ε_c', 250, -155, 28, COSMOS.cyan, 'sans', 'left'),
      txt('(0.05, −0.35)', 790, -155, 28, COSMOS.cyan, 'mono', 'right'),

      txt('Guided  ε̂', 250, -85, 30, COSMOS.gold, 'sans', 'left'),
      txt(`(${decimal(g[0], 2)}, ${decimal(g[1], 2)})`, 790, -85, 30, COSMOS.gold, 'mono', 'right'),

      line([250, -32], [790, -32], { stroke: '#2c3d66', width: 1.8 }),
      txt(`w = ${w.toFixed(2)}`, 520, 44, 64, COSMOS.gold, 'mono').glow(10, COSMOS.gold),
      txt(
        w < 0.05
          ? 'unconditional baseline'
          : w <= 1.05
            ? 'scaling toward conditional ε_c'
            : 'extrapolating past prompt',
        520,
        125,
        28,
        COSMOS.ink,
        'sans',
      ),
    ];

    if (evalVis.value > 0.05) {
      nodes.push(
        group(
          glassPlate(520, 300, 620, 145, { stroke: COSMOS.rose, glow: 7 }),
          txt('MEASURE SEPARATELY ACROSS PROMPTS', 520, 266, 26, COSMOS.rose, 'mono'),
          txt(
            'alignment  ·  diversity  ·  saturation / artifacts',
            520,
            326,
            26,
            COSMOS.ink,
            'sans',
          ),
        ).opacity(evalVis.value),
      );
    }

    return group(...nodes);
  });

  s.add(liveVec, cfgEq);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'guidance-beat-1-focus-1', diffVis, 0.25, { dur: 0.5 });
  pulseCue(s, c, 'df-guidance-0', diffVis, 0.35, { dur: 0.3 });

  cueTo(s, c, 'guidance-difference', diffVis, 1, { dur: 0.7 });
  cueTo(s, c, 'guidance-add-scaled', wVal, 1.0, { dur: 1.1 });
  pulseCue(s, c, 'guidance-unit-scale', wVal, 1.0, { dur: 0.3 });
  cueTo(s, c, 'guidance-extrapolate', wVal, 3.0, { dur: 1.6 });
  pulseCue(s, c, 'df-guidance-1', diffVis, 1, { dur: 0.3 });

  cueTo(s, c, 'guidance-beat-3-focus-1', evalVis, 1, { dur: 0.65 });
  pulseCue(s, c, 'df-guidance-2', evalVis, 1, { dur: 0.3 });
}
