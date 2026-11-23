import { vectorLane } from '../arithmetic.mjs';
import { artifactLines } from '../fixtures.mjs';
import { text } from '../defaults.mjs';

export function drawArtifacts(ctx, scene, state, api) {
  const { C, focus } = api;
  const lane = vectorLane(1);
  const native = focus.visible('native-open');
  const cues = ['load-x', 'load-y', 'virtual-add', 'virtual-store'];
  const nativeCues = ['native-load', 'native-load', 'native-add', 'native-store'];
  const values = [
    'x[1]  →  ' + lane.x,
    'y[1]  →  ' + lane.y,
    'sum  =  ' + lane.sum,
    'out[1]  ←  ' + lane.sum,
  ];
  const disassembly = ['LDG.E R4, [...]', 'LDG.E R7, [...]', 'FADD R9, R4, R7', 'STG.E [...], R9'];
  const colors = [C.blue, C.pink, C.cyan, C.green];
  focus.target('operations', () => {
    text(ctx, api, 'CUDA source', 120, 285, 36, C.ink);
    text(ctx, api, 'PTX sketch', 624, 285, 36, C.ink);
    api.text(
      ctx,
      native ? 'Native sm_120' : 'At index 1',
      1320,
      285,
      36,
      C.ink,
      'left',
      native ? 'mono' : 'sans',
    );
    api.line(ctx, 120, 318, 1800, 318, C.muted, 2);
    for (let i = 0; i < 4; i++) {
      const y = 417 + i * 125;
      const visible = native || focus.visible(cues[i]);
      if (!visible) continue;
      text(ctx, api, artifactLines.source[i], 120, y, 31, colors[i]);
      text(ctx, api, artifactLines.ptx[i], 624, y, 29, colors[i]);
      if (!native || focus.visible(nativeCues[i])) {
        text(ctx, api, native ? disassembly[i] : values[i], 1320, y, 33, colors[i]);
      }
    }
  });
  const note = native
    ? 'Captured cubin disassembly  ·  address operands shortened'
    : 'Virtual register names carry values from one instruction to the next.';
  text(ctx, api, note, 120, 969, 30, C.muted);
}

export default {
  id: 'artifacts',
  draw: drawArtifacts,
  cues: [
    'load-x',
    'load-y',
    'virtual-add',
    'virtual-store',
    'virtual-values',
    'native-open',
    'native-load',
    'native-add',
    'native-store',
  ],
};
