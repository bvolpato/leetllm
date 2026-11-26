// Scene 22: How much attention weight goes to the nine? TWO strict prediction holds: equal scores (1/3 -> output 3 vs wrong mean 4.5), then +ln 2 boost (1/2 -> output 4.5), plus shared-max rescaling & empty shard.
import {
  ATTN_BOOST,
  ATTN_EQ,
  COSMOS,
  ROLE,
  aura,
  fmtNum,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  rect,
  remainAfterDuration,
  remainBeatDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function massMerge(s, c) {
  const phase = s.value(0);
  const pTwo = s.value(0);
  const pOne = s.value(0);
  const pShift = s.value(0);
  const pThreeShares = s.value(0);
  const pOut1 = s.value(0);
  const pWrong = s.value(0);
  const pRaise = s.value(0);
  const pRescale = s.value(0);
  const pNewShare = s.value(0);
  const pOut2 = s.value(0);
  const pBeat4 = s.value(0);
  const pEmpty = s.value(0);

  const bgAura = aura(0, 20, 620, '#60a5fa1c', '#ffd16618');
  const title = heroTitle(['How Much Attention Weight', 'Goes to the Nine?'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'MASS-AWARE ONLINE MERGE · SHARED MAXIMUM M',
  });

  const eqMerge = glowTex('o = \\frac{\\sum_j e^{m_j - M} u_j}{\\sum_j e^{m_j - M} l_j}', {
    x: 560,
    y: -360,
    size: 38,
    color: COSMOS.gold,
  });

  const live = guardedDynamic(1, () => {
    const raised = pRaise.value > 0.5;
    const model = raised ? ATTN_BOOST : ATTN_EQ;
    const partDone = raised ? pNewShare.value > 0.5 : pThreeShares.value > 0.5;
    const outDone = raised ? pOut2.value > 0.5 : pOut1.value > 0.5;
    const shifted = pShift.value > 0.5 && (!raised || pRescale.value > 0.5);
    const wrong = !raised && pWrong.value > 0.5;
    const b4 = pBeat4.value > 0.5;
    const emp = pEmpty.value > 0.5;

    const cols = [ROLE.gpu0, ROLE.gpu0, ROLE.gpu1];
    const fills = ['#11284a', '#11284a', '#0e2d3b'];
    const xs = [-540, 0, 540];

    const nodes = [];

    // 3 key cards
    model.values.forEach((val, i) => {
      const intro = i === 0 ? true : i === 1 ? pTwo.value > 0.2 : pOne.value > 0.2;
      const cx = xs[i];
      const col = cols[i];
      nodes.push(
        glassCell(cx, -90, 480, 232, intro ? (raised && i === 2 ? COSMOS.gold : col) : '#24314f', {
          fill: intro ? fills[i] : '#0b1120',
          glow: intro ? 8 : 2,
        }),
        txt(`GPU ${i === 2 ? 1 : 0}  ·  KEY ${i + 1}`, cx, -172, 26, col, 'mono'),
      );
      if (intro) {
        nodes.push(
          txt(`value = ${val}`, cx, -110, 44, col, 'mono').glow(6, col),
          txt(
            raised && i === 2 ? 'score = 1000 + ln 2' : 'score = 1000',
            cx,
            -52,
            28,
            raised && i === 2 ? COSMOS.gold : COSMOS.ink,
            'mono',
          ),
        );
        if (shifted) {
          nodes.push(
            txt(`shifted weight = ${fmtNum(model.weights[i], 2)}`, cx, -4, 26, COSMOS.gold, 'mono'),
          );
        }
      }
    });

    // Global attention weight strip
    const barX = -780;
    const barW = 1560;
    const barY = 128;
    nodes.push(
      txt('GLOBAL ATTENTION WEIGHT SHARE', -780, 62, 26, COSMOS.muted, 'mono', 'left'),
      rect(barW, 84, { fill: '#0c1426', stroke: COSMOS.dim, width: 2.0, radius: 10 }).at(0, barY),
    );

    if (partDone) {
      let cursor = barX;
      model.shares.forEach((sh, i) => {
        const w = sh * barW;
        nodes.push(
          rect(w - 6, 84, { fill: fills[i], stroke: cols[i], width: 2.8, radius: 10 })
            .at(cursor + w * 0.5, barY)
            .glow(8, cols[i]),
          txt(
            `Key ${i + 1} · 1/${Math.round(1 / sh)}`,
            cursor + w * 0.5,
            barY,
            30,
            cols[i],
            'mono',
          ),
        );
        cursor += w;
      });
    } else {
      nodes.push(
        txt(
          raised
            ? 'Predict: what fraction of the attention weight goes to the nine now?'
            : 'Predict: what fraction of the attention weight goes to the nine?',
          0,
          barY,
          30,
          COSMOS.gold,
          'sans',
        ),
      );
    }

    // Reference strip from Run 1 once boosted
    if (raised) {
      for (let i = 0; i < 3; i++) {
        const w = barW / 3;
        nodes.push(
          rect(w - 6, 18, { fill: cols[i], stroke: null, radius: 4 })
            .at(barX + i * w + w * 0.5, 194)
            .opacity(0.65),
        );
      }
      nodes.push(
        txt('Run 1 reference: equal 1/3 shares', -780, 232, 26, COSMOS.muted, 'mono', 'left'),
      );
    }

    // Footer / verdict
    let foot = 'Subtract shared maximum M before exp() to prevent overflow';
    let footCol = COSMOS.ink;
    if (emp) {
      foot = 'Empty shard adds 0 mass and 0 weighted sum, yet still joins the collective';
      footCol = ROLE.gpu1;
    } else if (b4) {
      foot = 'Multiply each shard mass l_j and sum u_j by exp(m_j - M), then divide';
      footCol = COSMOS.gold;
    } else if (wrong) {
      foot = `Naive GPU mean = (0 + 9)/2 = ${fmtNum(model.wrongMean, 1)} (WRONG!)  ·  Exact mass merge = ${fmtNum(model.output, 1)}`;
      footCol = ROLE.bad;
    } else if (outDone) {
      foot = `Weighted sum ${fmtNum(model.numerator, 1)} ÷ total mass ${fmtNum(model.mass, 1)} = ${fmtNum(model.output, 1)}`;
      footCol = ROLE.good;
    } else if (raised) {
      foot =
        pRescale.value > 0.5
          ? 'New shared max M = 1000 + ln 2 · old weights rescale to 1/2 each'
          : 'Key 3 score raised by +ln 2 · shared max M = 1000 + ln 2';
      footCol = COSMOS.gold;
    }

    nodes.push(
      glassCell(0, 325, 1560, 82, footCol, { fill: '#10182b', glow: 8 }),
      txt(foot, 0, 325, 28, footCol, 'mono'),
      glowDot(-740 + ((phase.value * 0.55) % 1) * 1480, 415, { radius: 6, color: COSMOS.gold }),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('two-keys', () => s.play(pTwo.to(1, { duration: remainDuration(c, 'two-keys', 0.4) })));
  c.on('one-key', () => s.play(pOne.to(1, { duration: remainDuration(c, 'one-key', 0.4) })));
  c.after('shifted', () =>
    s.play(pShift.to(1, { duration: remainAfterDuration(c, 'shifted', 0.4) })),
  );
  c.after('three-shares', () =>
    s.play(pThreeShares.to(1, { duration: remainAfterDuration(c, 'three-shares', 0.4) })),
  );
  c.after('weighted-output', () =>
    s.play(pOut1.to(1, { duration: remainAfterDuration(c, 'weighted-output', 0.4) })),
  );
  c.after('wrong-mean', () =>
    s.play(pWrong.to(1, { duration: remainAfterDuration(c, 'wrong-mean', 0.4) })),
  );
  c.after('raise-score', () =>
    s.play(pRaise.to(1, { duration: remainAfterDuration(c, 'raise-score', 0.4) })),
  );
  c.after('rescale', () =>
    s.play(pRescale.to(1, { duration: remainAfterDuration(c, 'rescale', 0.4) })),
  );
  c.after('new-share', () =>
    s.play(pNewShare.to(1, { duration: remainAfterDuration(c, 'new-share', 0.4) })),
  );
  c.after('new-output', () =>
    s.play(pOut2.to(1, { duration: remainAfterDuration(c, 'new-output', 0.4) })),
  );
  c.onBeat(4, () => s.play(pBeat4.to(1, { duration: remainBeatDuration(c, 4, 0.4) })));
  c.show(4, [eqMerge]);
  c.on('empty-rank', () =>
    s.play(pEmpty.to(1, { duration: remainDuration(c, 'empty-rank', 0.4) })),
  );
}
