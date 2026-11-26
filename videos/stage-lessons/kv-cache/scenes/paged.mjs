// Scene 6: paged - Logical order, scattered storage
// Signature 3D PagedAttention Physical VRAM Cubes + floating Logical Sequence Tier +
// glowing 3D Bezier pointer arcs with streaming data pulses, 5 / 4 = 1 rem 1 lookup,
// Request C fitting in holes, and 16-slot tail-waste / block-size tradeoff.
import { gridPlane3d, group, par, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SLOTS,
  addBox3D,
  addPointerArc3D,
  addWireBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  fadeInHalf,
  fadeInNodes,
  fadeOutHalf,
  glowTex,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function paged(s, c) {
  const pulseT = s.value(0);
  const tableVis = s.value(0);
  const divVis = s.value(0);
  const physVis = s.value(0);
  const fillSlots = s.value(0); // 0..5 tokens filling 4-slot blocks
  const thirdVis = s.value(0);
  const tailMode = s.value(0); // 0 = table/lookup, 1 = 16-slot tail & tradeoff
  const tradeStep = s.value(0); // 0..5

  const header = cinemaHeader(
    'PAGEDATTENTION VIRTUAL MEMORY',
    'Logical order,',
    'scattered storage',
    {
      x: -860,
      y: -415,
      accent: ROLE.fresh,
      size: 54,
    },
  );

  const pagedAura = aura(250, 32, 630, '#ffd16626', '#5ce1e61c');

  // Orbiting 3D PagedAttention Pool (4x3 physical VRAM grid on floor + logical tier above)
  const pagedView = cinematic3d({
    theta: -0.84,
    phi: 1.02,
    distance: 15.8,
    unit: 118,
    focus: [0, 0, 1.0],
  }).at(255, 36);

  pagedView.add(
    gridPlane3d({
      x: [-3.5, 3.5],
      y: [-2.6, 2.6],
      z: 0,
      step: 1.2,
      color: '#27385c',
      width: 1.2,
      opacity: 0.52,
    }),
  );

  // 4 x 3 physical VRAM slots: index = r*4 + col (0..11)
  // Req A (cyan) uses Physical 7 (r=1,c=3) & Physical 2 (r=0,c=2)
  // Req B (violet) uses Physical 0 (r=0,c=0) & Physical 9 (r=2,c=1)
  // Shared / Req C (emerald) fills Physical 1, 4, 6, 10, etc.
  const cubeTop = [];
  const baseCubes = [];
  const block2Glow = [];
  const reqCCubes = [];
  const extraFillCubes = [];

  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 4; col++) {
      const idx = r * 4 + col;
      const x = -2.9 + col * 1.48;
      const y = -2.0 + r * 1.48;
      cubeTop[idx] = [x + 0.59, y + 0.59, 0.92];

      if (idx === 7 || idx === 2) {
        const objs = addBox3D(pagedView, x, y, 0.04, 1.18, 1.18, 0.86, ROLE.reqA, ROLE.reqA, {
          faceOpacity: 0.82,
          edgeWidth: 2.2,
          edgeGlow: 7,
        });
        baseCubes.push(...objs);
        if (idx === 2) {
          // Gold highlight ring around Physical Block 2 when 5 / 4 = 1 rem 1 resolves!
          block2Glow.push(
            ...addWireBox3D(pagedView, x - 0.08, y - 0.08, 0.02, 1.34, 1.34, 1.04, ROLE.focus, {
              width: 3.2,
              opacity: 0.96,
              glow: 12,
            }),
          );
        }
      } else if (idx === 0 || idx === 9) {
        baseCubes.push(
          ...addBox3D(pagedView, x, y, 0.04, 1.18, 1.18, 0.86, ROLE.reqB, ROLE.reqB, {
            faceOpacity: 0.78,
            edgeWidth: 2.1,
            edgeGlow: 6,
          }),
        );
      } else if (idx === 4 || idx === 11) {
        // Claimed when 5th token arrives
        addWireBox3D(pagedView, x, y, 0.04, 1.18, 1.18, 0.82, '#3a4c78', {
          width: 1.4,
          opacity: 0.45,
          glow: 2,
        });
        extraFillCubes.push(
          ...addBox3D(pagedView, x, y, 0.04, 1.18, 1.18, 0.86, ROLE.focus, ROLE.focus, {
            faceOpacity: 0.82,
            edgeWidth: 2.3,
            edgeGlow: 9,
          }),
        );
      } else if (idx === 1 || idx === 5 || idx === 8 || idx === 10) {
        // Free holes initially (wireframe), then Request C (emerald) fits right into them!
        addWireBox3D(pagedView, x, y, 0.04, 1.18, 1.18, 0.82, '#3a4c78', {
          width: 1.4,
          opacity: 0.45,
          glow: 2,
        });
        reqCCubes.push(
          ...addBox3D(pagedView, x, y, 0.04, 1.18, 1.18, 0.86, ROLE.reqC, ROLE.reqC, {
            faceOpacity: 0.84,
            edgeWidth: 2.2,
            edgeGlow: 8,
          }),
        );
      } else {
        // Remaining subtle occupied/shared blocks for visual density (idx 3, 6)
        baseCubes.push(
          ...addBox3D(pagedView, x, y, 0.04, 1.18, 1.18, 0.86, ROLE.prefill, ROLE.prefill, {
            faceOpacity: 0.62,
            edgeWidth: 1.8,
            edgeGlow: 5,
          }),
        );
      }
    }
  }
  hideNodes(block2Glow);
  hideNodes(extraFillCubes);
  hideNodes(reqCCubes);

  // Upper floating logical sequence blocks (z = 2.55) + glowing Bezier pointer arcs!
  const logicalA = [
    ...addBox3D(pagedView, -2.4, -1.25, 2.55, 0.96, 0.68, 0.36, ROLE.reqA, ROLE.reqA, {
      faceOpacity: 0.86,
      edgeWidth: 2.1,
      edgeGlow: 7,
    }),
    ...addBox3D(pagedView, -0.9, -1.25, 2.55, 0.96, 0.68, 0.36, ROLE.reqA, ROLE.focus, {
      faceOpacity: 0.86,
      edgeWidth: 2.2,
      edgeGlow: 8,
    }),
  ];
  const logicalB = [
    ...addBox3D(pagedView, -2.4, 0.15, 2.55, 0.96, 0.68, 0.36, ROLE.reqB, ROLE.reqB, {
      faceOpacity: 0.84,
      edgeWidth: 2.0,
      edgeGlow: 6,
    }),
    ...addBox3D(pagedView, -0.9, 0.15, 2.55, 0.96, 0.68, 0.36, ROLE.reqB, ROLE.reqB, {
      faceOpacity: 0.84,
      edgeWidth: 2.0,
      edgeGlow: 6,
    }),
  ];

  // Glowing 3D Bezier arcs mapping Logical -> Physical cubes with streaming photons!
  const arcsAB = [
    ...addPointerArc3D(pagedView, [-1.92, -0.91, 2.54], cubeTop[7], ROLE.reqA, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.0,
    }),
    ...addPointerArc3D(pagedView, [-0.42, -0.91, 2.54], cubeTop[2], ROLE.focus, {
      lift: 0.65,
      pulseVal: pulseT,
      phaseOffset: 0.28,
    }),
    ...addPointerArc3D(pagedView, [-1.92, 0.49, 2.54], cubeTop[0], ROLE.reqB, {
      lift: 0.45,
      pulseVal: pulseT,
      phaseOffset: 0.52,
    }),
    ...addPointerArc3D(pagedView, [-0.42, 0.49, 2.54], cubeTop[9], ROLE.reqB, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.78,
    }),
  ];

  // Request C logical row & emerald arcs into scattered holes (1, 5, 8)
  const logicalCArcs = hideNodes([
    ...addBox3D(pagedView, -2.4, 1.55, 2.55, 0.96, 0.68, 0.36, ROLE.reqC, ROLE.reqC, {
      faceOpacity: 0.88,
      edgeWidth: 2.2,
      edgeGlow: 8,
    }),
    ...addBox3D(pagedView, -0.9, 1.55, 2.55, 0.96, 0.68, 0.36, ROLE.reqC, ROLE.reqC, {
      faceOpacity: 0.88,
      edgeWidth: 2.2,
      edgeGlow: 8,
    }),
    ...addBox3D(pagedView, 0.6, 1.55, 2.55, 0.96, 0.68, 0.36, ROLE.reqC, ROLE.reqC, {
      faceOpacity: 0.88,
      edgeWidth: 2.2,
      edgeGlow: 8,
    }),
    ...addPointerArc3D(pagedView, [-1.92, 1.89, 2.54], cubeTop[1], ROLE.reqC, {
      lift: 0.65,
      pulseVal: pulseT,
      phaseOffset: 0.12,
    }),
    ...addPointerArc3D(pagedView, [-0.42, 1.89, 2.54], cubeTop[5], ROLE.reqC, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.44,
    }),
    ...addPointerArc3D(pagedView, [1.08, 1.89, 2.54], cubeTop[8], ROLE.reqC, {
      lift: 0.5,
      pulseVal: pulseT,
      phaseOffset: 0.72,
    }),
  ]);

  // Clean 2D tier captions framing the orbiting 3D scene
  const tierCaptions = group(
    txt('LOGICAL SEQUENCE BLOCKS', 255, -408, 26, ROLE.key, 'mono').glow(5, ROLE.key),
    txt('PHYSICAL VRAM POOL (PACKED 3D CUBES)', 255, 444, 26, ROLE.focus, 'mono').glow(
      5,
      ROLE.focus,
    ),
  );

  // MathJax lookup equation (shown at `divide`, hidden when switching to `tailMode`)
  const divEq = glowTex(String.raw`5 \div 4 = 1\;\text{rem}\;1`, {
    x: -635,
    y: 44,
    size: 40,
    color: ROLE.focus,
    glow: 7,
  });

  // Left-side dynamic readouts (clean non-overlapping splitFade across tailMode!)
  const leftMode0 = guardedDynamic(
    () => fadeOutHalf(tailMode.value),
    (a) => {
      const nodes = [];
      // Compact page table readout
      if (tableVis.value > 0.05) {
        const tA = a * tableVis.value;
        nodes.push(
          txt(
            'REQ A BLOCK TABLE  (4 slots / block)',
            -855,
            -162,
            26,
            ROLE.reqA,
            'mono',
            'left',
          ).opacity(tA),
          txt(
            'Log 0  ->  Phys 7    [pos 0..3]',
            -855,
            -110,
            26,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(tA),
          txt('Log 1  ->  Phys 2    [pos 4..7]', -855, -62, 26, ROLE.focus, 'mono', 'left').opacity(
            tA,
          ),
        );
      } else {
        nodes.push(
          txt('Small fixed-size KV blocks', -855, -130, 28, ROLE.reqA, 'sans', 'left').opacity(a),
          txt('Allocated on demand anywhere', -855, -76, 28, COSMOS.muted, 'sans', 'left').opacity(
            a,
          ),
        );
      }

      if (physVis.value > 0.05) {
        nodes.push(
          txt('Pos 5 -> Log 1, Slot 1 -> Phys 2', -855, 118, 26, ROLE.focus, 'mono', 'left')
            .glow(6, ROLE.focus)
            .opacity(a * physVis.value),
        );
      }

      // Live 4-slot fill meter (tokens 1..4 fill block 0; token 5 claims block 1 slot 0!)
      if (fillSlots.value > 0.05) {
        const nTok = Math.min(5, Math.round(fillSlots.value));
        const fA = a * Math.min(1, fillSlots.value * 2);
        nodes.push(
          txt('ON-DEMAND GROWTH', -855, 198, 26, COSMOS.muted, 'mono', 'left').opacity(fA),
        );
        for (let i = 0; i < SLOTS; i++) {
          const filled = i < Math.min(SLOTS, nTok);
          nodes.push(
            rect(52, 40, {
              fill: filled ? ROLE.reqA : '#10192d',
              stroke: filled ? ROLE.reqA : '#364872',
              width: 2.0,
              radius: 7,
            })
              .at(-826 + i * 60, 254)
              .opacity(fA),
          );
        }
        // Second block lights up on token 5!
        const b2On = nTok >= 5;
        for (let i = 0; i < SLOTS; i++) {
          const filled = b2On && i === 0;
          nodes.push(
            rect(52, 40, {
              fill: filled ? ROLE.focus : '#10192d',
              stroke: filled ? ROLE.focus : b2On ? '#4c5f8a' : '#232e4a',
              width: 2.0,
              radius: 7,
              ...(b2On ? {} : { dash: [4, 4] }),
            })
              .at(-556 + i * 60, 254)
              .opacity(fA * (b2On ? 1 : 0.45)),
          );
        }
        nodes.push(
          txt(
            b2On ? 'Token 5 claims Block 2 (slot 0)' : `Block 1: ${nTok} / 4 slots filled`,
            -855,
            312,
            26,
            b2On ? ROLE.focus : ROLE.reqA,
            'mono',
            'left',
          ).opacity(fA),
        );
      }

      if (thirdVis.value > 0.05) {
        nodes.push(
          txt('REQ C FITS IN SCATTERED HOLES', -855, 384, 28, ROLE.reqC, 'mono', 'left')
            .glow(7, ROLE.reqC)
            .opacity(a * thirdVis.value),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: 16-slot last-block waste & block size tradeoff
  const leftMode1 = guardedDynamic(
    () => fadeInHalf(tailMode.value),
    (a) => {
      const tr = tradeStep.value;
      const nodes = [
        txt('LAST-BLOCK TAIL WASTE', -855, -162, 26, ROLE.link, 'mono', 'left')
          .glow(5, ROLE.link)
          .opacity(a),
        txt(
          '16-token block  ·  1 filled, 15 empty',
          -855,
          -110,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),
      ];
      // 16 visual slots in 2 rows of 8
      for (let i = 0; i < 16; i++) {
        const r = Math.floor(i / 8);
        const col = i % 8;
        const isFilled = i === 0;
        nodes.push(
          rect(54, 40, {
            fill: isFilled ? ROLE.reqA : '#221320',
            stroke: isFilled ? ROLE.reqA : ROLE.waste,
            width: 2.0,
            radius: 6,
          })
            .at(-824 + col * 64, -46 + r * 54)
            .opacity(a),
        );
      }

      if (tr >= 1.5) {
        nodes.push(
          txt(
            'Smaller blocks -> less waste, larger tables',
            -855,
            118,
            26,
            ROLE.fresh,
            'sans',
            'left',
          ).opacity(a),
        );
      }
      if (tr >= 2.5) {
        nodes.push(
          txt(
            'Larger blocks  -> more waste, smaller tables',
            -855,
            172,
            26,
            ROLE.link,
            'sans',
            'left',
          ).opacity(a),
        );
      }
      if (tr >= 3.5) {
        nodes.push(
          txt(
            'Kernel speed varies with block size',
            -855,
            232,
            26,
            ROLE.focus,
            'sans',
            'left',
          ).opacity(a),
        );
      }
      if (tr >= 4.5) {
        nodes.push(
          txt('Benchmark block size on your workload', -855, 304, 28, ROLE.key, 'mono', 'left')
            .glow(6, ROLE.key)
            .opacity(a),
        );
      }
      return group(...nodes);
    },
  );

  // Initial picture: full orbiting 3D PagedAttention scene live immediately!
  s.add(pagedAura, pagedView, header, tierCaptions, leftMode0, leftMode1);
  orbitScene(s, c, pagedView, { theta: -0.18, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulseT, 5.2, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0 cues
  c.on('small-blocks', () => {
    s.play(pulseT.to(0.4, { duration: 0.2 })); // gentle initial pulse
  });
  c.on('hand-one', () => {
    fadeInNodes(s, c, c.cue('hand-one').start, extraFillCubes.slice(0, 18), 0.35);
  });
  c.on('anywhere', () => {
    s.play(tableVis.to(0.35, { duration: clampDur(c, c.cue('anywhere').start, 0.3) }));
  });

  // Beat 1 cues (Table & 5 / 4 = 1 rem 1 -> Phys 2)
  c.on('table', () => {
    s.play(tableVis.to(1, { duration: clampDur(c, c.cue('table').start, 0.3) }));
  });
  c.on('logical', () => {
    s.play(tableVis.to(1, { duration: 0.15 }));
  });
  c.on('four-each', () => {
    s.play(fillSlots.to(0.2, { duration: clampDur(c, c.cue('four-each').start, 0.25) }));
  });
  c.show('divide', divEq);
  c.on('divide', () => {
    s.play(divVis.to(1, { duration: clampDur(c, c.cue('divide').start, 0.3) }));
  });
  c.on('physical', () => {
    const t = c.cue('physical').start;
    s.play(physVis.to(1, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, block2Glow, 0.35);
  });

  // Beat 2 cues (On-demand growth 1..4 -> 5th token claims 2nd block)
  c.on('first-takes', () => {
    s.play(fillSlots.to(1, { duration: clampDur(c, c.cue('first-takes').start, 0.3) }));
  });
  c.on('say-one', () => {
    s.play(fillSlots.to(1.2, { duration: clampDur(c, c.cue('say-one').start, 0.25) }));
  });
  c.on('next-slot', () => {
    s.play(fillSlots.to(2.5, { duration: clampDur(c, c.cue('next-slot').start, 0.35) }));
  });
  c.on('first-four', () => {
    s.play(fillSlots.to(4, { duration: clampDur(c, c.cue('first-four').start, 0.4) }));
  });
  c.on('fifth', () => {
    const t = c.cue('fifth').start;
    s.play(fillSlots.to(5, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, extraFillCubes.slice(18), 0.35);
  });

  // Beat 3 cues (Req C fits in holes!)
  c.on('third-fits', () => {
    const t = c.cue('third-fits').start;
    s.play(thirdVis.to(1, { duration: clampDur(c, t, 0.35) }));
    fadeInNodes(s, c, t, [...reqCCubes, ...logicalCArcs], 0.45);
  });
  c.on('paged-name', () => {
    s.play(thirdVis.to(1, { duration: 0.15 }));
  });
  c.on('any-free', () => {
    s.play(thirdVis.to(1, { duration: 0.15 }));
  });

  // Beat 4 cues (16-slot partial block & block-size tradeoff)
  c.hide('waste-remains', divEq);
  c.on('waste-remains', () => {
    const t = c.cue('waste-remains').start;
    s.play(tailMode.to(1, { duration: clampDur(c, t, 0.3) }));
  });
  c.on('sixteen', () => {
    s.play(tradeStep.to(1, { duration: clampDur(c, c.cue('sixteen').start, 0.25) }));
  });
  c.on('smaller', () => {
    s.play(tradeStep.to(2, { duration: clampDur(c, c.cue('smaller').start, 0.25) }));
  });
  c.on('larger', () => {
    s.play(tradeStep.to(3, { duration: clampDur(c, c.cue('larger').start, 0.25) }));
  });
  c.on('speed', () => {
    s.play(tradeStep.to(4, { duration: clampDur(c, c.cue('speed').start, 0.25) }));
  });
  c.on('measure', () => {
    s.play(tradeStep.to(5, { duration: clampDur(c, c.cue('measure').start, 0.25) }));
  });
}
