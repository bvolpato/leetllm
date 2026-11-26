// Scene 15: stable: "When the numbers overflow"
// Huge logits [1000, 1001, 999] blow up exp(1000) -> Inf -> Inf/Inf = NaN,
// then max-subtraction (-1001) slides the whole row down to [-1, 0, -2] -> exact shares [24%, 67%, 9%],
// followed by FP16 pre-softmax matmul overflow (300×300 = 90,000 > 65,504 -> Inf; casting later cannot rescue it).
import { arrow } from 'vizmatic/stage';
import { COSMOS, glowTex, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  FP16_MAX,
  ROLE,
  STABLE_SHARES,
  cinemaAtmosphere,
  fmt,
  lumBar,
  pct,
  playCue,
  shareRibbon,
  swapVis,
} from '../parts.mjs';

export default function stable(s, c) {
  const title = heroTitle(['Numerical stability:', 'rescue from overflow'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.mask,
  });

  // Two views: 1) Softmax max-subtraction rescue, 2) FP16 matmul overflow (cannot be cast away)
  const vMax = s.value(1);
  const vFp16 = s.value(0);

  // View 1 state
  const overflowPhase = s.value(0); // 0 = raw, 1 = Inf, 2 = NaN
  const shiftT = s.value(0); // 0 = [1000, 1001, 999], 1 = [-1, 0, -2]
  const showShares = s.value(0);
  const showPeak = s.value(0);

  // View 2 state
  const fpStep = s.value(0); // 0..4 progressive FP16 overflow -> broken cast -> FP32 recompute

  const cancelEq = glowTex(
    '\\frac{e^{z_j - m}}{\\sum_k e^{z_k - m}} = \\frac{e^{-m}\\,e^{z_j}}{e^{-m}\\sum_k e^{z_k}}',
    {
      x: 340,
      y: -365,
      size: 38,
      color: ROLE.value,
    },
  );

  // VIEW 1: Overflow -> Max-Subtraction Rescue
  const maxLayer = guardedDynamic(vMax, (alpha) => {
    const sh = shiftT.value;
    const ov = overflowPhase.value;
    const ss = showShares.value;
    const pk = showPeak.value;
    const nodes = [];

    const raw = [1000, 1001, 999];
    const shifted = [-1, 0, -2];
    const cur = raw.map((r, i) => r + (shifted[i] - r) * sh);
    const cols = [ROLE.birds, ROLE.query, ROLE.sing];
    const xs = [-520, -240, 40];

    nodes.push(
      txt(
        sh > 0.5 ? 'Shifted logits  z − max(z)  (m = 1001)' : 'Raw logits  z',
        -240,
        -220,
        30,
        sh > 0.5 ? ROLE.value : ROLE.mask,
        'mono',
        'center',
      ).opacity(alpha),
    );

    xs.forEach((x, i) => {
      const valStr = sh < 0.05 ? String(raw[i]) : sh > 0.95 ? String(shifted[i]) : fmt(cur[i], 0);
      const safe = sh > 0.7;
      const expStr = safe ? fmt(Math.exp(shifted[i]), 2) : ov >= 0.8 ? 'Inf' : `e^${raw[i]}`;
      const expCol = safe ? (i === 1 && pk > 0.5 ? ROLE.query : ROLE.value) : ROLE.mask;

      nodes.push(
        lumBar(x, -125, 210, 88, {
          color: cols[i],
          fillOpacity: 0.24,
          strokeWidth: 2.4,
          glow: 8,
          opacity: alpha,
        }),
        txt(valStr, x, -125, 36, cols[i], 'mono', 'center').opacity(alpha),
        arrow([x, -76], [x, -26], { stroke: expCol, width: 3, tip: 12 }).opacity(alpha),
        lumBar(x, 28, 210, 88, {
          color: expCol,
          fillOpacity: safe ? 0.24 : 0.3,
          strokeWidth: 2.5,
          glow: 9,
          opacity: alpha,
        }),
        txt(expStr, x, 28, 34, expCol, 'mono', 'center').opacity(alpha),
      );
    });

    // Right panel: Inf/Inf = NaN vs exact safe shares
    const rx = 560;
    if (sh < 0.5) {
      const badCol = ROLE.mask;
      nodes.push(
        lumBar(rx, -45, 480, 210, {
          color: badCol,
          fillOpacity: 0.22,
          strokeWidth: 2.8,
          glow: 11,
          opacity: Math.max(0.35, ov * 0.5) * alpha,
        }),
        txt('e¹⁰⁰⁰  >  float64 max', rx, -100, 30, badCol, 'mono', 'center').opacity(alpha),
        txt('overflows to +Inf', rx, -42, 32, badCol, 'mono', 'center').opacity(
          (ov >= 0.8 ? 1 : 0.3) * alpha,
        ),
        txt('Inf / Inf  =  NaN', rx, 22, 38, badCol, 'mono', 'center')
          .glow(10, badCol)
          .opacity((ov >= 1.6 ? 1 : 0.2) * alpha),
      );
    } else {
      nodes.push(
        lumBar(rx, -45, 480, 210, {
          color: ROLE.value,
          fillOpacity: 0.22,
          strokeWidth: 2.8,
          glow: 10,
          opacity: alpha,
        }),
        txt('Largest term: e⁰ = 1.00', rx, -95, 30, ROLE.query, 'mono', 'center')
          .glow(pk > 0.5 ? 8 : 0, ROLE.query)
          .opacity(alpha),
        txt('All terms in (0, 1]', rx, -35, 30, ROLE.value, 'mono', 'center').opacity(alpha),
        txt('Zero overflow  ·  exact shares', rx, 25, 28, COSMOS.ink, 'sans', 'center').opacity(
          alpha,
        ),
      );
    }

    // Bottom conserved share ribbon (24% / 67% / 9%)
    if (ss > 0.05) {
      nodes.push(
        shareRibbon({
          x: 0,
          y: 265,
          width: 1080,
          height: 68,
          shares: STABLE_SHARES,
          colors: [ROLE.birds, ROLE.query, ROLE.sing],
          labels: ['z=1000', 'z=1001', 'z=999'],
          opacity: ss * alpha,
        }),
        txt(
          `Shares unchanged: ${STABLE_SHARES.map(pct).join('  ·  ')}`,
          0,
          365,
          30,
          ROLE.value,
          'mono',
          'center',
        )
          .glow(6, ROLE.value)
          .opacity(ss * alpha),
      );
    }

    return nodes;
  });

  // VIEW 2: Pre-Softmax FP16 MatMul Overflow (300 × 300 > 65,504 -> Inf)
  const fpLayer = guardedDynamic(vFp16, (alpha) => {
    const fs = fpStep.value;
    const nodes = [];

    nodes.push(
      txt(
        `FP16 max finite value = ${FP16_MAX.toLocaleString('en-US')}   (2 bytes / number)`,
        0,
        -255,
        34,
        ROLE.amber,
        'mono',
        'center',
      )
        .glow(6, ROLE.amber)
        .opacity(alpha),
    );

    // Top broken lane: FP16 multiply -> Inf -> cast to FP32 still Inf!
    const topY = -65;
    nodes.push(
      lumBar(-540, topY, 340, 110, {
        color: ROLE.sing,
        fillOpacity: 0.2,
        strokeWidth: 2.2,
        glow: 6,
        opacity: alpha,
      }),
      txt('FP16 inputs', -540, topY - 22, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),
      txt('300 × 300', -540, topY + 22, 34, ROLE.sing, 'mono', 'center').opacity(alpha),
      arrow([-360, topY], [-240, topY], { stroke: ROLE.mask, width: 3.5, tip: 14 }).opacity(alpha),

      lumBar(-40, topY, 370, 110, {
        color: ROLE.mask,
        fillOpacity: 0.28,
        strokeWidth: 2.8,
        glow: 10,
        opacity: (fs >= 1 ? 1 : 0.35) * alpha,
      }),
      txt('FP16 MatMul', -40, topY - 22, 26, COSMOS.muted, 'sans', 'center').opacity(
        (fs >= 1 ? 1 : 0.35) * alpha,
      ),
      txt('90,000 → +Inf !', -40, topY + 22, 34, ROLE.mask, 'mono', 'center')
        .glow(8, ROLE.mask)
        .opacity((fs >= 1 ? 1 : 0.35) * alpha),
      arrow([155, topY], [275, topY], { stroke: ROLE.mask, width: 3.5, tip: 14 }).opacity(
        (fs >= 2 ? 1 : 0.3) * alpha,
      ),

      lumBar(510, topY, 430, 110, {
        color: ROLE.mask,
        fillOpacity: 0.24,
        strokeWidth: 2.6,
        glow: 9,
        opacity: (fs >= 2 ? 1 : 0.3) * alpha,
      }),
      txt('Cast to FP32 afterward', 510, topY - 22, 26, COSMOS.muted, 'sans', 'center').opacity(
        (fs >= 2 ? 1 : 0.3) * alpha,
      ),
      txt('Still +Inf (too late!)', 510, topY + 22, 32, ROLE.mask, 'mono', 'center').opacity(
        (fs >= 2 ? 1 : 0.3) * alpha,
      ),
    );

    // Bottom repaired lane: Accumulate / recompute product in FP32
    const botY = 185;
    const fixOp = (fs >= 3 ? 1 : 0.25) * alpha;
    nodes.push(
      lumBar(-335, botY, 660, 118, {
        color: ROLE.value,
        fillOpacity: 0.24,
        strokeWidth: 2.8,
        glow: 10,
        opacity: fixOp,
      }),
      txt(
        'Fix: accumulate MatMul in FP32',
        -335,
        botY - 22,
        28,
        ROLE.value,
        'sans',
        'center',
      ).opacity(fixOp),
      txt(
        '300.0 × 300.0 = 90,000.0 (exact)',
        -335,
        botY + 24,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(fixOp),
      arrow([8, botY], [108, botY], { stroke: ROLE.value, width: 3.5, tip: 14 }).opacity(fixOp),
      lumBar(430, botY, 600, 118, {
        color: ROLE.value,
        fillOpacity: 0.24,
        strokeWidth: 2.8,
        glow: 10,
        opacity: fixOp,
      }),
      txt('Then max-subtract + softmax', 430, botY - 22, 28, ROLE.value, 'sans', 'center').opacity(
        fixOp,
      ),
      txt('Finite logits → valid shares', 430, botY + 24, 30, ROLE.value, 'mono', 'center')
        .glow(6, ROLE.value)
        .opacity(fixOp),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.mask, ROLE.value), title, maxLayer, fpLayer);

  // Beat 0: e^1000 overflows -> Inf -> Inf/Inf = NaN
  playCue(s, c, 'too-big', (d) => s.play(overflowPhase.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'infinity', (d) => s.play(overflowPhase.to(1.2, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'nan', (d) => s.play(overflowPhase.to(2.0, { duration: d })), { dur: 0.45 });

  // Beat 1: Subtract max -> [-1, 0, -2], factor cancels, shares [24%, 67%, 9%], peak e^0 = 1
  c.show('gaps', cancelEq);
  playCue(s, c, 'becomes', (d) => s.play(shiftT.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'cancels', (d) => s.play(shiftT.to(1, { duration: d })), { dur: 0.3 });
  playCue(s, c, 'stable-shares', (d) => s.play(showShares.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'largest-term', (d) => s.play(showPeak.to(1, { duration: d })), { dur: 0.45 });

  // Beat 2: FP16 pre-softmax overflow -> cast too late -> recompute in FP32
  c.hide('broken', cancelEq);
  playCue(s, c, 'broken', (d) => s.play(swapVis(vMax, vFp16, d)), { dur: 0.65 });
  playCue(s, c, 'fp16', (d) => s.play(fpStep.to(0.4, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'largest', (d) => s.play(fpStep.to(0.8, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'product', (d) => s.play(fpStep.to(1.1, { duration: d })), { dur: 0.35 });
  playCue(s, c, 'overflows', (d) => s.play(fpStep.to(1.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'cast', (d) => s.play(fpStep.to(2.4, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'recompute', (d) => s.play(fpStep.to(3.5, { duration: d })), { dur: 0.55 });
}
