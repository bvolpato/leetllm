// Scene 22: adapter-revisions - Pin the approved artifact while an alias moves
// Beat 0: Low-rank LoRA equation y = Wx + BAx (behavior change != document authorization).
// Beat 1: Alias docs-current advances docs-v2 -> docs-v3; running A-1 & its KV stay pinned on docs-v2.
// Beat 2: Every GPU adapter slot pinned -> cold adapter waits or picks another worker.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  glowTex,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function adapterRevisions(s, c) {
  const b0On = s.value(0);
  const authNoteOn = s.value(0);
  const resolveOn = s.value(0);
  const b1On = s.value(0);
  const aliasMoveOn = s.value(0);
  const newReqOn = s.value(0);
  const b2On = s.value(0);
  const slotWaitOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#a78bfa1e', '#60a5fa16');
  const header = cinemaHeader(
    'IMMUTABLE ADAPTER REVISIONS',
    'Pin the approved artifact',
    'while an alias moves',
    { x: -860, y: -450, accent: ROLE.adapter, size: 46 },
  );

  // Beat 0 MathJax equation rendered cleanly when beat 0 is active
  const loraEq = glowTex('y = Wx + BAx', { x: 0, y: 120, size: 54, color: ROLE.ok, glow: 8 });
  const eqVis = s.value(1);

  const view = guardedDynamic(
    () => 1,
    () => {
      const authNote = authNoteOn.value > 0.5;
      const resolved = resolveOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const moved = aliasMoveOn.value > 0.5;
      const newReq = newReqOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const wait = slotWaitOn.value > 0.5;

      const nodes = [];

      if (!b1 && !b2) {
        // Beat 0: Frozen base W + Low-rank B A -> y = Wx + BAx
        nodes.push(
          rect(620, 160, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 16 })
            .at(-470, -100)
            .glow(7, ROLE.A),
          txt('FROZEN BASE WEIGHTS', -470, -134, 26, ROLE.A, 'mono', 'center'),
          txt('W  (base-v3)', -470, -76, 40, COSMOS.ink, 'mono', 'center'),

          txt('+', 0, -100, 62, ROLE.focus, 'mono', 'center'),

          rect(620, 160, { fill: '#16102a', stroke: ROLE.adapter, width: 2.8, radius: 16 })
            .at(470, -100)
            .glow(8, ROLE.adapter),
          txt('LEARNED LOW-RANK ADAPTER', 470, -134, 26, ROLE.adapter, 'mono', 'center'),
          txt('B A  (docs-v2)', 470, -76, 40, COSMOS.ink, 'mono', 'center'),

          beamWithPhotons(
            [
              [-470, -16],
              [-140, 72],
            ],
            ROLE.A,
            0,
            { width: 3.6, glow: 7 },
          ),
          beamWithPhotons(
            [
              [470, -16],
              [140, 72],
            ],
            ROLE.adapter,
            0,
            { width: 3.6, glow: 7 },
          ),

          rect(1660, 128, {
            fill: authNote ? '#1f170b' : '#0b1426',
            stroke: authNote ? ROLE.focus : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(0, 325)
            .glow(authNote ? 8 : 0, ROLE.focus),
          txt(
            resolved
              ? 'RESOLVE ALIAS -> APPROVED IMMUTABLE REVISION BEFORE DISPATCH'
              : 'ADAPTER BEHAVIOR CHANGE  !=  DOCUMENT AUTHORIZATION',
            0,
            298,
            28,
            ROLE.focus,
            'mono',
            'center',
          ),
          txt(
            'A hot local copy saves loading latency; residency never grants permission.',
            0,
            348,
            27,
            COSMOS.ink,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 1 & Beat 2: Alias docs-current moves docs-v2 -> docs-v3 while A-1 stays pinned!
        const aliasTarget = moved ? 'docs-v3' : 'docs-v2';
        nodes.push(
          rect(910, 86, { fill: '#19150b', stroke: ROLE.focus, width: 3.0, radius: 14 })
            .at(385, -395)
            .glow(8, ROLE.focus),
          txt(
            `ALIAS  docs-current  ->  ${aliasTarget}`,
            385,
            -395,
            30,
            ROLE.focus,
            'mono',
            'center',
          ),

          // Left: Running A-1 pinned on docs-v2 + KV state
          rect(760, 210, { fill: '#0b1428', stroke: ROLE.A, width: 3.0, radius: 16 })
            .at(-440, -100)
            .glow(8, ROLE.A),
          txt('RUNNING REQUEST A-1', -440, -158, 26, ROLE.A, 'mono', 'center'),
          txt('Pinned: docs-v2', -440, -102, 40, COSMOS.ink, 'mono', 'center'),
          txt(
            'Retries & KV history stay strictly docs-v2',
            -440,
            -40,
            26,
            ROLE.shared,
            'sans',
            'center',
          ),

          // Right: New request A-2 resolving docs-v3
          rect(760, 210, {
            fill: newReq ? '#0b1c28' : '#0b1224',
            stroke: newReq ? ROLE.shared : '#31426b',
            width: 3.0,
            radius: 16,
          })
            .at(440, -100)
            .glow(newReq ? 9 : 0, ROLE.shared),
          txt(
            'NEW REQUEST A-2',
            440,
            -158,
            26,
            newReq ? ROLE.shared : COSMOS.muted,
            'mono',
            'center',
          ),
          txt(
            newReq ? 'Resolved: docs-v3' : 'Waiting for alias update',
            440,
            -102,
            40,
            newReq ? COSMOS.ink : COSMOS.dim,
            'mono',
            'center',
          ),
          txt('Fresh KV namespace for docs-v3', 440, -40, 26, COSMOS.muted, 'sans', 'center'),
        );

        if (b2) {
          // Beat 2: All GPU adapter slots pinned -> cold adapter waits / reroutes
          const slots = [
            'Slot 0: docs-v2 (pin 1)',
            'Slot 1: fin-v4 (pin 2)',
            'Slot 2: code-v1 (pin 1)',
          ];
          slots.forEach((label, idx) => {
            const sx = -555 + idx * 555;
            nodes.push(
              rect(510, 108, { fill: '#220f19', stroke: ROLE.fail, width: 2.8, radius: 14 })
                .at(sx, 145)
                .glow(7, ROLE.fail),
              txt(label, sx, 145, 26, ROLE.fail, 'mono', 'center'),
            );
          });
          nodes.push(
            rect(1660, 118, {
              fill: wait ? '#26101a' : '#0d1528',
              stroke: wait ? ROLE.fail : ROLE.focus,
              width: 2.8,
              radius: 16,
            })
              .at(0, 345)
              .glow(wait ? 9 : 4, wait ? ROLE.fail : ROLE.focus),
            txt(
              wait
                ? 'ALL SLOTS PINNED: WAIT OR REROUTE'
                : 'VALIDATE OWNERSHIP, INTEGRITY, RANK, BASE COMPATIBILITY · PROTECT ADMIN LOAD API',
              0,
              345,
              26,
              wait ? ROLE.fail : ROLE.focus,
              'mono',
              'center',
            ),
          );
        } else {
          nodes.push(
            rect(1660, 136, { fill: '#0b1a24', stroke: ROLE.ok, width: 2.8, radius: 16 }).at(
              0,
              210,
            ),
            txt(
              'ALIAS UPDATES NEVER MUTATE IN-FLIGHT COMPUTATION',
              0,
              182,
              28,
              ROLE.ok,
              'mono',
              'center',
            ),
            txt(
              'Existing KV state belongs to docs-v2; moving docs-current only routes newly admitted work.',
              0,
              236,
              27,
              COSMOS.ink,
              'sans',
              'center',
            ),
          );
        }
      }

      return group(...nodes);
    },
  );

  const eqWrap = guardedDynamic(
    () => (b1On.value > 0.5 ? 0 : 1),
    () => loraEq,
  );

  s.add(stageAura, header, view, eqWrap);
  stepOn(s, c, 'mt-adapter-revisions-b0', b0On, 1);
  stepAfter(s, c, 'mt-adapter-revisions-s0-1', authNoteOn, 1);
  stepAfter(s, c, 'mt-adapter-revisions-s0-2', resolveOn, 1);
  c.on('mt-adapter-revisions-b1', () => {
    s.play(b1On.to(1, { duration: 0.06 }), eqVis.to(0, { duration: 0.06 }));
  });
  stepAfter(s, c, 'mt-adapter-revisions-s1-0', aliasMoveOn, 1);
  stepAfter(s, c, 'mt-adapter-revisions-s1-1', newReqOn, 1);
  stepOn(s, c, 'mt-adapter-revisions-b2', b2On, 1);
  stepOn(s, c, 'mt-adapter-revisions-s2-3', slotWaitOn, 1);
}
