// Scene 12: graph-validation - "Reject the cycle before any task creates an effect"
// Stage 0: Three-state DFS (unseen / active / done) detects back-edge a <-> b while docs waits untouched.
// Stage 1: Valid DAG + min-heap (priority, name) tie-breaking + remaining-count zero release.
// Stage 2: Strict return-type router: bool False -> retry same priority, str "False" -> reject type,
//          exception -> abort scheduler; plus iterative traversal note for deep chains.
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  actorOrb,
  cinemaAtmosphere,
  glowArcArrow,
  glowArrow,
  glowCross,
  glowPill,
  guardedDynamic,
  lowerFooter,
  playBeat,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function graphValidation(s, c) {
  const title = sceneHeading(['Reject the cycle before any', 'task creates an effect'], {
    accent: ROLE.fail,
  });

  const stage = s.value(0); // 0=cycle DFS, 1=heap tie-break & zero release, 2=return-type router
  const dfsStep = s.value(0); // 0=init, 1=a active -> b, 2=back edge b->a CYCLE!
  const heapStep = s.value(0); // 0=raw, 1=sorted by priority, 2=tie on pri=2 (docs before test), 3=deploy rem=0 ready
  const retStep = s.value(0); // 0=running, 1=bool False -> retry, 2=str "False" -> reject, 3=exception -> abort

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        const ds = Math.round(dfsStep.value);
        const isCycle = ds >= 2;
        const aCol = ds >= 1 ? (isCycle ? ROLE.fail : ROLE.focus) : COSMOS.muted;
        const bCol = ds >= 2 ? ROLE.fail : ds >= 1 ? ROLE.focus : COSMOS.muted;

        nodes.push(
          txt(
            'THREE-STATE DFS CYCLE CHECK BEFORE RUN',
            0,
            -278,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(alpha),
          // Cycle edges a -> b and b -> a
          glowArcArrow([-585, -55], [-215, -55], -85, {
            color: ds >= 1 ? ROLE.focus : COSMOS.dim,
            width: 3.8,
            alpha,
          }),
          glowArcArrow([-215, 45], [-585, 45], 85, {
            color: isCycle ? ROLE.fail : COSMOS.dim,
            width: isCycle ? 4.8 : 3,
            alpha,
          }),
          actorOrb(-665, -5, 72, aCol, 'a', ds >= 1 ? 'active' : 'unseen', {
            alpha,
            active: ds >= 1,
          }),
          actorOrb(
            -135,
            -5,
            72,
            bCol,
            'b',
            ds >= 2 ? 'back-edge!' : ds >= 1 ? 'active' : 'unseen',
            {
              alpha,
              active: ds >= 1,
            },
          ),
          // Independent ready node docs untouched!
          actorOrb(220, -5, 70, ROLE.workerB, 'docs', 'unrun (safe)', { alpha, active: false }),

          // Legend & verdict pills
          glowPill('UNSEEN', -520, 210, COSMOS.dim, { size: 26, fixedW: 220, alpha }),
          glowPill('ACTIVE (on stack)', -140, 210, ROLE.focus, { size: 26, fixedW: 340, alpha }),
          glowPill('COMPLETED (safe)', 260, 210, ROLE.ok, { size: 26, fixedW: 340, alpha }),
        );

        if (isCycle) {
          nodes.push(
            glowPill('CYCLE REJECTED (0 ran)', 615, -5, ROLE.fail, {
              size: 26,
              fixedW: 455,
              alpha,
              glow: 14,
            }),
            glowCross(-400, 95, 32, ROLE.fail, alpha),
          );
        }

        nodes.push(
          txt(
            isCycle
              ? 'Edge to an active node exposes a cycle; reject the whole graph before docs can run.'
              : 'Validate duplicate names, duplicate edges, unknown deps, and cycles upfront.',
            0,
            340,
            27,
            isCycle ? ROLE.fail : COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (st === 1) {
        const hs = Math.round(heapStep.value);
        const rows =
          hs === 0
            ? [
                { pri: 2, name: 'test', rem: 0 },
                { pri: 1, name: 'docs', rem: 0 },
                { pri: 3, name: 'deploy', rem: 1 },
              ]
            : hs === 1
              ? [
                  { pri: 1, name: 'docs', rem: 0 },
                  { pri: 2, name: 'test', rem: 0 },
                  { pri: 3, name: 'deploy', rem: 1 },
                ]
              : hs === 2
                ? [
                    { pri: 2, name: 'docs', rem: 0, tie: true },
                    { pri: 2, name: 'test', rem: 0, tie: true },
                    { pri: 3, name: 'deploy', rem: 1 },
                  ]
                : [
                    { pri: 2, name: 'docs', rem: 0 },
                    { pri: 2, name: 'test', rem: 0 },
                    { pri: 3, name: 'deploy', rem: 0, released: true },
                  ];

        nodes.push(
          txt(
            'VALID DAG + READY MIN-HEAP: (priority, name)',
            0,
            -278,
            26,
            ROLE.workerB,
            'mono',
            'center',
          ).opacity(alpha),
          // Left: clean valid DAG test -> deploy
          glowArrow(-620, 0, -340, 0, hs >= 3 ? ROLE.ok : ROLE.workerB, { width: 4, alpha }),
          actorOrb(-700, 0, 74, ROLE.workerA, 'test', hs >= 3 ? 'complete' : 'ready', {
            alpha,
            active: hs >= 3,
          }),
          actorOrb(
            -260,
            0,
            78,
            hs >= 3 ? ROLE.ok : ROLE.warn,
            'deploy',
            hs >= 3 ? 'rem: 0' : 'rem: 1',
            {
              alpha,
              active: hs >= 3,
            },
          ),

          line([-100, -230], [-100, 210], { stroke: '#29375a', width: 2 }).opacity(alpha),

          // Right: Ready heap table
          txt('PRIORITY', 40, -205, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          txt('NAME', 310, -205, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          txt('REMAINING', 640, -205, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
          line([-70, -172], [840, -172], { stroke: '#2c3a5e', width: 2 }).opacity(alpha),
        );

        rows.forEach((r, i) => {
          const ry = -95 + i * 112;
          const isReady = r.rem === 0;
          nodes.push(
            glowPill(String(r.pri), 40, ry, r.tie ? ROLE.focus : ROLE.workerA, {
              size: 28,
              fixedW: 160,
              alpha,
              glow: r.tie ? 11 : 5,
            }),
            glowPill(r.name, 310, ry, r.released ? ROLE.ok : r.tie ? ROLE.focus : ROLE.workerB, {
              size: 28,
              fixedW: 260,
              alpha,
              glow: r.released || r.tie ? 11 : 6,
            }),
            glowPill(
              isReady ? '0 (admitted)' : '1 (waiting)',
              640,
              ry,
              isReady ? ROLE.ok : ROLE.warn,
              { size: 26, fixedW: 320, alpha, glow: r.released ? 13 : 5 },
            ),
          );
        });

        nodes.push(
          txt(
            hs >= 3
              ? 'Complete prerequisite -> decrement each dependent once -> enqueue only at 0.'
              : hs === 2
                ? 'Equal priority (2 == 2) breaks ties alphabetically: "docs" before "test".'
                : 'Lower numeric priority runs first; only remaining == 0 enters the ready heap.',
            0,
            340,
            27,
            hs >= 3 ? ROLE.ok : ROLE.focus,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 2: Strict Return-Type Router
        const rs = Math.round(retStep.value);
        nodes.push(
          txt(
            'RETURN TYPE ROUTER & ITERATIVE TRAVERSAL',
            0,
            -278,
            26,
            ROLE.focus,
            'mono',
            'center',
          ).opacity(alpha),
        );

        const cases = [
          {
            y: -140,
            ret: 'bool  False',
            verdict: 'RETRY (keep original priority)',
            col: ROLE.warn,
            active: rs === 1,
            shown: rs >= 1,
          },
          {
            y: -15,
            ret: 'str  "False"',
            verdict: 'REJECT TYPE (not truthy success!)',
            col: ROLE.fail,
            active: rs === 2,
            shown: rs >= 2,
          },
          {
            y: 110,
            ret: 'raises Exception',
            verdict: 'ABORT SCHEDULER IMMEDIATELY',
            col: ROLE.fail,
            active: rs === 3,
            shown: rs >= 3,
          },
        ];

        cases.forEach((item) => {
          const op = item.shown ? alpha : 0.4 * alpha;
          nodes.push(
            glowPill(item.ret, -460, item.y, item.shown ? item.col : COSMOS.dim, {
              size: 28,
              fixedW: 480,
              alpha: op,
              glow: item.active ? 14 : 4,
            }),
            glowArrow(-205, item.y, -25, item.y, item.shown ? item.col : COSMOS.dim, {
              width: 3.5,
              alpha: op,
            }),
            glowPill(item.verdict, 405, item.y, item.shown ? item.col : COSMOS.dim, {
              size: 27,
              fixedW: 790,
              alpha: op,
              glow: item.active ? 14 : 4,
            }),
          );
        });

        nodes.push(
          glowPill(
            'Long chains: use iterative DFS to avoid Python recursion limit',
            0,
            240,
            ROLE.workerB,
            {
              size: 26,
              fixedW: 1120,
              alpha,
            },
          ),
          txt(
            'Check type(result) is bool explicitly; a non-empty string "False" is truthy in Python!',
            0,
            345,
            27,
            rs >= 2 ? ROLE.fail : COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'UPFRONT GRAPH VALIDATION + STRICT RETURN CONTRACT',
          st === 0
            ? '3-STATE DFS CATCHES CYCLES BEFORE RUN'
            : st === 1
              ? 'HEAP KEY: (priority, name)'
              : 'bool False RETRIES  ·  str "False" REJECTED',
          { accent: st === 0 || st === 2 ? ROLE.fail : ROLE.ok, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.fail, ROLE.workerB), title, layer);

  // Beat 0: DFS Cycle check
  playCue(s, c, 'ci-graph-validation-0-build', () => s.play(stage.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'graph-active', () => s.play(dfsStep.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'ci-graph-validation-cycle', () => s.play(dfsStep.to(2, { duration: 0.05 })), {
    dur: 0.1,
  });

  // Beat 1: Priority & tie-breaking
  playBeat(
    s,
    c,
    1,
    () => s.play(stage.to(1, { duration: 0.05 }), heapStep.to(0, { duration: 0.05 })),
    {
      dur: 0.1,
    },
  );
  playCue(s, c, 'ci-graph-validation-1-build', () => s.play(stage.to(1, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'graph-priority', () => s.play(heapStep.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'graph-tie', () => s.play(heapStep.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'ci-graph-validation-ready', () => s.play(heapStep.to(3, { duration: 0.05 })), {
    dur: 0.1,
  });

  // Beat 2: Return-type router
  playCue(
    s,
    c,
    'ci-graph-validation-2-build',
    () => s.play(stage.to(2, { duration: 0.05 }), retStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'graph-bool-false', () => s.play(retStep.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'graph-string-type', () => s.play(retStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'graph-string-false', () => s.play(retStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'graph-exception', () => s.play(retStep.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
}
