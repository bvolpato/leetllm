import { sampleModel } from '../model.mjs';
import { sources } from '../fixtures.mjs';
import { caseClock, casePage } from '../case-file.mjs';

export function drawIsolate(ctx, scene, state, api) {
  const { text, rule, box, focus, C } = casePage(ctx, api);
  const clock = caseClock(scene, state);
  const beat = state.beat ?? 0;
  const trial = Math.max(0, beat - 1);
  const { payload, bytes, known, accepted } = sampleModel('isolate', { ...state, beat: trial });
  const resultCue = ['worker-admit', 'worker-missing', 'worker-mismatch'][trial];
  const decided = clock.done(resultCue);
  const checks = beat === 0 ? clock.progress('worker-search') : 1;
  const transfer = accepted ? clock.progress('worker-copy') : 0;
  text('Worker window', 150, 292, 46);
  text('Lead window', 1185, 292, 46);
  rule(1080, 227, 1080, 876, C.muted, 2);
  focus('worker-search', () => {
    text('Commit history', 150, 385, 30, C.muted);
    // Each mark stands for one of the fifty commits in this fictional search.
    for (let i = 0; i < 50; i++) {
      const x = 150 + (i % 25) * 30;
      const y = 425 + Math.floor(i / 25) * 47;
      box(x, y, 21, 32, i < Math.floor(checks * 50) ? C.blue : C.panel);
    }
    text(Math.floor(checks * 50) + ' of 50 inspected', 150, 564, 32, C.blue);
  });
  focus('worker-return', () => {
    const x = 150 + 1035 * transfer;
    box(x, 648, 550, 174, C.panel, decided ? (accepted ? C.green : C.pink) : C.blue);
    text(beat === 0 ? 'Worker reply' : payload.source, x + 26, 702, 29, C.blue, 'left', 'mono');
    text(beat === 0 ? 'Claim + source ID' : payload.claim, x + 26, 773, 43);
  });
  focus('worker-source', () => {
    text('Source lookup', 1185, 385, 30, C.muted);
    if (beat <= 1 && !clock.started('worker-admit')) {
      text('Awaiting the finding', 1185, 480, 37);
    } else {
      text(payload.source, 1185, 473, 39, C.blue, 'left', 'mono');
      text(
        known ? '/callback   ' + sources[payload.source].status : 'No authorized record',
        1185,
        548,
        37,
      );
    }
  });
  let status =
    beat === 0
      ? 'Maximum reply size     /     200 bytes'
      : bytes + ' / 200 bytes     ·     claim + source';
  if (decided)
    status = accepted
      ? 'Only the checked finding crosses.'
      : known
        ? 'Withhold the finding. The cited request returned ' + sources[payload.source].status + '.'
        : 'Stop at lookup. There is no record to compare.';
  text(status, 150, 968, 38, decided ? (accepted ? C.green : C.pink) : C.muted);
}

export default {
  id: 'isolate',
  draw: drawIsolate,
  cues: ['worker-search', 'worker-admit', 'worker-copy', 'worker-missing', 'worker-mismatch'],
};
