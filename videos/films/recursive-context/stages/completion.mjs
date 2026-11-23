import { complete } from '../model.mjs';
import { pages } from '../fixtures.mjs';

export function drawCompletion(ctx, scene, state, api) {
  const { C, focus } = api;
  const pageNumber = 6;
  const page = pages[pageNumber - 1];
  const content = page.value + ' [page ' + pageNumber + ']';
  const typed =
    focus.progress('boolean-edit', state.beat === 2 ? api.phase(state.beatP, 0.43, 0.55) : 0) > 0;
  const record = state.beat === 0 ? content : { ready: typed ? true : 'false', content };
  const ready = complete(record);
  const checked =
    focus.progress('typed-result', state.beat === 2 ? api.phase(state.beatP, 0.55, 0.72) : 0) >= 1;
  const rejected =
    focus.progress('reject-string', state.beat === 2 ? api.phase(state.beatP, 0.05, 0.25) : 0) >= 1;

  focus.target('returned-state', () => {
    api.rect(ctx, 105, 270, 880, 473, C.panel, C.blue, 10);
    api.text(
      ctx,
      (state.beat === 0 ? 'Interpreter output' : 'Interpreter variable') + '  ·  ' + page.id,
      151,
      343,
      35,
      C.blue,
    );
    api.line(ctx, 151, 382, 938, 382, C.muted, 2);
    if (typeof record === 'string') {
      api.text(ctx, 'stdout', 151, 473, 35, C.muted, 'left', 'mono');
      api.text(ctx, content, 151, 567, 38, C.ink);
    } else {
      api.text(ctx, 'answer = {', 151, 462, 38, C.ink, 'left', 'mono');
      api.text(
        ctx,
        '  "ready": ' + (typed ? 'True' : '"false"') + ',',
        151,
        531,
        43,
        typed ? C.cyan : C.yellow,
        'left',
        'mono',
      );
      api.text(ctx, '  "content": "' + content + '"', 151, 605, 31, C.ink, 'left', 'mono');
      api.text(ctx, '}', 151, 677, 38, C.ink, 'left', 'mono');
    }
  });
  focus.target('host-test', () => {
    api.text(ctx, 'extract_final(answer)', 1090, 343, 43, C.yellow, 'left', 'mono');
    const rules = ['A dictionary', 'ready is True', 'Nonempty string content'];
    const examined = typeof record === 'string' ? 0 : typed ? (checked ? 3 : 1) : rejected ? 2 : 1;
    rules.forEach((rule, i) => {
      const y = 461 + 92 * i;
      const failed = rejected && !typed && i === 1;
      const color = i >= examined ? C.muted : failed ? C.pink : C.green;
      api.circle(ctx, 1111, y - 13, 13, i >= examined ? C.panel : color, color, 3);
      api.text(ctx, rule, 1160, y, 39, i >= examined ? C.muted : C.ink);
    });
  });
  focus.target('gate-outcome', () => {
    let message = 'A printed observation stays in the working history.';
    if (state.beat >= 1)
      message = rejected
        ? 'ValueError: missing Boolean ready signal'
        : 'Can this record leave the loop?';
    if (typed)
      message =
        ready && checked
          ? 'Accepted candidate  ·  ' + record.content
          : 'Typed record  ·  validation pending';
    api.text(
      ctx,
      message,
      960,
      886,
      42,
      rejected && !typed ? C.pink : checked ? C.green : C.ink,
      'center',
    );
    if (ready && checked && focus.progress('verify-source', api.phase(state.beatP, 0.84, 0.98)) > 0)
      api.text(ctx, 'Next, verify the date on the cited page.', 960, 960, 34, C.blue, 'center');
  });
}
export default {
  id: 'completion',
  draw: drawCompletion,
  cues: ['printed-line', 'reject-string', 'boolean-edit', 'typed-result', 'verify-source'],
};
