// Scene 10: Trace the final unmasked position: right vs left padding masks, [99,99] sentinel dodge, bias cancel.
import {
  COSMOS,
  HEAD_W,
  PAD_LEFT_IDX,
  PAD_LEFT_MASK,
  PAD_RIGHT_IDX,
  PAD_RIGHT_MASK,
  PAD_SCORE,
  PAD_STATES,
  aura,
  circle,
  glowTex,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  tokenCell,
  txt,
} from '../parts.mjs';

export default function paddingAndArtifact(s, c) {
  const selOn = s.value(0.35);
  const vecMatched = s.value(0);
  const scoreOn = s.value(0);
  const ruleOn = s.value(0);
  const biasOn = s.value(0);
  const saveOn = s.value(0);

  const bgAura = aura(150, 15, 560, '#6ee7b71c', '#a78bfa18');
  const title = heroTitle(['Trace the Final', 'Unmasked Token'], {
    x: -855,
    y: -415,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.emerald,
    eyebrow: 'ATTENTION MASK POOLING · SAVED HEAD ARTIFACT',
  });

  const eqBias = glowTex(
    String.raw`(r_w + b) - (r_l + b) = r_w - r_l \;\Rightarrow\; \frac{\partial\mathcal{L}}{\partial b} = 0`,
    { x: 300, y: -365, size: 32, color: COSMOS.violet },
  );

  const live = guardedDynamic(1, () => {
    const sl = selOn.value;
    const vm = vecMatched.value;
    const sc = scoreOn.value;
    const rl = ruleOn.value;
    const bs = biasOn.value;
    const sv = saveOn.value;

    const colX = [-465, -220, 25];
    const rightY = -120;
    const leftY = 85;
    const rightStates = [PAD_STATES[0], PAD_STATES[1], PAD_STATES[2]]; // [1,0], [2,3], [99,99]
    const leftStates = [PAD_STATES[2], PAD_STATES[0], PAD_STATES[1]]; // [99,99], [1,0], [2,3]

    const nodes = [
      txt('INDEX 0', colX[0], -215, 26, COSMOS.muted, 'mono'),
      txt('INDEX 1', colX[1], -215, 26, COSMOS.muted, 'mono'),
      txt('INDEX 2', colX[2], -215, 26, COSMOS.muted, 'mono'),

      txt('RIGHT-PAD', -855, rightY - 16, 28, COSMOS.cyan, 'mono', 'left'),
      txt('mask [1,1,0]', -855, rightY + 24, 26, COSMOS.muted, 'mono', 'left'),

      txt('LEFT-PAD', -855, leftY - 16, 28, COSMOS.violet, 'mono', 'left'),
      txt('mask [0,1,1]', -855, leftY + 24, 26, COSMOS.muted, 'mono', 'left'),
    ];

    for (let i = 0; i < 3; i++) {
      const rPick = i === PAD_RIGHT_IDX;
      const rPad = PAD_RIGHT_MASK[i] === 0;
      const rCol = rPad ? COSMOS.rose : rPick ? COSMOS.emerald : COSMOS.cyan;
      nodes.push(
        tokenCell(colX[i], rightY, 212, 102, rCol, {
          fill: rPick ? '#0d2624' : rPad ? '#22101e' : '#10182b',
          dash: rPad ? [7, 5] : undefined,
          glow: rPick ? 10 * Math.max(0.4, sl) : rPad ? 6 : 2,
        }),
        txt(`m = ${PAD_RIGHT_MASK[i]}`, colX[i], rightY - 22, 26, rCol, 'mono'),
        txt(
          `[${rightStates[i].join(', ')}]`,
          colX[i],
          rightY + 20,
          28,
          rPad ? COSMOS.rose : COSMOS.ink,
          'mono',
        ),
      );

      const lPick = i === PAD_LEFT_IDX;
      const lPad = PAD_LEFT_MASK[i] === 0;
      const lCol = lPad ? COSMOS.rose : lPick ? COSMOS.emerald : COSMOS.violet;
      nodes.push(
        tokenCell(colX[i], leftY, 212, 102, lCol, {
          fill: lPick ? '#0d2624' : lPad ? '#22101e' : '#16142e',
          dash: lPad ? [7, 5] : undefined,
          glow: lPick ? 10 * Math.max(0.4, sl) : lPad ? 6 : 2,
        }),
        txt(`m = ${PAD_LEFT_MASK[i]}`, colX[i], leftY - 22, 26, lCol, 'mono'),
        txt(
          `[${leftStates[i].join(', ')}]`,
          colX[i],
          leftY + 20,
          28,
          lPad ? COSMOS.rose : COSMOS.ink,
          'mono',
        ),
      );
    }

    // Converging readout beams: right-pad arches OVER index 2 so it never crosses [99, 99]
    const hubX = 400;
    const hubY = -18;
    nodes.push(
      glowingArc([colX[1], rightY - 56], [hubX, hubY - 102], -68, {
        color: COSMOS.emerald,
        width: 3.6,
        opacity: Math.max(0.4, vm),
      }),
      glowingArc([colX[2] + 112, leftY], [hubX - 100, hubY + 24], 20, {
        color: COSMOS.emerald,
        width: 3.6,
        opacity: Math.max(0.4, vm),
      }),
      circle(94, { fill: '#0e2226', stroke: COSMOS.emerald, width: 3.5 })
        .at(hubX, hubY)
        .glow(10, COSMOS.emerald),
      txt('POOLED h', hubX, hubY - 26, 26, COSMOS.muted, 'mono'),
      txt('[2, 3]', hubX, hubY + 22, 40, COSMOS.emerald, 'mono').glow(6, COSMOS.emerald),
      txt('skips [99, 99]', hubX, hubY + 128, 26, COSMOS.rose, 'mono'),

      // Dot product with w = [0.5, 1.0] -> 4.0
      glowingArc([hubX + 100, hubY], [635, hubY], 0, {
        color: COSMOS.gold,
        width: 3.6,
        opacity: Math.max(0.4, sc),
      }),
      txt(`w = [${HEAD_W[0]}, ${HEAD_W[1]}]`, 755, hubY - 100, 26, COSMOS.violet, 'mono'),
      txt('1 + 3 =', 755, hubY - 50, 28, COSMOS.muted, 'mono').opacity(Math.max(0.45, sc)),
      txt(PAD_SCORE.toFixed(1), 755, hubY + 20, 62, COSMOS.gold, 'mono')
        .glow(10, COSMOS.gold)
        .opacity(Math.max(0.45, sc)),
    );

    // Bottom formula + artifact checklist strip (floating, no boxes)
    line([-855, 215], [810, 215], { stroke: '#253355', width: 2 });
    nodes.push(
      txt(
        'GENERAL RULE:  max { i : mask[i] = 1 }  ·  reject empty sequence',
        -855,
        275,
        28,
        rl > 0.4 ? COSMOS.cyan : COSMOS.muted,
        'mono',
        'left',
      ).glow(rl > 0.4 ? 5 : 0, COSMOS.cyan),
      txt(
        bs > 0.4
          ? 'Shared bias b cancels in every difference → zero pair-loss gradient'
          : 'Scalar head replaces vocabulary projection',
        -855,
        340,
        28,
        bs > 0.4 ? COSMOS.violet : COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        'SAVE TOGETHER:  base rev · adapters · trainable score head · tokenizer · template',
        -855,
        405,
        26,
        sv > 0.4 ? COSMOS.gold : COSMOS.dim,
        'mono',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eqBias, live);

  c.on('padding-select', () => s.play(selOn.to(1, { duration: 0.4 })));
  c.on('padding-and-artifact-step-1', () => s.play(vecMatched.to(1, { duration: 0.45 })));
  c.on('padding-score', () => s.play(scoreOn.to(1, { duration: 0.4 })));
  c.on('padding-and-artifact-step-2', () => s.play(ruleOn.to(1, { duration: 0.45 })));
  c.on('padding-bias', () => s.play(biasOn.to(1, { duration: 0.4 })));
  c.on('padding-and-artifact-step-3', () =>
    s.play(saveOn.to(1, { duration: remainDuration(c, 'padding-and-artifact-step-3', 0.45) })),
  );
}
