// Scene 05: affine-range: [-1, 2] over 16 unsigned codes (s=0.2, z=5) -> clamp -2->0 (-1.0) and 3->15 (2.0), 0.73->9 (0.8) -> relabel signed (-8..7, z=-3).
import {
  AFFINE_EX,
  COSMOS,
  ROLE,
  aura,
  chipPill,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function affineRange(s, c) {
  const showZero = s.value(0);
  const showCols = s.value(0);
  const showClamps = s.value(0);
  const signedMode = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#20184422');
  const title = heroTitle(['Affine Range & Zero-Point:', 'Mapping [-1, 2] Across 16 Codes'], {
    x: -855,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.grid,
  });

  const sampleVals = [-2, -1, 0, 0.73, 2, 3];

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sz = showZero.value;
    const sc = showCols.value;
    const cl = showClamps.value;
    const sg = signedMode.value;
    const isSigned = sg > 0.35;

    const nodes = [
      txt(
        isSigned
          ? 'SIGNED 4-BIT (-8..7): SCALE s = 0.2, ZERO-POINT z = -3  (IDENTICAL REAL VALUES!)'
          : 'UNSIGNED 4-BIT (0..15): s = (2 - (-1))/15 = 0.2, ZERO-POINT z = 5',
        -855,
        -220,
        26,
        isSigned ? ROLE.code : ROLE.grid,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    sampleVals.forEach((v, idx) => {
      const cx = -700 + idx * 280;
      const uCode = AFFINE_EX.codes[idx];
      const sCode = uCode - 8;
      const rec = AFFINE_EX.reconstructed[idx];
      const isClamp = (idx === 0 || idx === 5) && cl > 0.35;
      const isZero = idx === 2 && sz > 0.3;
      const isMid = idx === 3 && sc > 0.3;
      const col = isClamp ? ROLE.err : isZero ? ROLE.gold : isMid ? ROLE.ok : ROLE.grid;

      nodes.push(
        rect(244, 240, {
          fill: isClamp ? '#301422' : isZero ? '#261e10' : '#10182d',
          stroke: col,
          width: isClamp || isZero || isMid ? 3 : 2,
          radius: 12,
        })
          .at(cx, 5)
          .opacity(alpha * (0.52 + 0.48 * Math.max(sz, sc))),
        txt(`w = ${v}`, cx, -75, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt(isSigned ? `q = ${sCode}` : `q = ${uCode}`, cx, 5, 32, col, 'mono', 'center').opacity(
          alpha * (0.5 + 0.5 * Math.max(sz, sc)),
        ),
        txt(
          `hat = ${rec.toFixed(1)}`,
          cx,
          75,
          28,
          isClamp ? ROLE.err : ROLE.ok,
          'mono',
          'center',
        ).opacity(alpha * (0.5 + 0.5 * Math.max(sc, cl))),
      );
    });

    nodes.push(
      chipPill(
        isSigned
          ? 'Signed labels shift z: 5 -> -3 with identical real values; symmetric sets z = 0'
          : cl > 0.35
            ? 'Out-of-range values (-2 -> -1.0, 3 -> 2.0) clip to endpoints; 0.73 -> code 9 -> 0.8'
            : 'Real zero lands exactly on an integer code: q_zero = 5 (5 steps of 0.2 above -1.0)',
        0,
        245,
        {
          w: 1640,
          h: 78,
          color: isSigned ? ROLE.code : cl > 0.35 ? ROLE.err : ROLE.gold,
          size: 26,
          opacity: alpha,
        },
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'affine-range-build-0', (d) => s.play(showZero.to(0.4, { duration: d })));
  playCue(s, c, 'affine-range-build-1', (d) => s.play(showZero.to(1, { duration: d })));
  playCue(s, c, 'affine-range-build-2', (d) => s.play(showCols.to(1, { duration: d })));
  playCue(s, c, 'upper-clamp', (d) => s.play(showClamps.to(0.6, { duration: d })));
  playCue(s, c, 'lower-clamp', (d) => s.play(showClamps.to(1, { duration: d })));
  playCue(s, c, 'affine-range-build-3', (d) => s.play(signedMode.to(1, { duration: d })));
}
