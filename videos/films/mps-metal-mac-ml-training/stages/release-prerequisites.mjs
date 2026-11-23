import {
  extensionCode,
  foot,
  panel,
  text,
  withMpsExtensionFrame,
  withMpsRootFrame,
} from '../defaults.mjs';
export function paintReleasePrerequisites(ctx, scene, state, api, C, c, t, s, id) {
  if (s.step === 0) {
    text(ctx, api, C, 'Match the instructions to the PyTorch release', 960, 285, 40, C.ink, 'center');
    const rows = [
      ['Apple setup page', 'PyTorch 2.11', 'Mac with Apple silicon', 'macOS ≥14', 'Python ≥3.10', 'Xcode command-line tools'],
      [
        'PyTorch 2.15 note',
        'Versioned availability example',
        'macOS ≥15',
        'Check actual wheel + hardware',
        'Record the exact combination',
      ],
    ];
    rows.forEach((r, i) => {
      const x = 180 + i * 810;
      panel(ctx, api, C, c, x, 355, 750, 485, i ? C.cyan : C.blue);
      text(ctx, api, C, r[0], x + 375, 415, 35, i ? C.cyan : C.blue, 'center');
      r.slice(1).forEach((v, j) =>
        text(ctx, api, C, v, x + 375, 494 + j * 73, j === 0 ? 33 : 30, C.ink, 'center'),
      );
    });
    text(
      ctx,
      api,
      C,
      'Two versioned instructions · choose the one for this install',
      960,
      945,
      32,
      C.yellow,
      'center',
    );
  } else if (s.step === 1) {
    const rows = [
      ['Developer tools', 'xcode-select -p'],
      ['Python version', 'python3 --version'],
      ['Interpreter architecture', 'python3 -c "import platform; print(platform.machine())"'],
      ['Operating system', 'sw_vers -productVersion'],
      ['Isolated project environment', 'python3 -m venv .venv'],
    ];
    rows.forEach(([a, b], i) => {
      const y = 314 + i * 108;
      text(ctx, api, C, a, 180, y + 33, 31, C.cyan);
      extensionCode(ctx, api, C, b, 1125, y + 33, i === 2 ? 27 : 34, C.ink);
      api.line(ctx, 200, y + 65, 1715, y + 65, C.muted, 1);
    });
    text(
      ctx,
      api,
      C,
      'Mac / Pip / Python   ·   Match the release wheel to your interpreter',
      960,
      945,
      32,
      C.yellow,
      'center',
    );
  } else {
    const rows = [
      [false, false, 'CPU · wheel lacks MPS'],
      [true, false, 'CPU · inspect runtime access'],
      [true, true, s.runtimeReady ? 'MPS placement permitted' : 'Which device can this row use?'],
    ];
    ['is_built()', 'is_available()', 'Next usable route'].forEach((v, i) =>
      extensionCode(ctx, api, C, v, [420, 840, 1370][i], 340, 34, C.cyan),
    );
    rows.forEach((r, i) => {
      const y = 455 + i * 175;
      extensionCode(ctx, api, C, String(r[0]), 420, y, 44, r[0] ? C.green : C.pink);
      extensionCode(ctx, api, C, String(r[1]), 840, y, 44, r[1] ? C.green : C.pink);
      text(
        ctx,
        api,
        C,
        r[2],
        1370,
        y,
        31,
        i === 2 ? (s.runtimeReady ? C.green : C.yellow) : C.blue,
        'center',
      );
      api.line(ctx, 240, y + 52, 1700, y + 52, C.muted, 1);
    });
    text(
      ctx,
      api,
      C,
      'Availability permits a trial · beta operator coverage is a separate check',
      960,
      970,
      29,
      C.yellow,
      'center',
    );
  }
  foot(ctx, api, C, 'Keep the PyTorch version with the failing operation');
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  withMpsExtensionFrame(ctx, scene, state, api, C, c, s, paintReleasePrerequisites);
}
export function drawReleasePrerequisitesStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'release-prerequisites',
  draw: drawReleasePrerequisitesStage,
  cues: [
    'release-prerequisites-b1',
    'release-prerequisites-b2',
    'release-prerequisites-b3',
    'mps-runtime-ready',
  ],
};
