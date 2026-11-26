// Scene 20: extra-work - Account for verification and preemption before calling capacity free
// Beat 0: Speculative decoding 3 proposed -> 3 verified -> 1 accepted (distinct counters!).
// Beat 1: Preemption selects victim -> P7 still has live ref 1 until device retirement -> then C reserves atomically.
// Beat 2: Repeated prefill thrashing loop degrades completion latency and useful goodput.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  buildKvPageTile,
  cinemaHeader,
  driftValue,
  guardedDynamic,
  stepAfter,
  stepOn,
  txt,
} from '../parts.mjs';

export default function extraWork(s, c) {
  const pulse = s.value(0);
  const b0On = s.value(0);
  const verOn = s.value(0);
  const cntOn = s.value(0);
  const b1On = s.value(0);
  const victimOn = s.value(0);
  const retireOn = s.value(0);
  const b2On = s.value(0);
  const thrashOn = s.value(0);

  const stageAura = aura(0, 20, 760, '#5ce1e61a', '#ffd16618');
  const header = cinemaHeader(
    'SPECULATION & PREEMPTION OVERHEAD',
    'Account for verification & preemption',
    'before calling capacity free',
    { x: -860, y: -450, accent: ROLE.warn, size: 44 },
  );

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const ver = verOn.value > 0.5;
      const cnt = cntOn.value > 0.5;
      const b1 = b1On.value > 0.5;
      const vic = victimOn.value > 0.5;
      const ret = retireOn.value > 0.5;
      const b2 = b2On.value > 0.5;
      const thr = thrashOn.value > 0.5;

      const nodes = [];

      if (!b1 && !b2) {
        // Beat 0: Speculative decoding distinct counters (3 proposed, 3 verified, 1 accepted)
        const props = [
          { id: 'Proposal p1', accepted: true, cx: -560 },
          { id: 'Proposal p2', accepted: false, cx: 0 },
          { id: 'Proposal p3', accepted: false, cx: 560 },
        ];
        props.forEach((pr, idx) => {
          nodes.push(
            rect(430, 108, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 14 })
              .at(pr.cx, -165)
              .glow(6, ROLE.A),
            txt(pr.id, pr.cx, -165, 32, ROLE.A, 'mono', 'center'),

            beamWithPhotons(
              [
                [pr.cx, -108],
                [pr.cx, -18],
              ],
              ROLE.shared,
              p + idx * 0.25,
              { width: 3.6, glow: 7, photonCount: 1, alpha: ver ? 1 : 0.35 },
            ),

            rect(430, 114, {
              fill: '#0b1a28',
              stroke: ver ? ROLE.shared : '#2c3d66',
              width: 2.8,
              radius: 14,
            })
              .at(pr.cx, 44)
              .glow(ver ? 8 : 0, ROLE.shared),
            txt(
              `Target verifies ${pr.id.slice(-2)}`,
              pr.cx,
              44,
              28,
              ver ? ROLE.shared : COSMOS.muted,
              'mono',
              'center',
            ),
          );

          if (cnt) {
            const col = pr.accepted ? ROLE.ok : ROLE.fail;
            nodes.push(
              rect(360, 68, {
                fill: pr.accepted ? '#0b221b' : '#240f19',
                stroke: col,
                width: 2.6,
                radius: 12,
              })
                .at(pr.cx, 198)
                .glow(8, col),
              txt(pr.accepted ? 'ACCEPTED' : 'REJECTED', pr.cx, 198, 28, col, 'mono', 'center'),
            );
          }
        });

        nodes.push(
          rect(1660, 114, {
            fill: '#19150b',
            stroke: cnt ? ROLE.focus : '#2c3d66',
            width: 2.8,
            radius: 16,
          })
            .at(0, 352)
            .glow(cnt ? 9 : 0, ROLE.focus),
          txt(
            cnt
              ? '3 VERIFIED POSITIONS  ·  1 ACCEPTED OUTPUT  (reserve & bill temporary verification work)'
              : 'Speculative decoding spends target compute and temporary KV state on every proposal.',
            0,
            352,
            27,
            cnt ? ROLE.focus : COSMOS.muted,
            'mono',
            'center',
          ),
        );
      } else if (b1 && !b2) {
        // Beat 1: Preemption page P7 retirement boundary before atomic C reservation
        nodes.push(
          rect(620, 108, { fill: '#1f190b', stroke: ROLE.held, width: 2.8, radius: 14 })
            .at(-510, -182)
            .glow(7, ROLE.held),
          txt('1. VICTIM SELECTED IN LIST', -510, -182, 28, ROLE.held, 'mono', 'center'),

          rect(620, 108, { fill: '#0b1428', stroke: ROLE.C, width: 2.8, radius: 14 })
            .at(510, -182)
            .glow(ret ? 9 : 4, ROLE.C),
          txt('WAITING NEWCOMER: TENANT C', 510, -182, 28, ROLE.C, 'mono', 'center'),

          ...buildKvPageTile({
            id: 'Page P7',
            cx: -510,
            cy: 95,
            used: 16,
            owner: ret ? 'Tenant C' : 'Victim',
            color: ret ? ROLE.C : ROLE.held,
            borderColor: ret ? ROLE.ok : ROLE.fail,
            footerText: ret
              ? '0 old refs · atomically assigned to C'
              : '1 LIVE DEVICE REF · NOT FREE',
          }),

          rect(760, 185, {
            fill: ret ? '#0b201b' : '#240f19',
            stroke: ret ? ROLE.ok : ROLE.fail,
            width: 3.0,
            radius: 16,
          })
            .at(440, 80)
            .glow(9, ret ? ROLE.ok : ROLE.fail),
          txt(
            ret ? 'RETIREMENT CONFIRMED' : 'OLD DEVICE READ STILL LIVE',
            440,
            38,
            30,
            ret ? ROLE.ok : ROLE.fail,
            'mono',
            'center',
          ),
          txt(
            ret
              ? 'Save resume state -> retire device -> hand off P7'
              : vic
                ? 'Selecting a victim in a list does NOT free P7!'
                : 'Allocator and execution must agree before handoff.',
            440,
            106,
            26,
            COSMOS.ink,
            'sans',
            'center',
          ),
        );

        if (ret) {
          nodes.push(
            beamWithPhotons(
              [
                [-345, 95],
                [52, 95],
              ],
              ROLE.ok,
              p,
              { width: 4.2, glow: 9, photonCount: 2 },
            ),
          );
        }

        nodes.push(
          txt(
            ret
              ? 'Update ownership and atomically reserve P7 for C only after device retirement.'
              : 'Never promise preempted KV blocks before device reads finish and retire.',
            0,
            408,
            29,
            ret ? ROLE.ok : ROLE.fail,
            'sans',
            'center',
          ),
        );
      } else {
        // Beat 2: Repeated prefill thrashing loop
        nodes.push(
          txt('REPEATED PREEMPTION THRASHING LOOP', 840, -395, 26, ROLE.fail, 'mono', 'right'),
        );
        for (let i = 0; i < 3; i++) {
          const y = -148 + i * 165;
          nodes.push(
            rect(610, 108, { fill: '#0b1428', stroke: ROLE.A, width: 2.8, radius: 14 })
              .at(-490, y)
              .glow(thr ? 7 : 3, ROLE.A),
            txt(`Same victim: prefill #${i + 1}`, -490, y, 30, ROLE.A, 'mono', 'center'),

            beamWithPhotons(
              [
                [-175, y],
                [175, y],
              ],
              ROLE.warn,
              p + i * 0.25,
              { width: 4, glow: 8, photonCount: 2 },
            ),

            rect(610, 108, { fill: '#22150b', stroke: ROLE.warn, width: 2.8, radius: 14 })
              .at(490, y)
              .glow(thr ? 8 : 3, ROLE.warn),
            txt('Recomputes time & cost again', 490, y, 28, ROLE.warn, 'mono', 'center'),
          );
        }
        nodes.push(
          txt(
            'Aggressive over-admission raises occupancy while hurting completion latency and goodput.',
            0,
            395,
            29,
            ROLE.fail,
            'sans',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.5);

  stepOn(s, c, 'mt-extra-work-b0', b0On, 1);
  stepAfter(s, c, 'mt-extra-work-s0-0', verOn, 1);
  stepAfter(s, c, 'mt-extra-work-s0-1', cntOn, 1);
  stepOn(s, c, 'mt-extra-work-b1', b1On, 1);
  stepAfter(s, c, 'mt-extra-work-s1-1', victimOn, 1);
  stepOn(s, c, 'mt-extra-work-s1-2', retireOn, 1);
  stepOn(s, c, 'mt-extra-work-b2', b2On, 1);
  stepAfter(s, c, 'mt-extra-work-s2-0', thrashOn, 1);
}
