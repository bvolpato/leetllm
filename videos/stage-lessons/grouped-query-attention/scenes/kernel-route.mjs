// Scene 16: kernel-route - Group score routing (4 vs 50) + live VRAM footprint of repeat_interleave (1 + 4 = 5 MiB).
import {
  COMPACT_MIB,
  COSMOS,
  HEADS,
  PEAK_MIB,
  REPEATED_MIB,
  ROLE,
  cinemaAtmosphere,
  group,
  guardedDynamic,
  heroTitle,
  kvGroupForQuery,
  lumBar,
  playCue,
  range,
  rect,
  renderGqaRack2d,
  rule,
  runPhase,
  swapVis,
  txt,
} from '../parts.mjs';

export default function kernelRoute(s, c) {
  const keys = [1, 10];
  const scores = range(HEADS.queries).map((i) => (i + 1) * keys[kvGroupForQuery(i)]);

  const phase = s.value(0);
  const vRoute = s.value(1); // View 1: 8-to-2 group score routing
  const vAlloc = s.value(0); // View 2: Retained 1 MiB + temporary 4 MiB copies = 5 MiB peak

  // View 1 state
  const lit = s.value(-1);
  const showKeys = s.value(0);
  const showScores = s.value(0);

  // View 2 state
  const showRetained = s.value(0);
  const copiesVis = s.value(0); // 0 -> 1 on c.after('repeat'), 1 -> 0 on 'release'
  const allocStage = s.value(0); // 0=layout, 1=retained, 2=copies, 3=ask, 4=peak, 5=release, 6=inspect, 7=separate

  const title = heroTitle(['What lives beside', 'the retained cache?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'NATIVE KERNELS VS REPEAT_INTERLEAVE',
  });

  // VIEW 1: GQA 8-to-2 routing rack + luminous 2x4 raw dot-product grid
  const view1 = guardedDynamic(vRoute, (a) => {
    const sk = showKeys.value;
    const ss = showScores.value;
    const nodes = [
      ...renderGqaRack2d({
        left: -855,
        top: -215,
        width: 700,
        height: 550,
        mode: 1,
        tokens: 1,
        slots: 4,
        lit: lit.value,
        cursor: -1,
        phase: phase.value,
        colNames: ['0', '1', '2', '3'],
        alpha: a,
      }),
      rule(-95, -305, -95, 400, COSMOS.rule, 1.6).opacity(0.6 * a),
      txt(
        'RAW DOT PRODUCTS · 4 READERS PER GROUP',
        385,
        -265,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(a),
    ];

    // 2x4 luminous score grid (KV0: [1,2,3,4], KV1: [50,60,70,80])
    const cellW = 148;
    const cellH = 104;
    const gap = 18;
    const gx0 = 135;
    const gy0 = -165;
    const rowLabels = ['KV0', 'KV1'];
    const qIndices = [
      [0, 1, 2, 3],
      [4, 5, 6, 7],
    ];

    for (let r = 0; r < 2; r++) {
      const cy = gy0 + r * (cellH + gap) + cellH / 2;
      nodes.push(
        txt(
          rowLabels[r],
          gx0 - 28,
          cy,
          32,
          r === 0 ? ROLE.key : ROLE.query,
          'mono',
          'right',
        ).opacity(a),
      );
      for (let col = 0; col < 4; col++) {
        const cx = gx0 + col * (cellW + gap) + cellW / 2;
        const qi = qIndices[r][col];
        const val = scores[qi];
        const isJump = (qi === 3 || qi === 4) && ss > 0.5;
        const cellCol = isJump ? ROLE.gold : r === 0 ? ROLE.key : ROLE.query;
        nodes.push(
          lumBar(cx, cy, cellW, cellH, {
            color: cellCol,
            fillOpacity: ss > 0.5 ? (isJump ? 0.36 : 0.22) : 0.08,
            strokeWidth: isJump ? 3 : 1.8,
            glow: isJump ? 11 : ss > 0.5 ? 5 : 2,
            radius: 8,
            opacity: a,
          }),
          txt(`Q${qi}`, cx, cy - 24, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        );
        if (ss > 0.02) {
          nodes.push(
            txt(String(val), cx, cy + 16, 36, isJump ? ROLE.gold : COSMOS.ink, 'mono', 'center')
              .glow(isJump ? 8 : 0, ROLE.gold)
              .opacity(ss * a),
          );
        }
      }
    }

    if (sk > 0.02) {
      nodes.push(
        txt(
          'Group keys:  KV0 = 1    ·    KV1 = 10',
          385,
          130,
          32,
          ROLE.key,
          'mono',
          'center',
        ).opacity(sk * a),
      );
    }
    if (ss > 0.02) {
      nodes.push(
        txt('Jump: Q3 (4×1 = 4)  |  Q4 (5×10 = 50)', 410, 210, 28, ROLE.gold, 'mono', 'center')
          .glow(7, ROLE.gold)
          .opacity(ss * a),
      );
    }

    return group(...nodes);
  });

  // VIEW 2: Compact Retained Cache (1 MiB) + Ephemeral Repeated Copies (4 MiB) -> 5 MiB Peak
  const view2 = guardedDynamic(vAlloc, (a) => {
    const ret = showRetained.value;
    const cop = copiesVis.value;
    const st = Math.round(allocStage.value);

    const nodes = [
      txt(
        '1 LAYER · 2 REQUESTS × 1,024 POS · WIDTH 64 · 2 B/NUM',
        -855,
        -265,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      txt('GROUP', -820, -205, 26, COSMOS.muted, 'mono', 'left').opacity(a),
      txt('RETAINED KV (1 MiB)', -555, -205, 26, ROLE.key, 'mono', 'center').opacity(a),
      txt(
        'REPEATED COPIES (4 MiB TEMPORARY)',
        255,
        -205,
        26,
        cop > 0.2 ? ROLE.alert : COSMOS.muted,
        'mono',
        'center',
      ).opacity(a),
      rule(-330, -225, -330, 260, COSMOS.rule, 1.8).opacity(0.65 * a),
    ];

    const laneYs = [-65, 145];
    const slotW = 240;
    const barH = 44;

    for (let g = 0; g < 2; g++) {
      const ly = laneYs[g];
      nodes.push(txt(`KV${g}`, -820, ly, 42, ROLE.query, 'mono', 'left').opacity(a));

      // Retained compact slot (left column)
      const rx = -555;
      nodes.push(
        rect(slotW + 12, barH * 2 + 28, {
          fill: '#0c1324',
          stroke: '#2a3a63',
          width: 1.8,
          radius: 8,
        })
          .at(rx, ly)
          .opacity(a),
        lumBar(rx, ly - 28, slotW, barH, {
          color: ROLE.key,
          fillOpacity: 0.48,
          strokeWidth: 2.2,
          glow: ret > 0.5 ? 9 : 4,
          radius: 5,
          opacity: a,
        }),
        lumBar(rx, ly + 28, slotW, barH, {
          color: ROLE.value,
          fillOpacity: 0.48,
          strokeWidth: 2.2,
          glow: ret > 0.5 ? 9 : 4,
          radius: 5,
          opacity: a,
        }),
      );

      // 4 Repeated copy slots (right side)
      for (let k = 0; k < 4; k++) {
        const cx = -165 + k * 280;
        nodes.push(
          rect(slotW + 8, barH * 2 + 28, {
            fill: '#0c1324',
            stroke: '#253358',
            width: 1.6,
            radius: 8,
            dash: [7, 5],
          })
            .at(cx, ly)
            .opacity(0.7 * a),
        );
        if (cop > 0.02) {
          nodes.push(
            lumBar(cx, ly - 28, slotW, barH, {
              color: ROLE.key,
              fillOpacity: 0.44,
              strokeWidth: 2,
              glow: 8,
              radius: 5,
              opacity: cop * a,
            }),
            lumBar(cx, ly + 28, slotW, barH, {
              color: ROLE.value,
              fillOpacity: 0.44,
              strokeWidth: 2,
              glow: 8,
              radius: 5,
              opacity: cop * a,
            }),
          );
        }
      }
    }

    // Live memory meter readout beneath slots (strictly withholding 5 MiB until c.after('peak')!)
    const meterMap = [
      ['2 compact KV heads live', COSMOS.ink],
      [`Compact retained K + V = ${COMPACT_MIB} MiB`, ROLE.key],
      [`Compact: ${COMPACT_MIB} MiB   +   Expanded copies: ${REPEATED_MIB} MiB`, COSMOS.ink],
      [`While both are live:  ${COMPACT_MIB} + ${REPEATED_MIB} = ? MiB`, ROLE.gold],
      [`Peak: ${PEAK_MIB} MiB live`, ROLE.alert],
      [`Copies released  →  ${COMPACT_MIB} MiB retained cache remains`, ROLE.value],
      ['Use native grouped kernels (FlashAttention / FlashInfer)', ROLE.query],
      ['Time training & decode separately', COSMOS.muted],
    ];
    const [mText, mCol] = meterMap[Math.max(0, Math.min(meterMap.length - 1, st))];
    nodes.push(
      txt(mText, 0, 355, 36, mCol, st >= 3 && st <= 5 ? 'mono' : 'sans', 'center')
        .glow(st === 3 || st === 4 ? 9 : 0, mCol)
        .opacity(a),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.key), title, view1, view2);
  runPhase(s, c, phase, 16);

  playCue(s, c, 'group0', (d) => s.play(lit.to(3, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'group1', (d) => s.play(lit.to(4, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'keys', (d) => s.play(showKeys.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'scores', (d) => s.play(showScores.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });

  // Switch cleanly to View 2 on 'layout'
  playCue(s, c, 'layout', (d) => s.play(swapVis(vRoute, vAlloc, d)), { dur: 0.65 });
  playCue(
    s,
    c,
    'retained',
    (d) => s.play(showRetained.to(1, { duration: d }), allocStage.to(1, { duration: 0.2 })),
    { after: true, dur: 0.45 },
  );
  playCue(s, c, 'repeat', (d) => s.play(copiesVis.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'copies', (d) => s.play(allocStage.to(2, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'ask', (d) => s.play(allocStage.to(3, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'peak', (d) => s.play(allocStage.to(4, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(
    s,
    c,
    'release',
    (d) => s.play(copiesVis.to(0, { duration: d }), allocStage.to(5, { duration: 0.25 })),
    { dur: 0.55 },
  );
  playCue(s, c, 'inspect', (d) => s.play(allocStage.to(6, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'separate', (d) => s.play(allocStage.to(7, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
}
