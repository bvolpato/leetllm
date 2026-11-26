// Scene 8: ablation - "Which edit changed the score?"
// Prediction scene: zoomed glowing 2D activation plane (x = [1, 0.1], blue feature [1, 0],
// emerald residual sliver [0, 0.1]) + dual glowing score lanes ("From the original" vs
// "Copy of the original" -> "From the reconstruction"). Strictly withholds post-ablation
// score deltas (10 -> 10 and 0 -> 0) until abl-results and abl-copy-result complete!
import { assertEqual, dynamic } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  cinemaPlane,
  glowTex,
  heroTitle,
  lumBar,
  playCue,
  rule,
  txt,
} from '../parts.mjs';

const x = [1, 0.1];
const rebuilt = [1, 0];
const scoreOf = (v) => 100 * v[1];

export default function ablation(s, c) {
  const amount = s.value(1);
  const errorInCopy = s.value(1);
  const residual = x[1] - rebuilt[1];
  const current = (keep) => [amount.value * rebuilt[0], residual * keep];
  const clean = () => current(1);
  const copy = () => current(errorInCopy.value);

  assertEqual(Number((residual ** 2 / x.length).toFixed(3)), 0.005, 'MSE = 0.005');
  assertEqual(
    [scoreOf(x), scoreOf([0, residual]), scoreOf(rebuilt), scoreOf([0, 0])],
    [10, 10, 0, 0],
    'ablation scores',
  );

  const atmo = cinemaAtmosphere(ROLE.first, ROLE.residual);
  const title = heroTitle(['Which edit changed', 'the score?'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.residual,
  });

  const b = cinemaPlane(s, {
    cx: -365,
    cy: 95,
    width: 960,
    height: 700,
    x: [-0.2, 1.35],
    y: [-0.43, 0.52],
    xStep: 0.5,
    yStep: 0.25,
    showTicks: false,
  });

  const customTicks = [
    ...[0, 0.5, 1].map((n) =>
      b.tagOf([n, -0.075], String(n), COSMOS.dim, [n === 0 ? -24 : 0, 0], { size: 26 }),
    ),
    ...[-0.25, 0.25, 0.5].map((n) =>
      b.tagOf([-0.05, n], String(n), COSMOS.dim, [0, 0], { size: 26, anchor: 'right' }),
    ),
  ];

  const blueArrow = b.arrowOf([0, 0], () => [amount.value, 0], ROLE.first, { width: 8 });
  const greenSliver = b.segmentOf(() => [amount.value, 0], clean, ROLE.residual, {
    width: 10,
    glow: 12,
  });
  const upperDot = b.dotOf(clean, ROLE.residual, 10, 14);
  const lowerRing = b.ringOf(copy, ROLE.second, 14, 4);
  const origRing = b.ringOf(x, ROLE.dim, 18, 2.5);
  const featLbl = b.tagOf([0.48, -0.15], 'feature [1, 0]', ROLE.first, [0, 0], { size: 30 });
  const gapLbl = b.tagOf(x, 'residual [0, 0.1]', ROLE.residual, [0, -68], { size: 30 });

  s.add(atmo, title, b.node, ...customTicks, blueArrow, upperDot, origRing, featLbl);

  // Right side: Formula + 2 luminous comparison lanes + bottom prediction/verdict area
  const rxL = 200;
  const rxR = 840;
  const rxC = (rxL + rxR) / 2;

  const scoreEq = glowTex('\\text{score} = 100 \\times x_2', {
    x: rxC,
    y: -310,
    size: 44,
    color: ROLE.mark,
    glow: 7,
  });

  const makeLane = (yTop, name, read, color) => {
    const nameNode = txt(name, rxL, yTop, 34, COSMOS.ink, 'sans', 'left');
    const vecNode = dynamic(() =>
      txt(
        `[${read()[0].toFixed(2)}, ${read()[1].toFixed(2)}]`,
        rxL,
        yTop + 56,
        40,
        color,
        'mono',
        'left',
      ).glow(6, color),
    );
    const barY = yTop + 118;
    const barW = 430;
    const gauge = dynamic(() => {
      const val = scoreOf(read());
      const fill = Math.max(0, (barW * val) / scoreOf(x));
      return [
        rule(rxL, barY, rxL + barW, barY, '#2e3e63', 5),
        ...(fill > 2
          ? [
              lumBar(rxL + fill / 2, barY, fill, 24, {
                color,
                fillOpacity: 0.48,
                strokeWidth: 2.2,
                glow: 9,
                radius: 5,
              }),
            ]
          : []),
        txt(`score ${Math.round(val)}`, rxR, barY, 34, color, 'mono', 'right').glow(6, color),
      ];
    });
    return { nameNode, vecNode, gauge };
  };

  const origLane = makeLane(-195, 'From the original', clean, ROLE.residual);
  const copyLane = makeLane(45, 'From the reconstruction', copy, ROLE.second);
  const uneditedCopyName = txt('Copy of the original', rxL, 45, 34, COSMOS.ink, 'sans', 'left');
  const laneDivider = rule(rxL, -10, rxR, -10, COSMOS.rule, 1.8).opacity(0.6);

  s.add(origLane.nameNode, origLane.vecNode, laneDivider);

  c.show('abl-gain', [scoreEq, origLane.gauge]);
  c.show('abl-residual', [greenSliver, gapLbl]);
  c.show('abl-copy', [lowerRing, uneditedCopyName, copyLane.vecNode, copyLane.gauge]);
  c.swap('abl-miss', uneditedCopyName, copyLane.nameNode);
  playCue(s, c, 'abl-miss', (d) => s.play(errorInCopy.to(0, { duration: d })), { dur: 1.0 });

  const mseTxt = txt('MSE = 0.10² / 2 = 0.005', rxC, 285, 32, COSMOS.ink, 'mono', 'center');
  const beforeTxt = txt(
    'Scores before feature removal',
    rxC,
    340,
    28,
    COSMOS.muted,
    'sans',
    'center',
  );
  c.show('abl-mse', [mseTxt, beforeTxt]);

  // Prediction pause: withhold both post-ablation results!
  const subTxt = txt(
    'Subtract [1, 0] from each row',
    rxC,
    285,
    34,
    ROLE.first,
    'mono',
    'center',
  ).glow(6, ROLE.first);
  const askTxt = txt('Which score will change?', rxC, 355, 40, ROLE.mark, 'serif', 'center').glow(
    8,
    ROLE.mark,
  );
  c.swap('abl-predict', [mseTxt, beforeTxt], [subTxt, askTxt]);

  c.hide('abl-apply', [gapLbl, featLbl, askTxt]);
  playCue(s, c, 'abl-apply', (d) => s.play(amount.to(0, { duration: d })), { dur: 1.6 });

  const effOrig = txt('10 → 10', rxR, -139, 38, ROLE.residual, 'mono', 'right').glow(
    8,
    ROLE.residual,
  );
  const effCopy = txt('0 → 0', rxR, 101, 38, ROLE.second, 'mono', 'right').glow(8, ROLE.second);
  c.show('abl-results', effOrig, { after: true });
  c.show('abl-copy-result', effCopy, { after: true });

  const verdictTxt = txt(
    'Feature removal changes neither score.',
    rxC,
    300,
    34,
    ROLE.mark,
    'sans',
    'center',
  ).glow(7, ROLE.mark);
  c.swap('abl-verdict', subTxt, verdictTxt);
}
