// Scene 07: roofline - Operational intensity cancellation + live glowing H100 SXM log-log roofline.
import {
  COSMOS,
  H100,
  ROLE,
  chapterModel,
  cinemaAtmosphere,
  circle,
  glowDot,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

const RX0 = -125;
const RX1 = 835;
const RY0 = 265;
const RY1 = -265;
const LOG_AI_MIN = Math.log10(0.5);
const LOG_AI_MAX = Math.log10(1600);
const LOG_TF_MIN = Math.log10(1.5);
const LOG_TF_MAX = Math.log10(1600);

const mapAI = (ai) =>
  RX0 + ((Math.log10(ai) - LOG_AI_MIN) / (LOG_AI_MAX - LOG_AI_MIN)) * (RX1 - RX0);
const mapTF = (tf) =>
  RY0 - ((Math.log10(tf) - LOG_TF_MIN) / (LOG_TF_MAX - LOG_TF_MIN)) * (RY0 - RY1);
const roofPerf = (ai) => Math.min(H100.denseTflops, ai * H100.hbmTbs);

const ROOF_SAMPLES = 96;
const ROOF_PTS = Array.from({ length: ROOF_SAMPLES }, (_, i) => {
  const ai = Math.pow(10, LOG_AI_MIN + ((LOG_AI_MAX - LOG_AI_MIN) * i) / (ROOF_SAMPLES - 1));
  return [mapAI(ai), mapTF(roofPerf(ai))];
});

export default function roofline(s, c) {
  const model = chapterModel(c.id);
  const phase = s.value(0);

  // Left derivation progression
  const sQk = s.value(0);
  const sAv = s.value(0);
  const sBoth = s.value(0);
  const sRead = s.value(0);
  const sCancel = s.value(0);

  // Right roofline progression
  const pMha = s.value(0);
  const pGqa = s.value(0);
  const pMqa = s.value(0);
  const mqaAi = s.value(64);
  const showSparse = s.value(0);
  const showRidge = s.value(0);
  const showDrop = s.value(0);

  const title = heroTitle(['Attention work', 'per byte read'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'DECODE ROOFLINE · OPERATIONAL INTENSITY',
  });

  const cancelEq = glowTex(
    String.raw`\text{AI} = \frac{4 B H_q T d}{2 B H_{kv} T d P} = \frac{2}{P}\cdot\frac{H_q}{H_{kv}}`,
    { x: -520, y: 205, size: 32, color: ROLE.gold, glow: 7 },
  );

  const ridgeX = mapAI(H100.ridge);
  const peakY = mapTF(H100.denseTflops);

  const live = guardedDynamic(1, () => {
    const ph = phase.value;
    const qk = sQk.value;
    const av = sAv.value;
    const both = sBoth.value;
    const rd = sRead.value;
    const cn = sCancel.value;
    const pm = pMha.value;
    const pg = pGqa.value;
    const pq = pMqa.value;
    const curMqa = mqaAi.value;
    const sp = showSparse.value;
    const rg = showRidge.value;
    const dr = showDrop.value;

    const nodes = [
      rule(-235, -310, -235, 390, COSMOS.rule, 1.6).opacity(0.6),
      // Left algebraic breakdown (clean floating rows, zero boxes)
      txt('ONE LAYER · 1 DECODE STEP', -855, -245, 26, COSMOS.muted, 'mono', 'left'),
      txt('QKᵀ dot products', -855, -185, 28, COSMOS.muted, 'sans', 'left'),
    ];

    if (qk > 0.02) {
      nodes.push(txt('2 B H_q T d  FLOPs', -855, -142, 30, ROLE.query, 'mono', 'left').opacity(qk));
    }
    if (av > 0.02) {
      nodes.push(
        txt('AV value mix', -855, -75, 28, COSMOS.muted, 'sans', 'left').opacity(av),
        txt('2 B H_q T d  FLOPs', -855, -32, 30, ROLE.query, 'mono', 'left').opacity(av),
      );
    }
    if (both > 0.02) {
      nodes.push(
        txt('Total:  4 B H_q T d', -855, 32, 32, ROLE.gold, 'mono', 'left')
          .glow(6, ROLE.gold)
          .opacity(both),
      );
    }
    if (rd > 0.02) {
      nodes.push(
        txt('Ideal 1-pass KV read:', -855, 92, 26, COSMOS.muted, 'sans', 'left').opacity(rd),
        txt('2 B H_kv T d P  bytes', -855, 132, 30, ROLE.key, 'mono', 'left').opacity(rd),
      );
    }
    if (cn > 0.02) {
      nodes.push(
        txt(
          'B, T, d cancel  ·  at P = 2 B:  AI = H_q / H_kv',
          -855,
          310,
          26,
          ROLE.value,
          'mono',
          'left',
        ).opacity(cn),
      );
    }

    // --- RIGHT: Live glowing H100 SXM Log-Log Roofline ---
    nodes.push(
      txt(
        'H100 SXM DECODE ROOFLINE (64 QUERY HEADS, BF16)',
        355,
        -325,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ),
      line([RX0, RY0], [RX1, RY0], { stroke: '#4d608e', width: 2.4 }),
      line([RX0, RY0], [RX0, RY1], { stroke: '#4d608e', width: 2.4 }),
      txt(
        'Operational Intensity (FLOPs / byte)',
        (RX0 + RX1) * 0.5,
        RY0 + 82,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ),
      txt('TFLOP/s', RX0 - 12, RY1 - 36, 26, COSMOS.muted, 'mono', 'right'),
    );

    // Log gridlines & ticks
    for (const v of [1, 8, 64, 295, 1000]) {
      const gx = mapAI(v);
      const isR = v === 295;
      nodes.push(
        line([gx, RY0], [gx, RY1], {
          stroke: isR && rg > 0.5 ? ROLE.gold : '#1c2745',
          width: isR && rg > 0.5 ? 2.2 : 1.2,
          dash: isR ? [7, 6] : undefined,
        }).opacity(isR ? Math.max(0.15, rg) : 0.7),
      );
      if (!isR) {
        nodes.push(txt(String(v), gx, RY0 + 36, 26, COSMOS.dim, 'mono', 'center'));
      }
    }
    for (const v of [10, 100, 989.5]) {
      const gy = mapTF(v);
      nodes.push(
        line([RX0, gy], [RX1, gy], { stroke: '#1c2745', width: 1.2 }),
        txt(
          v === 989.5 ? '989.5' : String(v),
          RX0 - 16,
          gy,
          26,
          v === 989.5 ? ROLE.gold : COSMOS.dim,
          'mono',
          'right',
        ),
      );
    }

    // Glowing roofline curve
    nodes.push(
      glowingTrail(ROOF_PTS, {
        gradientColors: [ROLE.alert, ROLE.key, ROLE.query, ROLE.gold],
        width: 5,
        glow: 11,
      }),
      txt('3.35 TB/s', mapAI(2.5), 32, 26, ROLE.query, 'mono', 'center'),
    );

    // Sparse -> Dense peak & Ridge callout
    if (sp > 0.02) {
      nodes.push(
        txt(
          'Dense peak: 989.5 (½ sparse)',
          RX1 - 12,
          RY1 - 24,
          26,
          ROLE.gold,
          'mono',
          'right',
        ).opacity(sp),
      );
    }
    if (rg > 0.02) {
      nodes.push(
        glowDot(ridgeX, peakY, { radius: 9, color: ROLE.gold, glow: 14, opacity: rg }),
        txt(
          `Ridge ≈ ${H100.ridge.toFixed(1)}`,
          ridgeX + 16,
          RY0 - 34,
          28,
          ROLE.gold,
          'mono',
          'left',
        )
          .glow(6, ROLE.gold)
          .opacity(rg),
      );
    }

    // Operating points on the bandwidth slope: MHA (1), GQA-8 (8), MQA (64 -> 32)
    const pulse = (ph * 0.65) % 1;
    if (pm > 0.02) {
      const mx = mapAI(1);
      const my = mapTF(roofPerf(1));
      nodes.push(
        glowDot(mx, my, { radius: 8.5, color: ROLE.alert, glow: 12, opacity: pm }),
        txt('MHA: 1', mx + 18, my + 24, 28, ROLE.alert, 'mono', 'left').opacity(pm),
      );
    }
    if (pg > 0.02) {
      const gx = mapAI(model.intensity);
      const gy = mapTF(roofPerf(model.intensity));
      nodes.push(
        glowDot(gx, gy, { radius: 8.5, color: ROLE.query, glow: 12, opacity: pg }),
        txt(`GQA-8: ${model.intensity}`, gx + 18, gy + 24, 28, ROLE.query, 'mono', 'left').opacity(
          pg,
        ),
      );
    }
    if (pq > 0.02) {
      const qx = mapAI(curMqa);
      const qy = mapTF(roofPerf(curMqa));
      const col = dr > 0.5 ? ROLE.amber : ROLE.value;
      nodes.push(
        circle(10 + pulse * 16, { fill: null, stroke: col, width: 2.4 })
          .at(qx, qy)
          .opacity((1 - pulse) * 0.8 * pq)
          .set('blend', 'screen'),
        glowDot(qx, qy, { radius: 9, color: col, glow: 13, opacity: pq }),
        txt(
          dr > 0.5 ? `MQA (2 reads): ${Math.round(curMqa)}` : 'MQA: 64',
          qx - 18,
          qy - 36,
          28,
          col,
          'mono',
          'right',
        )
          .glow(6, col)
          .opacity(pq),
      );
    }

    // Bottom takeaway line
    const footText =
      dr > 0.5
        ? '2 KV reads halve AI: 64 → 32 FLOPs/B'
        : rg > 0.5
          ? 'Below 295.4 FLOPs/byte, memory bandwidth sets the ceiling'
          : 'Reusing each cached K/V read climbs the bandwidth roof';
    nodes.push(txt(footText, 0, 444, 28, dr > 0.5 ? ROLE.amber : COSMOS.muted, 'sans', 'center'));

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.query), title, live);
  c.show('cancel', cancelEq, { after: true, fade: 0.45 });
  runPhase(s, c, phase, 14);

  playCue(s, c, 'qk', (d) => s.play(sQk.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'av', (d) => s.play(sAv.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'both', (d) => s.play(sBoth.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'read', (d) => s.play(sRead.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'cancel', (d) => s.play(sCancel.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'mha', (d) => s.play(pMha.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'gqa', (d) => s.play(pGqa.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'mqa', (d) => s.play(pMqa.to(1, { duration: d })), { after: true, dur: 0.45 });
  playCue(s, c, 'ideal', (d) => s.play(pMqa.to(1, { duration: Math.min(0.25, d) })), { dur: 0.3 });
  playCue(s, c, 'sparse', (d) => s.play(showSparse.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'ridge', (d) => s.play(showRidge.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(
    s,
    c,
    'profile',
    (d) => s.play(showDrop.to(1, { duration: 0.25 }), mqaAi.to(32, { duration: d })),
    { after: true, dur: 0.7 },
  );
}
