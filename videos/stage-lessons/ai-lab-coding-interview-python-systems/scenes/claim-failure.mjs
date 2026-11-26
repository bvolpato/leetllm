// Scene 6: claim-failure - "What may a crawler worker publish?"
// Three cleanly switched visual stages (zero motion overlap):
// Stage 0: Early worker-claim bug vs prediction hold ("Which page sits at the front?") -> /faq /shared /types.
// Stage 1: Rewind + parent-buffered raw lists -> ordered admission /shared /faq /types.
// Stage 2: Cooperative stop event withholding children from an in-flight fetch.
// Stage 3: Retryable failure state machine (in flight -> retry wait -> attempt 2 -> success / terminal).
import { line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  actorOrb,
  ambientClock,
  cinemaAtmosphere,
  glowArcArrow,
  glowArrow,
  glowCross,
  glowDot,
  glowPill,
  guardedDynamic,
  hexAlpha,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';
import { bufferedFrontier, drawFrontierMerge, traceFrontier } from '../frontier-merge.mjs';

const PARENTS = [
  { path: '/guide', links: ['/shared#intro', '/faq'] },
  { path: '/api', links: ['/shared#ref', '/types'] },
];

export default function claimFailure(s, c) {
  const title = sceneHeading(['What may a crawler', 'worker publish?'], { accent: ROLE.focus });

  const amb = ambientClock(s, c);
  const viewMode = s.value(0); // 0=early race, 1=buffered replay, 2=stop event, 3=retry policy

  // Stage 0 (early claim)
  const earlyStep = s.value(0); // 0..7
  // Stage 1 (buffered parent-order replay)
  const bufStep = s.value(0); // 0..8
  // Stage 2 (stop event)
  const stopStep = s.value(0); // 0=in flight, 1=stop set, 2=children withheld
  // Stage 3 (retry state machine)
  const retryStep = s.value(0); // 0=attempt 1 in flight, 1=retry wait, 2=attempt 2 in flight, 3=settled success

  const early = traceFrontier(PARENTS, [1, 0]);
  const ordered = bufferedFrontier(PARENTS, [1, 0]);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const mode = Math.round(viewMode.value);
      const nodes = [];

      if (mode === 0) {
        const es = Math.round(earlyStep.value);
        const qSlots = [
          es >= 5 ? { path: early.queue[0].path, color: ROLE.workerA } : null,
          es >= 6 ? { path: early.queue[1].path, color: ROLE.workerB } : null,
          es >= 7 ? { path: early.queue[2].path, color: ROLE.workerB } : null,
        ];
        nodes.push(
          ...drawFrontierMerge({
            parents: PARENTS,
            alpha,
            showRow1: es >= 1,
            showRow0: es >= 3,
            row1States: [es >= 2 ? 'claimed' : 'raw', 'raw'],
            row0States: [es >= 4 ? 'skip' : 'raw', 'raw'],
            queueSlots: qSlots,
            modeLabel: 'UNORDERED WORKER CLAIMS (/api RETURNS FIRST)',
          }),
        );

        const capY = 335;
        if (es === 4) {
          nodes.push(
            txt(
              'Guide lost /shared before lists were joined. Which page sits at the front?',
              0,
              capY,
              29,
              ROLE.focus,
              'serif',
              'center',
            )
              .glow(7, ROLE.focus)
              .opacity(alpha * (0.82 + 0.18 * pulse)),
          );
        } else if (es >= 7) {
          nodes.push(
            txt(
              'Result: /faq, /shared, /types. A single worker would have put /shared first!',
              0,
              capY,
              28,
              ROLE.fail,
              'sans',
              'center',
            ).opacity(alpha),
          );
        } else {
          nodes.push(
            txt(
              es >= 2
                ? 'API claimed /shared early, forcing guide to drop its first link.'
                : 'Queue dispatched /guide first, /api second. Suppose /api finishes first.',
              0,
              capY,
              27,
              COSMOS.muted,
              'sans',
              'center',
            ).opacity(alpha),
          );
        }
      } else if (mode === 1) {
        const bs = Math.round(bufStep.value);
        const qSlots = [
          bs >= 4 ? { path: ordered.queue[0].path, color: ROLE.workerA } : null,
          bs >= 5 ? { path: ordered.queue[1].path, color: ROLE.workerA } : null,
          bs >= 8 ? { path: ordered.queue[2].path, color: ROLE.workerB } : null,
        ];
        nodes.push(
          ...drawFrontierMerge({
            parents: PARENTS,
            alpha,
            showRow1: bs >= 1,
            showRow0: bs >= 2,
            row0States: [bs >= 4 ? 'claimed' : 'raw', bs >= 5 ? 'claimed' : 'raw'],
            row1States: [bs >= 7 ? 'skip' : 'raw', bs >= 8 ? 'claimed' : 'raw'],
            queueSlots: qSlots,
            cursorParent: bs >= 6 ? 1 : bs >= 3 ? 0 : -1,
            highlightSlot: bs >= 8 ? 0 : -1,
            modeLabel: 'REWIND: BUFFER RAW LISTS, ADMIT IN PARENT ORDER',
          }),
        );

        const capY = 335;
        nodes.push(
          txt(
            bs >= 8
              ? 'Parent-order admission yields /shared, /faq, /types every time.'
              : bs >= 3
                ? 'Coordinator walks parent 1 (/guide) left-to-right before reading parent 2 (/api).'
                : 'Buffer /api raw links in slot 2 and wait until /guide returns.',
            0,
            capY,
            28,
            bs >= 8 ? ROLE.ok : COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (mode === 2) {
        // Stage 2: Stop Event Cooperative Publication Check
        const ss = Math.round(stopStep.value);
        const tx0 = -640;
        const tx1 = 680;
        const yReq = -110;
        const yStop = 70;
        const stopX = -40;

        nodes.push(
          txt('COOPERATIVE STOP EVENT CHECK', 0, -280, 27, ROLE.fail, 'mono', 'center').opacity(
            alpha,
          ),
          txt('FETCH', -770, yReq, 26, ROLE.workerA, 'mono', 'center').opacity(alpha),
          txt('STOP', -770, yStop, 26, ROLE.fail, 'mono', 'center').opacity(alpha),
          line([tx0, yReq], [tx1, yReq], { stroke: '#29375a', width: 3 }).opacity(alpha),
          line([tx0, yStop], [tx1, yStop], { stroke: '#29375a', width: 3 }).opacity(alpha),
        );

        // Fetch bar (starts at tx0, extends to +260)
        const fetchW = ss >= 2 ? 900 : ss >= 1 ? 580 : 340;
        nodes.push(
          rect(fetchW, 48, { radius: 10, fill: COSMOS.bg, stroke: null }).at(
            tx0 + fetchW / 2,
            yReq,
          ),
          rect(fetchW, 48, {
            radius: 10,
            fill: hexAlpha(ROLE.workerA, 0.28 * alpha),
            stroke: ROLE.workerA,
            width: 2.6,
          })
            .at(tx0 + fetchW / 2, yReq)
            .glow(8, ROLE.workerA),
          txt('in-flight fetch', tx0 + fetchW / 2, yReq, 26, COSMOS.ink, 'mono', 'center').opacity(
            alpha,
          ),
        );

        if (ss >= 1) {
          nodes.push(
            line([stopX, -210], [stopX, 150], {
              stroke: ROLE.fail,
              width: 4,
              dash: [9, 7],
            }).glow(10, ROLE.fail),
            glowPill('stop.set()', stopX + 160, yStop, ROLE.fail, {
              size: 27,
              fixedW: 240,
              alpha,
              glow: 11,
            }),
          );
        }

        if (ss >= 2) {
          nodes.push(
            glowPill('children returned', 460, yReq, ROLE.workerB, {
              size: 26,
              fixedW: 340,
              alpha,
            }),
            glowCross(675, yReq, 30, ROLE.fail, alpha),
            glowPill('Children enqueued after stop = 0', 0, 210, ROLE.focus, {
              size: 29,
              fixedW: 680,
              alpha,
              glow: 11,
            }),
          );
        }

        nodes.push(
          txt(
            'Check stop before scheduling, before fetching, and before publishing children.',
            0,
            340,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 3: Retryable failure state machine
        const rs = Math.round(retryStep.value);
        const activeX = -150;
        const activeY = -125;
        const waitX = -150;
        const waitY = 148;
        const okX = 460;
        const okY = -145;
        const failX = 460;
        const failY = 115;

        const isActive = rs === 0 || rs === 2;
        const isWait = rs === 1;
        const isDone = rs >= 3;

        nodes.push(
          txt('RETRYABLE FAILURE LIFECYCLE', 0, -295, 27, ROLE.warn, 'mono', 'center').opacity(
            alpha,
          ),
          // Edges first so orbs sit cleanly on top
          glowArcArrow([activeX - 118, activeY + 45], [waitX - 118, waitY - 45], 0, {
            color: ROLE.warn,
            alpha: isWait ? alpha : 0.45 * alpha,
            photonT: isWait ? (amb.value * 4) % 1 : null,
          }),
          glowArcArrow([waitX + 118, waitY - 45], [activeX + 118, activeY + 45], 0, {
            color: ROLE.workerB,
            alpha: rs >= 2 ? alpha : 0.45 * alpha,
            photonT: rs === 2 ? (amb.value * 4) % 1 : null,
          }),
          glowArrow(activeX + 125, activeY - 15, okX - 115, okY + 15, ROLE.ok, {
            width: 3.5,
            alpha: isDone ? alpha : 0.45 * alpha,
          }),
          glowArrow(activeX + 125, activeY + 45, failX - 115, failY - 35, ROLE.fail, {
            width: 3.5,
            alpha: 0.55 * alpha,
          }),

          actorOrb(activeX, activeY, 72, ROLE.workerA, 'in flight', '', {
            alpha,
            active: isActive,
          }),
          actorOrb(waitX, waitY, 72, ROLE.warn, 'retry wait', 'backoff', {
            alpha,
            active: isWait,
          }),
          actorOrb(okX, okY, 74, ROLE.ok, 'success', 'settled', { alpha, active: isDone }),
          actorOrb(failX, failY, 74, ROLE.fail, 'terminal', 'settled', { alpha, active: false }),

          glowPill(
            rs >= 2 ? 'Stop clear  ·  attempt 2' : 'Stop clear  ·  attempt 1',
            -635,
            -15,
            ROLE.focus,
            { size: 26, fixedW: 410, alpha },
          ),
          txt(
            'Track attempt count per URL: retryable failures wait out backoff before reclaiming.',
            0,
            356,
            27,
            isDone ? ROLE.ok : COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'PARENT-ORDERED ADMISSION + STOP + RETRY POLICY',
          mode === 0
            ? 'EARLY WORKER CLAIMS BREAK BFS ORDER'
            : mode === 1
              ? bufStep.value >= 7.5
                ? 'ORDERED: /shared -> /faq -> /types'
                : 'BUFFERING RAW LISTS IN PARENT ORDER'
              : mode === 2
                ? 'SEMAPHORE + PER-HOST QUOTA + STOP'
                : 'SETTLE ON SUCCESS OR TERMINAL FAIL',
          { accent: mode === 1 ? ROLE.ok : mode === 2 ? ROLE.fail : ROLE.focus, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.focus, ROLE.workerB), title, layer);

  // Stage 0 cues (strict withholding of wrong queue order until after cues)
  playCue(s, c, 'order-api', () => s.play(earlyStep.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'order-api-claims', () => s.play(earlyStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'order-guide', () => s.play(earlyStep.to(3, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'order-lost', () => s.play(earlyStep.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'order-question', () => s.play(earlyStep.to(4, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'order-wrong-front', () => s.play(earlyStep.to(5, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'order-wrong-middle', () => s.play(earlyStep.to(6, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'order-wrong-tail', () => s.play(earlyStep.to(7, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Stage 1 cues (rewind + buffered parent order)
  playCue(
    s,
    c,
    'order-rewind',
    () => s.play(viewMode.to(1, { duration: 0.05 }), bufStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'order-buffer-api', () => s.play(bufStep.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'order-buffer-guide', () => s.play(bufStep.to(2, { duration: 0.05 })), {
    dur: 0.1,
  });
  playCue(s, c, 'order-read-guide', () => s.play(bufStep.to(3, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'order-first', () => s.play(bufStep.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'order-second', () => s.play(bufStep.to(5, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'order-read-api', () => s.play(bufStep.to(6, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'order-duplicate', () => s.play(bufStep.to(7, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'order-last', () => s.play(bufStep.to(8, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Stage 2 cues (cooperative stop)
  playCue(
    s,
    c,
    'stop-request',
    () => s.play(viewMode.to(2, { duration: 0.05 }), stopStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'stop-set', () => s.play(stopStep.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'stop-children', () => s.play(stopStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });

  // Stage 3 cues (retry policy)
  playCue(
    s,
    c,
    'retry-policy',
    () => s.play(viewMode.to(3, { duration: 0.05 }), retryStep.to(0, { duration: 0.05 })),
    { dur: 0.1 },
  );
  playCue(s, c, 'retry-wait', () => s.play(retryStep.to(1, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'retry-again', () => s.play(retryStep.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'retry-finish', () => s.play(retryStep.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
}
