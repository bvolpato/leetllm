// Scene 2: recurrence: "Follow the clue past the last noun"
// Glowing dual-polarity recurrent state trajectories around a shared h = 0 horizon rail.
// Strictly withholds the final dog step and readout until step-cat / actor-readout.
import { line } from 'vizmatic/stage';
import {
  CAT_TRACE,
  COSMOS,
  DOG_TRACE,
  ROLE,
  cinemaAtmosphere,
  fmt,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  playCue,
  swapVis,
  tokenPill,
  txt,
} from '../parts.mjs';

export default function recurrence(s, c) {
  const title = heroTitle(['Follow the clue', 'past the last noun'], {
    x: -850,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.dog,
  });

  const xs = [-620, -310, 0, 310, 620];
  const zeroY = 85;
  const scaleY = 260;
  const pt = (i, h) => [xs[i], zeroY - h * scaleY];

  const showInputs = s.value(0);
  const showFormula = s.value(0);
  const dogStep = s.value(0); // 0 -> 1 -> 2 -> 3 -> 4
  const showQuestion = s.value(0);
  const showDogAnswer = s.value(0);
  const dogWordsVis = s.value(1);
  const catWordsVis = s.value(0);
  const catStep = s.value(0); // 0 -> 1 -> 4
  const showCatAnswer = s.value(0);

  const formula = guardedDynamic(showFormula, (alpha) => [
    glowTex('h_t = \\tanh(x_t + 0.9\\,h_{t-1})', {
      x: 420,
      y: -395,
      size: 40,
      color: ROLE.gold,
      glow: 7,
    }).opacity(alpha),
  ]);

  // Base horizon rail + station ticks (always visible)
  const horizon = [
    line([xs[0] - 85, zeroY], [xs[4] + 85, zeroY], { stroke: '#556894', width: 3 }),
    txt('h = 0', xs[0] - 115, zeroY, 28, COSMOS.muted, 'mono', 'right'),
    ...xs.map((x) => line([x, zeroY - 14], [x, zeroY + 14], { stroke: '#556894', width: 2.5 })),
  ];

  // Active word & input strip (clean sequential swapVis on reverse-run -> zero motion overlap!)
  const dogWordLayer = guardedDynamic(dogWordsVis, (alpha) => {
    const nodes = [];
    const inAlpha = showInputs.value * alpha;
    DOG_TRACE.words.forEach((word, i) => {
      const col = word === 'dog' ? ROLE.dog : word === 'cat' ? ROLE.cat : ROLE.input;
      nodes.push(tokenPill(word, xs[i], -248, col, { w: 168, h: 56, size: 30, opacity: alpha }));
      if (inAlpha > 0.02) {
        const xVal = DOG_TRACE.inputs[i];
        const label = `x = ${xVal > 0 ? '+' : ''}${xVal.toFixed(1)}`;
        nodes.push(
          txt(label, xs[i], -180, 28, i === 1 ? ROLE.dog : COSMOS.muted, 'mono', 'center').opacity(
            inAlpha,
          ),
        );
      }
    });
    return nodes;
  });

  const catWordLayer = guardedDynamic(catWordsVis, (alpha) => {
    const nodes = [];
    CAT_TRACE.words.forEach((word, i) => {
      const col = word === 'cat' ? ROLE.cat : word === 'dog' ? ROLE.dog : ROLE.input;
      nodes.push(tokenPill(word, xs[i], -248, col, { w: 168, h: 56, size: 30, opacity: alpha }));
      const xVal = CAT_TRACE.inputs[i];
      const label = `x = ${xVal > 0 ? '+' : ''}${xVal.toFixed(1)}`;
      nodes.push(
        txt(label, xs[i], -180, 28, i === 1 ? ROLE.cat : COSMOS.muted, 'mono', 'center').opacity(
          alpha,
        ),
      );
    });
    return nodes;
  });

  // Helper to draw progressive glowing recurrent trajectory
  function buildTrailLayer(trace, stepVal, color, labelOffsetY, baseAlphaFn = () => 1) {
    return guardedDynamic(
      () => (stepVal.value > 0.01 ? baseAlphaFn() : 0),
      (alpha) => {
        const cur = stepVal.value;
        const vals = trace.states.slice(1);
        const pts = [pt(0, vals[0])];
        const whole = Math.min(4, Math.floor(cur));
        const frac = cur - whole;
        for (let i = 1; i <= whole; i++) pts.push(pt(i, vals[i]));
        if (whole < 4 && frac > 0.01) {
          const a = pt(whole, vals[whole]);
          const b = pt(whole + 1, vals[whole + 1]);
          pts.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac]);
        }
        const nodes = [];
        if (pts.length >= 2) {
          nodes.push(glowingTrail(pts, { color, width: 5.5, glow: 11, opacity: alpha }));
        }
        for (let i = 0; i <= whole; i++) {
          const p = pt(i, vals[i]);
          nodes.push(glowDot(p[0], p[1], { radius: 8, color, glow: 12, opacity: alpha }));
          if (i >= 1) {
            nodes.push(
              txt(fmt(vals[i], 3), p[0], p[1] + labelOffsetY, 30, color, 'mono', 'center').opacity(
                alpha,
              ),
            );
          }
        }
        return nodes;
      },
    );
  }

  const startOrb = glowDot(pt(0, 0)[0], pt(0, 0)[1], { radius: 8, color: COSMOS.ink, glow: 10 });
  const dogTrail = buildTrailLayer(DOG_TRACE, dogStep, ROLE.dog, -44, () =>
    catWordsVis.value > 0.5 ? 0.45 : 1,
  );
  const catTrail = buildTrailLayer(CAT_TRACE, catStep, ROLE.cat, 44);

  // Prediction prompt at station 5 (strictly withholds final state & sign, cleanly above horizon rail)
  const questionLayer = guardedDynamic(showQuestion, (alpha) => [
    glowRing(xs[4], zeroY - 96, 34, ROLE.gold, { width: 3, glow: 10, opacity: alpha }),
    txt('?', xs[4], zeroY - 96, 34, ROLE.gold, 'mono', 'center').opacity(alpha),
    txt(
      'Now comes "cat". Can the last noun turn the line negative?',
      0,
      365,
      34,
      ROLE.gold,
      'serif',
      'center',
    ).opacity(alpha),
  ]);

  const dogAnswerLayer = guardedDynamic(showDogAnswer, (alpha) => [
    txt('Ends above zero (+0.382)  ->  readout picks dog', 0, 365, 34, ROLE.dog, 'mono', 'center')
      .glow(8, ROLE.dog)
      .opacity(alpha),
  ]);

  const catAnswerLayer = guardedDynamic(showCatAnswer, (alpha) => [
    txt(
      'h > 0 (+0.382): dog acted     |     h < 0 (-0.382): cat acted',
      0,
      365,
      32,
      COSMOS.ink,
      'mono',
      'center',
    ).opacity(alpha),
  ]);

  s.add(
    cinemaAtmosphere(ROLE.dog, ROLE.cat),
    title,
    formula,
    ...horizon,
    startOrb,
    dogWordLayer,
    catWordLayer,
    dogTrail,
    catTrail,
    questionLayer,
    dogAnswerLayer,
    catAnswerLayer,
  );

  playCue(s, c, 'actor-feature', (d) => s.play(showInputs.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'previous-memory', (d) => s.play(showFormula.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'dog-input', (d) => s.play(dogStep.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'step-chased', (d) => s.play(dogStep.to(2, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'step-the', (d) => s.play(dogStep.to(3, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'actor-question', (d) => s.play(showQuestion.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(
    s,
    c,
    'step-cat',
    (d) =>
      s.play(showQuestion.to(0, { duration: Math.min(0.25, d) }), dogStep.to(4, { duration: d })),
    { dur: 0.7 },
  );
  playCue(s, c, 'actor-readout', (d) => s.play(showDogAnswer.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
  playCue(
    s,
    c,
    'reverse-run',
    (d) => s.play(showDogAnswer.to(0, { duration: d * 0.4 }), swapVis(dogWordsVis, catWordsVis, d)),
    { dur: 0.65 },
  );
  playCue(s, c, 'cat-input', (d) => s.play(catStep.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'carry-cat', (d) => s.play(catStep.to(4, { duration: d })), { dur: 1.5 });
  playCue(s, c, 'cat-readout', (d) => s.play(showCatAnswer.to(1, { duration: d })), {
    after: true,
    dur: 0.35,
  });
}
