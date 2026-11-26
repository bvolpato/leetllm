// Scene 4: bellman - "Work backward from the next state"
// Left: Radiant MDP constellation with animated backward Bellman photon waves.
// Right: Glowing MathJax Bellman equation above luminous Q-value bars, switching smoothly
//        from New request (Approve -120, Evidence 59, Review 54) to Evidence ready (70 vs 62).
import {
  COSMOS,
  REWARD,
  ROLE,
  cinemaAtmosphere,
  drawMdpConstellation,
  glowTex,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  returns,
  rule,
  swapVis,
  txt,
} from '../parts.mjs';

export default function bellman(s, c) {
  const title = heroTitle(['Work backward from', 'the next state'], {
    x: -855,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.gold,
  });

  const eqBellman = glowTex('Q(s, a) = \\mathbb{E}[r + \\gamma V(s^\\prime)]', {
    x: 495,
    y: -355,
    size: 38,
    color: ROLE.gold,
    glow: 7,
  });

  // Left constellation state
  const hiNode = s.value(0); // 1=new, 2=closed
  const activeEvid = s.value(0);
  const waveEvid = s.value(-0.1);
  const waveRev = s.value(-0.1);

  // Right view switching: New-state Q bars -> Evidence-ready Q bars
  const vNew = s.value(1);
  const vEvid = s.value(0);

  // New-state reveals (strictly after spoken cues!)
  const rApprove = s.value(0);
  const rEvid = s.value(0);
  const rRev = s.value(0);
  const rGreedy = s.value(0);

  // Evidence-ready reveals (strictly after spoken cues!)
  const eApprove = s.value(0);
  const eRev = s.value(0);
  const showPolicy = s.value(0);

  const mdpLayer = guardedDynamic(
    () => 1,
    (alpha) => {
      const waves = [];
      if (waveEvid.value >= 0 && waveEvid.value <= 1) {
        waves.push({
          from: 'evidence',
          to: 'new',
          lift: -75,
          color: ROLE.evidence,
          t: waveEvid.value,
        });
      }
      if (waveRev.value >= 0 && waveRev.value <= 1) {
        waves.push({ from: 'review', to: 'new', lift: 75, color: ROLE.review, t: waveRev.value });
      }

      const active = activeEvid.value > 0.5 ? 'evidence' : 'new';
      const hi = hiNode.value > 1.5 ? 'closed' : hiNode.value > 0.5 ? 'new' : null;
      const vals = {};
      if (rEvid.value > 0.5) vals.new = String(returns.evidence);
      if (eApprove.value > 0.5) vals.evidence = String(REWARD.evidence);
      if (rRev.value > 0.5) vals.review = String(REWARD.review);
      if (hiNode.value > 1.5) vals.closed = '0';

      const g = drawMdpConstellation({
        cx: -350,
        cy: 65,
        rx: 325,
        ry: 215,
        nodeR: 62,
        values: vals,
        activeNode: active,
        highlightNode: hi,
        backwardWaves: waves,
        alpha,
      });
      return [...g.nodes, rule(145, -260, 145, 420, COSMOS.rule, 1.8).opacity(0.6 * alpha)];
    },
  );

  // Right Phase A: Q(New request, a)
  const newBars = guardedDynamic(vNew, (alpha) => {
    const nodes = [
      txt('Q(New request, action)', 500, -230, 32, ROLE.state, 'mono', 'center').opacity(alpha),
    ];
    const items = [
      {
        y: -110,
        name: 'Approve',
        val: returns.approve,
        vis: rApprove.value,
        col: ROLE.approve,
        barLen: 210,
        neg: true,
      },
      {
        y: 35,
        name: 'Ask for proof',
        val: returns.evidence,
        vis: rEvid.value,
        col: ROLE.evidence,
        barLen: 235,
        best: rGreedy.value > 0.5,
      },
      {
        y: 180,
        name: 'Human review',
        val: returns.review,
        vis: rRev.value,
        col: ROLE.review,
        barLen: 215,
      },
    ];

    items.forEach((it) => {
      nodes.push(
        txt(it.name, 200, it.y, 32, it.col, 'sans', 'left')
          .glow(it.best ? 9 : 0, it.col)
          .opacity(alpha),
      );
      if (it.vis > 0.05) {
        const w = it.barLen * it.vis;
        nodes.push(
          lumBar(485 + w / 2, it.y, w, 34, {
            color: it.col,
            fillOpacity: it.best ? 0.5 : 0.3,
            strokeWidth: it.best ? 3.4 : 2.2,
            glow: it.best ? 12 : 6,
            opacity: it.vis * alpha,
          }),
          txt(
            String(it.val),
            485 + w + 58,
            it.y,
            36,
            it.best ? ROLE.gold : it.col,
            'mono',
            'center',
          )
            .glow(it.best ? 9 : 5, it.best ? ROLE.gold : it.col)
            .opacity(it.vis * alpha),
        );
      } else {
        nodes.push(txt('?', 505, it.y, 34, COSMOS.dim, 'mono', 'center').opacity(alpha));
      }
    });

    if (rGreedy.value > 0.05) {
      nodes.push(
        txt('Best move: Ask (59)', 500, 320, 30, ROLE.gold, 'serif', 'center')
          .glow(7, ROLE.gold)
          .opacity(rGreedy.value * alpha),
      );
    }

    return nodes;
  });

  // Right Phase B: Q(Evidence ready, a)
  const evidBars = guardedDynamic(vEvid, (alpha) => {
    const nodes = [
      txt('Q(Evidence ready, action)', 500, -230, 32, ROLE.evidence, 'mono', 'center').opacity(
        alpha,
      ),
    ];
    const items = [
      {
        y: -105,
        name: 'Approve now',
        expr: 'Immediate',
        val: REWARD.evidence,
        vis: eApprove.value,
        col: ROLE.evidence,
        barLen: 260,
        best: true,
      },
      {
        y: 65,
        name: 'Send to review',
        expr: '-10 + 0.9 × 80',
        val: returns.evidenceReadyHuman,
        vis: eRev.value,
        col: ROLE.review,
        barLen: 230,
      },
    ];

    items.forEach((it) => {
      nodes.push(
        txt(it.name, 200, it.y - 12, 32, it.col, 'sans', 'left').opacity(alpha),
        txt(it.expr, 200, it.y + 30, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
      );
      if (it.vis > 0.05) {
        const w = it.barLen * it.vis;
        nodes.push(
          lumBar(495 + w / 2, it.y, w, 36, {
            color: it.col,
            fillOpacity: it.best ? 0.48 : 0.3,
            strokeWidth: it.best ? 3.2 : 2.2,
            glow: it.best ? 11 : 6,
            opacity: it.vis * alpha,
          }),
          txt(String(it.val), 495 + w + 54, it.y, 38, it.col, 'mono', 'center')
            .glow(7, it.col)
            .opacity(it.vis * alpha),
        );
      } else {
        nodes.push(txt('?', 515, it.y, 34, COSMOS.dim, 'mono', 'center').opacity(alpha));
      }
    });

    if (eRev.value > 0.05) {
      nodes.push(
        txt(
          `70 > ${returns.evidenceReadyHuman}  →  V*(Evidence ready) = 70`,
          500,
          215,
          30,
          ROLE.evidence,
          'mono',
          'center',
        )
          .glow(6, ROLE.evidence)
          .opacity(eRev.value * alpha),
      );
    }

    if (showPolicy.value > 0.05) {
      nodes.push(
        txt('Fixed policy: average  ·  Optimal: max', 500, 320, 30, ROLE.gold, 'serif', 'center')
          .glow(6, ROLE.gold)
          .opacity(showPolicy.value * alpha),
      );
    }

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.evidence), title, eqBellman, mdpLayer, newBars, evidBars);

  playCue(s, c, 'value', (d) => s.play(hiNode.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'approve-value', (d) => s.play(rApprove.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'evidence-backup', (d) => s.play(waveEvid.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'evidence-value', (d) => s.play(rEvid.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'review-backup', (d) => s.play(waveRev.to(1, { duration: d })), { dur: 1.0 });
  playCue(s, c, 'review-value', (d) => s.play(rRev.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'greedy', (d) => s.play(rGreedy.to(1, { duration: d })), { dur: 0.45 });

  playCue(
    s,
    c,
    'successor',
    (d) => s.play(activeEvid.to(1, { duration: Math.min(0.4, d) }), swapVis(vNew, vEvid, d)),
    { dur: 0.7 },
  );
  playCue(s, c, 'supported-approval', (d) => s.play(eApprove.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'successor-result', (d) => s.play(eRev.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'policy', (d) => s.play(showPolicy.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'terminal', (d) => s.play(hiNode.to(2, { duration: d })), { dur: 0.45 });
}
