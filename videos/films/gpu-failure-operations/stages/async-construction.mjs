import { classifyGpuReceipt, gpuFrame } from '../arithmetic.mjs';
import { gpuReceiptFixtures } from '../fixtures.mjs';
import { diagram } from '../incident-diagram.mjs';

const workers = [
  { receipt: gpuReceiptFixtures[0], title: 'Summarizer' },
  { receipt: gpuReceiptFixtures[6], title: 'Vision worker' },
];

function draw(ctx, scene, state, api) {
  const f = gpuFrame(state);
  const { C } = api;
  const { label, line, block } = diagram(ctx, api);
  const observed = f.completed('async-sync', 0);
  const cleared = f.completed('async-read', 1);
  const success = f.completed('async-success', 1);
  const http = f.completed('async-http', 1);
  const verdict = f.completed('async-verdict', 2);
  label('Saved CUDA result', 135, 443, 32, C.muted);
  label('Last-error record', 135, 612, 32, C.muted);
  label('HTTP probe', 135, 731, 32, C.muted);
  label('Required action', 135, 895, 32, C.muted);
  line(130, 494, 1785, 494, C.muted, 2);
  line(130, 775, 1785, 775, C.muted, 2);

  for (const [i, worker] of workers.entries()) {
    const x = 800 + i * 655;
    const fatal = classifyGpuReceipt(worker.receipt).mustRelaunch;
    label(worker.title, x, 278, 43, C.ink, 'center');
    label(worker.receipt.receipt_id, x, 337, 29, C.muted, 'center');
    api.focus.target('async-captured', () => {
      block(x - 280, 372, 560, 93, C.panel, C.blue);
      const event = i === 0 || observed ? worker.receipt.cuda_error : 'kernel submitted';
      api.text(ctx, event, x, 431, 36, C.blue, 'center', 'mono');
    });
    api.focus.target('async-record', () => {
      const record = success ? 'second read   cudaSuccess' : cleared ? 'first read   record cleared' :
        (i === 0 || observed) ? 'error available' : 'awaiting observation';
      label(record, x, 612, 35, success ? C.green : C.yellow, 'center');
      label(http ? '200 OK' : 'pending', x, 731, 36, http ? C.green : C.muted, 'center');
    });
    api.focus.target('async-action', () => {
      const decision = fatal ? 'Terminate and relaunch' : 'Restart is discretionary';
      label(verdict ? decision : 'Relaunch required?', x, 895, 38, verdict && fatal ? C.pink : C.ink, 'center');
    });
  }
  label(verdict ? 'Both workers stay out of traffic until their admission checks pass.' :
    'Same host thread and CUDA runtime instance for each pair of reads', 960, 1000, 31, C.muted, 'center');
}
export default { id: 'async-construction', draw, cues: ['async-sync', 'async-read', 'async-success', 'async-http', 'async-verdict'] };
