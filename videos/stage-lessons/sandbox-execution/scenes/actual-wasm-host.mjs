// Scene 10 (actual-wasm-host): "One integer in, one integer out"
// Strict i32 host signature + 3 resource limits -> luminous i32 wraparound ring -> fuel-before-start order.
import {
  COSMOS,
  ROLE,
  addI32,
  cinemaAtmosphere,
  commas,
  crossSwap,
  glowArrow,
  glowDot,
  glowRing,
  guardedDynamic,
  heroTitle,
  lumBar,
  rule,
  tweenCue,
  txt,
  verifyInvariant,
} from '../parts.mjs';

const MAX_I32 = 2 ** 31 - 1;
const MIN_I32 = -(2 ** 31);
const signedStr = (v) => (v < 0 ? `-${commas(-v)}` : commas(v));

const ANGLE = Object.freeze({
  zero: -90,
  minusOne: -115,
  fortyOne: -50,
  fortyTwo: -26,
  max: 76,
  min: 104,
});

export default function actualWasmHost(s, c) {
  verifyInvariant(addI32(41) === 42, 'addI32(41) = 42');
  verifyInvariant(addI32(-1) === 0, 'addI32(-1) = 0');
  verifyInvariant(addI32(MAX_I32) === MIN_I32, 'MAX_I32 wraps to MIN_I32');

  const mode0 = s.value(1); // 3 resource budgets
  const mode1 = s.value(0); // i32 ring
  const mode2 = s.value(0); // fuel before instantiate order

  // Left contract states
  const sigHot = s.value(0);
  const showImports = s.value(0);
  const showMem = s.value(0);
  const show41Call = s.value(0);
  const showBoolCall = s.value(0);
  const showPyNote = s.value(0);
  const showValid = s.value(0);
  const showOracle = s.value(0);

  // Beat 0 right states
  const litFuel = s.value(0);
  const litBytes = s.value(0);
  const litText = s.value(0);
  const showSeparate = s.value(0);

  // Beat 1 ring states
  const run0Ang = s.value(ANGLE.fortyOne);
  const run0Vis = s.value(0);
  const run0Ans = s.value(0);
  const run1Ang = s.value(ANGLE.minusOne);
  const run1Vis = s.value(0);
  const run1Ans = s.value(0);
  const run2Ang = s.value(ANGLE.max);
  const run2Vis = s.value(0);
  const run2Ans = s.value(0);
  const showContract = s.value(0);

  // Beat 2 host lifecycle states
  const reordered = s.value(0);
  const startSafe = s.value(0);
  const showShared = s.value(0);
  const showWatch = s.value(0);
  const showHostCosts = s.value(0);
  const showHostLimits = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.wasm, ROLE.mark);
  const title = heroTitle(['One Integer In,', 'One Integer Out'], {
    x: -860,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.wasm,
    eyebrow: 'IMPORT-FREE WASMTIME HOST CONTRACT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = mode0.value;
    const m1 = mode1.value;
    const m2 = mode2.value;
    const nodes = [];

    // === LEFT COLUMN: Narrow Wasm guest contract + Validator oracle ===
    const lx = -860;
    const ly = -255;
    nodes.push(
      txt('WASM GUEST SIGNATURE', lx, ly, 26, ROLE.wasm, 'mono', 'left'),
      rule(lx, ly + 24, -270, ly + 24, ROLE.wasm, 2),
      lumBar(lx + 195, ly + 72, 390, 54, {
        color: sigHot.value > 0.4 ? ROLE.mark : ROLE.wasm,
        fillOpacity: 0.18,
        strokeWidth: 2.2,
        glow: 9,
      }),
      txt('run(i32) -> i32', lx + 195, ly + 72, 28, COSMOS.ink, 'mono'),
    );
    if (showValid.value > 0.02) {
      nodes.push(
        glowDot(lx + 420, ly + 72, { radius: 9, color: ROLE.pass, opacity: showValid.value }),
        txt('checked', lx + 444, ly + 72, 26, ROLE.pass, 'mono', 'left').opacity(showValid.value),
      );
    }
    if (showImports.value > 0.02) {
      nodes.push(
        txt('imports:  none (0)', lx, ly + 144, 26, COSMOS.muted, 'mono', 'left').opacity(
          showImports.value,
        ),
      );
    }
    if (showMem.value > 0.02) {
      nodes.push(
        txt('memory:   <= 1 linear page', lx, ly + 192, 26, ROLE.wasm, 'mono', 'left').opacity(
          showMem.value,
        ),
      );
    }
    if (show41Call.value > 0.02) {
      nodes.push(
        txt('run(41)   -> accepted', lx, ly + 258, 28, ROLE.pass, 'mono', 'left').opacity(
          show41Call.value,
        ),
      );
    }
    if (showBoolCall.value > 0.02) {
      nodes.push(
        txt('run(True) -> rejected', lx, ly + 308, 28, ROLE.candidate, 'mono', 'left').opacity(
          showBoolCall.value,
        ),
      );
    }
    if (showPyNote.value > 0.02) {
      nodes.push(
        txt('(Python treats True as int)', lx, ly + 356, 26, COSMOS.muted, 'sans', 'left').opacity(
          showPyNote.value,
        ),
      );
    }

    // Bottom-left validator oracle
    if (showOracle.value > 0.02) {
      const oy = 250;
      nodes.push(
        lumBar(lx + 285, oy + 56, 570, 108, {
          color: ROLE.pass,
          fillOpacity: 0.14,
          strokeWidth: 2.2,
          glow: 9,
          opacity: showOracle.value,
        }),
        txt('TRUSTED VALIDATOR ORACLE', lx + 24, oy + 30, 26, ROLE.pass, 'mono', 'left').opacity(
          showOracle.value,
        ),
        txt(
          'compares returned i32 vs expected',
          lx + 24,
          oy + 78,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(showOracle.value),
      );
    }

    // === RIGHT PANEL PHASE 0: Three distinct resource budgets ===
    const rx = -175;
    if (m0 > 0.02) {
      const ry = -255;
      nodes.push(
        txt('HOST EMBEDDING BUDGETS', rx, ry, 26, ROLE.host, 'mono', 'left').opacity(m0),
        rule(rx, ry + 24, 855, ry + 24, ROLE.host, 2).opacity(m0),
      );
      const specs = [
        ['Fuel budget', '1,000 units', 'metered guest work', litFuel.value, ROLE.mark],
        ['Linear memory', '65,536 bytes', '1 guest page (64 KiB)', litBytes.value, ROLE.wasm],
        ['Module text', '4,096 bytes', 'UTF-8 WAT compiler cap', litText.value, ROLE.host],
      ];
      specs.forEach(([lbl, val, note, lit, col], i) => {
        const y = ry + 96 + i * 124;
        nodes.push(
          lumBar(rx + 515, y, 1030, 88, {
            color: lit > 0.4 ? col : COSMOS.rule,
            fillOpacity: lit > 0.4 ? 0.15 : 0.08,
            strokeWidth: lit > 0.4 ? 2.4 : 1.6,
            glow: lit > 0.4 ? 9 : 0,
            opacity: m0,
          }),
          txt(lbl, rx + 26, y, 30, COSMOS.ink, 'sans', 'left').opacity(m0),
          txt(val, rx + 350, y, 34, lit > 0.4 ? col : ROLE.host, 'mono', 'left').opacity(m0),
        );
        if (lit > 0.02) {
          nodes.push(txt(note, rx + 680, y, 26, COSMOS.muted, 'sans', 'left').opacity(m0 * lit));
        }
      });
      if (showSeparate.value > 0.02) {
        nodes.push(
          txt(
            'Three separate resources -> three independent limits',
            rx,
            245,
            32,
            ROLE.mark,
            'sans',
            'left',
          )
            .glow(7, ROLE.mark)
            .opacity(m0 * showSeparate.value),
        );
      }
    }

    // === RIGHT PANEL PHASE 1: Signed i32 orbital wraparound ring ===
    if (m1 > 0.02) {
      const cx = 145;
      const cy = -40;
      const rad = 215;
      const onRing = (deg, r = rad) => [
        cx + r * Math.cos((deg * Math.PI) / 180),
        cy + r * Math.sin((deg * Math.PI) / 180),
      ];

      nodes.push(
        txt('SIGNED 32-BIT INTEGER RING', cx, -372, 26, ROLE.wasm, 'mono').opacity(m1),
        glowRing(cx, cy, rad, ROLE.wasm, { width: 4, glow: 10, opacity: m1 }),
        txt('i32 wrap ring', cx, cy, 30, COSMOS.muted, 'mono').opacity(m1),
      );
      Object.values(ANGLE).forEach((deg) => {
        const [px, py] = onRing(deg);
        nodes.push(glowDot(px, py, { radius: 6, color: COSMOS.muted, glow: 5, opacity: m1 }));
      });
      const lbls = [
        ['0', ANGLE.zero, 44, COSMOS.ink],
        ['-1', ANGLE.minusOne, 44, COSMOS.ink],
        ['41', ANGLE.fortyOne, 46, COSMOS.ink],
        ['42', ANGLE.fortyTwo, 46, COSMOS.ink],
      ];
      lbls.forEach(([str, deg, off, col]) => {
        const [tx, ty] = onRing(deg, rad + off);
        nodes.push(txt(str, tx, ty, 28, col, 'mono').opacity(m1));
      });
      nodes.push(
        txt(
          signedStr(MAX_I32),
          cx + 175,
          cy + rad + 54,
          26,
          run2Vis.value > 0.4 ? ROLE.mark : COSMOS.muted,
          'mono',
        ).opacity(m1),
        txt(
          signedStr(MIN_I32),
          cx - 175,
          cy + rad + 54,
          26,
          run2Ans.value > 0.4 ? ROLE.mark : COSMOS.muted,
          'mono',
        ).opacity(m1),
      );

      // Animated orbital runners
      [
        [run0Vis.value, run0Ang.value, ROLE.pass],
        [run1Vis.value, run1Ang.value, ROLE.host],
        [run2Vis.value, run2Ang.value, ROLE.mark],
      ].forEach(([vis, ang, col]) => {
        if (vis > 0.02) {
          const [px, py] = onRing(ang);
          nodes.push(glowDot(px, py, { radius: 11, color: col, glow: 14, opacity: m1 * vis }));
        }
      });

      // Right-hand readouts
      const tx = 445;
      if (run0Ans.value > 0.02) {
        nodes.push(
          txt('run(41) = 42', tx, -190, 30, ROLE.pass, 'mono', 'left').opacity(m1 * run0Ans.value),
        );
      }
      if (run1Ans.value > 0.02) {
        nodes.push(
          txt('run(-1) = 0', tx, -120, 30, ROLE.host, 'mono', 'left').opacity(m1 * run1Ans.value),
        );
      }
      if (run2Vis.value > 0.02) {
        nodes.push(
          txt('run(2,147,483,647)', tx, -42, 28, COSMOS.ink, 'mono', 'left').opacity(
            m1 * run2Vis.value,
          ),
        );
      }
      if (run2Ans.value > 0.02) {
        nodes.push(
          txt('= -2,147,483,648', tx, 14, 30, ROLE.mark, 'mono', 'left')
            .glow(8, ROLE.mark)
            .opacity(m1 * run2Ans.value),
        );
      }
      if (showContract.value > 0.02) {
        nodes.push(
          lumBar(tx + 200, 128, 400, 62, {
            color: ROLE.host,
            fillOpacity: 0.16,
            strokeWidth: 2,
            opacity: m1 * showContract.value,
          }),
          txt('task contract decides wrap', tx + 200, 128, 26, ROLE.host, 'sans').opacity(
            m1 * showContract.value,
          ),
        );
      }
    }

    // === RIGHT PANEL PHASE 2: Set fuel BEFORE instantiation ===
    if (m2 > 0.02) {
      const ry = -255;
      const reord = reordered.value;
      const safe = startSafe.value > 0.4;
      nodes.push(
        txt('HOST INITIALIZATION ORDER', rx, ry, 26, ROLE.host, 'mono', 'left').opacity(m2),
        rule(rx, ry + 24, 855, ry + 24, ROLE.host, 2).opacity(m2),
      );

      // Animated slot swap between `instantiate` (slot 0 -> 1) and `set fuel` (slot 1 -> 0)
      const slotX = [rx + 150, rx + 515, rx + 875];
      const stepY = ry + 115;
      const instX = slotX[0] + (slotX[1] - slotX[0]) * reord;
      const fuelX = slotX[1] + (slotX[0] - slotX[1]) * reord;
      const fuelArcY = stepY - Math.sin(reord * Math.PI) * 72;

      const arrowOp = m2 * Math.max(0, 1 - Math.sin(reord * Math.PI) * 4);
      nodes.push(
        ...(arrowOp > 0.02
          ? [
              glowArrow([slotX[0] + 135, stepY], [slotX[1] - 135, stepY], COSMOS.dim, {
                opacity: arrowOp,
              }),
              glowArrow([slotX[1] + 135, stepY], [slotX[2] - 135, stepY], COSMOS.dim, {
                opacity: arrowOp,
              }),
            ]
          : []),
        lumBar(instX, stepY, 250, 66, {
          color: safe ? ROLE.mark : ROLE.candidate,
          fillOpacity: 0.18,
          strokeWidth: 2.2,
          glow: 9,
          opacity: m2,
        }),
        txt('instantiate', instX, stepY, 28, COSMOS.ink, 'mono').opacity(m2),
        txt(
          'start() runs here',
          instX,
          stepY + 62,
          26,
          safe ? ROLE.pass : ROLE.candidate,
          'mono',
        ).opacity(m2),
        lumBar(fuelX, fuelArcY, 250, 66, {
          color: ROLE.host,
          fillOpacity: 0.22,
          strokeWidth: 2.4,
          glow: 10,
          opacity: m2,
        }),
        txt('set fuel', fuelX, fuelArcY, 28, ROLE.host, 'mono').opacity(m2),
        lumBar(slotX[2], stepY, 250, 66, {
          color: ROLE.wasm,
          fillOpacity: 0.18,
          strokeWidth: 2.2,
          glow: 8,
          opacity: m2,
        }),
        txt('call run', slotX[2], stepY, 28, ROLE.wasm, 'mono').opacity(m2),
      );

      if (showShared.value > 0.02) {
        nodes.push(
          txt('ONE STORE  /  1,000 FUEL UNITS SHARED', rx, 52, 30, ROLE.host, 'mono', 'left')
            .glow(6, ROLE.host)
            .opacity(m2 * showShared.value),
          txt(
            'start()  +  run(i32)  both deduct from the same budget',
            rx,
            102,
            28,
            ROLE.wasm,
            'sans',
            'left',
          ).opacity(m2 * showShared.value),
        );
      }
      if (showWatch.value > 0.02) {
        nodes.push(
          txt('EXTERNAL WATCHDOG  /  ELAPSED WALL TIME', rx, 206, 30, ROLE.mark, 'mono', 'left')
            .glow(6, ROLE.mark)
            .opacity(m2 * showWatch.value),
        );
      }
      if (showHostCosts.value > 0.02) {
        nodes.push(
          txt(
            'Covers compilation, host functions & engine overhead',
            rx,
            258,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ).opacity(m2 * showHostCosts.value),
        );
      }
      if (showHostLimits.value > 0.02) {
        nodes.push(
          txt(
            'Host also requires CPU & memory cgroup limits',
            rx,
            314,
            28,
            ROLE.host,
            'sans',
            'left',
          ).opacity(m2 * showHostLimits.value),
        );
      }
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);

  // Beat 0: Signature + budgets
  tweenCue(s, c, 'wh-signature', sigHot, 1, { duration: 0.4 });
  tweenCue(s, c, 'wh-imports', showImports, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-memory', showMem, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-strict', show41Call, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-bool', showBoolCall, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-python', showPyNote, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-fuel', litFuel, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-bytes', litBytes, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-text', litText, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-separate', showSeparate, 1, { duration: 0.35 });

  // Beat 1: i32 ring
  crossSwap(s, c, 'wh-41', mode0, mode1, { duration: 0.4 });
  c.on('wh-41', () => {
    s.play(run0Vis.to(1, { duration: 0.25 }), run0Ang.to(ANGLE.fortyTwo, { duration: 0.85 }));
  });
  tweenCue(s, c, 'wh-41', run0Ans, 1, { duration: 0.3, after: true });
  c.on('wh-minus', () => {
    s.play(run1Vis.to(1, { duration: 0.25 }), run1Ang.to(ANGLE.zero, { duration: 0.85 }));
  });
  tweenCue(s, c, 'wh-minus', run1Ans, 1, { duration: 0.3, after: true });
  tweenCue(s, c, 'wh-largest', run2Vis, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-wraps', run2Ang, ANGLE.min, { duration: 1.0 });
  tweenCue(s, c, 'wh-wraps', run2Ans, 1, { duration: 0.35, after: true });
  tweenCue(s, c, 'wh-contract', showContract, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-validates', showValid, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-oracle', showOracle, 1, { duration: 0.35 });

  // Beat 2: Set fuel before instantiation
  crossSwap(s, c, 'wh-before', mode1, mode2, { duration: 0.4 });
  tweenCue(s, c, 'wh-before', reordered, 1, { duration: 0.9, after: true });
  tweenCue(s, c, 'wh-start', startSafe, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-work', showShared, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-clock', showWatch, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-host', showHostCosts, 1, { duration: 0.35 });
  tweenCue(s, c, 'wh-supervision', showHostLimits, 1, { duration: 0.35 });
}
