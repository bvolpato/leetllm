// Scene 11 (wasm-failure-matrix): "At the last byte of a page"
// 8x4 luminous Wasm failure classification matrix + sliding 4-byte page-boundary window
// + symlink-resolving host reader + 3x deterministic fuel runs.
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  crossSwap,
  glowDot,
  guardedDynamic,
  heroTitle,
  lumBar,
  memoryAccess,
  renderGauge,
  rule,
  runtimeAccess,
  seq,
  tweenCue,
  txt,
  verifyInvariant,
  wasmFixture,
} from '../parts.mjs';

const RESULTS = ['trap', 'ret -1', 'init fail', 'reject'];
const PROBES = [
  { name: 'infinite loop', col: 0, cue: 'fm-loop', lands: 'fm-trap' },
  { name: 'loop in start()', col: 0, cue: 'fm-start', lands: 'fm-start-trap' },
  { name: 'memory.grow cap', col: 1, cue: 'fm-page', lands: 'fm-grow' },
  { name: '4-byte load OOB', col: 0, cue: 'fm-load', lands: 'fm-beyond' },
  { name: 'initial mem > cap', col: 2, cue: 'fm-initial', lands: 'fm-initial-fails' },
  { name: 'declared import', col: 3, cue: 'fm-import', lands: 'fm-import' },
  { name: 'missing run export', col: 3, cue: 'fm-export', lands: 'fm-export' },
  { name: 'wrong fn signature', col: 3, cue: 'fm-type', lands: 'fm-type' },
];

const PAGE_BYTES = 65536;
const LOAD_BYTES = 4;
const LAST_GOOD = PAGE_BYTES - LOAD_BYTES; // 65532
const INSIDE_CELLS = 8;
const BEYOND_CELLS = 4;

export default function wasmFailureMatrix(s, c) {
  const guest = wasmFixture();
  verifyInvariant(memoryAccess(LAST_GOOD) === 'read permitted', '65532 fits 64 KiB page');
  verifyInvariant(memoryAccess(LAST_GOOD + 2) === 'MEMORY_OUT_OF_BOUNDS', '65534 traps OOB');
  verifyInvariant(guest.memoryGrowth === -1, 'memory.grow returns -1');
  verifyInvariant(runtimeAccess('wasm', '/work/report.xml').allowed === true, 'report allowed');
  verifyInvariant(runtimeAccess('wasm', '/work/notes.txt').allowed === false, 'notes denied');

  const rowLit = PROBES.map(() => s.value(0));
  const rowMark = PROBES.map(() => s.value(0));
  const rowPulse = PROBES.map(() => s.value(0));
  const showNoTrap = s.value(0);

  // Right detail panel modes (0 = fuel + page + 4-byte window, 1 = host file reader, 2 = 3 deterministic runs)
  const mode0 = s.value(1);
  const mode1 = s.value(0);
  const mode2 = s.value(0);

  // Mode 0 states
  const fuelLvl = s.value(0);
  const showPage2 = s.value(0);
  const showGrowVal = s.value(0);
  const showLoadWin = s.value(0);
  const slideOffset = s.value(0); // 0 -> 2 bytes
  const ansFits = s.value(0);
  const ansPredict = s.value(0);
  const ansOob = s.value(0);

  // Mode 1 states
  const showGrant = s.value(0);
  const showResolved = s.value(0);
  const showDenied = s.value(0);

  // Mode 2 states
  const runLvls = [s.value(0), s.value(0), s.value(0)];
  const showSources = s.value(0);
  const showReal = s.value(0);

  const bgAtmo = cinemaAtmosphere(ROLE.wasm, ROLE.candidate);
  const title = heroTitle(['At the Last Byte', 'of a Page'], {
    x: -860,
    y: -445,
    size: 48,
    lineHeight: 56,
    accent: ROLE.wasm,
    eyebrow: 'WEBASSEMBLY BOUNDARY FAILURE MATRIX',
  });

  const live = guardedDynamic(s.value(1), () => {
    const m0 = mode0.value;
    const m1 = mode1.value;
    const m2 = mode2.value;
    const nodes = [];

    // === LEFT: 8x4 Luminous Failure Matrix ===
    const mx = -860;
    const my = -248;
    const colXs = [-430, -305, -175, -45];
    RESULTS.forEach((h, ci) => {
      nodes.push(txt(h, colXs[ci], my, 26, COSMOS.muted, 'mono'));
    });
    nodes.push(rule(mx, my + 24, 15, my + 24, ROLE.rule, 2));

    PROBES.forEach((probe, ri) => {
      const y = my + 66 + ri * 72;
      const lit = rowLit[ri].value;
      const mk = rowMark[ri].value;
      const pls = rowPulse[ri].value;
      const dotCol = probe.col === 0 || probe.col === 2 ? ROLE.candidate : ROLE.host;
      nodes.push(
        rule(mx, y + 36, 15, y + 36, COSMOS.rule, 1.2).opacity(0.45),
        txt(probe.name, mx, y, 26, lit > 0.4 ? COSMOS.ink : COSMOS.dim, 'sans', 'left'),
      );
      if (mk > 0.02) {
        nodes.push(
          glowDot(colXs[probe.col], y, {
            radius: 10 + pls * 3,
            color: pls > 0.4 ? ROLE.mark : dotCol,
            glow: pls > 0.4 ? 15 : 10,
            opacity: mk,
          }),
        );
      }
    });
    if (showNoTrap.value > 0.02) {
      nodes.push(
        txt('x', colXs[0], my + 66 + 2 * 72, 26, COSMOS.dim, 'mono').opacity(showNoTrap.value),
      );
    }

    // === RIGHT PANEL: Mode 0 (Fuel + 64 KiB Page + 4-byte sliding load window) ===
    const rx = 85;
    if (m0 > 0.02) {
      const fy = -245;
      nodes.push(txt('FUEL', rx, fy, 26, ROLE.host, 'mono', 'left').opacity(m0));
      const fg = renderGauge(rx + 105, fy, 660, 32, fuelLvl.value, {
        cap: 0.72,
        color: ROLE.candidate,
        opacity: m0,
      });
      nodes.push(...fg.nodes);

      // Linear memory pages
      const py = -125;
      nodes.push(
        txt('LINEAR MEMORY  (1 PAGE CAP)', rx, py - 42, 26, ROLE.wasm, 'mono', 'left').opacity(m0),
        lumBar(rx + 145, py + 12, 290, 62, {
          color: ROLE.wasm,
          fillOpacity: 0.2,
          strokeWidth: 2.2,
          glow: 8,
          opacity: m0,
        }),
        txt('1 page  /  64 KiB', rx + 145, py + 12, 26, COSMOS.ink, 'mono').opacity(m0),
      );
      if (showPage2.value > 0.02) {
        nodes.push(
          lumBar(rx + 465, py + 12, 260, 62, {
            color: COSMOS.dim,
            fillOpacity: 0.08,
            strokeWidth: 2,
            dash: [8, 6],
            opacity: m0 * showPage2.value,
          }),
          txt('page 2 denied', rx + 465, py + 12, 26, COSMOS.muted, 'mono').opacity(
            m0 * showPage2.value,
          ),
        );
      }
      if (showGrowVal.value > 0.02) {
        nodes.push(
          txt(
            `memory.grow(1) = ${guest.memoryGrowth}  (no trap)`,
            rx,
            py + 76,
            26,
            ROLE.host,
            'mono',
            'left',
          ).opacity(m0 * showGrowVal.value),
        );
      }

      // 12-byte strip at the end of the 64 KiB page (8 inside + 4 beyond)
      const by = 132;
      const cellW = 58;
      const cellH = 68;
      const totalCols = INSIDE_CELLS + BEYOND_CELLS;
      const stripLeft = rx;

      nodes.push(
        txt(
          `END OF PAGE  (last valid byte: ${PAGE_BYTES - 1})`,
          rx,
          by - 78,
          26,
          ROLE.wasm,
          'mono',
          'left',
        ).opacity(m0),
      );
      for (let i = 0; i < totalCols; i++) {
        const cx = stripLeft + i * (cellW + 6) + cellW * 0.5;
        const inside = i < INSIDE_CELLS;
        nodes.push(
          lumBar(cx, by, cellW, cellH, {
            color: inside ? ROLE.wasm : COSMOS.dim,
            fillOpacity: inside ? 0.2 : 0.06,
            strokeWidth: 2,
            glow: inside ? 5 : 0,
            dash: inside ? undefined : [6, 5],
            opacity: m0,
          }),
        );
      }
      // Page boundary line between index 7 and 8
      const boundX = stripLeft + INSIDE_CELLS * (cellW + 6) - 3;
      nodes.push(
        rule(boundX, by - 48, boundX, by + 48, ROLE.candidate, 4)
          .glow(9, ROLE.candidate)
          .opacity(m0),
      );

      // Sliding gold 4-byte i32.load window
      if (showLoadWin.value > 0.02) {
        const startIdx = INSIDE_CELLS - LOAD_BYTES + slideOffset.value;
        const wLeft = stripLeft + startIdx * (cellW + 6) - 4;
        const wWidth = LOAD_BYTES * (cellW + 6) + 2;
        const addrStart = LAST_GOOD + Math.round(slideOffset.value);
        const addrEnd = addrStart + LOAD_BYTES - 1;
        nodes.push(
          lumBar(wLeft + wWidth * 0.5, by, wWidth, cellH + 18, {
            color: ROLE.mark,
            fillOpacity: 0.14,
            strokeWidth: 3.4,
            glow: 12,
            opacity: m0 * showLoadWin.value,
          }),
          txt(
            `i32.load:  bytes ${addrStart} .. ${addrEnd}`,
            rx,
            by + 74,
            28,
            ROLE.mark,
            'mono',
            'left',
          ).opacity(m0 * showLoadWin.value),
        );
      }

      // Non-overlapping result line below byte strip
      const ay = 310;
      if (ansFits.value > 0.02) {
        nodes.push(
          txt('read permitted  (fits inside page)', rx, ay, 30, ROLE.pass, 'mono', 'left')
            .glow(7, ROLE.pass)
            .opacity(m0 * ansFits.value),
        );
      }
      if (ansPredict.value > 0.02) {
        nodes.push(
          txt('Does this 4-byte read still fit?', rx, ay, 36, ROLE.mark, 'serif', 'left')
            .glow(8, ROLE.mark)
            .opacity(m0 * ansPredict.value),
        );
      }
      if (ansOob.value > 0.02) {
        nodes.push(
          lumBar(rx + 360, ay, 720, 68, {
            color: ROLE.candidate,
            fillOpacity: 0.18,
            strokeWidth: 2.5,
            glow: 10,
            opacity: m0 * ansOob.value,
          }),
          txt('TRAP: MEMORY_OUT_OF_BOUNDS', rx + 360, ay, 30, ROLE.candidate, 'mono').opacity(
            m0 * ansOob.value,
          ),
        );
      }
    }

    // === RIGHT PANEL: Mode 1 (Scoped Host File Reader symlink resolution) ===
    if (m1 > 0.02) {
      const ry = -215;
      nodes.push(
        txt('SCOPED HOST FILE READER', rx, ry, 34, ROLE.host, 'sans', 'left')
          .glow(7, ROLE.host)
          .opacity(m1),
        rule(rx, ry + 34, 855, ry + 34, ROLE.host, 2.5).opacity(m1),
      );
      if (showGrant.value > 0.02) {
        nodes.push(
          txt('Granted file:', rx, ry + 96, 26, COSMOS.muted, 'mono', 'left').opacity(
            m1 * showGrant.value,
          ),
          txt('/work/report.xml', rx, ry + 144, 34, ROLE.evidence, 'mono', 'left').opacity(
            m1 * showGrant.value,
          ),
        );
      }
      if (showResolved.value > 0.02) {
        nodes.push(
          txt(
            'Resolved request (after links):',
            rx,
            ry + 236,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(m1 * showResolved.value),
          txt('/work/notes.txt', rx, ry + 284, 34, ROLE.candidate, 'mono', 'left').opacity(
            m1 * showResolved.value,
          ),
        );
      }
      if (showDenied.value > 0.02) {
        nodes.push(
          lumBar(rx + 360, ry + 392, 720, 74, {
            color: ROLE.candidate,
            fillOpacity: 0.18,
            strokeWidth: 2.5,
            glow: 10,
            opacity: m1 * showDenied.value,
          }),
          txt(
            'READ DENIED  /  0 bytes returned',
            rx + 360,
            ry + 392,
            32,
            ROLE.candidate,
            'mono',
          ).opacity(m1 * showDenied.value),
        );
      }
    }

    // === RIGHT PANEL: Mode 2 (3 deterministic runs + nondeterminism sources) ===
    if (m2 > 0.02) {
      const ry = -225;
      nodes.push(
        txt(
          'DETERMINISTIC FUEL EXHAUSTION (3 RUNS)',
          rx,
          ry,
          26,
          ROLE.host,
          'mono',
          'left',
        ).opacity(m2),
        rule(rx, ry + 24, 855, ry + 24, ROLE.host, 2).opacity(m2),
      );
      runLvls.forEach((lv, i) => {
        const y = ry + 84 + i * 74;
        nodes.push(txt(`run ${i + 1}`, rx, y, 28, COSMOS.ink, 'mono', 'left').opacity(m2));
        const rg = renderGauge(rx + 120, y, 640, 34, lv.value, {
          cap: 0.72,
          color: ROLE.candidate,
          opacity: m2,
        });
        nodes.push(...rg.nodes);
      });

      if (showSources.value > 0.02) {
        const sy = 100;
        nodes.push(
          txt('SOURCES OF RUNTIME VARIANCE', rx, sy, 26, ROLE.mark, 'mono', 'left').opacity(
            m2 * showSources.value,
          ),
          txt('host imports  ·  memory growth', rx, sy + 50, 28, ROLE.mark, 'mono', 'left').opacity(
            m2 * showSources.value,
          ),
          txt('NaN payloads  ·  relaxed SIMD', rx, sy + 98, 28, ROLE.mark, 'mono', 'left').opacity(
            m2 * showSources.value,
          ),
        );
      }
      if (showReal.value > 0.02) {
        nodes.push(
          txt(
            'Record observed probe outcomes on your exact runtime',
            rx,
            298,
            28,
            ROLE.pass,
            'sans',
            'left',
          )
            .glow(6, ROLE.pass)
            .opacity(m2 * showReal.value),
        );
      }
    }

    return nodes;
  });

  s.add(bgAtmo, title, live);

  // Wire all 8 matrix rows
  PROBES.forEach((probe, i) => {
    tweenCue(s, c, probe.cue, rowLit[i], 1, { duration: 0.25 });
    tweenCue(s, c, probe.lands, rowMark[i], 1, { duration: 0.3, after: true });
  });
  tweenCue(s, c, 'fm-notrap', showNoTrap, 1, { duration: 0.3 });

  // Beat 0 & 1: Fuel, memory.grow, 4-byte sliding load
  tweenCue(s, c, 'fm-loop', fuelLvl, 0.72, { duration: 1.2 });
  c.on('fm-start', () => {
    s.play(seq(fuelLvl.to(0, { duration: 0.3 }), fuelLvl.to(0.72, { duration: 1.0 })));
  });
  tweenCue(s, c, 'fm-grow', showPage2, 1, { duration: 0.3 });
  tweenCue(s, c, 'fm-grow', showGrowVal, 1, { duration: 0.3, after: true });

  tweenCue(s, c, 'fm-load', showLoadWin, 1, { duration: 0.35 });
  tweenCue(s, c, 'fm-inside', ansFits, 1, { duration: 0.3, after: true });
  c.on('fm-slide', () => {
    s.play(ansFits.to(0, { duration: 0.2 }), slideOffset.to(2, { duration: 0.8 }));
  });
  tweenCue(s, c, 'fm-predict', ansPredict, 1, { duration: 0.35 });
  crossSwap(s, c, 'fm-beyond', ansPredict, ansOob, { duration: 0.4, after: true });

  // Beat 3: Host file reader
  crossSwap(s, c, 'fm-reader', mode0, mode1, { duration: 0.4 });
  tweenCue(s, c, 'fm-grant', showGrant, 1, { duration: 0.35 });
  tweenCue(s, c, 'fm-resolved', showResolved, 1, { duration: 0.35 });
  tweenCue(s, c, 'fm-denied', showDenied, 1, { duration: 0.35, after: true });

  // Beat 4: 3 deterministic runs + variance sources
  crossSwap(s, c, 'fm-repeat', mode1, mode2, { duration: 0.4 });
  c.on('fm-repeat', () => {
    s.play(
      seq(
        runLvls[0].to(0.72, { duration: 0.55 }),
        runLvls[1].to(0.72, { duration: 0.55 }),
        runLvls[2].to(0.72, { duration: 0.55 }),
      ),
      rowPulse[0].to(1, { duration: 0.4 }),
    );
  });
  tweenCue(s, c, 'fm-sources', showSources, 1, { duration: 0.4 });
  tweenCue(s, c, 'fm-real', showReal, 1, { duration: 0.35 });
  tweenCue(s, c, 'fm-grow-result', rowPulse[2], 1, { duration: 0.4 });
  tweenCue(s, c, 'fm-load-result', rowPulse[3], 1, { duration: 0.4 });
}
