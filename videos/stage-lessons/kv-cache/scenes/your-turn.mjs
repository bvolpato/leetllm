// Scene 16: your-turn - Your turn
// Interactive 3D Paged Pool Challenge Arena:
//   Round 1: block_size=32, A=100, B=32 -> predict total blocks (HOLD 5s) -> reveal 4 (28 empty) + 1 = 5!
//   Round 2: A finishes, C=70, table=[5,11,2], pos=40 -> predict blocks & physical block (HOLD 11s) ->
//            reveal C=3 + B=1 = 4, 40/32 = 1 rem 8 -> Logical 1, Slot 8 -> Physical 11!
//   Round 3: B & C grow past budget -> smaller blocks? NO. scheduler? NO -> fewer KV heads / precision / more VRAM.
import { gridPlane3d, group, par } from 'vizmatic/stage';
import {
  COSMOS,
  C_TABLE,
  ROLE,
  YOUR_TURN,
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
  glowBar,
  glowTex,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function yourTurn(s, c) {
  const phase = s.value(0);
  // Mode: 0 = Round 1, 1 = Round 2, 2 = Round 3 (overflow)
  const roundMode = s.value(0);
  const r1Step = s.value(0); // 1=size-32, 2=ask-one, 3=a-four(AFT), 4=empty(AFT), 5=b-one(AFT), 6=five(AFT)
  const r2Step = s.value(0); // 1=a-done, 2=c-joins, 3=table, 4=ask-two, 5=c-three(AFT), 6=four(AFT), 7=divide(AFT), 8=logical(AFT), 9=physical(AFT)
  const r3Step = s.value(0); // 1=full, 2=no-blocks, 3=no-scheduler, 4=bytes, 5=more

  const header = cinemaHeader('YOUR TURN  ·  NEW NUMBERS', 'Block size 32:', 'count & map it', {
    x: -860,
    y: -415,
    accent: ROLE.focus,
    size: 54,
  });

  const stageAura = aura(275, 25, 620, '#ffd16624', '#6ee7b71a');

  // Orbiting 3D Physical Pool (12 slots numbered 0..11) on right side
  const poolView = cinematic3d({
    theta: -0.82,
    phi: 1.02,
    distance: 15.8,
    unit: 116,
    focus: [0, 0, 0.9],
  }).at(285, 32);

  poolView.add(
    gridPlane3d({
      x: [-3.5, 3.5],
      y: [-2.6, 2.6],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.52,
    }),
  );

  const slotCoords = [];
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 4; col++) {
      const x = -2.9 + col * 1.48;
      const y = -2.0 + r * 1.48;
      slotCoords.push({ x, y, top: [x + 0.59, y + 0.59, 0.92] });
      addWireBox3D(poolView, x, y, 0.04, 1.18, 1.18, 0.84, '#34476e', {
        width: 1.5,
        opacity: 0.5,
        glow: 2,
      });
    }
  }

  // Round 1: Request A's 4 cyan cubes (indices 0, 1, 2, 3) - hidden until AFTER `a-four`!
  const aCubes = [];
  for (const idx of [0, 1, 2, 3]) {
    const p = slotCoords[idx];
    aCubes.push(
      ...addBox3D(poolView, p.x, p.y, 0.04, 1.18, 1.18, 0.86, ROLE.reqA, ROLE.reqA, {
        faceOpacity: 0.84,
        edgeWidth: 2.2,
        edgeGlow: 7,
      }),
    );
  }
  hideNodes(aCubes);

  // Round 1 & 2: Request B's 1 violet cube (index 4) - hidden until AFTER `b-one`!
  const bCube = hideNodes(
    addBox3D(
      poolView,
      slotCoords[4].x,
      slotCoords[4].y,
      0.04,
      1.18,
      1.18,
      0.86,
      ROLE.reqB,
      ROLE.reqB,
      {
        faceOpacity: 0.86,
        edgeWidth: 2.3,
        edgeGlow: 8,
      },
    ),
  );

  // Round 2: Request C's 3 emerald cubes at physical IDs [5, 11, 2] - hidden until AFTER `c-three`!
  const cCubes = [];
  for (const idx of C_TABLE) {
    const p = slotCoords[idx];
    cCubes.push(
      ...addBox3D(poolView, p.x, p.y, 0.04, 1.18, 1.18, 0.86, ROLE.reqC, ROLE.reqC, {
        faceOpacity: 0.86,
        edgeWidth: 2.3,
        edgeGlow: 8,
      }),
    );
  }
  hideNodes(cCubes);

  // Gold highlight cage + glowing 3D Bezier beam directly onto Physical Block 11 - hidden until AFTER `physical`!
  const block11Hit = hideNodes([
    ...addWireBox3D(
      poolView,
      slotCoords[11].x - 0.1,
      slotCoords[11].y - 0.1,
      0.02,
      1.38,
      1.38,
      1.08,
      ROLE.focus,
      { width: 3.4, opacity: 0.98, glow: 13 },
    ),
    ...addPointerArc3D(poolView, [-0.5, 0.2, 2.55], slotCoords[11].top, ROLE.focus, {
      lift: 0.6,
      pulseVal: phase,
      phaseOffset: 0.2,
    }),
  ]);

  // MathJax 40 / 32 = 1 rem 8 - shown AFTER `divide`!
  const div40Eq = glowTex(String.raw`40 \div 32 = 1\;\text{rem}\;8`, {
    x: -600,
    y: 162,
    size: 38,
    color: ROLE.focus,
    glow: 7,
  });

  // Left-side dynamic challenge & answers
  const leftDyn = guardedDynamic(
    () => 1,
    () => {
      const m = roundMode.value;
      const r1 = r1Step.value;
      const r2 = r2Step.value;
      const r3 = r3Step.value;
      const pulse = 0.7 + 0.3 * Math.sin(phase.value * 5.0);
      const nodes = [
        txt('PHYSICAL POOL: BLOCKS 0..11 (32 SLOTS EACH)', 285, -405, 26, COSMOS.muted, 'mono'),
      ];

      if (m < 0.5) {
        // Round 1
        nodes.push(
          txt(
            `Block size: ${YOUR_TURN.blockSize} tokens`,
            -855,
            -162,
            28,
            ROLE.focus,
            'mono',
            'left',
          ),
          txt(
            `Req A: ${YOUR_TURN.aTokens} tokens   ·   Req B: ${YOUR_TURN.bTokens} tokens`,
            -855,
            -108,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
        );
        if (r1 >= 1.5 && r1 < 2.5) {
          nodes.push(
            txt('PREDICT: How many blocks in use?', -855, -10, 32, ROLE.focus, 'sans', 'left')
              .glow(7, ROLE.focus)
              .opacity(pulse),
          );
        }
        if (r1 >= 2.5) {
          nodes.push(
            txt(
              `A: ceil(100 / 32) = ${YOUR_TURN.aBlocks} blocks`,
              -855,
              -10,
              28,
              ROLE.reqA,
              'mono',
              'left',
            ),
          );
        }
        if (r1 >= 3.5) {
          nodes.push(
            txt(
              `   (${YOUR_TURN.aEmpty} empty slots in A's 4th block)`,
              -855,
              44,
              26,
              ROLE.link,
              'mono',
              'left',
            ),
          );
        }
        if (r1 >= 4.5) {
          nodes.push(
            txt(
              `B: 32 / 32 = ${YOUR_TURN.bBlocks} block`,
              -855,
              108,
              28,
              ROLE.reqB,
              'mono',
              'left',
            ),
          );
        }
        if (r1 >= 5.5) {
          nodes.push(
            txt(
              `= ${YOUR_TURN.round1Total} blocks`,
              -855,
              198,
              42,
              ROLE.focus,
              'mono',
              'left',
            ).glow(9, ROLE.focus),
          );
        }
      } else if (m < 1.5) {
        // Round 2
        nodes.push(
          txt(
            'A finishes (4 freed)  ·  B keeps 1 block',
            -855,
            -162,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
          txt(
            `Req C joins: ${YOUR_TURN.cTokens} tokens`,
            -855,
            -108,
            28,
            ROLE.reqC,
            'mono',
            'left',
          ),
        );
        if (r2 >= 2.5) {
          nodes.push(
            txt(`C's table: [ ${C_TABLE.join(', ')} ]`, -855, -48, 28, ROLE.key, 'mono', 'left'),
          );
        }
        if (r2 >= 3.5 && r2 < 4.5) {
          nodes.push(
            txt('PREDICT: Blocks now? Where is pos 40?', -855, 44, 30, ROLE.focus, 'sans', 'left')
              .glow(7, ROLE.focus)
              .opacity(pulse),
          );
        }
        if (r2 >= 4.5) {
          nodes.push(
            txt(
              r2 >= 5.5
                ? `C: ${YOUR_TURN.cBlocks} blocks  +  B: 1  =  ${YOUR_TURN.round2Total} blocks`
                : `C: ceil(70 / 32) = ${YOUR_TURN.cBlocks} blocks`,
              -855,
              44,
              28,
              ROLE.reqC,
              'mono',
              'left',
            ).glow(6, ROLE.reqC),
          );
        }
        if (r2 >= 7.5) {
          nodes.push(
            txt(
              `Logical block ${YOUR_TURN.logicalBlock}, Slot ${YOUR_TURN.slotOffset}`,
              -855,
              250,
              28,
              ROLE.key,
              'mono',
              'left',
            ),
          );
        }
        if (r2 >= 8.5) {
          nodes.push(
            txt(
              `Table[1]  ->  PHYSICAL BLOCK ${YOUR_TURN.physicalBlock}`,
              -855,
              318,
              34,
              ROLE.focus,
              'mono',
              'left',
            ).glow(9, ROLE.focus),
          );
        }
      } else {
        // Round 3: B & C live filled slots exceed memory budget
        nodes.push(
          txt('B + C FILLED SLOTS EXCEED BUDGET', -855, -162, 28, ROLE.waste, 'mono', 'left').glow(
            6,
            ROLE.waste,
          ),
          glowBar(-855, -104, 650, 36, 1.0, { fill: ROLE.waste, glow: 9 }),
        );
        if (r3 >= 1.5) {
          nodes.push(txt('Smaller blocks?        NO', -855, -24, 28, ROLE.waste, 'mono', 'left'));
        }
        if (r3 >= 2.5) {
          nodes.push(txt('Different scheduler?   NO', -855, 36, 28, ROLE.waste, 'mono', 'left'));
        }
        if (r3 >= 3.5) {
          nodes.push(
            txt('Need fewer bytes / token:', -855, 128, 28, ROLE.fresh, 'mono', 'left').glow(
              6,
              ROLE.fresh,
            ),
            txt('Fewer KV heads or lower precision', -855, 182, 26, COSMOS.ink, 'sans', 'left'),
            txt('(+ quality check on your task)', -855, 228, 26, COSMOS.muted, 'sans', 'left'),
          );
        }
        if (r3 >= 4.5) {
          nodes.push(
            txt(
              'Or: more VRAM / fewer concurrent requests',
              -855,
              306,
              26,
              ROLE.focus,
              'mono',
              'left',
            ).glow(5, ROLE.focus),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, poolView, header, leftDyn);
  orbitScene(s, c, poolView, { theta: -0.22, phi: 0.9 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, phase, 9.5, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0 (PREDICTION 1 - hold 5s!)
  c.on('size-32', () => {
    s.play(r1Step.to(1, { duration: clampDur(c, c.cue('size-32').start, 0.25) }));
  });
  c.on('ask-one', () => {
    s.play(r1Step.to(2, { duration: clampDur(c, c.cue('ask-one').start, 0.25) }));
  });

  // Beat 1 (Reveals strictly AFTER spoken phrases!)
  c.after('a-four', () => {
    const t = c.cue('a-four').end;
    s.play(r1Step.to(3, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, aCubes, 0.35);
  });
  c.after('empty', () => {
    s.play(r1Step.to(4, { duration: clampDur(c, c.cue('empty').end, 0.25) }));
  });
  c.after('b-one', () => {
    const t = c.cue('b-one').end;
    s.play(r1Step.to(5, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, bCube, 0.35);
  });
  c.after('five', () => {
    s.play(r1Step.to(6, { duration: clampDur(c, c.cue('five').end, 0.25) }));
  });

  // Beat 2 & 3 (PREDICTION 2 - hold 5s + 6s!)
  c.on('a-done', () => {
    const t = c.cue('a-done').start;
    s.play(par(roundMode.to(1, { duration: 0.25 }), r2Step.to(1, { duration: 0.25 })));
    fadeOutNodes(s, c, t, aCubes, 0.35);
  });
  c.on('c-joins', () => {
    s.play(r2Step.to(2, { duration: clampDur(c, c.cue('c-joins').start, 0.25) }));
  });
  c.on('table', () => {
    s.play(r2Step.to(3, { duration: clampDur(c, c.cue('table').start, 0.25) }));
  });
  c.on('ask-two', () => {
    s.play(r2Step.to(4, { duration: clampDur(c, c.cue('ask-two').start, 0.25) }));
  });

  // Beat 4 (Reveals strictly AFTER spoken phrases!)
  c.after('c-three', () => {
    const t = c.cue('c-three').end;
    s.play(r2Step.to(5, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, cCubes, 0.35);
  });
  c.after('four', () => {
    s.play(r2Step.to(6, { duration: clampDur(c, c.cue('four').end, 0.25) }));
  });
  c.show('divide', div40Eq, { after: true });
  c.after('divide', () => {
    s.play(r2Step.to(7, { duration: clampDur(c, c.cue('divide').end, 0.25) }));
  });
  c.after('logical', () => {
    s.play(r2Step.to(8, { duration: clampDur(c, c.cue('logical').end, 0.25) }));
  });
  c.after('physical', () => {
    const t = c.cue('physical').end;
    s.play(r2Step.to(9, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, block11Hit, 0.35);
  });

  // Beat 5 (Capacity ceiling)
  c.hide('full', div40Eq);
  c.on('full', () => {
    const t = c.cue('full').start;
    s.play(par(roundMode.to(2, { duration: 0.25 }), r3Step.to(1, { duration: 0.25 })));
  });
  c.after('no-blocks', () => {
    s.play(r3Step.to(2, { duration: clampDur(c, c.cue('no-blocks').end, 0.25) }));
  });
  c.after('no-scheduler', () => {
    s.play(r3Step.to(3, { duration: clampDur(c, c.cue('no-scheduler').end, 0.25) }));
  });
  c.on('bytes', () => {
    s.play(r3Step.to(4, { duration: clampDur(c, c.cue('bytes').start, 0.25) }));
  });
  c.on('more', () => {
    s.play(r3Step.to(5, { duration: clampDur(c, c.cue('more').start, 0.25) }));
  });
}
