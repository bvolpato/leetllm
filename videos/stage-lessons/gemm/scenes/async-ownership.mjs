// Scene 13: When can slot zero take another tile? Double-buffered SMEM timeline, overwrite hazard -> repair + Ampere/Hopper.
import { markDecoration } from '../../cinematic-kit.mjs';
import {
  COSMOS,
  ROLE,
  aura,
  doubleBuffer,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function asyncOwnership(s, c) {
  const phase = s.value(0);
  const clockVal = s.value(0.2); // drives doubleBuffer(clockVal)
  // hazard: 0=normal, 1=early overwrite collision at step 2, 2=repaired at step 3
  const hazard = s.value(0);
  const showArch = s.value(0);

  const bgAura = aura(0, -10, 640, '#5ce1e61e', '#a78bfa18');
  const title = heroTitle(['When Can Slot Zero', 'Take Another Tile?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: ROLE.c,
    eyebrow: 'DOUBLE-BUFFERED ASYNC PIPELINE',
  });

  // Timeline x mapping for step t in [0, 4] -> x in [-560, 720]
  const tx = (t) => -560 + t * 320;

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const clk = clockVal.value;
    const hz = Math.round(hazard.value);
    const sa = showArch.value;
    const db = doubleBuffer(clk);
    const pulse = 0.72 + 0.28 * Math.sin(p * 4.0);

    const nodes = [];

    // Time axis ruler above lanes (clean ticks, never crossing lane text!)
    nodes.push(
      line([tx(0), -176], [tx(4), -176], { stroke: COSMOS.rule, width: 2.2 }).opacity(0.8),
    );
    for (let t = 0; t <= 4; t++) {
      const x = tx(t);
      nodes.push(
        line([x, -190], [x, -162], { stroke: COSMOS.muted, width: 2.2 }).opacity(0.8),
        txt(`step ${t}`, x, -224, 26, COSMOS.muted, 'mono'),
      );
    }

    // Slot 0 and Slot 1 lanes
    const laneY0 = -95;
    const laneY1 = 40;
    nodes.push(
      txt('SLOT 0', -725, laneY0, 30, ROLE.a, 'mono'),
      txt('SLOT 1', -725, laneY1, 30, COSMOS.violet, 'mono'),
    );

    // Slot 0: Tile 0 Copy [0..1] + Reader [1..3] (or [1..2] when collided at [2..3])
    const copy0W = tx(1) - tx(0) - 10;
    const read0W = (hz === 1 ? tx(2) : tx(3)) - tx(1) - 10;
    nodes.push(
      rect(copy0W, 74, { fill: '#12294a', stroke: ROLE.a, width: 2.5, radius: 10 })
        .at((tx(0) + tx(1)) * 0.5, laneY0)
        .glow(6, ROLE.a),
      txt('COPY T0', (tx(0) + tx(1)) * 0.5, laneY0, 26, ROLE.a, 'mono'),
    );

    if (clk >= 1.0) {
      nodes.push(
        rect(read0W, 74, { fill: '#0f3042', stroke: ROLE.c, width: 2.8, radius: 10 })
          .at((tx(1) + (hz === 1 ? tx(2) : tx(3))) * 0.5, laneY0)
          .glow(8, ROLE.c),
        txt(
          hz === 1 ? 'READ T0' : 'WARP READ T0 (MMA)',
          (tx(1) + (hz === 1 ? tx(2) : tx(3))) * 0.5,
          laneY0,
          26,
          ROLE.c,
          'mono',
        ),
      );
    }

    // Slot 1: Tile 1 Copy [1..2] + Reader [2..4]
    if (clk >= 1.1) {
      const copy1W = tx(2) - tx(1) - 10;
      nodes.push(
        rect(copy1W, 74, { fill: '#24153d', stroke: COSMOS.violet, width: 2.5, radius: 10 })
          .at((tx(1) + tx(2)) * 0.5, laneY1)
          .glow(6, COSMOS.violet),
        txt('COPY T1', (tx(1) + tx(2)) * 0.5, laneY1, 26, COSMOS.violet, 'mono'),
      );
    }
    if (clk >= 2.0) {
      const read1W = tx(4) - tx(2) - 10;
      nodes.push(
        rect(read1W, 74, { fill: '#1c183b', stroke: COSMOS.violet, width: 2.5, radius: 10 })
          .at((tx(2) + tx(4)) * 0.5, laneY1)
          .glow(6, COSMOS.violet),
        txt('WARP READ T1', (tx(2) + tx(4)) * 0.5, laneY1, 26, COSMOS.violet, 'mono'),
      );
    }

    // Next Tile 2 copy into Slot 0: Hazard at step [2..3] vs Repaired at [3..4]
    if (hz === 1) {
      const ovW = tx(3) - tx(2) - 10;
      nodes.push(
        rect(ovW, 84, { fill: '#451020', stroke: ROLE.bad, width: 3.8, radius: 10 })
          .at((tx(2) + tx(3)) * 0.5, laneY0)
          .glow(14 * pulse, ROLE.bad),
        txt('OVERWRITE T2!', (tx(2) + tx(3)) * 0.5, laneY0, 26, ROLE.bad, 'mono').glow(6, ROLE.bad),
        txt(
          'HAZARD: T2 overwrites Slot 0 while MMA reader is still active!',
          0,
          178,
          30,
          ROLE.bad,
          'mono',
        ).glow(6, ROLE.bad),
      );
    } else if (hz === 2) {
      const okW = tx(4) - tx(3) - 10;
      nodes.push(
        rect(okW, 74, { fill: '#0e302a', stroke: ROLE.good, width: 3.2, radius: 10 })
          .at((tx(3) + tx(4)) * 0.5, laneY0)
          .glow(10, ROLE.good),
        txt('SAFE COPY T2', (tx(3) + tx(4)) * 0.5, laneY0, 26, ROLE.good, 'mono'),
        txt(
          'REPAIRED: step 3 starts only after final reader releases Slot 0',
          0,
          178,
          30,
          ROLE.good,
          'mono',
        ).glow(6, ROLE.good),
      );
    } else {
      nodes.push(
        txt(
          'Copy done → readable  ·  Last reader done → reusable',
          0,
          178,
          28,
          COSMOS.gold,
          'mono',
        ),
      );
    }

    // Playhead marker cleanly riding along the top ruler at y = -176
    const curX = tx(Math.min(4, clk));
    nodes.push(glowDot(curX, -176, { radius: 8, color: COSMOS.gold, glow: 12 }));

    // Beat 4: Hardware evolution strip (floating nodes connected by glowing flow, zero prose boxes)
    if (sa > 0.02) {
      const tiers = [
        { title: 'Ampere cp.async', detail: 'GMEM → SMEM direct', x: -530, col: ROLE.a },
        { title: 'Hopper TMA + WGMMA', detail: '4 warps (128 threads)', x: 0, col: COSMOS.violet },
        {
          title: 'Operand Placement',
          detail: 'B SMEM · A SMEM/Reg · C Reg',
          x: 545,
          col: ROLE.good,
        },
      ];
      for (const tr of tiers) {
        nodes.push(
          txt(tr.title, tr.x, 295, 28, tr.col, 'mono').glow(5, tr.col).opacity(sa),
          txt(tr.detail, tr.x, 345, 26, COSMOS.muted, 'sans').opacity(sa),
        );
      }
      nodes.push(
        txt('→', -260, 315, 36, COSMOS.gold, 'mono').opacity(sa),
        txt('→', 260, 315, 36, COSMOS.gold, 'mono').opacity(sa),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('slot-copy', () =>
    s.play(clockVal.to(1.0, { duration: remainDuration(c, 'slot-copy', 0.6) })),
  );
  c.on('slot-read', () =>
    s.play(clockVal.to(2.2, { duration: remainDuration(c, 'slot-read', 0.8) })),
  );
  c.on('slot-release', () =>
    s.play(clockVal.to(3.0, { duration: remainDuration(c, 'slot-release', 0.6) })),
  );
  c.on('slots', () => s.play(clockVal.to(3.05, { duration: remainDuration(c, 'slots', 0.35) })));
  c.on('slot-overwrite', () => {
    s.play(clockVal.to(2.4, { duration: 0.35 }));
    s.play(hazard.to(1, { duration: remainDuration(c, 'slot-overwrite', 0.45) }));
  });
  c.on('slot-repair', () => {
    s.play(clockVal.to(3.2, { duration: 0.45 }));
    s.play(hazard.to(2, { duration: remainDuration(c, 'slot-repair', 0.45) }));
  });
  c.on('architecture', () =>
    s.play(showArch.to(1, { duration: remainDuration(c, 'architecture', 0.5) })),
  );
}
