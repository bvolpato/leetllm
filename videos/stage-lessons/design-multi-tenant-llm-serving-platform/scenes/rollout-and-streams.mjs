// Scene 29: rollout-and-streams - Move new work without changing an existing answer
// Beat 0: Two immutable model/adapter lanes (base-v3/docs-v2 vs base-v4/docs-v3) draining separately.
// Beat 1: Shadow traffic destination authorization gate + explicit quota/compute accounting.
// Beat 2: Partial stream (seq 101, 102 + state S2) blocking silent restart append + retirement before release.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  driftValue,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function rolloutAndStreams(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const newRouteOn = s.value(0);
  const oldKeepOn = s.value(0);
  const b1On = s.value(0);
  const shadowAuthOn = s.value(0);
  const b2On = s.value(0);
  const preOutOn = s.value(0);
  const postOutOn = s.value(0);
  const resumeErrOn = s.value(0);
  const cancelRetOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#60a5fa1a', '#5ce1e61a');
  const header = cinemaHeader(
    'ROLLOUT DRAINING & STREAM CONTINUITY',
    'Move new work without',
    'changing an existing answer',
    { x: -860, y: -450, accent: ROLE.shared, size: 46 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const newR = newRouteOn.value > 0.5;
      const oldK = oldKeepOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const shAuth = shadowAuthOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const postOut = postOutOn.value > 0.5;
      const resErr = resumeErrOn.value > 0.5;
      const canRet = cancelRetOn.value > 0.5;

      const nodes = [];

      if (!b1 && !b2) {
        // Beat 0: Two parallel immutable rollout lanes
        const lanes = [
          {
            cx: -435,
            title: 'IN-FLIGHT LANE  (A-1)',
            rev: 'base-v3  /  docs-v2',
            col: ROLE.A,
            active: true,
            items: ['Old KV history', 'Old cache namespace', 'Draining references'],
          },
          {
            cx: 435,
            title: 'NEW ROLLOUT LANE  (A-2)',
            rev: 'base-v4  /  docs-v3',
            col: ROLE.shared,
            active: newR,
            items: ['New KV history', 'Isolated cache namespace', 'New artifact pins'],
          },
        ];
        lanes.forEach((ln) => {
          nodes.push(
            rect(780, 480, {
              fill: '#0b1224',
              stroke: ln.active ? ln.col : '#2c3d66',
              width: 2.8,
              radius: 18,
            })
              .at(ln.cx, 55)
              .glow(ln.active ? 7 : 0, ln.col),
            txt(ln.title, ln.cx, -135, 28, ln.col, 'mono', 'center'),
            txt(ln.rev, ln.cx, -85, 34, COSMOS.ink, 'mono', 'center'),
          );
          ln.items.forEach((it, idx) => {
            const iy = 12 + idx * 92;
            nodes.push(
              rect(680, 72, {
                fill: '#0d172c',
                stroke: ln.active ? ln.col : '#263354',
                width: 2.2,
                radius: 12,
              }).at(ln.cx, iy),
              txt(it, ln.cx, iy, 27, ln.active ? COSMOS.ink : COSMOS.dim, 'sans', 'center'),
            );
          });
        });

        nodes.push(
          txt(
            oldK
              ? 'Changing a control-plane alias routes future work; A-1 keeps the weights & state it began with.'
              : 'Rollouts resolve immutable revisions, isolate caches, and retain rollback routing.',
            0,
            402,
            28,
            ROLE.focus,
            'sans',
            'center',
          ),
        );
      } else if (b1 && !b2) {
        // Beat 1: Shadow traffic destination authorization gate
        nodes.push(
          rect(620, 210, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
            .at(-515, 20)
            .glow(7, ROLE.A),
          txt('PRODUCTION REQUEST', -515, -34, 28, ROLE.A, 'mono', 'center'),
          txt('Carries real private data', -515, 24, 30, COSMOS.ink, 'sans', 'center'),
          txt('Consumes real GPU compute', -515, 74, 26, COSMOS.muted, 'sans', 'center'),

          line([0, -135], [0, 175], { stroke: shAuth ? ROLE.ok : ROLE.fail, width: 8 }).glow(
            9,
            shAuth ? ROLE.ok : ROLE.fail,
          ),
          txt(
            shAuth ? 'SHADOW GATE: AUTHORIZED' : 'AUTHORIZATION GATE',
            0,
            -172,
            26,
            shAuth ? ROLE.ok : ROLE.fail,
            'mono',
            'center',
          ),

          rect(620, 210, {
            fill: shAuth ? '#0b201b' : '#0b1224',
            stroke: shAuth ? ROLE.ok : '#31426b',
            width: 2.8,
            radius: 16,
          })
            .at(515, 20)
            .glow(shAuth ? 9 : 0, ROLE.ok),
          txt(
            'SHADOW DESTINATION',
            515,
            -34,
            28,
            shAuth ? ROLE.ok : COSMOS.muted,
            'mono',
            'center',
          ),
          txt(
            shAuth ? 'Destination approved' : 'Pending authorization',
            515,
            24,
            30,
            shAuth ? COSMOS.ink : COSMOS.dim,
            'sans',
            'center',
          ),
          txt('Quota & billing declared explicitly', 515, 74, 26, COSMOS.muted, 'sans', 'center'),
        );

        if (shAuth) {
          nodes.push(
            beamWithPhotons(
              [
                [-200, 20],
                [200, 20],
              ],
              ROLE.ok,
              p,
              { width: 4.5, glow: 10, photonCount: 2 },
            ),
          );
        }

        nodes.push(
          rect(1660, 118, { fill: '#19150b', stroke: ROLE.focus, width: 2.6, radius: 16 }).at(
            0,
            315,
          ),
          txt(
            'Worker readiness never proves model quality or tenant isolation: test private RAG & adapter churn.',
            0,
            315,
            28,
            ROLE.focus,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 2: Partial delivered stream & safe cancellation retirement
        nodes.push(
          txt(
            'ALREADY DELIVERED PREFIX  ·  PINNED STATE S2',
            -835,
            -185,
            28,
            ROLE.A,
            'mono',
            'left',
          ),
          txt(
            preOutOn.value > 0.5 && !postOut
              ? 'BEFORE OUTPUT: transparent retry OK'
              : 'AFTER OUTPUT: no silent append!',
            835,
            -185,
            26,
            postOut ? ROLE.fail : ROLE.ok,
            'mono',
            'right',
          ),

          rect(790, 116, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 14 }).at(-430, -82),
          txt('seq 101:  token a', -430, -82, 34, ROLE.A, 'mono', 'center'),

          rect(790, 116, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 14 }).at(430, -82),
          txt('seq 102:  token b', 430, -82, 34, ROLE.A, 'mono', 'center'),

          rect(660, 152, { fill: '#240f19', stroke: ROLE.fail, width: 2.8, radius: 16 })
            .at(-495, 118)
            .glow(postOut ? 9 : 3, ROLE.fail),
          txt('FRESH RESTART GENERATION', -495, 86, 26, ROLE.fail, 'mono', 'center'),
          txt('unrelated tokens: x, y', -495, 140, 32, COSMOS.ink, 'mono', 'center'),

          line([0, 32], [0, 204], { stroke: ROLE.fail, width: 9 }).glow(10, ROLE.fail),

          rect(720, 152, {
            fill: '#19150b',
            stroke: resErr ? ROLE.focus : '#31426b',
            width: 2.8,
            radius: 16,
          })
            .at(465, 118)
            .glow(resErr ? 9 : 2, ROLE.focus),
          txt('SAFE STREAM PROTOCOL', 465, 80, 26, ROLE.focus, 'mono', 'center'),
          txt(
            resErr ? 'Resume at seq 103 + S2, or partial error' : 'Block silent contradiction',
            465,
            138,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ),

          rect(1660, 102, {
            fill: canRet ? '#0b201b' : '#1b160b',
            stroke: canRet ? ROLE.ok : ROLE.warn,
            width: 2.8,
            radius: 14,
          })
            .at(0, 340)
            .glow(canRet ? 9 : 4, canRet ? ROLE.ok : ROLE.warn),
          txt(
            canRet
              ? 'CANCELLED: execution & state refs retired (0 refs)'
              : 'Cancellation completes only after execution and state references safely retire.',
            0,
            340,
            28,
            canRet ? ROLE.ok : ROLE.warn,
            'mono',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  stepOn(s, c, 'mt-rollout-and-streams-b0', b0On, 1);
  stepAfter(s, c, 'mt-rollout-and-streams-s0-0', newRouteOn, 1);
  stepAfter(s, c, 'mt-rollout-and-streams-s0-1', oldKeepOn, 1);
  stepOn(s, c, 'mt-rollout-and-streams-b1', b1On, 1);
  stepAfter(s, c, 'mt-rollout-and-streams-s1-1', shadowAuthOn, 1);
  stepOn(s, c, 'mt-rollout-and-streams-b2', b2On, 1);
  stepAfter(s, c, 'mt-rollout-and-streams-s2-0', preOutOn, 1);
  stepAfter(s, c, 'mt-rollout-and-streams-s2-1', postOutOn, 1);
  stepAfter(s, c, 'mt-rollout-and-streams-s2-2', resumeErrOn, 1);
  stepOn(s, c, 'mt-rollout-and-streams-s2-3', cancelRetOn, 1);
}
