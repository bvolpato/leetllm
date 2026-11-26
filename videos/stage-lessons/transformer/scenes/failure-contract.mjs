// Scene 22: failure-contract: "Where did the forward pass go wrong?"
// View 1 (Beat 0): Repair a 6-feature FFN hidden vector back to 4 features before adding to residual Y.
// View 2 (Beat 1): Valid shape, wrong readable history: repair cached query mask at absolute pos 3.
// View 3 (Beats 2-3): Two full blocks with identical causal masks & dropout off:
//         Left normalizes across 4 features (row), Right normalizes across 3 positions (column).
//         Strictly WITHHOLDS +4 edit & "function" output deltas until Beat 3 change-last-feature / compare-rows!
import { COSMOS, guardedDynamic, heroTitle, txt } from '../../cinematic-kit.mjs';
import {
  AXIS_BASELINES,
  MODEL,
  ROLE,
  WORDS,
  cinemaAtmosphere,
  fmt,
  glowMatrix,
  normalizationAxisCase,
  playCue,
  swapVis,
  vectorRow,
} from '../parts.mjs';

export default function failureContract(s, c) {
  const title = heroTitle(['Debugging the forward pass:', 'three failure modes'], {
    x: -850,
    y: -430,
    size: 46,
    lineHeight: 54,
    accent: ROLE.mask,
  });

  const vProj = s.value(1);
  const vMask = s.value(0);
  const vAxis = s.value(0);

  const projFix = s.value(0);
  const maskFix = s.value(0);
  const editDelta = s.value(0); // 0 -> 4 on change-last-feature (Beat 3!)
  const compareReveal = s.value(0); // STRICTLY AFTER compare-rows!

  // VIEW 1: 6-feature FFN hidden vs 4-feature residual mismatch -> project 6 -> 4
  const projLayer = guardedDynamic(vProj, (alpha) => {
    const fixed = projFix.value > 0.45;
    const col = fixed ? ROLE.valid : ROLE.mask;
    return [
      txt(
        'Residual stream has 4 features per token (3 x 4 = 12 entries)',
        0,
        -245,
        30,
        ROLE.stream,
        'mono',
        'center',
      ).opacity(alpha),
      vectorRow({
        cx: 45,
        cy: -120,
        values: MODEL.Y[2],
        cellW: 210,
        cellH: 82,
        gap: 20,
        color: ROLE.stream,
        digits: 3,
        label: 'residual Y (4)',
        opacity: alpha,
      }),
      vectorRow({
        cx: 45,
        cy: 85,
        values: fixed ? MODEL.F[2] : MODEL.H[2],
        cellW: fixed ? 210 : 148,
        cellH: 82,
        gap: fixed ? 20 : 14,
        color: col,
        digits: 3,
        label: fixed ? 'projected F (4)' : 'FFN hidden H (6)',
        opacity: alpha,
      }),
      txt(
        fixed
          ? 'Project 6 -> 4 with W_down, then add coordinate-by-coordinate!'
          : 'Mismatch: 18 hidden entries cannot be added to 12 residual entries (reshape fails)',
        0,
        265,
        30,
        col,
        'mono',
        'center',
      )
        .glow(8, col)
        .opacity(alpha),
      txt(
        'Also verify head split divisibility and that scores & masks share the same device',
        0,
        365,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
  });

  // VIEW 2: Valid shape, wrong readable history (cached query at pos 3)
  const maskLayer = guardedDynamic(vMask, (alpha) => {
    const fixed = maskFix.value > 0.45;
    const col = fixed ? ROLE.valid : ROLE.mask;
    return [
      txt(
        'A wrong read can pass every shape check',
        0,
        -245,
        32,
        ROLE.query,
        'mono',
        'center',
      ).opacity(alpha),
      vectorRow({
        cx: 60,
        cy: -100,
        values: ['K0', 'K1', 'K2', 'K3'],
        cellW: 220,
        cellH: 80,
        gap: 20,
        color: ROLE.stream,
        fontSize: 32,
        label: 'query pos 3',
        opacity: alpha,
      }),
      vectorRow({
        cx: 60,
        cy: 75,
        values: fixed ? ['allow', 'allow', 'allow', 'allow'] : ['allow', 'deny', 'deny', 'deny'],
        cellW: 220,
        cellH: 80,
        gap: 20,
        color: col,
        fontSize: 30,
        label: 'mask row',
        opacity: alpha,
      }),
      txt(
        fixed
          ? 'Repaired: absolute position-3 mask admits all 4 cached keys'
          : 'Bug: upper-left row 0 returned only V[0] despite valid tensor shapes',
        0,
        255,
        30,
        col,
        'mono',
        'center',
      )
        .glow(8, col)
        .opacity(alpha),
      txt(
        'NaN weights -> check all-masked rows  ·  dead temperature -> apply before softmax',
        0,
        360,
        26,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    ];
  });

  // VIEW 3: Feature-axis vs Position-axis normalization leakage
  const axisLayer = guardedDynamic(vAxis, (alpha) => {
    const ch = editDelta.value;
    const rev = compareReveal.value > 0.4;
    const nodes = [
      txt(
        'Identical causal masks (zero future attention)  ·  dropout off  ·  only Norm axis differs',
        0,
        -295,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
    ];

    AXIS_BASELINES.forEach((baseline, idx) => {
      const acrossPos = idx === 1;
      const run = normalizationAxisCase(ch, acrossPos);
      const cx = acrossPos ? 450 : -410;
      const col = acrossPos ? ROLE.mask : ROLE.stream;
      const delta = Math.max(...run.model.Z[0].map((v, j) => Math.abs(v - baseline.model.Z[0][j])));

      const cellCols = run.input.map((r, ri) =>
        r.map((_, ki) => {
          const inGroup = acrossPos ? ki === 0 : ri === 0;
          return inGroup ? col : ROLE.rule;
        }),
      );

      nodes.push(
        txt(
          acrossPos ? 'Norm across 3 positions (column)' : 'Norm across 4 features (row)',
          cx,
          -225,
          30,
          col,
          'serif',
          'center',
        )
          .glow(6, col)
          .opacity(alpha),
        glowMatrix({
          cx,
          cy: -25,
          rows: 3,
          cols: 4,
          cellW: 122,
          cellH: 72,
          gap: 10,
          values: run.input.map((r) => r.map((v) => fmt(v, 2))),
          rowLabels: WORDS,
          highlight: (r, k) => (acrossPos ? k === 0 : r === 0),
          colors: cellCols,
          fontSize: 26,
          bracketColor: col,
          opacity: alpha,
        }),
        txt(`highlighted mean = ${fmt(run.mean, 3)}`, cx, 165, 28, col, 'mono', 'center').opacity(
          alpha,
        ),
        txt(
          'Max change in "function" output:',
          cx,
          240,
          26,
          COSMOS.muted,
          'sans',
          'center',
        ).opacity(alpha),
        txt(
          rev ? fmt(delta, 3) : '?',
          cx,
          308,
          44,
          rev ? (delta > 1e-9 ? ROLE.mask : ROLE.valid) : ROLE.query,
          'mono',
          'center',
        )
          .glow(rev ? 9 : 4, rev ? (delta > 1e-9 ? ROLE.mask : ROLE.valid) : ROLE.query)
          .opacity(alpha),
      );
    });

    nodes.push(
      txt(
        rev
          ? 'Right block leaked "the" into "function" through column normalization BEFORE attention!'
          : ch < 0.1
            ? 'Edit "the" coord 1 by +4: which block can change "function"\'s output?'
            : 'Perturbing "the" coord 1 (+4)...',
        0,
        405,
        28,
        rev ? ROLE.mask : ROLE.query,
        'sans',
        'center',
      )
        .glow(6, rev ? ROLE.mask : ROLE.query)
        .opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.mask, ROLE.stream), title, projLayer, maskLayer, axisLayer);

  // Beat 0: shape repair 6 -> 4
  playCue(s, c, 'tr-failure-contract-voice-0', (d) => s.play(projFix.to(0.05, { duration: d })), {
    dur: 0.35,
  });
  playCue(s, c, 'tr-failure-contract-project', (d) => s.play(projFix.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 1: mask repair
  playCue(
    s,
    c,
    'tr-failure-contract-voice-1',
    (d) => s.play(swapVis(vProj, vMask, Math.min(0.65, d * 0.45))),
    { dur: 0.7, offset: -0.65 },
  );
  playCue(s, c, 'tr-failure-contract-mask', (d) => s.play(maskFix.to(1, { duration: d })), {
    dur: 0.65,
  });

  // Beat 2 (no cues! swap cleanly right after beat-1-end; withhold edit & delta!)
  const b2Swap = c.cue('change-last-feature').start - 35.5;
  c.at(Math.max(0.2, b2Swap - c.start), () => {
    s.play(swapVis(vMask, vAxis, 0.65));
  });

  // Beat 3: apply +4 perturbation at change-last-feature, reveal deltas AFTER compare-rows!
  playCue(s, c, 'change-last-feature', (d) => s.play(editDelta.to(4, { duration: d })), {
    dur: 0.9,
  });
  playCue(
    s,
    c,
    'tr-failure-contract-compare-rows',
    (d) => s.play(compareReveal.to(1, { duration: d })),
    { after: true, dur: 0.6 },
  );
}
