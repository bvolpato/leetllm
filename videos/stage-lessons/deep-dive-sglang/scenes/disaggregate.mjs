// Scene 23: Reserved destination memory still needs the actual cache data (HERO 3D P/D Disaggregation Fabric: 512 MiB / 25 GB/s = 21.47 ms -> Decode Gate Opens).
import {
  COSMOS,
  KV_PAYLOAD,
  KV_TRANSFER_MS,
  ROLE,
  aura,
  buildPdFabric3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  runPhase,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function disaggregate(s, c) {
  const phase = s.value(0);
  // step:
  // 0 = separate prefill & decode workers
  // 1 = prefill creates prompt KV state
  // 2 = payload = 512 MiB (536,870,912 B, factor 2 for K & V)
  // 3 = reserve 512 MiB destination + transfer in flight
  // 4 = 512 MiB / 25 GB/s = 21.47 ms lower bound
  // 5 = transfer complete -> decode gate OPENS!
  // 6 = track prefill, reservation, transfer readiness, and active decode separately
  const step = s.value(0);

  const bgAura = aura(460, 20, 560, '#5ce1e620', '#6ee7b71a');
  const { view: pd3d } = buildPdFabric3d(step, phase, { x: 475, y: 25, unit: 92 });

  const title = heroTitle(['Reserved Space Still', 'Needs the KV Bytes'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.radix,
    eyebrow: 'P/D DISAGGREGATION · 512 MIB HANDOFF & DECODE GATE',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const prefillDone = st >= 3;
    const reserved = st >= 3;
    const ready = st >= 5;
    const decodeOpen = st >= 5;

    const nodes = [
      txt('3D PREFILL -> DECODE KV FABRIC', 475, -390, 26, ROLE.radix, 'mono').glow(5, ROLE.radix),
      txt(
        decodeOpen ? 'Decode Gate: OPEN (512/512 MiB)' : 'Decode Gate: CLOSED (awaiting bytes)',
        475,
        405,
        26,
        decodeOpen ? ROLE.decode : ROLE.fail,
        'mono',
      ),
    ];

    // Formula & bandwidth bound banner
    nodes.push(
      glassCell(-420, -172, 860, 102, st >= 2 ? COSMOS.gold : COSMOS.dim, {
        fill: st >= 2 ? '#1e1a10' : '#0b101d',
        glow: st >= 2 ? 9 : 2,
      }),
      txt(
        st >= 2
          ? `2x32x8x128x4096x2 = ${KV_PAYLOAD.toLocaleString()} B (512 MiB)`
          : 'Computing full-attention K + V payload...',
        -420,
        -196,
        26,
        st >= 2 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),
      txt(
        st >= 4
          ? `512 MiB / 25 GB/s = ${KV_TRANSFER_MS.toFixed(2)} ms wire lower bound`
          : 'Payload / link bandwidth = transfer lower bound',
        -420,
        -146,
        26,
        st >= 4 ? ROLE.radix : COSMOS.dim,
        'mono',
      ),
    );

    // Transfer progress bar
    const barW = 860;
    const pct = ready ? 1 : st >= 4 ? 0.72 : st >= 3 ? 0.36 : 0.04;
    const fillW = Math.max(8, barW * pct);
    nodes.push(
      txt('R42 KV PAYLOAD TRANSFER', -850, -72, 26, COSMOS.muted, 'mono', 'left'),
      txt(
        ready ? '512 / 512 MiB' : st >= 3 ? 'transferring...' : '0 / 512 MiB',
        10,
        -72,
        26,
        ROLE.radix,
        'mono',
        'right',
      ),
      rect(barW, 28, { fill: '#0b1220', stroke: '#334155', width: 2, radius: 6 }).at(-420, -28),
      rect(fillW, 24, { fill: ready ? ROLE.decode : ROLE.radix, stroke: null, radius: 5 }).at(
        -850 + fillW / 2,
        -28,
      ),
    );

    // 4 independent lifecycle state tiles (2x2 grid)
    const states = [
      {
        title: '1. Prefill',
        val: prefillDone ? 'COMPLETE' : st >= 1 ? 'computing KV' : 'pending',
        col: prefillDone ? ROLE.decode : ROLE.prefill,
        x: -640,
        y: 86,
      },
      {
        title: '2. Reservation',
        val: reserved ? '512 MiB reserved' : 'unreserved',
        col: reserved ? ROLE.radix : COSMOS.dim,
        x: -200,
        y: 86,
      },
      {
        title: '3. Transfer Ready',
        val: ready ? 'READY (full KV)' : 'NOT READY',
        col: ready ? ROLE.decode : ROLE.fail,
        x: -640,
        y: 220,
      },
      {
        title: '4. Decode Gate',
        val: decodeOpen ? 'OPEN -> ACTIVE' : 'CLOSED (wait)',
        col: decodeOpen ? ROLE.decode : COSMOS.dim,
        x: -200,
        y: 220,
      },
    ];

    states.forEach((tile) => {
      nodes.push(
        glassCell(tile.x, tile.y, 415, 108, tile.col, {
          fill:
            tile.col === ROLE.decode ? '#0d2922' : tile.col === ROLE.fail ? '#2a1220' : '#0f1c32',
          glow: 8,
        }),
        txt(tile.title, tile.x, tile.y - 24, 26, COSMOS.muted, 'mono'),
        txt(tile.val, tile.x, tile.y + 24, 28, tile.col, 'mono'),
      );
    });

    const caption =
      st >= 6
        ? 'Track prefill, reservation, readiness, and active decode separately to find where time went.'
        : decodeOpen
          ? 'Decode gate opens only after the entire current KV payload arrives.'
          : 'Reserved destination space is empty until the KV transfer completes.';

    nodes.push(txt(caption, -855, 355, 26, COSMOS.ink, 'sans', 'left'));
    return group(...nodes);
  });

  s.add(bgAura, pd3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, pd3d, { theta: -0.18, phi: 0.9 });
  wireStepCues(s, c, step, [
    ['disaggregate-beat-1-focus-1', 0],
    ['disaggregate-create-kv', 1],
    ['disaggregate-beat-1-focus-2', 2, true],
    ['disaggregate-beat-2-focus-2', 3],
    ['disaggregate-beat-2-focus-1', 4, true],
    ['disaggregate-open-decode-gate', 5, true],
    ['disaggregate-beat-3-focus-1', 6],
  ]);
}
