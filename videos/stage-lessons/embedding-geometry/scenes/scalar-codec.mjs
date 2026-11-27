// Scene 09: scalar-codec: "A byte code needs a reconstruction rule"
// View 1: Glowing 6-stage signed INT8 signal-flow rail (0.424 -> /0.01 -> 42.4 -> 42 -> clip -> byte -> 0.42)
//         with traveling gold photon & MathJax reconstruction formula.
// View 2: Dual aligned unsigned uint8 number lines ([2, 3] <-> [0..255]), solving off-scale zero (-510),
//         widening to [0, 3] (3x step), and glowing affine dot-product expansion.
import { arrow, dynamic, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  rule,
  scalarEncode,
  swapVis,
  txt,
} from '../parts.mjs';

export default function scalarCodec(s, c) {
  const xVal = 0.424;
  const bound = 1.27;
  const scale = bound / 127; // 0.01
  const count = xVal / scale; // 42.4
  const code = scalarEncode(xVal, bound); // 42
  const decoded = code * scale; // 0.42

  const vSigned = s.value(1);
  const vRange = s.value(0);

  // View 1 progress
  const stepShown = s.value(0);
  const stageIdx = s.value(0); // 0..5
  const showDiv = s.value(0);
  const showRnd = s.value(0);
  const showClip = s.value(0);
  const showByte = s.value(0);
  const showDec = s.value(0);
  const frozen = s.value(0);

  // View 2 progress
  const rulerPos = s.value(0); // 0 => (x=2, code=0), 1 => (x=3, code=255)
  const showMaps = s.value(0);
  const showOffset = s.value(0);
  const showLocate = s.value(0);
  const showInvalid = s.value(0);
  const showWiden = s.value(0);
  const showDot = s.value(0);

  const title = heroTitle(['A byte code needs', 'a reconstruction rule'], {
    x: -855,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.code,
    eyebrow: 'SCALAR QUANTIZATION CODEC',
  });

  // View 1: Signed INT8 6-stage signal-flow rail
  const stages = [
    { x: -740, label: 'x', val: '0.424', col: COSMOS.ink, vis: () => 1 },
    {
      x: -444,
      label: 'x / scale',
      val: count.toFixed(1),
      col: ROLE.code,
      vis: () => showDiv.value,
    },
    {
      x: -148,
      label: 'round',
      val: String(Math.round(count)),
      col: ROLE.code,
      vis: () => showRnd.value,
    },
    { x: 148, label: 'clip', val: String(code), col: ROLE.A, vis: () => showClip.value },
    { x: 444, label: 'int8 byte', val: String(code), col: ROLE.query, vis: () => showByte.value },
    { x: 740, label: 'decode', val: decoded.toFixed(2), col: ROLE.gold, vis: () => showDec.value },
  ];

  const signedFormula = glowTex('\\hat{x} = s \\cdot c, \\qquad s = \\frac{\\max|x|}{127}', {
    x: -380,
    y: 165,
    size: 40,
    color: ROLE.gold,
    glow: 7,
  });

  const signedLayer = guardedDynamic(vSigned, (alpha) => {
    const railY = -120;
    const idx = Math.max(0, Math.min(5, stageIdx.value));
    const i0 = Math.floor(idx);
    const i1 = Math.min(5, i0 + 1);
    const frac = idx - i0;
    const photonX = stages[i0].x + (stages[i1].x - stages[i0].x) * frac;

    const nodes = [];

    // Connecting glowing arrows between stages
    for (let i = 0; i < stages.length - 1; i++) {
      nodes.push(
        arrow([stages[i].x + 92, railY], [stages[i + 1].x - 92, railY], {
          stroke: '#4b6192',
          width: 3,
          tip: 12,
        }).opacity(alpha),
      );
    }

    // Stage cells + floating captions + values
    stages.forEach((st, i) => {
      const vOp = st.vis() * alpha;
      const active = Math.abs(idx - i) < 0.6;
      nodes.push(
        txt(st.label, st.x, railY - 78, 28, active ? ROLE.gold : COSMOS.muted, 'mono').opacity(
          alpha,
        ),
        lumBar(st.x, railY, 170, 82, {
          color: i === 4 ? ROLE.query : active ? ROLE.gold : '#3c507c',
          fillAlpha: active ? 0.24 : 0.14,
          strokeWidth: active ? 2.8 : 1.8,
          glow: active ? 9 : 3,
          opacity: alpha,
        }),
      );
      if (vOp > 0.02) {
        nodes.push(
          txt(st.val, st.x, railY, 38, st.col, 'mono')
            .glow(active ? 7 : 0, st.col)
            .opacity(vOp),
        );
      }
    });

    // Traveling gold photon along rail top
    nodes.push(
      glowDot(photonX, railY - 42, { radius: 8, color: ROLE.gold, glow: 12, opacity: alpha }),
    );

    // Lower section: calibration parameters (floating, zero boxy table!)
    nodes.push(
      rule(-850, 35, 850, 35, COSMOS.rule, 1.8).opacity(0.6 * alpha),
      txt('CALIBRATION CONTRACT', 145, 95, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      txt(
        stepShown.value > 0.5 ? `scale = 1.27 / 127 = ${scale.toFixed(2)}` : 'scale = bound / 127',
        145,
        158,
        32,
        frozen.value > 0.5 ? ROLE.gold : ROLE.code,
        'mono',
        'left',
      )
        .glow(frozen.value > 0.5 ? 8 : 0, ROLE.gold)
        .opacity(alpha),
      txt(
        'byte domain: -127 … +127  (255 levels)',
        145,
        218,
        28,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
      txt(
        frozen.value > 0.5
          ? 'Frozen per dimension for every stored row & query'
          : 'Fit one scale per dimension from calibration sample',
        145,
        276,
        26,
        frozen.value > 0.5 ? ROLE.A : COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  // View 2: Unsigned uint8 range-offset codec [2, 3] -> [0, 3]
  const dotFormula = glowTex('q \\cdot (a + s\\,c) = q\\,a + q\\,s\\,c', {
    x: 0,
    y: -245,
    size: 46,
    color: ROLE.gold,
    glow: 8,
  });

  const rangeLayer = guardedDynamic(vRange, (alpha) => {
    const rp = rulerPos.value;
    const wid = showWiden.value;
    const inv = showInvalid.value;
    const loc = showLocate.value;
    const dotOn = showDot.value;

    const rL = -520;
    const rR = 680;
    const realY = -30;
    const codeY = 145;
    const realX = rL + rp * (rR - rL);
    const codeVal = Math.round(rp * 255);
    const realVal = (2 + rp).toFixed(2);

    const nodes = [];

    // Top equation area (strict zero-overlap fade before dotFormula appears)
    const preDotOp = Math.max(0, 1 - dotOn * 4);
    if (preDotOp > 0.02) {
      if (loc < 0.5) {
        nodes.push(
          txt('UNSIGNED BYTE OVER [2, 3]', -855, -270, 28, ROLE.code, 'mono', 'left').opacity(
            preDotOp * alpha,
          ),
          txt(
            'step = (3 − 2) / 255  ·  domain 0 … 255',
            -855,
            -218,
            30,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(preDotOp * alpha),
        );
      } else if (inv < 0.5) {
        nodes.push(
          txt('2 + code / 255 = 0   →   where is real 0?', 0, -245, 42, ROLE.gold, 'mono')
            .glow(8, ROLE.gold)
            .opacity(preDotOp * alpha),
        );
      } else {
        nodes.push(
          txt('2 + (-510) / 255 = 0   →   -510 is outside uint8!', 0, -245, 40, ROLE.danger, 'mono')
            .glow(8, ROLE.danger)
            .opacity(preDotOp * alpha),
        );
      }
    }

    // Real x ruler
    const realLblX = rp > 0.8 ? realX - 24 : realX + 24;
    const realLblAnchor = rp > 0.8 ? 'right' : 'left';
    nodes.push(
      txt('REAL x', -845, realY, 30, ROLE.A, 'mono', 'left').opacity(alpha),
      line([rL, realY], [rR, realY], { stroke: ROLE.A, width: 4 }).glow(5, ROLE.A).opacity(alpha),
      line([rL, realY - 14], [rL, realY + 14], { stroke: ROLE.A, width: 3.5 }).opacity(alpha),
      line([rR, realY - 14], [rR, realY + 14], { stroke: ROLE.A, width: 3.5 }).opacity(alpha),
      txt(wid > 0.5 ? '0' : '2', rL - 22, realY + 42, 30, ROLE.A, 'mono', 'right').opacity(alpha),
      txt('3', rR + 22, realY + 42, 30, ROLE.A, 'mono', 'left').opacity(alpha),
      glowDot(realX, realY, { radius: 10, color: ROLE.A, glow: 12, opacity: alpha }),
      txt(
        wid > 0.5 ? '0..3' : realVal,
        realLblX,
        realY - 42,
        30,
        ROLE.A,
        'mono',
        realLblAnchor,
      ).opacity(alpha),
    );

    // Off-scale arrow pointing far left when locating zero (-510)
    if (inv > 0.02 && wid < 0.5) {
      nodes.push(
        arrow([rL - 25, realY], [rL - 165, realY], { stroke: ROLE.danger, width: 4, tip: 14 })
          .glow(8, ROLE.danger)
          .opacity(inv * alpha),
        txt('code -510', rL - 95, realY - 46, 26, ROLE.danger, 'mono').opacity(inv * alpha),
      );
    }

    // Unsigned byte ruler
    nodes.push(
      txt('uint8 CODE', -845, codeY, 30, ROLE.query, 'mono', 'left').opacity(alpha),
      line([rL, codeY], [rR, codeY], { stroke: ROLE.query, width: 4 })
        .glow(5, ROLE.query)
        .opacity(alpha),
      line([rL, codeY - 14], [rL, codeY + 14], { stroke: ROLE.query, width: 3.5 }).opacity(alpha),
      line([rR, codeY - 14], [rR, codeY + 14], { stroke: ROLE.query, width: 3.5 }).opacity(alpha),
      txt('0', rL - 22, codeY + 42, 30, ROLE.query, 'mono', 'right').opacity(alpha),
      txt('255', rR + 22, codeY + 42, 30, ROLE.query, 'mono', 'left').opacity(alpha),
      glowDot(realX, codeY, { radius: 10, color: ROLE.query, glow: 12, opacity: alpha }),
      txt(String(codeVal), realLblX, codeY - 42, 30, ROLE.query, 'mono', realLblAnchor).opacity(
        alpha,
      ),
      // Vertical alignment tether between real x and uint8 code
      line([realX, realY + 16], [realX, codeY - 16], {
        stroke: ROLE.gold,
        width: 2.5,
        dash: [6, 6],
      }).opacity(0.75 * alpha),
    );

    // Bottom status bar (sequentially updated, zero overlap)
    if (wid > 0.5) {
      nodes.push(
        txt(
          '[2, 3] step = 1/255   →   [0, 3] step = 3/255  (3× wider)',
          0,
          295,
          34,
          ROLE.gold,
          'mono',
        )
          .glow(7, ROLE.gold)
          .opacity(alpha),
      );
    } else if (showOffset.value > 0.5) {
      nodes.push(
        txt('Real offset a = 2   ·   0 → 2,   255 → 3', 0, 295, 34, ROLE.gold, 'mono')
          .glow(6, ROLE.gold)
          .opacity(alpha),
      );
    } else if (showMaps.value > 0.5) {
      nodes.push(
        txt('code 0 → 2.00     ·     code 255 → 3.00', 0, 295, 34, ROLE.code, 'mono').opacity(
          alpha,
        ),
      );
    }

    if (dotOn > 0.5) {
      nodes.push(
        txt(
          'Shared offset adds the same constant to every row; include it for thresholds or reporting',
          0,
          368,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(alpha),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.code, ROLE.gold), title, signedFormula, signedLayer, rangeLayer);

  // Beat 0 & 1: Signed INT8 codec cues
  playCue(s, c, 'step', (d) => s.play(stepShown.to(1, { duration: d })), { after: true, dur: 0.4 });
  playCue(s, c, 'divide', (d) => s.play(stageIdx.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'divide', (d) => s.play(showDiv.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'round', (d) => s.play(stageIdx.to(2, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'round', (d) => s.play(showRnd.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'clip', (d) => s.play(stageIdx.to(3, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'clip', (d) => s.play(showClip.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'byte', (d) => s.play(stageIdx.to(4, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'byte', (d) => s.play(showByte.to(1, { duration: d })), { after: true, dur: 0.35 });
  playCue(s, c, 'decode', (d) => s.play(stageIdx.to(5, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'decode', (d) => s.play(showDec.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(s, c, 'freeze', (d) => s.play(frozen.to(1, { duration: d })), { dur: 0.5 });

  // Beat 2-4: Switch cleanly to unsigned range-offset codec
  c.hide('range-codec', signedFormula);
  playCue(s, c, 'range-codec', (d) => s.play(swapVis(vSigned, vRange, d)), { dur: 0.65 });
  playCue(s, c, 'zero', (d) => s.play(rulerPos.to(0, { duration: d })), { after: true, dur: 0.3 });
  playCue(
    s,
    c,
    'range',
    (d) => s.play(rulerPos.to(1, { duration: d }), showMaps.to(1, { duration: d })),
    {
      after: true,
      dur: 1.0,
    },
  );
  playCue(
    s,
    c,
    'offset',
    (d) => s.play(rulerPos.to(0, { duration: d }), showOffset.to(1, { duration: d })),
    {
      after: true,
      dur: 0.7,
    },
  );
  playCue(s, c, 'locate-zero', (d) => s.play(showLocate.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'invalid', (d) => s.play(showInvalid.to(1, { duration: d })), {
    after: true,
    dur: 0.45,
  });
  playCue(s, c, 'widen-range', (d) => s.play(showWiden.to(1, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'dot', (d) => s.play(showDot.to(1, { duration: d })), { dur: 0.35 });
  c.show('dot', dotFormula, { after: true });
}
