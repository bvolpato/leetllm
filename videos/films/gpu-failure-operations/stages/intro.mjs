import { gpuFrame, memoryReceipt } from '../arithmetic.mjs';
import { gpuReceiptFixtures } from '../fixtures.mjs';
import { diagram, drawAdmissionRoute } from '../incident-diagram.mjs';

function draw(ctx, scene, state, api) {
  const f = gpuFrame(state);
  const { C } = api;
  const { label, line, block } = diagram(ctx, api);
  const receipt = gpuReceiptFixtures[0];
  const { free } = memoryReceipt(receipt);
  const request = receipt.oom_request_gib;
  api.focus.target('intro-receipt', () => {
    block(145, 202, 1630, 245, C.panel);
    block(145, 202, 12, 245, C.pink);
    label('summarizer   /   ' + receipt.receipt_id, 197, 264, 39);
    label('Out of memory', 191, 357, 83, C.pink);
    label('14:03:17 UTC   /   ' + receipt.node, 197, 415, 30, C.muted);
    const x = 945, width = 740;
    label('Failed allocation', x, 261, 33);
    label(request.toFixed(2) + ' GiB', x + width, 261, 38, C.pink, 'right');
    block(x, 280, width, 35, C.pink);
    label('Free on device', x, 364, 33);
    label(free.toFixed(2) + ' GiB', x + width, 364, 38, C.yellow, 'right');
    block(x, 383, width * free / request, 35, C.yellow);
    line(x + width, 377, x + width, 424, C.muted, 2);
  });
  const held = f.completed('intro-close', 1);
  api.focus.target('intro-router', () => drawAdmissionRoute(ctx, api, {
    gate: held ? 'closed' : 'undecided',
    worker: 'summarizer',
    peer: 'peer · serving',
    path: 'peer',
    progress: (f.progress('intro-arrive', 0) + 2 * f.progress('intro-route', 1)) / 3,
    gateLabel: held ? 'Admission closed' : '',
    token: 'Next arrival',
  }));
  const footer = held
    ? receipt.receipt_id + ' stays with the summarizer'
    : 'Example incident   ·   New Xids: ' + receipt.new_xids.length + '   ·   New uncorrectable ECC: ' + receipt.new_uncorrectable_ecc;
  label(footer, 960, 984, 31, C.muted, 'center');
}
export default { id: 'intro', draw, cues: ['intro-allocation', 'intro-peers', 'intro-arrive', 'intro-close', 'intro-route'] };
