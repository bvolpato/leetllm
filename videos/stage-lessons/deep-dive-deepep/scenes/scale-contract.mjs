// Scene 17: Decoding a row of FP8 values.
// Prediction scene: Beat 0 packs 56 groups (224 scale B, 7,392 total, 14,336 BF16).
// Beat 1 zooms to coord 42 (value 10), receiver reads Group 1 scale 2 -> decodes 20 (after de-scale-wrong), asks which scale belongs!
// Beat 2 moves lookup to Group 0 (scale 0.5) -> decodes 5 strictly after c.after('de-scale-right').
import {
  BF16_TOTAL_BYTES,
  COSMOS,
  FP8_GROUPS,
  FP8_SCALE_BYTES,
  FP8_TOTAL_BYTES,
  ROLE,
  SCALE_RIGHT_DECODE,
  SCALE_WRONG_DECODE,
  aura,
  buildFp8ScaleWireRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  line,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function scaleContract(s, c) {
  const phase = s.value(0);
  const scaleVal = s.value(0);
  const cursorVal = s.value(1); // starts on Group 1 (wrong), moves to 0 (Group 0) on repair
  const groupsProg = s.value(0);
  const showScaleCount = s.value(0);
  const showTotal = s.value(0);
  const showBf16 = s.value(0);
  const zoomMode = s.value(0);
  const showWrong = s.value(0);
  const showAsk = s.value(0);
  const moveProg = s.value(0);
  const showRight = s.value(0); // STRICT: c.after('de-scale-right')

  const bgAura = aura(470, 12, 500, '#a78bfa24', '#5ce1e61c');
  const { view: rig3d } = buildFp8ScaleWireRig3d(scaleVal, cursorVal, phase, {
    x: 470,
    y: 12,
    unit: 94,
  });

  const title = heroTitle(['Decoding a Row', 'of FP8 Values'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.meta,
    eyebrow: 'SCALE CONTRACT · GROUP ALIGNMENT & STRIDE',
    subtitle: '56 groups of 128 values · each strip carries one 4-byte scale',
  });

  const fmt = (n) => n.toLocaleString('en-US');

  const live = guardedDynamic(1, () => {
    const isZoom = Math.round(zoomMode.value) >= 1;
    const hasCount = Math.round(showScaleCount.value) >= 1;
    const hasTotal = Math.round(showTotal.value) >= 1;
    const hasBf16 = Math.round(showBf16.value) >= 1;
    const isWrong = Math.round(showWrong.value) >= 1;
    const isAsk = Math.round(showAsk.value) >= 1;
    const isMoved = Math.round(moveProg.value) >= 1;
    const isRight = Math.round(showRight.value) >= 1;

    const nodes = [
      txt('3D FP8 SCALE GROUP LOOKUP', 470, -415, 26, ROLE.meta, 'mono').glow(5, ROLE.meta),
      txt(
        isRight
          ? 'Group 0 (0..127) scale 0.5 -> 10 x 0.5 = 5'
          : isZoom
            ? 'Coord 42 has encoded value 10 intact'
            : '56 strips x (128 B + 4 B) = 7,392 bytes',
        470,
        435,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    if (!isZoom) {
      const litCount = Math.round(groupsProg.value * FP8_GROUPS);
      // 7 rows x 8 cols of compact FP8+scale strips in left zone
      for (let i = 0; i < FP8_GROUPS; i++) {
        const col = i % 8;
        const row = Math.floor(i / 8);
        const sx = -840 + col * 102;
        const sy = -126 + row * 40;
        const lit = i < litCount;
        nodes.push(
          rect(74, 24, { fill: '#104961', stroke: ROLE.nvlink, width: 1.4, radius: 3 }).at(
            sx + 37,
            sy,
          ),
          rect(16, 24, {
            fill: lit ? '#61258a' : '#141929',
            stroke: lit ? ROLE.meta : COSMOS.dim,
            width: 1.4,
            radius: 2,
          }).at(sx + 84, sy),
        );
      }

      nodes.push(
        glassCell(-655, 224, 390, 96, hasCount ? ROLE.meta : COSMOS.dim, {
          fill: '#1b1130',
          glow: hasCount ? 6 : 0,
        }),
        txt(
          hasCount ? `56 x 4 B = ${FP8_SCALE_BYTES} B` : '4 B scale per group',
          -655,
          224,
          26,
          hasCount ? ROLE.meta : COSMOS.muted,
          'mono',
        ),
        glassCell(-225, 224, 390, 96, hasTotal ? ROLE.nvlink : COSMOS.dim, {
          fill: '#0c202e',
          glow: hasTotal ? 6 : 0,
        }),
        txt(
          hasTotal ? `FP8 total: ${fmt(FP8_TOTAL_BYTES)} B` : 'FP8 total: ? B',
          -225,
          224,
          26,
          hasTotal ? ROLE.nvlink : COSMOS.muted,
          'mono',
        ),
        txt(
          hasBf16
            ? `BF16 values alone: ${fmt(BF16_TOTAL_BYTES)} B (+ routes & headers)`
            : 'Packing 7,168 FP8 values with per-group scales',
          -860,
          340,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ),
      );
    } else {
      // Zoomed Group 0 vs Group 1 view for coordinate 42
      const g0x = -655;
      const g1x = -225;
      const ptrX = g1x - moveProg.value * (g1x - g0x);
      const ptrCol = isMoved ? ROLE.good : ROLE.bad;

      nodes.push(
        txt('Coordinate 42  ·  encoded FP8 value = 10', -860, -126, 28, ROLE.token, 'mono', 'left'),

        glassCell(g0x, -12, 395, 146, isMoved ? ROLE.good : ROLE.rank0, {
          fill: isMoved ? '#0d261e' : '#0e1b33',
          glow: 7,
        }),
        txt('Group 0 · 0..127', g0x, -48, 26, ROLE.nvlink, 'mono'),
        txt('scale = 0.5', g0x, 12, 36, COSMOS.ink, 'mono'),

        glassCell(g1x, -12, 395, 146, !isMoved ? ROLE.bad : ROLE.rank0, {
          fill: !isMoved ? '#2a101b' : '#0e1b33',
          glow: 7,
        }),
        txt('Group 1 · 128..255', g1x, -48, 26, ROLE.brand, 'mono'),
        txt('scale = 2.0', g1x, 12, 36, COSMOS.ink, 'mono'),

        // Pointer arrow moving from Group 1 -> Group 0
        line([ptrX, 126], [ptrX, 66], { stroke: ptrCol, width: 5 }).glow(8, ptrCol),
        txt('Receiver reads here', ptrX, 152, 26, ptrCol, 'mono'),
      );

      // Decoded output readout (strictly withholds 5 until de-scale-right!)
      let decText = '10 x 2.0 = ?';
      let decCol = ROLE.token;
      if (isRight) {
        decText = `10 x 0.5 = ${SCALE_RIGHT_DECODE}  (correct!)`;
        decCol = ROLE.good;
      } else if (isMoved) {
        decText = '10 x 0.5 = ?';
        decCol = ROLE.nvlink;
      } else if (isWrong) {
        decText = `10 x 2.0 = ${SCALE_WRONG_DECODE}  (wrong scale!)`;
        decCol = ROLE.bad;
      }

      nodes.push(
        glassCell(-440, 250, 820, 92, decCol, { fill: '#0e1b28', glow: 7 }),
        txt(decText, -440, 250, 32, decCol, 'mono'),
        txt(
          isRight
            ? 'Match scale grouping, dtype, layout & stride (same byte size!)'
            : isAsk
              ? 'Predict: which scale belongs to coordinate 42?'
              : 'A later BF16 cast preserves a wrong value like 20',
          -860,
          355,
          26,
          isAsk && !isMoved ? ROLE.token : COSMOS.muted,
          'sans',
          'left',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-scale-groups', () => {
    const dur = remainDuration(c, 'de-scale-groups', 0.9);
    s.play(groupsProg.to(1, { duration: dur }));
    s.play(scaleVal.to(1, { duration: dur }));
  });
  c.after('de-scale-count', () =>
    s.play(showScaleCount.to(1, { duration: remainAfterDuration(c, 'de-scale-count', 0.3) })),
  );
  c.after('de-scale-total', () =>
    s.play(showTotal.to(1, { duration: remainAfterDuration(c, 'de-scale-total', 0.3) })),
  );
  c.after('de-scale-bf16', () =>
    s.play(showBf16.to(1, { duration: remainAfterDuration(c, 'de-scale-bf16', 0.3) })),
  );

  c.on('de-scale-wrong', () => {
    s.play(zoomMode.to(1, { duration: 0.25 }));
  });
  c.after('de-scale-wrong', () =>
    s.play(showWrong.to(1, { duration: remainAfterDuration(c, 'de-scale-wrong', 0.3) })),
  );
  c.on('de-scale-ask', () =>
    s.play(showAsk.to(1, { duration: remainDuration(c, 'de-scale-ask', 0.45) })),
  );

  c.on('de-scale-move', () => {
    const dur = remainDuration(c, 'de-scale-move', 0.75);
    s.play(moveProg.to(1, { duration: dur }));
    s.play(cursorVal.to(0, { duration: dur }));
  });
  c.after('de-scale-right', () =>
    s.play(showRight.to(1, { duration: remainAfterDuration(c, 'de-scale-right', 0.3) })),
  );
}
