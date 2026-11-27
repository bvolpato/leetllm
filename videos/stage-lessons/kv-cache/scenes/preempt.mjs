// Scene 12: preempt - When the pool runs out anyway
// Act 1: Orbiting 3D 100%-Full VRAM Pool (0 free blocks), failed allocation keeps all tables clean.
// Act 2: Two recovery strategies side by side: Recompute (drop private blocks, keep gold shared prefixes,
//        spend GPU compute) vs Swap to CPU RAM (keep work, pay CPU-GPU link bandwidth).
import { delay, gridPlane3d, group, par, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  addWireBox3D,
  aura,
  beamWithPhotons,
  cinemaHeader,
  cinematic3d,
  clampDur,
  dashedRule,
  fadeInNodes,
  guardedDynamic,
  hideNodes,
  memCell,
  txt,
} from '../parts.mjs';

export default function preempt(s, c) {
  const act1Vis = s.value(1);
  const act2Vis = s.value(0);

  // Act 1 state (8 cues)
  const fullStep = s.value(0); // 1=ceiling, 2=needs-block, 3=empty, 4=decision, 5=delay, 6=evict, 7=unchanged, 8=retry

  // Act 2 state (6 recompute + 10 swap cues)
  const recStep = s.value(0); // 1=recompute, 2=gives-up, 3=to-wait, 4=rebuilds, 5=compute, 6=shared
  const swpStep = s.value(0); // 1=swap, 2=move, 3=keeps-work, 4=link, 5=differ, 6=either-way, 7=pays, 8=continue, 9=call-preempt, 10=plan

  const act1Header = cinemaHeader('POOL AT CAPACITY', 'When the pool', 'runs out anyway', {
    x: -860,
    y: -415,
    accent: ROLE.waste,
    size: 54,
  });

  const act1Aura = aura(255, 30, 620, '#ff6b8b28', '#fb923c16');

  // Orbiting 3D 4x3 Completely Full VRAM Pool
  const fullView = cinematic3d({
    theta: -0.84,
    phi: 1.02,
    distance: 15.8,
    unit: 102,
    focus: [0, 0, 0.7],
  }).at(255, -24);

  fullView.add(
    gridPlane3d({
      x: [-3.5, 3.5],
      y: [-2.6, 2.6],
      z: 0,
      step: 1.2,
      color: '#462135',
      width: 1.2,
      opacity: 0.54,
    }),
  );

  const fullColors = [
    [ROLE.shared, ROLE.shared, ROLE.reqA, ROLE.reqA],
    [ROLE.reqA, ROLE.reqB, ROLE.reqB, ROLE.reqB],
    [ROLE.reqC, ROLE.reqC, ROLE.prefill, ROLE.prefill],
  ];
  for (let r = 0; r < 3; r++) {
    for (let col = 0; col < 4; col++) {
      const x = -2.9 + col * 1.48;
      const y = -2.0 + r * 1.48;
      const colHex = fullColors[r][col];
      addBox3D(fullView, x, y, 0.04, 1.18, 1.18, 0.88, colHex, colHex, {
        faceOpacity: 0.84,
        edgeWidth: 2.1,
        edgeGlow: 6,
      });
    }
  }

  // Crimson pressure cage around the full pool when free list hits 0
  const pressureCage = hideNodes(
    addWireBox3D(fullView, -3.1, -2.2, 0.02, 6.2, 4.4, 1.15, ROLE.waste, {
      width: 3.0,
      opacity: 0.92,
      glow: 11,
    }),
  );

  const act1Dyn = guardedDynamic(act1Vis, (a) => {
    const f = fullStep.value;
    const nodes = [
      txt('12 / 12 PHYSICAL BLOCKS OCCUPIED', 255, -420, 26, ROLE.waste, 'mono')
        .glow(6, ROLE.waste)
        .opacity(a),
      txt('FREE LIST: 0 BLOCKS', 255, 458, 28, ROLE.waste, 'mono')
        .glow(8, ROLE.waste)
        .opacity(a * (f >= 2.5 ? 1 : 0.8)),
    ];

    const lines = [
      [2, 'Running request needs 1 more block', ROLE.reqA],
      [3, 'Free list is empty -> allocation fails', ROLE.waste],
      [4, 'Now it is a scheduling decision:', ROLE.focus],
      [5, 'Option 1: Delay this request', ROLE.link],
      [6, 'Option 2: Evict a victim & recover later', ROLE.waste],
      [7, 'Failed alloc leaves every table untouched', ROLE.fresh],
      [8, 'Retry starts clean from consistent state', ROLE.key],
    ];
    lines.forEach(([thresh, textStr, col], idx) => {
      if (f >= thresh - 0.1) {
        nodes.push(
          txt(textStr, -855, -148 + idx * 72, 26, col, idx >= 5 ? 'mono' : 'sans', 'left').opacity(
            a,
          ),
        );
      }
    });

    return group(...nodes);
  });

  // ── Act 2: Recompute (Left) vs Swap to CPU RAM (Right) ─────────────────────
  const act2Header = cinemaHeader('PREEMPTION RECOVERY', 'Recompute on GPU', 'or swap to CPU', {
    x: -860,
    y: -415,
    accent: ROLE.link,
    size: 54,
  });

  const act2Aura = group(aura(-430, 50, 440, '#5ce1e61e'), aura(430, 50, 440, '#fb923c22'));

  const act2Dyn = guardedDynamic(act2Vis, (a) => {
    const r = recStep.value;
    const sw = swpStep.value;
    const nodes = [dashedRule(0, -210, 0, 320, '#283657', 0.65 * a)];

    // LEFT: RECOMPUTE
    nodes.push(
      txt('STRATEGY 1: RECOMPUTE', -440, -184, 28, ROLE.key, 'mono').glow(6, ROLE.key).opacity(a),
    );
    // 4 victim blocks: 2 gold shared prefixes + 2 private cyan blocks that free & rebuild
    const blkX = [-730, -540, -350, -160];
    blkX.forEach((bx, idx) => {
      const isShared = idx < 2;
      const dropped = !isShared && r >= 1.5 && r < 3.5;
      const rebuilt = !isShared && r >= 3.5;
      const col = isShared ? ROLE.shared : dropped ? COSMOS.dim : ROLE.key;
      const fill = isShared ? '#29200e' : dropped ? '#0f1628' : '#102b38';
      const lbl = isShared ? 'Shared' : dropped ? 'Freed' : rebuilt ? 'Rebuilt' : 'Private';
      nodes.push(
        rect(164, 72, {
          fill,
          stroke: col,
          width: 2.2,
          radius: 10,
          ...(dropped ? { dash: [5, 5] } : {}),
        })
          .at(bx, -84)
          .opacity(a),
        txt(lbl, bx, -84, 26, col, 'mono').opacity(a),
      );
    });

    const recBullets = [
      [2, 'Victim gives up private GPU blocks', ROLE.key],
      [3, 'Returns to waiting queue', COSMOS.muted],
      [4, 'Rebuilds missing KV when resumed', ROLE.fresh],
      [5, 'Cost: extra GPU compute', ROLE.link],
      [6, 'Gold shared prefix blocks can stay warm', ROLE.shared],
    ];
    recBullets.forEach(([th, str, col], idx) => {
      const lit = r >= th - 0.1;
      nodes.push(
        txt(str, -830, 12 + idx * 54, 26, lit ? col : COSMOS.dim, 'sans', 'left').opacity(
          a * (lit ? 1 : 0.42),
        ),
      );
    });

    // RIGHT: SWAP TO CPU RAM (skeleton always visible from Act 2 start, lights up vividly on `swap`)
    const sA = a * (sw >= 0.5 ? Math.min(1, sw) : 0.45);
    nodes.push(
      txt('STRATEGY 2: SWAP TO CPU RAM', 440, -184, 28, ROLE.link, 'mono')
        .glow(sw >= 0.5 ? 6 : 0, ROLE.link)
        .opacity(sA),
      memCell('GPU VRAM', 225, -84, {
        w: 250,
        h: 74,
        fill: '#102b38',
        stroke: ROLE.key,
        textColor: ROLE.key,
        opacity: sA,
      }),
      memCell('CPU RAM', 655, -84, {
        w: 250,
        h: 74,
        fill: '#2b1c10',
        stroke: ROLE.link,
        textColor: ROLE.link,
        opacity: sA,
      }),
    );
    if (sw >= 1.5) {
      nodes.push(
        beamWithPhotons(
          [
            [358, -98],
            [522, -98],
          ],
          ROLE.link,
          0,
          { width: 4.0, glow: 11, photonCount: 2, alpha: sA },
        ),
        beamWithPhotons(
          [
            [522, -68],
            [358, -68],
          ],
          ROLE.fresh,
          0,
          { width: 4.0, glow: 11, photonCount: 2, alpha: sA },
        ),
      );
    }

    const swpBullets = [
      [2, 'Move blocks out to CPU & back later', ROLE.link],
      [3, 'Preserves computed KV state', ROLE.fresh],
      [4, 'Cost: CPU <-> GPU link bandwidth', ROLE.waste],
      [5, 'Engine defaults vary across versions', COSMOS.muted],
    ];
    swpBullets.forEach(([th, str, col], idx) => {
      const lit = sw >= th - 0.1;
      nodes.push(
        txt(str, 65, 12 + idx * 54, 26, lit ? col : COSMOS.dim, 'sans', 'left').opacity(
          a * (lit ? 1 : 0.42),
        ),
      );
    });

    // Bottom synthesis banner (clean floating text, no card!)
    if (sw >= 5.5) {
      const msg =
        sw >= 9.5
          ? 'PREEMPTION belongs in your capacity plan'
          : sw >= 8.5
            ? 'Frequent eviction = PREEMPTION'
            : 'Either way, the evicted request pays before it can continue';
      nodes.push(
        txt(msg, 0, 384, 32, sw >= 8.5 ? ROLE.focus : ROLE.link, 'mono')
          .glow(8, sw >= 8.5 ? ROLE.focus : ROLE.link)
          .opacity(a),
      );
    }

    return group(...nodes);
  });

  s.add(act1Aura, fullView, act1Header, act1Dyn, act2Dyn);

  // Orbit 3D full pool through Act 1
  const recStart = c.cue('recompute').start;
  c.at(0.1, () => {
    const dur = Math.max(1.5, recStart - c.start - 0.45);
    s.play(fullView.orbit({ theta: -0.32, phi: 0.92 }, { duration: dur }));
  });

  // Beat 0 cues (8 cues)
  c.on('ceiling', () => {
    s.play(fullStep.to(1, { duration: clampDur(c, c.cue('ceiling').start, 0.25) }));
  });
  c.on('needs-block', () => {
    s.play(fullStep.to(2, { duration: clampDur(c, c.cue('needs-block').start, 0.25) }));
  });
  c.on('empty', () => {
    const t = c.cue('empty').start;
    s.play(fullStep.to(3, { duration: clampDur(c, t, 0.25) }));
    fadeInNodes(s, c, t, pressureCage, 0.35);
  });
  c.on('decision', () => {
    s.play(fullStep.to(4, { duration: clampDur(c, c.cue('decision').start, 0.25) }));
  });
  c.on('delay', () => {
    s.play(fullStep.to(5, { duration: clampDur(c, c.cue('delay').start, 0.25) }));
  });
  c.on('evict', () => {
    s.play(fullStep.to(6, { duration: clampDur(c, c.cue('evict').start, 0.25) }));
  });
  c.on('unchanged', () => {
    s.play(fullStep.to(7, { duration: clampDur(c, c.cue('unchanged').start, 0.25) }));
  });
  c.on('retry', () => {
    s.play(fullStep.to(8, { duration: clampDur(c, c.cue('retry').start, 0.25) }));
  });

  // Swap to Act 2 at "to recompute"
  c.swap('recompute', [act1Aura, fullView, act1Header], [act2Aura, act2Header]);
  c.on('recompute', () => {
    const t = c.cue('recompute').start;
    s.play(
      par(
        act1Vis.to(0, { duration: 0.16 }),
        delay(act2Vis.to(1, { duration: clampDur(c, t + 0.22, 0.28) }), 0.22),
        recStep.to(1, { duration: clampDur(c, t, 0.25) }),
      ),
    );
  });
  c.on('gives-up', () => {
    s.play(recStep.to(2, { duration: clampDur(c, c.cue('gives-up').start, 0.25) }));
  });
  c.on('to-wait', () => {
    s.play(recStep.to(3, { duration: clampDur(c, c.cue('to-wait').start, 0.25) }));
  });
  c.on('rebuilds', () => {
    s.play(recStep.to(4, { duration: clampDur(c, c.cue('rebuilds').start, 0.25) }));
  });
  c.on('compute', () => {
    s.play(recStep.to(5, { duration: clampDur(c, c.cue('compute').start, 0.25) }));
  });
  c.on('shared', () => {
    s.play(recStep.to(6, { duration: clampDur(c, c.cue('shared').start, 0.25) }));
  });

  // Beat 2 cues (10 swap cues)
  const swapCues = [
    ['swap', 1],
    ['move', 2],
    ['keeps-work', 3],
    ['link', 4],
    ['differ', 5],
    ['either-way', 6],
    ['pays', 7],
    ['continue', 8],
    ['call-preempt', 9],
    ['plan', 10],
  ];
  for (const [id, target] of swapCues) {
    c.on(id, () => {
      s.play(swpStep.to(target, { duration: clampDur(c, c.cue(id).start, 0.25) }));
    });
  }
}
