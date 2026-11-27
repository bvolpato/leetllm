// Scene 30: Check the reducer on one token. Same partials on [1, 2], try Mean -> False (strict hold on what to change!) -> switch to Sum -> True!
import {
  COSMOS,
  DENSE_REF,
  MP_MEAN,
  ROLE,
  aura,
  fmtVec,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  mpReference,
  remainAfterDuration,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function transfer(s, c) {
  const pPartials = s.value(0);
  const pMean = s.value(0);
  const pMeanChk = s.value(0);
  const pSwitch = s.value(0);
  const pSumChk = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#6ee7b718');
  const title = heroTitle(['Check the Reducer', 'on One Single Token'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.good,
    eyebrow: 'CPU REFERENCE VERIFICATION · torch.allclose(candidate, dense)',
  });

  const live = guardedDynamic(1, () => {
    const pr = pPartials.value > 0.3;
    const summed = pSwitch.value > 0.5;
    const cand = summed ? mpReference : MP_MEAN;
    const calcDone = summed ? pSwitch.value > 0.5 : pMean.value > 0.5;
    const chkDone = summed ? pSumChk.value > 0.5 : pMeanChk.value > 0.5;
    const equal = summed;

    const nodes = [
      txt(
        'INPUT x = [1, 2]  ·  SAME WEIGHTS  ·  SAME LOCAL PROJECTIONS',
        0,
        -210,
        26,
        COSMOS.muted,
        'mono',
      ),
    ];

    // Top row: GPU 0 and GPU 1 fixed partials
    [0, 1].forEach((rank) => {
      const cx = rank === 0 ? -430 : 430;
      const col = rank === 0 ? ROLE.gpu0 : ROLE.gpu1;
      nodes.push(
        glassCell(cx, -108, 760, 128, pr ? col : COSMOS.dim, {
          fill: rank === 0 ? '#10213d' : '#0e2b38',
          glow: pr ? 8 : 3,
        }),
        txt(`GPU ${rank} PARTIAL`, cx, -142, 26, col, 'mono'),
        txt(fmtVec(cand.partials[rank], 4), cx, -88, 38, COSMOS.ink, 'mono'),
      );
    });

    // Candidate row
    const candCol = summed ? ROLE.good : COSMOS.gold;
    nodes.push(
      glassCell(0, 34, 1620, 92, candCol, {
        fill: summed ? '#0d2924' : '#231c0e',
        glow: 8,
      }),
      txt(
        summed ? 'Candidate: SUM of partials + one bias' : 'Candidate: MEAN of partials + one bias',
        -765,
        34,
        30,
        candCol,
        'mono',
        'left',
      ),
      txt(calcDone ? `≈ ${fmtVec(cand.output, 4)}` : '?', 765, 34, 38, candCol, 'mono', 'right'),

      // Dense reference row
      glassCell(0, 148, 1620, 92, COSMOS.muted, { fill: '#0e172a', glow: 4 }),
      txt('Dense float64 reference', -765, 148, 30, COSMOS.ink, 'mono', 'left'),
      txt(`≈ ${fmtVec(DENSE_REF, 4)}`, 765, 148, 38, COSMOS.ink, 'mono', 'right'),

      // torch.allclose verdict bar
      glassCell(0, 272, 1620, 92, chkDone ? (equal ? ROLE.good : ROLE.bad) : COSMOS.dim, {
        fill: chkDone ? (equal ? '#0d2b24' : '#301120') : '#0c1322',
        glow: chkDone ? 10 : 3,
      }),
      txt('torch.allclose(candidate, dense)', -765, 272, 32, COSMOS.ink, 'mono', 'left'),
      txt(
        chkDone ? (equal ? 'True' : 'False') : '?',
        765,
        272,
        46,
        chkDone ? (equal ? ROLE.good : ROLE.bad) : COSMOS.dim,
        'mono',
        'right',
      ).glow(chkDone ? 8 : 0, equal ? ROLE.good : ROLE.bad),
    );

    const foot =
      chkDone && equal
        ? 'Layer boundary verified · next measure peak memory, latency, and useful throughput under load'
        : chkDone && !equal
          ? 'Predict: if the local partials and bias are correct, what should we change?'
          : 'Compare the distributed candidate against the exact dense reference on CPU first';

    nodes.push(
      txt(foot, 0, 362, 28, chkDone ? (equal ? ROLE.good : COSMOS.gold) : COSMOS.muted, 'sans'),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('inspect-partials', () =>
    s.play(pPartials.to(1, { duration: remainDuration(c, 'inspect-partials', 0.4) })),
  );
  c.after('try-mean', () =>
    s.play(pMean.to(1, { duration: remainAfterDuration(c, 'try-mean', 0.4) })),
  );
  c.after('mean-check', () =>
    s.play(pMeanChk.to(1, { duration: remainAfterDuration(c, 'mean-check', 0.4) })),
  );
  c.on('switch-reducer', () =>
    s.play(pSwitch.to(1, { duration: remainDuration(c, 'switch-reducer', 0.45) })),
  );
  c.after('sum-check', () =>
    s.play(pSumChk.to(1, { duration: remainAfterDuration(c, 'sum-check', 0.4) })),
  );
}
