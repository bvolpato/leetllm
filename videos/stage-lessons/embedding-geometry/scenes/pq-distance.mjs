// Scene 14: pq-distance: "Read a distance from the stored IDs"
// View 1: Glowing 4×2 ADC distance lookup matrix + live term-substitution accumulator
//         ([1,1,1,1] -> 0.08, [1,0,1,1] -> 4.55, [0,0,0,0] -> 56.57, 96 KiB table).
// View 2: Luminous 1D number-line ADC vs SDC replay (q=1.4, A=1.4, B=2.0 -> snap to 2.0).
import { dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  PQ_PAIRS,
  PQ_QUERY,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  pqTables,
  rule,
  runPhase,
  swapVis,
  txt,
} from '../parts.mjs';

export default function pqDistance(s, c) {
  const values = pqTables();
  const codes = [
    [1, 1, 1, 1],
    [1, 0, 1, 1],
    [0, 0, 0, 0],
  ];
  const evalCode = (code) => code.reduce((acc, id, i) => acc + values[i][id], 0);

  // 1D ADC vs SDC model
  const q1d = 1.4;
  const orig1d = [1.4, 2.0];
  const enc1d = [2.0, 2.0];
  const encQ1d = 2.0;

  const phase = s.value(0);
  const vLookup = s.value(1);
  const vLine = s.value(0);

  // View 1 states
  const hasFirst = s.value(0);
  const hasAll = s.value(0);
  const modeIdx = s.value(-1); // -1=worked, 0=[1,1,1,1], 1=[1,0,1,1], 2=[0,0,0,0]
  const showNear = s.value(0);
  const showSecond = s.value(0);
  const showMixed = s.value(0);
  const showFar = s.value(0);
  const showSize = s.value(0);

  // View 2 states
  const docsMix = s.value(0);
  const queryMix = s.value(0);
  const showExact1d = s.value(0);
  const showAdc1d = s.value(0);
  const showSdc1d = s.value(0);

  const title = heroTitle(['Read a distance', 'from the stored IDs'], {
    x: -855,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.gold,
    eyebrow: 'ASYMMETRIC DISTANCE COMPUTATION (ADC)',
  });

  // View 1: Glowing 4x2 ADC lookup matrix + live accumulator
  const lookupLayer = guardedDynamic(vLookup, (alpha) => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const mIdx = Math.round(modeIdx.value);
    const activeCode = mIdx >= 0 ? codes[mIdx] : null;
    const f1 = hasFirst.value;
    const fa = hasAll.value;

    const colXs = [-785, -620, -415, -185, 5];
    const rowYs = [-145, -40, 65, 170];

    const nodes = [
      txt('PAIR', colXs[0], -225, 26, COSMOS.muted, 'mono'),
      txt('QUERY', colXs[1], -225, 26, ROLE.query, 'mono'),
      txt('CENTER 1', colXs[2], -225, 26, ROLE.code, 'mono'),
      txt('ID 0 (0,0)', colXs[3], -225, 26, COSMOS.muted, 'mono'),
      txt('ID 1', colXs[4], -225, 26, ROLE.gold, 'mono'),
      rule(130, -255, 130, 325, COSMOS.rule, 1.8).opacity(0.6 * alpha),
    ];

    PQ_QUERY.forEach((qv, i) => {
      const ry = rowYs[i];
      const selId =
        activeCode && (mIdx !== 1 || i !== 1 || showSecond.value > 0.5) ? activeCode[i] : -1;
      const sel0 = selId === 0;
      const sel1 = selId === 1;
      const val0Ready = fa > 0.5;
      const val1Ready = i === 0 ? f1 > 0.5 : fa > 0.5;

      nodes.push(
        txt(`#${i + 1}`, colXs[0], ry, 30, COSMOS.muted, 'mono').opacity(alpha),
        txt(`[${qv.join(', ')}]`, colXs[1], ry, 28, ROLE.query, 'mono').opacity(alpha),
        txt(`[${PQ_PAIRS[i].join(', ')}]`, colXs[2], ry, 28, ROLE.code, 'mono').opacity(alpha),
        // Cell ID 0
        lumBar(colXs[3], ry, 160, 68, {
          color: sel0 ? ROLE.gold : '#3c507c',
          fillAlpha: sel0 ? 0.28 : 0.12,
          strokeWidth: sel0 ? 3.2 : 1.6,
          glow: sel0 ? 11 * pulse : 3,
          opacity: alpha,
        }),
        txt(
          val0Ready ? values[i][0].toFixed(2) : '·',
          colXs[3],
          ry,
          32,
          sel0 ? ROLE.gold : COSMOS.ink,
          'mono',
        ).opacity(alpha),
        // Cell ID 1
        lumBar(colXs[4], ry, 160, 68, {
          color: sel1 ? ROLE.gold : '#3c507c',
          fillAlpha: sel1 ? 0.28 : 0.12,
          strokeWidth: sel1 ? 3.2 : 1.6,
          glow: sel1 ? 11 * pulse : 3,
          opacity: alpha,
        }),
        txt(
          val1Ready ? values[i][1].toFixed(2) : '·',
          colXs[4],
          ry,
          32,
          sel1 ? ROLE.gold : COSMOS.ink,
          'mono',
        ).opacity(alpha),
      );
    });

    // Right side: worked calculation OR active code accumulator
    const rx = 505;
    if (mIdx < 0) {
      nodes.push(
        txt('PAIR 1 → CENTER 1', rx, -135, 28, ROLE.code, 'mono').opacity(alpha),
        txt('(1.1 − 1.2)² = 0.01', rx, -55, 34, ROLE.query, 'mono').opacity(alpha),
        txt('+ (3.3 − 3.4)² = 0.01', rx, 8, 34, ROLE.query, 'mono').opacity(alpha),
        txt('entry = 0.02', rx, 88, 38, ROLE.gold, 'mono')
          .glow(7, ROLE.gold)
          .opacity(f1 * alpha),
      );
    } else {
      const code = codes[mIdx];
      const showExpr = mIdx !== 1 || showSecond.value > 0.5;
      const showTot =
        (mIdx === 0 && showNear.value > 0.5) ||
        (mIdx === 1 && showMixed.value > 0.5) ||
        (mIdx === 2 && showFar.value > 0.5);

      nodes.push(
        txt('STORED CODE IDs', rx, -175, 26, ROLE.code, 'mono').opacity(alpha),
        txt(`[ ${code.join('  ')} ]`, rx, -108, 48, ROLE.code, 'mono')
          .glow(8, ROLE.code)
          .opacity(alpha),
      );

      if (showExpr) {
        const t01 = `${values[0][code[0]].toFixed(2)} + ${values[1][code[1]].toFixed(2)}`;
        const t23 = `+ ${values[2][code[2]].toFixed(2)} + ${values[3][code[3]].toFixed(2)}`;
        nodes.push(
          txt(t01, rx, -8, 36, COSMOS.ink, 'mono').opacity(alpha),
          txt(t23, rx, 52, 36, COSMOS.ink, 'mono').opacity(alpha),
        );
      } else {
        nodes.push(
          txt('Changed ID #2 to 0', rx, -8, 34, ROLE.gold, 'serif').opacity(alpha),
          txt('Which term changes?', rx, 54, 38, ROLE.gold, 'serif')
            .glow(8, ROLE.gold)
            .opacity(alpha),
        );
      }

      if (showTot) {
        nodes.push(
          txt(`gap² = ${evalCode(code).toFixed(2)}`, rx, 168, 48, ROLE.gold, 'mono')
            .glow(10, ROLE.gold)
            .opacity(alpha),
        );
      }
    }

    // Bottom status bar (sequential, zero overlap)
    if (showSize.value > 0.5) {
      nodes.push(
        txt(
          '96 pairs × 256 centers × 4 B = 96 KiB per query lookup table',
          0,
          365,
          34,
          ROLE.code,
          'mono',
        )
          .glow(7, ROLE.code)
          .opacity(alpha),
      );
    } else if (mIdx === 1 && showSecond.value > 0.5) {
      nodes.push(
        txt(
          'Pair 2 lookup moves left:  0.02 → 4.49   (other three stay 0.02)',
          0,
          365,
          34,
          ROLE.gold,
          'mono',
        )
          .glow(7, ROLE.gold)
          .opacity(alpha),
      );
    } else if (mIdx === 1 && showSecond.value <= 0.5) {
      nodes.push(
        txt(
          'From [1 1 1 1] to [1 0 1 1]  ·  one term swaps',
          0,
          365,
          32,
          ROLE.gold,
          'sans',
        ).opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          'Center 0 is [0, 0] in every pair  ·  one query table serves all documents',
          0,
          365,
          28,
          COSMOS.muted,
          'sans',
        ).opacity(alpha),
      );
    }

    return group(...nodes);
  });

  // View 2: 1D number line ADC vs SDC comparison
  const lineLayer = guardedDynamic(vLine, (alpha) => {
    const p = phase.value;
    const pulse = 0.8 + 0.2 * Math.sin(p * 3.0);
    const dm = docsMix.value;
    const qm = queryMix.value;
    const rL = -620;
    const rR = 620;
    const ry = -95;
    const mapX = (v) => rL + (v / 2.0) * (rR - rL);

    const qx = mapX(q1d + qm * (encQ1d - q1d));
    const ax = mapX(orig1d[0] + dm * (enc1d[0] - orig1d[0]));
    const bx = mapX(orig1d[1] + dm * (enc1d[1] - orig1d[1]));

    const nodes = [
      txt('1D REPLAY:  CENTERS AT 0 AND 2', 0, -255, 28, ROLE.code, 'mono').opacity(alpha),
      line([rL, ry], [rR, ry], { stroke: '#4c608e', width: 4.5 }).opacity(alpha),
      ...[0, 1.4, 2].flatMap((v) => [
        line([mapX(v), ry - 16], [mapX(v), ry + 16], { stroke: '#6c82b5', width: 3 }).opacity(
          alpha,
        ),
        txt(String(v), mapX(v), ry - 135, 30, COSMOS.muted, 'mono').opacity(alpha),
      ]),
      // Query marker above line
      glowDot(qx, ry - 58, { radius: 11, color: ROLE.query, glow: 12 * pulse, opacity: alpha }),
      txt('q', qx + 36, ry - 58, 34, ROLE.query, 'mono', 'left').opacity(alpha),
      // Document A & B markers below line
      glowDot(ax, ry + 56, { radius: 11, color: ROLE.A, glow: 11 * pulse, opacity: alpha }),
      txt('A', ax + 36, ry + 56, 34, ROLE.A, 'mono', 'left').opacity(alpha),
      glowDot(bx, ry + 116, { radius: 11, color: ROLE.B, glow: 11 * pulse, opacity: alpha }),
      txt('B', bx + 36, ry + 116, 34, ROLE.B, 'mono', 'left').opacity(alpha),

      rule(-720, 95, 720, 95, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('METHOD', -560, 150, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('A gap²', -50, 150, 26, ROLE.A, 'mono').opacity(alpha),
      txt('B gap²', 260, 150, 26, ROLE.B, 'mono').opacity(alpha),
      txt('SEPARATES A & B?', 570, 150, 26, COSMOS.muted, 'mono').opacity(alpha),
    ];

    const rows1d = [
      {
        label: 'Originals (exact)',
        a: '0.00',
        b: '0.36',
        sep: 'yes (A closer)',
        col: ROLE.A,
        op: showExact1d.value,
        y: 222,
      },
      {
        label: 'ADC (full query)',
        a: '0.36',
        b: '0.36',
        sep: 'tied at 0.36',
        col: ROLE.gold,
        op: showAdc1d.value,
        y: 294,
      },
      {
        label: 'SDC (quantized q)',
        a: '0.00',
        b: '0.00',
        sep: 'tied at 0.00',
        col: ROLE.warn,
        op: showSdc1d.value,
        y: 366,
      },
    ];
    rows1d.forEach((r) => {
      nodes.push(txt(r.label, -560, r.y, 30, COSMOS.ink, 'sans', 'left').opacity(alpha));
      if (r.op > 0.02) {
        nodes.push(
          txt(r.a, -50, r.y, 34, r.col, 'mono').opacity(r.op * alpha),
          txt(r.b, 260, r.y, 34, r.col, 'mono').opacity(r.op * alpha),
          txt(r.sep, 570, r.y, 28, r.col, 'mono')
            .glow(5, r.col)
            .opacity(r.op * alpha),
        );
      }
    });

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.code), title, lookupLayer, lineLayer);

  runPhase(s, c, phase, 12);

  // View 1 cues
  playCue(s, c, 'first', (d) => s.play(hasFirst.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'fill', (d) => s.play(hasAll.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'read', (d) => s.play(modeIdx.to(0, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'near', (d) => s.play(showNear.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'change', (d) => s.play(modeIdx.to(1, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'second', (d) => s.play(showSecond.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'mixed', (d) => s.play(showMixed.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'allzero', (d) => s.play(modeIdx.to(2, { duration: d })), { dur: 0.25 });
  playCue(s, c, 'far', (d) => s.play(showFar.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'size', (d) => s.play(showSize.to(1, { duration: d })), { after: true, dur: 0.4 });

  // View 2 cues (1D ADC vs SDC)
  playCue(s, c, 'line', (d) => s.play(swapVis(vLookup, vLine, d)), { dur: 0.65 });
  playCue(s, c, 'exact', (d) => s.play(showExact1d.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'docs', (d) => s.play(docsMix.to(1, { duration: d })), { dur: 1.2 });
  playCue(s, c, 'adc', (d) => s.play(showAdc1d.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'query', (d) => s.play(queryMix.to(1, { duration: d })), { dur: 1.2 });
  playCue(s, c, 'sdc', (d) => s.play(showSdc1d.to(1, { duration: d })), { after: true, dur: 0.4 });
}
