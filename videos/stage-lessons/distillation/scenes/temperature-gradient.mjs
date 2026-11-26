// Scene 06: What changes when the temperature rises? (T^2 gradient compensation & alpha mix)
import {
  COSMOS,
  TEMP_GRAD_1,
  TEMP_GRAD_4,
  TEMP_GRAD_40,
  TEMP_GRAD_STUDENT,
  aura,
  glassCell,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainAfterDuration,
  remainDuration,
  runPhase,
  stableSoftmax,
  tempGradRow,
  txt,
} from '../parts.mjs';

export default function temperatureGradient(s, c) {
  const phase = s.value(0);
  const sSquare = s.value(0);
  const sOne = s.value(1);
  const sFour = s.value(0);
  const sScaledRes = s.value(0);
  const sForty = s.value(0);
  const sFortyRes = s.value(0);
  const sMix = s.value(0);
  const alphaVal = s.value(0);

  const bgAura = aura(320, 40, 600, '#182f5e26', '#331c5414');
  const title = heroTitle(['Why Multiply Soft Loss', 'by Temperature Squared?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'T^2 GRADIENT SCALING · HIGH-T LOGIT-MATCHING LIMIT',
  });

  // Precompute log-T curves for raw (p-q)/T vs scaled T(p-q) on T in [1..40]
  const px0 = 165;
  const px1 = 815;
  const pyTop = -125;
  const pyBot = 185;
  const mapX = (T) => px0 + (Math.log(T) / Math.log(40)) * (px1 - px0);
  const mapY = (g) => pyTop + (Math.abs(g) / 1.32) * (pyBot - pyTop); // 0 at top, -1.32 at bottom
  const rawCurvePts = [];
  const scaledCurvePts = [];
  for (let i = 0; i <= 40; i++) {
    const T = Math.pow(40, i / 40);
    const r = tempGradRow(T);
    rawCurvePts.push([mapX(T), mapY(r.raw)]);
    scaledCurvePts.push([mapX(T), mapY(r.scaled)]);
  }

  const hardGrad = stableSoftmax(TEMP_GRAD_STUDENT)[0] - 1;
  const softGrad4 = TEMP_GRAD_4.scaled;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sq = sSquare.value;
    const r4 = sFour.value;
    const scRes = sScaledRes.value;
    const r40 = sForty.value;
    const res40 = sFortyRes.value;
    const mix = sMix.value;
    const a = alphaVal.value;

    const nodes = [
      txt(
        'FIXED LOGITS:  Teacher [2, 0]   ·   Student [0, 2]',
        -855,
        -210,
        28,
        COSMOS.cyan,
        'mono',
        'left',
      ),
    ];

    if (mix < 0.5) {
      // Left: Exact gradient comparison table across T = 1, 4, 40
      const cols = [-790, -640, -490, -295, -70];
      ['T', 'q', 'p', '(p-q)/T', 'T(p-q)'].forEach((h, j) => {
        nodes.push(txt(h, cols[j], -124, 26, COSMOS.muted, 'mono'));
      });
      line([-845, -94], [65, -94], { stroke: COSMOS.rule, width: 2.2 });

      const rows = [
        { data: TEMP_GRAD_1, vis: sOne.value, showScaled: sq > 0.35 || scRes > 0.35 },
        { data: TEMP_GRAD_4, vis: r4, showScaled: scRes > 0.45 },
        { data: TEMP_GRAD_40, vis: r40, showScaled: res40 > 0.45 },
      ];

      rows.forEach((row, idx) => {
        const y = -28 + idx * 102;
        const v = Math.max(idx === 0 ? 1 : 0.22, row.vis);
        const d = row.data;
        nodes.push(
          glassCell(-390, y, 910, 76, idx === 2 && res40 > 0.45 ? COSMOS.emerald : COSMOS.rule, {
            fill: '#10182b',
            glow: row.vis > 0.5 ? 4 : 0,
            opacity: v,
          }),
          txt(String(d.T), cols[0], y, 30, COSMOS.ink, 'mono').opacity(v),
          txt(d.q.toFixed(3), cols[1], y, 28, COSMOS.blue, 'mono').opacity(v),
          txt(d.p.toFixed(3), cols[2], y, 28, COSMOS.cyan, 'mono').opacity(v),
          txt(d.raw.toFixed(4), cols[3], y, 28, COSMOS.rose, 'mono').opacity(v),
          txt(
            row.showScaled ? d.scaled.toFixed(3) : '?',
            cols[4],
            y,
            30,
            row.showScaled ? COSMOS.gold : COSMOS.dim,
            'mono',
          ).opacity(v),
        );
      });

      // Right: Continuous log-T magnitude wave
      nodes.push(
        txt('GRADIENT MAGNITUDE vs LOG(T)', px0, pyTop - 44, 26, COSMOS.gold, 'mono', 'left'),
        line([px0, pyTop], [px1 + 18, pyTop], { stroke: COSMOS.rule, width: 2.2 }),
        line([px0, pyTop], [px0, pyBot + 16], { stroke: COSMOS.rule, width: 2.2 }),
        // High-T limit line at -1.0
        line([px0, mapY(-1)], [px1, mapY(-1)], {
          stroke: COSMOS.emerald,
          width: 2.2,
          dash: [10, 6],
        }),
        txt('limit -1.0', px0 + 18, mapY(-1) + 34, 26, COSMOS.emerald, 'mono', 'left'),
        txt('T=1', mapX(1), pyBot + 46, 26, COSMOS.muted, 'mono'),
        txt('T=4', mapX(4), pyBot + 46, 26, COSMOS.muted, 'mono'),
        txt('T=40', mapX(40), pyBot + 46, 26, COSMOS.muted, 'mono'),
        glowingTrail(rawCurvePts, { color: COSMOS.rose, width: 3.8, glow: 8 }),
        glowingTrail(scaledCurvePts, {
          color: COSMOS.gold,
          width: 4.2,
          glow: 9,
          opacity: Math.max(0.45, sq),
        }),
        glowDot(mapX(1), mapY(TEMP_GRAD_1.raw), { radius: 6, color: COSMOS.rose }),
        glowDot(mapX(4), mapY(TEMP_GRAD_4.raw), {
          radius: 6,
          color: COSMOS.rose,
          opacity: Math.max(0.4, r4),
        }),
        glowDot(mapX(4), mapY(TEMP_GRAD_4.scaled), {
          radius: 7,
          color: COSMOS.gold,
          opacity: Math.max(0.4, scRes),
        }),
        glowDot(mapX(40), mapY(TEMP_GRAD_40.scaled), {
          radius: 7,
          color: COSMOS.emerald,
          opacity: Math.max(0.4, res40),
        }),
        txt('Unscaled ~ 1/T^2', px1, pyTop + 34, 26, COSMOS.rose, 'mono', 'right'),
        txt('T^2 scaled ~ -1', px1, mapY(-1) + 34, 26, COSMOS.gold, 'mono', 'right'),
      );
    } else {
      // Beat 2: Alpha blend slider between Hard CE (T=1) and Scaled Soft KL (T=4)
      const mixedGrad = (1 - a) * hardGrad + a * softGrad4;
      const railL = -640;
      const railR = 640;
      const knobX = railL + (railR - railL) * a;

      nodes.push(
        glassCell(-490, -56, 620, 128, COSMOS.cyan, { fill: '#102138', glow: 5 }),
        txt('HARD TARGET [1, 0] AT T = 1', -490, -86, 26, COSMOS.cyan, 'mono'),
        txt(`grad = ${hardGrad.toFixed(3)}`, -490, -34, 38, COSMOS.ink, 'mono'),

        glassCell(490, -56, 620, 128, COSMOS.blue, { fill: '#132445', glow: 6 }),
        txt('SCALED SOFT TEACHER AT T = 4', 490, -86, 26, COSMOS.blue, 'mono'),
        txt(`grad = ${softGrad4.toFixed(3)}`, 490, -34, 38, COSMOS.blue, 'mono'),

        line([railL, 92], [railR, 92], { stroke: COSMOS.rule, width: 6 }),
        line([railL, 92], [knobX, 92], { stroke: COSMOS.gold, width: 6 }).glow(8, COSMOS.gold),
        glowDot(knobX, 92, { radius: 14, color: COSMOS.gold }),
        txt(`alpha = ${a.toFixed(2)}`, knobX, 146, 36, COSMOS.gold, 'mono').glow(6, COSMOS.gold),

        txt(`First logit grad:  ${mixedGrad.toFixed(3)}`, -340, 232, 32, COSMOS.emerald, 'mono'),
        txt(`Alternative grad:  +${(-mixedGrad).toFixed(3)}`, 340, 232, 32, COSMOS.rose, 'mono'),
        txt(
          'Freeze teacher in eval() & detach targets · tune alpha on trusted dev cases',
          0,
          312,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
    }

    return group(...nodes);
  });

  const eqScale = glowTex(
    '\\mathcal{L} = \\alpha\\, T^2 D_{\\mathrm{KL}}(q^{(T)} \\Vert p^{(T)}) + (1 - \\alpha)\\mathcal{L}_{\\mathrm{CE}}',
    {
      x: 0,
      y: 386,
      size: 36,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqScale);
  runPhase(s, c, phase, 14);

  c.on('gradient-square', () => s.play(sSquare.to(1, { duration: 0.55 })));
  c.on('gradient-one', () => s.play(sOne.to(1, { duration: 0.3 })));
  c.on('gradient-four', () => s.play(sFour.to(1, { duration: 0.5 })));
  c.after('gradient-scaled-result', () =>
    s.play(sScaledRes.to(1, { duration: remainAfterDuration(c, 'gradient-scaled-result', 0.45) })),
  );
  c.on('gradient-forty', () => s.play(sForty.to(1, { duration: 0.5 })));
  c.after('gradient-forty-result', () =>
    s.play(sFortyRes.to(1, { duration: remainAfterDuration(c, 'gradient-forty-result', 0.45) })),
  );
  c.onBeat(2, () => s.play(sMix.to(1, { duration: 0.45 })));
  c.on('mixture-alpha', () =>
    s.play(alphaVal.to(0.7, { duration: remainDuration(c, 'mixture-alpha', 1.4) })),
  );
}
