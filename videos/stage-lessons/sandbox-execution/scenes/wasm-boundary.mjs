// Scene 09 (wasm-boundary): "How much work can the guest do?"
// Orbiting 3D Wasm guest core + 132-cell deterministic fuel lattice + page growth refusal + host limits.
import {
  COSMOS,
  ROLE,
  buildWasmCore3d,
  cinemaAtmosphere,
  glowDot,
  guardedDynamic,
  heroTitle,
  line,
  linear,
  lumBar,
  orbitScene,
  rule,
  runAmbientPhase,
  tweenCue,
  txt,
  verifyInvariant,
  wasmFixture,
} from '../parts.mjs';

const COLS = 20;

export default function wasmBoundary(s, c) {
  const guest = wasmFixture();
  verifyInvariant(guest.trapBeforeStep === guest.fuelLimit + 1, 'trap before step 101');
  verifyInvariant(guest.remainingSteps === 32, '32 steps remain unexecuted');
  verifyInvariant(guest.memoryGrowth === -1, 'memory.grow returns -1');

  const phase = s.value(0);
  const burned = s.value(0);
  const burnFrac = s.value(0);

  const exportHot = s.value(0);
  const shapeOk = s.value(0);
  const showImports = s.value(0);
  const showTrap = s.value(0);
  const showGrowReq = s.value(0);
  const showGrowFail = s.value(0);
  const fuelHot = s.value(0);
  const showOutside = s.value(0);
  const showSeparate = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.wasm, ROLE.host);
  const { view: wasm3d } = buildWasmCore3d(phase, burnFrac, {
    x: -565,
    y: 120,
    theta: -0.68,
    phi: 1.08,
    distance: 15.6,
    unit: 92,
  });

  const title = heroTitle(['How Much Work', 'Can the Guest Do?'], {
    x: -860,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.wasm,
    eyebrow: 'WEBASSEMBLY CAPABILITY & FUEL MODEL',
  });

  const live = guardedDynamic(s.value(1), () => {
    const bVal = burned.value;
    const remFuel = Math.max(0, Math.round(guest.fuelLimit - bVal));
    const nodes = [];

    // Left-upper: Guest export & import doors
    const lx = -860;
    const ly = -248;
    nodes.push(
      txt('WASM MODULE INTERFACE', lx, ly, 26, ROLE.wasm, 'mono', 'left'),
      rule(lx, ly + 24, -185, ly + 24, ROLE.wasm, 2),
      lumBar(lx + 145, ly + 66, 290, 48, {
        color: exportHot.value > 0.4 ? ROLE.mark : ROLE.wasm,
        fillOpacity: 0.18,
        strokeWidth: 2.2,
        glow: 9,
      }),
      txt('export: run', lx + 145, ly + 66, 26, COSMOS.ink, 'mono'),
    );
    if (shapeOk.value > 0.02) {
      nodes.push(
        txt('shape verified', lx + 315, ly + 66, 26, ROLE.pass, 'mono', 'left').opacity(
          shapeOk.value,
        ),
      );
    }
    if (showImports.value > 0.02) {
      const iOp = showImports.value;
      nodes.push(
        glowDot(lx + 12, ly + 130, { radius: 7, color: ROLE.host, opacity: iOp }),
        txt(
          'import: write_result   (linked)',
          lx + 36,
          ly + 130,
          26,
          ROLE.host,
          'mono',
          'left',
        ).opacity(iOp),
        glowDot(lx + 12, ly + 178, { radius: 7, color: COSMOS.dim, opacity: iOp }),
        txt(
          'import: read_secret   (absent)',
          lx + 36,
          ly + 178,
          26,
          COSMOS.dim,
          'mono',
          'left',
        ).opacity(iOp),
      );
    }

    // Left-bottom: Linear memory 1-page cap
    const my = 315;
    nodes.push(
      txt('LINEAR MEMORY CAP', lx, my - 34, 26, ROLE.wasm, 'mono', 'left'),
      lumBar(lx + 145, my + 24, 290, 56, {
        color: ROLE.wasm,
        fillOpacity: 0.24,
        strokeWidth: 2.2,
        glow: 8,
      }),
      txt('page 1 (64 KiB)', lx + 145, my + 24, 26, COSMOS.ink, 'mono'),
    );
    if (showGrowReq.value > 0.02) {
      nodes.push(
        lumBar(lx + 428, my + 24, 224, 56, {
          color: showGrowFail.value > 0.4 ? ROLE.candidate : COSMOS.dim,
          fillOpacity: 0.1,
          strokeWidth: 2,
          dash: [8, 6],
          glow: 4,
          opacity: showGrowReq.value,
        }),
        txt('page 2?', lx + 428, my + 24, 26, COSMOS.muted, 'mono').opacity(showGrowReq.value),
      );
    }
    if (showGrowFail.value > 0.02) {
      nodes.push(
        txt(`memory.grow(1) = ${guest.memoryGrowth}`, lx, my + 90, 28, ROLE.mark, 'mono', 'left')
          .glow(7, ROLE.mark)
          .opacity(showGrowFail.value),
      );
    }

    // Right: 132-cell Fuel Lattice (100 fuel cells + 32 hollow steps)
    const rx = -95;
    const ry = -370;
    nodes.push(
      txt('FUEL LEFT:', rx, ry, 28, fuelHot.value > 0.4 ? ROLE.mark : ROLE.host, 'mono', 'left'),
      txt(
        String(remFuel),
        rx + 210,
        ry,
        44,
        remFuel === 0 ? ROLE.candidate : ROLE.host,
        'mono',
        'left',
      ).glow(10, remFuel === 0 ? ROLE.candidate : ROLE.host),
      txt(
        `${guest.workloadSteps} steps needed  (1 unit / step model)`,
        rx + 325,
        ry,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    );

    const cellSize = 40;
    const gap = 8;
    const pitch = cellSize + gap;
    const gridLeft = rx;
    const gridTop = -290;

    for (let idx = 0; idx < guest.workloadSteps; idx++) {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const cx = gridLeft + col * pitch + cellSize * 0.5;
      const cy = gridTop + row * pitch + cellSize * 0.5;
      const isFuel = idx < guest.fuelLimit;
      const isBurned = isFuel && idx < bVal;

      nodes.push(
        lumBar(cx, cy, cellSize, cellSize, {
          color: isBurned ? ROLE.candidate : isFuel ? ROLE.host : COSMOS.dim,
          fillOpacity: isBurned ? 0.72 : isFuel ? 0.2 : 0,
          strokeWidth: isFuel ? 2 : 1.5,
          glow: isBurned ? 7 : isFuel ? 4 : 0,
          radius: 5,
          dash: isFuel ? undefined : [5, 4],
        }),
      );
    }

    // Crimson trap laser before step 101 (row 5, col 0)
    if (showTrap.value > 0.02) {
      const trapX = gridLeft - 6;
      const trapY = gridTop + 5 * pitch;
      nodes.push(
        line([trapX, trapY - 6], [trapX, trapY + cellSize + 6], {
          stroke: ROLE.candidate,
          width: 7,
        })
          .glow(12, ROLE.candidate)
          .opacity(showTrap.value),
        txt(
          `TRAP before step ${guest.trapBeforeStep}  /  ${guest.remainingSteps} steps never run`,
          rx,
          96,
          30,
          ROLE.candidate,
          'mono',
          'left',
        )
          .glow(8, ROLE.candidate)
          .opacity(showTrap.value),
      );
    }

    // Outside-fuel host costs
    if (showOutside.value > 0.02) {
      const oy = 186;
      const oOp = showOutside.value;
      nodes.push(
        txt('HOST RESOURCES OUTSIDE FUEL METERING', rx, oy, 26, ROLE.host, 'mono', 'left').opacity(
          oOp,
        ),
        rule(rx, oy + 24, 855, oy + 24, ROLE.host, 2).opacity(oOp),
      );
      const hostItems = ['Compilation', 'Host functions', 'Engine allocations'];
      hostItems.forEach((lbl, i) => {
        const bx = rx + 145 + i * 315;
        nodes.push(
          lumBar(bx, oy + 80, 290, 56, {
            color: ROLE.host,
            fillOpacity: 0.16,
            strokeWidth: 2,
            glow: 7,
            opacity: oOp,
          }),
          txt(lbl, bx, oy + 80, 26, ROLE.host, 'sans').opacity(oOp),
        );
      });
    }
    if (showSeparate.value > 0.02) {
      nodes.push(
        txt(
          'Give the host separate CPU, memory, and wall-clock limits',
          rx,
          348,
          28,
          ROLE.mark,
          'sans',
          'left',
        )
          .glow(6, ROLE.mark)
          .opacity(showSeparate.value),
      );
    }

    return nodes;
  });

  s.add(bgAtmo, wasm3d, title, live);
  runAmbientPhase(s, c, phase, 2.4);
  orbitScene(s, c, wasm3d, { theta: 0.45, phi: 1.0 });

  tweenCue(s, c, 'wb-interface', exportHot, 1, { duration: 0.4 });
  tweenCue(s, c, 'wb-shape', shapeOk, 1, { duration: 0.35 });
  tweenCue(s, c, 'wb-imports', showImports, 1, { duration: 0.4 });

  c.on('wb-consume', () => {
    s.play(
      burned.to(guest.fuelLimit, { duration: 2.1, ease: linear }),
      burnFrac.to(1, { duration: 2.1, ease: linear }),
    );
  });
  tweenCue(s, c, 'wb-trap', showTrap, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'wb-grow', showGrowReq, 1, { duration: 0.35 });
  tweenCue(s, c, 'wb-fail', showGrowFail, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'wb-bounds', fuelHot, 1, { duration: 0.35 });
  tweenCue(s, c, 'wb-outside', showOutside, 1, { duration: 0.4 });
  tweenCue(s, c, 'wb-separate', showSeparate, 1, { duration: 0.4 });
}
