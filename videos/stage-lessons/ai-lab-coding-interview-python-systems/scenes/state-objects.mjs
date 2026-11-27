// Scene 7: state-objects - "How much work did four pages take?"
// Stage 0: Python state-ownership map (deque, heap, Counter, OrderedDict, monotonic clock, Condition, Event).
// Stage 1: Single-worker graph work tally (V = 4 pages, E = 6 links -> strict prediction hold for +1 duplicate -> 7!).
// Stage 2: Signature 3D Complexity Manifold (`buildComplexityManifold3d`, `surface`, `curve3d`, `orbitScene`)
//          with MathJax `glowTex` equations comparing O(V + E) vs O(A V log V)!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  CRAWL,
  ROLE,
  URLS,
  actorOrb,
  buildComplexityManifold3d,
  cinemaAtmosphere,
  glowArcArrow,
  glowArrow,
  glowPill,
  glowTex,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  orbitScene,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

export default function stateObjects(s, c) {
  const title = sceneHeading(['How much work did', 'four pages take?'], { accent: ROLE.workerB });

  const stage = s.value(0); // 0=state ownership, 1=4-page graph tally, 2=3D heap complexity
  const litRow = s.value(0); // 1=deque, 2=counter, 3=condition, 4=event
  const crawledCount = s.value(0); // 0..4
  const showExtra = s.value(0);
  const showSeven = s.value(0); // STRICTLY AFTER 'objects-seven'!
  const manifoldMix = s.value(0); // 0 -> 1 morphing 3D complexity surface

  const view3d = buildComplexityManifold3d(manifoldMix, { x: -370, y: 15 });
  const eqGraph = glowTex('O(V + E)\\text{ work},\\quad O(V)\\text{ state}', {
    x: 430,
    y: -175,
    size: 36,
    color: COSMOS.cyan,
    glow: 7,
  });
  const eqHeap = glowTex('O(A\\,V\\log V) + O(V + E)', {
    x: 430,
    y: 45,
    size: 38,
    color: COSMOS.gold,
    glow: 8,
  });

  const baseLinks = CRAWL.order.reduce((acc, u) => acc + URLS.pages[u].length, 0); // 6

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        const lit = Math.round(litRow.value);
        // Left: Data structure owners
        nodes.push(
          txt('PYTHON STATE OWNERS', -460, -280, 26, ROLE.workerB, 'mono', 'center').opacity(alpha),
          txt('LIVE SYNC SIGNALS', 445, -280, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
          line([10, -250], [10, 250], { stroke: '#29375a', width: 2 }).opacity(alpha),
        );

        const leftRows = [
          { y: -185, role: 'FIFO work', owner: 'collections.deque', hi: lit === 1 },
          { y: -85, role: 'Priority', owner: 'heapq (min-heap)', hi: false },
          { y: 15, role: 'Fetch counts', owner: 'collections.Counter', hi: lit === 2 },
          { y: 115, role: 'Recency', owner: 'OrderedDict', hi: false },
          { y: 215, role: 'Elapsed time', owner: 'injected monotonic()', hi: false },
        ];
        leftRows.forEach((r) => {
          const col = r.hi ? ROLE.focus : ROLE.workerB;
          nodes.push(
            txt(r.role, -830, r.y, 26, r.hi ? ROLE.focus : COSMOS.muted, 'sans', 'left').opacity(
              alpha,
            ),
            glowPill(r.owner, -320, r.y, col, {
              size: 26,
              fixedW: 470,
              alpha,
              glow: r.hi ? 12 : 5,
            }),
          );
        });

        const rightRows = [
          {
            y: -145,
            name: 'queue head',
            val: lit >= 1 ? '/guide (popped)' : '/start',
            col: lit >= 1 ? ROLE.ok : ROLE.workerA,
          },
          {
            y: -35,
            name: 'fetch count',
            val: lit >= 2 ? 'Counter: 1' : 'Counter: 0',
            col: lit >= 2 ? ROLE.ok : COSMOS.muted,
          },
          {
            y: 75,
            name: 'Condition',
            val: lit >= 3 ? 'recheck under lock' : 'wait for work',
            col: lit >= 3 ? ROLE.focus : ROLE.workerB,
          },
          {
            y: 185,
            name: 'Stop Event',
            val: lit >= 4 ? 'event.set() -> STOP' : 'clear',
            col: lit >= 4 ? ROLE.fail : COSMOS.muted,
          },
        ];
        rightRows.forEach((r) => {
          nodes.push(
            txt(r.name, 70, r.y, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
            glowPill(r.val, 565, r.y, r.col, { size: 26, fixedW: 440, alpha, glow: 7 }),
          );
        });

        nodes.push(
          txt(
            'Pick one clear owner per transition and always recheck Condition predicates under the lock.',
            0,
            345,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (st === 1) {
        // Stage 1: 4-node crawler graph + live V / E / State counters (strict prediction hold!)
        const nDone = Math.round(crawledCount.value);
        const extra = showExtra.value > 0.5;
        const seven = showSeven.value > 0.5;

        const vCount = Math.min(4, nDone);
        let eCount = 0;
        for (let i = 0; i < vCount; i++) eCount += URLS.pages[CRAWL.order[i]].length;
        const displayedE = seven ? baseLinks + 1 : eCount;

        // Constellation of the 4 reachable pages on the left
        const pStart = [-670, -110];
        const pGuide = [-260, -110];
        const pApi = [-260, 145];
        const pFaq = [-670, 145];

        nodes.push(
          txt('SINGLE-WORKER CRAWL GRAPH', -465, -275, 26, ROLE.workerB, 'mono', 'center').opacity(
            alpha,
          ),
          glowArrow(pStart[0] + 75, pStart[1], pGuide[0] - 75, pGuide[1], ROLE.workerB, {
            width: 3.2,
            alpha,
          }),
          glowArrow(pStart[0] + 60, pStart[1] + 55, pApi[0] - 60, pApi[1] - 55, ROLE.workerB, {
            width: 3,
            alpha,
          }),
          glowArrow(
            pGuide[0],
            pGuide[1] + 72,
            pApi[0],
            pApi[1] - 72,
            extra ? ROLE.focus : ROLE.ok,
            {
              width: extra ? 4.5 : 3.2,
              alpha,
            },
          ),
          glowArrow(pGuide[0] - 60, pGuide[1] + 55, pFaq[0] + 60, pFaq[1] - 55, ROLE.ok, {
            width: 3,
            alpha,
          }),
          glowArcArrow([pApi[0] - 55, pApi[1] - 65], [pStart[0] + 55, pStart[1] + 65], -85, {
            color: COSMOS.muted,
            width: 2.5,
            alpha: 0.7 * alpha,
          }),
          actorOrb(pStart[0], pStart[1], 66, vCount >= 1 ? ROLE.ok : ROLE.workerA, '/start', '', {
            alpha,
            active: vCount === 1,
          }),
          actorOrb(pGuide[0], pGuide[1], 66, vCount >= 2 ? ROLE.ok : ROLE.workerA, '/guide', '', {
            alpha,
            active: vCount === 2 || extra,
          }),
          actorOrb(pApi[0], pApi[1], 66, vCount >= 3 ? ROLE.ok : ROLE.workerB, '/api', '', {
            alpha,
            active: vCount === 3,
          }),
          actorOrb(pFaq[0], pFaq[1], 66, vCount >= 4 ? ROLE.ok : ROLE.workerB, '/faq', '', {
            alpha,
            active: vCount === 4,
          }),
        );

        // Right: Counters table
        nodes.push(
          txt('WORK & STATE COUNTS', 435, -275, 26, ROLE.focus, 'mono', 'center').opacity(alpha),
          txt('Vertex pops (V)', 110, -145, 28, COSMOS.muted, 'sans', 'left').opacity(alpha),
          glowPill(String(vCount), 675, -145, ROLE.workerA, { size: 32, fixedW: 200, alpha }),

          txt('Raw links checked (E)', 110, -20, 28, COSMOS.muted, 'sans', 'left').opacity(alpha),
          glowPill(
            extra && !seven ? '6 -> ?' : String(displayedE),
            675,
            -20,
            seven ? ROLE.ok : extra ? ROLE.focus : ROLE.workerB,
            {
              size: 32,
              fixedW: 200,
              alpha,
              glow: seven || extra ? 14 : 7,
            },
          ),

          txt('Retained URLs (state)', 110, 105, 28, COSMOS.muted, 'sans', 'left').opacity(alpha),
          glowPill(
            String(vCount > 0 ? CRAWL.snapshots[vCount].seen.length : 1),
            675,
            105,
            ROLE.record,
            {
              size: 32,
              fixedW: 200,
              alpha,
            },
          ),
        );

        if (extra) {
          nodes.push(
            glowPill('/guide adds duplicate /api (+1 link)', 435, 224, ROLE.focus, {
              size: 26,
              fixedW: 740,
              alpha,
            }),
          );
        }

        const capY = 345;
        nodes.push(
          txt(
            seven
              ? 'Only link checks rise from 6 to 7; vertex pops stay at 4. Work is O(V + E), state O(V).'
              : extra
                ? 'Suppose /guide returns one extra copy of /api. Which count changes?'
                : 'Count queue pops (V) separately from raw callback links inspected (E).',
            0,
            capY,
            extra && !seven ? 30 : 27,
            seven ? ROLE.ok : extra ? ROLE.focus : COSMOS.muted,
            extra && !seven ? 'serif' : 'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 2: 3D Complexity Manifold + MathJax equations on the right
        nodes.push(
          txt('3D COMPLEXITY MANIFOLD', -370, -295, 26, ROLE.focus, 'mono', 'center').opacity(
            alpha,
          ),
          txt('GRAPH VS RETRY-HEAP GROWTH', 430, -295, 26, ROLE.workerB, 'mono', 'center').opacity(
            alpha,
          ),
          txt('Single-pass BFS crawl:', 430, -235, 26, COSMOS.muted, 'sans', 'center').opacity(
            alpha,
          ),
          txt(
            'Priority scheduler with <= A retries per task:',
            430,
            -35,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
          glowPill('Each retry re-inserts into min-heap -> O(log V)', 430, 185, ROLE.focus, {
            size: 26,
            fixedW: 780,
            alpha,
          }),
          txt(
            'Long URLs or slow callbacks add constant factors even when V and E stay fixed.',
            0,
            345,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'STATE OWNERSHIP & ASYMPTOTIC WORK',
          st === 2
            ? 'HEAP RETRIES: O(A V log V) + O(V + E)'
            : showSeven.value > 0.5
              ? 'V = 4 POPS  ·  E = 7 LINKS'
              : 'DEQUE  ·  HEAP  ·  COUNTER  ·  CLOCK',
          { accent: st === 2 ? ROLE.focus : ROLE.workerB, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.workerB, ROLE.focus), title, layer);

  playCue(s, c, 'ci-state-objects-0-build', () => s.play(litRow.to(0, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'objects-deque', () => s.play(litRow.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'objects-count', () => s.play(litRow.to(2, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'objects-wake', () => s.play(litRow.to(3, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'objects-stop', () => s.play(litRow.to(4, { duration: 0.05 })), { dur: 0.1 });

  playCue(
    s,
    c,
    'objects-cost',
    (d) => s.play(stage.to(1, { duration: 0.05 }), crawledCount.to(4, { duration: d })),
    { dur: 1.6 },
  );
  playCue(s, c, 'objects-extra', () => s.play(showExtra.to(1, { duration: 0.05 })), { dur: 0.1 });
  // Strict prediction reveal ONLY AFTER 'objects-seven'!
  playCue(s, c, 'objects-seven', () => s.play(showSeven.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Stage 2: switch off Stage 1 BEFORE c.show fades in eqGraph/eqHeap/view3d (zero motion overlap!)
  const attCue = c.cue('objects-attempts');
  if (attCue) {
    const preRel = Math.max(0.02, attCue.start - c.start - 0.16);
    c.at(preRel, () => s.play(stage.to(2, { duration: 0.02 })));
  }
  c.show('objects-attempts', [view3d, eqGraph, eqHeap]);
  playCue(
    s,
    c,
    'objects-attempts',
    (d, cue) => {
      const orbitDur = Math.max(0.5, c.end - cue.start - 0.5);
      s.play(
        manifoldMix.to(1, { duration: d }),
        view3d.orbit({ theta: -0.25, phi: 0.94 }, { duration: orbitDur }),
      );
    },
    { dur: 2.0 },
  );
}
