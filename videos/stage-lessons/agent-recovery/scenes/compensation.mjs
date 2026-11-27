// Scene 14: compensation - "Where are the replacement pods?"
// Stage 1: Kubernetes Node A cordon/evict -> original pods terminate -> 4 replacement pods appear
// on Nodes B & C -> Uncordoning Node A permits future scheduling only (4 pods stay on B & C!).
// Stage 2: Saga-style compensation log (dependency order, timeout durable checkpoint, queued vs done vs notice).
import { circle } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  ambientClock,
  cinemaAtmosphere,
  glowArrow,
  glowCross,
  glowPill,
  glowRing,
  guardedDynamic,
  heroTitle,
  hexAlpha,
  lowerFooter,
  playCue,
  txt,
} from '../parts.mjs';

export default function compensation(s, c) {
  const title = heroTitle(['Where are the replacement pods?'], {
    x: -855,
    y: -440,
    size: 52,
    accent: ROLE.agent,
  });

  const amb = ambientClock(s, c);
  const stage = s.value(0); // 0 = K8s nodes A/B/C, 1 = Saga recovery
  const evicted = s.value(0);
  const imgFail = s.value(0);
  const showRepl = s.value(0);
  const uncordoned = s.value(0);
  const showInspect = s.value(0);

  const showSaga = s.value(0);
  const showOrder = s.value(0);
  const showTimeout = s.value(0);
  const showLimits = s.value(0);

  const layer = guardedDynamic(
    () => 1,
    (alpha) => {
      const pulse = 0.5 + 0.5 * Math.sin(amb.value * Math.PI * 10);
      const st = Math.round(stage.value);
      const nodes = [];

      if (st === 0) {
        // Stage 1: Three glowing cluster node rings (Node A, Node B, Node C)
        const nA = [-540, 15];
        const nB = [0, 15];
        const nC = [540, 15];
        const nodeR = 148;

        const colA =
          uncordoned.value > 0.5 ? ROLE.sure : evicted.value > 0.4 ? ROLE.fail : ROLE.agent;
        nodes.push(
          txt('NODE A', nA[0], -195, 30, colA, 'mono', 'center').opacity(alpha),
          txt('NODE B', nB[0], -195, 30, ROLE.sure, 'mono', 'center').opacity(alpha),
          txt('NODE C', nC[0], -195, 30, ROLE.sure, 'mono', 'center').opacity(alpha),
          glowRing(nA[0], nA[1], nodeR, colA, { width: 3.6, glow: 10 }).opacity(alpha),
          glowRing(nB[0], nB[1], nodeR, ROLE.sure, { width: 3.2, glow: 8 }).opacity(alpha),
          glowRing(nC[0], nC[1], nodeR, ROLE.sure, { width: 3.2, glow: 8 }).opacity(alpha),
        );

        // Node A status badge
        const statusA =
          uncordoned.value > 0.5
            ? 'UNCORDONED (future only)'
            : evicted.value > 0.4
              ? 'CORDONED & DRAINED'
              : '4 original pods';
        nodes.push(glowPill(statusA, nA[0], 218, colA, { size: 26, alpha }));

        // Original 4 pods on Node A (fade out & terminate on eviction)
        const origAlpha = Math.max(0, 1 - evicted.value * 1.15) * alpha;
        if (origAlpha > 0.05) {
          for (const [dx, dy, name] of [
            [-48, -42, 'p1'],
            [48, -42, 'p2'],
            [-48, 42, 'p3'],
            [48, 42, 'p4'],
          ]) {
            nodes.push(
              circle(28, {
                fill: hexAlpha(ROLE.agent, 0.25 * origAlpha),
                stroke: ROLE.agent,
                width: 2.6,
              }).at(nA[0] + dx, nA[1] + dy),
              txt(name, nA[0] + dx, nA[1] + dy, 26, COSMOS.ink, 'mono', 'center').opacity(
                origAlpha,
              ),
            );
          }
        } else {
          nodes.push(
            txt(
              uncordoned.value > 0.5 ? '0 pods moved back' : 'pods terminated',
              nA[0],
              nA[1],
              26,
              uncordoned.value > 0.5 ? ROLE.mark : ROLE.fail,
              'mono',
              'center',
            ).opacity(alpha),
          );
        }

        // Image unavailable alert badge above Node A -> B
        if (imgFail.value > 0.3 && uncordoned.value < 0.5) {
          nodes.push(
            glowPill('Replacement image unavailable', -270, -270, ROLE.fail, {
              size: 26,
              alpha: imgFail.value * alpha,
            }),
          );
        }

        // 4 Distinct replacement pods on Nodes B & C (STAY on B & C even after Node A uncordons!)
        if (showRepl.value > 0.1) {
          const ra = showRepl.value * alpha;
          const bPods = [
            [-45, 0, 'r1'],
            [45, 0, 'r2'],
          ];
          const cPods = [
            [-45, 0, 'r3'],
            [45, 0, 'r4'],
          ];
          for (const [dx, dy, name] of bPods) {
            nodes.push(
              circle(32, {
                fill: hexAlpha(ROLE.sure, 0.24 * ra),
                stroke: ROLE.sure,
                width: 3,
              })
                .at(nB[0] + dx, nB[1] + dy)
                .glow(10, ROLE.sure),
              txt(name, nB[0] + dx, nB[1] + dy, 26, COSMOS.ink, 'mono', 'center').opacity(ra),
            );
          }
          for (const [dx, dy, name] of cPods) {
            nodes.push(
              circle(32, {
                fill: hexAlpha(ROLE.sure, 0.24 * ra),
                stroke: ROLE.sure,
                width: 3,
              })
                .at(nC[0] + dx, nC[1] + dy)
                .glow(10, ROLE.sure),
              txt(name, nC[0] + dx, nC[1] + dy, 26, COSMOS.ink, 'mono', 'center').opacity(ra),
            );
          }
          nodes.push(
            glowPill('2 replacements STAY', nB[0], 218, ROLE.sure, { size: 26, alpha: ra }),
            glowPill('2 replacements STAY', nC[0], 218, ROLE.sure, { size: 26, alpha: ra }),
          );
        }

        nodes.push(
          txt(
            showInspect.value > 0.5
              ? 'Health check + current permission choose forward repair, compensation, or human review.'
              : 'Compensation is a new forward action, not a time machine back to the original pods.',
            0,
            325,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ).opacity(alpha),
        );
      } else {
        // Stage 2: Saga-style compensation log & irreversibility boundaries
        nodes.push(
          txt(
            'SAGA RECOVERY: RECORD CONFIRMED STEPS & COMPENSATIONS',
            0,
            -275,
            27,
            ROLE.violet,
            'mono',
            'center',
          ).opacity(alpha),
        );

        // Saga step flow at y = -105
        const sy = -105;
        nodes.push(
          glowPill('Step 1: Cordon', -610, sy, ROLE.sure, { size: 26, alpha }),
          glowArrow(-470, sy, -350, sy, ROLE.sure, { width: 3.2, alpha }),
          glowPill('Step 2: Drain', -215, sy, ROLE.sure, { size: 26, alpha }),
          glowArrow(-90, sy, 35, sy, ROLE.mark, { width: 3.2, alpha }),
          glowPill('Repair: Placement', 195, sy, showTimeout.value > 0.4 ? ROLE.fail : ROLE.mark, {
            size: 26,
            alpha: Math.max(0.5, showSaga.value) * alpha,
          }),
          glowArrow(355, sy, 480, sy, ROLE.violet, { width: 3.2, alpha, dash: [7, 6] }),
          glowPill('Save last step', 635, sy, ROLE.violet, {
            size: 26,
            alpha: Math.max(0.45, showTimeout.value) * alpha,
          }),
        );

        if (showTimeout.value > 0.4) {
          nodes.push(
            glowCross(195, sy - 64, 28, ROLE.fail, showTimeout.value * alpha),
            txt(
              'TIMEOUT -> check remote effect before retry',
              195,
              sy - 102,
              26,
              ROLE.fail,
              'mono',
              'center',
            ).opacity(showTimeout.value * alpha),
          );
        }

        // Three irreversibility realities at y = 115
        const cards = [
          { x: -550, label: 'QUEUED JOB', note: 'May still be canceled', col: ROLE.sure },
          { x: 0, label: 'COMPLETED ROLLOUT', note: 'Needs a new deployment', col: ROLE.mark },
          {
            x: 550,
            label: 'SENT NOTIFICATION',
            note: 'Cannot unread; retract only',
            col: ROLE.fail,
          },
        ];
        for (const item of cards) {
          const op = Math.max(0.4, showLimits.value) * alpha;
          nodes.push(
            glowPill(item.label, item.x, 85, item.col, { size: 26, alpha: op }),
            txt(item.note, item.x, 152, 26, COSMOS.ink, 'sans', 'center').opacity(op),
          );
        }

        nodes.push(
          txt(
            showOrder.value > 0.4
              ? 'Dependencies decide which repairs run sequentially and which can run in parallel.'
              : 'Record each confirmed step durably so timed-out repairs reconcile safely.',
            0,
            315,
            27,
            COSMOS.muted,
            'sans',
            'center',
          ).opacity(alpha * (0.85 + 0.15 * pulse)),
        );
      }

      nodes.push(
        lowerFooter(
          'COMPENSATION != UNDO · SAGA DURABLE PROGRESS',
          st === 0
            ? 'UNCORDON PERMITS FUTURE SCHEDULING ONLY'
            : 'CHECK EFFECT BEFORE REPEATING REPAIR',
          { accent: st === 0 ? ROLE.agent : ROLE.violet, alpha },
        ),
      );

      return nodes;
    },
  );

  s.add(cinemaAtmosphere(ROLE.agent, ROLE.violet), title, layer);

  playCue(s, c, 'pods-evicted', (d) => s.play(evicted.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'image-unavailable', (d) => s.play(imgFail.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'replacement-pods', (d) => s.play(showRepl.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'uncordon', (d) => s.play(uncordoned.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'not-restore', (d) => s.play(showRepl.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'not-healthy', (d) => s.play(showInspect.to(0.6, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'inspect', (d) => s.play(showInspect.to(1, { duration: d })), { dur: 0.4 });

  playCue(
    s,
    c,
    'saga-records',
    (d) => s.play(stage.to(1, { duration: 0.15 }), showSaga.to(1, { duration: d })),
    {
      dur: 0.45,
    },
  );
  playCue(s, c, 'order', (d) => s.play(showOrder.to(1, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'saga-progress', (d) => s.play(showTimeout.to(0.7, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'durable-progress', (d) => s.play(showTimeout.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'queued-vs-done', (d) => s.play(showLimits.to(0.7, { duration: d })), { dur: 0.4 });
  playCue(s, c, 'notification', (d) => s.play(showLimits.to(1, { duration: d })), { dur: 0.4 });
}
