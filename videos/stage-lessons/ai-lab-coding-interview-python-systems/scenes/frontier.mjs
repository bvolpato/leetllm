// Scene 4: frontier - "What stays behind when a page leaves the queue?"
// Single-worker BFS crawl across /start -> /guide -> /api -> /faq with persistent claimed set,
// live queue tape, and strict prediction withholding for /faq placement!
import { line } from 'vizmatic/stage';
import {
  COSMOS,
  CRAWL,
  ROLE,
  cinemaAtmosphere,
  glowArrow,
  glowPill,
  guardedDynamic,
  lowerFooter,
  playCue,
  sceneHeading,
  txt,
} from '../parts.mjs';

const paths = (urls) => urls.map((u) => new URL(u).pathname);

export default function frontier(s, c) {
  const title = sceneHeading(['What stays behind when a', 'page leaves the queue?'], {
    accent: ROLE.workerB,
  });

  // Discrete stage index 0..7 tracking exact BFS transitions from CRAWL.snapshots
  // 0: initial (/start in queue)
  // 1: start popped, returning 3 raw links
  // 2: queue=[/guide, /api], claimed={/start, /guide, /api}
  // 3: /guide popped, returns /api, /faq; queue=[/api]
  // 4: dupe note (/api already claimed)
  // 5: prediction prompt (Where does /faq go?)
  // 6: /faq appended at back -> queue=[/api, /faq], claimed adds /faq
  // 7: /api popped -> returns /start (already claimed), queue=[/faq]
  // 8: /faq popped -> returns [], queue empty, order complete
  const step = s.value(0);

  const snap0 = CRAWL.snapshots[0];
  const snap1 = CRAWL.snapshots[1];
  const snap2 = CRAWL.snapshots[2];
  const snap3 = CRAWL.snapshots[3];
  const snap4 = CRAWL.snapshots[4];

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const st = Math.round(step.value);

      let callbackStr = 'start URL:  https://repo.example/start';
      let queueList = paths(snap0.queue);
      let seenList = paths(snap0.seen);
      let fetchList = paths(snap0.order);

      if (st === 1) {
        callbackStr = '/start ->  /guide,  /api#auth,  other.example/private';
        queueList = [];
        seenList = paths(snap0.seen);
        fetchList = ['/start'];
      } else if (st === 2) {
        callbackStr = 'Drop #auth  ·  Skip other.example  ·  Admit 2 links';
        queueList = paths(snap1.queue);
        seenList = paths(snap1.seen);
        fetchList = paths(snap1.order);
      } else if (st >= 3 && st <= 5) {
        callbackStr = '/guide returns  /api,  /faq';
        queueList = paths(snap1.queue.slice(1));
        seenList = paths(snap1.seen);
        fetchList = [...paths(snap1.order), '/guide'];
      } else if (st === 6) {
        callbackStr = '/faq -> queue back';
        queueList = paths(snap2.queue);
        seenList = paths(snap2.seen);
        fetchList = paths(snap2.order);
      } else if (st === 7) {
        callbackStr = '/api returns  /start  (still in claimed set -> skip)';
        queueList = paths(snap3.queue);
        seenList = paths(snap3.seen);
        fetchList = paths(snap3.order);
      } else if (st >= 8) {
        callbackStr = '/faq returns  []  (crawl complete)';
        queueList = paths(snap4.queue);
        seenList = paths(snap4.seen);
        fetchList = paths(snap4.order);
      }

      const nodes = [
        // Active callback strip (top)
        txt('ACTIVE CALLBACK', -855, -268, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
        glowPill(callbackStr, 110, -268, ROLE.workerA, {
          size: 27,
          fixedW: 1220,
          alpha,
          glow: 7,
        }),

        // Horizontal rails for Queue, Claimed Set, Fetch Order
        txt('FIFO QUEUE', -855, -108, 26, ROLE.workerB, 'mono', 'left').opacity(alpha),
        txt('FRONT ->', -595, -108, 26, ROLE.focus, 'mono', 'left').opacity(alpha),
        line([-440, -108], [840, -108], { stroke: '#253352', width: 2.5 }).opacity(alpha),

        txt('CLAIMED SET', -855, 52, 26, ROLE.focus, 'mono', 'left').opacity(alpha),
        line([-440, 52], [840, 52], { stroke: '#253352', width: 2.5 }).opacity(alpha),

        txt('FETCH ORDER', -855, 212, 26, ROLE.ok, 'mono', 'left').opacity(alpha),
        line([-440, 212], [840, 212], { stroke: '#253352', width: 2.5 }).opacity(alpha),
      ];

      // Render Queue items (left-to-right from front)
      if (queueList.length === 0) {
        nodes.push(
          glowPill('empty', -320, -108, COSMOS.dim, {
            size: 27,
            fixedW: 190,
            alpha: 0.7 * alpha,
            glow: 0,
            textColor: COSMOS.muted,
          }),
        );
      } else {
        queueList.forEach((p, idx) => {
          const qx = -320 + idx * 255;
          nodes.push(
            glowPill(p, qx, -108, idx === 0 ? ROLE.workerB : ROLE.ok, {
              size: 29,
              fixedW: 210,
              alpha,
              glow: idx === 0 ? 11 : 7,
            }),
          );
          if (idx < queueList.length - 1) {
            nodes.push(
              glowArrow(qx + 112, -108, qx + 142, -108, ROLE.workerB, {
                width: 3,
                alpha,
                glow: 4,
              }),
            );
          }
        });
        // During prediction hold (st === 5), show "?" slot cleanly without revealing position!
        if (st === 5) {
          nodes.push(
            glowPill('/faq -> ?', 180, -108, ROLE.focus, {
              size: 28,
              fixedW: 245,
              alpha,
              glow: 12,
            }),
          );
        }
      }

      // Render Claimed Set items (never shrink after pop!)
      seenList.forEach((p, idx) => {
        const sx = -320 + idx * 255;
        const retained = fetchList.includes(p);
        nodes.push(
          glowPill(p, sx, 52, retained ? ROLE.focus : ROLE.workerB, {
            size: 28,
            fixedW: 210,
            alpha,
            glow: retained ? 10 : 6,
          }),
        );
      });

      // Render Fetch Order items
      if (fetchList.length === 0) {
        nodes.push(
          glowPill('none yet', -320, 212, COSMOS.dim, {
            size: 26,
            fixedW: 210,
            alpha: 0.65 * alpha,
            glow: 0,
            textColor: COSMOS.muted,
          }),
        );
      } else {
        fetchList.forEach((p, idx) => {
          const fx = -320 + idx * 285;
          nodes.push(
            glowPill(p, fx, 212, ROLE.ok, {
              size: 28,
              fixedW: 210,
              alpha,
              glow: 9,
            }),
          );
          if (idx < fetchList.length - 1) {
            nodes.push(
              glowArrow(fx + 114, 212, fx + 170, 212, ROLE.ok, { width: 3.2, alpha, glow: 5 }),
            );
          }
        });
      }

      // Bottom prompt / status line
      const capY = 345;
      if (st === 5) {
        nodes.push(
          txt(
            '/api already holds its queue place. Where should /faq go?',
            0,
            capY,
            30,
            ROLE.focus,
            'serif',
            'center',
          )
            .glow(7, ROLE.focus)
            .opacity(alpha),
        );
      } else if (st === 4) {
        nodes.push(
          txt(
            '/api is already claimed, so its earlier queue position stays intact.',
            0,
            capY,
            28,
            ROLE.focus,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else if (st >= 8) {
        nodes.push(
          txt(
            'Exact FIFO order to match with workers: /start -> /guide -> /api -> /faq.',
            0,
            capY,
            28,
            ROLE.ok,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        nodes.push(
          txt(
            'Claimed addresses stay in the set permanently even after leaving the queue.',
            0,
            capY,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha),
        );
      }

      nodes.push(
        lowerFooter(
          'FIFO QUEUE + PERSISTENT CLAIMED SET',
          st >= 8 ? 'ORDER: /start -> /guide -> /api -> /faq' : `CLAIMED: ${seenList.length} URLS`,
          { accent: st >= 8 ? ROLE.ok : ROLE.workerB, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.workerB, ROLE.ok), title, layer);

  playCue(s, c, 'frontier-links', () => s.play(step.to(1, { duration: 0.05 })), { dur: 0.1 });
  playCue(s, c, 'frontier-start', () => s.play(step.to(2, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'frontier-guide', () => s.play(step.to(3, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'frontier-dupe', () => s.play(step.to(4, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'frontier-predict', () => s.play(step.to(5, { duration: 0.05 })), { dur: 0.1 });
  // Strict prediction reveal ONLY AFTER 'frontier-faq'!
  playCue(s, c, 'frontier-faq', () => s.play(step.to(6, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'frontier-api', () => s.play(step.to(7, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
  playCue(s, c, 'frontier-end', () => s.play(step.to(8, { duration: 0.05 })), {
    after: true,
    dur: 0.1,
  });
}
