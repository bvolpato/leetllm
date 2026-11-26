// Scene 8: lifetime - A block has a lifetime
// Orbiting 3D physical VRAM pool: Request A finishes, blocks return without moving B's data,
// GPU in-flight read lock holds reuse until reads clear & refcount hits 0, then retained gold prefix preview.
import { gridPlane3d, group, line3d } from 'vizmatic/stage';
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

export default function lifetime(s, c) {
  const pulseT = s.value(0);
  const stageStep = s.value(0); // 0=init, 1=come-back, 2=finishes, 3=new-uses, 4=no-move, 5=safety/in-flight, 6=done, 7=owners, 8=retained

  const header = cinemaHeader('BLOCK LIFECYCLE', 'A block has', 'a lifetime', {
    x: -860,
    y: -415,
    accent: ROLE.fresh,
    size: 54,
  });

  const poolAura = aura(245, 32, 620, '#6ee7b724', '#ffd16618');

  const view3d = cinematic3d({
    theta: -0.82,
    phi: 1.02,
    distance: 15.6,
    unit: 118,
    focus: [0, 0, 0.95],
  }).at(255, 32);

  view3d.add(
    gridPlane3d({
      x: [-3.5, 3.5],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.52,
    }),
  );

  // 4 x 2 physical pool of 8 blocks
  const coords = [];
  for (let r = 0; r < 2; r++) {
    for (let col = 0; col < 4; col++) {
      const x = -2.85 + col * 1.48;
      const y = -1.35 + r * 1.56;
      coords.push({ x, y, top: [x + 0.59, y + 0.59, 0.92] });
      addWireBox3D(view3d, x, y, 0.04, 1.18, 1.18, 0.84, '#34476e', {
        width: 1.4,
        opacity: 0.45,
        glow: 2,
      });
    }
  }

  // Request B's stationary violet cubes (blocks 1, 5, 6) - NEVER move!
  for (const idx of [1, 5, 6]) {
    const p = coords[idx];
    addBox3D(view3d, p.x, p.y, 0.04, 1.18, 1.18, 0.86, ROLE.reqB, ROLE.reqB, {
      faceOpacity: 0.82,
      edgeWidth: 2.1,
      edgeGlow: 6,
    });
  }

  // Request A's initial cyan cubes (blocks 0, 2, 4)
  const reqACubes = [];
  for (const idx of [0, 2, 4]) {
    const p = coords[idx];
    reqACubes.push(
      ...addBox3D(view3d, p.x, p.y, 0.04, 1.18, 1.18, 0.86, ROLE.reqA, ROLE.reqA, {
        faceOpacity: 0.84,
        edgeWidth: 2.2,
        edgeGlow: 7,
      }),
    );
  }

  // Request C's emerald cubes taking returned slots 0 & 4
  const reqCCubes = hideNodes([
    ...addBox3D(view3d, coords[0].x, coords[0].y, 0.04, 1.18, 1.18, 0.86, ROLE.reqC, ROLE.reqC, {
      faceOpacity: 0.86,
      edgeWidth: 2.3,
      edgeGlow: 9,
    }),
    ...addBox3D(view3d, coords[4].x, coords[4].y, 0.04, 1.18, 1.18, 0.86, ROLE.reqC, ROLE.reqC, {
      faceOpacity: 0.86,
      edgeWidth: 2.3,
      edgeGlow: 9,
    }),
    ...addPointerArc3D(view3d, [-1.9, -1.2, 2.5], coords[0].top, ROLE.reqC, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.1,
    }),
    ...addPointerArc3D(view3d, [-0.3, -1.2, 2.5], coords[4].top, ROLE.reqC, {
      lift: 0.55,
      pulseVal: pulseT,
      phaseOffset: 0.55,
    }),
  ]);

  // Amber In-Flight GPU Read Lock cage around Block 2 + read laser
  const inFlightLock = hideNodes([
    ...addWireBox3D(
      view3d,
      coords[2].x - 0.1,
      coords[2].y - 0.1,
      0.02,
      1.38,
      1.38,
      1.1,
      ROLE.link,
      { width: 3.2, opacity: 0.95, glow: 12 },
    ),
    line3d(coords[2].top, [coords[2].top[0], coords[2].top[1], 2.65], {
      color: ROLE.link,
      width: 4.0,
      glow: 14,
      blend: 'screen',
    }),
  ]);
  view3d.add(inFlightLock.at(-1));

  // Retained golden prefix cubes (blocks 3 & 7) kept warm for future requests
  const retainedGold = hideNodes([
    ...addBox3D(
      view3d,
      coords[3].x,
      coords[3].y,
      0.04,
      1.18,
      1.18,
      0.98,
      ROLE.shared,
      ROLE.shared,
      {
        faceOpacity: 0.88,
        edgeWidth: 2.6,
        edgeGlow: 11,
      },
    ),
    ...addBox3D(
      view3d,
      coords[7].x,
      coords[7].y,
      0.04,
      1.18,
      1.18,
      0.98,
      ROLE.shared,
      ROLE.shared,
      {
        faceOpacity: 0.88,
        edgeWidth: 2.6,
        edgeGlow: 11,
      },
    ),
  ]);

  // Left-side dynamic lifecycle state readout
  const leftDyn = guardedDynamic(
    () => 1,
    () => {
      const st = stageStep.value;
      const nodes = [
        txt('PHYSICAL BLOCK POOL  ·  LIVE STATE', 255, -405, 26, COSMOS.muted, 'mono'),
        txt('Violet = Req B (never moves)', 255, 434, 26, ROLE.reqB, 'mono'),
      ];

      const items = [
        [1, '1. Req A finishes -> blocks released', ROLE.reqA],
        [3, '2. Req C reuses freed blocks in place', ROLE.reqC],
        [4, '3. Req B keeps running, zero copy', ROLE.reqB],
        [5, '4. SAFETY: wait for in-flight GPU reads', ROLE.link],
        [6, '5. Reuse only when reads clear & ref = 0', ROLE.fresh],
        [8, '6. Optional: retain gold prefix blocks', ROLE.shared],
      ];

      items.forEach(([thresh, label, col], idx) => {
        const active = st >= thresh - 0.1;
        if (active) {
          const isCurrent = st < thresh + 1.2;
          nodes.push(
            txt(label, -855, -142 + idx * 78, 26, col, isCurrent ? 'mono' : 'sans', 'left')
              .glow(isCurrent ? 6 : 0, col)
              .opacity(isCurrent ? 1 : 0.72),
          );
        }
      });

      if (st >= 5 && st < 6.5) {
        nodes.push(
          txt('LOCKED: GPU KERNEL READING', -855, 366, 30, ROLE.link, 'mono', 'left').glow(
            8,
            ROLE.link,
          ),
        );
      } else if (st >= 6.5 && st < 7.8) {
        nodes.push(
          txt(
            'READS DONE  ·  OWNERS = 0  ->  FREE',
            -855,
            366,
            28,
            ROLE.fresh,
            'mono',
            'left',
          ).glow(8, ROLE.fresh),
        );
      } else if (st >= 7.8) {
        nodes.push(
          txt('FINISHED PREFIXES KEPT WARM', -855, 366, 28, ROLE.shared, 'mono', 'left').glow(
            8,
            ROLE.shared,
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(poolAura, view3d, header, leftDyn);
  orbitScene(s, c, view3d, { theta: -0.26, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulseT, 4.5, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0 cues
  c.on('come-back', () => {
    s.play(stageStep.to(1, { duration: clampDur(c, c.cue('come-back').start, 0.25) }));
  });
  c.on('finishes', () => {
    const t = c.cue('finishes').start;
    s.play(stageStep.to(2, { duration: clampDur(c, t, 0.25) }));
    fadeOutNodes(s, c, t, reqACubes, 0.35);
  });
  c.on('new-uses', () => {
    const t = c.cue('new-uses').start;
    s.play(stageStep.to(3, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, reqCCubes, 0.4);
  });
  c.on('no-move', () => {
    s.play(stageStep.to(4, { duration: clampDur(c, c.cue('no-move').start, 0.25) }));
  });

  // Beat 1 cues
  c.on('safety', () => {
    s.play(stageStep.to(5, { duration: clampDur(c, c.cue('safety').start, 0.25) }));
  });
  c.on('in-flight', () => {
    fadeInNodes(s, c, c.cue('in-flight').start, inFlightLock, 0.35);
  });
  c.on('done', () => {
    const t = c.cue('done').start;
    s.play(stageStep.to(6, { duration: clampDur(c, t, 0.25) }));
    fadeOutNodes(s, c, t, inFlightLock, 0.3);
  });
  c.on('owners', () => {
    s.play(stageStep.to(7, { duration: clampDur(c, c.cue('owners').start, 0.25) }));
  });
  c.on('retained', () => {
    const t = c.cue('retained').start;
    s.play(stageStep.to(8, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, retainedGold, 0.4);
  });
}
