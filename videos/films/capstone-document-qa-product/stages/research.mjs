import { reportSources } from '../report-fixture.mjs';

export function drawResearch(ctx, scene, state, api) {
  const { C, focus } = api;
  const p = (id) => focus.progress(id, 0);
  const sources = [reportSources.us, reportSources.eu];
  sources.forEach((source, i) => {
    const x = 112 + i * 870;
    focus.target('regional-sources', () => {
      api.text(ctx, i ? 'EU policy' : 'US policy', x, 300, 53, C.ink, 'left', 'serif');
      api.line(ctx, x, 367, x + 778, 367, C.blue, 4);
      api.text(ctx, source.id, x, 438, 36, C.blue, 'left', 'mono');
      const [first, second] = source.text.replace('. ', '.\n').split('\n');
      const passage = first.replace(' for access', ' for\naccess');
      const shared = p('research-shared') === 1;
      api.text(ctx, passage, x, 524, 37, shared ? C.green : C.ink, 'left', 'serif');
      if (second) {
        const managerRule = second.replace(' before privileged', ' before\nprivileged');
        api.text(
          ctx,
          managerRule,
          x,
          669,
          37,
          p('research-manager') === 1 ? C.blue : C.ink,
          'left',
          'serif',
        );
      }
      if (i && p('research-silence') === 1)
        api.text(ctx, 'This passage leaves manager approval open.', x, 669, 32, C.yellow);
    });
  });
  focus.target('report-task', () => {
    api.text(
      ctx,
      p('research-record') > 0 ? 'Research job' : 'Report question',
      112,
      874,
      29,
      C.muted,
    );
    let text = 'Which requirement can the report attribute to both policies?';
    if (p('research-shared') === 1) text = 'Both policies require identity verification.';
    if (p('research-record') > 0)
      text = 'Retain the plan, applicable source versions and open questions.';
    api.text(ctx, text, 112, 954, 43, C.ink);
  });
}

export default {
  id: 'research',
  draw: drawResearch,
  cues: [
    'research-identity',
    'research-shared',
    'research-record',
    'research-manager',
    'research-silence',
  ],
};
