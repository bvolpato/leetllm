import { exampleTexts } from '../fixtures.mjs';
import { exampleDecision } from '../model.mjs';
import { lessonFont } from '../../../lib/fonts.mjs';

function textWidth(ctx, text, size, font = 'sans') {
  ctx.save();
  ctx.font = lessonFont(size, font);
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

function profileCard(ctx, api, { disputed = false } = {}) {
  const { C } = api;
  api.rect(ctx, 140, 404, 685, 345, C.panel, C.blue, 25);
  api.circle(ctx, 212, 471, 33, C.blue);
  api.circle(ctx, 212, 462, 9, C.panel);
  api.rect(ctx, 196, 476, 32, 12, C.panel, undefined, 7);
  api.text(ctx, 'Profile caption', 272, 485, 41, C.ink);
  api.line(ctx, 186, 532, 778, 532, C.muted, 2);
  const [word, ...rest] = exampleTexts[0].split(' ');
  api.text(ctx, disputed ? 'Account ownership' : word, 187, 618, 54, C.ink);
  api.text(ctx, disputed ? 'Two people claim this profile.' : rest.join(' '), 187, 693, 38, C.ink);
}

function classHandout(ctx, api, x, match) {
  const { C } = api;
  const top = 348,
    right = x + 738,
    bottom = 754,
    fold = 77;
  api.path(
    ctx,
    [
      { x, y: top },
      { x: right - fold, y: top },
      { x: right, y: top + fold },
      { x: right, y: bottom },
      { x, y: bottom },
    ],
    { closed: true, fill: C.ink, width: 0 },
  );
  api.path(
    ctx,
    [
      { x: right - fold, y: top },
      { x: right - fold, y: top + fold },
      { x: right, y: top + fold },
    ],
    { closed: true, fill: C.blue, width: 0 },
  );
  const [word, noun, ...rest] = exampleTexts[1].split(' ');
  api.text(ctx, 'CLASS HANDOUT', x + 60, 430, 33, C.panel);
  api.line(ctx, x + 60, 463, right - 104, 463, C.muted, 3);
  api.text(ctx, word + ' ' + noun, x + 60, 560, 67, C.bg, 'left', 'serif');
  if (match > 0)
    api.line(ctx, x + 61, 574, x + 61 + match * textWidth(ctx, word, 67, 'serif'), 574, C.blue, 8);
  api.text(ctx, rest.join(' '), x + 60, 643, 42, C.bg);
  api.line(ctx, x + 60, 700, right - 290, 700, C.muted, 3);
}

export function drawIntro(ctx, scene, state, api) {
  const { C, focus } = api;
  const done = (id) => focus.progress(id) === 1;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  if (state.beat === 2) {
    focus.target('profile', () => profileCard(ctx, api, { disputed: true }));
    focus.target('decision', () => {
      api.text(ctx, 'Who controls this account?', 950, 490, 53, C.ink);
      if (done('intro-ownership')) api.text(ctx, 'Keyword matches    0', 953, 580, 38, C.muted);
      if (done('intro-review')) {
        api.arrow(ctx, 855, 665, 932, 665, C.yellow);
        api.text(ctx, 'Hold for ownership review', 953, 682, 47, C.yellow);
      }
    });
    return;
  }
  const draft = state.beat > 0 ? 1 : focus.progress('intro-draft');
  const activeKnown = state.beat > 0 || done('intro-specific');
  const tested = done('intro-change');
  const slide = 124 * (1 - Math.min(1, state.t / 1.25)) ** 2;
  focus.target('rule', () => {
    api.text(ctx, draft > 0 ? 'Proposed filter' : 'Current filter', 143, 272, 37, C.muted);
    const x = 552;
    const [word, ...rest] = exampleTexts[0].split(' ');
    const wordWidth = textWidth(ctx, word, 55);
    const fullWidth = textWidth(ctx, exampleTexts[0], 55);
    api.text(ctx, word, x, 276, 55, C.yellow);
    if (draft < 1)
      api.text(
        ctx,
        rest.join(' '),
        x + textWidth(ctx, word + ' ', 55),
        276,
        55,
        draft > 0 ? C.muted : C.yellow,
      );
    api.line(ctx, x, 301, x + wordWidth + (fullWidth - wordWidth) * (1 - draft), 301, C.yellow, 7);
  });
  focus.target('profile', () => {
    profileCard(ctx, api);
    if (activeKnown) {
      api.line(ctx, 187, 630, 328, 630, C.yellow, 5);
      if (draft < 1) api.line(ctx, 187, 706, 187 + 390 * (1 - draft), 706, C.yellow, 5);
    }
  });
  focus.target('tutorial', () => {
    ctx.save();
    ctx.translate(0, slide);
    classHandout(ctx, api, 968, draft);
    ctx.restore();
    for (const [tip, start] of [
      [960, 927],
      [1714, 1747],
    ]) {
      api.path(
        ctx,
        [
          { x: start, y: 517 },
          { x: tip, y: 541 },
          { x: start, y: 565 },
        ],
        { closed: true, width: 0, fill: C.cyan },
      );
    }
  });
  focus.target('decision', () => {
    if (!activeKnown) {
      api.text(ctx, 'Could one word hide the class handout?', 140, 925, 48, C.ink);
      return;
    }
    for (const [i, body] of exampleTexts.entries()) {
      const x = i ? 968 : 140;
      const active = exampleDecision(body);
      const proposed = tested ? exampleDecision(body, true) : '?';
      api.text(ctx, 'Current   ' + active, x, 834, 38, C.ink);
      if (draft > 0)
        api.text(
          ctx,
          'Draft   ' + proposed,
          x + 356,
          834,
          38,
          tested && proposed !== active ? C.pink : C.yellow,
        );
    }
    if (draft > 0)
      api.text(
        ctx,
        tested ? 'The draft hides the handout.' : 'Which decision changes?',
        140,
        943,
        48,
        tested ? C.pink : C.ink,
      );
  });
}
export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-profile',
    'intro-tutorial',
    'intro-specific',
    'intro-draft',
    'intro-question',
    'intro-change',
    'intro-context',
    'intro-ownership',
    'intro-review',
  ],
};
