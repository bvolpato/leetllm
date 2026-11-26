// Scene 17: close - Where do the two endings go?
// Iconic full-circle finale: Block 0 fills with "straight" (4/4 full gold shared 3D cube),
// Prediction 1: A & B each need 5th slot -> how many physical blocks? (HOLD 3.1s) ->
// Reveal: Block 1 (home) + Block 2 (away) = 3 physical blocks, zero prefix copy!
// Prediction 2: A finishes & GPU reads done -> which block frees? (HOLD 2.6s) ->
// Reveal: Only Block 1 frees (B still holds Block 0), Request C writes "Rain" into Block 1!
import { gridPlane3d, group, par } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addPointerArc3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInNodes,
  fadeOutNodes,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function close(s, c) {
  const pulseT = s.value(0);
  // 0=init, 1=straight, 2=fork, 3=wants-a, 4=wants-b, 5=ask (HOLD!),
  // 6=tail-a (AFT), 7=tail-b (AFT), 8=back, 9=total (AFT),
  // 10=finish, 11=done, 12=ask-free (HOLD!), 13=release (AFT), 14=reuse
  const st = s.value(0);

  const header = cinemaHeader('FULL-CIRCLE FINALE', 'Where do the', 'two endings go?', {
    x: -860,
    y: -415,
    accent: ROLE.shared,
    size: 54,
  });

  const stageAura = aura(255, 32, 630, '#ffd16628', '#6ee7b71a');

  // Orbiting 3D Finale Pool: Physical Block 0 (gold shared), Block 1 (A -> freed -> C), Block 2 (B)
  const view3d = cinematic3d({
    theta: -0.82,
    phi: 1.02,
    distance: 15.2,
    unit: 104,
    focus: [0, 0, 0.95],
  }).at(260, -24);

  view3d.add(
    gridPlane3d({
      x: [-3.4, 3.4],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.54,
    }),
  );

  // Physical Block 0 (gold shared: "The fox ran straight")
  const p0Top = [-1.75, 0.0, 1.06];
  addBox3D(view3d, -2.4, -0.65, 0.05, 1.3, 1.3, 0.98, ROLE.shared, ROLE.shared, {
    faceOpacity: 0.88,
    edgeWidth: 2.6,
    edgeGlow: 10,
  });

  // Unallocated wireframe cages for Block 1 & Block 2 (visible through Prediction 1!)
  const p1Top = [0.45, -1.15, 0.96];
  const p2Top = [0.45, 1.15, 0.96];
  addWireBox3D(view3d, -0.2, -1.8, 0.05, 1.3, 1.3, 0.88, '#384c78', {
    width: 1.6,
    opacity: 0.55,
    glow: 3,
  });
  addWireBox3D(view3d, -0.2, 0.5, 0.05, 1.3, 1.3, 0.88, '#384c78', {
    width: 1.6,
    opacity: 0.55,
    glow: 3,
  });

  // Upper floating logical branch markers (z = 2.55)
  const logA0 = [-2.0, -1.15, 2.55];
  const logB0 = [-2.0, 1.15, 2.55];
  const logA1 = [0.45, -1.15, 2.55];
  const logB1 = [0.45, 1.15, 2.55];

  const aBaseNodes = [
    ...addBox3D(view3d, -2.45, -1.5, 2.55, 0.9, 0.7, 0.36, ROLE.reqA, ROLE.reqA, {
      faceOpacity: 0.86,
      edgeWidth: 2.1,
      edgeGlow: 7,
    }),
    ...addPointerArc3D(view3d, logA0, p0Top, ROLE.reqA, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.0,
    }),
  ];
  const bBaseNodes = [
    ...addBox3D(view3d, -2.45, 0.8, 2.55, 0.9, 0.7, 0.36, ROLE.reqB, ROLE.reqB, {
      faceOpacity: 0.86,
      edgeWidth: 2.1,
      edgeGlow: 7,
    }),
    ...addPointerArc3D(view3d, logB0, p0Top, ROLE.reqB, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.5,
    }),
  ];

  // Block 1 (cyan: A's "home") + A's 2nd arc - hidden until AFTER `tail-a`!
  const block1A = hideNodes([
    ...addBox3D(view3d, -0.2, -1.8, 0.05, 1.3, 1.3, 0.9, ROLE.reqA, ROLE.reqA, {
      faceOpacity: 0.86,
      edgeWidth: 2.4,
      edgeGlow: 9,
    }),
    ...addBox3D(view3d, 0.0, -1.5, 2.55, 0.9, 0.7, 0.36, ROLE.reqA, ROLE.reqA, {
      faceOpacity: 0.86,
      edgeWidth: 2.1,
      edgeGlow: 7,
    }),
    ...addPointerArc3D(view3d, logA1, p1Top, ROLE.reqA, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.25,
    }),
  ]);

  // Block 2 (violet: B's "away") + B's 2nd arc - hidden until AFTER `tail-b`!
  const block2B = hideNodes([
    ...addBox3D(view3d, -0.2, 0.5, 0.05, 1.3, 1.3, 0.9, ROLE.reqB, ROLE.reqB, {
      faceOpacity: 0.86,
      edgeWidth: 2.4,
      edgeGlow: 9,
    }),
    ...addBox3D(view3d, 0.0, 0.8, 2.55, 0.9, 0.7, 0.36, ROLE.reqB, ROLE.reqB, {
      faceOpacity: 0.86,
      edgeWidth: 2.1,
      edgeGlow: 7,
    }),
    ...addPointerArc3D(view3d, logB1, p2Top, ROLE.reqB, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.75,
    }),
  ]);

  // Block 1 reused by Request C ("Rain") in emerald - hidden until `reuse`!
  const block1C = hideNodes([
    ...addBox3D(view3d, -0.2, -1.8, 0.05, 1.3, 1.3, 0.92, ROLE.reqC, ROLE.reqC, {
      faceOpacity: 0.88,
      edgeWidth: 2.6,
      edgeGlow: 11,
    }),
    ...addBox3D(view3d, 0.0, -1.5, 2.55, 0.9, 0.7, 0.36, ROLE.reqC, ROLE.reqC, {
      faceOpacity: 0.88,
      edgeWidth: 2.2,
      edgeGlow: 9,
    }),
    ...addPointerArc3D(view3d, logA1, p1Top, ROLE.reqC, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.35,
    }),
  ]);

  // Left-side narrative & prediction state readout
  const leftDyn = guardedDynamic(
    () => 1,
    () => {
      const v = st.value;
      const pulse = 0.7 + 0.3 * Math.sin(pulseT.value * 5.0);
      const nodes = [
        txt('BLOCK 0 (FULL)  ·  BLOCK 1  ·  BLOCK 2', 260, -420, 26, COSMOS.muted, 'mono'),
        txt(
          v >= 13.5
            ? 'B keeps [0, 2]   ·   C takes Block 1 ("Rain")'
            : v >= 12.5
              ? 'Block 0 held by B (ref = 1)  ·  Block 1 FREE'
              : 'Gold Block 0: [The, fox, ran, straight]',
          260,
          460,
          26,
          v >= 13.5 ? ROLE.reqC : ROLE.shared,
          'mono',
        ).glow(6, v >= 13.5 ? ROLE.reqC : ROLE.shared),
      ];

      // Block 0 status
      nodes.push(
        txt(
          v >= 0.5 ? 'Block 0 (4/4 FULL): The · fox · ran · straight' : 'Block 0: 3/4 filled',
          -855,
          -162,
          26,
          ROLE.shared,
          'mono',
          'left',
        ),
      );

      if (v >= 2.5 && v < 9.5) {
        nodes.push(txt('A wants 5th token: home', -855, -104, 26, ROLE.reqA, 'mono', 'left'));
        if (v >= 3.5) {
          nodes.push(txt('B wants 5th token: away', -855, -54, 26, ROLE.reqB, 'mono', 'left'));
        }
      }

      // Prediction 1 (HOLD 3.1s - NO answer shown!)
      if (v >= 4.5 && v < 5.5) {
        nodes.push(
          txt('PREDICT', -855, 36, 26, ROLE.focus, 'mono', 'left').opacity(pulse),
          txt('After both appends, how many', -855, 92, 32, COSMOS.ink, 'sans', 'left'),
          txt('physical blocks in total?', -855, 140, 32, ROLE.focus, 'sans', 'left').glow(
            7,
            ROLE.focus,
          ),
        );
      }

      // Reveal 1 (AFTER tail-a / tail-b / total!)
      if (v >= 5.5 && v < 9.5) {
        nodes.push(txt('A -> [ Blk 0, Blk 1 (home) ]', -855, 36, 26, ROLE.reqA, 'mono', 'left'));
        if (v >= 6.5) {
          nodes.push(txt('B -> [ Blk 0, Blk 2 (away) ]', -855, 90, 26, ROLE.reqB, 'mono', 'left'));
        }
        if (v >= 7.5) {
          nodes.push(
            txt(
              'Both tables still trace back to Block 0',
              -855,
              152,
              26,
              ROLE.shared,
              'sans',
              'left',
            ),
          );
        }
        if (v >= 8.5) {
          nodes.push(
            txt('3 PHYSICAL BLOCKS', -855, 232, 38, ROLE.fresh, 'mono', 'left').glow(9, ROLE.fresh),
            txt('No prefix copy', -855, 290, 28, COSMOS.ink, 'sans', 'left'),
          );
        }
      }

      // Prediction 2 (A finishes -> which block frees? HOLD 2.6s!)
      if (v >= 9.5) {
        nodes.push(
          txt('A finishes  ·  last GPU read done', -855, -104, 26, ROLE.reqA, 'mono', 'left'),
          txt('No finished prefixes retained', -855, -54, 26, COSMOS.muted, 'mono', 'left'),
        );
        if (v >= 11.5 && v < 12.5) {
          nodes.push(
            txt('PREDICT', -855, 36, 26, ROLE.focus, 'mono', 'left').opacity(pulse),
            txt('Release A’s table [0, 1].', -855, 92, 32, COSMOS.ink, 'sans', 'left'),
            txt('Which block can C take?', -855, 140, 32, ROLE.focus, 'sans', 'left').glow(
              7,
              ROLE.focus,
            ),
          );
        }
        if (v >= 12.5) {
          nodes.push(
            txt('ONLY BLOCK 1 IS FREE', -855, 42, 36, ROLE.fresh, 'mono', 'left').glow(
              9,
              ROLE.fresh,
            ),
            txt(
              'B still reads Block 0 (ref = 1) & Block 2',
              -855,
              108,
              26,
              ROLE.reqB,
              'sans',
              'left',
            ),
          );
        }
        if (v >= 13.5) {
          nodes.push(
            txt('Req C starts "Rain" in Block 1', -855, 188, 30, ROLE.reqC, 'mono', 'left').glow(
              8,
              ROLE.reqC,
            ),
            txt('while B continues untouched', -855, 240, 28, COSMOS.ink, 'sans', 'left'),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, view3d, header, leftDyn);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulseT, 6.2, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0
  c.on('straight', () => {
    s.play(st.to(1, { duration: clampDur(c, c.cue('straight').start, 0.25) }));
  });
  c.on('fork', () => {
    s.play(st.to(2, { duration: clampDur(c, c.cue('fork').start, 0.25) }));
  });
  c.on('wants-a', () => {
    s.play(st.to(3, { duration: clampDur(c, c.cue('wants-a').start, 0.25) }));
  });
  c.on('wants-b', () => {
    s.play(st.to(4, { duration: clampDur(c, c.cue('wants-b').start, 0.25) }));
  });

  // Beat 1 (PREDICTION 1 - hold 3.1s!)
  c.on('ask', () => {
    s.play(st.to(5, { duration: clampDur(c, c.cue('ask').start, 0.25) }));
  });

  // Beat 2 (Reveals strictly AFTER spoken phrases!)
  c.after('tail-a', () => {
    const t = c.cue('tail-a').end;
    s.play(st.to(6, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, block1A, 0.35);
  });
  c.after('tail-b', () => {
    const t = c.cue('tail-b').end;
    s.play(st.to(7, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, block2B, 0.35);
  });
  c.on('back', () => {
    s.play(st.to(8, { duration: clampDur(c, c.cue('back').start, 0.25) }));
  });
  c.after('total', () => {
    s.play(st.to(9, { duration: clampDur(c, c.cue('total').end, 0.25) }));
  });

  // Beat 3 (PREDICTION 2 - hold 2.6s!)
  c.on('finish', () => {
    s.play(st.to(10, { duration: clampDur(c, c.cue('finish').start, 0.25) }));
  });
  c.on('done', () => {
    s.play(st.to(11, { duration: clampDur(c, c.cue('done').start, 0.25) }));
  });
  c.on('ask-free', () => {
    s.play(st.to(12, { duration: clampDur(c, c.cue('ask-free').start, 0.25) }));
  });

  // Beat 4 (Reveal strictly AFTER "Only block one is free", then C reuses Block 1!)
  c.after('release', () => {
    const t = c.cue('release').end;
    s.play(st.to(13, { duration: clampDur(c, t, 0.25) }));
    fadeOutNodes(s, c, t, [...aBaseNodes, ...block1A], 0.35);
  });
  c.on('reuse', () => {
    const t = c.cue('reuse').start;
    s.play(st.to(14, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, block1C, 0.4);
  });
}
