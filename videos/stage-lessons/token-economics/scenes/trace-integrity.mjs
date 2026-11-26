// Scene 19: trace-integrity - Bind historical spend to exact rate content
// Orbiting 3D cryptographic rate-table seal + live SHA-256 content digest check.
// Editing output rate $15 -> $16 under the same table ID (`standard-sep21`) breaks the SHA-256 fingerprint (REJECT);
// `restore-rates` restores exact bytes and digest match; beat 2 anchors approval & archived table governance.
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addPointerArc3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeInNodes,
  fadeOutHalf,
  fadeOutNodes,
  guardedDynamic,
  hideNodes,
  orbitScene,
  rateContentDigest,
  txt,
} from '../parts.mjs';

export default function traceIntegrity(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = trace bindings, 1 = digest edit/restore, 2 = governance anchor
  const p0 = s.value(0);
  const edited = s.value(0); // 1 on `te-trace-integrity-1`, returns to 0 on `restore-rates`
  const p2 = s.value(0);

  const refHash = rateContentDigest(15).slice(0, 12);
  const badHash = rateContentDigest(16).slice(0, 12);

  const header = cinemaHeader('AUDIT TRACE INTEGRITY', 'Bind spend to exact', 'rate table bytes', {
    x: -860,
    y: -415,
    accent: ROLE.meta,
    size: 52,
  });

  const sceneAura = aura(340, 10, 620, '#a78bfa24', '#6ee7b71a');

  // Orbiting 3D Cryptographic Ledger Seal
  const view3d = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 15.2,
    unit: 116,
    focus: [0, 0, 1.0],
  }).at(365, 10);

  view3d.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.2, 2.2],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Left prism: Task Attempt T42 / A1
  addBox3D(view3d, -2.5, -0.75, 0.04, 1.5, 1.5, 1.65, ROLE.batch, ROLE.input, {
    faceOpacity: 0.84,
    edgeGlow: 8,
  });

  // Right prism: Approved Rate Table (emerald when valid, rose when mutated)
  const validPrism = [
    ...addBox3D(view3d, 0.95, -0.75, 0.04, 1.5, 1.5, 1.65, ROLE.ok, ROLE.ok, {
      faceOpacity: 0.84,
      edgeGlow: 9,
    }),
    ...addPointerArc3D(view3d, [-1.75, 0, 1.72], [1.7, 0, 1.72], ROLE.ok, {
      lift: 0.85,
      pulseVal: pulseT,
      phaseOffset: 0.15,
    }),
  ];

  const badPrism = hideNodes([
    ...addBox3D(view3d, 0.95, -0.75, 0.04, 1.5, 1.5, 1.95, ROLE.fail, ROLE.fail, {
      faceOpacity: 0.88,
      edgeGlow: 11,
    }),
    ...addPointerArc3D(view3d, [-1.75, 0, 1.72], [1.7, 0, 2.0], ROLE.fail, {
      lift: 0.85,
      pulseVal: pulseT,
      phaseOffset: 0.45,
    }),
  ]);

  // Left column readouts
  const leftMode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const u = p0.value;
      const nodes = [
        txt(
          'TASK T42 · ATTEMPT A1 · FEATURE POLICY',
          -860,
          -205,
          26,
          ROLE.input,
          'mono',
          'left',
        ).opacity(a),
        txt(
          'RECORDED WITH EVERY REAL ATTEMPT',
          -860,
          -130,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
        txt('1.  Task + feature + release ID', -860, -64, 30, COSMOS.ink, 'sans', 'left').opacity(
          a,
        ),
        txt(
          '2.  Model GPT-5.4 · Standard · region',
          -860,
          4,
          30,
          ROLE.input,
          'sans',
          'left',
        ).opacity(a),
        txt(
          '3.  Usage + outcome + tool/infra cost',
          -860,
          72,
          30,
          ROLE.cached,
          'sans',
          'left',
        ).opacity(a),
        txt('4.  Rate ID standard-sep21 + SHA-256 digest', -860, 140, 30, ROLE.ok, 'sans', 'left')
          .glow(5, ROLE.ok)
          .opacity(Math.max(0.3, u) * a),
        txt(
          'Production traces log every individual attempt, even unresolved ones',
          -860,
          255,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  const leftMode1 = guardedDynamic(
    () => Math.min(fadeInHalf(mode.value), fadeOutHalf(Math.max(0, mode.value - 1))),
    (a) => {
      const isBad = edited.value > 0.5;
      const col = isBad ? ROLE.fail : ROLE.ok;
      const nodes = [
        txt('RATE TABLE ID:  standard-sep21', -860, -205, 28, ROLE.cached, 'mono', 'left').opacity(
          a,
        ),
        txt(
          isBad ? 'EDITED:  2.50 / 0.25 / 16.00' : 'APPROVED:  2.50 / 0.25 / 15.00',
          -860,
          -122,
          36,
          col,
          'mono',
          'left',
        )
          .glow(8, col)
          .opacity(a),

        txt('RECORDED SHA-256 PREFIX', -860, -25, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(refHash, -860, 26, 36, ROLE.cached, 'mono', 'left').opacity(a),

        txt('CURRENT SHA-256 PREFIX', -860, 110, 26, COSMOS.muted, 'mono', 'left').opacity(a),
        txt(isBad ? badHash : refHash, -860, 162, 36, col, 'mono', 'left')
          .glow(8, col)
          .opacity(a),

        rect(680, 74, {
          fill: isBad ? '#351324' : '#0e2820',
          stroke: col,
          width: 2.6,
          radius: 12,
        })
          .at(-520, 275)
          .glow(10, col)
          .opacity(a),
        txt(
          isBad ? 'DIGEST MISMATCH  ->  REJECT' : 'DIGEST MATCH  ->  REPRODUCED',
          -520,
          275,
          30,
          col,
          'mono',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  const leftMode2 = guardedDynamic(
    () => fadeInHalf(Math.max(0, mode.value - 1)),
    (a) => {
      const u = p2.value;
      const nodes = [
        txt('HASH MATCHES BYTES, NOT AUTHORITY', -860, -195, 28, ROLE.cached, 'mono', 'left')
          .glow(6, ROLE.cached)
          .opacity(a),
        txt('Keep the archived rate table', -860, -98, 32, ROLE.ok, 'sans', 'left').opacity(a),
        txt('Keep provider billing evidence', -860, -24, 32, ROLE.input, 'sans', 'left').opacity(a),
        txt(
          'Record who approved the rates & lock writes',
          -860,
          50,
          32,
          ROLE.meta,
          'sans',
          'left',
        ).opacity(Math.max(0.3, u) * a),
        txt(
          'Open linked quality reports and verify review status too',
          -860,
          172,
          28,
          COSMOS.muted,
          'sans',
          'left',
        ).opacity(a),
      ];
      return group(...nodes);
    },
  );

  const captions3d = group(
    txt('Attempt A1', 120, 385, 28, ROLE.batch, 'mono'),
    txt('Rate Table Seal', 565, 385, 28, ROLE.ok, 'mono'),
  );

  s.add(sceneAura, view3d, header, captions3d, leftMode0, leftMode1, leftMode2);
  orbitScene(s, c, view3d, { theta: -0.36, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulseT, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('te-trace-integrity-0', () => {
    const t = c.cue('te-trace-integrity-0').start;
    s.play(p0.to(1, { duration: clampDur(c, t, 0.6) }));
  });
  c.onBeat(1, () => {
    const t = c.beats[1].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-trace-integrity-1', () => {
    const t = c.cue('te-trace-integrity-1').start;
    s.play(edited.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeOutNodes(s, c, t, validPrism, 0.25);
    fadeInNodes(s, c, t, badPrism, 0.35);
  });
  c.on('restore-rates', () => {
    const t = c.cue('restore-rates').start;
    s.play(edited.to(0, { duration: clampDur(c, t, 0.35) }));
    fadeOutNodes(s, c, t, badPrism, 0.25);
    fadeInNodes(s, c, t, validPrism, 0.35);
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(mode.to(2, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('te-trace-integrity-2', () => {
    const t = c.cue('te-trace-integrity-2').start;
    s.play(p2.to(1, { duration: clampDur(c, t, 0.6) }));
  });
}
