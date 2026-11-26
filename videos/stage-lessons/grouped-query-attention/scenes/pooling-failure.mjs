// Scene 12: pooling-failure - Mean-pooling 4 weights (1,3,3,5 -> 3) & opposing-head cancellation (8.81 -> 5).
import {
  COSMOS,
  ROLE,
  chapterModel,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  meanVisible,
  playCue,
  range,
  rect,
  rule,
  runPhase,
  swapVis,
  txt,
} from '../parts.mjs';

export default function poolingFailure(s, c) {
  const coords = [1, 3, 3, 5];
  const pooledMean = meanVisible(coords); // 3
  const model = chapterModel(c.id); // oldOutput ~8.808, pooledOutput = 5

  const phase = s.value(0);
  const vMean = s.value(1); // View 1: 4 stems converging to mean 3
  const vOpp = s.value(0); // View 2: Opposing heads cancelling + uptraining recovery

  // View 1 state
  const showSamples = s.value(0);
  const poolProg = s.value(0);

  // View 2 state
  const oldGauge = s.value(0);
  const showOld = s.value(0);
  const keyPool = s.value(0); // 0=opposing (+1,-1 / -1,+1), 1=cancelled (0, 0)
  const valPool = s.value(0); // 0=opposing (10,0 / 0,10), 1=smeared (5, 5)
  const newGauge = s.value(0);
  const showNew = s.value(0);
  const stageFoot = s.value(0); // 0=none, 1=old, 2=values, 3=new, 4=init, 5=recipe, 6=paper, 7=test

  const title = heroTitle(['What survives', 'mean pooling?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'MHA → GQA UPTRAINING · MEAN POOLING',
  });

  const poolEq = glowTex(
    String.raw`W_{K,j}^{\text{GQA}} = \frac{1}{G}\sum_{i \in j} W_{K,i}^{\text{MHA}}`,
    { x: 470, y: -395, size: 34, color: ROLE.key, glow: 6 },
  );

  // VIEW 1: 4 vertical stems (1, 3, 3, 5) smoothly merging into their luminous gold mean (3)
  const view1 = guardedDynamic(vMean, (a) => {
    const samp = showSamples.value;
    const p = poolProg.value;
    const baseY = 230;
    const unitH = 68;
    const xs = [-480, -160, 160, 480];
    const nodes = [
      txt(
        'ONE COORDINATE ACROSS 4 KEY PROJECTION SLICES',
        0,
        -245,
        28,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(a),
      line([-640, baseY], [640, baseY], { stroke: '#465885', width: 2.4 }).opacity(a),
    ];

    for (const i of range(4)) {
      const x = xs[i] * (1 - p);
      const val = coords[i] * (1 - p) + pooledMean * p;
      const tipY = baseY - val * unitH;
      const col = p > 0.75 ? ROLE.gold : ROLE.key;
      nodes.push(
        line([x, baseY], [x, tipY], { stroke: col, width: 12 }).glow(7, col).opacity(a),
        glowDot(x, tipY, { radius: 11, color: col, glow: 12, opacity: a }),
      );
      if (samp > 0.02 && p < 0.65) {
        nodes.push(
          txt(String(coords[i]), xs[i], baseY + 52, 46, ROLE.key, 'mono', 'center').opacity(
            samp * (1 - p * 1.4) * a,
          ),
        );
      }
    }

    if (p > 0.55) {
      const fadeIn = Math.min(1, (p - 0.55) / 0.45);
      nodes.push(
        txt(String(pooledMean), 0, baseY + 52, 54, ROLE.gold, 'mono', 'center')
          .glow(10, ROLE.gold)
          .opacity(fadeIn * a),
        txt('(1 + 3 + 3 + 5) / 4 = 3', 0, 365, 42, ROLE.gold, 'mono', 'center')
          .glow(7, ROLE.gold)
          .opacity(fadeIn * a),
      );
    }

    return group(...nodes);
  });

  // VIEW 2: Opposing heads cancel (K -> 0, V -> 5), output drops 8.808 -> 5.000, T5-XXL recovery
  const view2 = guardedDynamic(vOpp, (a) => {
    const kp = keyPool.value;
    const vp = valPool.value;
    const og = oldGauge.value;
    const ng = newGauge.value;
    const so = showOld.value;
    const sn = showNew.value;
    const sf = Math.round(stageFoot.value);

    const nodes = [
      rule(15, -285, 15, 360, COSMOS.rule, 1.6).opacity(0.6 * a),
      txt(
        'TWO OPPOSING HEADS · SCALAR QUERY q = 1',
        -430,
        -255,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(a),
    ];

    // Two opposing reader strips on the left
    const readers = [
      { name: 'Reader 0', k: [1, -1], v: [10, 0], y: -110 },
      { name: 'Reader 1', k: [-1, 1], v: [0, 10], y: 145 },
    ];
    for (const r of readers) {
      const kVals = r.k.map((val) => val * (1 - kp));
      const vVals = r.v.map((val) => val * (1 - vp) + 5 * vp);
      const fmtNum = (n) =>
        Math.abs(n) < 0.05 ? '0' : n > 0 ? `+${Math.round(n)}` : String(Math.round(n));
      const fmtVal = (n) => String(Math.round(n));

      nodes.push(
        txt(r.name, -840, r.y - 68, 30, ROLE.query, 'mono', 'left').opacity(a),
        txt('p0', -475, r.y - 68, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('p1', -215, r.y - 68, 26, COSMOS.muted, 'mono', 'center').opacity(a),
        txt('Key K', -840, r.y - 4, 28, kp > 0.5 ? ROLE.alert : ROLE.key, 'mono', 'left').opacity(
          a,
        ),
        txt('Val V', -840, r.y + 68, 28, vp > 0.5 ? ROLE.gold : ROLE.value, 'mono', 'left').opacity(
          a,
        ),
      );

      for (const pos of [0, 1]) {
        const cx = pos === 0 ? -475 : -215;
        const kCol = kp > 0.5 ? ROLE.alert : ROLE.key;
        const vCol = vp > 0.5 ? ROLE.gold : ROLE.value;
        nodes.push(
          lumBar(cx, r.y - 4, 200, 52, {
            color: kCol,
            fillOpacity: 0.24,
            strokeWidth: 2,
            glow: kp > 0.5 ? 9 : 4,
            radius: 7,
            opacity: a,
          }),
          txt(fmtNum(kVals[pos]), cx, r.y - 4, 34, kCol, 'mono', 'center').opacity(a),
          lumBar(cx, r.y + 68, 200, 52, {
            color: vCol,
            fillOpacity: 0.24,
            strokeWidth: 2,
            glow: vp > 0.5 ? 9 : 4,
            radius: 7,
            opacity: a,
          }),
          txt(fmtVal(vVals[pos]), cx, r.y + 68, 34, vCol, 'mono', 'center').opacity(a),
        );
      }
    }

    // Right: Output gauges (0..10 scale) + T5-XXL recovery comparison
    const rx = 85;
    const barW = 735;
    const barH = 44;
    nodes.push(
      txt('OUTPUT PER READER (0 – 10 SCALE)', rx, -255, 26, COSMOS.muted, 'mono', 'left').opacity(
        a,
      ),
      // Original model gauge
      txt(
        so > 0.5 ? `Original MHA   ·   ${model.oldOutput.toFixed(3)}` : 'Original MHA model',
        rx,
        -172,
        32,
        ROLE.query,
        'mono',
        'left',
      ).opacity(a),
      rect(barW, barH, { fill: '#0d1527', stroke: '#28385e', width: 1.8, radius: 7 })
        .at(rx + barW / 2, -118)
        .opacity(a),
    );
    if (og > 0.05) {
      const w = (og / 10) * barW;
      nodes.push(
        lumBar(rx + w / 2, -118, w, barH - 4, {
          color: ROLE.query,
          fillOpacity: 0.52,
          strokeWidth: 2.2,
          glow: 9,
          radius: 6,
          opacity: a,
        }),
      );
    }

    // Pooled model gauge (strictly withheld until c.after('new')!)
    nodes.push(
      txt(
        sn > 0.5
          ? `Mean-pooled (before uptraining)   ·   ${model.pooledOutput.toFixed(3)}`
          : vp > 0.5
            ? 'Mean-pooled output = ?'
            : 'Mean-pooled model',
        rx,
        -12,
        32,
        sn > 0.5 ? ROLE.alert : vp > 0.5 ? ROLE.gold : COSMOS.muted,
        'mono',
        'left',
      ).opacity(a),
      rect(barW, barH, { fill: '#0d1527', stroke: '#28385e', width: 1.8, radius: 7 })
        .at(rx + barW / 2, 42)
        .opacity(a),
    );
    if (ng > 0.05) {
      const w = (ng / 10) * barW;
      nodes.push(
        lumBar(rx + w / 2, 42, w, barH - 4, {
          color: ROLE.alert,
          fillOpacity: 0.54,
          strokeWidth: 2.2,
          glow: 9,
          radius: 6,
          opacity: a,
        }),
      );
    }

    // Uptraining recovery visual (T5-XXL 5% steps -> GQA-8 47.1 vs MHA 47.2)
    if (sf >= 4) {
      nodes.push(
        rule(rx, 118, rx + barW, 118, COSMOS.rule, 1.5).opacity(0.6 * a),
        txt('UPTRAINING RECOVERY', rx, 158, 26, ROLE.value, 'mono', 'left').opacity(a),
      );
    }
    if (sf === 4) {
      nodes.push(
        txt(
          'Mean-pool K/V as initialization · keep Q & O weights',
          rx,
          212,
          28,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
      );
    } else if (sf === 5) {
      nodes.push(
        txt(
          'Continued pretraining: ~5% of original steps (T5 recipe)',
          rx,
          212,
          28,
          ROLE.gold,
          'sans',
          'left',
        ).opacity(a),
      );
    } else if (sf >= 6) {
      // Visual side-by-side task score bars: GQA-8 47.1 vs MHA 47.2
      const wGqa = (47.1 / 55) * barW;
      const wMha = (47.2 / 55) * barW;
      nodes.push(
        txt('T5-XXL mean: GQA-8 47.1 vs MHA 47.2', rx, 206, 26, ROLE.gold, 'mono', 'left').opacity(
          a,
        ),
        lumBar(rx + wGqa / 2, 256, wGqa, 24, {
          color: ROLE.value,
          fillOpacity: 0.52,
          glow: 7,
          radius: 4,
          opacity: a,
        }),
        lumBar(rx + wMha / 2, 294, wMha, 24, {
          color: ROLE.query,
          fillOpacity: 0.45,
          glow: 5,
          radius: 4,
          opacity: a,
        }),
      );
    }

    // Bottom floating line
    const footMap = [
      '',
      'Both original heads place ~88% weight on 10  →  output ≈ 8.81',
      'Keys cancelled to 0 and values became 5. What can any mixture return?',
      'Both pooled heads collapse to 5.00 before uptraining adapts the queries',
      'Treat mean-pooled K/V slices as an initialization, not a finished model',
      'Ainslie et al.: 5% continued pretraining recovers nearly full MHA quality',
      'T5-XXL (summarization, translation, TriviaQA): 47.1 GQA-8 vs 47.2 MHA',
      'Check held-out quality & cache parity',
    ];
    if (sf > 0) {
      nodes.push(
        txt(
          footMap[sf],
          0,
          438,
          28,
          sf === 2 || sf === 3 ? ROLE.gold : COSMOS.muted,
          'sans',
          'center',
        ).opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.key), title, poolEq, view1, view2);
  runPhase(s, c, phase, 16);

  playCue(s, c, 'samples', (d) => s.play(showSamples.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'pool', (d) => s.play(poolProg.to(1, { duration: d })), { after: true, dur: 0.7 });

  playCue(s, c, 'opposing', (d) => s.play(swapVis(vMean, vOpp, d)), { dur: 0.65 });
  playCue(
    s,
    c,
    'old',
    (d) =>
      s.play(
        showOld.to(1, { duration: 0.2 }),
        oldGauge.to(model.oldOutput, { duration: d }),
        stageFoot.to(1, { duration: 0.2 }),
      ),
    { after: true, dur: 0.6 },
  );
  playCue(s, c, 'keys', (d) => s.play(keyPool.to(1, { duration: d })), { after: true, dur: 0.6 });
  playCue(
    s,
    c,
    'values',
    (d) => s.play(valPool.to(1, { duration: d }), stageFoot.to(2, { duration: 0.2 })),
    { after: true, dur: 0.6 },
  );
  playCue(
    s,
    c,
    'new',
    (d) =>
      s.play(
        showNew.to(1, { duration: 0.2 }),
        newGauge.to(model.pooledOutput, { duration: d }),
        stageFoot.to(3, { duration: 0.2 }),
      ),
    { after: true, dur: 0.6 },
  );
  playCue(s, c, 'init', (d) => s.play(stageFoot.to(4, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'recipe', (d) => s.play(stageFoot.to(5, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'paper', (d) => s.play(stageFoot.to(6, { duration: Math.min(0.25, d) })), {
    after: true,
    dur: 0.3,
  });
  playCue(s, c, 'test', (d) => s.play(stageFoot.to(7, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
}
