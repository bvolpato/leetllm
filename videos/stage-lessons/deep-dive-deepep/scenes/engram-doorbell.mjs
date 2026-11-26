// Scene 28: Submit the last fetch for each peer.
// Experimental Engram NIC doorbell fix: save 1 deferred get per peer, issue unaggregated final get, record async flush.
import {
  COSMOS,
  ROLE,
  aura,
  buildJitAndStackRig3d,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  orbitScene,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function engramDoorbell(s, c) {
  const phase = s.value(0);
  const stackStage = s.value(0);
  const issuedFinal = s.value(0);
  const flushed = s.value(0);
  const contend = s.value(0);

  const bgAura = aura(470, 12, 500, '#ff6b8b20', '#6ee7b71c');
  const { view: rig3d } = buildJitAndStackRig3d(stackStage, phase, { x: 470, y: 12, unit: 94 });

  const title = heroTitle(['Submit the Last Fetch', 'for Each Peer'], {
    x: -860,
    y: -420,
    size: 54,
    lineHeight: 64,
    accent: ROLE.bad,
    eyebrow: 'ENGRAM TAIL REPAIR · NIC DOORBELL & FLUSH',
    subtitle: 'Aggregated gets can sit queued unless the final get rings the doorbell',
  });

  const live = guardedDynamic(1, () => {
    const isFinal = Math.round(issuedFinal.value) >= 1;
    const isFlush = Math.round(flushed.value) >= 1;
    const isContend = Math.round(contend.value) >= 1;

    const nodes = [
      txt('3D PER-PEER QUEUE -> NIC DOORBELL', 470, -415, 26, ROLE.bad, 'mono').glow(5, ROLE.bad),
      txt(
        isFlush
          ? 'Unaggregated tail get rings NIC doorbell + async flush'
          : 'Old path left final queued fetch stranded in queue',
        470,
        435,
        26,
        isFlush ? ROLE.good : ROLE.bad,
        'mono',
      ),
    ];

    ['Peer A', 'Peer B'].forEach((peer, pi) => {
      const y = -68 + pi * 144;
      nodes.push(txt(peer, -855, y, 27, ROLE.rank0, 'mono', 'left'));
      for (let j = 0; j < 3; j++) {
        const cx = -615 + j * 240;
        const isTail = j === 2;
        const col = isTail ? (isFinal ? ROLE.good : ROLE.bad) : ROLE.rank0;
        nodes.push(
          rect(218, 96, {
            fill: isTail ? (isFinal ? '#0d261e' : '#2d101c') : '#0e192e',
            stroke: col,
            width: isTail ? 2.8 : 2.0,
            radius: 8,
          }).at(cx, y),
          txt(`get ${j}`, cx, y - 18, 28, col, 'mono'),
          txt(
            isTail ? (isFinal ? 'no-agg tail' : 'stuck tail!') : 'aggregated',
            cx,
            y + 22,
            26,
            isTail ? col : COSMOS.muted,
            'sans',
          ),
        );
      }
    });

    nodes.push(
      glassCell(-440, 214, 840, 102, isFlush ? ROLE.good : ROLE.bad, {
        fill: isFlush ? '#0d251d' : '#2c101a',
        glow: 7,
      }),
      txt(
        isFlush
          ? 'Deferred tail issued + async flush recorded'
          : 'Tail fetch waiting for NIC doorbell submission',
        -440,
        214,
        26,
        isFlush ? ROLE.good : ROLE.bad,
        'mono',
      ),
      txt(
        isContend
          ? 'Verify tail entry on each peer · watch QP/stream contention'
          : 'Save 1 get per peer so every queue rings the NIC doorbell',
        -860,
        336,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, rig3d, title, live);
  runPhase(s, c, phase, 14);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.94 });

  c.on('de-engram-doorbell-b0', () =>
    s.play(stackStage.to(0.8, { duration: remainDuration(c, 'de-engram-doorbell-b0', 0.65) })),
  );
  c.after('de-doorbell-final', () => {
    const dur = remainAfterDuration(c, 'de-doorbell-final', 0.35);
    s.play(issuedFinal.to(1, { duration: dur }));
    s.play(stackStage.to(1.5, { duration: dur }));
  });
  c.after('de-doorbell-flush', () => {
    const dur = remainAfterDuration(c, 'de-doorbell-flush', 0.35);
    s.play(flushed.to(1, { duration: dur }));
    s.play(stackStage.to(2, { duration: dur }));
  });
  c.on('de-engram-doorbell-b1', () =>
    s.play(contend.to(1, { duration: remainDuration(c, 'de-engram-doorbell-b1', 0.5) })),
  );
}
