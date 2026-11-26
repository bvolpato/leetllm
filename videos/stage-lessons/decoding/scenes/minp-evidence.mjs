// Scene 20: minp-evidence: "How would you compare min-p with top-p?"
// View 1 (Beat 0): Quality-vs-variety Pareto frontier comparing top-p and min-p curves,
//   revealing the reanalysis finding (overlapping frontiers, no reliable gain) AFTER dec-minp-finding.
// View 2 (Beat 1): Controlled A/B comparison tracks holding prompts, checkpoint, tuning budget,
//   and coherence/variety judges identical across top-p and min-p.
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import { ROLE, cinemaAtmosphere, lumBar, playCue, swapVis } from '../parts.mjs';

export default function minpEvidence(s, c) {
  const title = heroTitle(['How would you compare', 'min-p with top-p?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.active,
  });

  const vCurve = s.value(1);
  const vProtocol = s.value(0);

  const showReanalysis = s.value(0);
  const showFinding = s.value(0);
  const protoSweep = s.value(1);

  // VIEW 1: Motivation + Quality-Variety Frontier
  const curveLayer = guardedDynamic(vCurve, (alpha) => {
    const nodes = [];
    const rean = showReanalysis.value;
    const find = showFinding.value;

    // Left: Motivation vs Reanalysis takeaway
    nodes.push(
      txt('Motivation (Nguyen et al.)', -845, -195, 32, ROLE.heat, 'mono', 'left').opacity(alpha),
      txt(
        'High temperature lifts rare tail words into the pool.',
        -845,
        -135,
        30,
        COSMOS.ink,
        'serif',
        'left',
      ).opacity(alpha),
      txt(
        'Min-p trims tail tokens relative to the peak.',
        -845,
        -80,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );

    if (rean > 0.1) {
      nodes.push(
        txt(
          'Controlled reanalysis (Schaeffer et al.)',
          -845,
          55,
          32,
          ROLE.active,
          'mono',
          'left',
        ).opacity(rean * alpha),
        txt(
          find > 0.4
            ? 'No reliable quality/variety gain.'
            : 'Compare tuned frontiers head-to-head...',
          -845,
          120,
          30,
          find > 0.4 ? ROLE.winner : COSMOS.muted,
          'serif',
          'left',
        )
          .glow(find > 0.4 ? 6 : 0, ROLE.winner)
          .opacity(rean * alpha),
      );
    }

    // Right: Quality vs Variety luminous frontier plot
    const x0 = 135;
    const y0 = 235;
    const pw = 640;
    const ph = 420;
    nodes.push(
      arrow([x0, y0], [x0 + pw + 24, y0], { stroke: '#556894', width: 2.8, tip: 12 }).opacity(
        alpha,
      ),
      arrow([x0, y0], [x0, y0 - ph - 20], { stroke: '#556894', width: 2.8, tip: 12 }).opacity(
        alpha,
      ),
      txt('Variety (diversity)', x0 + pw / 2, y0 + 54, 28, COSMOS.muted, 'mono', 'center').opacity(
        alpha,
      ),
      txt('Quality', x0, y0 - ph - 46, 28, COSMOS.muted, 'mono', 'center').opacity(alpha),
    );

    const topPPts = [];
    const minPPts = [];
    for (let i = 0; i <= 28; i++) {
      const t = i / 28;
      const vx = x0 + 40 + t * (pw - 80);
      const qTop = 0.86 - 0.56 * Math.pow(t, 1.55);
      const qMin = 0.85 - 0.55 * Math.pow(t, 1.52) + 0.012 * Math.sin(t * Math.PI * 2);
      topPPts.push([vx, y0 - qTop * ph]);
      minPPts.push([vx, y0 - qMin * ph]);
    }

    nodes.push(
      glowingTrail(topPPts, { color: ROLE.base, width: 4.8, glow: 10, opacity: alpha }),
      glowDot(topPPts[12][0], topPPts[12][1], {
        radius: 7,
        color: ROLE.base,
        glow: 10,
        opacity: alpha,
      }),
      txt('top-p frontier', x0 + pw - 20, y0 - ph + 35, 28, ROLE.base, 'mono', 'right').opacity(
        alpha,
      ),
    );

    if (rean > 0.15) {
      nodes.push(
        glowingTrail(minPPts, {
          color: ROLE.active,
          width: 4.5,
          glow: 10,
          opacity: rean * alpha,
        }),
        glowDot(minPPts[16][0], minPPts[16][1], {
          radius: 7,
          color: ROLE.active,
          glow: 10,
          opacity: rean * alpha,
        }),
        txt('min-p frontier', x0 + pw - 20, y0 - ph + 82, 28, ROLE.active, 'mono', 'right').opacity(
          rean * alpha,
        ),
      );
    }

    nodes.push(
      txt(
        'Test on your own prompts before assuming a universal sampler win.',
        0,
        395,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2: Matched-control comparison rails (Top-p vs Min-p)
  const protocolLayer = guardedDynamic(vProtocol, (alpha) => {
    const nodes = [];
    const nRows = Math.round(Math.max(1, Math.min(4, protoSweep.value)));

    const rows = [
      { axis: 'Prompts', val: 'Same held-out writing prompts', col: ROLE.base },
      { axis: 'Model', val: 'Same checkpoint & template', col: ROLE.active },
      { axis: 'Tuning', val: 'Same hyperparameter budget', col: ROLE.valid },
      { axis: 'Judges', val: 'Same coherence + variety rubric', col: ROLE.winner },
    ];

    nodes.push(
      txt('Top-p', -45, -245, 40, ROLE.base, 'mono', 'center').glow(6, ROLE.base).opacity(alpha),
      txt('Min-p', 525, -245, 40, ROLE.active, 'mono', 'center')
        .glow(6, ROLE.active)
        .opacity(alpha),
    );

    rows.forEach((r, i) => {
      const y = -125 + i * 124;
      const lit = i < nRows;
      const la = (lit ? 1 : 0.28) * alpha;
      nodes.push(
        txt(r.axis, -830, y, 32, r.col, 'mono', 'left').opacity(la),
        lumBar(-45, y, 500, 74, {
          color: ROLE.base,
          fillOpacity: 0.18,
          strokeWidth: 2.2,
          glow: 7,
          radius: 12,
          opacity: la,
        }),
        txt(r.val, -45, y, 26, COSMOS.ink, 'sans', 'center').opacity(la),
        lumBar(525, y, 500, 74, {
          color: ROLE.active,
          fillOpacity: 0.18,
          strokeWidth: 2.2,
          glow: 7,
          radius: 12,
          opacity: la,
        }),
        txt(r.val, 525, y, 26, COSMOS.ink, 'sans', 'center').opacity(la),
      );
    });

    nodes.push(
      txt(
        'Compare per-prompt differences and variance across repeated drafts.',
        0,
        390,
        30,
        ROLE.winner,
        'serif',
        'center',
      )
        .glow(6, ROLE.winner)
        .opacity(alpha),
    );
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.base, ROLE.active), title, curveLayer, protocolLayer);

  playCue(s, c, 'dec-minp-evidence-1', (d) => s.play(showReanalysis.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'dec-minp-finding', (d) => s.play(showFinding.to(1, { duration: d })), {
    after: false,
    offset: 0.4,
    dur: 0.55,
  });

  c.onBeat(1, () => s.play(swapVis(vCurve, vProtocol, 0.55)));
  playCue(s, c, 'dec-minp-evidence-2', (d) => s.play(protoSweep.to(4, { duration: d })), {
    dur: 1.2,
  });
}
