// Act 5: CFG Condition-Drop Training, CFG API Contracts, Latent Space Compression,
// Latent Reconstruction Limits, Masked Text Canvas, and DiffusionGemma System Architecture.
import { Node, arrow, circle, dot, dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  TOP_PIXEL,
  aura,
  cinemaGrid,
  cueTo,
  decimal,
  exposure,
  fadeIn,
  fadeOut,
  forwardValue,
  glassPlate,
  glowTex,
  guardedDynamic,
  image,
  imageNoise,
  livingDrift,
  photonWire,
  pixelGrid,
  polyPath,
  pulseCue,
  txt,
  valueColor,
} from '../shared.mjs';

// ---------------------------------------------------------------------------
// 20. cfg-training: The unconditional branch is learned by dropping conditions
// Cues: df-cfg-training-0, df-cfg-training-1, df-cfg-seven, df-cfg-training-2, df-cfg-fifteen
// ---------------------------------------------------------------------------
export function cfgTraining(s, c) {
  const mode = s.value(0); // 0 = dropout rows, 1 = w=7.5, 2 = w=15
  const rev7 = s.value(0);
  const rev15 = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.violet, opacity: 0.44 }));
  s.add(aura(0, 0, 560, '#a78bfa22', '#17203d12'));

  const u = [0.2, -0.1, 0.05];
  const v = [0.05, -0.35, 0.2];
  const diff = v.map((x, i) => x - u[i]);
  const w7 = u.map((x, i) => x + 7.5 * diff[i]);
  const w15 = u.map((x, i) => x + 15 * diff[i]);

  const dropRows = [
    { id: '0', prompt: 'oak / soft light', dropped: true },
    { id: '1', prompt: 'oak / natural light', dropped: true },
    { id: '2', prompt: 'mobile dashboard', dropped: false },
    { id: '3', prompt: 'latency chart', dropped: true },
  ];

  const liveView = dynamic(() => {
    const m = mode.value;
    const ph = drift.value;

    if (m < 0.5) {
      const nodes = [
        txt('CONDITION DROPOUT DURING TRAINING  (p_drop = 0.35)', 0, -372, 30, COSMOS.cyan, 'mono'),
        txt('Row', -740, -280, 26, COSMOS.muted, 'mono'),
        txt('Original Prompt', -420, -280, 26, COSMOS.muted, 'mono'),
        txt('Conditioning Passed to Shared Denoiser', 365, -280, 26, COSMOS.muted, 'mono'),
      ];
      dropRows.forEach((row, i) => {
        const y = -182 + i * 124;
        const col = row.dropped ? COSMOS.violet : COSMOS.emerald;
        nodes.push(
          glassPlate(-490, y, 630, 88, { stroke: COSMOS.blue, glow: 4 }),
          txt(row.id, -755, y, 30, COSMOS.muted, 'mono'),
          txt(row.prompt, -460, y, 30, COSMOS.ink, 'sans'),
          photonWire(
            [
              [-168, y],
              [-10, y],
            ],
            ph * 3 + i * 0.22,
            { color: col, width: 3.4 },
          ),
          glassPlate(395, y, 790, 88, { stroke: col, glow: 7 }),
          txt(
            row.dropped
              ? 'supported null condition  (same ε target)'
              : 'same prompt kept  (same ε target)',
            395,
            y,
            28,
            col,
            'mono',
          ),
        );
      });
      nodes.push(
        txt(
          'Supported null / empty embedding need not be an all-zero vector',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes);
    }

    const is15 = m >= 1.5;
    const w = is15 ? 15 : 7.5;
    const res = is15 ? w15 : w7;
    const show = is15 ? rev15.value > 0.5 : rev7.value > 0.5;
    const cols = [-235, 195, 610];

    const gridRows = [
      { name: 'Unconditional  ε_u', vals: u, digits: 2, col: COSMOS.blue, y: -185, shown: true },
      { name: 'Conditional  ε_c', vals: v, digits: 2, col: COSMOS.cyan, y: -62, shown: true },
      {
        name: 'Difference  ε_c − ε_u',
        vals: diff,
        digits: 2,
        col: COSMOS.violet,
        y: 62,
        shown: true,
      },
      {
        name: `Guided  w = ${w}`,
        vals: res,
        digits: 3,
        col: is15 ? COSMOS.rose : COSMOS.gold,
        y: 196,
        shown: show,
      },
    ];

    const nodes = [
      txt(
        `COORDINATE-BY-COORDINATE CFG EXTRAPOLATION  (w = ${w})`,
        0,
        -372,
        30,
        COSMOS.gold,
        'mono',
      ),
      txt('Coord 0', cols[0], -280, 26, COSMOS.muted, 'mono'),
      txt('Coord 1', cols[1], -280, 26, COSMOS.muted, 'mono'),
      txt('Coord 2', cols[2], -280, 26, COSMOS.muted, 'mono'),
    ];
    for (const row of gridRows) {
      nodes.push(
        glassPlate(0, row.y, 1640, 96, {
          stroke: row.shown ? row.col : '#33446b',
          glow: row.shown ? 8 : 2,
        }),
        txt(row.name, -780, row.y, 30, row.col, 'mono', 'left'),
        ...row.vals.map((val, i) =>
          txt(
            row.shown ? decimal(val, row.digits) : '?',
            cols[i],
            row.y,
            row.shown ? 36 : 40,
            row.shown ? row.col : COSMOS.muted,
            'mono',
          ).glow(row.shown && row.y > 100 ? 8 : 0, row.col),
        ),
      );
    }
    nodes.push(
      txt(
        is15
          ? 'Scale is not a probability · evaluate alignment, diversity, and artifacts on a prompt suite'
          : 'Scale 1 returns conditional prediction · larger scales extrapolate beyond it',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(liveView);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-cfg-training-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-cfg-training-1', mode, 1, { dur: 0.4 });
  cueTo(s, c, 'df-cfg-seven', rev7, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-cfg-training-2', mode, 2, { dur: 0.4 });
  cueTo(s, c, 'df-cfg-fifteen', rev15, 1, { after: true, dur: 0.25 });
}

// ---------------------------------------------------------------------------
// 21. cfg-api: A library switch and the mathematical scale are separate contracts
// Cues: df-cfg-api-0, df-cfg-api-1
// ---------------------------------------------------------------------------
export function cfgApi(s, c) {
  const mode = s.value(0); // 0 = equations, 1 = API branch contracts
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45 }));
  s.add(aura(0, -40, 540, '#5ce1e622', '#17203d12'));

  const paperEq = glowTex(
    String.raw`\hat\epsilon = \epsilon_c + w_{\mathrm{paper}}(\epsilon_c - \epsilon_u)`,
    { x: 0, y: -200, size: 52, color: COSMOS.cyan, glow: 8 },
  );
  const commonEq = glowTex(
    String.raw`\hat\epsilon = \epsilon_u + \bigl(1 + w_{\mathrm{paper}}\bigr)(\epsilon_c - \epsilon_u)`,
    { x: 0, y: -30, size: 52, color: COSMOS.gold, glow: 8 },
  );

  const beat0View = guardedDynamic(
    () => fadeOut(mode.value),
    (vis) => {
      const wPaper = (drift.value * 5) % 4;
      const wCommon = 1 + wPaper;
      const mapX = (val) => -540 + (val / 5) * 1080;
      const yAxis = 185;
      return group(
        txt('COMPARE SCALE CONVENTIONS BEFORE COPYING A NUMBER', 0, -365, 30, COSMOS.cyan, 'mono'),
        line([-560, yAxis], [560, yAxis], { stroke: '#556a96', width: 3.2 }),
        ...[0, 1, 2, 3, 4, 5].flatMap((tk) => [
          line([mapX(tk), yAxis - 10], [mapX(tk), yAxis + 10], { stroke: '#7b90bc', width: 2.2 }),
          txt(String(tk), mapX(tk), yAxis + 46, 26, COSMOS.muted, 'mono'),
        ]),
        dot(11, COSMOS.cyan).at(mapX(wPaper), yAxis).glow(12, COSMOS.cyan),
        txt(`w_paper = ${wPaper.toFixed(1)}`, mapX(wPaper), yAxis - 44, 28, COSMOS.cyan, 'mono'),
        dot(11, COSMOS.gold).at(mapX(wCommon), yAxis).glow(12, COSMOS.gold),
        txt(`w_common = ${wCommon.toFixed(1)}`, mapX(wCommon), yAxis - 86, 28, COSMOS.gold, 'mono'),
        txt(
          'Paper scale 0  =  Common scale 1  (both equal conditional ε_c)',
          0,
          345,
          32,
          COSMOS.emerald,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  const beat1View = guardedDynamic(
    () => fadeIn(mode.value),
    (vis) => {
      const ph = drift.value;
      const rows = [
        {
          key: 'w > 1',
          meaning: 'Ordinary extra CFG branch enabled',
          col: COSMOS.gold,
          y: -195,
        },
        {
          key: 'w ≤ 1',
          meaning: 'Pipeline can disable extra branch (not math interpolation)',
          col: COSMOS.rose,
          y: -55,
        },
        {
          key: 'Negative prompt',
          meaning: 'Comparison branch is negatively conditioned, not unconditional',
          col: COSMOS.violet,
          y: 85,
        },
        {
          key: '1 batched call',
          meaning: 'Still computes 2 denoiser predictions per image',
          col: COSMOS.cyan,
          y: 225,
        },
      ];
      return group(
        txt('LIBRARY SWITCHES  ≠  PURE MATHEMATICAL SCALE', 0, -365, 30, COSMOS.gold, 'mono'),
        ...rows.flatMap((r, i) => [
          glassPlate(-530, r.y, 440, 102, { stroke: r.col, glow: 7 }),
          txt(r.key, -530, r.y, 32, r.col, 'mono'),
          photonWire(
            [
              [-305, r.y],
              [-215, r.y],
            ],
            ph * 3 + i * 0.25,
            { color: r.col, width: 3 },
          ),
          glassPlate(295, r.y, 1000, 102, { stroke: '#3a4f7c', glow: 4 }),
          txt(r.meaning, 295, r.y, 28, COSMOS.ink, 'sans'),
        ]),
        txt(
          'Stable Diffusion pipeline guide inspected Nov 7, 2026 · count predictions, not calls',
          0,
          372,
          26,
          COSMOS.muted,
          'sans',
        ),
      ).opacity(vis);
    },
  );

  s.add(beat0View, beat1View, paperEq, commonEq);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-cfg-api-0', mode, 0.05, { dur: 0.3 });
  c.hide('df-cfg-api-1', [paperEq, commonEq]);
  cueTo(s, c, 'df-cfg-api-1', mode, 1, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 22. latent: Move the expensive loop into latent space
// Cues: latent-training-encode, latent-training-corruption, df-latent-0,
//       latent-generation-seed, latent-generation-update, latent-generation-decode,
//       df-latent-1, latent-compression, df-latent-2
// ---------------------------------------------------------------------------
export function latent(s, c) {
  const trainEnc = s.value(0);
  const trainCorrupt = s.value(0);
  const genSeed = s.value(0);
  const genLoopP = s.value(0);
  const decodedRev = s.value(0);
  const compVis = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44 }));
  s.add(aura(-420, -140, 440, '#2a588a22', '#151e3d12'));
  s.add(aura(320, 160, 460, '#ffd1661f', '#18244a12'));

  const latentClean = Array.from(
    { length: 16 },
    (_, i) => image[(Math.floor(i / 4) * 4 + 2) * 16 + (i % 4) * 4 + 2],
  );
  const latentNoise = imageNoise.slice(0, 16);

  const latentTile = (cx, cy, alpha, frameColor) => {
    const pitch = 30;
    const startX = cx - 2 * pitch;
    const startY = cy - 2 * pitch;
    const cells = [
      rect(134, 134, { fill: '#0a0f1f', stroke: frameColor, width: 2.4, radius: 8 })
        .at(cx, cy)
        .glow(8, frameColor),
    ];
    for (let i = 0; i < 16; i++) {
      const val = forwardValue(latentClean[i], latentNoise[i], alpha);
      cells.push(
        rect(pitch - 2, pitch - 2, { fill: valueColor(val), stroke: null, radius: 3 }).at(
          startX + ((i % 4) + 0.5) * pitch,
          startY + (Math.floor(i / 4) + 0.5) * pitch,
        ),
      );
    }
    return group(...cells);
  };

  const ratioEq = glowTex(
    String.raw`\frac{512 \times 512 \times 3}{64 \times 64 \times 4} = 48\times`,
    {
      x: 0,
      y: 382,
      size: 42,
      color: COSMOS.gold,
      glow: 8,
    },
  );

  const liveLatent = dynamic(() => {
    const ph = drift.value;
    const lp = genLoopP.value;
    const dec = decodedRev.value > 0.5;
    const stepIdx = Math.round(lp * 20);

    return group(
      // TOP ROW: TRAINING (encode clean image -> clean latent -> corrupt -> latent denoiser)
      txt(
        'TRAINING:  ENCODE REAL IMAGES INTO COMPACT LATENTS',
        -820,
        -372,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      pixelGrid(image, {
        cx: -710,
        cy: -210,
        size: 175,
        selected: TOP_PIXEL,
        frameColor: COSMOS.cyan,
      }),
      txt('clean image', -710, -96, 26, COSMOS.muted, 'mono'),
      photonWire(
        [
          [-615, -210],
          [-535, -210],
        ],
        ph * 3,
        { color: COSMOS.cyan, width: 3 },
      ),
      glassPlate(-395, -210, 270, 145, {
        stroke: trainEnc.value > 0.3 ? COSMOS.cyan : '#3a4f7c',
        glow: trainEnc.value > 0.3 ? 10 : 4,
      }),
      txt('VAE Encoder', -395, -228, 30, COSMOS.cyan, 'serif'),
      txt('spatial compression', -395, -184, 26, COSMOS.muted, 'sans'),
      photonWire(
        [
          [-255, -210],
          [-175, -210],
        ],
        ph * 3 + 0.25,
        { color: COSMOS.cyan, width: 3 },
      ),
      latentTile(-100, -210, 1, COSMOS.cyan),
      txt('clean z₀', -100, -110, 26, COSMOS.cyan, 'mono'),
      photonWire(
        [
          [-25, -210],
          [55, -210],
        ],
        ph * 3 + 0.5,
        { color: COSMOS.gold, width: 3 },
      ),
      latentTile(130, -210, 0.28, trainCorrupt.value > 0.3 ? COSMOS.gold : COSMOS.violet),
      txt('noisy z_t', 130, -110, 26, COSMOS.gold, 'mono'),
      photonWire(
        [
          [205, -210],
          [285, -210],
        ],
        ph * 3 + 0.75,
        { color: COSMOS.gold, width: 3 },
      ),
      glassPlate(545, -210, 505, 145, {
        stroke: trainCorrupt.value > 0.3 ? COSMOS.gold : COSMOS.cyan,
        glow: 9,
      }),
      txt('Latent Denoiser', 545, -230, 32, COSMOS.ink, 'serif'),
      txt('known latent noise → training target', 545, -182, 26, COSMOS.gold, 'sans'),

      // Divider
      line([-820, -24], [820, -24], { stroke: '#293a60', width: 1.8, dash: [8, 10] }),

      // BOTTOM ROW: TEXT-TO-IMAGE GENERATION (pure latent noise -> iterative loop -> decoder -> pixels)
      txt('INFERENCE:  START DIRECTLY IN LATENT SPACE', -820, 28, 26, COSMOS.gold, 'mono', 'left'),
      glassPlate(-490, 185, 650, 210, {
        stroke: genSeed.value > 0.3 ? COSMOS.gold : COSMOS.violet,
        glow: 10,
      }),
      latentTile(-695, 185, Math.max(0.05, lp), COSMOS.gold),
      txt('Iterative Latent Loop', -370, 145, 32, COSMOS.gold, 'serif'),
      txt(`step ${stepIdx} / 20`, -370, 198, 34, COSMOS.cyan, 'mono'),
      txt('sampler converts ε̂ → z_{t−1}', -370, 248, 26, COSMOS.muted, 'sans'),

      photonWire(
        [
          [-160, 185],
          [-45, 185],
        ],
        ph * 3.2,
        { color: COSMOS.gold, width: 3.5 },
      ),
      glassPlate(145, 185, 370, 175, { stroke: COSMOS.cyan, glow: 9 }),
      txt('VAE Decoder', 145, 162, 34, COSMOS.cyan, 'serif'),
      txt('final latent → pixels', 145, 212, 26, COSMOS.muted, 'sans'),

      photonWire(
        [
          [335, 185],
          [465, 185],
        ],
        ph * 3.2 + 0.5,
        { color: COSMOS.emerald, width: 3.5 },
      ),
      dec
        ? pixelGrid(image, {
            cx: 605,
            cy: 185,
            size: 215,
            selected: TOP_PIXEL,
            frameColor: COSMOS.emerald,
          })
        : group(
            glassPlate(605, 185, 215, 215, { stroke: '#3a4f7c', glow: 4 }),
            txt('decode', 605, 168, 28, COSMOS.muted, 'mono'),
            txt('pending', 605, 208, 28, COSMOS.gold, 'mono'),
          ),
    );
  });

  s.add(liveLatent);
  livingDrift(s, c, drift, 1);

  cueTo(s, c, 'latent-training-encode', trainEnc, 1, { dur: 0.6 });
  cueTo(s, c, 'latent-training-corruption', trainCorrupt, 1, { dur: 0.6 });
  pulseCue(s, c, 'df-latent-0', trainEnc, 1, { dur: 0.3 });

  cueTo(s, c, 'latent-generation-seed', genSeed, 1, { dur: 0.5 });
  cueTo(s, c, 'latent-generation-update', genLoopP, 1, { dur: 1.8 });
  cueTo(s, c, 'latent-generation-decode', decodedRev, 1, { after: true, dur: 0.35 });
  pulseCue(s, c, 'df-latent-1', genSeed, 1, { dur: 0.3 });

  c.show('latent-compression', ratioEq);
  pulseCue(s, c, 'df-latent-2', compVis, 1, { dur: 0.3 });
}

// ---------------------------------------------------------------------------
// 23. latent-contract: Compression changes representation and leaves a reconstruction limit
// Cues: df-latent-contract-0, df-latent-contract-1, df-latent-ratio, df-latent-contract-2
// ---------------------------------------------------------------------------
export function latentContract(s, c) {
  const mode = s.value(0); // 0 = DDIM latent loop, 1 = 48x vs 64x + VQ, 2 = VAE blur test
  const ratioRev = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.44 }));
  s.add(aura(0, 0, 560, '#5ce1e620', '#17203d12'));

  const liveView = dynamic(() => {
    const m = mode.value;
    const ph = drift.value;

    if (m < 0.5) {
      // Beat 0: Continuous latent DDIM loop -> checkpoint scale -> pixel decode
      const steps = [
        { x: -640, t: 'Random latent z_T', s: 'continuous coordinates', col: COSMOS.violet },
        { x: -215, t: 'Denoiser → ε̂', s: 'DDIM (η = 0) mix', col: COSMOS.cyan },
        { x: 215, t: 'Checkpoint scale', s: 'undo latent scaling', col: COSMOS.gold },
        { x: 640, t: 'VAE Decode', s: 'final pixels', col: COSMOS.emerald },
      ];
      return group(
        txt('CONTINUOUS LATENT DDIM GENERATION', 0, -365, 32, COSMOS.cyan, 'mono'),
        ...steps.flatMap((st, i) => [
          glassPlate(st.x, -45, 345, 175, { stroke: st.col, glow: 8 }),
          txt(st.t, st.x, -72, 30, st.col, 'serif'),
          txt(st.s, st.x, -16, 26, COSMOS.muted, 'sans'),
          i < 3
            ? photonWire(
                [
                  [st.x + 178, -45],
                  [steps[i + 1].x - 178, -45],
                ],
                ph * 3 + i * 0.3,
                { color: st.col, width: 3.5 },
              )
            : group(),
        ]),
        // Loopback arc on denoiser
        photonWire(
          [
            [-115, 48],
            [-115, 138],
            [-315, 138],
            [-315, 48],
          ],
          ph * 3.5,
          { color: COSMOS.cyan, width: 3.2 },
        ),
        txt('repeat next noise level', -215, 174, 26, COSMOS.cyan, 'mono'),
        txt(
          'Denoising happens on continuous latents: never discrete codebook IDs',
          0,
          335,
          30,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    if (m < 1.5) {
      // Beat 1: KL vs VQ pre-quantization + proportional 48x scalar vs 64x spatial comparison
      const rev = ratioRev.value > 0.5;
      return group(
        txt('REGULARIZATION  &  REPRESENTATION RATIOS', 0, -365, 30, COSMOS.gold, 'mono'),
        glassPlate(-455, -145, 720, 210, { stroke: COSMOS.cyan, glow: 8 }),
        txt('KL & VQ Latent Diffusion', -455, -195, 34, COSMOS.cyan, 'serif'),
        txt(
          'Even in VQ-LDM, quantization lives inside the decoder.',
          -455,
          -135,
          26,
          COSMOS.ink,
          'sans',
        ),
        txt(
          'Diffused state stays continuous pre-quantization output.',
          -455,
          -90,
          26,
          COSMOS.muted,
          'sans',
        ),

        glassPlate(455, -145, 720, 210, { stroke: COSMOS.gold, glow: 8 }),
        txt('512×512×3  vs  64×64×4', 455, -195, 34, COSMOS.gold, 'mono'),
        txt(rev ? '48× fewer scalars' : '? fewer scalars', 455, -132, 34, COSMOS.gold, 'mono').glow(
          rev ? 8 : 0,
          COSMOS.gold,
        ),
        txt(
          rev ? '64× fewer spatial sites' : '? fewer spatial sites',
          455,
          -82,
          30,
          COSMOS.cyan,
          'mono',
        ),

        // Proportional visual bars
        txt('Pixel scalars: 786,432', -800, 95, 26, COSMOS.muted, 'mono', 'left'),
        rect(1560, 28, { fill: COSMOS.violet, stroke: null, radius: 8 })
          .at(-20, 145)
          .glow(6, COSMOS.violet),
        txt('Latent scalars: 16,384  (1 / 48)', -800, 215, 26, COSMOS.gold, 'mono', 'left'),
        rect(34, 28, { fill: COSMOS.gold, stroke: null, radius: 6 })
          .at(-783, 262)
          .glow(10, COSMOS.gold),
        txt(
          'Neither ratio is a measured wall-clock speedup: benchmark the real pipeline',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    // Beat 2: Encode-decode-only reconstruction test (fine text loses a stroke without any denoiser)
    return group(
      txt('ISOLATE AUTOENCODER LOSS BEFORE TUNING STEPS', 0, -365, 30, COSMOS.rose, 'mono'),
      glassPlate(-540, -25, 450, 340, { stroke: COSMOS.cyan, glow: 8 }),
      txt('ORIGINAL REAL PATCH', -540, -148, 26, COSMOS.cyan, 'mono'),
      txt('Aa  8px', -540, -22, 74, COSMOS.ink, 'serif').glow(6, COSMOS.cyan),
      txt('crisp hairline strokes', -540, 88, 26, COSMOS.muted, 'sans'),

      photonWire(
        [
          [-305, -25],
          [-165, -25],
        ],
        ph * 3,
        { color: COSMOS.gold, width: 4 },
      ),
      glassPlate(0, -25, 310, 175, { stroke: COSMOS.gold, glow: 8 }),
      txt('Encode → Decode', 0, -52, 32, COSMOS.gold, 'serif'),
      txt('0 denoiser steps', 0, 8, 28, COSMOS.rose, 'mono'),
      photonWire(
        [
          [165, -25],
          [305, -25],
        ],
        ph * 3 + 0.5,
        { color: COSMOS.rose, width: 4 },
      ),

      glassPlate(540, -25, 450, 340, { stroke: COSMOS.rose, glow: 8 }),
      txt('VAE RECONSTRUCTION', 540, -148, 26, COSMOS.rose, 'mono'),
      txt('A~  8px', 540, -22, 74, '#b5c1d888', 'serif').glow(14, COSMOS.rose),
      txt('stroke already corrupted!', 540, 88, 28, COSMOS.rose, 'sans'),

      txt(
        'More sampler steps cannot recover detail destroyed by the VAE encoder/decoder',
        0,
        325,
        30,
        COSMOS.ink,
        'sans',
      ),
    );
  });

  s.add(liveView);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-latent-contract-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-latent-contract-1', mode, 1, { dur: 0.4 });
  cueTo(s, c, 'df-latent-ratio', ratioRev, 1, { after: true, dur: 0.3 });
  cueTo(s, c, 'df-latent-contract-2', mode, 2, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 24. text-canvas: When can you show the last word?
// Cues: df-text-canvas-0, df-text-canvas-1, df-text-first, df-text-second, df-text-third, df-text-canvas-2
// ---------------------------------------------------------------------------
export function textCanvas(s, c) {
  const roundVal = s.value(0); // 0 -> 1 -> 2 -> 3
  const committedVal = s.value(0);
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.cyan, opacity: 0.45 }));
  s.add(aura(0, -10, 560, '#5ce1e622', '#17203d12'));

  const rounds = [
    ['[mask]', '[mask]', '[mask]', '[mask]'],
    ['write', '[mask]', '[mask]', 'later'],
    ['write', 'unit', '[mask]', 'first'],
    ['write', 'unit', 'tests', 'first'],
  ];

  const liveCanvas = dynamic(() => {
    const rIdx = Math.max(0, Math.min(3, Math.round(roundVal.value)));
    const committed = committedVal.value > 0.5;
    const words = rounds[rIdx];
    const ph = drift.value;
    const slotXs = [-585, -195, 195, 585];

    const nodes = [
      txt(
        'MASKED TEXT DIFFUSION CANVAS  ·  BIDIRECTIONAL CONTEXT',
        0,
        -365,
        28,
        COSMOS.cyan,
        'mono',
      ),
      // Bidirectional attention arcs sweeping above the 4 slots
      ...[0, 1, 2].map((i) => {
        const a = slotXs[i];
        const b = slotXs[i + 1];
        const mid = (a + b) / 2;
        const arcPts = Array.from({ length: 19 }, (_, k) => {
          const u = k / 18;
          return [a + (b - a) * u, -105 - Math.sin(u * Math.PI) * 95];
        });
        return group(
          new Node(polyPath(arcPts)).stroke(COSMOS.violet, 2.4, 0.55).glow(5, COSMOS.violet),
          dot(5, COSMOS.cyan)
            .at(mid + Math.sin(ph * 10 + i * 1.7) * 110, -165)
            .glow(10, COSMOS.cyan),
        );
      }),
    ];

    words.forEach((word, i) => {
      const isLast = i === 3;
      const isMask = word === '[mask]';
      const isRevised = isLast && rIdx >= 2;
      const col = committed
        ? COSMOS.emerald
        : isLast
          ? isRevised
            ? COSMOS.gold
            : COSMOS.rose
          : isMask
            ? '#3b4e7c'
            : COSMOS.cyan;

      nodes.push(
        glassPlate(slotXs[i], 20, 340, 195, {
          stroke: col,
          strokeWidth: isLast ? 3.4 : 2.2,
          glow: isMask ? 3 : 10,
        }),
        txt(`slot ${i + 1}`, slotXs[i], -42, 26, COSMOS.muted, 'mono'),
        txt(word, slotXs[i], 32, isMask ? 46 : 62, isMask ? COSMOS.muted : col, 'serif').glow(
          isMask ? 0 : 8,
          col,
        ),
      );
    });

    nodes.push(
      txt(`Round ${rIdx} of 3`, -755, 215, 38, COSMOS.ink, 'mono', 'left'),
      txt(
        committed ? 'COMMITTED FINAL LINE' : 'EDITABLE DRAFT (DO NOT COMMIT EARLY)',
        755,
        215,
        34,
        committed ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'right',
      ).glow(8, committed ? COSMOS.emerald : COSMOS.gold),
      txt(
        rIdx === 1
          ? 'Slot 4 says "later": committing now would show the opposite instruction!'
          : rIdx >= 2
            ? 'Round 2 revised "later" → "first" using surrounding context'
            : 'Bidirectional passes can fill and revise any slot in parallel',
        0,
        348,
        30,
        COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(liveCanvas);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-text-canvas-0', roundVal, 0, { dur: 0.25 });
  pulseCue(s, c, 'df-text-canvas-1', roundVal, 0, { dur: 0.25 });
  cueTo(s, c, 'df-text-first', roundVal, 1, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-text-second', roundVal, 2, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-text-third', roundVal, 3, { after: true, dur: 0.25 });
  cueTo(s, c, 'df-text-canvas-2', committedVal, 1, { dur: 0.45 });
}

// ---------------------------------------------------------------------------
// 25. gemma-system: A cached prefix and a bidirectional canvas have different lifetimes
// Cues: df-gemma-system-0, df-gemma-system-1, df-gemma-system-2
// ---------------------------------------------------------------------------
export function gemmaSystem(s, c) {
  const mode = s.value(0); // 0 = MoE experts, 1 = encoder KV + 256 canvas, 2 = dual stopping rule
  const drift = s.value(0);

  s.add(cinemaGrid({ accent: COSMOS.violet, opacity: 0.44 }));
  s.add(aura(0, 0, 560, '#a78bfa22', '#17203d12'));

  const activeIndices = new Set([3, 11, 18, 25, 34, 42, 51, 60]);

  const liveGemma = dynamic(() => {
    const m = mode.value;
    const ph = drift.value;

    if (m < 0.5) {
      // Beat 0: MoE Expert Constellation (8 of 128 routed + 1 shared)
      const expertDots = [];
      for (let i = 0; i < 64; i++) {
        const col = i % 16;
        const row = Math.floor(i / 16);
        const ex = -640 + col * 85;
        const ey = -115 + row * 78;
        const active = activeIndices.has(i);
        expertDots.push(
          circle(active ? 16 : 9, {
            fill: active ? COSMOS.gold : '#1a2645',
            stroke: active ? '#fff7d6' : '#3a4f7c',
            width: active ? 2.8 : 1.4,
          })
            .at(ex, ey)
            .glow(active ? 12 : 0, COSMOS.gold),
        );
      }
      return group(
        txt('DIFFUSIONGEMMA (GEMMA 4 MoE)  ·  SPARSE ROUTING', 0, -372, 30, COSMOS.gold, 'mono'),
        txt(
          '25.2B total params  ·  3.8B active / token',
          -780,
          -268,
          32,
          COSMOS.cyan,
          'mono',
          'left',
        ),
        txt('8 / 128 routed + 1 shared expert', 780, -268, 32, COSMOS.gold, 'mono', 'right'),
        ...expertDots,
        glassPlate(0, 240, 1280, 108, { stroke: COSMOS.emerald, glow: 8 }),
        txt(
          '1 Shared Expert (always active)   ·   Text / Image / Video → Text',
          0,
          240,
          30,
          COSMOS.emerald,
          'sans',
        ),
        txt('Google model card & docs · inspected Nov 7, 2026', 0, 368, 26, COSMOS.muted, 'sans'),
      );
    }

    if (m < 1.5) {
      // Beat 1: Autoregressive encoder KV prefix + 256-token bidirectional canvas loop
      return group(
        txt('PREFIX KV CACHE  &  256-TOKEN BIDIRECTIONAL CANVAS', 0, -372, 30, COSMOS.cyan, 'mono'),
        glassPlate(0, -175, 1520, 150, { stroke: COSMOS.blue, glow: 9 }),
        txt('Autoregressive Encoder Context  (KV Cache)', 0, -200, 36, COSMOS.blue, 'serif'),
        txt(
          'Prefills prompt & appends each completed 256-token block',
          0,
          -144,
          28,
          COSMOS.muted,
          'sans',
        ),

        photonWire(
          [
            [-390, -95],
            [-390, 55],
          ],
          ph * 3.2,
          { color: COSMOS.cyan, width: 4 },
        ),
        txt('reads cached KV', -560, -20, 26, COSMOS.cyan, 'mono'),

        photonWire(
          [
            [390, 55],
            [390, -95],
          ],
          ph * 3.2 + 0.5,
          { color: COSMOS.gold, width: 4 },
        ),
        txt('appends finished block', 590, -20, 26, COSMOS.gold, 'mono'),

        glassPlate(0, 150, 1260, 175, { stroke: COSMOS.cyan, glow: 11 }),
        txt('Bidirectional Decoder  ·  256-Token Canvas', 0, 122, 38, COSMOS.cyan, 'serif').glow(
          6,
          COSMOS.cyan,
        ),
        txt(
          'Up to 48 refinement steps  (typical reported: 12–16 steps)',
          0,
          184,
          28,
          COSMOS.gold,
          'mono',
        ),
        txt(
          'Two distinct memory lifetimes inside one serving loop',
          0,
          355,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    // Beat 2: Dual AND stopping predicate (entropy < threshold AND 2 consecutive identical rounds)
    return group(
      txt('INTERNAL REFINEMENT  vs  EXTERNAL COMMITMENT', 0, -372, 30, COSMOS.emerald, 'mono'),
      glassPlate(-460, -120, 680, 200, { stroke: COSMOS.cyan, glow: 8 }),
      txt('CONDITION A', -460, -175, 26, COSMOS.muted, 'mono'),
      txt('Average entropy < threshold', -460, -112, 34, COSMOS.cyan, 'serif'),
      txt('low-entropy slots kept · others renoised', -460, -56, 26, COSMOS.muted, 'sans'),

      glassPlate(460, -120, 680, 200, { stroke: COSMOS.gold, glow: 8 }),
      txt('CONDITION B', 460, -175, 26, COSMOS.muted, 'mono'),
      txt('2 consecutive identical rounds', 460, -112, 34, COSMOS.gold, 'serif'),
      txt('same predicted tokens twice in a row', 460, -56, 26, COSMOS.muted, 'sans'),

      photonWire(
        [
          [-460, -15],
          [-160, 115],
        ],
        ph * 3,
        { color: COSMOS.cyan, width: 3.8 },
      ),
      photonWire(
        [
          [460, -15],
          [160, 115],
        ],
        ph * 3 + 0.5,
        { color: COSMOS.gold, width: 3.8 },
      ),

      glassPlate(0, 185, 920, 130, { stroke: COSMOS.emerald, glow: 12 }),
      txt('BOTH HOLD  →  COMMIT BLOCK TO OUTPUT', 0, 185, 34, COSMOS.emerald, 'mono').glow(
        8,
        COSMOS.emerald,
      ),

      txt(
        'Largest speedups reported at low–medium batch on 1 accelerator · measure at your real batch size',
        0,
        358,
        26,
        COSMOS.muted,
        'sans',
      ),
    );
  });

  s.add(liveGemma);
  livingDrift(s, c, drift, 1);

  pulseCue(s, c, 'df-gemma-system-0', mode, 0.1, { dur: 0.3 });
  cueTo(s, c, 'df-gemma-system-1', mode, 1, { dur: 0.45 });
  cueTo(s, c, 'df-gemma-system-2', mode, 2, { dur: 0.45 });
}
