// Scene 15: norm-contracts: "What does normalization change?"
// View 1 (Beats 0-1): Constant row [2, 2, 2, 2] stays visible as LayerNorm centers it to [0, 0, 0, 0]
//         while RMSNorm scales by sqrt(4 + eps) to [~1.00, ~1.00, ~1.00, ~1.00].
// View 2 (Beat 2): Pre-LN residual highway circuit showing direct identity path x -> x + branch(x)
//         with glowing gradient photon + derivative I + branch derivative vs Post-LN contrast.
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  cinemaAtmosphere,
  fmt,
  normStats,
  playCue,
  sum,
  swapVis,
  vectorRow,
} from '../parts.mjs';

export default function normContracts(s, c) {
  const title = heroTitle(['Normalization contracts:', 'LayerNorm, RMSNorm & Pre-LN'], {
    x: -850,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.attn,
  });

  const inputRow = [2, 2, 2, 2];
  const stats = normStats(inputRow);
  const meanSq = sum(inputRow.map((x) => x * x)) / inputRow.length; // 4
  const rmsDiv = Math.sqrt(meanSq + 1e-5);
  const rmsOut = inputRow.map((x) => x / rmsDiv);

  const vRows = s.value(1);
  const vCircuit = s.value(0);

  const lnStart = s.value(0);
  const lnDone = s.value(0);
  const varShow = s.value(0);
  const rmsStart = s.value(0);
  const rmsDone = s.value(0);

  const photonPos = s.value(0);
  const derivShow = s.value(0);

  const varEq = glowTex('\\operatorname{Var} = \\frac{v}{v + \\epsilon}', {
    x: 520,
    y: -380,
    size: 38,
    color: ROLE.query,
  });

  // VIEW 1: LayerNorm vs RMSNorm on constant [2, 2, 2, 2]
  const rowsLayer = guardedDynamic(vRows, (alpha) => {
    const ls = lnStart.value > 0.3;
    const ld = lnDone.value > 0.4;
    const vs = varShow.value;
    const rs = rmsStart.value > 0.3;
    const rd = rmsDone.value > 0.4;
    const nodes = [
      varEq.opacity(vs * alpha),
      txt(
        'Scale = 1  ·  LayerNorm shift = 0  ·  eps = 1e-5',
        -130,
        -265,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      // Row 1: Input [2, 2, 2, 2]
      vectorRow({
        cx: -100,
        cy: -155,
        values: inputRow,
        cellW: 155,
        cellH: 76,
        gap: 16,
        color: ROLE.stream,
        digits: 0,
        label: 'Input',
        opacity: alpha,
      }),
      txt('mean = 2', 340, -155, 32, ROLE.stream, 'mono', 'left').opacity(alpha),
      // Row 2: LayerNorm -> [0, 0, 0, 0]
      vectorRow({
        cx: -100,
        cy: 15,
        values: ld ? stats.normalized : ['?', '?', '?', '?'],
        cellW: 155,
        cellH: 76,
        gap: 16,
        color: ROLE.attn,
        digits: 0,
        label: 'LayerNorm',
        opacity: (0.35 + 0.65 * lnStart.value) * alpha,
      }),
    ];

    if (ls) {
      nodes.push(
        txt('2 - 2 = 0  (centered)', 340, 15, 30, ROLE.attn, 'mono', 'left')
          .glow(ld ? 7 : 0, ROLE.attn)
          .opacity(alpha),
      );
    }

    // Row 3: RMSNorm -> [~1.00, ~1.00, ~1.00, ~1.00]
    if (rmsStart.value > 0.05) {
      nodes.push(
        vectorRow({
          cx: -100,
          cy: 185,
          values: rd ? rmsOut.map((v) => `~${fmt(v, 2)}`) : ['?', '?', '?', '?'],
          cellW: 155,
          cellH: 76,
          gap: 16,
          color: ROLE.valid,
          digits: 2,
          label: 'RMSNorm',
          opacity: rmsStart.value * alpha,
        }),
        txt('2 / sqrt(4 + eps)', 340, 185, 30, ROLE.valid, 'mono', 'left')
          .glow(rd ? 7 : 0, ROLE.valid)
          .opacity((rs ? 1 : 0.4) * rmsStart.value * alpha),
      );
    }

    nodes.push(
      txt(
        rd
          ? 'Same four twos  ->  LayerNorm zeros them, RMSNorm keeps ~1.00'
          : 'Both operate across the features of this single token',
        0,
        360,
        28,
        rd ? ROLE.query : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(rd ? 6 : 0, ROLE.query)
        .opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Pre-LN direct residual identity path vs Post-LN
  const derivEq = glowTex(
    '\\frac{\\partial y}{\\partial x} = I + \\frac{\\partial F}{\\partial x}',
    {
      x: 470,
      y: -380,
      size: 40,
      color: ROLE.query,
    },
  );

  const circuitLayer = guardedDynamic(vCircuit, (alpha) => {
    const pp = photonPos.value;
    const ds = derivShow.value;
    const xL = -640;
    const xR = 590;
    const spineY = -45;
    const branchY = 185;
    const px = xL + (xR - xL) * pp;

    return [
      derivEq.opacity(ds * alpha),
      txt(
        'Pre-LN: normalization sits inside the update branch',
        0,
        -240,
        30,
        ROLE.attn,
        'mono',
        'center',
      ).opacity(alpha),
      // Unbroken glowing identity spine
      glowingTrail(
        [
          [xL, spineY],
          [xR, spineY],
        ],
        { gradientColors: [ROLE.stream, ROLE.valid], width: 7, glow: 14, opacity: alpha },
      ),
      glowDot(px, spineY, { radius: 12, color: ROLE.query, glow: 16, opacity: alpha }),
      txt('x', xL - 44, spineY, 36, ROLE.stream, 'mono', 'right').opacity(alpha),
      txt('x + branch(x)', xR + 36, spineY, 34, ROLE.valid, 'mono', 'left')
        .glow(7, ROLE.valid)
        .opacity(alpha),
      txt(
        'Unbroken direct identity highway',
        -25,
        spineY - 48,
        28,
        ROLE.stream,
        'mono',
        'center',
      ).opacity(alpha),
      // Lower normalized update branch
      glowingTrail(
        [
          [xL + 90, spineY + 12],
          [xL + 90, branchY],
          [xR - 90, branchY],
          [xR - 90, spineY + 20],
        ],
        { color: ROLE.attn, width: 4, glow: 9, core: false, opacity: alpha },
      ),
      arrow([xR - 90, branchY - 120], [xR - 90, spineY + 18], {
        stroke: ROLE.attn,
        width: 4,
        tip: 15,
      }).opacity(alpha),
      txt(
        'Norm(x)  ->  Attention or FFN sublayer',
        -25,
        branchY + 46,
        30,
        ROLE.attn,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        ds > 0.35
          ? 'Identity derivative I flows straight back  (branch gradients can still reinforce or cancel)'
          : 'Trace both routes into the residual sum',
        0,
        310,
        28,
        ds > 0.35 ? ROLE.query : COSMOS.muted,
        'sans',
        'center',
      )
        .glow(ds > 0.35 ? 6 : 0, ROLE.query)
        .opacity(alpha),
      txt(
        'Contrast Post-LN (original 2017 Transformer):  LayerNorm(x + sublayer(x))',
        0,
        390,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    ];
  });

  s.add(cinemaAtmosphere(ROLE.attn, ROLE.valid), title, rowsLayer, circuitLayer);

  // Beat 0: LayerNorm on [2, 2, 2, 2]
  playCue(s, c, 'tr-norm-contracts-voice-0', (d) => s.play(lnStart.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'tr-norm-contracts-centered', (d) => s.play(lnDone.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'tr-norm-contracts-variance', (d) => s.play(varShow.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 1: RMSNorm on [2, 2, 2, 2]
  playCue(s, c, 'tr-norm-contracts-voice-1', (d) => s.play(rmsStart.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'tr-norm-contracts-constant', (d) => s.play(rmsDone.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 2: Pre-LN residual circuit
  playCue(
    s,
    c,
    'tr-norm-contracts-voice-2',
    (d) => s.play(swapVis(vRows, vCircuit, Math.min(0.65, d * 0.35))),
    { dur: 0.7 },
  );
  const v2Start = c.cue('tr-norm-contracts-voice-2').start;
  const glideDur = Math.max(0.8, c.end - v2Start - 0.8);
  c.on('tr-norm-contracts-voice-2', () => {
    s.play(photonPos.to(1, { duration: glideDur }));
  });
  playCue(s, c, 'tr-norm-contracts-residual', (d) => s.play(derivShow.to(1, { duration: d })), {
    dur: 0.65,
  });
}
