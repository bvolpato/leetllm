// Scene 7: order-swap - Which reply did the judge pick?
// Signature orbiting 3D Position-Swap Calibration Rig: Call 1 (compact in A, stepwise in B)
// and Call 2 (stepwise in A, compact in B) as illuminated 3D pedestals connected by glowing
// 3D Bezier pointer arcs! Strict prediction withholding on BOTH stable (B, A -> stepwise)
// and replay conflict (B, B -> stepwise vs compact -> unresolved).
import { gridPlane3d, group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addArc3D,
  addBox3D,
  aggregateSwaps,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  conflictingSwap,
  driftValue,
  fadeInNodes,
  fadeOutNodes,
  guardedDynamic,
  hideNodes,
  orbitScene,
  stableSwap,
  txt,
} from '../parts.mjs';

export default function orderSwap(s, c) {
  const pulse = s.value(0);
  const firstVerdictOn = s.value(0);
  const firstNameOn = s.value(0);
  const swapOn = s.value(0);
  const secondAOn = s.value(0);
  const stableReveal = s.value(0);
  const replayMode = s.value(0);
  const secondBOn = s.value(0);
  const secondNameReveal = s.value(0);
  const conflictReveal = s.value(0);

  const stableWinner = aggregateSwaps(...stableSwap);
  const conflictResult = aggregateSwaps(...conflictingSwap);

  const header = cinemaHeader(
    'ORDER-SWAP RECONCILIATION',
    'Which reply did the',
    'judge actually pick?',
    {
      accent: ROLE.verdict,
      size: 50,
    },
  );

  const stageAura = aura(280, 20, 620, '#5ce1e622', '#ffd1661c');

  // Orbiting 3D Position-Swap Pedestals: Left row = Call 1 (y=-1.4), Right row = Call 2 (y=+1.4)
  // Slot A at x=-1.75, Slot B at x=+0.55
  const rig3d = cinematic3d({
    theta: -0.82,
    phi: 1.0,
    distance: 14.8,
    unit: 118,
    focus: [0, 0, 0.7],
  }).at(285, 25);

  rig3d.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.6, 2.6],
      z: 0,
      step: 1.2,
      color: '#25355a',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  // Call 1 pedestals (always visible from start): Slot A = compact (emerald), Slot B = stepwise (cyan)
  addBox3D(rig3d, -2.2, -2.0, 0.04, 1.5, 1.15, 0.9, ROLE.compact, ROLE.compact);
  addBox3D(rig3d, 0.7, -2.0, 0.04, 1.5, 1.15, 0.9, ROLE.stepwise, ROLE.stepwise);

  // Call 1 verdict beacon (hovering at z=2.35 pointing to Slot B = stepwise)
  const call1Beacon = hideNodes([
    ...addBox3D(rig3d, -0.5, -1.9, 2.15, 1.0, 0.9, 0.42, ROLE.verdict, ROLE.verdict, {
      faceOpacity: 0.86,
      edgeGlow: 9,
    }),
    ...addArc3D(rig3d, [0.0, -1.45, 2.15], [1.45, -1.42, 0.95], ROLE.verdict, {
      lift: 0.55,
      pulseVal: pulse,
      phaseOffset: 0,
    }),
  ]);

  // Call 2 pedestals (reversed! Slot A = stepwise cyan, Slot B = compact emerald)
  const call2Pedestals = hideNodes([
    ...addBox3D(rig3d, -2.2, 0.85, 0.04, 1.5, 1.15, 0.9, ROLE.stepwise, ROLE.stepwise),
    ...addBox3D(rig3d, 0.7, 0.85, 0.04, 1.5, 1.15, 0.9, ROLE.compact, ROLE.compact),
    // Swap crossing arcs connecting Call 1 -> Call 2 pedestals
    ...addArc3D(rig3d, [-1.45, -0.85, 0.95], [1.45, 0.85, 0.95], ROLE.compact, {
      lift: 0.7,
      pulseVal: pulse,
      phaseOffset: 0.25,
      opacity: 0.7,
    }),
    ...addArc3D(rig3d, [1.45, -0.85, 0.95], [-1.45, 0.85, 0.95], ROLE.stepwise, {
      lift: 0.95,
      pulseVal: pulse,
      phaseOffset: 0.65,
      opacity: 0.7,
    }),
  ]);

  // Call 2 Verdict A arc (points to Slot A = stepwise -> matches!)
  const call2ArcA = hideNodes([
    ...addBox3D(rig3d, -0.5, 1.0, 2.15, 1.0, 0.9, 0.42, ROLE.verdict, ROLE.verdict, {
      faceOpacity: 0.86,
      edgeGlow: 9,
    }),
    ...addArc3D(rig3d, [0.0, 1.45, 2.15], [-1.45, 1.42, 0.95], ROLE.stepwise, {
      lift: 0.55,
      pulseVal: pulse,
      phaseOffset: 0.4,
    }),
  ]);

  // Call 2 Replay Verdict B arc (points to Slot B = compact -> ROSE CONFLICT!)
  const call2ArcB = hideNodes([
    ...addArc3D(rig3d, [0.0, 1.45, 2.15], [1.45, 1.42, 0.95], ROLE.conflict, {
      lift: 0.65,
      pulseVal: pulse,
      phaseOffset: 0.5,
      width: 3.8,
    }),
  ]);

  // Floating 3D captions + left-side identity readouts
  const overlay = guardedDynamic(
    () => 1,
    () => {
      const fv = firstVerdictOn.value;
      const fn = firstNameOn.value;
      const sw = swapOn.value;
      const sA = secondAOn.value;
      const st = stableReveal.value;
      const rp = replayMode.value;
      const sB = secondBOn.value;
      const sn = secondNameReveal.value;
      const cf = conflictReveal.value;
      const nodes = [];

      // Right 3D legend labels
      nodes.push(
        txt(
          'GREEN = COMPACT    ·    CYAN = STEPWISE',
          285,
          -425,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
        txt('LEFT: SLOT A   |   RIGHT: SLOT B', 285, 435, 26, ROLE.verdict, 'mono', 'center'),
      );

      // Left Call 1 readout
      nodes.push(
        txt(
          'CALL 1  ORDER: (A: compact, B: stepwise)',
          -855,
          -175,
          26,
          ROLE.stepwise,
          'mono',
          'left',
        ),
      );
      if (fv > 0.05) {
        nodes.push(
          txt(
            fn > 0.4 ? 'Receipt 1: B  ->  stepwise' : 'Receipt 1: B',
            -855,
            -120,
            30,
            ROLE.verdict,
            'mono',
            'left',
          )
            .glow(6, ROLE.verdict)
            .opacity(fv),
        );
      }

      // Left Call 2 readout (swapped)
      if (sw > 0.05) {
        nodes.push(
          line([-855, -56], [-320, -56], { stroke: '#28385f', width: 2 }).opacity(sw),
          txt(
            'CALL 2  ORDER: (A: stepwise, B: compact)',
            -855,
            -10,
            26,
            ROLE.policy,
            'mono',
            'left',
          ).opacity(sw),
        );
      }

      if (rp < 0.45) {
        // Stable branch (Beats 1-2)
        if (sA > 0.05) {
          nodes.push(
            txt(
              st > 0.4 ? `Receipt 2: A  ->  ${stableWinner}` : 'Receipt 2: A  ->  ?',
              -855,
              46,
              30,
              ROLE.verdict,
              'mono',
              'left',
            )
              .glow(6, ROLE.verdict)
              .opacity(sA * (1 - rp * 2)),
          );
          if (st < 0.05) {
            nodes.push(
              txt(
                'Do both receipts pick the same reply?',
                -855,
                130,
                30,
                ROLE.policy,
                'serif',
                'left',
              )
                .glow(6, ROLE.policy)
                .opacity(sA * (1 - rp * 2)),
            );
          } else {
            nodes.push(
              txt(
                `STABLE WINNER: ${stableWinner.toUpperCase()}`,
                -855,
                145,
                34,
                ROLE.stepwise,
                'mono',
                'left',
              )
                .glow(8, ROLE.stepwise)
                .opacity(st * (1 - rp * 2)),
              txt(
                'B(Call 1) = stepwise = A(Call 2)',
                -855,
                200,
                26,
                ROLE.ok,
                'mono',
                'left',
              ).opacity(st * (1 - rp * 2)),
            );
          }
        }
      } else {
        // Replay branch (Beats 3-4)
        const ra = Math.min(1, (rp - 0.45) * 2);
        nodes.push(
          txt(
            'REPLAY CALL 2 (SAME SWAPPED SLOTS)',
            -855,
            52,
            26,
            ROLE.conflict,
            'mono',
            'left',
          ).opacity(ra),
        );
        if (sB > 0.05) {
          nodes.push(
            txt(
              sn > 0.4 ? 'Receipt 2 (replay): B  ->  compact' : 'Receipt 2 (replay): B  ->  ?',
              -855,
              106,
              30,
              sn > 0.4 ? ROLE.compact : ROLE.verdict,
              'mono',
              'left',
            )
              .glow(6, sn > 0.4 ? ROLE.compact : ROLE.verdict)
              .opacity(ra * sB),
          );
          if (sn < 0.05) {
            nodes.push(
              txt(
                'Which reply does this B name? Winner?',
                -855,
                185,
                30,
                ROLE.policy,
                'serif',
                'left',
              )
                .glow(6, ROLE.policy)
                .opacity(ra * sB),
            );
          }
        }
        if (cf > 0.05) {
          nodes.push(
            txt(
              `OUTCOME: ${conflictResult.toUpperCase()}`,
              -855,
              225,
              36,
              ROLE.conflict,
              'mono',
              'left',
            )
              .glow(10, ROLE.conflict)
              .opacity(ra * cf),
            txt(
              'B(Call 1)=stepwise != B(Call 2)=compact',
              -855,
              285,
              26,
              COSMOS.muted,
              'mono',
              'left',
            ).opacity(ra * cf),
            txt(
              'Choice followed the slot · Keep both receipts',
              -855,
              336,
              26,
              ROLE.conflict,
              'sans',
              'left',
            ).opacity(ra * cf),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, rig3d, header, overlay);
  orbitScene(s, c, rig3d, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 5.4, { startOffset: 0.1, endMargin: 0.5 });

  c.on('first-slots', () => {
    s.play(pulse.to(0.4, { duration: clampDur(c, c.cue('first-slots').start, 0.25) }));
  });
  c.on('slot-first-verdict', () => {
    const t = c.cue('slot-first-verdict').start;
    s.play(firstVerdictOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, call1Beacon, 0.35);
  });
  c.on('first-name', () => {
    s.play(firstNameOn.to(1, { duration: clampDur(c, c.cue('first-name').start, 0.3) }));
  });
  c.on('reverse-order', () => {
    const t = c.cue('reverse-order').start;
    s.play(swapOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, call2Pedestals, 0.45);
  });
  c.on('slot-second-verdict', () => {
    const t = c.cue('slot-second-verdict').start;
    s.play(secondAOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, call2ArcA, 0.4);
  });
  c.on('ask-stable', () => {
    s.play(secondAOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding #1: reveal "stepwise" AFTER spoken reveal!
  c.after('stable-identity', () => {
    s.play(stableReveal.to(1, { duration: clampDur(c, c.cue('stable-identity').end, 0.35) }));
  });
  c.on('replay', () => {
    const t = c.cue('replay').start;
    s.play(replayMode.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeOutNodes(s, c, t, call2ArcA.slice(-4), 0.25); // fade out A pointer arc, keep beacon
  });
  c.on('second-b', () => {
    const t = c.cue('second-b').start;
    s.play(secondBOn.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, call2ArcB, 0.4);
  });
  c.on('ask-conflict', () => {
    s.play(secondBOn.to(1, { duration: 0.12 }));
  });
  // Strict prediction withholding #2: reveal "compact" & "unresolved" AFTER spoken clauses!
  c.after('second-name', () => {
    s.play(secondNameReveal.to(1, { duration: clampDur(c, c.cue('second-name').end, 0.35) }));
  });
  c.after('conflicting-identities', () => {
    s.play(
      conflictReveal.to(1, { duration: clampDur(c, c.cue('conflicting-identities').end, 0.35) }),
    );
  });
}
