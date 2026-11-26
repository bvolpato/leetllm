// Scene 11: attention: Cross-attention Q*K/sqrt(3) -> softmax [0.384,0.317,0.299] -> weighted V0 (0.322) -> tanh gate 0 -> 0.35.
import {
  ATTN_OPEN,
  ATTN_ZERO,
  COSMOS,
  ROLE,
  TEXT_STATE,
  VISUAL_KEYS,
  VISUAL_VALUES,
  aura,
  chipPill,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rect,
  seq,
  swapVis,
  txt,
} from '../parts.mjs';

export default function attention(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const showKeys = s.value(0);
  const showDot = s.value(0);
  const showScale = s.value(0);
  const showSoft = s.value(0);
  const showWeighted = s.value(0);
  const showSlot2 = s.value(0);
  const showZeroGate = s.value(0);
  const gateVal = s.value(0); // 0 -> 0.35

  const bgAura = aura(0, 0, 760, '#14325c28', '#27174826');
  const title = heroTitle(['How Does Text Read', 'a Visual Memory?'], {
    x: -855,
    y: -435,
    size: 50,
    lineHeight: 58,
    accent: ROLE.bridge,
  });

  const eq = glowTex(String.raw`A = \mathrm{softmax}\!\left(\frac{q K^\top}{\sqrt{3}}\right)V`, {
    x: 430,
    y: -395,
    size: 34,
    color: ROLE.gold,
    glow: 7,
  });

  const rawDots = VISUAL_KEYS.map(
    (k) => k[0] * TEXT_STATE[0] + k[1] * TEXT_STATE[1] + k[2] * TEXT_STATE[2],
  );
  const v0Contribs = ATTN_ZERO.weights.map((w, i) => w * VISUAL_VALUES[i][0]);

  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const ky = showKeys.value;
    const dt = showDot.value;
    const sc = showScale.value;
    const sf = showSoft.value;
    const wt = showWeighted.value;
    const s2 = showSlot2.value;

    const nodes = [
      txt('TEXT QUERY: q = [0.20, 0.10, 0.70]', -855, -240, 28, ROLE.text, 'mono', 'left').opacity(
        alpha,
      ),
      txt('VISUAL SLOT KEY', -855, -172, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('SCORE', -290, -172, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('WEIGHT', -60, -172, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt('w * V[0]', 290, -172, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
    ];

    const slotColors = [ROLE.vision, ROLE.ok, ROLE.bridge];
    VISUAL_KEYS.forEach((k, idx) => {
      const y = -85 + idx * 112;
      const col = slotColors[idx];
      const isSecond = idx === 1;
      const scoreText =
        sc > 0.35
          ? ATTN_ZERO.logits[idx].toFixed(3)
          : dt > 0.35
            ? rawDots[idx].toFixed(3)
            : 'q . k';

      nodes.push(
        chipPill(`K${idx + 1} [${k.map((v) => v.toFixed(2)).join(', ')}]`, -610, y, {
          w: 490,
          h: 72,
          color: ky > 0.2 ? col : '#384c76',
          size: 26,
          glow: isSecond && s2 > 0.3 ? 14 : 5,
          opacity: alpha,
        }),
        txt(scoreText, -290, y, 28, sc > 0.35 ? ROLE.gold : ROLE.text, 'mono', 'left').opacity(
          alpha * (0.55 + 0.45 * Math.max(dt, sc)),
        ),
        lumBar(-60, y, Math.max(12, ATTN_ZERO.weights[idx] * 260 * (0.25 + 0.75 * sf)), 30, col, {
          opacity: alpha * (0.48 + 0.52 * sf),
          maxTrackW: 220,
        }),
        txt(
          sf > 0.35 ? ATTN_ZERO.weights[idx].toFixed(3) : '?',
          180,
          y,
          28,
          col,
          'mono',
          'left',
        ).opacity(alpha * (0.48 + 0.52 * sf)),
        chipPill(
          wt > 0.35
            ? `${ATTN_ZERO.weights[idx].toFixed(3)} x ${VISUAL_VALUES[idx][0].toFixed(1)} = ${v0Contribs[idx].toFixed(3)}`
            : `V${idx + 1}[0] = ${VISUAL_VALUES[idx][0].toFixed(1)}`,
          570,
          y,
          {
            w: 560,
            h: 72,
            color: isSecond && s2 > 0.3 ? ROLE.ok : col,
            fill: isSecond && s2 > 0.3 ? '#0f2d24' : '#10182d',
            size: 26,
            glow: isSecond && s2 > 0.3 ? 14 : 4,
            opacity: alpha * (0.55 + 0.45 * wt),
          },
        ),
      );
    });

    nodes.push(
      txt(
        s2 > 0.35
          ? `Slot 2 adds +0.254 (V2[0]=0.8 is 8x larger!)  ->  Attended[0] = ${ATTN_ZERO.attended[0].toFixed(3)}`
          : wt > 0.35
            ? `Weighted sum for coord 0 = 0.038 + 0.254 + 0.030 = ${ATTN_ZERO.attended[0].toFixed(3)}`
            : sc > 0.35
              ? 'Divide dot products by sqrt(3): 0.57 / 1.732 = 0.329'
              : 'Multiply matching coordinates and scale by sqrt(3)',
        0,
        285,
        28,
        s2 > 0.35 ? ROLE.ok : ROLE.gold,
        'mono',
        'center',
      )
        .glow(s2 > 0.35 ? 8 : 0, ROLE.ok)
        .opacity(alpha),
    );

    return group(...nodes);
  });

  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const g = gateVal.value;
    const zg = showZeroGate.value;
    const tanhG = Math.tanh(g);
    const barX = -460;
    const scaleW = 920;

    const nodes = [
      txt(
        `RESIDUAL GATE:  h_out = h_text + tanh(${g.toFixed(2)}) * A    [ tanh = ${tanhG.toFixed(3)} ]`,
        0,
        -225,
        30,
        g > 0.1 ? ROLE.ok : ROLE.vision,
        'mono',
        'center',
      )
        .glow(g > 0.1 ? 8 : 0, ROLE.ok)
        .opacity(alpha),
    ];

    TEXT_STATE.forEach((base, idx) => {
      const y = -110 + idx * 130;
      const add = tanhG * ATTN_ZERO.attended[idx];
      const fused = base + add;
      const baseW = base * scaleW;
      const addW = Math.max(0, add * scaleW);

      nodes.push(
        txt(`Coord ${idx + 1}`, -855, y, 30, COSMOS.ink, 'mono', 'left').opacity(alpha),
        rect(scaleW, 48, { fill: '#10182d', stroke: '#27385f', width: 1.8, radius: 6 })
          .at(barX + scaleW * 0.5, y)
          .opacity(alpha * 0.7),
        rect(baseW, 44, { fill: ROLE.text, stroke: null, radius: 6 })
          .at(barX + baseW * 0.5, y)
          .glow(zg > 0.2 && g < 0.05 ? 10 : 0, ROLE.text)
          .opacity(alpha),
      );

      if (addW > 3) {
        nodes.push(
          rect(addW, 44, { fill: ROLE.ok, stroke: null, radius: 6 })
            .at(barX + baseW + addW * 0.5, y)
            .glow(12, ROLE.ok)
            .opacity(alpha),
        );
      }

      nodes.push(
        txt(
          g > 0.05
            ? `${base.toFixed(2)} + ${add.toFixed(3)} = ${fused.toFixed(3)}`
            : `${base.toFixed(3)} (intact)`,
          barX + scaleW + 30,
          y,
          28,
          g > 0.05 ? ROLE.ok : ROLE.text,
          'mono',
          'left',
        ).opacity(alpha),
      );
    });

    nodes.push(
      txt(
        g > 0.2
          ? `At gate 0.35: coord 1 moves 0.200 -> ${ATTN_OPEN.fused[0].toFixed(3)} (admits ~1/3 of read)`
          : 'At gate 0: multiply visual read by 0 -> original blue text state stays at 0.200',
        0,
        295,
        28,
        g > 0.2 ? ROLE.ok : ROLE.vision,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, view1, view2);
  playCue(s, c, 'attention-query-keys', (d) => s.play(showKeys.to(1, { duration: d })));
  playCue(s, c, 'attention-query-scores', (d) => s.play(showDot.to(1, { duration: d })));
  playCue(s, c, 'attention-scale-scores', (d) => s.play(showScale.to(1, { duration: d })));
  playCue(s, c, 'attention-softmax-normalize', (d) => s.play(showSoft.to(1, { duration: d })));
  playCue(s, c, 'attention-weight-values', (d) => s.play(showWeighted.to(1, { duration: d })));
  playCue(s, c, 'attention-largest-share', (d) => s.play(showSlot2.to(1, { duration: d })));
  playCue(
    s,
    c,
    'attention-zero-gate',
    (d) =>
      s.play(seq(swapVis(view1Vis, view2Vis, d * 0.7), showZeroGate.to(1, { duration: d * 0.3 }))),
    { dur: 0.9 },
  );
  playCue(s, c, 'attention-learned-gate', (d) => s.play(gateVal.to(0.35, { duration: d })), {
    dur: 0.9,
  });
}
