// Scene 12: qk-peri: "Which tensor does each norm control?"
// 3-act swapVis modern normalization tour:
//   Act 1 (Beat 0): Peri-LN / Sandwich dual-norm branch (Norm in -> Branch F -> Norm out) keeping
//     the blue skip highway untouched; norm-write activates Norm out.
//   Act 2 (Beat 1): Attention score shift-invariance (1000 -> 1800 on equal-shift, 50%/50% frozen).
//   Act 3 (Beat 2): QK-Norm unit-RMS dot bound (d_k=4 -> +2 vs -2 -> 98.2% / 1.8% AFTER qk-peaked).
import { arrow } from 'vizmatic/stage';
import { COSMOS, glowingTrail, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  F,
  ROLE,
  cinemaAtmosphere,
  fmt,
  ln,
  lumBar,
  pct,
  playBeat,
  playCue,
  shareRibbon,
  start,
  swapVis,
} from '../parts.mjs';

export default function qkPeri(s, c) {
  const lnIn = ln(start);
  const brOut = F(lnIn);
  const normOut = ln(brOut);
  const preSum = start.map((v, i) => v + brOut[i]);
  const periSum = start.map((v, i) => v + normOut[i]);
  const peakedProb = 1 / (1 + Math.exp(-4)); // 0.9820

  const title = heroTitle(['Which tensor does', 'each norm control?'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.norm,
  });

  const act1Vis = s.value(1);
  const act2Vis = s.value(0);
  const act3Vis = s.value(0);

  // Act 1
  const normWriteT = s.value(0); // 0 -> 1 activates Norm out
  // Act 2
  const scoreShift = s.value(0); // 0 -> 800
  // Act 3
  const alignedDotT = s.value(0); // 0 -> 1 fills aligned 1*1 -> +2
  const oppositeDotT = s.value(0); // 0 -> 1 fills opposite 1*(-1) -> -2
  const peakedVis = s.value(0); // 0 -> 1 reveals 98.2% / 1.8% AFTER qk-peaked!

  // ACT 1: Peri-LN / Sandwich dual-norm branch
  const act1Layer = guardedDynamic(act1Vis, (alpha) => {
    const nodes = [];
    const nw = normWriteT.value;
    const isPeri = nw > 0.35;

    const stageXs = [-680, -340, 0, 340, 680];
    const stageY = 65;
    const wireY = -135;

    // Blue direct skip highway arching overhead
    nodes.push(
      glowingTrail(
        [
          [stageXs[0], stageY - 58],
          [stageXs[0], wireY],
          [stageXs[4], wireY],
          [stageXs[4], stageY - 58],
        ],
        { color: ROLE.stream, width: 4.5, glow: 11, opacity: alpha },
      ),
      txt('Direct identity skip (original token)', 0, wireY - 36, 30, ROLE.stream, 'mono', 'center')
        .glow(6, ROLE.stream)
        .opacity(alpha),
    );

    const stages = [
      { label: 'Input', val: start[0], col: ROLE.gold },
      { label: 'Norm in', val: lnIn[0], col: ROLE.write },
      { label: 'Branch F', val: brOut[0], col: ROLE.write },
      {
        label: isPeri ? 'Norm out' : 'Write',
        val: isPeri ? normOut[0] : brOut[0],
        col: isPeri ? ROLE.norm : COSMOS.muted,
      },
      {
        label: 'Add skip',
        val: isPeri ? periSum[0] : preSum[0],
        col: ROLE.gold,
      },
    ];

    stages.forEach((st, i) => {
      const sx = stageXs[i];
      const hi = i === 3 && isPeri;
      nodes.push(
        lumBar(sx, stageY, 224, 114, {
          color: st.col,
          fillOpacity: hi ? 0.38 : 0.16,
          strokeWidth: hi ? 3.2 : 2.2,
          glow: hi ? 13 : 6,
          opacity: alpha,
        }),
        txt(st.label, sx, stageY - 22, 30, st.col, 'sans', 'center').opacity(alpha),
        txt(fmt(st.val, 3), sx, stageY + 26, 34, COSMOS.ink, 'mono', 'center').opacity(alpha),
      );
      if (i < 4) {
        nodes.push(
          arrow([sx + 122, stageY], [stageXs[i + 1] - 122, stageY], {
            stroke: hi || (i === 2 && isPeri) ? ROLE.norm : '#5c72a6',
            width: 3.2,
            tip: 12,
          }).opacity(alpha),
        );
      }
    });

    nodes.push(
      txt(
        isPeri
          ? 'Gemma 2 & Peri-LN: Norm in controls reads · Norm out controls writes before +'
          : 'Pre-LN normalizes branch input · skip stays direct',
        0,
        295,
        30,
        isPeri ? ROLE.norm : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(isPeri ? 6 : 0, ROLE.norm)
        .opacity(alpha),
      txt(
        'First feature shown   ·   each norm reduces all 4 features',
        0,
        365,
        26,
        COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // ACT 2: Attention score shift-invariance (1000 -> 1800, 50%/50% frozen)
  const act2Layer = guardedDynamic(act2Vis, (alpha) => {
    const nodes = [];
    const curScore = 1000 + scoreShift.value;
    const barH = 95 + (scoreShift.value / 800) * 115;
    const baseY = 95;

    nodes.push(
      txt(
        'Inside attention: one query, two visible keys',
        0,
        -255,
        34,
        COSMOS.ink,
        'sans',
        'center',
      ).opacity(alpha),
      // Key A pillar
      lumBar(-340, baseY - barH / 2, 230, barH, {
        color: ROLE.write,
        fillOpacity: 0.36,
        strokeWidth: 2.8,
        glow: 11,
        opacity: alpha,
      }),
      txt('Key A score', -340, baseY + 40, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(String(Math.round(curScore)), -340, baseY - barH - 36, 48, ROLE.write, 'mono', 'center')
        .glow(8, ROLE.write)
        .opacity(alpha),
      // Key B pillar
      lumBar(340, baseY - barH / 2, 230, barH, {
        color: ROLE.rms,
        fillOpacity: 0.36,
        strokeWidth: 2.8,
        glow: 11,
        opacity: alpha,
      }),
      txt('Key B score', 340, baseY + 40, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(String(Math.round(curScore)), 340, baseY - barH - 36, 48, ROLE.rms, 'mono', 'center')
        .glow(8, ROLE.rms)
        .opacity(alpha),
      // Center badge showing +800 shift
      txt(
        scoreShift.value > 20 ? `+${Math.round(scoreShift.value)} to both` : 'Gap = 0',
        0,
        -60,
        34,
        ROLE.gold,
        'mono',
        'center',
      )
        .glow(7, ROLE.gold)
        .opacity(alpha),
      // Frozen 50% / 50% share ribbon below
      shareRibbon({
        xPos: 0,
        yPos: 265,
        width: 960,
        height: 58,
        shares: [0.5, 0.5],
        colors: [ROLE.write, ROLE.rms],
        labels: ['Key A: 50%', 'Key B: 50%'],
        opacity: alpha,
      }),
      txt(
        'Equal shifts cancel in softmax  ·  score gaps drive attention',
        0,
        395,
        30,
        ROLE.gold,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  // ACT 3: QK-Norm unit-RMS dot bound (d_k = 4) -> +2 vs -2 -> 98.2% vs 1.8%
  const act3Layer = guardedDynamic(act3Vis, (alpha) => {
    const nodes = [];
    const aT = alignedDotT.value;
    const oT = oppositeDotT.value;
    const pk = peakedVis.value;

    nodes.push(
      txt(
        'QK-Norm:  d_k = 4   ·   unit RMS (‖q‖ = ‖k‖ = 2)   ·   no learned gain',
        0,
        -245,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt('Feature products', -160, -165, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Sum / √4', 415, -165, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt('Score', 690, -165, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    const rows = [
      {
        label: 'Aligned key',
        expr: '1 × 1',
        sumStr: '+4 / 2',
        scoreStr: '+2',
        t: aT,
        y: -75,
        col: ROLE.write,
      },
      {
        label: 'Opposite key',
        expr: '1 × (-1)',
        sumStr: '-4 / 2',
        scoreStr: '-2',
        t: oT,
        y: 75,
        col: ROLE.alert,
      },
    ];

    rows.forEach((row) => {
      const filled = Math.floor(row.t * 4.01);
      nodes.push(
        txt(row.label, -830, row.y, 32, row.col, 'sans', 'left')
          .glow(filled > 0 ? 5 : 0, row.col)
          .opacity(alpha),
      );
      for (let j = 0; j < 4; j++) {
        const cx = -435 + j * 182;
        const lit = j < filled;
        nodes.push(
          lumBar(cx, row.y, 152, 68, {
            color: lit ? row.col : COSMOS.dim,
            fillOpacity: lit ? 0.28 : 0.08,
            strokeWidth: lit ? 2.5 : 1.5,
            glow: lit ? 8 : 2,
            opacity: alpha,
          }),
          txt(row.expr, cx, row.y, 28, lit ? COSMOS.ink : COSMOS.dim, 'mono', 'center').opacity(
            alpha,
          ),
        );
      }
      const done = filled >= 4;
      nodes.push(
        txt(
          done ? row.sumStr : '?',
          415,
          row.y,
          34,
          done ? row.col : COSMOS.dim,
          'mono',
          'center',
        ).opacity(alpha),
        txt(
          done ? row.scoreStr : '?',
          690,
          row.y,
          44,
          done ? row.col : COSMOS.dim,
          'mono',
          'center',
        )
          .glow(done ? 8 : 0, row.col)
          .opacity(alpha),
      );
    });

    // Bottom softmax share ribbon (strictly revealed AFTER qk-peaked!)
    if (pk > 0.05) {
      nodes.push(
        shareRibbon({
          xPos: 0,
          yPos: 255,
          width: 1120,
          height: 58,
          shares: [peakedProb, 1 - peakedProb],
          colors: [ROLE.write, ROLE.alert],
          labels: [`Aligned ${pct(peakedProb, 1)}`, `Opposite ${pct(1 - peakedProb, 1)}`],
          opacity: pk * alpha,
        }),
        txt(
          'Even bounded logits (+2 vs -2) can concentrate 98.2% on one key  ·  gains raise the bound',
          0,
          380,
          28,
          ROLE.gold,
          'sans',
          'center',
        ).opacity(pk * alpha),
      );
    } else {
      nodes.push(
        txt('Cauchy-Schwarz bound:  |q · k| <= 4', 0, 325, 32, ROLE.gold, 'mono', 'center')
          .glow(6, ROLE.gold)
          .opacity(alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.norm, ROLE.write), title, act1Layer, act2Layer, act3Layer);

  // Beat 0: Activate Norm out on norm-write
  playCue(s, c, 'norm-write', (d) => s.play(normWriteT.to(1, { duration: d })), { dur: 0.65 });

  // Beat 1: Swap to attention score shift-invariance, shift +800 on equal-shift
  playBeat(s, c, 1, (d) => s.play(swapVis(act1Vis, act2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'equal-shift', (d) => s.play(scoreShift.to(800, { duration: d })), { dur: 0.85 });

  // Beat 2: Swap to QK-Norm bound, populate aligned + opposite, reveal 98.2% AFTER qk-peaked
  playBeat(s, c, 2, (d) => s.play(swapVis(act2Vis, act3Vis, d)), { dur: 0.6 });
  playCue(s, c, 'qk-dot-bound', (d) => s.play(alignedDotT.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'qk-opposite', (d) => s.play(oppositeDotT.to(1, { duration: d })), { dur: 0.75 });
  playCue(s, c, 'qk-peaked', (d) => s.play(peakedVis.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
}
