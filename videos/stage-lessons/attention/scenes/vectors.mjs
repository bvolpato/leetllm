// Scene 2: vectors: "Every word asks, answers, and carries"
// Full-bleed token state splits 3 ways through W_Q, W_K, W_V -> asymmetry demonstration
// -> luminous Q/K/V geometric plane with q_sing, k_Birds, k_sing arrows.
import { arrow, group } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
} from '../../cinematic-kit.mjs';
import {
  K,
  Q,
  ROLE,
  arcPts,
  cinemaAtmosphere,
  glowVector,
  lumBar,
  playCue,
  vecTrim,
  vectorPlane,
} from '../parts.mjs';

export default function vectors(s, c) {
  const title = heroTitle(['Three roles,', 'one token state'], {
    x: -850,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.query,
  });

  // Left side: token state x -> three glowing projection conduits (W_Q, W_K, W_V)
  const stateX = -760;
  const stateY = 40;
  const matX = -465;
  const outX = -170;
  const laneYs = [-125, 40, 205];
  const laneCols = [ROLE.query, ROLE.birds, ROLE.value];
  const laneNames = ['Query  q', 'Key  k', 'Value  v'];
  const laneJobs = ['asks what it needs', 'answers who it is', 'carries its content'];
  const matLabels = ['W_Q', 'W_K', 'W_V'];

  const qLit = s.value(0.25);
  const kLit = s.value(0.25);
  const vLit = s.value(0.25);
  const flowProg = s.value(0.12);
  const asymVis = s.value(0);

  // Right side: luminous 2D geometric plane (visible quietly from start, comes alive in beat 3)
  const plane = vectorPlane({
    originX: 225,
    originY: 300,
    scale: 350,
    xMin: -0.15,
    xMax: 1.25,
    yMin: -0.15,
    yMax: 1.2,
    step: 0.5,
    xLabel: 'd₁',
    yLabel: 'd₂',
  });

  const qVecGrow = s.value(0);
  const kbVecGrow = s.value(0);
  const ksVecGrow = s.value(0);
  const coordsVis = s.value(0);

  const stageVis = s.value(1);

  const projectionLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const lits = [qLit.value, kLit.value, vLit.value];
    const fp = flowProg.value;

    // Input token state anchor
    nodes.push(
      lumBar(stateX, stateY, 214, 124, {
        color: COSMOS.ink,
        fillOpacity: 0.14,
        strokeWidth: 2.2,
        glow: 6,
        opacity: alpha,
      }),
      txt('state x', stateX, stateY - 24, 30, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('Birds [1,0]', stateX, stateY + 24, 26, ROLE.birds, 'mono', 'center').opacity(
        (0.35 + 0.65 * fp) * alpha,
      ),
      txt('sing  [0,1]', stateX, stateY + 108, 26, ROLE.sing, 'mono', 'center').opacity(
        (0.25 + 0.75 * fp) * alpha,
      ),
    );

    // Three projection paths
    laneYs.forEach((ly, i) => {
      const lit = lits[i];
      const col = laneCols[i];
      // Conduit from state -> matrix
      const p0 = [stateX + 112, stateY];
      const p1 = [matX - 72, ly];
      const pts = arcPts(p0, p1, i === 0 ? -45 : i === 2 ? 45 : 0, 20);
      const nPts = Math.max(2, Math.round(pts.length * Math.min(1, 0.35 + fp * 0.65)));
      nodes.push(
        glowingTrail(pts.slice(0, nPts), {
          color: col,
          width: 2.5 + lit * 2,
          glow: 4 + lit * 8,
          core: lit > 0.5,
          opacity: (0.28 + 0.72 * lit) * alpha,
        }),
      );

      // Learned matrix gate
      nodes.push(
        lumBar(matX, ly, 128, 74, {
          color: col,
          fillOpacity: 0.14 + 0.26 * lit,
          strokeWidth: 2 + lit,
          glow: 4 + lit * 8,
          opacity: (0.4 + 0.6 * lit) * alpha,
        }),
        txt(matLabels[i], matX, ly, 30, col, 'mono', 'center').opacity((0.5 + 0.5 * lit) * alpha),
      );

      // Output beam -> role label
      nodes.push(
        arrow([matX + 70, ly], [outX - 115, ly], {
          stroke: col,
          width: 2.6 + lit * 1.4,
          tip: 13,
        }).opacity((0.35 + 0.65 * lit) * alpha),
        txt(laneNames[i], outX, ly - 18, 32, col, 'sans', 'center').opacity(
          (0.35 + 0.65 * lit) * alpha,
        ),
        txt(laneJobs[i], outX, ly + 22, 26, COSMOS.muted, 'sans', 'center').opacity(
          (0.25 + 0.75 * lit) * alpha,
        ),
      );
    });

    // Asymmetry banner at bottom-left when explaining why three matrices
    const av = asymVis.value;
    if (av > 0.05) {
      nodes.push(
        txt(
          'score(Birds → sing) ≠ score(sing → Birds)',
          -470,
          385,
          30,
          ROLE.query,
          'mono',
          'center',
        )
          .glow(6, ROLE.query)
          .opacity(av * alpha),
      );
    }

    return nodes;
  });

  // Dynamic vectors on the right plane
  const vectorLayer = guardedDynamic(stageVis, (alpha) => {
    const nodes = [];
    const origin = plane.origin;
    const cv = coordsVis.value;

    // Helper to draw scaled glowing arrow with non-overlapping label
    const drawV = (vec, grow, col, label, lblX, lblY, anchor = 'left') => {
      if (grow < 0.03) return;
      const tip = plane.toScreen(vec[0] * grow, vec[1] * grow);
      nodes.push(
        glowVector(origin, tip, { color: col, width: 5.5, tipSize: 18, glow: 11, opacity: alpha }),
      );
      if (grow > 0.9) {
        const textVal = cv > 0.5 ? `${label} ${vecTrim(vec)}` : label;
        nodes.push(txt(textVal, lblX, lblY, 30, col, 'mono', anchor).glow(5, col).opacity(alpha));
      }
    };

    drawV(Q[1], qVecGrow.value, ROLE.query, 'q_sing', 505, -285, 'left');
    drawV(K[0], kbVecGrow.value, ROLE.birds, 'k_Birds', 505, -230, 'left');
    drawV(K[1], ksVecGrow.value, ROLE.sing, 'k_sing', 505, -175, 'left');

    return nodes;
  });

  const trainNote = txt('learned during training', matX, -230, 28, ROLE.amber, 'mono', 'center');
  const planeHint = glowTex('q, k \\in \\mathbb{R}^2', {
    x: 560,
    y: -350,
    size: 40,
    color: ROLE.sing,
  });

  s.add(cinemaAtmosphere(ROLE.query, ROLE.birds), title, plane.node, projectionLayer, vectorLayer);

  // Beat 0: Query, Key, Value roles light up in sequence
  playCue(s, c, 'query', (d) => s.play(qLit.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'key', (d) => s.play(kLit.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'value', (d) => s.play(vLit.to(1, { duration: d })), { dur: 0.55 });

  // Beat 1: Token state -> project through W_Q, W_K, W_V -> learned during training
  playCue(s, c, 'state', (d) => s.play(flowProg.to(0.45, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'project', (d) => s.play(flowProg.to(1, { duration: d })), { dur: 0.8 });
  c.show('training', trainNote);

  // Beat 2: Why three? Asymmetric scoring + distinct value channel
  playCue(
    s,
    c,
    'why-three',
    (d) => s.play(qLit.to(0.7, { duration: d }), kLit.to(0.7, { duration: d })),
    {
      dur: 0.4,
    },
  );
  playCue(s, c, 'same-both', (d) => s.play(asymVis.to(1, { duration: d })), { dur: 0.6 });
  playCue(
    s,
    c,
    'separate',
    (d) => s.play(qLit.to(1, { duration: d }), kLit.to(1, { duration: d })),
    {
      dur: 0.5,
    },
  );
  playCue(s, c, 'hands-over', (d) => s.play(vLit.to(1, { duration: d })), { dur: 0.5 });

  // Beat 3: Draw q_sing, k_Birds, k_sing on the glowing plane
  c.show('numbers', planeHint);
  playCue(
    s,
    c,
    'query-arrow',
    (d) => s.play(qVecGrow.to(1, { duration: d }), coordsVis.to(1, { duration: d })),
    {
      dur: 0.75,
    },
  );
  playCue(s, c, 'birds-key', (d) => s.play(kbVecGrow.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'sing-key', (d) => s.play(ksVecGrow.to(1, { duration: d })), { dur: 0.7 });
}
