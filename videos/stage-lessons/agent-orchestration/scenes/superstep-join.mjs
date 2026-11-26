// Scene 05 (superstep-join): "A scheduling barrier does not validate evidence"
// Orbiting 3D Pregel superstep barrier paired with 4 cleanly cross-swapped stages:
//   Stage 0: Superstep plan -> parallel snapshot execution -> atomic barrier apply -> next step
//   Stage 1: Scalar concurrent-update error vs list-add reducer vs Overwrite/attempt-aware/resume
//   Stage 2: Unequal-depth fan-in probe (waitingJoinTrace: 1 waiting edge vs 3 separate edges vs defer)
//   Stage 3: Ownership vs types, shallow MappingProxyType vs deepcopy, execution boundary
import {
  COSMOS,
  ROLE,
  buildSuperstepBarrier3d,
  cinemaAtmosphere,
  crossSwap,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  line,
  lumBar,
  orbitScene,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  waitingJoinTrace,
} from '../parts.mjs';

export default function superstepJoin(s, c) {
  const phase = s.value(0);
  const barrierStatus = s.value(0); // -1 reject, 0 barrier, +1 pass
  const st0 = s.value(1);
  const st1 = s.value(0);
  const st2 = s.value(0);
  const st3 = s.value(0);

  // Beat 0: Superstep mechanics
  const planLit = s.value(0);
  const execLit = s.value(0);
  const applyLit = s.value(0);
  const nextLit = s.value(0);

  // Beat 1: Channel semantics & recovery
  const scalarLit = s.value(0);
  const scalarErr = s.value(0);
  const agreeLit = s.value(0);
  const listLit = s.value(0);
  const nonCommLit = s.value(0);
  const dupLit = s.value(0);
  const emptyLit = s.value(0);
  const overwriteLit = s.value(0);
  const attemptLit = s.value(0);
  const resumeLit = s.value(0);
  const retryLit = s.value(0);

  // Beat 2: Unequal-depth fan-in (waitingJoinTrace)
  const probeLit = s.value(0);
  const waitingEdge = s.value(0);
  const sepEdges = s.value(0);
  const prepStep = s.value(0);
  const partialFire = s.value(0);
  const secondFire = s.value(0);
  const unselStall = s.value(0);
  const deferMode = s.value(0);
  const valSet = s.value(0);
  const relCase = s.value(0);
  const relRaise = s.value(0);
  const invFail = s.value(0);

  // Beat 3: Ownership, shallow proxy vs deepcopy, execution boundary
  const ownLit = s.value(0);
  const typesLit = s.value(0);
  const proxyLit = s.value(0);
  const nestedMut = s.value(0);
  const deepLit = s.value(0);
  const notSand = s.value(0);
  const boundLit = s.value(0);

  const traceT4 = waitingJoinTrace(4);
  const bgAtmo = cinemaAtmosphere(ROLE.merge, ROLE.eval);
  const { view: barrier3d } = buildSuperstepBarrier3d(phase, barrierStatus, {
    x: 520,
    y: 25,
    theta: -0.74,
    phi: 1.05,
    distance: 14.8,
    unit: 102,
  });

  const title = heroTitle(['A Scheduling Barrier', 'Does Not Validate'], {
    x: -860,
    y: -440,
    size: 52,
    lineHeight: 60,
    accent: ROLE.merge,
    eyebrow: 'LANGGRAPH SUPERSTEPS  /  REDUCERS & FAN-IN',
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = st0.value;
    const m1 = st1.value;
    const m2 = st2.value;
    const m3 = st3.value;
    const lx = -860;
    const nodes = [];

    // Right 3D header & steady caption (zero crossSwap flash)
    nodes.push(
      txt('3D SUPERSTEP BARRIER', 520, -420, 26, ROLE.merge, 'mono').glow(6, ROLE.merge),
      txt('3 parallel lanes -> 1 barrier plane', 520, -376, 26, COSMOS.muted, 'sans'),
      txt(
        `Barrier trace: ${traceT4.separateMerges.length} sep vs ${traceT4.waitingMerges.length} waiting`,
        520,
        395,
        26,
        COSMOS.muted,
        'sans',
      ),
    );

    // =========================================================================
    // STAGE 0: Superstep plan -> frozen S0 -> barrier apply -> S1
    // =========================================================================
    if (m0 > 0.02) {
      const sy = -195;
      nodes.push(
        txt(
          'PREGEL SUPERSTEP CYCLE',
          lx,
          sy,
          26,
          planLit.value > 0.3 ? ROLE.mark : ROLE.eval,
          'mono',
          'left',
        ).opacity(m0),
        rule(lx, sy + 24, 95, sy + 24, ROLE.rule, 2).opacity(m0),
      );

      // Snapshot S0 column
      nodes.push(
        lumBar(-770, 50, 150, 260, {
          color: ROLE.triage,
          fillOpacity: 0.16,
          strokeWidth: 2.6,
          glow: 8,
          opacity: m0,
        }),
        txt('S0', -770, 28, 36, COSMOS.ink, 'mono').opacity(m0),
        txt('frozen', -770, 72, 26, ROLE.triage, 'sans').opacity(m0),
      );

      // Three parallel worker bars
      const workers = [
        { name: 'Eval', y: -55, col: ROLE.eval },
        { name: 'Health', y: 50, col: ROLE.health },
        { name: 'Policy', y: 155, col: ROLE.policy },
      ];
      workers.forEach((w) => {
        nodes.push(
          glowArrow([-685, w.y], [-555, w.y], execLit.value > 0.3 ? w.col : COSMOS.dim, {
            width: 3.0,
            opacity: m0,
          }),
          lumBar(-430, w.y, 220, 62, {
            color: w.col,
            fillOpacity: execLit.value > 0.3 ? 0.28 : 0.12,
            strokeWidth: 2.6,
            glow: execLit.value > 0.3 ? 10 : 4,
            opacity: m0,
          }),
          txt(w.name, -430, w.y, 28, COSMOS.ink, 'mono').opacity(m0),
          glowArrow([-310, w.y], [-165, w.y], applyLit.value > 0.3 ? ROLE.merge : COSMOS.dim, {
            width: 3.0,
            opacity: m0,
          }),
        );
      });

      // Barrier vertical laser line + S1 output
      nodes.push(
        line([-145, -110], [-145, 210], {
          stroke: applyLit.value > 0.3 ? ROLE.merge : COSMOS.muted,
          width: applyLit.value > 0.3 ? 6 : 3,
        })
          .glow(10, ROLE.merge)
          .opacity(m0),
        txt('BARRIER', -145, -142, 26, ROLE.merge, 'mono').opacity(m0),
        glowArrow([-125, 50], [-35, 50], nextLit.value > 0.3 ? ROLE.pass : COSMOS.muted, {
          width: 3.4,
          opacity: m0,
        }),
        lumBar(45, 50, 145, 260, {
          color: nextLit.value > 0.3 ? ROLE.pass : ROLE.merge,
          fillOpacity: nextLit.value > 0.3 ? 0.24 : 0.1,
          strokeWidth: 2.6,
          glow: nextLit.value > 0.3 ? 11 : 4,
          opacity: m0,
        }),
        txt('S1', 45, 28, 36, COSMOS.ink, 'mono').opacity(m0),
        txt('3 receipts', 45, 72, 26, ROLE.pass, 'sans').opacity(m0),
      );

      nodes.push(
        txt(
          nextLit.value > 0.3
            ? 'Next step begins only after all 3 updates commit together'
            : 'Plan -> run branches on S0 -> apply updates atomically',
          lx,
          315,
          28,
          ROLE.eval,
          'sans',
          'left',
        ).opacity(m0),
      );
    }

    // =========================================================================
    // STAGE 1: Channel Reducers & Attempt Recovery
    // =========================================================================
    if (m1 > 0.02) {
      // Top track: Scalar channel error
      const y0 = -205;
      const err = scalarErr.value;
      nodes.push(
        txt(
          '1. DEFAULT SCALAR CHANNEL',
          lx,
          y0,
          26,
          scalarLit.value > 0.3 ? ROLE.mark : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
        rule(lx, y0 + 24, 100, y0 + 24, ROLE.rule, 2).opacity(m1),
        lumBar(-680, y0 + 76, 360, 56, {
          color: err > 0.3 ? ROLE.reject : ROLE.triage,
          fillOpacity: err > 0.3 ? 0.24 : 0.14,
          glow: err > 0.3 ? 11 : 4,
          opacity: m1,
        }),
        txt('2 writes -> same key', -680, y0 + 76, 26, COSMOS.ink, 'mono').opacity(m1),
        txt(
          agreeLit.value > 0.3
            ? 'INVALID_CONCURRENT_UPDATE (even if equal!)'
            : err > 0.3
              ? 'INVALID_CONCURRENT_UPDATE'
              : 'Single write replaces value',
          -470,
          y0 + 76,
          26,
          err > 0.3 ? ROLE.reject : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
      );

      // Middle track: List-add reducer
      const y1 = -40;
      nodes.push(
        txt(
          '2. LIST-ADD REDUCER  (operator.add)',
          lx,
          y1,
          26,
          listLit.value > 0.3 ? ROLE.eval : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m1),
        rule(lx, y1 + 24, 100, y1 + 24, ROLE.rule, 2).opacity(m1),
        txt(
          nonCommLit.value > 0.3
            ? '[A, B] != [B, A]  (not commutative)'
            : 'Concatenates branch lists',
          lx,
          y1 + 66,
          26,
          nonCommLit.value > 0.3 ? ROLE.policy : COSMOS.ink,
          'mono',
          'left',
        ).opacity(m1),
        txt(
          dupLit.value > 0.3 ? 'Keeps duplicates: [eval, eval]' : '',
          lx,
          y1 + 112,
          26,
          ROLE.reject,
          'mono',
          'left',
        ).opacity(m1 * dupLit.value),
        txt(
          emptyLit.value > 0.3 ? 'saved + [] -> saved stays intact' : '',
          -340,
          y1 + 112,
          26,
          ROLE.mark,
          'mono',
          'left',
        ).opacity(m1 * emptyLit.value),
      );

      // Bottom track: New attempt vs Resume same attempt (stacked cleanly with full width)
      const y2 = 145;
      nodes.push(
        txt('3. RETRY & ATTEMPT CONTROLS', lx, y2, 26, ROLE.pass, 'mono', 'left').opacity(m1),
        rule(lx, y2 + 24, 100, y2 + 24, ROLE.rule, 2).opacity(m1),
        lumBar(-380, y2 + 78, 960, 56, {
          color: overwriteLit.value > 0.3 || attemptLit.value > 0.3 ? ROLE.eval : COSMOS.rule,
          fillOpacity: 0.18,
          opacity: m1,
        }),
        txt(
          attemptLit.value > 0.3
            ? 'New attempt: fresh thread / Overwrite([]) / attempt-id'
            : 'New attempt: Overwrite([]) clears list',
          -380,
          y2 + 78,
          26,
          COSMOS.ink,
          'mono',
        ).opacity(m1),
        lumBar(-380, y2 + 154, 960, 56, {
          color: resumeLit.value > 0.3 || retryLit.value > 0.3 ? ROLE.pass : COSMOS.rule,
          fillOpacity: 0.18,
          opacity: m1,
        }),
        txt(
          retryLit.value > 0.3
            ? 'Resume same attempt: keep saved writes + retry failed'
            : 'Resume same attempt: keep saved writes',
          -380,
          y2 + 154,
          26,
          ROLE.pass,
          'mono',
        ).opacity(m1),
      );
    }

    // =========================================================================
    // STAGE 2: Unequal-Depth Fan-in (Waiting Edge vs Separate Edges vs Defer)
    // =========================================================================
    if (m2 > 0.02) {
      const tlX = -720;
      const scale = 145; // t=0..4 -> 580px (-720 to -140)
      const xT = (t) => tlX + t * scale;

      nodes.push(
        txt(
          relCase.value > 0.3
            ? 'REAL RELEASE VALIDATOR VS SCHEDULING PROBE'
            : 'UNEQUAL-DEPTH FAN-IN  (Health prep -> Health)',
          lx,
          -228,
          26,
          relCase.value > 0.3 ? ROLE.reject : ROLE.mark,
          'mono',
          'left',
        ).opacity(m2),
        rule(tlX, -142, xT(4.2), -142, COSMOS.muted, 2).opacity(m2),
      );
      for (let t = 0; t <= 4; t++) {
        nodes.push(
          txt(`t=${t}`, xT(t), -168, 26, COSMOS.muted, 'mono').opacity(m2),
          line([xT(t), -136], [xT(t), 140], {
            stroke: COSMOS.rule,
            width: 1.4,
            dash: [5, 7],
          }).opacity(m2 * 0.45),
        );
      }

      // 3 branch timelines
      const lanes = [
        { name: 'Policy', y: -92, end: 1, col: ROLE.policy },
        { name: 'Eval', y: -20, end: 2, col: ROLE.eval },
        { name: 'Health', y: 52, end: 4, col: ROLE.health, prep: 1 },
      ];
      lanes.forEach((l) => {
        nodes.push(txt(l.name, lx, l.y, 26, l.col, 'mono', 'left').opacity(m2));
        if (l.prep && prepStep.value > 0.3) {
          nodes.push(
            lumBar(xT(0.5), l.y, scale - 8, 48, {
              color: ROLE.health,
              fillOpacity: 0.25,
              dash: [6, 4],
              opacity: m2,
            }),
            txt('prep', xT(0.5), l.y, 26, COSMOS.ink, 'mono').opacity(m2),
            lumBar(xT(2.5), l.y, 3 * scale - 8, 48, {
              color: ROLE.health,
              fillOpacity: 0.42,
              opacity: m2,
            }),
            txt('health read', xT(2.5), l.y, 26, COSMOS.ink, 'mono').opacity(m2),
          );
        } else {
          const w = l.end * scale - 8;
          nodes.push(
            lumBar(tlX + w / 2, l.y, w, 46, { color: l.col, fillOpacity: 0.36, opacity: m2 }),
          );
        }
      });

      // Merge firing markers at t=2 (partial) and t=4 (complete) with generous horizontal clearance
      if (partialFire.value > 0.02) {
        nodes.push(
          glowRing(xT(2), 118, 18, ROLE.reject, {
            width: 3.4,
            fillOpacity: 0.35,
            glow: 12,
            opacity: m2 * partialFire.value,
          }),
          txt(
            relRaise.value > 0.3 ? 'RAISES (t=2)' : 'PARTIAL (t=2)',
            xT(2) - 24,
            164,
            26,
            ROLE.reject,
            'mono',
          ).opacity(m2 * partialFire.value),
        );
      }
      if (waitingEdge.value > 0.02 || secondFire.value > 0.02) {
        nodes.push(
          glowRing(xT(4), 118, 18, ROLE.pass, {
            width: 3.4,
            fillOpacity: 0.35,
            glow: 12,
            opacity: m2,
          }),
          txt(
            secondFire.value > 0.3 ? '2ND (t=4)' : 'WAITING (t=4)',
            xT(4) + 12,
            164,
            26,
            ROLE.pass,
            'mono',
          ).opacity(m2),
        );
      }

      // Bottom edge-mode comparison strip
      const by = 248;
      nodes.push(rule(lx, by - 25, 100, by - 25, ROLE.rule, 2).opacity(m2));
      const modeMsg =
        invFail.value > 0.3
          ? 'Validator raises -> invocation fails'
          : valSet.value > 0.3
            ? 'defer=True drains pending work; merge still validates selected set'
            : deferMode.value > 0.3
              ? 'Dynamic branches: defer=True waits for graph-wide pending tasks'
              : unselStall.value > 0.3
                ? 'Warning: waiting edge naming an unselected branch never fires!'
                : sepEdges.value > 0.3
                  ? '3 separate edges -> fires partial merge at t=2, then again at t=4'
                  : probeLit.value > 0.3
                    ? 'Probe records arrivals only; list-edge waits for all 3 terminal nodes'
                    : 'One waiting edge holds merge until all required branches finish';
      nodes.push(
        txt(
          modeMsg,
          lx,
          by + 20,
          26,
          invFail.value > 0.3 || unselStall.value > 0.3 ? ROLE.reject : ROLE.mark,
          'sans',
          'left',
        ).opacity(m2),
      );
    }

    // =========================================================================
    // STAGE 3: Output Ownership vs Shallow Proxy vs Deep Copy vs Execution Sandbox
    // =========================================================================
    if (m3 > 0.02) {
      nodes.push(
        txt(
          'OUTPUT OWNERSHIP & ISOLATION BOUNDARIES',
          lx,
          -210,
          26,
          ownLit.value > 0.3 ? ROLE.eval : COSMOS.muted,
          'mono',
          'left',
        ).opacity(m3),
        rule(lx, -186, 100, -186, ROLE.rule, 2).opacity(m3),
      );

      // Row 1: Types vs Runtime Auth
      nodes.push(
        lumBar(-650, -110, 420, 58, {
          color: typesLit.value > 0.3 ? ROLE.policy : ROLE.eval,
          fillOpacity: 0.16,
          opacity: m3,
        }),
        txt('TypedDict / Schema', -650, -110, 26, COSMOS.ink, 'mono').opacity(m3),
        txt(
          typesLit.value > 0.3
            ? 'Describes shape  !=  write authority'
            : 'Limits worker to own receipt',
          -410,
          -110,
          26,
          typesLit.value > 0.3 ? ROLE.policy : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m3),
      );

      // Row 2: Shallow MappingProxyType leaking nested list mutation
      nodes.push(
        lumBar(-650, 5, 420, 58, {
          color:
            nestedMut.value > 0.3 ? ROLE.reject : proxyLit.value > 0.3 ? ROLE.mark : COSMOS.rule,
          fillOpacity: 0.18,
          opacity: m3,
        }),
        txt('MappingProxyType', -650, 5, 26, COSMOS.ink, 'mono').opacity(m3),
        txt(
          nestedMut.value > 0.3
            ? 'SHALLOW: nested list still mutated in place!'
            : 'Read-only outer wrapper only',
          -410,
          5,
          26,
          nestedMut.value > 0.3 ? ROLE.reject : COSMOS.muted,
          'sans',
          'left',
        ).opacity(m3),
      );

      // Row 3: deepcopy
      nodes.push(
        lumBar(-650, 120, 420, 58, {
          color: deepLit.value > 0.3 ? ROLE.eval : COSMOS.rule,
          fillOpacity: 0.18,
          opacity: m3,
        }),
        txt('deepcopy(state)', -650, 120, 26, COSMOS.ink, 'mono').opacity(m3),
        txt(
          notSand.value > 0.3
            ? 'Separates values  |  NOT a hostile-code sandbox'
            : 'Separates nested fixture values',
          -410,
          120,
          26,
          notSand.value > 0.3 ? ROLE.policy : ROLE.eval,
          'sans',
          'left',
        ).opacity(m3),
      );

      // Row 4: Real execution boundary shield (floating accent, zero overflow)
      nodes.push(
        rule(lx, 205, 100, 205, boundLit.value > 0.3 ? ROLE.pass : ROLE.rule, 2.5).opacity(m3),
        txt(
          'EXECUTION BOUNDARY: trusted scope + credentials + isolation',
          lx,
          255,
          28,
          boundLit.value > 0.3 ? ROLE.pass : COSMOS.muted,
          'mono',
          'left',
        )
          .glow(boundLit.value > 0.3 ? 8 : 0, ROLE.pass)
          .opacity(m3),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, barrier3d, title, live);
  runAmbientPhase(s, c, phase, 2.5);
  orbitScene(s, c, barrier3d, { theta: 0.28, phi: 0.98 });

  // Beat 0: Superstep mechanics
  tweenCue(s, c, 'superstep-join-construct-0', planLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'executes', execLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'applies', applyLit, 1, { duration: 0.35 });
  c.on('next-step', () => {
    s.play(nextLit.to(1, { duration: 0.35 }), barrierStatus.to(1, { duration: 0.35 }));
  });

  // Beat 1: Reducers & recovery
  crossSwap(s, c, 'superstep-join-construct-1', st0, st1, { duration: 0.42 });
  tweenCue(s, c, 'superstep-join-construct-1', scalarLit, 1, { duration: 0.3 });
  c.after('scalar-update-error', () => {
    s.play(scalarErr.to(1, { duration: 0.3 }), barrierStatus.to(-1, { duration: 0.3 }));
  });
  tweenCue(s, c, 'values-agree', agreeLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'reducer-lists', listLit, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'not-commutative', nonCommLit, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'keeps-duplicates', dupLit, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'add-empty', emptyLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'new-attempt', overwriteLit, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'attempt-aware', attemptLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'resume-saved', resumeLit, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'retry-failed-work', retryLit, 1, { duration: 0.3, after: true });

  // Beat 2: Unequal-depth fan-in
  crossSwap(s, c, 'probe-only', st1, st2, { duration: 0.42 });
  tweenCue(s, c, 'probe-only', probeLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'superstep-join-construct-2', waitingEdge, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'three-edges', sepEdges, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'extra-step', prepStep, 1, { duration: 0.35 });
  tweenCue(s, c, 'partial-merge', partialFire, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'another-merge', secondFire, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'unselected', unselStall, 1, { duration: 0.35 });
  tweenCue(s, c, 'deferred', deferMode, 1, { duration: 0.35 });
  tweenCue(s, c, 'validate-set', valSet, 1, { duration: 0.35 });
  tweenCue(s, c, 'release-case', relCase, 1, { duration: 0.35 });
  tweenCue(s, c, 'release-validator', relRaise, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'invocation-fails', invFail, 1, { duration: 0.35 });

  // Beat 3: Ownership vs shallow proxy vs execution boundary
  crossSwap(s, c, 'superstep-join-construct-3', st2, st3, { duration: 0.42 });
  tweenCue(s, c, 'superstep-join-construct-3', ownLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'types-not-auth', typesLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'proxy-shallow', proxyLit, 1, { duration: 0.3 });
  tweenCue(s, c, 'nested-mutated', nestedMut, 1, { duration: 0.35 });
  tweenCue(s, c, 'deep-copy', deepLit, 1, { duration: 0.35 });
  tweenCue(s, c, 'neither-sandbox', notSand, 1, { duration: 0.35 });
  c.on('boundary', () => {
    s.play(boundLit.to(1, { duration: 0.35 }), barrierStatus.to(1, { duration: 0.35 }));
  });
}
