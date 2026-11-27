// Scene 11: tradeoff - Bandwidth ruler placing 48 GB weights + KV traffic end to end (64 ms -> 50 ms).
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function tradeoff(s, c) {
  const weightsGB = 48;
  const origKvGB = 16;
  const gqaKvGB = origKvGB / 8; // 2 GB
  const totalOrig = weightsGB + origKvGB; // 64
  const totalGqa = weightsGB + gqaKvGB; // 50
  const mhaW = s.value(0);
  const mhaKv = s.value(0);
  const showRuler = s.value(0);
  const showOrigMs = s.value(0);
  const showGqaLane = s.value(0);
  const showAsk = s.value(0);
  const gqaKv = s.value(0);
  const showAns = s.value(0);
  const showRatio = s.value(0);
  const showMeasure = s.value(0);

  const title = heroTitle(['Where do the', 'grouped reads end?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'BANDWIDTH RULER · 1 TB/s = 1 GB / ms',
  });

  const ratioEq = glowTex(
    String.raw`\frac{64\text{ ms}}{50\text{ ms}} = 1.28\times \quad (\text{not } 8\times)`,
    { x: 465, y: -395, size: 36, color: ROLE.gold, glow: 8 },
  );

  const live = guardedDynamic(1, () => {
    const mw = mhaW.value;
    const mk = mhaKv.value;
    const rl = showRuler.value;
    const om = showOrigMs.value;
    const gl = showGqaLane.value;
    const ask = showAsk.value;
    const gk = gqaKv.value;
    const ans = showAns.value;
    const rat = showRatio.value;
    const meas = showMeasure.value;

    const barLeft = -620;
    const barW = 1140;
    const barH = 74;
    const mhaY = -120;
    const gqaY = 125;
    const px = (gb) => (gb / totalOrig) * barW;

    const nodes = [
      txt(
        'READ-ONLY LOWER BOUND · DECIMAL UNITS · 1 TB/s',
        -855,
        -260,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
      // MHA lane label and track
      txt('MHA', -845, mhaY, 44, COSMOS.ink, 'mono', 'left'),
      rect(barW, barH, { fill: '#0d1527', stroke: '#28385e', width: 2, radius: 8 }).at(
        barLeft + barW / 2,
        mhaY,
      ),
    ];

    // MHA segments
    if (mw > 0.2) {
      const w = px(mw);
      nodes.push(
        lumBar(barLeft + w / 2, mhaY, w, barH - 6, {
          color: ROLE.key,
          fillOpacity: 0.44,
          strokeWidth: 2.2,
          glow: 7,
          radius: 6,
        }),
      );
      if (mw > 44) {
        nodes.push(
          txt(
            '48 GB weights',
            barLeft + px(weightsGB) / 2,
            mhaY,
            30,
            COSMOS.ink,
            'mono',
            'center',
          ).opacity(Math.min(1, (mw - 44) / 4)),
        );
      }
    }
    if (mk > 0.2) {
      const w = px(mk);
      const x0 = barLeft + px(weightsGB);
      nodes.push(
        lumBar(x0 + w / 2, mhaY, w, barH - 6, {
          color: ROLE.value,
          fillOpacity: 0.5,
          strokeWidth: 2.2,
          glow: 8,
          radius: 6,
        }),
      );
      if (mk > 14.5) {
        nodes.push(
          txt('16 GB KV', x0 + px(origKvGB) / 2, mhaY, 28, COSMOS.ink, 'mono', 'center').opacity(
            Math.min(1, (mk - 14.5) / 1.5),
          ),
        );
      }
    }

    // MHA right-side timing bound
    if (rl > 0.02) {
      nodes.push(txt('Read time ≥', 560, mhaY - 22, 26, COSMOS.muted, 'sans', 'left').opacity(rl));
    }
    if (om > 0.02) {
      nodes.push(
        txt(`${totalOrig} ms`, 560, mhaY + 24, 44, ROLE.gold, 'mono', 'left')
          .glow(8, ROLE.gold)
          .opacity(om),
      );
    }

    // --- GQA lane (appears on 'switch') ---
    if (gl > 0.02) {
      const w48 = px(weightsGB);
      nodes.push(
        txt('GQA', -845, gqaY, 44, ROLE.query, 'mono', 'left').opacity(gl),
        rect(barW, barH, { fill: '#0d1527', stroke: '#28385e', width: 2, radius: 8 })
          .at(barLeft + barW / 2, gqaY)
          .opacity(gl),
        lumBar(barLeft + w48 / 2, gqaY, w48, barH - 6, {
          color: ROLE.key,
          fillOpacity: 0.44,
          strokeWidth: 2.2,
          glow: 7,
          radius: 6,
          opacity: gl,
        }),
        txt(
          '48 GB weights (fixed)',
          barLeft + w48 / 2,
          gqaY,
          30,
          COSMOS.ink,
          'mono',
          'center',
        ).opacity(gl),
        txt(
          ans > 0.5 ? '48 GB weights  +  2 GB KV' : '48 GB weights  +  (16 ÷ 8) GB KV',
          barLeft,
          gqaY - 62,
          28,
          ans > 0.5 ? ROLE.value : COSMOS.muted,
          'mono',
          'left',
        ).opacity(gl),
      );

      // Fixed 48 GB vertical alignment line linking MHA and GQA
      const x48 = barLeft + w48;
      nodes.push(
        line([x48, mhaY + barH / 2 + 6], [x48, gqaY - barH / 2 - 6], {
          stroke: ROLE.key,
          width: 2.2,
          dash: [6, 6],
        }).opacity(0.75 * gl),
      );

      // Strict prediction withholding: show '?' on ask; reveal 2 GB + 50 ms on c.after('answer')
      if (gk > 0.1) {
        const w2 = Math.max(8, px(gk));
        nodes.push(
          lumBar(x48 + w2 / 2, gqaY, w2, barH - 6, {
            color: ROLE.value,
            fillOpacity: 0.65,
            strokeWidth: 2.4,
            glow: 11,
            radius: 5,
          }),
          txt('2 GB', x48 + w2 + 16, gqaY, 26, ROLE.value, 'mono', 'left').opacity(ans),
        );
      } else if (ask > 0.02) {
        nodes.push(
          txt('? GB KV', x48 + 26, gqaY, 30, ROLE.gold, 'mono', 'left')
            .glow(7, ROLE.gold)
            .opacity(ask),
        );
      }

      if (ask > 0.02) {
        nodes.push(
          txt('Read time ≥', 560, gqaY - 22, 26, COSMOS.muted, 'sans', 'left').opacity(ask),
          txt(
            ans > 0.5 ? `${totalGqa} ms` : '? ms',
            560,
            gqaY + 24,
            44,
            ans > 0.5 ? ROLE.value : ROLE.gold,
            'mono',
            'left',
          )
            .glow(9, ans > 0.5 ? ROLE.value : ROLE.gold)
            .opacity(ask),
        );
      }
    }

    // Bottom bandwidth ruler (0, 16, 32, 48, 50, 64 GB/ms)
    const axisY = 265;
    nodes.push(line([barLeft, axisY], [barLeft + barW, axisY], { stroke: '#4d608e', width: 2.4 }));
    for (const v of [0, 16, 32, 48, 64]) {
      const tx = barLeft + px(v);
      nodes.push(
        line([tx, axisY - 10], [tx, axisY + 10], { stroke: '#6c82b5', width: 2.6 }),
        txt(`${v} ms`, tx, axisY + 38, 26, COSMOS.muted, 'mono', 'center'),
      );
    }
    if (ans > 0.02) {
      const x50 = barLeft + px(totalGqa);
      nodes.push(
        line([x50, gqaY + barH / 2 + 4], [x50, axisY + 10], {
          stroke: ROLE.gold,
          width: 3,
          dash: [6, 5],
        }).opacity(ans),
        glowDot(x50, axisY, { radius: 7, color: ROLE.gold, glow: 12, opacity: ans }),
        txt('50 ms', x50 + 18, axisY - 26, 26, ROLE.gold, 'mono', 'left').opacity(ans),
      );
    }

    // Floating footer message
    const footText =
      meas > 0.5
        ? 'Measure end-to-end token latency and tokens/s at target batch and context'
        : rat > 0.5
          ? 'Weights still stream every step: cutting KV 8× speeds total reads by 1.28×'
          : 'On a 1 TB/s link, every gigabyte transferred costs at least 1 millisecond';
    nodes.push(
      txt(
        footText,
        0,
        438,
        28,
        rat > 0.5 && meas < 0.5 ? ROLE.gold : COSMOS.muted,
        'sans',
        'center',
      ),
    );

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.key), title, live);
  c.show('ratio', ratioEq, { after: true, fade: 0.45 });

  playCue(s, c, 'weights', (d) => s.play(mhaW.to(weightsGB, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'cache', (d) => s.play(mhaKv.to(origKvGB, { duration: d })), {
    after: true,
    dur: 0.55,
  });
  playCue(s, c, 'ruler', (d) => s.play(showRuler.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'original', (d) => s.play(showOrigMs.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'switch', (d) => s.play(showGqaLane.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'ask', (d) => s.play(showAsk.to(1, { duration: d })), { dur: 0.4 });
  playCue(
    s,
    c,
    'answer',
    (d) => s.play(gqaKv.to(gqaKvGB, { duration: d }), showAns.to(1, { duration: 0.3 })),
    { after: true, dur: 0.6 },
  );
  playCue(s, c, 'ratio', (d) => s.play(showRatio.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'measure', (d) => s.play(showMeasure.to(1, { duration: d })), { dur: 0.4 });
}
