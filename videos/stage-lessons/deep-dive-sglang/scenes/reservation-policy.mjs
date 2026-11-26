// Scene 25: Keep reserved, received and active decode bytes separate (10 x 512 MiB = 5 GiB reserved with 0 received; early vs prefill_complete policy).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function reservationPolicy(s, c) {
  const phase = s.value(0);
  // step: 0=pending prefills reserve destination slots, 1=10 x 512 MiB = 5 GiB reserved (0 received, 0 decoding),
  // 2=early policy overlaps chunked prefill + transfer, 3=prefill_complete defers reservation (holds source KV, loses overlap),
  // 4=workers must agree on policy, revision, and layout
  const step = s.value(0);

  const bgAura = aura(0, 20, 640, '#60a5fa1c', '#ff6b8b16');
  const title = heroTitle(['Separate Reserved,', 'Received & Active KV'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.prefill,
    eyebrow: 'DECODE POOL CAPACITY · EARLY VS PREFILL-COMPLETE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const p = phase.value;
    const nodes = [];

    if (st <= 1) {
      // 2x5 grid of 10 reserved 512 MiB slots = 5 GiB
      nodes.push(
        txt(
          'DECODE POOL DESTINATION SLOTS (10 PENDING PREFILLS)',
          0,
          -205,
          26,
          ROLE.prefill,
          'mono',
        ),
      );
      for (let i = 0; i < 10; i++) {
        const colIdx = i % 5;
        const rowIdx = Math.floor(i / 5);
        const cx = -600 + colIdx * 300;
        const cy = -95 + rowIdx * 145;
        nodes.push(
          glassCell(cx, cy, 272, 114, ROLE.prefill, { fill: '#10213d', glow: 8 }),
          txt(`P${i} · reserved`, cx, cy - 22, 26, ROLE.prefill, 'mono'),
          txt('512 MiB (0 B in)', cx, cy + 24, 26, COSMOS.muted, 'mono'),
        );
      }

      nodes.push(
        glassCell(0, 208, 1470, 98, st >= 1 ? COSMOS.gold : ROLE.radix, {
          fill: st >= 1 ? '#201c10' : '#0e2436',
          glow: 9,
        }),
        txt(
          st >= 1
            ? '10 x 512 MiB = 5 GiB RESERVED  |  0 B RECEIVED  |  0 ACTIVE DECODE'
            : 'Destination pool can fill up with reservations before bytes arrive',
          0,
          208,
          28,
          st >= 1 ? COSMOS.gold : ROLE.radix,
          'mono',
        ),
      );
    } else {
      // Early vs Prefill-Complete timeline comparison
      const deferred = st >= 3;
      const x0 = -560;
      const xOf = (t) => x0 + (t / 40) * 1240;

      nodes.push(
        txt('EARLY POLICY (DEFAULT: OVERLAP PREFILL & TRANSFER)', 0, -205, 26, ROLE.radix, 'mono'),
        txt('Prefill', -780, -135, 26, ROLE.prefill, 'mono', 'left'),
        glassCell((xOf(0) + xOf(20)) / 2, -135, xOf(20) - xOf(0), 58, ROLE.prefill, {
          fill: '#10213d',
          glow: 8,
        }),
        txt('Prefill chunks (0..20)', (xOf(0) + xOf(20)) / 2, -135, 26, COSMOS.ink, 'mono'),

        txt('Transfer', -780, -60, 26, ROLE.radix, 'mono', 'left'),
        glassCell((xOf(10) + xOf(30)) / 2, -60, xOf(30) - xOf(10), 58, ROLE.radix, {
          fill: '#0e2536',
          glow: 8,
        }),
        txt(
          'Overlapped KV transfer (10..30)',
          (xOf(10) + xOf(30)) / 2,
          -60,
          26,
          ROLE.radix,
          'mono',
        ),

        txt(
          'PREFILL-COMPLETE POLICY (DEFERRED RESERVATION · MOONCAKE)',
          0,
          38,
          26,
          deferred ? ROLE.fail : COSMOS.muted,
          'mono',
        ),
        txt('Prefill', -780, 108, 26, ROLE.prefill, 'mono', 'left'),
        glassCell((xOf(0) + xOf(20)) / 2, 108, xOf(20) - xOf(0), 58, ROLE.prefill, {
          fill: '#10213d',
          glow: 6,
        }),
        txt(
          'Full prefill (source KV held longer)',
          (xOf(0) + xOf(20)) / 2,
          108,
          26,
          COSMOS.ink,
          'mono',
        ),

        txt('Transfer', -780, 185, 26, deferred ? ROLE.fail : COSMOS.dim, 'mono', 'left'),
        glassCell(
          (xOf(20) + xOf(40)) / 2,
          185,
          xOf(40) - xOf(20),
          58,
          deferred ? ROLE.fail : COSMOS.dim,
          {
            fill: deferred ? '#2c1120' : '#0b101d',
            glow: deferred ? 10 : 2,
          },
        ),
        txt(
          'Exposed transfer after prefill (20..40)',
          (xOf(20) + xOf(40)) / 2,
          185,
          26,
          deferred ? ROLE.fail : COSMOS.dim,
          'mono',
        ),
      );
    }

    const u = (p * 0.65) % 1;
    nodes.push(
      glowDot(-720 + u * 1440, 288, { radius: 6, color: st >= 3 ? ROLE.fail : ROLE.radix }),
      txt(
        st >= 4
          ? 'Workers must agree on reservation policy, revision, and layout; compare both queues.'
          : st >= 3
            ? 'Deferring frees destination KV early, but holds source KV longer and loses overlap.'
            : 'Track reserved space, received bytes, and active decodes as three distinct metrics.',
        0,
        355,
        28,
        COSMOS.ink,
        'sans',
      ),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);
  wireStepCues(s, c, step, [
    ['sg-reservation-policy-beat-0', 0],
    ['sg-reservation-five', 1, true],
    ['sg-reservation-policy-beat-1', 2],
    ['sg-reservation-deferred', 3, true],
    ['sg-reservation-policy-beat-2', 4],
  ]);
}
