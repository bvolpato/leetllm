// Scene 19 (wilson-construction): "How much does a perfect sample tell us?"
// Wald collapse at 3/3 -> living score-distance inversion crossing z=1.96 at 43.8% -> 3-row Wilson release rulers.
import { delay, par, to } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  fadeIn,
  fadeOut,
  glowDot,
  glowRing,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  lumBar,
  makePlot,
  runAmbientPhase,
  tweenCue,
  txt,
  wilsonInterval,
} from '../parts.mjs';
import { drawRateRuler } from '../rate-ruler.mjs';

const N3 = 3;
const Z95 = 1.96;
const BOUND3 = wilsonInterval(3, 3, Z95);
const BOUND50 = wilsonInterval(49, 50, Z95);
const BOUND1000 = wilsonInterval(990, 1000, Z95);
const scoreDist = (p) => Math.sqrt((N3 * (1 - p)) / p);

export default function wilson(s, c) {
  const phase = s.value(0);
  const showWaldZero = s.value(0);
  const actScore = s.value(0);
  const proposed = s.value(0.8);
  const showDist80 = s.value(0);
  const showLimit = s.value(0);
  const showCross = s.value(0);
  const showAccepted = s.value(0);
  const showQuad = s.value(0);
  const showShortcut = s.value(0);
  const showGeneral = s.value(0);
  const actCompare = s.value(0);
  const pulseFloor = s.value(0);
  const showB50 = s.value(0);
  const showB1000 = s.value(0);
  const showSided = s.value(0);

  const bgAura = aura(140, 20, 620, '#14384c36', '#2e221420');
  const title = heroTitle(['How Much Does a Perfect', 'Sample Actually Tell Us?'], {
    x: -855,
    y: -435,
    size: 52,
    lineHeight: 60,
    accent: ROLE.A,
    eyebrow: 'WILSON SCORE INTERVAL · INVERTING THE SCORE TEST',
  });

  // Glowing MathJax equations smoothly toggled across acts
  const waldTex = glowTex('\\hat{p}(1 - \\hat{p}) = 1(1 - 1) = 0', {
    x: -410,
    y: -25,
    size: 52,
    color: ROLE.fail,
  });
  const testTex = glowTex('\\frac{|\\hat{p} - p|}{\\sqrt{p(1 - p)/n}} \\le 1.96', {
    x: 415,
    y: -155,
    size: 44,
    color: ROLE.focus,
  }).opacity(0);
  const shortTex = glowTex('p_{\\mathrm{low}} = \\frac{n}{n + z^2} = \\frac{3}{3 + 1.96^2}', {
    x: 415,
    y: -155,
    size: 42,
    color: ROLE.A,
  }).opacity(0);
  const quadTex = glowTex('(1 + z^2/n)p^2 - (2\\hat{p} + z^2/n)p + \\hat{p}^2 \\le 0', {
    x: 0,
    y: 355,
    size: 38,
    color: ROLE.focus,
  }).opacity(0);
  const genTex = glowTex(
    'p_{\\mathrm{low}} = \\frac{\\hat{p} + z^2/(2n) - z\\sqrt{\\hat{p}(1-\\hat{p})/n + z^2/(4n^2)}}{1 + z^2/n}',
    { x: 0, y: 355, size: 34, color: ROLE.A },
  ).opacity(0);

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.0);
    const sc = actScore.value;
    const cmp = actCompare.value;

    const act1Op = fadeOut(sc) * fadeOut(cmp);
    const act2Op = fadeIn(sc) * fadeOut(cmp);
    const act3Op = fadeIn(cmp);
    const nodes = [];

    // ACT 1: Wald collapse at 3/3 observed passes
    if (act1Op > 0.02) {
      nodes.push(
        txt('OBSERVED SAMPLE:  3 / 3 PASSES (100%)', -410, -170, 32, ROLE.A, 'mono').opacity(
          act1Op,
        ),
        lumBar(410, -25, 640, 260, {
          color: showWaldZero.value > 0.3 ? ROLE.fail : COSMOS.muted,
          fillOpacity: 0.14,
          strokeWidth: 2.6,
          glow: showWaldZero.value > 0.3 ? 11 * pulse : 5,
          radius: 14,
          opacity: act1Op,
        }),
        txt('USUAL WALD INTERVAL', 410, -100, 28, COSMOS.muted, 'mono').opacity(act1Op),
      );
      if (showWaldZero.value > 0.02) {
        nodes.push(
          txt('[ 1.00 ,  1.00 ]', 410, -20, 62, ROLE.fail, 'mono')
            .glow(10, ROLE.fail)
            .opacity(act1Op * showWaldZero.value),
          txt('Zero variance -> impossible certainty!', 410, 56, 28, ROLE.focus, 'sans').opacity(
            act1Op * showWaldZero.value,
          ),
        );
      } else {
        nodes.push(
          txt('Computing standard error...', 410, -20, 30, COSMOS.dim, 'mono').opacity(act1Op),
        );
      }
      nodes.push(
        txt(
          'Could three passes really pin down the true rate to 100%?',
          0,
          255,
          36,
          ROLE.focus,
          'serif',
        )
          .glow(7, ROLE.focus)
          .opacity(act1Op),
      );
    }

    // ACT 2: Living score-distance curve inverting the score test for n = 3
    if (act2Op > 0.02) {
      const plot = makePlot(-815, -185, 760, 415, { x: [0.25, 1.0], y: [0, 3.0] });
      const pts = [];
      for (let i = 0; i <= 75; i++) {
        const x = 0.25 + (0.75 * i) / 75;
        pts.push(plot.pt([x, Math.min(3.0, scoreDist(x))]));
      }

      nodes.push(
        ...plot.axesNodes(act2Op * 0.9),
        // Shaded accepted Wilson region [0.438..1.00] once revealed
        ...(showAccepted.value > 0.02
          ? [
              lumBar(
                (plot.px(BOUND3.low) + plot.px(1.0)) * 0.5,
                plot.bottom - 14,
                plot.px(1.0) - plot.px(BOUND3.low),
                24,
                {
                  color: ROLE.A,
                  fillOpacity: 0.45,
                  strokeWidth: 2.2,
                  glow: 10,
                  radius: 6,
                  opacity: act2Op * showAccepted.value,
                },
              ),
            ]
          : []),
        // Golden horizontal z = 1.96 limit line
        glowingTrail([plot.pt([0.25, Z95]), plot.pt([1.0, Z95])], {
          color: ROLE.focus,
          width: 3.2,
          glow: 9,
          opacity: act2Op * (0.35 + 0.65 * showLimit.value),
          core: false,
        }),
        txt('z = 1.96', plot.px(0.98), plot.py(Z95) - 24, 26, ROLE.focus, 'mono', 'right').opacity(
          act2Op,
        ),
        glowingTrail(pts, {
          gradientColors: [ROLE.fail, ROLE.focus, ROLE.A],
          width: 4.5,
          glow: 10,
          opacity: act2Op,
        }),
      );

      [0.25, 0.5, 0.75, 1.0].forEach((tk) => {
        nodes.push(
          txt(tk.toFixed(2), plot.px(tk), plot.bottom + 36, 26, COSMOS.muted, 'mono').opacity(
            act2Op,
          ),
        );
      });
      [1, 2, 3].forEach((lv) => {
        nodes.push(
          txt(String(lv), plot.left - 18, plot.py(lv), 26, COSMOS.muted, 'mono', 'right').opacity(
            act2Op,
          ),
        );
      });
      nodes.push(
        txt(
          'Proposed pass rate p',
          plot.left + plot.w * 0.5,
          plot.bottom + 76,
          26,
          COSMOS.muted,
          'sans',
        ).opacity(act2Op),
      );

      // Moving live beacon on score-distance curve
      const curP = proposed.value;
      const curD = scoreDist(curP);
      const [mx, my] = plot.pt([curP, curD]);
      nodes.push(
        glowDot(mx, my, { radius: 9.5, color: ROLE.B, glow: 14, opacity: act2Op }),
        glowRing(mx, my, 20 + 4 * pulse, ROLE.focus, {
          width: 2.6,
          glow: 9,
          opacity: act2Op * 0.8,
        }),
      );

      // Right readouts (strictly non-overlapping 0.80 -> crossing 0.438)
      const d80Op = showDist80.value * fadeOut(showCross.value);
      const crOp = fadeIn(showCross.value);

      if (d80Op > 0.02) {
        nodes.push(
          txt(
            `p = 0.80  ->  distance = ${scoreDist(0.8).toFixed(2)} SE`,
            415,
            10,
            34,
            ROLE.A,
            'mono',
          )
            .glow(7, ROLE.A)
            .opacity(act2Op * d80Op),
        );
      }
      if (crOp > 0.02) {
        nodes.push(
          txt(
            `Crossing: p ≈ ${(BOUND3.low * 100).toFixed(1)}%  (1.96 SE)`,
            415,
            10,
            34,
            ROLE.focus,
            'mono',
          )
            .glow(9, ROLE.focus)
            .opacity(act2Op * crOp),
        );
      }

      const limOp = showLimit.value * fadeOut(showAccepted.value);
      const accOp = fadeIn(showAccepted.value);
      if (limOp > 0.02) {
        nodes.push(
          txt('Inside 1.96 standard errors -> plausible', 415, 110, 28, ROLE.pass, 'sans').opacity(
            act2Op * limOp,
          ),
        );
      }
      if (accOp > 0.02) {
        nodes.push(
          txt(
            `Wilson 95% interval:  [${BOUND3.low.toFixed(3)},  1.000]`,
            415,
            110,
            34,
            ROLE.A,
            'mono',
          )
            .glow(8, ROLE.A)
            .opacity(act2Op * accOp),
        );
      }
    }

    // ACT 3: Three-row Wilson rate rulers sharing one glowing 95% release floor
    if (act3Op > 0.02) {
      const rLeft = -520;
      const rRight = 560;
      const ys = [-145, 20, 185];
      const rows = [
        { lbl: '3 / 3', data: BOUND3, obs: 1.0, vis: 1 },
        { lbl: '49 / 50', data: BOUND50, obs: 49 / 50, vis: showB50.value },
        { lbl: '990 / 1000', data: BOUND1000, obs: 990 / 1000, vis: showB1000.value },
      ];

      nodes.push(
        txt(
          'TWO-SIDED 95% WILSON INTERVALS  ·  REQUIRED LOWER FLOOR = 95%',
          0,
          -268,
          28,
          ROLE.focus,
          'mono',
        )
          .glow(6, ROLE.focus)
          .opacity(act3Op),
      );

      rows.forEach((row, i) => {
        const ruler = drawRateRuler({
          left: rLeft,
          right: rRight,
          cy: ys[i],
          interval: row.data,
          observed: row.obs,
          floor: 0.95,
          showObserved: 1,
          showInterval: row.vis,
          showFloor: 1,
          showLower: row.vis,
          label: row.lbl,
          opacity: act3Op,
          pulse,
        });
        nodes.push(...ruler.nodes);
        if (row.vis > 0.02) {
          const clears = row.data.low >= 0.95;
          const vCol = clears ? ROLE.pass : ROLE.fail;
          nodes.push(
            txt(
              `${(row.data.low * 100).toFixed(1)}%${clears ? ' ✓' : ''}`,
              rRight + 32,
              ys[i],
              36,
              vCol,
              'mono',
              'left',
            )
              .glow(8, vCol)
              .opacity(act3Op * row.vis),
          );
        } else {
          nodes.push(
            txt('? %', rRight + 32, ys[i], 32, COSMOS.dim, 'mono', 'left').opacity(act3Op * 0.7),
          );
        }
      });

      const floorX = rLeft + 0.95 * (rRight - rLeft);
      nodes.push(
        txt('95% FLOOR', floorX, -214, 26, ROLE.focus, 'mono')
          .glow(pulseFloor.value > 0.3 ? 10 : 5, ROLE.focus)
          .opacity(act3Op),
      );

      // Bottom legend -> one-sided vs two-sided scope note
      const legOp = fadeOut(showSided.value);
      const sidOp = fadeIn(showSided.value);
      if (legOp > 0.02) {
        nodes.push(
          txt('Which lower endpoint clears the 95% release line?', 0, 345, 38, ROLE.focus, 'serif')
            .glow(8, ROLE.focus)
            .opacity(act3Op * legOp),
        );
      }
      if (sidOp > 0.02) {
        nodes.push(
          txt(
            'Two-sided 95%: z = 1.96  ·  One-sided 95% lower bound: z ≈ 1.645  ·  Choose before running',
            0,
            345,
            28,
            ROLE.A,
            'sans',
          )
            .glow(6, ROLE.A)
            .opacity(act3Op * sidOp),
        );
      }
    }

    return nodes;
  });

  s.add(bgAura, title, live, waldTex, testTex, shortTex, quadTex, genTex);
  runAmbientPhase(s, c, phase, 2.2);

  tweenCue(s, c, 'wald-equals', showWaldZero, 1, { duration: 0.45, after: true });
  c.on('propose', () => {
    s.play(
      par(
        to(waldTex, (n) => n.opacity(0), { duration: 0.22 }),
        actScore.to(1, { duration: 0.5 }),
        delay(
          to(testTex, (n) => n.opacity(1), { duration: 0.35 }),
          0.24,
        ),
      ),
    );
  });
  tweenCue(s, c, 'score-eighty', showDist80, 1, { duration: 0.4, after: true });
  tweenCue(s, c, 'score-limit', showLimit, 1, { duration: 0.4, after: true });
  c.on('slide-rate', () => {
    s.play(proposed.to(0.6, { duration: 1.2 }));
  });
  c.after('crossing', () => {
    s.play(par(proposed.to(BOUND3.low, { duration: 0.6 }), showCross.to(1, { duration: 0.45 })));
  });
  tweenCue(s, c, 'accepted', showAccepted, 1, { duration: 0.45 });
  c.on('quadratic', () => {
    s.play(
      par(
        showQuad.to(1, { duration: 0.3 }),
        to(quadTex, (n) => n.opacity(1), { duration: 0.4 }),
      ),
    );
  });
  c.on('all-pass-formula', () => {
    s.play(
      par(
        to(testTex, (n) => n.opacity(0), { duration: 0.22 }),
        showShortcut.to(1, { duration: 0.3 }),
        delay(
          to(shortTex, (n) => n.opacity(1), { duration: 0.35 }),
          0.24,
        ),
      ),
    );
  });
  c.on('general-root', () => {
    s.play(
      par(
        to(quadTex, (n) => n.opacity(0), { duration: 0.22 }),
        showGeneral.to(1, { duration: 0.3 }),
        delay(
          to(genTex, (n) => n.opacity(1), { duration: 0.35 }),
          0.24,
        ),
      ),
    );
  });
  c.on('compare-runs', () => {
    s.play(
      par(
        to(shortTex, (n) => n.opacity(0), { duration: 0.22 }),
        to(genTex, (n) => n.opacity(0), { duration: 0.22 }),
        actCompare.to(1, { duration: 0.55 }),
      ),
    );
  });
  tweenCue(s, c, 'floor-ask', pulseFloor, 1, { duration: 0.4 });
  tweenCue(s, c, 'bound-fifty', showB50, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'bound-thousand', showB1000, 1, { duration: 0.45, after: true });
  tweenCue(s, c, 'interval-scope', showSided, 1, { duration: 0.45 });
}
