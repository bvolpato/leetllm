import { documents } from '../fixtures.mjs';
import { cueProgress } from '../defaults.mjs';

const pages = ['private-draft', 'retry-runbook'].map((id) =>
  documents.find((page) => page.id === id),
);

function drawPage(ctx, api, page, title, x, y) {
  const { C } = api;
  const color = page.id === 'private-draft' ? C.ink : C.blue;
  const width = 480,
    height = 166,
    fold = 38;
  const corner = x + width - fold;
  api.path(
    ctx,
    [
      { x, y },
      { x: corner, y },
      { x: x + width, y: y + fold },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ],
    { closed: true, fill: color, width: 0 },
  );
  api.path(
    ctx,
    [
      { x: corner, y },
      { x: corner, y: y + fold },
      { x: x + width, y: y + fold },
    ],
    { color: C.bg, width: 4 },
  );
  api.text(ctx, title, x + 28, y + 57, 43, C.bg);
  api.text(ctx, page.retrieval.toFixed(2), x + 26, y + 140, 73, C.bg);
  api.text(ctx, 'match score', x + 210, y + 135, 30, C.bg);
}

export function paintIntro(ctx, scene, state, api) {
  const { C } = api;
  const t = state.t ?? 0;
  if (t < 0.35) ctx.globalAlpha = 1;
  const progress = (id, beat, start, end) => cueProgress(state, api, id, beat, start, end);
  const arrive = api.phase(t + 0.22, 0, 1.8);
  const access = progress('intro-access', 1, 0.02, 0.55);
  const admit = progress('intro-admit', 2, 0.02, 0.34);
  const lift = api.phase(admit, 0, 0.27);
  const travel = api.phase(admit, 0.27, 1);
  const question = progress('intro-question', 1, 0.6, 0.95) > 0;

  api.text(ctx, 'Which page can this developer open?', 124, 291, 58, C.ink);
  api.focus.target('intro-result', () => {
    api.rect(ctx, 1240, 393, 565, 481, C.panel, question && !travel ? C.yellow : C.muted, 18);
    api.text(ctx, 'Developer’s results', 1281, 474, 40, C.ink);
    api.line(ctx, 1242, 512, 1803, 512, C.muted, 2);
    if (travel === 0) api.text(ctx, '?', 1522, 726, 108, C.yellow, 'center');
  });

  api.focus.target('intro-access-checks', () => {
    api.text(ctx, 'Access check', 1000, 364, 37, C.ink, 'center');
    for (const [i, page] of pages.entries()) {
      const y = 407 + 265 * i;
      const allowed = page.current && page.permitted;
      const checked = access > 0;
      const color = checked ? (allowed ? C.green : C.red) : C.muted;
      const open = allowed ? lift : 0;
      // The lower rail clears the runbook before the page crosses.
      api.line(ctx, 1000, y - 24, 1000, api.lerp(y + 165, y - 23, open), color, 9);
      api.circle(ctx, 1000, y - 24, 10, color);
      if (checked)
        api.text(ctx, allowed ? 'Allowed' : 'Restricted', 1000, y + 219, 32, color, 'center');
    }
  });

  for (const [i, page] of pages.entries()) {
    const allowed = page.current && page.permitted;
    const pass = allowed ? travel : 0;
    const waitingX = api.lerp(i === 0 ? 220 : 120, 495, arrive);
    const x = api.lerp(waitingX, 1282, pass);
    const y = api.lerp(407 + i * 265, 599, api.phase(pass, 0.66, 1));
    api.focus.target(i === 0 ? 'intro-draft-page' : 'intro-runbook-page', () =>
      drawPage(ctx, api, page, i === 0 ? 'Incident draft' : 'Retry runbook', x, y),
    );
  }
}

export default {
  id: 'intro',
  draw: paintIntro,
  cues: ['intro-draft', 'intro-runbook', 'intro-access', 'intro-question', 'intro-admit'],
};
