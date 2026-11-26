// Scene 35: Add the missing comparison (3-answer [30%, 10%, 60%] A>C step -> [34.7%, 10.2%, 55.1%], loss 0.88 -> 0.81)
import {
  COSMOS,
  FRESH_STEP,
  alignmentFreshStep,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function freshTransfer(s, c) {
  const phase = s.value(0);
  const sSetup = s.value(0);
  const sVoteProb = s.value(0);
  const sGrad = s.value(0);
  const sStep = s.value(0);
  const sRenorm = s.value(0);
  const sProbA = s.value(0);
  const sProbB = s.value(0);
  const sProbC = s.value(0);
  const sLoss = s.value(0);

  const bgAura = aura(0, 20, 620, '#123e3626', '#3c1b2a22');
  const title = heroTitle(['Add the Missing', 'Comparison (A > C)'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: '3-ANSWER SOFTMAX UPDATE · UNTOUCHED LOGIT B STILL SHIFTS SHARE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const vp = sVoteProb.value;
    const gr = sGrad.value;
    const st = sStep.value;
    const rn = sRenorm.value;
    const ls = sLoss.value;

    const cur = alignmentFreshStep(st);
    const names = ['A · TICKET', 'B · GRANT', 'C · EXCEPTION'];
    const cols = [COSMOS.emerald, COSMOS.cyan, COSMOS.rose];
    const fills = ['#103b33', '#102840', '#3a1421'];
    const baseY = 128;
    const barScale = 365; // 0.60 -> 219px

    const nodes = [
      txt(
        'POLICY DISTRIBUTION (UNIFORM REF · beta = 0.5 · lr = 0.4 · VOTE: A > C)',
        -855,
        -214,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      line([-835, baseY], [30, baseY], { stroke: COSMOS.rule, width: 2.4 }),
    ];

    cur.probabilities.forEach((prob, i) => {
      const cx = -690 + i * 285;
      const h = Math.max(24, prob * barScale);
      const showNewProb =
        (i === 0 && sProbA.value > 0.2) ||
        (i === 1 && sProbB.value > 0.2) ||
        (i === 2 && sProbC.value > 0.2);
      const shownP = rn > 0.2 || showNewProb ? prob : FRESH_STEP.start[i];
      const shownH = Math.max(24, shownP * barScale);
      const gradStr =
        gr > 0.5
          ? i === 1
            ? 'grad = 0.000'
            : `grad = ${cur.gradient[i] >= 0 ? '+' : ''}${cur.gradient[i].toFixed(3)}`
          : 'grad = ?';

      nodes.push(
        rect(175, shownH, { fill: fills[i], stroke: cols[i], width: 2.6, radius: 8 })
          .at(cx, baseY - shownH * 0.5)
          .glow(showNewProb ? 10 * pulse : 5, cols[i]),
        txt(`${(shownP * 100).toFixed(1)}%`, cx, baseY - shownH - 30, 32, cols[i], 'mono'),
        txt(names[i], cx, baseY + 38, 26, cols[i], 'mono'),
        txt(gradStr, cx, baseY + 78, 26, gr > 0.5 ? COSMOS.gold : COSMOS.dim, 'mono'),
      );
    });

    // Right column: Step arithmetic & withheld prediction panel
    const rx = 465;
    nodes.push(
      glassCell(rx, -110, 790, 146, gr > 0.5 ? COSMOS.gold : COSMOS.amber, {
        fill: '#1b1710',
        dash: gr > 0.5 ? undefined : [10, 6],
        glow: gr > 0.5 ? 8 * pulse : 4,
      }),
      txt(
        gr > 0.5 ? 'GRADIENTS & LOGIT STEP (lr = 0.4)' : 'PREDICTION: WHICH LOGITS MOVE?',
        rx,
        -150,
        26,
        COSMOS.gold,
        'mono',
      ),
      txt(
        st > 0.5
          ? 'A: +0.117 · B: 0 (untouched) · C: -0.117'
          : gr > 0.5
            ? 'A: -0.293 · B: 0.000 · C: +0.293'
            : vp > 0.2
              ? 'P(A > C) = 41.4% -> compute gradients'
              : 'Vote A > C: which logits move? [ ? ]',
        rx,
        -88,
        26,
        COSMOS.ink,
        'mono',
      ),

      glassCell(rx, 80, 790, 178, ls > 0.2 ? COSMOS.rose : COSMOS.cyan, {
        fill: ls > 0.2 ? '#28101a' : '#0f2138',
        glow: ls > 0.2 ? 9 * pulse : 4,
      }),
      txt('AFTER SOFTMAX RENORMALIZATION', rx, 26, 26, COSMOS.cyan, 'mono'),
      txt(
        rn > 0.2
          ? 'A: 34.7% · B: 10.2% · C: 55.1% (sum=100%)'
          : 'Exponentiate updated logits & divide by sum Z',
        rx,
        78,
        26,
        COSMOS.ink,
        'mono',
      ),
      txt(
        ls > 0.2
          ? `Loss: ${FRESH_STEP.beforeLoss.toFixed(2)} -> ${FRESH_STEP.loss.toFixed(2)}  |  C STILL WINS > 55%!`
          : rn > 0.2
            ? 'Untouched logit B still shifts because total weight Z changed'
            : 'Softmax normalizes exp(z) across all three answers',
        rx,
        132,
        26,
        ls > 0.2 ? COSMOS.rose : COSMOS.muted,
        'sans',
      ),

      // Bottom summary (zero spoiler before gradient reveal!)
      txt(
        ls > 0.2
          ? 'One step helps, yet the assistant still invents an exception > 50% of the time -> keep evaluating!'
          : gr > 0.5
            ? 'Pair A > C moves A up & C down directly; untouched B still shifts share after softmax!'
            : 'Start logits = ln([0.3, 0.1, 0.6]) · uniform ref · beta = 0.5 · lr = 0.4',
        0,
        388,
        26,
        ls > 0.2 ? COSMOS.gold : COSMOS.muted,
        'sans',
      ),
    );

    return group(...nodes);
  });

  const eqFresh = glowTex(
    '\\Delta z_i = -\\eta \\frac{\\partial \\mathcal{L}_{\\text{DPO}}}{\\partial z_i}, \\qquad p_i = \\frac{e^{z_i}}{\\sum_j e^{z_j}}',
    {
      x: 465,
      y: 274,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  s.add(bgAura, title, live, eqFresh);
  runPhase(s, c, phase, 14);

  c.on('fresh-transfer-b0', () =>
    s.play(sSetup.to(1, { duration: remainDuration(c, 'fresh-transfer-b0', 0.45) })),
  );
  c.on('fresh-transfer-b1', () =>
    s.play(sVoteProb.to(1, { duration: remainDuration(c, 'fresh-transfer-b1', 0.45) })),
  );
  c.after('pa-fresh-gradient', () =>
    s.play(sGrad.to(1, { duration: remainAfterDuration(c, 'pa-fresh-gradient', 0.45) })),
  );
  c.after('pa-fresh-step', () =>
    s.play(sStep.to(1, { duration: remainAfterDuration(c, 'pa-fresh-step', 0.6) })),
  );
  c.on('fresh-transfer-b2', () =>
    s.play(sRenorm.to(1, { duration: remainDuration(c, 'fresh-transfer-b2', 0.5) })),
  );
  c.on('pa-fresh-prob-a', () =>
    s.play(sProbA.to(1, { duration: remainDuration(c, 'pa-fresh-prob-a', 0.4) })),
  );
  c.on('pa-fresh-prob-b', () =>
    s.play(sProbB.to(1, { duration: remainDuration(c, 'pa-fresh-prob-b', 0.4) })),
  );
  c.on('pa-fresh-prob-c', () =>
    s.play(sProbC.to(1, { duration: remainDuration(c, 'pa-fresh-prob-c', 0.4) })),
  );
  c.on('pa-fresh-loss', () =>
    s.play(sLoss.to(1, { duration: remainDuration(c, 'pa-fresh-loss', 0.45) })),
  );
}
