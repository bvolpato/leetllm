// Scene 02 (dependency-graph): "Edges describe readiness"
// Full-bleed luminous 2D DAG + state-machine cycle arc paired with orbiting 3D DAG rig.
import {
  COSMOS,
  ROLE,
  buildOrchestrationDag3d,
  cinemaAtmosphere,
  conduitPts,
  glowArrow,
  glowDot,
  glowRing,
  glowingArc,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  renderStation,
  rule,
  runAmbientPhase,
  samplePolyline,
  tweenCue,
  txt,
} from '../parts.mjs';

export default function dependencyGraph(s, c) {
  const phase = s.value(0);
  const dagStage = s.value(0.2);

  // Beat 0: DAG basics
  const nodesLit = s.value(0);
  const arrowsLit = s.value(0);
  const branchesLit = s.value(0);
  const mergeLit = s.value(0);
  const noBackLit = s.value(0);
  const dagBadge = s.value(0);

  // Beat 1: Node implementation roles (code / DB / model / validator)
  const kindCode = s.value(0);
  const kindDb = s.value(0);
  const kindModel = s.value(0);
  const specialistLit = s.value(0);
  const validatorLit = s.value(0);

  // Beat 2: Pause, internal retry, explicit state-machine cycle vs cancel
  const pauseLit = s.value(0);
  const retryLit = s.value(0);
  const cycleLit = s.value(0);
  const stateMachineLit = s.value(0);
  const cancelLit = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.triage, ROLE.merge);
  const { view: dag3d } = buildOrchestrationDag3d(phase, dagStage, {
    x: 560,
    y: 45,
    theta: -0.78,
    phi: 1.06,
    distance: 15.8,
    unit: 94,
    showCycle: true,
  });

  const title = heroTitle(['Edges Describe', 'Readiness'], {
    x: -860,
    y: -440,
    size: 54,
    lineHeight: 62,
    accent: ROLE.triage,
    eyebrow: 'DEPENDENCY GRAPH  VS  STATE MACHINE',
  });

  // Left-center 2D DAG coordinates with generous vertical spacing so strokes never cross labels
  const pos = {
    triage: [-775, 10],
    eval: [-465, -165],
    health: [-465, 10],
    policy: [-465, 185],
    merge: [-155, 10],
    review: [115, 10],
    cancel: [115, 225],
  };

  const live = guardedDynamic(s.value(1), () => {
    const ph = phase.value;
    const nLit = nodesLit.value;
    const aLit = arrowsLit.value;
    const bLit = branchesLit.value;
    const mLit = mergeLit.value;
    const cyc = cycleLit.value;
    const sm = stateMachineLit.value;
    const can = cancelLit.value;
    const nodes = [];

    // Right 3D header & mode indicator
    nodes.push(
      txt('3D CONTROL FLOW', 560, -420, 26, ROLE.eval, 'mono').glow(6, ROLE.eval),
      txt(
        sm > 0.4 ? 'Read DAG wrapped in Review Cycle' : 'Forward-only Read DAG',
        560,
        -375,
        26,
        sm > 0.4 ? ROLE.reject : COSMOS.muted,
        'sans',
      ),
    );

    // 2D DAG edges (routed edge-to-edge between station rings, radius = 26)
    const edges = [
      [pos.triage, pos.eval, ROLE.eval, Math.max(aLit, bLit)],
      [pos.triage, pos.health, ROLE.health, Math.max(aLit, bLit)],
      [pos.triage, pos.policy, ROLE.policy, Math.max(aLit, bLit)],
      [pos.eval, pos.merge, ROLE.eval, Math.max(aLit, mLit)],
      [pos.health, pos.merge, ROLE.health, Math.max(aLit, mLit)],
      [pos.policy, pos.merge, ROLE.policy, Math.max(aLit, mLit)],
      [pos.merge, pos.review, ROLE.merge, Math.max(aLit, mLit)],
    ];
    edges.forEach(([from, to, col, hot], idx) => {
      const p0 = [from[0] + 30, from[1]];
      const p1 = [to[0] - 30, to[1]];
      const pts = conduitPts(p0, p1, 18);
      nodes.push(
        glowingTrail(pts, {
          color: hot > 0.4 ? col : COSMOS.dim,
          width: hot > 0.4 ? 3.8 : 2.4,
          glow: hot > 0.4 ? 9 : 2,
          opacity: hot > 0.4 ? 0.92 : 0.55,
          core: false,
        }),
      );
      // Animated readiness pulse moving strictly left-to-right
      const [px, py] = samplePolyline(pts, (ph * 0.25 + idx * 0.14) % 1);
      nodes.push(glowDot(px, py, { radius: 5, color: col, glow: 10 }));
    });

    // Optional Reviewer Rejection -> Cancel path (Beat 2)
    if (can > 0.02) {
      nodes.push(
        glowArrow(
          [pos.review[0], pos.review[1] + 34],
          [pos.cancel[0], pos.cancel[1] - 32],
          ROLE.muted,
          {
            width: 3.4,
            glow: 6,
            opacity: can,
          },
        ),
        ...renderStation(pos.cancel[0], pos.cancel[1], 'CANCEL', COSMOS.muted, {
          radius: 22,
          active: true,
          labelOffset: 44,
          opacity: can,
        }),
      );
    }

    // Optional Review -> Merge explicit cycle arc above the graph (Beat 2)
    if (cyc > 0.02) {
      nodes.push(
        glowingArc([pos.review[0], pos.review[1] - 34], [pos.merge[0], pos.merge[1] - 34], -170, {
          color: ROLE.reject,
          width: 4.0,
          glow: 11,
          opacity: cyc,
        }),
        txt('re-review cycle (optional)', -20, -210, 26, ROLE.reject, 'mono')
          .glow(7, ROLE.reject)
          .opacity(cyc),
      );
    }

    // Internal node retry ring around Health (stays acyclic!)
    if (retryLit.value > 0.02) {
      nodes.push(
        glowRing(pos.health[0], pos.health[1], 42, ROLE.mark, {
          width: 3.0,
          glow: 10,
          dash: [8, 6],
          opacity: retryLit.value,
        }),
      );
    }

    // Pause halo around Review (pause != cycle)
    if (pauseLit.value > 0.02) {
      nodes.push(
        glowRing(pos.review[0], pos.review[1], 44, ROLE.eval, {
          width: 3.2,
          glow: 10,
          dash: [10, 8],
          opacity: pauseLit.value,
        }),
      );
    }

    // Stations with dynamic role tags
    const evalSub = specialistLit.value > 0.4 || kindModel.value > 0.4 ? 'model specialist' : null;
    const healthSub = kindCode.value > 0.4 ? 'ordinary code' : null;
    const policySub = kindDb.value > 0.4 ? 'database read' : null;
    const mergeSub = validatorLit.value > 0.4 ? 'deterministic check' : null;

    nodes.push(
      ...renderStation(pos.triage[0], pos.triage[1], 'TRIAGE', ROLE.triage, {
        radius: 26,
        active: nLit > 0.4 || bLit > 0.4,
        labelPos: 'above',
        labelOffset: 54,
      }),
      ...renderStation(pos.eval[0], pos.eval[1], 'EVAL', ROLE.eval, {
        radius: 26,
        active: bLit > 0.4 || kindModel.value > 0.4 || specialistLit.value > 0.4,
        labelPos: 'above',
        labelOffset: 54,
        sub: evalSub,
      }),
      ...renderStation(pos.health[0], pos.health[1], 'HEALTH', ROLE.health, {
        radius: 26,
        active: bLit > 0.4 || kindCode.value > 0.4 || retryLit.value > 0.4,
        labelPos: 'below',
        labelOffset: 70,
        sub: healthSub,
      }),
      ...renderStation(pos.policy[0], pos.policy[1], 'POLICY', ROLE.policy, {
        radius: 26,
        active: bLit > 0.4 || kindDb.value > 0.4,
        labelPos: 'below',
        labelOffset: 54,
        sub: policySub,
      }),
      ...renderStation(
        pos.merge[0],
        pos.merge[1],
        'MERGE',
        validatorLit.value > 0.4 ? ROLE.pass : ROLE.merge,
        {
          radius: 28,
          active: mLit > 0.4 || validatorLit.value > 0.4,
          labelPos: 'below',
          labelOffset: 56,
          sub: mergeSub,
        },
      ),
      ...renderStation(pos.review[0], pos.review[1], 'REVIEW', ROLE.review, {
        radius: 26,
        active: pauseLit.value > 0.4 || cyc > 0.4,
        labelPos: 'right',
        labelOffset: 56,
      }),
    );

    // Bottom floating status bar (mutually exclusive text phases via opacity, zero overlap!)
    const footY = 365;
    nodes.push(rule(-860, footY - 30, 860, footY - 30, ROLE.rule, 2));

    let caption = 'Nodes = operations   |   Arrows = readiness prerequisites';
    let capCol = COSMOS.muted;
    if (can > 0.4) {
      caption = 'Article default: reject -> Cancel';
      capCol = ROLE.eval;
    } else if (sm > 0.4) {
      caption = 'Explicit back-edge makes outer control flow a State Machine around the read DAG';
      capCol = ROLE.reject;
    } else if (retryLit.value > 0.4) {
      caption = 'Internal node retry keeps outer graph acyclic';
      capCol = ROLE.mark;
    } else if (pauseLit.value > 0.4) {
      caption = 'Pausing at Review waits for input without creating a cycle';
      capCol = ROLE.eval;
    } else if (kindCode.value > 0.4 || validatorLit.value > 0.4) {
      caption = 'Code, DB read, model specialist, or deterministic validator';
      capCol = validatorLit.value > 0.4 ? ROLE.pass : ROLE.eval;
    } else if (dagBadge.value > 0.4 || noBackLit.value > 0.4) {
      caption = 'No path leads back to an earlier node -> Directed Acyclic Graph (DAG)';
      capCol = ROLE.mark;
    }

    nodes.push(txt(caption, -860, footY + 14, 28, capCol, 'sans', 'left'));

    return nodes;
  });

  s.add(bgAtmo, dag3d, title, live);
  runAmbientPhase(s, c, phase, 2.2);
  orbitScene(s, c, dag3d, { theta: 0.25, phi: 0.98 });

  // Beat 0
  tweenCue(s, c, 'nodes', nodesLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'arrows', arrowsLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'read-branches', branchesLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'merge-ready', mergeLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'no-path-back', noBackLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'dag', dagBadge, 1, { duration: 0.35 });

  // Beat 1
  tweenCue(s, c, 'operation-node', kindCode, 1, { duration: 0.35 });
  tweenCue(s, c, 'kind-database', kindDb, 1, { duration: 0.35 });
  tweenCue(s, c, 'kind-model', kindModel, 1, { duration: 0.35 });
  tweenCue(s, c, 'model-specialist', specialistLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'deterministic-merge', validatorLit, 1, { duration: 0.35, after: true });

  // Beat 2
  tweenCue(s, c, 'pause', pauseLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'retry-inside', retryLit, 1, { duration: 0.35 });
  c.on('review-cycle', () => {
    s.play(cycleLit.to(1, { duration: 0.4 }), dagStage.to(1, { duration: 0.4 }));
  });
  tweenCue(s, c, 'state-machine', stateMachineLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'review-cancel', cancelLit, 1, { duration: 0.35 });
}
