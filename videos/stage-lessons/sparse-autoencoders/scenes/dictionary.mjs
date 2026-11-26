// Scene 3: dictionary - "Rebuild an activation from a few directions"
// Left: Glowing 2D activation plane with 5 overcomplete unit columns and dot x = [2.3, 0.6].
// Right: Glowing 5-slot sparse code spectrum bar strip + progressive constructions below:
//        Beat 0: sparse code rises, arrows scale & add tip-to-tail -> MathJax reconstruction sum.
//        Beat 1: commutative order swap, unused columns pulse, 5 columns > 2 axes -> overcomplete.
//        Beat 2: untied dashed encoder rows perpendicular to other feature columns, floating hook tags,
//                luminous M x D / D x M matrix grids, glowing bias MathJax equations, tied vs tied-init swing.
import { angleMark, arrow, indicate, rect, rightAngle } from 'vizmatic/stage';
import { encoderFixture } from '../../../films/sparse-autoencoders/model.mjs';
import {
  COSMOS,
  EXAMPLE_SLOTS,
  ROLE,
  cinemaAtmosphere,
  cinemaPlane,
  code,
  dictionary,
  glowCodeStrip,
  glowDot,
  glowTex,
  heroTitle,
  lumBar,
  playCue,
  target,
  txt,
  vec,
} from '../parts.mjs';

export default function dictionaryScene(s, c) {
  const [d1, d2] = dictionary;
  const encoder = encoderFixture();

  const atmo = cinemaAtmosphere(ROLE.first, ROLE.other);
  const title = heroTitle(['Rebuild an activation', 'from a few directions'], {
    x: -855,
    y: -435,
    size: 48,
    lineHeight: 56,
    accent: ROLE.other,
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
    y: -225,
    width: 650,
    height: 235,
    max: 2.5,
    colors: EXAMPLE_SLOTS,
  });

  const scaled = s.value(0);
  const pinkJoined = s.value(0);
  const blueJoined = s.value(0);
  const lenOf = (i) => 1 + (code[i] - 1) * scaled.value;
  const blueStart = () => vec.scale(d2, lenOf(1) * blueJoined.value);
  const pinkStart = () => vec.scale(d1, lenOf(0) * pinkJoined.value);

  const blueArrow = b.arrowOf(
    blueStart,
    () => vec.add(blueStart(), vec.scale(d1, lenOf(0))),
    ROLE.first,
    { width: 7.5 },
  );
  const pinkArrow = b.arrowOf(
    pinkStart,
    () => vec.add(pinkStart(), vec.scale(d2, lenOf(1))),
    ROLE.second,
    { width: 7.5 },
  );
  const unused = dictionary
    .slice(2)
    .map((d) =>
      arrow(b.P([0, 0]), b.P(d), { stroke: '#4d608e', width: 4.5, tip: 16 }).opacity(0.75),
    );
  const dotX = b.dotOf(target, ROLE.activation, 11, 14);
  const tagX = b.tagOf(target, 'x', ROLE.activation, [48, -44], { font: 'serif', size: 38 });

  s.add(
    atmo,
    title,
    b.node,
    unused,
    blueArrow,
    pinkArrow,
    dotX,
    tagX,
    z.rail,
    z.glyphs,
    z.bars,
    z.numbers,
  );

  const rx = 515;

  // --- Beat 0: Sparse code, scaling, addition, reconstruction ---
  playCue(
    s,
    c,
    'dict-code',
    (d) => s.play(z.z[0].to(code[0], { duration: d }), z.z[1].to(code[1], { duration: d })),
    { dur: 0.9 },
  );
  playCue(s, c, 'dictionary-b1-1', (d) => s.play(scaled.to(1, { duration: d })), { dur: 1.2 });
  playCue(s, c, 'dict-add', (d) => s.play(pinkJoined.to(1, { duration: d })), { dur: 1.3 });

  const rebuiltRing = b.ringOf(target, ROLE.activation, 22, 4);
  const sumEq = glowTex('\\hat{x} = 1.5\\,d_1 + 1\\,d_2', {
    x: rx,
    y: 45,
    size: 48,
    color: COSMOS.ink,
    glow: 6,
  });
  sumEq.part('1.5').forEach((g) => g.color(ROLE.first));
  sumEq.part('d_1').forEach((g) => g.color(ROLE.first));
  sumEq.part('1\\,d_2').forEach((g) => g.color(ROLE.second));
  c.show('dictionary-b1-2', [rebuiltRing, sumEq], { after: true });

  // --- Beat 1: Commutative swap, unused columns, overcomplete ---
  c.on('dictionary-b2-1', () => {
    const avail = Math.max(0.8, c.end - c.cue('dictionary-b2-1').start - 0.6);
    const step = Math.min(1.2, avail / 3);
    s.play(pinkJoined.to(0, { duration: step }), blueJoined.to(1, { duration: step }));
    s.wait(Math.min(0.5, step * 0.5));
    s.play(pinkJoined.to(1, { duration: step }), blueJoined.to(0, { duration: step }));
  });
  playCue(
    s,
    c,
    'dict-unused',
    (d) =>
      s.play(...unused.map((ray) => indicate(ray, { color: ROLE.mark, scale: 1.12, duration: d }))),
    { dur: 0.8 },
  );

  const countLine = txt('5 columns  >  2 axes', rx, 155, 38, COSMOS.ink, 'mono', 'center');
  const overWord = txt('Overcomplete dictionary', rx, 225, 38, ROLE.mark, 'serif', 'center').glow(
    8,
    ROLE.mark,
  );
  const knownCode = txt('z = [1.5, 1.0, 0, 0, 0]', rx, 305, 34, ROLE.other, 'mono', 'center');
  c.show('dict-more', countLine);
  c.show('dict-overcomplete', overWord, { after: true });
  c.show('dictionary-b2-2', knownCode);

  // --- Beat 2: Untied encoder readers vs decoder columns ---
  const tied = s.value(0);
  const readerOf = (i) => vec.lerp(encoder.weights[i], dictionary[i], tied.value);
  const readers = [0, 1].map((i) =>
    b.arrowOf([0, 0], () => readerOf(i), EXAMPLE_SLOTS[i], { width: 5, dash: [13, 9] }),
  );
  const drops = [0, 1].map((i) => b.shadowOf(target, () => readerOf(i), EXAMPLE_SLOTS[i], 8));
  const blindMarks = [0, 1].map((i) => {
    const ft = b.foot(target, encoder.weights[i]);
    return rightAngle(b.P(ft), b.P([0, 0]), b.P(target), { stroke: EXAMPLE_SLOTS[i], width: 3 });
  });

  c.hide(2, [sumEq, countLine, overWord, knownCode]);
  c.onBeat(2, () => s.play(z.z[0].to(0, { duration: 0.55 }), z.z[1].to(0, { duration: 0.55 })));

  const jobEnc = txt('Dashed rows: encoder estimates', rx, -20, 30, COSMOS.ink, 'sans', 'center');
  const jobDec = txt('Solid arrows: decoder columns', rx, 30, 30, COSMOS.muted, 'sans', 'center');
  const gainNote = txt(
    'shadow × row norm = dot product',
    rx,
    120,
    26,
    COSMOS.muted,
    'sans',
    'center',
  );
  const gain1 = txt('0.90 × 5/3 = 1.50', rx, 175, 32, ROLE.first, 'mono', 'center');
  const gain2 = txt('0.60 × 5/3 = 1.00', rx, 225, 32, ROLE.second, 'mono', 'center');

  c.show('dictionary-encode', [
    ...readers,
    ...drops,
    ...blindMarks,
    jobEnc,
    gainNote,
    gain1,
    gain2,
  ]);
  c.hide('dictionary-hook-context', [gainNote, gain1, gain2], { lead: 0.35, fade: 0.15 });
  playCue(
    s,
    c,
    'dictionary-encode',
    (d) => s.play(z.z[0].to(code[0], { duration: d }), z.z[1].to(code[1], { duration: d })),
    { offset: 1.4, dur: 1.1 },
  );
  playCue(
    s,
    c,
    'dictionary-b3-1',
    (d) =>
      s.play(
        indicate(blueArrow, { scale: 1.06, duration: d }),
        indicate(pinkArrow, { scale: 1.06, duration: d }),
      ),
    { dur: 0.7 },
  );
  c.show('dictionary-b3-1', jobDec);

  const angleGap = angleMark(b.P([0, 0]), b.P(d1), b.P(encoder.weights[0]), {
    radius: 140,
    stroke: ROLE.mark,
    width: 4.5,
  });
  const untiedLbl = txt(
    'Encoder row ≠ decoder column',
    rx,
    95,
    32,
    ROLE.mark,
    'sans',
    'center',
  ).glow(6, ROLE.mark);
  c.show('dict-untied', [angleGap, untiedLbl]);

  // Floating hook-match criteria with luminous dots (zero bullet cards!)
  const hookHead = txt('Match the exact hook:', rx, 195, 28, COSMOS.muted, 'sans', 'center');
  const hookRow1 = [
    glowDot(300, 255, { radius: 6, color: ROLE.mark, glow: 8 }),
    txt('checkpoint', 320, 255, 28, ROLE.mark, 'mono', 'left'),
    glowDot(565, 255, { radius: 6, color: ROLE.mark, glow: 8 }),
    txt('layer', 585, 255, 28, ROLE.mark, 'mono', 'left'),
  ];
  const hookRow2 = [
    glowDot(260, 308, { radius: 6, color: ROLE.mark, glow: 8 }),
    txt('token positions', 280, 308, 28, ROLE.mark, 'mono', 'left'),
    glowDot(565, 308, { radius: 6, color: ROLE.mark, glow: 8 }),
    txt('normalization', 585, 308, 28, ROLE.mark, 'mono', 'left'),
  ];
  const hookGroup = [hookHead, ...hookRow1, ...hookRow2];
  c.show('dictionary-hook-context', hookGroup);

  // Luminous M x D and D x M matrix visualizations
  const cellNodes = (cx, cy, rows, cols, colorFn) => {
    const sz = 40;
    const gap = 5;
    const w = cols * (sz + gap) - gap;
    const h = rows * (sz + gap) - gap;
    const out = [];
    for (let r = 0; r < rows; r++) {
      for (let k = 0; k < cols; k++) {
        const col = colorFn(r, k);
        out.push(
          lumBar(
            cx - w / 2 + k * (sz + gap) + sz / 2,
            cy - h / 2 + r * (sz + gap) + sz / 2,
            sz,
            sz,
            {
              color: col,
              fillOpacity: col === ROLE.dim ? 0.16 : 0.42,
              strokeWidth: 2,
              glow: col === ROLE.dim ? 0 : 6,
              radius: 5,
            },
          ),
        );
      }
    }
    return out;
  };

  const encTitle = txt('Encoder Wₑ', 345, -15, 30, COSMOS.ink, 'sans', 'center');
  const encGrid = cellNodes(345, 130, 5, 2, (r) => EXAMPLE_SLOTS[r]);
  const encShape = glowTex('M \\times D', { x: 345, y: 295, size: 38, color: ROLE.other, glow: 6 });

  const decTitle = txt('Decoder W_d', 645, 50, 30, COSMOS.ink, 'sans', 'center');
  const decGrid = cellNodes(645, 145, 2, 5, (_, k) => EXAMPLE_SLOTS[k]);
  const decShape = glowTex('D \\times M', { x: 645, y: 245, size: 38, color: ROLE.other, glow: 6 });

  const shapesBase = [encTitle, ...encGrid, decTitle, ...decGrid];
  c.swap('dictionary-dimensions', [jobEnc, jobDec, untiedLbl, ...hookGroup], shapesBase);
  c.show('dict-shapes', [encShape, decShape]);

  // Bias equations (glowing MathJax)
  const encEq = glowTex('z = \\mathrm{ReLU}\\!\\big(W_e(x - b) + c\\big)', {
    x: rx,
    y: 45,
    size: 40,
    color: COSMOS.ink,
    glow: 5,
  });
  const decEq = glowTex('\\hat{x} = W_d\\,z + b', {
    x: rx,
    y: 155,
    size: 44,
    color: COSMOS.ink,
    glow: 5,
  });
  const learnedNote = txt(
    'b is learned: need not equal data mean',
    rx,
    255,
    28,
    COSMOS.muted,
    'sans',
    'center',
  );
  c.swap('dict-bias', [...shapesBase, encShape, decShape], encEq);
  playCue(
    s,
    c,
    'dict-bias',
    (d) =>
      s.play(
        ...encEq.part('b').map((g) => indicate(g, { color: ROLE.mark, scale: 1.4, duration: d })),
      ),
    { offset: 0.4, dur: 0.7 },
  );
  c.show('dict-bias-add', decEq);
  playCue(
    s,
    c,
    'dict-bias-add',
    (d) =>
      s.play(
        ...decEq.part('b').map((g) => indicate(g, { color: ROLE.mark, scale: 1.4, duration: d })),
      ),
    { offset: 0.4, dur: 0.7 },
  );
  c.show('dict-not-mean', learnedNote);

  // Tied weights vs tied initialization
  const overRead = [0, 1].map((i) => vec.dot(dictionary[i], target));
  const tiedHead = txt('Tied: W_d = W_eᵀ always', rx, 35, 36, COSMOS.ink, 'mono', 'center');
  const tiedWarn = txt(
    'Each reader now sees both features',
    rx,
    110,
    32,
    ROLE.wrong,
    'sans',
    'center',
  ).glow(6, ROLE.wrong);
  const tiedInitLbl = txt(
    'Tied init: aligned at step 0, free afterward',
    rx,
    35,
    32,
    ROLE.mark,
    'sans',
    'center',
  ).glow(7, ROLE.mark);
  const tiedGains = [
    txt('0.90 × 5/3 = 1.50', rx, 185, 30, ROLE.first, 'mono', 'center'),
    txt('0.60 × 5/3 = 1.00', rx, 235, 30, ROLE.second, 'mono', 'center'),
  ];

  c.swap('dictionary-tying', [encEq, decEq, learnedNote, angleGap, ...blindMarks], tiedHead);
  c.show('dictionary-tying', tiedWarn, { after: true, lead: -1.1 });
  c.hide('dict-tied-init', tiedWarn, { lead: -1.2 });

  playCue(
    s,
    c,
    'dictionary-tying',
    (d) =>
      s.play(
        b.ticksAlpha.to(0, { duration: Math.min(0.3, d) }),
        tied.to(1, { duration: d }),
        z.z[0].to(overRead[0], { duration: d }),
        z.z[1].to(overRead[1], { duration: d }),
      ),
    { dur: 1.6 },
  );

  c.swap('dict-tied-init', tiedHead, tiedInitLbl);
  c.show('dict-tied-init', tiedGains, { lead: -2.6 });
  playCue(
    s,
    c,
    'dict-tied-init',
    (d) =>
      s.play(
        tied.to(0, { duration: d }),
        z.z[0].to(code[0], { duration: d }),
        z.z[1].to(code[1], { duration: d }),
      ),
    { offset: 0.7, dur: 1.7 },
  );
  playCue(s, c, 'dict-tied-init', (d) => s.play(b.ticksAlpha.to(1, { duration: d })), {
    offset: 2.5,
    dur: 0.3,
  });
}
