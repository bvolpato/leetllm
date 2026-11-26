// Scene 4: objective - "Fit the activation while limiting the code"
// Left: Glowing 2D activation plane with live blue/pink reconstruction & emerald error gap.
// Right: Glowing 5-slot sparse code strip, glowing MathJax SAE loss objective, sleek lambda slider,
//        stacked luminous cost bars (two features vs one feature crossing at lambda = 2.5),
//        and Beat 2 scale degeneracy (columns double as code halves while x_hat stays frozen) closed
//        by the glowing unit circle and norm-aware penalty.
import { dynamic, indicate, parametric } from 'vizmatic/stage';
import {
  COSMOS,
  EXAMPLE_SLOTS,
  ROLE,
  SLOTS,
  WIDTH,
  cinemaAtmosphere,
  cinemaPlane,
  cinemaRebuild,
  code,
  dictionary,
  glowCodeStrip,
  glowSlider,
  glowTex,
  heroTitle,
  lumBar,
  objectiveTerms,
  playCue,
  txt,
  vec,
} from '../parts.mjs';

const DENSE = code;
const SPARSE = [code[0], 0, 0, 0, 0];
const LAMBDA = { start: 1, end: 4, max: 4 };

export default function objective(s, c) {
  const crossing = objectiveTerms(SPARSE, 0).error / ((DENSE[1] - SPARSE[1]) / SLOTS); // 2.5

  const atmo = cinemaAtmosphere(ROLE.residual, ROLE.mark);
  const title = heroTitle(['Fit the activation while', 'limiting the code'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.mark,
  });

  const b = cinemaPlane(s, {
    cx: -365,
    cy: 95,
    width: 960,
    height: 700,
    x: [-1.3, 2.9],
    y: [-1.4, 1.8],
  });

  const z = glowCodeStrip(s, {
    x: 515,
    y: -245,
    width: 650,
    height: 225,
    max: 2.5,
    colors: EXAMPLE_SLOTS,
    start: code,
  });

  const lambda = s.value(LAMBDA.start);
  const shrink = s.value(1);
  const live = cinemaRebuild(b, () => [z.z[0].value / shrink.value, z.z[1].value / shrink.value]);

  const rx = 515;
  const formula = glowTex(
    '\\tfrac{1}{D}\\lVert x - \\hat{x} \\rVert^{2} + \\tfrac{\\lambda}{M}\\lVert z \\rVert_{1}',
    { x: rx, y: -62, size: 42, color: COSMOS.ink, glow: 5 },
  );
  const errorTerm = formula.part('\\tfrac{1}{D}\\lVert x - \\hat{x} \\rVert^{2}');
  const penaltyTerm = formula.part('\\tfrac{\\lambda}{M}\\lVert z \\rVert_{1}');
  errorTerm.forEach((g) => g.color(ROLE.residual));

  s.add(
    atmo,
    title,
    b.node,
    live.error,
    live.blue,
    live.pink,
    live.point,
    live.rebuilt,
    z.rail,
    z.glyphs,
    z.bars,
    z.numbers,
    formula,
  );

  // Beat 0: Two terms pull on the second coefficient
  const moveSecond =
    (val, dur = 1.0) =>
    (d) =>
      s.play(z.z[1].to(val, { duration: Math.min(dur, d) }));
  playCue(s, c, 'objective-b1-1', moveSecond(0.55, 1.0), { dur: 1.0 });
  playCue(
    s,
    c,
    'obj-penalty',
    (d) =>
      s.play(
        ...penaltyTerm.map((g) => indicate(g, { color: ROLE.mark, scale: 1.18, duration: d })),
      ),
    { dur: 0.8 },
  );
  playCue(s, c, 'obj-first', moveSecond(DENSE[1], 1.0), { dur: 1.0 });
  playCue(s, c, 'obj-second', moveSecond(SPARSE[1], 1.0), { dur: 1.0 });

  // Sleek glowing lambda slider + stacked luminous candidate cost bars
  const knob = glowSlider({
    x: 410,
    y: 35,
    width: 360,
    value: lambda,
    min: 0,
    max: LAMBDA.max,
    color: ROLE.mark,
    prefix: 'λ = ',
    digits: 2,
    labelX: 625,
  });

  const barLeft = 195;
  const barMaxW = 520;
  const perUnit = barMaxW / objectiveTerms(DENSE, LAMBDA.max).total;

  const makeCostBar = (y, candidate, name, otherTerms) => {
    const terms = () => {
      const { error } = objectiveTerms(candidate, 0);
      const { penalty } = objectiveTerms(
        candidate.map((val) => val * shrink.value),
        lambda.value,
      );
      return { error, penalty, total: error + penalty.reduce((sum, v) => sum + v, 0) };
    };
    const bar = dynamic(() => {
      const { error, penalty, total } = terms();
      const winner = total <= otherTerms().total;
      let cursor = barLeft;
      const segs = [
        [penalty[0], ROLE.first],
        [penalty[1], ROLE.second],
        [error, ROLE.residual],
      ].flatMap(([val, col]) => {
        const w = val * perUnit;
        if (w < 2) return [];
        const node = lumBar(cursor + w / 2, y + 26, w - 2, 34, {
          color: col,
          fillOpacity: 0.46,
          strokeWidth: 2,
          glow: 7,
          radius: 5,
        });
        cursor += w;
        return [node];
      });
      return [
        txt(name, barLeft, y - 16, 30, winner ? ROLE.mark : COSMOS.muted, 'sans', 'left'),
        ...segs,
        txt(
          total.toFixed(2),
          barLeft + total * perUnit + 18,
          y + 26,
          32,
          winner ? ROLE.mark : COSMOS.ink,
          'mono',
          'left',
        ),
      ];
    });
    return { bar, terms };
  };

  const dense = makeCostBar(130, DENSE, 'two features', () => sparse.terms());
  const sparse = makeCostBar(250, SPARSE, 'one feature', () => dense.terms());

  c.show('obj-candidates', [
    dense.bar,
    sparse.bar,
    knob.rail,
    knob.activeTrack,
    knob.knob,
    knob.readout,
  ]);
  playCue(s, c, 'obj-candidates', moveSecond(DENSE[1], 1.0), { offset: 1.4, dur: 1.0 });

  // Bottom readout notes (D, M, gradient pull, not fixed decay)
  const noteY = 385;
  const sizesTxt = txt(`D = ${WIDTH}   M = ${SLOTS}`, rx, noteY, 34, COSMOS.ink, 'mono', 'center');
  const pullEq = glowTex('\\text{gradient pull on active } z_i:\\ \\lambda / M', {
    x: rx,
    y: noteY,
    size: 36,
    color: ROLE.mark,
    glow: 5,
  });
  const notDecay = txt(
    'Not fixed subtraction z − ηλ after each step',
    rx,
    noteY,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );

  c.show('obj-div-d', sizesTxt);
  playCue(
    s,
    c,
    'obj-div-d',
    (d) =>
      s.play(
        ...formula
          .part('\\tfrac{1}{D}')
          .map((g) => indicate(g, { color: ROLE.mark, scale: 1.35, duration: d })),
      ),
    { dur: 0.7 },
  );
  playCue(
    s,
    c,
    'obj-div-m',
    (d) =>
      s.play(
        ...formula
          .part('\\tfrac{\\lambda}{M}')
          .map((g) => indicate(g, { color: ROLE.mark, scale: 1.35, duration: d })),
      ),
    { dur: 0.7 },
  );
  c.swap('obj-derivative', sizesTxt, pullEq);
  c.swap('obj-not-decay', pullEq, notDecay);

  // Beat 1: Dense vs sparse preference flip as lambda crosses 2.5 -> 4.0
  c.hide(1, notDecay);
  playCue(s, c, 'obj-dense', moveSecond(DENSE[1], 0.6), { dur: 0.6 });
  playCue(s, c, 'obj-sparse', moveSecond(SPARSE[1], 0.9), { dur: 0.9 });
  playCue(s, c, 'obj-raise', (d) => s.play(lambda.to(crossing, { duration: d })), { dur: 1.5 });

  const equalTxt = txt(
    `Equal cost at λ = ${crossing.toFixed(1)}`,
    rx,
    noteY,
    34,
    ROLE.mark,
    'mono',
    'center',
  ).glow(7, ROLE.mark);
  const changedTxt = txt(
    'Sparse code now costs less (1.70 < 2.00)',
    rx,
    noteY,
    30,
    ROLE.mark,
    'sans',
    'center',
  ).glow(7, ROLE.mark);
  c.show('objective-b2-1', equalTxt);
  playCue(s, c, 'obj-preferred', (d) => s.play(lambda.to(LAMBDA.end, { duration: d })), {
    dur: 1.4,
  });
  c.hide('obj-preferred', equalTxt);
  c.show('obj-preferred', changedTxt, { after: true });

  // Beat 2: Scale degeneracy (shrink code, double columns, x_hat frozen) + unit circle fix
  const deg = Math.PI / 180;
  const unitCircle = [
    [0, 90],
    [108, 180],
    [198, 252],
    [270, 342],
  ].map(([from, to]) =>
    parametric((t) => b.P([Math.cos(t), Math.sin(t)]), from * deg, to * deg, {
      stroke: ROLE.other,
      width: 2.8,
      dash: [9, 8],
    }).opacity(0.75),
  );
  const scaledCols = [0, 1].map((i) =>
    b.arrowOf([0, 0], () => vec.scale(dictionary[i], 1 / shrink.value), EXAMPLE_SLOTS[i], {
      width: 4,
      dash: [11, 8],
    }),
  );

  const sameTxt = txt(
    'Same reconstruction, lower L1 bill!',
    rx,
    noteY,
    32,
    ROLE.wrong,
    'sans',
    'center',
  ).glow(7, ROLE.wrong);
  const unitTxt = txt(
    'Unit-norm columns block free scaling',
    rx,
    noteY,
    30,
    ROLE.mark,
    'sans',
    'center',
  ).glow(7, ROLE.mark);
  const normAwareEq = glowTex('\\text{Norm-aware:}\\ \\lambda\\,|z_i|\\,\\lVert d_i \\rVert', {
    x: rx,
    y: -62,
    size: 40,
    color: ROLE.other,
    glow: 6,
  });

  c.swap(2, [changedTxt, sparse.bar], [...unitCircle, ...scaledCols]);
  c.onBeat(2, () =>
    s.play(
      z.z[1].to(DENSE[1], { duration: 0.75 }),
      lambda.to(LAMBDA.start * 2, { duration: 0.75 }),
    ),
  );
  playCue(
    s,
    c,
    'objective-b3-1',
    (d) =>
      s.play(
        shrink.to(0.5, { duration: d }),
        z.z[0].to(DENSE[0] * 0.5, { duration: d }),
        z.z[1].to(DENSE[1] * 0.5, { duration: d }),
      ),
    { dur: 2.0 },
  );
  playCue(
    s,
    c,
    'objective-b3-2',
    (d) => s.play(indicate(live.rebuilt, { color: ROLE.mark, scale: 1.35, duration: d })),
    { dur: 0.8 },
  );
  c.show('obj-reduce', sameTxt);
  playCue(
    s,
    c,
    'obj-unit',
    (d) =>
      s.play(
        shrink.to(1, { duration: d }),
        z.z[0].to(DENSE[0], { duration: d }),
        z.z[1].to(DENSE[1], { duration: d }),
      ),
    { dur: 1.2 },
  );
  c.swap('obj-unit', sameTxt, unitTxt);
  c.swap('obj-norm-aware', formula, normAwareEq);
}
