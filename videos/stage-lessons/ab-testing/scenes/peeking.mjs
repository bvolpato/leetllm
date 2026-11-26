// Scene 11 (peeking): "Follow one experiment to its planned finish"
// Seed-11 A/A path (true rates 40% vs 40%): crosses z=+2.58 at look 4 -> prediction hold -> finishes inside at look 20 (z=+1.61) -> 5,000-trial alarm bar chart (231, 708, 961, 1244).
import { line } from 'vizmatic/stage';
import {
  AB_VISUAL_FIXTURES,
  BAD_COLOR,
  COSMOS,
  CTRL_COLOR,
  GOOD_COLOR,
  WARN_COLOR,
  aura,
  glowDot,
  glowRing,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  runAmbientPhase,
  tweenCue,
  txt,
} from '../parts.mjs';

const PATH = AB_VISUAL_FIXTURES.peeking.path; // 20 looks
const ALARMS = AB_VISUAL_FIXTURES.peeking.alarms; // [231, 708, 961, 1244]

export default function peekingScene(s, c) {
  const phase = s.value(0);
  const progressLook = s.value(1); // 1 -> 4 -> 20
  const showCross = s.value(0);
  const showAsk = s.value(0);
  const showInside = s.value(0);
  const showBars = s.value(0);
  const barLevel = s.value(0); // 1=final, 2=5, 3=10, 4=20
  const showRates = s.value(0);

  const bgAura = aura(0, 20, 640, '#3a183b2e', '#133a4a24');
  const title = heroTitle(['Peeking Under Zero Effect:', 'Why Early Stopping Lies'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: BAD_COLOR,
    eyebrow: 'A/A RANDOM WALK & FALSE-ALARM INFLATION',
  });

  const live = guardedDynamic(s.value(1), () => {
    const plot = makePlot(-820, -235, 960, 440, { x: [1, 20], y: [-2.6, 3.0] });
    const kMax = Math.max(1, Math.min(20, progressLook.value));
    const fullCount = Math.floor(kMax);
    const frac = kMax - fullCount;

    const pts = [];
    for (let i = 0; i < fullCount; i++) {
      pts.push(plot.pt([PATH[i].look, PATH[i].z]));
    }
    if (fullCount < 20 && frac > 0.01) {
      const a = PATH[fullCount - 1];
      const b = PATH[fullCount];
      pts.push(plot.pt([a.look + (b.look - a.look) * frac, a.z + (b.z - a.z) * frac]));
    }

    const nodes = [
      ...plot.axesNodes(0.85),
      txt('SINGLE A/A RUN (BOTH ARMS = 40% TRUE RATE)', -820, -270, 26, CTRL_COLOR, 'mono', 'left'),
      // Zero line & ±1.96 ordinary cutoffs
      line(plot.pt([1, 0]), plot.pt([20, 0]), { stroke: COSMOS.rule, width: 2 }),
      line(plot.pt([1, 1.96]), plot.pt([20, 1.96]), {
        stroke: WARN_COLOR,
        width: 3.2,
        dash: [9, 6],
      }).glow(6, WARN_COLOR),
      line(plot.pt([1, -1.96]), plot.pt([20, -1.96]), {
        stroke: WARN_COLOR,
        width: 3.2,
        dash: [9, 6],
      }),
      txt('+1.96', plot.right + 14, plot.yPx(1.96), 26, WARN_COLOR, 'mono', 'left'),
      txt('−1.96', plot.right + 14, plot.yPx(-1.96), 26, WARN_COLOR, 'mono', 'left'),
      ...[1, 4, 10, 15, 20].map((lk) =>
        txt(
          `L${lk}`,
          plot.xPx(lk),
          plot.bottom + 36,
          26,
          lk === 4 ? BAD_COLOR : COSMOS.muted,
          'mono',
        ),
      ),
    ];

    if (pts.length >= 2) {
      nodes.push(
        glowingTrail(pts, {
          gradientColors: [CTRL_COLOR, BAD_COLOR, GOOD_COLOR],
          width: 4.5,
          glow: 10,
        }),
      );
    }
    if (pts.length >= 1) {
      const tip = pts[pts.length - 1];
      nodes.push(glowDot(tip[0], tip[1], { radius: 8.5, color: COSMOS.ink, glow: 12 }));
    }

    // Retained marker at look 4 crossing (z = +2.58)
    if (showCross.value > 0.02) {
      const p4 = plot.pt([PATH[3].look, PATH[3].z]);
      nodes.push(
        glowDot(p4[0], p4[1], { radius: 9, color: BAD_COLOR, glow: 12, opacity: showCross.value }),
        glowRing(p4[0], p4[1], 22, BAD_COLOR, { width: 3, glow: 10, opacity: showCross.value }),
        txt('Look 4: z = +2.58', p4[0] + 36, p4[1] - 34, 26, BAD_COLOR, 'mono', 'left').opacity(
          showCross.value,
        ),
      );
    }

    // Final look 20 marker (z = +1.61 inside!)
    if (showInside.value > 0.02) {
      const p20 = plot.pt([PATH[19].look, PATH[19].z]);
      nodes.push(
        glowDot(p20[0], p20[1], {
          radius: 9.5,
          color: GOOD_COLOR,
          glow: 12,
          opacity: showInside.value,
        }),
        txt(
          'Look 20: z = +1.61',
          p20[0] - 18,
          p20[1] + 44,
          26,
          GOOD_COLOR,
          'mono',
          'right',
        ).opacity(showInside.value),
      );
    }

    // Right panel: 5,000-trial false-alarm bar chart across 1, 5, 10, 20 looks
    const rx = 250;
    const sched = [
      { label: '1 look', cnt: ALARMS[0], pct: '4.6%', col: GOOD_COLOR, thr: 0.5 },
      { label: '5 looks', cnt: ALARMS[1], pct: '14.2%', col: WARN_COLOR, thr: 1.5 },
      { label: '10 looks', cnt: ALARMS[2], pct: '19.2%', col: BAD_COLOR, thr: 2.5 },
      { label: '20 looks', cnt: ALARMS[3], pct: '24.9%', col: BAD_COLOR, thr: 3.5 },
    ];
    nodes.push(
      txt('5,000 A/A TRIALS: FALSE ALARMS', rx, -235, 26, WARN_COLOR, 'mono', 'left').opacity(
        0.4 + 0.6 * showBars.value,
      ),
    );
    sched.forEach((sc, idx) => {
      const y = -135 + idx * 96;
      const active = barLevel.value >= sc.thr ? 1 : 0.28;
      const bw = Math.max(12, (sc.cnt / 1350) * 340);
      nodes.push(
        txt(sc.label, rx, y - 22, 26, sc.col, 'mono', 'left').opacity(active),
        lumBar(rx + bw / 2, y + 18, bw, 32, {
          color: sc.col,
          fillOpacity: 0.72,
          glow: 7,
          opacity: active,
        }),
        txt(
          showRates.value > 0.5 ? `${sc.cnt} (${sc.pct})` : `${sc.cnt}`,
          rx + bw + 18,
          y + 18,
          26,
          sc.col,
          'mono',
          'left',
        ).opacity(active),
      );
    });

    // Strict prediction withholding along bottom
    const askOp = showAsk.value * Math.max(0, 1 - showInside.value * 2.6);
    if (askOp > 0.02) {
      nodes.push(
        txt(
          'Look 4 crossed +1.96 (z = 2.58). Does the planned final Look 20 also cross?',
          -855,
          345,
          30,
          WARN_COLOR,
          'serif',
          'left',
        )
          .glow(7, WARN_COLOR)
          .opacity(askOp),
      );
    }
    const insOp = Math.max(0, (showInside.value - 0.45) / 0.55);
    if (insOp > 0.02) {
      nodes.push(
        txt(
          showRates.value > 0.5
            ? 'False alarms jump 4.6% → 24.9% with 20 peeks! Use alpha spending or mSPRT.'
            : 'No! Look 20 lands at z = +1.61 (inside ±1.96) on the very same incidents.',
          -855,
          345,
          28,
          showRates.value > 0.5 ? BAD_COLOR : GOOD_COLOR,
          'mono',
          'left',
        )
          .glow(6, showRates.value > 0.5 ? BAD_COLOR : GOOD_COLOR)
          .opacity(insOp),
      );
    }

    return nodes;
  });

  s.add(bgAura, title, live);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'four', progressLook, 4, { duration: 0.75 });
  tweenCue(s, c, 'cross', showCross, 1, { duration: 0.45 });
  tweenCue(s, c, 'ask', showAsk, 1, { duration: 0.45 });
  tweenCue(s, c, 'finish', progressLook, 20, { duration: 1.15, after: true });
  tweenCue(s, c, 'inside', showInside, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'repeat', showBars, 1, { duration: 0.4 });
  tweenCue(s, c, 'final', barLevel, 1, { duration: 0.35 });
  tweenCue(s, c, 'five', barLevel, 2, { duration: 0.35 });
  tweenCue(s, c, 'ten', barLevel, 3, { duration: 0.35 });
  tweenCue(s, c, 'twenty', barLevel, 4, { duration: 0.35 });
  tweenCue(s, c, 'rates', showRates, 1, { duration: 0.45 });
}
