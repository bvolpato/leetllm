import { gpuFrame } from '../arithmetic.mjs';
import { gpuReceiptFixtures } from '../fixtures.mjs';
import { diagram } from '../incident-diagram.mjs';

function draw(ctx, scene, state, api) {
  const f = gpuFrame(state), { C } = api;
  const { label, block, line, dot } = diagram(ctx, api);
  const paired = f.started('canary-pair', 2);
  const replay = f.progress('canary-cycle', 2);
  const cols = [560, 940, 1320], ys = [492, 706], w = 245;
  label('Isolated replay   /   ' + gpuReceiptFixtures[0].oom_request_gib.toFixed(2) + ' GiB workspace', 150, 268, 39);
  for (const [i, column] of ['Allocate', 'Exchange', 'Release'].entries())
    label(column, cols[i] + w / 2, 378, 35, C.muted, 'center');
  api.focus.target('canary-lanes', () => {
    for (const [i, name] of ['Worker', 'Peer'].entries()) {
      const y = ys[i];
      label(name, 160, y + 13, 43);
      line(400, y, 1670, y, C.muted, 3);
      if (i === 0 || paired) {
        for (let j = 0; j < 3; j++) {
          const active = paired && replay >= j / 3;
          if (!paired && j !== 0) continue;
          block(cols[j], y - 33, w, 66, active ? (i === 0 ? C.blue : C.cyan) : C.panel, i === 0 ? C.blue : C.cyan);
          if (!paired && i === 0) label('short probe', cols[j] + w / 2, y + 10, 28, C.blue, 'center');
        }
      } else {
        label('idle', 1052, y - 42, 32, C.muted, 'center');
      }
    }
    if (paired && replay >= 1 / 3) {
      line(1060, 531, 1060, 668, C.yellow, 4);
      dot(1060, 541 + 118 * Math.min(1, (replay - 1 / 3) * 3), 10, C.yellow);
    }
  });
  const status = paired ? 'Repeat the allocation and exchange on the affected pair' : 'HTTP probe on the worker   /   no traffic across the peer path';
  label(status, 960, 890, 37, paired ? C.cyan : C.ink, 'center');
  label('Declare the cycle count, limits and abort conditions before the run.', 960, 988, 31, C.muted, 'center');
}
export default { id: 'canary-construction', draw, cues: ['canary-pair', 'canary-cycle'] };
