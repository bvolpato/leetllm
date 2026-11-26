// Scene 20 (vocabulary-tiles): "How much memory does one set of scores need?"
// Orbiting 3D giant 31.31 GiB logit tensor vs glowing on-chip wireframe vocabulary tile cage + online LSE merge [2,-1] + [4,0].
import { gridPlane3d, line3d } from 'vizmatic/stage';
import {
  COSMOS,
  DANGER_COLOR,
  MARK_COLOR,
  MODEL,
  TARGET_COLOR,
  aura,
  cinematic3d,
  crossSwap,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  orbitScene,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

const T0 = MODEL.tiles[0]; // [2, -1], m=2, total=1+e^-3
const T1 = MODEL.tiles[1]; // [4, 0], m=4, retained = T0.total * e^(2-4), incoming = 1+e^-4
const FINAL_LSE = T1.logSumExp; // ~4.1507
const TILE_LOSS = FINAL_LSE - 2; // ~2.1507

export default function vocabularyTiles(s, c) {
  const phase = s.value(0);
  const vMem = s.value(1);
  const vTile = s.value(0);
  const tileSlide = s.value(-1.6);

  // View 1 state
  const showPos = s.value(0);
  const showVocab = s.value(0);
  const showBytes = s.value(0);
  const showGib = s.value(0);

  // View 2 state
  const showFused = s.value(0);
  const showIncoming = s.value(0);
  const rescaleAmt = s.value(0);
  const showAdded = s.value(0);
  const showLseResult = s.value(0);
  const showPicked = s.value(0);
  const showLoss = s.value(0);
  const showCce = s.value(0);
  const showMeasure = s.value(0);

  const bgAura = aura(430, 20, 520, '#3a183b36', '#133a3d18');

  // Orbiting 3D logit tensor volume [B*S=65536, V=128256] with moving glowing tile slice
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.06,
    distance: 15.0,
    unit: 108,
    focus: [0, 0, 0.3],
  }).at(435, 25);

  view3d.add(
    gridPlane3d({
      x: [-3.0, 3.0],
      y: [-2.4, 2.4],
      z: -1.1,
      step: 0.8,
      color: '#1c2642',
      opacity: 0.4,
    }),
  );
  // Giant materialized FP32 logit slab (rose wireframe)
  view3d.add(
    ...wireframeSlab3d([0, 0, 0], 2.5, 1.55, 0.95, {
      color: DANGER_COLOR,
      width: 2.2,
      glow: 6,
    }),
  );
  // Active glowing gold on-chip vocabulary tile slicing across V
  view3d.add(
    ...wireframeSlab3d(() => [tileSlide.value, 0, 0], 0.48, 1.58, 0.98, {
      color: MARK_COLOR,
      width: 3.4,
      glow: 11,
      onTop: true,
    }),
  );
  // Axis callout beams along V
  view3d.add(
    line3d([-2.5, -1.75, -0.95], [2.5, -1.75, -0.95], {
      color: COSMOS.cyan,
      width: 2.8,
      glow: 7,
    }),
  );

  const title = heroTitle(['Large Vocabularies', '& Tiled Log-Sum-Exp'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: MARK_COLOR,
    eyebrow: 'CUT CROSS-ENTROPY · ONLINE TILING',
  });

  const eqRescale = glowTex(
    'S_{\\text{new}} = S_{\\text{old}}\\,e^{m_{\\text{old}} - m_{\\text{new}}} + S_{\\text{tile}}',
    {
      x: -430,
      y: 255,
      size: 32,
      color: COSMOS.cyan,
      glow: 6,
    },
  );

  // View 1: 16 x 4096 x 128,256 x 4 bytes = 31.31 GiB
  const viewMem = guardedDynamic(vMem, (a) => {
    const nodes = [
      txt('MATERIALIZING FULL FP32 LOGITS', -855, -235, 26, DANGER_COLOR, 'mono', 'left').opacity(
        a,
      ),
      txt(
        '16 seqs × 4,096 positions = 65,536 rows',
        -855,
        -155,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(Math.max(0.35, showPos.value) * a),
      txt('× 128,256 vocabulary columns', -855, -88, 30, COSMOS.cyan, 'mono', 'left').opacity(
        showVocab.value * a,
      ),
      txt('× 4 bytes (FP32) = 33,621,540,864 B', -855, -20, 30, MARK_COLOR, 'mono', 'left').opacity(
        showBytes.value * a,
      ),
    ];

    if (showGib.value > 0.02) {
      nodes.push(
        txt('31.31 GiB', -855, 118, 86, DANGER_COLOR, 'mono', 'left')
          .glow(12, DANGER_COLOR)
          .opacity(showGib.value * a),
        txt(
          'Just for raw logits, before activations or gradients!',
          -855,
          202,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(showGib.value * a),
      );
    }

    nodes.push(
      txt('3D LOGIT TENSOR VOLUME', 435, -405, 26, DANGER_COLOR, 'mono').opacity(a),
      txt(
        'Rose = full 31.31 GiB matrix  ·  Gold = 1 active tile',
        435,
        412,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return nodes;
  });

  // View 2: Streaming 2 tiles [2, -1] then [4, 0] with online baseline rescaling
  const viewTile = guardedDynamic(vTile, (a) => {
    const rsc = rescaleAmt.value;
    const t0Disp = T0.total + (T1.retained - T0.total) * rsc;
    const w0 = t0Disp * 240;
    const w1 = T1.incoming * 240 * showAdded.value;

    const nodes = [
      txt(
        'ONLINE LOG-SUM-EXP ACROSS TWO VOCAB TILES',
        -855,
        -245,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ).opacity(a),
      txt('Tile 1: [2, −1]  (m₁ = 2)', -855, -165, 28, COSMOS.blue, 'mono', 'left').opacity(
        Math.max(0.4, showFused.value) * a,
      ),
      lumBar(-855 + w0 / 2, -108, Math.max(8, w0), 44, {
        color: COSMOS.blue,
        fillOpacity: 0.78,
        glow: 8,
        opacity: a,
      }),
      txt(
        rsc > 0.5
          ? `Tile 1 rescaled: ${T0.total.toFixed(3)} · e^(2−4) = ${T1.retained.toFixed(3)}`
          : `Tile 1 sum = 1 + e⁻³ = ${T0.total.toFixed(3)}`,
        -855,
        -52,
        26,
        COSMOS.blue,
        'mono',
        'left',
      ).opacity(a),
    ];

    if (showIncoming.value > 0.02) {
      nodes.push(
        txt('Tile 2: [4, 0]  (new max m₂ = 4!)', -855, -2, 28, MARK_COLOR, 'mono', 'left')
          .glow(6, MARK_COLOR)
          .opacity(showIncoming.value * a),
      );
    }

    if (showAdded.value > 0.02) {
      nodes.push(
        lumBar(-855 + w0 + 6 + w1 / 2, -108, Math.max(8, w1), 44, {
          color: MARK_COLOR,
          fillOpacity: 0.8,
          glow: 9,
          opacity: showAdded.value * a,
        }),
        txt(
          `Merged sum at m=4:  ${T1.retained.toFixed(3)} + ${T1.incoming.toFixed(3)} = ${T1.total.toFixed(3)}`,
          -855,
          52,
          28,
          COSMOS.ink,
          'mono',
          'left',
        ).opacity(showAdded.value * a),
      );
    }

    if (showLseResult.value > 0.02) {
      nodes.push(
        txt(
          `LSE = 4 + ln(${T1.total.toFixed(3)}) = ${FINAL_LSE.toFixed(3)}`,
          -855,
          106,
          30,
          COSMOS.cyan,
          'mono',
          'left',
        )
          .glow(7, COSMOS.cyan)
          .opacity(showLseResult.value * a),
      );
    }

    if (showPicked.value > 0.02) {
      nodes.push(
        txt(
          'Saved target logit z_target = 2.0 (from Tile 1)',
          -855,
          160,
          26,
          TARGET_COLOR,
          'mono',
          'left',
        ).opacity(showPicked.value * a),
      );
    }

    if (showLoss.value > 0.02) {
      nodes.push(
        txt(
          `Exact loss = ${FINAL_LSE.toFixed(3)} − 2 = ${TILE_LOSS.toFixed(2)} nats`,
          -855,
          340,
          36,
          TARGET_COLOR,
          'mono',
          'left',
        )
          .glow(9, TARGET_COLOR)
          .opacity(showLoss.value * a),
      );
    }

    if (showCce.value > 0.02) {
      nodes.push(
        txt(
          'Cut Cross-Entropy: fuse projection + LSE, zero giant HBM matrix',
          -855,
          404,
          26,
          MARK_COLOR,
          'sans',
          'left',
        ).opacity(showCce.value * a),
      );
    }

    if (showMeasure.value > 0.02) {
      nodes.push(
        txt(
          'Check approximation settings & verify loss + grad vs reference',
          435,
          -345,
          26,
          COSMOS.cyan,
          'sans',
        ).opacity(showMeasure.value * a),
      );
    }

    nodes.push(
      txt('ON-CHIP VOCABULARY TILE', 435, -405, 26, MARK_COLOR, 'mono').opacity(a),
      txt(
        'Gold wireframe tile streams across V in SRAM',
        435,
        412,
        26,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return nodes;
  });

  s.add(bgAura, view3d, title, viewMem, viewTile);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, view3d, { theta: 0.45, phi: 0.98 });

  // Beat 0
  c.on('vocabulary-tiles-0', () => {
    s.play(showPos.to(0.3, { duration: 0.3 }));
  });
  tweenCue(s, c, 'vocab-positions', showPos, 1, { duration: 0.4 });
  tweenCue(s, c, 'vocab-matrix', showVocab, 1, { duration: 0.4 });
  tweenCue(s, c, 'vocab-bytes', showBytes, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'vocab-gib', showGib, 1, { duration: 0.45, after: true });

  // Beat 1
  crossSwap(s, c, 'vocabulary-tiles-1', vMem, vTile, { duration: 0.55 });
  c.on('tile-fused', () => {
    s.play(showFused.to(1, { duration: 0.45 }));
    s.play(tileSlide.to(-0.5, { duration: 0.9 }));
  });
  c.on('tile-incoming', () => {
    s.play(showIncoming.to(1, { duration: 0.45 }));
    s.play(tileSlide.to(1.2, { duration: 0.9 }));
  });
  tweenCue(s, c, 'tile-rescale', rescaleAmt, 1, { duration: 0.7 });
  c.show('tile-rescale', eqRescale);
  tweenCue(s, c, 'tile-add', showAdded, 1, { duration: 0.45 });
  tweenCue(s, c, 'tile-result', showLseResult, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'tile-picked', showPicked, 1, { duration: 0.4 });
  tweenCue(s, c, 'tile-target', showLoss, 1, { duration: 0.45 });

  // Beat 2
  tweenCue(s, c, 'vocabulary-tiles-2', showCce, 0.5, { duration: 0.35 });
  tweenCue(s, c, 'tile-full-contract', showCce, 1, { duration: 0.45 });
  tweenCue(s, c, 'tile-measure', showMeasure, 1, { duration: 0.45 });
}
