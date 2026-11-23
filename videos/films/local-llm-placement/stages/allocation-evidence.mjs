import { cueProgress } from '../worksheet.mjs';
import { constructionCell, constructionNote } from '../defaults.mjs';

function drawAllocationEvidence(ctx, scene, state, api) {
  const { C } = api;
  const p = cueProgress(scene, state, api);
  const text = (value, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, value, x, y, size, color, align);
  api.focus.target('pl-allocation-evidence-trace', () => {
    if (state.beat === 0) {
      const paths = [
        ['Ordinary cudaMalloc', 'Device allocation', 'Can fail when device memory is exhausted'],
        [
          'Explicit CPU execution',
          'Host-resident weights',
          'CPU operators and an activation transfer',
        ],
        ['Managed path', 'Supported managed allocation', 'Page-movement trace'],
      ];
      for (const [i, [name, storage, evidence]] of paths.entries()) {
        const y = 380 + i * 165;
        constructionCell(ctx, api, name, 150, y, 480, 88, i === 1 ? C.yellow : C.blue);
        text(storage, 750, y + 30, 36, C.cyan);
        if (p('pl-allocation-evidence-0-' + i) === 1) text(evidence, 750, y + 87, 31);
      }
      if (p('pl-allocation-evidence-0-2') > 0)
        constructionNote(ctx, api, 'Unified virtual addressing identifies pointer ranges.');
      return;
    }

    if (state.beat === 1) {
      const eviction = p('pl-allocation-evidence-1-1');
      const read = p('pl-allocation-evidence-1-2');
      text('Virtual address maps to page 7 of model.gguf', 150, 300, 46);
      text('Model file', 210, 436, 40, C.blue);
      text('Host RAM', 1220, 436, 40, C.cyan);
      api.rect(ctx, 210, 480, 430, 166, C.blue, undefined, 9);
      text('Page 7', 425, 590, 61, C.bg, 'center');
      api.rect(ctx, 1220, 480, 430, 166, C.panel, C.muted, 9);
      if (eviction < 1 || read === 1) {
        ctx.save();
        ctx.globalAlpha *= read === 1 ? 1 : 1 - eviction;
        api.rect(ctx, 1220, 480, 430, 166, C.cyan, undefined, 9);
        text('Page 7', 1435, 590, 61, C.bg, 'center');
        ctx.restore();
      } else {
        text('Page absent', 1435, 581, 40, C.muted, 'center');
      }
      if (read > 0) {
        api.line(ctx, 660, 560, 1198, 560, C.muted, 3);
        if (read < 1) api.circle(ctx, 673 + 510 * read, 560, 13, C.blue);
        text('Read from file', 930, 511, 34, C.blue, 'center');
      }
      let status = 'A clean copy is resident in RAM.';
      if (eviction === 1) status = 'The file still holds the bytes.';
      if (read === 1) status = 'Page 7 is resident again.';
      text(status, 210, 753, 40);
      if (p('pl-allocation-evidence-1-3') > 0)
        text('Anonymous pages can use swap when it is enabled.', 210, 869, 35, C.yellow);
      if (p('pl-allocation-evidence-1-4') > 0)
        constructionNote(
          ctx,
          api,
          'Match major faults to file reads, swap activity and changes in resident memory.',
        );
      return;
    }

    const transfer = p('pl-allocation-evidence-2-2');
    text('Slow request   ·   VRAM nearly full   ·   host link busy', 150, 298, 42);
    if (p('pl-allocation-evidence-2-1') > 0)
      text(
        'Occupancy measures space in use. Activity measures how busy memory is.',
        150,
        372,
        33,
        C.muted,
      );
    constructionCell(ctx, api, 'CPU   ·   block 16', 170, 478, 425, 120, C.yellow);
    constructionCell(ctx, api, 'GPU   ·   block 17', 1325, 478, 425, 120, C.cyan);
    api.line(ctx, 612, 538, 1308, 538, C.muted, 3);
    if (transfer > 0) {
      api.circle(ctx, 629 + 662 * transfer, 538, 15, C.green);
      text('Block 16 output', 960, 491, 36, C.green, 'center');
    }
    if (transfer === 1) text('The trace captured an activation transfer.', 170, 756, 44, C.green);
    if (p('pl-allocation-evidence-2-3') > 0)
      text(
        'Other traces can identify cache tensors, migrating pages or repeated work.',
        170,
        894,
        34,
      );
  });
}
export default {
  id: 'allocation-evidence',
  draw: drawAllocationEvidence,
  cues: [
    'pl-allocation-evidence-0-0',
    'pl-allocation-evidence-0-1',
    'pl-allocation-evidence-0-2',
    'pl-allocation-evidence-0-3',
    'pl-allocation-evidence-1-0',
    'pl-allocation-evidence-1-1',
    'pl-allocation-evidence-1-2',
    'pl-allocation-evidence-1-3',
    'pl-allocation-evidence-1-4',
    'pl-allocation-evidence-2-0',
    'pl-allocation-evidence-2-1',
    'pl-allocation-evidence-2-2',
    'pl-allocation-evidence-2-3',
  ],
};
